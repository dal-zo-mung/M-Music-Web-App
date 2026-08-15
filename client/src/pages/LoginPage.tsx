import { useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import type { AuthMutationResponse, ApiErrorResponse } from "@shared/types";

import { useAuth } from "../context/AuthContext";
import {
  getReturnToParam,
  safeRedirectPath,
  validatePassword,
} from "../lib/auth";
import { ApiError, getErrorMessage, postJson } from "../lib/api";

export function LoginPage(): React.JSX.Element {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [messageTone, setMessageTone] = useState<
    "error" | "info" | "success" | "warning"
  >("info");
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

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!username.trim() || !password) {
      setMessage("Please enter both username/email and password.");
      setMessageTone("error");
      return;
    }

    const passwordValidation = validatePassword(password);

    if (!passwordValidation.valid) {
      setMessage(
        `Password format is weak: ${passwordValidation.errors.join("; ")}`,
      );
      setMessageTone("warning");
    } else {
      setMessage("Signing you in...");
      setMessageTone("info");
    }

    try {
      await postJson<AuthMutationResponse>("/api/login", {
        password,
        username,
      });

      await refreshAuth();
      setMessage("Login successful. Redirecting...");
      setMessageTone("success");

      window.setTimeout(() => {
        navigate(returnTo, { replace: true });
      }, 400);
    } catch (error) {
      const normalizedError =
        error instanceof ApiError
          ? (error as ApiError<ApiErrorResponse>)
          : new ApiError("Login failed.", 500, null);

      setMessage(
        getErrorMessage(normalizedError.payload, normalizedError.message),
      );
      setMessageTone("error");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card--login">
        <div className="auth-card__brand">
          <img alt="M-Music logo" src="/images/M-Music.png" />
          <span>M-Music</span>
        </div>

        <h1>Welcome Back</h1>

        {oauthNotice ? (
          <p className="form-message form-message--error">{oauthNotice}</p>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username or Email</span>
            <div className="field__input">
              <input
                autoComplete="username"
                placeholder="Enter username or email"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.currentTarget.value)}
              />
              <img alt="" src="/images/User.png" />
            </div>
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
                aria-label={
                  isPasswordVisible ? "Hide password" : "Show password"
                }
                className="field__toggle"
                type="button"
                onClick={() =>
                  setIsPasswordVisible((currentValue) => !currentValue)
                }
              >
                <img
                  alt=""
                  src={
                    isPasswordVisible
                      ? "/icons/visibility.svg"
                      : "/icons/visibility_off.svg"
                  }
                />
              </button>
            </div>
          </label>

          <p className={`form-message form-message--${messageTone}`}>
            {message}
          </p>

          <a
            className="oauth-link"
            href={`/auth/google?returnTo=${encodeURIComponent(returnTo)}`}
          >
            <img alt="" src="/images/Google1.png" />
            <span>Continue with Google</span>
          </a>

          <div className="auth-form__actions">
            <button
              className="button button--secondary"
              type="reset"
              onClick={() => setMessage("")}
            >
              Reset
            </button>
            <button className="button" type="submit">
              Login
            </button>
          </div>
        </form>

        <p className="auth-card__switch">
          New here?{" "}
          <Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`}>
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
