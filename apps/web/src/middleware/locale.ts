import { createMiddleware } from "@tanstack/react-start"
import { getRequestHeader, getCookie, setCookie } from "@tanstack/react-start/server"

export const localeMiddleware = createMiddleware().server(async ({ next }) => {
  const header = getRequestHeader("accept-language")
  const headerLocale = header?.split(",")[0] || "en-US"
  const cookieLocale = getCookie("locale")
  const cookieTz = getCookie("tz")

  const locale = cookieLocale || headerLocale
  const timeZone = cookieTz || "UTC"

  setCookie("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 })

  return next({ context: { locale, timeZone } })
})
