import { auth } from "@/lib/auth";
import { HairSaleView } from "@/modules/hair-sales/ui/views/hair-sale-view";
import { HydrateClient } from "@/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
	params: Promise<{ hairSaleId: string }>;
};

export default async function Page({ params }: Props) {
	const { hairSaleId } = await params;
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return redirect("/");
	}

	return (
		<HydrateClient>
			<HairSaleView hairSaleId={hairSaleId} />
		</HydrateClient>
	);
}
