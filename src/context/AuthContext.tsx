import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { currentUser, logout as logoutRequest, onUnauthorized } from "../api/client.ts";
import type { AuthUser } from "../types/auth.ts";
import { AuthContext, type AuthContextValue } from "./auth-context.ts";

export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes = 900,000 ms
const ACTIVITY_THROTTLE_MS = 2000; // Throttle activity writes to once every 2 seconds
const CHECK_INTERVAL_MS = 5000; // Check inactivity every 5 seconds
export const LAST_ACTIVITY_KEY = "spa-last-activity";
export const LOGOUT_SYNC_KEY = "spa-sync-logout";
export const SESSION_EXPIRED_KEY = "spa-session-expired";
const OTP_PENDING_KEY = "spa-otp-pending";

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userRef = useRef<AuthUser | null>(null);
  userRef.current = user;

  const isLoggingOutRef = useRef(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Centralized logout process
  const performLogout = async (options?: { sessionExpired?: boolean; broadcast?: boolean }) => {
    const sessionExpired = Boolean(options?.sessionExpired);
    const shouldBroadcast = options?.broadcast !== false;

    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      // 1. Clear session activity and pending OTP data
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      sessionStorage.removeItem(OTP_PENDING_KEY);

      if (sessionExpired) {
        sessionStorage.setItem(SESSION_EXPIRED_KEY, "true");
      } else {
        sessionStorage.removeItem(SESSION_EXPIRED_KEY);
      }

      // 2. Synchronize logout across multiple tabs
      if (shouldBroadcast) {
        try {
          broadcastChannelRef.current?.postMessage({
            type: "LOGOUT",
            sessionExpired,
            timestamp: Date.now(),
          });
        } catch {
          // Ignore if broadcast is unavailable
        }

        try {
          localStorage.setItem(
            LOGOUT_SYNC_KEY,
            JSON.stringify({ timestamp: Date.now(), sessionExpired })
          );
        } catch {
          // Ignore storage write errors
        }
      }

      // 3. Call backend logout API (ignoring errors if session already expired)
      try {
        await logoutRequest();
      } catch {
        // Backend session might already be expired; local cleanup proceeds safely
      }

      // 4. Clear authenticated user state in React
      setUser(null);

      // 5. Immediately redirect to Login Page with replace: true to block browser Back button
      navigate("/", {
        replace: true,
        state: sessionExpired ? { sessionExpired: true } : undefined,
      });
    } finally {
      // Release the guard after a brief timeout to avoid rapid duplicate invocations
      setTimeout(() => {
        isLoggingOutRef.current = false;
      }, 1000);
    }
  };

  // Initial authentication check on application load
  useEffect(() => {
    let active = true;

    currentUser()
      .then((response) => {
        if (active) {
          const authUser = response.data?.user ?? null;
          setUser(authUser);
          if (authUser) {
            if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
              localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
            }
          }
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Centralized 401 Unauthorized interceptor subscription
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      // Only execute session expired logout if user was authenticated
      if (userRef.current && !isLoggingOutRef.current) {
        performLogout({ sessionExpired: true, broadcast: true });
      }
    });

    return unsubscribe;
  }, []);

  // Cross-tab synchronization via BroadcastChannel and storage events
  useEffect(() => {
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const channel = new BroadcastChannel("spa-auth-broadcast");
        broadcastChannelRef.current = channel;

        channel.onmessage = (event) => {
          if (event.data?.type === "LOGOUT" && userRef.current && !isLoggingOutRef.current) {
            performLogout({
              sessionExpired: Boolean(event.data.sessionExpired),
              broadcast: false, // Prevent echo loop
            });
          }
        };
      } catch {
        // BroadcastChannel unavailable
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOGOUT_SYNC_KEY && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (userRef.current && !isLoggingOutRef.current) {
            performLogout({
              sessionExpired: Boolean(data.sessionExpired),
              broadcast: false,
            });
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      try {
        broadcastChannelRef.current?.close();
      } catch {
        // Channel close cleanup
      }
    };
  }, []);

  // Inactivity tracking: active ONLY when user is authenticated
  useEffect(() => {
    if (!user) {
      return;
    }

    // Initialize last-activity timestamp if not present
    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }

    let lastRecordedTime = Date.now();

    // Throttled activity recording (mousemove, touch, keys, clicks, scrolls)
    const recordActivity = () => {
      const now = Date.now();
      if (now - lastRecordedTime >= ACTIVITY_THROTTLE_MS) {
        lastRecordedTime = now;
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      }
    };

    // Timestamp-based inactivity check
    const checkInactivity = () => {
      if (!userRef.current || isLoggingOutRef.current) return;

      const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
      const lastActive = raw ? parseInt(raw, 10) : Date.now();
      const elapsed = Date.now() - lastActive;

      // Allows optional override in browser console for local testing: window.__SPA_INACTIVITY_TIMEOUT_MS
      const timeoutLimit =
        (typeof window !== "undefined" && (window as unknown as { __SPA_INACTIVITY_TIMEOUT_MS?: number }).__SPA_INACTIVITY_TIMEOUT_MS) ||
        INACTIVITY_TIMEOUT_MS;

      if (elapsed >= timeoutLimit) {
        performLogout({ sessionExpired: true, broadcast: true });
      }
    };

    // Immediate check when user returns to tab or window gains focus
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        checkInactivity();
        recordActivity();
      }
    };

    // Attach passive listeners for all user interactions
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true });
    });

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    // Periodic check interval (every 5 seconds)
    const intervalId = window.setInterval(checkInactivity, CHECK_INTERVAL_MS);

    // Clean up all listeners and timer
    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.clearInterval(intervalId);
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      setUser,
      logout: async (options) => {
        await performLogout(options);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
