"use client";

import { Order } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { editOrderDrawerAtom } from "@/lib/atoms";
import dayjs from "dayjs";
import { OrderForm } from "@/modules/orders/ui/components/order-form";
import { trpc } from "@/trpc/client";

export const EditOrderDrawer = () => {
  const [value, setOpen] = useAtom(editOrderDrawerAtom);

  const updateOrder = trpc.orders.update.useMutation({
    onSuccess: () => {
      value.onUpdated();
      setOpen({
        isOpen: false,
        order: {
          customerId: "",
          status: "PENDING",
          type: "PURCHASE",
          placedAt: dayjs().toDate(),
        },
        onUpdated: () => {},
      });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Order updated.",
      });
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to update Order",
        message: "Please try again.",
      });
    },
  });

  async function onSubmit(data: Order) {
    updateOrder.mutate({ order: data });
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() =>
        setOpen({
          isOpen: false,
          order: {
            customerId: "",
            status: "PENDING",
            type: "PURCHASE",
            placedAt: dayjs().toDate(),
          },
          onUpdated: () => {},
        })
      }
      position="right"
      title="Update Order"
    >
      <OrderForm onSubmitAction={onSubmit} order={{ ...value.order }} />
    </Drawer>
  );
};
