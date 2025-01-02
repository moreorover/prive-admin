"use client";

import CustomerForm from "@/components/dashboard/customers/CustomerForm";
import { Customer } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { updateCustomer } from "@/data-access/customer";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { editCustomerDrawerAtom } from "@/lib/atoms";

export default function EditCustomerDrawer() {
  const [value, setOpen] = useAtom(editCustomerDrawerAtom);

  async function onSubmit(data: Customer) {
    const response = await updateCustomer({ ...data, id: value.customer.id });

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to update Customer",
        message: "Please try again.",
      });
    } else {
      setOpen({ isOpen: false, customer: { name: "" } });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Customer updated.",
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
      onClose={() => setOpen({ isOpen: false, customer: { name: "" } })}
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
}
