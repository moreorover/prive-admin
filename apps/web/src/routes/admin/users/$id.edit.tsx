import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router"
import { format } from "date-fns"
import { LogInIcon, Trash2Icon, XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/admin/users/$id/edit")({
  staticData: { title: "Edit User" },
  component: EditUserPage,
})

function EditUserPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const user = useQuery({
    queryKey: ["admin", "users", id],
    queryFn: async () => {
      const res = await authClient.admin.getUser({
        query: { id },
      })
      if (res.error) throw res.error
      return res.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await authClient.admin.removeUser({ userId: id })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      toast.success("User deleted")
      navigate({ to: "/admin/users" })
    },
  })

  if (user.isLoading) {
    return <div className="text-muted-foreground text-center">Loading...</div>
  }

  if (!user.data) {
    return <div className="text-muted-foreground text-center">User not found.</div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <UserInfoCard user={user.data} userId={id} onSuccess={() => user.refetch()} />
      <RoleCard userId={id} currentRole={(user.data.role ?? "user") as "user" | "admin"} onSuccess={() => user.refetch()} />
      <PasswordCard userId={id} />
      <BanCard userId={id} banned={!!user.data.banned} banReason={user.data.banReason} onSuccess={() => user.refetch()} />
      <SessionsCard userId={id} />
      <DangerZoneCard
        onDelete={() => setShowDeleteDialog(true)}
        onImpersonate={async () => {
          const res = await authClient.admin.impersonateUser({ userId: id })
          if (res.error) {
            toast.error("Failed to impersonate user")
            return
          }
          toast.success("Now impersonating user")
          router.invalidate()
        }}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function UserInfoCard({
  user,
  userId,
  onSuccess,
}: {
  user: { name: string; email: string }
  userId: string
  onSuccess: () => void
}) {
  const updateMutation = useMutation({
    mutationFn: async (value: { name: string }) => {
      const res = await authClient.admin.updateUser({
        userId,
        data: { name: value.name },
      })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      toast.success("User updated")
      onSuccess()
    },
  })

  const form = useForm({
    defaultValues: { name: user.name },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync(value)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Info</CardTitle>
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
            <Input value={user.email} disabled />
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

function RoleCard({
  userId,
  currentRole,
  onSuccess,
}: {
  userId: string
  currentRole: "user" | "admin"
  onSuccess: () => void
}) {
  const [role, setRole] = useState<"user" | "admin">(currentRole)

  const setRoleMutation = useMutation({
    mutationFn: async () => {
      const res = await authClient.admin.setRole({ userId, role })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      toast.success("Role updated")
      onSuccess()
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role</CardTitle>
      </CardHeader>
      <CardContent className="m-2">
        <Field>
          <FieldLabel>Role</FieldLabel>
          <Select value={role} onValueChange={(val) => setRole(val as "user" | "admin")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          onClick={() => setRoleMutation.mutate()}
          disabled={setRoleMutation.isPending || role === currentRole}
        >
          {setRoleMutation.isPending ? "Saving..." : "Update Role"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function PasswordCard({ userId }: { userId: string }) {
  const [password, setPassword] = useState("")

  const setPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await authClient.admin.setUserPassword({
        userId,
        newPassword: password,
      })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      toast.success("Password updated")
      setPassword("")
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
      </CardHeader>
      <CardContent className="m-2">
        <Field>
          <FieldLabel>New Password</FieldLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
          />
        </Field>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          onClick={() => setPasswordMutation.mutate()}
          disabled={setPasswordMutation.isPending || password.length < 8}
        >
          {setPasswordMutation.isPending ? "Saving..." : "Set Password"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function BanCard({
  userId,
  banned,
  banReason,
  onSuccess,
}: {
  userId: string
  banned: boolean
  banReason?: string | null
  onSuccess: () => void
}) {
  const [reason, setReason] = useState("")

  const banMutation = useMutation({
    mutationFn: async () => {
      const res = await authClient.admin.banUser({
        userId,
        banReason: reason || undefined,
      })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      toast.success("User banned")
      setReason("")
      onSuccess()
    },
  })

  const unbanMutation = useMutation({
    mutationFn: async () => {
      const res = await authClient.admin.unbanUser({ userId })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      toast.success("User unbanned")
      onSuccess()
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ban Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 m-2">
        {banned ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Banned</Badge>
              {banReason && (
                <span className="text-muted-foreground text-sm">Reason: {banReason}</span>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => unbanMutation.mutate()}
              disabled={unbanMutation.isPending}
            >
              {unbanMutation.isPending ? "Unbanning..." : "Unban User"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Badge variant="outline">Active</Badge>
            <Field>
              <FieldLabel>Ban Reason (optional)</FieldLabel>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for ban"
              />
            </Field>
            <Button
              variant="destructive"
              onClick={() => banMutation.mutate()}
              disabled={banMutation.isPending}
            >
              {banMutation.isPending ? "Banning..." : "Ban User"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SessionsCard({ userId }: { userId: string }) {
  const sessions = useQuery({
    queryKey: ["admin", "sessions", userId],
    queryFn: async () => {
      const res = await authClient.admin.listUserSessions({ userId })
      if (res.error) throw res.error
      return res.data
    },
  })

  const revokeMutation = useMutation({
    mutationFn: async (sessionToken: string) => {
      const res = await authClient.admin.revokeUserSession({ sessionToken })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      toast.success("Session revoked")
      sessions.refetch()
    },
  })

  const revokeAllMutation = useMutation({
    mutationFn: async () => {
      const res = await authClient.admin.revokeUserSessions({ userId })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      toast.success("All sessions revoked")
      sessions.refetch()
    },
  })

  const sessionList = sessions.data?.sessions ?? []

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Sessions</CardTitle>
        {sessionList.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => revokeAllMutation.mutate()}
            disabled={revokeAllMutation.isPending}
          >
            Revoke All
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
                  <div className="text-sm font-medium">
                    {format(new Date(s.createdAt), "dd MMM yyyy HH:mm")}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Expires: {format(new Date(s.expiresAt), "dd MMM yyyy HH:mm")}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => revokeMutation.mutate(s.token)}
                  disabled={revokeMutation.isPending}
                >
                  <XIcon className="size-4" />
                </Button>
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

function DangerZoneCard({
  onDelete,
  onImpersonate,
}: {
  onDelete: () => void
  onImpersonate: () => void
}) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2 m-2">
        <Button variant="outline" onClick={onImpersonate}>
          <LogInIcon className="mr-2 size-4" />
          Impersonate
        </Button>
        <Button variant="destructive" onClick={onDelete}>
          <Trash2Icon className="mr-2 size-4" />
          Delete User
        </Button>
      </CardContent>
    </Card>
  )
}
