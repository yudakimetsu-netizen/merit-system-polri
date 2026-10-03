require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// ---------- Middleware ----------
const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Akses ditolak' });
  }
  next();
};

const cekSatker = (user, satkerId) => {
  if (user.role === 'ADMIN') return true;
  return user.satkerId === satkerId;
};

// ---------- Validasi ----------
const personelSchema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  nrp: z.string().regex(/^\d{6,18}$/, 'NRP harus 6-18 digit angka'),
  nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit angka').optional().nullable().or(z.literal('')),
  pangkat: z.string().min(2, 'Pangkat minimal 2 karakter'),
  jenisKelamin: z.enum(['Laki-laki', 'Perempuan']).optional().nullable(),
  jenisPersonel: z.enum(['POLRI', 'ASN']).optional().nullable(),
  tempatLahir: z.string().min(3, 'Tempat lahir minimal 3 karakter'),
  tanggalLahir: z.coerce.date().refine(d => d <= new Date(), 'Tanggal lahir tidak boleh masa depan'),
  email: z.string().email('Format email tidak valid').optional().nullable().or(z.literal('')),
  tingkatPendidikan: z.enum(['SD', 'SMP', 'SMA', 'D3', 'D4/S1', 'S2', 'S3']).optional().nullable(),
  statusPersonel: z.enum(['AKTIF', 'PENSIUN', 'NONAKTIF']).optional().default('AKTIF'),
  pernahDiklat: z.string().optional().nullable(),
  satkerId: z.number().int().positive('Satker ID harus angka positif')
});

const personelUpdateSchema = personelSchema.partial();

const riwayatBaseSchema = z.object({
  jabatan: z.string().min(3, 'Jabatan minimal 3 karakter'),
  satkerId: z.number().int().positive('Satker ID harus angka positif'),
  fungsi: z.string().min(3, 'Fungsi minimal 3 karakter'),
  tanggalMulai: z.coerce.date(),
  tanggalBerakhir: z.coerce.date().nullable().optional(),
  nivelering: z.number().int().min(1).max(99),
  statusJabatan: z.enum(['AKTIF', 'NONAKTIF']),
  keterangan: z.string().optional()
});

const riwayatSchema = riwayatBaseSchema.refine(
  data => !data.tanggalBerakhir || data.tanggalBerakhir >= data.tanggalMulai,
  { message: 'Tanggal berakhir harus >= tanggal mulai', path: ['tanggalBerakhir'] }
);

const riwayatUpdateSchema = riwayatBaseSchema.partial();

// ---------- Auth ----------
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ message: 'Username/password salah' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Username/password salah' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, satkerId: user.satkerId },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token });
  } catch (e) { next(e); }
});

// ---------- Personel ----------
app.get('/api/personel', auth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const where = {};

    if (req.user.role === 'OPERATOR') where.satkerId = req.user.satkerId;
    if (req.query.nama) where.nama = { contains: req.query.nama };
    if (req.query.satkerId) {
      const sid = parseInt(req.query.satkerId);
      if (req.user.role === 'OPERATOR' && sid !== req.user.satkerId) {
        return res.status(403).json({ message: 'Akses ditolak' });
      }
      where.satkerId = sid;
    }

    const [data, total] = await Promise.all([
      prisma.personel.findMany({
        where, skip, take: limit,
        include: { satker: true },
        orderBy: { nama: 'asc' }
      }),
      prisma.personel.count({ where })
    ]);

    res.json({
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (e) { next(e); }
});

app.post('/api/personel', auth, async (req, res, next) => {
  try {
    const data = personelSchema.parse(req.body);
    if (req.user.role === 'OPERATOR' && data.satkerId !== req.user.satkerId) {
      return res.status(403).json({ message: 'Operator hanya boleh menambah personel di satker sendiri' });
    }
    const personel = await prisma.personel.create({ data });
    res.status(201).json(personel);
  } catch (e) { next(e); }
});

app.get('/api/personel/:id', auth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const personel = await prisma.personel.findUnique({
      where: { id },
      include: {
        satker: true,
        riwayat: {
          include: { satker: true },
          orderBy: { tanggalMulai: 'desc' }
        }
      }
    });
    if (!personel) return res.status(404).json({ message: 'Personel tidak ditemukan' });
    if (!cekSatker(req.user, personel.satkerId)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }
    res.json(personel);
  } catch (e) { next(e); }
});

app.put('/api/personel/:id', auth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.personel.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Personel tidak ditemukan' });
    if (!cekSatker(req.user, existing.satkerId)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    const data = personelUpdateSchema.parse(req.body);
    if (req.user.role === 'OPERATOR' && data.satkerId && data.satkerId !== req.user.satkerId) {
      return res.status(403).json({ message: 'Operator hanya boleh mengubah ke satker sendiri' });
    }

    const updated = await prisma.personel.update({ where: { id }, data });
    res.json(updated);
  } catch (e) { next(e); }
});

app.delete('/api/personel/:id', auth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.personel.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Personel tidak ditemukan' });
    if (!cekSatker(req.user, existing.satkerId)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }
    await prisma.personel.delete({ where: { id } });
    res.json({ message: 'Personel berhasil dihapus' });
  } catch (e) { next(e); }
});

// ---------- Riwayat Jabatan ----------
app.get('/api/personel/:id/riwayat', auth, async (req, res, next) => {
  try {
    const personelId = parseInt(req.params.id);
    const personel = await prisma.personel.findUnique({ where: { id: personelId } });
    if (!personel) return res.status(404).json({ message: 'Personel tidak ditemukan' });
    if (!cekSatker(req.user, personel.satkerId)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    const riwayat = await prisma.riwayatJabatan.findMany({
      where: { personelId },
      include: { satker: true },
      orderBy: { tanggalMulai: 'desc' }
    });
    res.json(riwayat);
  } catch (e) { next(e); }
});

app.post('/api/personel/:id/riwayat', auth, async (req, res, next) => {
  try {
    const personelId = parseInt(req.params.id);
    const personel = await prisma.personel.findUnique({ where: { id: personelId } });
    if (!personel) return res.status(404).json({ message: 'Personel tidak ditemukan' });
    if (!cekSatker(req.user, personel.satkerId)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    const data = riwayatSchema.parse(req.body);
    if (req.user.role === 'OPERATOR' && data.satkerId !== req.user.satkerId) {
      return res.status(403).json({ message: 'Operator hanya boleh menambah riwayat di satker sendiri' });
    }

    const riwayat = await prisma.riwayatJabatan.create({
      data: { ...data, personelId }
    });
    res.status(201).json(riwayat);
  } catch (e) { next(e); }
});

app.put('/api/personel/:id/riwayat/:riwayatId', auth, async (req, res, next) => {
  try {
    const personelId = parseInt(req.params.id);
    const riwayatId = parseInt(req.params.riwayatId);

    const riwayat = await prisma.riwayatJabatan.findUnique({
      where: { id: riwayatId },
      include: { personel: true }
    });
    if (!riwayat || riwayat.personelId !== personelId) {
      return res.status(404).json({ message: 'Riwayat tidak ditemukan' });
    }
    if (!cekSatker(req.user, riwayat.personel.satkerId)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    const data = riwayatUpdateSchema.parse(req.body);
    if (req.user.role === 'OPERATOR' && data.satkerId && data.satkerId !== req.user.satkerId) {
      return res.status(403).json({ message: 'Operator hanya boleh mengubah riwayat ke satker sendiri' });
    }

    const newTanggalMulai = data.tanggalMulai || riwayat.tanggalMulai;
    const newTanggalBerakhir = data.tanggalBerakhir !== undefined ? data.tanggalBerakhir : riwayat.tanggalBerakhir;
    if (newTanggalBerakhir && newTanggalBerakhir < newTanggalMulai) {
      return res.status(400).json({ message: 'Tanggal berakhir harus >= tanggal mulai' });
    }

    const updated = await prisma.riwayatJabatan.update({
      where: { id: riwayatId },
      data
    });
    res.json(updated);
  } catch (e) { next(e); }
});

app.delete('/api/personel/:id/riwayat/:riwayatId', auth, async (req, res, next) => {
  try {
    const personelId = parseInt(req.params.id);
    const riwayatId = parseInt(req.params.riwayatId);

    const riwayat = await prisma.riwayatJabatan.findUnique({
      where: { id: riwayatId },
      include: { personel: true }
    });
    if (!riwayat || riwayat.personelId !== personelId) {
      return res.status(404).json({ message: 'Riwayat tidak ditemukan' });
    }
    if (!cekSatker(req.user, riwayat.personel.satkerId)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    await prisma.riwayatJabatan.delete({ where: { id: riwayatId } });
    res.json({ message: 'Riwayat berhasil dihapus' });
  } catch (e) { next(e); }
});

// ---------- Pendidikan & Diklat ----------
app.get('/api/personel/:id/pendidikan', auth, async (req, res, next) => {
  try {
    const personelId = parseInt(req.params.id);
    const data = await prisma.pendidikan.findMany({
      where: { personelId },
      orderBy: { tahunLulus: 'desc' }
    });
    res.json(data);
  } catch (e) { next(e); }
});

app.post('/api/personel/:id/pendidikan', auth, async (req, res, next) => {
  try {
    const personelId = parseInt(req.params.id);
    const schema = z.object({
      jenis: z.enum(['PENDIDIKAN', 'DIKLAT']),
      nama: z.string().min(3, 'Nama minimal 3 karakter'),
      institusi: z.string().optional().nullable(),
      tahunLulus: z.number().int().min(1950).max(2100).optional().nullable(),
      keterangan: z.string().optional().nullable()
    });
    const data = schema.parse(req.body);
    const result = await prisma.pendidikan.create({
      data: { ...data, personelId }
    });
    res.status(201).json(result);
  } catch (e) { next(e); }
});

app.delete('/api/personel/:id/pendidikan/:pendidikanId', auth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.pendidikanId);
    await prisma.pendidikan.delete({ where: { id } });
    res.json({ message: 'Data pendidikan berhasil dihapus' });
  } catch (e) { next(e); }
});

// ---------- Dashboard Statistik ----------
app.get('/api/dashboard/statistik', auth, async (req, res, next) => {
  try {
    const whereSatker = req.user.role === 'OPERATOR' ? { satkerId: req.user.satkerId } : {};
    
    const semuaPersonel = await prisma.personel.findMany({
      where: whereSatker,
      include: { satker: true }
    });

    const sekarang = new Date();
    const hitungUsia = (tglLahir) => {
      return Math.floor((sekarang - new Date(tglLahir)) / (365.25 * 24 * 60 * 60 * 1000));
    };

    const kelompokUsia = {
      '18-25 tahun': 0, '26-35 tahun': 0, '36-45 tahun': 0,
      '46-58 tahun': 0, 'Di atas 58 tahun': 0
    };
    const golonganPangkat = {};
    const perSatker = {};

    semuaPersonel.forEach(p => {
      const usia = hitungUsia(p.tanggalLahir);
      if (usia <= 25) kelompokUsia['18-25 tahun']++;
      else if (usia <= 35) kelompokUsia['26-35 tahun']++;
      else if (usia <= 45) kelompokUsia['36-45 tahun']++;
      else if (usia <= 58) kelompokUsia['46-58 tahun']++;
      else kelompokUsia['Di atas 58 tahun']++;

      golonganPangkat[p.pangkat] = (golonganPangkat[p.pangkat] || 0) + 1;
      perSatker[p.satker.nama] = (perSatker[p.satker.nama] || 0) + 1;
    });

    res.json({
      totalPersonel: semuaPersonel.length,
      kelompokUsia,
      golonganPangkat,
      perSatker
    });
  } catch (e) { next(e); }
});

// ---------- Satker ----------
app.get('/api/satker', auth, async (req, res, next) => {
  try {
    const data = await prisma.satker.findMany({ orderBy: { nama: 'asc' } });
    res.json(data);
  } catch (e) { next(e); }
});

// ---------- Error Handler ----------
app.use((err, req, res, next) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: 'Validasi gagal',
      errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
    });
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'Data duplikat', field: err.meta?.target });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Data tidak ditemukan' });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});