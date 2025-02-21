"use client";

import { Order } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { newOrderDrawerAtom } from "@/lib/atoms";
import dayjs from "dayjs";
import { trpc } from "@/trpc/client";
import { OrderForm } from "@/modules/orders/ui/components/order-form";

export const NewOrderDrawer = () => {
  const [value, setOpen] = useAtom(newOrderDrawerAtom);

  const newOrder = trpc.orders.create.useMutation({
    onSuccess: () => {
      value.onCreated();
      setOpen({ isOpen: false, customerId: "", onCreated: () => {} });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Order created.",
      });
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to create Order",
        message: "Please try again.",
      });
    },
  });

  async function onSubmit(data: Order) {
    newOrder.mutate({ order: data, customerId: value.customerId });
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() =>
        setOpen({ isOpen: false, customerId: "", onCreated: () => {} })
      }
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
};
