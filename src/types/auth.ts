export type UserRole = "ADMIN" | "USER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  nationality: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  phoneCountryIso2: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  courseIds: string[] | null;
  dateOfBirth: string | null;
  professionalDetails: string | null;
  profilePhoto: string | null;
  isActive: boolean;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OtpChallenge {
  challengeToken: string;
  maskedDestination: string;
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
}

export interface PendingOtp {
  flow: "login" | "reset_password";
  challengeToken: string;
  email: string;
  maskedDestination: string;
  resendAvailableAt: number;
  expiresInSeconds: number;
  message: string;
}

export interface ApiErrorDetails {
  fields?: Record<string, string>;
  retryAfterSeconds?: number;
  attemptsRemaining?: number;
}
