const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// ============ DATA REFERENSI ============
const POLDA_LIST = [
  { kode: 'POLDA-METRO', nama: 'Polda Metro Jaya' },
  { kode: 'POLDA-JABAR', nama: 'Polda Jawa Barat' },
  { kode: 'POLDA-JATENG', nama: 'Polda Jawa Tengah' },
  { kode: 'POLDA-JATIM', nama: 'Polda Jawa Timur' },
  { kode: 'POLDA-BANTEN', nama: 'Polda Banten' },
  { kode: 'POLDA-DIY', nama: 'Polda D.I. Yogyakarta' },
  { kode: 'POLDA-BALI', nama: 'Polda Bali' },
  { kode: 'POLDA-NTB', nama: 'Polda Nusa Tenggara Barat' },
  { kode: 'POLDA-NTT', nama: 'Polda Nusa Tenggara Timur' },
  { kode: 'POLDA-ACEH', nama: 'Polda Aceh' },
  { kode: 'POLDA-SUMUT', nama: 'Polda Sumatera Utara' },
  { kode: 'POLDA-SUMBAR', nama: 'Polda Sumatera Barat' },
  { kode: 'POLDA-RIAU', nama: 'Polda Riau' },
  { kode: 'POLDA-KEPRI', nama: 'Polda Kepulauan Riau' },
  { kode: 'POLDA-JAMBI', nama: 'Polda Jambi' },
  { kode: 'POLDA-BENGKULU', nama: 'Polda Bengkulu' },
  { kode: 'POLDA-SUMSEL', nama: 'Polda Sumatera Selatan' },
  { kode: 'POLDA-BABEL', nama: 'Polda Kepulauan Bangka Belitung' },
  { kode: 'POLDA-LAMPUNG', nama: 'Polda Lampung' },
  { kode: 'POLDA-KALBAR', nama: 'Polda Kalimantan Barat' },
  { kode: 'POLDA-KALSEL', nama: 'Polda Kalimantan Selatan' },
  { kode: 'POLDA-KALTENG', nama: 'Polda Kalimantan Tengah' },
  { kode: 'POLDA-KALTIM', nama: 'Polda Kalimantan Timur' },
  { kode: 'POLDA-KALTARA', nama: 'Polda Kalimantan Utara' },
  { kode: 'POLDA-SULUT', nama: 'Polda Sulawesi Utara' },
  { kode: 'POLDA-GORONTALO', nama: 'Polda Gorontalo' },
  { kode: 'POLDA-SULTENG', nama: 'Polda Sulawesi Tengah' },
  { kode: 'POLDA-SULBAR', nama: 'Polda Sulawesi Barat' },
  { kode: 'POLDA-SULSEL', nama: 'Polda Sulawesi Selatan' },
  { kode: 'POLDA-SULTRA', nama: 'Polda Sulawesi Tenggara' },
  { kode: 'POLDA-MALUKU', nama: 'Polda Maluku' },
  { kode: 'POLDA-MALUT', nama: 'Polda Maluku Utara' },
  { kode: 'POLDA-PAPUA', nama: 'Polda Papua' },
  { kode: 'POLDA-PAPBAR', nama: 'Polda Papua Barat' }
];

const SATKER_MABES = [
  { kode: 'SSDM', nama: 'SSDM Polri' },
  { kode: 'DIVHUMAS', nama: 'Divisi Humas Polri' },
  { kode: 'BARESKRIM', nama: 'Bareskrim Polri' },
  { kode: 'KORLANTAS', nama: 'Korlantas Polri' },
  { kode: 'DENSUS88', nama: 'Densus 88 AT Polri' },
  { kode: 'BAHARKAM', nama: 'Baharkam Polri' },
  { kode: 'LEMDIKLAT', nama: 'Lemdiklat Polri' },
  { kode: 'PUSDOKKES', nama: 'Pusdokkes Polri' },
  { kode: 'PUSKEU', nama: 'Puskeu Polri' },
  { kode: 'SLOG', nama: 'Slog Polri' },
  { kode: 'SOPS', nama: 'Sops Polri' }
];

const PANGKAT_LIST = [
  { pangkat: 'Bharada', golongan: 'Bintara', berat: 15 },
  { pangkat: 'Bharatu', golongan: 'Bintara', berat: 10 },
  { pangkat: 'Bharaka', golongan: 'Bintara', berat: 8 },
  { pangkat: 'Bripda', golongan: 'Bintara', berat: 10 },
  { pangkat: 'Briptu', golongan: 'Bintara', berat: 10 },
  { pangkat: 'Brigadir', golongan: 'Bintara', berat: 8 },
  { pangkat: 'Bripka', golongan: 'Bintara', berat: 7 },
  { pangkat: 'Aipda', golongan: 'Bintara', berat: 5 },
  { pangkat: 'Aiptu', golongan: 'Bintara', berat: 5 },
  { pangkat: 'Ipda', golongan: 'Perwira Pertama', berat: 4 },
  { pangkat: 'Iptu', golongan: 'Perwira Pertama', berat: 4 },
  { pangkat: 'AKP', golongan: 'Perwira Pertama', berat: 3 },
  { pangkat: 'Kompol', golongan: 'Perwira Menengah', berat: 3 },
  { pangkat: 'AKBP', golongan: 'Perwira Menengah', berat: 3 },
  { pangkat: 'Kombes', golongan: 'Perwira Menengah', berat: 2 },
  { pangkat: 'Brigjen', golongan: 'Perwira Tinggi', berat: 1 },
  { pangkat: 'Irjen', golongan: 'Perwira Tinggi', berat: 1 }
];

const PANGKAT_ASN = [
  'PENGATUR TINGKAT A', 'PENGATUR TINGKAT B', 'PENGATUR MUDA',
  'PENATA MUDA', 'PENATA MUDA TINGKAT I', 'PENATA', 'PENATA TINGKAT I',
  'PEMBINA', 'PEMBINA TINGKAT I', 'PEMBINA MUDA'
];

const NAMA_DEPAN_L = ['Budi', 'Andi', 'Agus', 'Bambang', 'Hendra', 'Joko', 'Rudi', 'Dedi', 'Eko', 'Fajar', 'Gunawan', 'Hadi', 'Irfan', 'Krisna', 'Lukman', 'Maulana', 'Nanda', 'Oki', 'Putra', 'Rizki', 'Sandi', 'Taufik', 'Umar', 'Wahyu', 'Yudi'];
const NAMA_DEPAN_P = ['Ani', 'Siti', 'Dewi', 'Rina', 'Maya', 'Fitri', 'Gita', 'Hana', 'Indah', 'Kartika', 'Lestari', 'Mega', 'Nia', 'Olivia', 'Putri', 'Ratna', 'Sari', 'Tiara', 'Utami', 'Wulan', 'Yuni', 'Zahra'];
const NAMA_BELAKANG = ['Santoso', 'Wijaya', 'Pratama', 'Lubis', 'Sutrisno', 'Gunawan', 'Maulana', 'Nugroho', 'Setiawan', 'Kurniawan', 'Hidayat', 'Firmansyah', 'Simanjuntak', 'Siregar', 'Harahap', 'Situmorang', 'Pratama', 'Wibowo', 'Susanto', 'Halim', 'Purnomo', 'Ramadhan'];

const KOTA_LIST = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang', 'Medan', 'Palembang', 'Makassar', 'Denpasar', 'Bogor', 'Malang', 'Padang', 'Balikpapan', 'Manado', 'Pontianak', 'Banjarmasin', 'Samarinda', 'Pekanbaru', 'Batam', 'Ambon'];

const JABATAN_LIST = [
  { jabatan: 'Anggota Unit Patroli', fungsi: 'Operasional', nivelering: 5 },
  { jabatan: 'Bamin', fungsi: 'Administrasi', nivelering: 6 },
  { jabatan: 'Kanit Reskrim', fungsi: 'Reserse', nivelering: 10 },
  { jabatan: 'Kanit Lantas', fungsi: 'Lalu Lintas', nivelering: 10 },
  { jabatan: 'Kapolsek', fungsi: 'Kepemimpinan', nivelering: 15 },
  { jabatan: 'Kasat Reskrim', fungsi: 'Reserse', nivelering: 18 },
  { jabatan: 'Kabag Ops', fungsi: 'Operasional', nivelering: 20 },
  { jabatan: 'Wakapolres', fungsi: 'Kepemimpinan', nivelering: 25 },
  { jabatan: 'Kapolres', fungsi: 'Kepemimpinan', nivelering: 28 }
];

const PENDIDIKAN_LIST = [
  { jenis: 'PENDIDIKAN', nama: 'SMA Negeri', institusi: 'Sekolah Menengah Atas' },
  { jenis: 'PENDIDIKAN', nama: 'D3 Manajemen', institusi: 'Universitas Terbuka' },
  { jenis: 'PENDIDIKAN', nama: 'S1 Hukum', institusi: 'Universitas Indonesia' },
  { jenis: 'PENDIDIKAN', nama: 'S1 Akuntansi', institusi: 'Universitas Padjajaran' },
  { jenis: 'PENDIDIKAN', nama: 'S2 Manajemen', institusi: 'STIE Jakarta' },
  { jenis: 'DIKLAT', nama: 'Diklatsar Bintara', institusi: 'SPN Polda' },
  { jenis: 'DIKLAT', nama: 'Diklat Lanjutan Reserse', institusi: 'Lemdiklat Polri' },
  { jenis: 'DIKLAT', nama: 'Sespimti', institusi: 'Sespim Lemdiklat Polri' },
  { jenis: 'DIKLAT', nama: 'Sespimmen', institusi: 'Sespim Lemdiklat Polri' },
  { jenis: 'DIKLAT', nama: 'Diklat Pengembangan Karakter', institusi: 'Pusdiklat' }
];

// ============ UTILITY FUNCTIONS ============
function pilihBobot(list) {
  const totalBobot = list.reduce((sum, item) => sum + item.berat, 0);
  let random = Math.random() * totalBobot;
  for (const item of list) {
    random -= item.berat;
    if (random <= 0) return item;
  }
  return list[list.length - 1];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPilih(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNRP(index) {
  const tahun = randomInt(1970, 2000);
  const bulan = String(randomInt(1, 12)).padStart(2, '0');
  const urut = String(index).padStart(6, '0');
  return tahun + bulan + urut;
}

function generateNIK(index) {
  const kodeWilayah = '3171' + String(randomInt(10, 99));
  const tanggalLahir = String(randomInt(1, 28)).padStart(2, '0') + String(randomInt(1, 12)).padStart(2, '0') + randomInt(70, 99);
  const urut = String(index).padStart(4, '0');
  return kodeWilayah + tanggalLahir + urut;
}

function generateTanggalLahir() {
  const tahun = randomInt(1962, 2002);
  const bulan = randomInt(1, 12);
  const hari = randomInt(1, 28);
  return new Date(tahun, bulan - 1, hari);
}

// ============ MAIN SEED FUNCTION ============
async function main() {
  console.log('Memulai proses seeding...\n');

  // === 1. SEED SATKER ===
  console.log('1. Membuat Satker...');
  const semuaSatker = [];
  for (const s of POLDA_LIST) {
    const satker = await prisma.satker.upsert({
      where: { kode: s.kode }, update: {},
      create: { kode: s.kode, nama: s.nama }
    });
    semuaSatker.push(satker);
  }
  for (const s of SATKER_MABES) {
    const satker = await prisma.satker.upsert({
      where: { kode: s.kode }, update: {},
      create: { kode: s.kode, nama: s.nama }
    });
    semuaSatker.push(satker);
  }
  console.log('   ✔️ ' + semuaSatker.length + ' Satker dibuat\n');

  // === 2. SEED USER ===
  console.log('2. Membuat User default...');
  await prisma.user.upsert({
    where: { username: 'admin' }, update: {},
    create: {
      username: 'admin', password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN', email: 'admin@ssdm.polri.go.id'
    }
  });
  const poldaMetro = semuaSatker.find(s => s.kode === 'POLDA-METRO');
  await prisma.user.upsert({
    where: { username: 'operator' }, update: {},
    create: {
      username: 'operator', password: await bcrypt.hash('operator123', 10),
      role: 'OPERATOR', satkerId: poldaMetro.id, email: 'operator@polda.polri.go.id'
    }
  });
  console.log('   ✔️ 2 User dibuat (admin, operator)\n');

  // === 3. GENERATE 150 PERSONEL ===
  console.log('3. Generate 150 Personel...');
  const JUMLAH_PERSONEL = 150;
  let counter = 1;
  const personelIds = [];

  for (let i = 0; i < JUMLAH_PERSONEL; i++) {
    const jenisKelamin = Math.random() < 0.7 ? 'Laki-laki' : 'Perempuan';
    const namaDepan = jenisKelamin === 'Laki-laki' ? randomPilih(NAMA_DEPAN_L) : randomPilih(NAMA_DEPAN_P);
    const namaBelakang = randomPilih(NAMA_BELAKANG);
    const nama = namaDepan + ' ' + namaBelakang;

    const jenisPersonel = Math.random() < 0.85 ? 'POLRI' : 'ASN';
    let pangkat;
    let tingkatPendidikan;

    if (jenisPersonel === 'POLRI') {
      pangkat = pilihBobot(PANGKAT_LIST).pangkat;
      tingkatPendidikan = randomPilih(['SMA', 'SMA', 'D3', 'D4/S1', 'D4/S1', 'S2']);
    } else {
      pangkat = randomPilih(PANGKAT_ASN);
      tingkatPendidikan = randomPilih(['SMA', 'D3', 'D4/S1', 'S2']);
    }

    const satker = randomPilih(semuaSatker);
    const statusRandom = Math.random();
    const statusPersonel = statusRandom < 0.9 ? 'AKTIF' : 'PENSIUN';

    const dataPersonel = {
      nama: nama,
      nrp: generateNRP(counter),
      nik: generateNIK(counter),
      pangkat: pangkat,
      jenisKelamin: jenisKelamin,
      jenisPersonel: jenisPersonel,
      tempatLahir: randomPilih(KOTA_LIST),
      tanggalLahir: generateTanggalLahir(),
      email: nama.toLowerCase().replace(/\s+/g, '.') + counter + '@polri.go.id',
      tingkatPendidikan: tingkatPendidikan,
      statusPersonel: statusPersonel,
      pernahDiklat: Math.random() < 0.6 ? 'Pernah diklat' : 'Belum pernah diklat',
      satkerId: satker.id
    };

    const personel = await prisma.personel.create({ data: dataPersonel });
    personelIds.push(personel.id);
    counter++;

    if ((i + 1) % 25 === 0) {
      console.log('   ... ' + (i + 1) + ' personel dibuat');
    }
  }
  console.log('   ✔️ ' + JUMLAH_PERSONEL + ' Personel berhasil dibuat\n');

  // === 4. GENERATE RIWAYAT JABATAN ===
  console.log('4. Generate Riwayat Jabatan...');
  let totalRiwayat = 0;
  for (const personelId of personelIds) {
    const jumlahRiwayat = randomInt(1, 3);
    for (let j = 0; j < jumlahRiwayat; j++) {
      const jabatanInfo = JABATAN_LIST[Math.min(j + randomInt(0, 2), JABATAN_LIST.length - 1)];
      const tahunMulai = 2010 + (j * 4) + randomInt(0, 2);
      const tahunBerakhir = j === jumlahRiwayat - 1 ? null : tahunMulai + 4;

      const personel = await prisma.personel.findUnique({ where: { id: personelId } });

      await prisma.riwayatJabatan.create({
        data: {
          personelId: personelId,
          jabatan: jabatanInfo.jabatan,
          satkerId: personel.satkerId,
          fungsi: jabatanInfo.fungsi,
          tanggalMulai: new Date(tahunMulai, 0, 1),
          tanggalBerakhir: tahunBerakhir ? new Date(tahunBerakhir, 11, 31) : null,
          nivelering: jabatanInfo.nivelering,
          statusJabatan: tahunBerakhir ? 'NONAKTIF' : 'AKTIF',
          keterangan: tahunBerakhir ? 'Selesai menjabat' : 'Jabatan saat ini'
        }
      });
      totalRiwayat++;
    }
  }
  console.log('   ✔️ ' + totalRiwayat + ' Riwayat Jabatan dibuat\n');

  // === 5. GENERATE PENDIDIKAN & DIKLAT ===
  console.log('5. Generate Pendidikan & Diklat...');
  let totalPendidikan = 0;
  for (const personelId of personelIds) {
    const jumlahPendidikan = randomInt(1, 3);
    const terpilih = [];
    while (terpilih.length < jumlahPendidikan) {
      const p = randomPilih(PENDIDIKAN_LIST);
      if (!terpilih.find(t => t.nama === p.nama)) terpilih.push(p);
    }
    for (const p of terpilih) {
      await prisma.pendidikan.create({
        data: {
          personelId: personelId,
          jenis: p.jenis,
          nama: p.nama,
          institusi: p.institusi,
          tahunLulus: randomInt(2005, 2024),
          keterangan: p.jenis === 'PENDIDIKAN' ? 'Ijazah resmi' : 'Sertifikat diklat'
        }
      });
      totalPendidikan++;
    }
  }
  console.log('   ✔️ ' + totalPendidikan + ' Data Pendidikan/Diklat dibuat\n');

  console.log('========================================');
  console.log('  SEEDING SELESAI!');
  console.log('========================================');
  console.log('  Total Satker      : ' + semuaSatker.length);
  console.log('  Total Personel    : ' + JUMLAH_PERSONEL);
  console.log('  Total Riwayat     : ' + totalRiwayat);
  console.log('  Total Pendidikan  : ' + totalPendidikan);
  console.log('========================================');
}

main()
  .catch(e => {
    console.error('Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });