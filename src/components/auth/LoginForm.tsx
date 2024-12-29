"use client";

import { useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth-client";
import { signInFormSchema } from "@/lib/auth-schema";
import {
  Anchor,
  Button,
  Card,
  Checkbox,
  Group,
  PasswordInput,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { redirect } from "next/navigation";

export function LoginForm() {
  const { session, isLoading } = useSession();

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      email: "x@x.com",
      password: "password123",
    },

    validate: zodResolver(signInFormSchema),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (session) redirect("/dashboard");

  async function handleSubmit(values: typeof form.values) {
    const { email, password } = values;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, error } = await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: "/dashboard",
      },
      {
        onRequest: () => {
          // toast({
          //   title: "Please wait...",
          // });
        },
        onSuccess: () => {
          form.reset();
        },
        onError: (ctx) => {
          console.log({ ctx });
          // alert(ctx.error.message);
          // toast({
          //   title: ctx.error.message,
          //   variant: "destructive",
          // });
        },
      },
    );
  }

  return (
    <Card withBorder shadow="md" p={30} mt={30} radius="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label="Email"
          placeholder="test@example.com"
          required
          key={form.key("email")}
          {...form.getInputProps("email")}
        />
        <PasswordInput
          label="Password"
          placeholder="Your password"
          required
          mt="md"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        <Group mt="md" justify="space-between">
          <Checkbox label="Remember me" />
          <Anchor size="sm" href="#">
            Forgot Password？
          </Anchor>
        </Group>
        <Button fullWidth mt="xl" type="submit">
          Sign In
        </Button>
      </form>
    </Card>
  );
}
