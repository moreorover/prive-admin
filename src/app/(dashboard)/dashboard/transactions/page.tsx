import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTransactions } from "@/data-access/transaction";
import TransactionsPage from "@/components/dashboard/transactions/TransactionsPage";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const transactions = await getTransactions();
  return <TransactionsPage transactions={transactions} />;
}
