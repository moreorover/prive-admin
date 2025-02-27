import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrateClient, trpc } from "@/trpc/server";
import { CustomerView } from "@/modules/customers/ui/views/customer-view";

type Props = {
  params: Promise<{ customerId: string }>;
};

export default async function Page({ params }: Props) {
  const { customerId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  void trpc.customers.getOne.prefetch({ id: customerId });
  void trpc.appointments.getAppointmentsByCustomerId.prefetch({ customerId });
  // TODO: prefetch orders

  return (
    <HydrateClient>
      <CustomerView customerId={customerId} />
    </HydrateClient>
  );
}
