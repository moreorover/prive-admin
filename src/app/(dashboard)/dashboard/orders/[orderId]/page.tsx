import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrateClient, trpc } from "@/trpc/server";
import { OrderView } from "@/modules/orders/ui/components/order-view";

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function Page({ params }: Props) {
  const { orderId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  void trpc.orders.getOne.prefetch({ id: orderId });
  return (
    <HydrateClient>
      <OrderView orderId={orderId} />
    </HydrateClient>
  );
}
