export const LOGIN_COOLDOWN_KEY = "m-music:login-cooldown-until";

export function getLoginRetryDeadline(payload: unknown, now = Date.now()): number {
  if (!payload || typeof payload !== "object") return now + 60_000;
  const data = payload as {
    retryAfterSeconds?: unknown;
    retryAt?: unknown;
    lockoutUntil?: unknown;
  };
  const deadlines: number[] = [];
  if (
    typeof data.retryAfterSeconds === "number" &&
    Number.isFinite(data.retryAfterSeconds) &&
    data.retryAfterSeconds >= 0
  ) {
    deadlines.push(now + data.retryAfterSeconds * 1000);
  }
  for (const value of [data.retryAt, data.lockoutUntil]) {
    if (typeof value === "string") {
      const deadline = Date.parse(value);
      if (Number.isFinite(deadline)) deadlines.push(deadline);
    }
  }
  return deadlines.length ? Math.max(now, ...deadlines) : now + 60_000;
}

export function formatLoginWait(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}
