import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCustomers } from "@/data-access/customer";
import CustomersPage from "@/components/dashboard/customers/CustomersPage";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const customers = await getCustomers();
  return <CustomersPage customers={customers} />;
}
