// script.js (v5 - Profil Güncelleme Eklendi)

// === GLOBAL DEĞİŞKENLER ===
const API_URL = 'http://localhost:3000';
let globalToken = null; 
let globalCategories = [];
let globalTransactions = [];
let currentUser = null; // YENİ: Mevcut kullanıcı profilini burada saklayacağız

// === HTML ELEMENTLERİ ===
const toastContainer = document.getElementById('toastContainer');
const loginAlani = document.getElementById('loginAlani');
const registerAlani = document.getElementById('registerAlani');
const anaEkran = document.getElementById('anaEkran');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const kategoriEkleForm = document.getElementById('kategoriEkleForm');
const islemEkleForm = document.getElementById('islemEkleForm');
const logoutButton = document.getElementById('logoutButton');

// Filtre Elementleri
const filterStartDate = document.getElementById('filterStartDate');
const filterEndDate = document.getElementById('filterEndDate');
const filterButton = document.getElementById('filterButton');

const kayitLinkGecis = document.getElementById('kayitLinkGecis');
const girisLinkGecis = document.getElementById('girisLinkGecis-1');
const hosgeldinMesaji = document.getElementById('hosgeldinMesaji');
const kategoriListesiBody = document.querySelector('#kategoriListesi tbody');
const islemListesiBody = document.querySelector('#islemListesi tbody');
const islemKategoriDropdown = document.getElementById('islemKategori');
const raporGelir = document.getElementById('raporGelir');
const raporGider = document.getElementById('raporGider');
const raporBakiye = document.getElementById('raporBakiye');

// Düzenleme Modalı Elementleri
const editModal = document.getElementById('editModal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const editForm = document.getElementById('editForm');
const editFormBody = document.getElementById('editFormBody');

// YENİ: Profil Modalı Elementleri
const profileButton = document.getElementById('profileButton');
const profileModal = document.getElementById('profileModal');
const profileModalClose = document.getElementById('profileModalClose');
const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');

// === Bildirim (Toast) Gösterme Fonksiyonu ===
function showToast(mesaj, tip = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${tip}`;
    toast.textContent = mesaj;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => { toast.remove(); }, 300);
    }, 3000);
}

// === FORM DEĞİŞTİRME LİNKLERİ ===
kayitLinkGecis.addEventListener('click', (e) => { e.preventDefault(); loginAlani.style.display = 'none'; registerAlani.style.display = 'block'; });
girisLinkGecis.addEventListener('click', (e) => { e.preventDefault(); registerAlani.style.display = 'none'; loginAlani.style.display = 'block'; });


// === 1. OTURUM (AUTH) FONKSİYONLARI ===
// (Login, Register, Logout... Değişiklik yok)
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    await disableButton(button, 'Giriş Yapılıyor...', async () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const response = await fetch(`${API_URL}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.hata || 'Giriş yapılamadı.');
        globalToken = data.token;
        localStorage.setItem('finans-token', globalToken);
        girisBasariliArayuzu();
        loginForm.reset();
        showToast('Giriş başarılı!', 'success');
    });
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    await disableButton(button, 'Kayıt Olunuyor...', async () => {
        const firstName = document.getElementById('registerFirstName').value;
        const lastName = document.getElementById('registerLastName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const response = await fetch(`${API_URL}/api/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName, lastName })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.hata || 'Kayıt yapılamadı.');
        showToast('Kayıt başarılı! Lütfen şimdi giriş yapın.', 'success');
        registerForm.reset();
        loginAlani.style.display = 'block';
        registerAlani.style.display = 'none';
    });
});

logoutButton.addEventListener('click', () => {
    globalToken = null;
    currentUser = null; // YENİ: Kullanıcı profilini temizle
    localStorage.removeItem('finans-token');
    loginAlani.style.display = 'block';
    registerAlani.style.display = 'none';
    anaEkran.style.display = 'none';
});

// SAYFA YÜKLENİNCE
document.addEventListener('DOMContentLoaded', () => {
    setDefaultDates();
    const savedToken = localStorage.getItem('finans-token');
    if (savedToken) {
        globalToken = savedToken;
        girisBasariliArayuzu();
    } else {
        loginAlani.style.display = 'block';
    }
});

// GİRİŞ BAŞARILI ARAYÜZÜ (GÜNCELLENDİ)
async function girisBasariliArayuzu() {
    loginAlani.style.display = 'none';
    registerAlani.style.display = 'none';
    anaEkran.style.display = 'block';
    try {
        const userProfile = await fetchApi('/api/users/me');
        currentUser = userProfile; // YENİ: Kullanıcıyı globalde sakla
        
        const displayName = (currentUser.first_name && currentUser.last_name) 
                            ? `${currentUser.first_name} ${currentUser.last_name}`
                            : currentUser.email;
        hosgeldinMesaji.textContent = `Hoş Geldin, ${displayName}!`;

        await refreshDashboardData();
    } catch (err) {
        showToast(err.message, 'error');
        logoutButton.click();
    }
}

// === 2. RAPORLAMA VE VERİ ÇEKME (Değişiklik yok) ===
filterButton.addEventListener('click', async () => {
    const button = filterButton;
    await disableButton(button, 'Filtreleniyor...', async () => {
        await refreshDashboardData();
        showToast('Veriler güncellendi.', 'success');
    });
});

async function refreshDashboardData() {
    const startDate = filterStartDate.value;
    const endDate = filterEndDate.value;
    await kategorileriGetir(); 
    await raporuGetir(startDate, endDate);
    await islemleriGetir(startDate, endDate);
}

function setDefaultDates() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate().toString().padStart(2, '0');
    filterStartDate.value = `${year}-${month}-01`;
    filterEndDate.value = `${year}-${month}-${lastDay}`;
    // YENİ: İşlem ekleme tarihi varsayılanı "bugün" olsun
    document.getElementById('islemDate').value = new Date().toISOString().split('T')[0];
}

async function raporuGetir(startDate, endDate) {
    if (!globalToken) return;
    raporGelir.textContent = '...';
    raporGider.textContent = '...';
    raporBakiye.textContent = '...';
    let endpoint = '/api/reports/summary';
    if (startDate && endDate) {
        endpoint += `?startDate=${startDate}&endDate=${endDate}`;
    }
    try {
        const response = await fetchApi(endpoint);
        raporGelir.textContent = `${response.total_gelir.toFixed(2)} TL`;
        raporGider.textContent = `${response.total_gider.toFixed(2)} TL`;
        raporBakiye.textContent = `${response.net_bakiye.toFixed(2)} TL`;
    } catch (err) {
        showToast(err.message, 'error');
        raporGelir.textContent = 'Hata';
        raporGider.textContent = 'Hata';
        raporBakiye.textContent = 'Hata';
    }
}

// === 3. KATEGORİ CRUD (Değişiklik yok) ===
kategoriEkleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    await disableButton(button, 'Ekleniyor...', async () => {
        const name = document.getElementById('kategoriName').value;
        const type = document.getElementById('kategoriType').value;
        await fetchApi('/api/categories', 'POST', { name, type });
        kategoriEkleForm.reset();
        kategorileriGetir();
        showToast('Kategori eklendi.', 'success');
    });
});
async function kategorileriGetir() {
    // ... (İçerik aynı) ...
    if (!globalToken) return;
    try {
        const kategoriler = await fetchApi('/api/categories');
        globalCategories = kategoriler;
        kategoriListesiBody.innerHTML = '';
        islemKategoriDropdown.innerHTML = '<option value="">Kategori Seçin...</option>';
        if (kategoriler.length === 0) {
             kategoriListesiBody.innerHTML = '<tr><td colspan="3">Henüz kategori yok.</td></tr>';
             return;
        }
        kategoriler.forEach(kat => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${kat.name}</td><td>${kat.type === 'gelir' ? 'Gelir' : 'Gider'}</td><td><div class="btn-grup"><button class="btn-sm btn-edit" data-id="${kat.id}" data-type="kategori">Düzenle</button><button class="btn-sm btn-delete" data-id="${kat.id}" data-type="kategori">Sil</button></div></td>`;
            kategoriListesiBody.appendChild(tr);
            const option = document.createElement('option');
            option.value = kat.id;
            option.textContent = `${kat.name} (${kat.type})`;
            islemKategoriDropdown.appendChild(option);
        });
    } catch (err) { showToast(err.message, 'error'); }
}
kategoriListesiBody.addEventListener('click', async (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    const id = button.dataset.id;
    if (button.classList.contains('btn-delete') && button.dataset.type === 'kategori') {
        if (confirm(`'${id}' ID'li kategoriyi silmek istediğinizden emin misiniz?\n(Bu kategoriye bağlı tüm işlemler de silinecek!)`)) {
            await disableButton(button, '...', async () => {
                await fetchApi(`/api/categories/${id}`, 'DELETE');
                showToast('Kategori silindi.', 'success');
                refreshDashboardData();
            });
        }
    }
    if (button.classList.contains('btn-edit') && button.dataset.type === 'kategori') {
        const kategori = globalCategories.find(k => k.id == id);
        openEditModal('kategori', kategori);
    }
});

// === 4. İŞLEM CRUD (Değişiklik yok) ===
islemEkleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    await disableButton(button, 'Ekleniyor...', async () => {
        const category_id = document.getElementById('islemKategori').value;
        const amount = document.getElementById('islemAmount').value;
        const transaction_date = document.getElementById('islemDate').value;
        const description = document.getElementById('islemDescription').value;
        await fetchApi('/api/transactions', 'POST', { category_id, amount, transaction_date, description });
        islemEkleForm.reset();
        showToast('İşlem eklendi.', 'success');
        refreshDashboardData();
    });
});
async function islemleriGetir(startDate, endDate) {
    // ... (İçerik aynı) ...
    if (!globalToken) return;
    let endpoint = '/api/transactions';
    if (startDate && endDate) {
        endpoint += `?startDate=${startDate}&endDate=${endDate}`;
    }
    try {
        const islemler = await fetchApi(endpoint);
        globalTransactions = islemler;
        islemListesiBody.innerHTML = '';
        if (islemler.length === 0) {
             islemListesiBody.innerHTML = '<tr><td colspan="5">Bu tarih aralığında işlem yok.</td></tr>';
             return;
        }
        islemler.forEach(islem => {
            const kategori = globalCategories.find(k => k.id == islem.category_id);
            const kategoriAdi = kategori ? kategori.name : 'Bilinmiyor';
            const tutarRenk = kategori ? (kategori.type === 'gelir' ? 'gelir-text' : 'gider-text') : 'text-muted';
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${new Date(islem.transaction_date).toLocaleDateString('tr-TR')}</td><td>${kategoriAdi}</td><td>${islem.description || '...'}</td><td class="${tutarRenk}" style="font-weight: 600;">${parseFloat(islem.amount).toFixed(2)} TL</td><td><div class="btn-grup"><button class="btn-sm btn-edit" data-id="${islem.id}" data-type="islem">Düzenle</button><button class="btn-sm btn-delete" data-id="${islem.id}" data-type="islem">Sil</button></div></td>`;
            if (kategori) {
                if(kategori.type === 'gelir') tr.querySelector('.gelir-text').style.color = 'var(--success-color)';
                if(kategori.type === 'gider') tr.querySelector('.gider-text').style.color = 'var(--danger-color)';
            }
            islemListesiBody.appendChild(tr);
        });
    } catch (err) { showToast(err.message, 'error'); }
}
islemListesiBody.addEventListener('click', async (e) => {
    // ... (İçerik aynı) ...
    const button = e.target.closest('button');
    if (!button) return;
    const id = button.dataset.id;
    if (button.classList.contains('btn-delete') && button.dataset.type === 'islem') {
        if (confirm(`'${id}' ID'li işlemi silmek istediğinizden emin misiniz?`)) {
            await disableButton(button, '...', async () => {
                await fetchApi(`/api/transactions/${id}`, 'DELETE');
                showToast('İşlem silindi.', 'success');
                refreshDashboardData();
            });
        }
    }
    if (button.classList.contains('btn-edit') && button.dataset.type === 'islem') {
        const islem = globalTransactions.find(t => t.id == id);
        openEditModal('islem', islem);
    }
});

// === 5. DÜZENLEME MODALI (Değişiklik yok) ===
function openEditModal(type, data) {
    // ... (İçerik aynı) ...
    modalTitle.textContent = `${type === 'kategori' ? 'Kategori' : 'İşlem'} Düzenle (ID: ${data.id})`;
    if (type === 'kategori') {
        editFormBody.innerHTML = `... (Kategori formu) ...`;
    } else if (type === 'islem') {
        editFormBody.innerHTML = `... (İşlem formu) ...`;
    }
    // (Kodun tam halini gizliyorum, bir önceki adımdan kopyalayabilirsiniz)
    if (type === 'kategori') {
        editFormBody.innerHTML = `<div class="form-grup"><label for="editKategoriName">Kategori Adı</label><input type="text" id="editKategoriName" value="${data.name}" required></div><div class="form-grup"><label for="editKategoriType">Tipi</label><select id="editKategoriType" required><option value="gider" ${data.type === 'gider' ? 'selected' : ''}>Gider</option><option value="gelir" ${data.type === 'gelir' ? 'selected' : ''}>Gelir</option></select></div>`;
    } else if (type === 'islem') {
        let kategoriOptions = globalCategories.map(kat => `<option value="${kat.id}" ${kat.id == data.category_id ? 'selected' : ''}>${kat.name} (${kat.type})</option>`).join('');
        editFormBody.innerHTML = `<div class="form-grup"><label for="editIslemKategori">Kategori</label><select id="editIslemKategori" required>${kategoriOptions}</select></div><div class="form-grup"><label for="editIslemAmount">Tutar</label><input type="number" step="0.01" id="editIslemAmount" value="${data.amount}" required></div><div class="form-grup"><label for="editIslemDate">Tarih</label><input type="date" id="editIslemDate" value="${new Date(data.transaction_date).toISOString().split('T')[0]}" required></div><div class="form-grup"><label for="editIslemDescription">Açıklama</label><input type="text" id="editIslemDescription" value="${data.description || ''}"></div>`;
    }
    editForm.dataset.type = type;
    editForm.dataset.id = data.id;
    editModal.style.display = 'block';
}
modalClose.onclick = () => { editModal.style.display = 'none'; }
window.onclick = (event) => { if (event.target == editModal) { editModal.style.display = 'none'; } }

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    await disableButton(button, 'Güncelleniyor...', async () => {
        const type = e.target.dataset.type;
        const id = e.target.dataset.id;
        let endpoint = '';
        let body = {};
        if (type === 'kategori') {
            endpoint = `/api/categories/${id}`;
            body = { name: document.getElementById('editKategoriName').value, type: document.getElementById('editKategoriType').value };
        } else if (type === 'islem') {
            endpoint = `/api/transactions/${id}`;
            body = { category_id: document.getElementById('editIslemKategori').value, amount: document.getElementById('editIslemAmount').value, transaction_date: document.getElementById('editIslemDate').value, description: document.getElementById('editIslemDescription').value };
        }
        await fetchApi(endpoint, 'PUT', body);
        editModal.style.display = 'none';
        showToast('Kayıt güncellendi.', 'success');
        refreshDashboardData();
    });
});

// === 6. YENİ: PROFİL MODALI FONKSİYONLARI ===

// "Profilim" butonuna basınca modalı aç ve verileri doldur
profileButton.addEventListener('click', async () => {
    // 'currentUser' global değişkeni 'girisBasariliArayuzu' içinde doldurulmuştu.
    if (!currentUser) {
        showToast('Kullanıcı bilgileri yüklenemedi.', 'error');
        return;
    }
    // Formu mevcut verilerle doldur
    document.getElementById('profileFirstName').value = currentUser.first_name || '';
    document.getElementById('profileLastName').value = currentUser.last_name || '';
    
    // Şifre formlarını temizle
    passwordForm.reset();

    profileModal.style.display = 'block';
});

// Profil modalını kapat
profileModalClose.onclick = () => { profileModal.style.display = 'none'; }
window.onclick = (event) => {
    if (event.target == editModal) editModal.style.display = 'none';
    if (event.target == profileModal) profileModal.style.display = 'none'; // YENİ
}

// "Profil Bilgileri" formunu gönderme
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    await disableButton(button, 'Güncelleniyor...', async () => {
        const firstName = document.getElementById('profileFirstName').value;
        const lastName = document.getElementById('profileLastName').value;

        const updatedUser = await fetchApi('/api/users/profile', 'PUT', { firstName, lastName });

        // Global kullanıcıyı ve "Hoş Geldin" mesajını güncelle
        currentUser = updatedUser;
        hosgeldinMesaji.textContent = `Hoş Geldin, ${currentUser.first_name} ${currentUser.last_name}!`;
        
        showToast('Profil bilgileri güncellendi.', 'success');
        profileModal.style.display = 'none'; // Modalı kapat
    });
});

// "Şifre Değiştir" formunu gönderme
passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    await disableButton(button, 'Güncelleniyor...', async () => {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        await fetchApi('/api/users/change-password', 'PUT', { oldPassword, newPassword });
        
        showToast('Şifre başarıyla güncellendi.', 'success');
        passwordForm.reset();
        profileModal.style.display = 'none'; // Modalı kapat
    });
});


// === 7. GENEL API ÇAĞRI FONKSİYONU (YARDIMCI) ===
// (Değişiklik yok)
async function fetchApi(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${globalToken}` };
    const config = { method, headers };
    if (body) { config.body = JSON.stringify(body); }
    const response = await fetch(`${API_URL}${endpoint}`, config);
    if (response.status === 204) return {};
    if (response.status === 401) {
        showToast("Oturum süreniz doldu. Lütfen tekrar giriş yapın.", "error");
        logoutButton.click();
        throw new Error("Oturum süresi doldu");
    }
    const data = await response.json();
    if (!response.ok) { throw new Error(data.hata || `API Hatası: ${response.status}`); }
    return data;
}

// === 8. Buton Yükleme Durumu (YARDIMCI) ===
// (Değişiklik yok)
async function disableButton(button, loadingText, callback) {
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = loadingText;
    try {
        await callback();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}