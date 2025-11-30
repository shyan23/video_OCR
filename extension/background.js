/**
 * Background service worker for Chrome extension.
 * Handles communication between content script and FastAPI backend.
 */

console.log('[Background] Service worker initialized');

// Backend API URL (configurable)
let API_URL = 'http://localhost:8080';

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.action);

  if (message.action === 'ocr_request') {
    // Reconstruct blob from ArrayBuffer data
    const uint8Array = new Uint8Array(message.imageData);
    const blob = new Blob([uint8Array], { type: message.mimeType || 'image/webp' });

    // Handle OCR request
    handleOCRRequest(blob)
      .then(result => {
        sendResponse({ success: true, ...result });
      })
      .catch(error => {
        console.error('[Background] OCR error:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep channel open for async response
  }

  if (message.action === 'set_api_url') {
    // Allow changing API URL
    API_URL = message.url;
    chrome.storage.local.set({ apiUrl: API_URL });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'get_api_url') {
    sendResponse({ url: API_URL });
    return true;
  }
});

/**
 * Handle OCR request - send to backend
 */
async function handleOCRRequest(imageBlob) {
  console.log('[Background] Handling OCR request...');

  // Convert blob to file for FormData
  const formData = new FormData();
  formData.append('file', imageBlob, 'capture.webp');

  try {
    // Send to backend
    const response = await fetch(`${API_URL}/ocr`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    console.log('[Background] OCR result:', {
      textLength: result.text?.length || 0,
      processingTime: result.processing_time_ms
    });

    // Copy to clipboard
    if (result.text) {
      await copyToClipboard(result.text);
    }

    // Send to popup
    updatePopup(result);

    return result;

  } catch (error) {
    console.error('[Background] Fetch error:', error);

    // Check if backend is reachable
    if (error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to backend at ${API_URL}. Make sure the server is running.`);
    }

    throw error;
  }
}

/**
 * Copy text to clipboard
 * In Manifest V3, service workers must use the offscreen document API
 * or send the text back to content script for clipboard access
 */
async function copyToClipboard(text) {
  try {
    // Service workers in Manifest V3 don't have DOM access
    // We need to ask the content script to copy to clipboard
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      await chrome.tabs.sendMessage(tabs[0].id, {
        action: 'copy_to_clipboard',
        text: text
      });
      console.log('[Background] Sent text to content script for clipboard copy');
    }
  } catch (error) {
    console.error('[Background] Clipboard error:', error);
    // Don't throw - clipboard is not critical
  }
}

/**
 * Update popup with latest result and add to history
 */
function updatePopup(result) {
  const newEntry = {
    id: Date.now().toString(), // Unique ID
    text: result.text,
    processingTime: result.processing_time_ms,
    characterCount: result.character_count,
    timestamp: Date.now(),
    mode: result.mode || 'fast'
  };

  // Get existing history
  chrome.storage.local.get(['history'], (data) => {
    let history = data.history || [];

    // Add new entry to beginning
    history.unshift(newEntry);

    // Limit to 50 items
    if (history.length > 50) {
      history = history.slice(0, 50);
    }

    // Store updated history and latest result
    chrome.storage.local.set({
      latestResult: newEntry,
      history: history
    }, () => {
      console.log('[Background] Result stored in history');
    });
  });
}

/**
 * Handle extension icon click
 */
chrome.action.onClicked.addListener((tab) => {
  console.log('[Background] Extension icon clicked');

  // Send activate message to content script
  chrome.tabs.sendMessage(tab.id, { action: 'activate' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[Background] Error:', chrome.runtime.lastError.message);
      return;
    }

    if (response && response.success) {
      console.log('[Background] Overlay activated');
    } else {
      console.log('[Background] Overlay activation failed:', response?.error);
    }
  });
});

/**
 * Load saved API URL on startup
 */
chrome.storage.local.get(['apiUrl'], (result) => {
  if (result.apiUrl) {
    API_URL = result.apiUrl;
    console.log('[Background] Loaded API URL:', API_URL);
  } else {
    console.log('[Background] Using default API URL:', API_URL);
  }
});

/**
 * Health check on startup
 */
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET'
    });

    if (response.ok) {
      const health = await response.json();
      console.log('[Background] Backend health check:', health);
      return true;
    }
  } catch (error) {
    console.warn('[Background] Backend not reachable:', error.message);
    return false;
  }
}

// Run health check after 2 seconds (let backend start)
setTimeout(() => {
  checkBackendHealth();
}, 2000);
