import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { connectMongo } from "./server.js";

describe("Mongo startup fallback", () => {
  it("does not reject when no MongoDB URL is configured", async () => {
    const result = await connectMongo("");
    assert.equal(result, false);
  });
});
