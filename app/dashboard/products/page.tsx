import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProducts } from "@/data-access/product";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import ProductRow from "./ProductRow";

export default async function ProductsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const products = await getProducts();

  return (
    <div className="p-8 container">
      <h1 className="text-2xl">Products List</h1>
      <Link href="/products/new">New</Link>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>View</TableHead>
            <TableHead>Edit</TableHead>
            <TableHead>Delete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
