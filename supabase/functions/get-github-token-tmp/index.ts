// Permanently retired — use push-with-token.sh for GitHub pushes
Deno.serve(() => new Response(JSON.stringify({ error: "retired" }), { status: 410 }));
