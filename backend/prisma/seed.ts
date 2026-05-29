import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: {
      email: 'admin@erp.com',
      fullName: 'Default SuperAdmin',
      passwordHash: passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const categories = [
    { name: 'consumables and tools', color: '#3b82f6' },
    { name: 'display', color: '#10b981' },
    { name: 'enclosure', color: '#f59e0b' },
    { name: 'fuse and power supply', color: '#ef4444' },
    { name: 'keypad & stickers', color: '#8b5cf6' },
    { name: 'MOV LED Connector', color: '#ec4899' },
    { name: 'PCB', color: '#06b6d4' },
    { name: 'resistor,capacitor,diode&transistor ,ic', color: '#14b8a6' },
    { name: 'switch and modules', color: '#6366f1' },
    { name: 'others', color: '#6b7280' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log('Seed successful:');
  console.log('Email: admin@erp.com');
  console.log('Password: Admin@123');
  console.log('Role: SUPER_ADMIN');
  console.log('Categories seeded:', categories.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
