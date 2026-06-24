let supabaseClient;

if (window.supabase && window.HITS_CONFIG) {
  supabaseClient = window.supabase.createClient(window.HITS_CONFIG.SUPABASE_URL, window.HITS_CONFIG.SUPABASE_KEY);
  console.log('✅ Supabase initialized');
} else {
  console.error('❌ Supabase library not loaded');
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
          console.log('📤 Supabasega ma\'lumot yuborilimoqda:', { fullName: fullName.value, phone: phone.value });
          
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
            console.error('❌ Supabase INSERT xatosi:', error);
            console.error('Xato kodi:', error.code);
            console.error('Xato habar:', error.message);
            window.hitsToast('Xato yuz berdi: ' + error.message, 'danger');
            if (submitBtn) submitBtn.disabled = false;
            return;
          }

          console.log('✅ Ma\'lumot saqlandi:', data);
        } else {
          console.error('❌ Supabase client init qilinmagan');
          window.hitsToast('Veritabaza bilan ulanish xatosi', 'danger');
          if (submitBtn) submitBtn.disabled = false;
          return;
        }

        if (formStep && successStep) {
          formStep.style.display = 'none';
          successStep.classList.add('show');
        }
      } catch (err) {
        console.error('❌ Xato:', err);
        window.hitsToast('Xato yuz berdi: ' + err.message, 'danger');
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