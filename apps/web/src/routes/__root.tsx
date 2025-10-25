import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { trpc } from "@/utils/trpc";
import "../index.css";
import type { User } from "better-auth";
import { NavigationProgress } from "@/components/navigation-progress";
import { authClient } from "@/lib/auth-client";

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
  user: User | null;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async () => {
    try {
      const session = await authClient.getSession();
      return { user: session.data?.user ?? null };
    } catch (error) {
      console.error("Failed to fetch user session:", error);
      return { user: null };
    }
  },
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "prive-admin",
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
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  });

  return (
    <>
      <NavigationProgress />
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <div className="grid h-svh grid-rows-[auto_1fr]">
          {/*<Header />*/}
          <Outlet />
          {/*{isFetching ? <Loader /> : <Outlet />}*/}
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  );
}
