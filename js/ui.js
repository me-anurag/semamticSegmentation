// ── ui.js ──
// Owns all DOM references and every function that touches the UI.
// model.js and main.js call these — they never touch the DOM directly.

// ── DOM refs ──
export const uploadZone    = document.getElementById('uploadZone');
export const fileInput     = document.getElementById('fileInput');
export const originalCard  = document.getElementById('originalCard');
export const originalImg   = document.getElementById('originalImg');
export const progressWrap  = document.getElementById('progressWrap');
export const progressText  = document.getElementById('progressText');
export const progressPct   = document.getElementById('progressPct');
export const progressFill  = document.getElementById('progressFill');
export const resultDivider = document.getElementById('resultDivider');
export const resultCard    = document.getElementById('resultCard');
export const resultCanvas  = document.getElementById('resultCanvas');
export const analysisPanel = document.getElementById('analysisPanel');
export const objectsGrid   = document.getElementById('objectsGrid');
export const summaryCard   = document.getElementById('summaryCard');
export const segBtn        = document.getElementById('segBtn');
export const btnLabel      = document.getElementById('btnLabel');
export const btnSpinner    = document.getElementById('btnSpinner');
export const btnIcon       = document.getElementById('btnIcon');
export const actionRow     = document.getElementById('actionRow');
export const newImageBtn   = document.getElementById('newImageBtn');
export const retryBtn      = document.getElementById('retryBtn');
export const changeImgBtn  = document.getElementById('changeImgBtn');
export const logoDot       = document.getElementById('logoDot');
export const statusBadge   = document.getElementById('statusBadge');
export const toastEl       = document.getElementById('toast');

// ── Toast ──
let _toastTimer = null;
export function showToast(msg, duration = 2500) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

// ── Progress bar ──
export function setProgress(pct, label) {
  progressFill.style.width = pct + '%';
  progressPct.textContent  = Math.round(pct) + '%';
  progressText.textContent = label;
}

// ── Status badge ──
export function setStatus(text, color) {
  statusBadge.textContent = text;
  if (color) {
    statusBadge.style.background   = `rgba(${color},0.15)`;
    statusBadge.style.color        = `rgb(${color})`;
    statusBadge.style.borderColor  = `rgba(${color},0.3)`;
  }
}

// ── Busy state (during model load / inference) ──
export function setBusy(busy) {
  segBtn.disabled = busy;
  btnSpinner.classList.toggle('visible', busy);
  btnIcon.style.display   = busy ? 'none' : '';
  btnLabel.style.display  = busy ? 'none' : '';
  logoDot.classList.toggle('processing', busy);
}

// ── Show two-button row after result ──
export function showResultActions() {
  segBtn.style.display    = 'none';
  actionRow.style.display = 'flex';
}

// ── Reset everything back to upload state ──
export function resetToUpload() {
  originalImg.src = '';
  originalCard.classList.remove('visible');
  resultCard.classList.remove('visible');
  resultDivider.style.display = 'none';
  analysisPanel.classList.remove('visible');
  progressWrap.classList.remove('visible');
  uploadZone.style.display    = '';
  segBtn.disabled             = true;
  segBtn.style.display        = '';
  actionRow.style.display     = 'none';
  btnLabel.textContent        = 'Start Segmentation';
  btnIcon.innerHTML           = '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>';
  btnIcon.style.display       = '';
  btnLabel.style.display      = '';
  setStatus('READY', '0,168,132');
  fileInput.value = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Show original image after file picked ──
export function showOriginal(file) {
  const url = URL.createObjectURL(file);
  originalImg.src = url;
  originalCard.classList.add('visible', 'fade-up');

  // Hide result UI from a previous run
  resultCard.classList.remove('visible');
  resultDivider.style.display = 'none';
  analysisPanel.classList.remove('visible');
  progressWrap.classList.remove('visible');

  // Reset bottom bar to single segmentation button
  segBtn.disabled         = false;
  segBtn.style.display    = '';
  actionRow.style.display = 'none';
  btnLabel.textContent    = 'Start Segmentation';
  btnIcon.innerHTML       = '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>';
  btnIcon.style.display   = '';
  btnLabel.style.display  = '';

  uploadZone.style.display = 'none';
  showToast('Image loaded ✓');
}

// ── Show segmentation result on canvas ──
export function showResult(output) {
  resultDivider.style.display = '';
  resultCard.classList.add('visible', 'fade-up');
  analysisPanel.classList.add('visible', 'fade-up');
  setTimeout(() => resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  showToast(`${output.length} object class${output.length !== 1 ? 'es' : ''} detected`);
}

// ── Analysis chips + summary ──
export function renderAnalysis(segments, getLabelColor) {
  objectsGrid.innerHTML = '';

  const sorted = [...segments].sort((a, b) => {
    const count = seg => seg.mask.data.filter(v => v > 128).length;
    return count(b) - count(a);
  });

  const total = sorted.reduce((s, seg) => s + seg.mask.data.filter(v => v > 128).length, 0);

  for (const seg of sorted) {
    const [r, g, b]    = getLabelColor(seg.label);
    const count        = seg.mask.data.filter(v => v > 128).length;
    const pct          = total > 0 ? Math.round((count / total) * 100) : 0;
    const confidence   = seg.score != null ? Math.round(seg.score * 100) : null;
    const confColor    = confidence >= 80 ? 'var(--accent)' : confidence >= 65 ? '#f0b429' : '#8696A0';

    const chip = document.createElement('div');
    chip.className = 'obj-chip active';
    chip.innerHTML = `
      <span class="obj-color" style="background:rgb(${r},${g},${b})"></span>
      <span style="flex:1">${seg.label}</span>
      ${confidence != null
        ? `<span class="obj-pct" style="color:${confColor}">${confidence}%</span>`
        : `<span class="obj-pct">${pct}%</span>`}
    `;
    objectsGrid.appendChild(chip);
  }

  const labels  = sorted.map(s => s.label);
  const top3    = labels.slice(0, 3).join(', ');
  const avgConf = segments.length > 0
    ? Math.round(segments.reduce((s, g) => s + (g.score ?? 0.8), 0) / segments.length * 100)
    : 0;
  const confColor = avgConf >= 75 ? 'var(--accent)' : '#f0b429';

  summaryCard.innerHTML = `
    <strong>${segments.length}</strong> object class${segments.length !== 1 ? 'es' : ''} detected.
    Avg confidence: <strong style="color:${confColor}">${avgConf}%</strong>.<br/>
    Dominant: <strong>${top3 || '—'}</strong>.
    ${segments.length > 3 ? `<br/>Also: ${labels.slice(3).join(', ')}.` : ''}
  `;
}

// ── Service worker + update banner ──
export function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  const banner      = document.getElementById('updateBanner');
  const updateBtn   = document.getElementById('updateBtn');
  const dismissBtn  = document.getElementById('updateDismiss');
  let newWorker     = null;

  navigator.serviceWorker.register('sw.js').then(reg => {
    setInterval(() => reg.update(), 60_000);

    reg.addEventListener('updatefound', () => {
      newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          banner.classList.add('visible');
        }
      });
    });
  }).catch(() => {});

  updateBtn.addEventListener('click', () => {
    if (newWorker) newWorker.postMessage({ type: 'SKIP_WAITING' });
    banner.classList.remove('visible');
  });

  dismissBtn.addEventListener('click', () => banner.classList.remove('visible'));

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) { refreshing = true; window.location.reload(); }
  });
}
