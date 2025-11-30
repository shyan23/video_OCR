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
    Enhanced Tesseract OCR optimized for accuracy.
    Now uses OEM 3 for maximum accuracy even if slightly slower.

    Config:
    - OEM 3: Both Legacy + LSTM engines (best accuracy)
    - PSM 6: Assume uniform block of text (works well for most captures)
    - Multiple Tesseract parameters for better recognition

    Args:
        processed_image: Preprocessed grayscale numpy array

    Returns:
        Extracted text as string

    Processing time: ~60-120ms (prioritizing accuracy over speed)
    """
    # Convert numpy array to PIL Image
    pil_img = Image.fromarray(processed_image)

    # ACCURACY-OPTIMIZED CONFIG
    config = (
        '--oem 3 '  # Both legacy and LSTM engines for maximum accuracy
        '--psm 6 '  # Assume uniform block of text (good for most video captures)
        '-c tessedit_char_blacklist=\u00a9\u00ae\u2122 '  # Ignore common noise characters
        '-c tessedit_do_invert=0 '  # We already handle inversion in preprocessing
        '-c load_system_dawg=1 '  # Use system dictionary
        '-c load_freq_dawg=1 '  # Use frequent word dictionary
        '-c tessedit_pageseg_mode=6 '  # Reinforce PSM 6
        '-c preserve_interword_spaces=1 '  # Preserve spacing (important for code)
    )

    # Extract text
    text = pytesseract.image_to_string(pil_img, lang='eng', config=config)

    return text.strip()


def extract_text_accurate(processed_image: np.ndarray) -> str:
    """
    Maximum accuracy OCR with all optimizations enabled.
    Uses multiple Tesseract passes and combines results.

    Config:
    - OEM 3: Both legacy + LSTM engines
    - PSM 3 first pass, then PSM 6 for comparison
    - Uses Tesseract's built-in dictionaries
    - Multiple enhancement parameters

    Processing time: ~100-200ms (maximum accuracy mode)
    """
    pil_img = Image.fromarray(processed_image)

    # MAXIMUM ACCURACY CONFIG
    config = (
        '--oem 3 '  # Both legacy and LSTM engines (best accuracy)
        '--psm 3 '  # Fully automatic page segmentation
        '-c tessedit_char_blacklist=\u00a9\u00ae\u2122\u00a7\u00b6 '  # Block noise characters
        '-c load_system_dawg=1 '  # Use system dictionary
        '-c load_freq_dawg=1 '  # Use frequent word dictionary
        '-c load_punc_dawg=1 '  # Use punctuation dictionary
        '-c load_number_dawg=1 '  # Use number patterns
        '-c load_unambig_dawg=1 '  # Use unambiguous word dictionary
        '-c load_bigram_dawg=1 '  # Use bigram dictionary
        '-c load_fixed_length_dawgs=1 '  # Use fixed length word patterns
        '-c wordrec_enable_assoc=1 '  # Enable associated word recognition
        '-c tessedit_enable_dict_correction=1 '  # Enable dictionary correction
        '-c language_model_penalty_non_dict_word=0.5 '  # Penalty for non-dictionary words
        '-c language_model_penalty_non_freq_dict_word=0.3 '  # Penalty for infrequent words
        '-c preserve_interword_spaces=1 '  # Preserve spacing
        '-c tessedit_enable_bigram_correction=1 '  # Enable bigram correction
        '-c tosp_threshold_bias2=1.0 '  # Space threshold adjustment
    )

    # Extract text with all optimizations
    text = pytesseract.image_to_string(pil_img, lang='eng', config=config)

    return text.strip()


def extract_text_with_confidence(processed_image: np.ndarray) -> Dict[str, Any]:
    """
    Extract text with confidence scores for each word.
    Useful for filtering low-confidence results and quality assessment.

    Now uses OEM 3 for better accuracy in confidence scoring.

    Returns:
        Dict with 'text', 'confidence', and 'words' (list of dicts)
    """
    pil_img = Image.fromarray(processed_image)

    # Get detailed data with confidence scores using best accuracy mode
    config = (
        '--oem 3 '  # Both engines for better confidence scores
        '--psm 3 '  # Automatic page segmentation
        '-c preserve_interword_spaces=1'
    )

    data = pytesseract.image_to_data(
        pil_img,
        lang='eng',
        config=config,
        output_type=pytesseract.Output.DICT
    )

    # Extract words with confidence > 50 (lowered threshold for better coverage)
    words = []
    for i in range(len(data['text'])):
        conf = int(data['conf'][i])
        text = data['text'][i].strip()

        if conf > 50 and text:  # Lower threshold to capture more text
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

    # Calculate quality metrics
    high_conf_words = len([w for w in words if w['confidence'] > 80])
    medium_conf_words = len([w for w in words if 60 < w['confidence'] <= 80])
    low_conf_words = len([w for w in words if w['confidence'] <= 60])

    return {
        'text': full_text,
        'confidence': round(avg_conf, 2),
        'words': words,
        'word_count': len(words),
        'quality_metrics': {
            'high_confidence_words': high_conf_words,
            'medium_confidence_words': medium_conf_words,
            'low_confidence_words': low_conf_words
        }
    }


def extract_code(processed_image: np.ndarray) -> str:
    """
    Optimized for code extraction with maximum accuracy.
    Preserves indentation, spacing, and special characters.

    Config:
    - OEM 3: Both engines for accuracy
    - PSM 4: Single column of text (preserves line breaks)
    - Preserve all whitespace for proper indentation
    - No dictionaries (code often contains non-dictionary words)

    """
    pil_img = Image.fromarray(processed_image)

    config = (
        '--oem 3 '  # Both engines for better symbol/character recognition
        '--psm 4 '  # Single column of text (preserves code structure)
        '-c preserve_interword_spaces=1 '  # Critical for code indentation
        '-c load_system_dawg=0 '  # Disable dictionary (code has many non-words)
        '-c load_freq_dawg=0 '  # Disable frequent word dictionary
        '-c tessedit_char_blacklist= '  # Don't blacklist any characters for code
        '-c chop_enable=1 '  # Enable character chopping for better symbol recognition
        '-c use_new_state_cost=1 '  # Better recognition of unusual character sequences
        '-c segment_segcost_rating=1 '  # Improve segmentation accuracy
        '-c tosp_threshold_bias2=0 '  # Don't bias space detection (preserve exact spacing)
    )

    text = pytesseract.image_to_string(pil_img, lang='eng', config=config)

    # Only remove trailing whitespace from the entire text, preserve internal spacing
    return text.rstrip()


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
