import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { useState } from "react"

import SignInForm from "@/components/sign-in-form"
import SignUpForm from "@/components/sign-up-form"

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
})

function RouteComponent() {
  const { redirect } = Route.useSearch()
  const [showSignIn, setShowSignIn] = useState(false)

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} redirectTo={redirect} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} redirectTo={redirect} />
  )
}
