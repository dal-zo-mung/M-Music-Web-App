import { useEffect, useState } from "react";
import { getLoginRetryDeadline, LOGIN_COOLDOWN_KEY } from "./login-cooldown";

function readDeadline(): number {
  try {
    const deadline = Number(sessionStorage.getItem(LOGIN_COOLDOWN_KEY));
    return Number.isFinite(deadline) && deadline > Date.now() ? deadline : 0;
  } catch {
    return 0;
  }
}

export function useLoginCooldown() {
  const [deadline, setDeadline] = useState(readDeadline);
  const [now, setNow] = useState(Date.now);
  const remainingSeconds = Math.max(0, Math.ceil((deadline - now) / 1000));

  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= deadline) {
        setDeadline(0);
        try {
          sessionStorage.removeItem(LOGIN_COOLDOWN_KEY);
        } catch {
          /* Storage may be disabled. */
        }
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [deadline]);

  function startCooldown(payload: unknown) {
    const currentTime = Date.now();
    const nextDeadline = Math.max(deadline, getLoginRetryDeadline(payload, currentTime));
    setNow(currentTime);
    setDeadline(nextDeadline);
    try {
      sessionStorage.setItem(LOGIN_COOLDOWN_KEY, String(nextDeadline));
    } catch {
      /* Keep the in-memory countdown. */
    }
  }

  return { remainingSeconds, isLocked: remainingSeconds > 0, startCooldown };
}
