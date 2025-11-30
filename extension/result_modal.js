/**
 * Modal UI for displaying OCR results.
 * Features: Draggable, Copy to Clipboard, Retry with High Accuracy.
 */
class ResultModal {
    constructor() {
        this.modal = null;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.initialLeft = 0;
        this.initialTop = 0;
    }

    /**
     * Create and show the modal with results
     */
    show(result, onRetry) {
        this.remove(); // Remove existing if any

        // Create modal container
        this.modal = document.createElement('div');
        this.modal.className = 'video-ocr-modal';
        this.modal.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      background: #1a1a1a;
      color: #ffffff;
      border: 1px solid #333;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      z-index: 9999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      backdrop-filter: blur(10px);
    `;

        // Header (Draggable)
        const header = document.createElement('div');
        header.style.cssText = `
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      user-select: none;
    `;
        header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: 600; font-size: 14px;">Extracted Text</span>
        <span style="font-size: 11px; color: #888; background: #333; padding: 2px 6px; border-radius: 4px;">
          ${result.mode === 'quality' ? 'High Accuracy' : 'Fast Mode'}
        </span>
      </div>
      <button id="ocr-close-btn" style="background: none; border: none; color: #888; cursor: pointer; padding: 4px; font-size: 18px; line-height: 1;">&times;</button>
    `;

        // Content
        const content = document.createElement('div');
        content.style.cssText = `
      padding: 16px;
    `;

        // Text Area
        const textarea = document.createElement('textarea');
        textarea.value = result.text;
        textarea.style.cssText = `
      width: 100%;
      height: 150px;
      background: #0f0f0f;
      border: 1px solid #333;
      border-radius: 8px;
      color: #e0e0e0;
      padding: 12px;
      font-family: "Menlo", "Monaco", "Courier New", monospace;
      font-size: 13px;
      line-height: 1.5;
      resize: vertical;
      margin-bottom: 16px;
      box-sizing: border-box;
      outline: none;
    `;
        textarea.addEventListener('focus', () => textarea.style.borderColor = '#667eea');
        textarea.addEventListener('blur', () => textarea.style.borderColor = '#333');

        // Actions
        const actions = document.createElement('div');
        actions.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    `;

        // Retry Button (if not already in quality mode)
        if (result.mode !== 'quality' && onRetry) {
            const retryBtn = document.createElement('button');
            retryBtn.textContent = '⚡ Retry High Accuracy';
            retryBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      `;
            retryBtn.onmouseover = () => retryBtn.style.background = 'rgba(255, 255, 255, 0.15)';
            retryBtn.onmouseout = () => retryBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            retryBtn.onclick = () => {
                this.setLoading(true);
                onRetry();
            };
            actions.appendChild(retryBtn);
        }

        // Copy Button
        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy Text';
        copyBtn.style.cssText = `
      background: #667eea;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    `;
        copyBtn.onmouseover = () => copyBtn.style.background = '#5a6fd6';
        copyBtn.onmouseout = () => copyBtn.style.background = '#667eea';
        copyBtn.onclick = () => {
            textarea.select();
            document.execCommand('copy');
            copyBtn.textContent = '✓ Copied!';
            copyBtn.style.background = '#28a745';
            setTimeout(() => {
                copyBtn.textContent = 'Copy Text';
                copyBtn.style.background = '#667eea';
            }, 2000);
        };
        actions.appendChild(copyBtn);

        // Assemble
        content.appendChild(textarea);
        content.appendChild(actions);
        this.modal.appendChild(header);
        this.modal.appendChild(content);
        document.body.appendChild(this.modal);

        // Event Listeners
        header.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDrag.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));

        const closeBtn = this.modal.querySelector('#ocr-close-btn');
        closeBtn.onclick = () => this.remove();

        // Add animation style if not exists
        if (!document.getElementById('video-ocr-styles')) {
            const style = document.createElement('style');
            style.id = 'video-ocr-styles';
            style.textContent = `
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
            document.head.appendChild(style);
        }
    }

    /**
     * Set loading state
     */
    setLoading(isLoading) {
        if (!this.modal) return;

        const content = this.modal.lastElementChild;
        if (isLoading) {
            content.style.opacity = '0.5';
            content.style.pointerEvents = 'none';
            this.modal.style.cursor = 'wait';
        } else {
            content.style.opacity = '1';
            content.style.pointerEvents = 'auto';
            this.modal.style.cursor = 'default';
        }
    }

    /**
     * Remove modal
     */
    remove() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }

    // Dragging logic
    onDragStart(e) {
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;

        const rect = this.modal.getBoundingClientRect();
        this.initialLeft = rect.left;
        this.initialTop = rect.top;

        // Remove right/bottom positioning to allow absolute positioning
        this.modal.style.right = 'auto';
        this.modal.style.bottom = 'auto';
        this.modal.style.left = this.initialLeft + 'px';
        this.modal.style.top = this.initialTop + 'px';
    }

    onDrag(e) {
        if (!this.isDragging || !this.modal) return;

        const dx = e.clientX - this.dragStartX;
        const dy = e.clientY - this.dragStartY;

        this.modal.style.left = (this.initialLeft + dx) + 'px';
        this.modal.style.top = (this.initialTop + dy) + 'px';
    }

    onDragEnd() {
        this.isDragging = false;
    }
}

// Export
window.ResultModal = ResultModal;
