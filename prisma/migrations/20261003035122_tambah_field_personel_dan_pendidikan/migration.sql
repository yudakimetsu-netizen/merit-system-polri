-- AlterTable
ALTER TABLE "User" ADD COLUMN "email" TEXT;

-- CreateTable
CREATE TABLE "Pendidikan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "personelId" INTEGER NOT NULL,
    "jenis" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "institusi" TEXT,
    "tahunLulus" INTEGER,
    "keterangan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pendidikan_personelId_fkey" FOREIGN KEY ("personelId") REFERENCES "Personel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Personel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "nrp" TEXT NOT NULL,
    "nik" TEXT,
    "pangkat" TEXT NOT NULL,
    "jenisKelamin" TEXT,
    "jenisPersonel" TEXT,
    "tempatLahir" TEXT NOT NULL,
    "tanggalLahir" DATETIME NOT NULL,
    "email" TEXT,
    "tingkatPendidikan" TEXT,
    "statusPersonel" TEXT NOT NULL DEFAULT 'AKTIF',
    "pernahDiklat" TEXT,
    "satkerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Personel_satkerId_fkey" FOREIGN KEY ("satkerId") REFERENCES "Satker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Personel" ("createdAt", "id", "nama", "nrp", "pangkat", "satkerId", "tanggalLahir", "tempatLahir", "updatedAt") SELECT "createdAt", "id", "nama", "nrp", "pangkat", "satkerId", "tanggalLahir", "tempatLahir", "updatedAt" FROM "Personel";
DROP TABLE "Personel";
ALTER TABLE "new_Personel" RENAME TO "Personel";
CREATE UNIQUE INDEX "Personel_nrp_key" ON "Personel"("nrp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
