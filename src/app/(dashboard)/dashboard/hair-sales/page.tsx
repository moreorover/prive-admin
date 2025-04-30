import { auth } from "@/lib/auth";
import { HairSalesView } from "@/modules/hair-sales/ui/views/hair-sales-view";
import { HydrateClient, trpc } from "@/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  void trpc.hairSales.getAll.prefetch();

  return (
    <HydrateClient>
      <HairSalesView />
    </HydrateClient>
  );
}
