import { db } from "@prive-admin/db";
import { booking, bookingCreateSchema } from "@prive-admin/db/schema/booking";
import { customer } from "@prive-admin/db/schema/customer";
import { between } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

export const bookingRouter = router({
  getAll: protectedProcedure.query(async () => {
    return db.query.booking.findMany({
      with: {
        client: true,
      },
      orderBy: (booking, { asc }) => [asc(booking.startsAt)],
    });
  }),

  getByMonth: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }),
    )
    .query(async ({ input }) => {
      // Calculate start and end of month
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      return db.query.booking.findMany({
        where: between(booking.startsAt, startDate, endDate),
        with: {
          client: {
            columns: { id: true, name: true },
          },
        },
        orderBy: (booking, { asc }) => [asc(booking.startsAt)],
      });
    }),

  create: protectedProcedure
    .input(bookingCreateSchema)
    .mutation(async ({ input, ctx }) => {
      return db.insert(booking).values({
        ...input,
        createdById: ctx.session.user.id,
      });
    }),

  // Generate fake bookings for testing
  // Generate fake bookings for testing
  generateFakeBookings: protectedProcedure
    .input(
      z.object({
        monthsBack: z.number().min(1).max(12).default(3),
        monthsForward: z.number().min(1).max(12).default(3),
        bookingsPerMonth: z.number().min(1).max(50).default(10),
        generateCustomers: z.boolean().default(false),
        customerCount: z.number().min(1).max(100).default(20),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        monthsBack,
        monthsForward,
        bookingsPerMonth,
        generateCustomers,
        customerCount,
      } = input;

      // Generate customers if requested
      if (generateCustomers) {
        const firstNames = [
          "John",
          "Jane",
          "Michael",
          "Sarah",
          "David",
          "Emily",
          "James",
          "Emma",
          "Robert",
          "Olivia",
          "William",
          "Ava",
          "Richard",
          "Sophia",
          "Joseph",
          "Isabella",
          "Thomas",
          "Mia",
          "Charles",
          "Charlotte",
        ];
        const lastNames = [
          "Smith",
          "Johnson",
          "Williams",
          "Brown",
          "Jones",
          "Garcia",
          "Miller",
          "Davis",
          "Rodriguez",
          "Martinez",
          "Hernandez",
          "Lopez",
          "Gonzalez",
          "Wilson",
          "Anderson",
          "Thomas",
          "Taylor",
          "Moore",
          "Jackson",
          "Martin",
        ];

        const customersToInsert = [];
        for (let i = 0; i < customerCount; i++) {
          const firstName =
            firstNames[Math.floor(Math.random() * firstNames.length)];
          const lastName =
            lastNames[Math.floor(Math.random() * lastNames.length)];
          const phoneNumber = `+370${Math.floor(10000000 + Math.random() * 90000000)}`;

          customersToInsert.push({
            name: `${firstName} ${lastName}`,
            phoneNumber: Math.random() > 0.2 ? phoneNumber : null, // 80% have phone numbers
            createdById: ctx.session.user.id,
          });
        }

        await db.insert(customer).values(customersToInsert);
      }

      // Get all customers to assign bookings to
      const customers = await db.query.customer.findMany({
        columns: { id: true },
      });

      if (customers.length === 0) {
        throw new Error(
          "No customers found. Create customers first or set generateCustomers to true.",
        );
      }

      const bookingsToInsert = [];
      const now = new Date();

      // Generate bookings for past months
      for (let i = monthsBack; i > 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        bookingsToInsert.push(
          ...generateBookingsForMonth(
            month,
            bookingsPerMonth,
            customers,
            ctx.session.user.id,
          ),
        );
      }

      // Generate bookings for current month
      bookingsToInsert.push(
        ...generateBookingsForMonth(
          now,
          bookingsPerMonth,
          customers,
          ctx.session.user.id,
        ),
      );

      // Generate bookings for future months
      for (let i = 1; i <= monthsForward; i++) {
        const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
        bookingsToInsert.push(
          ...generateBookingsForMonth(
            month,
            bookingsPerMonth,
            customers,
            ctx.session.user.id,
          ),
        );
      }

      // Insert all bookings
      await db.insert(booking).values(bookingsToInsert);

      return {
        success: true,
        customersCreated: generateCustomers ? customerCount : 0,
        bookingsCreated: bookingsToInsert.length,
      };
    }),
});

// Helper function to generate bookings for a specific month
function generateBookingsForMonth(
  month: Date,
  count: number,
  customers: Array<{ id: string }>,
  createdById: string,
) {
  const bookings = [];
  const year = month.getFullYear();
  const monthNum = month.getMonth();
  const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

  const bookingNames = [
    "Haircut",
    "Hair Coloring",
    "Highlights",
    "Balayage",
    "Perm",
    "Hair Treatment",
    "Blowout",
    "Updo",
    "Hair Extensions",
    "Keratin Treatment",
  ];

  for (let i = 0; i < count; i++) {
    // Random day in month
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    // Random hour between 9 AM and 6 PM
    const hour = Math.floor(Math.random() * 9) + 9;
    // Random minute (0, 15, 30, 45)
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];

    const startsAt = new Date(year, monthNum, day, hour, minute);
    const randomCustomer =
      customers[Math.floor(Math.random() * customers.length)];
    const randomName =
      bookingNames[Math.floor(Math.random() * bookingNames.length)];

    bookings.push({
      // id: `booking_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
      name: randomName,
      startsAt,
      clientId: randomCustomer.id,
      createdById,
    });
  }

  return bookings;
}
