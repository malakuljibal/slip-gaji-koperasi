// State Management
let appSettings = JSON.parse(localStorage.getItem('koperasi_settings')) || { ...DEFAULT_SETTINGS };
let workersDb = JSON.parse(localStorage.getItem('koperasi_workers')) || [...INITIAL_WORKERS];
let slipHistory = JSON.parse(localStorage.getItem('koperasi_history')) || [];

let incomeItems = [
  { desc: "Upah Pemetik (0 kg x Rp 7.000)", amount: 0 }
];
let deductionItems = [
  { desc: "Kasbon Borongan", amount: 0 }
];

// Initialization
window.addEventListener('DOMContentLoaded', () => {
  initDropdowns();
  loadSettingsToUI();
  resetSlipForm(false);
  renderDashboard();
  renderWorkersTable();
  renderHistoryTable();
  applyPaperWidth();

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW:', err));
  }
});

// ================= NAVIGATION =================
const VIEW_META = {
  dashboard: { title: "Dashboard Koperasi", sub: "Ringkasan Anggaran, Realisasi Beban & Operasional" },
  slip: { title: "Buat & Cetak Slip Thermal", sub: "Format Kertas Roll 57x30 / 58mm Fleksibel" },
  workers: { title: "Database Pekerja & Regu", sub: "86+ Pekerja Aktif (Pemetik, Pengawas, Penjemur, Pemarasan)" },
  history: { title: "Riwayat & Rekap Pembayaran", sub: "Arsip Slip Tercetak & Export Excel/CSV" },
  settings: { title: "Pengaturan Sistem & Printer", sub: "Identitas Koperasi, Tarif Default & Backup Data" }
};

function switchView(viewName) {
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');

  document.querySelectorAll('.nav-item, .mobile-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  if (VIEW_META[viewName]) {
    document.getElementById('topbarTitle').innerText = VIEW_META[viewName].title;
    document.getElementById('topbarSubtitle').innerText = VIEW_META[viewName].sub;
  }

  if (viewName === 'dashboard') renderDashboard();
  if (viewName === 'workers') renderWorkersTable();
  if (viewName === 'history') renderHistoryTable();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= HELPERS =================
function formatRupiah(num) {
  return "Rp " + Math.round(Number(num || 0)).toLocaleString("id-ID");
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function generateRefNo() {
  const d = new Date();
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, '');
  const seq = String(slipHistory.length + 1).padStart(3, '0');
  return `KOP-${ymd}-${seq}`;
}

// ================= DROPDOWNS =================
function initDropdowns() {
  const reguFilterSlip = document.getElementById('filterSlipRegu');
  const reguFilterDb = document.getElementById('filterWorkerRegu');
  reguFilterSlip.innerHTML = '<option value="">-- Semua Regu --</option>';
  reguFilterDb.innerHTML = '<option value="">-- Semua Regu --</option>';

  const reguSet = new Set(REGU_LIST);
  workersDb.forEach(w => {
    if (w.regu && w.regu !== '-' && w.regu.trim() !== '') {
      reguSet.add(w.regu.trim());
    }
  });

  Array.from(reguSet).sort().forEach(r => {
    reguFilterSlip.add(new Option(r, r));
    reguFilterDb.add(new Option(r, r));
  });

  const coaSelect = document.getElementById('coaSelect');
  const coaFilterHistory = document.getElementById('filterHistoryCoa');
  coaSelect.innerHTML = '';
  coaFilterHistory.innerHTML = '<option value="">-- Semua Akun (COA) --</option>';

  COA_ACCOUNTS.forEach(c => {
    coaSelect.add(new Option(`${c.code} - ${c.name}`, c.code));
    coaFilterHistory.add(new Option(`${c.code} - ${c.name}`, c.code));
  });

  populateWorkerSelect();
}

function populateWorkerSelect() {
  const regu = document.getElementById('filterSlipRegu').value;
  const select = document.getElementById('selectWorkerDb');
  select.innerHTML = '<option value="">-- Pilih Pekerja dari Database --</option>';

  workersDb
    .filter(w => w.status === 'Aktif' && (!regu || w.regu.toLowerCase().includes(regu.toLowerCase())))
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(w => {
      select.add(new Option(`${w.name} (${w.regu})`, w.id));
    });
}

function onSelectWorkerFromDb() {
  const id = document.getElementById('selectWorkerDb').value;
  if (!id) return;
  const w = workersDb.find(item => item.id === id);
  if (!w) return;

  document.getElementById('workerName').value = w.name;
  document.getElementById('workerRole').value = w.role;
  document.getElementById('workerRegu').value = w.regu;

  // Auto-select COA & calculator mode based on role
  if (w.role.includes('Pemetik')) {
    document.getElementById('coaSelect').value = '402';
    document.getElementById('calcMode').value = 'borongan_kg';
    document.getElementById('calcRateKg').value = w.rate || appSettings.defaultRatePemetik;
    if (w.lastKg && w.lastKg > 0) {
      document.getElementById('calcQtyKg').value = w.lastKg;
    }
  } else if (w.role.includes('Pencudai')) {
    document.getElementById('coaSelect').value = '403';
    document.getElementById('calcMode').value = 'borongan_kg';
    document.getElementById('calcRateKg').value = appSettings.defaultRateCudai;
  } else if (w.role.includes('Pengawas')) {
    document.getElementById('coaSelect').value = '404';
    document.getElementById('calcMode').value = 'harian_hok';
    document.getElementById('calcRateHok').value = w.rate || appSettings.defaultRatePengawas;
  } else if (w.role.includes('Penjemur')) {
    document.getElementById('coaSelect').value = '405';
    document.getElementById('calcMode').value = 'harian_hok';
    document.getElementById('calcRateHok').value = w.rate || 125000;
  } else if (w.role.includes('Pemarasan')) {
    document.getElementById('coaSelect').value = '407';
    document.getElementById('calcMode').value = 'borongan_lahan';
  }

  toggleCalcMode();
  updateReceipt();
}

function onCoaChange() {
  const code = document.getElementById('coaSelect').value;
  const coa = COA_ACCOUNTS.find(c => c.code === code);
  if (coa && coa.mode !== 'custom') {
    document.getElementById('calcMode').value = coa.mode;
    if (coa.mode === 'borongan_kg' && coa.defaultRate) {
      document.getElementById('calcRateKg').value = coa.defaultRate;
    } else if (coa.mode === 'harian_hok' && coa.defaultRate) {
      document.getElementById('calcRateHok').value = coa.defaultRate;
    }
    toggleCalcMode();
  }
  updateReceipt();
}

// ================= SMART CALCULATOR =================
function toggleCalcMode() {
  const mode = document.getElementById('calcMode').value;
  document.getElementById('calcInputsKg').style.display = mode === 'borongan_kg' ? 'grid' : 'none';
  document.getElementById('calcInputsHok').style.display = mode === 'harian_hok' ? 'grid' : 'none';
  document.getElementById('calcInputsLahan').style.display = mode === 'borongan_lahan' ? 'grid' : 'none';
  applyCalculatedIncome();
}

function applyCalculatedIncome() {
  const mode = document.getElementById('calcMode').value;
  const role = document.getElementById('workerRole').value || 'Pekerja';

  if (mode === 'borongan_kg') {
    const kg = parseFloat(document.getElementById('calcQtyKg').value) || 0;
    const rate = parseFloat(document.getElementById('calcRateKg').value) || 7000;
    const total = kg * rate;
    incomeItems = [{ desc: `Hasil ${role} (${kg} kg x ${formatRupiah(rate)})`, amount: total }];
  } else if (mode === 'harian_hok') {
    const days = parseFloat(document.getElementById('calcDaysHok').value) || 0;
    const rate = parseFloat(document.getElementById('calcRateHok').value) || 150000;
    const total = days * rate;
    incomeItems = [{ desc: `Gaji ${role} (${days} hari x ${formatRupiah(rate)})`, amount: total }];
  } else if (mode === 'borongan_lahan') {
    const luas = parseFloat(document.getElementById('calcLuasLahan').value) || 0;
    const rate = parseFloat(document.getElementById('calcRateLahan').value) || 0;
    const total = luas * rate;
    incomeItems = [{ desc: `Upah Pemarasan (${luas} Ha x ${formatRupiah(rate)})`, amount: total }];
  }

  renderItemInputs();
  updateReceipt();
}

// ================= DYNAMIC ITEMS EDITOR =================
function renderItemInputs() {
  const incBox = document.getElementById('incomeItemsBox');
  incBox.innerHTML = '';
  incomeItems.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'item-row';
    div.innerHTML = `
      <input type="text" value="${item.desc}" oninput="incomeItems[${idx}].desc=this.value; updateReceipt();" placeholder="Deskripsi Pendapatan">
      <input type="number" value="${item.amount}" oninput="incomeItems[${idx}].amount=parseFloat(this.value)||0; updateReceipt();" placeholder="Nominal">
      <button class="btn btn-danger btn-sm" onclick="removeIncomeItem(${idx})">✕</button>
    `;
    incBox.appendChild(div);
  });

  const dedBox = document.getElementById('deductionItemsBox');
  dedBox.innerHTML = '';
  deductionItems.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'item-row';
    div.innerHTML = `
      <input type="text" value="${item.desc}" oninput="deductionItems[${idx}].desc=this.value; updateReceipt();" placeholder="Deskripsi Potongan">
      <input type="number" value="${item.amount}" oninput="deductionItems[${idx}].amount=parseFloat(this.value)||0; updateReceipt();" placeholder="Nominal">
      <button class="btn btn-danger btn-sm" onclick="removeDeductionItem(${idx})">✕</button>
    `;
    dedBox.appendChild(div);
  });
}

function addIncomeRow() {
  incomeItems.push({ desc: "Tambahan Uang Makan / Bonus", amount: 0 });
  renderItemInputs();
  updateReceipt();
}

function removeIncomeItem(idx) {
  if (incomeItems.length > 1) {
    incomeItems.splice(idx, 1);
    renderItemInputs();
    updateReceipt();
  } else {
    showToast("Minimal 1 komponen pendapatan!");
  }
}

function addDeductionRow() {
  deductionItems.push({ desc: "Kasbon / Pinjaman", amount: 0 });
  renderItemInputs();
  updateReceipt();
}

function removeDeductionItem(idx) {
  deductionItems.splice(idx, 1);
  renderItemInputs();
  updateReceipt();
}

// ================= LIVE RECEIPT UPDATE =================
function updateReceipt() {
  document.getElementById('prevBizName').innerText = document.getElementById('businessName').value || appSettings.businessName;
  document.getElementById('prevBizUnit').innerText = document.getElementById('businessUnit').value || appSettings.businessUnit;
  document.getElementById('prevBizAddr').innerText = document.getElementById('businessAddress').value || appSettings.businessAddress;

  document.getElementById('prevRefNo').innerText = document.getElementById('refNo').value;

  const rawDate = document.getElementById('payDate').value;
  if (rawDate) {
    const p = rawDate.split('-');
    document.getElementById('prevDate').innerText = `${p[2]}/${p[1]}/${p[0]}`;
  }

  const worker = document.getElementById('workerName').value || 'Nama Pekerja';
  document.getElementById('prevWorker').innerText = worker;
  document.getElementById('prevSignWorker').innerText = `(${worker.length > 14 ? worker.substring(0, 14) + '.' : worker})`;

  document.getElementById('prevRole').innerText = document.getElementById('workerRole').value || '-';
  document.getElementById('prevRegu').innerText = document.getElementById('workerRegu').value || '-';
  document.getElementById('prevPeriod').innerText = document.getElementById('periodText').value || '-';

  const pic = document.getElementById('picName').value || appSettings.picName;
  document.getElementById('prevSignPic').innerText = `(${pic})`;

  // Render Income Table
  let totInc = 0;
  const incTbody = document.getElementById('prevIncomeTbody');
  incTbody.innerHTML = '';
  incomeItems.forEach(item => {
    totInc += Number(item.amount || 0);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-item">${item.desc || 'Pendapatan'}</td>
      <td class="col-val">${formatRupiah(item.amount)}</td>
    `;
    incTbody.appendChild(tr);
  });

  // Render Deduction Table
  let totDed = 0;
  const dedBox = document.getElementById('prevDeductionBox');
  const dedTbody = document.getElementById('prevDeductionTbody');
  dedTbody.innerHTML = '';

  const activeDed = deductionItems.filter(i => Number(i.amount) > 0);
  if (activeDed.length > 0) {
    dedBox.style.display = 'block';
    activeDed.forEach(item => {
      totDed += Number(item.amount || 0);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="col-item">${item.desc || 'Potongan'}</td>
        <td class="col-val">-${formatRupiah(item.amount)}</td>
      `;
      dedTbody.appendChild(tr);
    });
  } else {
    dedBox.style.display = 'none';
  }

  const netTotal = totInc - totDed;
  document.getElementById('prevTotal').innerText = formatRupiah(netTotal);
  document.getElementById('prevMethod').innerText = document.getElementById('paymentMethod').value;
  document.getElementById('prevFooterNote').innerText = document.getElementById('noteText').value || appSettings.footerNote;
}

function resetSlipForm(ask = true) {
  if (ask && !confirm("Kosongkan form & buat slip baru?")) return;

  document.getElementById('refNo').value = generateRefNo();
  document.getElementById('payDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('filterSlipRegu').value = '';
  populateWorkerSelect();

  document.getElementById('selectWorkerDb').value = '';
  document.getElementById('workerName').value = '';
  document.getElementById('workerRole').value = 'Borongan Pemetik';
  document.getElementById('workerRegu').value = '-';
  document.getElementById('periodText').value = '24-30 Nov 2026 (Mingguan)';

  document.getElementById('coaSelect').value = '402';
  document.getElementById('calcMode').value = 'borongan_kg';
  document.getElementById('calcQtyKg').value = 0;
  document.getElementById('calcRateKg').value = appSettings.defaultRatePemetik;
  document.getElementById('calcDaysHok').value = 7;
  document.getElementById('calcRateHok').value = appSettings.defaultRatePengawas;

  incomeItems = [{ desc: "Upah Pemetik (0 kg x Rp 7.000)", amount: 0 }];
  deductionItems = [{ desc: "Kasbon Borongan", amount: 0 }];

  toggleCalcMode();
  renderItemInputs();
  updateReceipt();
  if (ask) showToast("Form slip di-reset.");
}

// ================= SAVE & PRINT SLIP =================
function saveAndPrintSlip() {
  const workerName = document.getElementById('workerName').value.trim();
  if (!workerName) {
    showToast("⚠️ Tuliskan Nama Pekerja terlebih dahulu!");
    return;
  }

  let totInc = incomeItems.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  let totDed = deductionItems.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  let netTotal = totInc - totDed;

  const record = {
    id: 'SLIP-' + Date.now(),
    refNo: document.getElementById('refNo').value,
    date: document.getElementById('payDate').value,
    workerName: workerName,
    role: document.getElementById('workerRole').value,
    regu: document.getElementById('workerRegu').value,
    coaCode: document.getElementById('coaSelect').value,
    period: document.getElementById('periodText').value,
    grossAmount: totInc,
    kasbonAmount: totDed,
    netAmount: netTotal,
    paymentMethod: document.getElementById('paymentMethod').value,
    incomeDetails: JSON.parse(JSON.stringify(incomeItems)),
    deductionDetails: JSON.parse(JSON.stringify(deductionItems))
  };

  // Add to history
  slipHistory.unshift(record);
  localStorage.setItem('koperasi_history', JSON.stringify(slipHistory));

  renderDashboard();
  renderHistoryTable();

  // Print execution
  if (typeof AndroidPrint !== 'undefined' && AndroidPrint.isBluetoothConnected && AndroidPrint.isBluetoothConnected()) {
    printDirectBluetooth();
  } else {
    prepareAndPrintSystem();
  }
}

function prepareAndPrintSystem() {
  const source = document.getElementById('receiptPrintArea');
  const container = document.getElementById('printableReceiptContainer');
  if (source && container) {
    container.innerHTML = source.innerHTML;
  }
  if (typeof AndroidPrint !== 'undefined' && AndroidPrint.printPage) {
    AndroidPrint.printPage();
  } else {
    window.print();
  }
}

// Direct Bluetooth Printing via ESC/POS
function sanitizeAscii(str) {
  return (str || "")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/‘|’/g, "'")
    .replace(/“|”/g, '"')
    .replace(/[^\x20-\x7E\n\r]/g, '');
}

function generateEscPosBytes() {
  let bytes = [];
  function pushString(str) {
    let clean = sanitizeAscii(str);
    for (let i = 0; i < clean.length; i++) {
      bytes.push(clean.charCodeAt(i));
    }
  }

  bytes.push(0x1B, 0x40); // Init
  bytes.push(0x1B, 0x61, 0x01); // Center Align

  bytes.push(0x1B, 0x45, 0x01); // Bold
  pushString((document.getElementById('businessName').value || appSettings.businessName) + "\n");
  bytes.push(0x1B, 0x45, 0x00);

  pushString((document.getElementById('businessUnit').value || appSettings.businessUnit) + "\n");
  pushString((document.getElementById('businessAddress').value || appSettings.businessAddress) + "\n");
  pushString("------------------------------\n");

  bytes.push(0x1B, 0x61, 0x00); // Left Align

  function addKeyValue(k, v) {
    k = (k || "").trim();
    v = (v || "").trim();
    if (k.length + v.length + 1 <= 30) {
      let sp = Math.max(1, 30 - (k.length + v.length));
      pushString(k + " ".repeat(sp) + v + "\n");
    } else {
      pushString(k + ":\n");
      let vSub = v.length > 28 ? v.substring(0, 28) : v;
      pushString("  " + vSub + "\n");
    }
  }

  addKeyValue("No.Bukti", document.getElementById('refNo').value);
  addKeyValue("Tanggal", document.getElementById('payDate').value);
  addKeyValue("Pekerja", document.getElementById('workerName').value);
  addKeyValue("Jabatan", document.getElementById('workerRole').value);
  addKeyValue("Periode", document.getElementById('periodText').value);
  pushString("------------------------------\n");

  bytes.push(0x1B, 0x45, 0x01);
  pushString("RINCIAN PENDAPATAN:\n");
  bytes.push(0x1B, 0x45, 0x00);

  let totInc = 0;
  incomeItems.forEach(item => {
    totInc += Number(item.amount || 0);
    let name = item.desc || 'Pendapatan';
    let amtStr = formatRupiah(item.amount);
    pushString(name + "\n");
    let sp = Math.max(1, 30 - amtStr.length);
    pushString(" ".repeat(sp) + amtStr + "\n");
  });

  let totDed = 0;
  const activeDed = deductionItems.filter(i => Number(i.amount) > 0);
  if (activeDed.length > 0) {
    pushString("------------------------------\n");
    bytes.push(0x1B, 0x45, 0x01);
    pushString("POTONGAN / KASBON:\n");
    bytes.push(0x1B, 0x45, 0x00);
    activeDed.forEach(item => {
      totDed += Number(item.amount || 0);
      let dName = item.desc || 'Potongan';
      let dAmt = "-" + formatRupiah(item.amount);
      pushString(dName + "\n");
      let sp = Math.max(1, 30 - dAmt.length);
      pushString(" ".repeat(sp) + dAmt + "\n");
    });
  }

  pushString("------------------------------\n");
  bytes.push(0x1B, 0x45, 0x01);
  let netTot = totInc - totDed;
  let totStr = "TOTAL DITERIMA";
  let totAmt = formatRupiah(netTot);
  let totSp = Math.max(1, 30 - (totStr.length + totAmt.length));
  pushString(totStr + " ".repeat(totSp) + totAmt + "\n");
  bytes.push(0x1B, 0x45, 0x00);

  addKeyValue("Metode", document.getElementById('paymentMethod').value);
  pushString("------------------------------\n");

  pushString("Penerima,            Pengesah,\n\n\n");
  const worker = document.getElementById('workerName').value;
  const pic = document.getElementById('picName').value || appSettings.picName;
  let wSign = "(" + (worker.length > 11 ? worker.substring(0, 11) : worker) + ")";
  let pSign = "(" + (pic.length > 11 ? pic.substring(0, 11) : pic) + ")";
  let signSp = Math.max(1, 30 - (wSign.length + pSign.length));
  pushString(wSign + " ".repeat(signSp) + pSign + "\n");
  pushString("------------------------------\n");

  bytes.push(0x1B, 0x61, 0x01);
  pushString((document.getElementById('noteText').value || appSettings.footerNote) + "\n");
  pushString("--- Simpan bukti ini ---\n\n\n\n\n\n");
  bytes.push(0x1D, 0x56, 0x42, 0x00);

  return new Uint8Array(bytes);
}

function printDirectBluetooth() {
  if (typeof AndroidPrint === 'undefined' || !AndroidPrint.isBluetoothConnected || !AndroidPrint.isBluetoothConnected()) {
    openBluetoothModal();
    showToast("⚠️ Hubungkan Printer Bluetooth terlebih dahulu!");
    return;
  }

  try {
    const rawBytes = generateEscPosBytes();
    let binaryStr = "";
    for (let i = 0; i < rawBytes.length; i++) {
      binaryStr += String.fromCharCode(rawBytes[i]);
    }
    const base64Str = btoa(binaryStr);
    const ok = AndroidPrint.sendRawBytes(base64Str);
    if (!ok) showToast("❌ Gagal mengirim data ke printer Bluetooth.");
  } catch (e) {
    showToast("❌ Error cetak: " + e.message);
  }
}

// ================= DASHBOARD RENDER =================
function renderDashboard() {
  let totalPaid = slipHistory.reduce((acc, s) => acc + s.netAmount, 0);
  let totalKasbon = slipHistory.reduce((acc, s) => acc + s.kasbonAmount, 0);

  document.getElementById('kpiTotalPaid').innerText = formatRupiah(totalPaid);
  document.getElementById('kpiSlipCount').innerText = `${slipHistory.length} slip dicetak`;
  document.getElementById('kpiTotalKasbon').innerText = formatRupiah(totalKasbon);
  document.getElementById('kpiActiveWorkers').innerText = workersDb.filter(w => w.status === 'Aktif').length;

  // Realization vs COA Budget Table
  const tbody = document.getElementById('coaRealizationTbody');
  tbody.innerHTML = '';

  COA_ACCOUNTS.forEach(coa => {
    // Total from history for this COA
    let currentHistoryPaid = slipHistory
      .filter(s => s.coaCode === coa.code)
      .reduce((acc, s) => acc + s.grossAmount, 0);

    let totalRealization = coa.initialRealization + currentHistoryPaid;
    let pct = coa.budget > 0 ? Math.min(100, Math.round((totalRealization / coa.budget) * 100)) : 0;

    let badgeClass = pct >= 90 ? 'badge-red' : (pct >= 70 ? 'badge-amber' : 'badge-green');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${coa.code}</strong></td>
      <td>${coa.name}</td>
      <td>${coa.budget > 0 ? formatRupiah(coa.budget) : 'Unbudgeted'}</td>
      <td style="font-weight: 700; color: var(--primary);">${formatRupiah(totalRealization)}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="badge ${badgeClass}">${pct}%</span>
          <div class="progress-track" style="flex: 1;">
            <div class="progress-fill" style="width: ${pct}%; background: ${pct >= 90 ? 'var(--danger)' : 'var(--primary)'};"></div>
          </div>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ================= WORKERS TABLE =================
function renderWorkersTable() {
  const search = document.getElementById('searchWorker').value.toLowerCase();
  const regu = document.getElementById('filterWorkerRegu').value;
  const status = document.getElementById('filterWorkerStatus').value;

  const tbody = document.getElementById('workersTbody');
  tbody.innerHTML = '';

  const filtered = workersDb.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search) || w.role.toLowerCase().includes(search) || w.id.toLowerCase().includes(search);
    const matchRegu = !regu || w.regu.toLowerCase().includes(regu.toLowerCase());
    const matchStatus = !status || w.status === status;
    return matchSearch && matchRegu && matchStatus;
  });

  filtered.forEach(w => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${w.id}</strong></td>
      <td style="font-weight: 700; color: var(--text-main);">${w.name}</td>
      <td><span class="badge badge-blue">${w.role}</span></td>
      <td>${w.regu}</td>
      <td>${w.scheme}</td>
      <td>${w.rate > 0 ? formatRupiah(w.rate) : '-'}</td>
      <td><span class="badge ${w.status === 'Aktif' ? 'badge-green' : 'badge-gray'}">${w.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="quickCreateSlipForWorker('${w.id}')">Buat Slip</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function quickCreateSlipForWorker(id) {
  switchView('slip');
  document.getElementById('filterSlipRegu').value = '';
  populateWorkerSelect();
  document.getElementById('selectWorkerDb').value = id;
  onSelectWorkerFromDb();
}

function openAddWorkerModal() {
  document.getElementById('addWorkerModal').classList.add('open');
}

function closeAddWorkerModal() {
  document.getElementById('addWorkerModal').classList.remove('open');
}

function saveNewWorker() {
  const name = document.getElementById('newWorkerName').value.trim();
  if (!name) {
    showToast("⚠️ Nama Pekerja Wajib Diisi!");
    return;
  }

  const newW = {
    id: 'W' + String(workersDb.length + 1).padStart(3, '0'),
    name: name,
    role: document.getElementById('newWorkerRole').value,
    regu: document.getElementById('newWorkerRegu').value || '-',
    scheme: document.getElementById('newWorkerScheme').value,
    rate: parseFloat(document.getElementById('newWorkerRate').value) || 0,
    status: 'Aktif'
  };

  workersDb.unshift(newW);
  localStorage.setItem('koperasi_workers', JSON.stringify(workersDb));

  closeAddWorkerModal();
  initDropdowns();
  renderWorkersTable();
  renderDashboard();
  showToast(`✅ Pekerja ${name} berhasil ditambahkan!`);
}

// ================= HISTORY TABLE =================
function renderHistoryTable() {
  const search = document.getElementById('searchHistory').value.toLowerCase();
  const coa = document.getElementById('filterHistoryCoa').value;

  const tbody = document.getElementById('historyTbody');
  tbody.innerHTML = '';

  const filtered = slipHistory.filter(s => {
    const matchSearch = s.workerName.toLowerCase().includes(search) || s.refNo.toLowerCase().includes(search);
    const matchCoa = !coa || s.coaCode === coa;
    return matchSearch && matchCoa;
  });

  filtered.forEach((s, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${s.refNo}</strong></td>
      <td>${s.date}</td>
      <td style="font-weight: 700;">${s.workerName}</td>
      <td><span class="badge badge-gray">${s.role} (${s.regu})</span></td>
      <td><strong>${s.coaCode}</strong></td>
      <td>${formatRupiah(s.grossAmount)}</td>
      <td style="color: var(--danger);">${s.kasbonAmount > 0 ? '-' + formatRupiah(s.kasbonAmount) : '-'}</td>
      <td style="font-weight: 800; color: var(--primary);">${formatRupiah(s.netAmount)}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteHistoryRecord(${idx})">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function deleteHistoryRecord(idx) {
  if (confirm("Hapus catatan slip ini dari riwayat?")) {
    slipHistory.splice(idx, 1);
    localStorage.setItem('koperasi_history', JSON.stringify(slipHistory));
    renderHistoryTable();
    renderDashboard();
    showToast("Riwayat slip dihapus.");
  }
}

// ================= SYNC WITH GOOGLE SHEETS =================
function syncWithGoogleSheets() {
  showToast("Memulai sinkronisasi data dari Google Sheets...");

  const docId = "1rgSWAGeef9o2D-Eru6v2dzuTm_W8MMeb86Bt_Quo6Rk";
  const t = new Date().getTime();
  const urlPekerja = `https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv&sheet=Database%20Pekerja&_t=${t}`;
  const urlPemetik = `https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv&sheet=Pembayaran%20Pemetik&_t=${t}`;

  function performSync() {
    let csvPekerja = "";
    let csvPemetik = "";

    if (typeof AndroidPrint !== 'undefined' && AndroidPrint.fetchUrlText) {
      csvPekerja = AndroidPrint.fetchUrlText(urlPekerja);
      csvPemetik = AndroidPrint.fetchUrlText(urlPemetik);
    }

    if (!csvPekerja || csvPekerja.trim().length === 0) {
      fetch(urlPekerja)
        .then(r => r.text())
        .then(textPekerja => {
          csvPekerja = textPekerja;
          return fetch(urlPemetik).then(r2 => r2.text());
        })
        .then(textPemetik => {
          csvPemetik = textPemetik;
          processParsedData(csvPekerja, csvPemetik);
        })
        .catch(err => {
          alert('❌ Gagal sinkronisasi: Tidak dapat mengakses data Google Sheets. Cek koneksi internet.');
        });
      return;
    }

    processParsedData(csvPekerja, csvPemetik);
  }

  function processParsedData(csvPekerja, csvPemetik) {
    let linesP = csvPekerja.split('\n');
    let newWorkers = [];

    linesP.forEach(line => {
      const fields = line.split('","').map(f => f.replace(/^"|"$/g, '').trim());
      if (fields.length >= 8) {
        const no = fields[1];
        const name = fields[2];
        const category = fields[3];
        const regu = fields[4];
        const schema = fields[5];
        const status = fields[7];

        if (/^\d+$/.test(no) && name && isNaN(name)) {
          let defaultRate = 7000;
          if (category.includes('Pengawas Lapangan') || category.includes('Koperasi')) defaultRate = 150000;
          else if (category.includes('Penjemur')) defaultRate = 125000;
          else if (category.includes('Pengawas Cudai') || category.includes('Malam')) defaultRate = 75000;
          else if (category.includes('Borongan Cudai')) defaultRate = 1500;

          newWorkers.push({
            id: "W" + String(no).padStart(3, '0'),
            name: name,
            role: category || "Borongan Pemetik",
            regu: regu || "-",
            scheme: schema || "Borongan",
            rate: defaultRate,
            status: status || "Aktif"
          });
        }
      }
    });

    if (csvPemetik && csvPemetik.trim().length > 0) {
      let linesM = csvPemetik.split('\n');
      linesM.forEach(line => {
        const fields = line.split('","').map(f => f.replace(/^"|"$/g, '').trim());
        if (fields.length >= 8) {
          const no = fields[1];
          const name = fields[2];

          let p2Kg = fields.length >= 9 ? (parseFloat(fields[8]) || 0) : 0;
          let p1Kg = parseFloat(fields[4]) || 0;
          let activeKg = p2Kg > 0 ? p2Kg : p1Kg;

          if (/^\d+$/.test(no) && name && activeKg > 0) {
            let matchWorker = newWorkers.find(w => w.name.toLowerCase() === name.toLowerCase());
            if (matchWorker) {
              matchWorker.lastKg = activeKg;
            }
          }
        }
      });
    }

    if (newWorkers.length > 0) {
      workersDb = newWorkers;
      localStorage.setItem('koperasi_workers', JSON.stringify(workersDb));
    }

    // Refresh UI
    initDropdowns();
    populateWorkerSelect();
    renderWorkersTable();
    renderDashboard();

    alert(`✅ Sinkronisasi Google Sheets Berhasil!\n\n• ${workersDb.length} Pekerja Aktif Ter-update langsung dari Google Sheets!`);
  }

  setTimeout(performSync, 100);
}

// Bluetooth Printer Modal Functions
function openBluetoothModal() {
  document.getElementById('btModal').style.display = 'flex';
  loadBtDevices();
}

function closeBluetoothModal() {
  document.getElementById('btModal').style.display = 'none';
}

function loadBtDevices() {
  const select = document.getElementById('btDeviceSelect');
  const status = document.getElementById('btStatus');
  select.innerHTML = '<option value="">-- Pilih Perangkat Bluetooth --</option>';

  if (typeof AndroidPrint !== 'undefined' && AndroidPrint.getPairedBluetoothDevices) {
    try {
      const devices = JSON.parse(AndroidPrint.getPairedBluetoothDevices());
      if (devices.length === 0) {
        status.innerText = 'Belum ada printer Bluetooth terpasang. Pair terlebih dahulu di HP.';
        status.style.color = 'var(--danger)';
      } else {
        devices.forEach(d => {
          select.add(new Option(`${d.name} (${d.address})`, d.address));
        });
        status.innerText = `Ditemukan ${devices.length} printer terpasang.`;
        status.style.color = 'var(--primary)';
      }
    } catch (e) {
      status.innerText = 'Gagal memuat list Bluetooth: ' + e.message;
    }
  } else {
    status.innerText = 'Fitur Bluetooth aktif di aplikasi HP Android.';
  }
}

function connectBtDevice() {
  const addr = document.getElementById('btDeviceSelect').value;
  if (!addr) {
    showToast("⚠️ Pilih perangkat printer!");
    return;
  }
  if (typeof AndroidPrint !== 'undefined' && AndroidPrint.connectBluetoothDevice) {
    document.getElementById('btStatus').innerText = "Menghubungkan ke printer...";
    AndroidPrint.connectBluetoothDevice(addr);
  }
}

function disconnectBtDevice() {
  if (typeof AndroidPrint !== 'undefined' && AndroidPrint.disconnectBluetooth) {
    AndroidPrint.disconnectBluetooth();
    onBtDisconnected("Terputus");
  }
}

function onBtConnected(devName) {
  document.getElementById('btStatus').innerText = 'Terhubung ke ' + (devName || 'Printer');
  document.getElementById('btStatus').style.color = 'var(--primary)';
  document.getElementById('directBtBtnBox').style.display = 'block';
}

function onBtDisconnected(msg) {
  document.getElementById('btStatus').innerText = 'Terputus: ' + (msg || '');
  document.getElementById('btStatus').style.color = 'var(--danger)';
  document.getElementById('directBtBtnBox').style.display = 'none';
}
