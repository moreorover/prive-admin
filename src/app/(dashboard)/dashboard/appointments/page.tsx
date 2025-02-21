import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrateClient, trpc } from "@/trpc/server";
import { AppointmentsView } from "@/modules/appointments/ui/views/appointments-view";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ searchParams }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const searchParamWeekOffset = (await searchParams).weekOffset;
  let weekOffset = 0;
  if (typeof searchParamWeekOffset === "string") {
    weekOffset = parseInt(searchParamWeekOffset) || 0;
  }

  void trpc.appointments.getAppointmentsForWeek.prefetch({
    offset: weekOffset,
  });

  return (
    <HydrateClient>
      <AppointmentsView weekOffset={weekOffset} />
    </HydrateClient>
  );
}
