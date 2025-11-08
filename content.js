(async function earlyAttempt() {
  try {
    if (document.readyState !== 'loading') return; 
    const host = location.hostname;
    if (host !== 'courses.ut.edu.vn' && host !== 'thnn.ut.edu.vn') return;

    // Kiểm tra auto login có được bật không
    const { autoLoginEnabled } = await chrome.storage.local.get({ autoLoginEnabled: true });
    if (!autoLoginEnabled) return;

    const url = new URL(location.href);
    if (url.searchParams.has('token')) return; 

    const last = Number(sessionStorage.getItem('ut_auto_login_moodle_last_redirect') || 0);
    if (Date.now() - last < 3000) return; 

    const { token } = await chrome.storage.local.get(['token']);
    if (token) {
      url.searchParams.set('token', token);
      sessionStorage.setItem('ut_auto_login_moodle_last_redirect', String(Date.now()));
      location.replace(url.toString());
    }
  } catch (e) {

  }
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {

  const hostname = window.location.hostname;

  if (hostname !== 'courses.ut.edu.vn' && hostname !== 'thnn.ut.edu.vn') {
    return;
  }

  // Kiểm tra auto login có được bật không
  const { autoLoginEnabled } = await chrome.storage.local.get({ autoLoginEnabled: true });
  if (!autoLoginEnabled) {
    return;
  }

  const currentUrl = new URL(window.location.href);
  if (currentUrl.searchParams.has('token')) {

    setTimeout(() => {
      const isLoggedIn = checkIfLoggedIn();
      if (isLoggedIn) {

        currentUrl.searchParams.delete('token');
        window.history.replaceState({}, document.title, currentUrl.toString());
      }
    }, 3000);

    return; 
  }

  const isLoggedIn = checkIfLoggedIn();

  if (isLoggedIn) {
    return;
  }

  const result = await chrome.storage.local.get(['token']);

  if (result.token) {
    await performAutoLogin(result.token);
  }
}

function checkIfLoggedIn() {

  const userMenu = document.querySelector('.usermenu .dropdown-toggle');
  const logoutLink = document.querySelector('a[href*="logout.php"]');
  const loginForm = document.querySelector('#loginbtn, #login, input[name="username"]');

  if (userMenu || logoutLink) {
    return true;
  }

  if (loginForm) {
    return false;
  }

  return document.cookie.includes('MoodleSession=');
}

async function performAutoLogin(token) {

  const currentUrl = new URL(window.location.href);

  if (currentUrl.searchParams.has('token')) {

    setTimeout(() => {
      const isLoggedIn = checkIfLoggedIn();
      if (!isLoggedIn) {

        currentUrl.searchParams.delete('token');
        window.location.href = currentUrl.toString();
      } else {

        currentUrl.searchParams.delete('token');
        window.history.replaceState({}, document.title, currentUrl.toString());
      }
    }, 3000); 

    return;
  }

  const last = Number(sessionStorage.getItem('ut_auto_login_moodle_last_redirect') || 0);
  if (Date.now() - last < 1500) {
    return;
  }
  currentUrl.searchParams.set('token', token);
  sessionStorage.setItem('ut_auto_login_moodle_last_redirect', String(Date.now()));

  window.location.href = currentUrl.toString();
}

setInterval(async () => {
  // Kiểm tra auto login có được bật không
  const { autoLoginEnabled } = await chrome.storage.local.get({ autoLoginEnabled: true });
  if (!autoLoginEnabled) {
    return;
  }

  const isLoggedIn = checkIfLoggedIn();
  if (!isLoggedIn) {
    const { token } = await chrome.storage.local.get(['token']);
    chrome.runtime.sendMessage({ action: 'checkTokenValidity', token }, async (response) => {
      if (response && response.valid && response.token) {
        await performAutoLogin(response.token);
      }
    });
  }
}, 60000); 