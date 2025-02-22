"use client";

import { Button, Menu } from "@mantine/core";
import { trpc } from "@/trpc/client";
import { useSetAtom } from "jotai/index";
import { newTransactionDrawerAtom } from "@/lib/atoms";
import { GetTransactionOptions } from "@/modules/appointments/types";
import { modals } from "@mantine/modals";
import { Ellipsis } from "lucide-react";

interface Props {
  appointmentId: string;
  customerId: string;
  transactionOptions: GetTransactionOptions;
}

export const AppointmentTransactionMenu = ({
  appointmentId,
  customerId,
  transactionOptions,
}: Props) => {
  const utils = trpc.useUtils();

  const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);

  const onSuccess = () => {
    utils.transactions.getManyByAppointmentId.invalidate({
      appointmentId,
      includeCustomer: true,
    });
    utils.transactions.getManyByAppointmentId.invalidate({
      appointmentId: null,
      includeCustomer: false,
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
            New Cash Transaction
          </Menu.Item>
          <Menu.Item
            onClick={() =>
              modals.openContextModal({
                modal: "transactionPickerModal",
                title: "Pick transactions",
                size: "xl",
                innerProps: {
                  customerId,
                  appointmentId,
                  transactionOptions,
                  onPicked: () => {
                    utils.transactions.getManyByAppointmentId.invalidate({
                      appointmentId: appointmentId,
                      includeCustomer: true,
                    });
                    utils.transactions.getManyByAppointmentId.invalidate({
                      appointmentId: null,
                      includeCustomer: false,
                    });
                  },
                },
              })
            }
          >
            Pick Transactions
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
};
