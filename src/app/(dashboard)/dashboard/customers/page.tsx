import { auth } from "@/lib/auth";
import { CustomersView } from "@/modules/customers/ui/views/customers-view";
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

	void trpc.customers.getAll.prefetch();

	return (
		<HydrateClient>
			<CustomersView />
		</HydrateClient>
	);
}
