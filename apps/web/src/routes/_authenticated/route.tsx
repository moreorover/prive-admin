import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  beforeLoad: ({ context: { auth } }) => {
    if (!auth) {
      throw redirect({ to: "/login" });
    }
  },
});

function AuthenticatedLayout() {
  return <Outlet />;
}
