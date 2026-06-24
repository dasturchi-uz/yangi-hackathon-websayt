const supabaseUrl = 'https://hadgkmvlazkvhhmuxljg.supabase.co';
const supabaseKey = 'sb_publishable_vfAvrYTF0mNa2wbIP_O0Xw_y_ME4F3f';
let supabaseClient;

if (window.supabase) {
  supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}

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
  const submitBtn = document.getElementById('submitBtn');

  if (form) {
    form.addEventListener('submit', async function (event) {
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

      if (submitBtn) submitBtn.disabled = true;

      try {
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('applications')
            .insert([
              {
                full_name: fullName.value.trim(),
                phone: phone.value.trim(),
                status: 'new',
                created_at: new Date().toISOString(),
                grade: null,
                notes: null
              }
            ])
            .select();

          if (error) {
            console.error('Supabase error:', error);
            window.hitsToast('Xato yuz berdi. Qayta urinib ko\'ring.', 'danger');
            if (submitBtn) submitBtn.disabled = false;
            return;
          }
        }

        if (formStep && successStep) {
          formStep.style.display = 'none';
          successStep.classList.add('show');
        }
      } catch (err) {
        console.error('Error:', err);
        window.hitsToast('Xato yuz berdi. Qayta urinib ko\'ring.', 'danger');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
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