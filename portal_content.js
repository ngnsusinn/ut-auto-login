async function getValidToken() {
  try {
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

(async function main() {
  try {

    if (!location.hostname.endsWith('portal.ut.edu.vn')) {
      return;
    }

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