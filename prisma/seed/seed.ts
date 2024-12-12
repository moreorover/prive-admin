import {auth} from "@/lib/auth";
import {PrismaClient} from "@prisma/client";
import {customers} from "./data";

const prisma = new PrismaClient();

async function seedUsers() {
  const userEmail = "x@x.com";
  const existingUser = await prisma.user.findUnique({
    where: {email: userEmail},
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
      data: {...customer.customer},
    });
  }
}

async function main() {
  console.log("Seeding database...");

  await prisma.customer.deleteMany();

  await seedUsers();
  await seedCustomers()

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
