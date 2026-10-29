import { describe, expect, test } from "bun:test";
import {
  formatLoginWait,
  getLoginRetryDeadline,
} from "../client/src/lib/login-cooldown";

describe("login wait deadlines", () => {
  test("does not invent another wait when the server reports zero seconds", () => {
    const now = 1_700_000_000_000;
    expect(getLoginRetryDeadline({ retryAfterSeconds: 0 }, now)).toBe(now);
    expect(
      getLoginRetryDeadline(
        { lockoutUntil: new Date(now - 1000).toISOString() },
        now,
      ),
    ).toBe(now);
  });
  test("formats minutes and seconds without negative values", () => {
    expect(formatLoginWait(65)).toBe("01:05");
    expect(formatLoginWait(9)).toBe("00:09");
    expect(formatLoginWait(-1)).toBe("00:00");
  });
  test("uses server durations and supports account lock timestamps", () => {
    const now = 1_700_000_000_000;
    expect(getLoginRetryDeadline({ retryAfterSeconds: 65 }, now)).toBe(
      now + 65_000,
    );
    expect(
      getLoginRetryDeadline(
        { lockoutUntil: new Date(now + 300_000).toISOString() },
        now,
      ),
    ).toBe(now + 300_000);
    expect(
      getLoginRetryDeadline(
        {
          retryAfterSeconds: 60,
          lockoutUntil: new Date(now + 300_000).toISOString(),
        },
        now,
      ),
    ).toBe(now + 300_000);
  });
});
