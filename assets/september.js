// Login tekshiruvi
if (sessionStorage.getItem('hitAdminLogged') !== 'true') {
  window.location.href = 'login.html';
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  sessionStorage.removeItem('hitAdminLogged');
  window.location.href = 'login.html';
});

let septApplications = [];

async function loadSeptemberStudents() {
  if (!window.supabase) {
    alert("Supabase ulanmadi, internetni tekshiring yoki sahifani yangilang.");
    return;
  }
  
  const supabaseUrl = window.HITS_CONFIG.SUPABASE_URL;
  const supabaseKey = window.HITS_CONFIG.SUPABASE_KEY;
  const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabaseClient
      .from('applications')
      .select('*')
      .eq('enrollment_month', 'Sentyabr')
      .order('created_at', { ascending: false });

    if (error) throw error;

    septApplications = data || [];
    renderSeptemberCards();
  } catch (err) {
    console.error("Xatolik:", err);
    alert("Ma'lumotlarni yuklashda xatolik yuz berdi.");
  }
}

function renderSeptemberCards() {
  const content = document.getElementById('septemberContent');
  const emptyState = document.getElementById('emptyState');
  const subtitle = document.getElementById('septemberSubtitle');

  if (septApplications.length === 0) {
    content.innerHTML = '';
    emptyState.style.display = 'block';
    subtitle.innerText = `Jami: 0 ta o'quvchi`;
    return;
  }

  emptyState.style.display = 'none';
  subtitle.innerText = `Jami: ${septApplications.length} ta o'quvchi`;

  const oldStudents = septApplications.filter(a => a.student_type === 'Eski o\'quvchi');
  const newStudents = septApplications.filter(a => a.student_type !== 'Eski o\'quvchi');

  let html = '';

  const statusMap = {
    'new': 'Yangi',
    'called': 'Gaplashildi',
    'no_answer': 'Ko\'tarmadi',
    'accepted': 'Qabul qilindi',
    'rejected': 'Rad etildi'
  };

  const badgeMap = {
    'new': 'badge-info',
    'called': 'badge-warning',
    'no_answer': 'badge-secondary',
    'accepted': 'badge-success',
    'rejected': 'badge-danger'
  };

  const createCard = (app, isOld) => {
    const typeLbl = isOld ? '<i class="fas fa-user-check"></i> Eski o\'quvchi' : '<i class="fas fa-user"></i> Yangi o\'quvchi';
    const cardColor = isOld ? 'card-success' : 'card-primary';
    const badgeColor = isOld ? 'bg-success' : 'bg-primary';

    return `
      <div class="col-md-4 col-sm-6 col-12">
        <div class="card card-outline ${cardColor}">
          <div class="card-header">
            <h3 class="card-title font-weight-bold">${app.full_name || '—'}</h3>
            <div class="card-tools">
              <span class="badge ${badgeColor}">${typeLbl}</span>
            </div>
          </div>
          <div class="card-body p-0">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <b>Telefon</b> 
                <span><code>${app.phone || '—'}</code></span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <b>Sinf</b> 
                <span>${app.grade || '—'}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <b>Qatnov</b> 
                <span class="text-muted">${app.transport_type || '—'}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <b>Holat</b> 
                <span class="badge ${badgeMap[app.status] || 'badge-primary'}">${statusMap[app.status] || app.status}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    `;
  };

  if (oldStudents.length > 0) {
    html += `
      <h5 class="mt-4 mb-2"><i class="fas fa-user-check text-success"></i> Eski O'quvchilar (${oldStudents.length})</h5>
      <div class="row">
        ${oldStudents.map(app => createCard(app, true)).join('')}
      </div>
    `;
  }

  if (newStudents.length > 0) {
    html += `
      <h5 class="mt-4 mb-2"><i class="fas fa-user text-primary"></i> Yangi O'quvchilar (${newStudents.length})</h5>
      <div class="row">
        ${newStudents.map(app => createCard(app, false)).join('')}
      </div>
    `;
  }

  content.innerHTML = html;
}

// Export CSV
document.getElementById('exportSeptBtn')?.addEventListener('click', () => {
  if (septApplications.length === 0) {
    alert("Yuklash uchun ma'lumot yo'q.");
    return;
  }

  const headers = ['ID', 'F.I.SH', 'Turi', 'Telefon', 'Sinf', 'Manzil', 'Qatnov', 'Holat', 'Ro\'yxatdan o\'tgan'];
  const statusMap = {
    'new': 'Yangi',
    'called': 'Gaplashildi',
    'no_answer': 'Ko\'tarmadi',
    'accepted': 'Qabul qilindi',
    'rejected': 'Rad etildi'
  };

  const rows = septApplications.map((app, idx) => [
    idx + 1,
    app.full_name,
    app.student_type || 'Yangi o\'quvchi',
    app.phone,
    app.grade || '—',
    app.address || '—',
    app.transport_type || '—',
    statusMap[app.status] || app.status,
    new Date(app.created_at).toLocaleDateString('uz-UZ')
  ]);

  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(',') + "\n"
    + rows.map(e => e.map(item => `"${String(item).replace(/"/g, '""')}"`).join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `sentyabr_qabuli_${new Date().toLocaleDateString('uz-UZ')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Kutish va ishga tushirish
window.addEventListener('DOMContentLoaded', () => {
  const interval = setInterval(() => {
    if (window.HITS_CONFIG && window.supabase) {
      clearInterval(interval);
      loadSeptemberStudents();
    }
  }, 100);
});
