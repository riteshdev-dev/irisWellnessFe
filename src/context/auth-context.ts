import { createContext } from "react";
import type { AuthUser } from "../types/auth.ts";

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: (options?: { sessionExpired?: boolean }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
