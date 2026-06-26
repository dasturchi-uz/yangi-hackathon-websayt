let supabaseClient;
let allApplications = [];
let currentFilter = 'all';
let allClasses = [];

if (window.supabase && window.HITS_CONFIG) {
  supabaseClient = window.supabase.createClient(window.HITS_CONFIG.SUPABASE_URL, window.HITS_CONFIG.SUPABASE_KEY);
  console.log('✅ Supabase initialized');
} else {
  console.error('❌ Supabase library not loaded');
}

document.addEventListener('DOMContentLoaded', async function () {
  const loginScreen = document.getElementById('loginScreen');
  const adminApp = document.getElementById('adminApp');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginError = document.getElementById('loginError');
  const passwordInput = document.getElementById('adminPasswordInput');

  function handleLogin() {
    if (!passwordInput) return;
    const pwd = passwordInput.value.trim();

    if (pwd === window.HITS_CONFIG.ADMIN_PASSWORD) {
      sessionStorage.setItem('hitAdminLogged', 'true');
      loginScreen.style.display = 'none';
      adminApp.style.display = 'block';
      if (loginError) loginError.textContent = '';
      loadApplications();
    } else {
      if (loginError) loginError.textContent = 'Xato parol. Iltimos qayta urinib ko\'ring.';
    }
  }

  // O'quvchi qo'shish mantiqi
const addStudentBtn = document.getElementById('addStudentBtn');
const addStudentModal = document.getElementById('addStudentModal');
const addStudentCloseBtn = document.getElementById('addStudentCloseBtn');
const addStudentSaveBtn = document.getElementById('addStudentSaveBtn');

if (addStudentBtn) {
  addStudentBtn.addEventListener('click', () => {
    if (addStudentModal) {
      addStudentModal.classList.add('active');
      document.getElementById('modalBackdrop').classList.add('active');
    }
  });
}

if (addStudentCloseBtn) {
  addStudentCloseBtn.addEventListener('click', () => {
    if (addStudentModal) addStudentModal.classList.remove('active');
    document.getElementById('modalBackdrop').classList.remove('active');
  });
}

if (addStudentSaveBtn) {
  addStudentSaveBtn.addEventListener('click', async () => {
    const fullName = document.getElementById('addFullName').value.trim();
    const phone = document.getElementById('addPhone').value.trim();
    const studentType = document.querySelector('input[name="addStudentType"]:checked').value;
    const enrollment = document.querySelector('input[name="addEnrollment"]:checked').value;
    const status = document.querySelector('input[name="addStatus"]:checked').value;

    if (!fullName || !phone) {
      alert("Ism va Telefon raqamini kiritish majburiy!");
      return;
    }

    if (supabaseClient) {
      const { error } = await supabaseClient
        .from('applications')
        .insert([{
          full_name: fullName,
          phone: phone,
          student_type: studentType,
          enrollment_month: enrollment,
          status: status
        }]);

      if (error) {
        window.hitsToast("Qo'shishda xatolik yuz berdi!", 'danger');
        console.error(error);
        return;
      }
      
      window.hitsToast("Yangi o'quvchi muvaffaqiyatli qo'shildi!", 'success');
      
      if (addStudentModal) addStudentModal.classList.remove('active');
      document.getElementById('modalBackdrop').classList.remove('active');
      
      // Formani tozalash
      document.getElementById('addFullName').value = '';
      document.getElementById('addPhone').value = '';
      
      loadApplications();
    }
  });
}

// Sahifa yuklanganda sessiyani tekshiramiz
  if (sessionStorage.getItem('hitAdminLogged') === 'true') {
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminApp) adminApp.style.display = 'block';
    loadApplications();
  }

  if (loginBtn && loginScreen && adminApp) {
    loginBtn.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') handleLogin();
    });
  }

  if (logoutBtn && loginScreen && adminApp) {
    logoutBtn.addEventListener('click', function () {
      sessionStorage.removeItem('hitAdminLogged');
      adminApp.style.display = 'none';
      loginScreen.style.display = 'flex';
      if (passwordInput) passwordInput.value = '';
      allApplications = [];
    });
  }

  document.querySelectorAll('.stat-card').forEach(function (card) {
    card.addEventListener('click', function () {
      const filter = this.dataset.filter;
      currentFilter = filter;
      document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      renderTable();
    });
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', renderTable);
  }

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadApplications);
  }

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToCSV);
  }
  
  // Classes modal logic
  const manageClassesBtn = document.getElementById('manageClassesBtn');
  const classesModal = document.getElementById('classesModal');
  const classesModalCloseBtn = document.getElementById('classesModalCloseBtn');
  const addClassBtn = document.getElementById('addClassBtn');
  
  if (manageClassesBtn && classesModal) {
    manageClassesBtn.addEventListener('click', () => {
      classesModal.classList.add('show');
    });
    classesModalCloseBtn.addEventListener('click', () => {
      classesModal.classList.remove('show');
    });
    addClassBtn.addEventListener('click', addClass);
  }
  
  // Populate grade filter
  const gradeFilter = document.getElementById('gradeFilter');
  if (gradeFilter) {
    gradeFilter.addEventListener('change', renderTable);
  }
});

async function loadApplications() {
  if (!supabaseClient) {
    console.error('❌ Supabase client not initialized');
    return;
  }

  try {
    console.log('📥 Arizalar yuklanmoqda...');
    
    const { data, error } = await supabaseClient
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fetch xatosi:', error);
      console.error('Xato kodi:', error.code);
      console.error('Xato habar:', error.message);
      window.hitsToast('Ma\'lumotlar yuklanmadi: ' + error.message, 'danger');
      return;
    }

    console.log('✅ Arizalar yuklandi:', data?.length || 0, 'ta');
    
    allApplications = data || [];
    await loadClasses(); // Fetch classes before render
    updateStatCards();
    renderClassOverview();
    renderTable();
  } catch (err) {
    console.error('❌ Xato:', err);
    window.hitsToast('Xato yuz berdi: ' + err.message, 'danger');
  }
}

function updateStatCards() {
  const counts = {
    all: allApplications.length,
    new: allApplications.filter(a => a.status === 'new').length,
    called: allApplications.filter(a => a.status === 'called').length,
    no_answer: allApplications.filter(a => a.status === 'no_answer').length,
    accepted: allApplications.filter(a => a.status === 'accepted').length,
    rejected: allApplications.filter(a => a.status === 'rejected').length
  };

  document.getElementById('countAll').textContent = counts.all;
  document.getElementById('countNew').textContent = counts.new;
  document.getElementById('countCalled').textContent = counts.called;
  document.getElementById('countNoAnswer').textContent = counts.no_answer;
  document.getElementById('countAccepted').textContent = counts.accepted;
  document.getElementById('countRejected').textContent = counts.rejected;
}

async function loadClasses() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from('classes').select('*').order('name');
  if (error) {
    if (error.code === '42P01') {
      window.hitsToast('SQL bazada "classes" jadvali topilmadi. Avval uni yarating.', 'danger');
    } else {
      console.error('Classes load error:', error);
    }
    allClasses = [];
  } else {
    allClasses = data || [];
  }
  
  const gradeFilter = document.getElementById('gradeFilter');
  if (gradeFilter) {
    const currentVal = gradeFilter.value;
    gradeFilter.innerHTML = '<option value="">Barcha sinflar</option>' + 
      allClasses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    gradeFilter.value = currentVal;
  }
  renderClassesList();
}

async function addClass() {
  const nameInput = document.getElementById('newClassName');
  const name = nameInput.value.trim();
  if (!name) return;
  
  if (supabaseClient) {
    const { error } = await supabaseClient.from('classes').insert([{ name }]);
    if (error) {
      window.hitsToast('Sinf qo\'shishda xato: ' + error.message, 'danger');
      return;
    }
  }
  nameInput.value = '';
  window.hitsToast('Sinf qo\'shildi', 'success');
  loadClasses();
}

window.deleteClass = async function(id) {
  if (!confirm('Sinfni o\'chirasizmi? O\'chirilganda o\'quvchilar ro\'yxatdan yo\'qolmaydi.')) return;
  if (supabaseClient) {
    const { error } = await supabaseClient.from('classes').delete().eq('id', id);
    if (error) {
      window.hitsToast('O\'chirishda xato', 'danger');
      return;
    }
  }
  window.hitsToast('O\'chirildi', 'success');
  loadClasses();
};

function renderClassesList() {
  const container = document.getElementById('classesList');
  if (!container) return;
  if (allClasses.length === 0) {
    container.innerHTML = '<div style="color:var(--muted); text-align:center; padding:10px;">Sinflar yo\'q</div>';
    return;
  }
  container.innerHTML = allClasses.map(c => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--paper); border-radius:10px; border:1px solid var(--line);">
      <strong style="font-size:0.9rem;">${c.name}</strong>
      <button class="action-btn" title="O'chirish" onclick="deleteClass(${c.id})"><i class="bi bi-trash3" style="color:var(--red)"></i></button>
    </div>
  `).join('');
}

function renderClassOverview() {
  const container = document.getElementById('classOverviewContent');
  if (!container) return;
  
  const stats = {};
  allApplications.forEach(app => {
    if (app.status === 'accepted' && app.grade) {
      if (!stats[app.grade]) stats[app.grade] = 0;
      stats[app.grade]++;
    }
  });

  if (Object.keys(stats).length === 0) {
    container.innerHTML = '<div style="color:var(--muted); font-size:0.9rem;">Hozircha qabul qilingan o\'quvchilar yo\'q.</div>';
    return;
  }

  container.innerHTML = Object.keys(stats).sort().map(className => {
    const count = stats[className];
    const max = 20; 
    const percent = Math.min(100, (count / max) * 100);
    const color = count >= max ? 'var(--green)' : 'var(--blue)';
    return `
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px; flex-wrap:wrap; cursor:pointer; padding:6px; border-radius:8px; transition:background 0.2s;" onmouseover="this.style.background='var(--line)'" onmouseout="this.style.background='transparent'" onclick="document.getElementById('gradeFilter').value='${className}'; document.getElementById('gradeFilter').dispatchEvent(new Event('change')); document.getElementById('tableBody').scrollIntoView({behavior:'smooth'})" title="Shu sinf ro'yxatini ko'rish">
        <strong style="width:120px; font-size:0.9rem;">${className}:</strong>
        <div style="width:140px; height:8px; background:var(--line); border-radius:4px; overflow:hidden;">
          <div style="width:${percent}%; height:100%; background:${color};"></div>
        </div>
        <span style="color:var(--muted); font-size:0.8rem; font-family:'JetBrains Mono', monospace;">${count}/${max} ${count>=max?'✅':''}</span>
      </div>
    `;
  }).join('');
}

function renderTable() {
  const searchInput = document.getElementById('searchInput');
  const searchText = (searchInput?.value || '').toLowerCase();
  const gradeFilter = document.getElementById('gradeFilter');
  const filterGrade = gradeFilter ? gradeFilter.value : '';

  let filtered = allApplications;

  if (currentFilter !== 'all') {
    filtered = filtered.filter(a => a.status === currentFilter);
  }

  if (filterGrade) {
    filtered = filtered.filter(a => a.grade === filterGrade);
  }

  if (searchText) {
    filtered = filtered.filter(a =>
      (a.full_name || '').toLowerCase().includes(searchText) ||
      (a.phone || '').includes(searchText)
    );
  }

  const tbody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const resultCount = document.getElementById('resultCount');

  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    if (resultCount) resultCount.textContent = '';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (resultCount) resultCount.textContent = `Topildi: ${filtered.length}`;

  const statusMap = {
    'new': 'Yangi',
    'called': 'Gaplashildi',
    'no_answer': 'Ko\'tarmadi',
    'accepted': 'Qabul qilindi',
    'rejected': 'Rad etildi'
  };

  tbody.innerHTML = filtered.map((app, idx) => {
    const isOld = app.student_type === 'Eski o\'quvchi';
    const typeBadge = isOld 
      ? `<span style="display:inline-block; margin-top:4px; font-size:0.75rem; background:rgba(34,197,94,0.1); color:var(--green); padding:2px 8px; border-radius:12px; font-weight:700;"><i class="bi bi-person-hearts"></i> Eski o'quvchi</span>`
      : `<span style="display:inline-block; margin-top:4px; font-size:0.75rem; background:rgba(59,130,246,0.1); color:var(--blue); padding:2px 8px; border-radius:12px; font-weight:700;"><i class="bi bi-person-badge-fill"></i> Yangi o'quvchi</span>`;

    return `
    <tr>
      <td>${idx + 1}</td>
      <td>
        <div style="font-weight:800; color:var(--navy-950);">${app.full_name || '—'}</div>
        ${typeBadge}
      </td>
      <td>${app.phone || '—'}</td>
      <td>${app.grade || '—'}</td>
      <td><span class="badge-status badge-${app.status || 'new'}">${statusMap[app.status] || app.status}</span></td>
      <td>${new Date(app.created_at).toLocaleDateString('uz-UZ')}</td>
      <td style="text-align:right;">
        <button class="action-btn" title="O'zgartirish" onclick="editApplication(${app.id})"><i class="bi bi-pencil-square"></i></button>
        <button class="action-btn" style="color:var(--red);" title="O'chirish" onclick="deleteApplication(${app.id})"><i class="bi bi-trash3"></i></button>
      </td>
    </tr>
    `;
  }).join('');
}

async function editApplication(id) {
  const app = allApplications.find(a => a.id === id);
  if (!app) return;

  const modal = document.getElementById('detailModal');
  const backdrop = document.getElementById('modalBackdrop');
  const modalBody = document.getElementById('modalBody');
  const modalSaveBtn = document.getElementById('modalSaveBtn');

  if (!modal || !modalBody) return;

  const statuses = [
    {val: 'new', lbl: 'Yangi', icon: '<i class="bi bi-star-fill" style="color:var(--blue)"></i>'},
    {val: 'called', lbl: 'Gaplashildi', icon: '<i class="bi bi-telephone-fill" style="color:#a4750f"></i>'},
    {val: 'no_answer', lbl: 'Ko\'tarmadi', icon: '<i class="bi bi-telephone-x-fill" style="color:var(--muted)"></i>'},
    {val: 'accepted', lbl: 'Qabul qilindi', icon: '<i class="bi bi-check-circle-fill" style="color:var(--green)"></i>'},
    {val: 'rejected', lbl: 'Rad etildi', icon: '<i class="bi bi-x-circle-fill" style="color:var(--red)"></i>'}
  ];
  
  const transports = [
    {val: '', lbl: 'Tanlanmagan', icon: '<i class="bi bi-dash-circle"></i>'},
    {val: 'Yotoqxonada turadi', lbl: 'Yotoqxona', icon: '<i class="bi bi-building"></i>'},
    {val: 'Maktab transportida qatnaydi', lbl: 'Avtobus', icon: '<i class="bi bi-bus-front-fill"></i>'},
    {val: 'O\'zi qatnaydi', lbl: 'O\'zi', icon: '<i class="bi bi-person-walking"></i>'}
  ];

  const enrollments = [
    {val: '', lbl: 'Tanlanmagan', icon: '<i class="bi bi-dash-circle"></i>'},
    {val: 'Sentyabr', lbl: 'Sentyabr', icon: '<i class="bi bi-calendar-event-fill" style="color:#d97706"></i>'},
    {val: 'Avgust', lbl: 'Avgust', icon: '<i class="bi bi-sun-fill" style="color:#eab308"></i>'},
    {val: 'Hozir', lbl: 'Hozir', icon: '<i class="bi bi-lightning-fill" style="color:var(--blue)"></i>'}
  ];

  const studentTypes = [
    {val: 'Yangi o\'quvchi', lbl: 'Yangi o\'quvchi', icon: '<i class="bi bi-person-badge-fill" style="color:var(--blue)"></i>'},
    {val: 'Eski o\'quvchi', lbl: 'Eski o\'quvchi', icon: '<i class="bi bi-person-hearts" style="color:var(--green)"></i>'}
  ];

  modalBody.innerHTML = `
    <div style="background:rgba(0,0,0,0.02); padding:14px 16px; border-radius:12px; margin-bottom:16px;">
      <div style="font-size:0.85rem; color:var(--muted); margin-bottom:10px;"><i class="bi bi-info-circle"></i> O'quvchi ma'lumotlarini tahrirlash:</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div>
          <label style="font-size:0.8rem; font-weight:700; color:var(--muted);">F.I.SH:</label>
          <input type="text" id="editFullName" value="${app.full_name || ''}" style="width:100%; border-radius:8px; border:1px solid var(--line); padding:8px 12px; font-size:.95rem; font-weight:600;">
        </div>
        <div>
          <label style="font-size:0.8rem; font-weight:700; color:var(--muted);">Telefon raqami:</label>
          <input type="text" id="editPhone" value="${app.phone || ''}" style="width:100%; border-radius:8px; border:1px solid var(--line); padding:8px 12px; font-size:.95rem; font-family:'JetBrains Mono', monospace;">
        </div>
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <div class="k" style="margin-bottom:6px; font-weight:700; font-size:0.85rem; color:var(--muted);">O'quvchi turi:</div>
      <div class="icon-radio-group">
        ${studentTypes.map(st => `
          <label>
            <input type="radio" name="editStudentType" value="${st.val}" class="icon-radio-input" ${app.student_type === st.val || (!app.student_type && st.val === 'Yangi o\'quvchi') ? 'checked' : ''}>
            <div class="icon-radio-label">${st.icon} ${st.lbl}</div>
          </label>
        `).join('')}
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <div class="k" style="margin-bottom:6px; font-weight:700; font-size:0.85rem; color:var(--muted);">Holatni belgilang:</div>
      <div class="icon-radio-group">
        ${statuses.map(s => `
          <label>
            <input type="radio" name="editStatus" value="${s.val}" class="icon-radio-input" ${app.status === s.val ? 'checked' : ''}>
            <div class="icon-radio-label">${s.icon} ${s.lbl}</div>
          </label>
        `).join('')}
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <div class="k" style="margin-bottom:6px; font-weight:700; font-size:0.85rem; color:var(--muted);">Sinfni tanlang:</div>
      <div class="icon-radio-group">
        <label>
          <input type="radio" name="editGrade" value="" class="icon-radio-input" ${!app.grade ? 'checked' : ''}>
          <div class="icon-radio-label"><i class="bi bi-dash-circle"></i> Tanlanmagan</div>
        </label>
        ${allClasses.map(c => `
          <label>
            <input type="radio" name="editGrade" value="${c.name}" class="icon-radio-input" ${app.grade === c.name ? 'checked' : ''}>
            <div class="icon-radio-label"><i class="bi bi-mortarboard-fill"></i> ${c.name}</div>
          </label>
        `).join('')}
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <div class="k" style="margin-bottom:6px; font-weight:700; font-size:0.85rem; color:var(--muted);">Qachon keladi? (O'qishni boshlash vaqti):</div>
      <div class="icon-radio-group">
        ${enrollments.map(e => `
          <label>
            <input type="radio" name="editEnrollment" value="${e.val}" class="icon-radio-input" ${app.enrollment_month === e.val || (!app.enrollment_month && e.val === '') ? 'checked' : ''}>
            <div class="icon-radio-label">${e.icon} ${e.lbl}</div>
          </label>
        `).join('')}
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <div class="k" style="margin-bottom:6px; font-weight:700; font-size:0.85rem; color:var(--muted);">Qatnov turi:</div>
      <div class="icon-radio-group">
        ${transports.map(t => `
          <label>
            <input type="radio" name="editTransport" value="${t.val}" class="icon-radio-input" ${app.transport_type === t.val || (!app.transport_type && t.val === '') ? 'checked' : ''}>
            <div class="icon-radio-label">${t.icon} ${t.lbl}</div>
          </label>
        `).join('')}
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <div class="k" style="margin-bottom:6px; font-weight:700; font-size:0.85rem; color:var(--muted);">Manzil:</div>
      <input type="text" id="editAddress" value="${app.address || ''}" placeholder="Tuman, ko'cha, uy..." style="width:100%; border-radius:8px; border:1px solid var(--line); padding:10px 14px; font-size:.9rem;">
    </div>

    <div style="margin-bottom:16px;">
      <div class="k" style="margin-bottom:6px; font-weight:700; font-size:0.85rem; color:var(--muted);">Izohlar (Qo'shimcha ma'lumotlar):</div>
      <textarea id="editNotes" placeholder="O'quvchi haqida yoki suhbat xulosasi..." style="width:100%; border-radius:8px; border:1px solid var(--line); padding:10px 14px; font-size:.9rem; min-height:70px;">${app.notes || ''}</textarea>
    </div>
  `;

  modalSaveBtn.onclick = async function () {
    const newFullName = document.getElementById('editFullName')?.value.trim() || app.full_name;
    const newPhone = document.getElementById('editPhone')?.value.trim() || app.phone;
    const newStatus = document.querySelector('input[name="editStatus"]:checked')?.value || app.status;
    const newGrade = document.querySelector('input[name="editGrade"]:checked')?.value || '';
    const newAddress = document.getElementById('editAddress')?.value || '';
    const newTransport = document.querySelector('input[name="editTransport"]:checked')?.value || '';
    const newEnrollment = document.querySelector('input[name="editEnrollment"]:checked')?.value || '';
    const newStudentType = document.querySelector('input[name="editStudentType"]:checked')?.value || 'Yangi o\'quvchi';
    const newNotes = document.getElementById('editNotes')?.value || '';

    if (supabaseClient) {
      const { error } = await supabaseClient
        .from('applications')
        .update({ 
          full_name: newFullName,
          phone: newPhone,
          status: newStatus, 
          grade: newGrade, 
          address: newAddress, 
          transport_type: newTransport,
          enrollment_month: newEnrollment,
          student_type: newStudentType,
          notes: newNotes 
        })
        .eq('id', id);

      if (error) {
        window.hitsToast('O\'zgartirishda xato', 'danger');
        return;
      }
    }

    modal.classList.remove('show');
    backdrop.classList.remove('show');
    loadApplications();
    window.hitsToast('O\'zgartirildi', 'success');
  };

  const closeBtn = document.getElementById('modalCloseBtn');
  const cancelBtn = document.getElementById('modalCancelBtn');

  const closeModal = function () {
    modal.classList.remove('show');
    backdrop.classList.remove('show');
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  backdrop.classList.add('show');
  modal.classList.add('show');
}

async function deleteApplication(id) {
  if (!confirm('Arizani o\'chirasizmi?')) return;

  if (supabaseClient) {
    const { error } = await supabaseClient
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) {
      window.hitsToast('O\'chirishda xato', 'danger');
      return;
    }
  }

  loadApplications();
  window.hitsToast('O\'chirildi', 'success');
}

function exportToCSV() {
  if (allApplications.length === 0) {
    window.hitsToast('Eksport qilish uchun ma\'lumot yo\'q', 'danger');
    return;
  }

  const headers = ['ID', 'F.I.SH', 'Telefon', 'Sinf', 'Manzil', 'Qatnov', 'Holat', 'Sana', 'Izohlar'];
  const rows = allApplications.map((app, idx) => [
    idx + 1,
    app.full_name,
    app.phone,
    app.grade || '—',
    app.address || '—',
    app.transport_type || '—',
    app.status,
    new Date(app.created_at).toLocaleDateString('uz-UZ'),
    app.notes || ''
  ]);

  const csv = [headers, ...rows].map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `arizalar_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.hitsToast('CSV yuklab olingan', 'success');
}
