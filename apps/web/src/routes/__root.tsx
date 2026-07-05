import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import { lazy, useEffect } from "react"

import type { queryClient, trpc } from "@/utils/trpc"

import { LocaleProvider } from "@/lib/locale-context"

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/react-router-devtools").then((mod) => ({
          default: mod.TanStackRouterDevtools,
        })),
      )

export interface RouterAppContext {
  queryClient: typeof queryClient
  trpc: typeof trpc
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
})

function RootComponent() {
  const locale = navigator.language || "en-US"
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"

  useEffect(() => {
    document.cookie = `tz=${timeZone};path=/;max-age=31536000`
  }, [timeZone])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <>
      <LocaleProvider value={{ locale, timeZone }}>
        <Outlet />
      </LocaleProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </>
  )
}
