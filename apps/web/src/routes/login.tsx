import { Link, createFileRoute, redirect } from "@tanstack/react-router"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { z } from "zod"
import { useState } from "react"

import SignInForm from "@/components/sign-in-form"
import SignUpForm from "@/components/sign-up-form"
import { getUser } from "@/functions/get-user"

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: async () => {
    const session = await getUser()
    if (session) {
      throw redirect({ to: "/dashboard" })
    }
  },
})

function RouteComponent() {
  const { redirect } = Route.useSearch()
  const [showSignIn, setShowSignIn] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-background">
      {/* Theme toggle */}
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-6 right-6 z-10 flex size-8 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:text-foreground/60"
      >
        {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      </button>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/6 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Link to="/">
            <h1 className="font-display text-3xl font-light tracking-tight text-foreground/80">
              Priv<span className="text-primary italic">e</span>
            </h1>
          </Link>
          <p className="mt-2 text-[10px] tracking-[0.4em] text-muted-foreground/40 uppercase">
            Member Access
          </p>
        </div>

        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} redirectTo={redirect} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} redirectTo={redirect} />
        )}
      </div>
    </div>
  )
}
