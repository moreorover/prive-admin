import { describe, expect, it } from "vite-plus/test"

import { ApplicationError } from "../../application/src"
import { toTrpcError } from "./errors"

describe("toTrpcError", () => {
  it("maps application errors to TRPC errors", () => {
    const error = toTrpcError(new ApplicationError("NOT_FOUND", "Missing"))
    expect(error).toMatchObject({ code: "NOT_FOUND", message: "Missing" })
  })
})
