import type { ApiErrorDetails, AuthUser, OtpChallenge } from "../types/auth.ts";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  details?: ApiErrorDetails;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details?: ApiErrorDetails;

  constructor(status: number, message: string, details?: ApiErrorDetails) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type UnauthorizedHandler = () => void;
const unauthorizedHandlers = new Set<UnauthorizedHandler>();

export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.add(handler);
  return () => {
    unauthorizedHandlers.delete(handler);
  };
}

export function notifyUnauthorized() {
  unauthorizedHandlers.forEach((handler) => {
    try {
      handler();
    } catch (e) {
      console.error("Error in unauthorized handler:", e);
    }
  });
}

function isPublicAuthPath(path: string): boolean {
  const publicPaths = [
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/register",
    "/api/auth/verify-otp",
    "/api/auth/resend-otp",
    "/api/auth/send-otp",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/auth/logout",
    "/api/certificates/verify",
  ];
  return publicPaths.some((p) => path.startsWith(p));
}

export async function request<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  let response: Response;

  try {
    const url = `${API_URL.replace(/\/$/, "")}${path}`;

    response = await fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      "Unable to reach the server. Check that the API is running."
    );
  }

  let payload: ApiResponse<T>;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    if (response.status === 401 && !isPublicAuthPath(path)) {
      notifyUnauthorized();
    }
    throw new ApiError(
      response.status,
      "The server returned an unexpected response."
    );
  }

  if (!response.ok || !payload.success) {
    if (response.status === 401 && !isPublicAuthPath(path)) {
      notifyUnauthorized();
    }

    console.error("API Error:", {
      status: response.status,
      message: payload.message,
      details: payload.details,
    });

    throw new ApiError(
      response.status,
      payload.message || "Request failed.",
      payload.details
    );
  }

  return payload;
}

export function signup(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  nationality: string;
  country?: string;
  phoneCountryIso2: string;
  phoneNumber: string;
}) {
  return request<undefined>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: { email: string; password?: string } | string, password?: string) {
  const body = typeof input === "string" ? { email: input, password: password ?? "" } : input;
  return request<OtpChallenge>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function sendOtp(challengeToken: string) {
  return request<OtpChallenge>("/api/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ challengeToken }),
  });
}

export function verifyOtp(challengeToken: string, otp: string) {
  return request<{ user: AuthUser }>("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ challengeToken, otp }),
  });
}

export function forgotPassword(email: string) {
  return request<OtpChallenge>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(input: {
  challengeToken: string;
  otp: string;
  password: string;
  confirmPassword: string;
}) {
  return request<undefined>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProfile(input: {
  name: string;
  phoneCountryIso2: string;
  phoneNumber: string;
  country: string;
  city: string;
  state: string;
  dateOfBirth: string;
  professionalDetails: string;
  courseIds: string[];
}) {
  return request<{ user: AuthUser }>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function currentUser() {
  return request<{ user: AuthUser }>("/api/auth/me");
}

export function logout() {
  return request<undefined>("/api/auth/logout", { method: "POST" });
}

export function apiStatus() {
  return request<undefined>("/");
}

export async function requestBlob(path: string): Promise<Blob> {
  const response = await fetch(`${API_URL}${path}`, { credentials: "include" });
  if (!response.ok) {
    if (response.status === 401 && !isPublicAuthPath(path)) {
      notifyUnauthorized();
    }
    throw new ApiError(response.status, "The file could not be downloaded.");
  }
  return response.blob();
}

export async function uploadForm<T>(
  path: string,
  body: FormData,
  method: "POST" | "PATCH" = "POST",
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    body,
    credentials: "include",
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    if (response.status === 401 && !isPublicAuthPath(path)) {
      notifyUnauthorized();
    }
    throw new ApiError(response.status, payload.message || "Upload failed.", payload.details);
  }
  return payload;
}
