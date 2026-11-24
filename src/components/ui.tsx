import { useEffect, type ReactNode } from "react";

export function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    dashboard: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />,
    profile: <><circle cx="12" cy="8" r="3.2" /><path d="M5 19.2c1.4-3 3.8-4.4 7-4.4s5.6 1.4 7 4.4" /></>,
    learning: <path d="M3 7.5 12 4l9 3.5L12 11 3 7.5Zm0 4.2 9 3.5 9-3.5M3 16l9 3.5L21 16" />,
    assessment: <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Zm7 0v4h4M8.5 12.5l1.6 1.6 3.2-3.4M8.5 17h6" />,
    certificate: <path d="M7 3.5h10v14l-5-2.4-5 2.4zM9 8h6M9 11h6" />,
    courses: <path d="M4 6.5h16v12H4zM8 6.5V4.8h8V6.5M8 11h8M8 14.5h5" />,
    modules: <path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" />,
    users: <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a2.4 2.4 0 1 0 0-4.8A2.4 2.4 0 0 0 16 11ZM3.5 19c.6-2.8 2.6-4.2 4.5-4.2s3.9 1.4 4.5 4.2M14 14.8c1.6 0 3.2 1 3.8 3.2" />,
    enrollments: <path d="M4 7h16v11H4zM8 7V5.5h8V7M8 12h8" />,
    reports: <path d="M5 19V10M12 19V5M19 19v-7" />,
    logout: <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10M10 12h9M16 8.5 19.5 12 16 15.5" />,
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name] ?? paths.dashboard}
    </svg>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="shell-empty">
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function Notice({ tone, children }: { tone: "error" | "ok"; children: ReactNode }) {
  return <p className={tone === "error" ? "portal-alert" : "portal-success"}>{children}</p>;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  // Lock background scroll completely without breaking sticky sidebar
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const isDanger =
    confirmLabel.toLowerCase().includes("remove") ||
    confirmLabel.toLowerCase().includes("delete") ||
    confirmLabel.toLowerCase().includes("deactivate");

  return (
    <div className="shell-modal-wrap" role="presentation" onMouseDown={onClose}>
      <style>{`
        .shell-modal-wrap {
          position: fixed;
          inset: 0;
          background: rgba(14, 34, 27, 0.48);
          backdrop-filter: blur(4px);
          z-index: 10000;
          display: grid;
          place-items: center;
          padding: 20px;
          overscroll-behavior: contain;
        }

        .shell-confirm-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #dce5df;
          box-shadow: 0 20px 48px -8px rgba(12, 38, 28, 0.22), 0 6px 18px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          animation: shellConfirmIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
        }

        @keyframes shellConfirmIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .shell-confirm-head {
          padding: 20px 22px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .shell-confirm-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .shell-confirm-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .shell-confirm-icon-wrap.is-danger {
          background: #fee2e2;
          color: #dc2626;
        }

        .shell-confirm-icon-wrap.is-primary {
          background: #e6f5eb;
          color: #1e5c4a;
        }

        .shell-confirm-head h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 750;
          color: #16362b;
          line-height: 1.25;
        }

        .shell-confirm-close {
          background: transparent;
          border: none;
          color: #8c9e96;
          font-size: 18px;
          line-height: 1;
          padding: 6px;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s;
        }

        .shell-confirm-close:hover {
          color: #17372c;
          background: #f0f4f1;
        }

        .shell-confirm-body {
          padding: 4px 22px 20px 60px;
          font-size: 13.5px;
          color: #556c63;
          line-height: 1.55;
        }

        .shell-confirm-foot {
          padding: 14px 22px;
          border-top: 1px solid #edf2ee;
          background: #fafcfb;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .shell-confirm-btn-cancel {
          padding: 9px 18px;
          border-radius: 9px;
          border: 1px solid #d5ded8;
          background: #ffffff;
          color: #385549;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .shell-confirm-btn-cancel:hover {
          background: #f1f6f3;
          border-color: #bccbc1;
          color: #1d3c31;
        }

        .shell-confirm-btn-action {
          padding: 9px 20px;
          border-radius: 9px;
          border: 0;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.15s;
        }

        .shell-confirm-btn-action.is-danger {
          background: #c53030;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(197, 48, 48, 0.25);
        }

        .shell-confirm-btn-action.is-danger:hover {
          background: #a82323;
        }

        .shell-confirm-btn-action.is-primary {
          background: #1e5c4a;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(30, 92, 74, 0.25);
        }

        .shell-confirm-btn-action.is-primary:hover {
          background: #154738;
        }

        .shell-confirm-btn-action:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
      `}</style>

      <div
        className="shell-confirm-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="shell-confirm-head">
          <div className="shell-confirm-title-row">
            <div className={`shell-confirm-icon-wrap ${isDanger ? "is-danger" : "is-primary"}`}>
              {isDanger ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </div>
            <h3>{title}</h3>
          </div>

          <button
            type="button"
            className="shell-confirm-close"
            aria-label="Close dialog"
            onClick={onClose}
            disabled={busy}
          >
            ✕
          </button>
        </div>

        <div className="shell-confirm-body">
          <p style={{ margin: 0 }}>{message}</p>
        </div>

        <div className="shell-confirm-foot">
          <button
            type="button"
            className="shell-confirm-btn-cancel"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`shell-confirm-btn-action ${isDanger ? "is-danger" : "is-primary"}`}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Pager({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="shell-pager">
      <button type="button" className="shell-button ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span>{page} of {pages}</span>
      <button type="button" className="shell-button ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}
