\
import { XMLParser } from "fast-xml-parser";
import { readBearer, verifyToken } from "./_auth.mjs";
import { geminiSummarize } from "./_gemini.mjs";

function stripHtml(s=""){ return String(s).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim(); }
function domainOf(u){ try{ return new URL(u).hostname.replace(/^www\./,""); }catch{ return ""; } }
function toDate(s){ try{ return new Date(s).toISOString().slice(0,10); }catch{ return ""; } }

function teaserFromSummary(summary){
  const s = String(summary||"").trim();
  if (s.length <= 260) return s;
  return s.slice(0, 240).trimEnd() + " …";
}

export const handler = async (event) => {
  const q = (event.queryStringParameters?.q || "").trim();
  if (!q) return json(400, { error:"Missing q" });

  const secret = process.env.AUTH_SECRET || "";
  const token = readBearer(event);
  const v = token ? verifyToken(token, secret) : { ok:false };
  const premium = !!v.ok && !!v.payload?.premium;

  // Fetch Google News RSS (no extra keys)
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(rssUrl, { headers:{ "user-agent":"Mozilla/5.0" }});
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes:false });
  const doc = parser.parse(xml);
  const raw = doc?.rss?.channel?.item || [];
  const arr = Array.isArray(raw) ? raw : [raw];

  const items = arr.slice(0, premium ? 25 : 5).map(it => ({
    title: stripHtml(it?.title || ""),
    link: it?.link || "",
    date: toDate(it?.pubDate || it?.published || ""),
    domain: domainOf(it?.link || ""),
    snippet: stripHtml(it?.description || it?.content || ""),
  })).filter(x => x.link && x.title);

  // Gemini summarize
  const apiKey = process.env.GEMINI_API_KEY || "";
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  if (!apiKey) return json(500, { error:"GEMINI_API_KEY missing" });

  let summary = "";
  let what_to_read_next = [];
  let caveats = [];
  try{
    const out = await geminiSummarize({ apiKey, model, query:q, items, premium });
    summary = out.summary || "";
    what_to_read_next = out.what_to_read_next || [];
    caveats = out.caveats || [];
  }catch(e){
    summary = "KI‑Zusammenfassung aktuell nicht verfügbar. Bitte später erneut versuchen.";
  }

  const payload = {
    query: q,
    premium,
    summary: premium ? summary : teaserFromSummary(summary),
    teaser: teaserFromSummary(summary),
    what_to_read_next: premium ? what_to_read_next : [],
    caveats: premium ? caveats : [],
    items
  };

  return json(200, payload, {
    // Edge caching: safe-ish because premium controls payload
    "cache-control": "public, max-age=0, s-maxage=180, stale-while-revalidate=600"
  });
};

function json(statusCode, obj, extraHeaders={}){
  return {
    statusCode,
    headers: {
      "content-type":"application/json",
      "access-control-allow-origin":"*",
      "access-control-allow-headers":"content-type, authorization",
      ...extraHeaders
    },
    body: JSON.stringify(obj)
  };
}
