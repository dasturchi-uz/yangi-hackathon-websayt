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
    {val: 'new', lbl: 'Yangi', icon: '🔵'},
    {val: 'called', lbl: 'Gaplashildi', icon: '📞'},
    {val: 'no_answer', lbl: 'Ko\'tarmadi', icon: '🔕'},
    {val: 'accepted', lbl: 'Qabul qilindi', icon: '✅'},
    {val: 'rejected', lbl: 'Rad etildi', icon: '❌'}
  ];
  
  const transports = [
    {val: '', lbl: 'Tanlanmagan', icon: '⚪'},
    {val: 'Yotoqxonada turadi', lbl: 'Yotoqxona', icon: '🛏️'},
    {val: 'Maktab transportida qatnaydi', lbl: 'Avtobus', icon: '🚌'},
    {val: 'O\'zi qatnaydi', lbl: 'O\'zi', icon: '🚶'}
  ];

  modalBody.innerHTML = `
    <div style="background:rgba(0,0,0,0.02); padding:12px 16px; border-radius:12px; margin-bottom:16px;">
      <div style="font-size:0.85rem; color:var(--muted); margin-bottom:4px;">O'quvchi ma'lumotlari:</div>
      <strong style="font-size:1.1rem; display:block;">${app.full_name}</strong>
      <div style="font-size:0.95rem; font-family:'JetBrains Mono', monospace; margin-top:4px;">📞 ${app.phone}</div>
    </div>

    <div style="margin-bottom:16px;">
      <div class="k" style="margin-bottom:8px; font-weight:700;">Holatni belgilang:</div>
      <div class="icon-radio-group">
        ${statuses.map(s => `
          <label>
            <input type="radio" name="editStatus" value="${s.val}" class="icon-radio-input" ${app.status === s.val ? 'checked' : ''}>
            <div class="icon-radio-label"><span>${s.icon}</span> ${s.lbl}</div>
          </label>
        `).join('')}
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <div class="k" style="margin-bottom:8px; font-weight:700;">Sinfni tanlang:</div>
      <div class="icon-radio-group">
        <label>
          <input type="radio" name="editGrade" value="" class="icon-radio-input" ${!app.grade ? 'checked' : ''}>
          <div class="icon-radio-label"><span>➖</span> Tanlanmagan</div>
        </label>
        ${allClasses.map(c => `
          <label>
            <input type="radio" name="editGrade" value="${c.name}" class="icon-radio-input" ${app.grade === c.name ? 'checked' : ''}>
            <div class="icon-radio-label"><span>🏫</span> ${c.name}</div>
          </label>
        `).join('')}
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <div class="k" style="margin-bottom:8px; font-weight:700;">Qatnov turi:</div>
      <div class="icon-radio-group">
        ${transports.map(t => `
          <label>
            <input type="radio" name="editTransport" value="${t.val}" class="icon-radio-input" ${app.transport_type === t.val || (!app.transport_type && t.val === '') ? 'checked' : ''}>
            <div class="icon-radio-label"><span>${t.icon}</span> ${t.lbl}</div>
          </label>
        `).join('')}
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <div class="k" style="margin-bottom:8px; font-weight:700;">Manzil:</div>
      <input type="text" id="editAddress" value="${app.address || ''}" placeholder="Tuman, ko'cha, uy..." style="width:100%; border-radius:10px; border:1px solid var(--line); padding:10px 14px; font-size:.9rem;">
    </div>

    <div style="margin-bottom:16px;">
      <div class="k" style="margin-bottom:8px; font-weight:700;">Izohlar (Qo'shimcha ma'lumotlar):</div>
      <textarea id="editNotes" placeholder="O'quvchi haqida yoki suhbat xulosasi..." style="width:100%; border-radius:10px; border:1px solid var(--line); padding:10px 14px; font-size:.9rem; min-height:70px;">${app.notes || ''}</textarea>
    </div>
  `;

  modalSaveBtn.onclick = async function () {
    const newStatus = document.querySelector('input[name="editStatus"]:checked')?.value || app.status;
    const newGrade = document.querySelector('input[name="editGrade"]:checked')?.value || '';
    const newAddress = document.getElementById('editAddress')?.value || '';
    const newTransport = document.querySelector('input[name="editTransport"]:checked')?.value || '';
    const newNotes = document.getElementById('editNotes')?.value || '';

    if (supabaseClient) {
      const { error } = await supabaseClient
        .from('applications')
        .update({ 
          status: newStatus, 
          grade: newGrade, 
          address: newAddress, 
          transport_type: newTransport, 
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
