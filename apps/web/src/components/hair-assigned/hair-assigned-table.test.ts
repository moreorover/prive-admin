import { describe, expect, it } from "vite-plus/test"

import { getHairAssignedSource } from "./hair-assigned-source"

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
