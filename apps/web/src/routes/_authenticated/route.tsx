import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"

import { authClient } from "@/lib/auth-client"
import { trpc } from "@/utils/trpc"

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
    return { session: session.data }
  },
})

function RouteComponent() {
  const unassignedAttachments = useQuery(
    trpc.bankStatementAttachments.list.queryOptions({ assignmentStatus: "unassigned" }),
  ).data

  return <AuthenticatedLayout badges={{ unassigned: unassignedAttachments?.totalCount ?? 0 }} />
}
