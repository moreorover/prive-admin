import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOrder } from "@/data-access/order";
import OrderPage from "@/components/dashboard/orders/OrderPage";
import { getCustomer } from "@/data-access/customer";

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function Page({ params }: Props) {
  const { orderId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const order = await getOrder(orderId);

  if (!order) {
    return redirect("/dashboard/orders");
  }

  const customer = await getCustomer(order.customerId);

  return <OrderPage order={order} customer={customer!} />;
}
