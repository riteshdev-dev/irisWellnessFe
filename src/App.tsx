import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { ToastContainer } from "./components/Toast.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.tsx";
import { CertificatesAdminPage, EnrollmentsAdminPage, ReportsPage, UserDetailPage, UsersAdminPage } from "./pages/AdminRecordsPage.tsx";
import { AssessmentEditorPage, AssessmentsAdminPage } from "./pages/AssessmentsAdminPage.tsx";
import { AssessmentsPage } from "./pages/AssessmentsPage.tsx";
import { CertificatesPage, VerifyCertificatePage } from "./pages/CertificatesPage.tsx";
import { CourseEditorPage, CurriculumPage } from "./pages/CourseEditorPage.tsx";
import { CoursePlayerPage } from "./pages/CoursePlayerPage.tsx";
import { CoursesPage } from "./pages/CoursesPage.tsx";
import { ExamPage } from "./pages/ExamPage.tsx";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.tsx";
import { LearningPage } from "./pages/LearningPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { ProfilePage } from "./pages/ProfilePage.tsx";
import { SignupPage } from "./pages/SignupPage.tsx";
import { UserDashboardPage } from "./pages/UserDashboardPage.tsx";
import { VerifyOtpPage } from "./pages/VerifyOtpPage.tsx";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/certificates/verify/:code" element={<VerifyCertificatePage />} />
          <Route element={<ProtectedRoute role="USER"><AppShell /></ProtectedRoute>}>
            <Route path="/dashboard" element={<UserDashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/learning/:courseId" element={<CoursePlayerPage />} />
            <Route path="/assessments" element={<AssessmentsPage />} />
            <Route path="/assessments/:assessmentId" element={<ExamPage />} />
            <Route path="/certificates" element={<CertificatesPage />} />
          </Route>
          <Route element={<ProtectedRoute role="ADMIN"><AppShell /></ProtectedRoute>}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/courses" element={<CoursesPage />} />
            <Route path="/admin/courses/:courseId" element={<CourseEditorPage />} />
            <Route path="/admin/curriculum" element={<CurriculumPage />} />
            <Route path="/admin/assessments" element={<AssessmentsAdminPage />} />
            <Route path="/admin/assessments/:assessmentId" element={<AssessmentEditorPage />} />
            <Route path="/admin/users" element={<UsersAdminPage />} />
            <Route path="/admin/users/:userId" element={<UserDetailPage />} />
            <Route path="/admin/enrollments" element={<EnrollmentsAdminPage />} />
            <Route path="/admin/certificates" element={<CertificatesAdminPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
