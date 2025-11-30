/**
 * Overlay UI for video region selection and frame capture.
 * Implements optimized frame capture with client-side preprocessing.
 */

class VideoOCROverlay {
  constructor(videoElement) {
    this.video = videoElement;
    this.overlay = null;
    this.selectionBox = null;
    this.isSelecting = false;
    this.startX = 0;
    this.startY = 0;
    this.isActive = false;
  }

  /**
   * Activate the overlay
   */
  activate() {
    if (this.isActive) return;

    console.log('[Overlay] Activating...');

    // Create overlay container
    this.overlay = document.createElement('div');
    this.overlay.id = 'video-ocr-overlay';
    this.overlay.className = 'video-ocr-overlay';

    // Create selection box
    this.selectionBox = document.createElement('div');
    this.selectionBox.className = 'video-ocr-selection';
    this.overlay.appendChild(this.selectionBox);

    // Position overlay over video
    this.positionOverlay();

    // Add to DOM
    document.body.appendChild(this.overlay);

    // Add event listeners
    this.overlay.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('resize', this.positionOverlay.bind(this));

    // Show instructions
    this.showInstructions();

    this.isActive = true;
  }

  /**
   * Deactivate and remove overlay
   */
  deactivate() {
    if (!this.isActive) return;

    console.log('[Overlay] Deactivating...');

    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    this.isActive = false;
  }

  /**
   * Position overlay to match video dimensions
   */
  positionOverlay() {
    const rect = this.video.getBoundingClientRect();

    this.overlay.style.position = 'fixed';
    this.overlay.style.top = rect.top + 'px';
    this.overlay.style.left = rect.left + 'px';
    this.overlay.style.width = rect.width + 'px';
    this.overlay.style.height = rect.height + 'px';
  }

  /**
   * Show usage instructions
   */
  showInstructions() {
    const instructions = document.createElement('div');
    instructions.className = 'video-ocr-instructions';
    instructions.innerHTML = `
      <div style="background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 5px; margin: 10px;">
        <strong>Video OCR Active</strong><br>
        • Click and drag to select text region<br>
        • Release to capture and extract text<br>
        • Press Alt+Shift+D to deactivate
      </div>
    `;

    this.overlay.appendChild(instructions);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (instructions.parentNode) {
        instructions.remove();
      }
    }, 3000);
  }

  /**
   * Handle mouse down (start selection)
   */
  onMouseDown(event) {
    if (event.target !== this.overlay) return;

    this.isSelecting = true;

    const rect = this.overlay.getBoundingClientRect();
    this.startX = event.clientX - rect.left;
    this.startY = event.clientY - rect.top;

    this.selectionBox.style.left = this.startX + 'px';
    this.selectionBox.style.top = this.startY + 'px';
    this.selectionBox.style.width = '0px';
    this.selectionBox.style.height = '0px';
    this.selectionBox.style.display = 'block';

    event.preventDefault();
  }

  /**
   * Handle mouse move (draw selection)
   */
  onMouseMove(event) {
    if (!this.isSelecting) return;

    const rect = this.overlay.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    const width = Math.abs(currentX - this.startX);
    const height = Math.abs(currentY - this.startY);
    const left = Math.min(currentX, this.startX);
    const top = Math.min(currentY, this.startY);

    this.selectionBox.style.left = left + 'px';
    this.selectionBox.style.top = top + 'px';
    this.selectionBox.style.width = width + 'px';
    this.selectionBox.style.height = height + 'px';
  }

  /**
   * Handle mouse up (capture selection)
   */
  onMouseUp(event) {
    if (!this.isSelecting) return;

    this.isSelecting = false;

    // Get final selection dimensions
    const selection = {
      x: parseInt(this.selectionBox.style.left),
      y: parseInt(this.selectionBox.style.top),
      width: parseInt(this.selectionBox.style.width),
      height: parseInt(this.selectionBox.style.height)
    };

    // Validate selection (minimum 10x10 pixels)
    if (selection.width < 10 || selection.height < 10) {
      console.log('[Overlay] Selection too small, ignoring');
      this.selectionBox.style.display = 'none';
      return;
    }

    console.log('[Overlay] Capturing selection:', selection);

    // Show loading indicator
    this.showLoading(selection);

    // Capture and process frame
    this.captureFrameOptimized(selection)
      .then(blob => {
        console.log('[Overlay] Frame captured, sending to backend...');
        this.sendToBackend(blob);
      })
      .catch(error => {
        console.error('[Overlay] Capture error:', error);
        this.showError('Failed to capture frame');
        this.selectionBox.style.display = 'none';
      });
  }

  /**
   * OPTIMIZED frame capture with client-side preprocessing
   */
  async captureFrameOptimized(selection) {
    return new Promise((resolve, reject) => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', {
          willReadFrequently: false,
          alpha: false,
          desynchronized: true  // Performance hint
        });

        // OPTIMIZATION 1: Scale down if too large (max 1920px width)
        const MAX_WIDTH = 1920;
        let targetWidth = selection.width;
        let targetHeight = selection.height;

        if (selection.width > MAX_WIDTH) {
          const scale = MAX_WIDTH / selection.width;
          targetWidth = MAX_WIDTH;
          targetHeight = Math.round(selection.height * scale);
          console.log(`[Overlay] Scaling down: ${selection.width}x${selection.height} → ${targetWidth}x${targetHeight}`);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw video region to canvas
        ctx.drawImage(
          this.video,
          selection.x, selection.y, selection.width, selection.height,
          0, 0, targetWidth, targetHeight
        );

        // OPTIMIZATION 2: Convert to grayscale (saves 66% upload size)
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          // Grayscale using luminosity method (best for OCR)
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = data[i + 1] = data[i + 2] = gray;
          // Alpha stays 255
        }

        // OPTIMIZATION 3: Boost contrast for low-quality video (SD/720p)
        const contrast = 1.3;
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
          data[i + 1] = data[i];
          data[i + 2] = data[i];
        }

        ctx.putImageData(imageData, 0, 0);

        // OPTIMIZATION 4: WebP at 0.85 quality (good balance)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`[Overlay] Blob created: ${blob.size} bytes`);
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/webp',
          0.85
        );

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send captured frame to backend
   */
  async sendToBackend(blob, mode = 'fast') {
    // Check if extension context is valid
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
      console.error('[Overlay] Extension context invalidated');
      this.showError('Extension disconnected. Please refresh page.');
      return;
    }

    // Send message to background script
    try {
      // Convert blob to ArrayBuffer for message passing
      const arrayBuffer = await blob.arrayBuffer();

      chrome.runtime.sendMessage(
        {
          action: 'ocr_request',
          imageData: Array.from(new Uint8Array(arrayBuffer)),
          mimeType: blob.type,
          mode: mode
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('[Overlay] Runtime error:', chrome.runtime.lastError.message);
            this.showError(chrome.runtime.lastError.message);
            return;
          }

          if (response && response.success) {
            console.log('[Overlay] OCR completed:', response.text);

            // Show result in modal
            if (!this.resultModal) {
              this.resultModal = new ResultModal();
            }

            this.resultModal.show(response, () => {
              // Retry with high accuracy
              console.log('[Overlay] Retrying with high accuracy...');
              this.captureFrameOptimized(this.lastSelection)
                .then(blob => this.sendToBackend(blob, 'quality'));
            });

          } else {
            console.error('[Overlay] OCR failed:', response?.error);
            this.showError(response?.error || 'OCR failed');
          }

          // Hide selection box
          // This is now handled by the ResultModal or retry logic, but we ensure it's hidden if no modal is shown.
          if (!this.resultModal || !this.resultModal.isVisible()) {
            this.selectionBox.style.display = 'none';
          }
        }
      );
    } catch (error) {
      console.error('[Overlay] Send error:', error);
      this.showError('Failed to send request');
    }
  }

  /**
   * Show loading indicator
   */
  showLoading(selection) {
    const loading = document.createElement('div');
    loading.className = 'video-ocr-loading';
    loading.style.position = 'absolute';
    loading.style.left = selection.x + 'px';
    loading.style.top = (selection.y + selection.height + 10) + 'px';
    loading.innerHTML = `
      <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 4px;">
        Processing...
      </div>
    `;
    this.overlay.appendChild(loading);

    // Remove after 5 seconds (timeout)
    setTimeout(() => {
      if (loading.parentNode) {
        loading.remove();
      }
    }, 5000);
  }

  /**
   * Show success message (Legacy - now using Modal)
   */
  showSuccess() {
    // Kept for fallback or small notifications if needed
  }

  /**
   * Show error message
   */
  showError(message) {
    const error = document.createElement('div');
    error.className = 'video-ocr-error';
    error.innerHTML = `
      <div style="background: rgba(200,0,0,0.9); color: white; padding: 12px 16px; border-radius: 4px; position: fixed; top: 20px; right: 20px; z-index: 999999;">
        ✗ Error: ${message}
      </div>
    `;
    document.body.appendChild(error);

    setTimeout(() => {
      if (error.parentNode) {
        error.remove();
      }
    }, 3000);
  }
}

// Export to global scope
window.VideoOCROverlay = VideoOCROverlay;
