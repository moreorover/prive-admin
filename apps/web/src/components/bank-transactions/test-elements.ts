import { Children, isValidElement, type ReactElement, type ReactNode } from "react"

// Inspect our pure components' public control props without mocking Mantine or server state.
export function elements(node: ReactNode): ReactElement<Record<string, any>>[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<Record<string, any>>(child)) return []
    return [child, ...elements(child.props.children)]
  })
}
