// Login tekshiruvi
if (sessionStorage.getItem('hitAdminLogged') !== 'true') {
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const adminApp = document.getElementById('adminApp');
  if (adminApp) adminApp.style.display = 'block';

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem('hitAdminLogged');
    window.location.href = 'login.html';
  });

  const checkSupa = setInterval(() => {
    if (window.supabaseClient) {
      clearInterval(checkSupa);
      loadDashboardData();
    } else if (window.supabase && window.HITS_CONFIG) {
      window.supabaseClient = window.supabase.createClient(window.HITS_CONFIG.SUPABASE_URL, window.HITS_CONFIG.SUPABASE_KEY);
      clearInterval(checkSupa);
      loadDashboardData();
    }
  }, 100);
});

async function loadDashboardData() {
  try {
    // Parallel fetching
    const [studentsRes, appsRes, classesRes] = await Promise.all([
      window.supabaseClient.from('current_students').select('grade'),
      window.supabaseClient.from('applications').select('status'),
      window.supabaseClient.from('classes').select('name')
    ]);

    const students = studentsRes.data || [];
    const apps = appsRes.data || [];
    const classes = classesRes.data || [];

    // Counters
    document.getElementById('dashTotalStudents').innerText = students.length;
    document.getElementById('dashTotalApps').innerText = apps.length;
    document.getElementById('dashTotalClasses').innerText = classes.length;
    
    const newApps = apps.filter(a => a.status === 'new').length;
    document.getElementById('dashTotalNewApps').innerText = newApps;

    // Process Classes Chart
    const classCounts = {};
    classes.forEach(c => classCounts[c.name] = 0);
    students.forEach(s => {
      if (s.grade && classCounts[s.grade] !== undefined) {
        classCounts[s.grade]++;
      }
    });

    const ctxClasses = document.getElementById('classesChart');
    if (ctxClasses) {
      new Chart(ctxClasses, {
        type: 'bar',
        data: {
          labels: Object.keys(classCounts),
          datasets: [{
            label: "O'quvchilar soni",
            data: Object.values(classCounts),
            backgroundColor: '#007bff'
          }]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    // Process Apps Chart
    const accepted = apps.filter(a => a.status === 'accepted').length;
    const rejected = apps.filter(a => a.status === 'rejected').length;

    const ctxApps = document.getElementById('appsChart');
    if (ctxApps) {
      new Chart(ctxApps, {
        type: 'doughnut',
        data: {
          labels: ['Yangi (Kutmoqda)', 'Qabul qilingan', 'Rad etilgan'],
          datasets: [{
            data: [newApps, accepted, rejected],
            backgroundColor: ['#ffc107', '#28a745', '#dc3545']
          }]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
        }
      });
    }

  } catch (err) {
    console.error("Dashboard yuklashda xato:", err);
    if(window.hitsToast) window.hitsToast("Ma'lumotlarni yuklashda xatolik yuz berdi", 'danger');
  }
}
