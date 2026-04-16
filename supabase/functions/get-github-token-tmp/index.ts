// This function has been retired and no longer returns any token.
Deno.serve(() => new Response(JSON.stringify({ error: "retired" }), { status: 410 }));
