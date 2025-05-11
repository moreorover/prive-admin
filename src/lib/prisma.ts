import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
	return new PrismaClient();
};

// Singleton Handling
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
declare const globalThis: {
	prismaGlobal?: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
	globalThis.prismaGlobal = prisma;
}

export default prisma;
