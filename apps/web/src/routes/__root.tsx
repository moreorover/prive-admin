import { Toaster } from "@prive-admin-tanstack/ui/components/sonner"
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router"
import { ThemeProvider } from "next-themes"
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
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Privé",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
})

function RootDocument() {
  const { locale, timeZone } = Route.useRouteContext()

  // Set timezone cookie so the server can use it on subsequent requests
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    document.cookie = `tz=${tz};path=/;max-age=31536000`
  }, [])

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <LocaleProvider value={{ locale, timeZone }}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <Outlet />
            <Toaster richColors />
          </ThemeProvider>
        </LocaleProvider>
        <TanStackRouterDevtools position="bottom-left" />
        <Scripts />
      </body>
    </html>
  )
}
