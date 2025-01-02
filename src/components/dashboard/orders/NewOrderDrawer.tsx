"use client";

import OrderForm from "@/components/dashboard/orders/OrderForm";
import { Order } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { createOrder } from "@/data-access/order";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { newOrderDrawerAtom } from "@/lib/atoms";
import dayjs from "dayjs";

export default function NewOrderDrawer() {
  const [value, setOpen] = useAtom(newOrderDrawerAtom);

  async function onSubmit(data: Order) {
    const response = await createOrder(data);

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to create Order",
        message: "Please try again.",
      });
    } else {
      setOpen({ isOpen: false, customerId: "" });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Order created.",
      });
    }
    return response;
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() => setOpen({ isOpen: false, customerId: "" })}
      position="right"
      title="Create Order"
    >
      <OrderForm
        onSubmitAction={onSubmit}
        order={{
          customerId: value.customerId,
          status: "PENDING",
          type: "SALE",
          placedAt: dayjs().toDate(),
        }}
      />
    </Drawer>
  );
}
