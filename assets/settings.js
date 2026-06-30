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
      loadClasses();
    } else if (window.supabase && window.HITS_CONFIG) {
      window.supabaseClient = window.supabase.createClient(window.HITS_CONFIG.SUPABASE_URL, window.HITS_CONFIG.SUPABASE_KEY);
      clearInterval(checkSupa);
      loadClasses();
    }
  }, 100);

  document.getElementById('addClassBtn')?.addEventListener('click', () => {
    const className = prompt("Yangi sinf nomini kiriting:");
    if (className && className.trim() !== '') {
      addClass(className.trim());
    }
  });
});

async function loadClasses() {
  try {
    const { data, error } = await window.supabaseClient.from('classes').select('*').order('id', { ascending: true });
    if (error) throw error;
    
    renderClasses(data || []);
  } catch (err) {
    console.error(err);
    if(window.hitsToast) window.hitsToast("Sinflarni yuklashda xatolik yuz berdi", 'danger');
  }
}

function renderClasses(classes) {
  const tbody = document.getElementById('classesTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (classes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" class="text-center">Sinflar topilmadi</td></tr>';
    return;
  }

  classes.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.name}</td>
      <td class="text-right">
        <button class="btn btn-sm btn-info edit-class-btn" data-id="${c.id}" data-name="${c.name}"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-danger delete-class-btn" data-id="${c.id}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach event listeners
  document.querySelectorAll('.edit-class-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const oldName = e.currentTarget.getAttribute('data-name');
      const newName = prompt("Sinfning yangi nomini kiriting:", oldName);
      if (newName && newName.trim() !== '' && newName.trim() !== oldName) {
        updateClass(id, newName.trim());
      }
    });
  });

  document.querySelectorAll('.delete-class-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm("Rostdan ham bu sinfni o'chirmoqchimisiz?")) {
        deleteClass(id);
      }
    });
  });
}

async function addClass(name) {
  try {
    const { error } = await window.supabaseClient.from('classes').insert([{ name }]);
    if (error) throw error;
    if(window.hitsToast) window.hitsToast("Sinf qo'shildi", 'success');
    loadClasses();
  } catch (err) {
    console.error(err);
    if(window.hitsToast) window.hitsToast("Xatolik yuz berdi", 'danger');
  }
}

async function updateClass(id, newName) {
  try {
    const { error } = await window.supabaseClient.from('classes').update({ name: newName }).eq('id', id);
    if (error) throw error;
    if(window.hitsToast) window.hitsToast("Sinf nomi o'zgartirildi", 'success');
    loadClasses();
  } catch (err) {
    console.error(err);
    if(window.hitsToast) window.hitsToast("Xatolik yuz berdi", 'danger');
  }
}

async function deleteClass(id) {
  try {
    const { error } = await window.supabaseClient.from('classes').delete().eq('id', id);
    if (error) throw error;
    if(window.hitsToast) window.hitsToast("Sinf o'chirildi", 'success');
    loadClasses();
  } catch (err) {
    console.error(err);
    if(window.hitsToast) window.hitsToast("Xatolik yuz berdi", 'danger');
  }
}
