import { useState } from "react"
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_public/signup")({
  component: SignUpPage,
  beforeLoad: ({ context: { session } }) => {
    if (session) {
      throw redirect({ to: "/admin/dashboard" })
    }
  },
})

function SignUpPage() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setFormError(null)
      const { error } = await authClient.signUp.email({
        name: value.name,
        email: value.email,
        password: value.password,
      })
      if (error) {
        setFormError(error.message ?? "Something went wrong")
        return
      }
      const { error: signInError } = await authClient.signIn.email({
        email: value.email,
        password: value.password,
      })
      if (signInError) {
        setFormError(signInError.message ?? "Account created but sign in failed")
        return
      }
      await router.invalidate()
      await router.navigate({ to: "/admin/dashboard" })
    },
  })

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
          <CardDescription>
            Create an account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="flex flex-col gap-4"
          >
            {formError && (
              <div role="alert" className="text-destructive bg-destructive/10 rounded-lg border border-destructive/20 px-3 py-2 text-sm">
                {formError}
              </div>
            )}

            <form.Field
              name="name"
              validators={{
                onSubmit: ({ value }) =>
                  !value ? "Name is required" : undefined,
              }}
            >
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    id={field.name}
                    type="text"
                    placeholder="John Doe"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field
              name="email"
              validators={{
                onSubmit: ({ value }) =>
                  !value ? "Email is required" : undefined,
              }}
            >
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    id={field.name}
                    type="email"
                    placeholder="you@example.com"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onSubmit: ({ value }) =>
                  !value ? "Password is required" : undefined,
              }}
            >
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    id={field.name}
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Sign up"}
                </Button>
              )}
            </form.Subscribe>

            <p className="text-muted-foreground text-center text-sm">
              Already have an account?{" "}
              <Link to="/signin" className="text-foreground underline underline-offset-4 hover:text-foreground/80">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
