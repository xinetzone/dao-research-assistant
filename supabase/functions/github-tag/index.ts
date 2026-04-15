Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" } });
  }
  const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
  if (!GITHUB_TOKEN) return new Response(JSON.stringify({ error: "no token" }), { status: 500 });

  const { owner, repo, tags } = await req.json();
  // tags: Array<{ name: string, sha: string, message: string }>
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "dao-yan-tag/1.0",
  };
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const results = [];

  for (const tag of tags) {
    try {
      // Create annotated tag object
      const tagObjRes = await fetch(`${base}/git/tags`, {
        method: "POST", headers,
        body: JSON.stringify({ tag: tag.name, message: tag.message, object: tag.sha, type: "commit" }),
      });
      const tagObj = await tagObjRes.json();
      if (!tagObjRes.ok) { results.push({ tag: tag.name, error: tagObj.message }); continue; }

      // Create ref pointing to tag object
      const refRes = await fetch(`${base}/git/refs`, {
        method: "POST", headers,
        body: JSON.stringify({ ref: `refs/tags/${tag.name}`, sha: tagObj.sha }),
      });
      const refData = await refRes.json();
      if (!refRes.ok) {
        // If already exists, force update
        const upRes = await fetch(`${base}/git/refs/tags/${tag.name}`, {
          method: "PATCH", headers,
          body: JSON.stringify({ sha: tagObj.sha, force: true }),
        });
        results.push({ tag: tag.name, status: upRes.ok ? "updated" : "error", sha: tagObj.sha });
      } else {
        results.push({ tag: tag.name, status: "created", sha: tagObj.sha });
      }
    } catch (e) {
      results.push({ tag: tag.name, error: String(e) });
    }
  }
  return new Response(JSON.stringify({ results }), {
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }
  });
});
