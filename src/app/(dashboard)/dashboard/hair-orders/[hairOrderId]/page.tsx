import { auth } from "@/lib/auth";
import { HairOrderView } from "@/modules/hair_orders/ui/views/hair-order-view";
import { HydrateClient, trpc } from "@/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type Props = {
	params: Promise<{ hairOrderId: string }>;
};

export default async function Page({ params }: Props) {
	const { hairOrderId } = await params;
	const parsedHairOrderId = Number.parseInt(hairOrderId);

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return redirect("/");
	}

	void trpc.hairOrders.getById.prefetch({ id: parsedHairOrderId });

	return (
		<HydrateClient>
			<HairOrderView hairOrderId={parsedHairOrderId} />
		</HydrateClient>
	);
}
