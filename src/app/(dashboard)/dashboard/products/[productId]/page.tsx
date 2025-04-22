import { auth } from "@/lib/auth";
import { ProductView } from "@/modules/products/ui/views/product-view";
import { HydrateClient, trpc } from "@/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type Props = {
	params: Promise<{ productId: string }>;
};

export default async function Page({ params }: Props) {
	const { productId } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return redirect("/");
	}

	void trpc.products.getOne.prefetch({ id: productId });

	return (
		<HydrateClient>
			<ProductView productId={productId} />
		</HydrateClient>
	);
}
