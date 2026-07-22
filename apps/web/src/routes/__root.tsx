import { createRootRouteWithContext } from "@tanstack/react-router"

import type { queryClient, trpc } from "@/utils/trpc"

import { RootComponent } from "./-components/root-page"

export interface RouterAppContext {
  queryClient: typeof queryClient
  trpc: typeof trpc
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
})
