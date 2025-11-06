const loginForm = document.getElementById('loginForm');
const userProfile = document.getElementById('userProfile');
const loading = document.getElementById('loading');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const extensionToggle = document.getElementById('extensionToggle');

function setActionIcon(enabled) {

  chrome.action.setIcon({
    path: enabled ? 'icons/icon.png' : 'icons/icon_disabled.png'
  });
}

document.addEventListener('DOMContentLoaded', async () => {

  const { extensionEnabled } = await chrome.storage.local.get({ extensionEnabled: true });
  extensionToggle.checked = extensionEnabled;

  setActionIcon(extensionEnabled);

  if (extensionEnabled) {
    await checkExistingLogin();
  } else {
    showDisabledState();
  }
});

extensionToggle.addEventListener('change', async (e) => {
  const isEnabled = e.target.checked;
  await chrome.storage.local.set({ extensionEnabled: isEnabled });

  setActionIcon(isEnabled);

  if (isEnabled) {
    await checkExistingLogin();
  } else {
    showDisabledState();
  }
});

function showDisabledState() {
  loginForm.style.display = 'none';
  userProfile.style.display = 'none';
  loading.style.display = 'block';
  loading.innerHTML = '<p style="text-align: center; color: #6c757d;">Extension đã tắt</p>';
}

async function checkExistingLogin() {
  showLoading(true);
  try {
    const result = await chrome.storage.local.get(['token', 'userProfile', 'username', 'password']);

    if (result.token && result.userProfile) {
      const isValid = await checkTokenValidity(result.token);
      if (isValid) {
        showUserProfile(result.userProfile);
        return;
      }
    }

    showLoginForm(result.username, result.password);

  } catch (error) {
    showLoginForm();
  } finally {
    showLoading(false);
  }
}

function showLoginForm(username = '', password = '') {
  loginForm.style.display = 'block';
  userProfile.style.display = 'none';
  document.getElementById('username').value = username;
  document.getElementById('password').value = password;
}

document.getElementById('login').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  await performLogin(username, password);
});

async function performLogin(username, password) {
  showLoading(true);
  loginError.textContent = '';

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'performLogin',
      data: { username, password }
    });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Đăng nhập thất bại');
    }

    const { token, userProfile, userRole } = response;

    await chrome.storage.local.set({
      username: username,
      password: password,
      token: token,
      userProfile: userProfile,
      userRole: userRole,
      loginTime: Date.now()
    });

    showUserProfile(userProfile);

  } catch (error) {
    loginError.textContent = error.message || 'Đã xảy ra lỗi khi đăng nhập';
    showLoginForm(username, password);
  } finally {
    showLoading(false);
  }
}

async function checkTokenValidity(token) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'checkTokenValidity',
      token: token
    });

    if (!response || !response.valid) {
      const refreshResp = await chrome.runtime.sendMessage({ action: 'forceRelogin' });
      return refreshResp && refreshResp.success;
    }

    return true;
  } catch (error) {
    return false;
  }
}

function showUserProfile(profile) {
  loginForm.style.display = 'none';
  userProfile.style.display = 'block';

  document.getElementById('userName').textContent = `${profile.hoDem} ${profile.ten}`;
  document.getElementById('studentId').textContent = profile.maSinhVien;
  document.getElementById('email').textContent = profile.email;
  document.getElementById('major').textContent = profile.nganh;
  document.getElementById('academicYear').textContent = profile.khoaHoc;
}

logoutBtn.addEventListener('click', async () => {
  await handleLogout();
});

async function handleLogout() {
  await chrome.storage.local.remove(['token', 'userProfile', 'userRole', 'loginTime']);
  chrome.runtime.sendMessage({ action: 'clearAuthData' });

  const { username, password } = await chrome.storage.local.get(['username', 'password']);
  showLoginForm(username, password);
}

function showLoading(show) {
  if (show) {
    loginForm.style.display = 'none';
    userProfile.style.display = 'none';
    loading.style.display = 'block';
    loading.innerHTML = '<div class="spinner"></div>'; 
  } else {
    loading.style.display = 'none';
  }
}