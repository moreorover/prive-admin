import { createFileRoute } from "@tanstack/react-router"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const Route = createFileRoute("/")({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Coming Soon</CardTitle>
          <CardDescription>
            We're working on something new. Check back later.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
