import { Anchor, Box, Breadcrumbs as MantineBreadcrumbs, Text } from "@mantine/core"
import { Link } from "@tanstack/react-router"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import {
  removeBreadcrumb,
  upsertBreadcrumb,
  type BreadcrumbDefinition,
  type RegisteredBreadcrumb,
} from "@/lib/breadcrumbs"

type BreadcrumbContextValue = {
  items: readonly RegisteredBreadcrumb[]
  register: (id: string, item: BreadcrumbDefinition) => void
  unregister: (id: string) => void
}

const BreadcrumbPortalContext = createContext<BreadcrumbContextValue | null>(null)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RegisteredBreadcrumb[]>([])
  const orderById = useRef(new Map<string, number>())
  const nextOrder = useRef(0)

  const register = useCallback((id: string, item: BreadcrumbDefinition) => {
    let order = orderById.current.get(id)
    if (order === undefined) {
      order = nextOrder.current
      nextOrder.current += 1
      orderById.current.set(id, order)
    }

    setItems((current) => upsertBreadcrumb(current, { ...item, id, order: item.order ?? order }))
  }, [])

  const unregister = useCallback((id: string) => {
    setItems((current) => removeBreadcrumb(current, id))
  }, [])

  const value = useMemo(() => ({ items, register, unregister }), [items, register, unregister])

  return <BreadcrumbPortalContext.Provider value={value}>{children}</BreadcrumbPortalContext.Provider>
}

export function BreadcrumbPortal() {
  const { items } = useBreadcrumbContext()
  const visibleItems = items.filter((item) => item.label !== "Privé")

  if (visibleItems.length <= 1) return null

  return (
    <Box component="nav" aria-label="Breadcrumb">
      <MantineBreadcrumbs fz="11px" separator="›" separatorMargin={6} c="dimmed">
        {visibleItems.map((item) =>
          item.to ? (
            <Anchor key={item.id} component={Link} to={item.to} fz="11px" c="dimmed" underline="never">
              {item.label}
            </Anchor>
          ) : (
            <Text key={item.id} fz="11px" fw={500} c="dimmed">
              {item.label}
            </Text>
          ),
        )}
      </MantineBreadcrumbs>
    </Box>
  )
}

export function BreadcrumbItem({ label, to }: BreadcrumbDefinition) {
  const id = useId()
  const { register, unregister } = useBreadcrumbContext()

  useEffect(() => {
    register(id, { label, to })
    return () => unregister(id)
  }, [id, label, register, to, unregister])

  return null
}

export function BreadcrumbItems({ items }: { items: readonly BreadcrumbDefinition[] }) {
  return items.map((item) => <BreadcrumbItem key={`${item.to ?? "current"}-${String(item.label)}`} {...item} />)
}

function useBreadcrumbContext() {
  const context = useContext(BreadcrumbPortalContext)

  if (!context) {
    throw new Error("Missing BreadcrumbProvider.")
  }

  return context
}
