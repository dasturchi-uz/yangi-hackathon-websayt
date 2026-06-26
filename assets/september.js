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
    renderSeptemberTable();
  } catch (err) {
    console.error("Xatolik:", err);
    alert("Ma'lumotlarni yuklashda xatolik yuz berdi.");
  }
}

function renderSeptemberTable() {
  const tbody = document.getElementById('septemberTableBody');
  const emptyState = document.getElementById('emptyState');
  const subtitle = document.getElementById('septemberSubtitle');

  if (septApplications.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    subtitle.innerText = `Jami: 0 ta o'quvchi`;
    return;
  }

  emptyState.style.display = 'none';
  subtitle.innerText = `Jami: ${septApplications.length} ta o'quvchi`;

  const statusMap = {
    'new': 'Yangi',
    'called': 'Gaplashildi',
    'no_answer': 'Ko\'tarmadi',
    'accepted': 'Qabul qilindi',
    'rejected': 'Rad etildi'
  };

  tbody.innerHTML = septApplications.map((app, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${app.full_name || '—'}</strong></td>
      <td style="font-family:'JetBrains Mono', monospace;">${app.phone || '—'}</td>
      <td><span style="background:var(--paper); padding:4px 8px; border-radius:6px; font-weight:600; border:1px solid var(--line); font-size:0.85rem;">${app.grade || '—'}</span></td>
      <td><span style="font-size:0.85rem;">${app.address || '—'}</span></td>
      <td><span style="font-size:0.85rem; color:var(--muted);">${app.transport_type || '—'}</span></td>
      <td><span class="badge-status badge-${app.status || 'new'}">${statusMap[app.status] || app.status}</span></td>
      <td><span style="color:var(--muted); font-size:0.85rem;">${new Date(app.created_at).toLocaleDateString('uz-UZ')}</span></td>
    </tr>
  `).join('');
}

// Export CSV
document.getElementById('exportSeptBtn')?.addEventListener('click', () => {
  if (septApplications.length === 0) {
    alert("Yuklash uchun ma'lumot yo'q.");
    return;
  }

  const headers = ['ID', 'F.I.SH', 'Telefon', 'Sinf', 'Manzil', 'Qatnov', 'Holat', 'Ro\'yxatdan o\'tgan'];
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
