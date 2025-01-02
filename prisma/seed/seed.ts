import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { customers, products } from "./data";

const prisma = new PrismaClient();

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
    await prisma.customer.create({
      data: { ...customer.customer },
    });
  }
}

async function seedProducts() {
  for (const product of products) {
    const createdProduct = await prisma.product.create({
      data: {
        name: product.product.name,
        description: product.product.description,
      },
    });

    for (const variant of product.product.variants) {
      await prisma.productVariant.create({
        data: {
          productId: createdProduct.id,
          size: variant.size,
          price: variant.price,
          stock: variant.stock,
        },
      });
    }
  }
}

async function main() {
  console.log("Seeding database...");

  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();

  await seedUsers();
  await seedCustomers();
  await seedProducts();

  console.log("Database seeded successfully!");
}

main()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
