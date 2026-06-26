// Login tekshiruvi
if (sessionStorage.getItem('hitAdminLogged') !== 'true') {
  window.location.href = 'admin.html';
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  sessionStorage.removeItem('hitAdminLogged');
  window.location.href = 'admin.html';
});

let allApplications = [];
let allClasses = [];

async function loadAnalytics() {
  if (!window.supabase) {
    alert("Supabase ulanmadi, internetni tekshiring yoki sahifani yangilang.");
    return;
  }
  
  // Asosiy js dan muhit o'zgaruvchilarini olish
  const supabaseUrl = window.ENV_SUPABASE_URL;
  const supabaseKey = window.ENV_SUPABASE_KEY;
  const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

  try {
    // Ikkala jadvalni bir vaqtda tortish
    const [appsRes, classesRes] = await Promise.all([
      supabaseClient.from('applications').select('*'),
      supabaseClient.from('classes').select('*')
    ]);

    if (appsRes.error) throw appsRes.error;
    if (classesRes.error && classesRes.error.code !== '42P01') throw classesRes.error; // 42P01 = table not found

    allApplications = appsRes.data || [];
    allClasses = classesRes.data || [];

    renderAnalytics();
  } catch (err) {
    console.error("Xatolik:", err);
    alert("Ma'lumotlarni yuklashda xatolik yuz berdi.");
  }
}

function renderAnalytics() {
  // Umumiy statistika
  const total = allApplications.length;
  const accepted = allApplications.filter(a => a.status === 'accepted');
  const rejected = allApplications.filter(a => a.status === 'rejected' || a.status === 'no_answer');
  const pending = allApplications.filter(a => a.status === 'new' || a.status === 'called');

  document.getElementById('statTotal').innerText = total;
  document.getElementById('statAccepted').innerText = accepted.length;
  document.getElementById('statRejected').innerText = rejected.length;
  document.getElementById('statPending').innerText = pending.length;

  // Logistika statistika (faqat qabul qilinganlar orasidan)
  let dorm = 0, bus = 0, walk = 0, none = 0;
  accepted.forEach(a => {
    if (a.transport_type === 'Yotoqxonada turadi') dorm++;
    else if (a.transport_type === 'Maktab transportida qatnaydi') bus++;
    else if (a.transport_type === "O'zi qatnaydi") walk++;
    else none++;
  });

  document.getElementById('statDorm').innerText = dorm;
  document.getElementById('statBus').innerText = bus;
  document.getElementById('statWalk').innerText = walk;
  document.getElementById('statNone').innerText = none;

  // Sinflar to'ldirilishi
  const classesGrid = document.getElementById('classesGrid');
  
  if (allClasses.length === 0) {
    classesGrid.innerHTML = `<div style="color:var(--muted); font-size:0.9rem;">Sinflar jadvali hali yaratilmagan. Admin paneldan sinf qo'shing.</div>`;
    return;
  }

  // Sinf bo'yicha qabul qilingan o'quvchilar sonini hisoblash
  const classCounts = {};
  allClasses.forEach(c => classCounts[c.name] = 0);

  accepted.forEach(a => {
    if (a.grade && classCounts[a.grade] !== undefined) {
      classCounts[a.grade]++;
    }
  });

  classesGrid.innerHTML = allClasses.map(c => {
    const count = classCounts[c.name];
    const max = 20;
    const percent = Math.min(100, (count / max) * 100);
    const color = count >= max ? 'var(--green)' : 'var(--navy-600)';

    return `
      <div class="class-card">
        <div class="class-card-header">
          <div class="class-card-title">${c.name}</div>
          ${count >= max ? '<i class="bi bi-check-circle-fill" style="color:var(--green);"></i> To\'lgan' : ''}
        </div>
        <div class="progress-bg">
          <div class="progress-fill" style="width: ${percent}%; background: ${color};"></div>
        </div>
        <div class="progress-text">
          <span style="font-family:'JetBrains Mono', monospace; color:${count >= max ? 'var(--green)' : 'var(--ink)'}; font-size:1rem; font-weight:800;">${count}</span> / ${max} o'quvchi
        </div>
      </div>
    `;
  }).join('');
}

// Global scriptlar yuklanganidan keyin ishlashi uchun
window.addEventListener('DOMContentLoaded', () => {
  // muhit o'zgaruvchilari main.js da bor, u analytics.js dan oldinmi yoki keyinmi yuklanishi aniq emasligi uchun
  // setTimeout yoki Interval orqali kutamiz. Ammo bu yerda supabase ulanishidan oldin biroz kutish kerak:
  const interval = setInterval(() => {
    if (window.ENV_SUPABASE_URL && window.supabase) {
      clearInterval(interval);
      loadAnalytics();
    }
  }, 100);
});
