\
import Stripe from "stripe";
import { mintToken } from "./_auth.mjs";

export const handler = async (event) => {
  const sessionId = event.queryStringParameters?.session_id || "";
  if (!sessionId) return json(400, { error:"Missing session_id" });

  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  const authSecret = process.env.AUTH_SECRET || "";
  if (!secretKey || !authSecret) return json(500, { error:"Server misconfigured" });

  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });

  try{
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand:["subscription"] });
    const ok = session?.payment_status === "paid" || session?.status === "complete";
    if (!ok) return json(403, { error:"Payment not completed" });

    const token = mintToken({ premium:true, plan:"monthly", sub: session.subscription?.id || "sub" }, { secret: authSecret, ttlSeconds: 60*60*24*31 });
    return json(200, { ok:true, token });
  }catch(e){
    return json(500, { error:e.message });
  }
};

function json(statusCode, obj){
  return { statusCode, headers:{ "content-type":"application/json", "cache-control":"no-store" }, body: JSON.stringify(obj) };
}
