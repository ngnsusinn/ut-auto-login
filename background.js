const PROXY_BASE_URL = 'https://api.ngnsusinn.io.vn/ut-proxy/';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  chrome.storage.local.get({ extensionEnabled: true }, (result) => {
    if (!result.extensionEnabled && request.action !== 'forceRelogin' && request.action !== 'checkTokenValidity') {

      if (request.action === 'performLogin') {
        sendResponse({ success: false, error: 'Extension is disabled' });
      }
      return;
    }

    handleMessage(request, sender, sendResponse);
  });

  return true; 
});

function handleMessage(request, sender, sendResponse) {

  if (request.action === 'performLogin') {
    (async () => {
      try {
        const { username, password } = request.data;

        const loginResponse = await fetch(PROXY_BASE_URL + 'user/login', {
          method: 'POST',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        if (!loginResponse.ok) {
          const errorText = await loginResponse.text();
          throw new Error(`HTTP ${loginResponse.status}: ${errorText.substring(0, 100)}`);
        }

        const loginData = await loginResponse.json();

        if (!loginData.success || !loginData.token) {
          throw new Error(loginData.message || 'Đăng nhập thất bại');
        }

        const token = loginData.token;
        const role = loginData.body; 

        const profileResponse = await fetch(PROXY_BASE_URL + 'user/getSummaryProfile', {
          method: 'GET',
          cache: 'no-cache',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!profileResponse.ok) {
          const errorText = await profileResponse.text();
          throw new Error('Không thể lấy profile');
        }

        const profileData = await profileResponse.json();

        if (!profileData.success || !profileData.body) {
          throw new Error('Profile không hợp lệ');
        }

        sendResponse({
          success: true,
          token: token,
          userProfile: profileData.body,
          userRole: role 
        });

      } catch (error) {
        sendResponse({
          success: false,
          error: error.message
        });
      }
    })();
    return;
  }

  if (request.action === 'checkTokenValidity') {
    (async () => {
      try {

        let token = request.token;
        if (!token) {
          const st = await chrome.storage.local.get(['token']);
          token = st.token;
        }

        if (!token) {
          sendResponse({ valid: false });
          return;
        }

        const response = await fetch(PROXY_BASE_URL + 'user/getCredit', {
          method: 'GET',
          cache: 'no-cache',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          sendResponse({ valid: false });
          return;
        }

  const data = await response.json();
  sendResponse({ valid: data.success === true, token: token });

      } catch (error) {
        sendResponse({ valid: false });
      }
    })();
    return;
  }

  if (request.action === 'getToken') {
    chrome.storage.local.get(['token'], (result) => {
      sendResponse({ token: result.token });
    });
    return;
  }

  if (request.action === 'clearAuthData') {

    chrome.storage.local.remove(['token', 'userProfile', 'userRole', 'loginTime', 'username', 'password']);
    sendResponse({ success: true });
    return;
  }

  if (request.action === 'forceRelogin') {
    (async () => {
      try {
        const { username, password } = await chrome.storage.local.get(['username', 'password']);
        if (!username || !password) {
          sendResponse({ success: false, error: 'No saved credentials' });
          return;
        }

        const loginResponse = await fetch(PROXY_BASE_URL + 'user/login', {
          method: 'POST',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        if (!loginResponse.ok) {
          const t = await loginResponse.text();
          sendResponse({ success: false, error: 'Login HTTP ' + loginResponse.status });
          return;
        }
        const loginData = await loginResponse.json();
        if (!loginData.success || !loginData.token) {
          sendResponse({ success: false, error: 'Relogin failed' });
          return;
        }
        const newToken = loginData.token;
        const newRole = loginData.body;

        const profileResponse = await fetch(PROXY_BASE_URL + 'user/getSummaryProfile', {
          method: 'GET',
          cache: 'no-cache',
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        if (!profileResponse.ok) {
          sendResponse({ success: false, error: 'Profile fetch failed' });
          return;
        }
        const profileData = await profileResponse.json();
        if (!profileData.success) {
          sendResponse({ success: false, error: 'Profile invalid' });
          return;
        }
        await chrome.storage.local.set({
          token: newToken,
          userProfile: profileData.body,
          userRole: newRole,
          loginTime: Date.now()
        });
        sendResponse({ success: true, token: newToken });
      } catch (e) {
        sendResponse({ success: false, error: String(e) });
      }
    })();
    return;
  }
}

if (chrome.alarms) {
  try {
    chrome.alarms.create('checkToken', { periodInMinutes: 0.5 });
  } catch (error) {

  }

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'checkToken') {
      const { extensionEnabled } = await chrome.storage.local.get({ extensionEnabled: true });
      if (!extensionEnabled) {
        return;
      }

      const result = await chrome.storage.local.get(['token', 'username', 'password']);

      if (result.token) {
        try {

          const response = await fetch(PROXY_BASE_URL + 'user/getCredit', {
            method: 'GET',
            cache: 'no-cache',
            headers: {
              'Authorization': `Bearer ${result.token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (!response.ok || !(await response.json()).success) {

            if (result.username && result.password) {
              try {

                const loginResponse = await fetch(PROXY_BASE_URL + 'user/login', {
                  method: 'POST',
                  cache: 'no-cache',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  body: JSON.stringify({ 
                    username: result.username, 
                    password: result.password 
                  })
                });

                if (loginResponse.ok) {
                  const loginData = await loginResponse.json();

                  if (loginData.success && loginData.token) {
                    const newRole = loginData.body; 

                    const profileResponse = await fetch(PROXY_BASE_URL + 'user/getSummaryProfile', {
                      method: 'GET',
                      cache: 'no-cache',
                      headers: {
                        'Authorization': `Bearer ${loginData.token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                      }
                    });

                    if (profileResponse.ok) {
                      const profileData = await profileResponse.json();

                      if (profileData.success) {

                        await chrome.storage.local.set({
                          token: loginData.token,
                          userProfile: profileData.body,
                          userRole: newRole, 
                          loginTime: Date.now()
                        });
                      }
                    }
                  }
                } else {

                  await chrome.storage.local.remove(['token', 'userProfile', 'userRole', 'loginTime']);
                }
              } catch (error) {
                await chrome.storage.local.remove(['token', 'userProfile', 'userRole', 'loginTime']);
              }
            } else {
              await chrome.storage.local.remove(['token', 'userProfile', 'userRole', 'loginTime']);
            }
          }
        } catch (error) {

        }
      }
    }
  });
} else {

}

chrome.runtime.onInstalled.addListener(() => {

  chrome.storage.local.get({ extensionEnabled: true }, (result) => {
    chrome.action.setIcon({
      path: result.extensionEnabled ? 'icons/icon.png' : 'icons/icon_disabled.png'
    });
  });
});

if (chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get({ extensionEnabled: true }, (result) => {
      chrome.action.setIcon({
        path: result.extensionEnabled ? 'icons/icon.png' : 'icons/icon_disabled.png'
      });
    });
  });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.extensionEnabled) {
    const enabled = changes.extensionEnabled.newValue;
    chrome.action.setIcon({
      path: enabled ? 'icons/icon.png' : 'icons/icon_disabled.png'
    });
  }
});