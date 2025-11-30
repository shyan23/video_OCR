# 🎯 Which Blueprint Should You Use?

You have **3 blueprints** now. Here's how to choose:

---

## 📁 Blueprint Files

### 1. **blueprint.md** (Original - Accuracy Focused)
- **Target:** 95%+ accuracy
- **Speed:** 215-365ms per capture
- **Use for:** HD/4K video, critical accuracy needed

### 2. **blueprint-optimized.md** (Speed Optimized)
- **Target:** 88-92% accuracy, 130-212ms per capture
- **Use for:** SD/720p video, speed is priority

### 3. **blueprint-streaming.md** (Real-Time Streaming) ⭐ **RECOMMENDED FOR YOU**
- **Target:** All your requirements
- **Speed:** 122-182ms single, 2.5s for 20 captures
- **Features:**
  - ✅ Continuous monitoring mode
  - ✅ Capture while video playing
  - ✅ High-frequency burst mode (20+)
  - ✅ WebSocket for zero connection overhead
  - ✅ Works with live streams, VOD, video calls

---

## 🔍 Quick Decision Tree

```
Do you need continuous monitoring (auto-capture when text changes)?
├─ YES → Use blueprint-streaming.md ⭐
└─ NO
    └─ Will you capture 10+ times per session?
        ├─ YES → Use blueprint-streaming.md ⭐
        └─ NO
            └─ Do you need to capture while video is playing?
                ├─ YES → Use blueprint-streaming.md ⭐
                └─ NO
                    └─ Is video quality SD/720p or lower?
                        ├─ YES → Use blueprint-optimized.md
                        └─ NO (HD/4K) → Use blueprint.md
```

---

## 📊 Feature Comparison

| Feature | blueprint.md | blueprint-optimized.md | blueprint-streaming.md |
|---------|-------------|----------------------|---------------------|
| **Performance** |
| Single capture | 215-365ms | 130-212ms | 122-182ms |
| 20 captures | 4,300-7,300ms | 2,600-4,240ms | 2,500-3,500ms |
| **Accuracy** |
| SD/720p | 92-95% | 88-92% | 88-92% |
| HD/1080p+ | 95-98% | 92-95% | 92-95% |
| **Features** |
| Manual capture | ✅ | ✅ | ✅ |
| Continuous monitoring | ❌ | ❌ | ✅ |
| Burst mode | ❌ | ❌ | ✅ |
| Motion handling | ❌ | ❌ | ✅ |
| WebSocket | ❌ | ❌ | ✅ |
| Worker pool | ❌ | ❌ | ✅ (3 workers) |
| **Complexity** |
| Implementation | Simple | Simple | Moderate |
| Backend | FastAPI + HTTP | FastAPI + HTTP | FastAPI + WebSocket + Queue |
| Client | Basic | Basic + preprocessing | Advanced modes |

---

## ✅ My Recommendation for Your Use Case

**Use `blueprint-streaming.md`** because you need:

1. ✅ **"Real-time streaming"** - The streaming blueprint has motion handling for live video
2. ✅ **"20+ captures AND continuous monitoring"** - Only streaming blueprint supports this
3. ✅ **"All video types"** (live, VOD, video calls) - Streaming blueprint is universal
4. ✅ **"Capture while playing"** - Motion handling in streaming blueprint

**Why not the others:**
- `blueprint.md`: Too slow for high-frequency, no continuous mode
- `blueprint-optimized.md`: Fast but no continuous monitoring, no burst mode

---

## 🚀 Implementation Order

### Phase 1: Basic Speed-Optimized (Week 1)
Start with `blueprint-optimized.md` to get something working fast:
- Implement client-side grayscale + WebP
- Implement fast backend (Otsu + Tesseract OEM 1)
- Test single capture performance

### Phase 2: Add Streaming Features (Week 2)
Upgrade to `blueprint-streaming.md`:
- Add WebSocket connection
- Implement continuous monitoring mode
- Add frame differencing (perceptual hash)

### Phase 3: Advanced Features (Week 3)
Complete the streaming blueprint:
- Add motion handling (multi-frame capture)
- Implement request queue + worker pool
- Add burst mode

**Total implementation:** 2-3 weeks for full streaming version

---

## 📝 Quick Start Code Comparison

### Basic (blueprint-optimized.md)
```javascript
// Client
captureFrame() → grayscale → WebP → fetch('/ocr')
```

```python
# Backend
@app.post("/ocr")
async def ocr(file):
    return {"text": ocr_engine(file)}
```

### Streaming (blueprint-streaming.md)
```javascript
// Client - Continuous mode
monitor.start() → capture every 500ms → check if changed → WebSocket send
```

```python
# Backend
@app.websocket("/ws")
async def ws(websocket):
    ocr_queue.put(request)  # Queue
    workers process in parallel  # 3 workers
    return result
```

**Difference:** Streaming adds ~200 lines of code but handles all your advanced requirements.

---

## 💡 Migration Path

You can start simple and upgrade:

1. **Start:** Implement `blueprint-optimized.md` (simplest)
   - Get basic OCR working
   - Test performance

2. **Add:** WebSocket from `blueprint-streaming.md`
   - Replace HTTP with WebSocket
   - Immediate speed boost for multiple captures

3. **Add:** Continuous monitoring
   - Implement frame differencing
   - Enable auto-capture mode

4. **Add:** Motion handling
   - Multi-frame capture
   - Sharpness detection

**Each step is independent and adds value**

---

## 🎯 Final Answer: Use `blueprint-streaming.md`

It's the only one that meets ALL your requirements:
- ✅ Real-time streaming support
- ✅ Capture while playing (motion handling)
- ✅ Continuous monitoring (auto-capture on changes)
- ✅ High-frequency (20+ captures with burst mode)
- ✅ Fast (122-182ms single, 2.5s for 20)
- ✅ Universal (works with all video sources)

The extra complexity is worth it for your use case.
