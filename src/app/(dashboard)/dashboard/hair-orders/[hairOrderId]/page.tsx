import { auth } from "@/lib/auth";
import { HairOrderView } from "@/modules/hair_orders/ui/views/hair-order-view";
import { HydrateClient, trpc } from "@/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type Props = {
	params: Promise<{ hairOrderId: number }>;
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
