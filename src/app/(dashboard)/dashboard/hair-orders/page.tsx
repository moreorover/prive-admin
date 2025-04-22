import { auth } from "@/lib/auth";
import { HairOrdersView } from "@/modules/hair_orders/ui/views/hair-orders-view";
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

	void trpc.hairOrders.getAll.prefetch();

	return (
		<HydrateClient>
			<HairOrdersView />
		</HydrateClient>
	);
}
