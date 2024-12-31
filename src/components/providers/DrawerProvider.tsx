"use client";

import NewCustomerDrawer from "@/components/customers/NewCustomerDrawer";
import EditCustomerDrawer from "@/components/customers/EditCustomerDrawer";

export default function DrawerProvider() {
  return (
    <>
      <NewCustomerDrawer />
      <EditCustomerDrawer />
    </>
  );
}
