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

  const searchParamWeekOffset = (await searchParams).offset;
  let offset;
  if (!searchParamWeekOffset) {
    offset = 0;
  }
  if (typeof searchParamWeekOffset === "string") {
    offset = parseInt(searchParamWeekOffset) || 0;
  }

  void trpc.appointments.getAppointmentsForWeek.prefetch({
    offset,
  });

  return (
    <HydrateClient>
      <AppointmentsView offset={offset} />
    </HydrateClient>
  );
}
