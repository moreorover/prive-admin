import type { QueryClient } from "@tanstack/react-query";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet, createRootRouteWithContext, HeadContent } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import type { trpc } from "@/utils/trpc";
import type { Session } from "@/lib/auth-client";

import { authClient } from "@/lib/auth-client";
import { TooltipProvider } from "@/components/ui/tooltip";

import "../styles.css";

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
  session: Session | null;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async () => {
    try {
      const { data } = await authClient.getSession();
      return { session: data };
    } catch (error) {
      console.error("Failed to fetch user session:", error);
      return { session: null };
    }
  },
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "prive-admin",
      },
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "description",
        content: "prive-admin is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  );
}
