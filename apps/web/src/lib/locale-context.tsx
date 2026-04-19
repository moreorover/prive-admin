import { createContext, useContext } from "react"

interface LocaleContext {
  locale: string
  timeZone: string
}

const LocaleCtx = createContext<LocaleContext>({ locale: "", timeZone: "UTC" })

export const LocaleProvider = LocaleCtx.Provider

export function useLocale() {
  return useContext(LocaleCtx)
}
