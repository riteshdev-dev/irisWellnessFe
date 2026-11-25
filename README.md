# Iris Wellness — Frontend Client (`spaTherapistFe`)

A modern, responsive, role-based web application for **Iris Wellness**, built with **React 19**, **TypeScript**, and **Vite**. The portal provides end-to-end certification pathways for wellness therapists, comprehensive online video and PDF course learning, interactive examinations with real-time timers, automatic certificate generation, and an enterprise administration console.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Start Development Server](#4-start-development-server)
  - [5. Build for Production](#5-build-for-production)
- [Project Folder Structure](#project-folder-structure)
- [Application Modules](#application-modules)
  - [Learner (User) Experience](#learner-user-experience)
  - [Administrator Management](#administrator-management)
- [Authentication & Session Flow](#authentication--session-flow)
  - [15-Minute Inactivity Auto-Logout](#15-minute-inactivity-auto-logout)
  - [Centralized 401 Session Interception](#centralized-401-session-interception)
- [Assessment / Examination UI](#assessment--examination-ui)
- [Common Setup Issues & Troubleshooting](#common-setup-issues--troubleshooting)

---

## Overview

The `spaTherapistFe` client delivers a unified user experience for two distinct roles:
1. **Therapist Learners (`USER`)**: Browse enrolled wellness courses, stream training videos, study course PDF manuals, track lesson completion, take timed certification exams, view pass/fail results, and view/download official signed certificates with QR verification.
2. **Administrators (`ADMIN`)**: Complete management suite for courses, curriculum modules, lessons, course PDF and video media assets, question banks, assessment parameters, student enrollments, therapist profile records, certificate issuance, manual certificate regeneration with audit logs, and performance reports.

---

## Key Features

- **Role-Based Protected Routes**: Strict client-side route guards separating unauthenticated visitors, enrolled therapists, and platform administrators.
- **Interactive Course Player**: Multi-module curriculum viewer supporting integrated video streaming (`.mp4`, `.webm`) and in-browser PDF course materials.
- **Dynamic Online Examination**:
  - Live countdown timer with pulse warnings when remaining time is low (< 3 min).
  - Progress tracker showing completion percentage and answered count.
  - Question jump palette for fast navigation across questions.
  - Radio options with keyboard accessibility (`Enter`/`Space`) and clear visual selection states.
  - Submission confirmation modal detailing answered vs. unanswered questions.
  - Instant scoring with percentage breakdown, passing thresholds, retake triggers, and certificate links.
- **Certificate Verification & Downloads**: Instant view modal, client-side PDF downloads, and public QR-code-based certificate validation (`/certificates/verify/:code`).
- **Automated Inactivity Protection**: Tracks user mouse movement, keyboard, touch, and scroll events; automatically logs out and clears state after **15 minutes of inactivity**.
- **Global Toast Notification System**: Centrally managed, elegant notification toasts matching the brand color palette.
- **International Phone & Country Support**: Full international dialing code picker with country flag icons and `libphonenumber-js` validation.

---

## Technology Stack

| Category | Technology | Description |
|---|---|---|
| **Framework** | [React 19](https://react.dev/) | Component architecture & Hooks |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | End-to-end type safety |
| **Build Tool & Bundler** | [Vite 8](https://vitejs.dev/) | Lightning-fast development & optimized Rollup build |
| **Routing** | [React Router 7](https://reactrouter.com/) | Declarative browser routing & protected layout routes |
| **Phone & Country Utils** | `libphonenumber-js`, `country-flag-icons` | International phone formatting & country selection |
| **Icons & Assets** | Custom SVG sprite + inline icons | Zero external icon library overhead |
| **Styling** | Scoped & Modular CSS | Forest green and warm beige spa wellness theme |

---

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher (`v20.x` LTS recommended)
- **npm**: `v9.0.0` or higher (bundled with Node.js)
- Running instance of the **Backend API** (`spaTherapistBe`) on `http://localhost:5000`

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd spaTherapistPortal/spaTherapistFe
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root of `spaTherapistFe` by copying the example template:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` and verify the backend API URL:

```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000
```

> [!NOTE]
> If your backend is deployed on a different port or domain, update `VITE_API_URL` accordingly without a trailing slash.

### 4. Start Development Server

```bash
npm run dev
```

The Vite dev server will start instantly, typically at:
```text
  VITE v8.3.8  ready in 180 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production

To create an optimized, type-checked production bundle:

```bash
npm run build
```

This compiles TypeScript (`tsc -b`) and bundles assets into the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

---

## Project Folder Structure

```text
spaTherapistFe/
├── public/                     # Static public assets (icons, favicon)
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/                    # Centralized API service layer
│   │   ├── client.ts           # Fetch client with auth headers & 401 interception
│   │   └── portal.ts           # Typed endpoint methods (Auth, Courses, Exams, Admin)
│   ├── assets/                 # Brand images and logos
│   ├── components/             # Reusable UI components
│   │   ├── AppShell.tsx        # Main application layout with responsive sidebar
│   │   ├── AuthShell.tsx       # Auth screens layout (login, signup, verify OTP)
│   │   ├── CountryFlag.tsx     # Country flag icon renderer
│   │   ├── CountrySelect.tsx   # International country dropdown
│   │   ├── MediaImage.tsx      # Media / image helper
│   │   ├── OtpInput.tsx        # Segmented 6-digit OTP input box
│   │   ├── PhoneField.tsx      # Phone input with country code picker
│   │   ├── ProtectedRoute.tsx  # Role-based route guard (USER vs. ADMIN)
│   │   ├── Toast.tsx           # Global notification toast container & dispatcher
│   │   └── ui.tsx              # Generic UI primitives (Modal, ConfirmDialog, Notice)
│   ├── context/                # React Context providers
│   │   ├── AuthContext.tsx     # Session management & 15-min inactivity timer
│   │   ├── auth-context.ts     # Auth context types
│   │   └── useAuth.ts          # Custom auth hook
│   ├── data/
│   │   └── countries.ts        # Country definitions & dial codes
│   ├── pages/                  # Application views & pages
│   │   ├── AdminDashboardPage.tsx    # Admin KPI metrics and overview
│   │   ├── AdminRecordsPage.tsx      # Admin users, enrollments, certificates, reports
│   │   ├── AssessmentsAdminPage.tsx  # Admin exam configuration & question bank
│   │   ├── AssessmentsPage.tsx       # Learner assessment list & status
│   │   ├── CertificatesPage.tsx      # Learner certificate list & public verification
│   │   ├── CourseEditorPage.tsx      # Admin course curriculum, module & lesson editor
│   │   ├── CoursePlayerPage.tsx      # Learner course video player & PDF viewer
│   │   ├── CoursesPage.tsx           # Admin course catalog & PDF/video upload
│   │   ├── ExamPage.tsx              # Timed exam runner with question jump palette
│   │   ├── ForgotPasswordPage.tsx    # Password reset flow via OTP
│   │   ├── LearningPage.tsx          # Learner enrolled course dashboard
│   │   ├── LoginPage.tsx             # Password & OTP login
│   │   ├── ProfilePage.tsx           # Therapist profile editor
│   │   ├── SignupPage.tsx            # Therapist account registration
│   │   ├── UserDashboardPage.tsx     # Learner dashboard with progress stats
│   │   └── VerifyOtpPage.tsx         # Account activation OTP verification
│   ├── types/
│   │   └── auth.ts             # Shared frontend TypeScript interfaces
│   ├── App.css                 # Base application utility classes
│   ├── App.tsx                 # Route declarations & route guards
│   ├── index.css               # Global CSS resets & typography
│   ├── main.tsx                # React root mount
│   ├── portal.css              # Portal theme & learner components
│   └── shell.css               # Admin & AppShell dashboard styling
├── .env.example                # Template for environment variables
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite configuration
```

---

## Application Modules

### Learner (User) Experience

| Route | Page Component | Description |
|---|---|---|
| `/dashboard` | `UserDashboardPage` | Overview of enrolled courses, certificates earned, and upcoming exams. |
| `/profile` | `ProfilePage` | Personal details, nationality, contact number, and professional history. |
| `/learning` | `LearningPage` | Enrolled courses catalog with progress indicators. |
| `/learning/:courseId` | `CoursePlayerPage` | Multi-lesson curriculum player streaming MP4/WebM videos and course PDF guides. |
| `/assessments` | `AssessmentsPage` | Available assessments, time limits, best scores, and retake eligibility. |
| `/assessments/:assessmentId` | `ExamPage` | Full-screen timed examination environment with question jump palette. |
| `/certificates` | `CertificatesPage` | Earned certificates with view modal and PDF download. |
| `/certificates/verify/:code` | `VerifyCertificatePage` | Public verification screen validating certificate legitimacy via QR code. |

### Administrator Management

| Route | Page Component | Description |
|---|---|---|
| `/admin` | `AdminDashboardPage` | Platform metrics (total users, active courses, exams taken, pass rates). |
| `/admin/courses` | `CoursesPage` | Course creation, PDF manual upload (`public/course`), and video asset uploads (`public/video`). |
| `/admin/courses/:courseId` | `CourseEditorPage` | Course metadata and category editor. |
| `/admin/curriculum` | `CurriculumPage` | Module ordering, lesson sequencing, video/PDF attachment. |
| `/admin/assessments` | `AssessmentsAdminPage` | Exam configuration (duration, passing percentage, maximum attempts). |
| `/admin/assessments/:id` | `AssessmentEditorPage` | Question bank builder (multiple-choice questions, mark weighting, correct answer selector). |
| `/admin/users` | `UsersAdminPage` | Therapist accounts, account activation/deactivation, profile inspect. |
| `/admin/enrollments` | `EnrollmentsAdminPage` | Student course enrollments, manual course assignment, and progress tracking. |
| `/admin/certificates` | `CertificatesAdminPage` | Certificate log, modal preview, download, and **Manual Regeneration** with audit history. |
| `/admin/reports` | `ReportsPage` | System analytics and student completion reports. |

---

## Authentication & Session Flow

1. **Sign Up**: The user registers with Name, Email, Mobile Number, Nationality, and Password. An OTP is dispatched.
2. **OTP Verification**: The user inputs the 6-digit OTP to verify their mobile/email and activate the account.
3. **Sign In**: Supports dual authentication (Password login or one-click OTP login).
4. **Token Storage**: On successful authentication, a JWT is securely stored in `localStorage` under `token`, and user profile data is cached under `user`.

### 15-Minute Inactivity Auto-Logout

To maintain strict healthcare/wellness compliance and security, the application includes an automated inactivity tracker in `src/context/AuthContext.tsx`:
- **Activity Listeners**: Monitors `mousemove`, `mousedown`, `keydown`, `touchstart`, and `scroll`.
- **Inactivity Threshold**: If no activity is detected for **15 consecutive minutes**, the session timer expires.
- **Automated Teardown**:
  - Automatically notifies the backend via the logout API.
  - Clears `localStorage` (`token` and `user`).
  - Resets React `user` state to `null`.
  - Dispatches an informative warning toast: *"You have been logged out due to 15 minutes of inactivity."*
  - Immediately redirects the user to the Login page (`/`).

### Centralized 401 Session Interception

In `src/api/client.ts`, every outgoing request is intercepted:
- If the backend returns `HTTP 401 Unauthorized` (e.g., token expired or invalidated server-side), the client cleans session storage and triggers a clean redirect to `/` without infinite loops.

---

## Assessment / Examination UI

The examination interface (`ExamPage.tsx`) is designed for maximum clarity and stress-free user experience during timed certifications:

```text
┌────────────────────────────────────────────────────────────────────────┐
│  EXAMINATION · ONLINE CERTIFICATION                                   │
│  Swedish Massage Therapy Assessment                ⏱️ TIME REMAINING  │
│                                                       57:42           │
├────────────────────────────────────────────────────────────────────────┤
│  Question 1 of 4                    1 of 4 answered (25%)              │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├────────────────────────────────────────────────────────────────────────┤
│  [ QUESTION 01 ]                                             [ 1 MARK ]│
│                                                                        │
│  What is the primary purpose of Effleurage in a Swedish session?       │
│                                                                        │
│  (A) To warm up muscle tissue, increase superficial circulation...  ✓  │
│  (B) To forcefully break down deep joint adhesions                     │
│  (C) To stimulate sharp pain reflexes in the peripheral nervous system │
│  (D) To immobilize skeletal joints without touch                       │
├────────────────────────────────────────────────────────────────────────┤
│  QUESTION JUMP:   [ 1 (Active) ]  [ 2 ]  [ 3 ]  [ 4 ]                  │
│                                                                        │
│  [ ← Previous Question ]           [ Next Question → ] [ Submit Exam ✓]│
└────────────────────────────────────────────────────────────────────────┘
```

- **A/B/C/D Option Badges**: Distinct badges with immediate color feedback on selection.
- **Direct Jump Palette**: Jump to any question with color-coded chips indicating answered vs. pending questions.
- **Submit Modal**: Confirmation modal verifying all questions are answered before final submission.
- **Instant Retake**: If a learner scores below the passing mark, an instant "Retake Assessment" option is provisioned.

---

## Common Setup Issues & Troubleshooting

### 1. `VITE_API_URL` Connection Refused (`ERR_CONNECTION_REFUSED`)
- **Cause**: Backend server is not running or running on a different port.
- **Fix**: Confirm the backend is running (`cd ../spaTherapistBe && npm run dev`) on port `5000`. Ensure `.env` contains:
  ```env
  VITE_API_URL=http://localhost:5000
  ```

### 2. TypeScript Cached In-Memory Import Errors in IDE
- **Symptom**: VS Code shows `Module has no exported member...` even though the file exports it.
- **Fix**: Press `Ctrl + Shift + P` (or `Cmd + Shift + P`), type **TypeScript: Restart TS Server**, and press Enter.

### 3. Blank White Screen on Route Navigation
- **Cause**: Browser localStorage contains corrupted or stale authentication JSON.
- **Fix**: Open DevTools (`F12`) -> Application -> Local Storage -> Clear all items and refresh (`F5`).

---

## License

Confidential and proprietary. Developed for Iris Wellness.
