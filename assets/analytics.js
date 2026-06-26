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
  
  const supabaseUrl = window.HITS_CONFIG.SUPABASE_URL;
  const supabaseKey = window.HITS_CONFIG.SUPABASE_KEY;
  const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

  try {
    const [appsRes, classesRes] = await Promise.all([
      supabaseClient.from('applications').select('*'),
      supabaseClient.from('classes').select('*')
    ]);

    if (appsRes.error) throw appsRes.error;
    if (classesRes.error && classesRes.error.code !== '42P01') throw classesRes.error;

    allApplications = appsRes.data || [];
    allClasses = classesRes.data || [];

    document.getElementById('loadingText').innerText = `Jami ${allApplications.length} ta o'quvchi ma'lumoti tahlil qilindi.`;
    renderCharts();
  } catch (err) {
    console.error("Xatolik:", err);
    alert("Ma'lumotlarni yuklashda xatolik yuz berdi.");
  }
}

function renderCharts() {
  const accepted = allApplications.filter(a => a.status === 'accepted');

  // Transport Data
  let dorm = 0, bus = 0, walk = 0, none = 0;
  accepted.forEach(a => {
    if (a.transport_type === 'Yotoqxonada turadi') dorm++;
    else if (a.transport_type === 'Maktab transportida qatnaydi') bus++;
    else if (a.transport_type === "O'zi qatnaydi") walk++;
    else none++;
  });

  const transportCtx = document.getElementById('transportChart');
  if (transportCtx) {
    new Chart(transportCtx, {
      type: 'doughnut',
      data: {
        labels: ['Yotoqxona', 'Avtobus', 'O\'zi qatnaydi', 'Noma\'lum'],
        datasets: [{
          data: [dorm, bus, walk, none],
          backgroundColor: ['#6c757d', '#17a2b8', '#28a745', '#ffc107'],
        }]
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
      }
    });
    
    document.getElementById('transportDetails').innerHTML = `
      <div><i class="fas fa-building text-secondary"></i> Yotoqxona: <b>${dorm}</b></div>
      <div><i class="fas fa-bus text-info"></i> Avtobus: <b>${bus}</b></div>
      <div><i class="fas fa-walking text-success"></i> O'zi: <b>${walk}</b></div>
      <div><i class="fas fa-question text-warning"></i> Noma'lum: <b>${none}</b></div>
    `;
  }

  // Grade Data
  const classCounts = {};
  allClasses.forEach(c => classCounts[c.name] = 0);
  
  accepted.forEach(a => {
    if (a.grade && classCounts[a.grade] !== undefined) {
      classCounts[a.grade]++;
    }
  });

  const gradeLabels = Object.keys(classCounts);
  const gradeData = Object.values(classCounts);

  const gradeCtx = document.getElementById('gradeChart');
  if (gradeCtx) {
    new Chart(gradeCtx, {
      type: 'bar',
      data: {
        labels: gradeLabels,
        datasets: [{
          label: "Qabul qilinganlar soni",
          data: gradeData,
          backgroundColor: '#007bff',
        }]
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 25 // Assuming 25 is max capacity for a class
          }
        }
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const interval = setInterval(() => {
    if (window.HITS_CONFIG && window.supabase) {
      clearInterval(interval);
      loadAnalytics();
    }
  }, 100);
});
