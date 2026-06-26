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
let allPayments = [];
let currentStudents = [];

if (window.supabase && window.HITS_CONFIG) {
  supabaseClient = window.supabase.createClient(window.HITS_CONFIG.SUPABASE_URL, window.HITS_CONFIG.SUPABASE_KEY);
}

document.addEventListener('DOMContentLoaded', function () {
  if (sessionStorage.getItem('hitAdminLogged') !== 'true') {
    window.location.href = 'admin.html';
    return;
  }
  document.getElementById('adminApp').style.display = 'block';

  let checkTries = 0;
  const checkSupa = setInterval(() => {
    if (supabaseClient) {
      clearInterval(checkSupa);
      loadData();
    }
    checkTries++;
    if(checkTries > 50) clearInterval(checkSupa);
  }, 100);

  document.getElementById('logoutBtn')?.addEventListener('click', function () {
    sessionStorage.removeItem('hitAdminLogged');
    window.location.href = 'admin.html';
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('input', renderTable);
  
  const monthFilter = document.getElementById('monthFilter');
  if (monthFilter) monthFilter.addEventListener('change', renderTable);

  document.getElementById('addPaymentBtn')?.addEventListener('click', () => {
    openModal();
  });

  document.getElementById('savePaymentBtn')?.addEventListener('click', savePayment);
});

async function loadData() {
  const tableBody = document.getElementById('tableBody');
  try {
    const [payRes, stdRes] = await Promise.all([
      supabaseClient.from('payments').select('*, current_students(full_name, grade)').order('paid_at', { ascending: false }),
      supabaseClient.from('current_students').select('id, full_name, grade').order('full_name')
    ]);

    if (payRes.error && payRes.error.code !== '42P01') throw payRes.error;
    if (stdRes.error && stdRes.error.code !== '42P01') throw stdRes.error;

    allPayments = payRes.data || [];
    currentStudents = stdRes.data || [];
    
    populateStudentsSelect();
    renderTable();
    updateStats();
  } catch (err) {
    console.error("Xatolik:", err);
    if (tableBody) {
      let errorMsg = "Ma'lumotlarni yuklashda xatolik yuz berdi.";
      if (err.code === '42P01') errorMsg = "payments jadvali yaratilmagan. Iltimos SQL orqali bazani to'liq ishlating.";
      if (err.code === '42501') errorMsg = "Supabase da RLS yoniq qolgan.";
      
      tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger p-4"><b>Xato:</b> ${errorMsg}</td></tr>`;
    }
  }
}

function populateStudentsSelect() {
  const select = document.getElementById('payStudent');
  if (!select) return;
  select.innerHTML = '<option value="">Tanlang...</option>' + 
    currentStudents.map(s => `<option value="${s.id}">${s.full_name} (${s.grade || 'Sinf yo\'q'})</option>`).join('');
}

function updateStats() {
  const thisMonthTotal = document.getElementById('thisMonthTotal');
  const uzbFormat = new Intl.NumberFormat('uz-UZ');
  
  const currentMonthName = new Date().toLocaleString('uz-UZ', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);
  
  let sum = 0;
  allPayments.forEach(p => {
    if (p.month === capitalizedMonth || p.month === currentMonthName) sum += Number(p.amount);
  });
  
  if (thisMonthTotal) thisMonthTotal.innerText = uzbFormat.format(sum) + " so'm";
}

function renderTable() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;

  const searchText = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const monthFilter = document.getElementById('monthFilter')?.value || '';

  let filtered = allPayments;

  if (monthFilter) {
    filtered = filtered.filter(p => p.month === monthFilter);
  }

  if (searchText) {
    filtered = filtered.filter(p => {
      const name = p.current_students?.full_name || '';
      return name.toLowerCase().includes(searchText);
    });
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center p-5 text-muted"><i class="fas fa-inbox fa-3x mb-3 d-block"></i>Ma'lumot topilmadi</td></tr>`;
    return;
  }

  const uzbFormat = new Intl.NumberFormat('uz-UZ');

  tbody.innerHTML = filtered.map((pay, idx) => {
    const studentName = pay.current_students?.full_name || '<span class="text-danger">O\'chirilgan o\'quvchi</span>';
    const grade = pay.current_students?.grade || '—';
    const date = new Date(pay.paid_at).toLocaleDateString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    
    let methodBadge = 'badge-secondary';
    if (pay.payment_method === 'Naqd') methodBadge = 'badge-success';
    if (pay.payment_method === 'Karta') methodBadge = 'badge-primary';
    if (pay.payment_method === 'Pul o\'tkazma') methodBadge = 'badge-info';

    return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${studentName}</strong></td>
        <td>${grade}</td>
        <td><span class="badge badge-warning">${pay.month}</span></td>
        <td><b class="text-success">${uzbFormat.format(pay.amount)} UZS</b></td>
        <td><span class="badge ${methodBadge}">${pay.payment_method || 'Noma\'lum'}</span></td>
        <td class="text-muted text-sm">${date}</td>
        <td class="text-right">
          <button class="btn btn-sm btn-outline-danger" title="O'chirish" onclick="deletePayment(${pay.id})"><i class="fas fa-trash-alt"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

function openModal() {
  document.getElementById('payId').value = '';
  document.getElementById('payStudent').value = '';
  document.getElementById('payAmount').value = '';
  
  const currentMonthName = new Date().toLocaleString('uz-UZ', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);
  const selectMonth = document.getElementById('payMonth');
  if (selectMonth) {
    for(let i=0; i<selectMonth.options.length; i++) {
      if(selectMonth.options[i].value === capitalizedMonth || selectMonth.options[i].value === currentMonthName) {
        selectMonth.selectedIndex = i;
        break;
      }
    }
  }
  
  $('#paymentModal').modal('show');
}

function closeModal() {
  $('#paymentModal').modal('hide');
}

async function savePayment() {
  const student_id = document.getElementById('payStudent').value;
  const month = document.getElementById('payMonth').value;
  const amountStr = document.getElementById('payAmount').value;
  const method = document.getElementById('payMethod').value;
  
  if (!student_id || !amountStr) {
    if(window.hitsToast) window.hitsToast("O'quvchi va summani kiritish majburiy!", "danger");
    else alert("O'quvchi va summani kiritish majburiy!");
    return;
  }

  const payload = { 
    student_id: parseInt(student_id), 
    month: month, 
    amount: parseInt(amountStr),
    payment_method: method
  };

  const { error } = await supabaseClient.from('payments').insert([payload]);
  
  if (error) {
    console.error(error);
    if (error.code === '42P01') alert("Xatolik: 'payments' jadvali yo'q.");
    else if (error.code === '42501') alert("Xatolik: Supabase da RLS ruxsati yo'q.");
    else alert("Xatolik: " + error.message);
    return;
  }
  
  if(window.hitsToast) window.hitsToast("To'lov muvaffaqiyatli saqlandi!", 'success');
  closeModal();
  loadData();
}

window.deletePayment = async function(id) {
  if (!confirm("Haqiqatan ham bu to'lovni o'chirib tashlamoqchimisiz?")) return;
  
  const { error } = await supabaseClient.from('payments').delete().eq('id', id);
  if (error) {
    alert("Xatolik: " + error.message);
    return;
  }
  
  if(window.hitsToast) window.hitsToast("To'lov o'chirildi", 'success');
  loadData();
}
