\
import Stripe from "stripe";

export const handler = async (event) => {
  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  const priceId = process.env.STRIPE_PRICE_ID_MONTHLY || "";
  if (!secretKey || !priceId) {
    return { statusCode: 500, headers:{ "content-type":"application/json" }, body: JSON.stringify({ error:"Stripe env missing" }) };
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });

  const origin = event.headers?.origin || event.headers?.Origin || process.env.SITE_URL || "https://example.com";
  const success_url = `${origin}/?session_id={CHECKOUT_SESSION_ID}`;
  const cancel_url = `${origin}/#pricing`;

  try{
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url,
      cancel_url,
      allow_promotion_codes: true,
      customer_creation: "always",
    });

    return { statusCode: 200, headers:{ "content-type":"application/json" }, body: JSON.stringify({ url: session.url }) };
  }catch(e){
    return { statusCode: 500, headers:{ "content-type":"application/json" }, body: JSON.stringify({ error: e.message }) };
  }
};
