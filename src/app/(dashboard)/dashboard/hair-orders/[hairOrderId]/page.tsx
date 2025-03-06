import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrateClient, trpc } from "@/trpc/server";
import { HairOrderView } from "@/modules/hair-orders/ui/views/hair-order-view";

type Props = {
  params: Promise<{ hairOrderId: string }>;
};

export default async function Page({ params }: Props) {
  const { hairOrderId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  void trpc.hairOrders.getById.prefetch({ id: hairOrderId });

  return (
    <HydrateClient>
      <HairOrderView hairOrderId={hairOrderId} />
    </HydrateClient>
  );
}
