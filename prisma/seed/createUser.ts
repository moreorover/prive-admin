// bun ./prisma/seed/createUser.ts

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function seedUsers() {
  const userEmail = "";
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!existingUser) {
    await auth.api.signUpEmail({
      body: {
        email: userEmail,
        password: "",
        name: "",
      },
    });
  }
}

async function main() {
  console.log("🛠 Seeding database...");

  await seedUsers();

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
