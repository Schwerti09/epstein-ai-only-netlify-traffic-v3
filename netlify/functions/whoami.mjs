\
import { readBearer, verifyToken } from "./_auth.mjs";

export const handler = async (event) => {
  const secret = process.env.AUTH_SECRET || "";
  const token = readBearer(event);
  if (!token) {
    return { statusCode: 200, headers:{ "content-type":"application/json" }, body: JSON.stringify({ premium:false }) };
  }
  const v = verifyToken(token, secret);
  if (!v.ok){
    return { statusCode: 200, headers:{ "content-type":"application/json" }, body: JSON.stringify({ premium:false }) };
  }
  return { statusCode: 200, headers:{ "content-type":"application/json" }, body: JSON.stringify({ premium: !!v.payload?.premium, exp: v.payload?.exp }) };
};
