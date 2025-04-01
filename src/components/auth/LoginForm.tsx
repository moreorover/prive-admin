"use client";

import { signInFormSchema } from "@/lib/auth-schema";
import { Alert, Button, Card, PasswordInput, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { login } from "@/actions/login";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email already in use with different provider!"
      : "";

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      email: process.env.NODE_ENV === "development" ? "x@x.com" : "",
      password: process.env.NODE_ENV === "development" ? "password123" : "",
    },

    validate: zodResolver(signInFormSchema),
  });

  const onSubmit = (values: typeof form.values) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      login(values, callbackUrl)
        .then((data) => {
          if (data?.error) {
            form.reset();
            setError(data.error);
          }

          // if (data?.success) {
          //   form.reset();
          //   setSuccess(data.success);
          // }
          //
          // if (data?.twoFactor) {
          //   setShowTwoFactor(true);
          // }
        })
        .catch(() => setError("Something went wrong"));
    });
  };

  return (
    <Card withBorder shadow="md" p={30} mt={30} radius="md">
      <form onSubmit={form.onSubmit(onSubmit)}>
        <TextInput
          label="Email"
          placeholder="test@example.com"
          required
          name="email"
          autoComplete="email"
          key={form.key("email")}
          {...form.getInputProps("email")}
        />
        <PasswordInput
          label="Password"
          placeholder="Your password"
          required
          name="password"
          autoComplete="current-password"
          mt="md"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        {/*<Group mt="md" justify="space-between">*/}
        {/*  <Checkbox label="Remember me" />*/}
        {/*  <Anchor size="sm" href="#">*/}
        {/*    Forgot Password？*/}
        {/*  </Anchor>*/}
        {/*</Group>*/}
        <Alert color="red">{error}</Alert>
        <Button fullWidth mt="xl" type="submit">
          Sign In
        </Button>
      </form>
    </Card>
  );
}
