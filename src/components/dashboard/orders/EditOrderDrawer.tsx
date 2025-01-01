"use client";

import OrderForm from "@/components/dashboard/orders/OrderForm";
import { Order } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { updateOrder } from "@/data-access/order";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { editOrderDrawerAtom } from "@/lib/atoms";
import dayjs from "dayjs";

export default function EditOrderDrawer() {
  const [value, setOpen] = useAtom(editOrderDrawerAtom);

  async function onSubmit(data: Order) {
    const response = await updateOrder({ ...data, id: value.order.id });

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to update Order",
        message: "Please try again.",
      });
    } else {
      setOpen({
        isOpen: false,
        order: {
          customerId: "",
          status: "PENDING",
          placedAt: dayjs().toDate(),
        },
      });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Order updated.",
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
          order: {
            customerId: "",
            status: "PENDING",
            placedAt: dayjs().toDate(),
          },
        })
      }
      position="right"
      title="Update Order"
    >
      <OrderForm onSubmitAction={onSubmit} order={{ ...value.order }} />
    </Drawer>
  );
}
