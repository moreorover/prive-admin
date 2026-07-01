import { describe, expect, it } from "vitest"

import { appointment } from "./schema/appointment"

describe("appointment schema", () => {
  it("stores an optional master customer reference", () => {
    expect(appointment.masterId.name).toBe("master_id")
    expect(appointment.masterId.notNull).toBe(false)
  })
})
