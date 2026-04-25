import { ColorSchemeScript } from "@prive-admin-tanstack/ui/color-scheme"
import { UIProvider } from "@prive-admin-tanstack/ui/provider"
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router"
import { lazy, useEffect } from "react"

import { getLocale } from "@/functions/get-locale"
import { LocaleProvider } from "@/lib/locale-context"

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/react-router-devtools").then((mod) => ({
          default: mod.TanStackRouterDevtools,
        })),
      )

import type { QueryClient } from "@tanstack/react-query"

import appCss from "../index.css?url"

export interface RouterAppContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async () => {
    const { locale, timeZone } = await getLocale()
    return { locale, timeZone }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Privé" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),

  component: RootDocument,
})

function RootDocument() {
  const { locale, timeZone } = Route.useRouteContext()

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    document.cookie = `tz=${tz};path=/;max-age=31536000`
  }, [])

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <HeadContent />
      </head>
      <body>
        <LocaleProvider value={{ locale, timeZone }}>
          <UIProvider>
            <Outlet />
          </UIProvider>
        </LocaleProvider>
        <TanStackRouterDevtools position="bottom-left" />
        <Scripts />
      </body>
    </html>
  )
}
