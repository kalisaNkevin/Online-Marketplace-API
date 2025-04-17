import { PrismaClient, Role, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Hash the default password
  const hashedPassword = await bcrypt.hash('Password@123', 10);

  // Create default categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Clothing' },
      update: {},
      create: {
        name: 'Clothing',
        description: 'Fashion and apparel',
      },
    }),
  ]);

  // Create default admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@marketplace.com' },
    update: {},
    create: {
      email: 'admin@marketplace.com',
      password: hashedPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      gender: Gender.PREFER_NOT_TO_SAY,
      isEmailVerified: true,
    },
  });

  // Create default seller with store
  const seller = await prisma.user.upsert({
    where: { email: 'seller@marketplace.com' },
    update: {},
    create: {
      email: 'seller@marketplace.com',
      password: hashedPassword,
      name: 'Seller User',
      role: Role.SELLER,
      gender: Gender.PREFER_NOT_TO_SAY,
      isEmailVerified: true,
    },
  });

  // Create store separately with proper ownerId
  await prisma.store.create({
    data: {
      name: 'Demo Store',
      description: 'A demo store for testing',
      ownerId: seller.id,

    },
  });

  // Create default shopper
  const shopper = await prisma.user.upsert({
    where: { email: 'shopper@marketplace.com' },
    update: {},
    create: {
      email: 'shopper@marketplace.com',
      password: hashedPassword,
      name: 'Shopper User',
      role: Role.SHOPPER,
      gender: Gender.PREFER_NOT_TO_SAY,
      isEmailVerified: true,
    },
  });

  console.log({
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    admin: { id: admin.id, email: admin.email, role: admin.role },
    seller: { id: seller.id, email: seller.email, role: seller.role },
    shopper: { id: shopper.id, email: shopper.email, role: shopper.role },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
