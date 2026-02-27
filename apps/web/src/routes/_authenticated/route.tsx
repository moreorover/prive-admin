import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  beforeLoad: ({ context: { session } }) => {
    if (!session) {
      throw redirect({ to: "/signin" })
    }
  },
})

function AuthenticatedLayout() {
  return <Outlet />
}
