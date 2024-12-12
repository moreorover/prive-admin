"use client";
import { TableCell, TableRow } from "@/components/ui/table";
import { Customer } from "@/lib/schemas";
import { Pencil, Trash } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  customer: Customer;
};

export default function UserRow({ customer }: Props) {
  const router = useRouter();

  const handleClickEdit = () => {
    router.push(`/customers/edit/${customer.id}`);
  };

  const handleClickDelete = () => {
    router.push(`/customers/delete/${customer.id}`);
  };

  return (
    <TableRow>
      <TableCell>{customer.id}</TableCell>
      <TableCell>{customer.name}</TableCell>
      <TableCell onClick={handleClickEdit}>
        <Pencil />
      </TableCell>
      <TableCell onClick={handleClickDelete}>
        <Trash />
      </TableCell>
    </TableRow>
  );
}
