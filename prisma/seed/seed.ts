import { PrismaClient } from "@prisma/client";
import { customers } from "./data";

const prisma = new PrismaClient();

await prisma.customer.deleteMany({
  where: {},
});

for (const customer of customers) {
  await prisma.customer.create({
    data: {
      ...customer,
    },
  });
}
