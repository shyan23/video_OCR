# 📦 Building Chrome Extension Package

## Method 1: Load Unpacked (Development) - FASTEST

**Use this for testing and development:**

1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right corner)
3. Click **"Load unpacked"**
4. Navigate to and select the `extension/` folder
5. Extension is now installed and ready to use!

**To reload after making changes:**
- Go to `chrome://extensions/`
- Click the refresh icon on your extension
- Refresh any open video pages

---

## Method 2: Create ZIP Package (For Sharing)

**Create a ZIP file to share with others:**

### Option A: Using Command Line

```bash
cd /home/shyan/Desktop/Code/video_reader

# Create ZIP package
zip -r video-ocr-extension.zip extension/ -x "extension/icons/README.md" -x "*.DS_Store" -x "*__pycache__*"
```

The ZIP file `video-ocr-extension.zip` is now ready to share.

**Others can install it by:**
1. Unzip the file
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the unzipped `extension` folder

### Option B: Manual ZIP Creation

1. Go to `/home/shyan/Desktop/Code/video_reader/`
2. Right-click the `extension` folder
3. Select "Compress" or "Create Archive"
4. Choose ZIP format
5. Name it `video-ocr-extension.zip`

---

## Method 3: Create CRX File (Chrome Package)

**For more formal distribution:**

### Step 1: Generate Extension ID and Key

```bash
cd /home/shyan/Desktop/Code/video_reader/extension

# Chrome will generate a private key when you first load the unpacked extension
# The key is stored in: ~/.config/google-chrome/Default/Extensions/[EXTENSION_ID]
```

### Step 2: Pack Extension in Chrome

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click **"Pack extension"**
4. Set "Extension root directory" to: `/home/shyan/Desktop/Code/video_reader/extension`
5. Leave "Private key file" blank (first time) or select existing key
6. Click "Pack Extension"

**Output:**
- `extension.crx` - The packaged extension
- `extension.pem` - Private key (keep this safe!)

### Step 3: Install CRX File

**Users can install the .crx file by:**
- Dragging it to `chrome://extensions/` (may not work in newer Chrome)
- Or using the unpacked method (more reliable)

---

## Method 4: Publish to Chrome Web Store (Official)

**For public distribution:**

1. **Prepare Extension:**
   - Add proper icons (16x16, 48x48, 128x128)
   - Test thoroughly
   - Write good description

2. **Create Developer Account:**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay one-time $5 registration fee

3. **Upload Extension:**
   - Create ZIP package (Method 2)
   - Click "New Item" in dashboard
   - Upload ZIP file
   - Fill in store listing:
     - Name: "Fast Video OCR"
     - Description: "Extract text from video frames with optimized OCR"
     - Screenshots (1280x800 or 640x400)
     - Category: Productivity
   - Submit for review (takes 1-3 days)

4. **After Approval:**
   - Extension gets unique ID
   - Users can install from Chrome Web Store
   - Auto-updates when you publish new versions

---

## Quick Build Script

I'll create an automated build script for you:

```bash
#!/bin/bash
# build-extension.sh

echo "🔨 Building Chrome Extension..."

cd /home/shyan/Desktop/Code/video_reader

# Clean old builds
rm -f video-ocr-extension.zip

# Create ZIP package
zip -r video-ocr-extension.zip extension/ \
  -x "extension/icons/README.md" \
  -x "*.DS_Store" \
  -x "*__pycache__*" \
  -x "*.pyc"

echo "✅ Extension packaged: video-ocr-extension.zip"
echo ""
echo "To install:"
echo "1. Go to chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Unzip and Load unpacked"
```

Save this as `build-extension.sh` and run:
```bash
chmod +x build-extension.sh
./build-extension.sh
```

---

## File Checklist Before Building

Make sure these files exist:

```
extension/
├── manifest.json          ✓
├── content.js            ✓
├── background.js         ✓
├── overlay.js            ✓
├── popup.html            ✓
├── popup.js              ✓
├── styles.css            ✓
└── icons/
    ├── icon16.png        ⚠️ Need to add
    ├── icon48.png        ⚠️ Need to add
    └── icon128.png       ⚠️ Need to add
```

**Extension will work without icons**, but Chrome will show default gray puzzle piece.

---

## Testing Your Build

1. **Load extension:**
   ```bash
   # Open Chrome
   google-chrome chrome://extensions/
   ```

2. **Test on YouTube:**
   - Open any YouTube video
   - Press `Alt+Shift+S`
   - Select text region
   - Check if text is extracted

3. **Check backend connection:**
   - Click extension icon
   - Look for "Connected" status
   - If disconnected, verify backend is running

4. **Test error handling:**
   - Stop backend
   - Try to extract text
   - Should show "Cannot connect to backend" error

---

## Troubleshooting

### "Failed to load extension"
- Check `manifest.json` is valid JSON
- Verify all referenced files exist
- Check console for specific error

### "Manifest version not supported"
- Using Manifest V3 (correct for modern Chrome)
- Update Chrome if using old version

### "Package is invalid"
- Make sure you're zipping the `extension` folder contents
- Don't zip the folder itself, zip what's inside

### Extension icon not showing
- Add icon files to `extension/icons/`
- Or remove icon references from `manifest.json` temporarily

---

## Quick Icon Creation

If you need placeholder icons quickly:

```bash
cd extension/icons

# Create simple colored squares (requires ImageMagick)
convert -size 16x16 -background "#667eea" -gravity center \
  -font Liberation-Sans-Bold -pointsize 10 -fill white \
  label:"V" icon16.png

convert -size 48x48 -background "#667eea" -gravity center \
  -font Liberation-Sans-Bold -pointsize 32 -fill white \
  label:"V" icon48.png

convert -size 128x128 -background "#667eea" -gravity center \
  -font Liberation-Sans-Bold -pointsize 80 -fill white \
  label:"V" icon128.png
```

Or download free icons from:
- https://www.flaticon.com/
- https://icons8.com/
- https://www.iconfinder.com/

---

## Recommended: Load Unpacked for Now

**For development and personal use:**

Just use **Method 1** (Load Unpacked). It's:
- ✅ Fastest to set up
- ✅ Easy to update
- ✅ No packaging needed
- ✅ Perfect for testing

**Only create packages when:**
- Sharing with others
- Publishing to Chrome Web Store
- Deploying to production
