#!/usr/bin/env python3
import io
import json
import mimetypes
import os
import re
import unicodedata
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError
import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

ROOT_FOLDER_ID = os.getenv("GDRIVE_ROOT_FOLDER_ID", "1hAkXLwRktZ-bUWhboiGbg8KIlQqmKVEu")
R2_BUCKET = os.getenv("R2_BUCKET", "5th-edge-assets")
ASSET_BASE_URL = os.getenv("ASSET_BASE_URL", "https://assets.5thedgettrpg.com").rstrip("/")
CACHE_CONTROL = os.getenv("R2_CACHE_CONTROL", "public, max-age=3600")
DELETE_STALE = os.getenv("DELETE_STALE", "false").lower() == "true"

TOP_LEVEL_MAP = {
    "Banners and Logos": "banners-and-logos",
    "Class Images": "class-images",
    "Icons": "icons",
    "Monster Images": "monster-images",
    "Race Images": "race-images",
    "Side Art": "side-art",
}

GOOGLE_NATIVE_EXPORTS = {
    "application/vnd.google-apps.document": ("application/pdf", ".pdf"),
    "application/vnd.google-apps.spreadsheet": (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".xlsx",
    ),
    "application/vnd.google-apps.presentation": ("application/pdf", ".pdf"),
}

ALLOWED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"
}


def required_env(name):
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def slugify_segment(value):
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ascii", "ignore").decode("ascii")
    value = value.lower().strip()
    value = value.replace("&", " and ")
    value = value.replace("'", "")
    value = re.sub(r"[^a-z0-9._-]+", "-", value)
    value = re.sub(r"-{2,}", "-", value)
    return value.strip("-._") or "asset"


def normalized_file_name(name):
    stem, ext = os.path.splitext(name)
    return f"{slugify_segment(stem)}{ext.lower()}"


def drive_service():
    creds, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/drive.readonly"]
    )
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def r2_client():
    account_id = required_env("R2_ACCOUNT_ID")
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=required_env("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=required_env("R2_SECRET_ACCESS_KEY"),
        region_name="auto",
    )


def list_children(drive, folder_id):
    out = []
    token = None
    while True:
        response = drive.files().list(
            q=f"'{folder_id}' in parents and trashed = false",
            fields="nextPageToken, files(id,name,mimeType,modifiedTime,md5Checksum,size)",
            pageSize=1000,
            pageToken=token,
            orderBy="name",
            supportsAllDrives=True,
            includeItemsFromAllDrives=True,
        ).execute()
        out.extend(response.get("files", []))
        token = response.get("nextPageToken")
        if not token:
            return out


def download_drive_file(drive, item):
    mime = item["mimeType"]
    if mime in GOOGLE_NATIVE_EXPORTS:
        export_mime, extension = GOOGLE_NATIVE_EXPORTS[mime]
        request = drive.files().export_media(fileId=item["id"], mimeType=export_mime)
        output_name = normalized_file_name(item["name"]) + extension
        content_type = export_mime
    else:
        request = drive.files().get_media(fileId=item["id"], supportsAllDrives=True)
        output_name = normalized_file_name(item["name"])
        content_type = mimetypes.guess_type(output_name)[0] or "application/octet-stream"

    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request, chunksize=8 * 1024 * 1024)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    fh.seek(0)
    return output_name, content_type, fh.read()


def object_is_current(s3, key, item):
    try:
        head = s3.head_object(Bucket=R2_BUCKET, Key=key)
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") in {"404", "NoSuchKey", "NotFound"}:
            return False
        raise
    meta = head.get("Metadata", {})
    return (
        meta.get("gdrive-file-id") == item["id"]
        and meta.get("gdrive-modified-time") == item.get("modifiedTime", "")
    )


def upload_object(s3, key, data, content_type, item):
    s3.put_object(
        Bucket=R2_BUCKET,
        Key=key,
        Body=data,
        ContentType=content_type,
        CacheControl=CACHE_CONTROL,
        Metadata={
            "managed-by": "gdrive-sync",
            "gdrive-file-id": item["id"],
            "gdrive-modified-time": item.get("modifiedTime", ""),
        },
    )


def walk(drive, s3, folder_id, path_parts, desired, manifest):
    for item in list_children(drive, folder_id):
        if item["mimeType"] == "application/vnd.google-apps.folder":
            if not path_parts and item["name"] in TOP_LEVEL_MAP:
                segment = TOP_LEVEL_MAP[item["name"]]
            else:
                segment = slugify_segment(item["name"])
            walk(drive, s3, item["id"], path_parts + [segment], desired, manifest)
            continue

        original_ext = os.path.splitext(item["name"])[1].lower()
        is_native = item["mimeType"] in GOOGLE_NATIVE_EXPORTS
        if not is_native and original_ext not in ALLOWED_EXTENSIONS:
            print(f"skip unsupported: {item['name']}")
            continue

        output_name = normalized_file_name(item["name"])
        if is_native:
            output_name += GOOGLE_NATIVE_EXPORTS[item["mimeType"]][1]

        key = "/".join(path_parts + [output_name])
        desired.add(key)
        url = f"{ASSET_BASE_URL}/{key}"

        if object_is_current(s3, key, item):
            print(f"unchanged: {key}")
        else:
            output_name, content_type, data = download_drive_file(drive, item)
            key = "/".join(path_parts + [output_name])
            desired.add(key)
            url = f"{ASSET_BASE_URL}/{key}"
            upload_object(s3, key, data, content_type, item)
            print(f"uploaded: {key}")

        manifest.append({
            "driveFileId": item["id"],
            "driveName": item["name"],
            "key": key,
            "url": url,
            "modifiedTime": item.get("modifiedTime"),
        })


def list_managed_objects(s3):
    token = None
    while True:
        kwargs = {"Bucket": R2_BUCKET, "MaxKeys": 1000}
        if token:
            kwargs["ContinuationToken"] = token
        response = s3.list_objects_v2(**kwargs)
        for obj in response.get("Contents", []):
            key = obj["Key"]
            try:
                head = s3.head_object(Bucket=R2_BUCKET, Key=key)
            except ClientError:
                continue
            if head.get("Metadata", {}).get("managed-by") == "gdrive-sync":
                yield key
        if not response.get("IsTruncated"):
            break
        token = response.get("NextContinuationToken")


def main():
    drive = drive_service()
    s3 = r2_client()
    desired = set()
    manifest = []

    walk(drive, s3, ROOT_FOLDER_ID, [], desired, manifest)

    if DELETE_STALE:
        for key in list(list_managed_objects(s3)):
            if key not in desired and key != "_sync/drive-manifest.json":
                s3.delete_object(Bucket=R2_BUCKET, Key=key)
                print(f"deleted stale: {key}")

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceDriveFolderId": ROOT_FOLDER_ID,
        "bucket": R2_BUCKET,
        "assetBaseUrl": ASSET_BASE_URL,
        "assets": sorted(manifest, key=lambda x: x["key"]),
    }
    s3.put_object(
        Bucket=R2_BUCKET,
        Key="_sync/drive-manifest.json",
        Body=json.dumps(payload, indent=2).encode("utf-8"),
        ContentType="application/json",
        CacheControl="no-cache",
        Metadata={"managed-by": "gdrive-sync"},
    )
    print(f"done: {len(manifest)} assets")


if __name__ == "__main__":
    main()
