Deno.serve(async (req) => {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  
  const token = Deno.env.get("GITHUB_PAT") || "";
  // Only show first 8 and last 4 chars for security
  const masked = token.length > 12 
    ? `${token.slice(0, 8)}...${token.slice(-4)} (len=${token.length})`
    : `(too short, len=${token.length})`;
  
  // Also test the token against GitHub
  let ghStatus = "not tested";
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    const body = await res.text();
    ghStatus = `${res.status}: ${body.slice(0, 200)}`;
  } catch (e) {
    ghStatus = `error: ${(e as Error).message}`;
  }
  
  return new Response(JSON.stringify({ masked_token: masked, github_test: ghStatus }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
