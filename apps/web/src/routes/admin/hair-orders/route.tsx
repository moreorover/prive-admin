import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/hair-orders")({
  staticData: { title: "Hair Orders" },
  component: () => <Outlet />,
});
