// Login tekshiruvi
if (sessionStorage.getItem('hitAdminLogged') !== 'true') {
  window.location.href = 'admin.html';
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  sessionStorage.removeItem('hitAdminLogged');
  window.location.href = 'admin.html';
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

  const createCard = (app, isOld) => {
    const typeClass = isOld ? 'type-old' : 'type-new';
    const typeIcon = isOld ? '<i class="bi bi-person-hearts"></i>' : '<i class="bi bi-person-badge-fill"></i>';
    const typeLbl = isOld ? 'Eski o\'quvchi' : 'Yangi o\'quvchi';

    return `
      <div class="student-card">
        <div class="sc-head">
          <div class="sc-name">${app.full_name || '—'}</div>
          <div class="sc-type ${typeClass}">${typeIcon} ${typeLbl}</div>
        </div>
        <div class="sc-body">
          <div class="sc-item">
            <span class="sc-item-label">Telefon</span>
            <span class="sc-item-value" style="font-family:'JetBrains Mono', monospace;">${app.phone || '—'}</span>
          </div>
          <div class="sc-item">
            <span class="sc-item-label">Sinf</span>
            <span class="sc-item-value">${app.grade || '—'}</span>
          </div>
          <div class="sc-item">
            <span class="sc-item-label">Qatnov turi</span>
            <span class="sc-item-value">${app.transport_type || '—'}</span>
          </div>
          <div class="sc-item">
            <span class="sc-item-label">Holat</span>
            <span class="sc-item-value"><span class="badge-status badge-${app.status || 'new'}" style="margin:0;">${statusMap[app.status] || app.status}</span></span>
          </div>
        </div>
      </div>
    `;
  };

  if (oldStudents.length > 0) {
    html += `
      <div class="section-label"><i class="bi bi-person-hearts" style="color:var(--green);"></i> Eski O'quvchilar (${oldStudents.length})</div>
      <div class="student-grid">
        ${oldStudents.map(app => createCard(app, true)).join('')}
      </div>
    `;
  }

  if (newStudents.length > 0) {
    html += `
      <div class="section-label"><i class="bi bi-person-badge-fill" style="color:var(--blue);"></i> Yangi O'quvchilar (${newStudents.length})</div>
      <div class="student-grid">
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
