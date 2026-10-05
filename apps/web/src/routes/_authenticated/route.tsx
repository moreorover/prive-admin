import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"

import { authClient } from "@/lib/auth-client"
import { trpc } from "@/utils/trpc"

import { useStopImpersonatingAction } from "./-actions/impersonation-actions"
import { AuthenticatedErrorComponent, AuthenticatedLayout } from "./-components/route-page"

export const Route = createFileRoute("/_authenticated")({
  component: RouteComponent,
  errorComponent: AuthenticatedErrorComponent,
  beforeLoad: async ({ location }) => {
    const session = await authClient.getSession()
    if (session.error) {
      throw new Error(session.error.message || "Failed to load session")
    }
    if (!session.data) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
    return {
      session: session.data,
      isAdmin: session.data.user.role?.split(",").includes("admin") ?? false,
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      trpc.bankStatementAttachments.list.queryOptions({ assignmentStatus: "unassigned" }),
    )
  },
})

function RouteComponent() {
  const navigate = useNavigate()
  const currentSession = authClient.useSession()
  const stopImpersonating = useStopImpersonatingAction({
    onStopped: () => void navigate({ to: "/admin/users", search: { page: 1, search: "" } }),
  })
  const unassignedAttachments = useQuery(
    trpc.bankStatementAttachments.list.queryOptions({ assignmentStatus: "unassigned" }),
  ).data

  return (
    <AuthenticatedLayout
      badges={{ unassigned: unassignedAttachments?.totalCount ?? 0 }}
      isImpersonating={Boolean(currentSession.data?.session?.impersonatedBy)}
      onStopImpersonating={() => stopImpersonating.mutate()}
    />
  )
}
