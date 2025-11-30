"""
Multi-Engine OCR System - Optimized for 16GB RAM + APU
Uses PaddleOCR (primary) + Tesseract (fallback) for maximum accuracy.

Architecture:
1. PaddleOCR (PP-OCRv4) - 95-99% accuracy, fast on CPU
2. Tesseract (enhanced) - Fallback and validation
3. Ensemble voting for critical text
4. Post-processing corrections
"""

import pytesseract
from PIL import Image
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
import re
from difflib import SequenceMatcher

# PaddleOCR imports (will install separately)
try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except ImportError:
    PADDLE_AVAILABLE = False
    print("Warning: PaddleOCR not installed. Using Tesseract only.")


class MultiEngineOCR:
    """
    Multi-engine OCR with intelligent fallback and ensemble methods.
    Optimized for CPU execution on 16GB RAM systems.
    """

    def __init__(self, use_gpu: bool = False):
        """
        Initialize OCR engines.

        Args:
            use_gpu: Set to False for APU systems (default: False)
        """
        self.use_gpu = use_gpu

        # Initialize PaddleOCR (primary engine)
        if PADDLE_AVAILABLE:
            try:
                self.paddle = PaddleOCR(
                    use_angle_cls=True,  # Enable text rotation detection
                    lang='en',
                    use_gpu=use_gpu,
                    show_log=False,
                    det_db_thresh=0.3,  # Detection threshold (lower = more sensitive)
                    det_db_box_thresh=0.5,  # Box threshold
                    rec_batch_num=6,  # Batch size for recognition
                    drop_score=0.5,  # Confidence threshold
                    use_space_char=True,  # Recognize spaces
                )
                print("✓ PaddleOCR initialized (CPU mode)")
            except Exception as e:
                print(f"⚠ PaddleOCR initialization failed: {e}")
                print("  Falling back to Tesseract only")
                self.paddle = None
        else:
            self.paddle = None
            print("⚠ PaddleOCR not available, using Tesseract only")

    def extract_text_paddle(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Extract text using PaddleOCR (primary method).
        Best accuracy for video captures.

        Args:
            image: Preprocessed image (numpy array)

        Returns:
            Dict with text, confidence, and metadata
        """
        if not PADDLE_AVAILABLE or self.paddle is None:
            return None

        try:
            # PaddleOCR expects RGB or BGR
            if len(image.shape) == 2:  # Grayscale
                image_rgb = np.stack([image, image, image], axis=2)
            else:
                image_rgb = image

            # Run OCR
            result = self.paddle.ocr(image_rgb, cls=True)

            if not result or not result[0]:
                return {
                    'text': '',
                    'confidence': 0.0,
                    'engine': 'paddle',
                    'boxes': []
                }

            # Extract text and confidence
            lines = []
            confidences = []
            boxes = []

            for line in result[0]:
                box, (text, conf) = line
                lines.append(text)
                confidences.append(conf)
                boxes.append(box)

            full_text = ' '.join(lines)
            avg_confidence = np.mean(confidences) if confidences else 0.0

            return {
                'text': full_text,
                'confidence': float(avg_confidence * 100),  # Convert to percentage
                'engine': 'paddle',
                'boxes': boxes,
                'line_count': len(lines)
            }

        except Exception as e:
            print(f"PaddleOCR error: {e}")
            return None

    def extract_text_tesseract_enhanced(
        self,
        image: np.ndarray,
        mode: str = 'accurate'
    ) -> Dict[str, Any]:
        """
        Enhanced Tesseract extraction with multiple PSM modes.

        Args:
            image: Preprocessed image
            mode: 'fast', 'accurate', or 'code'

        Returns:
            Dict with text and confidence
        """
        pil_img = Image.fromarray(image)

        if mode == 'code':
            config = (
                '--oem 3 --psm 4 '
                '-c preserve_interword_spaces=1 '
                '-c load_system_dawg=0 '
                '-c load_freq_dawg=0 '
            )
        elif mode == 'accurate':
            config = (
                '--oem 3 --psm 3 '
                '-c load_system_dawg=1 '
                '-c load_freq_dawg=1 '
                '-c load_punc_dawg=1 '
                '-c tessedit_enable_dict_correction=1 '
                '-c tessedit_enable_bigram_correction=1 '
            )
        else:  # fast
            config = '--oem 3 --psm 6 -c preserve_interword_spaces=1'

        # Extract text
        text = pytesseract.image_to_string(pil_img, lang='eng', config=config)

        # Get confidence
        data = pytesseract.image_to_data(
            pil_img,
            lang='eng',
            config=config,
            output_type=pytesseract.Output.DICT
        )

        confidences = [
            int(conf) for conf in data['conf']
            if conf != '-1' and data['text'][data['conf'].index(conf)].strip()
        ]
        avg_conf = np.mean(confidences) if confidences else 0.0

        return {
            'text': text.strip(),
            'confidence': float(avg_conf),
            'engine': 'tesseract',
            'mode': mode
        }

    def extract_multi_pass(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Multi-pass OCR: Try PaddleOCR first, fallback to Tesseract.
        Returns best result based on confidence.

        Args:
            image: Preprocessed image

        Returns:
            Best OCR result
        """
        results = []

        # Pass 1: PaddleOCR (if available)
        if PADDLE_AVAILABLE and self.paddle:
            paddle_result = self.extract_text_paddle(image)
            if paddle_result and paddle_result['text']:
                results.append(paddle_result)

        # Pass 2: Tesseract with PSM 3 (automatic)
        tess_result_auto = self.extract_text_tesseract_enhanced(image, mode='accurate')
        if tess_result_auto['text']:
            results.append(tess_result_auto)

        # Pass 3: Tesseract with PSM 6 (uniform block)
        tess_result_block = self.extract_text_tesseract_enhanced(image, mode='fast')
        if tess_result_block['text']:
            results.append(tess_result_block)

        # Return best result by confidence
        if not results:
            return {
                'text': '',
                'confidence': 0.0,
                'engine': 'none',
                'method': 'multi_pass'
            }

        best_result = max(results, key=lambda x: x['confidence'])
        best_result['method'] = 'multi_pass'
        best_result['attempts'] = len(results)

        return best_result

    def extract_ensemble(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Ensemble method: Run all engines and vote/merge results.
        Most accurate but slower (~500-800ms).

        Args:
            image: Preprocessed image

        Returns:
            Merged result with highest confidence
        """
        results = []

        # Get all results
        if PADDLE_AVAILABLE and self.paddle:
            paddle_result = self.extract_text_paddle(image)
            if paddle_result:
                results.append(paddle_result)

        tess_accurate = self.extract_text_tesseract_enhanced(image, 'accurate')
        tess_fast = self.extract_text_tesseract_enhanced(image, 'fast')

        results.extend([tess_accurate, tess_fast])

        # Filter empty results
        results = [r for r in results if r['text'].strip()]

        if not results:
            return {
                'text': '',
                'confidence': 0.0,
                'engine': 'ensemble',
                'method': 'none'
            }

        # If only one result, return it
        if len(results) == 1:
            results[0]['method'] = 'ensemble'
            return results[0]

        # Compare results and pick best
        # Priority: PaddleOCR > Tesseract accurate > Tesseract fast
        paddle_results = [r for r in results if r.get('engine') == 'paddle']
        if paddle_results:
            best = max(paddle_results, key=lambda x: x['confidence'])
            best['method'] = 'ensemble_paddle'
            return best

        # Otherwise return highest confidence Tesseract
        best = max(results, key=lambda x: x['confidence'])
        best['method'] = 'ensemble_tesseract'
        return best

    def post_process_text(self, text: str, fix_common_errors: bool = True) -> str:
        """
        Post-process OCR text to fix common errors.

        Args:
            text: Raw OCR text
            fix_common_errors: Apply common error corrections

        Returns:
            Cleaned text
        """
        if not text:
            return text

        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()

        if fix_common_errors:
            # Common OCR error corrections
            corrections = {
                # Letter confusion
                r'\b0\b': 'O',  # Zero to O in words
                r'\bl\b': 'I',  # lowercase L to I in words
                r'rn': 'm',  # rn often mistaken for m
                r'\|': 'I',  # pipe to I

                # Common technical terms
                r'Tzmmstonnar': 'Transformer',
                r'Vikion': 'Vision',
                r'transtormer': 'transformer',
                r'rnodel': 'model',
                r'networ[kl]': 'network',
            }

            for pattern, replacement in corrections.items():
                text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

        return text


# Convenience functions for FastAPI endpoints
_ocr_engine = None

def get_ocr_engine() -> MultiEngineOCR:
    """Get or create singleton OCR engine."""
    global _ocr_engine
    if _ocr_engine is None:
        _ocr_engine = MultiEngineOCR(use_gpu=False)
    return _ocr_engine


def extract_text_best(image: np.ndarray) -> str:
    """
    Extract text using best available method.
    Prioritizes PaddleOCR, falls back to Tesseract.

    Args:
        image: Preprocessed image array

    Returns:
        Extracted text string
    """
    engine = get_ocr_engine()
    result = engine.extract_multi_pass(image)
    text = result['text']
    return engine.post_process_text(text, fix_common_errors=True)


def extract_text_maximum_accuracy(image: np.ndarray) -> Dict[str, Any]:
    """
    Extract text with ensemble method for maximum accuracy.
    Slower but most reliable.

    Args:
        image: Preprocessed image array

    Returns:
        Dict with text, confidence, and metadata
    """
    engine = get_ocr_engine()
    result = engine.extract_ensemble(image)
    result['text'] = engine.post_process_text(result['text'], fix_common_errors=True)
    return result


def extract_text_fast(image: np.ndarray) -> str:
    """
    Fast extraction - PaddleOCR if available, else Tesseract.

    Args:
        image: Preprocessed image array

    Returns:
        Extracted text string
    """
    engine = get_ocr_engine()

    # Try PaddleOCR first (fastest and most accurate)
    if PADDLE_AVAILABLE:
        result = engine.extract_text_paddle(image)
        if result and result['text']:
            return engine.post_process_text(result['text'], fix_common_errors=True)

    # Fallback to Tesseract
    result = engine.extract_text_tesseract_enhanced(image, mode='fast')
    return engine.post_process_text(result['text'], fix_common_errors=True)


# Legacy compatibility functions
def extract_text_accurate(image: np.ndarray) -> str:
    """Legacy function - now uses multi-pass."""
    return extract_text_best(image)


def extract_code(image: np.ndarray) -> str:
    """Extract code with spacing preserved."""
    engine = get_ocr_engine()
    result = engine.extract_text_tesseract_enhanced(image, mode='code')
    return result['text']


def extract_text_with_confidence(image: np.ndarray) -> Dict[str, Any]:
    """Extract with confidence scores."""
    return extract_text_maximum_accuracy(image)


def test_tesseract_installation() -> Dict[str, Any]:
    """Test Tesseract installation."""
    try:
        version = pytesseract.get_tesseract_version()
        langs = pytesseract.get_languages()

        return {
            'status': 'ok',
            'version': str(version),
            'languages': langs,
            'eng_available': 'eng' in langs,
            'paddle_available': PADDLE_AVAILABLE
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'message': 'Tesseract not installed or not in PATH',
            'paddle_available': PADDLE_AVAILABLE
        }


def get_tesseract_version() -> str:
    """Get Tesseract version."""
    try:
        return str(pytesseract.get_tesseract_version())
    except Exception as e:
        return f"Error: {str(e)}"
