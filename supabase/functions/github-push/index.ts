const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
  if (!GITHUB_TOKEN) {
    return new Response(JSON.stringify({ error: "GITHUB_TOKEN not set" }), {
      status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }

  const { owner, repo, branch, message, files } = await req.json();
  // files: Array<{ path: string, content: string, encoding: "base64" | "utf-8" }>

  const ghBase = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "dao-yan-push/1.0",
  };

  try {
    // 1. Get current HEAD SHA
    const refRes = await fetch(`${ghBase}/git/refs/heads/${branch}`, { headers });
    if (!refRes.ok) {
      const body = await refRes.text();
      return new Response(JSON.stringify({ error: `get ref failed: ${body}` }), {
        status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }
    const refData = await refRes.json();
    const baseSha = refData.object.sha;
    console.log(`Base SHA: ${baseSha}`);

    // 2. Get base tree SHA
    const commitRes = await fetch(`${ghBase}/git/commits/${baseSha}`, { headers });
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;
    console.log(`Base tree SHA: ${baseTreeSha}`);

    // 3. Create blobs in parallel (batch of 10 to avoid rate limits)
    const batchSize = 10;
    const treeItems: { path: string; mode: string; type: string; sha: string }[] = [];

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const blobResults = await Promise.all(batch.map(async (file: { path: string; content: string; encoding: string }) => {
        const blobRes = await fetch(`${ghBase}/git/blobs`, {
          method: "POST",
          headers,
          body: JSON.stringify({ content: file.content, encoding: file.encoding || "utf-8" }),
        });
        if (!blobRes.ok) {
          const errBody = await blobRes.text();
          throw new Error(`blob create failed for ${file.path}: ${errBody}`);
        }
        const blob = await blobRes.json();
        return { path: file.path, mode: "100644", type: "blob", sha: blob.sha };
      }));
      treeItems.push(...blobResults);
      console.log(`Processed ${Math.min(i + batchSize, files.length)}/${files.length} files`);
    }

    // 4. Create tree
    const treeRes = await fetch(`${ghBase}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });
    if (!treeRes.ok) {
      const body = await treeRes.text();
      return new Response(JSON.stringify({ error: `create tree failed: ${body}` }), {
        status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }
    const treeData = await treeRes.json();
    console.log(`New tree SHA: ${treeData.sha}`);

    // 5. Create commit
    const newCommitRes = await fetch(`${ghBase}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message, tree: treeData.sha, parents: [baseSha] }),
    });
    const newCommit = await newCommitRes.json();
    console.log(`New commit SHA: ${newCommit.sha}`);

    // 6. Update ref (force)
    const updateRes = await fetch(`${ghBase}/git/refs/heads/${branch}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: newCommit.sha, force: true }),
    });
    if (!updateRes.ok) {
      const body = await updateRes.text();
      return new Response(JSON.stringify({ error: `update ref failed: ${body}` }), {
        status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    console.log(`Successfully pushed ${files.length} files to ${owner}/${repo}:${branch}`);
    return new Response(JSON.stringify({
      success: true,
      commitSha: newCommit.sha,
      filesCount: files.length,
    }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Push error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }
});
