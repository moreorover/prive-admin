"use client";

import { Button, Paper, Table } from "@mantine/core";
import dayjs from "dayjs";
import { GetAppointmentsForWeek } from "@/modules/appointments/types";
import Link from "next/link";

interface Props {
  appointments: GetAppointmentsForWeek;
}

export function AppointmentsTable({ appointments }: Props) {
  const rows = appointments.map((appointment) => (
    <Table.Tr key={appointment.id}>
      <Table.Td>{appointment.name}</Table.Td>
      <Table.Td>{appointment.client.name}</Table.Td>
      <Table.Td>
        {dayjs(appointment.startsAt).format("DD MMM YYYY HH:mm")}
      </Table.Td>
      <Table.Td>
        <Button
          component={Link}
          href={`/dashboard/appointments/${appointment.id}`}
        >
          View
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper shadow="xs" p="sm">
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Client</Table.Th>
            <Table.Th>Starts At</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}
