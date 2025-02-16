import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAppointment } from "@/data-access/appointment";
import { getCustomer, getCustomers } from "@/data-access/customer";
import {
  getTransactionsByAppointmentId,
  getTransactionsOptions,
} from "@/data-access/transaction";
import AppointmentPage from "@/components/dashboard/appointments/AppointmentPage";
import { getAppointmentPersonnel } from "@/data-access/appointmentPersonnel";
import { HydrateClient, trpc } from "@/trpc/server";

type Props = {
  params: Promise<{ appointmentId: string }>;
};

export default async function Page({ params }: Props) {
  const { appointmentId } = await params;

  void trpc.appointments.getOne.prefetch({ id: appointmentId });

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const appointment = await getAppointment(appointmentId);

  if (!appointment) {
    return redirect("/dashboard/appointments");
  }

  const client = await getCustomer(appointment.clientId);

  const appointmentPersonnel = await getAppointmentPersonnel(appointmentId);
  const appointmentPersonnelIds = appointmentPersonnel.map(
    (personnel) => personnel.id,
  );

  const personnelOptions = await getCustomers();

  const filteredPersonnel = personnelOptions
    .filter((p) => p.id !== appointment.clientId)
    .filter((p) => !appointmentPersonnelIds.includes(p.id));

  const transactions = await getTransactionsByAppointmentId(appointmentId);

  const transactionOptions = await getTransactionsOptions();

  return (
    <HydrateClient>
      <AppointmentPage
        appointment={appointment}
        client={client!}
        transactions={transactions}
        personnelOptions={filteredPersonnel}
        personnel={appointmentPersonnel}
        transactionOptions={transactionOptions}
      />
    </HydrateClient>
  );
}
