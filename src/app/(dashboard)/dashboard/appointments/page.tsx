import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAppointments } from "@/data-access/appointment";
import AppointmentsPage from "@/components/dashboard/appointments/AppointmentsPage";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const appointments = await getAppointments();
  return <AppointmentsPage appointments={appointments} />;
}
