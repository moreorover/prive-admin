import type { QueryClient } from "@tanstack/react-query"

import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Outlet, createRootRouteWithContext, HeadContent, useRouter } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { Toaster } from "sonner"

import type { Session } from "@/lib/auth-client"
import type { trpc } from "@/utils/trpc"

import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"

import "../styles.css"
import { authClient } from "@/lib/auth-client"

export interface RouterAppContext {
  trpc: typeof trpc
  queryClient: QueryClient
  session: Session | null
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async () => {
    try {
      const { data } = await authClient.getSession()
      return { session: data }
    } catch (error) {
      console.error("Failed to fetch user session:", error)
      return { session: null }
    }
  },
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "prive-admin",
      },
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "description",
        content: "prive-admin is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
})

function ImpersonationBanner() {
  const { session } = Route.useRouteContext()
  const router = useRouter()

  if (!session?.session.impersonatedBy) return null

  return (
    <div className="bg-destructive text-destructive-foreground flex items-center justify-center gap-3 px-4 py-2 text-sm">
      <span>You are impersonating {session.user.name ?? session.user.email}</span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 border-destructive-foreground/30 bg-transparent hover:bg-destructive-foreground/10"
        onClick={async () => {
          await authClient.admin.stopImpersonating()
          router.invalidate()
        }}
      >
        Stop Impersonating
      </Button>
    </div>
  )
}

function RootComponent() {
  return (
    <>
      <Toaster />
      <HeadContent />
      <ImpersonationBanner />
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  )
}
