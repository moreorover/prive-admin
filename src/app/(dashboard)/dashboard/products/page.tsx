import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getProducts } from "@/data-access/product";
import ProductsPage from "@/components/dashboard/products/ProductsPage";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const products = await getProducts();
  return <ProductsPage products={products} />;
}
