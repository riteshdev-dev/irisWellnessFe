import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="portal-auth">
      <section className="portal-brand" aria-label="Portal introduction">
        <div className="portal-brand-inner">
          <Link className="portal-mark" to="/">
            Spa Therapist
            <span>Online Certification</span>
          </Link>
          <p className="portal-brand-kicker">International practitioner registry</p>
          <h2>Care, practiced to a certified standard.</h2>
          <p>
            A private portal for spa therapists. Sign in with a one-time code sent to the email or
            mobile number on your account.
          </p>
          <ol>
            <li>
              <span>01</span>
              Confirm the account is registered
            </li>
            <li>
              <span>02</span>
              Enter a six-digit code
            </li>
            <li>
              <span>03</span>
              Continue to your certification record
            </li>
          </ol>
        </div>
      </section>
      <section className="portal-panel">
        <div className="portal-card">
          <p className="portal-kicker">Spa Therapist Portal</p>
          <h1>{title}</h1>
          <p className="portal-subtitle">{subtitle}</p>
          {children}
          <div className="portal-footer">{footer}</div>
        </div>
      </section>
    </main>
  );
}
