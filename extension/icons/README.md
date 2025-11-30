# Extension Icons

You need to add icon images in the following sizes:

- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension management)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Quick Icon Creation

### Option 1: Use an online icon generator
- Visit https://www.favicon-generator.org/
- Upload an image or create one
- Download icons in required sizes

### Option 2: Use ImageMagick (if installed)
```bash
# Create simple colored squares as placeholders
convert -size 16x16 xc:#667eea icon16.png
convert -size 48x48 xc:#667eea icon48.png
convert -size 128x128 xc:#667eea icon128.png
```

### Option 3: Placeholder Text Icons
Create simple text-based icons with a solid background color (#667eea purple).

The extension will work without icons, but Chrome will show a default placeholder.

## Recommended Design

- Use a lightning bolt (⚡) or OCR-related symbol
- Colors: Purple gradient (#667eea to #764ba2)
- Style: Modern, flat design
- Ensure good contrast for visibility
