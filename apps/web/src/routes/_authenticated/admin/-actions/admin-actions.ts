import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authClient } from "@/lib/auth-client"

async function unwrap<T extends { data: unknown; error: { message?: string } | null }>(result: T) {
  if (result.error) throw new Error(result.error.message || "The admin action failed")
  return result.data
}

function useAdminMutation<TInput, TResult>(
  queryClient: ReturnType<typeof useQueryClient>,
  mutationFn: (input: TInput) => Promise<TResult>,
  successMessage: string,
) {
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      await queryClient.invalidateQueries({ queryKey: ["admin", "sessions"] })
      notifications.show({ color: "green", message: successMessage })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
}

export function useAdminActions() {
  const queryClient = useQueryClient()

  return {
    createUser: useAdminMutation(
      queryClient,
      (input: { name: string; email: string; password: string; role: "admin" | "user" }) =>
        authClient.admin.createUser(input).then(unwrap),
      "User created",
    ),
    updateUser: useAdminMutation(
      queryClient,
      (input: { userId: string; data: { name: string; email: string } }) =>
        authClient.admin.updateUser(input).then(unwrap),
      "User details updated",
    ),
    setRole: useAdminMutation(
      queryClient,
      (input: { userId: string; role: "admin" | "user" }) => authClient.admin.setRole(input).then(unwrap),
      "User role updated",
    ),
    setPassword: useAdminMutation(
      queryClient,
      (input: { userId: string; newPassword: string }) => authClient.admin.setUserPassword(input).then(unwrap),
      "Password updated",
    ),
    banUser: useAdminMutation(
      queryClient,
      (input: { userId: string; banReason: string }) => authClient.admin.banUser(input).then(unwrap),
      "User banned",
    ),
    unbanUser: useAdminMutation(
      queryClient,
      (input: { userId: string }) => authClient.admin.unbanUser(input).then(unwrap),
      "User unbanned",
    ),
    revokeSessions: useAdminMutation(
      queryClient,
      (input: { userId: string }) => authClient.admin.revokeUserSessions(input).then(unwrap),
      "Sessions revoked",
    ),
    revokeSession: useAdminMutation(
      queryClient,
      (input: { sessionToken: string }) => authClient.admin.revokeUserSession(input).then(unwrap),
      "Session revoked",
    ),
    impersonateUser: useAdminMutation(
      queryClient,
      (input: { userId: string }) => authClient.admin.impersonateUser(input).then(unwrap),
      "Impersonation session started",
    ),
    removeUser: useAdminMutation(
      queryClient,
      (input: { userId: string }) => authClient.admin.removeUser(input).then(unwrap),
      "User removed",
    ),
  }
}
