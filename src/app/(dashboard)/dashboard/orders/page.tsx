import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOrders } from "@/data-access/order";
import OrdersPage from "@/components/dashboard/orders/OrdersPage";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const orders = await getOrders();

  return <OrdersPage orders={orders} />;
}
