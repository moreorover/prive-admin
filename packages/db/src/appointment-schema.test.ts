import { describe, expect, it } from "vite-plus/test"

import { appointment } from "./schema/appointment"

describe("appointment schema", () => {
  it("requires a master customer reference", () => {
    expect(appointment.masterId.name).toBe("master_id")
    expect(appointment.masterId.notNull).toBe(true)
  })
})
