// Inject script vào page context để ghi đè fetch/XHR
function injectBypassScript() {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.onload = function () {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (e) {
    // Silent fail
  }
}

// Gửi trạng thái bypass tới inject.js thông qua CustomEvent
function sendBypassState(shouldBlock) {
  try {
    window.dispatchEvent(new CustomEvent('uth-set-notify-bypass-state', {
      detail: { block: shouldBlock }
    }));
  } catch (e) {
    // Silent fail
  }
}

async function getValidToken() {
  try {
    // Kiểm tra auto login có được bật không
    const { autoLoginEnabled } = await chrome.storage.local.get({ autoLoginEnabled: true });
    if (!autoLoginEnabled) {
      return { token: null, userRole: null };
    }

    let { token, userRole } = await chrome.storage.local.get(['token', 'userRole']);

    if (!token) {
      const reloginResp = await chrome.runtime.sendMessage({ action: 'forceRelogin' });
      if (reloginResp && reloginResp.success && reloginResp.token) {
        const fresh = await chrome.storage.local.get(['token', 'userRole']);
        return { token: fresh.token, userRole: fresh.userRole };
      }
      return { token: null, userRole: null };
    }

    const validationResp = await chrome.runtime.sendMessage({ 
      action: 'checkTokenValidity', 
      token: token 
    });

    if (validationResp && validationResp.valid === true) {
      return { token, userRole };
    }

    const reloginResp = await chrome.runtime.sendMessage({ action: 'forceRelogin' });

    if (reloginResp && reloginResp.success && reloginResp.token) {
      const fresh = await chrome.storage.local.get(['token', 'userRole']);
      return { token: fresh.token, userRole: fresh.userRole };
    }

    return { token: null, userRole: null };
  } catch (e) {
    return { token: null, userRole: null };
  }
}

// Early init for portal (document_start)
(async function main() {
  try {
    if (!location.hostname.endsWith('portal.ut.edu.vn')) return;

    // Kiểm tra auto login có được bật không
    const { autoLoginEnabled } = await chrome.storage.local.get({ autoLoginEnabled: true });
    if (!autoLoginEnabled) {
      return; // Dừng ngay nếu auto login bị tắt
    }

    // Inject script vào trang ASAP
    injectBypassScript();

    // Đọc trạng thái toggle và gửi tới inject.js
    const { blockPortalNotifications } = await chrome.storage.local.get({ blockPortalNotifications: false });
    const shouldBlock = blockPortalNotifications; // blockPortalNotifications=true => chặn
    
    // Đợi inject.js sẵn sàng rồi gửi state
    setTimeout(() => {
      sendBypassState(shouldBlock);
    }, 50);

    const hasReloaded = sessionStorage.getItem('ut_auto_login_reloaded_once') === '1';
    const accountInStorage = localStorage.getItem('account');

    const { token, userRole } = await getValidToken();

    if (!token) {
      return;
    }

    if (!accountInStorage) {

      try {
        localStorage.setItem('account', token);
        if (userRole) {
          localStorage.setItem('role', userRole);
          try { localStorage.removeItem('body'); } catch {}
        }

        if (!hasReloaded) {
          sessionStorage.setItem('ut_auto_login_reloaded_once', '1');
          window.location.reload();
          return;
        }
      } catch (error) {

      }
    } else {

      if (accountInStorage === token) {

      } else {

        try {
          localStorage.setItem('account', token);
          if (userRole) {
            localStorage.setItem('role', userRole);
            try { localStorage.removeItem('body'); } catch {}
          }

          if (!hasReloaded) {
            sessionStorage.setItem('ut_auto_login_reloaded_once', '1');
            window.location.reload();
            return;
          }
        } catch (e) {

        }
      }
    }

  } catch (e) {

  }
})();

let lastAccountValue = localStorage.getItem('account');
let isReloggingIn = false;

setInterval(async () => {
  // Kiểm tra auto login có được bật không
  const { autoLoginEnabled } = await chrome.storage.local.get({ autoLoginEnabled: true });
  if (!autoLoginEnabled) {
    return; // Dừng interval nếu auto login bị tắt
  }

  const currentAccount = localStorage.getItem('account');

  if (lastAccountValue && !currentAccount && !isReloggingIn) {
    isReloggingIn = true;

    try {

      await chrome.storage.local.remove(['token', 'userProfile', 'userRole', 'loginTime']);

      sessionStorage.removeItem('ut_auto_login_reloaded_once');

      const { token: freshToken, userRole: freshRole } = await getValidToken();

      if (freshToken) {
        try {
          localStorage.setItem('account', freshToken);
          if (freshRole) {
            localStorage.setItem('role', freshRole);
            try { localStorage.removeItem('body'); } catch {}
          }
          sessionStorage.setItem('ut_auto_login_reloaded_once', '1');
          lastAccountValue = freshToken;
          setTimeout(() => {
            window.location.reload();
          }, 100);
        } catch (e) {
          isReloggingIn = false;
        }
      } else {
        chrome.runtime.sendMessage({ action: 'clearAuthData' });
        isReloggingIn = false;
      }
    } catch (e) {
      chrome.runtime.sendMessage({ action: 'clearAuthData' });
      isReloggingIn = false;
    }
  }

  lastAccountValue = currentAccount;
}, 500); 

// React to toggle changes without full reload
// Lắng nghe thay đổi toggle trong popup
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.blockPortalNotifications && location.hostname.endsWith('portal.ut.edu.vn')) {
    const shouldBlock = changes.blockPortalNotifications.newValue;
    sendBypassState(shouldBlock);
  }
});

// Lắng nghe yêu cầu từ inject.js về initial state
window.addEventListener('uth-get-initial-notify-state', async function () {
  try {
    const { blockPortalNotifications } = await chrome.storage.local.get({ blockPortalNotifications: false });
    const shouldBlock = blockPortalNotifications;
    sendBypassState(shouldBlock);
  } catch (e) {
    // Silent fail
  }
});

// Khi người dùng tắt autoLoginEnabled từ popup, dọn dẹp localStorage/sessionStorage trên portal để ngăn duy trì phiên hiện tại
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.autoLoginEnabled && location.hostname.endsWith('portal.ut.edu.vn')) {
    const enabled = changes.autoLoginEnabled.newValue;
    if (!enabled) {
      try {
        localStorage.removeItem('account');
        localStorage.removeItem('role');
        try { localStorage.removeItem('body'); } catch {}
        sessionStorage.removeItem('ut_auto_login_reloaded_once');
      } catch (e) { /* silent */ }
    }
  }
});