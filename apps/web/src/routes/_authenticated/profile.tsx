import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"
import { type Currency } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

import { ProfilePage } from "./-components/profile-page"
import {
  listPasskeys,
  passkeysQueryKey,
  sessionsQueryKey,
  useAddPasskeyAction,
  useEnableTwoFactorAction,
  useRevokeSessionAction,
  useUpdateUserProfileAction,
} from "./profile/-actions/profile-actions"

export const Route = createFileRoute("/_authenticated/profile")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: sessionsQueryKey,
        queryFn: () => authClient.listSessions(),
      }),
      context.queryClient.ensureQueryData({ queryKey: passkeysQueryKey, queryFn: listPasskeys }),
      context.queryClient.ensureQueryData(trpc.userSettings.get.queryOptions()),
    ])
  },
})

function RouteComponent() {
  const { data: current, isPending } = authClient.useSession()
  const [terminatingId, setTerminatingId] = useState<string | undefined>()
  const sessionsResult = useQuery({
    queryKey: sessionsQueryKey,
    queryFn: () => authClient.listSessions(),
  }).data
  const passkeys = useQuery({ queryKey: passkeysQueryKey, queryFn: listPasskeys }).data
  const userSettingsQueryOptions = trpc.userSettings.get.queryOptions()
  const settings = useQuery(userSettingsQueryOptions).data
  const initialCurrency: Currency = settings?.preferredCurrency === "GBP" ? "GBP" : "EUR"
  const revokeSession = useRevokeSessionAction({ onRevoked: () => setTerminatingId(undefined) })
  const updateProfile = useUpdateUserProfileAction({
    initialName: current?.user.name ?? "",
    initialCurrency,
  })
  const addPasskey = useAddPasskeyAction()
  const twoFactor = useEnableTwoFactorAction()

  return (
    <ProfilePage
      current={current}
      isPending={isPending}
      sessions={sessionsResult?.data ?? []}
      passkeys={passkeys ?? []}
      preferredCurrency={settings?.preferredCurrency ?? "EUR"}
      terminatingId={terminatingId}
      revokePending={revokeSession.isPending}
      updateProfilePending={updateProfile.submitting}
      onTerminatingIdChange={setTerminatingId}
      onRevokeSession={(token) => revokeSession.mutateAsync(token)}
      onUpdateProfile={(values) => updateProfile.updateUserProfile(values)}
      passkeyPending={addPasskey.submitting}
      onAddPasskey={addPasskey.addPasskey}
      twoFactorEnabled={Boolean(current?.user.twoFactorEnabled || twoFactor.enabled)}
      twoFactorPending={twoFactor.submitting}
      twoFactorSetup={twoFactor.setup}
      onEnableTwoFactor={twoFactor.enableTwoFactor}
      onVerifyTwoFactor={twoFactor.verifyTwoFactor}
      onCloseTwoFactorSetup={twoFactor.clearSetup}
    />
  )
}
