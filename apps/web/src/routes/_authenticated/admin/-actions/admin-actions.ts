import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authClient } from "@/lib/auth-client"

async function unwrap<T extends { data: unknown; error: { message?: string } | null }>(result: T) {
  if (result.error) throw new Error(result.error.message || "The admin action failed")
  return result.data
}

export function useAdminActions() {
  const queryClient = useQueryClient()
  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] })

  const mutation = <TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>, successMessage: string) =>
    useMutation({
      mutationFn,
      onSuccess: async () => {
        await refreshUsers()
        notifications.show({ color: "green", message: successMessage })
      },
      onError: (error) => notifications.show({ color: "red", message: error.message }),
    })

  return {
    createUser: mutation(
      (input: { name: string; email: string; password: string; role: "admin" | "user" }) =>
        authClient.admin.createUser(input).then(unwrap),
      "User created",
    ),
    updateUser: mutation(
      (input: { userId: string; data: { name: string } }) => authClient.admin.updateUser(input).then(unwrap),
      "User details updated",
    ),
    setRole: mutation(
      (input: { userId: string; role: "admin" | "user" }) => authClient.admin.setRole(input).then(unwrap),
      "User role updated",
    ),
    setPassword: mutation(
      (input: { userId: string; newPassword: string }) => authClient.admin.setUserPassword(input).then(unwrap),
      "Password updated",
    ),
    banUser: mutation(
      (input: { userId: string; banReason: string }) => authClient.admin.banUser(input).then(unwrap),
      "User banned",
    ),
    unbanUser: mutation((input: { userId: string }) => authClient.admin.unbanUser(input).then(unwrap), "User unbanned"),
    revokeSessions: mutation(
      (input: { userId: string }) => authClient.admin.revokeUserSessions(input).then(unwrap),
      "Sessions revoked",
    ),
    impersonateUser: mutation(
      (input: { userId: string }) => authClient.admin.impersonateUser(input).then(unwrap),
      "Impersonation session started",
    ),
    removeUser: mutation(
      (input: { userId: string }) => authClient.admin.removeUser(input).then(unwrap),
      "User removed",
    ),
  }
}
