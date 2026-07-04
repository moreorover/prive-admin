import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import { router } from "./router"
import { queryClient, trpc } from "./utils/trpc"

const rootElement = document.getElementById("app")

if (!rootElement) {
  throw new Error("Root element #app not found")
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ queryClient, trpc }} />
    </QueryClientProvider>
  </StrictMode>,
)
