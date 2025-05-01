import { auth } from "@/lib/auth";
import { trpc } from "@/trpc/server";
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

	return <div>Customer</div>;
}
