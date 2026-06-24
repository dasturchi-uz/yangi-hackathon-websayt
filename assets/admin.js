let supabaseClient;
let allApplications = [];
let currentFilter = 'all';

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

  if (loginBtn && loginScreen && adminApp) {
  async function handleLogin() {
    if (!passwordInput) return;
    const pwd = passwordInput.value.trim();
    // Simple SHA-256 hashing for password check
    const msgBuffer = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex === window.HITS_CONFIG.ADMIN_PASSWORD_HASH) {
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
  
  // Populate grade filter
  const gradeFilter = document.getElementById('gradeFilter');
  if (gradeFilter) {
    gradeFilter.addEventListener('change', renderTable);
    const baseGrades = ['1-sinf', '2-sinf', '3-sinf', '4-sinf', '5-sinf', '6-sinf', '7-sinf', '8-sinf', '9-sinf', '10-sinf', '11-sinf'];
    baseGrades.forEach(bg => {
      ['A', 'B', 'C', 'D'].forEach(sec => {
        const val = bg.replace('-sinf', `${sec}-sinf`);
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        gradeFilter.appendChild(opt);
      });
    });
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

function renderClassOverview() {
  const container = document.getElementById('classOverviewContent');
  if (!container) return;
  
  const classStats = {};
  allApplications.forEach(app => {
    if (app.status === 'accepted' && app.grade) {
      const match = app.grade.match(/^(\d+)([A-D])-sinf$/);
      if (match) {
        const num = match[1];
        const sec = match[2];
        if (!classStats[num]) classStats[num] = { 'A':0, 'B':0, 'C':0, 'D':0 };
        classStats[num][sec]++;
      }
    }
  });

  if (Object.keys(classStats).length === 0) {
    container.innerHTML = '<div style="color:var(--muted); font-size:0.9rem;">Hozircha qabul qilingan o\'quvchilar yo\'q.</div>';
    return;
  }

  const html = [];
  Object.keys(classStats).sort((a, b) => parseInt(a) - parseInt(b)).forEach(num => {
    const secs = classStats[num];
    let rowHtml = `<div style="display:flex; align-items:center; gap:12px; margin-bottom:8px; flex-wrap:wrap;">`;
    rowHtml += `<strong style="width:60px;">${num}-sinf:</strong>`;
    
    ['A', 'B', 'C', 'D'].forEach(sec => {
      const count = secs[sec];
      if (count > 0 || sec === 'A') {
        const percent = Math.min(100, (count / 20) * 100);
        const color = count >= 20 ? 'var(--green)' : 'var(--blue)';
        rowHtml += `
          <div style="display:flex; align-items:center; gap:6px; font-size:0.85rem; font-family:'JetBrains Mono', monospace;">
            <span style="font-weight:bold;">${sec}</span>
            <div style="width:80px; height:8px; background:var(--line); border-radius:4px; overflow:hidden;">
              <div style="width:${percent}%; height:100%; background:${color};"></div>
            </div>
            <span style="color:var(--muted); font-size:0.75rem;">${count}/20 ${count>=20?'✅':''}</span>
          </div>
        `;
      }
    });
    rowHtml += `</div>`;
    html.push(rowHtml);
  });
  
  container.innerHTML = html.join('');
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
  const baseGrades = ['1-sinf', '2-sinf', '3-sinf', '4-sinf', '5-sinf', '6-sinf', '7-sinf', '8-sinf', '9-sinf', '10-sinf', '11-sinf'];
  
  // Dynamically populate sections (A, B, C, D)
  const grades = [];
  baseGrades.forEach(bg => {
    ['A', 'B', 'C', 'D'].forEach(sec => {
      grades.push(bg.replace('-sinf', `${sec}-sinf`));
    });
  });

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
        ${grades.map(g => `<option value="${g}" ${app.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
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
