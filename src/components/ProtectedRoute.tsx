import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.ts";
import { homePath } from "../lib/paths.ts";
import type { UserRole } from "../types/auth.ts";

export function ProtectedRoute({ role, children }: { role: UserRole; children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="portal-loading">Checking your session…</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={homePath(user.role)} replace />;
  }

  return children;
}
