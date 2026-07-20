import { createElement } from "react"
import { describe, expect, it } from "vite-plus/test"

import { getHairAssignedSource } from "./hair-assigned-source"
import {
  HairAssignedTable,
  getHairAssignedTableColumnKeys,
  getHairAssignedTableColumnLabels,
  getHairAssignedTableHasPagination,
} from "./hair-assigned-table"

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

  it("detects a declared pagination footer", () => {
    expect(
      getHairAssignedTableHasPagination(
        createElement(HairAssignedTable.Pagination, {
          page: 2,
          pageSize: 25,
          itemCount: 25,
          totalCount: 80,
          onChange: () => {},
        }),
      ),
    ).toBe(true)
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

  it("reports stable declared column keys in child order", () => {
    expect(
      getHairAssignedTableColumnKeys([
        createElement(HairAssignedTable.Client, { key: "client" }),
        createElement(HairAssignedTable.Source, { key: "source" }),
        createElement(HairAssignedTable.Actions, { key: "actions", onEdit: () => {}, onDelete: () => {} }),
      ]),
    ).toEqual(["client", "source", "actions"])
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
