import { auth } from "@/lib/auth";
import {
  createAppointment,
  createAppointmentNote,
  createCustomer,
  createHair,
  createHairOrder,
  createHairOrderNote,
  createHairOrderTransaction,
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
        email: userEmail,
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

      for (const note of generateObjects(10, () =>
        createAppointmentNote(faker),
      )) {
        await prisma.appointmentNote.create({
          data: {
            ...note,
            appointmentId: createdAppointment.id,
          },
        });
      }
    }
  }
};

const seedHairOrders = async (): Promise<void> => {
  const customerId = customerIds[0];
  const user = await prisma.user.findFirst({ select: { id: true } });

  if (!user) {
    throw Error(`User does not exist`);
  }

  for (const hairOrder of generateObjects(10, () => createHairOrder(faker))) {
    const createdHairOrder = await prisma.hairOrder.create({
      data: { ...hairOrder, customerId, createdById: user.id },
    });

    for (const transaction of generateObjects(2, () =>
      createHairOrderTransaction(faker),
    )) {
      await prisma.transaction.create({
        data: { ...transaction, customerId, hairOrderId: createdHairOrder.id },
      });
    }

    for (const note of generateObjects(2, () => createHairOrderNote(faker))) {
      await prisma.hairOrderNote.create({
        data: {
          ...note,
          hairOrderId: createdHairOrder.id,
          createdById: user.id,
        },
      });
    }

    for (const hair of generateObjects(10, () => createHair(faker))) {
      await prisma.hair.create({
        data: {
          ...hair,
          hairOrderId: createdHairOrder.id,
          weightReceived: hair.weight,
        },
      });
    }
  }
};

async function main() {
  console.log("🛠 Seeding database...");

  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.hairOrder.deleteMany();

  await seedUsers();
  await seedCustomers();
  await seedProducts();
  await seedTransactions();
  await seedAppointments();
  await seedHairOrders();

  console.log("🌱 Database seeded successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Error seeding database:\n", error.message);
    console.error("📍 Stack trace:\n", error.stack);
    console.error("📍 Meta:\n", error.meta);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Disconnected from database.");
  });
