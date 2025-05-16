import { auth } from "@/lib/auth";
import CalendarDemo from "@/modules/calendar/ui/views/NewCalendarView";
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
			<CalendarDemo />
		</HydrateClient>
	);
}
