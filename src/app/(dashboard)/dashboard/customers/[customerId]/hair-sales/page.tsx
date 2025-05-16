import { auth } from "@/lib/auth";
import { CustomerHairSalesView } from "@/modules/customers/ui/views/customer-hair-sales-view";
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

	return <CustomerHairSalesView customerId={customerId} />;
}
