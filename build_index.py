import json

with open("workers_data.json", "r", encoding="utf-8") as f:
    workers_data = json.load(f)

with open("rekap_data.json", "r", encoding="utf-8") as f:
    rekap_data = json.load(f)

workers_json_str = json.dumps(workers_data, ensure_ascii=False)
rekap_json_str = json.dumps(rekap_data, ensure_ascii=False)

html_template = """<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#1e293b">
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="icons/icon-192.png">
  <title>Finance Ilantat Jaya - Database Pekerja & Slip Gaji Koperasi</title>
  <style>
    :root {
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --bg: #f1f5f9;
      --card-bg: #ffffff;
      --border: #cbd5e1;
      --text: #0f172a;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    header {
      background: #1e293b;
      color: white;
      padding: 0.85rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    header h1 {
      font-size: 1.2rem;
      font-weight: 700;
    }

    .badge {
      background: #3b82f6;
      color: white;
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      margin-left: 0.5rem;
    }

    /* Main Navigation Bar */
    .top-nav {
      background: #0f172a;
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem 1.25rem;
      overflow-x: auto;
      border-bottom: 1px solid #334155;
    }

    .nav-btn {
      background: transparent;
      color: #94a3b8;
      border: none;
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .nav-btn:hover {
      color: #ffffff;
      background: rgba(255,255,255,0.05);
    }

    .nav-btn.active {
      background: #2563eb;
      color: #ffffff;
    }

    .container {
      display: flex;
      flex: 1;
      gap: 1.5rem;
      padding: 1.25rem;
      max-width: 1350px;
      margin: 0 auto;
      width: 100%;
    }

    /* Main View Sections */
    .view-section {
      width: 100%;
      display: none;
    }

    /* Left Form Editor */
    .editor-section {
      flex: 1.3;
      background: var(--card-bg);
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      padding: 1.25rem;
      max-height: calc(100vh - 140px);
      overflow-y: auto;
      transition: all 0.2s ease;
    }

    .section-title {
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      color: #334155;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.35rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .form-group {
      margin-bottom: 0.85rem;
    }

    .form-row {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .form-row > * {
      flex: 1;
    }

    label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
      color: #475569;
    }

    input, textarea, select {
      width: 100%;
      padding: 0.45rem 0.65rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.15s;
    }

    input:focus, textarea:focus, select:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(37,99,235,0.15);
    }

    .btn {
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.15s ease;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }
    .btn-primary:hover {
      background: var(--primary-hover);
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #334155;
    }
    .btn-secondary:hover {
      background: #cbd5e1;
    }

    .btn-danger {
      background: #fee2e2;
      color: #ef4444;
      padding: 0.35rem 0.6rem;
    }
    .btn-danger:hover {
      background: #fecaca;
    }

    .btn-print {
      background: #10b981;
      color: white;
      font-size: 1.05rem;
      padding: 0.85rem 1.5rem;
      width: 100%;
      justify-content: center;
      margin-top: 1rem;
      font-weight: 700;
    }
    .btn-print:hover {
      background: #059669;
    }

    /* Right Preview Section */
    .preview-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.2s ease;
    }

    .preview-header {
      margin-bottom: 0.75rem;
      font-size: 0.88rem;
      font-weight: 600;
      color: #475569;
      display: flex;
      justify-content: space-between;
      width: 100%;
      max-width: 320px;
    }

    /* Thermal Receipt Simulation (57mm / 58mm printer) */
    .receipt-container {
      width: 58mm;
      background: #ffffff;
      box-shadow: 0 4px 15px rgba(0,0,0,0.12);
      padding: 3mm 2mm;
      color: #000;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.25;
      border-radius: 4px;
    }

    .receipt-center {
      text-align: center;
    }

    .receipt-title {
      font-size: 13px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .receipt-sub {
      font-size: 10px;
      margin-bottom: 2px;
    }

    .divider {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }

    .receipt-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
      word-break: break-all;
    }

    .receipt-row.bold {
      font-weight: bold;
    }

    .receipt-row .label {
      text-align: left;
      flex: 1;
    }

    .receipt-row .val {
      text-align: right;
      white-space: nowrap;
      margin-left: 4px;
    }

    .receipt-table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
    }

    .receipt-table td {
      padding: 1px 0;
      vertical-align: top;
    }

    .receipt-table td.col-item {
      text-align: left;
      font-size: 10.5px;
    }

    .receipt-table td.col-val {
      text-align: right;
      white-space: nowrap;
      font-size: 10.5px;
    }

    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 15px;
      text-align: center;
      font-size: 10px;
    }

    .sign-box {
      width: 45%;
    }

    .sign-space {
      height: 35px;
    }

    /* Database Pekerja Styles */
    .db-container {
      width: 100%;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      padding: 1.25rem;
    }

    .filter-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }

    .worker-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .worker-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      background: #f8fafc;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .worker-card:hover {
      border-color: #2563eb;
      box-shadow: 0 4px 12px rgba(37,99,235,0.08);
      transform: translateY(-2px);
    }

    .worker-header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.6rem;
    }

    .avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.9rem;
    }

    .worker-info {
      flex: 1;
    }

    .worker-name {
      font-weight: 700;
      font-size: 0.95rem;
      color: #0f172a;
    }

    .worker-regu {
      font-size: 0.75rem;
      color: #64748b;
    }

    .tag {
      font-size: 0.72rem;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-weight: 600;
      display: inline-block;
    }

    .tag-category {
      background: #dbeafe;
      color: #1e40af;
    }

    .tag-schema {
      background: #fef3c7;
      color: #92400e;
    }

    .tag-active {
      background: #dcfce7;
      color: #166534;
    }

    /* Rekap Table Styles */
    .rekap-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      margin-top: 1rem;
    }

    .rekap-table th {
      background: #1e293b;
      color: white;
      padding: 0.65rem;
      text-align: left;
    }

    .rekap-table td {
      padding: 0.6rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .rekap-table tr:hover {
      background: #f1f5f9;
    }

    /* Modal & Calculator Styles */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      padding: 1rem;
    }

    .modal-content {
      background: #ffffff;
      border-radius: 12px;
      width: 100%;
      max-width: 450px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      overflow: hidden;
    }

    .modal-header {
      background: #1e293b;
      color: #ffffff;
      padding: 0.85rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      font-size: 1rem;
      font-weight: 600;
    }

    .close-btn {
      font-size: 1.25rem;
      cursor: pointer;
      color: #cbd5e1;
    }

    .modal-body {
      padding: 1.25rem;
    }

    .calc-summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      margin-top: 0.5rem;
      font-size: 0.85rem;
    }

    .calc-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .calc-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 0.85rem;
      margin-top: 1.25rem;
    }

    .calc-box-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 0.6rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .calc-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-bottom: 0.35rem;
      color: #334155;
    }

    .calc-item.bold {
      font-weight: 700;
    }

    .calc-divider {
      border-top: 1px dashed #93c5fd;
      margin: 0.5rem 0;
    }

    .calc-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }

    .calc-btn {
      padding: 0.75rem;
      font-size: 1.1rem;
      font-weight: bold;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      cursor: pointer;
    }

    .calc-btn:active {
      background: #e2e8f0;
    }

    .mode-toggle-bar {
      display: none;
      background: #cbd5e1;
      padding: 0.3rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      gap: 0.4rem;
    }

    .mode-tab {
      flex: 1;
      text-align: center;
      padding: 0.55rem 0.5rem;
      font-size: 0.85rem;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
      color: #334155;
      background: transparent;
      border: none;
      transition: all 0.2s ease;
    }

    .mode-tab.active {
      background: #2563eb;
      color: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }

    @media (max-width: 900px) {
      header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.85rem 1rem;
      }

      .container {
        flex-direction: column;
        padding: 0.75rem;
        gap: 1rem;
      }

      #secSlip.active {
        flex-direction: column;
      }

      .editor-section {
        max-height: none;
        overflow-y: visible;
        width: 100%;
        padding: 1rem;
      }

      .preview-section {
        width: 100%;
        margin-top: 0.5rem;
      }

      .form-row {
        flex-direction: column;
        gap: 0.5rem;
      }

      .mode-toggle-bar {
        display: flex;
      }
    }

    /* Print Stylesheet */
    @media print {
      body * {
        visibility: hidden;
      }
      body {
        background: transparent !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .receipt-container, .receipt-container * {
        visibility: visible;
      }
      .receipt-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 58mm !important;
        padding: 0 1mm !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        margin: 0 !important;
      }
      @page {
        size: 58mm auto;
        margin: 0;
      }
    }
  </style>
</head>
<body>

  <header>
    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 0.5rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <h1>Finance Ilantat Jaya</h1>
        <span class="badge">Thermal 57x30 / 58mm</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-secondary" onclick="openBluetoothModal()" style="font-size: 0.82rem; padding: 0.4rem 0.8rem;">
          Printer Bluetooth
        </button>
        <button class="btn btn-primary" onclick="syncWithGoogleSheets()" style="font-size: 0.82rem; padding: 0.4rem 0.8rem; background: #059669;">
          Sync Google Sheets
        </button>
      </div>
    </div>
  </header>

  <!-- Top Main Navigation Bar -->
  <div class="top-nav">
    <button class="nav-btn active" id="tabNavSlip" onclick="switchMainTab('slip')">Cetak Slip Gaji</button>
    <button class="nav-btn" id="tabNavDb" onclick="switchMainTab('db')">Database Pekerja (<span id="totalWorkerBadge">85</span>)</button>
    <button class="nav-btn" id="tabNavRekap" onclick="switchMainTab('rekap')">Rekapitulasi Gaji &amp; Pemetik</button>
  </div>

  <div class="container">

    <!-- SECTION 1: Slip Gaji Generator -->
    <div class="view-section" id="secSlip" style="display: flex;">
      <!-- Mode Switcher for Mobile -->
      <div class="mode-toggle-bar" style="width: 100%;">
        <button class="mode-tab active" id="tabEdit" onclick="switchMobileTab('edit')">Edit Form Data</button>
        <button class="mode-tab" id="tabPreview" onclick="switchMobileTab('preview')">Lihat Preview (57mm)</button>
      </div>

      <!-- Form Input / Editor -->
      <div class="editor-section">

        <!-- Master Data Template Pekerja -->
        <div class="section-title">
          <span>Pilih / Kelola Template Pekerja</span>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.85rem; border-radius: 8px; margin-bottom: 1.25rem;">
          <label>Daftar Nama Pekerja (Pilih untuk memuat template):</label>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.35rem; flex-wrap: wrap;">
            <select id="workerTemplateSelect" onchange="loadWorkerTemplate(this.value)" style="flex: 2; min-width: 180px;">
              <option value="">-- Pilih Nama Pekerja --</option>
            </select>
            <button class="btn btn-primary" onclick="saveWorkerTemplate()" style="font-size: 0.8rem;">
              Simpan
            </button>
            <button class="btn btn-danger" onclick="deleteWorkerTemplate()" style="font-size: 0.8rem;">
              Hapus
            </button>
          </div>
        </div>

        <div class="section-title">
          <span>Informasi Usaha / Tempat Kerja</span>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Nama Usaha / Toko / Perusahaan</label>
            <input type="text" id="businessName" value="KOPERASI ILANTAT JAYA" oninput="updateReceipt()">
          </div>
          <div class="form-group">
            <label>Sub-judul / Unit Kerja</label>
            <input type="text" id="businessUnit" value="Slip Gaji &amp; Upah Kerja" oninput="updateReceipt()">
          </div>
        </div>
        <div class="form-group">
          <label>Alamat / Kontak Singkat</label>
          <input type="text" id="businessAddress" value="Desa Lungkap, Bolaang Mongondow Selatan" oninput="updateReceipt()">
        </div>

        <div class="section-title" style="margin-top: 1.25rem;">
          <span>Detail Pekerja &amp; Kategori</span>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Nama Pekerja</label>
            <input type="text" id="workerName" value="Ahmad Maulana" oninput="updateReceipt()">
          </div>
          <div class="form-group">
            <label>Kategori Pekerja</label>
            <select id="workerCategorySelect" onchange="handleCategoryChange(this.value)">
              <option value="Pengawas">Pengawas</option>
              <option value="Borongan">Borongan</option>
            </select>
          </div>
        </div>

        <!-- Sub-Kategori Borongan (Tampil jika Kategori = Borongan) -->
        <div class="form-group" id="boronganSubGroup" style="display: none;">
          <label>Jenis Borongan</label>
          <select id="boronganTypeSelect" onchange="handleBoronganTypeChange(this.value)">
            <option value="Borongan Cudai">Borongan Cudai</option>
            <option value="Borongan Petik">Borongan Petik</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>No. Bukti / Referensi</label>
            <input type="text" id="refNo" value="PAY-202611-01" oninput="updateReceipt()">
          </div>
          <div class="form-group">
            <label>Tanggal Pembayaran</label>
            <input type="date" id="payDate" oninput="updateReceipt()">
          </div>
        </div>

        <!-- Kalender Periode Kerja -->
        <div class="form-row">
          <div class="form-group">
            <label>Periode Kerja (Mulai)</label>
            <input type="date" id="periodStart" oninput="updatePeriodFromDates()">
          </div>
          <div class="form-group">
            <label>Periode Kerja (Sampai)</label>
            <input type="date" id="periodEnd" oninput="updatePeriodFromDates()">
          </div>
        </div>
        <div class="form-group">
          <label>Format Teks Periode (Otomatis / Custom)</label>
          <input type="text" id="periodText" value="16 Nov 2026 - 22 Nov 2026 (Mingguan)" oninput="updateReceipt()">
        </div>

        <!-- Pendapatan / Komponen Gaji -->
        <div class="section-title" style="margin-top: 1.25rem;">
          <span>Komponen Pendapatan (+)</span>
          <button class="btn btn-secondary" onclick="addIncomeItem()">+ Tambah Baris</button>
        </div>
        <div id="incomeItemsContainer"></div>
        <div class="calc-summary-card">
          <div class="calc-row">
            <span>Subtotal Pendapatan (+):</span>
            <strong id="editorTotalIncome" style="color: #16a34a;">Rp 0</strong>
          </div>
        </div>

        <!-- Potongan / Kasbon -->
        <div class="section-title" style="margin-top: 1.25rem;">
          <span>Komponen Potongan / Kasbon (-)</span>
          <button class="btn btn-secondary" onclick="addDeductionItem()">+ Tambah Baris</button>
        </div>
        <div id="deductionItemsContainer"></div>
        <div class="calc-summary-card">
          <div class="calc-row">
            <span>Subtotal Potongan / Kasbon (-):</span>
            <strong id="editorTotalDeduction" style="color: #ef4444;">-Rp 0</strong>
          </div>
        </div>

        <!-- Ringkasan Kalkulator Otomatis Gaji -->
        <div class="calc-box">
          <div class="calc-box-title">
            <span>Kalkulator Ringkasan Gaji</span>
            <button class="btn btn-secondary" onclick="openCalcModal()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
              Buka Kalkulator Hitung
            </button>
          </div>
          <div class="calc-item">
            <span>Total Pendapatan (+)</span>
            <span id="sumIncome" style="color: #16a34a; font-weight: 600;">Rp 0</span>
          </div>
          <div class="calc-item">
            <span>Total Potongan / Kasbon (-)</span>
            <span id="sumDeduction" style="color: #dc2626; font-weight: 600;">-Rp 0</span>
          </div>
          <div class="calc-divider"></div>
          <div class="calc-item bold">
            <span>Gaji Bersih / Total Diterima (=)</span>
            <span id="sumGrandTotal" style="color: #2563eb; font-size: 1.05rem;">Rp 0</span>
          </div>
        </div>

        <!-- Pembayaran & Tanda Tangan -->
        <div class="section-title" style="margin-top: 1.25rem;">
          <span>Metode Pembayaran &amp; Tanda Tangan</span>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Metode Pembayaran</label>
            <select id="paymentMethod" onchange="updateReceipt()">
              <option value="Tunai / Cash">Tunai / Cash</option>
              <option value="Transfer Bank BCA">Transfer Bank BCA</option>
              <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
              <option value="Transfer Bank BRI">Transfer Bank BRI</option>
              <option value="QRIS / E-Wallet">QRIS / E-Wallet</option>
            </select>
          </div>
          <div class="form-group">
            <label>Nama Penanggung Jawab</label>
            <input type="text" id="picName" value="Koperasi" oninput="updateReceipt()">
          </div>
        </div>
        <div class="form-group">
          <label>Catatan Tambahan (Bawah Kertas)</label>
          <textarea id="noteText" rows="2" oninput="updateReceipt()">Terima kasih atas kerja keras &amp; dedikasinya!</textarea>
        </div>

        <button class="btn btn-print" onclick="handleMainPrint()">
          Cetak Slip Gaji (Thermal 57x30)
        </button>

        <button class="btn btn-secondary" onclick="AndroidPrint.printPage()" style="width: 100%; margin-top: 0.5rem; justify-content: center; font-size: 0.85rem;">
          Simpan PDF / Cetak Sistem
        </button>
      </div>

      <!-- Preview Thermal -->
      <div class="preview-section">
        <div class="preview-header">
          <span>Live Preview Ukuran 57mm</span>
          <span style="color: #64748b; font-size: 0.8rem;">Auto-update</span>
        </div>

        <div class="receipt-container" id="receiptPrintArea">
          <!-- Header Usaha -->
          <div class="receipt-center">
            <div class="receipt-title" id="prevBusinessName">KOPERASI ILANTAT JAYA</div>
            <div class="receipt-sub" id="prevBusinessUnit">Slip Gaji &amp; Upah Kerja</div>
            <div class="receipt-sub" id="prevBusinessAddress" style="font-size: 9px;">Desa Lungkap, Bolaang Mongondow Selatan</div>
          </div>

          <div class="divider"></div>

          <!-- Info Bukti & Pekerja -->
          <div class="receipt-row">
            <span class="label">No.Bukti</span>
            <span class="val" id="prevRefNo">PAY-202611-01</span>
          </div>
          <div class="receipt-row">
            <span class="label">Tanggal</span>
            <span class="val" id="prevDate">22/11/2026</span>
          </div>
          <div class="receipt-row">
            <span class="label">Pekerja</span>
            <span class="val bold" id="prevWorker">Ahmad Maulana</span>
          </div>
          <div class="receipt-row">
            <span class="label">Jabatan</span>
            <span class="val" id="prevRole">Pengawas</span>
          </div>
          <div class="receipt-row">
            <span class="label">Periode</span>
            <span class="val" id="prevPeriod" style="font-size: 10px;">16-22 Nov 2026</span>
          </div>

          <div class="divider"></div>

          <!-- Rincian Pendapatan -->
          <div style="font-weight: bold; margin-bottom: 2px;">RINCIAN PENDAPATAN:</div>
          <table class="receipt-table" id="prevIncomeTable">
            <!-- Rows injected via JS -->
          </table>

          <!-- Rincian Potongan -->
          <div id="prevDeductionSection" style="display: none; margin-top: 4px;">
            <div style="font-weight: bold; margin-bottom: 2px;">POTONGAN / KASBON:</div>
            <table class="receipt-table" id="prevDeductionTable">
              <!-- Rows injected via JS -->
            </table>
          </div>

          <div class="divider"></div>

          <!-- Total Bersih -->
          <div class="receipt-row bold" style="font-size: 12px;">
            <span class="label">TOTAL DITERIMA:</span>
            <span class="val" id="prevTotal">Rp 0</span>
          </div>
          <div class="receipt-row" style="font-size: 9.5px; margin-top: 2px;">
            <span class="label">Metode:</span>
            <span class="val" id="prevPaymentMethod">Tunai / Cash</span>
          </div>

          <div class="divider"></div>

          <!-- Tanda Tangan -->
          <div class="signatures">
            <div class="sign-box">
              <div>Penerima,</div>
              <div class="sign-space"></div>
              <div id="prevSignWorker">( Ahmad M. )</div>
            </div>
            <div class="sign-box">
              <div>Pengesah,</div>
              <div class="sign-space"></div>
              <div id="prevSignPic">( Koperasi )</div>
            </div>
          </div>

          <div class="divider" style="margin-top: 10px;"></div>

          <div class="receipt-center" style="font-size: 9px; margin-top: 4px;" id="prevNote">
            Terima kasih atas kerja keras &amp; dedikasinya!
          </div>
          <div class="receipt-center" style="font-size: 8px; color: #555; margin-top: 2px;">
            --- Simpan bukti ini dengan baik ---
          </div>
        </div>

        <div style="margin-top: 15px; font-size: 0.8rem; color: #64748b; max-width: 300px; text-align: center;">
          <strong>Tips Setting Printer:</strong> Saat jendela print muncul, pilih printer thermal 58mm, margins <strong>None / Minimum</strong>, lalu uncheck <em>Headers and Footers</em>.
        </div>
      </div>
    </div>

    <!-- SECTION 2: Database Pekerja -->
    <div class="view-section" id="secDb" style="display: none;">
      <div class="db-container">
        <div class="section-title">
          <span>Database Pekerja Koperasi</span>
          <span style="font-size: 0.8rem; color: #64748b;" id="dbStatsText">Total 85 Pekerja</span>
        </div>

        <div class="filter-bar">
          <input type="text" id="searchWorkerInput" placeholder="Cari nama pekerja..." oninput="filterWorkers()" style="flex: 2; min-width: 180px;">
          <select id="filterCategorySelect" onchange="filterWorkers()" style="flex: 1; min-width: 150px;">
            <option value="">-- Semua Kategori --</option>
            <option value="Borongan Pemetik">Borongan Pemetik</option>
            <option value="Pengawas Lapangan">Pengawas Lapangan</option>
            <option value="Pengawas Cudai">Pengawas Cudai</option>
            <option value="Penjemur">Penjemur</option>
            <option value="Pengawas Malam">Pengawas Malam</option>
          </select>
          <select id="filterReguSelect" onchange="filterWorkers()" style="flex: 1; min-width: 130px;">
            <option value="">-- Semua Regu --</option>
            <option value="PGWS">PGWS</option>
            <option value="LGKP">LGKP</option>
            <option value="Sabua Miring">Sabua Miring</option>
            <option value="Due 1">Due 1</option>
            <option value="Due 2">Due 2</option>
            <option value="Kaki Seribu 1">Kaki Seribu 1</option>
            <option value="Kaki Seribu 2">Kaki Seribu 2</option>
          </select>
        </div>

        <div class="worker-grid" id="workerGridContainer">
          <!-- Worker cards injected via JS -->
        </div>
      </div>
    </div>

    <!-- SECTION 3: Rekapitulasi Gaji -->
    <div class="view-section" id="secRekap" style="display: none;">
      <div class="db-container">
        <div class="section-title">
          <span>Rekapitulasi Pembayaran Gaji &amp; Pemetik</span>
          <span style="font-size: 0.8rem; color: #059669;" id="rekapStatsText">Google Sheets Live Data</span>
        </div>

        <div class="filter-bar">
          <input type="text" id="searchRekapInput" placeholder="Cari nama pemetik..." oninput="filterRekap()" style="flex: 2; min-width: 180px;">
        </div>

        <div style="overflow-x: auto;">
          <table class="rekap-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Pemetik</th>
                <th>Kode Regu</th>
                <th>Hasil Petik (kg)</th>
                <th>Sub Total Gaji</th>
                <th>Kasbon</th>
                <th>Total Gaji Netto</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="rekapTableBody">
              <!-- Rekap rows injected via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>

  <!-- Modal Bluetooth Settings -->
  <div id="btModal" class="modal" style="display: none;">
    <div class="modal-content">
      <div class="modal-header">
        <h3>📶 Koneksi Printer Bluetooth</h3>
        <span class="close-btn" onclick="closeBluetoothModal()">&times;</span>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.82rem; color: #64748b; margin-bottom: 0.75rem;">
          Pilih printer thermal Bluetooth yang sudah terpasang (paired) di HP Anda:
        </p>
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
          <select id="btDeviceSelect" style="flex: 1;">
            <option value="">-- Cari / Pilih Perangkat --</option>
          </select>
          <button class="btn btn-secondary" onclick="loadBtDevices()">Cari</button>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="connectBtDevice()" style="flex: 1; justify-content: center;">
            Hubungkan
          </button>
          <button class="btn btn-danger" onclick="disconnectBtDevice()" style="flex: 1; justify-content: center;">
            Putus
          </button>
        </div>

        <div id="directBtBtnBox" style="margin-top: 1rem; display: none;">
          <button class="btn btn-primary" onclick="printDirectBluetooth()" style="width: 100%; justify-content: center; background: #10b981; font-size: 1rem; padding: 0.75rem; font-weight: 700;">
            CETAK LANGSUNG VIA BLUETOOTH
          </button>
        </div>

        <div id="btStatus" style="margin-top: 0.75rem; font-size: 0.85rem; font-weight: 600; text-align: center; min-height: 1.5rem;"></div>
      </div>
    </div>
  </div>

  <!-- Modal Kalkulator -->
  <div id="calcModal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 320px;">
      <div class="modal-header">
        <h3>Kalkulator Hitung Gaji</h3>
        <span class="close-btn" onclick="closeCalcModal()">&times;</span>
      </div>
      <div class="modal-body">
        <input type="text" id="calcDisplay" value="0" readonly style="font-size: 1.35rem; text-align: right; margin-bottom: 0.75rem; font-weight: bold; background: #f8fafc;">
        <div class="calc-grid">
          <button class="calc-btn btn-danger" onclick="calcClear()">C</button>
          <button class="calc-btn" onclick="calcOp('/')">÷</button>
          <button class="calc-btn" onclick="calcOp('*')">×</button>
          <button class="calc-btn" onclick="calcOp('-')">-</button>

          <button class="calc-btn" onclick="calcNum('7')">7</button>
          <button class="calc-btn" onclick="calcNum('8')">8</button>
          <button class="calc-btn" onclick="calcNum('9')">9</button>
          <button class="calc-btn" onclick="calcOp('+')">+</button>

          <button class="calc-btn" onclick="calcNum('4')">4</button>
          <button class="calc-btn" onclick="calcNum('5')">5</button>
          <button class="calc-btn" onclick="calcNum('6')">6</button>
          <button class="calc-btn btn-primary" onclick="calcEqual()" style="grid-row: span 2; display: flex; align-items: center; justify-content: center;">=</button>

          <button class="calc-btn" onclick="calcNum('1')">1</button>
          <button class="calc-btn" onclick="calcNum('2')">2</button>
          <button class="calc-btn" onclick="calcNum('3')">3</button>

          <button class="calc-btn" onclick="calcNum('0')" style="grid-column: span 2;">0</button>
          <button class="calc-btn" onclick="calcNum('000')">000</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Embedded Database Datasets from Google Sheets
    const defaultWorkersData = WORKERS_JSON_PLACEHOLDER;
    const defaultRekapData = REKAP_JSON_PLACEHOLDER;

    let workersData = JSON.parse(localStorage.getItem('workersData') || 'null') || defaultWorkersData;
    let rekapData = JSON.parse(localStorage.getItem('rekapData') || 'null') || defaultRekapData;

    // Category & Worker State
    let workerCategory = "Pengawas";
    let boronganType = "Borongan Cudai";

    let incomeItems = [
      { desc: "Gaji", amount: 0 }
    ];

    let deductionItems = [
      { desc: "Kasbon / Pinjaman", amount: 0 }
    ];

    let workerTemplates = JSON.parse(localStorage.getItem('workerTemplates') || '{}');

    window.onload = function() {
      const todayDate = new Date();
      const today = todayDate.toISOString().split('T')[0];
      document.getElementById('payDate').value = today;

      const startDate = new Date();
      startDate.setDate(todayDate.getDate() - 6);
      document.getElementById('periodStart').value = startDate.toISOString().split('T')[0];
      document.getElementById('periodEnd').value = today;
      updatePeriodFromDates();

      renderWorkerTemplateDropdown();
      renderItemsInput();
      updateReceipt();

      renderWorkerGrid();
      renderRekapTable();

      checkBtStatusOnLoad();
    };

    function switchMainTab(tab) {
      const secSlip = document.getElementById('secSlip');
      const secDb = document.getElementById('secDb');
      const secRekap = document.getElementById('secRekap');

      secSlip.style.display = 'none';
      secDb.style.display = 'none';
      secRekap.style.display = 'none';

      document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

      if (tab === 'slip') {
        secSlip.style.display = 'flex';
        document.getElementById('tabNavSlip').classList.add('active');
      } else if (tab === 'db') {
        secDb.style.display = 'block';
        document.getElementById('tabNavDb').classList.add('active');
        renderWorkerGrid();
      } else if (tab === 'rekap') {
        secRekap.style.display = 'block';
        document.getElementById('tabNavRekap').classList.add('active');
        renderRekapTable();
      }
    }

    function renderWorkerGrid() {
      const container = document.getElementById('workerGridContainer');
      const search = (document.getElementById('searchWorkerInput').value || '').toLowerCase();
      const categoryFilter = document.getElementById('filterCategorySelect').value;
      const reguFilter = document.getElementById('filterReguSelect').value;

      container.innerHTML = '';
      let count = 0;

      workersData.forEach(w => {
        const matchesSearch = !search || w.name.toLowerCase().includes(search) || (w.regu || '').toLowerCase().includes(search);
        const matchesCategory = !categoryFilter || w.category === categoryFilter;
        const matchesRegu = !reguFilter || w.regu === reguFilter;

        if (matchesSearch && matchesCategory && matchesRegu) {
          count++;
          const card = document.createElement('div');
          card.className = 'worker-card';

          const initial = w.name.charAt(0).toUpperCase();

          card.innerHTML = `
            <div>
              <div class="worker-header">
                <div class="avatar">${initial}</div>
                <div class="worker-info">
                  <div class="worker-name">${w.name}</div>
                  <div class="worker-regu">Regu: ${w.regu || '-'} (#${w.no})</div>
                </div>
              </div>
              <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
                <span class="tag tag-category">${w.category}</span>
                <span class="tag tag-schema">${w.schema}</span>
                <span class="tag tag-active">${w.status}</span>
              </div>
            </div>
            <button class="btn btn-primary" onclick="createSlipForWorker('${w.name}', '${w.category}', '${w.regu}')" style="width: 100%; justify-content: center; font-size: 0.8rem;">
              Buat Slip Gaji
            </button>
          `;
          container.appendChild(card);
        }
      });

      document.getElementById('dbStatsText').innerText = `Menampilkan ${count} dari ${workersData.length} Pekerja`;
      document.getElementById('totalWorkerBadge').innerText = workersData.length;
    }

    function filterWorkers() {
      renderWorkerGrid();
    }

    function createSlipForWorker(name, category, regu) {
      document.getElementById('workerName').value = name;

      if (category.toLowerCase().includes('borongan') || category.toLowerCase().includes('pemetik')) {
        document.getElementById('workerCategorySelect').value = 'Borongan';
        handleCategoryChange('Borongan');
        if (category.toLowerCase().includes('petik')) {
          document.getElementById('boronganTypeSelect').value = 'Borongan Petik';
          handleBoronganTypeChange('Borongan Petik');
        } else {
          document.getElementById('boronganTypeSelect').value = 'Borongan Cudai';
          handleBoronganTypeChange('Borongan Cudai');
        }
      } else {
        document.getElementById('workerCategorySelect').value = 'Pengawas';
        handleCategoryChange('Pengawas');
      }

      switchMainTab('slip');
      updateReceipt();
    }

    function renderRekapTable() {
      const tbody = document.getElementById('rekapTableBody');
      const search = (document.getElementById('searchRekapInput').value || '').toLowerCase();
      tbody.innerHTML = '';

      rekapData.forEach(r => {
        if (!search || r.name.toLowerCase().includes(search) || (r.regu || '').toLowerCase().includes(search)) {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>#${r.no}</td>
            <td style="font-weight: 700; color: #0f172a;">${r.name}</td>
            <td><span class="tag tag-category">${r.regu || '-'}</span></td>
            <td style="font-weight: 600;">${r.hasilKg || 0} kg</td>
            <td>Rp ${r.subTotal || '0'}</td>
            <td style="color: #dc2626;">${r.kasbon || '-'}</td>
            <td style="font-weight: 700; color: #16a34a;">${r.totalGaji || 'Rp 0'}</td>
            <td>
              <button class="btn btn-secondary" onclick="createSlipForWorker('${r.name}', 'Borongan Pemetik', '${r.regu}')" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
                Buat Slip
              </button>
            </td>
          `;
          tbody.appendChild(tr);
        }
      });
    }

    function filterRekap() {
      renderRekapTable();
    }

    function syncWithGoogleSheets() {
      alert('Memulai sinkronisasi data langsung dari Google Sheets...');

      const docId = "1rgSWAGeef9o2D-Eru6v2dzuTm_W8MMeb86Bt_Quo6Rk";
      const urlPekerja = `https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv&sheet=Database%20Pekerja`;

      fetch(urlPekerja)
        .then(res => res.text())
        .then(csvText => {
          const lines = csvText.split('\n');
          let newWorkers = [];
          lines.forEach(line => {
            const fields = line.split('","').map(f => f.replace(/^"|"$/g, '').trim());
            if (fields.length >= 8) {
              const no = fields[1];
              const name = fields[2];
              const category = fields[3];
              const regu = fields[4];
              const schema = fields[5];
              const status = fields[7];

              if (/^\d+$/.test(no) && name && isNaN(name)) {
                newWorkers.push({
                  no: parseInt(no),
                  name: name,
                  category: category,
                  regu: regu || "-",
                  schema: schema || "-",
                  status: status || "Aktif"
                });
              }
            }
          });

          if (newWorkers.length > 0) {
            workersData = newWorkers;
            localStorage.setItem('workersData', JSON.stringify(workersData));
            renderWorkerGrid();
            alert(`Sinkronisasi berhasil! Memuat ${newWorkers.length} data pekerja dari Google Sheets.`);
          } else {
            alert('Sinkronisasi selesai: Data sudah paling mutakhir.');
          }
        })
        .catch(err => {
          alert('Gagal sinkronisasi Google Sheets (cek koneksi internet): ' + err.message);
        });
    }

    function checkBtStatusOnLoad() {
      if (typeof AndroidPrint !== 'undefined' && AndroidPrint.isBluetoothConnected && AndroidPrint.isBluetoothConnected()) {
        onBtConnected('Printer Bluetooth');
      }
    }

    function onBtConnected(devName) {
      const status = document.getElementById('btStatus');
      const directBox = document.getElementById('directBtBtnBox');
      if (status) {
        status.innerText = 'Terhubung ke ' + (devName || 'Printer Bluetooth');
        status.style.color = '#10b981';
      }
      if (directBox) {
        directBox.style.display = 'block';
      }
    }

    function onBtDisconnected(msg) {
      const status = document.getElementById('btStatus');
      const directBox = document.getElementById('directBtBtnBox');
      if (status) {
        status.innerText = 'Terputus: ' + (msg || '');
        status.style.color = '#ef4444';
      }
      if (directBox) {
        directBox.style.display = 'none';
      }
    }

    function handleCategoryChange(cat) {
      workerCategory = cat;
      const subGroup = document.getElementById('boronganSubGroup');
      if (cat === "Borongan") {
        subGroup.style.display = "block";
        boronganType = document.getElementById('boronganTypeSelect').value || "Borongan Cudai";
        incomeItems = [{ desc: "Hasil " + boronganType, weightKg: 0, pricePerKg: 0, amount: 0 }];
      } else {
        subGroup.style.display = "none";
        incomeItems = [{ desc: "Gaji", amount: 0 }];
      }
      renderItemsInput();
      updateReceipt();
    }

    function handleBoronganTypeChange(type) {
      boronganType = type;
      if (incomeItems.length > 0 && incomeItems[0].desc.startsWith("Hasil ")) {
        incomeItems[0].desc = "Hasil " + type;
      }
      renderItemsInput();
      updateReceipt();
    }

    function getSelectedRole() {
      if (workerCategory === "Borongan") {
        return document.getElementById('boronganTypeSelect').value || "Borongan";
      }
      return "Pengawas";
    }

    function updatePeriodFromDates() {
      const startVal = document.getElementById('periodStart').value;
      const endVal = document.getElementById('periodEnd').value;

      if (startVal && endVal) {
        const startDate = new Date(startVal);
        const endDate = new Date(endVal);

        const formatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        const startFormatted = startDate.toLocaleDateString('id-ID', formatOptions);
        const endFormatted = endDate.toLocaleDateString('id-ID', formatOptions);

        document.getElementById('periodText').value = `${startFormatted} - ${endFormatted}`;
      } else if (startVal) {
        const startDate = new Date(startVal);
        const formatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        document.getElementById('periodText').value = startDate.toLocaleDateString('id-ID', formatOptions);
      }
      updateReceipt();
    }

    function renderWorkerTemplateDropdown() {
      const select = document.getElementById('workerTemplateSelect');
      select.innerHTML = '<option value="">-- Pilih Nama Pekerja --</option>';
      for (const name in workerTemplates) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.innerText = `${name} (${workerTemplates[name].role || workerTemplates[name].category || 'Pekerja'})`;
        select.appendChild(opt);
      }
    }

    function saveWorkerTemplate() {
      const name = document.getElementById('workerName').value.trim();
      if (!name) {
        alert('Tuliskan Nama Pekerja terlebih dahulu!');
        return;
      }
      const role = getSelectedRole();

      workerTemplates[name] = {
        name: name,
        category: workerCategory,
        boronganType: boronganType,
        role: role,
        incomeItems: JSON.parse(JSON.stringify(incomeItems)),
        deductionItems: JSON.parse(JSON.stringify(deductionItems))
      };

      localStorage.setItem('workerTemplates', JSON.stringify(workerTemplates));
      renderWorkerTemplateDropdown();
      document.getElementById('workerTemplateSelect').value = name;
      alert(`Data pekerja "${name}" berhasil disimpan ke daftar template!`);
    }

    function loadWorkerTemplate(name) {
      if (!name || !workerTemplates[name]) return;
      const data = workerTemplates[name];
      document.getElementById('workerName').value = data.name;

      if (data.category) {
        document.getElementById('workerCategorySelect').value = data.category;
        handleCategoryChange(data.category);
      }
      if (data.boronganType && data.category === "Borongan") {
        document.getElementById('boronganTypeSelect').value = data.boronganType;
        handleBoronganTypeChange(data.boronganType);
      }

      if (data.incomeItems) {
        incomeItems = JSON.parse(JSON.stringify(data.incomeItems));
      }
      if (data.deductionItems) {
        deductionItems = JSON.parse(JSON.stringify(data.deductionItems));
      }

      renderItemsInput();
      updateReceipt();
    }

    function deleteWorkerTemplate() {
      const select = document.getElementById('workerTemplateSelect');
      const name = select.value;
      if (!name || !workerTemplates[name]) {
        alert('Pilih pekerja dari daftar yang ingin dihapus!');
        return;
      }
      if (confirm(`Apakah Anda yakin ingin menghapus template pekerja "${name}"?`)) {
        delete workerTemplates[name];
        localStorage.setItem('workerTemplates', JSON.stringify(workerTemplates));
        renderWorkerTemplateDropdown();
        alert(`Template "${name}" telah dihapus.`);
      }
    }

    function togglePreview() {
      const previewSec = document.querySelector('.preview-section');
      const editorSec = document.querySelector('.editor-section');
      const toggleBtn = document.getElementById('togglePreviewBtn');
      const toggleText = document.getElementById('toggleText');

      if (previewSec.classList.contains('hidden')) {
        previewSec.classList.remove('hidden');
        editorSec.classList.remove('full-width');
        if (toggleText) toggleText.innerText = 'Sembunyikan Preview';
        if (toggleBtn) {
          toggleBtn.classList.remove('btn-primary');
          toggleBtn.classList.add('btn-secondary');
        }
      } else {
        previewSec.classList.add('hidden');
        editorSec.classList.add('full-width');
        if (toggleText) toggleText.innerText = 'Tampilkan Preview';
        if (toggleBtn) {
          toggleBtn.classList.remove('btn-secondary');
          toggleBtn.classList.add('btn-primary');
        }
      }
    }

    function switchMobileTab(mode) {
      const editorSec = document.querySelector('.editor-section');
      const previewSec = document.querySelector('.preview-section');
      const tabEdit = document.getElementById('tabEdit');
      const tabPreview = document.getElementById('tabPreview');

      if (mode === 'edit') {
        editorSec.style.display = 'block';
        previewSec.style.display = 'none';
        previewSec.classList.add('hidden');
        tabEdit.classList.add('active');
        tabPreview.classList.remove('active');
      } else if (mode === 'preview') {
        editorSec.style.display = 'none';
        previewSec.style.display = 'flex';
        previewSec.classList.remove('hidden');
        tabEdit.classList.remove('active');
        tabPreview.classList.add('active');
      }
    }

    // Bluetooth Printer Functions
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
          const jsonStr = AndroidPrint.getPairedBluetoothDevices();
          const devices = JSON.parse(jsonStr);
          if (devices.length === 0) {
            status.innerText = 'Belum ada printer Bluetooth terpasang. Pastikan sudah di-pair di Pengaturan HP.';
            status.style.color = '#ef4444';
          } else {
            devices.forEach(d => {
              const opt = document.createElement('option');
              opt.value = d.address;
              opt.innerText = `${d.name} (${d.address})`;
              select.appendChild(opt);
            });
            status.innerText = `Ditemukan ${devices.length} perangkat Bluetooth terpasang.`;
            status.style.color = '#10b981';
          }
        } catch (e) {
          status.innerText = 'Gagal memuat list Bluetooth: ' + e.message;
          status.style.color = '#ef4444';
        }
      } else {
        status.innerText = 'Pencarian Bluetooth siap digunakan pada aplikasi Android.';
        status.style.color = '#64748b';
      }
    }

    function connectBtDevice() {
      const address = document.getElementById('btDeviceSelect').value;
      const status = document.getElementById('btStatus');
      if (!address) {
        alert('Silakan pilih perangkat Bluetooth terlebih dahulu!');
        return;
      }
      if (typeof AndroidPrint !== 'undefined' && AndroidPrint.connectBluetoothDevice) {
        status.innerText = 'Menghubungkan ke printer... Mohon tunggu.';
        status.style.color = '#f59e0b';
        AndroidPrint.connectBluetoothDevice(address);
      }
    }

    function disconnectBtDevice() {
      if (typeof AndroidPrint !== 'undefined' && AndroidPrint.disconnectBluetooth) {
        AndroidPrint.disconnectBluetooth();
        onBtDisconnected('Terputus');
      }
    }

    // Direct ESC/POS Thermal Printing
    function generateEscPosBytes() {
      let bytes = [];

      function pushString(str) {
        for (let i = 0; i < str.length; i++) {
          bytes.push(str.charCodeAt(i));
        }
      }

      // Initialize
      bytes.push(0x1B, 0x40);

      // Center Align
      bytes.push(0x1B, 0x61, 0x01);

      // Bold Business Title
      bytes.push(0x1B, 0x45, 0x01);
      pushString((document.getElementById('businessName').value || 'KOPERASI ILANTAT JAYA') + "\\n");
      bytes.push(0x1B, 0x45, 0x00);

      pushString((document.getElementById('businessUnit').value || 'Slip Gaji & Upah Kerja') + "\\n");
      pushString((document.getElementById('businessAddress').value || 'Desa Lungkap') + "\\n");
      pushString("--------------------------------\\n");

      // Left Align for Details
      bytes.push(0x1B, 0x61, 0x00);

      function addRow(label, val) {
        let l = label || "";
        let r = val || "";
        let spaces = 32 - (l.length + r.length);
        if (spaces < 1) spaces = 1;
        pushString(l + " ".repeat(spaces) + r + "\\n");
      }

      addRow("No.Bukti", document.getElementById('refNo').value || '-');

      const dateVal = document.getElementById('payDate').value;
      let dateStr = '-';
      if (dateVal) {
        const parts = dateVal.split('-');
        dateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      addRow("Tanggal", dateStr);

      const worker = document.getElementById('workerName').value || 'Nama Pekerja';
      addRow("Pekerja", worker);

      const role = getSelectedRole();
      addRow("Jabatan", role);

      const period = document.getElementById('periodText').value || '-';
      addRow("Periode", period);

      pushString("--------------------------------\\n");

      // Income Items
      bytes.push(0x1B, 0x45, 0x01);
      pushString("RINCIAN PENDAPATAN:\\n");
      bytes.push(0x1B, 0x45, 0x00);

      let totalIncome = 0;
      incomeItems.forEach(item => {
        totalIncome += (item.amount || 0);
        addRow(item.desc || 'Item', formatRupiah(item.amount));
        if (item.weightKg && item.pricePerKg) {
          pushString(`  ${item.weightKg} kg x @${formatRupiah(item.pricePerKg)}\\n`);
        }
      });

      // Deduction Items
      let totalDeductions = 0;
      if (deductionItems.length > 0) {
        bytes.push(0x1B, 0x45, 0x01);
        pushString("POTONGAN / KASBON:\\n");
        bytes.push(0x1B, 0x45, 0x00);

        deductionItems.forEach(item => {
          totalDeductions += (item.amount || 0);
          addRow(item.desc || 'Potongan', "-" + formatRupiah(item.amount));
        });
      }

      pushString("--------------------------------\\n");

      // Total
      bytes.push(0x1B, 0x45, 0x01);
      const grandTotal = totalIncome - totalDeductions;
      addRow("TOTAL DITERIMA", formatRupiah(grandTotal));
      bytes.push(0x1B, 0x45, 0x00);

      addRow("Metode", document.getElementById('paymentMethod').value);
      pushString("--------------------------------\\n");

      // Signatures
      pushString("Penerima               Pengesah \\n\\n\\n");
      const pic = document.getElementById('picName').value || 'Koperasi';
      addRow(`(${worker.substring(0, 12)})`, `(${pic.substring(0, 12)})`);

      pushString("--------------------------------\\n");

      // Center Footer Note
      bytes.push(0x1B, 0x61, 0x01);
      pushString((document.getElementById('noteText').value || 'Terima kasih!') + "\\n");
      pushString("--- Simpan bukti ini ---\\n\\n\\n\\n");

      // Feed & Cut
      bytes.push(0x1D, 0x56, 0x42, 0x00);

      return new Uint8Array(bytes);
    }

    function printDirectBluetooth() {
      if (typeof AndroidPrint === 'undefined' || !AndroidPrint.isBluetoothConnected || !AndroidPrint.isBluetoothConnected()) {
        openBluetoothModal();
        alert('Printer Bluetooth belum terhubung! Silakan hubungkan printer di modal terlebih dahulu.');
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
        if (!ok) {
          alert('Gagal mengirim data ke printer Bluetooth.');
        } else {
          closeBluetoothModal();
        }
      } catch (e) {
        alert('Error cetak Bluetooth: ' + e.message);
      }
    }

    function handleMainPrint() {
      if (typeof AndroidPrint !== 'undefined' && AndroidPrint.isBluetoothConnected && AndroidPrint.isBluetoothConnected()) {
        printDirectBluetooth();
      } else {
        openBluetoothModal();
      }
    }

    // Interactive Calculator
    let calcExpr = "";
    function openCalcModal() {
      calcExpr = "0";
      document.getElementById('calcDisplay').value = "0";
      document.getElementById('calcModal').style.display = 'flex';
    }

    function closeCalcModal() {
      document.getElementById('calcModal').style.display = 'none';
    }

    function calcNum(n) {
      if (calcExpr === "0" || calcExpr === "Error") calcExpr = "";
      calcExpr += n;
      document.getElementById('calcDisplay').value = calcExpr;
    }

    function calcOp(op) {
      if (calcExpr === "Error") calcExpr = "0";
      calcExpr += " " + op + " ";
      document.getElementById('calcDisplay').value = calcExpr;
    }

    function calcClear() {
      calcExpr = "0";
      document.getElementById('calcDisplay').value = "0";
    }

    function calcEqual() {
      try {
        const sanitized = calcExpr.replace(/×/g, '*').replace(/÷/g, '/');
        const res = Function('"use strict";return (' + sanitized + ')')();
        calcExpr = res.toString();
        document.getElementById('calcDisplay').value = formatRupiah(res) + " (" + res + ")";
      } catch (e) {
        calcExpr = "Error";
        document.getElementById('calcDisplay').value = "Error";
      }
    }

    function formatRupiah(num) {
      return "Rp " + Number(num || 0).toLocaleString("id-ID");
    }

    function renderItemsInput() {
      // Income Inputs
      const incomeContainer = document.getElementById('incomeItemsContainer');
      incomeContainer.innerHTML = '';

      incomeItems.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'form-row';

        if (workerCategory === "Borongan") {
          row.style.cssText = "flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;";
          row.innerHTML = `
            <div style="flex: 2; min-width: 140px;">
              <label style="font-size: 0.75rem; color: #64748b;">Deskripsi Komponen</label>
              <input type="text" placeholder="Deskripsi" value="${item.desc}" oninput="updateIncomeDesc(${idx}, this.value)">
            </div>
            <div style="flex: 1; min-width: 90px;">
              <label style="font-size: 0.75rem; color: #64748b;">Jumlah (kg)</label>
              <input type="number" placeholder="0" value="${item.weightKg !== undefined ? item.weightKg : ''}" oninput="updateIncomeWeight(${idx}, this.value)">
            </div>
            <div style="flex: 1; min-width: 100px;">
              <label style="font-size: 0.75rem; color: #64748b;">Harga/kg (Rp)</label>
              <input type="number" placeholder="0" value="${item.pricePerKg !== undefined ? item.pricePerKg : ''}" oninput="updateIncomePrice(${idx}, this.value)">
            </div>
            <div style="flex: 1.2; min-width: 110px;">
              <label style="font-size: 0.75rem; color: #64748b;">Total (Rp)</label>
              <input type="text" placeholder="Rp 0" value="${formatRupiah(item.amount)}" readonly style="background: #f1f5f9; font-weight: bold; color: #16a34a;">
            </div>
            <div style="display: flex; align-items: flex-end; padding-top: 1.25rem;">
              <button class="btn btn-danger" onclick="removeIncomeItem(${idx})" title="Hapus">✕</button>
            </div>
          `;
        } else {
          row.innerHTML = `
            <input type="text" placeholder="Deskripsi komponen" value="${item.desc}" oninput="updateIncomeDesc(${idx}, this.value)" style="flex: 2;">
            <input type="number" placeholder="Nominal (Rp)" value="${item.amount}" oninput="updateIncomeAmount(${idx}, this.value)" style="flex: 1.2;">
            <button class="btn btn-danger" onclick="removeIncomeItem(${idx})" title="Hapus">✕</button>
          `;
        }
        incomeContainer.appendChild(row);
      });

      // Deduction Inputs
      const deductionContainer = document.getElementById('deductionItemsContainer');
      deductionContainer.innerHTML = '';
      deductionItems.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'form-row';
        row.innerHTML = `
          <input type="text" placeholder="Deskripsi potongan" value="${item.desc}" oninput="updateDeductionDesc(${idx}, this.value)" style="flex: 2;">
          <input type="number" placeholder="Nominal (Rp)" value="${item.amount}" oninput="updateDeductionAmount(${idx}, this.value)" style="flex: 1.2;">
          <button class="btn btn-danger" onclick="removeDeductionItem(${idx})" title="Hapus">✕</button>
        `;
        deductionContainer.appendChild(row);
      });
    }

    function addIncomeItem() {
      if (workerCategory === "Borongan") {
        incomeItems.push({ desc: "Hasil " + boronganType, weightKg: 0, pricePerKg: 0, amount: 0 });
      } else {
        incomeItems.push({ desc: "Gaji", amount: 0 });
      }
      renderItemsInput();
      updateReceipt();
    }

    function removeIncomeItem(index) {
      incomeItems.splice(index, 1);
      renderItemsInput();
      updateReceipt();
    }

    function updateIncomeDesc(index, val) {
      incomeItems[index].desc = val;
      updateReceipt();
    }

    function updateIncomeAmount(index, val) {
      incomeItems[index].amount = parseFloat(val) || 0;
      updateReceipt();
    }

    function updateIncomeWeight(index, val) {
      const weight = parseFloat(val) || 0;
      incomeItems[index].weightKg = weight;
      const price = incomeItems[index].pricePerKg || 0;
      incomeItems[index].amount = weight * price;
      renderItemsInput();
      updateReceipt();
    }

    function updateIncomePrice(index, val) {
      const price = parseFloat(val) || 0;
      incomeItems[index].pricePerKg = price;
      const weight = incomeItems[index].weightKg || 0;
      incomeItems[index].amount = weight * price;
      renderItemsInput();
      updateReceipt();
    }

    function addDeductionItem() {
      deductionItems.push({ desc: "", amount: 0 });
      renderItemsInput();
      updateReceipt();
    }

    function removeDeductionItem(index) {
      deductionItems.splice(index, 1);
      renderItemsInput();
      updateReceipt();
    }

    function updateDeductionDesc(index, val) {
      deductionItems[index].desc = val;
      updateReceipt();
    }

    function updateDeductionAmount(index, val) {
      deductionItems[index].amount = parseFloat(val) || 0;
      updateReceipt();
    }

    function updateReceipt() {
      // Header & Worker info
      document.getElementById('prevBusinessName').innerText = document.getElementById('businessName').value || 'USAHA ANDA';
      document.getElementById('prevBusinessUnit').innerText = document.getElementById('businessUnit').value || '';
      document.getElementById('prevBusinessAddress').innerText = document.getElementById('businessAddress').value || '';

      document.getElementById('prevRefNo').innerText = document.getElementById('refNo').value || '-';

      const dateVal = document.getElementById('payDate').value;
      if (dateVal) {
        const parts = dateVal.split('-');
        document.getElementById('prevDate').innerText = `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else {
        document.getElementById('prevDate').innerText = '-';
      }

      const worker = document.getElementById('workerName').value || 'Nama Pekerja';
      document.getElementById('prevWorker').innerText = worker;
      document.getElementById('prevSignWorker').innerText = `( ${worker} )`;

      const role = getSelectedRole();
      document.getElementById('prevRole').innerText = role;

      document.getElementById('prevPeriod').innerText = document.getElementById('periodText').value || '-';

      const pic = document.getElementById('picName').value || 'Koperasi';
      document.getElementById('prevSignPic').innerText = `( ${pic} )`;

      document.getElementById('prevPaymentMethod').innerText = document.getElementById('paymentMethod').value;
      document.getElementById('prevNote').innerText = document.getElementById('noteText').value;

      // Calculate totals
      let totalIncome = 0;
      const incomeTable = document.getElementById('prevIncomeTable');
      incomeTable.innerHTML = '';
      incomeItems.forEach(item => {
        totalIncome += (item.amount || 0);
        const tr = document.createElement('tr');

        if (item.weightKg && item.pricePerKg) {
          tr.innerHTML = `
            <td class="col-item">
              <div>${item.desc || 'Item'}</div>
              <div style="font-size: 9px; color: #555;">${item.weightKg} kg x @${formatRupiah(item.pricePerKg)}</div>
            </td>
            <td class="col-val">${formatRupiah(item.amount)}</td>
          `;
        } else {
          tr.innerHTML = `
            <td class="col-item">${item.desc || 'Item'}</td>
            <td class="col-val">${formatRupiah(item.amount)}</td>
          `;
        }
        incomeTable.appendChild(tr);
      });

      let totalDeduction = 0;
      const deductionSec = document.getElementById('prevDeductionSection');
      const deductionTable = document.getElementById('prevDeductionTable');
      deductionTable.innerHTML = '';

      if (deductionItems.length > 0) {
        deductionSec.style.display = 'block';
        deductionItems.forEach(item => {
          totalDeduction += (item.amount || 0);
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="col-item">${item.desc || 'Potongan'}</td>
            <td class="col-val">-${formatRupiah(item.amount)}</td>
          `;
          deductionTable.appendChild(tr);
        });
      } else {
        deductionSec.style.display = 'none';
      }

      const grandTotal = totalIncome - totalDeduction;

      // Update Form Editor Calculation Badges & Summary
      document.getElementById('editorTotalIncome').innerText = formatRupiah(totalIncome);
      document.getElementById('editorTotalDeduction').innerText = "-" + formatRupiah(totalDeduction);

      document.getElementById('sumIncome').innerText = formatRupiah(totalIncome);
      document.getElementById('sumDeduction').innerText = "-" + formatRupiah(totalDeduction);
      document.getElementById('sumGrandTotal').innerText = formatRupiah(grandTotal);

      // Update Receipt Preview Total
      document.getElementById('prevTotal').innerText = formatRupiah(grandTotal);
    }

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW reg error:', err));
      });
    }
  </script>
</body>
</html>
"""

html_final = html_template.replace("WORKERS_JSON_PLACEHOLDER", workers_json_str).replace("REKAP_JSON_PLACEHOLDER", rekap_json_str)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_final)

with open("app/src/main/assets/index.html", "w", encoding="utf-8") as f:
    f.write(html_final)

print("Build Index Python Complete!")
