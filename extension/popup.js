/**
 * Popup script for displaying OCR results and settings
 */

console.log('[Popup] Initializing...');

// DOM elements
// DOM elements
const emptyState = document.getElementById('empty-state');
const resultContainer = document.getElementById('result-container');
const resultText = document.getElementById('result-text');
const charCount = document.getElementById('char-count');
const processingTime = document.getElementById('processing-time');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');
const apiUrlInput = document.getElementById('api-url');
const connectionStatus = document.getElementById('connection-status');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

/**
 * Switch tabs
 */
function switchTab(tabId) {
  // Update tabs
  tabs.forEach(tab => {
    if (tab.dataset.tab === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update content
  tabContents.forEach(content => {
    if (content.id === `tab-${tabId}`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });

  // Load data if needed
  if (tabId === 'history') {
    loadHistory();
  }
}

/**
 * Load and display latest result
 */
function loadLatestResult() {
  chrome.storage.local.get(['latestResult'], (result) => {
    if (result.latestResult && result.latestResult.text) {
      displayResult(result.latestResult);
    } else {
      showEmptyState();
    }
  });
}

/**
 * Load and display history
 */
function loadHistory() {
  chrome.storage.local.get(['history'], (data) => {
    const history = data.history || [];
    historyList.innerHTML = '';

    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state" style="padding: 20px 0;">
          <p>No history yet</p>
        </div>
      `;
      return;
    }

    history.forEach((item, index) => {
      const date = new Date(item.timestamp).toLocaleString();
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <div class="history-header">
          <span>${date}</span>
          <span>${item.characterCount || item.text.length} chars</span>
        </div>
        <div class="history-text" title="${item.text.replace(/"/g, '&quot;')}">${item.text}</div>
        <div class="history-actions">
          <button class="btn-xs btn-copy" data-text="${item.text.replace(/"/g, '&quot;')}">Copy</button>
          <button class="btn-xs btn-delete" data-index="${index}">Delete</button>
        </div>
      `;
      historyList.appendChild(div);
    });

    // Add event listeners for buttons
    document.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = e.target.dataset.text;
        navigator.clipboard.writeText(text).then(() => {
          const original = e.target.textContent;
          e.target.textContent = 'Copied!';
          e.target.style.background = '#d4edda';
          setTimeout(() => {
            e.target.textContent = original;
            e.target.style.background = '';
          }, 1500);
        });
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        deleteHistoryItem(index);
      });
    });
  });
}

/**
 * Delete history item
 */
function deleteHistoryItem(index) {
  chrome.storage.local.get(['history'], (data) => {
    const history = data.history || [];
    history.splice(index, 1);
    chrome.storage.local.set({ history: history }, () => {
      loadHistory(); // Reload list
    });
  });
}

/**
 * Clear all history
 */
function clearHistory() {
  if (confirm('Are you sure you want to clear all history?')) {
    chrome.storage.local.set({ history: [] }, () => {
      loadHistory();
    });
  }
}

/**
 * Display OCR result
 */
function displayResult(result) {
  emptyState.style.display = 'none';
  resultContainer.style.display = 'block';

  resultText.value = result.text;
  charCount.textContent = result.characterCount || result.text.length;
  processingTime.textContent = Math.round(result.processingTime) + 'ms';

  // Auto-select text for easy copying
  resultText.select();
}

/**
 * Show empty state
 */
function showEmptyState() {
  emptyState.style.display = 'block';
  resultContainer.style.display = 'none';
}

/**
 * Copy text to clipboard
 */
function copyToClipboard() {
  const text = resultText.value;

  if (!text) {
    alert('No text to copy');
    return;
  }

  // Copy to clipboard
  resultText.select();
  document.execCommand('copy');

  // Visual feedback
  const originalText = copyBtn.textContent;
  copyBtn.textContent = '✓ Copied!';
  copyBtn.style.background = '#28a745';

  setTimeout(() => {
    copyBtn.textContent = originalText;
    copyBtn.style.background = '';
  }, 1500);
}

/**
 * Clear result
 */
function clearResult() {
  chrome.storage.local.remove('latestResult', () => {
    showEmptyState();
  });
}

/**
 * Load API URL from storage
 */
function loadApiUrl() {
  chrome.storage.local.get(['apiUrl'], (result) => {
    if (result.apiUrl) {
      apiUrlInput.value = result.apiUrl;
    }
  });
}

/**
 * Save API URL to storage
 */
function saveApiUrl() {
  const url = apiUrlInput.value.trim();

  if (!url) {
    alert('Please enter a valid URL');
    return;
  }

  // Remove trailing slash
  const cleanUrl = url.replace(/\/$/, '');

  // Send to background script
  try {
    chrome.runtime.sendMessage(
      { action: 'set_api_url', url: cleanUrl },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Popup] Runtime error:', chrome.runtime.lastError.message);
          alert('Error: ' + chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success) {
          console.log('[Popup] API URL updated:', cleanUrl);
          checkConnection();
        }
      }
    );
  } catch (error) {
    console.error('[Popup] Send error:', error);
    alert('Error sending message: ' + error.message);
  }
}

/**
 * Check backend connection
 */
async function checkConnection() {
  const url = apiUrlInput.value.trim().replace(/\/$/, '');

  connectionStatus.textContent = 'Checking...';
  connectionStatus.className = 'status';

  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (response.ok) {
      const health = await response.json();

      // Check Tesseract status
      if (health.tesseract && health.tesseract.status === 'ok') {
        connectionStatus.textContent = '✓ Connected';
        connectionStatus.className = 'status status-connected';
      } else {
        connectionStatus.textContent = '⚠ Connected (Tesseract not found)';
        connectionStatus.className = 'status status-disconnected';
      }
    } else {
      throw new Error('Backend returned error');
    }
  } catch (error) {
    console.error('[Popup] Connection check failed:', error);
    connectionStatus.textContent = '✗ Disconnected';
    connectionStatus.className = 'status status-disconnected';
  }
}

/**
 * Initialize popup
 */
function init() {
  console.log('[Popup] Loaded');

  // Load data
  loadLatestResult();
  loadApiUrl();

  // Check connection after short delay
  setTimeout(checkConnection, 500);

  // Event listeners
  copyBtn.addEventListener('click', copyToClipboard);
  clearBtn.addEventListener('click', clearResult);
  clearHistoryBtn.addEventListener('click', clearHistory);

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  // Save API URL on change (debounced)
  let urlSaveTimeout;
  apiUrlInput.addEventListener('input', () => {
    clearTimeout(urlSaveTimeout);
    urlSaveTimeout = setTimeout(() => {
      saveApiUrl();
    }, 1000); // Wait 1 second after typing stops
  });

  // Check connection when URL field loses focus
  apiUrlInput.addEventListener('blur', () => {
    saveApiUrl();
  });

  // Listen for storage changes (new results)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.latestResult && changes.latestResult.newValue) {
        displayResult(changes.latestResult.newValue);
      }
      if (changes.history && document.getElementById('tab-history').classList.contains('active')) {
        loadHistory();
      }
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
