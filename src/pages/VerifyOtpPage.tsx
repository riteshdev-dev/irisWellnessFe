import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, sendOtp, verifyOtp } from "../api/client.ts";
import { AuthShell } from "../components/AuthShell.tsx";
import { OtpInput } from "../components/OtpInput.tsx";
import { useAuth } from "../context/useAuth.ts";
import { homePath } from "../lib/paths.ts";
import type { PendingOtp } from "../types/auth.ts";

const PENDING_KEY = "spa-otp-pending";

function readPending(): PendingOtp | null {
  const raw = sessionStorage.getItem(PENDING_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PendingOtp;
    if (!parsed.challengeToken || !parsed.maskedDestination) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

const verifyCSS = `
.verify-compact {
  width: 100%;
  font-family: inherit;
}

.verify-compact .verify-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Status notices */
.verify-compact .verify-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 9px;
  background: #edf6f1;
  border: 1px solid #cce4d6;
  color: #1a5e46;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}

.verify-compact .verify-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 9px;
  background: #fff3ef;
  border: 1px solid #edc8bf;
  color: #a64435;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}

/* OTP Input Boxes */
.verify-compact .otp-inputs {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin: 6px 0;
}

.verify-compact .otp-digit {
  width: 100%;
  height: 52px;
  min-height: 52px;
  max-height: 52px;
  text-align: center;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #1b382f;
  background: #fffdfb;
  border: 1.5px solid #dedbd3;
  border-radius: 10px;
  outline: none;
  padding: 0;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.verify-compact .otp-digit:hover:not(:disabled) {
  border-color: #8da497;
}

.verify-compact .otp-digit:focus {
  border-color: #2b7055;
  box-shadow: 0 0 0 3.5px rgba(43, 112, 85, 0.15);
  background: #ffffff;
  transform: translateY(-1px);
}

.verify-compact .otp-inputs-invalid .otp-digit {
  border-color: #d15644;
  background: #fffafa;
}

/* Primary Verify Button */
.verify-compact .verify-submit-btn {
  width: 100%;
  height: 46px;
  min-height: 46px;
  border: 0;
  border-radius: 10px;
  background: #1c4d3c;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.verify-compact .verify-submit-btn:hover:not(:disabled) {
  background: #123a2d;
  box-shadow: 0 4px 14px rgba(28, 77, 60, 0.22);
}

.verify-compact .verify-submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

/* Resend Section */
.verify-compact .resend-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 0 2px;
  border-top: 1px solid #eae5dc;
  margin-top: 6px;
}

.verify-compact .resend-label {
  font-size: 13px;
  color: #6b7c73;
}

.verify-compact .resend-button {
  border: 0;
  background: transparent;
  color: #1c4d3c;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.verify-compact .resend-button:hover:not(:disabled) {
  background: #edf6f1;
  color: #123a2d;
}

.verify-compact .resend-button:disabled {
  color: #88968f;
  cursor: not-allowed;
}

.verify-compact .resend-timer-badge {
  display: inline-block;
  padding: 2px 7px;
  background: #e9efe9;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  color: #3f5e50;
  margin-left: 2px;
}

.verify-compact .back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #245743;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.15s ease;
}

.verify-compact .back-link:hover {
  color: #123a2d;
  text-decoration: underline;
}
`;

function VerifyStyles() {
  return <style>{verifyCSS}</style>;
}

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [pending, setPending] = useState<PendingOtp | null>(() => readPending());
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(pending?.message ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!pending) {
    return (
      <AuthShell
        title="Verification session expired"
        subtitle="Please return to the login page and sign in again."
        footer={
          <Link to="/" className="back-link">
            ← Back to Login
          </Link>
        }
      >
        <VerifyStyles />
        <div className="verify-compact">
          <Link className="verify-submit-btn" style={{ textDecoration: "none" }} to="/">
            Go to Login
          </Link>
        </div>
      </AuthShell>
    );
  }

  const secondsLeft = Math.max(0, Math.ceil((pending.resendAvailableAt - now) / 1000));
  const minutes = Math.max(1, Math.round(pending.expiresInSeconds / 60));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending || otp.length !== 6) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await verifyOtp(pending.challengeToken, otp);
      sessionStorage.removeItem(PENDING_KEY);
      sessionStorage.removeItem("spa-session-expired");
      localStorage.setItem("spa-last-activity", Date.now().toString());

      if (response.data?.user) {
        setUser(response.data.user);
        navigate(homePath(response.data.user.role), { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (caught) {
      if (caught instanceof ApiError) {
        const remaining = caught.details?.attemptsRemaining;
        setError(
          typeof remaining === "number"
            ? `${caught.message} (${remaining} attempt${remaining === 1 ? "" : "s"} remaining)`
            : caught.message,
        );
      } else {
        setError("The verification code could not be verified.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!pending || secondsLeft > 0) {
      return;
    }

    setResending(true);
    setError("");

    try {
      const response = await sendOtp(pending.challengeToken);
      const challenge = response.data;
      if (!challenge || !challenge.challengeToken) {
        throw new Error("Missing verification details.");
      }

      const nextPending: PendingOtp = {
        ...pending,
        challengeToken: challenge.challengeToken,
        maskedDestination: challenge.maskedDestination,
        expiresInSeconds: challenge.expiresInSeconds,
        resendAvailableAt: Date.now() + challenge.resendAvailableInSeconds * 1000,
        message: response.message,
      };

      sessionStorage.setItem(PENDING_KEY, JSON.stringify(nextPending));
      setPending(nextPending);
      setNotice(response.message || "A new verification code was sent.");
      setOtp("");
    } catch (caught) {
      if (caught instanceof ApiError) {
        const retryAfter = caught.details?.retryAfterSeconds;
        if (typeof retryAfter === "number") {
          const nextPending = { ...pending, resendAvailableAt: Date.now() + retryAfter * 1000 };
          setPending(nextPending);
          sessionStorage.setItem(PENDING_KEY, JSON.stringify(nextPending));
        }
        setError(caught.message);
      } else {
        setError("A new code could not be sent.");
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      title="Enter your verification code"
      subtitle={
        `We sent a 6-digit code to ${pending.maskedDestination}. It expires in ${minutes} minutes.`
      }
      footer={
        <Link to="/" className="back-link">
          ← Back to Login
        </Link>
      }
    >
      <VerifyStyles />

      <div className="verify-compact">
        <form className="verify-form" onSubmit={handleSubmit} noValidate>
          {notice && (
            <div className="verify-notice" role="status">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{notice}</span>
            </div>
          )}

          {error && (
            <div className="verify-alert" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <OtpInput value={otp} onChange={setOtp} disabled={submitting} invalid={Boolean(error)} />

          <button
            className="verify-submit-btn"
            type="submit"
            disabled={submitting || otp.length !== 6}
          >
            {submitting ? "Verifying code…" : "Verify & Sign In"}
          </button>

          <div className="resend-container">
            <span className="resend-label">Didn't receive the code?</span>
            <button
              type="button"
              className="resend-button"
              onClick={handleResend}
              disabled={resending || secondsLeft > 0}
            >
              {secondsLeft > 0 ? (
                <>
                  Resend code <span className="resend-timer-badge">{secondsLeft}s</span>
                </>
              ) : resending ? (
                "Sending…"
              ) : (
                "Resend Code"
              )}
            </button>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
