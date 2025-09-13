import { getSession } from "@/lib/auth-helper";
import { AdminView } from "@/modules/admin/ui/views/admin-view";
import { redirect } from "next/navigation";

export default async function Page() {
	const session = await getSession();

	if (!session) {
		redirect("/sign-in");
	}

	if (session.user.role !== "admin") {
		redirect("/profile");
	}

	return <AdminView />;
}
