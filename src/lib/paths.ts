import type { UserRole } from "../types/auth.ts";

export function homePath(role: UserRole): string {
  return role === "ADMIN" ? "/admin" : "/dashboard";
}
