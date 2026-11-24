
import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { ApiError, login } from "../api/client.ts";
import { AuthShell } from "../components/AuthShell.tsx";
import { useAuth } from "../context/useAuth.ts";
import { homePath } from "../lib/paths.ts";
import type { PendingOtp } from "../types/auth.ts";

const PENDING_KEY = "spa-otp-pending";

const loginCSS = `
.login-page,
.login-page *,
.login-page *::before,
.login-page *::after {
  box-sizing: border-box;
}

.login-page {
  width: 100%;
  font-family: inherit;
}

.login-page .login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.login-page .login-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.login-page .login-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #30483c;
  font-size: 12px;
  font-weight: 700;
}

.login-page .login-required {
  color: #b05c47;
}

.login-page .login-input {
  display: block;
  width: 100%;
  min-width: 0;
  height: 42px;
  min-height: 42px;
  padding: 0 13px;
  border: 1px solid #dedbd3;
  border-radius: 9px;
  background: #fffdfb;
  color: #243d32;
  font-size: 13px;
  outline: none;
  transition:
    border-color .2s ease,
    box-shadow .2s ease;
}

.login-page .login-input::placeholder {
  color: #a4aca6;
}

.login-page .login-input:focus {
  border-color: #37765b;
  box-shadow: 0 0 0 3px rgba(55, 118, 91, .1);
}

.login-page .login-input[aria-invalid="true"] {
  border-color: #bd6554;
}

.login-page .login-password-wrap {
  position: relative;
}

.login-page .login-password-wrap .login-input {
  padding-right: 65px;
}

.login-page .login-show-btn {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  padding: 6px;
  border: none;
  background: transparent;
  color: #28654e;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.login-page .login-show-btn:hover {
  color: #123a2d;
}

.login-page .login-show-btn:focus-visible {
  outline: 2px solid #37765b;
  outline-offset: 2px;
  border-radius: 4px;
}

.login-page .login-forgot {
  color: #28654e;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.login-page .login-forgot:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.login-page .login-field-error {
  margin: 0;
  color: #b14e3e;
  font-size: 11px;
  line-height: 1.5;
}

.login-page .login-alert {
  margin: 0;
  padding: 12px 14px;
  border: 1px solid #edc8bf;
  border-radius: 9px;
  background: #fff3ef;
  color: #a64435;
  font-size: 12px;
  line-height: 1.6;
}

.login-page .login-success {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 0;
  padding: 12px 14px;
  border: 1px solid #cce5d4;
  border-radius: 9px;
  background: #edf8f0;
  color: #276344;
  font-size: 12px;
  line-height: 1.6;
}

.login-page .login-success-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  flex-shrink: 0;
  margin-top: 1px;
  border-radius: 50%;
  background: #2e7953;
  color: white;
  font-size: 10px;
  font-weight: 800;
}

.login-page .login-session-expired {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0;
  padding: 13px 15px;
  border: 1px solid #e5d8be;
  border-radius: 9px;
  background: #fbf7ee;
  color: #684f22;
  font-size: 12.5px;
  font-weight: 550;
  line-height: 1.5;
  box-shadow: 0 2px 8px rgba(104, 79, 34, 0.04);
}

.login-page .login-session-expired-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 19px;
  height: 19px;
  flex-shrink: 0;
  margin-top: 1px;
  border-radius: 50%;
  background: #f0e3c8;
  color: #7b5820;
  font-size: 11px;
  font-weight: 800;
}

.login-page .login-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  min-height: 44px;
  margin-top: 5px;
  padding: 11px 16px;
  border: none;
  border-radius: 9px;
  background: #1c4d3c;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: background .2s ease;
}

.login-page .login-submit:hover:not(:disabled) {
  background: #123a2d;
}

.login-page .login-submit:disabled {
  opacity: .65;
  cursor: not-allowed;
}

.login-page .login-spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, .35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: login-spin .7s linear infinite;
}

@keyframes login-spin {
  to {
    transform: rotate(360deg);
  }
}

.login-page .login-security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin: -4px 0 0;
  color: #8a968d;
  font-size: 11px;
  line-height: 1.6;
  text-align: center;
}

.login-page .login-security-note svg {
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .login-page .login-form {
    gap: 16px;
  }

  .login-page .login-label {
    font-size: 12px;
  }

  .login-page .login-input {
    height: 44px;
  }
}
`;

function LoginStyles() {
  return <style>{loginCSS}</style>;
}

export function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const registered = Boolean(
    location.state &&
      typeof location.state === "object" &&
      "registered" in location.state &&
      location.state.registered
  );

  const resetSuccess = Boolean(
    location.state &&
      typeof location.state === "object" &&
      "resetSuccess" in location.state &&
      location.state.resetSuccess
  );

  const [sessionExpired, setSessionExpired] = useState(() => {
    const fromState = Boolean(
      location.state &&
        typeof location.state === "object" &&
        "sessionExpired" in location.state &&
        location.state.sessionExpired
    );
    const fromStorage = typeof sessionStorage !== "undefined" && sessionStorage.getItem("spa-session-expired") === "true";
    return fromState || fromStorage;
  });

  useEffect(() => {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("spa-session-expired")) {
      sessionStorage.removeItem("spa-session-expired");
    }
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return (
      <Navigate
        to={homePath(user.role)}
        replace
      />
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) return;

    const cleanEmail = email.trim();

    const nextErrors: {
      email?: string;
      password?: string;
    } = {};

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      nextErrors.email =
        "Please enter a valid email address.";
    }

    if (!password) {
      nextErrors.password =
        "Please enter your password.";
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("");
      return;
    }

    setSubmitting(true);
    setError("");
    setSessionExpired(false);
    setFieldErrors({});

    try {
      const response = await login({
        email: cleanEmail,
        password,
      });

      const challenge = response.data;

      if (
        !challenge ||
        !challenge.challengeToken
      ) {
        throw new Error(
          "Missing verification challenge."
        );
      }

      const pending: PendingOtp = {
        flow: "login",
        challengeToken:
          challenge.challengeToken,
        email: cleanEmail,
        maskedDestination:
          challenge.maskedDestination,
        expiresInSeconds:
          challenge.expiresInSeconds,
        resendAvailableAt:
          Date.now() +
          challenge.resendAvailableInSeconds *
            1000,
        message: response.message,
      };

      sessionStorage.setItem(
        PENDING_KEY,
        JSON.stringify(pending)
      );

      navigate("/verify");
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors({
          email: caught.details?.fields?.email,
          password:
            caught.details?.fields?.password,
        });

        setError(caught.message);
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to continue your certification journey."
      footer={
        <>
          New to the portal?{" "}
          <Link to="/signup">
            Create an Account
          </Link>
        </>
      }
    >
      <LoginStyles />

      <div className="login-page">
        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Registration success */}

          {registered && (
            <div
              className="login-success"
              role="status"
            >
              <span className="login-success-icon">
                ✓
              </span>

              <span>
                Account created successfully.
                Please log in to continue.
              </span>
            </div>
          )}

          {/* Password reset success */}

          {resetSuccess && (
            <div
              className="login-success"
              role="status"
            >
              <span className="login-success-icon">
                ✓
              </span>

              <span>
                Password reset successful.
                Please log in with your new
                password.
              </span>
            </div>
          )}

          {/* Session expired notice */}

          {sessionExpired && (
            <div
              className="login-session-expired"
              role="status"
            >
              <span className="login-session-expired-icon">
                ⏱
              </span>

              <span>
                Your session has expired due to 15 minutes of inactivity. Please log in again.
              </span>
            </div>
          )}

          {/* API error */}

          {error && !sessionExpired && (
            <div
              className="login-alert"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Email */}

          <div className="login-field">
            <label
              className="login-label"
              htmlFor="email"
            >
              <span>
                Email Address{" "}
                <span className="login-required">
                  *
                </span>
              </span>
            </label>

            <input
              id="email"
              name="email"
              className="login-input"
              type="email"
              autoComplete="username"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);

                setFieldErrors((current) => ({
                  ...current,
                  email: undefined,
                }));
              }}
              aria-invalid={Boolean(
                fieldErrors.email
              )}
              aria-describedby={
                fieldErrors.email
                  ? "login-email-error"
                  : undefined
              }
            />

            {fieldErrors.email && (
              <p
                id="login-email-error"
                className="login-field-error"
              >
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}

          <div className="login-field">
            <div className="login-label">
              <label htmlFor="password">
                Password{" "}
                <span className="login-required">
                  *
                </span>
              </label>

              <Link
                to="/forgot-password"
                className="login-forgot"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="login-password-wrap">
              <input
                id="password"
                name="password"
                className="login-input"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);

                  setFieldErrors((current) => ({
                    ...current,
                    password: undefined,
                  }));
                }}
                aria-invalid={Boolean(
                  fieldErrors.password
                )}
                aria-describedby={
                  fieldErrors.password
                    ? "login-password-error"
                    : undefined
                }
              />

              <button
                type="button"
                className="login-show-btn"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>

            {fieldErrors.password && (
              <p
                id="login-password-error"
                className="login-field-error"
              >
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Submit */}

          <button
            className="login-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting && (
              <span
                className="login-spinner"
                aria-hidden="true"
              />
            )}

            {submitting
              ? "Signing In..."
              : "Log In"}
          </button>

          {/* OTP information */}

          <p className="login-security-note">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect
                x="5"
                y="11"
                width="14"
                height="10"
                rx="2"
              />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>

            A verification code will be sent
            to your registered email.
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
