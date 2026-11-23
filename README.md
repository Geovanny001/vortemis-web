# Vortemis Web

Static site for Vortemis.io: an informational landing page plus the operator
console. Plain HTML, CSS and JavaScript, with a Three.js backdrop. No build
step, no framework and no client-side dependencies beyond Three.js from a CDN.

## Run locally

```bash
python -m http.server 8080
```

Open http://127.0.0.1:8080.

ES modules and the import map require HTTP; opening `index.html` from the file
system does not work.

## Point it at the API

The default API base is the page origin. Override it with a query parameter
or a stored value:

```text
https://web.example.com/?api=https://api.example.com
```

```js
localStorage.setItem("vortemis.api", "https://api.example.com");
```

## Live demo

The console polls the API every three seconds while an operator is signed in.
The **LIVE** tab shows a feed of detections above `0.70`, the masthead badge
reports how recently the newest flow arrived, and the overview timeline uses
thirty-second buckets.

To drive a demonstration, run the engine's `scripts/demo_simulator.py`, which
appends scripted benign traffic plus the five MITRE tactics to the ingestion log
with current timestamps.

The public landing reads `assets/detections.json`. Generate it while the engine
runs:

```bash
VORTEMIS_API=http://127.0.0.1:8000 python3 scripts/snapshot_detections.py
```

The file is generated and git-ignored; the script polls the API every three
seconds.

## Allow the origin in the API

The API enforces an explicit CORS allowlist:

```bash
export VORTEMIS_CORS_ORIGINS=http://127.0.0.1:8080,http://localhost:8080
```

## Screenshot

The console section shows a placeholder until a real capture exists. Drop the
image at:

```text
assets/console-overview.png
```

Recommended size: 1600 x 1000, dark console, no browser chrome. The placeholder
disappears automatically when the image is present.

## Structure

```text
index.html
assets/
  styles.css
  favicon.svg
  console-overview.png   (add your capture)
js/
  config.js     API base
  api.js        fetch, tokens, refresh and retry
  ascii.js      ASCII artwork: flow map, stars, pipeline
  chart.js      Three.js timeline
  scene.js      Three.js background field
  ui.js         formatting and small DOM helpers
  app.js        screen router, login and tabs
  views/
    overview.js
    flows.js
    admin.js
```

## Screens

- `home`: informational landing with the ASCII flow map, pipeline, detections,
  console preview, interfaces, run instructions and FAQ.
- `login`: operator sign-in.
- `app`: the console itself, with overview, live, flows and admin tabs.

## Artwork

All decorative art is ASCII, defined in `js/ascii.js` and injected into `pre`
elements with a `data-ascii` attribute. The animated background and the timeline
are rendered with Three.js.

The background includes occasional shooting stars, one at a time. To preview
them during development, open the site with `?stars`:

```text
http://127.0.0.1:8080/?stars
```

## Contract

The console consumes `/v1` from `Vortemis.io`. The canonical contract lives in
the engine repository at `docs/CONTRACTS.md`, and each release ships an
`openapi.json` asset.

## Limitations

- The overview uses a fixed threshold of `0.70`; the flows view exposes its own
  minimum probability.
- Tokens live in `sessionStorage`, so a new tab requires signing in again.
- No offline cache, no service worker and no server-side rendering.
- The API must allow the console origin through CORS.

## Tests

The client is a plain ES-module application, so the test toolchain is
dependency-light and opt-in.

```bash
npm install
npm test          # unit and integration tests (Vitest + jsdom)
```

System and access-control tests run against a live API with Playwright:

```bash
npx playwright install chromium
API_URL=https://api.example.com \
ADMIN_USER=... ADMIN_PASSWORD=... \
ANALYST_USER=... ANALYST_PASSWORD=... \
WEB_URL=http://localhost:8080 npm run test:e2e
```

| Layer | Tool | Covers |
| --- | --- | --- |
| Unit | Vitest | formatting, config resolution, API client |
| Integration | Vitest + jsdom | manual tab contract, landing structure, sanitisation |
| System | Playwright | loading, tabs, sign-in |
| Access control | Playwright | invalid login, admin vs analyst |
