import { ConfirmDialog } from "@/components/confirm-dialog";
import { showSubmittedData } from "@/lib/show-submitted-data";
import { ContactsImportDialog } from "./contacts-import-dialog";
import { ContactsMutateDrawer } from "./contacts-mutate-drawer";
import { useContacts } from "./contacts-provider";

type Props = {
  onSuccess?: () => void;
};

export function ContactsDialogs({ onSuccess }: Props) {
  const { open, setOpen, currentRow, setCurrentRow } = useContacts();
  return (
    <>
      <ContactsMutateDrawer
        key="contact-create"
        open={open === "create"}
        onOpenChange={() => setOpen("create")}
        onSuccess={onSuccess}
      />

      <ContactsImportDialog
        key="contacts-import"
        open={open === "import"}
        onOpenChange={() => setOpen("import")}
      />

      {currentRow && (
        <>
          <ContactsMutateDrawer
            key={`contact-update-${currentRow.id}`}
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
            key="contact-delete"
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
                "The following contact has been deleted:",
              );
              onSuccess?.();
            }}
            className="max-w-md"
            title={`Delete this contact: ${currentRow.id} ?`}
            desc={
              <>
                You are about to delete a contact with the ID{" "}
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
