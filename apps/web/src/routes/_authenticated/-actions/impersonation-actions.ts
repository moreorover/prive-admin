import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authClient } from "@/lib/auth-client"

export function useStopImpersonatingAction({ onStopped }: { onStopped?: () => void } = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const result = await authClient.admin.stopImpersonating()
      if (result.error) throw new Error(result.error.message || "Unable to stop impersonation")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      notifications.show({ color: "green", message: "Impersonation ended" })
      onStopped?.()
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
}
