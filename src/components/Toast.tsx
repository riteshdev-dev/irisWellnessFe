import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration: number;
  createdAt: number;
}

declare global {
  interface Window {
    toast?: typeof toast;
  }
}

export const toast = {
  show(message: string, type: ToastType = "info", options?: { title?: string; duration?: number }) {
    if (!message) return "";
    const id = Math.random().toString(36).substring(2, 9);
    const duration = options?.duration ?? (type === "error" ? 5000 : 3500);
    const newToast: ToastItem = {
      id,
      type,
      message,
      title: options?.title,
      duration,
      createdAt: Date.now(),
    };

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("portal:toast", { detail: newToast }));

      if (duration > 0) {
        setTimeout(() => {
          toast.dismiss(id);
        }, duration);
      }
    }

    return id;
  },

  success(message: string, options?: { title?: string; duration?: number }) {
    return toast.show(message, "success", { title: options?.title ?? "Success", ...options });
  },

  error(message: string, options?: { title?: string; duration?: number }) {
    return toast.show(message, "error", { title: options?.title ?? "Error", ...options });
  },

  warning(message: string, options?: { title?: string; duration?: number }) {
    return toast.show(message, "warning", { title: options?.title ?? "Warning", ...options });
  },

  info(message: string, options?: { title?: string; duration?: number }) {
    return toast.show(message, "info", { title: options?.title ?? "Notice", ...options });
  },

  dismiss(id: string) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("portal:toast:dismiss", { detail: id }));
    }
  },

  clear() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("portal:toast:clear"));
    }
  },
};

if (typeof window !== "undefined") {
  window.toast = toast;
}

export function useToast() {
  return toast;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleAdd = (e: Event) => {
      const custom = e as CustomEvent<ToastItem>;
      if (!custom.detail) return;
      setToasts((prev) => [custom.detail, ...prev.filter((t) => t.id !== custom.detail.id)].slice(0, 5));
    };

    const handleDismiss = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (!custom.detail) return;
      setToasts((prev) => prev.filter((t) => t.id !== custom.detail));
    };

    const handleClear = () => {
      setToasts([]);
    };

    window.addEventListener("portal:toast", handleAdd);
    window.addEventListener("portal:toast:dismiss", handleDismiss);
    window.addEventListener("portal:toast:clear", handleClear);

    return () => {
      window.removeEventListener("portal:toast", handleAdd);
      window.removeEventListener("portal:toast:dismiss", handleDismiss);
      window.removeEventListener("portal:toast:clear", handleClear);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="portal-toast-container" aria-live="polite">
      <style>{`
        .portal-toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999999 !important;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 380px;
          max-width: calc(100vw - 32px);
          pointer-events: none;
        }

        .portal-toast-item {
          pointer-events: auto;
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 15px 18px 17px;
          border-radius: 12px;
          box-shadow: 0 14px 34px -4px rgba(15, 30, 24, 0.28), 0 4px 12px rgba(0, 0, 0, 0.12);
          animation: portalToastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          overflow: hidden;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
          backdrop-filter: blur(6px);
        }

        @keyframes portalToastIn {
          from {
            opacity: 0;
            transform: translateX(25px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        /* SUCCESS & INFO: VIBRANT SAGE / FOREST GREEN */
        .portal-toast-item.type-success,
        .portal-toast-item.type-info {
          background: linear-gradient(135deg, #1e5c4a, #144637) !important;
          border: 1px solid rgba(255, 255, 255, 0.22) !important;
          border-left: 5px solid #4ade80 !important;
          color: #ffffff !important;
        }

        .portal-toast-item.type-success .portal-toast-icon-wrap,
        .portal-toast-item.type-info .portal-toast-icon-wrap {
          background: rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
        }

        .portal-toast-item.type-success .portal-toast-title,
        .portal-toast-item.type-info .portal-toast-title {
          font-size: 13.5px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
          line-height: 1.25 !important;
          margin-bottom: 3px !important;
        }

        .portal-toast-item.type-success .portal-toast-msg,
        .portal-toast-item.type-info .portal-toast-msg {
          font-size: 13px !important;
          color: #e8f7f0 !important;
          line-height: 1.45 !important;
          word-break: break-word !important;
        }

        .portal-toast-item.type-success .portal-toast-close,
        .portal-toast-item.type-info .portal-toast-close {
          color: rgba(255, 255, 255, 0.8) !important;
        }

        .portal-toast-item.type-success .portal-toast-close:hover,
        .portal-toast-item.type-info .portal-toast-close:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.2) !important;
        }

        .portal-toast-item.type-success .portal-toast-progress-bar,
        .portal-toast-item.type-info .portal-toast-progress-bar {
          background: rgba(255, 255, 255, 0.8) !important;
        }

        /* ERROR: VIBRANT BALANCED CRIMSON RED (NOT PITCH DARK) */
        .portal-toast-item.type-error {
          background: linear-gradient(135deg, #c53030, #991b1b) !important;
          border: 1px solid rgba(255, 255, 255, 0.24) !important;
          border-left: 5px solid #fecaca !important;
          color: #ffffff !important;
        }

        .portal-toast-item.type-error .portal-toast-icon-wrap {
          background: rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
        }

        .portal-toast-item.type-error .portal-toast-title {
          font-size: 13.5px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
          line-height: 1.25 !important;
          margin-bottom: 3px !important;
        }

        .portal-toast-item.type-error .portal-toast-msg {
          font-size: 13px !important;
          color: #fff1f1 !important;
          line-height: 1.45 !important;
          word-break: break-word !important;
        }

        .portal-toast-item.type-error .portal-toast-close {
          color: rgba(255, 255, 255, 0.8) !important;
        }

        .portal-toast-item.type-error .portal-toast-close:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.2) !important;
        }

        .portal-toast-item.type-error .portal-toast-progress-bar {
          background: rgba(255, 255, 255, 0.8) !important;
        }

        /* WARNING: BALANCED AMBER */
        .portal-toast-item.type-warning {
          background: linear-gradient(135deg, #d97706, #b45309) !important;
          border: 1px solid rgba(255, 255, 255, 0.22) !important;
          border-left: 5px solid #fef3c7 !important;
          color: #ffffff !important;
        }

        .portal-toast-item.type-warning .portal-toast-icon-wrap {
          background: rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
        }

        .portal-toast-item.type-warning .portal-toast-title {
          font-size: 13.5px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
          line-height: 1.25 !important;
          margin-bottom: 3px !important;
        }

        .portal-toast-item.type-warning .portal-toast-msg {
          font-size: 13px !important;
          color: #fffbeb !important;
          line-height: 1.45 !important;
          word-break: break-word !important;
        }

        .portal-toast-item.type-warning .portal-toast-close {
          color: rgba(255, 255, 255, 0.8) !important;
        }

        .portal-toast-item.type-warning .portal-toast-close:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.2) !important;
        }

        .portal-toast-item.type-warning .portal-toast-progress-bar {
          background: rgba(255, 255, 255, 0.8) !important;
        }

        .portal-toast-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .portal-toast-content {
          flex: 1;
          min-width: 0;
        }

        .portal-toast-close {
          background: transparent;
          border: none;
          font-size: 16px;
          line-height: 1;
          padding: 4px;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
          margin-top: -2px;
          margin-right: -4px;
        }

        .portal-toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }

        .portal-toast-progress-bar {
          height: 100%;
          animation: portalToastProgress linear forwards;
          transform-origin: left;
        }

        @keyframes portalToastProgress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>

      {toasts.map((item) => (
        <div key={item.id} className={`portal-toast-item type-${item.type}`} role="alert">
          <div className="portal-toast-icon-wrap">
            {item.type === "success" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {item.type === "error" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            {item.type === "warning" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
            {item.type === "info" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            )}
          </div>

          <div className="portal-toast-content">
            {item.title && <div className="portal-toast-title">{item.title}</div>}
            <div className="portal-toast-msg">{item.message}</div>
          </div>

          <button
            type="button"
            className="portal-toast-close"
            aria-label="Dismiss notification"
            onClick={() => toast.dismiss(item.id)}
          >
            ✕
          </button>

          {item.duration > 0 && (
            <div className="portal-toast-progress">
              <div
                className="portal-toast-progress-bar"
                style={{ animationDuration: `${item.duration}ms` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
