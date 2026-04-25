import { useLocale } from "@/lib/locale-context"

export function ClientDate({ date, showTime }: { date: string | Date; showTime?: boolean }) {
  const { locale, timeZone } = useLocale()
  const d = new Date(date)

  const formatted = showTime ? d.toLocaleString(locale, { timeZone }) : d.toLocaleDateString(locale, { timeZone })

  return <>{formatted}</>
}
