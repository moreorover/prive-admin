import { useQueryErrorResetBoundary } from "@tanstack/react-query"
import { Outlet, createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"
import { AlertCircle, RefreshCw } from "lucide-react"

import { Button } from "@prive-admin-tanstack/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prive-admin-tanstack/ui/components/card"
import { getUser } from "@/functions/get-user"

export const Route = createFileRoute("/_authenticated")({
  component: () => <Outlet />,
  errorComponent: AuthenticatedErrorComponent,
  beforeLoad: async ({ location }) => {
    const session = await getUser()
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
    return { session }
  },
})

function AuthenticatedErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  const handleRetry = () => {
    queryErrorResetBoundary.reset()
    reset()
    router.invalidate()
  }

  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-center px-6 py-24">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertCircle className="size-4 text-destructive" />
            Something went wrong
          </CardTitle>
          <CardDescription>
            {error.message || "An unexpected error occurred."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="size-3" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
