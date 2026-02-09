\
export const handler = async () => {
  const missing = [];
  const need = ["GEMINI_API_KEY","STRIPE_SECRET_KEY","STRIPE_PRICE_ID_MONTHLY","AUTH_SECRET"];
  for (const k of need){
    if (!process.env[k]) missing.push(k);
  }
  return {
    statusCode: missing.length ? 500 : 200,
    headers: { "content-type":"application/json", "cache-control":"no-store" },
    body: JSON.stringify({
      ok: missing.length === 0,
      missing,
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash"
    })
  };
};
