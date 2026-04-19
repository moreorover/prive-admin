import { Card, CardContent, CardHeader, CardTitle } from "@prive-admin-tanstack/ui/components/card"
import { createFileRoute } from "@tanstack/react-router"

import { ClientDate } from "@/components/client-date"
import { useLocale } from "@/lib/locale-context"

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const { locale, timeZone } = useLocale()

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-lg font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Locale & Timezone</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Locale</dt>
              <dd>{locale}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Timezone</dt>
              <dd>{timeZone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Date preview</dt>
              <dd>
                <ClientDate date={new Date()} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">DateTime preview</dt>
              <dd>
                <ClientDate date={new Date()} showTime />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
