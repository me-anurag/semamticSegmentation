// ── model.js ──
// Owns the Transformers.js pipeline, segmentation logic, and canvas rendering.
// Imports getLabelColor from ade20k.js for correct colors.
// Calls ui.js helpers for progress/status updates — never touches DOM directly.

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';
import { getLabelColor } from './ade20k.js';
import {
  setProgress, setStatus, setBusy,
  showResultActions, showResult, renderAnalysis,
  showToast, progressWrap,
  originalImg, resultCanvas, analysisPanel
} from './ui.js';

env.allowLocalModels = false;
env.useBrowserCache  = true;

// ── Internal state (owned by this module) ──
let segmenter   = null;
let modelLoaded = false;

// ── Load model ──
export async function loadModel() {
  progressWrap.classList.add('visible');
  setStatus('LOADING', '255,160,0');
  setProgress(0, 'Initializing model…');

  segmenter = await pipeline(
    'image-segmentation',
    'Xenova/segformer-b2-finetuned-ade-512-512',
    {
      progress_callback: info => {
        if (info.status === 'progress') {
          setProgress((info.loaded / info.total) * 80, `Downloading model… ${info.file || ''}`);
        } else if (info.status === 'ready') {
          setProgress(90, 'Model ready');
        }
      }
    }
  );

  modelLoaded = true;
  setProgress(100, 'Model loaded ✓');
  setStatus('MODEL READY', '0,168,132');
  setTimeout(() => progressWrap.classList.remove('visible'), 800);
}

// ── Run segmentation ──
export async function runSegmentation(imageFile) {
  if (!imageFile) return;

  setBusy(true);
  setStatus('RUNNING', '0,168,132');

  try {
    if (!modelLoaded) await loadModel();

    progressWrap.classList.add('visible');
    setProgress(0, 'Analysing image…');

    const imgUrl   = URL.createObjectURL(imageFile);
    setProgress(20, 'Running SegFormer…');

    const rawOutput = await segmenter(imgUrl, { threshold: 0.3 });

    setProgress(60, 'Filtering results…');

    // Filter: drop segments with < 1% area OR confidence < 55%
    const totalPixels = rawOutput.reduce(
      (s, seg) => s + seg.mask.data.filter(v => v > 128).length, 0
    );
    const output = rawOutput.filter(seg => {
      const pixCount = seg.mask.data.filter(v => v > 128).length;
      const areaPct  = totalPixels > 0 ? pixCount / totalPixels : 0;
      return areaPct >= 0.01 && (seg.score ?? 1) >= 0.55;
    });

    setProgress(70, 'Rendering masks…');
    await renderMasks(output);

    setProgress(100, 'Done ✓');
    setTimeout(() => progressWrap.classList.remove('visible'), 600);

    setStatus('DONE', '0,168,132');
    setBusy(false);
    showResultActions();
    renderAnalysis(output, getLabelColor);
    showResult(output);

  } catch (err) {
    console.error(err);
    setBusy(false);
    setStatus('ERROR', '255,60,60');
    showToast('Segmentation failed. Try again.');
    progressWrap.classList.remove('visible');
  }
}

// ── Render masks onto canvas ──
async function renderMasks(segments) {
  const img = originalImg;
  const W   = img.naturalWidth;
  const H   = img.naturalHeight;

  resultCanvas.width  = W;
  resultCanvas.height = H;

  const ctx = resultCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0, W, H);

  for (const seg of segments) {
    const [r, g, b] = getLabelColor(seg.label);
    const { data: maskData, width: maskW, height: maskH } = seg.mask;

    // Paint mask overlay
    const offscreen = new OffscreenCanvas(maskW, maskH);
    const octx      = offscreen.getContext('2d');
    const imgData   = octx.createImageData(maskW, maskH);

    for (let i = 0; i < maskData.length; i++) {
      imgData.data[i * 4 + 0] = r;
      imgData.data[i * 4 + 1] = g;
      imgData.data[i * 4 + 2] = b;
      imgData.data[i * 4 + 3] = maskData[i] > 128 ? 140 : 0;
    }

    octx.putImageData(imgData, 0, 0);
    ctx.drawImage(offscreen, 0, 0, W, H);

    // Draw label badge at mask centroid
    const { cx, cy } = getMaskCentroid(maskData, maskW, maskH, W, H);
    drawLabel(ctx, seg.label, cx, cy, r, g, b, W, H);
  }
}

// ── Centroid of a binary mask ──
function getMaskCentroid(maskData, maskW, maskH, targetW, targetH) {
  let sumX = 0, sumY = 0, count = 0;
  for (let y = 0; y < maskH; y++) {
    for (let x = 0; x < maskW; x++) {
      if (maskData[y * maskW + x] > 128) { sumX += x; sumY += y; count++; }
    }
  }
  if (count === 0) return { cx: targetW / 2, cy: targetH / 2 };
  return {
    cx: (sumX / count) * (targetW / maskW),
    cy: (sumY / count) * (targetH / maskH),
  };
}

// ── Draw a label badge ──
function drawLabel(ctx, label, cx, cy, r, g, b, W, H) {
  ctx.save();
  const fontSize = Math.max(12, Math.min(16, W / 35));
  ctx.font = `bold ${fontSize}px -apple-system, sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  const textW = ctx.measureText(label).width;
  const pad = 6, bh = fontSize + 8;

  // Clamp badge within canvas
  const bx = Math.max(textW / 2 + pad, Math.min(W - textW / 2 - pad, cx));
  const by = Math.max(bh / 2 + 2,      Math.min(H - bh / 2 - 2,      cy));

  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur  = 4;

  ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
  _roundRect(ctx, bx - textW / 2 - pad, by - bh / 2, textW + pad * 2, bh, 5);
  ctx.fill();

  ctx.shadowBlur  = 0;
  ctx.fillStyle   = '#fff';
  ctx.fillText(label, bx, by);
  ctx.restore();
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
