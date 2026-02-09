\
export async function geminiSummarize({ apiKey, model, query, items, premium }){
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const context = items.slice(0, premium ? 25 : 5).map((it, idx) => ({
    idx: idx+1,
    title: it.title,
    domain: it.domain,
    date: it.date,
    snippet: it.snippet
  }));

  const system = `
Du bist ein nüchterner Newsroom-Analyst. Keine Verleumdungen, keine Spekulationen als Fakten.
Du arbeitest nur mit dem bereitgestellten Kontext. Wenn etwas unklar ist: sag es.
Output:
1) "summary": maximal 8 Sätze, journalistisch, faktisch
2) "what_to_read_next": 5 Bulletpoints (kurz)
3) "caveats": 3 Bulletpoints (Unsicherheiten)
Antworte in DE.
`.trim();

  const user = `
Query: ${query}

Kontext (Titel/Quelle/Datum/Snippet):
${JSON.stringify(context, null, 2)}
`.trim();

  const body = {
    contents: [
      { role: "user", parts: [{ text: system + "\n\n" + user }] }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: premium ? 900 : 420
    }
  };

  const res = await fetch(endpoint, {
    method:"POST",
    headers:{ "content-type":"application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok){
    const msg = data?.error?.message || "Gemini error";
    throw new Error(msg);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map(p=>p.text).join("\n") || "";
  // best effort parse JSON, else return raw
  let parsed = null;
  try{
    parsed = JSON.parse(text);
  }catch{
    parsed = null;
  }

  if (parsed && typeof parsed === "object"){
    const sum = String(parsed.summary || "").trim();
    const next = Array.isArray(parsed.what_to_read_next) ? parsed.what_to_read_next : [];
    const cav = Array.isArray(parsed.caveats) ? parsed.caveats : [];
    return { summary: sum, what_to_read_next: next, caveats: cav, raw: text };
  }

  return { summary: text.trim(), what_to_read_next: [], caveats: [], raw: text };
}
