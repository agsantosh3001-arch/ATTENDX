import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanMockData() {
  console.log('🧹 Cleaning all dummy/mock employee accounts from database...');

  const allowedEmails = [
    'vivaninteriors@gmail.com',
    'vikashreal2@gmail.com',
    'admin@attendx.com',
  ];

  const deleted = await prisma.user.deleteMany({
    where: {
      email: {
        notIn: allowedEmails,
      },
    },
  });

  console.log(`Deleted ${deleted.count} dummy user accounts.`);

  console.log('\nRemaining Users in Database:');
  const remaining = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, status: true },
  });
  console.table(remaining);

  await prisma.$disconnect();
}

cleanMockData().catch((err) => {
  console.error('Error cleaning mock data:', err);
  process.exit(1);
});
