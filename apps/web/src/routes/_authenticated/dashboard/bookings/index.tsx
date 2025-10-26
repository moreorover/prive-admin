// routes/_authenticated/dashboard/bookings/index.tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { BookingCalendar } from "@/features/bookings/booking-calendar";
import { trpc } from "@/utils/trpc";

const bookingsSearchSchema = z.object({
  month: z.string().optional(), // Format: YYYY-MM
});

export const Route = createFileRoute("/_authenticated/dashboard/bookings/")({
  component: BookingsPage,
  validateSearch: bookingsSearchSchema,
});

function BookingsPage() {
  const navigate = Route.useNavigate();
  const { month } = Route.useSearch();

  // Parse current month from URL or default to today
  const getCurrentMonth = () => {
    if (!month) return new Date();

    try {
      const date = new Date(`${month}-01`);
      // Check if date is valid
      if (isNaN(date.getTime())) return new Date();
      return date;
    } catch {
      return new Date();
    }
  };

  const currentMonth = getCurrentMonth();

  // Fetch bookings for current month
  const { data: bookings } = useQuery(
    trpc.booking.getByMonth.queryOptions({
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
    }),
  );

  const handleMonthChange = (date: Date) => {
    const year = date.getFullYear();
    const monthNum = String(date.getMonth() + 1).padStart(2, "0");
    const monthString = `${year}-${monthNum}`;

    navigate({
      search: { month: monthString },
    });
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 font-bold text-2xl tracking-tight">Bookings</h2>
      <BookingCalendar
        bookings={bookings || []}
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
      />
    </div>
  );
}
