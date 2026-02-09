\
export const handler = async (event) => {
  const qs = event.queryStringParameters || {};
  const title = (qs.title || "EPSTEIN FILES").toString().slice(0, 80);
  const subtitle = (qs.subtitle || "AI Newsroom Index").toString().slice(0, 120);

  const svg = renderSvg(title, subtitle);

  return {
    statusCode: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      "access-control-allow-origin": "*",
    },
    body: svg,
  };
};

function esc(s=""){ return String(s).replace(/[&<>]/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;" }[m])); }

function renderSvg(title, subtitle){
  const t = esc(title);
  const st = esc(subtitle);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#0b0f19"/>
      <stop offset="1" stop-color="#0b1222"/>
    </linearGradient>
    <radialGradient id="g1" cx="30%" cy="10%" r="70%">
      <stop offset="0" stop-color="rgba(56,189,248,0.35)"/>
      <stop offset="1" stop-color="rgba(56,189,248,0)"/>
    </radialGradient>
    <radialGradient id="g2" cx="85%" cy="0%" r="75%">
      <stop offset="0" stop-color="rgba(34,197,94,0.30)"/>
      <stop offset="1" stop-color="rgba(34,197,94,0)"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>

  <rect x="70" y="84" width="1060" height="462" rx="28" fill="rgba(15,23,42,0.78)" stroke="rgba(255,255,255,0.10)"/>

  <text x="110" y="210" font-size="64" font-family="Georgia, 'Times New Roman', Times, serif" fill="#e5e7eb" font-weight="700">${t}</text>
  <text x="110" y="276" font-size="28" font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" fill="#94a3b8">${st}</text>

  <g transform="translate(110, 330)">
    <rect x="0" y="0" width="240" height="44" rx="22" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)"/>
    <circle cx="28" cy="22" r="7" fill="#22c55e"/>
    <text x="44" y="28" font-size="18" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" fill="#e5e7eb">LIVE INDEX</text>

    <rect x="260" y="0" width="360" height="44" rx="22" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)"/>
    <text x="284" y="28" font-size="18" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" fill="#e5e7eb">Sources • Summaries • Links</text>
  </g>

  <text x="110" y="520" font-size="16" font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" fill="rgba(148,163,184,0.9)">
    Hinweis: Index & Quellenlinks. Keine Volltexte. KI kann Fehler machen.
  </text>
</svg>`;
}
