import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const root = process.cwd();
const outDir = path.join(root, "site");
const dataFile = path.join(root, "data", "queries.json");
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check");

function ensureDir(p){ fs.mkdirSync(p, { recursive:true }); }
function readJson(p){ return JSON.parse(fs.readFileSync(p, "utf8")); }
function esc(s=""){ return String(s).replace(/[&<>\"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }
function slugify(s){
  return String(s).trim().toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function fetchRssTop(q, limit=5){
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
  const parser = new XMLParser({ ignoreAttributes:false });
  const res = await fetch(rssUrl, { headers: { "user-agent":"Mozilla/5.0" }});
  const xml = await res.text();
  const doc = parser.parse(xml);
  const raw = doc?.rss?.channel?.item || [];
  const arr = Array.isArray(raw) ? raw : [raw];
  const stripHtml = (s="") => String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const domainOf = (u) => { try{ return new URL(u).hostname.replace(/^www\./,""); }catch{ return ""; } };
  const toDate = (s) => { try{ return new Date(s).toISOString().slice(0,10); }catch{ return ""; } };
  return arr.slice(0, limit).map(it => ({
    title: stripHtml(it?.title || ""),
    link: it?.link || "",
    date: toDate(it?.pubDate || it?.published || ""),
    domain: domainOf(it?.link || ""),
    snippet: stripHtml(it?.description || it?.content || ""),
  })).filter(x => x.link && x.title);
}

function pageShell({ title, description, canonical, ogImage, body, extraHead="" }){
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="icon" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles.css">
  <link rel="canonical" href="${esc(canonical)}">
  <meta name="robots" content="index,follow">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${esc(ogImage)}">
  ${extraHead}
</head>
<body>
${body}
</body>
</html>`;
}

function chrome(mainHtml){
  return `
  <div class="topbar">
    <div class="container"><div class="row">
      <div class="badge"><span class="dot"></span><strong>Live</strong> · <span class="mono">${new Date().toISOString().slice(0,10)}</span></div>
      <div class="badge"><a class="btn" href="/">Start</a><a class="btn" href="/topics/">Topics</a><a class="btn primary" href="/#pricing">Premium ab €4,99</a></div>
    </div></div>
  </div>
  <header class="header">
    <div class="container">
      <div class="brand">
        <div class="logo">
          <h1>EPSTEIN FILES</h1>
          <small>AI Newsroom: Quellen bündeln · Relevanz extrahieren · Leseführung liefern</small>
        </div>
        <div class="split">
          <a class="btn" href="/impressum.html">Impressum</a>
          <a class="btn" href="/datenschutz.html">Datenschutz</a>
        </div>
      </div>
      <nav class="nav" aria-label="Navigation">
        <a href="/">Start</a>
        <a href="/topics/">Topics</a>
        <a href="/#search">Suche</a>
        <a href="/#pricing">Preise</a>
      </nav>
    </div>
  </header>
  <main class="container" style="padding:18px 0 26px 0">${mainHtml}</main>
  <div class="footer">
    <div class="container" style="padding:0">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">
        <div>© ${new Date().getFullYear()} Wissens‑Bank.</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <a href="/impressum.html">Impressum</a>
          <a href="/datenschutz.html">Datenschutz</a>
          <a href="/agb.html">AGB</a>
          <a href="/sitemap.xml">Sitemap</a>
        </div>
      </div>
      <div class="muted" style="margin-top:10px;line-height:1.5">
        Hinweis: Wir hosten keine urheberrechtlich geschützten Inhalte Dritter. Wir verlinken auf öffentlich zugängliche Quellen und erstellen Zusammenfassungen/Leseführung.
      </div>
    </div>
  </div>`;
}

async function generate(){
  ensureDir(outDir);
  ensureDir(path.join(outDir, "q"));
  ensureDir(path.join(outDir, "topics"));

  const { queries } = readJson(dataFile);
  const unique = Array.from(new Set((queries||[]).map(s => String(s).trim()).filter(Boolean)));

  const urls = ["/", "/topics/", "/impressum.html", "/datenschutz.html", "/agb.html"];

  const chips = unique.map(q => {
    const slug = slugify(q);
    return `<a class="chip" href="/q/${slug}/">${esc(q)}</a>`;
  }).join("");
  const topicsBody = chrome(`
    <section class="card pad">
      <div class="kicker">Topics</div>
      <div class="h2">Programmatic Landingpages</div>
      <p class="p muted">Diese Seiten sind statisch, schnell, indexierbar – und führen direkt zur Live‑KI‑Recherche.</p>
      <div class="hr"></div>
      <div class="chips">${chips}</div>
    </section>
  `);
  fs.writeFileSync(path.join(outDir, "topics", "index.html"), pageShell({
    title:"Topics – Epstein Files AI Newsroom",
    description:"Programmatic SEO Topics: statische Landingpages mit Quellenlinks & Live‑KI‑Recherche.",
    canonical:"/topics/",
    ogImage:"/api/og?title=Topics&subtitle=AI%20Newsroom",
    body:topicsBody
  }), "utf8");

  for (const q of unique){
    const slug = slugify(q);
    ensureDir(path.join(outDir, "q", slug));

    let top = [];
    try{ top = await fetchRssTop(q, 5); }catch{ top = []; }

    const preview = top.length ? top.map(it => `
      <div class="story">
        <a class="title" href="${esc(it.link)}" target="_blank" rel="noreferrer">${esc(it.title)}</a>
        <div class="meta"><span>${esc(it.domain||"")}</span><span class="sep">·</span><span>${esc(it.date||"")}</span></div>
        <div class="p muted" style="margin-top:8px">${esc(it.snippet||"")}</div>
      </div>
    `).join("") : `<div class="muted">Keine Feed‑Treffer beim Build. Nutze die Live‑Suche.</div>`;

    const main = chrome(`
      <section class="card pad" id="qpage" data-query="${esc(q)}">
        <div class="kicker">Topic</div>
        <div class="h1" style="font-size:40px">${esc(q)}</div>
        <p class="p muted">Statische Preview (für SEO) + Live‑KI‑Recherche. Premium schaltet Deep Summary frei.</p>
        <div class="hr"></div>
        <div class="kicker">Aktuelle Quellen (Preview)</div>
        ${preview}
        <div class="hr"></div>
        <div class="kicker">Live‑KI‑Recherche</div>
        <div class="chips" style="margin-top:10px">
          <a class="chip" href="/?q=${encodeURIComponent(q)}#search">Auf Startseite suchen</a>
          <button class="btn primary" id="runLive">Jetzt hier laden</button>
        </div>
        <div id="liveMount" style="margin-top:12px"></div>
      </section>
      <script type="module">
        const q = document.querySelector("#qpage")?.dataset?.query || "";
        const btn = document.querySelector("#runLive");
        btn?.addEventListener("click", async ()=>{
          const mount = document.querySelector("#liveMount");
          mount.innerHTML = '<div class="muted">Lade…</div>';
          try{
            const res = await fetch('/api/ai-search?q=' + encodeURIComponent(q), { cache:'no-store' });
            const data = await res.json();
            if(!res.ok) throw new Error(data?.error || 'Request failed');
            const sum = data?.teaser || data?.summary || '—';
            mount.innerHTML = '<div class="card pad"><div class="kicker">KI‑Preview</div><div class="p blur" style="white-space:pre-wrap">' + escapeHtml(sum) + '</div><div class="hr"></div><a class="btn primary" href="/#pricing">Premium entsperren</a></div>';
          }catch(e){
            mount.innerHTML = '<div class="card pad notice"><strong>Fehler:</strong> ' + escapeHtml(e.message) + '</div>';
          }
        });
        function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m])); }
      </script>
    `);

    fs.writeFileSync(path.join(outDir, "q", slug, "index.html"), pageShell({
      title: `${q} – AI Newsroom Index`,
      description: `Live Quellenlinks und KI‑Recherche zum Thema: ${q}. Keine Volltexte – nur Index + Zusammenfassung.`,
      canonical: `/q/${slug}/`,
      ogImage: `/api/og?title=${encodeURIComponent(q)}&subtitle=AI%20Newsroom%20Index`,
      body: main
    }), "utf8");

    urls.push(`/q/${slug}/`);
  }

  fs.writeFileSync(path.join(outDir, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: /sitemap.xml\n`, "utf8");

  const opensearch = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">\n` +
    `  <ShortName>Epstein Files AI</ShortName>\n` +
    `  <Description>AI Newsroom Index Search</Description>\n` +
    `  <Url type="text/html" template="/?q={searchTerms}"/>\n` +
    `</OpenSearchDescription>\n`;
  fs.writeFileSync(path.join(outDir, "opensearch.xml"), opensearch, "utf8");

  const lastmod = new Date().toISOString();
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${u}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n") +
    `\n</urlset>\n`;
  fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap, "utf8");

  console.log(`Generated ${urls.length} URLs (q pages: ${urls.filter(u=>u.startsWith("/q/")).length}).`);
}

async function main(){
  if (CHECK_ONLY){
    console.log("Check OK.");
    return;
  }
  await generate();
}

main().catch(err => { console.error(err); process.exit(1); });
