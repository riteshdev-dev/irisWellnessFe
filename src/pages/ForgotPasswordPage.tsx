import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, forgotPassword, resetPassword } from "../api/client.ts";
import { AuthShell } from "../components/AuthShell.tsx";
import { OtpInput } from "../components/OtpInput.tsx";

function validatePasswordStrength(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Include at least one uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Include at least one lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Include at least one number.";
  return null;
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  // Step 1: Request Reset, Step 2: Submit OTP & New Password
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [maskedDestination, setMaskedDestination] = useState("");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleRequestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setFieldErrors({ email: "Enter a valid email address." });
      return;
    }

    setSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      const response = await forgotPassword(cleanEmail);
      const challenge = response.data;
      if (!challenge) {
        throw new Error("Unable to request password reset.");
      }

      setChallengeToken(challenge.challengeToken);
      setMaskedDestination(challenge.maskedDestination);
      setStep(2);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("Failed to send reset code. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (otp.length !== 6) {
      nextErrors.otp = "Enter the 6-digit verification code.";
    }

    const pwError = validatePasswordStrength(newPassword);
    if (pwError) {
      nextErrors.password = pwError;
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError("");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await resetPassword({
        challengeToken,
        otp,
        password: newPassword,
        confirmPassword,
      });

      navigate("/", {
        replace: true,
        state: { resetSuccess: true },
      });
    } catch (caught) {
      if (caught instanceof ApiError) {
        const remaining = caught.details?.attemptsRemaining;
        setError(
          typeof remaining === "number"
            ? `${caught.message} (${remaining} attempt${remaining === 1 ? "" : "s"} remaining)`
            : caught.message,
        );
        if (caught.details?.fields) {
          setFieldErrors(caught.details.fields);
        }
      } else {
        setError("Failed to reset password.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title={step === 1 ? "Reset your password" : "Set new password"}
      subtitle={
        step === 1
          ? "Enter your email address and we will send you a verification code to reset your password."
          : `Enter the 6-digit code sent to ${maskedDestination} and choose your new password.`
      }
      footer={<Link to="/">Back to login</Link>}
    >
      {step === 1 ? (
        <form className="portal-form" onSubmit={handleRequestReset} noValidate>
          {error ? <p className="portal-alert">{error}</p> : null}

          <label className="portal-field" htmlFor="email">
            Email address
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              aria-invalid={Boolean(fieldErrors.email)}
            />
          </label>
          {fieldErrors.email ? (
            <p className="portal-field-error">{fieldErrors.email}</p>
          ) : null}

          <button className="portal-button" type="submit" disabled={submitting}>
            {submitting ? "Sending reset code…" : "Send Reset Code"}
          </button>
        </form>
      ) : (
        <form className="portal-form" onSubmit={handleResetPassword} noValidate>
          {error ? <p className="portal-alert">{error}</p> : null}

          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#142e29", display: "block", marginBottom: "8px" }}>
              Verification Code
            </span>
            <OtpInput value={otp} onChange={setOtp} disabled={submitting} invalid={Boolean(fieldErrors.otp)} />
            {fieldErrors.otp ? <p className="portal-field-error">{fieldErrors.otp}</p> : null}
          </div>

          <label className="portal-field" htmlFor="newPassword">
            New password
            <div style={{ position: "relative" }}>
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                style={{ width: "100%", paddingRight: "70px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#1e624c",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <span style={{ fontSize: "11px", color: "#6b7d77", marginTop: "4px", display: "block" }}>
              At least 8 characters, with 1 uppercase, 1 lowercase, and 1 number.
            </span>
          </label>
          {fieldErrors.password ? (
            <p className="portal-field-error">{fieldErrors.password}</p>
          ) : null}

          <label className="portal-field" htmlFor="confirmPassword">
            Confirm new password
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
            />
          </label>
          {fieldErrors.confirmPassword ? (
            <p className="portal-field-error">{fieldErrors.confirmPassword}</p>
          ) : null}

          <button
            className="portal-button"
            type="submit"
            disabled={submitting || otp.length !== 6 || !newPassword || !confirmPassword}
          >
            {submitting ? "Resetting password…" : "Reset Password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
