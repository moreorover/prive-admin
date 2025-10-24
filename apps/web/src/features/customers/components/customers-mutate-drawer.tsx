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
import type { Customer } from "../data/schema";

type CustomerMutateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: Customer;
  onSuccess?: () => void;
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  phoneNumber: z.string().min(10, "Phone number too short.").or(z.literal("")),
});
type CustomerForm = z.infer<typeof formSchema>;

export function CustomersMutateDrawer({
  open,
  onOpenChange,
  currentRow,
  onSuccess,
}: CustomerMutateDrawerProps) {
  const isUpdate = !!currentRow;

  const form = useForm<CustomerForm>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow
      ? { ...currentRow, phoneNumber: currentRow.phoneNumber ?? "" }
      : { name: "", phoneNumber: "" },
  });

  const createCustomerMutation = useMutation(
    trpc.customer.create.mutationOptions({
      onSuccess: () => {
        toast.success("Customer created successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create customer.");
      },
    }),
  );

  const updateCustomerMutation = useMutation(
    trpc.customer.update.mutationOptions({
      onSuccess: () => {
        toast.success("Customer updated successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update customer.");
      },
    }),
  );

  const onSubmit = (data: CustomerForm) => {
    if (isUpdate) {
      // update data
      updateCustomerMutation.mutate({ id: currentRow?.id, ...data });
    } else {
      // save data
      createCustomerMutation.mutate({ ...data });
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
          <SheetTitle>{isUpdate ? "Update" : "Create"} Customer</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? "Update the customer by providing necessary info."
              : "Add a new customer by providing necessary info."}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id="customers-form"
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
          <Button form="customers-form" type="submit">
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
