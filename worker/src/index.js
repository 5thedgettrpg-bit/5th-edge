const OWNER = "5thedgettrpg-bit";
const REPO = "5th-edge";
const WORKFLOW = "sync-drive-art-to-r2.yml";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "5th-edge-drive-webhook" });
    }

    if (request.method !== "POST" || url.pathname !== "/google-drive") {
      return new Response("Not found", { status: 404 });
    }

    const channelToken = request.headers.get("x-goog-channel-token");
    if (!env.GDRIVE_CHANNEL_TOKEN || channelToken !== env.GDRIVE_CHANNEL_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!env.GITHUB_TOKEN) {
      return new Response("Missing GitHub token", { status: 503 });
    }

    const resourceState = request.headers.get("x-goog-resource-state") || "unknown";

    // Google sends an initial sync notification when a channel is created.
    // It is safe to ignore that one and trigger only actual Drive changes.
    if (resourceState === "sync") {
      return json({ ok: true, ignored: "initial-sync" });
    }

    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
      {
        method: "POST",
        headers: {
          "Accept": "application/vnd.github+json",
          "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "5th-edge-drive-webhook"
        },
        body: JSON.stringify({ ref: "main" })
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error("GitHub dispatch failed", response.status, detail);
      return new Response("GitHub dispatch failed", { status: 502 });
    }

    return json({ ok: true, triggered: true, resourceState });
  }
};

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
