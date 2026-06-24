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
      loginScreen.style.display = 'none';
      adminApp.style.display = 'block';
      if (loginError) loginError.textContent = '';
      loadApplications();
    } else {
      if (loginError) loginError.textContent = 'Xato parol. Iltimos qayta urinib ko\'ring.';
    }
  }

  if (loginBtn && loginScreen && adminApp) {
    loginBtn.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') handleLogin();
    });
  }

  if (logoutBtn && loginScreen && adminApp) {
    logoutBtn.addEventListener('click', function () {
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
      <button class="action-btn" title="O'chirish" onclick="deleteClass(${c.id})">🗑️</button>
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
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px; flex-wrap:wrap;">
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

  tbody.innerHTML = filtered.map((app, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${app.full_name || '—'}</strong></td>
      <td>${app.phone || '—'}</td>
      <td>${app.grade || '—'}</td>
      <td><span class="badge-status badge-${app.status || 'new'}">${statusMap[app.status] || app.status}</span></td>
      <td>${new Date(app.created_at).toLocaleDateString('uz-UZ')}</td>
      <td style="text-align:right;">
        <button class="action-btn" title="O'zgartirish" onclick="editApplication(${app.id})">✏️</button>
        <button class="action-btn" title="O'chirish" onclick="deleteApplication(${app.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
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
    {val: 'new', lbl: 'Yangi'},
    {val: 'called', lbl: 'Gaplashildi'},
    {val: 'no_answer', lbl: 'Ko\'tarmadi'},
    {val: 'accepted', lbl: 'Qabul qilindi'},
    {val: 'rejected', lbl: 'Rad etildi'}
  ];

  modalBody.innerHTML = `
    <div class="detail-row">
      <div class="k">F.I.SH:</div>
      <div class="v">${app.full_name}</div>
    </div>
    <div class="detail-row">
      <div class="k">Telefon:</div>
      <div class="v">${app.phone}</div>
    </div>
    <div class="detail-row">
      <div class="k">Holat:</div>
      <select id="editStatus" style="max-width:200px; border-radius:10px; border:1px solid var(--line); padding:8px; font-size:.9rem;" onchange="handleStatusChange()">
        ${statuses.map(s => `<option value="${s.val}" ${app.status === s.val ? 'selected' : ''}>${s.lbl}</option>`).join('')}
      </select>
    </div>
    <div class="detail-row">
      <div class="k">Sinf:</div>
      <select id="editGrade" style="max-width:200px; border-radius:10px; border:1px solid var(--line); padding:8px; font-size:.9rem;">
        <option value="">Tanlanmagan</option>
        ${allClasses.map(c => `<option value="${c.name}" ${app.grade === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="detail-row">
      <div class="k">Izohlar:</div>
      <textarea id="editNotes" style="width:100%; border-radius:10px; border:1px solid var(--line); padding:8px; font-size:.9rem; min-height:60px;">${app.notes || ''}</textarea>
    </div>
  `;

  modalSaveBtn.onclick = async function () {
    const newStatus = document.getElementById('editStatus')?.value || app.status;
    const newGrade = document.getElementById('editGrade')?.value || app.grade;
    const newNotes = document.getElementById('editNotes')?.value || '';

    if (supabaseClient) {
      const { error } = await supabaseClient
        .from('applications')
        .update({ status: newStatus, grade: newGrade, notes: newNotes })
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

  const headers = ['ID', 'F.I.SH', 'Telefon', 'Sinf', 'Holat', 'Sana', 'Izohlar'];
  const rows = allApplications.map((app, idx) => [
    idx + 1,
    app.full_name,
    app.phone,
    app.grade || '—',
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
