import { auth } from "@/lib/auth";
import { customers, generateTransactions, products } from "./data";
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
  for (const customer of customers) {
    const createdCustomer = await prisma.customer.create({
      data: { ...customer.customer },
    });

    customerIds.push(createdCustomer.id);
  }
}

async function seedProducts() {
  for (const product of products) {
    const createdProduct = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
      },
    });

    for (const variant of product.variants) {
      await prisma.productVariant.create({
        data: { ...variant, productId: createdProduct.id },
      });
    }
  }
}

const seedTransactions = async (): Promise<void> => {
  for (const transaction of generateTransactions(40)) {
    const createdTransaction = await prisma.transaction.create({
      data: {
        name: transaction.name,
        amount: transaction.amount,
        customerId: faker.helpers.arrayElement(customerIds),
        createdAt: transaction.createdAt,
      },
    });
  }
};

async function main() {
  console.log("🛠 Seeding database...");

  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.transaction.deleteMany();

  await seedUsers();
  await seedCustomers();
  await seedProducts();
  await seedTransactions();

  console.log("🌱 Database seeded successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
