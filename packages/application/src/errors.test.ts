import { describe, expect, it } from "vite-plus/test"

import { badRequest, conflict, internalServerError, notFound, ApplicationError } from "./errors"

describe("ApplicationError", () => {
  it("preserves the error code and message", () => {
    const error = new ApplicationError("NOT_FOUND", "Missing")
    expect(error.code).toBe("NOT_FOUND")
    expect(error.message).toBe("Missing")
  })

  it("exposes the helper factories", () => {
    expect(badRequest("bad").code).toBe("BAD_REQUEST")
    expect(conflict("conflict").code).toBe("CONFLICT")
    expect(notFound("missing").code).toBe("NOT_FOUND")
    expect(internalServerError("boom").code).toBe("INTERNAL_SERVER_ERROR")
  })
})
