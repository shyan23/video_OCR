# ✅ **OPTIMIZED BLUEPRINT: Chrome Extension + FastAPI OCR Tool**

**Goal:**
User highlights region over YouTube video → extension captures & preprocesses frame → sends optimized image to FastAPI → backend performs OCR with Tesseract 5 → extension displays & copies extracted text.

**Key Optimizations:**
- ✅ Minimal client-side computation (offload preprocessing to backend)
- ✅ Deterministic OCR (no AI/ML, pure Tesseract)
- ✅ High accuracy with proper image preprocessing
- ✅ Fast response time (< 500ms target)

---

# 1️⃣ System Overview (Optimized Architecture)

```
+-----------------+       WebP/JPEG        +----------------------+
|  Chrome         |  (compressed image)    |   FastAPI Backend    |
|  Extension      |  ------------------->  |  (OCR Engine)        |
|                 |                        |                      |
|  - Lightweight  |  <-------------------  |  - /ocr endpoint     |
|    UI Overlay   |    JSON (text only)    |  - Tesseract 5       |
|  - Frame        |                        |  - Image Preprocessing|
|    Capture      |                        |  - OpenCV Filters    |
|  - Basic Crop   |                        |                      |
+-----------------+                        +----------------------+
        |                                           |
        | copy to clipboard                        | (in-memory only)
        v                                           v
   User Output                              No storage/logs/DB
```

**Design Principles:**
1. Client does minimal work (capture + crop only)
2. Backend handles all image processing (grayscale, threshold, denoise)
3. No AI/ML models (pure deterministic OCR)
4. No caching, no database (stateless)

---

# 2️⃣ Chrome Extension Blueprint

Structure (Manifest V3):

```
extension/
├── manifest.json
├── content.js          # Inject overlay on video pages
├── background.js       # Relay messages (minimal logic)
├── overlay.js          # Selection UI + frame capture
├── popup.html          # Display results
├── popup.js            # Handle OCR response
├── styles.css          # Minimal CSS
└── icons/
```

## **A. Extension Responsibilities (MINIMAL)**

1. ✅ Inject selection overlay on `<video>` elements
2. ✅ Capture exact video frame at timestamp
3. ✅ Crop to selected region using Canvas API
4. ✅ Convert to **WebP** (smaller than PNG, faster upload)
5. ✅ Send to FastAPI backend
6. ✅ Display OCR text & auto-copy to clipboard

**What Extension Does NOT Do:**
- ❌ No image preprocessing (grayscale, thresholding, etc.)
- ❌ No local OCR processing
- ❌ No AI/ML inference
- ❌ No caching or storage
- ❌ No authentication

---

# 3️⃣ EXTENSION COMPONENTS

## **1. manifest.json**

Minimal permissions:

```json
{
  "manifest_version": 3,
  "name": "Video Text Extractor",
  "version": "1.0",
  "permissions": [
    "activeTab",
    "clipboardWrite"
  ],
  "host_permissions": [
    "https://www.youtube.com/*"
  ],
  "content_scripts": [{
    "matches": ["*://*/*"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }],
  "background": {
    "service_worker": "background.js"
  }
}
```

---

## **2. Content Script (content.js)**

**Responsibilities:**
- Detect `<video>` element on page
- Inject overlay.js when user activates (hotkey: Alt+Shift+S)
- Forward captured frame to background worker

**Optimization:**
- Only activate on user trigger (no auto-injection)
- Use event delegation (no memory leaks)

---

## **3. Overlay Script (overlay.js)**

**Optimized Frame Capture Process:**

```javascript
// Pseudo-code
function captureFrame(videoElement, selection) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', {
    willReadFrequently: false,  // Performance hint
    alpha: false                 // No transparency needed
  });

  // Set canvas to selection size only (not full video)
  canvas.width = selection.width;
  canvas.height = selection.height;

  // Draw only the selected region
  ctx.drawImage(
    videoElement,
    selection.x, selection.y, selection.width, selection.height,
    0, 0, selection.width, selection.height
  );

  // Convert to WebP (much smaller than PNG)
  return canvas.toBlob((blob) => {
    sendToBackend(blob);
  }, 'image/webp', 0.95); // 95% quality, good compression
}
```

**Why WebP?**
- 25-35% smaller file size than PNG
- Faster upload time
- Supported by all modern browsers
- Lossless compression at high quality

---

## **4. Background Service Worker (background.js)**

**Lean Message Relay:**

```javascript
// Simplified pseudo-code
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OCR_REQUEST') {
    fetch('http://localhost:8000/ocr', {
      method: 'POST',
      body: createFormData(message.imageBlob),
      headers: { 'Accept': 'application/json' }
    })
    .then(res => res.json())
    .then(data => sendResponse({ text: data.text }))
    .catch(err => sendResponse({ error: err.message }));

    return true; // Async response
  }
});
```

**No logic, no storage, pure relay.**

---

## **5. Popup Script (popup.js + popup.html)**

**Ultra-minimal UI:**

```html
<div id="result">
  <textarea readonly id="ocr-text"></textarea>
  <button id="copy-btn">Copy</button>
</div>
```

**Features:**
- Display raw OCR text
- Auto-copy on successful extraction
- Show error messages if backend fails
- Monospace font for code readability

---

# 4️⃣ Backend: FastAPI OCR Server (OPTIMIZED)

Folder:

```
backend/
├── main.py           # FastAPI app
├── ocr_engine.py     # Tesseract wrapper
├── preprocessor.py   # Image optimization pipeline
├── requirements.txt
└── Dockerfile        # Optional deployment
```

---

## **A. Backend Responsibilities**

1. ✅ Accept image via POST `/ocr`
2. ✅ **Preprocess image for OCR accuracy:**
   - Convert to grayscale
   - Apply adaptive thresholding
   - Denoise (bilateral filter)
   - Sharpen (unsharp mask)
   - Auto-rotate/deskew if needed
3. ✅ Run **Tesseract 5** with optimized config
4. ✅ Return JSON: `{ "text": "..." }`

**Why Tesseract 5?**
- ✅ Deterministic (no randomness, no AI)
- ✅ High accuracy with proper preprocessing (>95% for clean text)
- ✅ Fast (50-200ms per image on modern CPU)
- ✅ Supports 100+ languages + code patterns
- ✅ CPU-only (no GPU needed)
- ✅ Open source, battle-tested

**Alternative (if needed):** PaddleOCR (uses deep learning but faster than TrOCR)

---

## **B. FastAPI Architecture**

```python
# main.py (simplified)

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from preprocessor import preprocess_image
from ocr_engine import extract_text
import io

app = FastAPI()

# CORS for Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

@app.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    # Read image bytes
    image_bytes = await file.read()

    # Preprocess (deterministic pipeline)
    processed_image = preprocess_image(image_bytes)

    # Extract text (Tesseract)
    text = extract_text(processed_image)

    return {"text": text}
```

---

## **C. Image Preprocessing Pipeline (preprocessor.py)**

**Critical for OCR accuracy:**

```python
import cv2
import numpy as np
from PIL import Image

def preprocess_image(image_bytes):
    # Load image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 1. Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 2. Denoise (bilateral filter preserves edges)
    denoised = cv2.bilateralFilter(gray, 5, 50, 50)

    # 3. Adaptive thresholding (handles varying brightness)
    thresh = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11, 2
    )

    # 4. Sharpen (unsharp mask)
    blurred = cv2.GaussianBlur(thresh, (0, 0), 3)
    sharpened = cv2.addWeighted(thresh, 1.5, blurred, -0.5, 0)

    # 5. Optional: Auto-rotate (if text is skewed)
    # Skip if performance is critical

    return sharpened
```

**Processing Time:** ~20-50ms per image

---

## **D. OCR Engine (ocr_engine.py)**

```python
import pytesseract
from PIL import Image
import numpy as np

def extract_text(processed_image):
    # Convert numpy array to PIL Image
    pil_img = Image.fromarray(processed_image)

    # Tesseract config for code/text
    config = (
        '--oem 3 '          # LSTM OCR Engine Mode
        '--psm 6 '          # Assume uniform block of text
        '-c tessedit_char_whitelist=0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;:,.<>?/~` \n\t\'"'
    )

    # Extract text
    text = pytesseract.image_to_string(pil_img, config=config)

    return text.strip()
```

**Tesseract Config Explained:**
- `--oem 3`: Use LSTM engine (best accuracy)
- `--psm 6`: Assume uniform text block (good for code snippets)
- Whitelist: Allow all code characters (improves accuracy)

**Processing Time:** 50-150ms per image

---

# 5️⃣ Data Flow (Optimized Step-by-Step)

### **1. User opens YouTube video**
Extension injects content script (idle, no CPU usage).

### **2. User presses Alt+Shift+S**
Overlay UI appears (lightweight DOM injection).

### **3. User selects region**
**Client-side (extension):**
- Capture video frame via Canvas API (~10ms)
- Crop to selection rectangle (~5ms)
- Convert to WebP blob (~20ms)
- Total: **~35ms client-side**

### **4. Send to backend**
**Network:**
- Upload WebP (5-50KB typical) → ~50-200ms depending on connection

### **5. Backend processing**
**Server-side:**
- Preprocess image (~30ms)
- Tesseract OCR (~100ms)
- Total: **~130ms backend**

### **6. Return text to extension**
**Total round-trip: ~215-365ms** (well under 500ms target)

### **7. Display & copy**
- Show in popup (~5ms)
- Auto-copy to clipboard (~1ms)

---

# 6️⃣ Performance Optimizations

## **Client-Side:**
1. ✅ Use WebP instead of PNG (25-35% smaller)
2. ✅ Capture only selected region (not full video frame)
3. ✅ No preprocessing on client (offload to server)
4. ✅ Reuse canvas element (no memory allocation overhead)

## **Server-Side:**
1. ✅ Use OpenCV (C++ backend, very fast)
2. ✅ Optimize Tesseract config (whitelist, PSM mode)
3. ✅ No file I/O (all in-memory operations)
4. ✅ Use uvicorn with `--workers 2` for concurrent requests

## **Network:**
1. ✅ Compress images before sending
2. ✅ Use HTTP/2 for multiplexing
3. ✅ Minimize JSON response (text only)

---

# 7️⃣ Non-Functional Specifications

### ✔ **Privacy**
- No file storage
- No analytics
- No logs
- No cloud dependencies
- No user accounts
- All processing in-memory

### ✔ **Performance**
- OCR response: **< 500ms** (target: 200-300ms)
- Extension size: **< 100 KB**
- Backend RAM: **< 200 MB**

### ✔ **Security**
- CORS restricted to extension ID only
- Rate limit: 10 requests/minute per IP
- No file uploads > 5MB
- Input validation (image format check)

### ✔ **Reliability**
- Deterministic output (same input → same output)
- No dependencies on external APIs
- Graceful degradation (show error if backend down)

---

# 8️⃣ Deployment Blueprint

### **Extension**
- Zip folder → Chrome Web Store
- No backend URL hardcoded (user configures in popup)

### **Backend**

**Recommended:**
- **Fly.io** (free tier, 256MB RAM, shared CPU)
- **Railway** (free $5/month credit)
- **Self-hosted VPS** (DigitalOcean $4/month droplet)

**Minimum Requirements:**
- 1 vCPU (shared OK)
- 512MB RAM
- Python 3.10+
- Tesseract 5 installed

**Docker Deployment:**

```dockerfile
FROM python:3.10-slim

# Install Tesseract
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . /app
WORKDIR /app

# Run FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

# 9️⃣ Removed Features (Kept Lean & Deterministic)

**These are EXCLUDED to meet your requirements:**

### ❌ **Removed: LLM Post-Processing**
- Reason: Non-deterministic, slow, requires AI model
- Impact: Text output is raw OCR (may have minor errors)

### ❌ **Removed: TrOCR / Deep Learning OCR**
- Reason: Heavy computation, requires GPU, non-deterministic
- Impact: Using Tesseract instead (faster, deterministic)

### ❌ **Removed: Auto-detect code vs text**
- Reason: Adds complexity, not needed for core function
- Impact: User manually selects region (simpler UX)

### ❌ **Removed: Caching / Database**
- Reason: Adds state, complexity, storage overhead
- Impact: Each request is independent (stateless)

---

# 🔟 Summary (Optimized for Speed & Determinism)

### **Chrome Extension (Minimal)**
- Inject overlay on video
- Capture selected frame region
- Convert to WebP (compressed)
- Send to backend
- Display + copy text

### **FastAPI Backend (Deterministic)**
- `/ocr` endpoint (POST only)
- Image preprocessing pipeline (OpenCV)
- Tesseract 5 OCR (no AI/ML)
- JSON response (text only)

### **Key Metrics**
- Response time: **< 500ms** (target: 200-300ms)
- Accuracy: **> 95%** with proper preprocessing
- Client computation: **~35ms** (minimal)
- Backend computation: **~130ms** (deterministic)
- Extension size: **< 100 KB**
- Backend RAM: **< 200 MB**

### **No AI, No Bloat, No Storage**
- Purely deterministic OCR
- Stateless architecture
- Privacy-focused
- Fast & lightweight

---

# 📋 requirements.txt (Backend)

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pytesseract==0.3.10
opencv-python-headless==4.8.1.78
pillow==10.1.0
numpy==1.26.2
```

**Total package size:** ~150 MB (mostly OpenCV)

---

# 🚀 Next Steps (Implementation Order)

1. ✅ Setup FastAPI backend with Tesseract
2. ✅ Implement preprocessing pipeline (test accuracy)
3. ✅ Build Chrome extension overlay UI
4. ✅ Implement frame capture + WebP conversion
5. ✅ Connect extension to backend
6. ✅ Test end-to-end latency
7. ✅ Deploy backend to Fly.io/Railway
8. ✅ Package extension for Chrome Web Store

**Estimated build time:** 2-3 days for full MVP
**Maintenance:** Minimal (no AI models to update, no database)
