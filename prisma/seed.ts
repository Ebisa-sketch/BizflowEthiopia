import { PrismaClient, GlobalRole, BusinessRole, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BizFlow Ethiopia database...');

  // 1. Create Super Admin
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bizflow.et' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@bizflow.et',
      passwordHash: adminPasswordHash,
      globalRole: GlobalRole.SUPERADMIN,
    },
  });

  // 2. Create Demo Business Owner
  const ownerPasswordHash = await bcrypt.hash('Owner@123456', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@addismart.et' },
    update: {},
    create: {
      name: 'Abebe Kebede',
      email: 'owner@addismart.et',
      passwordHash: ownerPasswordHash,
      globalRole: GlobalRole.USER,
    },
  });

  // 3. Create Demo Cashier
  const cashierPasswordHash = await bcrypt.hash('Cashier@123456', 10);
  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@addismart.et' },
    update: {},
    create: {
      name: 'Tigist Haile',
      email: 'cashier@addismart.et',
      passwordHash: cashierPasswordHash,
      globalRole: GlobalRole.USER,
    },
  });

  // 4. Create Demo Business (Addis Mini Mart)
  let business = await prisma.business.findFirst({
    where: { name: 'Addis Mini Mart' },
  });

  if (!business) {
    business = await prisma.business.create({
      data: {
        name: 'Addis Mini Mart',
        contactEmail: 'contact@addismart.et',
        phone: '+251 911 234567',
        address: 'Bole Medhanialem, Addis Ababa, Ethiopia',
        currency: 'ETB',
        taxNumber: 'TIN-001928374',
        status: 'ACTIVE',
      },
    });
  }

  // 5. Connect Memberships
  await prisma.membership.upsert({
    where: {
      businessId_userId: {
        businessId: business.id,
        userId: owner.id,
      },
    },
    update: {},
    create: {
      businessId: business.id,
      userId: owner.id,
      role: BusinessRole.OWNER,
    },
  });

  await prisma.membership.upsert({
    where: {
      businessId_userId: {
        businessId: business.id,
        userId: cashier.id,
      },
    },
    update: {},
    create: {
      businessId: business.id,
      userId: cashier.id,
      role: BusinessRole.CASHIER,
    },
  });

  // 6. Create Product Categories
  const beverageCategory = await prisma.category.create({
    data: {
      businessId: business.id,
      name: 'Beverages & Soft Drinks',
      description: 'Water, juices, soft drinks, and packaged beverages',
    },
  });

  const pantryCategory = await prisma.category.create({
    data: {
      businessId: business.id,
      name: 'Grains & Pantry',
      description: 'Teff, edible oil, flour, sugar, and staples',
    },
  });

  // 7. Create Sample Products
  await prisma.product.createMany({
    data: [
      {
        businessId: business.id,
        categoryId: beverageCategory.id,
        sku: 'BEV-001',
        barcode: '6001001',
        name: 'Ambo Mineral Water (500ml)',
        costPrice: 25.0,
        sellingPrice: 35.0,
        quantityOnHand: 150.0,
        reorderLevel: 24.0,
        status: ProductStatus.ACTIVE,
      },
      {
        businessId: business.id,
        categoryId: beverageCategory.id,
        sku: 'BEV-002',
        barcode: '6001002',
        name: 'Coca Cola Glass Bottle (300ml)',
        costPrice: 20.0,
        sellingPrice: 30.0,
        quantityOnHand: 80.0,
        reorderLevel: 20.0,
        status: ProductStatus.ACTIVE,
      },
      {
        businessId: business.id,
        categoryId: pantryCategory.id,
        sku: 'PAN-001',
        barcode: '6002001',
        name: 'Magna Teff 5kg Bag',
        costPrice: 650.0,
        sellingPrice: 850.0,
        quantityOnHand: 40.0,
        reorderLevel: 10.0,
        status: ProductStatus.ACTIVE,
      },
      {
        businessId: business.id,
        categoryId: pantryCategory.id,
        sku: 'PAN-002',
        barcode: '6002002',
        name: 'Sunflower Cooking Oil 3L',
        costPrice: 580.0,
        sellingPrice: 720.0,
        quantityOnHand: 25.0,
        reorderLevel: 8.0,
        status: ProductStatus.ACTIVE,
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
