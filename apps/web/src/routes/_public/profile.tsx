import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { format } from "date-fns"
import { XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
      <SessionsCard currentSessionToken={session.session.token} />
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

function SessionsCard({ currentSessionToken }: { currentSessionToken: string }) {
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await authClient.listSessions()
      if (res.error) throw res.error
      return res.data
    },
  })

  const revokeMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await authClient.revokeSession({ token })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      toast.success("Session revoked")
      sessions.refetch()
    },
  })

  const revokeOthersMutation = useMutation({
    mutationFn: async () => {
      const res = await authClient.revokeSessions()
      if (res.error) throw res.error
    },
    onSuccess: () => {
      toast.success("All other sessions revoked")
      sessions.refetch()
    },
  })

  const sessionList = sessions.data ?? []
  const hasOtherSessions = sessionList.some((s) => s.token !== currentSessionToken)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Sessions</CardTitle>
        {hasOtherSessions && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => revokeOthersMutation.mutate()}
            disabled={revokeOthersMutation.isPending}
          >
            Revoke All Others
          </Button>
        )}
      </CardHeader>
      <CardContent className="m-2">
        {sessions.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading sessions...</p>
        ) : sessionList.length > 0 ? (
          <ul className="space-y-2">
            {sessionList.map((s) => (
              <li key={s.token} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {format(new Date(s.createdAt), "dd MMM yyyy HH:mm")}
                    </span>
                    {s.token === currentSessionToken && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Expires: {format(new Date(s.expiresAt), "dd MMM yyyy HH:mm")}
                  </div>
                </div>
                {s.token !== currentSessionToken && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => revokeMutation.mutate(s.token)}
                    disabled={revokeMutation.isPending}
                  >
                    <XIcon className="size-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No active sessions.</p>
        )}
      </CardContent>
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
