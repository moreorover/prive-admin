import { ColorSchemeScript } from "@prive-admin-tanstack/ui/color-scheme"
import { UIProvider } from "@prive-admin-tanstack/ui/provider"
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router"
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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Privé" },
    ],
  }),
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
      <ColorSchemeScript defaultColorScheme="auto" />
      <HeadContent />
      <LocaleProvider value={{ locale, timeZone }}>
        <UIProvider>
          <Outlet />
        </UIProvider>
      </LocaleProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </>
  )
}
