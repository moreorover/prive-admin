import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type Props = {
	params: Promise<{ customerId: string }>;
};

export default async function Page({ params }: Props) {
	const { customerId } = await params;
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return redirect("/");
	}

	return redirect(`/dashboard/customers/${customerId}/appointments`);

	// return <CustomerAppointmentsView customerId={customerId} />;
}
