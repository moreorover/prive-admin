import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrateClient, trpc } from "@/trpc/server";
import { AppointmentsView } from "@/modules/appointments/ui/views/appointments-view";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const weekOffset = 0;

  void trpc.appointments.getAppointmentsForWeek.prefetch({
    offset: weekOffset,
  });

  return (
    <HydrateClient>
      <AppointmentsView weekOffset={weekOffset} />
    </HydrateClient>
  );
}
