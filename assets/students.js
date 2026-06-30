// Login tekshiruvi
if (sessionStorage.getItem('hitAdminLogged') !== 'true') {
  window.location.href = 'login.html';
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  sessionStorage.removeItem('hitAdminLogged');
  window.location.href = 'login.html';
});

let currentStudents = [];
let allClasses = [];
let supabaseClient;

// Boshlang'ich yuklash
window.addEventListener('DOMContentLoaded', () => {
  const interval = setInterval(() => {
    if (window.HITS_CONFIG && window.supabase) {
      clearInterval(interval);
      supabaseClient = window.supabase.createClient(window.HITS_CONFIG.SUPABASE_URL, window.HITS_CONFIG.SUPABASE_KEY);
      loadData();
    }
  }, 100);
});

async function loadData() {
  const content = document.getElementById('studentsContent');
  try {
    const [stdRes, classesRes] = await Promise.all([
      supabaseClient.from('current_students').select('*').order('full_name'),
      supabaseClient.from('classes').select('*').order('name')
    ]);

    if (stdRes.error && stdRes.error.code !== '42P01') throw stdRes.error;
    if (classesRes.error && classesRes.error.code !== '42P01') throw classesRes.error;

    currentStudents = stdRes.data || [];
    allClasses = classesRes.data || [];
    
    populateGradeSelect();
    renderStudents();
  } catch (err) {
    console.error("Xatolik:", err);
    let errorMsg = "Ma'lumotlarni yuklashda xatolik yuz berdi.";
    if (err.code === '42501') {
      errorMsg = "Supabase da RLS (Row Level Security) yoniq qolgan. Iltimos SQL orqali RLS ni o'chiring.";
    }
    
    if (content) {
      content.innerHTML = `
        <div class="alert alert-danger m-4">
          <h5><i class="icon fas fa-ban"></i> Xatolik!</h5>
          ${errorMsg} <br><br>
          <small>Batafsil: ${err.message || err.code}</small>
        </div>
      `;
    }
  }
}

function populateGradeSelect() {
  const stdGrade = document.getElementById('stdGrade');
  if(!stdGrade) return;
  stdGrade.innerHTML = '<option value="">Tanlanmagan</option>' + 
    allClasses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

// -------------------------------------------------------------
// RENDER UI (Sinflar bo'yicha guruhlash)
// -------------------------------------------------------------
function renderStudents() {
  const content = document.getElementById('studentsContent');
  const subtitle = document.getElementById('studentsSubtitle');
  
  if (currentStudents.length === 0) {
    content.innerHTML = `
      <div class="text-center p-5 mt-4">
        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
        <h5>Hozircha hech kim yo'q</h5>
        <p class="text-muted">Maktabning o'quvchilari ushbu ro'yxatda paydo bo'ladi.</p>
      </div>
    `;
    subtitle.innerText = `Jami: 0 ta o'quvchi`;
    return;
  }
  
  subtitle.innerText = `Jami: ${currentStudents.length} ta o'quvchi`;

  // Sinflarga guruhlash
  const groups = {};
  // Avval barcha mavjud sinflar uchun bo'sh massiv ochamiz
  allClasses.forEach(c => groups[c.name] = []);
  groups['Sinfi yo\'q'] = [];

  currentStudents.forEach(std => {
    const grade = std.grade || 'Sinfi yo\'q';
    if (!groups[grade]) groups[grade] = [];
    groups[grade].push(std);
  });

  let html = '';

  Object.keys(groups).sort().forEach(grade => {
    const students = groups[grade];
    if (students.length === 0 && grade === 'Sinfi yo\'q') return; // Sinfi yo'qlar bo'lmasa yashirish
    
    html += `
      <div class="card card-outline card-primary collapsed-card">
        <div class="card-header" data-card-widget="collapse" style="cursor:pointer;">
          <h3 class="card-title font-weight-bold"><i class="fas fa-users text-primary mr-2"></i> ${grade}</h3>
          <div class="card-tools">
            <span class="badge badge-primary mr-2">${students.length} ta o'quvchi</span>
            <button type="button" class="btn btn-tool"><i class="fas fa-plus"></i></button>
          </div>
        </div>
        <div class="card-body p-0" style="display: none;">
          ${students.length > 0 ? `
            <table class="table table-striped table-valign-middle table-hover m-0">
              <thead>
                <tr>
                  <th style="width:50px;">#</th>
                  <th>F.I.SH</th>
                  <th>Telefon</th>
                  <th>Ota-ona</th>
                  <th>Qatnov</th>
                  <th class="text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                ${students.map((std, idx) => `
                  <tr style="cursor:pointer;" onclick="if(!event.target.closest('button')) editStudent(${std.id})">
                    <td>${idx + 1}</td>
                    <td><strong>${std.full_name}</strong></td>
                    <td><code>${std.phone || '—'}</code></td>
                    <td>${std.parent_name || '—'}</td>
                    <td><span class="text-muted text-sm">${std.transport_type || '—'}</span></td>
                    <td class="text-right">
                      <button class="btn btn-sm btn-outline-info" title="O'zgartirish" onclick="editStudent(${std.id})"><i class="fas fa-edit"></i></button>
                      <button class="btn btn-sm btn-outline-danger" title="O'chirish" onclick="deleteStudent(${std.id})"><i class="fas fa-trash-alt"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `<div class="p-4 text-center text-muted">Bu sinfda o'quvchilar yo'q</div>`}
        </div>
      </div>
    `;
  });

  content.innerHTML = html;
}

// -------------------------------------------------------------
// CRUD Lojika
// -------------------------------------------------------------
const stdModal = document.getElementById('stdModal');
const stdModalTitle = document.getElementById('stdModalTitle');

function openModal(isEdit) {
  $('#stdModal').modal('show');
  if (stdModalTitle) {
    stdModalTitle.innerHTML = isEdit 
      ? `<i class="fas fa-edit"></i> O'quvchini tahrirlash` 
      : `<i class="fas fa-user-plus"></i> Yangi o'quvchi`;
  }
}

function closeModal() {
  $('#stdModal').modal('hide');
  
  // Clear forms
  document.getElementById('stdId').value = '';
  document.getElementById('stdFullName').value = '';
  document.getElementById('stdGrade').value = '';
  document.getElementById('stdPhone').value = '';
  document.getElementById('stdParent').value = '';
  document.getElementById('stdTransport').value = '';
}

document.getElementById('addStdBtn')?.addEventListener('click', () => {
  closeModal(); // to clear
  openModal(false);
});

window.editStudent = function(id) {
  const std = currentStudents.find(s => s.id === id);
  if (!std) return;
  document.getElementById('stdId').value = std.id;
  document.getElementById('stdFullName').value = std.full_name || '';
  document.getElementById('stdGrade').value = std.grade || '';
  document.getElementById('stdPhone').value = std.phone || '';
  document.getElementById('stdParent').value = std.parent_name || '';
  document.getElementById('stdTransport').value = std.transport_type || '';
  openModal(true);
}

window.deleteStudent = async function(id) {
  if (!confirm("Rostdan ham bu o'quvchini butunlay o'chirib tashlamoqchimisiz?")) return;
  const { error } = await supabaseClient.from('current_students').delete().eq('id', id);
  if (error) {
    alert("O'chirishda xatolik: " + error.message);
    return;
  }
  window.hitsToast("O'quvchi o'chirildi", 'success');
  loadData();
}

document.getElementById('stdSaveBtn')?.addEventListener('click', async () => {
  const id = document.getElementById('stdId').value;
  const full_name = document.getElementById('stdFullName').value.trim();
  const grade = document.getElementById('stdGrade').value;
  const phone = document.getElementById('stdPhone').value.trim();
  const parent_name = document.getElementById('stdParent').value.trim();
  const transport_type = document.getElementById('stdTransport').value;

  if (!full_name) {
    alert("Ism va familiyani kiritish majburiy!");
    return;
  }

  const payload = { full_name, grade, phone, parent_name, transport_type };

  if (id) {
    // Update
    const { error } = await supabaseClient.from('current_students').update(payload).eq('id', id);
    if (error) {
      if (error.code === '42501') alert("Xatolik: Supabase da ushbu jadval uchun RLS (ruxsat) yopilgan. Iltimos SQL orqali RLS ni o'chiring.");
      else alert("Xatolik: " + error.message);
      return;
    }
    window.hitsToast("Saqlandi!", 'success');
  } else {
    // Insert
    const { error } = await supabaseClient.from('current_students').insert([payload]);
    if (error) {
      if (error.code === '42P01') alert("Xatolik: 'current_students' jadvali umuman yo'q. Avval uni yarating.");
      else if (error.code === '42501') alert("Xatolik: Supabase da RLS ruxsati yo'q. Iltimos SQL kodi orqali RLS ni o'chiring.");
      else alert("Xatolik: " + error.message);
      return;
    }
    window.hitsToast("Yangi o'quvchi qo'shildi!", 'success');
  }

  closeModal();
  loadData();
});

// -------------------------------------------------------------
// MIGRATE (Arizalardan olish)
// -------------------------------------------------------------
document.getElementById('migrateBtn')?.addEventListener('click', async () => {
  if (!confirm("Arizalar qismida 'Qabul qilindi' statusiga ega bo'lgan barcha o'quvchilarni Joriy o'quvchilar bazasiga ko'chirib o'tkazmoqchimisiz? (Faqat hali bu bazada yo'q bo'lganlar qo'shiladi).")) return;
  
  const { data: apps, error } = await supabaseClient.from('applications').select('*').eq('status', 'accepted');
  if (error) { alert("Xato: " + error.message); return; }
  
  if (!apps || apps.length === 0) {
    alert("Arizalar ro'yxatida 'Qabul qilindi' maqomidagi o'quvchilar yo'q.");
    return;
  }

  let addedCount = 0;
  for (let app of apps) {
    // Oldin bormi tekshiramiz (Ism va Sinf bo'yicha yoki Telefon bo'yicha)
    const exists = currentStudents.find(s => s.full_name === app.full_name && s.phone === app.phone);
    if (!exists) {
      const { error: insErr } = await supabaseClient.from('current_students').insert([{
        full_name: app.full_name,
        phone: app.phone,
        grade: app.grade,
        address: app.address,
        transport_type: app.transport_type
      }]);
      if (!insErr) addedCount++;
    }
  }

  alert(`Muvaffaqiyatli yakunlandi! ${apps.length} ta qabul qilingan o'quvchidan ${addedCount} tasi yangi bo'lib joriy o'quvchilarga qo'shildi.`);
  loadData();
});

// -------------------------------------------------------------
// CSV IMPORT VA EXPORT (Shablon)
// -------------------------------------------------------------
document.getElementById('downloadTemplateBtn')?.addEventListener('click', () => {
  const headers = ['Ism-Familiya', 'Sinf', 'Telefon', 'Ota-onasi ismi', 'Qatnov turi'];
  const exampleRow = ['Aliyev Vali', '6-A', '+998901234567', 'Aliyev Gani', 'O\'zi qatnaydi'];
  
  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(',') + "\n"
    + exampleRow.join(',');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `HITS_joriy_oquvchilar_shablon.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

document.getElementById('importCsvInput')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!window.Papa) {
    alert("Kutubxona hali yuklanmadi, biroz kuting va qayta urining.");
    return;
  }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async function(results) {
      const rows = results.data;
      if (rows.length === 0) {
        alert("Fayl bo'sh.");
        return;
      }

      let successCount = 0;
      for (let row of rows) {
        // Shablon nomlariga qarab olamiz (yoki ustun tartibiga qarab)
        // Agar ustun nomlari Ism-Familiya bo'lsa:
        const full_name = row['Ism-Familiya'] || row['F.I.SH'] || Object.values(row)[0];
        const grade = row['Sinf'] || Object.values(row)[1] || '';
        const phone = row['Telefon'] || row['Telefon raqami'] || Object.values(row)[2] || '';
        const parent_name = row['Ota-onasi ismi'] || row['Ota-ona'] || Object.values(row)[3] || '';
        const transport_type = row['Qatnov turi'] || Object.values(row)[4] || '';

        if (!full_name) continue;

        const payload = { full_name, grade, phone, parent_name, transport_type };
        const { error } = await supabaseClient.from('current_students').insert([payload]);
        if (!error) successCount++;
      }

      alert(`Yuklash yakunlandi. ${rows.length} ta qatordan ${successCount} tasi bazaga muvaffaqiyatli qo'shildi.`);
      e.target.value = ''; // inputni tozalash
      loadData();
    }
  });
});

document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
  if (!currentStudents || currentStudents.length === 0) {
    if(window.hitsToast) window.hitsToast("Eksport qilish uchun ma'lumot yo'q", 'danger');
    return;
  }
  
  let csv = "ID,Ism-Familiya,Telefon,Sinf,Ota-ona,Qatnov turi\n";
  currentStudents.forEach(s => {
    csv += `"${s.id}","${s.full_name}","${s.phone || ''}","${s.grade || ''}","${s.parent_name || ''}","${s.transport_type || ''}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'joriy_oquvchilar.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if(window.hitsToast) window.hitsToast("CSV yuklab olingan", 'success');
});
