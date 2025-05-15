import { getSession } from "@/lib/auth-helper";
import { DashboardView } from "@/modules/dashboard/ui/views/dashboard-view";
import { HydrateClient } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function Page() {
	const session = await getSession();

	if (!session) {
		return redirect("/");
	}

	return (
		<HydrateClient>
			<DashboardView />
		</HydrateClient>
	);
}
