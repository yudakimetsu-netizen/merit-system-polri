-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "satkerId" INTEGER,
    CONSTRAINT "User_satkerId_fkey" FOREIGN KEY ("satkerId") REFERENCES "Satker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Satker" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Personel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "nrp" TEXT NOT NULL,
    "pangkat" TEXT NOT NULL,
    "tempatLahir" TEXT NOT NULL,
    "tanggalLahir" DATETIME NOT NULL,
    "satkerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Personel_satkerId_fkey" FOREIGN KEY ("satkerId") REFERENCES "Satker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiwayatJabatan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "personelId" INTEGER NOT NULL,
    "jabatan" TEXT NOT NULL,
    "satkerId" INTEGER NOT NULL,
    "fungsi" TEXT NOT NULL,
    "tanggalMulai" DATETIME NOT NULL,
    "tanggalBerakhir" DATETIME,
    "nivelering" INTEGER NOT NULL,
    "statusJabatan" TEXT NOT NULL,
    "keterangan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RiwayatJabatan_personelId_fkey" FOREIGN KEY ("personelId") REFERENCES "Personel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RiwayatJabatan_satkerId_fkey" FOREIGN KEY ("satkerId") REFERENCES "Satker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Satker_kode_key" ON "Satker"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Personel_nrp_key" ON "Personel"("nrp");
