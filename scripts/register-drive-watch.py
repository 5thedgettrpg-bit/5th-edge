#!/usr/bin/env python3
import json
import os
import time
import uuid
from datetime import datetime, timezone

import boto3
import google.auth
from botocore.exceptions import ClientError
from googleapiclient.discovery import build

R2_BUCKET = os.getenv("R2_BUCKET", "5th-edge-assets")
WATCH_STATE_KEY = "_sync/drive-watch.json"
WEBHOOK_URL = os.getenv(
    "GDRIVE_WEBHOOK_URL",
    "https://5th-edge-drive-webhook.5thedgettrpg.workers.dev/google-drive",
)


def required_env(name):
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


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


def load_previous_watch(s3):
    try:
        response = s3.get_object(Bucket=R2_BUCKET, Key=WATCH_STATE_KEY)
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code")
        if code in {"NoSuchKey", "404", "NotFound"}:
            return None
        raise
    return json.loads(response["Body"].read().decode("utf-8"))


def stop_previous_watch(drive, state):
    if not state:
        return
    channel_id = state.get("channelId")
    resource_id = state.get("resourceId")
    if not channel_id or not resource_id:
        return

    try:
        drive.channels().stop(
            body={"id": channel_id, "resourceId": resource_id}
        ).execute()
        print(f"stopped previous channel: {channel_id}")
    except Exception as exc:
        # A previously expired channel may already be gone. Renewal can continue.
        print(f"previous channel stop skipped: {exc}")


def save_watch_state(s3, response, page_token):
    state = {
        "channelId": response.get("id"),
        "resourceId": response.get("resourceId"),
        "resourceUri": response.get("resourceUri"),
        "expiration": response.get("expiration"),
        "pageToken": page_token,
        "webhookUrl": WEBHOOK_URL,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    s3.put_object(
        Bucket=R2_BUCKET,
        Key=WATCH_STATE_KEY,
        Body=json.dumps(state, indent=2).encode("utf-8"),
        ContentType="application/json",
        CacheControl="no-store",
        Metadata={"managed-by": "gdrive-watch"},
    )
    return state


def main():
    drive = drive_service()
    s3 = r2_client()
    channel_token = required_env("GDRIVE_CHANNEL_TOKEN")

    previous = load_previous_watch(s3)
    stop_previous_watch(drive, previous)

    page_token = drive.changes().getStartPageToken(
        supportsAllDrives=True
    ).execute()["startPageToken"]

    channel_id = str(uuid.uuid4())

    # Google Drive change notification channels expire. Renew well before the
    # maximum lifetime so the webhook remains continuously active.
    expiration_ms = int((time.time() + 6 * 24 * 60 * 60) * 1000)

    response = drive.changes().watch(
        pageToken=page_token,
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
        body={
            "id": channel_id,
            "type": "web_hook",
            "address": WEBHOOK_URL,
            "token": channel_token,
            "expiration": str(expiration_ms),
        },
    ).execute()

    state = save_watch_state(s3, response, page_token)
    print("Drive watch registered")
    print(f"channel: {state['channelId']}")
    print(f"resource: {state['resourceId']}")
    print(f"expiration: {state['expiration']}")
    print(f"webhook: {WEBHOOK_URL}")


if __name__ == "__main__":
    main()
