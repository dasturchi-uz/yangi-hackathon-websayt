// Login tekshiruvi
if (sessionStorage.getItem('hitAdminLogged') !== 'true') {
  window.location.href = 'admin.html';
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  sessionStorage.removeItem('hitAdminLogged');
  window.location.href = 'admin.html';
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
  try {
    // Ikkala jadvalni bir vaqtda tortish
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
    if(err.code === '42P01') {
       alert("Siz hali 'current_students' jadvalini yaratmagansiz. SQL kodni yurgizing.");
    } else {
       alert("Ma'lumotlarni yuklashda xatolik yuz berdi.");
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
      <div class="empty-state" style="margin-top:30px;">
        <div class="ic"><i class="bi bi-inbox" style="font-size:2.5rem; color:var(--muted);"></i></div>
        <div style="font-weight:700;">Hozircha hech kim yo'q</div>
        <div style="font-size:.85rem;">Maktabning o'quvchilari ushbu ro'yxatda paydo bo'ladi.</div>
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
      <div class="class-accordion">
        <div class="class-header" onclick="toggleAccordion(this)">
          <div class="class-title"><i class="bi bi-chevron-down" style="font-size:0.9rem; color:var(--muted); transition:transform 0.2s;"></i> ${grade}</div>
          <div class="class-stats">${students.length} ta o'quvchi</div>
        </div>
        <div class="class-body">
          ${students.length > 0 ? `
            <table class="std-table">
              <thead>
                <tr>
                  <th style="width:50px;">#</th>
                  <th>F.I.SH</th>
                  <th>Telefon</th>
                  <th>Ota-ona</th>
                  <th>Qatnov</th>
                  <th style="text-align:right;">Amallar</th>
                </tr>
              </thead>
              <tbody>
                ${students.map((std, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${std.full_name}</strong></td>
                    <td style="font-family:'JetBrains Mono', monospace;">${std.phone || '—'}</td>
                    <td>${std.parent_name || '—'}</td>
                    <td><span style="font-size:0.85rem; color:var(--muted);">${std.transport_type || '—'}</span></td>
                    <td style="text-align:right;">
                      <button class="action-btn" title="O'zgartirish" onclick="editStudent(${std.id})"><i class="bi bi-pencil-square"></i></button>
                      <button class="action-btn" style="color:var(--red);" title="O'chirish" onclick="deleteStudent(${std.id})"><i class="bi bi-trash3"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `<div style="padding:20px; text-align:center; color:var(--muted); font-size:0.9rem;">Bu sinfda o'quvchilar yo'q</div>`}
        </div>
      </div>
    `;
  });

  content.innerHTML = html;
}

window.toggleAccordion = function(el) {
  const body = el.nextElementSibling;
  const icon = el.querySelector('.bi-chevron-down');
  if (body.classList.contains('open')) {
    body.classList.remove('open');
    icon.style.transform = 'rotate(0deg)';
  } else {
    body.classList.add('open');
    icon.style.transform = 'rotate(-180deg)';
  }
}

// -------------------------------------------------------------
// CRUD Lojika
// -------------------------------------------------------------
const stdModal = document.getElementById('stdModal');
const stdModalBackdrop = document.getElementById('stdModalBackdrop');
const stdModalTitle = document.getElementById('stdModalTitle');

function openModal(isEdit) {
  if (stdModal) stdModal.classList.add('show');
  if (stdModalBackdrop) stdModalBackdrop.classList.add('show');
  stdModalTitle.innerHTML = isEdit 
    ? `<i class="bi bi-pencil-square" style="color:var(--navy-600);"></i> O'quvchini tahrirlash` 
    : `<i class="bi bi-person-plus-fill" style="color:var(--navy-600);"></i> Yangi o'quvchi`;
}

function closeModal() {
  if (stdModal) stdModal.classList.remove('show');
  if (stdModalBackdrop) stdModalBackdrop.classList.remove('show');
  
  // Clear forms
  document.getElementById('stdId').value = '';
  document.getElementById('stdFullName').value = '';
  document.getElementById('stdGrade').value = '';
  document.getElementById('stdPhone').value = '';
  document.getElementById('stdParent').value = '';
  document.getElementById('stdTransport').value = '';
}

document.getElementById('stdModalCloseBtn')?.addEventListener('click', closeModal);
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
    if (error) { alert("Xatolik: " + error.message); return; }
    window.hitsToast("Saqlandi!", 'success');
  } else {
    // Insert
    const { error } = await supabaseClient.from('current_students').insert([payload]);
    if (error) { alert("Xatolik: " + error.message); return; }
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
