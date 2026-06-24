document.addEventListener('DOMContentLoaded', function () {
  const loginScreen = document.getElementById('loginScreen');
  const adminApp = document.getElementById('adminApp');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginError = document.getElementById('loginError');
  const passwordInput = document.getElementById('adminPasswordInput');

  if (loginBtn && loginScreen && adminApp) {
    loginBtn.addEventListener('click', function () {
      if (!passwordInput || passwordInput.value.trim() === '1234') {
        loginScreen.style.display = 'none';
        adminApp.style.display = 'block';
        if (loginError) loginError.textContent = '';
      } else {
        if (loginError) loginError.textContent = 'Xato parol. Iltimos qayta urinib ko‘ring.';
      }
    });
  }

  if (logoutBtn && loginScreen && adminApp) {
    logoutBtn.addEventListener('click', function () {
      adminApp.style.display = 'none';
      loginScreen.style.display = 'flex';
      if (passwordInput) passwordInput.value = '';
    });
  }
});