import { describe, expect, it } from "vite-plus/test"

import { getCustomerAppointmentRole } from "./appointments-data"

describe("customer appointment role mapping", () => {
  it("identifies the selected customer as client, master, or personnel", () => {
    expect(
      getCustomerAppointmentRole(
        { client: { id: "customer-1" }, master: { id: "master-1" }, personnel: [] },
        "customer-1",
      ),
    ).toBe("Client")
    expect(
      getCustomerAppointmentRole(
        { client: { id: "client-1" }, master: { id: "customer-1" }, personnel: [] },
        "customer-1",
      ),
    ).toBe("Master")
    expect(
      getCustomerAppointmentRole(
        { client: { id: "client-1" }, master: { id: "master-1" }, personnel: [{ personnelId: "customer-1" }] },
        "customer-1",
      ),
    ).toBe("Personnel")
  })

  it("returns no role for an appointment that does not contain the selected customer", () => {
    expect(
      getCustomerAppointmentRole(
        { client: { id: "client-1" }, master: { id: "master-1" }, personnel: [] },
        "customer-1",
      ),
    ).toBeUndefined()
  })
})
