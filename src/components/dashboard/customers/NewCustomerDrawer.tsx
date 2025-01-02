"use client";

import CustomerForm from "@/components/dashboard/customers/CustomerForm";
import { Customer } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { createCustomer } from "@/data-access/customer";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { newCustomerDrawerAtom } from "@/lib/atoms";

export default function NewCustomerDrawer() {
  const [value, setOpen] = useAtom(newCustomerDrawerAtom);

  async function onSubmit(data: Customer) {
    const response = await createCustomer(data);

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to create Customer",
        message: "Please try again.",
      });
    } else {
      setOpen({ isOpen: false });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Customer created.",
      });
    }
    return response;
  }

  function onDelete() {
    console.log("onDelete");
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() => setOpen({ isOpen: false })}
      position="right"
      title="Create Customer"
    >
      <CustomerForm
        onSubmitAction={onSubmit}
        onDelete={onDelete}
        customer={{ name: "" }}
      />
    </Drawer>
  );
}
