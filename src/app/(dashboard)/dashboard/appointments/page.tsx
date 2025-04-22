import { auth } from "@/lib/auth";
import { AppointmentsView } from "@/modules/appointments/ui/views/appointments-view";
import { HydrateClient } from "@/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return redirect("/");
	}

	return (
		<HydrateClient>
			<AppointmentsView />
		</HydrateClient>
	);
}
