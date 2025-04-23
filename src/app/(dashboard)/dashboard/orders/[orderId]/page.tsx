import { auth } from "@/lib/auth";
import { OrderView } from "@/modules/orders/ui/views/order-view";
import { HydrateClient, trpc } from "@/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
	void trpc.transactions.getByOrderId.prefetch({
		orderId,
		includeCustomer: true,
	});
	void trpc.orderItems.getByOrderId.prefetch({
		orderId,
	});
	void trpc.orderItems.getProductOptionsByOrderId.prefetch({ orderId });

	return (
		<HydrateClient>
			<OrderView orderId={orderId} />
		</HydrateClient>
	);
}
