import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOrder, getOrderTotal } from "@/data-access/order";
import OrderPage from "@/components/dashboard/orders/OrderPage";
import { getCustomer } from "@/data-access/customer";
import { getOrderItemsByOrderId } from "@/data-access/orderItem";
import { getProducts } from "@/data-access/product";

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

  const orderTotal = await getOrderTotal(orderId);

  const customer = await getCustomer(order.customerId);

  const orderItems = await getOrderItemsByOrderId(orderId);

  const orderItemsShaped = orderItems.map((orderItem) => ({
    id: orderItem.id,
    product: orderItem.productVariant.product.name,
    productVariant: orderItem.productVariant.size,
    quantity: orderItem.quantity,
    unitPrice: orderItem.unitPrice,
    totalPrice: orderItem.totalPrice,
    orderItem: orderItem,
  }));

  const productOptions = await getProducts();

  const productOptionsShaped = productOptions.flatMap((product) =>
    product.variants.map((variant) => ({
      value: variant.id,
      label: `${product.name} ${variant.size}`,
    })),
  );

  return (
    <OrderPage
      order={order}
      orderTotal={orderTotal}
      customer={customer!}
      orderItems={orderItemsShaped}
      productOptions={productOptionsShaped}
    />
  );
}
