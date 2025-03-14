import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrateClient, trpc } from "@/trpc/server";
import { HairOrdersView } from "@/modules/hair_orders/ui/views/hair-orders-view";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  void trpc.hairOrders.getAll.prefetch();

  return (
    <HydrateClient>
      <HairOrdersView />
    </HydrateClient>
  );
}
