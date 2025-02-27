import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrateClient, trpc } from "@/trpc/server";
import { ProductsView } from "@/modules/products/ui/views/products-view";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  void trpc.products.getAll.prefetch();
  return (
    <HydrateClient>
      <ProductsView />
    </HydrateClient>
  );
}
