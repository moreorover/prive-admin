import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppointmentPage } from "@/components/dashboard/appointments/AppointmentPage";
import { HydrateClient, trpc } from "@/trpc/server";

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
  void trpc.transactions.getManyByAppointmentId.prefetch({
    appointmentId,
    includeCustomer: true,
  });
  void trpc.transactions.getManyByAppointmentId.prefetch({
    appointmentId: null,
    includeCustomer: false,
  });

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  return (
    <HydrateClient>
      <AppointmentPage appointmentId={appointmentId} />
    </HydrateClient>
  );
}
