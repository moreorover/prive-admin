import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    result: {
      transaction: {
        amount: {
          compute: (transaction) => transaction.amount / 100, // Convert when fetching
        },
      },
    },
    query: {
      transaction: {
        create({ args, query }) {
          if (
            args.data?.amount !== undefined &&
            typeof args.data.amount === "number"
          ) {
            args.data.amount = Math.round(args.data.amount * 100);
          }
          return query(args);
        },
        update({ args, query }) {
          if (
            args.data?.amount !== undefined &&
            typeof args.data.amount === "number"
          ) {
            args.data.amount = Math.round(args.data.amount * 100);
          }
          return query(args);
        },
        upsert({ args, query }) {
          if (
            args.create?.amount !== undefined &&
            typeof args.create.amount === "number"
          ) {
            args.create.amount = Math.round(args.create.amount * 100);
          }
          if (
            args.update?.amount !== undefined &&
            typeof args.update.amount === "number"
          ) {
            args.update.amount = Math.round(args.update.amount * 100);
          }
          return query(args);
        },
        createMany({ args, query }) {
          if (Array.isArray(args.data)) {
            args.data = args.data.map((item) =>
              item.amount !== undefined && typeof item.amount === "number"
                ? { ...item, amount: item.amount * 100 }
                : item,
            );
          }
          return query(args);
        },
        updateMany({ args, query }) {
          if (Array.isArray(args.data)) {
            args.data = args.data.map((item) =>
              item.amount !== undefined && typeof item.amount === "number"
                ? { ...item, amount: item.amount * 100 }
                : item,
            );
          }
          return query(args);
        },
      },
    },
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
