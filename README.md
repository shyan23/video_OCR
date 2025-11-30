# ⚡ Fast Video OCR - Extract Text from Video Frames

Speed-optimized Chrome extension + Python backend for extracting text from video frames using Tesseract OCR.

---

## 📋 Features

- ✅ Extract text from any HTML5 video (YouTube, Twitch, Zoom, local files)
- ✅ Client-side preprocessing (grayscale + contrast) for 66% smaller uploads
- ✅ Fast Tesseract OCR (40-80ms processing time)
- ✅ Auto-copy to clipboard
- ✅ Keyboard shortcuts (Alt+Shift+S to activate)
- ✅ Works with SD/720p and HD video
- ✅ Privacy-focused (no data storage, no analytics)

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+ with pip
- Tesseract OCR 5.x
- Chrome/Chromium browser
- Node.js (optional, for development)

### 1. Install Tesseract OCR

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-eng libtesseract-dev
```

**macOS:**
```bash
brew install tesseract
```

**Windows:**
Download installer from https://github.com/UB-Mannheim/tesseract/wiki

Verify installation:
```bash
tesseract --version
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will start at `http://localhost:8000`

### 3. Load Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. Extension should appear in your toolbar

### 4. Test It Out

1. Open any YouTube video
2. Press `Alt+Shift+S` to activate overlay
3. Click and drag to select text region
4. Release to capture and extract text
5. Text is auto-copied to clipboard and shown in popup

---

## 📁 Project Structure

```
video_reader/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── preprocessor.py      # Image preprocessing (Otsu + sharpen)
│   ├── ocr_engine.py        # Tesseract OCR wrapper
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile          # Docker build file
├── extension/
│   ├── manifest.json        # Extension configuration
│   ├── content.js          # Video detection script
│   ├── overlay.js          # Selection UI + frame capture
│   ├── background.js       # Backend communication
│   ├── popup.html          # Results display
│   ├── popup.js            # Popup logic
│   └── styles.css          # Overlay styling
└── plans/
    ├── blueprint.md                # Original design (accuracy-focused)
    ├── blueprint-optimized.md      # Speed-optimized design
    ├── blueprint-streaming.md      # Streaming + continuous mode
    └── WHICH_BLUEPRINT.md          # Blueprint comparison
```

---

## 🔧 Configuration

### Backend API URL

The extension defaults to `http://localhost:8000`. To change:

1. Click extension icon to open popup
2. Scroll to "Settings" section
3. Update "Backend API URL"
4. Connection status will update automatically

### OCR Modes

The backend supports multiple OCR endpoints:

| Endpoint | Speed | Accuracy | Use Case |
|----------|-------|----------|----------|
| `/ocr` (default) |
| `/ocr/accurate`  
| `/ocr/code`
| `/ocr/confidence` 

To use a different mode, modify `background.js`:
```javascript
const response = await fetch(`${API_URL}/ocr/accurate`, { ... });
```

---

## 🎹 Keyboard Shortcuts

- `Alt+Shift+S` - Activate overlay (start selection)
- `Alt+Shift+D` - Deactivate overlay (stop selection)

---

## 🐳 Docker Deployment

```bash
cd backend

# Build image
docker build -t video-ocr-backend .

# Run container
docker run -p 8000:8000 video-ocr-backend
```

Access at `http://localhost:8000`

---

## 📊 Performance Metrics

### Client-Side Processing 
1. Capture video frame:
2. Scale down (if >1000px):
3. Convert to grayscale: 
4. Boost contrast: 
5. Encode to WebP: 

### Network
- Upload size: 2-15KB (grayscale WebP at 0.85 quality)
- Depends on connection speed

### Backend Processing 
1. Otsu threshold:
2. Light sharpen: 
3. Tesseract OCR (OEM 1, PSM 3):

---


## 📈 Optimization Tips

### For Better Speed

1. Use default `/ocr` endpoint (fastest)
2. Keep selections under 1000px width (auto-scales)
3. Use WebP format (already default)
4. Run backend locally (avoid network latency)

### For Better Accuracy

1. Use `/ocr/accurate` endpoint
2. Pause video before capturing (avoid motion blur)
3. Select text-only regions (no backgrounds)
4. Use HD video when possible
5. Increase contrast in video player if text is faint

---

## 🛠️ Development

### Run Backend in Development Mode

```bash
cd backend
uvicorn main:app --reload --log-level debug
```

### Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# Test OCR with image
curl -X POST http://localhost:8000/ocr \
  -F "file=@test_image.png"
```

### Reload Extension

After making changes to extension code:
1. Go to `chrome://extensions/`
2. Click reload icon on your extension
3. Refresh any open video pages

---

## 📝 API Documentation

Once backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 🔒 Privacy & Security

- ✅ No data storage (all processing in-memory)
- ✅ No analytics or tracking
- ✅ No external API calls
- ✅ Runs locally on your machine
- ✅ No user accounts or authentication
- ✅ Images deleted immediately after processing

---

## 🚧 Known Limitations

- Motion blur: May reduce accuracy if video is playing
- Very small text: OCR accuracy drops for text <16px height
- Handwriting: Not optimized for handwritten text
- Complex backgrounds: Works best with solid backgrounds
- Non-Latin characters: Requires additional Tesseract language packs

---

## 🎯 Future Enhancements

See `plans/blueprint-streaming.md` for planned features:

- [ ] WebSocket connection (eliminate connection overhead)
- [ ] Continuous monitoring mode (auto-capture when text changes)
- [ ] Burst capture mode (rapid multiple selections)
- [ ] Motion handling (multi-frame capture for sharpness)
- [ ] Request queue with worker pool
- [ ] Progressive OCR (show quick preview, then full result)

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📧 Support

For issues or questions:
1. Check troubleshooting section above
2. Review API docs at `/docs`
3. Open an issue on GitHub

---

## ⚡ Quick Command Reference

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Docker
docker build -t video-ocr-backend .
docker run -p 8000:8000 video-ocr-backend

# Test
curl http://localhost:8000/health
curl -X POST http://localhost:8000/ocr -F "file=@image.png"
```

---

**Made with ⚡ for speed and 🎯 for accuracy**
