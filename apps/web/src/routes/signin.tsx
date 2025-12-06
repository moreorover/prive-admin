import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import z from "zod";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

const fallbackRedirect = "/dashboard";

export const Route = createFileRoute("/signin")({
  validateSearch: z.object({
    redirect: z.string().default(fallbackRedirect),
  }),
  beforeLoad: async ({ context, search }) => {
    if (context.user) {
      throw redirect({ to: search.redirect });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const isProduction = import.meta.env.PROD;
  const [showSignIn, setShowSignIn] = useState(isProduction);

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={isProduction ? undefined : () => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}
