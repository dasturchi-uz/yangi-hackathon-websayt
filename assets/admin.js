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
      $('#addStudentModal').modal('show');
    }
  });
}

if (addStudentCloseBtn) {
  addStudentCloseBtn.addEventListener('click', () => {
    if (addStudentModal) $('#addStudentModal').modal('hide');
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
      
      if (addStudentModal) $('#addStudentModal').modal('hide');
      
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
      $('#classesModal').modal('show');
    });
    classesModalCloseBtn.addEventListener('click', () => {
      $('#classesModal').modal('hide');
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
    <div class="d-flex justify-content-between align-items-center p-2 mb-2 bg-light rounded border">
      <strong>${c.name}</strong>
      <button class="btn btn-sm btn-outline-danger" title="O'chirish" onclick="deleteClass(${c.id})"><i class="fas fa-trash-alt"></i></button>
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
    const colorClass = count >= max ? 'bg-success' : 'bg-primary';
    return `
      <div class="progress-group" style="cursor:pointer;" onclick="document.getElementById('gradeFilter').value='${className}'; document.getElementById('gradeFilter').dispatchEvent(new Event('change')); document.getElementById('tableBody').scrollIntoView({behavior:'smooth'})" title="Shu sinf ro'yxatini ko'rish">
        <span class="progress-text">${className}</span>
        <span class="float-right"><b>${count}</b>/${max} ${count>=max?'<i class="fas fa-check text-success"></i>':''}</span>
        <div class="progress progress-sm">
          <div class="progress-bar ${colorClass}" style="width: ${percent}%"></div>
        </div>
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
      ? `<span class="badge badge-success mt-1"><i class="fas fa-user-check"></i> Eski o'quvchi</span>`
      : `<span class="badge badge-primary mt-1"><i class="fas fa-user"></i> Yangi o'quvchi</span>`;
    
    const badgeMap = {
      'new': 'badge-info',
      'called': 'badge-warning',
      'no_answer': 'badge-secondary',
      'accepted': 'badge-success',
      'rejected': 'badge-danger'
    };

    return `
    <tr style="cursor:pointer;" onclick="if(!event.target.closest('button')) editApplication(${app.id})">
      <td>${idx + 1}</td>
      <td>
        <strong>${app.full_name || '—'}</strong><br>
        ${typeBadge}
      </td>
      <td><code>${app.phone || '—'}</code></td>
      <td>${app.grade || '—'}</td>
      <td><span class="badge ${badgeMap[app.status] || 'badge-primary'}">${statusMap[app.status] || app.status}</span></td>
      <td class="text-muted text-sm">${new Date(app.created_at).toLocaleDateString('uz-UZ')}</td>
      <td class="text-right">
        <button class="btn btn-sm btn-outline-info" title="O'zgartirish" onclick="editApplication(${app.id})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-outline-danger" title="O'chirish" onclick="deleteApplication(${app.id})"><i class="fas fa-trash-alt"></i></button>
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
    {val: 'new', lbl: 'Yangi', icon: '<i class="fas fa-star text-info"></i>'},
    {val: 'called', lbl: 'Gaplashildi', icon: '<i class="fas fa-phone text-warning"></i>'},
    {val: 'no_answer', lbl: 'Ko\'tarmadi', icon: '<i class="fas fa-phone-slash text-secondary"></i>'},
    {val: 'accepted', lbl: 'Qabul qilindi', icon: '<i class="fas fa-check text-success"></i>'},
    {val: 'rejected', lbl: 'Rad etildi', icon: '<i class="fas fa-times text-danger"></i>'}
  ];
  
  const transports = [
    {val: '', lbl: 'Tanlanmagan', icon: '<i class="fas fa-minus-circle"></i>'},
    {val: 'Yotoqxonada turadi', lbl: 'Yotoqxona', icon: '<i class="fas fa-building text-secondary"></i>'},
    {val: 'Maktab transportida qatnaydi', lbl: 'Avtobus', icon: '<i class="fas fa-bus text-info"></i>'},
    {val: 'O\'zi qatnaydi', lbl: 'O\'zi', icon: '<i class="fas fa-walking text-success"></i>'}
  ];

  const enrollments = [
    {val: '', lbl: 'Tanlanmagan', icon: '<i class="fas fa-minus-circle"></i>'},
    {val: 'Sentyabr', lbl: 'Sentyabr', icon: '<i class="fas fa-leaf text-warning"></i>'},
    {val: 'Avgust', lbl: 'Avgust', icon: '<i class="fas fa-sun text-warning"></i>'},
    {val: 'Hozir', lbl: 'Hozir', icon: '<i class="fas fa-bolt text-info"></i>'}
  ];

  const studentTypes = [
    {val: 'Yangi o\'quvchi', lbl: 'Yangi o\'quvchi', icon: '<i class="fas fa-user text-primary"></i>'},
    {val: 'Eski o\'quvchi', lbl: 'Eski o\'quvchi', icon: '<i class="fas fa-user-check text-success"></i>'}
  ];

  modalBody.innerHTML = `
    <div class="alert alert-light border border-info mb-3">
      <i class="fas fa-info-circle text-info"></i> O'quvchi ma'lumotlarini tahrirlash:
      <div class="row mt-2">
        <div class="col-sm-6 form-group">
          <label>F.I.SH:</label>
          <input type="text" id="editFullName" value="${app.full_name || ''}" class="form-control font-weight-bold">
        </div>
        <div class="col-sm-6 form-group">
          <label>Telefon raqami:</label>
          <input type="text" id="editPhone" value="${app.phone || ''}" class="form-control text-monospace">
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>O'quvchi turi:</label>
      <div class="d-flex flex-wrap" style="gap:15px;">
        ${studentTypes.map((st, idx) => `
          <div class="custom-control custom-radio">
            <input type="radio" name="editStudentType" id="stType${idx}" value="${st.val}" class="custom-control-input" ${app.student_type === st.val || (!app.student_type && st.val === 'Yangi o\'quvchi') ? 'checked' : ''}>
            <label for="stType${idx}" class="custom-control-label">${st.icon} ${st.lbl}</label>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label>Holatni belgilang:</label>
      <div class="d-flex flex-wrap" style="gap:15px;">
        ${statuses.map((s, idx) => `
          <div class="custom-control custom-radio">
            <input type="radio" name="editStatus" id="stStatus${idx}" value="${s.val}" class="custom-control-input" ${app.status === s.val ? 'checked' : ''}>
            <label for="stStatus${idx}" class="custom-control-label">${s.icon} ${s.lbl}</label>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label>Sinfni tanlang:</label>
      <div class="d-flex flex-wrap" style="gap:15px;">
        <div class="custom-control custom-radio">
          <input type="radio" name="editGrade" id="stGradeNone" value="" class="custom-control-input" ${!app.grade ? 'checked' : ''}>
          <label for="stGradeNone" class="custom-control-label"><i class="fas fa-minus-circle text-secondary"></i> Tanlanmagan</label>
        </div>
        ${allClasses.map((c, idx) => `
          <div class="custom-control custom-radio">
            <input type="radio" name="editGrade" id="stGrade${idx}" value="${c.name}" class="custom-control-input" ${app.grade === c.name ? 'checked' : ''}>
            <label for="stGrade${idx}" class="custom-control-label"><i class="fas fa-user-graduate text-primary"></i> ${c.name}</label>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label>Qachon keladi?</label>
      <div class="d-flex flex-wrap" style="gap:15px;">
        ${enrollments.map((e, idx) => `
          <div class="custom-control custom-radio">
            <input type="radio" name="editEnrollment" id="stEn${idx}" value="${e.val}" class="custom-control-input" ${app.enrollment_month === e.val || (!app.enrollment_month && e.val === '') ? 'checked' : ''}>
            <label for="stEn${idx}" class="custom-control-label">${e.icon} ${e.lbl}</label>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label>Qatnov turi:</label>
      <div class="d-flex flex-wrap" style="gap:15px;">
        ${transports.map((t, idx) => `
          <div class="custom-control custom-radio">
            <input type="radio" name="editTransport" id="stTr${idx}" value="${t.val}" class="custom-control-input" ${app.transport_type === t.val || (!app.transport_type && t.val === '') ? 'checked' : ''}>
            <label for="stTr${idx}" class="custom-control-label">${t.icon} ${t.lbl}</label>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label>Manzil:</label>
      <input type="text" id="editAddress" value="${app.address || ''}" class="form-control" placeholder="Tuman, ko'cha, uy...">
    </div>

    <div class="form-group">
      <label>Izohlar:</label>
      <textarea id="editNotes" class="form-control" rows="3" placeholder="O'quvchi haqida yoki suhbat xulosasi...">${app.notes || ''}</textarea>
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

    $('#detailModal').modal('hide');
    loadApplications();
    window.hitsToast('O\'zgartirildi', 'success');
  };

  const closeBtn = document.getElementById('modalCloseBtn');
  const cancelBtn = document.getElementById('modalCancelBtn');

  const closeModal = function () {
    $('#detailModal').modal('hide');
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  $('#detailModal').modal('show');
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
