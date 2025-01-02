"use client";

import OrderItemForm from "@/components/dashboard/orders/OrderItemForm";
import { OrderItem } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { createOrderItem } from "@/data-access/orderItem";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { newOrderItemDrawerAtom } from "@/lib/atoms";

export default function NewOrderItemDrawer() {
  const [value, setOpen] = useAtom(newOrderItemDrawerAtom);

  async function onSubmit(data: OrderItem) {
    console.log(data);
    const response = await createOrderItem(data);

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to create OrderItem",
        message: "Please try again.",
      });
    } else {
      setOpen({ isOpen: false, orderId: "", productOptions: [] });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "OrderItem created.",
      });
    }
    return response;
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() =>
        setOpen({ isOpen: false, orderId: "", productOptions: [] })
      }
      position="right"
      title="Create OrderItem"
    >
      <OrderItemForm
        onSubmitAction={onSubmit}
        orderItem={{
          orderId: value.orderId,
          productVariantId: "",
          quantity: 0,
          unitPrice: 0,
          totalPrice: 0,
        }}
        productOptions={value.productOptions}
      />
    </Drawer>
  );
}
