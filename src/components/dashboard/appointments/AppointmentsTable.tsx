"use client";

import { Table, Paper } from "@mantine/core";
import { Appointment } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

interface Props {
  appointments: Appointment[];
}

export default function AppointmentsTable({ appointments }: Props) {
  const router = useRouter();

  const rows = appointments.map((appointment) => (
    <Table.Tr
      key={appointment.id}
      onClick={() => {
        router.push(`/dashboard/appointments/${appointment.id}`);
      }}
    >
      <Table.Td>{appointment.id}</Table.Td>
      <Table.Td>{appointment.name}</Table.Td>
      <Table.Td>
        {dayjs(appointment.startsAt).format("DD MMM YYYY HH:mm")}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper shadow="xs" p="sm">
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Starts At</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}
