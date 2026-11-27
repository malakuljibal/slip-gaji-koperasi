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
  REGU_LIST.forEach(r => {
    reguFilterSlip.add(new Option(r, r));
    reguFilterDb.add(new Option(r, r));
  });

  const coaSelect = document.getElementById('coaSelect');
  const coaFilterHistory = document.getElementById('filterHistoryCoa');
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
    .filter(w => w.status === 'Aktif' && (!regu || w.regu === regu))
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
}

function applySmartCalc() {
  const mode = document.getElementById('calcMode').value;
  let desc = "";
  let amount = 0;

  if (mode === 'borongan_kg') {
    const qty = parseFloat(document.getElementById('calcQtyKg').value) || 0;
    const rate = parseFloat(document.getElementById('calcRateKg').value) || 0;
    amount = Math.round(qty * rate);
    const coaCode = document.getElementById('coaSelect').value;
    const label = coaCode === '403' ? 'Borongan Cudai' : 'Borongan Petik';
    desc = `${label} (${qty} kg x ${rate.toLocaleString('id-ID')})`;
  } else if (mode === 'harian_hok') {
    const hok = parseFloat(document.getElementById('calcQtyHok').value) || 0;
    const rate = parseFloat(document.getElementById('calcRateHok').value) || 0;
    amount = Math.round(hok * rate);
    desc = `Upah Harian (${hok} HOK x ${rate.toLocaleString('id-ID')})`;
  } else if (mode === 'borongan_lahan') {
    const info = document.getElementById('calcLahanInfo').value || 'Borongan Lahan';
    amount = parseFloat(document.getElementById('calcRateLahan').value) || 0;
    desc = `Pemarasan (${info})`;
  }

  if (incomeItems.length === 0) {
    incomeItems.push({ desc, amount });
  } else {
    incomeItems[0].desc = desc;
    incomeItems[0].amount = amount;
  }

  renderItemsInput();
  updateReceipt();
}

// ================= INCOME & DEDUCTION ITEMS =================
function renderItemsInput() {
  const incEl = document.getElementById('incomeItemsContainer');
  incEl.innerHTML = '';
  incomeItems.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <input type="text" placeholder="Deskripsi pendapatan" value="${item.desc}" oninput="incomeItems[${idx}].desc = this.value; updateReceipt();">
      <input type="number" placeholder="Nominal" value="${item.amount}" oninput="incomeItems[${idx}].amount = parseFloat(this.value) || 0; updateReceipt();">
      <button class="btn btn-danger" onclick="incomeItems.splice(${idx}, 1); renderItemsInput(); updateReceipt();" title="Hapus">✕</button>
    `;
    incEl.appendChild(row);
  });

  const dedEl = document.getElementById('deductionItemsContainer');
  dedEl.innerHTML = '';
  deductionItems.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <input type="text" placeholder="Deskripsi potongan / kasbon" value="${item.desc}" oninput="deductionItems[${idx}].desc = this.value; updateReceipt();">
      <input type="number" placeholder="Nominal" value="${item.amount}" oninput="deductionItems[${idx}].amount = parseFloat(this.value) || 0; updateReceipt();">
      <button class="btn btn-danger" onclick="deductionItems.splice(${idx}, 1); renderItemsInput(); updateReceipt();" title="Hapus">✕</button>
    `;
    dedEl.appendChild(row);
  });
}

function addIncomeItem() {
  incomeItems.push({ desc: "Tambahan / Bonus", amount: 0 });
  renderItemsInput();
  updateReceipt();
}

function addDeductionItem() {
  deductionItems.push({ desc: "Kasbon / Potongan", amount: 0 });
  renderItemsInput();
  updateReceipt();
}

// ================= RECEIPT PREVIEW =================
function updateReceipt() {
  document.getElementById('prevBusinessName').innerText = appSettings.businessName;
  document.getElementById('prevBusinessUnit').innerText = appSettings.businessUnit;
  document.getElementById('prevBusinessAddress').innerText = appSettings.businessAddress;

  document.getElementById('prevRefNo').innerText = document.getElementById('refNo').value || '-';

  const dateVal = document.getElementById('payDate').value;
  if (dateVal) {
    const [y, m, d] = dateVal.split('-');
    document.getElementById('prevDate').innerText = `${d}/${m}/${y}`;
  } else {
    document.getElementById('prevDate').innerText = '-';
  }

  const coaCode = document.getElementById('coaSelect').value;
  const coaObj = COA_ACCOUNTS.find(c => c.code === coaCode);
  document.getElementById('prevCoa').innerText = coaObj ? `${coaObj.code} - ${coaObj.name.replace('Beban ', '')}` : coaCode;

  const worker = document.getElementById('workerName').value || 'Pekerja';
  const role = document.getElementById('workerRole').value || '';
  const regu = document.getElementById('workerRegu').value || '';

  document.getElementById('prevWorker').innerText = worker;
  document.getElementById('prevRoleRegu').innerText = [regu, role].filter(Boolean).join(' / ');
  document.getElementById('prevPeriod').innerText = document.getElementById('periodText').value || '-';

  document.getElementById('prevSignWorker').innerText = `( ${worker.split(' ').slice(0, 2).join(' ')} )`;
  const pic = document.getElementById('picName').value || appSettings.picName;
  document.getElementById('prevSignPic').innerText = `( ${pic} )`;
  document.getElementById('prevPaymentMethod').innerText = document.getElementById('paymentMethod').value;
  document.getElementById('prevNote').innerText = document.getElementById('noteText').value;

  let totalIncome = 0;
  const incTable = document.getElementById('prevIncomeTable');
  incTable.innerHTML = '';
  incomeItems.forEach(item => {
    totalIncome += (item.amount || 0);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="col-item">${item.desc || 'Item'}</td><td class="col-val">${formatRupiah(item.amount)}</td>`;
    incTable.appendChild(tr);
  });

  let totalDeduction = 0;
  const dedSec = document.getElementById('prevDeductionSection');
  const dedTable = document.getElementById('prevDeductionTable');
  dedTable.innerHTML = '';

  const activeDeductions = deductionItems.filter(d => d.amount > 0 || d.desc.trim() !== '');
  if (activeDeductions.length > 0 && activeDeductions.some(d => d.amount > 0)) {
    dedSec.style.display = 'block';
    activeDeductions.forEach(item => {
      if (item.amount > 0) {
        totalDeduction += item.amount;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="col-item">${item.desc || 'Potongan'}</td><td class="col-val">-${formatRupiah(item.amount)}</td>`;
        dedTable.appendChild(tr);
      }
    });
  } else {
    dedSec.style.display = 'none';
  }

  const grandTotal = totalIncome - totalDeduction;
  document.getElementById('prevTotal').innerText = formatRupiah(grandTotal);
  return { totalIncome, totalDeduction, grandTotal };
}

function resetSlipForm(notify = true) {
  document.getElementById('payDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('refNo').value = generateRefNo();
  document.getElementById('picName').value = appSettings.picName;
  document.getElementById('noteText').value = appSettings.footerNote;
  document.getElementById('calcQtyKg').value = '';
  document.getElementById('calcQtyHok').value = '';
  document.getElementById('calcRateLahan').value = '';
  incomeItems = [{ desc: "Upah Kerja", amount: 0 }];
  deductionItems = [{ desc: "Kasbon", amount: 0 }];
  renderItemsInput();
  updateReceipt();
  if (notify) showToast("Form slip direset untuk transaksi baru.");
}

// ================= SAVE, PRINT & SHARE =================
function saveAndPrintSlip() {
  const { totalIncome, totalDeduction, grandTotal } = updateReceipt();
  if (totalIncome <= 0) {
    showToast("⚠️ Masukkan nominal pendapatan terlebih dahulu!");
    return;
  }

  const qtyKg = document.getElementById('calcMode').value === 'borongan_kg'
    ? (parseFloat(document.getElementById('calcQtyKg').value) || 0)
    : 0;

  const tx = {
    id: Date.now(),
    refNo: document.getElementById('refNo').value || generateRefNo(),
    date: document.getElementById('payDate').value,
    workerName: document.getElementById('workerName').value,
    workerRole: document.getElementById('workerRole').value,
    workerRegu: document.getElementById('workerRegu').value,
    coaCode: document.getElementById('coaSelect').value,
    period: document.getElementById('periodText').value,
    paymentMethod: document.getElementById('paymentMethod').value,
    picName: document.getElementById('picName').value,
    note: document.getElementById('noteText').value,
    qtyKg,
    incomeItems: JSON.parse(JSON.stringify(incomeItems)),
    deductionItems: JSON.parse(JSON.stringify(deductionItems)),
    totalIncome,
    totalDeduction,
    grandTotal
  };

  slipHistory.unshift(tx);
  localStorage.setItem('koperasi_history', JSON.stringify(slipHistory));
  renderDashboard();
  renderHistoryTable();
  showToast("✅ Slip disimpan ke riwayat & membuka dialog cetak...");

  setTimeout(() => {
    window.print();
    document.getElementById('refNo').value = generateRefNo();
    updateReceipt();
  }, 300);
}

function shareSlipWhatsApp() {
  const { totalIncome, totalDeduction, grandTotal } = updateReceipt();
  const lines = [
    `*${appSettings.businessName}*`,
    `No. Bukti: ${document.getElementById('refNo').value}`,
    `Tanggal: ${document.getElementById('payDate').value}`,
    `Pekerja: *${document.getElementById('workerName').value}* (${document.getElementById('workerRegu').value})`,
    `Periode: ${document.getElementById('periodText').value}`,
    `------------------------`,
    `*Rincian Pendapatan:*`,
    ...incomeItems.map(i => `- ${i.desc}: ${formatRupiah(i.amount)}`),
  ];

  if (totalDeduction > 0) {
    lines.push(`*Potongan / Kasbon:*`);
    deductionItems.filter(d => d.amount > 0).forEach(d => {
      lines.push(`- ${d.desc}: -${formatRupiah(d.amount)}`);
    });
  }

  lines.push(`------------------------`);
  lines.push(`*TOTAL DITERIMA: ${formatRupiah(grandTotal)}*`);
  lines.push(`Metode: ${document.getElementById('paymentMethod').value}`);

  const text = lines.join('\n');
  if (navigator.share) {
    navigator.share({ title: 'Slip Pembayaran Koperasi', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      showToast("📋 Teks slip disalin! Siap ditempel di WhatsApp.");
    });
  }
}

// ================= DASHBOARD =================
function renderDashboard() {
  const totalPaid = slipHistory.reduce((s, t) => s + (t.grandTotal || 0), 0);
  const totalKasbon = slipHistory.reduce((s, t) => s + (t.totalDeduction || 0), 0);
  const totalKg = slipHistory.reduce((s, t) => s + (t.qtyKg || 0), 0);
  const activeWorkers = workersDb.filter(w => w.status === 'Aktif').length;

  document.getElementById('kpiTotalPaid').innerText = formatRupiah(totalPaid);
  document.getElementById('kpiSlipCount').innerText = `${slipHistory.length} slip tercetak di perangkat`;
  document.getElementById('kpiTotalKasbon').innerText = formatRupiah(totalKasbon);
  document.getElementById('kpiTotalKg').innerText = `${totalKg.toLocaleString('id-ID')} kg`;
  document.getElementById('kpiActiveWorkers').innerText = activeWorkers;

  // COA Budget Table
  const tbody = document.getElementById('coaBudgetTableBody');
  tbody.innerHTML = '';
  COA_ACCOUNTS.forEach(coa => {
    const appRealization = slipHistory
      .filter(t => t.coaCode === coa.code)
      .reduce((s, t) => s + (t.totalIncome || 0), 0);
    const totalReal = coa.initialRealization + appRealization;
    const sisa = coa.budget - totalReal;
    const pct = coa.budget > 0 ? Math.min(100, Math.round((totalReal / coa.budget) * 100)) : 100;
    const color = pct >= 100 ? '#dc2626' : pct > 75 ? '#d97706' : '#059669';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="badge badge-gray">${coa.code}</span></td>
      <td><strong>${coa.name}</strong></td>
      <td>${coa.budget > 0 ? formatRupiah(coa.budget) : '-'}</td>
      <td>${formatRupiah(totalReal)}</td>
      <td style="color: ${sisa < 0 ? '#dc2626' : '#059669'}; font-weight: 600;">${coa.budget > 0 ? formatRupiah(sisa) : '-'}</td>
      <td>
        <div style="font-size: 0.72rem; font-weight: 600;">${coa.budget > 0 ? pct + '%' : 'Non-Budget'}</div>
        <div class="progress-track"><div class="progress-fill" style="width: ${pct}%; background: ${color};"></div></div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Recent TX Table
  const recentBody = document.getElementById('recentTxTableBody');
  recentBody.innerHTML = '';
  if (slipHistory.length === 0) {
    recentBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#64748b; padding:1.5rem;">Belum ada slip yang dicetak di sesi ini. Klik "+ Buat Slip Baru" untuk memulai.</td></tr>';
  } else {
    slipHistory.slice(0, 5).forEach(tx => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${tx.refNo}</strong></td>
        <td>${tx.date}</td>
        <td>${tx.workerName} <span class="badge badge-blue">${tx.workerRegu}</span></td>
        <td><span class="badge badge-gray">${tx.coaCode}</span></td>
        <td><strong>${formatRupiah(tx.grandTotal)}</strong></td>
        <td><button class="btn btn-secondary btn-sm" onclick="loadSlipFromHistory(${tx.id})">🖨️ Cetak Ulang</button></td>
      `;
      recentBody.appendChild(tr);
    });
  }
}

// ================= WORKERS DATABASE =================
function renderWorkersTable() {
  const q = document.getElementById('searchWorkerInput').value.toLowerCase();
  const regu = document.getElementById('filterWorkerRegu').value;
  const role = document.getElementById('filterWorkerRole').value;

  const filtered = workersDb.filter(w =>
    w.name.toLowerCase().includes(q) &&
    (!regu || w.regu === regu) &&
    (!role || w.role === role)
  );

  const tbody = document.getElementById('workersTableBody');
  tbody.innerHTML = '';

  filtered.forEach(w => {
    const statusBadge = w.status === 'Aktif'
      ? '<span class="badge badge-green">Aktif</span>'
      : '<span class="badge badge-red">Non-Aktif</span>';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${w.id}</td>
      <td><strong>${w.name}</strong></td>
      <td>${w.role}</td>
      <td><span class="badge badge-blue">${w.regu || '-'}</span></td>
      <td>${w.scheme}</td>
      <td>${w.rate > 0 ? formatRupiah(w.rate) : 'Borongan'}</td>
      <td>${statusBadge}</td>
      <td>
        <div style="display: flex; gap: 0.35rem;">
          <button class="btn btn-primary btn-sm" onclick="createSlipForWorker('${w.id}')">🧾 Buat Slip</button>
          <button class="btn btn-secondary btn-sm" onclick="toggleWorkerStatus('${w.id}')">⇄ Status</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function createSlipForWorker(workerId) {
  switchView('slip');
  document.getElementById('filterSlipRegu').value = '';
  populateWorkerSelect();
  document.getElementById('selectWorkerDb').value = workerId;
  onSelectWorkerFromDb();
}

function toggleWorkerStatus(workerId) {
  const w = workersDb.find(item => item.id === workerId);
  if (!w) return;
  w.status = w.status === 'Aktif' ? 'Non-Aktif' : 'Aktif';
  localStorage.setItem('koperasi_workers', JSON.stringify(workersDb));
  renderWorkersTable();
  populateWorkerSelect();
  showToast(`Status ${w.name} diubah menjadi ${w.status}`);
}

function openWorkerModal() {
  document.getElementById('workerModal').classList.add('open');
}

function closeWorkerModal() {
  document.getElementById('workerModal').classList.remove('open');
}

function saveNewWorker() {
  const name = document.getElementById('modalWorkerName').value.trim();
  if (!name) {
    showToast("⚠️ Nama pekerja wajib diisi!");
    return;
  }
  const newWorker = {
    id: 'W' + String(workersDb.length + 1).padStart(3, '0'),
    name,
    role: document.getElementById('modalWorkerRole').value,
    regu: document.getElementById('modalWorkerRegu').value.trim() || 'Umum',
    scheme: document.getElementById('modalWorkerScheme').value,
    rate: parseFloat(document.getElementById('modalWorkerRate').value) || 0,
    status: 'Aktif'
  };
  workersDb.unshift(newWorker);
  localStorage.setItem('koperasi_workers', JSON.stringify(workersDb));
  closeWorkerModal();
  document.getElementById('modalWorkerName').value = '';
  renderWorkersTable();
  populateWorkerSelect();
  showToast(`✅ Pekerja "${name}" berhasil ditambahkan!`);
}

// ================= HISTORY & EXPORT =================
function renderHistoryTable() {
  const q = document.getElementById('searchHistoryInput').value.toLowerCase();
  const coa = document.getElementById('filterHistoryCoa').value;

  const filtered = slipHistory.filter(t =>
    (t.refNo.toLowerCase().includes(q) || t.workerName.toLowerCase().includes(q)) &&
    (!coa || t.coaCode === coa)
  );

  const tbody = document.getElementById('historyTableBody');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#64748b; padding:1.5rem;">Belum ada data riwayat transaksi.</td></tr>';
    return;
  }

  filtered.forEach(tx => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${tx.refNo}</strong></td>
      <td>${tx.date}</td>
      <td>${tx.workerName}</td>
      <td><span class="badge badge-blue">${tx.workerRegu}</span></td>
      <td><span class="badge badge-gray">${tx.coaCode}</span></td>
      <td>${formatRupiah(tx.totalIncome)}</td>
      <td style="color:#dc2626;">-${formatRupiah(tx.totalDeduction)}</td>
      <td><strong>${formatRupiah(tx.grandTotal)}</strong></td>
      <td>
        <div style="display:flex; gap:0.35rem;">
          <button class="btn btn-secondary btn-sm" onclick="loadSlipFromHistory(${tx.id})">🖨️ Muat</button>
          <button class="btn btn-danger btn-sm" onclick="deleteHistoryItem(${tx.id})">✕</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function loadSlipFromHistory(id) {
  const tx = slipHistory.find(t => t.id === id);
  if (!tx) return;

  switchView('slip');
  document.getElementById('refNo').value = tx.refNo;
  document.getElementById('payDate').value = tx.date;
  document.getElementById('workerName').value = tx.workerName;
  document.getElementById('workerRole').value = tx.workerRole;
  document.getElementById('workerRegu').value = tx.workerRegu;
  document.getElementById('coaSelect').value = tx.coaCode;
  document.getElementById('periodText').value = tx.period;
  document.getElementById('paymentMethod').value = tx.paymentMethod;
  document.getElementById('picName').value = tx.picName;
  document.getElementById('noteText').value = tx.note;

  incomeItems = JSON.parse(JSON.stringify(tx.incomeItems));
  deductionItems = JSON.parse(JSON.stringify(tx.deductionItems));
  renderItemsInput();
  updateReceipt();
  showToast(`📄 Data slip ${tx.refNo} dimuat ke preview.`);
}

function deleteHistoryItem(id) {
  slipHistory = slipHistory.filter(t => t.id !== id);
  localStorage.setItem('koperasi_history', JSON.stringify(slipHistory));
  renderHistoryTable();
  renderDashboard();
  showToast("🗑️ Transaksi dihapus.");
}

function clearHistory() {
  if (!confirm("Yakin hapus semua riwayat slip di perangkat ini?")) return;
  slipHistory = [];
  localStorage.setItem('koperasi_history', JSON.stringify(slipHistory));
  renderHistoryTable();
  renderDashboard();
  showToast("Semua riwayat dihapus.");
}

function exportHistoryCSV() {
  if (slipHistory.length === 0) {
    showToast("⚠️ Belum ada data untuk diexport.");
    return;
  }
  const headers = ["No_Bukti", "Tanggal", "Nama_Pekerja", "Jabatan", "Regu", "Kode_COA", "Periode", "Bruto", "Potongan_Kasbon", "Total_Bersih", "Metode"];
  const rows = slipHistory.map(t => [
    t.refNo, t.date, `"${t.workerName}"`, `"${t.workerRole}"`, `"${t.workerRegu}"`,
    t.coaCode, `"${t.period}"`, t.totalIncome, t.totalDeduction, t.grandTotal, `"${t.paymentMethod}"`
  ]);
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekap_Slip_Koperasi_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  showToast("📥 File CSV berhasil didownload!");
}

// ================= SETTINGS & BACKUP =================
function loadSettingsToUI() {
  document.getElementById('setBusinessName').value = appSettings.businessName;
  document.getElementById('setBusinessUnit').value = appSettings.businessUnit;
  document.getElementById('setBusinessAddress').value = appSettings.businessAddress;
  document.getElementById('setPicName').value = appSettings.picName;
  document.getElementById('setPaperWidth').value = appSettings.paperWidth || '58mm';
  document.getElementById('setRatePemetik').value = appSettings.defaultRatePemetik;
  document.getElementById('setRatePengawas').value = appSettings.defaultRatePengawas;
  document.getElementById('setFooterNote').value = appSettings.footerNote;
}

function saveSettings() {
  appSettings.businessName = document.getElementById('setBusinessName').value || DEFAULT_SETTINGS.businessName;
  appSettings.businessUnit = document.getElementById('setBusinessUnit').value;
  appSettings.businessAddress = document.getElementById('setBusinessAddress').value;
  appSettings.picName = document.getElementById('setPicName').value;
  appSettings.paperWidth = document.getElementById('setPaperWidth').value;
  appSettings.defaultRatePemetik = parseFloat(document.getElementById('setRatePemetik').value) || 7000;
  appSettings.defaultRatePengawas = parseFloat(document.getElementById('setRatePengawas').value) || 150000;
  appSettings.footerNote = document.getElementById('setFooterNote').value;

  localStorage.setItem('koperasi_settings', JSON.stringify(appSettings));
  applyPaperWidth();
  updateReceipt();
  showToast("💾 Pengaturan berhasil disimpan!");
}

function applyPaperWidth() {
  const w = appSettings.paperWidth || '58mm';
  document.getElementById('receiptPrintArea').style.width = w;
  document.getElementById('previewWidthLabel').innerText = w;
}

function backupDataJSON() {
  const payload = { settings: appSettings, workers: workersDb, history: slipHistory };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Backup_Koperasi_ERP_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  showToast("📤 Backup JSON berhasil didownload.");
}

function restoreDataJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.settings) {
        appSettings = data.settings;
        localStorage.setItem('koperasi_settings', JSON.stringify(appSettings));
      }
      if (data.workers) {
        workersDb = data.workers;
        localStorage.setItem('koperasi_workers', JSON.stringify(workersDb));
      }
      if (data.history) {
        slipHistory = data.history;
        localStorage.setItem('koperasi_history', JSON.stringify(slipHistory));
      }
      loadSettingsToUI();
      renderDashboard();
      renderWorkersTable();
      renderHistoryTable();
      updateReceipt();
      showToast("✅ Data berhasil direstore!");
    } catch {
      showToast("❌ File JSON tidak valid!");
    }
  };
  reader.readAsText(file);
}
