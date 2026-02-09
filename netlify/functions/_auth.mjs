\
import crypto from "node:crypto";

function b64url(buf){
  return Buffer.from(buf).toString("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
}
function b64urlJson(obj){
  return b64url(Buffer.from(JSON.stringify(obj)));
}
function sign(data, secret){
  return b64url(crypto.createHmac("sha256", secret).update(data).digest());
}

export function mintToken(payload, { secret, ttlSeconds = 60*60*24*31 }){
  const now = Math.floor(Date.now()/1000);
  const header = { alg:"HS256", typ:"JWT" };
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const part1 = b64urlJson(header);
  const part2 = b64urlJson(body);
  const msg = `${part1}.${part2}`;
  const sig = sign(msg, secret);
  return `${msg}.${sig}`;
}

export function verifyToken(token, secret){
  if (!token || typeof token !== "string") return { ok:false, error:"missing token" };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok:false, error:"bad token" };
  const [p1,p2,sig] = parts;
  const msg = `${p1}.${p2}`;
  const expected = sign(msg, secret);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return { ok:false, error:"bad signature" };
  const json = JSON.parse(Buffer.from(p2.replace(/-/g,"+").replace(/_/g,"/"), "base64").toString("utf8"));
  const now = Math.floor(Date.now()/1000);
  if (json.exp && now > json.exp) return { ok:false, error:"expired" };
  return { ok:true, payload: json };
}

export function readBearer(event){
  const h = event.headers || {};
  const raw = h.authorization || h.Authorization || "";
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}
