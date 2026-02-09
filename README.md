# Epstein Files – AI Newsroom Index (Traffic v2)

Ziel: **Keys rein → Deploy → läuft.**  
Kein DB-Setup, keine Migrationen.

## 1) Deploy (Netlify)
- Build command: `npm run build`
- Publish directory: `site`
- Functions: `netlify/functions`

`netlify.toml` ist schon korrekt.

## 2) ENV (minimal)
**Required**
- GEMINI_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_PRICE_ID_MONTHLY
- AUTH_SECRET (Random long string)

**Optional**
- GEMINI_MODEL (default gemini-1.5-flash)
- SITE_URL
- STRIPE_WEBHOOK_SECRET

## 3) Traffic-Engine (ohne zusätzliche Keys)
- Programmatic SEO: Build generiert `/q/<slug>/` Seiten aus `data/queries.json`
- Jede Seite enthält: statische Preview (für SEO) + Live-KI-Recherche
- Auto: sitemap.xml, robots.txt, opensearch.xml

## 4) Hinweis
Wir hosten keine Volltexte Dritter. Wir verlinken Quellen und erstellen Zusammenfassungen.
