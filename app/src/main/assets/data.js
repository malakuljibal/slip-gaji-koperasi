// Master Data Koperasi (Diimpor dari Pembukuan & Database Pekerja Koperasi 2025-2026)

const DEFAULT_SETTINGS = {
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

const COA_ACCOUNTS = [
  { code: "402", name: "Beban Upah Pemetik", mode: "borongan_kg", defaultRate: 7000, budget: 780000000, initialRealization: 85604650 },
  { code: "403", name: "Beban Upah Pembersihan (Cudai)", mode: "borongan_kg", defaultRate: 1500, budget: 180000000, initialRealization: 9370146 },
  { code: "404", name: "Beban Upah Pengawas", mode: "harian_hok", defaultRate: 150000, budget: 175000000, initialRealization: 128082000 },
  { code: "405", name: "Beban Upah Penjemur & Packing", mode: "harian_hok", defaultRate: 125000, budget: 60000000, initialRealization: 7500000 },
  { code: "407", name: "Beban Perawatan Lahan (Pemarasan)", mode: "borongan_lahan", defaultRate: 0, budget: 180000000, initialRealization: 210005500 },
  { code: "409", name: "Beban Langsung Lain-lain", mode: "custom", defaultRate: 0, budget: 0, initialRealization: 155026165 },
  { code: "410", name: "Beban Bagi Hasil Masyarakat", mode: "custom", defaultRate: 0, budget: 375000000, initialRealization: 375000000 }
];

const REGU_LIST = [
  "PGWS",
  "Sabua Miring",
  "Sabua Miring 1",
  "Sabua Miring 2",
  "Sabua Miring 3",
  "Sabua Miring 4",
  "LGKP",
  "Due 1",
  "Due 2",
  "Kaki Seribu 1",
  "Kaki Seribu 2",
  "Pengawas Lapangan",
  "Pengawas Cudai",
  "Penjemur",
  "Pengawas Malam",
  "Regu Pemarasan"
];

const INITIAL_WORKERS = [
  // Borongan Pemetik - PGWS
  { id: "W001", name: "Alfiki Paputungan", role: "Borongan Pemetik", regu: "PGWS", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W002", name: "Akmaludin Tombo", role: "Borongan Pemetik", regu: "PGWS", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W003", name: "Wahyudin Paputungan", role: "Borongan Pemetik", regu: "PGWS", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W004", name: "Malik Paputungan", role: "Borongan Pemetik", regu: "PGWS", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W005", name: "Alvin Paputungan", role: "Borongan Pemetik", regu: "PGWS", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W006", name: "Fajrin Paputungan", role: "Borongan Pemetik", regu: "PGWS", scheme: "Borongan", rate: 7000, status: "Aktif" },

  // Borongan Pemetik - Sabua Miring
  { id: "W007", name: "Iki", role: "Borongan Pemetik", regu: "Sabua Miring", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W008", name: "Yaya", role: "Borongan Pemetik", regu: "Sabua Miring", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W009", name: "Yudi", role: "Borongan Pemetik", regu: "Sabua Miring", scheme: "Borongan", rate: 7000, status: "Aktif" },

  // Borongan Pemetik - LGKP
  { id: "W010", name: "Darman", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W011", name: "Amran", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W012", name: "Heru", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W013", name: "Sastra", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W014", name: "Gusti", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W015", name: "Nugi", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W016", name: "Adil", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W017", name: "Tian", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W018", name: "Daffa", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W019", name: "Agung", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W020", name: "Rehan", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W021", name: "Begi", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W022", name: "Mama Acin", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W023", name: "Mama Tar", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W024", name: "Mama Tina", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W025", name: "Fandi", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W026", name: "Papa Dian", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W027", name: "Deni", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W028", name: "Acin", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W029", name: "Adnan", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W030", name: "Dalin", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W031", name: "Yudi (LGKP)", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W032", name: "Dandi", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W033", name: "Salman", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W034", name: "Asis", role: "Borongan Pemetik", regu: "LGKP", scheme: "Borongan", rate: 7000, status: "Aktif" },

  // Due 1 & Due 2
  { id: "W035", name: "Rako", role: "Borongan Pemetik", regu: "Due 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W036", name: "Om Deni", role: "Borongan Pemetik", regu: "Due 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W037", name: "Aldo", role: "Borongan Pemetik", regu: "Due 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W038", name: "Alfred", role: "Borongan Pemetik", regu: "Due 2", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W039", name: "Boy", role: "Borongan Pemetik", regu: "Due 2", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W040", name: "Jems", role: "Borongan Pemetik", regu: "Due 2", scheme: "Borongan", rate: 7000, status: "Aktif" },

  // Sabua Miring 1
  { id: "W041", name: "Alan", role: "Borongan Pemetik", regu: "Sabua Miring 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W042", name: "Opal", role: "Borongan Pemetik", regu: "Sabua Miring 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W043", name: "Amin", role: "Borongan Pemetik", regu: "Sabua Miring 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W044", name: "Gilang", role: "Borongan Pemetik", regu: "Sabua Miring 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W045", name: "Ka Undu", role: "Borongan Pemetik", regu: "Sabua Miring 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W046", name: "Lendy", role: "Borongan Pemetik", regu: "Sabua Miring 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W047", name: "Ako", role: "Borongan Pemetik", regu: "Sabua Miring 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W048", name: "Alis", role: "Borongan Pemetik", regu: "Sabua Miring 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W049", name: "NENEK", role: "Borongan Pemetik", regu: "Sabua Miring 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W050", name: "Omin", role: "Borongan Pemetik", regu: "Sabua Miring 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W051", name: "Tutun", role: "Borongan Pemetik", regu: "Sabua Miring 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W052", name: "Dandi (SM1)", role: "Borongan Pemetik", regu: "Sabua Miring 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W053", name: "Yapin", role: "Borongan Pemetik", regu: "Sabua Miring 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W054", name: "Gina", role: "Borongan Pemetik", regu: "Sabua Miring 1", scheme: "Borongan", rate: 7000, status: "Aktif" },

  // Sabua Miring 2
  { id: "W055", name: "Iyal", role: "Borongan Pemetik", regu: "Sabua Miring 2", scheme: "Borongan", rate: 7000, status: "Non-Aktif" },
  { id: "W056", name: "Riyan", role: "Borongan Pemetik", regu: "Sabua Miring 2", scheme: "Borongan", rate: 7000, status: "Non-Aktif" },
  { id: "W057", name: "Saprian", role: "Borongan Pemetik", regu: "Sabua Miring 2", scheme: "Borongan", rate: 7000, status: "Non-Aktif" },

  // Sabua Miring 3
  { id: "W058", name: "Dolpi", role: "Borongan Pemetik", regu: "Sabua Miring 3", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W059", name: "Alex", role: "Borongan Pemetik", regu: "Sabua Miring 3", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W060", name: "Male", role: "Borongan Pemetik", regu: "Sabua Miring 3", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W061", name: "Maikel", role: "Borongan Pemetik", regu: "Sabua Miring 3", scheme: "Borongan", rate: 7000, status: "Aktif" },

  // Kaki Seribu 1 & 2
  { id: "W062", name: "Bojes", role: "Borongan Pemetik", regu: "Kaki Seribu 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W063", name: "Jun", role: "Borongan Pemetik", regu: "Kaki Seribu 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W064", name: "Handi", role: "Borongan Pemetik", regu: "Kaki Seribu 1", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W065", name: "Bobon", role: "Borongan Pemetik", regu: "Kaki Seribu 2", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W066", name: "Ray", role: "Borongan Pemetik", regu: "Kaki Seribu 2", scheme: "Borongan", rate: 7000, status: "Aktif" },
  { id: "W067", name: "Oni", role: "Borongan Pemetik", regu: "Kaki Seribu 2", scheme: "Borongan", rate: 7000, status: "Aktif" },

  // Pengawas Lapangan
  { id: "W068", name: "Papa Obay", role: "Pengawas Lapangan", regu: "Pengawas Lapangan", scheme: "Harian", rate: 150000, status: "Aktif" },
  { id: "W069", name: "Papa Rara", role: "Pengawas Lapangan", regu: "Pengawas Lapangan", scheme: "Harian", rate: 150000, status: "Aktif" },
  { id: "W070", name: "Papa Aca", role: "Pengawas Lapangan", regu: "Pengawas Lapangan", scheme: "Harian", rate: 150000, status: "Aktif" },
  { id: "W071", name: "Papa Eva", role: "Pengawas Lapangan", regu: "Pengawas Lapangan", scheme: "Harian", rate: 150000, status: "Aktif" },
  { id: "W072", name: "Musripan Paputungan", role: "Pengawas Lapangan", regu: "Pengawas Lapangan", scheme: "Harian", rate: 150000, status: "Aktif" },
  { id: "W073", name: "Alfiki Paputungan (Pengawas)", role: "Pengawas Lapangan", regu: "Pengawas Lapangan", scheme: "Harian", rate: 150000, status: "Aktif" },
  { id: "W074", name: "Malik Paputungan (Pengawas)", role: "Pengawas Lapangan", regu: "Pengawas Lapangan", scheme: "Harian", rate: 150000, status: "Aktif" },

  // Pengawas Cudai
  { id: "W075", name: "Anis Bapuli", role: "Pengawas Cudai", regu: "Pengawas Cudai", scheme: "Harian", rate: 125000, status: "Aktif" },
  { id: "W076", name: "Moh Yakob Botutihe", role: "Pengawas Cudai", regu: "Pengawas Cudai", scheme: "Harian", rate: 125000, status: "Aktif" },
  { id: "W077", name: "Acong Paputungan", role: "Pengawas Cudai", regu: "Pengawas Cudai", scheme: "Harian", rate: 125000, status: "Aktif" },
  { id: "W078", name: "Papa Agil", role: "Pengawas Cudai", regu: "Pengawas Cudai", scheme: "Harian", rate: 125000, status: "Aktif" },
  { id: "W079", name: "Etin Paputungan", role: "Pengawas Cudai", regu: "Pengawas Cudai", scheme: "Harian", rate: 125000, status: "Aktif" },
  { id: "W080", name: "Papa Wira", role: "Pengawas Cudai", regu: "Pengawas Cudai", scheme: "Harian", rate: 125000, status: "Aktif" },

  // Penjemur
  { id: "W081", name: "Ridho Paputungan", role: "Penjemur", regu: "Penjemur", scheme: "Harian", rate: 125000, status: "Aktif" },
  { id: "W082", name: "Dandi Huntua", role: "Penjemur", regu: "Penjemur", scheme: "Harian", rate: 125000, status: "Aktif" },
  { id: "W083", name: "Iki Paputungan", role: "Penjemur", regu: "Penjemur", scheme: "Harian", rate: 125000, status: "Aktif" },

  // Pengawas Malam
  { id: "W084", name: "Sariin", role: "Pengawas Malam", regu: "Pengawas Malam", scheme: "Harian", rate: 125000, status: "Aktif" },
  { id: "W085", name: "Rahman Sinalaan", role: "Pengawas Malam", regu: "Pengawas Malam", scheme: "Harian", rate: 125000, status: "Aktif" },
  { id: "W086", name: "Edu", role: "Pengawas Malam", regu: "Pengawas Malam", scheme: "Harian", rate: 125000, status: "Aktif" },

  // Ketua Regu Borongan Pemarasan
  { id: "W087", name: "Gifari Potabuga", role: "Ketua Regu Pemarasan", regu: "Regu Pemarasan", scheme: "Borongan", rate: 0, status: "Aktif" },
  { id: "W088", name: "Samlan Paputungan", role: "Ketua Regu Pemarasan", regu: "Regu Pemarasan", scheme: "Borongan", rate: 0, status: "Aktif" },
  { id: "W089", name: "Maikel Losung", role: "Ketua Regu Pemarasan", regu: "Regu Pemarasan", scheme: "Borongan", rate: 0, status: "Aktif" },
  { id: "W090", name: "Zulkarnain Kaumpungan", role: "Ketua Regu Pemarasan", regu: "Regu Pemarasan", scheme: "Borongan", rate: 0, status: "Aktif" },
  { id: "W091", name: "Kartono", role: "Ketua Regu Pemarasan", regu: "Regu Pemarasan", scheme: "Borongan", rate: 0, status: "Aktif" },
  { id: "W092", name: "Sofyan Ali", role: "Ketua Regu Pemarasan", regu: "Regu Pemarasan", scheme: "Borongan", rate: 0, status: "Aktif" },
  { id: "W093", name: "Adonan Mokodompit", role: "Ketua Regu Pemarasan", regu: "Regu Pemarasan", scheme: "Borongan", rate: 0, status: "Aktif" },
  { id: "W094", name: "Abraham", role: "Ketua Regu Pemarasan", regu: "Regu Pemarasan", scheme: "Borongan", rate: 0, status: "Aktif" },
  { id: "W095", name: "Abdulah", role: "Ketua Regu Pemarasan", regu: "Regu Pemarasan", scheme: "Borongan", rate: 0, status: "Aktif" },
  { id: "W096", name: "Roy Tangahu", role: "Ketua Regu Pemarasan", regu: "Regu Pemarasan", scheme: "Borongan", rate: 0, status: "Aktif" },
  { id: "W097", name: "Papa Randi", role: "Ketua Regu Pemarasan", regu: "Regu Pemarasan", scheme: "Borongan", rate: 0, status: "Aktif" },
  { id: "W098", name: "Papa Patra", role: "Ketua Regu Pemarasan", regu: "Regu Pemarasan", scheme: "Borongan", rate: 0, status: "Aktif" }
];
