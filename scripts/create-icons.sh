#!/bin/bash
# Create simple placeholder icons for Chrome extension

set -e

echo "🎨 Creating placeholder icons..."

# Create icons directory
mkdir -p extension/icons

cd extension/icons

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "  Using ImageMagick to create icons..."

    # Create icon16.png
    convert -size 16x16 -background "#667eea" -gravity center \
      -font Liberation-Sans-Bold -pointsize 12 -fill white \
      label:"⚡" icon16.png 2>/dev/null || \
    convert -size 16x16 -background "#667eea" -gravity center \
      -font Sans-Bold -pointsize 12 -fill white \
      label:"V" icon16.png

    # Create icon48.png
    convert -size 48x48 -background "#667eea" -gravity center \
      -font Liberation-Sans-Bold -pointsize 32 -fill white \
      label:"⚡" icon48.png 2>/dev/null || \
    convert -size 48x48 -background "#667eea" -gravity center \
      -font Sans-Bold -pointsize 32 -fill white \
      label:"V" icon48.png

    # Create icon128.png
    convert -size 128x128 -background "#667eea" -gravity center \
      -font Liberation-Sans-Bold -pointsize 80 -fill white \
      label:"⚡" icon128.png 2>/dev/null || \
    convert -size 128x128 -background "#667eea" -gravity center \
      -font Sans-Bold -pointsize 80 -fill white \
      label:"V" icon128.png

    echo "  ✓ Icons created with ImageMagick"
else
    echo "  ⚠️  ImageMagick not found"
    echo "  Creating simple colored square icons..."

    # Create simple PNG files using Python
    python3 << 'PYTHON_EOF'
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, text, filename):
    # Create image with purple background
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)

    # Try to use a nice font, fallback to default
    try:
        font_size = size // 2
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
    except:
        font = ImageFont.load_default()

    # Calculate text position (center)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    position = ((size - text_width) // 2, (size - text_height) // 2 - 2)

    # Draw text
    draw.text(position, text, fill='white', font=font)

    # Save
    img.save(filename)
    print(f'  ✓ Created {filename}')

# Create icons
create_icon(16, '⚡', 'icon16.png')
create_icon(48, '⚡', 'icon48.png')
create_icon(128, '⚡', 'icon128.png')
PYTHON_EOF

fi

echo ""
echo "✅ Icons created in extension/icons/"
echo ""
ls -lh icon*.png
echo ""
