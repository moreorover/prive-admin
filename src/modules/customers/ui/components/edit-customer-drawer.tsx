"use client";

import { Customer } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { editCustomerDrawerAtom } from "@/lib/atoms";
import { CustomerForm } from "@/modules/customers/ui/components/customer-form";
import { trpc } from "@/trpc/client";

export const EditCustomerDrawer = () => {
  const [value, setOpen] = useAtom(editCustomerDrawerAtom);

  const editCustomer = trpc.customers.update.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Customer updated.",
      });
      setOpen({ isOpen: false, customer: { name: "" }, onUpdated: () => {} });
      value.onUpdated();
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to update Customer",
        message: "Please try again.",
      });
    },
  });

  async function onSubmit(data: Customer) {
    editCustomer.mutate({ customer: data });
  }

  function onDelete() {
    console.log("onDelete");
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() =>
        setOpen({ isOpen: false, customer: { name: "" }, onUpdated: () => {} })
      }
      position="right"
      title="Update Customer"
    >
      <CustomerForm
        onSubmitAction={onSubmit}
        onDelete={onDelete}
        customer={{ ...value.customer }}
      />
    </Drawer>
  );
};
