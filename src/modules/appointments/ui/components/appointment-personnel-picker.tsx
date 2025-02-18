"use client";

import { Button } from "@mantine/core";
import { useSetAtom } from "jotai/index";
import { personnelPickerModalAtom } from "@/lib/atoms";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";

interface Props {
  appointmentId: string;
}

export const AppointmentPersonnelPicker = ({ appointmentId }: Props) => {
  const utils = trpc.useUtils();

  const showPersonnelPickerModal = useSetAtom(personnelPickerModalAtom);

  const [personnelOptions] =
    trpc.customers.getAvailablePersonnelByAppointmentId.useSuspenseQuery({
      appointmentId,
    });

  const pickPersonnel =
    trpc.appointments.linkPersonnelWithAppointment.useMutation({
      onSuccess: () => {
        notifications.show({
          color: "green",
          title: "Success!",
          message: "Personnel picked.",
        });
        utils.customers.getAvailablePersonnelByAppointmentId.invalidate({
          appointmentId,
        });
        utils.customers.getPersonnelByAppointmentId.invalidate({
          appointmentId,
        });
        showPersonnelPickerModal({
          isOpen: false,
          personnel: [],
          onConfirmAction: () => {},
        });
      },
      onError: () => {
        notifications.show({
          color: "red",
          title: "Failed to pick Transactions",
          message: "Please try again.",
        });
      },
    });

  async function onConfirmActionPersonnel(selectedRows: string[]) {
    pickPersonnel.mutate({
      personnel: selectedRows,
      appointmentId,
    });
  }

  return (
    <Button
      onClick={() => {
        showPersonnelPickerModal({
          isOpen: true,
          personnel: personnelOptions,
          onConfirmAction: onConfirmActionPersonnel,
        });
      }}
    >
      Pick
    </Button>
  );
};
