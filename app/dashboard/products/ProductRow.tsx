"use client";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Product } from "@/lib/schemas";
import { ArrowUpRight, Pencil, Trash } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  product: Product;
};

export default function UserRow({ product }: Props) {
  const router = useRouter();

  const handleClickView = () => {
    router.push(`/dashboard/products/${product.id}`);
  };

  const handleClickEdit = () => {
    router.push(`/products/edit/${product.id}`);
  };

  const handleClickDelete = () => {
    router.push(`/products/delete/${product.id}`);
  };

  return (
    <TableRow>
      <TableCell>{product.name}</TableCell>
      <TableCell>{product.description}</TableCell>
      <TableCell onClick={handleClickView}>
        <ArrowUpRight />
      </TableCell>
      <TableCell onClick={handleClickEdit}>
        <Pencil />
      </TableCell>
      <TableCell onClick={handleClickDelete}>
        <Trash />
      </TableCell>
    </TableRow>
  );
}
