import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { showSubmittedData } from "@/lib/show-submitted-data";
import { trpc } from "@/utils/trpc";
import type { Contact } from "../data/schema";

type ContactMutateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: Contact;
  onSuccess?: () => void;
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  phoneNumber: z.string().min(10, "Phone number too short.").or(z.literal("")),
});
type ContactForm = z.infer<typeof formSchema>;

export function ContactsMutateDrawer({
  open,
  onOpenChange,
  currentRow,
  onSuccess,
}: ContactMutateDrawerProps) {
  const isUpdate = !!currentRow;

  const form = useForm<ContactForm>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow
      ? { ...currentRow, phoneNumber: currentRow.phoneNumber ?? "" }
      : { name: "", phoneNumber: "" },
  });

  const createContactMutation = useMutation(
    trpc.contact.create.mutationOptions({
      onSuccess: () => {
        toast.success("Contact created successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create contact.");
      },
    }),
  );

  const updateContactMutation = useMutation(
    trpc.contact.update.mutationOptions({
      onSuccess: () => {
        toast.success("Contact updated successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update contact.");
      },
    }),
  );

  const onSubmit = (data: ContactForm) => {
    if (isUpdate) {
      // update data
      updateContactMutation.mutate({ id: currentRow?.id, ...data });
    } else {
      // save data
      createContactMutation.mutate({ ...data });
    }
    onOpenChange(false);
    form.reset();
    showSubmittedData(data);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        form.reset();
      }}
    >
      <SheetContent className="flex flex-col">
        <SheetHeader className="text-start">
          <SheetTitle>{isUpdate ? "Update" : "Create"} Contact</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? "Update the contact by providing necessary info."
              : "Add a new contact by providing necessary info."}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id="contacts-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 space-y-6 overflow-y-auto px-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter a name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter a phone number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          <Button form="contacts-form" type="submit">
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
