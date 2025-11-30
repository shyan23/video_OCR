"""
OCR engine using Tesseract 5 with optimized configuration.
Deterministic, fast, and accurate for code/text extraction.
"""

import pytesseract
from PIL import Image
import numpy as np
from typing import Dict, Optional, Any


def extract_text_fast(processed_image: np.ndarray) -> str:
    """
    Fast Tesseract OCR optimized for mixed content (code + text).
    Best for SD/720p quality with speed priority.

    Config:
    - OEM 1: LSTM only (20-30% faster than OEM 3)
    - PSM 3: Fully automatic page segmentation (best for mixed content)
    - No character whitelist (faster, better for varied content)

    Args:
        processed_image: Preprocessed grayscale numpy array

    Returns:
        Extracted text as string

    Processing time: ~40-80ms
    """
    # Convert numpy array to PIL Image
    pil_img = Image.fromarray(processed_image)

    # SPEED-OPTIMIZED CONFIG
    config = (
        '--oem 1 '  # LSTM only (faster than OEM 3 which uses both legacy + LSTM)
        '--psm 3 '  # Fully automatic page segmentation (handles mixed content)
        '-c tessedit_do_invert=0 '  # Skip invert check (faster)
    )

    # Extract text
    text = pytesseract.image_to_string(pil_img, config=config)

    return text.strip()


def extract_text_accurate(processed_image: np.ndarray) -> str:
    """
    Higher accuracy OCR with both legacy and LSTM engines.
    Use when accuracy is more important than speed.

    Config:
    - OEM 3: Both legacy + LSTM (slower but more accurate)
    - PSM 6: Assume uniform block of text (good for code snippets)
    - Character whitelist: Restrict to code/text characters

    Processing time: ~80-150ms (2x slower than fast mode)
    """
    pil_img = Image.fromarray(processed_image)

    # ACCURACY-OPTIMIZED CONFIG
    config = (
        '--oem 3 '  # Both legacy and LSTM engines
        '--psm 6 '  # Assume uniform block of text
        '-c tessedit_char_whitelist='
        '0123456789'
        'abcdefghijklmnopqrstuvwxyz'
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        '!@#$%^&*()_+-=[]{}|;:,.<>?/~` \n\t\'"'
    )

    text = pytesseract.image_to_string(pil_img, config=config)

    return text.strip()


def extract_text_with_confidence(processed_image: np.ndarray) -> Dict[str, Any]:
    """
    Extract text with confidence scores for each word.
    Useful for filtering low-confidence results.

    Returns:
        Dict with 'text', 'confidence', and 'words' (list of dicts)
    """
    pil_img = Image.fromarray(processed_image)

    # Get detailed data with confidence scores
    data = pytesseract.image_to_data(
        pil_img,
        config='--oem 1 --psm 3',
        output_type=pytesseract.Output.DICT
    )

    # Extract words with confidence > 60
    words = []
    for i in range(len(data['text'])):
        conf = int(data['conf'][i])
        text = data['text'][i].strip()

        if conf > 60 and text:  # Filter low confidence
            words.append({
                'text': text,
                'confidence': conf,
                'box': {
                    'x': data['left'][i],
                    'y': data['top'][i],
                    'width': data['width'][i],
                    'height': data['height'][i]
                }
            })

    # Combine all words
    full_text = ' '.join([w['text'] for w in words])

    # Calculate average confidence
    avg_conf = sum([w['confidence'] for w in words]) / len(words) if words else 0

    return {
        'text': full_text,
        'confidence': round(avg_conf, 2),
        'words': words,
        'word_count': len(words)
    }


def extract_code(processed_image: np.ndarray) -> str:
    """
    Optimized for code extraction specifically.
    Preserves indentation and formatting.

    Config:
    - PSM 4: Single column of text (preserves line breaks)
    - Preserve whitespace
    """
    pil_img = Image.fromarray(processed_image)

    config = (
        '--oem 1 '
        '--psm 4 '  # Single column of text (good for code)
        '-c preserve_interword_spaces=1 '  # Keep spacing for indentation
    )

    text = pytesseract.image_to_string(pil_img, config=config)

    return text.rstrip()  # Remove trailing whitespace only


def get_tesseract_version() -> str:
    """
    Get installed Tesseract version.
    Useful for debugging.
    """
    try:
        version = pytesseract.get_tesseract_version()
        return str(version)
    except Exception as e:
        return f"Error: {str(e)}"


def test_tesseract_installation() -> Dict[str, Any]:
    """
    Test if Tesseract is properly installed and configured.

    Returns:
        Dict with status, version, and available languages
    """
    try:
        version = pytesseract.get_tesseract_version()

        # Get available languages
        langs = pytesseract.get_languages()

        return {
            'status': 'ok',
            'version': str(version),
            'languages': langs,
            'eng_available': 'eng' in langs
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'message': 'Tesseract not installed or not in PATH'
        }
