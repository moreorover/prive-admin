import { createFileRoute } from "@tanstack/react-router"

import { LandingPage } from "./-components/index-page"

export const Route = createFileRoute("/")({
  component: LandingPage,
})
