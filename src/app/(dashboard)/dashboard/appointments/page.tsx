import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrateClient } from "@/trpc/server";
import { AppointmentsView } from "@/modules/appointments/ui/views/appointments-view";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  return (
    <HydrateClient>
      <AppointmentsView />
    </HydrateClient>
  );
}
