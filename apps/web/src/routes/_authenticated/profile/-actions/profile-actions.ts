import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"
import { type Currency } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

export const sessionsQueryKey = ["auth", "sessions"] as const
export const passkeysQueryKey = ["auth", "passkeys"] as const

export async function listPasskeys() {
  const result = await authClient.passkey.listUserPasskeys()
  if (result.error) throw new Error(result.error.message)
  return result.data ?? []
}

export type TwoFactorSetup = { totpURI: string; backupCodes: string[] }

export function useEnableTwoFactorAction() {
  const [submitting, setSubmitting] = useState(false)
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [enabled, setEnabled] = useState(false)

  const enableTwoFactor = async (password: string) => {
    setSubmitting(true)
    void authClient.twoFactor
      .enable({ password, method: "totp", issuer: "Privé" })
      .then((result) => {
        if (result.error) throw new Error(result.error.message)
        if (result.data.method !== "totp") throw new Error("Unexpected two-factor method")
        setSetup({ totpURI: result.data.totpURI, backupCodes: result.data.backupCodes })
      })
      .catch((error) => {
        notifications.show({
          color: "red",
          message: error instanceof Error ? error.message : "Two-factor setup failed",
        })
      })
      .finally(() => setSubmitting(false))
  }

  const verifyTwoFactor = async (code: string) => {
    const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false })
    if (result.error) throw new Error(result.error.message)
    notifications.show({ color: "green", message: "Two-factor authentication enabled" })
    setSetup(null)
    setEnabled(true)
  }

  return { submitting, setup, enabled, enableTwoFactor, verifyTwoFactor, clearSetup: () => setSetup(null) }
}

export function useAddPasskeyAction({ username }: { username?: string }) {
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)

  const addPasskey = async () => {
    setSubmitting(true)
    const name = username?.trim()
    void authClient.passkey
      .addPasskey(name ? { name } : undefined)
      .then((result) => {
        if (result.error) throw new Error(result.error.message)
        queryClient.invalidateQueries({ queryKey: passkeysQueryKey })
        notifications.show({ color: "green", message: "Passkey added" })
      })
      .catch((error) => {
        notifications.show({ color: "red", message: error instanceof Error ? error.message : "Passkey setup failed" })
      })
      .finally(() => setSubmitting(false))
  }

  return { submitting, addPasskey }
}

export function useRevokePasskeyAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await authClient.passkey.deletePasskey({ id })
      if (result.error) throw new Error(result.error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: passkeysQueryKey })
      notifications.show({ color: "green", message: "Passkey revoked" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
}

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
