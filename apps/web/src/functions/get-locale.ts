import { createServerFn } from "@tanstack/react-start"
import { localeMiddleware } from "@/middleware/locale"

export const getLocale = createServerFn({ method: "GET" })
  .middleware([localeMiddleware])
  .handler(async ({ context }) => {
    return { locale: context.locale, timeZone: context.timeZone }
  })
