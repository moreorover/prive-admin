import { createElement } from "react"
import { describe, expect, it } from "vite-plus/test"

import { getHairAssignedSource } from "./hair-assigned-source"
import { HairAssignedTable, getHairAssignedTableColumnLabels } from "./hair-assigned-table"

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
})

describe("hair assigned table compound columns", () => {
  it("reports declared column labels in child order", () => {
    expect(
      getHairAssignedTableColumnLabels([
        createElement(HairAssignedTable.Client, { key: "client" }),
        createElement(HairAssignedTable.Source, { key: "source" }),
        createElement(HairAssignedTable.HairOrder, { key: "hair-order" }),
        createElement(HairAssignedTable.Actions, { key: "actions", onEdit: () => {}, onDelete: () => {} }),
      ]),
    ).toEqual(["Client", "Source", "Hair Order", ""])
  })

  it("omits columns that are not declared", () => {
    expect(
      getHairAssignedTableColumnLabels([
        createElement(HairAssignedTable.Client, { key: "client" }),
        createElement(HairAssignedTable.Weight, { key: "weight" }),
        createElement(HairAssignedTable.Actions, { key: "actions", onEdit: () => {}, onDelete: () => {} }),
      ]),
    ).toEqual(["Client", "Weight", ""])
  })
})
