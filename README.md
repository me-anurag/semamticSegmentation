# SegVision — Semantic Segmentation PWA

Free, on-device semantic segmentation. No API keys. No backend. Runs entirely in the browser.

## Stack
- **SegFormer-B2** (ADE20K, 150 classes) via Transformers.js
- Vanilla ES Modules — no bundler needed
- PWA with auto-update banner on new deploys

## Folder structure
```
segpwa/
├── index.html          ← HTML shell only
├── manifest.json
├── sw.js               ← Service worker (versioned cache + update prompt)
├── icon-192.svg
├── icon-512.svg
│
├── css/
│   └── style.css       ← All styles
│
└── js/
    ├── main.js         ← Entry point, event listeners
    ├── ui.js           ← All DOM refs and UI updates
    ├── model.js        ← Model loading, segmentation, canvas rendering
    └── ade20k.js       ← ADE20K palette map + getLabelColor()
```

## Run locally
```bash
# Python
python -m http.server 8080

# Node
npx serve .
```
Open `http://localhost:8080` in Chrome.

> Must use a local server — Service Workers don't work on `file://`.

## Deploy (Vercel + GitHub auto-updates)
1. Push folder to GitHub
2. Connect repo to Vercel — it auto-deploys on every push
3. After each push, users already on the app see the **"Update Available"** banner
4. One tap → instant update, no manual cache clearing ever needed

## On first use
- Model (~25MB) downloads once from HuggingFace CDN and is cached
- Segmentation: ~1–3s on desktop, ~4–8s on mobile

## When you push new changes
1. Bump `VERSION` in `sw.js` (e.g. `segvision-v3`)
2. Push to GitHub → Vercel deploys automatically
3. Users see the update banner within 60 seconds
