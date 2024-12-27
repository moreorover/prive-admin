import ProductDeleteForm from "@/app/dashboard/products/ProductDeleteForm";
import {Modal} from "@/components/Modal";
import {getProduct} from "@/data-access/product";

export default async function EditProductModal({
                                                 params,
                                               }: {
  params: Promise<{ id: string }>;
}) {
  const {id} = await params;

  const product = await getProduct(id);

  if (!product?.id) {
    return (
      <Modal title="Not found" description="No Product Found for that ID">
        <div className="p-8 max-w-md space-y-2">
          <h1 className="text-2xl">No Product Found for that ID.</h1>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Delete product" description="Deleted product as needed.">
      <div className="p-2 max-w-md">
        <ProductDeleteForm product={product}/>
      </div>
    </Modal>
  );
}
