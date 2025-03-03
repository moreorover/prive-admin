import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrateClient, trpc } from "@/trpc/server";
import { AppointmentView } from "@/modules/appointments/ui/views/appointment-view";

type Props = {
  params: Promise<{ appointmentId: string }>;
};

export default async function Page({ params }: Props) {
  const { appointmentId } = await params;

  void trpc.appointments.getOne.prefetch({ id: appointmentId });
  void trpc.customers.getClientByAppointmentId.prefetch({ appointmentId });
  void trpc.customers.getPersonnelByAppointmentId.prefetch({ appointmentId });
  void trpc.customers.getAvailablePersonnelByAppointmentId.prefetch({
    appointmentId,
  });
  void trpc.transactions.getByAppointmentId.prefetch({
    appointmentId,
    includeCustomer: true,
  });
  void trpc.appointmentNotes.getNotesByAppointmentId.prefetch({
    appointmentId,
  });

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  return (
    <HydrateClient>
      <AppointmentView appointmentId={appointmentId} />
    </HydrateClient>
  );
}
