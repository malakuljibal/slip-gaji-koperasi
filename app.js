// ================= NAVIGATION (MUST BE DEFINED FIRST) =================
const VIEW_META = {
  dashboard: { title: "Dashboard Koperasi", sub: "Ringkasan Anggaran, Realisasi Beban & Operasional" },
  slip: { title: "Buat & Cetak Slip Thermal", sub: "Format Kertas Roll 57x30 / 58mm Fleksibel" },
  workers: { title: "Database Pekerja & Regu", sub: "98+ Pekerja Aktif (Pemetik, Pengawas, Penjemur, Pemarasan)" },
  history: { title: "Riwayat & Rekap Pembayaran", sub: "Arsip Slip Tercetak & Export Excel/CSV" },
  settings: { title: "Pengaturan Sistem & Printer", sub: "Identitas Koperasi, Tarif Default & Backup Data" }
};

function switchView(viewName) {
  try {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(el => {
      el.classList.remove('active');
      el.style.setProperty('display', 'none', 'important');
    });

    const targetView = document.getElementById('view-' + viewName);
    if (targetView) {
      targetView.classList.add('active');
      targetView.style.setProperty('display', 'block', 'important');
    }

    document.querySelectorAll('.nav-item, .mobile-nav-btn').forEach(btn => {
      const v = btn.getAttribute('data-view');
      if (v === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (VIEW_META[viewName]) {
      const tEl = document.getElementById('topbarTitle');
      const sEl = document.getElementById('topbarSubtitle');
      if (tEl) tEl.innerText = VIEW_META[viewName].title;
      if (sEl) sEl.innerText = VIEW_META[viewName].sub;
    }

    if (viewName === 'dashboard') renderDashboard();
    if (viewName === 'workers') renderWorkersTable();
    if (viewName === 'history') renderHistoryTable();

    window.scrollTo(0, 0);
  } catch (e) {
    console.error("switchView error:", e);
  }
}
window.switchView = switchView;

// State Management Fallbacks
const FALLBACK_SETTINGS = {
  businessName: "KOPERASI PERKEBUNAN CENGKEH",
  businessUnit: "Unit Produksi & Pengolahan Hasil (Akad Salam)",
  businessAddress: "Sulawesi Utara | Telp/WA: 0812-3456-7890",
  picName: "Pengurus Koperasi",
  defaultRatePemetik: 7000,
  defaultRateCudai: 1500,
  defaultRatePengawas: 150000,
  defaultRatePengawas2: 125000,
  paperWidth: "58mm",
  fontSize: 11,
  footerNote: "Terima kasih atas kerja keras Anda. Simpan slip ini sebagai bukti sah."
};

let savedSettings = null;
try { savedSettings = JSON.parse(localStorage.getItem('koperasi_settings')); } catch(e){}
let appSettings = savedSettings || (typeof DEFAULT_SETTINGS !== 'undefined' ? { ...DEFAULT_SETTINGS } : FALLBACK_SETTINGS);

let savedWorkers = null;
try { savedWorkers = JSON.parse(localStorage.getItem('koperasi_workers')); } catch(e){}
let workersDb = (Array.isArray(savedWorkers) && savedWorkers.length > 0) ? savedWorkers : (typeof INITIAL_WORKERS !== 'undefined' ? [...INITIAL_WORKERS] : []);

let savedHistory = null;
try { savedHistory = JSON.parse(localStorage.getItem('koperasi_history')); } catch(e){}
let slipHistory = Array.isArray(savedHistory) ? savedHistory : [];

let incomeItems = [
  { desc: "Upah Pemetik (0 kg x Rp 7.000)", amount: 0 }
];
let deductionItems = [
  { desc: "Kasbon / Pinjaman", amount: 0 }
];

// Helper safe DOM getter
function getVal(id, fallback = "") {
  const el = document.getElementById(id);
  return el ? (el.value || fallback) : fallback;
}

// Initialization
function initApp() {
  // Ensure workersDb is never empty
  if (!Array.isArray(workersDb) || workersDb.length === 0) {
    if (typeof INITIAL_WORKERS !== 'undefined') {
      workersDb = [...INITIAL_WORKERS];
      localStorage.setItem('koperasi_workers', JSON.stringify(workersDb));
    }
  }

  initDropdowns();
  loadSettingsToUI();
  resetSlipForm(false);
  renderDashboard();
  renderWorkersTable();
  renderHistoryTable();
  applyPaperWidth();

  // Explicit event listener binding for all navigation buttons
  document.querySelectorAll('.nav-item, .mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = btn.getAttribute('data-view') || btn.dataset.view;
      if (view) {
        switchView(view);
      }
    });
  });

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW:', err));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Document-level event delegation for navigation (catches all touch/clicks on mobile)
document.addEventListener('click', (e) => {
  const navBtn = e.target.closest('[data-view]');
  if (navBtn) {
    const view = navBtn.getAttribute('data-view');
    if (view) {
      switchView(view);
    }
  }
});

function formatRupiah(num) {
  return "Rp " + Math.round(Number(num || 0)).toLocaleString("id-ID");
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }
}

function generateRefNo() {
  const d = new Date();
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, '');
  const seq = String(slipHistory.length + 1).padStart(3, '0');
  return `KOP-${ymd}-${seq}`;
}

const FALLBACK_REGU = [
  "PGWS", "Sabua Miring", "Sabua Miring 1", "Sabua Miring 2", "Sabua Miring 3",
  "Sabua Miring 4", "LGKP", "Due 1", "Due 2", "Kaki Seribu 1", "Kaki Seribu 2",
  "Pengawas Lapangan", "Pengawas Cudai", "Penjemur", "Pengawas Malam", "Regu Pemarasan"
];

const FALLBACK_COA = [
  { code: "402", name: "Beban Upah Pemetik", mode: "borongan_kg", defaultRate: 7000, budget: 780000000, initialRealization: 85604650 },
  { code: "403", name: "Beban Upah Pembersihan (Cudai)", mode: "borongan_kg", defaultRate: 1500, budget: 180000000, initialRealization: 9370146 },
  { code: "404", name: "Beban Upah Pengawas", mode: "harian_hok", defaultRate: 150000, budget: 175000000, initialRealization: 128082000 },
  { code: "405", name: "Beban Upah Penjemur & Packing", mode: "harian_hok", defaultRate: 125000, budget: 60000000, initialRealization: 7500000 },
  { code: "407", name: "Beban Perawatan Lahan (Pemarasan)", mode: "borongan_lahan", defaultRate: 0, budget: 180000000, initialRealization: 210005500 },
  { code: "409", name: "Beban Langsung Lain-lain", mode: "custom", defaultRate: 0, budget: 0, initialRealization: 155026165 },
  { code: "410", name: "Beban Bagi Hasil Masyarakat", mode: "custom", defaultRate: 0, budget: 375000000, initialRealization: 375000000 }
];

// ================= DROPDOWNS =================
function initDropdowns() {
  const reguFilterSlip = document.getElementById('filterSlipRegu');
  const reguFilterDb = document.getElementById('filterWorkerRegu');
  if (reguFilterSlip) reguFilterSlip.innerHTML = '<option value="">-- Semua Regu / Petak --</option>';
  if (reguFilterDb) reguFilterDb.innerHTML = '<option value="">-- Semua Regu / Petak --</option>';

  const rList = typeof REGU_LIST !== 'undefined' ? REGU_LIST : FALLBACK_REGU;
  const reguSet = new Set(rList);
  workersDb.forEach(w => {
    if (w && w.regu && w.regu !== '-' && w.regu.trim() !== '') {
      reguSet.add(w.regu.trim());
    }
  });

  Array.from(reguSet).sort().forEach(r => {
    if (reguFilterSlip) reguFilterSlip.add(new Option(r, r));
    if (reguFilterDb) reguFilterDb.add(new Option(r, r));
  });

  const coaSelect = document.getElementById('coaSelect');
  const coaFilterHistory = document.getElementById('filterHistoryCoa');
  if (coaSelect) coaSelect.innerHTML = '';
  if (coaFilterHistory) coaFilterHistory.innerHTML = '<option value="">Semua Akun COA</option>';

  const cList = typeof COA_ACCOUNTS !== 'undefined' ? COA_ACCOUNTS : FALLBACK_COA;
  cList.forEach(c => {
    if (coaSelect) coaSelect.add(new Option(`${c.code} - ${c.name}`, c.code));
    if (coaFilterHistory) coaFilterHistory.add(new Option(`${c.code} - ${c.name}`, c.code));
  });

  populateWorkerSelect();
}

function populateWorkerSelect() {
  const reguFilterEl = document.getElementById('filterSlipRegu');
  const regu = reguFilterEl ? reguFilterEl.value.toLowerCase() : '';
  const select = document.getElementById('selectWorkerDb');
  if (!select) return;

  select.innerHTML = '<option value="">-- Ketik Manual / Pilih Pekerja --</option>';

  const availableWorkers = workersDb.filter(w => {
    if (!w) return false;
    if (w.status && w.status !== 'Aktif') return false;
    if (regu) return (w.regu || '').toLowerCase().includes(regu);
    return true;
  });

  availableWorkers
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .forEach(w => {
      select.add(new Option(`${w.name} (${w.role}${w.regu && w.regu !== '-' ? ' - Regu ' + w.regu : ''})`, w.id));
    });
}

function onSelectWorkerFromDb() {
  const id = getVal('selectWorkerDb');
  if (!id) return;
  const w = workersDb.find(item => item.id === id);
  if (!w) return;

  const wNameEl = document.getElementById('workerName');
  const wRoleEl = document.getElementById('workerRole');
  const wReguEl = document.getElementById('workerRegu');

  if (wNameEl) wNameEl.value = w.name;
  if (wRoleEl) wRoleEl.value = w.role;
  if (wReguEl) wReguEl.value = w.regu || '-';

  // Set Kasbon if available from Google Sheets sync
  if (w.lastKasbon && w.lastKasbon > 0) {
    deductionItems = [{ desc: "Kasbon / Pinjaman", amount: w.lastKasbon }];
  } else {
    deductionItems = [{ desc: "Kasbon / Pinjaman", amount: 0 }];
  }

  // Auto-select COA & calculator mode based on role
  const coaEl = document.getElementById('coaSelect');
  const modeEl = document.getElementById('calcMode');
  const rateKgEl = document.getElementById('calcRateKg');
  const qtyKgEl = document.getElementById('calcQtyKg');
  const rateHokEl = document.getElementById('calcRateHok');

  if (w.role.includes('Pemetik')) {
    if (coaEl) coaEl.value = '402';
    if (modeEl) modeEl.value = 'borongan_kg';
    if (rateKgEl) rateKgEl.value = w.rate || appSettings.defaultRatePemetik;
    if (qtyKgEl && w.lastKg && w.lastKg > 0) qtyKgEl.value = w.lastKg;
  } else if (w.role.includes('Pencudai') || w.role.includes('Cudai')) {
    if (coaEl) coaEl.value = '403';
    if (modeEl) modeEl.value = 'borongan_kg';
    if (rateKgEl) rateKgEl.value = w.rate || appSettings.defaultRateCudai;
    if (qtyKgEl && w.lastKg && w.lastKg > 0) qtyKgEl.value = w.lastKg;
  } else if (w.role.includes('Pengawas')) {
    if (coaEl) coaEl.value = '404';
    if (modeEl) modeEl.value = 'harian_hok';
    if (rateHokEl) rateHokEl.value = w.rate || appSettings.defaultRatePengawas;
  } else if (w.role.includes('Penjemur')) {
    if (coaEl) coaEl.value = '405';
    if (modeEl) modeEl.value = 'harian_hok';
    if (rateHokEl) rateHokEl.value = w.rate || 125000;
  } else if (w.role.includes('Pemarasan')) {
    if (coaEl) coaEl.value = '407';
    if (modeEl) modeEl.value = 'borongan_lahan';
  }

  toggleCalcMode();
  renderItemInputs();
  updateReceipt();
}

function onCoaChange() {
  const code = getVal('coaSelect');
  const cList = typeof COA_ACCOUNTS !== 'undefined' ? COA_ACCOUNTS : FALLBACK_COA;
  const coa = cList.find(c => c.code === code);
  const modeEl = document.getElementById('calcMode');
  const rateKgEl = document.getElementById('calcRateKg');
  const rateHokEl = document.getElementById('calcRateHok');

  if (coa && coa.mode !== 'custom') {
    if (modeEl) modeEl.value = coa.mode;
    if (coa.mode === 'borongan_kg' && coa.defaultRate && rateKgEl) {
      rateKgEl.value = coa.defaultRate;
    } else if (coa.mode === 'harian_hok' && coa.defaultRate && rateHokEl) {
      rateHokEl.value = coa.defaultRate;
    }
    toggleCalcMode();
  }
  updateReceipt();
}

// ================= SMART CALCULATOR =================
function toggleCalcMode() {
  const mode = getVal('calcMode');
  const kgBox = document.getElementById('calcInputsKg');
  const hokBox = document.getElementById('calcInputsHok');
  const lahanBox = document.getElementById('calcInputsLahan');

  if (kgBox) kgBox.style.display = mode === 'borongan_kg' ? 'grid' : 'none';
  if (hokBox) hokBox.style.display = mode === 'harian_hok' ? 'grid' : 'none';
  if (lahanBox) lahanBox.style.display = mode === 'borongan_lahan' ? 'grid' : 'none';

  applyCalculatedIncome();
}

function applyCalculatedIncome() {
  const mode = getVal('calcMode');
  const role = getVal('workerRole', 'Pekerja');

  if (mode === 'borongan_kg') {
    const kg = parseFloat(getVal('calcQtyKg', '0')) || 0;
    const rate = parseFloat(getVal('calcRateKg', '7000')) || 7000;
    const total = kg * rate;
    incomeItems[0] = { desc: `Hasil ${role} (${kg} kg x ${formatRupiah(rate)})`, amount: total };
  } else if (mode === 'harian_hok') {
    const days = parseFloat(getVal('calcQtyHok', getVal('calcDaysHok', '0'))) || 0;
    const rate = parseFloat(getVal('calcRateHok', '150000')) || 150000;
    const total = days * rate;
    incomeItems[0] = { desc: `Gaji ${role} (${days} hari x ${formatRupiah(rate)})`, amount: total };
  } else if (mode === 'borongan_lahan') {
    const luas = getVal('calcLahanInfo', getVal('calcLuasLahan', ''));
    const rate = parseFloat(getVal('calcRateLahan', '0')) || 0;
    incomeItems[0] = { desc: `Upah Pemarasan (${luas || 'Borongan Lahan'})`, amount: rate };
  }

  renderItemInputs();
  updateReceipt();
}

const applySmartCalc = applyCalculatedIncome;

// ================= DYNAMIC ITEMS EDITOR =================
function renderItemInputs() {
  const incBox = document.getElementById('incomeItemsContainer') || document.getElementById('incomeItemsBox');
  if (incBox) {
    incBox.innerHTML = '';
    incomeItems.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'item-row';
      div.innerHTML = `
        <input type="text" value="${item.desc}" oninput="incomeItems[${idx}].desc=this.value; updateReceipt();" placeholder="Deskripsi Pendapatan" style="flex: 2;">
        <input type="number" value="${item.amount}" oninput="incomeItems[${idx}].amount=parseFloat(this.value)||0; updateReceipt();" placeholder="Nominal" style="flex: 1.2;">
        <button class="btn btn-danger btn-sm" onclick="removeIncomeItem(${idx})">✕</button>
      `;
      incBox.appendChild(div);
    });
  }

  const dedBox = document.getElementById('deductionItemsContainer') || document.getElementById('deductionItemsBox');
  if (dedBox) {
    dedBox.innerHTML = '';
    deductionItems.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'item-row';
      div.innerHTML = `
        <input type="text" value="${item.desc}" oninput="deductionItems[${idx}].desc=this.value; updateReceipt();" placeholder="Deskripsi Potongan" style="flex: 2;">
        <input type="number" value="${item.amount}" oninput="deductionItems[${idx}].amount=parseFloat(this.value)||0; updateReceipt();" placeholder="Nominal" style="flex: 1.2;">
        <button class="btn btn-danger btn-sm" onclick="removeDeductionItem(${idx})">✕</button>
      `;
      dedBox.appendChild(div);
    });
  }
}

function addIncomeRow() {
  incomeItems.push({ desc: "Bonus / Tambahan Gaji", amount: 0 });
  renderItemInputs();
  updateReceipt();
}
const addIncomeItem = addIncomeRow;

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
const addDeductionItem = addDeductionRow;

function removeDeductionItem(idx) {
  deductionItems.splice(idx, 1);
  renderItemInputs();
  updateReceipt();
}

// ================= LIVE RECEIPT UPDATE =================
function updateReceipt() {
  const bizName = getVal('setBusinessName', appSettings.businessName);
  const bizUnit = getVal('setBusinessUnit', appSettings.businessUnit);
  const bizAddr = getVal('setBusinessAddress', appSettings.businessAddress);

  if (document.getElementById('prevBusinessName')) document.getElementById('prevBusinessName').innerText = bizName;
  if (document.getElementById('prevBusinessUnit')) document.getElementById('prevBusinessUnit').innerText = bizUnit;
  if (document.getElementById('prevBusinessAddress')) document.getElementById('prevBusinessAddress').innerText = bizAddr;

  const refNo = getVal('refNo');
  if (document.getElementById('prevRefNo')) document.getElementById('prevRefNo').innerText = refNo;

  const payDate = getVal('payDate');
  if (payDate && document.getElementById('prevDate')) {
    const p = payDate.split('-');
    if (p.length === 3) document.getElementById('prevDate').innerText = `${p[2]}/${p[1]}/${p[0]}`;
  }

  const worker = getVal('workerName', 'Nama Pekerja');
  if (document.getElementById('prevWorker')) document.getElementById('prevWorker').innerText = worker;
  if (document.getElementById('prevSignWorker')) document.getElementById('prevSignWorker').innerText = `(${worker.length > 14 ? worker.substring(0, 14) + '.' : worker})`;

  const role = getVal('workerRole', '-');
  const regu = getVal('workerRegu', '-');
  const period = getVal('periodText', '-');
  const coa = getVal('coaSelect', '-');

  if (document.getElementById('prevRoleRegu')) document.getElementById('prevRoleRegu').innerText = `${regu} / ${role}`;
  if (document.getElementById('prevPeriod')) document.getElementById('prevPeriod').innerText = period;
  if (document.getElementById('prevCoa')) document.getElementById('prevCoa').innerText = coa;

  const pic = getVal('picName', appSettings.picName);
  if (document.getElementById('prevSignPic')) document.getElementById('prevSignPic').innerText = `(${pic})`;

  // Render Income Table
  let totInc = 0;
  const incTbody = document.getElementById('prevIncomeTbody') || document.getElementById('prevIncomeTable');
  if (incTbody) {
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
  }

  // Render Deduction Table
  let totDed = 0;
  const dedBox = document.getElementById('prevDeductionBox') || document.getElementById('prevDeductionSection');
  const dedTbody = document.getElementById('prevDeductionTbody') || document.getElementById('prevDeductionTable');

  const activeDed = deductionItems.filter(i => Number(i.amount) > 0);
  if (dedBox && dedTbody) {
    dedTbody.innerHTML = '';
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
  }

  const netTotal = totInc - totDed;
  if (document.getElementById('prevTotal')) document.getElementById('prevTotal').innerText = formatRupiah(netTotal);
  if (document.getElementById('prevPaymentMethod')) document.getElementById('prevPaymentMethod').innerText = getVal('paymentMethod', 'Tunai / Cash');
  if (document.getElementById('prevFooterNote')) document.getElementById('prevFooterNote').innerText = getVal('noteText', appSettings.footerNote);
}

function resetSlipForm(ask = true) {
  if (ask && !confirm("Kosongkan form & buat slip baru?")) return;

  const refEl = document.getElementById('refNo');
  const payEl = document.getElementById('payDate');
  if (refEl) refEl.value = generateRefNo();
  if (payEl) payEl.value = new Date().toISOString().slice(0, 10);

  const filterRegu = document.getElementById('filterSlipRegu');
  if (filterRegu) filterRegu.value = '';
  populateWorkerSelect();

  const selectW = document.getElementById('selectWorkerDb');
  const nameW = document.getElementById('workerName');
  const roleW = document.getElementById('workerRole');
  const reguW = document.getElementById('workerRegu');
  const periodW = document.getElementById('periodText');

  if (selectW) selectW.value = '';
  if (nameW) nameW.value = '';
  if (roleW) roleW.value = 'Borongan Pemetik';
  if (reguW) reguW.value = '-';
  if (periodW) periodW.value = '24-30 Nov 2026 (Mingguan)';

  const coaEl = document.getElementById('coaSelect');
  const calcModeEl = document.getElementById('calcMode');
  const calcQtyKgEl = document.getElementById('calcQtyKg');
  const calcRateKgEl = document.getElementById('calcRateKg');

  if (coaEl) coaEl.value = '402';
  if (calcModeEl) calcModeEl.value = 'borongan_kg';
  if (calcQtyKgEl) calcQtyKgEl.value = 0;
  if (calcRateKgEl) calcRateKgEl.value = appSettings.defaultRatePemetik;

  incomeItems = [{ desc: "Upah Pemetik (0 kg x Rp 7.000)", amount: 0 }];
  deductionItems = [{ desc: "Kasbon / Pinjaman", amount: 0 }];

  toggleCalcMode();
  renderItemInputs();
  updateReceipt();
  if (ask) showToast("Form slip di-reset.");
}

// ================= SAVE & PRINT SLIP =================
function saveAndPrintSlip() {
  const workerName = getVal('workerName').trim();
  if (!workerName) {
    showToast("⚠️ Tuliskan Nama Pekerja terlebih dahulu!");
    return;
  }

  let totInc = incomeItems.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  let totDed = deductionItems.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  let netTotal = totInc - totDed;

  const record = {
    id: 'SLIP-' + Date.now(),
    refNo: getVal('refNo'),
    date: getVal('payDate'),
    workerName: workerName,
    role: getVal('workerRole'),
    regu: getVal('workerRegu'),
    coaCode: getVal('coaSelect'),
    period: getVal('periodText'),
    grossAmount: totInc,
    kasbonAmount: totDed,
    netAmount: netTotal,
    paymentMethod: getVal('paymentMethod'),
    incomeDetails: JSON.parse(JSON.stringify(incomeItems)),
    deductionDetails: JSON.parse(JSON.stringify(deductionItems))
  };

  if (!slipHistory.some(s => s.refNo === record.refNo && s.workerName === record.workerName)) {
    slipHistory.unshift(record);
    localStorage.setItem('koperasi_history', JSON.stringify(slipHistory));
    renderDashboard();
    renderHistoryTable();
  }

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

function shareSlipWhatsApp() {
  const worker = getVal('workerName', 'Pekerja');
  const total = document.getElementById('prevTotal') ? document.getElementById('prevTotal').innerText : '0';
  const ref = getVal('refNo');
  const period = getVal('periodText');

  let text = `*SLIP GAJI KOPERASI ILANTAT JAYA*\n`;
  text += `No. Bukti: ${ref}\n`;
  text += `Pekerja: ${worker}\n`;
  text += `Periode: ${period}\n`;
  text += `--------------------------\n`;
  incomeItems.forEach(item => {
    text += `• ${item.desc}: ${formatRupiah(item.amount)}\n`;
  });
  deductionItems.forEach(item => {
    if (item.amount > 0) text += `• ${item.desc}: -${formatRupiah(item.amount)}\n`;
  });
  text += `--------------------------\n`;
  text += `*TOTAL DITERIMA: ${total}*\n\n`;
  text += `Terima kasih atas kerja keras Anda.`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    showToast("📋 Slip gaji disalin ke Clipboard! Siap dicolok ke WhatsApp.");
  } else {
    showToast("📋 Slip gaji siap dikirim.");
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
  pushString((getVal('setBusinessName') || appSettings.businessName) + "\n");
  bytes.push(0x1B, 0x45, 0x00);

  pushString((getVal('setBusinessUnit') || appSettings.businessUnit) + "\n");
  pushString((getVal('setBusinessAddress') || appSettings.businessAddress) + "\n");
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

  addKeyValue("No.Bukti", getVal('refNo'));
  addKeyValue("Tanggal", getVal('payDate'));
  addKeyValue("Pekerja", getVal('workerName'));
  addKeyValue("Jabatan", getVal('workerRole'));
  addKeyValue("Periode", getVal('periodText'));
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

  addKeyValue("Metode", getVal('paymentMethod', 'Tunai / Cash'));
  pushString("------------------------------\n");

  pushString("Penerima,            Pengesah,\n\n\n");
  const worker = getVal('workerName', 'Pekerja');
  const pic = getVal('picName', appSettings.picName);
  let wSign = "(" + (worker.length > 11 ? worker.substring(0, 11) : worker) + ")";
  let pSign = "(" + (pic.length > 11 ? pic.substring(0, 11) : pic) + ")";
  let signSp = Math.max(1, 30 - (wSign.length + pSign.length));
  pushString(wSign + " ".repeat(signSp) + pSign + "\n");
  pushString("------------------------------\n");

  bytes.push(0x1B, 0x61, 0x01);
  pushString((getVal('noteText') || appSettings.footerNote) + "\n");
  pushString("--- Simpan bukti ini ---\n");

  // Fast Motor Paper Feed (ESC d 3) - No cutter delay stall
  bytes.push(0x1B, 0x64, 0x03);

  return new Uint8Array(bytes);
}

function printDirectBluetooth() {
  const workerName = getVal('workerName').trim();
  if (!workerName) {
    showToast("⚠️ Tuliskan Nama Pekerja terlebih dahulu!");
    return;
  }

  // Save record to history
  let totInc = incomeItems.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  let totDed = deductionItems.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  let netTotal = totInc - totDed;

  const record = {
    id: 'SLIP-' + Date.now(),
    refNo: getVal('refNo'),
    date: getVal('payDate'),
    workerName: workerName,
    role: getVal('workerRole'),
    regu: getVal('workerRegu'),
    coaCode: getVal('coaSelect'),
    period: getVal('periodText'),
    grossAmount: totInc,
    kasbonAmount: totDed,
    netAmount: netTotal,
    paymentMethod: getVal('paymentMethod'),
    incomeDetails: JSON.parse(JSON.stringify(incomeItems)),
    deductionDetails: JSON.parse(JSON.stringify(deductionItems))
  };

  if (!slipHistory.some(s => s.refNo === record.refNo && s.workerName === record.workerName)) {
    slipHistory.unshift(record);
    localStorage.setItem('koperasi_history', JSON.stringify(slipHistory));
    renderDashboard();
    renderHistoryTable();
  }

  if (typeof AndroidPrint === 'undefined' || !AndroidPrint.isBluetoothConnected || !AndroidPrint.isBluetoothConnected()) {
    openBluetoothModal();
    showToast("⚠️ Hubungkan Printer Bluetooth terlebih dahulu!");
    return;
  }

  try {
    const rawBytes = generateEscPosBytes();
    let binaryStr = "";
    const chunk = 8192;
    for (let i = 0; i < rawBytes.length; i += chunk) {
      binaryStr += String.fromCharCode.apply(null, rawBytes.subarray(i, i + chunk));
    }
    const base64Str = btoa(binaryStr);
    const ok = AndroidPrint.sendRawBytes(base64Str);
    if (ok) {
      showToast("⚡ Berhasil mencetak kilat!");
      closeBluetoothModal();
    } else {
      showToast("❌ Gagal mengirim data ke printer Bluetooth.");
    }
  } catch (e) {
    showToast("❌ Error cetak: " + e.message);
  }
}

// ================= DASHBOARD RENDER =================
function renderDashboard() {
  let totalPaid = slipHistory.reduce((acc, s) => acc + s.netAmount, 0);
  let totalKasbon = slipHistory.reduce((acc, s) => acc + s.kasbonAmount, 0);

  const kpiPaid = document.getElementById('kpiTotalPaid');
  const kpiSlip = document.getElementById('kpiSlipCount');
  const kpiKasbon = document.getElementById('kpiTotalKasbon');
  const kpiWorkers = document.getElementById('kpiActiveWorkers');

  if (kpiPaid) kpiPaid.innerText = formatRupiah(totalPaid);
  if (kpiSlip) kpiSlip.innerText = `${slipHistory.length} slip dicetak`;
  if (kpiKasbon) kpiKasbon.innerText = formatRupiah(totalKasbon);
  if (kpiWorkers) kpiWorkers.innerText = workersDb.filter(w => w.status === 'Aktif').length;

  // Realization vs COA Budget Table
  const tbody = document.getElementById('coaRealizationTbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const cList = typeof COA_ACCOUNTS !== 'undefined' ? COA_ACCOUNTS : FALLBACK_COA;
  cList.forEach(coa => {
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
  const searchEl = document.getElementById('searchWorkerInput');
  const reguEl = document.getElementById('filterWorkerRegu');
  const roleEl = document.getElementById('filterWorkerRole');

  const search = searchEl ? searchEl.value.toLowerCase() : '';
  const regu = reguEl ? reguEl.value.toLowerCase() : '';
  const role = roleEl ? roleEl.value.toLowerCase() : '';

  const tbody = document.getElementById('workersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filtered = workersDb.filter(w => {
    if (!w) return false;
    const matchSearch = (w.name || '').toLowerCase().includes(search) || (w.role || '').toLowerCase().includes(search) || (w.id || '').toLowerCase().includes(search);
    const matchRegu = !regu || (w.regu || '').toLowerCase().includes(regu);
    const matchRole = !role || (w.role || '').toLowerCase().includes(role);
    return matchSearch && matchRegu && matchRole;
  });

  filtered.forEach(w => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${w.id}</strong></td>
      <td style="font-weight: 700; color: var(--text-main);">${w.name}</td>
      <td><span class="badge badge-blue">${w.role}</span></td>
      <td>${w.regu || '-'}</td>
      <td>${w.scheme || 'Borongan'}</td>
      <td>${w.rate > 0 ? formatRupiah(w.rate) : '-'}</td>
      <td><span class="badge ${w.status === 'Aktif' ? 'badge-green' : 'badge-gray'}">${w.status || 'Aktif'}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="quickCreateSlipForWorker('${w.id}')">Buat Slip</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function quickCreateSlipForWorker(id) {
  switchView('slip');
  const reguEl = document.getElementById('filterSlipRegu');
  if (reguEl) reguEl.value = '';
  populateWorkerSelect();
  const select = document.getElementById('selectWorkerDb');
  if (select) {
    select.value = id;
    onSelectWorkerFromDb();
  }
}

function openWorkerModal() {
  const modal = document.getElementById('workerModal');
  if (modal) {
    modal.classList.add('open');
    modal.style.display = 'flex';
  }
}

function closeWorkerModal() {
  const modal = document.getElementById('workerModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
}

function saveNewWorker() {
  const name = getVal('modalWorkerName').trim();
  if (!name) {
    showToast("⚠️ Nama Pekerja Wajib Diisi!");
    return;
  }

  const newW = {
    id: 'W' + String(workersDb.length + 1).padStart(3, '0'),
    name: name,
    role: getVal('modalWorkerRole', 'Borongan Pemetik'),
    regu: getVal('modalWorkerRegu', '-'),
    scheme: getVal('modalWorkerScheme', 'Borongan'),
    rate: parseFloat(getVal('modalWorkerRate', '0')) || 0,
    status: 'Aktif'
  };

  workersDb.unshift(newW);
  localStorage.setItem('koperasi_workers', JSON.stringify(workersDb));

  closeWorkerModal();
  initDropdowns();
  renderWorkersTable();
  renderDashboard();
  showToast(`✅ Pekerja ${name} berhasil ditambahkan!`);
}

// ================= HISTORY TABLE =================
function renderHistoryTable() {
  const search = getVal('searchHistoryInput').toLowerCase();
  const coa = getVal('filterHistoryCoa');

  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filtered = slipHistory.filter(s => {
    if (!s) return false;
    const matchSearch = (s.workerName || '').toLowerCase().includes(search) || (s.refNo || '').toLowerCase().includes(search);
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

function clearHistory() {
  if (confirm("⚠️ Apakah Anda yakin ingin menghapus SELURUH riwayat slip?")) {
    slipHistory = [];
    localStorage.setItem('koperasi_history', JSON.stringify(slipHistory));
    renderHistoryTable();
    renderDashboard();
    showToast("Riwayat slip telah dikosongkan.");
  }
}

function exportHistoryCSV() {
  if (slipHistory.length === 0) {
    showToast("⚠️ Belum ada riwayat slip untuk diexport!");
    return;
  }

  let csv = "No Bukti,Tanggal,Nama Pekerja,Jabatan,Regu,Kode COA,Periode,Gaji Kotor,Kasbon,Gaji Bersih,Metode\n";
  slipHistory.forEach(s => {
    csv += `"${s.refNo}","${s.date}","${s.workerName}","${s.role}","${s.regu}","${s.coaCode}","${s.period}","${s.grossAmount}","${s.kasbonAmount}","${s.netAmount}","${s.paymentMethod}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekap_Slip_Koperasi_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  showToast("📥 File CSV berhasil didownload!");
}

// ================= SETTINGS & BACKUP =================
function loadSettingsToUI() {
  const setBizName = document.getElementById('setBusinessName');
  const setBizUnit = document.getElementById('setBusinessUnit');
  const setBizAddr = document.getElementById('setBusinessAddress');
  const setPicName = document.getElementById('setPicName');
  const setPaperWidth = document.getElementById('setPaperWidth');
  const setRatePemetik = document.getElementById('setRatePemetik');
  const setRatePengawas = document.getElementById('setRatePengawas');
  const setFooterNote = document.getElementById('setFooterNote');

  if (setBizName) setBizName.value = appSettings.businessName;
  if (setBizUnit) setBizUnit.value = appSettings.businessUnit;
  if (setBizAddr) setBizAddr.value = appSettings.businessAddress;
  if (setPicName) setPicName.value = appSettings.picName;
  if (setPaperWidth) setPaperWidth.value = appSettings.paperWidth || '58mm';
  if (setRatePemetik) setRatePemetik.value = appSettings.defaultRatePemetik;
  if (setRatePengawas) setRatePengawas.value = appSettings.defaultRatePengawas;
  if (setFooterNote) setFooterNote.value = appSettings.footerNote;
}

function saveSettings() {
  appSettings.businessName = getVal('setBusinessName', FALLBACK_SETTINGS.businessName);
  appSettings.businessUnit = getVal('setBusinessUnit');
  appSettings.businessAddress = getVal('setBusinessAddress');
  appSettings.picName = getVal('setPicName');
  appSettings.paperWidth = getVal('setPaperWidth', '58mm');
  appSettings.defaultRatePemetik = parseFloat(getVal('setRatePemetik', '7000')) || 7000;
  appSettings.defaultRatePengawas = parseFloat(getVal('setRatePengawas', '150000')) || 150000;
  appSettings.footerNote = getVal('setFooterNote');

  localStorage.setItem('koperasi_settings', JSON.stringify(appSettings));
  applyPaperWidth();
  updateReceipt();
  showToast("💾 Pengaturan berhasil disimpan!");
}

function applyPaperWidth() {
  const w = appSettings.paperWidth || '58mm';
  const printArea = document.getElementById('receiptPrintArea');
  const widthLabel = document.getElementById('previewWidthLabel');
  if (printArea) printArea.style.width = w;
  if (widthLabel) widthLabel.innerText = w;
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
      if (data.workers && Array.isArray(data.workers) && data.workers.length > 0) {
        workersDb = data.workers;
        localStorage.setItem('koperasi_workers', JSON.stringify(workersDb));
      }
      if (data.history) {
        slipHistory = data.history;
        localStorage.setItem('koperasi_history', JSON.stringify(slipHistory));
      }
      loadSettingsToUI();
      initDropdowns();
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

// ================= SYNC WITH GOOGLE SHEETS =================
function syncWithGoogleSheets() {
  alert('Memulai sinkronisasi data dari Google Sheets...');

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
      if (fields.length >= 3) {
        const no = fields[1];
        const name = fields[2];
        const category = fields.length >= 4 ? fields[3] : "Borongan Pemetik";
        const regu = fields.length >= 5 ? fields[4] : "-";
        const schema = fields.length >= 6 ? fields[5] : "Borongan";
        const status = fields.length >= 7 ? fields[6] : "Aktif";

        if (name && name !== "Nama Pekerja" && name !== "Nama Pemetik" && name.trim().length > 1) {
          let defaultRate = 7000;
          if (category.includes('Pengawas Lapangan') || category.includes('Koperasi')) defaultRate = 150000;
          else if (category.includes('Penjemur')) defaultRate = 125000;
          else if (category.includes('Pengawas Cudai') || category.includes('Malam')) defaultRate = 75000;
          else if (category.includes('Borongan Cudai')) defaultRate = 1500;

          newWorkers.push({
            id: "W" + String(newWorkers.length + 1).padStart(3, '0'),
            name: name,
            role: category || "Borongan Pemetik",
            regu: regu || "-",
            scheme: schema || "Borongan",
            rate: defaultRate,
            status: status || "Aktif",
            lastKg: 0,
            lastKasbon: 0
          });
        }
      }
    });

    if (csvPemetik && csvPemetik.trim().length > 0) {
      let linesM = csvPemetik.split('\n');
      linesM.forEach(line => {
        const fields = line.split('","').map(f => f.replace(/^"|"$/g, '').trim());
        if (fields.length >= 3) {
          const no = fields[1];
          const name = fields[2];

          let p2Kg = fields.length >= 9 ? (parseFloat(fields[8]) || 0) : 0;
          let p1Kg = fields.length >= 5 ? (parseFloat(fields[4]) || 0) : 0;

          let p2KasbonRaw = fields.length >= 11 ? fields[10] : "";
          let p1KasbonRaw = fields.length >= 7 ? fields[6] : "";

          let activeKg = p2Kg > 0 ? p2Kg : p1Kg;
          let activeKasbonRaw = p2Kg > 0 ? p2KasbonRaw : p1KasbonRaw;
          let kasbonAmt = parseFloat((activeKasbonRaw || "").replace(/[^0-9.]/g, '')) || 0;

          if (name && (activeKg > 0 || kasbonAmt > 0)) {
            let matchWorker = newWorkers.find(w => w.name.toLowerCase() === name.toLowerCase());
            if (matchWorker) {
              matchWorker.lastKg = activeKg;
              matchWorker.lastKasbon = kasbonAmt;
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
  const modal = document.getElementById('btModal');
  if (modal) {
    modal.classList.add('open');
    modal.style.display = 'flex';
  }
  loadBtDevices();
}

function closeBluetoothModal() {
  const modal = document.getElementById('btModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
}

function loadBtDevices() {
  const select = document.getElementById('btDeviceSelect');
  const status = document.getElementById('btStatus');
  if (!select) return;
  select.innerHTML = '<option value="">-- Pilih Perangkat Bluetooth --</option>';

  if (typeof AndroidPrint !== 'undefined' && AndroidPrint.getPairedBluetoothDevices) {
    try {
      const devices = JSON.parse(AndroidPrint.getPairedBluetoothDevices());
      if (devices.length === 0) {
        if (status) {
          status.innerText = 'Belum ada printer Bluetooth terpasang. Pair terlebih dahulu di HP.';
          status.style.color = 'var(--danger)';
        }
      } else {
        devices.forEach(d => {
          select.add(new Option(`${d.name} (${d.address})`, d.address));
        });
        if (status) {
          status.innerText = `Ditemukan ${devices.length} printer terpasang.`;
          status.style.color = 'var(--primary)';
        }
      }
    } catch (e) {
      if (status) status.innerText = 'Gagal memuat list Bluetooth: ' + e.message;
    }
  } else {
    if (status) status.innerText = 'Fitur Bluetooth aktif di aplikasi HP Android.';
  }
}

function connectBtDevice() {
  const addr = getVal('btDeviceSelect');
  if (!addr) {
    showToast("⚠️ Pilih perangkat printer!");
    return;
  }
  if (typeof AndroidPrint !== 'undefined' && AndroidPrint.connectBluetoothDevice) {
    const status = document.getElementById('btStatus');
    if (status) status.innerText = "Menghubungkan ke printer...";
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
  const status = document.getElementById('btStatus');
  const box = document.getElementById('directBtBtnBox');
  if (status) {
    status.innerText = 'Terhubung ke ' + (devName || 'Printer');
    status.style.color = 'var(--primary)';
  }
  if (box) box.style.display = 'block';
}

function onBtDisconnected(msg) {
  const status = document.getElementById('btStatus');
  const box = document.getElementById('directBtBtnBox');
  if (status) {
    status.innerText = 'Terputus: ' + (msg || '');
    status.style.color = 'var(--danger)';
  }
  if (box) box.style.display = 'none';
}
