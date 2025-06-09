import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { faker } from "@faker-js/faker";
import {
	createAppointment,
	createCustomer,
	createHairOrder,
	createNote,
	createProduct,
	createProductVariant,
	createTransaction,
	generateObjects,
	sizes,
} from "./data";

faker.seed(410149);

const customerIds: string[] = [];

async function seedUsers() {
	const adminEmail = "admin@admin.com";
	const existingAdminUser = await prisma.user.findUnique({
		where: { email: adminEmail },
	});

	if (!existingAdminUser) {
		await auth.api.signUpEmail({
			body: {
				email: adminEmail,
				password: "password123",
				name: "Admin",
			},
		});
	}

	const userEmail = "user@user.com";
	const existingUserUser = await prisma.user.findUnique({
		where: { email: userEmail },
	});

	if (!existingUserUser) {
		await auth.api.signUpEmail({
			body: {
				email: userEmail,
				password: "password123",
				name: "User",
			},
		});
	}

	await prisma.user.update({
		where: { email: adminEmail },
		data: { role: "admin" },
	});
	await prisma.user.update({
		where: { email: userEmail },
		data: { role: "user" },
	});
}

async function seedCustomers() {
	const user = await prisma.user.findFirst({ select: { id: true } });

	if (!user) {
		throw Error("User does not exist");
	}

	for (const customer of generateObjects(10, () => createCustomer(faker))) {
		const createdCustomer = await prisma.customer.create({
			data: customer,
		});

		customerIds.push(createdCustomer.id);

		for (const note of generateObjects(10, () => createNote(faker))) {
			await prisma.note.create({
				data: {
					...note,
					customerId: createdCustomer.id,
					createdById: user.id,
				},
			});
		}
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
	const user = await prisma.user.findFirst({ select: { id: true } });

	if (!user) {
		throw Error("User does not exist");
	}

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

			for (const note of generateObjects(10, () => createNote(faker))) {
				await prisma.note.create({
					data: {
						...note,
						appointmentId: createdAppointment.id,
						customerId,
						createdById: user.id,
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
		throw Error("User does not exist");
	}

	for (const hairOrder of generateObjects(10, () => createHairOrder(faker))) {
		const createdHairOrder = await prisma.hairOrder.create({
			data: { ...hairOrder, customerId, createdById: user.id },
		});

		for (const note of generateObjects(2, () => createNote(faker))) {
			await prisma.note.create({
				data: {
					...note,
					hairOrderId: createdHairOrder.id,
					customerId,
					createdById: user.id,
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
