import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import type { AuthMutationResponse } from "@shared/types";

import { PageLink } from "../components/PageLink";
import { useAuth } from "../context/AuthContext";
import { getReturnToParam, safeRedirectPath } from "../lib/auth";
import { ApiError, apiUrl, getErrorMessage, postJson } from "../lib/api";
import { supportsViewTransitions } from "../lib/motion";
import { formatLoginWait } from "../lib/login-cooldown";
import { useLoginCooldown } from "../lib/useLoginCooldown";

export function LoginPage(): React.JSX.Element {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const { remainingSeconds, isLocked, startCooldown } = useLoginCooldown();
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = safeRedirectPath(getReturnToParam(location.search));

  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("error");

  const oauthNotice = useMemo(() => {
    if (!oauthError) {
      return "";
    }

    if (oauthError === "google-login-failed") {
      return "Google sign-in was cancelled or did not finish. You can try again or use your email login below.";
    }

    if (oauthError === "google-auth-error") {
      return "Google sign-in could not complete (for example a server or account validation issue). Try again, or use email login while an admin checks the server logs.";
    }

    if (oauthError === "google-session-error") {
      return "Google verified your account, but we could not start a signed-in session in your browser. Please try again.";
    }

    return "Sign-in hit an unexpected problem. Please try again or use email login.";
  }, [oauthError]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting.current || isLocked) return;

    if (!username.trim() || !password) {
      setMessage("Please enter both username/email and password.");
      return;
    }

    setMessage("");
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const response = await postJson<AuthMutationResponse>("/api/login", {
        password,
        username,
      });

      await refreshAuth(response.user);
      navigate(returnTo, {
        replace: true,
        viewTransition: supportsViewTransitions(),
      });
    } catch (error) {
      const normalizedError =
        error instanceof ApiError ? error : new ApiError("Login failed.", 500, null);

      if (normalizedError.status === 429) {
        setMessage("");
        startCooldown(normalizedError.payload);
        return;
      }
      setMessage(getErrorMessage(normalizedError.payload, normalizedError.message));
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card auth-card--login">
        <PageLink className="auth-card__brand" to="/" aria-label="Back to M-Music home">
          <span className="auth-card__back-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="m10 5-7 7 7 7M3 12h18" />
            </svg>
          </span>
          <span className="auth-card__brand-mark" aria-hidden="true">
            M
          </span>
          <span>M-Music</span>
        </PageLink>

        <header className="auth-card__heading">
          <p className="auth-card__eyebrow">Member access</p>
          <h1>Welcome back.</h1>
        </header>

        {oauthNotice ? <p className="form-message form-message--error">{oauthNotice}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username or Email</span>
            <input
              autoComplete="username"
              placeholder="Enter username or email"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.currentTarget.value)}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <div className="field__input">
              <input
                autoComplete="current-password"
                placeholder="Enter your password"
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
              <button
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                className="field__toggle"
                type="button"
                onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
              >
                <img
                  alt=""
                  src={isPasswordVisible ? "/icons/visibility.svg" : "/icons/visibility_off.svg"}
                />
              </button>
            </div>
          </label>

          {isLocked ? (
            <p className="form-message form-message--error" role="status">
              Too many attempts. Please wait{" "}
              <span role="timer" aria-live="off" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatLoginWait(remainingSeconds)}
              </span>
              .
            </p>
          ) : (
            <p className="form-message form-message--error" role="status">
              {message}
            </p>
          )}

          <div className="auth-form__actions">
            <button
              className="button button--secondary"
              type="reset"
              onClick={() => setMessage("")}
            >
              Reset
            </button>
            <button className="button" type="submit" disabled={isSubmitting || isLocked}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </div>

          <div className="auth-divider" aria-hidden="true">
            <span>or</span>
          </div>

          <a
            className="oauth-link"
            href={apiUrl(`/auth/google?returnTo=${encodeURIComponent(returnTo)}`)}
          >
            <img alt="" src="/images/Google1.png" />
            <span>Continue with Google</span>
          </a>
        </form>

        <p className="auth-card__switch">
          New here?{" "}
          <PageLink to={`/register?returnTo=${encodeURIComponent(returnTo)}`}>
            Create an account
          </PageLink>
        </p>
      </section>
    </main>
  );
}
