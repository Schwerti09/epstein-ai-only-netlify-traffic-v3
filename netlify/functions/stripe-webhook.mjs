\
import Stripe from "stripe";

export const handler = async (event) => {
  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!secretKey || !webhookSecret) return { statusCode: 200, body: "Webhook not configured" };

  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });
  const sig = event.headers["stripe-signature"];
  let ev;

  try{
    ev = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  }catch(e){
    return { statusCode: 400, body: `Webhook Error: ${e.message}` };
  }

  // You can extend: cancellations, renewals, etc.
  return { statusCode: 200, body: "ok" };
};
