import { MantineProvider } from "@mantine/core"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vite-plus/test"

import { ResourcePagination } from "./resource-pagination"

function renderResourcePagination(props: Parameters<typeof ResourcePagination>[0]) {
  return renderToStaticMarkup(createElement(MantineProvider, null, createElement(ResourcePagination, props)))
}

describe("ResourcePagination", () => {
  it("renders a controlled pagination footer with a clamped active page", () => {
    const markup = renderResourcePagination({
      page: 5,
      pageSize: 25,
      totalCount: 80,
      onChange: () => {},
      label: "Showing resources",
    })

    expect(markup).toContain("Showing resources")
    expect(markup).toContain("Page 4 of 4")
  })
})
