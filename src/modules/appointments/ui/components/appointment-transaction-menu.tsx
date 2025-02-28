"use client";

import { Button, Menu } from "@mantine/core";
import { trpc } from "@/trpc/client";
import { useSetAtom } from "jotai/index";
import { newTransactionDrawerAtom } from "@/lib/atoms";
import { Ellipsis } from "lucide-react";

interface Props {
  appointmentId: string;
  customerId: string;
}

export const AppointmentTransactionMenu = ({
  appointmentId,
  customerId,
}: Props) => {
  const utils = trpc.useUtils();

  const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);

  const onSuccess = () => {
    utils.transactions.getByAppointmentId.invalidate({
      appointmentId,
      includeCustomer: true,
    });
  };

  return (
    <>
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Button size={"xs"}>
            <Ellipsis size={14} />
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Transactions</Menu.Label>
          <Menu.Item
            onClick={() => {
              showNewTransactionDrawer({
                isOpen: true,
                orderId: null,
                appointmentId,
                customerId,
                onCreated: onSuccess,
              });
            }}
          >
            New Transaction
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
};
