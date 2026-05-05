# SegVision — Semantic Segmentation PWA

A fully **free**, on-device semantic segmentation Progressive Web App.
No API keys. No backend. Runs entirely in your browser.

## Features
- 🔬 **SegFormer-B2** model (ADE20K, 150 classes)
- 🎨 Color-coded mask overlays with object name labels
- 📊 Side-by-side original vs segmented comparison
- 📱 Mobile-first, WhatsApp-style UI
- 🔁 Installable as PWA (works offline after first load)

## How to Run

### Option 1 — Local server (recommended)
```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```
Then open `http://localhost:8080` in Chrome or Safari.

### Option 2 — Deploy free
Upload all files to:
- **Netlify** (drag & drop the folder at netlify.com)
- **Vercel** (`npx vercel`)
- **GitHub Pages**

## First Use
- The model (~25MB) downloads once from HuggingFace CDN
- After that, everything runs offline
- Segmentation takes ~2–8 seconds depending on your device

## Supported Classes (150)
wall, building, sky, floor, tree, ceiling, road, bed, grass, cabinet,
sidewalk, person, door, table, mountain, plant, chair, car, water,
painting, sofa, shelf, mirror, and 126 more...

## Files
```
index.html      — Main app
manifest.json   — PWA manifest
sw.js           — Service worker (offline support)
icon-192.svg    — App icon
icon-512.svg    — App icon (large)
```
