import { auth } from "@/lib/auth";
import { CustomerLayout } from "@/modules/customers/ui/layouts/customer-layout";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type React from "react";

interface Props {
	params: Promise<{ customerId: string }>;
	children: React.ReactNode;
}

export default async function Layout({ params, children }: Props) {
	const { customerId } = await params;
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return redirect("/sign-in");
	}

	return <CustomerLayout customerId={customerId}>{children}</CustomerLayout>;
}
