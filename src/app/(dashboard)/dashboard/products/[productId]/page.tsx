import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getProduct } from "@/data-access/product";
import { getProductVariants } from "@/data-access/productVariant";
import ProductPage from "@/components/dashboard/products/ProductPage";

type Props = {
  params: Promise<{ productId: string }>;
};

export default async function Page({ params }: Props) {
  const { productId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const product = await getProduct(productId);

  if (!product) {
    return redirect("/dashboard/products");
  }

  const productVariants = await getProductVariants(productId);

  return <ProductPage product={product} productVariants={productVariants} />;
}
