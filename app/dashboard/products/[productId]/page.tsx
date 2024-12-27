import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProduct } from "@/data-access/product";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ productId: string }>;
};

export default async function ProductPage({ params }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const { productId } = await params;
  const product = await getProduct(productId);

  if (!product) {
    return redirect("/dashboard/products");
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
      <p className="text-gray-600 mb-6">{product.description}</p>

      <h2 className="text-xl font-semibold mb-2">Variants</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {product.variants.map((variant) => (
          <Card key={variant.id}>
            <CardHeader>
              <CardTitle>{variant.size}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Price: ${variant.price / 100}</p>
              <p>Stock: {variant.stock}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="default">Add New Variant</Button>
    </div>
  );
}
