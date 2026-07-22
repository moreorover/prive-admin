import { createFileRoute } from "@tanstack/react-router"

import { LandingPage } from "./-index-page"

export const Route = createFileRoute("/")({
  component: LandingPage,
})
