import CustomerForm from "@/app/customers/CustomerForm";
import { Modal } from "@/components/Modal";

export default async function NewCustomerModal() {
  const customer = { name: "" };

  return (
    <Modal title="New customer" description="Create customer as needed.">
      <div className="p-2 max-w-md">
        <CustomerForm customer={customer} />
      </div>
    </Modal>
  );
}
