import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ApiError, signup } from "../api/client.ts";
import { AuthShell } from "../components/AuthShell.tsx";
import { CountrySelect } from "../components/CountrySelect.tsx";
import { PhoneField } from "../components/PhoneField.tsx";
import { phoneIsValid } from "../data/countries.ts";
import { useAuth } from "../context/useAuth.ts";
import { homePath } from "../lib/paths.ts";

interface SignupFields {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  nationality: string;
  phoneCountryIso2: string;
  phoneNumber: string;
}

const emptyFields: SignupFields = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  nationality: "",
  phoneCountryIso2: "",
  phoneNumber: "",
};

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Include at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
  return null;
}

const signupCSS = `
.signup-compact,
.signup-compact *,
.signup-compact *::before,
.signup-compact *::after {
  box-sizing: border-box;
}

.signup-compact {
  width: 100%;
  font-family: inherit;
}

.signup-compact .sc-form {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.signup-compact .sc-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.signup-compact .sc-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  min-width: 0;
}

.signup-compact .sc-label,
.signup-compact .portal-select-label,
.signup-compact .phone-field-label {
  display: block;
  margin: 0;
  color: #30483c;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
}

.signup-compact .sc-required {
  color: #b05c47;
  font-weight: 700;
}

.signup-compact .sc-input {
  width: 100%;
  min-width: 0;
  height: 42px;
  min-height: 42px;
  max-height: 42px;
  padding: 0 12px;
  border: 1px solid #dedbd3;
  border-radius: 9px;
  background: #fffdfb;
  color: #243d32;
  font-size: 13px;
  outline: none;
}

.signup-compact .sc-input::placeholder {
  color: #a4aca6;
}

.signup-compact .sc-input:focus {
  border-color: #37765b;
  box-shadow: 0 0 0 3px rgba(55, 118, 91, 0.1);
}

.signup-compact [aria-invalid="true"] {
  border-color: #bd6554;
}

.signup-compact .sc-password {
  position: relative;
}

.signup-compact .sc-password .sc-input {
  padding-right: 55px;
}

.signup-compact .sc-show {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  padding: 5px;
  border: 0;
  background: transparent;
  color: #28654e;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.signup-compact .sc-hint {
  margin: -4px 0 0;
  color: #849087;
  font-size: 11px;
  line-height: 1.4;
}

.signup-compact .sc-error {
  margin: 0;
  color: #b14e3e;
  font-size: 11px;
  line-height: 1.4;
}

.signup-compact .sc-alert {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid #edc8bf;
  border-radius: 8px;
  background: #fff3ef;
  color: #a64435;
  font-size: 12px;
}

/* Country Selector Styling */
.signup-compact .portal-select {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.signup-compact .portal-select-country {
  width: 100%;
}

.signup-compact .portal-select-country .portal-select-trigger {
  width: 100%;
  height: 42px;
  min-height: 42px;
  max-height: 42px;
  padding: 0 12px;
  border: 1px solid #dedbd3;
  border-radius: 9px;
  background: #fffdfb;
  color: #243d32;
  font-size: 13px;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
}

.signup-compact .portal-select-country .portal-select-trigger:focus,
.signup-compact .portal-select-country .portal-select-trigger:focus-visible {
  border-color: #37765b;
  box-shadow: 0 0 0 3px rgba(55, 118, 91, 0.1);
}

.signup-compact .portal-selected-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #243d32;
  text-align: left;
}

.signup-compact .portal-select-placeholder {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #a4aca6;
  font-size: 13px;
  text-align: left;
}

.signup-compact .portal-select-chevron {
  flex-shrink: 0;
  color: #728278;
  font-size: 10px;
  margin-left: auto;
}

/* Country Dropdown Menu */
.signup-compact .portal-country-menu {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
  padding: 8px;
  border: 1px solid #dedbd3;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
}

/* Mobile Number & Dial Row */
.signup-compact .portal-field {
  width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.signup-compact .portal-phone-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  width: 100%;
}

.signup-compact .portal-select-dial {
  width: 96px;
  position: relative;
}

.signup-compact .portal-select-dial .portal-select-trigger {
  width: 96px;
  height: 42px;
  min-height: 42px;
  max-height: 42px;
  padding: 0 8px;
  border: 1px solid #dedbd3;
  border-radius: 9px;
  background: #fffdfb;
  color: #243d32;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  cursor: pointer;
  box-sizing: border-box;
}

.signup-compact .portal-select-dial .portal-select-trigger:focus,
.signup-compact .portal-select-dial .portal-select-trigger:focus-visible {
  border-color: #37765b;
  box-shadow: 0 0 0 3px rgba(55, 118, 91, 0.1);
}

.signup-compact .portal-dial-menu {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  width: min(320px, 85vw);
  min-width: 260px;
  z-index: 1000;
  padding: 8px;
  border: 1px solid #dedbd3;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
}

/* Fix double input: completely strip wrapper styles from portal-phone-entry */
.signup-compact .portal-phone-entry {
  display: block !important;
  width: 100% !important;
  min-width: 0 !important;
  height: auto !important;
  min-height: unset !important;
  max-height: unset !important;
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.signup-compact .portal-phone-row:focus-within .portal-phone-entry {
  border: none !important;
  box-shadow: none !important;
  border-color: transparent !important;
}

.signup-compact .portal-phone-entry input {
  display: block !important;
  width: 100% !important;
  min-width: 0 !important;
  height: 42px !important;
  min-height: 42px !important;
  max-height: 42px !important;
  padding: 0 12px !important;
  border: 1px solid #dedbd3 !important;
  border-radius: 9px !important;
  background: #fffdfb !important;
  color: #243d32 !important;
  font-size: 13px !important;
  outline: none !important;
  box-sizing: border-box !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.signup-compact .portal-phone-entry input::placeholder {
  color: #a4aca6;
}

.signup-compact .portal-phone-entry input:focus {
  border-color: #37765b !important;
  box-shadow: 0 0 0 3px rgba(55, 118, 91, 0.1) !important;
}

/* Shared Menu Search & Items */
.signup-compact .portal-select-search {
  width: 100%;
  height: 34px;
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid #dedbd3;
  border-radius: 7px;
  background: #fff;
  font-size: 12px;
  outline: none;
}

.signup-compact .portal-select-search:focus {
  border-color: #37765b;
}

.signup-compact .portal-select-menu ul {
  max-height: 200px;
  margin: 6px 0 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.signup-compact .portal-select-menu li {
  margin: 0;
  padding: 0;
  list-style: none;
}

.signup-compact .portal-select-menu li button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 33px;
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #30483c;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.signup-compact .portal-select-menu li button:hover {
  background: #edf5ef;
}

.signup-compact .portal-country-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.signup-compact .portal-dial {
  flex-shrink: 0;
  color: #7d8b80;
  font-size: 11px;
  font-weight: 600;
}

/* Terms and Submit */
.signup-compact .sc-terms {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: #65766b;
  font-size: 11px;
  line-height: 1.5;
  cursor: pointer;
  margin-top: 2px;
}

.signup-compact .sc-terms input {
  width: 15px;
  height: 15px;
  margin: 1px 0 0;
  flex-shrink: 0;
  accent-color: #205a45;
}

.signup-compact .sc-submit {
  width: 100%;
  min-height: 44px;
  border: 0;
  border-radius: 9px;
  background: #1c4d3c;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-top: 4px;
}

.signup-compact .sc-submit:hover:not(:disabled) {
  background: #123a2d;
}

.signup-compact .sc-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .signup-compact .sc-row {
    grid-template-columns: 1fr;
  }
}
`;

function SignupStyles() {
  return <style>{signupCSS}</style>;
}

export function SignupPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState<SignupFields>(emptyFields);
  const [fieldErrors, setFieldErrors] = useState<Partial<SignupFields>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState("");

  if (!loading && user) {
    return <Navigate to={homePath(user.role)} replace />;
  }

  function update(name: keyof SignupFields, value: string) {
    setFields((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [name]: undefined,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<SignupFields> = {};

    if (fields.name.trim().length < 2) {
      nextErrors.name = "Enter your full name.";
    }

    const email = fields.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      nextErrors.email = "Enter a valid email address.";
    }

    const pwError = validatePasswordStrength(fields.password);
    if (pwError) {
      nextErrors.password = pwError;
    }

    if (!fields.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (fields.password !== fields.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (!fields.nationality) {
      nextErrors.nationality = "Select your country.";
    }

    if (!fields.phoneCountryIso2) {
      nextErrors.phoneNumber = "Select the country code for your mobile number.";
    } else if (
      !fields.phoneNumber.trim() ||
      !phoneIsValid(fields.phoneCountryIso2, fields.phoneNumber.trim())
    ) {
      nextErrors.phoneNumber = "Enter a valid mobile number.";
    }

    if (!acceptedTerms) {
      setTermsError("Please accept the Terms and Privacy Policy.");
    } else {
      setTermsError("");
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !acceptedTerms) {
      setError("");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await signup({
        name: fields.name.trim(),
        email,
        password: fields.password,
        confirmPassword: fields.confirmPassword,
        nationality: fields.nationality,
        phoneCountryIso2: fields.phoneCountryIso2,
        phoneNumber: fields.phoneNumber.trim(),
      });

      navigate("/", {
        replace: true,
        state: { registered: true },
      });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors({
          name: caught.details?.fields?.name,
          email: caught.details?.fields?.email,
          password: caught.details?.fields?.password,
          confirmPassword: caught.details?.fields?.confirmPassword,
          nationality: caught.details?.fields?.nationality,
          phoneNumber: caught.details?.fields?.phoneNumber,
        });
        setError(caught.message);
      } else {
        setError("The account could not be created.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create Your Account"
      subtitle="Start your professional certification journey."
      footer={
        <>
          Already have an account? <Link to="/">Log In</Link>
        </>
      }
    >
      <SignupStyles />

      <div className="signup-compact">
        <form className="sc-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <p className="sc-alert" role="alert">
              {error}
            </p>
          )}

          <div className="sc-field">
            <label className="sc-label" htmlFor="name">
              Full Name <span className="sc-required">*</span>
            </label>
            <input
              id="name"
              name="name"
              className="sc-input"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              value={fields.name}
              onChange={(event) => update("name", event.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name && <p className="sc-error">{fieldErrors.name}</p>}
          </div>

          <div className="sc-field">
            <label className="sc-label" htmlFor="email">
              Email Address <span className="sc-required">*</span>
            </label>
            <input
              id="email"
              name="email"
              className="sc-input"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              value={fields.email}
              onChange={(event) => update("email", event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email && <p className="sc-error">{fieldErrors.email}</p>}
          </div>

          <div className="sc-row">
            <div className="sc-field">
              <label className="sc-label" htmlFor="password">
                Create Password <span className="sc-required">*</span>
              </label>
              <div className="sc-password">
                <input
                  id="password"
                  name="password"
                  className="sc-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Password"
                  value={fields.password}
                  onChange={(event) => update("password", event.target.value)}
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                <button
                  type="button"
                  className="sc-show"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="sc-error">{fieldErrors.password}</p>
              )}
            </div>

            <div className="sc-field">
              <label className="sc-label" htmlFor="confirmPassword">
                Confirm Password <span className="sc-required">*</span>
              </label>
              <div className="sc-password">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  className="sc-input"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm"
                  value={fields.confirmPassword}
                  onChange={(event) => update("confirmPassword", event.target.value)}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                />
                <button
                  type="button"
                  className="sc-show"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="sc-error">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <p className="sc-hint">
            Use 8+ characters with uppercase, lowercase and a number.
          </p>

          <div className="sc-field">
            <label className="sc-label" htmlFor="nationality">
              Country <span className="sc-required">*</span>
            </label>
            <CountrySelect
              id="nationality"
              label="Country"
              value={fields.nationality}
              onChange={(iso2) => {
                update("nationality", iso2);
                if (!fields.phoneCountryIso2) {
                  update("phoneCountryIso2", iso2);
                }
              }}
              variant="nationality"
              placeholder="Select country"
              hideLabel
              invalid={Boolean(fieldErrors.nationality)}
            />
            {fieldErrors.nationality && (
              <p className="sc-error">{fieldErrors.nationality}</p>
            )}
          </div>

          <div className="sc-field">
            <PhoneField
              country={fields.phoneCountryIso2}
              number={fields.phoneNumber}
              onCountryChange={(iso2) => update("phoneCountryIso2", iso2)}
              onNumberChange={(value) => update("phoneNumber", value)}
              invalid={Boolean(fieldErrors.phoneNumber)}
              label="Mobile number"
              required
            />
            {fieldErrors.phoneNumber && (
              <p className="sc-error">{fieldErrors.phoneNumber}</p>
            )}
          </div>

          <label className="sc-terms">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => {
                setAcceptedTerms(event.target.checked);
                setTermsError("");
              }}
            />
            <span>
              I agree to the Terms of Service and Privacy Policy.
            </span>
          </label>

          {termsError && (
            <p className="sc-error" role="alert">
              {termsError}
            </p>
          )}

          <button
            className="sc-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
