const API_BASE = '';
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyVekMA2rb-kCvGmV9k6bvSbIvQ7_7t5A_bCR5FHCLo58BpZRAHWRppBhCCGGTelh3y0A/exec'; // Isi dengan URL Web App Google Apps Script.
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'tjkt2025';
const DEFAULT_QUIZ_DURATION = 20;
const QUIZ_DATE_KEY = 'ruangkelas.quizDate';
const QUIZ_MAPEL_KEY = 'ruangkelas.quizMapel';
const QUIZ_SCHEDULES_KEY = 'ruangkelas.quizSchedules';
const MATERIALS_KEY = 'ruangkelas.materials';
const MATERIALS_DB_NAME = 'ruangkelas.db';
const MATERIALS_STORE_NAME = 'materials';
const LANDING_CONTENT_KEY = 'ruangkelas.landingContent';
const defaultLandingContent = {
  eyebrow: 'SMK • Teknik Jaringan Komputer & Telekomunikasi',
  title: 'Belajar jaringan.\nBangun masa depan.',
  description: 'Jurusan TJKT membekali siswa dengan keterampilan jaringan komputer, server, keamanan siber, dan teknologi telekomunikasi untuk menghadapi dunia industri.',
  button: 'Mulai belajar',
  image: ''
};
let remoteMaterialsLoaded = false;
let remoteConfigAvailable = false;

async function loadRemoteConfig() {
  if (!GOOGLE_SHEETS_URL) return;
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=config&t=${Date.now()}`, { cache: 'no-store' });
    const json = await response.json();
    if (!json.success || !json.data) throw new Error('Deployment Apps Script belum diperbarui.');
    remoteConfigAvailable = true;
    const data = json.data || {};
    if (data.landingContent) localStorage.setItem(LANDING_CONTENT_KEY, JSON.stringify(data.landingContent));
    if (Array.isArray(data.materials)) {
      localStorage.setItem(MATERIALS_KEY, JSON.stringify(data.materials));
      allMateri = data.materials;
      remoteMaterialsLoaded = true;
    }
    if (Array.isArray(data.quizSchedules)) {
      localStorage.setItem(QUIZ_SCHEDULES_KEY, JSON.stringify(data.quizSchedules));
      if (data.quizSchedules[0]) {
        localStorage.setItem(QUIZ_DATE_KEY, data.quizSchedules[0].date);
        localStorage.setItem(QUIZ_MAPEL_KEY, data.quizSchedules[0].mapel);
      }
    }
    updateQuizScheduleInfo();
    renderLandingContent();
    await loadMateri();
  } catch (error) {}
}

async function saveRemoteConfig(key, value) {
  if (!GOOGLE_SHEETS_URL || !remoteConfigAvailable) {
    console.error('Server penyimpanan belum aktif. Redeploy Code.gs terlebih dahulu.');
    return false;
  }
  try {
    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'saveConfig', key, value })
    });
    return true;
  } catch (error) {}
  return false;
}
const fallbackMateri = [
  { mapel: 'KJR', judul: 'Prinsip Keamanan Jaringan', deskripsi: 'Bangun kebiasaan aman untuk melindungi data dan infrastruktur digital.', link: 'materi/prinsip-keamanan-jaringan.pdf', level: 'Menengah' },
  { mapel: 'PKPJ', judul: 'Pemasangan dan Konfigurasi Perangkat Jaringan', deskripsi: 'Pelajari pemasangan kabel, konfigurasi perangkat, dan pengujian koneksi jaringan.', link: 'materi/pemasangan-konfigurasi-perangkat-jaringan.pdf', level: 'Pemula' }
];
const fallbackKuis = {
  KJR: [
    { soal: 'Kepanjangan dari CIA dalam keamanan informasi adalah...', opsi: ['Control, Internet, Access', 'Confidentiality, Integrity, Availability', 'Cipher, Identity, Authentication', 'Cloud, Infrastructure, Application'], jawaban: 1 },
    { soal: 'Confidentiality berarti informasi hanya dapat diakses oleh...', opsi: ['Semua orang', 'Pihak yang berwenang', 'Mesin pencari', 'Tamu jaringan'], jawaban: 1 },
    { soal: 'Integrity dalam keamanan informasi berarti data...', opsi: ['Selalu tersedia', 'Tidak berubah tanpa izin', 'Boleh dibagikan bebas', 'Disimpan tanpa nama'], jawaban: 1 },
    { soal: 'Availability berarti informasi dan layanan...', opsi: ['Tersedia saat dibutuhkan', 'Selalu dirahasiakan', 'Tidak boleh dicadangkan', 'Hanya berada offline'], jawaban: 0 },
    { soal: 'Upaya menipu pengguna agar memberikan data rahasia disebut...', opsi: ['Phishing', 'Routing', 'Hashing', 'Patching'], jawaban: 0 },
    { soal: 'Program berbahaya yang mengunci file dan meminta tebusan disebut...', opsi: ['Spyware', 'Ransomware', 'Adware', 'Firmware'], jawaban: 1 },
    { soal: 'Perangkat lunak untuk menyaring lalu lintas jaringan disebut...', opsi: ['Firewall', 'Compiler', 'Text editor', 'Bootloader'], jawaban: 0 },
    { soal: 'Proses mengubah data menjadi bentuk tidak terbaca tanpa kunci disebut...', opsi: ['Enkripsi', 'Kompresi', 'Fragmentasi', 'Rendering'], jawaban: 0 },
    { soal: 'Password yang baik seharusnya...', opsi: ['Pendek dan mudah ditebak', 'Menggunakan kombinasi karakter', 'Sama untuk semua akun', 'Berisi nama sendiri'], jawaban: 1 },
    { soal: 'Autentikasi dua faktor menambahkan...', opsi: ['Lapisan verifikasi kedua', 'Dua username yang sama', 'Dua koneksi internet', 'Dua antivirus tanpa konfigurasi'], jawaban: 0 },
    { soal: 'Malware yang memata-matai aktivitas pengguna disebut...', opsi: ['Spyware', 'Routerware', 'Shareware', 'Middleware'], jawaban: 0 },
    { soal: 'Serangan yang membanjiri server dengan banyak permintaan disebut...', opsi: ['DDoS', 'DNS', 'DHCP', 'DLP'], jawaban: 0 },
    { soal: 'Data cadangan digunakan untuk...', opsi: ['Memulihkan data saat terjadi kerusakan', 'Membuat password terlihat', 'Menonaktifkan firewall', 'Menghapus log keamanan'], jawaban: 0 },
    { soal: 'Pembaruan keamanan penting dilakukan untuk...', opsi: ['Menutup kerentanan', 'Mengurangi kapasitas RAM', 'Menghapus semua pengguna', 'Mengganti jenis monitor'], jawaban: 0 },
    { soal: 'Teknik mendapatkan akses dengan mencoba banyak password disebut...', opsi: ['Brute force', 'Port forwarding', 'Load balancing', 'Data mining'], jawaban: 0 },
    { soal: 'VPN digunakan untuk membuat...', opsi: ['Koneksi privat melalui jaringan publik', 'Kabel jaringan baru', 'Akun tanpa password', 'Virus yang aman'], jawaban: 0 },
    { soal: 'Hasil hash umumnya digunakan untuk...', opsi: ['Memverifikasi integritas data', 'Mengirim listrik', 'Mengganti alamat MAC', 'Membuat kabel crossover'], jawaban: 0 },
    { soal: 'Prinsip memberikan hak akses secukupnya disebut...', opsi: ['Least privilege', 'Open access', 'Full sharing', 'Public default'], jawaban: 0 },
    { soal: 'Log keamanan berguna untuk...', opsi: ['Mencatat dan menelusuri aktivitas', 'Menambah kecepatan kipas', 'Mengubah resolusi layar', 'Menghapus bukti serangan'], jawaban: 0 },
    { soal: 'Social engineering menyerang...', opsi: ['Manusia dan perilakunya', 'Hanya kabel fiber', 'Hanya prosesor', 'Sistem pendingin'], jawaban: 0 }
  ],
  PKPJ: [
    { soal: 'Perangkat yang menghubungkan beberapa komputer dalam satu LAN adalah...', opsi: ['Switch', 'Printer', 'Scanner', 'UPS'], jawaban: 0 },
    { soal: 'Alat untuk memasang konektor RJ45 pada kabel UTP disebut...', opsi: ['Tang crimping', 'Obeng plus', 'Multimeter', 'Kunci inggris'], jawaban: 0 },
    { soal: 'Kabel yang digunakan untuk menghubungkan komputer ke switch adalah...', opsi: ['Straight-through', 'Rollover', 'Kabel listrik', 'Kabel telepon'], jawaban: 0 },
    { soal: 'Urutan standar kabel straight-through pada kedua ujungnya adalah...', opsi: ['T568A-T568A atau T568B-T568B', 'T568A-T568B saja', 'RJ11-RJ11', 'USB-USB'], jawaban: 0 },
    { soal: 'Perintah Cisco IOS untuk masuk ke mode konfigurasi global adalah...', opsi: ['configure terminal', 'enable password', 'show ip route', 'copy run start'], jawaban: 0 },
    { soal: 'Perintah untuk memberi nama pada perangkat Cisco adalah...', opsi: ['hostname', 'device-name', 'setname', 'router-title'], jawaban: 0 },
    { soal: 'Perintah untuk memberi alamat IP pada interface router adalah...', opsi: ['ip address', 'address ip', 'set ip', 'interface address'], jawaban: 0 },
    { soal: 'Setelah memberi IP pada interface Cisco, perintah untuk mengaktifkannya adalah...', opsi: ['no shutdown', 'interface on', 'enable port', 'start interface'], jawaban: 0 },
    { soal: 'Perintah untuk menyimpan konfigurasi router adalah...', opsi: ['copy running-config startup-config', 'save router', 'store config', 'write file'], jawaban: 0 },
    { soal: 'Alamat IP 192.168.10.1 termasuk alamat...', opsi: ['Private', 'Broadcast publik', 'Loopback saja', 'Multicast'], jawaban: 0 },
    { soal: 'DHCP berfungsi untuk...', opsi: ['Memberikan IP secara otomatis', 'Menghubungkan kabel', 'Menguji tegangan', 'Menghapus VLAN'], jawaban: 0 },
    { soal: 'Access point digunakan untuk menyediakan koneksi...', opsi: ['Nirkabel', 'Listrik', 'Serial printer', 'Telepon analog'], jawaban: 0 },
    { soal: 'Perintah untuk menguji koneksi ke perangkat lain adalah...', opsi: ['ping', 'format', 'mkdir', 'rename'], jawaban: 0 },
    { soal: 'Lampu indikator link pada switch mati biasanya menunjukkan...', opsi: ['Tidak ada koneksi fisik', 'IP terlalu cepat', 'DNS aktif', 'Password benar'], jawaban: 0 },
    { soal: 'Alat untuk menguji susunan kabel UTP disebut...', opsi: ['LAN tester', 'Access point', 'Router', 'Patch panel'], jawaban: 0 },
    { soal: 'VLAN digunakan untuk...', opsi: ['Membagi jaringan secara logis', 'Mengganti konektor', 'Menguatkan listrik', 'Menghapus alamat IP'], jawaban: 0 },
    { soal: 'Default gateway pada komputer digunakan untuk...', opsi: ['Mengakses jaringan lain', 'Mencetak dokumen', 'Mengatur brightness', 'Membuat kabel'], jawaban: 0 },
    { soal: 'Perintah Cisco untuk melihat status interface adalah...', opsi: ['show ip interface brief', 'show interfaces off', 'display port all', 'list network'], jawaban: 0 },
    { soal: 'Kabel fiber optic mengirimkan data menggunakan...', opsi: ['Cahaya', 'Arus AC', 'Gelombang suara', 'Medan magnet saja'], jawaban: 0 },
    { soal: 'Tahap terakhir setelah konfigurasi perangkat jaringan adalah...', opsi: ['Pengujian koneksi dan dokumentasi', 'Mencabut semua kabel', 'Menghapus konfigurasi', 'Mematikan perangkat'], jawaban: 0 }
  ]
};
let allMateri = fallbackMateri;
let currentKuisData = [];
let currentQuestion = 0;
let score = 0;
let selectedAnswers = [];
let timerId = null;
let remainingSeconds = DEFAULT_QUIZ_DURATION;
let editingMaterialIndex = null;
let editingQuizScheduleIndex = null;
const mapelNames = { KJR: 'Keamanan', PKPJ: 'Pemasangan perangkat' };

async function loadMateri() {
  const savedMaterials = remoteMaterialsLoaded ? null : await getSavedMaterials();
  if (savedMaterials) allMateri = savedMaterials;
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/materi`);
      const json = await res.json();
      if (!savedMaterials && json.data?.length) allMateri = json.data.filter(m => ['KJR', 'PKPJ'].includes(m.mapel));
    } catch (err) {}
  }
  updateModuleCount();
  if (!document.getElementById('materi-container')) return;
  renderMateri();
}

function updateModuleCount() {
  const jumlahModul = document.getElementById('jumlah-modul');
  if (jumlahModul) jumlahModul.textContent = allMateri.length;
}

function getLandingContent() {
  try {
    return { ...defaultLandingContent, ...(JSON.parse(localStorage.getItem(LANDING_CONTENT_KEY)) || {}) };
  } catch (err) {
    return defaultLandingContent;
  }
}

function renderLandingContent() {
  const content = getLandingContent();
  const eyebrow = document.getElementById('landing-eyebrow');
  const title = document.getElementById('landing-title');
  const description = document.getElementById('landing-description');
  const button = document.getElementById('landing-button');
  const image = document.getElementById('landing-image');
  const placeholder = document.getElementById('landing-placeholder');
  if (eyebrow) eyebrow.textContent = content.eyebrow;
  if (title) {
    const titleLines = content.title.split(/\r?\n/);
    title.textContent = titleLines[0] || '';
    if (titleLines[1]) {
      title.append(document.createElement('br'));
      const accent = document.createElement('span');
      accent.textContent = titleLines.slice(1).join(' ');
      title.append(accent);
    }
  }
  if (description) description.textContent = content.description;
  if (button) button.innerHTML = `${content.button} <span>→</span>`;
  if (image && placeholder) {
    image.src = content.image;
    image.classList.toggle('hidden', !content.image);
    placeholder.classList.toggle('hidden', Boolean(content.image));
  }
}

async function saveLandingContent() {
  const imageInput = document.getElementById('landing-image-file');
  const content = {
    eyebrow: document.getElementById('landing-eyebrow-input').value.trim(),
    title: document.getElementById('landing-title-input').value.trim(),
    description: document.getElementById('landing-description-input').value.trim(),
    button: document.getElementById('landing-button-input').value.trim() || 'Mulai belajar',
    image: getLandingContent().image
  };
  if (!content.eyebrow || !content.title || !content.description) return alert('Eyebrow, judul, dan deskripsi wajib diisi.');
  if (imageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = async () => {
      content.image = reader.result;
      localStorage.setItem(LANDING_CONTENT_KEY, JSON.stringify(content));
      await saveRemoteConfig('landingContent', content);
      renderLandingContent();
      alert('Konten landing page berhasil disimpan.');
    };
    reader.readAsDataURL(imageInput.files[0]);
    return;
  }
  localStorage.setItem(LANDING_CONTENT_KEY, JSON.stringify(content));
  await saveRemoteConfig('landingContent', content);
  renderLandingContent();
  alert('Konten landing page berhasil disimpan.');
}

function resetLandingContent() {
  if (!confirm('Kembalikan landing page ke konten bawaan?')) return;
  localStorage.removeItem(LANDING_CONTENT_KEY);
  saveRemoteConfig('landingContent', defaultLandingContent);
  loadLandingEditor();
  renderLandingContent();
  alert('Landing page dikembalikan ke konten bawaan.');
}

function loadLandingEditor() {
  const content = getLandingContent();
  const eyebrow = document.getElementById('landing-eyebrow-input');
  if (!eyebrow) return;
  eyebrow.value = content.eyebrow;
  document.getElementById('landing-title-input').value = content.title;
  document.getElementById('landing-description-input').value = content.description;
  document.getElementById('landing-button-input').value = content.button;
}

function openMaterialsDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Penyimpanan file tidak tersedia di browser ini.'));
      return;
    }
    const request = indexedDB.open(MATERIALS_DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(MATERIALS_STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Database materi tidak dapat dibuka.'));
  });
}

async function getSavedMaterials() {
  try {
    const database = await openMaterialsDb();
    const materials = await new Promise((resolve, reject) => {
      const request = database.transaction(MATERIALS_STORE_NAME, 'readonly')
        .objectStore(MATERIALS_STORE_NAME).get(MATERIALS_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    database.close();
    if (materials) return materials;
  } catch (err) {}

  try {
    const saved = localStorage.getItem(MATERIALS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    return null;
  }
}

async function saveMaterials() {
  try {
    const database = await openMaterialsDb();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(MATERIALS_STORE_NAME, 'readwrite');
      transaction.objectStore(MATERIALS_STORE_NAME).put(allMateri, MATERIALS_KEY);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Penyimpanan dibatalkan.'));
    });
    database.close();
    await saveRemoteConfig('materials', allMateri);
    return true;
  } catch (err) {
    try {
      localStorage.setItem(MATERIALS_KEY, JSON.stringify(allMateri));
      await saveRemoteConfig('materials', allMateri);
      return true;
    } catch (storageError) {
      alert('Materi gagal disimpan. File terlalu besar atau penyimpanan browser penuh.');
      return false;
    }
  }
}

function renderMateri() {
  updateModuleCount();
  if (!document.getElementById('materi-container')) return;
  const query = document.getElementById('search-materi')?.value.toLowerCase() || '';
  const filter = document.getElementById('filter-mapel')?.value || 'all';
  const items = allMateri.filter(m => (filter === 'all' || m.mapel === filter) && `${m.judul} ${m.deskripsi}`.toLowerCase().includes(query));
  document.getElementById('materi-container').innerHTML = items.length ? items.map(m => { const index = allMateri.indexOf(m); return `<article class="material"><span class="tag">${mapelNames[m.mapel] || m.mapel}</span><h3>${m.judul}</h3><p>${m.deskripsi}</p><a href="${m.link || '#'}" target="_blank">Buka materi &nbsp;→</a><div class="material-actions admin-only"><button onclick="openMaterialEditor(${index})">Edit</button><button onclick="deleteMaterial(${index})">Hapus</button></div></article>`; }).join('') : '<p style="color:var(--muted)">Materi tidak ditemukan.</p>';
}

async function addLocalMaterials(files) {
  if (!files?.length) return;
  const mapel = document.getElementById('upload-mapel')?.value || 'KJR';
  const fileReaders = Array.from(files).map(file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      mapel,
      judul: file.name.replace(/\.[^/.]+$/, ''),
      deskripsi: `File lokal ${file.name}.`,
      link: reader.result
    });
    reader.onerror = () => reject(new Error(`File ${file.name} tidak dapat dibaca.`));
    reader.readAsDataURL(file);
  }));
  try {
    const materials = await Promise.all(fileReaders);
    allMateri.push(...materials);
    if (!await saveMaterials()) {
      allMateri.splice(-materials.length, materials.length);
      return;
    }
    renderMateri();
    alert(`${materials.length} materi berhasil disimpan.`);
    document.getElementById('file-materi').value = '';
  } catch (err) {
    document.getElementById('file-materi').value = '';
    alert(err.message || 'Materi gagal diunggah.');
  }
}

function openMaterialEditor(index = null) {
  editingMaterialIndex = index;
  const material = index === null ? {} : allMateri[index];
  document.getElementById('editor-title').textContent = index === null ? 'Tambah materi' : 'Edit materi';
  document.getElementById('editor-judul').value = material.judul || '';
  document.getElementById('editor-deskripsi').value = material.deskripsi || '';
  document.getElementById('editor-mapel').value = material.mapel || 'KJR';
  document.getElementById('editor-link').value = material.link || '';
  document.getElementById('material-editor').classList.remove('hidden');
  document.getElementById('editor-judul').focus();
}

function closeMaterialEditor() {
  editingMaterialIndex = null;
  document.getElementById('material-editor').classList.add('hidden');
}

async function saveMaterial() {
  const judul = document.getElementById('editor-judul').value.trim();
  const deskripsi = document.getElementById('editor-deskripsi').value.trim();
  const link = document.getElementById('editor-link').value.trim();
  if (!judul || !deskripsi || !link) return alert('Judul, deskripsi, dan link materi wajib diisi.');
  const material = { mapel: document.getElementById('editor-mapel').value, judul, deskripsi, link };
  if (editingMaterialIndex === null) allMateri.push(material);
  else allMateri[editingMaterialIndex] = material;
  if (!await saveMaterials()) return;
  closeMaterialEditor();
  renderMateri();
}

async function deleteMaterial(index) {
  if (!confirm(`Hapus materi "${allMateri[index].judul}"?`)) return;
  allMateri.splice(index, 1);
  if (!await saveMaterials()) return;
  renderMateri();
}

function addPkpjOptions() {
  const options = {
    'filter-mapel': ['PKPJ', 'Pemasangan perangkat jaringan'],
    'editor-mapel': ['PKPJ', 'Pemasangan perangkat jaringan'],
    'upload-mapel': ['PKPJ', 'Pemasangan perangkat jaringan'],
    'select-mapel': ['PKPJ', 'Pemasangan dan Konfigurasi Perangkat Jaringan']
  };
  Object.entries(options).forEach(([selectId, [value, label]]) => {
    const select = document.getElementById(selectId);
    if (!select || select.querySelector(`option[value="${value}"]`)) return;
    select.add(new Option(label, value));
  });
}

function addUploadMapelSelect() {
  const fileInput = document.getElementById('file-materi');
  if (!fileInput || document.getElementById('upload-mapel')) return;
  const select = document.createElement('select');
  select.id = 'upload-mapel';
  select.className = 'filter';
  select.setAttribute('aria-label', 'Mata pelajaran materi');
  select.add(new Option('Keamanan jaringan', 'KJR'));
  fileInput.closest('label').before(select);
}

function restrictClassOptions() {
  const classSelect = document.getElementById('kelas-siswa');
  if (!classSelect) return;
  Array.from(classSelect.options).forEach(option => {
    if (option.value.startsWith('X TKJ') || option.value.startsWith('XI TKJ')) option.remove();
  });
}

function updateMainNavigation() {
  document.querySelector('a[href="#materi"]')?.setAttribute('href', 'materi.html');
  document.querySelector('a[href="#kuis"]')?.setAttribute('href', 'kuis.html');
}

function toggleAdminLogin() {
  const modal = document.getElementById('admin-login');
  modal.classList.toggle('hidden');
  if (!modal.classList.contains('hidden')) document.getElementById('admin-username').focus();
}

function ensureInfoAdminMenu() {
  if (document.getElementById('admin-panel')) return;
  const pageMain = document.querySelector('main.page-main');
  if (!pageMain) return;
  const panel = document.createElement('section');
  panel.id = 'admin-panel';
  panel.className = 'admin-panel';
  panel.innerHTML = '<div><strong>Panel admin aktif</strong><span>Kelola materi dan jadwal kuis pembelajaran.</span></div><a class="button" href="admin.html">Buka menu admin</a>';
  pageMain.insertBefore(panel, pageMain.querySelector('.info-panel'));
}

function loginAdmin(event) {
  event.preventDefault();
  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-password').value;
  const error = document.getElementById('login-error');
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    error.textContent = 'Username atau password admin salah.';
    error.className = 'login-error';
    return;
  }
  document.getElementById('admin-login').classList.add('hidden');
  document.getElementById('admin-panel')?.classList.remove('hidden');
  ensureInfoAdminMenu();
  document.body.classList.add('admin-mode');
  document.getElementById('profile-button').classList.add('admin-active');
  document.getElementById('profile-button').setAttribute('aria-label', 'Admin aktif');
  const quizDateInput = document.getElementById('quiz-date');
  if (quizDateInput) quizDateInput.value = getQuizDate();
  loadLandingEditor();
  renderMateri();
}

function getQuizDate() {
  return getActiveQuizSchedule()?.date || '';
}

function getQuizMapel() {
  return getActiveQuizSchedule()?.mapel || 'KJR';
}

function getQuizSchedules() {
  try {
    const saved = JSON.parse(localStorage.getItem(QUIZ_SCHEDULES_KEY) || 'null');
    if (Array.isArray(saved)) return saved.filter(schedule => schedule.date && schedule.mapel);
  } catch (err) {}
  const date = localStorage.getItem(QUIZ_DATE_KEY);
  return date ? [{ date, mapel: localStorage.getItem(QUIZ_MAPEL_KEY) || 'KJR' }] : [];
}

function getActiveQuizSchedule() {
  const schedules = getQuizSchedules().sort((first, second) => first.date.localeCompare(second.date));
  return schedules.find(schedule => schedule.date === getTodayDate())
    || schedules.find(schedule => schedule.date > getTodayDate())
    || schedules[schedules.length - 1]
    || null;
}

function getQuizScheduleForMapel(mapel) {
  const schedules = getQuizSchedules().filter(schedule => schedule.mapel === mapel)
    .sort((first, second) => first.date.localeCompare(second.date));
  return schedules.find(schedule => schedule.date === getTodayDate())
    || schedules.find(schedule => schedule.date > getTodayDate())
    || schedules[schedules.length - 1]
    || null;
}

function saveQuizSchedules(schedules) {
  const validSchedules = schedules.filter(schedule => schedule.date && schedule.mapel)
    .sort((first, second) => first.date.localeCompare(second.date));
  if (validSchedules.length) {
    localStorage.setItem(QUIZ_SCHEDULES_KEY, JSON.stringify(validSchedules));
    localStorage.setItem(QUIZ_DATE_KEY, validSchedules[0].date);
    localStorage.setItem(QUIZ_MAPEL_KEY, validSchedules[0].mapel);
  } else {
    localStorage.removeItem(QUIZ_SCHEDULES_KEY);
    localStorage.removeItem(QUIZ_DATE_KEY);
    localStorage.removeItem(QUIZ_MAPEL_KEY);
  }
  saveRemoteConfig('quizSchedules', validSchedules);
}

function getQuizMapelName(mapel) {
  return { KJR: 'Keamanan Jaringan', PKPJ: 'Pemasangan dan Konfigurasi Perangkat Jaringan' }[mapel] || mapel;
}

function ensureQuizMapelControl() {
  const dateInput = document.getElementById('quiz-date');
  if (!dateInput || document.getElementById('quiz-mapel')) return;
  const select = document.createElement('select');
  select.id = 'quiz-mapel';
  select.setAttribute('aria-label', 'Mata pelajaran kuis');
  select.innerHTML = '<option value="KJR">Keamanan Jaringan</option><option value="PKPJ">Pemasangan dan Konfigurasi Perangkat Jaringan</option>';
  dateInput.parentElement.parentElement.insertBefore(select, dateInput.parentElement);
  const label = document.createElement('label');
  label.htmlFor = 'quiz-mapel';
  label.textContent = 'Mata pelajaran kuis';
  dateInput.parentElement.parentElement.insertBefore(label, select);
}

function loadQuizScheduleRows() {
  const schedules = getQuizSchedules();
  if (!document.getElementById('quiz-date')) return;
  const firstSchedule = schedules[0] || {};
  document.getElementById('quiz-date').value = firstSchedule.date || '';
  document.getElementById('quiz-mapel').value = firstSchedule.mapel || 'KJR';
}

function renderAdminQuizSchedules() {
  const setting = document.querySelector('.quiz-schedule-setting');
  if (!setting) return;
  let list = document.getElementById('admin-quiz-schedule-list');
  if (!list) {
    list = document.createElement('div');
    list.id = 'admin-quiz-schedule-list';
    list.style.display = 'grid';
    list.style.gap = '8px';
    setting.append(list);
  }
  list.innerHTML = '';
  getQuizSchedules().forEach((schedule, index) => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px;background:var(--paper);border:1px solid var(--line);border-radius:7px';
    item.innerHTML = `<span><strong>${getQuizMapelName(schedule.mapel)}</strong><br><small>${formatQuizDate(schedule.date)}</small></span><span style="display:flex;gap:6px"><button class="cancel-button" type="button">Edit</button><button class="cancel-button" type="button">Hapus</button></span>`;
    item.querySelectorAll('button')[0].addEventListener('click', () => {
      editingQuizScheduleIndex = index;
      document.getElementById('quiz-date').value = schedule.date;
      document.getElementById('quiz-mapel').value = schedule.mapel;
      document.getElementById('quiz-date').focus();
    });
    item.querySelectorAll('button')[1].addEventListener('click', () => deleteQuizSchedule(index));
    list.append(item);
  });
}

function deleteQuizSchedule(index) {
  const schedules = getQuizSchedules();
  if (!schedules[index] || !confirm(`Hapus jadwal ${getQuizMapelName(schedules[index].mapel)}?`)) return;
  schedules.splice(index, 1);
  editingQuizScheduleIndex = null;
  saveQuizSchedules(schedules);
  loadQuizScheduleRows();
  renderAdminQuizSchedules();
  updateQuizScheduleInfo();
}

function saveQuizDate() {
  const date = document.getElementById('quiz-date').value;
  const mapel = document.getElementById('quiz-mapel')?.value || 'KJR';
  if (!date) return alert('Pilih tanggal jadwal terlebih dahulu.');
  const schedules = getQuizSchedules();
  if (editingQuizScheduleIndex !== null && schedules[editingQuizScheduleIndex]) {
    schedules[editingQuizScheduleIndex] = { date, mapel };
  } else {
    const existingIndex = schedules.findIndex(schedule => schedule.date === date && schedule.mapel === mapel);
    if (existingIndex >= 0) schedules[existingIndex] = { date, mapel };
    else schedules.push({ date, mapel });
  }
  editingQuizScheduleIndex = null;
  saveQuizSchedules(schedules);
  alert(`Jadwal ${getQuizMapelName(mapel)} disimpan. Total jadwal: ${schedules.length}.`);
  loadQuizScheduleRows();
  renderAdminQuizSchedules();
  updateQuizScheduleInfo();
}

function loginAdminPage(event) {
  event.preventDefault();
  const username = document.getElementById('admin-page-username').value.trim();
  const password = document.getElementById('admin-page-password').value;
  const error = document.getElementById('admin-page-login-error');
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    error.textContent = 'Username atau password admin salah.';
    error.className = 'login-error';
    return;
  }
  document.getElementById('admin-access').classList.add('hidden');
  document.getElementById('admin-dashboard').classList.remove('hidden');
  ensureQuizMapelControl();
  loadQuizScheduleRows();
  renderAdminQuizSchedules();
  renderMateri();
  updateQuizScheduleInfo();
}

function logoutAdminPage() {
  document.getElementById('admin-dashboard').classList.add('hidden');
  document.getElementById('admin-access').classList.remove('hidden');
  document.getElementById('admin-page-login-form').reset();
}

function formatQuizDate(date) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date(`${date}T00:00:00`));
}

function getTodayDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function renderQuizScheduleList(schedules) {
  const scheduleDetails = document.querySelector('.schedule-details');
  if (!scheduleDetails) return;
  let list = document.getElementById('quiz-schedule-list');
  if (!list) {
    list = document.createElement('div');
    list.id = 'quiz-schedule-list';
    list.style.display = 'grid';
    list.style.gap = '10px';
    scheduleDetails.before(list);
  }
  list.innerHTML = schedules.length ? schedules.map(schedule => `<div style="display:grid;gap:5px;padding:14px;background:var(--paper);border-radius:8px"><span style="color:var(--muted);font-size:12px">${getQuizMapelName(schedule.mapel)}</span><strong style="color:var(--ink);font-size:14px">Kuis dapat dikerjakan pada ${formatQuizDate(schedule.date)}</strong></div>`).join('') : '';
  scheduleDetails.classList.toggle('hidden', schedules.length > 0);
}

function updateQuizScheduleInfo() {
  const schedules = getQuizSchedules();
  const activeSchedule = getActiveQuizSchedule();
  const date = activeSchedule?.date || '';
  const info = document.getElementById('quiz-schedule-info');
  const detail = document.getElementById('quiz-date-detail');
  const mapelDetail = document.getElementById('quiz-mapel-detail');
  const dayDetail = document.getElementById('quiz-day-detail');
  const status = document.getElementById('quiz-status');
  const button = document.getElementById('btn-start');
  const scheduleMessages = schedules.map(schedule => `Kuis ${getQuizMapelName(schedule.mapel)} dapat dikerjakan pada ${formatQuizDate(schedule.date)}.`);
  const scheduleMessage = scheduleMessages.length ? scheduleMessages.join(' ') : 'Kuis dapat dikerjakan kapan saja.';
  renderQuizScheduleList(schedules);
  if (info) info.textContent = scheduleMessage;
  if (detail) detail.textContent = schedules.length > 1 ? `${schedules.length} jadwal kuis tersedia.` : scheduleMessage;
  if (mapelDetail) mapelDetail.textContent = schedules.length ? getQuizMapelName(schedules[0].mapel) : 'Keamanan Jaringan';
  if (dayDetail) dayDetail.textContent = schedules.length ? formatQuizDate(schedules[0].date) : 'Belum ditentukan';
  if (status) {
    status.textContent = date === getTodayDate() ? 'Kuis berlangsung hari ini.' : scheduleMessage;
    status.classList.toggle('quiz-status-active', date === getTodayDate());
  }
  const adminStatus = document.getElementById('admin-quiz-status');
  if (adminStatus) adminStatus.textContent = scheduleMessage;
  const selectedMapel = document.getElementById('select-mapel')?.value;
  const selectedSchedule = selectedMapel ? getQuizScheduleForMapel(selectedMapel) : activeSchedule;
  if (button) button.disabled = Boolean(schedules.length && (!selectedSchedule || selectedSchedule.date !== getTodayDate()));
}

function logoutAdmin() {
  document.getElementById('admin-panel')?.classList.add('hidden');
  document.body.classList.remove('admin-mode');
  document.getElementById('profile-button').classList.remove('admin-active');
  document.getElementById('profile-button').setAttribute('aria-label', 'Login admin');
  if (document.getElementById('material-editor')) closeMaterialEditor();
  renderMateri();
}

async function loadKuis() {
  const mapel = document.getElementById('select-mapel').value;
  const schedules = getQuizSchedules();
  const quizSchedule = getQuizScheduleForMapel(mapel);
  if (schedules.length && (!quizSchedule || quizSchedule.date !== getTodayDate())) {
    const identityError = document.getElementById('identitas-error');
    identityError.textContent = quizSchedule
      ? `Kuis ${getQuizMapelName(mapel)} dikunci sampai ${formatQuizDate(quizSchedule.date)}.`
      : `Kuis ${getQuizMapelName(mapel)} belum memiliki jadwal pelaksanaan.`;
    identityError.className = 'identity-error';
    return;
  }
  const nama = document.getElementById('nama-siswa').value.trim();
  const kelas = document.getElementById('kelas-siswa').value;
  const identityError = document.getElementById('identitas-error');
  if (!nama || !kelas) {
    identityError.textContent = 'Isi nama siswa dan pilih kelas terlebih dahulu sebelum mengerjakan kuis.';
    identityError.className = 'identity-error';
    if (!nama) document.getElementById('nama-siswa').focus();
    else document.getElementById('kelas-siswa').focus();
    return;
  }
  identityError.className = 'identity-error hidden';
  document.getElementById('quiz-fields').classList.add('hidden');
  document.getElementById('quiz-intro').classList.add('hidden');
  document.getElementById('btn-start').classList.add('hidden');
  currentQuestion = 0;
  score = 0;
  selectedAnswers = [];
  currentKuisData = fallbackKuis[mapel];
  try {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/kuis/${mapel}`);
      const json = await res.json();
      if (json.data?.length >= 20) currentKuisData = json.data.slice(0, 20);
    }
  } catch (err) {}
  document.getElementById('kuis-container').classList.remove('hidden');
  document.getElementById('hasil-kuis').className = 'hidden';
  document.getElementById('btn-next').style.display = 'block';
  renderQuestion();
}

function renderQuestion() {
  const q = currentKuisData[currentQuestion];
  startQuestionTimer();
  document.getElementById('nomor-soal').textContent = `Soal ${currentQuestion + 1} / ${currentKuisData.length}`;
  document.getElementById('skor-soal').textContent = `Skor: ${score}`;
  document.getElementById('soal-box').textContent = q.soal;
  document.getElementById('opsi-box').innerHTML = q.opsi.map((o, idx) => `<label class="option"><input type="radio" name="jawaban" value="${idx}">${o}</label>`).join('');
  if (selectedAnswers[currentQuestion] !== undefined) {
    document.querySelector(`input[name="jawaban"][value="${selectedAnswers[currentQuestion]}"]`).checked = true;
  }
}

function startQuestionTimer() {
  clearInterval(timerId);
  remainingSeconds = DEFAULT_QUIZ_DURATION;
  updateTimerDisplay();
  timerId = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();
    if (remainingSeconds <= 0) {
      clearInterval(timerId);
      saveSelectedAnswer();
      if (currentQuestion === currentKuisData.length - 1) finishQuiz();
      else {
        currentQuestion++;
        renderQuestion();
      }
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timer = document.getElementById('timer-soal');
  timer.textContent = `Waktu: ${remainingSeconds} detik`;
  timer.classList.toggle('timer-warning', remainingSeconds <= 10);
}

function saveSelectedAnswer() {
  const selected = document.querySelector('input[name="jawaban"]:checked');
  if (selected) selectedAnswers[currentQuestion] = Number(selected.value);
}

function cancelQuiz() {
  clearInterval(timerId);
  currentQuestion = 0;
  score = 0;
  selectedAnswers = [];
  document.getElementById('kuis-container').classList.add('hidden');
  document.getElementById('quiz-fields').classList.remove('hidden');
  document.getElementById('quiz-intro').classList.remove('hidden');
  document.getElementById('btn-start').classList.remove('hidden');
  document.getElementById('identitas-error').className = 'identity-error hidden';
  document.getElementById('hasil-kuis').className = 'hidden';
  document.getElementById('nama-siswa').value = '';
  document.getElementById('kelas-siswa').value = '';
  document.getElementById('btn-next').style.display = 'block';
}

function nextQuestion() {
  saveSelectedAnswer();
  if (selectedAnswers[currentQuestion] === undefined) {
    return alert('Pilih salah satu jawaban terlebih dahulu.');
  }
  clearInterval(timerId);
  if (currentQuestion === currentKuisData.length - 1) {
    finishQuiz();
    return;
  }
  currentQuestion++;
  renderQuestion();
}

function finishQuiz() {
  clearInterval(timerId);
  score = currentKuisData.reduce((total, question, index) => total + (selectedAnswers[index] === Number(question.jawaban) ? 1 : 0), 0);
  const hasil = document.getElementById('hasil-kuis');
  hasil.className = 'success';
  hasil.textContent = `Kuis selesai. Skormu ${score} dari ${currentKuisData.length}!`;
  saveScoreToSheet();
  document.getElementById('btn-next').style.display = 'none';
  document.getElementById('soal-box').textContent = 'Kerja bagus, terus tingkatkan pemahamanmu.';
  document.getElementById('opsi-box').innerHTML = '';
}

async function saveScoreToSheet() {
  if (!GOOGLE_SHEETS_URL) return;
  const payload = {
    nama: document.getElementById('nama-siswa').value.trim() || 'Tanpa nama',
    kelas: document.getElementById('kelas-siswa').value,
    mapel: document.getElementById('select-mapel').value,
    skor: score,
    totalSoal: currentKuisData.length,
    waktu: new Date().toISOString()
  };
  const hasil = document.getElementById('hasil-kuis');
  hasil.textContent += ' Mengirim nilai...';
  try {
    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    hasil.textContent = hasil.textContent.replace(' Mengirim nilai...', '') + ' Nilai dikirim. Cek sheet untuk memastikan data masuk.';
  } catch (err) {
    hasil.textContent = hasil.textContent.replace(' Mengirim nilai...', '') + ' Nilai gagal dikirim.';
  }
}

document.getElementById('search-materi')?.addEventListener('input', renderMateri);
document.getElementById('filter-mapel')?.addEventListener('change', renderMateri);
document.getElementById('select-mapel')?.addEventListener('change', updateQuizScheduleInfo);
addUploadMapelSelect();
document.getElementById('file-materi')?.addEventListener('change', event => addLocalMaterials(event.target.files));
document.getElementById('admin-login-form')?.addEventListener('submit', loginAdmin);
document.getElementById('landing-image-file')?.addEventListener('change', event => {
  const file = event.target.files[0];
  if (file && !file.type.startsWith('image/')) {
    event.target.value = '';
    alert('File landing page harus berupa gambar.');
  }
});
addPkpjOptions();
restrictClassOptions();
updateMainNavigation();
async function initializeApp() {
  await loadRemoteConfig();
  updateQuizScheduleInfo();
  renderLandingContent();
  await loadMateri();
  setInterval(loadRemoteConfig, 10000);
}

initializeApp();
