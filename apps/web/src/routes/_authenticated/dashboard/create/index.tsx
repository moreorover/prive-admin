import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { BookingCalendar } from "@/features/bookings/booking-calendar";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_authenticated/dashboard/create/")({
  component: BookingsPage,
});

function BookingsPage() {
  // Fetch bookings for current month
  const mutation = useMutation(
    trpc.booking.generateFakeBookings.mutationOptions(),
  );

  return (
    <Button onClick={() => mutation.mutate({ generateCustomers: true })}>
      Mutate
    </Button>
  );
}
