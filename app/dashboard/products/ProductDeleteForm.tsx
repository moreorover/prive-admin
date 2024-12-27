"use client";

import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Product, productSchema} from "@/lib/schemas";
import {cn} from "@/lib/utils";
import {zodResolver} from "@hookform/resolvers/zod";

import {Button} from "@/components/ui/button";
import {deleteProduct} from "@/data-access/product";
import {useToast} from "@/hooks/use-toast";
import {Loader2} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {useForm} from "react-hook-form";

type Props = {
  product: Product;
  className?: string;
};

export default function ProductDeleteForm({product, className}: Props) {
  const router = useRouter();
  const {toast} = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Product>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      ...product,
    },
  });

  async function onSubmit(values: Product) {
    setSubmitting(true);
    const response = await deleteProduct(values);
    setSubmitting(false);

    if (response.type === "ERROR") {
      toast({
        variant: "destructive",
        description: response.message,
      });
    } else {
      toast({
        variant: "default",
        description: response.message,
      });
      router.back();
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-2", className)}
      >
        <FormField
          control={form.control}
          name="id"
          render={({field}) => (
            <FormItem className="sr-only">
              <FormLabel>ID</FormLabel>
              <FormControl>
                <Input type="hidden" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({field}) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input disabled={true} placeholder="John Doe" {...field} />
                {/* <ZodErrors error={state?.zodErrors?.name} /> */}
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              {"Deleteing..."}
            </>
          ) : (
            "Confirm"
          )}
        </Button>
      </form>
    </Form>
  );
}
