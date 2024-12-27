import ProductForm from "@/app/dashboard/products/ProductForm";
import { Modal } from "@/components/Modal";

export default async function NewProductModal() {
  const product = { name: "", description: "" };

  return (
    <Modal title="New product" description="Create product as needed.">
      <div className="p-2 max-w-md">
        <ProductForm product={product} />
      </div>
    </Modal>
  );
}
