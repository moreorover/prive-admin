import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAppointment } from "@/data-access/appointment";
import AppointmentPage from "@/components/dashboard/appointments/AppointmentPage";

type Props = {
  params: Promise<{ appointmentId: string }>;
};

export default async function Page({ params }: Props) {
  const { appointmentId } = await params;

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

  return <AppointmentPage appointment={appointment} />;
}
