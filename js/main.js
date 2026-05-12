// ── main.js ──
// Entry point. Imports all modules and wires up event listeners.
// No logic lives here — just connections.

import { runSegmentation } from './model.js';
import {
  uploadZone, fileInput,
  segBtn, retryBtn, newImageBtn, changeImgBtn,
  showToast, showOriginal, resetToUpload, registerSW
} from './ui.js';

// ── Shared state ──
let imageFile = null;

// ── File handling ──
function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('Please upload an image file');
    return;
  }
  imageFile = file;
  showOriginal(file);
}

// ── Upload events ──
fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  handleFile(e.dataTransfer.files[0]);
});

// ── Button events ──
segBtn.addEventListener('click',     () => runSegmentation(imageFile));
retryBtn.addEventListener('click',   () => runSegmentation(imageFile));
newImageBtn.addEventListener('click', () => {
  imageFile = null;
  resetToUpload();
});
changeImgBtn.addEventListener('click', () => fileInput.click());

// ── Service worker ──
registerSW();
