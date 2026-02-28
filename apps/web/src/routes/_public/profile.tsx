import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/_public/profile")({
  staticData: { title: "Profile" },
  beforeLoad: ({ context: { session } }) => {
    if (!session) {
      throw redirect({ to: "/signin" })
    }
  },
  component: ProfilePage,
})

function ProfilePage() {
  const { session } = Route.useRouteContext()
  const router = useRouter()

  if (!session) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <ProfileInfoCard
        name={session.user.name}
        email={session.user.email}
        onSuccess={() => router.invalidate()}
      />
      <ChangePasswordCard />
    </div>
  )
}

function ProfileInfoCard({
  name,
  email,
  onSuccess,
}: {
  name: string
  email: string
  onSuccess: () => void
}) {
  const updateMutation = useMutation({
    mutationFn: async (value: { name: string }) => {
      const res = await authClient.updateUser({ name: value.name })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      toast.success("Profile updated")
      onSuccess()
    },
  })

  const form = useForm({
    defaultValues: { name },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync(value)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Info</CardTitle>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <CardContent className="space-y-4 m-2">
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input value={email} disabled />
          </Field>

          <form.Field
            name="name"
            validators={{
              onSubmit: ({ value }) => (!value ? "Name is required" : undefined),
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Full name"
                />
              </Field>
            )}
          </form.Field>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Update"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
      })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      toast.success("Password changed")
      setCurrentPassword("")
      setNewPassword("")
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 m-2">
        <Field>
          <FieldLabel>Current Password</FieldLabel>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>New Password</FieldLabel>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 8 characters"
          />
        </Field>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          onClick={() => changePasswordMutation.mutate()}
          disabled={
            changePasswordMutation.isPending ||
            !currentPassword ||
            newPassword.length < 8
          }
        >
          {changePasswordMutation.isPending ? "Saving..." : "Change Password"}
        </Button>
      </CardFooter>
    </Card>
  )
}
