import { describe, expect, it } from "vite-plus/test"

import { customerAppointmentsQueryArgs, customerDetailQueryInput } from "./customer-detail-queries"

describe("customer detail query helpers", () => {
  it("defaults the page to 1 and trims search", () => {
    expect(customerDetailQueryInput({ page: undefined, search: "  trim me  " })).toEqual({
      page: 1,
      search: "trim me",
    })
  })

  it("builds appointments query args from normalized search params", () => {
    expect(customerAppointmentsQueryArgs("customer-1", { page: 3, search: "  cut  " })).toEqual({
      customerId: "customer-1",
      page: 3,
      pageSize: 25,
      search: "cut",
    })
  })
})
