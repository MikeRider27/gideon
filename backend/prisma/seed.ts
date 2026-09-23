import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@gideon.local';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash('Admin123!', 10),
        name: 'Administrador',
        role: 'ADMIN',
      },
    });
    console.log(`Usuario admin creado: ${adminEmail} / Admin123!`);
  }

  const supplier = await prisma.supplier.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Proveedor Demo S.A.',
      email: 'ventas@proveedordemo.com',
    },
  });

  const productsData = [
    { sku: 'SKU-001', name: 'Laptop Pro 14"', unitPrice: 1200, costPrice: 900, stockQuantity: 15, reorderThreshold: 5 },
    { sku: 'SKU-002', name: 'Mouse inalambrico', unitPrice: 25, costPrice: 12, stockQuantity: 80, reorderThreshold: 20 },
    { sku: 'SKU-003', name: 'Monitor 27" 4K', unitPrice: 380, costPrice: 280, stockQuantity: 8, reorderThreshold: 10 },
  ];

  for (const product of productsData) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: { ...product, supplierId: supplier.id },
    });
  }

  const customer = await prisma.customer.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Cliente Demo',
      email: 'contacto@clientedemo.com',
      company: 'Cliente Demo Corp',
    },
  });

  await prisma.opportunity.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      title: 'Renovacion de equipos de oficina',
      customerId: customer.id,
      stage: 'PROPOSAL',
      value: 15000,
    },
  });

  console.log('Seed completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
