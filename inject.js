// This script is injected into the page context to override fetch and XHR.

(function () {
  'use strict';

  // --- Store original methods ---
  const originalFetch = window.fetch;
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  let isBypassActive = false;

  // --- Bypass logic for fetch ---
  const fetchBypass = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    
    // Check if we should intercept this request
    if (isBypassActive && url && url.includes('/api/v1/notification/getPopup')) {
      // Call original fetch to get real response
      const originalResponse = await originalFetch.apply(this, arguments);
      
      try {
        // Clone and parse response
        const clonedResponse = originalResponse.clone();
        const data = await clonedResponse.json();
        
        // Modify only the body field
        if (data && typeof data === 'object') {
          data.body = [];
          
          // Create new response with modified data but keep original headers/status
          const modifiedJson = JSON.stringify(data);
          const headers = new Headers(originalResponse.headers);
          headers.set('Content-Type', 'application/json');
          
          return new Response(modifiedJson, {
            status: originalResponse.status,
            statusText: originalResponse.statusText,
            headers: headers
          });
        }
      } catch (e) {
        // Fallback to original response if parsing fails
      }
      
      return originalResponse;
    }
    
    // For all other requests, use original fetch
    return originalFetch.apply(this, arguments);
  };

  // --- Bypass logic for XMLHttpRequest ---
  const xhrOpenBypass = function (method, url) {
    this._uth_url = url;
    this._url = url;  // backup for compatibility
    return originalXhrOpen.apply(this, arguments);
  };

  const xhrSendBypass = function () {
    const xhr = this;
    const url = xhr._uth_url || xhr._url;
    
    // Only intercept if bypass is active and URL matches
    if (isBypassActive && url && url.includes('/api/v1/notification/getPopup')) {
      xhr.addEventListener('readystatechange', function handler() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          try {
            // Parse original response
            const originalText = xhr.responseText;
            const data = JSON.parse(originalText);
            
            if (data && typeof data === 'object') {
              // Modify body
              data.body = [];
              const modifiedResponse = JSON.stringify(data);
              
              // Override response properties
              Object.defineProperty(xhr, 'responseText', {
                writable: false,
                configurable: false,
                value: modifiedResponse
              });
              Object.defineProperty(xhr, 'response', {
                writable: false,
                configurable: false,
                value: modifiedResponse
              });
            }
          } catch (e) {
            // Ignore parsing errors
          }
          
          xhr.removeEventListener('readystatechange', handler);
        }
      });
    }
    
    return originalXhrSend.apply(this, arguments);
  };

  // --- Toggle function ---
  function setBypassState(enabled) {
    isBypassActive = enabled;
    
    if (enabled) {
      // Apply overrides
      window.fetch = fetchBypass;
      XMLHttpRequest.prototype.open = xhrOpenBypass;
      XMLHttpRequest.prototype.send = xhrSendBypass;
    } else {
      // Restore originals
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXhrOpen;
      XMLHttpRequest.prototype.send = originalXhrSend;
    }
  }

  // --- Event listener to receive state from content script ---
  window.addEventListener('uth-set-notify-bypass-state', function (event) {
    if (event.detail && typeof event.detail.block !== 'undefined') {
      setBypassState(event.detail.block);
    }
  });

  // --- Initial state dispatch ---
  // Ask the content script for the initial state.
  window.dispatchEvent(new CustomEvent('uth-get-initial-notify-state'));

})();
