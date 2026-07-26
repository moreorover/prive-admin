import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"
import { type Currency } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

export const sessionsQueryKey = ["auth", "sessions"] as const

export function useRevokeSessionAction({ onRevoked }: { onRevoked?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => authClient.revokeSession({ token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey })
      notifications.show({ color: "green", message: "Session terminated" })
      onRevoked?.()
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
}

export function useUpdateUserProfileAction({
  initialName,
  initialCurrency,
  onUpdated,
}: {
  initialName: string
  initialCurrency: Currency
  onUpdated?: () => void
}) {
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const userSettingsQueryOptions = trpc.userSettings.get.queryOptions()
  const settingsMutation = useMutation({
    ...trpc.userSettings.update.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userSettingsQueryOptions.queryKey }),
  })

  const updateUserProfile = async (values: { name: string; preferredCurrency: Currency }) => {
    setSubmitting(true)
    try {
      const tasks: Promise<unknown>[] = []
      if (values.name !== initialName) {
        tasks.push(
          new Promise<void>((resolve, reject) => {
            authClient.updateUser({
              name: values.name,
              fetchOptions: {
                onSuccess: () => resolve(),
                onError: (error) => reject(new Error(error.error.message)),
              },
            })
          }),
        )
      }
      if (values.preferredCurrency !== initialCurrency) {
        tasks.push(settingsMutation.mutateAsync({ preferredCurrency: values.preferredCurrency }))
      }
      await Promise.all(tasks)
      queryClient.invalidateQueries({ queryKey: ["auth"] })
      queryClient.invalidateQueries({ queryKey: userSettingsQueryOptions.queryKey })
      notifications.show({ color: "green", message: "Profile updated" })
      onUpdated?.()
    } catch (error) {
      notifications.show({ color: "red", message: error instanceof Error ? error.message : "Update failed" })
    } finally {
      setSubmitting(false)
    }
  }

  return { submitting, updateUserProfile }
}
