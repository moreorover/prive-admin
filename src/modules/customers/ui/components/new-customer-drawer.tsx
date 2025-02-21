"use client";

import { Customer } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { newCustomerDrawerAtom } from "@/lib/atoms";
import { CustomerForm } from "@/modules/customers/ui/components/customer-form";
import { trpc } from "@/trpc/client";

export const NewCustomerDrawer = () => {
  const [value, setOpen] = useAtom(newCustomerDrawerAtom);

  const newCustomer = trpc.customers.create.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Customer created.",
      });
      setOpen({ isOpen: false, onCreated: () => {} });
      value.onCreated();
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to create Customer",
        message: "Please try again.",
      });
    },
  });

  async function onSubmit(data: Customer) {
    newCustomer.mutate({ customer: data });
  }

  function onDelete() {
    console.log("onDelete");
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() => setOpen({ isOpen: false, onCreated: () => {} })}
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
};
