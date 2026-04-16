Deno.serve(async () => {
  return new Response(JSON.stringify({ error: "retired" }), {
    status: 410,
    headers: { "Content-Type": "application/json" },
  });
});
