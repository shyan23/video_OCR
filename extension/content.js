/**
 * Content script - PRODUCTION VERSION with OCR
 */

console.log('🔵 [Video OCR] Content script loaded on:', window.location.href);

let overlayActive = false;
let selectionOverlay = null;
let selectionBox = null;
let startX = 0, startY = 0;
let isSelecting = false;
let videoElement = null;

/**
 * Find first video element on page
 */
function findVideo() {
  const videos = document.querySelectorAll('video');
  if (videos.length > 0) {
    console.log('📹 [Video OCR] Found video element');
    return videos[0];
  }
  console.log('⚠️ [Video OCR] No video found');
  return null;
}

/**
 * Activate OCR overlay
 */
function activateOverlay() {
  if (overlayActive) {
    console.log('⚠️ [Video OCR] Overlay already active');
    return;
  }

  videoElement = findVideo();
  if (!videoElement) {
    showMessage('No video found on this page!', 'error');
    return;
  }

  console.log('🟢 [Video OCR] Activating overlay...');

  // Create overlay
  selectionOverlay = document.createElement('div');
  selectionOverlay.id = 'video-ocr-overlay';
  selectionOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999998;
    cursor: crosshair;
  `;

  // Create selection box
  selectionBox = document.createElement('div');
  selectionBox.style.cssText = `
    position: absolute;
    border: 2px solid #667eea;
    background: rgba(102, 126, 234, 0.2);
    display: none;
    pointer-events: none;
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
  `;
  selectionOverlay.appendChild(selectionBox);

  // Add instructions
  const instructions = document.createElement('div');
  instructions.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    z-index: 999999;
    font-size: 14px;
  `;
  instructions.innerHTML = `
    <strong>⚡ Video OCR Active</strong><br>
    Click and drag to select text region<br>
    Press <code style="background: #667eea; padding: 2px 6px; border-radius: 3px;">Esc</code> to cancel
  `;
  selectionOverlay.appendChild(instructions);

  // Event listeners
  selectionOverlay.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keydown', onKeyDown);

  document.body.appendChild(selectionOverlay);
  overlayActive = true;

  // Auto-hide instructions after 3 seconds
  setTimeout(() => {
    if (instructions.parentElement) {
      instructions.style.transition = 'opacity 0.5s';
      instructions.style.opacity = '0';
      setTimeout(() => instructions.remove(), 500);
    }
  }, 3000);
}

/**
 * Deactivate overlay
 */
function deactivateOverlay() {
  if (!overlayActive) return;

  console.log('🔴 [Video OCR] Deactivating overlay...');

  if (selectionOverlay) {
    selectionOverlay.remove();
    selectionOverlay = null;
  }

  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('keydown', onKeyDown);

  overlayActive = false;
  isSelecting = false;
}

/**
 * Mouse down - start selection
 */
function onMouseDown(e) {
  isSelecting = true;
  startX = e.clientX;
  startY = e.clientY;

  selectionBox.style.left = startX + 'px';
  selectionBox.style.top = startY + 'px';
  selectionBox.style.width = '0px';
  selectionBox.style.height = '0px';
  selectionBox.style.display = 'block';

  e.preventDefault();
}

/**
 * Mouse move - draw selection
 */
function onMouseMove(e) {
  if (!isSelecting) return;

  const currentX = e.clientX;
  const currentY = e.clientY;

  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  const left = Math.min(currentX, startX);
  const top = Math.min(currentY, startY);

  selectionBox.style.left = left + 'px';
  selectionBox.style.top = top + 'px';
  selectionBox.style.width = width + 'px';
  selectionBox.style.height = height + 'px';
}

/**
 * Mouse up - capture selection
 */
function onMouseUp(e) {
  if (!isSelecting) return;

  isSelecting = false;

  const width = parseInt(selectionBox.style.width);
  const height = parseInt(selectionBox.style.height);

  // Validate minimum size
  if (width < 20 || height < 20) {
    console.log('⚠️ [Video OCR] Selection too small');
    selectionBox.style.display = 'none';
    return;
  }

  // Get selection coordinates
  const selection = {
    x: parseInt(selectionBox.style.left),
    y: parseInt(selectionBox.style.top),
    width: width,
    height: height
  };

  console.log('📸 [Video OCR] Capturing selection:', selection);

  // Show loading
  showMessage('Processing...', 'info');

  // Capture frame
  captureFrame(selection);
}

/**
 * Keyboard handler
 */
function onKeyDown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    deactivateOverlay();
  }
}

/**
 * Capture video frame with optimized preprocessing
 */
let lastSelection = null;
let resultModal = null;

/**
 * Capture video frame with optimized preprocessing
 */
async function captureFrame(selection) {
  lastSelection = selection; // Store for retry

  try {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', {
      willReadFrequently: false,
      alpha: false
    });

    // Scale down if too large
    const MAX_WIDTH = 1920; // Increased for better OCR
    let targetWidth = selection.width;
    let targetHeight = selection.height;

    if (selection.width > MAX_WIDTH) {
      const scale = MAX_WIDTH / selection.width;
      targetWidth = MAX_WIDTH;
      targetHeight = Math.round(selection.height * scale);
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Draw video to canvas
    const videoRect = videoElement.getBoundingClientRect();
    const scaleX = videoElement.videoWidth / videoRect.width;
    const scaleY = videoElement.videoHeight / videoRect.height;

    const sourceX = (selection.x - videoRect.left) * scaleX;
    const sourceY = (selection.y - videoRect.top) * scaleY;
    const sourceWidth = selection.width * scaleX;
    const sourceHeight = selection.height * scaleY;

    ctx.drawImage(
      videoElement,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, targetWidth, targetHeight
    );

    // Convert to grayscale
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = gray;
    }

    // Boost contrast
    const contrast = 1.3;
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = data[i];
      data[i + 2] = data[i];
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        console.log('✅ [Video OCR] Frame captured:', blob.size, 'bytes');
        sendToBackend(blob);
      } else {
        showMessage('Failed to capture frame', 'error');
        deactivateOverlay();
      }
    }, 'image/webp', 0.85);

  } catch (error) {
    console.error('❌ [Video OCR] Capture error:', error);
    showMessage('Error: ' + error.message, 'error');
  }
}

/**
 * Send to backend for OCR
 */
async function sendToBackend(blob, mode = 'fast') {
  // Check if extension context is valid
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
    console.error('❌ [Video OCR] Extension context invalidated. Please refresh the page.');
    deactivateOverlay();
    showMessage('Extension disconnected. Please refresh the page (F5) and try again.', 'error');
    return;
  }

  try {
    // Convert blob to ArrayBuffer for message passing
    // Blobs cannot be directly serialized in chrome.runtime.sendMessage
    const arrayBuffer = await blob.arrayBuffer();

    chrome.runtime.sendMessage(
      {
        action: 'ocr_request',
        imageData: Array.from(new Uint8Array(arrayBuffer)),
        mimeType: blob.type,
        mode: mode
      },
      (response) => {
        // Check for runtime error (e.g. connection closed)
        if (chrome.runtime.lastError) {
          console.error('❌ [Video OCR] Runtime error:', chrome.runtime.lastError.message);
          deactivateOverlay();
          showMessage('Extension error: ' + chrome.runtime.lastError.message, 'error');
          return;
        }

        deactivateOverlay();

        if (response && response.success) {
          console.log('✅ [Video OCR] Success:', response.text?.substring(0, 50) + '...');

          // Show result in modal
          if (!resultModal && window.ResultModal) {
            resultModal = new ResultModal();
          }

          if (resultModal) {
            resultModal.show(response, () => {
              // Retry with high accuracy
              console.log('⚡ [Video OCR] Retrying with high accuracy...');
              if (lastSelection) {
                // Re-capture with quality mode
                // Note: We need to pass 'quality' to sendToBackend, but captureFrame calls sendToBackend with default.
                // We'll modify captureFrame to accept a callback or handle this better.
                // For now, let's just re-run capture and hack the mode in sendToBackend call inside captureFrame?
                // Better: Modify captureFrame to return a promise or accept mode.
                // But captureFrame is async and uses callback for toBlob.
                // Let's just manually call sendToBackend with the same blob? No, we might want to re-capture if video changed?
                // Usually video is paused or we want the same frame.
                // Let's just re-send the SAME blob with 'quality' mode for now, assuming the blob is still valid?
                // Actually, the blob is from the canvas. We can just re-send it.
                sendToBackend(blob, 'quality');
              }
            });
          } else {
            // Fallback if modal not loaded
            showMessage('✓ Text extracted and copied!', 'success');
          }

        } else {
          console.error('❌ [Video OCR] Error:', response?.error);
          showMessage('Error: ' + (response?.error || 'Unknown error'), 'error');
        }
      }
    );
  } catch (error) {
    console.error('❌ [Video OCR] Send error:', error);
    deactivateOverlay();
    showMessage('Error: ' + error.message, 'error');
  }
}

/**
 * Show toast message
 */
function showMessage(text, type = 'info') {
  const colors = {
    success: '#28a745',
    error: '#dc3545',
    info: '#667eea'
  };

  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 9999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease-out;
  `;
  toast.textContent = text;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Keyboard shortcut: Alt+Shift+S
 */
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.shiftKey && e.key.toLowerCase() === 's') {
    e.preventDefault();
    console.log('⌨️ [Video OCR] Hotkey triggered');

    if (!overlayActive) {
      activateOverlay();
    }
  }
}, true);

console.log('✅ [Video OCR] Ready! Press Alt+Shift+S to start');

// Check for videos after page load
setTimeout(() => {
  const videos = document.querySelectorAll('video');
  console.log(`📹 [Video OCR] Found ${videos.length} video(s)`);
}, 1000);

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'copy_to_clipboard') {
    // Copy text to clipboard using content script's DOM access
    navigator.clipboard.writeText(message.text)
      .then(() => {
        console.log('📋 [Video OCR] Copied to clipboard:', message.text.substring(0, 50) + '...');
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('❌ [Video OCR] Clipboard error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});
