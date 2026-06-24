const supabaseUrl = 'https://hadgkmvlazkvhhmuxljg.supabase.co';
const supabaseKey = 'sb_publishable_vfAvrYTF0mNa2wbIP_O0Xw_y_ME4F3f';
let supabaseClient;
let allApplications = [];
let currentFilter = 'all';

if (window.supabase) {
  supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}

document.addEventListener('DOMContentLoaded', async function () {
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
        loadApplications();
      } else {
        if (loginError) loginError.textContent = 'Xato parol. Iltimos qayta urinib ko\'ring.';
      }
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
});

async function loadApplications() {
  if (!supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      window.hitsToast('Ma\'lumotlar yuklanmadi', 'danger');
      return;
    }

    allApplications = data || [];
    updateStatCards();
    renderTable();
  } catch (err) {
    console.error('Error:', err);
    window.hitsToast('Xato yuz berdi', 'danger');
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

function renderTable() {
  const searchInput = document.getElementById('searchInput');
  const searchText = (searchInput?.value || '').toLowerCase();

  let filtered = allApplications;

  if (currentFilter !== 'all') {
    filtered = filtered.filter(a => a.status === currentFilter);
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

  tbody.innerHTML = filtered.map((app, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${app.full_name || '—'}</strong></td>
      <td>${app.phone || '—'}</td>
      <td>${app.grade || '—'}</td>
      <td><span class="badge-status badge-${app.status || 'new'}">${app.status}</span></td>
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

  const statuses = ['new', 'called', 'no_answer', 'accepted', 'rejected'];
  const grades = ['1-sinf', '2-sinf', '3-sinf', '4-sinf', '5-sinf', '6-sinf', '7-sinf', '8-sinf', '9-sinf', '10-sinf', '11-sinf'];

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
      <select id="editStatus" style="max-width:200px; border-radius:10px; border:1px solid var(--line); padding:8px; font-size:.9rem;">
        ${statuses.map(s => `<option value="${s}" ${app.status === s ? 'selected' : ''}>${s}</option>`).join('')}
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
