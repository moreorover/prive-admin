import { Prisma, PrismaClient } from "@prisma/client";

// Utility function to transform amount values
const transformAmount = <
  T extends {
    amount?: number | undefined | Prisma.IntFieldUpdateOperationsInput;
  },
>(
  data: T,
): T => {
  if (data?.amount !== undefined && typeof data.amount === "number") {
    return { ...data, amount: data.amount * 100 };
  }
  return data;
};

// Function to generate query extensions for a given model
const generateQueryExtension = () => ({
  create: ({ args, query }) =>
    query({ ...args, data: transformAmount(args.data) }),
  update: ({ args, query }) =>
    query({ ...args, data: transformAmount(args.data) }),
  upsert: ({ args, query }) =>
    query({
      ...args,
      create: transformAmount(args.create),
      update: transformAmount(args.update),
    }),
  createMany: ({ args, query }) =>
    query({
      ...args,
      data: Array.isArray(args.data)
        ? args.data.map(transformAmount)
        : transformAmount(args.data),
    }),
  updateMany: ({ args, query }) =>
    query({
      ...args,
      data: Array.isArray(args.data)
        ? args.data.map(transformAmount)
        : transformAmount(args.data),
    }),
});

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    result: {
      transaction: {
        amount: {
          compute: (transaction) => transaction.amount / 100,
        },
      },
    },
    query: {
      transaction: generateQueryExtension(),
    },
  });
};

// Singleton Handling
declare const globalThis: {
  prismaGlobal?: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
