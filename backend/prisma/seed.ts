import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedContacts: any[] = [];

async function main() {
  console.log('Starting seed...');

  for (const contact of seedContacts) {
    await prisma.contact.create({
      data: contact
    });
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });