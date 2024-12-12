import CustomerForm from "@/app/customers/CustomerForm";
import { Modal } from "@/components/Modal";
import { getCustomer } from "@/data-access/customer";

export default async function EditCustomerModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await getCustomer(id);

  if (!customer?.id) {
    return (
      <Modal title="Not found" description="No Customer Found for that ID">
        <div className="p-8 max-w-md space-y-2">
          <h1 className="text-2xl">No Customer Found for that ID.</h1>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Update customer" description="Update customer as needed.">
      <div className="p-2 max-w-md">
        <CustomerForm customer={customer} />
      </div>
    </Modal>
  );
}
