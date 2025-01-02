"use client";

import OrderItemForm from "@/components/dashboard/orders/OrderItemForm";
import { OrderItem } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { updateOrderItem } from "@/data-access/orderItem";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { editOrderItemDrawerAtom } from "@/lib/atoms";

export default function EditOrderItemDrawer() {
  const [value, setOpen] = useAtom(editOrderItemDrawerAtom);

  async function onSubmit(data: OrderItem) {
    const response = await updateOrderItem({ ...data, id: value.orderItem.id });

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to create Order Item",
        message: "Please try again.",
      });
    } else {
      setOpen({
        isOpen: false,
        orderItem: {
          orderId: "",
          quantity: 0,
          totalPrice: 0,
          unitPrice: 0,
          productVariantId: "",
        },
        productOptions: [],
      });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Order Item created.",
      });
    }
    return response;
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() =>
        setOpen({
          isOpen: false,
          orderItem: {
            orderId: "",
            quantity: 0,
            totalPrice: 0,
            unitPrice: 0,
            productVariantId: "",
          },
          productOptions: [],
        })
      }
      position="right"
      title="Create Order Item"
    >
      <OrderItemForm
        onSubmitAction={onSubmit}
        orderItem={{
          id: value.orderItem.id,
          orderId: value.orderItem.orderId,
          productVariantId: value.orderItem.productVariantId,
          quantity: value.orderItem.quantity,
          unitPrice: value.orderItem.unitPrice,
          totalPrice: value.orderItem.totalPrice,
        }}
        productOptions={value.productOptions}
        isItemSelectDisabled={true}
      />
    </Drawer>
  );
}
