const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OWNER = "xinetzone";
const REPO = "dao-yan";
const BRANCH = "main";

async function gh(path: string, token: string, method = "GET", body?: unknown) {
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GH ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const token = Deno.env.get("GITHUB_PAT");
    if (!token) return new Response(JSON.stringify({ error: "No PAT" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });

    const body = await req.json();
    const action = body.action as string;

    if (action === "create_blobs") {
      const results: Array<{ path: string; sha: string; mode: string }> = [];
      for (const f of body.files as Array<{ path: string; content_base64: string; mode?: string }>) {
        const blob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, token, "POST", { content: f.content_base64, encoding: "base64" });
        results.push({ path: f.path, sha: blob.sha, mode: f.mode || "100644" });
      }
      return new Response(JSON.stringify({ blobs: results }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (action === "create_commit") {
      const entries = body.blob_entries as Array<{ path: string; sha: string; mode: string }>;
      const tree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, token, "POST", {
        tree: entries.map(e => ({ path: e.path, mode: e.mode, type: "blob", sha: e.sha })),
      });
      const commitBody: Record<string, unknown> = { message: body.commit_message || "sync", tree: tree.sha };
      if (body.parent_sha) commitBody.parents = [body.parent_sha];
      const commit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, token, "POST", commitBody);
      try {
        await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, token, "PATCH", { sha: commit.sha, force: true });
      } catch {
        await gh(`/repos/${OWNER}/${REPO}/git/refs`, token, "POST", { ref: `refs/heads/${BRANCH}`, sha: commit.sha });
      }
      return new Response(JSON.stringify({ commit_sha: commit.sha }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (action === "create_tag") {
      const ref = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`, token);
      const tag = await gh(`/repos/${OWNER}/${REPO}/git/tags`, token, "POST", {
        tag: body.tag_name, message: body.tag_message || body.tag_name,
        object: ref.object.sha, type: "commit",
        tagger: { name: "dao-yan", email: "dao-yan@enter.pro", date: new Date().toISOString() },
      });
      await gh(`/repos/${OWNER}/${REPO}/git/refs`, token, "POST", { ref: `refs/tags/${body.tag_name}`, sha: tag.sha });
      return new Response(JSON.stringify({ tag_sha: tag.sha }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
