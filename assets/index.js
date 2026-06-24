document.addEventListener('DOMContentLoaded', function () {
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      window.formatUzPhone(this);
    });
  }

  const form = document.getElementById('registrationForm');
  const successStep = document.getElementById('successStep');
  const formStep = document.getElementById('formStep');
  const newRequestBtn = document.getElementById('newRequestBtn');

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const nameField = document.getElementById('nameField');
      const phoneField = document.getElementById('phoneField');
      const fullName = document.getElementById('fullName');
      const phone = document.getElementById('phone');
      let valid = true;

      nameField.classList.remove('error');
      phoneField.classList.remove('error');

      if (!fullName.value.trim()) {
        nameField.classList.add('error');
        valid = false;
      }
      if (!phone.value.trim() || phone.value.replace(/\D/g, '').length < 9) {
        phoneField.classList.add('error');
        valid = false;
      }

      if (!valid) {
        return;
      }

      if (formStep && successStep) {
        formStep.style.display = 'none';
        successStep.classList.add('show');
      }
    });
  }

  if (newRequestBtn && formStep && successStep && form) {
    newRequestBtn.addEventListener('click', function () {
      successStep.classList.remove('show');
      formStep.style.display = 'block';
      form.reset();
    });
  }

  const secretAdminLock = document.getElementById('secretAdminLock');
  if (secretAdminLock) {
    secretAdminLock.addEventListener('click', function () {
      window.location.href = 'admin.html';
    });
  }
});