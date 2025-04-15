import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Hash the default password
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  // Create default user
  const defaultUser = await prisma.user.upsert({
    where: { email: 'jabobruno100@gmail.com' }, // Remove space from email
    update: {},
    create: {
      email: 'jabobruno100@gmail.com', // Remove trailing space here
      password: hashedPassword,
    },
  });

  console.log({ defaultUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
