import { auth } from "@/lib/auth";
import {
  createAppointment,
  createCustomer,
  createProduct,
  createProductVariant,
  createTransaction,
  generateObjects,
  sizes,
} from "./data";
import { faker } from "@faker-js/faker";
import prisma from "@/lib/prisma";

faker.seed(410149);

const customerIds: string[] = [];

async function seedUsers() {
  const userEmail = "x@x.com";
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!existingUser) {
    await auth.api.signUpEmail({
      body: {
        email: "x@x.com",
        password: "password123",
        name: "X",
      },
    });
  }
}

async function seedCustomers() {
  for (const customer of generateObjects(10, () => createCustomer(faker))) {
    const createdCustomer = await prisma.customer.create({
      data: customer,
    });

    customerIds.push(createdCustomer.id);
  }
}

async function seedProducts() {
  for (const product of generateObjects(5, () => createProduct(faker))) {
    const createdProduct = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
      },
    });

    for (const size of sizes) {
      const variant = createProductVariant(faker, size);
      await prisma.productVariant.create({
        data: { ...variant, productId: createdProduct.id },
      });
    }
  }
}

const seedTransactions = async (): Promise<void> => {
  for (const customerId of customerIds) {
    for (const transaction of generateObjects(10, () =>
      createTransaction(faker),
    )) {
      await prisma.transaction.create({
        data: { ...transaction, customerId },
      });
    }
  }
};

const seedAppointments = async (): Promise<void> => {
  for (const customerId of customerIds) {
    for (const appointment of generateObjects(10, () =>
      createAppointment(faker),
    )) {
      const createdAppointment = await prisma.appointment.create({
        data: { ...appointment, clientId: customerId },
      });

      for (const transaction of generateObjects(3, () =>
        createTransaction(faker),
      )) {
        await prisma.transaction.create({
          data: {
            ...transaction,
            customerId,
            appointmentId: createdAppointment.id,
          },
        });
      }
    }
  }
};

async function main() {
  console.log("🛠 Seeding database...");

  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.appointment.deleteMany();

  await seedUsers();
  await seedCustomers();
  await seedProducts();
  await seedTransactions();
  await seedAppointments();

  console.log("🌱 Database seeded successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Error seeding database:", error.message);
    console.error("📍 Stack trace:", error.stack);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Disconnected from database.");
  });
