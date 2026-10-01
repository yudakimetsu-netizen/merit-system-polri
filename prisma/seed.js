const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const ssdm = await prisma.satker.upsert({
    where: { kode: 'SSDM' },
    update: {},
    create: { kode: 'SSDM', nama: 'SSDM Polri' }
  });

  const polda = await prisma.satker.upsert({
    where: { kode: 'POLDA-METRO' },
    update: {},
    create: { kode: 'POLDA-METRO', nama: 'Polda Metro Jaya' }
  });

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN'
    }
  });

  await prisma.user.upsert({
    where: { username: 'operator' },
    update: {},
    create: {
      username: 'operator',
      password: await bcrypt.hash('operator123', 10),
      role: 'OPERATOR',
      satkerId: polda.id
    }
  });

  console.log('Seed selesai');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
  