"""
Fast image preprocessing pipeline optimized for SD/720p video captures.
Uses Otsu thresholding and light sharpening for speed.
"""

import cv2
import numpy as np
from typing import Union


def preprocess_image_fast(image_bytes: bytes) -> np.ndarray:
    """
    Fast preprocessing for SD/720p video captures.
    Optimized for speed with minimal accuracy loss.

    Pipeline:
    1. Load image (already grayscale from client)
    2. Otsu binary threshold (fast, works well for SD video)
    3. Light sharpen (simple kernel)

    Args:
        image_bytes: Raw image bytes (WebP/JPEG/PNG)

    Returns:
        Preprocessed image ready for OCR (numpy array)

    Processing time: ~10-15ms
    """
    # Load image from bytes
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

    if img is None:
        raise ValueError("Failed to decode image")

    # OPTIMIZATION 1: Simple binary threshold
    # Otsu can be too aggressive for code/text with syntax highlighting
    # Use a fixed threshold that works well for light text on dark background
    # or dark text on light background (after inversion check if needed)
    
    # Check if image is dark (code editor theme)
    mean_brightness = np.mean(img)
    if mean_brightness < 128:
        # Dark background: Threshold high to pick up light text
        _, thresh = cv2.threshold(img, 100, 255, cv2.THRESH_BINARY)
    else:
        # Light background: Threshold low to pick up dark text
        _, thresh = cv2.threshold(img, 180, 255, cv2.THRESH_BINARY_INV)
        thresh = cv2.bitwise_not(thresh) # Invert back to black text on white

    # OPTIMIZATION 2: Light sharpen (simple kernel)
    # Enhances edges for better OCR accuracy
    sharpen_kernel = np.array([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ])
    sharpened = cv2.filter2D(thresh, -1, sharpen_kernel)

    return sharpened


def preprocess_image_quality(image_bytes: bytes) -> np.ndarray:
    """
    Higher quality preprocessing with more steps.
    Use this if accuracy is more important than speed.

    Pipeline:
    1. Load and convert to grayscale
    2. Denoise with bilateral filter
    3. Adaptive threshold
    4. Heavy sharpen (unsharp mask)

    Processing time: ~30-40ms (2-3x slower)
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Failed to decode image")

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Denoise (bilateral filter preserves edges)
    denoised = cv2.bilateralFilter(gray, 5, 50, 50)

    # Adaptive thresholding (handles varying brightness)
    thresh = cv2.adaptiveThreshold(
        denoised,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11,
        2
    )

    # Sharpen (unsharp mask)
    blurred = cv2.GaussianBlur(thresh, (0, 0), 3)
    sharpened = cv2.addWeighted(thresh, 1.5, blurred, -0.5, 0)

    return sharpened


def auto_rotate_image(img: np.ndarray) -> np.ndarray:
    """
    Detect and correct text skew/rotation.
    Optional - adds ~20-30ms but improves accuracy for rotated text.
    """
    # Detect edges
    edges = cv2.Canny(img, 50, 150, apertureSize=3)

    # Hough transform to detect lines
    lines = cv2.HoughLines(edges, 1, np.pi/180, 100)

    if lines is not None:
        # Calculate average angle
        angles = []
        for rho, theta in lines[:10]:  # Use first 10 lines
            angle = np.rad2deg(theta) - 90
            angles.append(angle)

        median_angle = np.median(angles)

        # Rotate if skew is significant (> 1 degree)
        if abs(median_angle) > 1:
            (h, w) = img.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
            rotated = cv2.warpAffine(
                img, M, (w, h),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE
            )
            return rotated

    return img


def upscale_small_image(img: np.ndarray, min_height: int = 32) -> np.ndarray:
    """
    Upscale very small images for better OCR accuracy.
    Tesseract works best with text height >= 32px.
    """
    h, w = img.shape[:2]

    if h < min_height:
        scale = min_height / h
        new_w = int(w * scale)
        new_h = int(h * scale)

        # Use INTER_CUBIC for upscaling (better quality)
        upscaled = cv2.resize(
            img,
            (new_w, new_h),
            interpolation=cv2.INTER_CUBIC
        )
        return upscaled

    return img
