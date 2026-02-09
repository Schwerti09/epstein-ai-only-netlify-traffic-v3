\
const $ = (s) => document.querySelector(s);

const TOKEN_KEY = "premium_token";

function setText(sel, txt){ const el = $(sel); if (el) el.textContent = txt; }
function escapeHtml(s=""){ return String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }

async function whoami(){
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return { premium:false };
  try{
    const res = await fetch("/api/whoami", { headers: { "authorization": "Bearer " + token }});
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "auth failed");
    return data;
  }catch{
    localStorage.removeItem(TOKEN_KEY);
    return { premium:false };
  }
}

function renderSummary(data, premium){
  const box = $("#summaryBox");
  if (!box) return;
  const sum = data?.summary || "—";
  const teaser = data?.teaser || sum;
  const show = premium ? sum : teaser;
  const blurredClass = premium ? "" : "blur";
  const cta = premium ? "" : `
    <div class="hr"></div>
    <div class="premiumLock">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">
        <div>
          <div style="font-weight:900">Deep Summary ist Premium</div>
          <div class="muted" style="font-size:13px">€4,99/Monat · sofort freischalten</div>
        </div>
        <button class="btn primary" id="subscribeInline">Unlock</button>
      </div>
    </div>
  `;
  box.innerHTML = `
    <div class="card pad">
      <div class="kicker">KI‑Zusammenfassung</div>
      <div class="p ${blurredClass}" style="white-space:pre-wrap">${escapeHtml(show)}</div>
      ${cta}
    </div>
  `;
  const inlineBtn = $("#subscribeInline");
  inlineBtn?.addEventListener("click", subscribe);
}

function renderStories(items=[]){
  const list = $("#stories");
  if (!list) return;
  list.innerHTML = items.map(it => `
    <div class="story">
      <a class="title" href="${escapeHtml(it.link)}" target="_blank" rel="noreferrer">${escapeHtml(it.title)}</a>
      <div class="meta">
        <span>${escapeHtml(it.domain || "")}</span><span class="sep">·</span><span>${escapeHtml(it.date || "")}</span>
      </div>
      <div class="p muted" style="margin-top:8px">${escapeHtml(it.snippet || "")}</div>
    </div>
  `).join("");
}

async function runSearch(){
  const q = ($("#q")?.value || "").trim();
  if (!q) return;

  setText("#resultState", "Lade…");
  $("#summaryBox").innerHTML = "";
  $("#stories").innerHTML = "";

  const me = await whoami();
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const headers = token ? { "authorization":"Bearer " + token } : {};

  const res = await fetch("/api/ai-search?q=" + encodeURIComponent(q), { headers, cache:"no-store" });
  const data = await res.json();
  if (!res.ok){
    setText("#resultState", data?.error || "Fehler");
    return;
  }

  setText("#resultState", me.premium ? "Premium aktiv." : "Free Preview. Premium entsperrt Deep Summary.");
  renderSummary(data, !!me.premium);
  renderStories(data.items || []);
}

async function subscribe(){
  const btn = $("#subscribeBtn");
  const btn2 = $("#subscribeBtn2");
  const old1 = btn?.textContent;
  if (btn) btn.textContent = "Weiterleitung…";
  if (btn2) btn2.textContent = "Weiterleitung…";
  try{
    const res = await fetch("/api/checkout", { method:"POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Checkout fehlgeschlagen");
    location.href = data.url;
  }catch(e){
    alert(e.message);
  }finally{
    if (btn) btn.textContent = old1 || "Premium ab €4,99";
    if (btn2) btn2.textContent = "Unlock";
  }
}

async function handleReturn(){
  const u = new URL(location.href);
  const sessionId = u.searchParams.get("session_id");
  if (!sessionId) return;
  setText("#resultState", "Aktiviere Premium…");
  try{
    const res = await fetch("/api/verify?session_id=" + encodeURIComponent(sessionId));
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Verify fehlgeschlagen");
    localStorage.setItem(TOKEN_KEY, data.token);
    u.searchParams.delete("session_id");
    history.replaceState({}, "", u.toString());
  }catch(e){
    console.warn(e);
  }
}

async function init(){
  setText("#today", new Date().toISOString().slice(0,10));
  setText("#yearNow", String(new Date().getFullYear()));

  await handleReturn();

  const me = await whoami();
  setText("#authState", me.premium ? "Premium" : "Gast");
  const logout = $("#logoutBtn");
  if (logout){
    logout.style.display = me.premium ? "inline" : "none";
    logout.addEventListener("click", (e)=>{
      e.preventDefault();
      localStorage.removeItem(TOKEN_KEY);
      location.reload();
    });
  }

  $("#go")?.addEventListener("click", runSearch);
  $("#q")?.addEventListener("keydown", (e)=>{ if (e.key === "Enter") runSearch(); });
  $("#subscribeBtn")?.addEventListener("click", (e)=>{ e.preventDefault(); subscribe(); });

  // Support ?q= prefill
  const u = new URL(location.href);
  const qp = u.searchParams.get("q");
  if (qp){
    $("#q").value = qp;
    await runSearch();
  }
}

init();
