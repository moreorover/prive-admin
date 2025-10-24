import { ConfirmDialog } from "@/components/confirm-dialog";
import { showSubmittedData } from "@/lib/show-submitted-data";
import { CustomersImportDialog } from "./customers-import-dialog";
import { CustomersMutateDrawer } from "./customers-mutate-drawer";
import { useCustomers } from "./customers-provider";

type Props = {
  onSuccess?: () => void;
};

export function CustomersDialogs({ onSuccess }: Props) {
  const { open, setOpen, currentRow, setCurrentRow } = useCustomers();
  return (
    <>
      <CustomersMutateDrawer
        key="customer-create"
        open={open === "create"}
        onOpenChange={() => setOpen("create")}
        onSuccess={onSuccess}
      />

      <CustomersImportDialog
        key="customers-import"
        open={open === "import"}
        onOpenChange={() => setOpen("import")}
      />

      {currentRow && (
        <>
          <CustomersMutateDrawer
            key={`customer-update-${currentRow.id}`}
            open={open === "update"}
            onOpenChange={() => {
              setOpen("update");
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
            onSuccess={onSuccess}
          />

          <ConfirmDialog
            key="customer-delete"
            destructive
            open={open === "delete"}
            onOpenChange={() => {
              setOpen("delete");
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            handleConfirm={() => {
              setOpen(null);
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
              showSubmittedData(
                currentRow,
                "The following customer has been deleted:",
              );
              onSuccess?.();
            }}
            className="max-w-md"
            title={`Delete this customer: ${currentRow.id} ?`}
            desc={
              <>
                You are about to delete a customer with the ID{" "}
                <strong>{currentRow.id}</strong>. <br />
                This action cannot be undone.
              </>
            }
            confirmText="Delete"
          />
        </>
      )}
    </>
  );
}
