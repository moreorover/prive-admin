import { createRouter as createTanStackRouter } from "@tanstack/react-router"

import Loader from "./components/loader"
import "./index.css"
import { routeTree } from "./routeTree.gen"
import { queryClient, trpc } from "./utils/trpc"

export const router = createTanStackRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  context: { queryClient, trpc },
  defaultPendingComponent: () => <Loader />,
  defaultNotFoundComponent: () => <div>Not Found</div>,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
