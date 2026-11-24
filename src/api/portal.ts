import { request, requestBlob, uploadForm } from "./client.ts";

export interface AssignedCourse {
  id: string;
  title: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Course {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  thumbnail: string | null;
  durationMinutes: number;
  level: string;
  priceCents: number | null;
  learningObjectives: string;
  prerequisites: string;
  status: "draft" | "published" | "archived";
  updatedAt: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  kind: "video" | "pdf" | "text";
  text_content: string;
  media_file: string | null;
  duration_minutes: number;
  sort_order: number;
  is_required: boolean;
  completed?: boolean;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  sort_order: number;
}

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const portalApi = {
  dashboard: () => request<Record<string, unknown>>("/api/me/dashboard"),
  catalog: (q?: string) => request<Page<Course>>(`/api/me/catalog${query({ q })}`),
  enroll: (courseId: string) => request("/api/me/enrollments", { method: "POST", body: JSON.stringify({ courseId }) }),
  learning: (status?: string, q?: string) => request<{ items: Array<Record<string, unknown>> }>(`/api/me/learning${query({ status, q })}`),
  course: (courseId: string) => request<Record<string, unknown>>(`/api/me/learning/${courseId}`),
  completeLesson: (lessonId: string) => request<Record<string, unknown>>(`/api/me/lessons/${lessonId}/complete`, { method: "POST" }),
  assessments: () => request<{ items: Array<Record<string, unknown>> }>("/api/me/assessments"),
  results: (assessmentId: string) => request<{ items: Array<Record<string, unknown>> }>(`/api/me/assessments/${assessmentId}/results`),
  startAttempt: (assessmentId: string) => request<Record<string, unknown>>(`/api/me/assessments/${assessmentId}/start`, { method: "POST" }),
  attempt: (attemptId: string) => request<Record<string, unknown>>(`/api/me/attempts/${attemptId}`),
  submitAttempt: (attemptId: string, answers: Array<{ questionId: string; optionId: string }>) =>
    request<Record<string, unknown>>(`/api/me/attempts/${attemptId}/submit`, { method: "POST", body: JSON.stringify({ answers }) }),
  certificates: () => request<{ items: Array<Record<string, unknown>> }>("/api/me/certificates"),
  verify: (code: string) => request<Record<string, unknown>>(`/api/certificates/verify/${encodeURIComponent(code)}`),
  pdf: (id: string, admin = false) => requestBlob(`${admin ? "/api/admin" : "/api/me"}/certificates/${id}/pdf`),
  photo: (file: File) => {
    const body = new FormData();
    body.set("photo", file);
    return uploadForm<{ user: import("../types/auth.ts").AuthUser }>("/api/me/profile/photo", body);
  },
  adminDashboard: () => request<Record<string, unknown>>("/api/admin/dashboard"),
  categories: () => request<{ items: Array<{ id: string; name: string; description: string }> }>("/api/admin/categories"),
  saveCategory: (input: { id?: string; name: string; description: string }) =>
    request(input.id ? `/api/admin/categories/${input.id}` : "/api/admin/categories", {
      method: input.id ? "PATCH" : "POST",
      body: JSON.stringify(input),
    }),
  deleteCategory: (id: string) => request(`/api/admin/categories/${id}`, { method: "DELETE" }),
  courses: (params: Record<string, string | number | undefined>) => request<Page<Course>>(`/api/admin/courses${query(params)}`),
  courseAdmin: (id: string) => request<{ course: Course; modules: Module[]; lessons: Lesson[] }>(`/api/admin/courses/${id}`),
  
saveCourse: async (id: string | undefined, input: Record<string, unknown>) => {
  try {
    const response = await request<{ course: Course }>(
      id ? `/api/admin/courses/${id}` : `/api/admin/courses`,
      {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(input),
      }
    );

    console.log("API Success Response:", response);
    return response;

  } catch (error) {
    console.error("Course Save Failed:", error);
    throw error;
  }
},

  thumbnail: (id: string, file: File) => {
    const body = new FormData();
    body.set("thumbnail", file);
    return uploadForm<{ course: Course }>(`/api/admin/courses/${id}/thumbnail`, body);
  },
  deleteCourse: (id: string) => request(`/api/admin/courses/${id}`, { method: "DELETE" }),
  saveModule: (courseId: string, input: { id?: string; title: string; description: string }) =>
    request(input.id ? `/api/admin/modules/${input.id}` : `/api/admin/courses/${courseId}/modules`, {
      method: input.id ? "PATCH" : "POST",
      body: JSON.stringify(input),
    }),
  deleteModule: (id: string) => request(`/api/admin/modules/${id}`, { method: "DELETE" }),
  orderModules: (courseId: string, ids: string[]) =>
    request(`/api/admin/courses/${courseId}/modules/order`, { method: "POST", body: JSON.stringify({ ids }) }),
  saveLesson: (moduleId: string, input: FormData, lessonId?: string) =>
    uploadForm(
      lessonId ? `/api/admin/lessons/${lessonId}` : `/api/admin/modules/${moduleId}/lessons`,
      input,
      lessonId ? "PATCH" : "POST",
    ),
  deleteLesson: (id: string) => request(`/api/admin/lessons/${id}`, { method: "DELETE" }),
  orderLessons: (moduleId: string, ids: string[]) =>
    request(`/api/admin/modules/${moduleId}/lessons/order`, { method: "POST", body: JSON.stringify({ ids }) }),
  adminAssessments: (q?: string) => request<{ items: Array<Record<string, unknown>> }>(`/api/admin/assessments${query({ q })}`),
  assessment: (id: string) => request<Record<string, unknown>>(`/api/admin/assessments/${id}`),
  saveAssessment: (id: string | undefined, input: Record<string, unknown>) =>
    request<{ id: string }>(id ? `/api/admin/assessments/${id}` : "/api/admin/assessments", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(input),
    }),
  deleteAssessment: (id: string) => request(`/api/admin/assessments/${id}`, { method: "DELETE" }),
  saveQuestion: (assessmentId: string, input: Record<string, unknown>, questionId?: string) =>
    request(questionId ? `/api/admin/questions/${questionId}` : `/api/admin/assessments/${assessmentId}/questions`, {
      method: questionId ? "PATCH" : "POST",
      body: JSON.stringify(input),
    }),
  deleteQuestion: (id: string) => request(`/api/admin/questions/${id}`, { method: "DELETE" }),
  attemptResults: (params: Record<string, string | number | undefined>) =>
    request<Page<Record<string, unknown>>>(`/api/admin/results${query(params)}`),
  users: (params: Record<string, string | number | undefined>) =>
    request<Page<Record<string, unknown>>>(`/api/admin/users${query(params)}`),
  user: (id: string) => request<Record<string, unknown>>(`/api/admin/users/${id}`),
  userCourses: (userId: string) =>
    request<{ userId: string; courseIds: string[]; assignedCourses: AssignedCourse[] }>(
      `/api/admin/users/${userId}/courses`
    ),
  updateUserCourses: (userId: string, courseIds: string[]) =>
    request<{ userId: string; courseIds: string[]; assignedCourses: AssignedCourse[] }>(
      `/api/admin/users/${userId}/courses`,
      {
        method: "PATCH",
        body: JSON.stringify({ courseIds }),
      }
    ),
  userStatus: (id: string, isActive: boolean) =>
    request(`/api/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
  reassignAssessment: (userId: string, assessmentId: string) =>
    request(`/api/admin/users/${userId}/assessments/${assessmentId}/reassign`, { method: "POST" }),
  enrollments: (params: Record<string, string | number | undefined>) =>
    request<Page<Record<string, unknown>>>(`/api/admin/enrollments${query(params)}`),
  adminCertificates: (params: Record<string, string | number | undefined>) =>
    request<Page<Record<string, unknown>>>(`/api/admin/certificates${query(params)}`),
  regenerateCertificate: (id: string, input: { recipientName?: string; issuedAt?: string; reason: string }) =>
    request<{ certificate: Record<string, unknown>; audit: Record<string, unknown> }>(
      `/api/admin/certificates/${id}/regenerate`,
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    ),
  certificateHistory: (id: string) =>
    request<{ items: Array<Record<string, unknown>>; current: Record<string, unknown> }>(
      `/api/admin/certificates/${id}/history`
    ),
  reports: (from?: string, to?: string) => request<Record<string, unknown>>(`/api/admin/reports${query({ from, to })}`),
  exportReport: (from?: string, to?: string) => requestBlob(`/api/admin/reports/export${query({ from, to })}`),
};

export function money(cents: number | null): string {
  if (cents === null) return "Included";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(cents / 100);
}

export function when(value: unknown): string {
  if (!value) return "—";
  return new Date(String(value)).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
