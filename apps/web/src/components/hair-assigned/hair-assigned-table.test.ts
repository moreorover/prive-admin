import type { ComponentProps, ReactNode } from "react"

import { MantineProvider } from "@mantine/core"
import { createElement, Fragment } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vite-plus/test"

import { getHairAssignedSource } from "./hair-assigned-source"
import { HairAssignedTable } from "./hair-assigned-table"

const hairAssignedRows = [
  {
    id: "hair-assigned-1",
    appointmentId: null,
    weightInGrams: 12,
    soldFor: 3400,
    profit: 1200,
    pricePerGram: 283,
    client: null,
    hairOrder: null,
  },
]

function renderHairAssignedTable(children: ReactNode) {
  return renderToStaticMarkup(
    createElement(
      MantineProvider,
      null,
      createElement(
        HairAssignedTable,
        { items: hairAssignedRows } as ComponentProps<typeof HairAssignedTable>,
        children,
      ),
    ),
  )
}

describe("hair assigned table", () => {
  it("labels appointment-tied and individual hair sales", () => {
    expect(getHairAssignedSource({ appointmentId: "appointment-1" })).toEqual({
      color: "blue",
      label: "Appointment",
    })
    expect(getHairAssignedSource({ appointmentId: null })).toEqual({
      color: "grape",
      label: "Individual",
    })
    expect(getHairAssignedSource({})).toEqual({
      color: "grape",
      label: "Individual",
    })
  })

  it("renders a declared pagination footer", () => {
    expect(
      renderHairAssignedTable(
        createElement(HairAssignedTable.Pagination, {
          page: 2,
          pageSize: 25,
          itemCount: 25,
          totalCount: 80,
          onChange: () => {},
          label: "Showing hair assignments",
        }),
      ),
    ).toContain("Showing hair assignments")
  })
})

describe("hair assigned table compound columns", () => {
  it("renders declared columns", () => {
    const markup = renderHairAssignedTable(
      createElement(
        Fragment,
        null,
        createElement(HairAssignedTable.Client),
        createElement(HairAssignedTable.Source),
        createElement(HairAssignedTable.HairOrder),
        createElement(HairAssignedTable.Actions, { onEdit: () => {}, onDelete: () => {} }),
      ),
    )

    expect(markup).toContain("Client")
    expect(markup).toContain("Source")
    expect(markup).toContain("Hair Order")
  })

  it("omits columns that are not declared", () => {
    const markup = renderHairAssignedTable(
      createElement(
        Fragment,
        null,
        createElement(HairAssignedTable.Client),
        createElement(HairAssignedTable.Weight),
        createElement(HairAssignedTable.Actions, { onEdit: () => {}, onDelete: () => {} }),
      ),
    )

    expect(markup).toContain("Client")
    expect(markup).toContain("Weight")
    expect(markup).not.toContain("Source")
    expect(markup).not.toContain("Hair Order")
  })
})
