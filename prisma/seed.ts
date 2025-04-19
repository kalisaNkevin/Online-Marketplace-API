import { PrismaClient, Role, Gender, ProductSize } from '@prisma/client';
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

  // Get the first store to associate products with
  const store = await prisma.store.findFirst({
    where: { name: 'Demo Store' },
  });

  if (!store) {
    throw new Error('Store not found');
  }

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Nike Air Max',
        description: 'Classic athletic shoes with excellent cushioning',
        price: 129.99,
        quantity: 50,
        isFeatured: true,
        storeId: store.id,
        thumbnail: 'https://example.com/airmax.jpg',
        images: [
          'https://example.com/airmax-1.jpg',
          'https://example.com/airmax-2.jpg',
        ],
        categories: {
          connect: [{ name: 'Clothing' }],
        },
        variants: {
          create: [
            { size: ProductSize.SIZE_40, quantity: 10 },
            { size: ProductSize.SIZE_41, quantity: 10 },
            { size: ProductSize.SIZE_42, quantity: 10 },
            { size: ProductSize.SIZE_43, quantity: 10 },
            { size: ProductSize.SIZE_44, quantity: 10 },
          ],
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        discount: true,
        thumbnail: true,
        images: true,
        averageRating: true,
        isFeatured: true,
        quantity: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
        store: {
          select: {
            name: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          select: {
            size: true,
          },
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Samsung 4K Smart TV',
        description: '55-inch 4K Ultra HD Smart LED TV',
        price: 699.99,
        quantity: 20,
        isFeatured: true,
        storeId: store.id,
        thumbnail: 'https://example.com/tv.jpg',
        images: [
          'https://example.com/tv-1.jpg',
          'https://example.com/tv-2.jpg',
        ],
        categories: {
          connect: [{ name: 'Electronics' }],
        },
        variants: {
          create: [{ size: ProductSize.ONE_SIZE, quantity: 20 }],
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        discount: true,
        thumbnail: true,
        images: true,
        averageRating: true,
        isFeatured: true,
        quantity: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
        store: {
          select: {
            name: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          select: {
            size: true,
          },
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cotton T-Shirt',
        description: 'Comfortable 100% cotton t-shirt',
        price: 2499,
        quantity: 100,
        isFeatured: false,
        storeId: store.id,
        thumbnail: 'https://example.com/tshirt.jpg',
        images: [
          'https://example.com/tshirt-1.jpg',
          'https://example.com/tshirt-2.jpg',
        ],
        categories: {
          connect: [{ name: 'Clothing' }],
        },
        variants: {
          create: [
            { size: ProductSize.S, quantity: 20 },
            { size: ProductSize.M, quantity: 30 },
            { size: ProductSize.L, quantity: 30 },
            { size: ProductSize.XL, quantity: 20 },
          ],
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        discount: true,
        thumbnail: true,
        images: true,
        averageRating: true,
        isFeatured: true,
        quantity: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
        store: {
          select: {
            name: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          select: {
            size: true,
          },
        },
      },
    }),
  ]);

  console.log({
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    admin: { id: admin.id, email: admin.email, role: admin.role },
    seller: { id: seller.id, email: seller.email, role: seller.role },
    shopper: { id: shopper.id, email: shopper.email, role: shopper.role },
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      discount: p.discount,
      thumbnail: p.thumbnail,
      images: p.images,
      averageRating: p.averageRating,
      isFeatured: p.isFeatured,
      quantity: p.quantity,
      storeId: p.storeId,
      storeName: p.store.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      categories: p.categories,
      variants: p.variants.map((v) => v.size),
    })),
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
