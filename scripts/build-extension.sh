#!/bin/bash
# Build script for Chrome extension

set -e

echo "🔨 Building Fast Video OCR Chrome Extension..."
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if extension directory exists
if [ ! -d "extension" ]; then
    echo "❌ Error: extension/ directory not found"
    exit 1
fi

# Check required files
echo "📋 Checking required files..."
REQUIRED_FILES=(
    "extension/manifest.json"
    "extension/content.js"
    "extension/background.js"
    "extension/overlay.js"
    "extension/popup.html"
    "extension/popup.js"
    "extension/styles.css"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing: $file"
        exit 1
    fi
    echo "  ✓ $file"
done

echo ""

# Check for icons (optional but recommended)
if [ ! -f "extension/icons/icon16.png" ] || \
   [ ! -f "extension/icons/icon48.png" ] || \
   [ ! -f "extension/icons/icon128.png" ]; then
    echo "⚠️  Warning: Icon files not found (extension will work but show default icon)"
    echo "   Add icons to extension/icons/ for better appearance"
    echo ""
fi

# Clean old builds
echo "🧹 Cleaning old builds..."
rm -f video-ocr-extension.zip
rm -f extension.crx
echo "  ✓ Cleaned"
echo ""

# Create ZIP package
echo "📦 Creating ZIP package..."
cd extension

zip -r ../video-ocr-extension.zip . \
    -x "icons/README.md" \
    -x "*.DS_Store" \
    -x "*__pycache__*" \
    -x "*.pyc" \
    -x "*.pyo" \
    > /dev/null 2>&1

cd ..

# Check if ZIP was created
if [ -f "video-ocr-extension.zip" ]; then
    SIZE=$(du -h video-ocr-extension.zip | cut -f1)
    echo "  ✓ Package created: video-ocr-extension.zip ($SIZE)"
else
    echo "  ❌ Failed to create package"
    exit 1
fi

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Package location: $(pwd)/video-ocr-extension.zip"
echo ""
echo "To install in Chrome:"
echo "  1. Open chrome://extensions/"
echo "  2. Enable 'Developer mode' (toggle top right)"
echo "  3. Click 'Load unpacked'"
echo "  4. Select the extension/ folder"
echo ""
echo "Or to install from ZIP:"
echo "  1. Unzip video-ocr-extension.zip"
echo "  2. Follow steps above with unzipped folder"
echo ""
