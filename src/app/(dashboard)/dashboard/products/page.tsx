import { auth } from "@/lib/auth";
import { ProductsView } from "@/modules/products/ui/views/products-view";
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

	void trpc.products.getAll.prefetch();
	return (
		<HydrateClient>
			<ProductsView />
		</HydrateClient>
	);
}
