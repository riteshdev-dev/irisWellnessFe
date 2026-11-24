import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../api/client.ts";
import { portalApi, when } from "../api/portal.ts";
import { ConfirmDialog, EmptyState, Notice, Pager } from "../components/ui.tsx";
import { toast } from "../components/Toast.tsx";
import type { AuthUser } from "../types/auth.ts";

const readableError = (caught: unknown, fallback: string) =>
  caught instanceof ApiError ? caught.message : caught instanceof Error ? caught.message : fallback;

const userManagementStyles = `
.um-v3, .um-v3 * { box-sizing: border-box; }
.um-v3 { width: 100%; max-width: none; min-width: 0; padding: 26px 28px 52px; color: #172e2b; font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 14px; line-height: 1.5; }
.um-v3 h1,.um-v3 h2,.um-v3 h3,.um-v3 p { font-family: inherit; margin: 0; letter-spacing: normal; }
.um-v3 button,.um-v3 input,.um-v3 select { font: inherit; }
.um-v3 button { cursor: pointer; }
.um-v3 .um-top { display:flex; justify-content:space-between; align-items:center; gap:18px; margin-bottom:24px; }
.um-v3 .um-eyebrow { color:#548078; font-size:11px; font-weight:750; letter-spacing:.11em; text-transform:uppercase; margin-bottom:7px; }
.um-v3 .um-title { font-size:29px; font-weight:760; letter-spacing:-.045em; line-height:1.2; color:#142e29; }
.um-v3 .um-subtitle { margin-top:7px; color:#788782; font-size:13px; }
.um-v3 .um-count { background:#e8f2ec; border:1px solid #d7e8dd; border-radius:100px; color:#1e624c; font-size:12px; font-weight:700; padding:9px 14px; white-space:nowrap; }
.um-v3 .um-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:20px; }
.um-v3 .um-metric { background:#fff; border:1px solid #e6eae7; border-radius:14px; padding:18px 20px; display:flex; justify-content:space-between; gap:12px; align-items:center; }
.um-v3 .um-metric-label { font-size:12px; color:#71827c; }
.um-v3 .um-metric-value { display:block; margin-top:6px; font-size:25px; line-height:1.1; font-weight:760; letter-spacing:-.035em; }
.um-v3 .um-metric-icon { width:38px; height:38px; border-radius:11px; display:grid; place-items:center; background:#edf5ef; color:#25664d; font-size:19px; }
.um-v3 .um-panel { background:#fff; border:1px solid #e3e9e5; border-radius:16px; overflow:hidden; box-shadow:0 3px 14px rgba(25,55,44,.025); }
.um-v3 .um-panel-heading { padding:20px 22px 16px; border-bottom:1px solid #edf0ee; }
.um-v3 .um-panel-heading h2 { font-size:16px; font-weight:740; }
.um-v3 .um-panel-heading p { font-size:12px; color:#84918c; margin-top:4px; }
.um-v3 .um-filters { display:grid; grid-template-columns:minmax(220px,1fr) 175px 175px; gap:12px; padding:17px 22px; border-bottom:1px solid #edf0ee; }
.um-v3 .um-control { min-width:0; height:42px; border:1px solid #dce5df; border-radius:9px; background:#fff; color:#24433a; padding:0 13px; outline:none; }
.um-v3 .um-control:focus { border-color:#328165; box-shadow:0 0 0 3px #e5f3ec; }
.um-v3 .um-control::placeholder { color:#98a5a0; }
.um-v3 .um-scroll { width:100%; overflow-x:auto; }
.um-v3 .um-table { width:100%; border-collapse:collapse; min-width:760px; font-family:inherit; }
.um-v3 .um-table thead { background:#f8faf9; }
.um-v3 .um-table th { color:#758780; font-size:10px; letter-spacing:.075em; text-transform:uppercase; font-weight:750; text-align:left; padding:14px 19px; white-space:nowrap; }
.um-v3 .um-table td { border-top:1px solid #edf0ee; padding:15px 19px; font-size:12px; color:#415850; vertical-align:middle; }
.um-v3 .um-table tbody tr:hover { background:#fafcfb; }
.um-v3 .um-person { display:flex; align-items:center; gap:11px; min-width:145px; }
.um-v3 .um-avatar { width:36px; height:36px; flex:none; border-radius:11px; background:#e5f1e9; color:#246b50; display:grid; place-items:center; font-size:12px; font-weight:800; }
.um-v3 .um-person-name { color:#183a30; font-size:12px; font-weight:730; }
.um-v3 .um-email { color:#526961; overflow-wrap:anywhere; }
.um-v3 .um-pill { display:inline-flex; align-items:center; border-radius:100px; padding:5px 10px; font-size:11px; font-weight:720; white-space:nowrap; }
.um-v3 .um-role-admin { background:#f0ebfc; color:#7251ad; }
.um-v3 .um-role-user { background:#eff3f7; color:#526d80; }
.um-v3 .um-active { background:#e7f6ec; color:#21754c; }
.um-v3 .um-inactive { background:#fff1ed; color:#af593f; }
.um-v3 .um-dot { width:6px; height:6px; border-radius:50%; background:currentColor; margin-right:6px; }
.um-v3 .um-link { display:inline-flex; align-items:center; justify-content:center; gap:5px; text-decoration:none; color:#20664d; border:1px solid #dce9e1; border-radius:8px; padding:7px 12px; font-size:11px; font-weight:750; white-space:nowrap; background:white; }
.um-v3 .um-link:hover { background:#eef7f1; }
.um-v3 .um-pagination { border-top:1px solid #edf0ee; padding:13px 20px; }
.um-v3 .um-back { display:inline-flex; text-decoration:none; color:#356b58; font-weight:700; font-size:12px; margin-bottom:20px; }
.um-v3 .um-profile { display:flex; align-items:center; gap:17px; padding:24px; }
.um-v3 .um-avatar-lg { width:66px; height:66px; border-radius:18px; font-size:22px; }
.um-v3 .um-profile-name { font-size:23px; font-weight:760; color:#193b31; }
.um-v3 .um-profile-email { font-size:13px; color:#71827c; margin-top:3px; }
.um-v3 .um-profile-actions { margin-left:auto; }
.um-v3 .um-action { border:1px solid #d9e5de; background:#fff; color:#275e4a; padding:10px 15px; border-radius:9px; font-size:12px; font-weight:750; }
.um-v3 .um-action:hover { background:#f0f7f2; }
.um-v3 .um-action-danger { color:#a74c3c; border-color:#f0d6cf; }
.um-v3 .um-details { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-top:16px; }
.um-v3 .um-info { padding:20px 22px; }
.um-v3 .um-info h2 { font-size:15px; font-weight:750; margin-bottom:15px; }
.um-v3 .um-field { padding:10px 0; border-bottom:1px solid #eff2f0; }
.um-v3 .um-field:last-child { border-bottom:0; }
.um-v3 .um-field-label { display:block; font-size:11px; color:#85948d; margin-bottom:4px; }
.um-v3 .um-field-value { display:block; color:#29473d; font-size:13px; overflow-wrap:anywhere; }
.um-v3 .um-section { margin-top:18px; }
.um-v3 .um-section-head { padding:19px 22px; border-bottom:1px solid #edf0ee; display:flex; justify-content:space-between; align-items:center; }
.um-v3 .um-section-head h2 { font-size:15px; font-weight:750; }
.um-v3 .um-section-count { color:#7e9187; font-size:12px; }
.um-v3 .um-empty { padding:20px; }
.um-v3 .um-section .data-table { width:100%; min-width:570px; border-collapse:collapse; font-family:inherit; }
.um-v3 .um-section .data-table th { padding:14px 20px; text-align:left; background:#f8faf9; color:#73877e; font-size:11px; font-weight:750; }
.um-v3 .um-section .data-table td { padding:14px 20px; border-top:1px solid #edf0ee; font-size:12px; }
.um-v3 .um-modal-overlay { position: fixed; inset: 0; background: rgba(18, 38, 30, 0.45); backdrop-filter: blur(2px); display: grid; place-items: center; z-index: 1000; padding: 16px; overflow-y: auto; overscroll-behavior: contain; }
.um-v3 .um-modal-card { background: #ffffff; border-radius: 16px; width: 100%; max-width: 520px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 12px 36px rgba(18, 50, 38, 0.18); border: 1px solid #dce5df; overflow: hidden; overscroll-behavior: contain; animation: umModalIn .18s ease-out; }
@keyframes umModalIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.um-v3 .um-modal-head { padding: 20px 22px 16px; border-bottom: 1px solid #edf0ee; display: flex; justify-content: space-between; align-items: flex-start; }
.um-v3 .um-modal-head h3 { font-size: 17px; font-weight: 760; color: #16372c; margin: 0; }
.um-v3 .um-modal-head p { font-size: 12px; color: #72847c; margin-top: 4px; }
.um-v3 .um-modal-close { background: none; border: none; font-size: 18px; line-height: 1; color: #8b9993; padding: 4px; cursor: pointer; border-radius: 6px; }
.um-v3 .um-modal-close:hover { color: #1a3c30; background: #f0f4f1; }
.um-v3 .um-modal-body { padding: 18px 22px; overflow-y: auto; flex: 1; min-height: 120px; max-height: 60vh; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
.um-v3 .um-modal-search { width: 100%; height: 38px; border: 1px solid #dce5df; border-radius: 8px; padding: 0 12px; font-size: 13px; margin-bottom: 14px; outline: none; }
.um-v3 .um-modal-search:focus { border-color: #2b7a58; box-shadow: 0 0 0 3px #e7f3ec; }
.um-v3 .um-course-checklist { display: flex; flex-direction: column; gap: 8px; overscroll-behavior: contain; }
.um-v3 .um-course-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border: 1px solid #e5ebe7; border-radius: 10px; background: #fafcfb; cursor: pointer; transition: background 0.15s, border-color 0.15s; user-select: none; }
.um-v3 .um-course-item:hover { background: #f0f7f3; border-color: #bcdbc8; }
.um-v3 .um-course-item.selected { background: #edf7f1; border-color: #92cca9; }
.um-v3 .um-course-item input[type="checkbox"] { width: 17px; height: 17px; accent-color: #216d4e; cursor: pointer; }
.um-v3 .um-course-item-title { font-size: 13px; font-weight: 650; color: #1c3d31; flex: 1; }
.um-v3 .um-modal-foot { padding: 14px 22px; border-top: 1px solid #edf0ee; display: flex; justify-content: space-between; align-items: center; background: #f9fbf9; }
.um-v3 .um-btn-cancel { border: 1px solid #d8e2dc; background: #fff; color: #4b6058; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; }
.um-v3 .um-btn-cancel:hover { background: #f0f4f1; }
.um-v3 .um-btn-save { border: none; background: #236c4f; color: #fff; padding: 8px 18px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; }
.um-v3 .um-btn-save:hover:not(:disabled) { background: #1c5840; }
.um-v3 .um-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
@media (max-width:1050px) { .um-v3 .um-filters { grid-template-columns:1fr 1fr; } .um-v3 .um-filters input { grid-column:1/-1; } }
@media (max-width:700px) { .um-v3 { padding:18px 14px 32px; } .um-v3 .um-title { font-size:24px; } .um-v3 .um-metrics { grid-template-columns:1fr; } .um-v3 .um-filters { grid-template-columns:1fr; padding:14px; } .um-v3 .um-filters input { grid-column:auto; } .um-v3 .um-top { align-items:flex-start; } .um-v3 .um-details { grid-template-columns:1fr; } .um-v3 .um-profile { flex-wrap:wrap; } .um-v3 .um-profile-actions { margin-left:0; width:100%; } .um-v3 .um-panel-heading { padding:17px; } }
`;

function UserManagementCSS() { return <style>{userManagementStyles}</style>; }
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "U"; }
function display(value: unknown) { return value == null || value === "" ? "—" : String(value); }

export function UsersAdminPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    portalApi.users({ q, role, active, page }).then((response) => {
      if (cancelled) return;
      setItems(response.data?.items ?? []);
      setTotal(response.data?.total ?? 0);
    }).catch((caught) => {
      if (!cancelled) setError(caught instanceof ApiError ? caught.message : "Users could not be loaded.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q, role, active, page]);

  const visibleActive = items.filter((user) => user.is_active === true).length;
  const visibleAdmins = items.filter((user) => user.role === "ADMIN").length;
  return (
    <section className="um-v3">
      <UserManagementCSS />
      <div className="um-top">
        <div><p className="um-eyebrow">Administration / People</p><h1 className="um-title">User Management</h1><p className="um-subtitle">Manage therapists, administrators and their account access.</p></div>
        <span className="um-count">{total} total users</span>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="um-metrics">
        <article className="um-metric"><div><span className="um-metric-label">Total Users</span><strong className="um-metric-value">{total}</strong></div><span className="um-metric-icon">♙</span></article>
        <article className="um-metric"><div><span className="um-metric-label">Active on This Page</span><strong className="um-metric-value">{visibleActive}</strong></div><span className="um-metric-icon">✓</span></article>
        <article className="um-metric"><div><span className="um-metric-label">Admins on This Page</span><strong className="um-metric-value">{visibleAdmins}</strong></div><span className="um-metric-icon">♢</span></article>
      </div>
      <div className="um-panel">
        <div className="um-panel-heading"><h2>All Users</h2><p>Search, filter and open individual user profiles.</p></div>
        <div className="um-filters">
          <input className="um-control" aria-label="Search users" value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} placeholder="Search by name, email or phone..." />
          <select className="um-control" aria-label="Filter by role" value={role} onChange={(event) => { setPage(1); setRole(event.target.value); }}><option value="">All roles</option><option value="USER">Therapists</option><option value="ADMIN">Administrators</option></select>
          <select className="um-control" aria-label="Filter by status" value={active} onChange={(event) => { setPage(1); setActive(event.target.value); }}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select>
        </div>
        {loading ? <div className="um-empty">Loading users...</div> : items.length === 0 ? <div className="um-empty"><EmptyState title="No users found" text="Try a different search or filter." /></div> : (
          <div className="um-scroll"><table className="um-table"><thead><tr><th>User</th><th>Email Address</th><th>Phone</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>
            {items.map((user) => <tr key={String(user.id)}>
              <td><div className="um-person"><span className="um-avatar">{initials(display(user.name))}</span><span className="um-person-name">{display(user.name)}</span></div></td>
              <td className="um-email">{display(user.email)}</td><td>{display(user.phone)}</td>
              <td><span className={`um-pill ${user.role === "ADMIN" ? "um-role-admin" : "um-role-user"}`}>{user.role === "ADMIN" ? "Admin" : "Therapist"}</span></td>
              <td><span className={`um-pill ${user.is_active ? "um-active" : "um-inactive"}`}><span className="um-dot" />{user.is_active ? "Active" : "Inactive"}</span></td>
              <td><Link className="um-link" to={`/admin/users/${user.id}`}>View Profile →</Link></td>
            </tr>)}
          </tbody></table></div>
        )}
        <div className="um-pagination"><Pager page={page} total={total} pageSize={8} onPage={setPage} /></div>
      </div>
    </section>
  );
}

export function UserDetailPage() {
  const { userId = "" } = useParams();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<{ assessmentId: string; assessmentTitle: string } | null>(null);
  const [reassigning, setReassigning] = useState(false);

  const [isEditingCourses, setIsEditingCourses] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [savingCourses, setSavingCourses] = useState(false);
  const [courseModalError, setCourseModalError] = useState("");
  const [courseModalSuccess, setCourseModalSuccess] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const modalBodyRef = useRef<HTMLDivElement>(null);

  function load() {
    portalApi.user(userId).then((response) => setData(response.data ?? null)).catch((caught) => {
      setError(caught instanceof ApiError ? caught.message : "User not found.");
    });
  }
  useEffect(() => { load(); }, [userId]);

  // Prevent background scrolling while modal is open WITHOUT touching html/body overflow (which breaks sticky sidebar)
  useEffect(() => {
    if (!isEditingCourses) return;

    const handleWheel = (e: WheelEvent) => {
      const modalBody = modalBodyRef.current;
      if (modalBody && modalBody.contains(e.target as Node)) {
        const { scrollTop, scrollHeight, clientHeight } = modalBody;
        const isScrollable = scrollHeight > clientHeight;

        if (isScrollable) {
          const delta = e.deltaY;
          const atTop = delta < 0 && scrollTop <= 0;
          const atBottom = delta > 0 && scrollTop + clientHeight >= scrollHeight - 1;

          if (!atTop && !atBottom) {
            return; // Allow scrolling inside the modal body
          }
        }
      }

      // Block background scrolling from anywhere else or when hitting boundary
      e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const modalBody = modalBodyRef.current;
      if (!modalBody || !modalBody.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancelCourses();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditingCourses]);
  if (!data) return <section className="um-v3"><UserManagementCSS />{error ? <Notice tone="error">{error}</Notice> : <div className="shell-skeleton" />}</section>;
  const user = data.user as AuthUser;
  const assignedCourses = (data.assignedCourses ?? []) as Array<{ id: string; title: string }>;
  const enrollments = (data.enrollments ?? []) as Array<Record<string, unknown>>;
  const attempts = (data.attempts ?? []) as Array<Record<string, unknown>>;
  const certificates = (data.certificates ?? []) as Array<Record<string, unknown>>;
  const phone = [user.phoneCountryCode, user.phoneNumber].filter(Boolean).join(" ") || "—";

  function handleOpenEditCourses() {
    setIsEditingCourses(true);
    setCourseModalError("");
    setCourseModalSuccess("");
    setCourseFilter("");
    const initialIds = (user.courseIds && user.courseIds.length > 0)
      ? user.courseIds
      : assignedCourses.map((c) => String(c.id));
    setSelectedCourseIds(Array.from(new Set(initialIds)));

    setLoadingCourses(true);
    portalApi.courses({ all: "true" })
      .then((res) => {
        setAvailableCourses((res.data?.items ?? []) as Array<{ id: string; title: string }>);
      })
      .catch((caught) => {
        setCourseModalError(caught instanceof ApiError ? caught.message : "Available courses could not be loaded.");
      })
      .finally(() => {
        setLoadingCourses(false);
      });
  }

  function handleToggleCourse(courseId: string) {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : Array.from(new Set([...prev, courseId]))
    );
  }

  function handleCancelCourses() {
    setIsEditingCourses(false);
    setCourseModalError("");
    setCourseModalSuccess("");
    setSelectedCourseIds([]);
  }

  async function handleSaveCourses() {
    setSavingCourses(true);
    setCourseModalError("");
    setCourseModalSuccess("");
    const uniqueIds = Array.from(new Set(selectedCourseIds));

    try {
      await portalApi.updateUserCourses(user.id, uniqueIds);
      toast.success("Assigned courses updated successfully.");
      setCourseModalSuccess("Assigned courses updated successfully.");
      load();
      setTimeout(() => {
        setIsEditingCourses(false);
        setCourseModalSuccess("");
      }, 500);
    } catch (caught) {
      const errMsg = caught instanceof ApiError ? caught.message : "Failed to update assigned courses.";
      toast.error(errMsg);
      setCourseModalError(errMsg);
    } finally {
      setSavingCourses(false);
    }
  }

  return (
    <section className="um-v3">
      <UserManagementCSS />
      <Link to="/admin/users" className="um-back">← Back to User Management</Link>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="um-top"><div><p className="um-eyebrow">Administration / User Profile</p><h1 className="um-title">User Details</h1><p className="um-subtitle">Account information, learning progress and achievements.</p></div></div>
      <div className="um-panel um-profile">
        <span className="um-avatar um-avatar-lg">{initials(user.name)}</span>
        <div><h2 className="um-profile-name">{user.name}</h2><p className="um-profile-email">{user.email}</p><div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}><span className={`um-pill ${user.role === "ADMIN" ? "um-role-admin" : "um-role-user"}`}>{user.role === "ADMIN" ? "Admin" : "Therapist"}</span><span className={`um-pill ${user.isActive ? "um-active" : "um-inactive"}`}>{user.isActive ? "Active" : "Inactive"}</span></div></div>
        <div className="um-profile-actions"><button type="button" className={`um-action ${user.isActive ? "um-action-danger" : ""}`} onClick={() => setConfirm(true)} disabled={updating}>{user.isActive ? "Deactivate Account" : "Activate Account"}</button></div>
      </div>
      <div className="um-details">
        <div className="um-panel um-info"><h2>Personal Information</h2><div className="um-field"><span className="um-field-label">Full Name</span><span className="um-field-value">{display(user.name)}</span></div><div className="um-field"><span className="um-field-label">Email Address</span><span className="um-field-value">{display(user.email)}</span></div><div className="um-field"><span className="um-field-label">Phone Number</span><span className="um-field-value">{phone}</span></div><div className="um-field"><span className="um-field-label">Location</span><span className="um-field-value">{[user.city,user.country].filter(Boolean).join(", ") || "—"}</span></div></div>
        <div className="um-panel um-info"><h2>Learning Overview</h2><div className="um-field"><span className="um-field-label">Enrolled Courses</span><span className="um-field-value">{enrollments.length}</span></div><div className="um-field"><span className="um-field-label">Assessment Attempts</span><span className="um-field-value">{attempts.length}</span></div><div className="um-field"><span className="um-field-label">Certificates</span><span className="um-field-value">{certificates.length}</span></div><div className="um-field"><span className="um-field-label">Professional Details</span><span className="um-field-value">{user.professionalDetails || "No professional details yet."}</span></div></div>
      </div>
      <div className="um-panel um-section">
        <div className="um-section-head">
          <div>
            <h2>Assigned Courses</h2>
            <span className="um-section-count">
              {assignedCourses.length} {assignedCourses.length === 1 ? "course" : "courses"} assigned
            </span>
          </div>
          <button
            type="button"
            className="um-action"
            onClick={handleOpenEditCourses}
          >
            Edit Courses
          </button>
        </div>
        {assignedCourses.length === 0 ? (
          <div className="um-empty">
            <EmptyState
              title="No courses assigned"
              text="No courses are currently assigned to this user. Click 'Edit Courses' to assign courses."
            />
          </div>
        ) : (
          <div className="um-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                </tr>
              </thead>
              <tbody>
                {assignedCourses.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "7px",
                          background: "#e8f2ec",
                          color: "#21644d",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "13px",
                          flexShrink: 0
                        }}>
                          📖
                        </span>
                        <strong style={{ color: "#163a2f", fontSize: "13px" }}>{c.title}</strong>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="um-panel um-section"><div className="um-section-head"><h2>Enrolled Courses</h2><span className="um-section-count">{enrollments.length} records</span></div><div className="um-scroll"><SimpleTable rows={enrollments} columns={[["course_title", "Course"], ["status", "Status"], ["progress_percent", "Progress"]]} /></div></div>
      <div className="um-panel um-section">
        <div className="um-section-head">
          <div>
            <h2>Assessment Results</h2>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#748680" }}>
              Exam attempts, scores, and re-creation for failed assessments.
            </p>
          </div>
          <span className="um-section-count">{attempts.length} records</span>
        </div>
        {attempts.length === 0 ? (
          <div style={{ padding: "26px", color: "#6a7d75", textAlign: "center", fontSize: "13px" }}>
            No assessment attempts found for this therapist.
          </div>
        ) : (
          <div className="um-scroll">
            <table className="um-table" style={{ minWidth: "620px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 18px" }}>Assessment</th>
                  <th style={{ padding: "12px 18px" }}>Score</th>
                  <th style={{ padding: "12px 18px" }}>Result</th>
                  <th style={{ padding: "12px 18px" }}>Submitted</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((att: any, idx: number) => {
                  const isPassed = Boolean(att.passed);
                  return (
                    <tr key={att.attempt_id || att.id || idx}>
                      <td style={{ padding: "13px 18px" }}>
                        <strong style={{ color: "#14372e" }}>{att.assessment_title || "Assessment"}</strong>
                      </td>
                      <td style={{ padding: "13px 18px", fontWeight: 700 }}>
                        {att.percentage != null ? `${att.percentage}%` : "—"}
                      </td>
                      <td style={{ padding: "13px 18px" }}>
                        <span className={`um-pill ${isPassed ? "um-active" : "um-inactive"}`}>
                          <span className="um-dot" />
                          {isPassed ? "Passed" : "Failed"}
                        </span>
                      </td>
                      <td style={{ padding: "13px 18px", color: "#62776f" }}>
                        {att.submitted_at ? new Date(att.submitted_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td style={{ padding: "13px 18px", textAlign: "right" }}>
                        {!isPassed && att.assessment_id ? (
                          <button
                            type="button"
                            className="um-action"
                            style={{
                              fontSize: "11.5px",
                              padding: "6px 12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              fontWeight: 700,
                              color: "#1e5c4a",
                              borderColor: "#b6d8c7",
                              background: "#f0f8f4",
                            }}
                            onClick={() => setReassignTarget({ assessmentId: att.assessment_id, assessmentTitle: att.assessment_title })}
                          >
                            🔄 Re-create Assessment
                          </button>
                        ) : isPassed ? (
                          <span style={{ fontSize: "11.5px", color: "#21754c", fontWeight: 650 }}>
                            Certified ✓
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="um-panel um-section"><div className="um-section-head"><h2>Certificates</h2><span className="um-section-count">{certificates.length} records</span></div><div className="um-scroll"><SimpleTable rows={certificates} columns={[["certificate_code", "Certificate"], ["course_title", "Course"], ["issued_at", "Issued"]]} /></div></div>
      {reassignTarget && (
        <ConfirmDialog
          title="Re-create Assessment"
          message={`Are you sure you want to re-create "${reassignTarget.assessmentTitle}" for ${user.name}? This will clear previous failed attempts and allow this therapist to take the assessment again.`}
          confirmLabel="Re-create Assessment"
          busy={reassigning}
          onConfirm={async () => {
            if (!reassignTarget) return;
            setReassigning(true);
            try {
              await portalApi.reassignAssessment(user.id, reassignTarget.assessmentId);
              toast.success(`Assessment "${reassignTarget.assessmentTitle}" re-created for this user.`);
              setReassignTarget(null);
              load();
            } catch (caught) {
              const errMsg = caught instanceof ApiError ? caught.message : "Could not re-create assessment.";
              toast.error(errMsg);
            } finally {
              setReassigning(false);
            }
          }}
          onClose={() => setReassignTarget(null)}
        />
      )}
      {confirm && <ConfirmDialog title={user.isActive ? "Deactivate account" : "Activate account"} message={user.isActive ? "This user will be unable to sign in while their account is inactive." : "This user will be able to sign in again."} confirmLabel="Confirm" onConfirm={async () => { setUpdating(true); setError(""); try { await portalApi.userStatus(user.id, !user.isActive); setConfirm(false); toast.success(user.isActive ? "Account deactivated." : "Account activated."); load(); } catch (caught) { const errMsg = caught instanceof ApiError ? caught.message : "Could not update account status."; setError(errMsg); toast.error(errMsg); } finally { setUpdating(false); } }} onClose={() => setConfirm(false)} />}
      {isEditingCourses && (
        <div
          className="um-modal-overlay"
          role="presentation"
          onMouseDown={handleCancelCourses}
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className="um-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Edit Assigned Courses"
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="um-modal-head">
              <div>
                <h3>Edit Assigned Courses</h3>
                <p>Manage course assignments for {user.name}. Select or deselect courses below.</p>
              </div>
              <button
                type="button"
                className="um-modal-close"
                aria-label="Close dialog"
                onClick={handleCancelCourses}
                disabled={savingCourses}
              >
                ✕
              </button>
            </div>
            <div className="um-modal-body" ref={modalBodyRef}>
              {courseModalError && <Notice tone="error">{courseModalError}</Notice>}
              {courseModalSuccess && <Notice tone="ok">{courseModalSuccess}</Notice>}

              {loadingCourses ? (
                <div style={{ padding: "32px 10px", textAlign: "center", color: "#6a7d75" }}>
                  Loading available courses…
                </div>
              ) : availableCourses.length === 0 ? (
                <div style={{ padding: "20px 0" }}>
                  <EmptyState title="No courses available" text="No courses were found in the database." />
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "center" }}>
                    <input
                      className="um-modal-search"
                      style={{ margin: 0, flex: 1 }}
                      type="text"
                      placeholder="Search courses by name…"
                      value={courseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                    />
                    <button
                      type="button"
                      className="um-btn-cancel"
                      style={{ padding: "6px 12px", fontSize: "11px", whiteSpace: "nowrap" }}
                      onClick={() => {
                        const matching = availableCourses
                          .filter((c) => c.title.toLowerCase().includes(courseFilter.toLowerCase()))
                          .map((c) => c.id);
                        const allSelected = matching.length > 0 && matching.every((id) => selectedCourseIds.includes(id));
                        if (allSelected) {
                          setSelectedCourseIds((prev) => prev.filter((id) => !matching.includes(id)));
                        } else {
                          setSelectedCourseIds((prev) => Array.from(new Set([...prev, ...matching])));
                        }
                      }}
                    >
                      {availableCourses
                        .filter((c) => c.title.toLowerCase().includes(courseFilter.toLowerCase()))
                        .every((c) => selectedCourseIds.includes(c.id))
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>
                  <div className="um-course-checklist">
                    {availableCourses
                      .filter((c) => c.title.toLowerCase().includes(courseFilter.toLowerCase()))
                      .map((c) => {
                        const isChecked = selectedCourseIds.includes(c.id);
                        return (
                          <label key={c.id} className={`um-course-item ${isChecked ? "selected" : ""}`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCourse(c.id)}
                              disabled={savingCourses}
                            />
                            <span className="um-course-item-title">{c.title}</span>
                          </label>
                        );
                      })}
                    {availableCourses.filter((c) => c.title.toLowerCase().includes(courseFilter.toLowerCase())).length === 0 && (
                      <div style={{ padding: "16px 0", textAlign: "center", color: "#82938b", fontSize: "13px" }}>
                        No courses match "{courseFilter}".
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="um-modal-foot">
              <span style={{ fontSize: "12px", color: "#62776e", fontWeight: 650 }}>
                {selectedCourseIds.length} {selectedCourseIds.length === 1 ? "course" : "courses"} selected
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="um-btn-cancel"
                  onClick={handleCancelCourses}
                  disabled={savingCourses}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="um-btn-save"
                  onClick={handleSaveCourses}
                  disabled={savingCourses || loadingCourses}
                >
                  {savingCourses ? "Saving Changes…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SimpleTable({ rows, columns }: { rows: Array<Record<string, unknown>>; columns: Array<[string, string]> }) {
  if (!rows?.length) return <EmptyState title="None yet" text="There is nothing to show in this section." />;
  return (
    <table className="data-table">
      <thead><tr>{columns.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>{columns.map(([key]) => <td key={key}>{key.endsWith("_at") ? when(row[key]) : String(row[key] ?? "—")}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

const enrollmentStyles = `
.enr-v4, .enr-v4 * { box-sizing: border-box; }
.enr-v4 { width:100%; max-width:none; min-width:0; padding:26px 28px 52px; font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; color:#19362e; font-size:14px; line-height:1.5; }
.enr-v4 h1,.enr-v4 h2,.enr-v4 h3,.enr-v4 p { font-family:inherit; margin:0; letter-spacing:normal; }
.enr-v4 button,.enr-v4 input,.enr-v4 select { font-family:inherit; font-size:13px; line-height:1.35; }
.enr-v4 button { cursor:pointer; }
.enr-v4 .enr-top { display:flex; justify-content:space-between; align-items:center; gap:18px; margin-bottom:23px; }
.enr-v4 .enr-eyebrow { font-size:11px; font-weight:750; letter-spacing:.10em; text-transform:uppercase; color:#588176; margin-bottom:7px; }
.enr-v4 .enr-title { font-size:30px; line-height:1.16; letter-spacing:-.045em; font-weight:780; color:#16372c; }
.enr-v4 .enr-subtitle { color:#71827a; margin-top:8px; font-size:13px; }
.enr-v4 .enr-refresh { display:inline-flex; align-items:center; justify-content:center; gap:9px; height:40px; padding:0 15px; border:1px solid #dbe5de; border-radius:10px; background:#fff; color:#245c47; font-weight:700; white-space:nowrap; }
.enr-v4 .enr-refresh:hover { background:#f0f7f2; }
.enr-v4 .enr-refresh:disabled { opacity:.6; cursor:wait; }
.enr-v4 .enr-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:20px; }
.enr-v4 .enr-metric { background:#fff; border:1px solid #e1e9e3; border-radius:14px; padding:18px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px; min-width:0; }
.enr-v4 .enr-metric-label { color:#73857c; font-size:12px; }
.enr-v4 .enr-metric-number { display:block; margin-top:6px; font-size:27px; line-height:1.12; font-weight:780; letter-spacing:-.035em; color:#16392e; }
.enr-v4 .enr-metric-note { display:block; font-size:11px; color:#91a098; margin-top:5px; }
.enr-v4 .enr-metric-icon { width:42px; height:42px; flex:none; display:grid; place-items:center; border-radius:12px; background:#ecf5ee; color:#2c7655; }
.enr-v4 .enr-metric-icon svg { width:20px; height:20px; stroke:currentColor; fill:none; stroke-width:1.9; stroke-linecap:round; stroke-linejoin:round; }
.enr-v4 .enr-panel { background:#fff; border:1px solid #e1e8e2; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(18,59,43,.025); }
.enr-v4 .enr-panel-head { padding:21px 22px 17px; display:flex; justify-content:space-between; gap:12px; align-items:center; border-bottom:1px solid #edf0ed; }
.enr-v4 .enr-panel-head h2 { font-size:16px; line-height:1.3; font-weight:760; color:#1a392e; }
.enr-v4 .enr-panel-head p { margin-top:5px; color:#819188; font-size:12px; }
.enr-v4 .enr-result-count { font-size:12px; color:#647f70; background:#eff6f0; border-radius:20px; padding:7px 11px; white-space:nowrap; font-weight:700; }
.enr-v4 .enr-filters { display:grid; grid-template-columns:minmax(220px,1fr) 220px auto; gap:12px; align-items:center; padding:17px 22px; border-bottom:1px solid #edf0ed; }
.enr-v4 .enr-search-wrap { position:relative; min-width:0; }
.enr-v4 .enr-search-icon { position:absolute; top:50%; left:14px; transform:translateY(-50%); color:#869a8e; display:flex; pointer-events:none; }
.enr-v4 .enr-search-icon svg { width:17px; height:17px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; }
.enr-v4 .enr-input,.enr-v4 .enr-select { width:100%; height:43px; border:1px solid #dce6df; border-radius:10px; background:#fff; outline:none; color:#28483b; padding:0 13px; min-width:0; }
.enr-v4 .enr-input { padding-left:42px; }
.enr-v4 .enr-input::placeholder { color:#97a59d; }
.enr-v4 .enr-input:focus,.enr-v4 .enr-select:focus { border-color:#478a6d; box-shadow:0 0 0 3px #eaf4ed; }
.enr-v4 .enr-clear { height:42px; border:0; background:#f1f5f2; color:#4d7160; padding:0 14px; border-radius:9px; font-weight:700; white-space:nowrap; }
.enr-v4 .enr-clear:hover { background:#e7efe8; }
.enr-v4 .enr-table-wrap { width:100%; overflow-x:auto; }
.enr-v4 .enr-table { width:100%; min-width:800px; border-collapse:collapse; table-layout:auto; font-family:inherit; }
.enr-v4 .enr-table thead { background:#f8faf8; }
.enr-v4 .enr-table th { font-family:inherit; text-align:left; padding:14px 19px; font-size:10px; font-weight:780; text-transform:uppercase; letter-spacing:.075em; color:#72867b; white-space:nowrap; }
.enr-v4 .enr-table td { padding:17px 19px; border-top:1px solid #edf1ed; vertical-align:middle; font-size:12px; color:#3b5548; }
.enr-v4 .enr-table tbody tr:hover { background:#fafcfb; }
.enr-v4 .enr-user { display:flex; align-items:center; gap:11px; min-width:150px; }
.enr-v4 .enr-avatar { flex:none; width:37px; height:37px; display:grid; place-items:center; background:#e8f1e9; color:#276c50; font-size:12px; font-weight:800; border-radius:11px; }
.enr-v4 .enr-user-name { font-weight:730; color:#173c2e; font-size:12px; }
.enr-v4 .enr-course-name { font-weight:650; color:#254b3c; }
.enr-v4 .enr-muted { color:#7b8c81; }
.enr-v4 .enr-progress { display:flex; align-items:center; gap:11px; min-width:148px; }
.enr-v4 .enr-track { width:95px; height:7px; border-radius:100px; background:#eaf0eb; overflow:hidden; }
.enr-v4 .enr-fill { display:block; height:100%; border-radius:100px; background:#2b8a60; transition:width .25s ease; }
.enr-v4 .enr-progress-number { min-width:38px; font-weight:750; color:#245b43; font-variant-numeric:tabular-nums; }
.enr-v4 .enr-status { display:inline-flex; align-items:center; gap:7px; border-radius:100px; padding:6px 10px; font-size:11px; font-weight:740; white-space:nowrap; }
.enr-v4 .enr-status:before { content:""; width:6px; height:6px; background:currentColor; border-radius:50%; }
.enr-v4 .enr-status-completed { background:#e8f6ed; color:#25774d; }
.enr-v4 .enr-status-in_progress { background:#eaf3ff; color:#356ba9; }
.enr-v4 .enr-status-not_started { background:#f1f3f5; color:#647480; }
.enr-v4 .enr-status-other { background:#f6f2e8; color:#8d6c2e; }
.enr-v4 .enr-empty { padding:44px 22px; text-align:center; }
.enr-v4 .enr-empty-icon { width:50px; height:50px; display:grid; place-items:center; margin:0 auto 12px; border-radius:15px; background:#eff5f0; color:#347557; }
.enr-v4 .enr-empty-icon svg { width:24px; height:24px; stroke:currentColor; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.enr-v4 .enr-empty h3 { font-size:15px; font-weight:760; }
.enr-v4 .enr-empty p { margin-top:5px; color:#85938a; font-size:12px; }
.enr-v4 .enr-loading { padding:30px 22px; color:#71877a; font-size:13px; }
.enr-v4 .enr-pager { border-top:1px solid #edf0ed; padding:14px 20px; }
.enr-v4 .enr-error { padding:0 0 16px; }
@media(max-width:1000px) { .enr-v4 .enr-filters { grid-template-columns:minmax(200px,1fr) 190px; } .enr-v4 .enr-clear { grid-column:1/-1; justify-self:start; } }
@media(max-width:700px) { .enr-v4 { padding:18px 14px 35px; } .enr-v4 .enr-top { align-items:flex-start; } .enr-v4 .enr-title { font-size:25px; } .enr-v4 .enr-metrics { grid-template-columns:1fr; gap:10px; } .enr-v4 .enr-filters { grid-template-columns:1fr; padding:14px; } .enr-v4 .enr-clear { grid-column:auto; justify-self:stretch; } .enr-v4 .enr-panel-head { padding:18px 16px; } .enr-v4 .enr-result-count { display:none; } }
`;

function enrollmentInitials(value: unknown) {
  return String(value ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "T";
}

function enrollmentStatus(value: unknown) {
  const raw = String(value ?? "not_started").toLowerCase();
  if (raw === "completed" || raw === "in_progress" || raw === "not_started") return raw;
  return "other";
}

function enrollmentProgress(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : 0;
}

function EnrollmentMetricIcon({ kind }: { kind: "users" | "completed" | "progress" }) {
  if (kind === "completed") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>;
  if (kind === "progress") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 3v9h9"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>;
}

export function EnrollmentsAdminPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    portalApi.enrollments({ page, q: debouncedQ, status }).then((response) => {
      if (cancelled) return;
      setItems(response.data?.items ?? []);
      setTotal(Number(response.data?.total ?? 0));
    }).catch((caught) => {
      if (!cancelled) setError(caught instanceof ApiError ? caught.message : "Enrollments could not be loaded.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [page, debouncedQ, status, refreshKey]);

  const completedOnPage = items.filter((item) => enrollmentStatus(item.status) === "completed").length;
  const inProgressOnPage = items.filter((item) => enrollmentStatus(item.status) === "in_progress").length;
  const filtersApplied = q.trim() !== "" || status !== "";
  const start = total === 0 ? 0 : (page - 1) * 8 + 1;
  const end = Math.min(page * 8, total);

  return (
    <section className="enr-v4">
      <style>{enrollmentStyles}</style>
      <div className="enr-top">
        <div>
          <p className="enr-eyebrow">Administration / Learning</p>
          <h1 className="enr-title">Enrollments</h1>
          <p className="enr-subtitle">Track therapists, course participation and learning progress.</p>
        </div>
        <button type="button" className="enr-refresh" disabled={loading} onClick={() => setRefreshKey((key) => key + 1)}>
          <span aria-hidden="true">↻</span> Refresh
        </button>
      </div>

      {error && <div className="enr-error"><Notice tone="error">{error}</Notice></div>}

      <div className="enr-metrics">
        <article className="enr-metric">
          <div><span className="enr-metric-label">Total Enrollments</span><strong className="enr-metric-number">{loading && total === 0 ? "—" : total}</strong><span className="enr-metric-note">Matching current filters</span></div>
          <span className="enr-metric-icon"><EnrollmentMetricIcon kind="users" /></span>
        </article>
        <article className="enr-metric">
          <div><span className="enr-metric-label">Completed</span><strong className="enr-metric-number">{completedOnPage}</strong><span className="enr-metric-note">On this page</span></div>
          <span className="enr-metric-icon"><EnrollmentMetricIcon kind="completed" /></span>
        </article>
        <article className="enr-metric">
          <div><span className="enr-metric-label">In Progress</span><strong className="enr-metric-number">{inProgressOnPage}</strong><span className="enr-metric-note">On this page</span></div>
          <span className="enr-metric-icon"><EnrollmentMetricIcon kind="progress" /></span>
        </article>
      </div>

      <div className="enr-panel">
        <div className="enr-panel-head">
          <div><h2>Enrollment Records</h2><p>View all course enrollments and completion progress.</p></div>
          <span className="enr-result-count">{total} records</span>
        </div>
        <div className="enr-filters">
          <div className="enr-search-wrap">
            <span className="enr-search-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg></span>
            <input className="enr-input" value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} aria-label="Search enrollments" placeholder="Search therapist or course..." />
          </div>
          <select className="enr-select" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }} aria-label="Filter enrollment status">
            <option value="">All statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          {filtersApplied && <button type="button" className="enr-clear" onClick={() => { setQ(""); setStatus(""); setPage(1); }}>Clear filters</button>}
        </div>

        {loading ? <div className="enr-loading" role="status">Loading enrollment records...</div> : items.length === 0 ? (
          <div className="enr-empty">
            <div className="enr-empty-icon"><EnrollmentMetricIcon kind="users" /></div>
            <h3>No enrollments found</h3>
            <p>{filtersApplied ? "Try a different search or clear the filters." : "Course enrollments will appear here when therapists enroll."}</p>
          </div>
        ) : (
          <div className="enr-table-wrap">
            <table className="enr-table">
              <thead><tr><th>Therapist</th><th>Course</th><th>Enrolled On</th><th>Progress</th><th>Status</th></tr></thead>
              <tbody>{items.map((item, index) => {
                const progress = enrollmentProgress(item.progress_percent);
                const currentStatus = enrollmentStatus(item.status);
                const label = currentStatus === "other" ? String(item.status ?? "Unknown").replaceAll("_", " ") : currentStatus.replaceAll("_", " ");
                return (
                  <tr key={String(item.id ?? `${page}-${index}`)}>
                    <td><div className="enr-user"><span className="enr-avatar">{enrollmentInitials(item.user_name)}</span><span className="enr-user-name">{String(item.user_name ?? "—")}</span></div></td>
                    <td><span className="enr-course-name">{String(item.course_title ?? "—")}</span></td>
                    <td><span className="enr-muted">{item.enrolled_at ? when(item.enrolled_at) : "—"}</span></td>
                    <td><div className="enr-progress"><span className="enr-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress"><span className="enr-fill" style={{ width: `${progress}%` }} /></span><span className="enr-progress-number">{progress}%</span></div></td>
                    <td><span className={`enr-status enr-status-${currentStatus}`}>{label.replace(/\b\w/g, (char) => char.toUpperCase())}</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
        <div className="enr-pager">
          <div style={{fontSize:12,color:"#7b8e83",marginBottom:7}}>{!loading && total > 0 ? `Showing ${start}–${end} of ${total} enrollments` : "Enrollment records"}</div>
          <Pager page={page} total={total} pageSize={8} onPage={setPage} />
        </div>
      </div>
    </section>
  );
}


export function CertificatesAdminPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [refresh, setRefresh] = useState(0);

  // Modals state
  const [viewingCert, setViewingCert] = useState<Record<string, unknown> | null>(null);
  const [regenCert, setRegenCert] = useState<Record<string, unknown> | null>(null);
  const [historyCert, setHistoryCert] = useState<Record<string, unknown> | null>(null);
  const [historyLogs, setHistoryLogs] = useState<Array<Record<string, unknown>>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Regeneration Form State
  const [recipientName, setRecipientName] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [reason, setReason] = useState("");
  const [regenBusy, setRegenBusy] = useState(false);
  const [regenError, setRegenError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    portalApi.adminCertificates({ q, page })
      .then((response) => {
        if (!active) return;
        setItems(response.data?.items ?? []);
        setTotal(response.data?.total ?? 0);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load certificates."
        );
        setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [q, page, refresh]);

  function openRegenModal(item: Record<string, unknown>) {
    setRegenCert(item);
    setRecipientName(String(item.therapist_name ?? ""));
    const rawDate = item.issued_at ? new Date(String(item.issued_at)) : new Date();
    const formattedDate = isNaN(rawDate.getTime())
      ? new Date().toISOString().slice(0, 10)
      : rawDate.toISOString().slice(0, 10);
    setIssuedDate(formattedDate);
    setReason("");
    setRegenError("");
  }

  async function handleRegenerateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!regenCert) return;
    if (!reason.trim()) {
      setRegenError("Please provide a reason for regeneration.");
      return;
    }
    if (!recipientName.trim()) {
      setRegenError("Recipient name cannot be empty.");
      return;
    }

    setRegenBusy(true);
    setRegenError("");

    try {
      await portalApi.regenerateCertificate(String(regenCert.id), {
        recipientName: recipientName.trim(),
        issuedAt: issuedDate ? new Date(issuedDate).toISOString() : undefined,
        reason: reason.trim(),
      });
      setSuccessMsg(`Certificate ${regenCert.certificate_code} regenerated successfully.`);
      setRegenCert(null);
      setRefresh((n) => n + 1);
    } catch (caught) {
      setRegenError(readableError(caught, "Failed to regenerate certificate."));
    } finally {
      setRegenBusy(false);
    }
  }

  async function openHistoryModal(item: Record<string, unknown>) {
    setHistoryCert(item);
    setHistoryLoading(true);
    try {
      const res = await portalApi.certificateHistory(String(item.id));
      setHistoryLogs(res.data?.items ?? []);
    } catch {
      setHistoryLogs([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function downloadPdf(id: string, code: string, version?: number) {
    setDownloadingId(id);
    setError("");
    let url: string | undefined;
    try {
      const blob = await portalApi.pdf(version ? `${id}?version=${version}` : id, true);
      url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${code || "certificate"}${version ? `-v${version}` : ""}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to download certificate PDF.");
    } finally {
      if (url) window.setTimeout(() => URL.revokeObjectURL(url!), 1000);
      setDownloadingId(null);
    }
  }

  const css = `
    .admin-cert-v2,
    .admin-cert-v2 * {
      box-sizing: border-box;
      font-family: Inter, "Segoe UI", Arial, sans-serif;
    }

    .admin-cert-v2 {
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 24px 28px 60px;
      color: #18352d;
      font-size: 14px;
    }

    .admin-cert-v2 h1,
    .admin-cert-v2 h2,
    .admin-cert-v2 h3 {
      font-family: Inter, "Segoe UI", Arial, sans-serif;
      letter-spacing: -0.035em;
      margin: 0;
      line-height: 1.25;
      color: #18352d;
    }

    .admin-cert-v2 .ac-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .admin-cert-v2 .ac-kicker {
      font-size: 11px;
      font-weight: 750;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #598777;
      margin: 0 0 7px;
    }

    .admin-cert-v2 .ac-header h1 {
      font-size: 29px;
      font-weight: 800;
    }

    .admin-cert-v2 .ac-description {
      font-size: 13px;
      color: #71837c;
      margin: 8px 0 0;
      line-height: 1.6;
    }

    .admin-cert-v2 .ac-button {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      min-height: 40px;
      border: 1px solid #dce7e0;
      border-radius: 10px;
      background: white;
      color: #215643;
      font-size: 13px;
      font-weight: 650;
      cursor: pointer;
      text-decoration: none;
      transition: background .2s;
    }

    .admin-cert-v2 .ac-button:hover {
      background: #edf6f0;
    }

    .admin-cert-v2 .ac-stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .admin-cert-v2 .ac-stat {
      background: white;
      border: 1px solid #e2eae5;
      border-radius: 14px;
      padding: 20px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .admin-cert-v2 .ac-stat-label {
      font-size: 12px;
      color: #72857b;
      margin: 0 0 9px;
    }

    .admin-cert-v2 .ac-stat-value {
      font-size: 28px;
      font-weight: 800;
      color: #183d30;
      line-height: 1.1;
    }

    .admin-cert-v2 .ac-stat-icon {
      width: 46px;
      height: 46px;
      border-radius: 13px;
      display: grid;
      place-items: center;
      background: #eaf4ee;
      color: #175d46;
      font-size: 23px;
      flex-shrink: 0;
    }

    .admin-cert-v2 .ac-panel {
      background: white;
      border: 1px solid #e1e9e4;
      border-radius: 16px;
      overflow: hidden;
    }

    .admin-cert-v2 .ac-panel-header {
      padding: 22px 24px;
      border-bottom: 1px solid #eaf0ec;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      flex-wrap: wrap;
    }

    .admin-cert-v2 .ac-panel-header h2 {
      font-size: 17px;
      font-weight: 750;
    }

    .admin-cert-v2 .ac-panel-header p {
      color: #7a8981;
      font-size: 12px;
      margin: 6px 0 0;
    }

    .admin-cert-v2 .ac-search {
      width: min(370px, 100%);
      height: 43px;
      border: 1px solid #dce6df;
      border-radius: 10px;
      padding: 0 14px;
      background: white;
      color: #18352d;
      font-size: 13px;
      outline: none;
    }

    .admin-cert-v2 .ac-search:focus {
      border-color: #237758;
      box-shadow: 0 0 0 3px #e4f2e9;
    }

    .admin-cert-v2 .ac-table-wrap {
      width: 100%;
      overflow-x: auto;
    }

    .admin-cert-v2 .ac-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 720px;
      background: white;
    }

    .admin-cert-v2 .ac-table th {
      text-align: left;
      background: #f7faf8;
      color: #788980;
      font-size: 11px;
      font-weight: 750;
      text-transform: uppercase;
      letter-spacing: .6px;
      padding: 16px 20px;
      border-bottom: 1px solid #e7eee9;
    }

    .admin-cert-v2 .ac-table td {
      padding: 18px 20px;
      border-bottom: 1px solid #edf1ee;
      color: #314a40;
      font-size: 13px;
      vertical-align: middle;
    }

    .admin-cert-v2 .ac-table tbody tr:hover {
      background: #fafcfb;
    }

    .admin-cert-v2 .ac-table tbody tr:last-child td {
      border-bottom: none;
    }

    .admin-cert-v2 .ac-code {
      font-weight: 750;
      color: #175c46;
      overflow-wrap: anywhere;
    }

    .admin-cert-v2 .ac-person {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 650;
      white-space: nowrap;
    }

    .admin-cert-v2 .ac-avatar {
      width: 35px;
      height: 35px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      background: #e9f2ed;
      color: #23664d;
      font-weight: 750;
      flex-shrink: 0;
    }

    .admin-cert-v2 .ac-status {
      display: inline-flex;
      align-items: center;
      padding: 6px 11px;
      border-radius: 30px;
      background: #e6f6eb;
      color: #17754c;
      font-size: 11px;
      font-weight: 750;
      white-space: nowrap;
    }

    .admin-cert-v2 .ac-status.regenerated {
      background: #eef4fc;
      color: #1f5c9e;
    }

    .admin-cert-v2 .ac-ver-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      background: #e8f0eb;
      color: #185c44;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 6px;
    }

    .admin-cert-v2 .ac-email {
      color: #557266;
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .admin-cert-v2 .ac-actions-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .admin-cert-v2 .ac-btn-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 11px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      border: 1px solid transparent;
      text-decoration: none;
      white-space: nowrap;
    }

    .admin-cert-v2 .ac-btn-action.view {
      background: #f0f7f3;
      color: #176146;
      border-color: #d1e5db;
    }
    .admin-cert-v2 .ac-btn-action.view:hover {
      background: #e2f2e9;
    }

    .admin-cert-v2 .ac-btn-action.download {
      background: #ffffff;
      color: #176146;
      border-color: #dce8df;
    }
    .admin-cert-v2 .ac-btn-action.download:hover {
      background: #f4faf6;
    }

    .admin-cert-v2 .ac-btn-action.regen {
      background: #176146;
      color: #ffffff;
      border-color: #176146;
    }
    .admin-cert-v2 .ac-btn-action.regen:hover {
      background: #124d37;
    }

    .admin-cert-v2 .ac-btn-action.history {
      background: #fff9ed;
      color: #8c5b13;
      border-color: #f0dec0;
    }
    .admin-cert-v2 .ac-btn-action.history:hover {
      background: #faeccf;
    }

    .admin-cert-v2 .ac-success-banner {
      padding: 12px 18px;
      border-radius: 9px;
      background: #eaf7ee;
      border: 1px solid #bce6cb;
      color: #14633b;
      font-weight: 650;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .admin-cert-v2 .ac-close-toast {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #14633b;
      line-height: 1;
    }

    /* Modals styling */
    .admin-cert-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(14, 30, 24, 0.6);
      backdrop-filter: blur(3px);
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 20px;
      overflow-y: auto;
    }

    .admin-cert-modal-dialog {
      background: #ffffff;
      border-radius: 14px;
      width: 100%;
      max-width: 620px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.22);
      border: 1px solid #dce8df;
      overflow: hidden;
      animation: acModalIn 0.2s ease-out;
    }

    .admin-cert-modal-dialog.preview-dialog {
      max-width: 680px;
    }

    @keyframes acModalIn {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .admin-cert-modal-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 24px;
      border-bottom: 1px solid #eef2ef;
      background: #fbfdfc;
    }

    .admin-cert-modal-head h2 {
      font-size: 18px;
      font-weight: 800;
      color: #18352d;
      margin: 0;
    }

    .admin-cert-modal-close {
      background: none;
      border: none;
      font-size: 22px;
      color: #70857c;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }
    .admin-cert-modal-close:hover {
      color: #18352d;
    }

    .admin-cert-modal-body {
      padding: 22px 24px;
      max-height: calc(85vh - 120px);
      overflow-y: auto;
    }

    .admin-cert-summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 14px 16px;
      background: #f8faf8;
      border: 1px solid #e8efe9;
      border-radius: 10px;
      margin-bottom: 20px;
    }

    .admin-cert-summary-item span {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 750;
      color: #637d72;
      margin-bottom: 3px;
    }

    .admin-cert-summary-item strong {
      font-size: 13px;
      color: #18352d;
      word-break: break-word;
    }

    .admin-cert-field-group {
      margin-bottom: 16px;
    }

    .admin-cert-field-group label {
      display: block;
      font-size: 12px;
      font-weight: 750;
      color: #1e463c;
      margin-bottom: 6px;
    }

    .admin-cert-field-group input,
    .admin-cert-field-group textarea {
      width: 100%;
      padding: 10px 13px;
      border: 1px solid #cfded4;
      border-radius: 8px;
      font-size: 13px;
      color: #18352d;
      background: #ffffff;
      outline: none;
      transition: border-color 0.15s ease;
      font-family: inherit;
    }

    .admin-cert-field-group input:focus,
    .admin-cert-field-group textarea:focus {
      border-color: #176146;
      box-shadow: 0 0 0 3px rgba(23, 97, 70, 0.12);
    }

    .admin-cert-field-group p.help {
      font-size: 11px;
      color: #6b8277;
      margin: 5px 0 0;
    }

    .admin-cert-preview-card {
      margin: 8px 0 20px;
      border: 6px solid #f2ecdd;
      outline: 1px solid #c9b17c;
      outline-offset: -10px;
      padding: 34px 22px;
      text-align: center;
      background: #fffefb;
      border-radius: 4px;
    }

    .admin-cert-preview-seal {
      font-size: 34px;
      color: #ad8b42;
      margin-bottom: 8px;
      line-height: 1;
    }

    .admin-cert-preview-org {
      font-size: 12px;
      letter-spacing: 0.22em;
      font-weight: 800;
      color: #9c7b41;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .admin-cert-preview-title {
      font-size: 22px;
      font-weight: 800;
      color: #1e463c;
      margin: 8px 0;
    }

    .admin-cert-preview-subtitle {
      font-size: 13px;
      color: #6d7f76;
      margin: 4px 0 10px;
    }

    .admin-cert-preview-person {
      font-size: 24px;
      font-weight: 800;
      color: #175c46;
      margin: 10px 0;
      letter-spacing: -0.02em;
    }

    .admin-cert-preview-course {
      font-size: 17px;
      font-weight: 750;
      color: #273b33;
      margin: 8px 0 14px;
    }

    .admin-cert-preview-footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px dashed #dfd4bc;
      padding-top: 14px;
      margin-top: 14px;
      font-size: 12px;
      color: #796646;
      font-weight: 600;
    }

    .admin-cert-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px;
      border-top: 1px solid #eef2ef;
      background: #fbfdfc;
    }

    .admin-cert-history-item {
      padding: 14px 16px;
      border: 1px solid #e5ede7;
      border-radius: 10px;
      background: #fcfdfc;
      margin-bottom: 12px;
    }

    .admin-cert-history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .admin-cert-history-version {
      font-weight: 800;
      color: #176146;
      font-size: 13px;
    }

    .admin-cert-history-date {
      font-size: 11px;
      color: #72877e;
    }

    .admin-cert-history-reason {
      font-size: 13px;
      color: #21352d;
      margin-bottom: 6px;
      font-style: italic;
    }

    .admin-cert-history-meta {
      font-size: 11px;
      color: #5c7469;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .admin-cert-v2 .ac-empty {
      padding: 60px 20px;
      text-align: center;
      color: #71837a;
    }

    .admin-cert-v2 .ac-empty h3 {
      font-size: 17px;
      margin: 12px 0 6px;
    }

    .admin-cert-v2 .ac-empty p {
      font-size: 13px;
      margin: 0;
    }

    .admin-cert-v2 .ac-error {
      padding: 13px 16px;
      border: 1px solid #f0caca;
      border-radius: 10px;
      background: #fff4f4;
      color: #ad3636;
      margin-bottom: 16px;
    }

    .admin-cert-v2 .ac-pagination {
      padding: 16px 22px;
      border-top: 1px solid #eaf0ec;
    }

    @media (max-width: 768px) {
      .admin-cert-v2 {
        padding: 18px 14px 40px;
      }

      .admin-cert-v2 .ac-header h1 {
        font-size: 25px;
      }

      .admin-cert-v2 .ac-stats {
        grid-template-columns: 1fr;
      }

      .admin-cert-v2 .ac-panel-header {
        padding: 18px;
      }

      .admin-cert-v2 .ac-search {
        width: 100%;
      }

      .admin-cert-summary-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  return (
    <section className="admin-cert-v2">
      <style>{css}</style>

      <div className="ac-header">
        <div>
          <p className="ac-kicker">Certification / Records</p>
          <h1>Certificate Management</h1>
          <p className="ac-description">
            View, verify, download and regenerate certificates issued to therapists.
          </p>
        </div>

        <button
          type="button"
          className="ac-button"
          onClick={() => setRefresh((n) => n + 1)}
        >
          ↻ Refresh
        </button>
      </div>

      {successMsg && (
        <div className="ac-success-banner" role="status">
          <span>✓ {successMsg}</span>
          <button
            type="button"
            className="ac-close-toast"
            onClick={() => setSuccessMsg("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <div className="ac-stats">
        <div className="ac-stat">
          <div>
            <p className="ac-stat-label">Total Certificates</p>
            <div className="ac-stat-value">
              {loading ? "—" : total}
            </div>
          </div>
          <div className="ac-stat-icon">▤</div>
        </div>

        <div className="ac-stat">
          <div>
            <p className="ac-stat-label">Certificates on This Page</p>
            <div className="ac-stat-value">
              {loading ? "—" : items.length}
            </div>
          </div>
          <div className="ac-stat-icon">✓</div>
        </div>
      </div>

      {error && (
        <div className="ac-error" role="alert">
          {error}
        </div>
      )}

      <div className="ac-panel">
        <div className="ac-panel-header">
          <div>
            <h2>Issued Certificates</h2>
            <p>
              Search, view and manage official certificates.
            </p>
          </div>

          <input
            className="ac-search"
            value={q}
            onChange={(event) => {
              setPage(1);
              setQ(event.target.value);
            }}
            placeholder="Search therapist, email, course or ID..."
            aria-label="Search certificates"
          />
        </div>

        {loading ? (
          <div className="ac-empty">
            Loading certificates...
          </div>
        ) : items.length === 0 ? (
          <div className="ac-empty">
            <div style={{ fontSize: 35 }}>▤</div>
            <h3>No certificates found</h3>
            <p>
              {q
                ? "Try searching with a different keyword."
                : "Certificates appear after a therapist passes an assessment."}
            </p>
          </div>
        ) : (
          <div className="ac-table-wrap">
            <table className="ac-table">
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>User Name</th>
                  <th>User Email</th>
                  <th>Course Name</th>
                  <th>Certificate Issue Date</th>
                  <th>Certificate Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => {
                  const id = String(item.id);
                  const name = String(item.therapist_name ?? "Unknown");
                  const email = String(item.email ?? "—");
                  const code = String(item.certificate_code ?? "");
                  const courseTitle = String(item.course_title ?? "—");
                  const version = Number(item.version) || 1;

                  const initials = name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0] ?? "")
                    .join("")
                    .toUpperCase();

                  return (
                    <tr key={id}>
                      <td>
                        <span className="ac-code">{code}</span>
                        {version > 1 && (
                          <span className="ac-ver-badge">v{version}</span>
                        )}
                      </td>

                      <td>
                        <div className="ac-person">
                          <span className="ac-avatar">{initials}</span>
                          <span>{name}</span>
                        </div>
                      </td>

                      <td>
                        <span className="ac-email">{email}</span>
                      </td>

                      <td>{courseTitle}</td>

                      <td>{item.issued_at ? when(item.issued_at) : "—"}</td>

                      <td>
                        <span className={`ac-status ${version > 1 ? "regenerated" : ""}`}>
                          {version > 1 ? `✓ v${version} Active` : "✓ Issued"}
                        </span>
                      </td>

                      <td>
                        <div className="ac-actions-cell">
                          <button
                            type="button"
                            className="ac-btn-action view"
                            onClick={() => setViewingCert(item)}
                            title="View certificate preview"
                          >
                            View Certificate
                          </button>

                          <button
                            type="button"
                            className="ac-btn-action download"
                            disabled={downloadingId === id}
                            onClick={() => downloadPdf(id, code)}
                            title="Download certificate PDF"
                          >
                            {downloadingId === id ? "..." : "Download"}
                          </button>

                          <button
                            type="button"
                            className="ac-btn-action regen"
                            onClick={() => openRegenModal(item)}
                            title="Manually regenerate certificate with corrected details"
                          >
                            Regenerate
                          </button>

                          {version > 1 && (
                            <button
                              type="button"
                              className="ac-btn-action history"
                              onClick={() => openHistoryModal(item)}
                              title="View certificate revision history and audit log"
                            >
                              History
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="ac-pagination">
          <Pager
            page={page}
            total={total}
            pageSize={8}
            onPage={setPage}
          />
        </div>
      </div>

      {/* 1. VIEW CERTIFICATE MODAL */}
      {viewingCert && (
        <div
          className="admin-cert-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setViewingCert(null);
          }}
        >
          <div
            className="admin-cert-modal-dialog preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="View Certificate"
          >
            <div className="admin-cert-modal-head">
              <h2>Certificate Details</h2>
              <button
                type="button"
                className="admin-cert-modal-close"
                onClick={() => setViewingCert(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="admin-cert-modal-body">
              <div className="admin-cert-preview-card">
                <div className="admin-cert-preview-seal">✦</div>
                <div className="admin-cert-preview-org">Spa Therapist Portal</div>
                <div className="admin-cert-preview-title">Certificate of Completion</div>
                <div className="admin-cert-preview-subtitle">This certificate is proudly presented to</div>
                <div className="admin-cert-preview-person">
                  {String(viewingCert.therapist_name ?? "Certificate Holder")}
                </div>
                <div className="admin-cert-preview-subtitle">for successfully completing the professional course</div>
                <div className="admin-cert-preview-course">
                  {String(viewingCert.course_title ?? "Course")}
                </div>

                <div className="admin-cert-preview-footer">
                  <span>ID: {String(viewingCert.certificate_code ?? "—")}</span>
                  <span>Issued: {viewingCert.issued_at ? when(viewingCert.issued_at) : "—"}</span>
                  <span>Version: {Number(viewingCert.version) || 1}</span>
                </div>
              </div>
            </div>

            <div className="admin-cert-modal-actions">
              <a
                className="ac-btn-action view"
                href={`/certificates/verify/${encodeURIComponent(String(viewingCert.certificate_code ?? ""))}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Public Verify Link ↗
              </a>

              <button
                type="button"
                className="ac-btn-action download"
                disabled={downloadingId === String(viewingCert.id)}
                onClick={() =>
                  downloadPdf(String(viewingCert.id), String(viewingCert.certificate_code ?? ""))
                }
              >
                {downloadingId === String(viewingCert.id) ? "Downloading..." : "↓ Download PDF"}
              </button>

              <button
                type="button"
                className="ac-btn-action regen"
                onClick={() => {
                  const target = viewingCert;
                  setViewingCert(null);
                  openRegenModal(target);
                }}
              >
                Regenerate Certificate
              </button>

              <button
                type="button"
                className="ac-button"
                onClick={() => setViewingCert(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MANUAL REGENERATION MODAL */}
      {regenCert && (
        <div
          className="admin-cert-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !regenBusy) setRegenCert(null);
          }}
        >
          <div
            className="admin-cert-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Regenerate Certificate"
          >
            <div className="admin-cert-modal-head">
              <div>
                <h2>Regenerate Certificate</h2>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#617b6f" }}>
                  Review certificate details and apply approved corrections before regeneration.
                </p>
              </div>
              <button
                type="button"
                className="admin-cert-modal-close"
                disabled={regenBusy}
                onClick={() => setRegenCert(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRegenerateSubmit}>
              <div className="admin-cert-modal-body">
                {regenError && (
                  <div className="ac-error" role="alert" style={{ marginBottom: 14 }}>
                    {regenError}
                  </div>
                )}

                <div className="admin-cert-summary-grid">
                  <div className="admin-cert-summary-item">
                    <span>Course</span>
                    <strong>{String(regenCert.course_title ?? "—")}</strong>
                  </div>
                  <div className="admin-cert-summary-item">
                    <span>Certificate ID</span>
                    <strong>{String(regenCert.certificate_code ?? "—")}</strong>
                  </div>
                  <div className="admin-cert-summary-item">
                    <span>User Email</span>
                    <strong>{String(regenCert.email ?? "—")}</strong>
                  </div>
                  <div className="admin-cert-summary-item">
                    <span>Current Version</span>
                    <strong>v{Number(regenCert.version) || 1}</strong>
                  </div>
                </div>

                <div className="admin-cert-field-group">
                  <label htmlFor="regen-recipient-name">Recipient / Therapist Name *</label>
                  <input
                    id="regen-recipient-name"
                    type="text"
                    value={recipientName}
                    disabled={regenBusy}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Enter full legal therapist name"
                    required
                  />
                  <p className="help">
                    Modify this field if the therapist legal name has spelling errors or was updated.
                  </p>
                </div>

                <div className="admin-cert-field-group">
                  <label htmlFor="regen-issued-date">Certificate Issue Date *</label>
                  <input
                    id="regen-issued-date"
                    type="date"
                    value={issuedDate}
                    disabled={regenBusy}
                    onChange={(e) => setIssuedDate(e.target.value)}
                    required
                  />
                  <p className="help">
                    Adjust the official issue date if required.
                  </p>
                </div>

                <div className="admin-cert-field-group">
                  <label htmlFor="regen-reason">Reason for Regeneration * (Mandatory)</label>
                  <textarea
                    id="regen-reason"
                    rows={3}
                    value={reason}
                    disabled={regenBusy}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide a mandatory reason for this regeneration (e.g., Typo correction in recipient surname per therapist request)..."
                    required
                  />
                  <p className="help">
                    This reason will be permanently recorded in the audit log along with your admin ID.
                  </p>
                </div>
              </div>

              <div className="admin-cert-modal-actions">
                <button
                  type="button"
                  className="ac-button"
                  disabled={regenBusy}
                  onClick={() => setRegenCert(null)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ac-btn-action regen"
                  style={{ padding: "9px 18px", fontSize: "13px" }}
                  disabled={regenBusy || !reason.trim() || !recipientName.trim()}
                >
                  {regenBusy ? "Regenerating PDF..." : "Confirm & Regenerate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CERTIFICATE AUDIT HISTORY MODAL */}
      {historyCert && (
        <div
          className="admin-cert-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setHistoryCert(null);
          }}
        >
          <div
            className="admin-cert-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Certificate History"
          >
            <div className="admin-cert-modal-head">
              <div>
                <h2>Certificate Audit History</h2>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#617b6f" }}>
                  Audit trail for {String(historyCert.certificate_code)} ({String(historyCert.course_title)})
                </p>
              </div>
              <button
                type="button"
                className="admin-cert-modal-close"
                onClick={() => setHistoryCert(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="admin-cert-modal-body">
              {historyLoading ? (
                <div style={{ textAlign: "center", padding: "30px", color: "#668074" }}>
                  Loading revision logs...
                </div>
              ) : historyLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", color: "#668074" }}>
                  No past regenerations recorded for this certificate.
                </div>
              ) : (
                historyLogs.map((log) => (
                  <div className="admin-cert-history-item" key={String(log.id)}>
                    <div className="admin-cert-history-header">
                      <span className="admin-cert-history-version">
                        Revision v{String(log.version)}
                      </span>
                      <span className="admin-cert-history-date">
                        {log.created_at ? when(log.created_at) : "—"}
                      </span>
                    </div>

                    <div className="admin-cert-history-reason">
                      "{String(log.reason)}"
                    </div>

                    <div style={{ fontSize: "12px", margin: "6px 0", color: "#304a3f" }}>
                      <div>
                        <strong>Name:</strong> {String(log.previous_name)} → <strong>{String(log.new_name)}</strong>
                      </div>
                    </div>

                    <div className="admin-cert-history-meta">
                      <span>Regenerated by: {String(log.admin_name)} ({String(log.admin_email)})</span>
                      <button
                        type="button"
                        className="ac-btn-action download"
                        onClick={() =>
                          downloadPdf(
                            String(historyCert.id),
                            String(historyCert.certificate_code),
                            Number(log.version)
                          )
                        }
                      >
                        Download v{String(log.version)} PDF
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="admin-cert-modal-actions">
              <button
                type="button"
                className="ac-button"
                onClick={() => setHistoryCert(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}



const reportsStyles = `
.rpt-v5, .rpt-v5 * {
  box-sizing: border-box;
}

.rpt-v5 {
  width: 100%;
  min-width: 0;
  padding: 26px 28px 50px;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 14px;
  color: #19372d;
  line-height: 1.5;
}

.rpt-v5 h1,
.rpt-v5 h2,
.rpt-v5 h3,
.rpt-v5 p {
  margin: 0;
  font-family: inherit;
  letter-spacing: normal;
}

.rpt-v5 button,
.rpt-v5 input {
  font-family: inherit;
}

.rpt-v5 .rpt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.rpt-v5 .rpt-eyebrow {
  color: #548174;
  font-size: 11px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: .1em;
  margin-bottom: 7px;
}

.rpt-v5 .rpt-title {
  color: #16382d;
  font-size: 30px;
  font-weight: 780;
  line-height: 1.2;
  letter-spacing: -.04em;
}

.rpt-v5 .rpt-subtitle {
  color: #819088;
  font-size: 13px;
  margin-top: 7px;
}

.rpt-v5 .rpt-export {
  height: 42px;
  padding: 0 18px;
  background: #18563e;
  border: 1px solid #18563e;
  color: white;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.rpt-v5 .rpt-export:hover {
  background: #124631;
}

.rpt-v5 .rpt-export:disabled {
  opacity: .6;
  cursor: wait;
}

.rpt-v5 .rpt-panel {
  background: #fff;
  border: 1px solid #e2e9e4;
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 22px;
}

.rpt-v5 .rpt-panel-head {
  padding: 20px 22px;
  border-bottom: 1px solid #edf0ee;
}

.rpt-v5 .rpt-panel-head h2 {
  font-size: 16px;
  font-weight: 750;
  color: #1c3c30;
}

.rpt-v5 .rpt-panel-head p {
  margin-top: 5px;
  font-size: 12px;
  color: #84938b;
}

.rpt-v5 .rpt-filters {
  display: grid;
  grid-template-columns: 1fr 1fr auto auto;
  gap: 14px;
  align-items: end;
  padding: 20px 22px;
}

.rpt-v5 .rpt-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.rpt-v5 .rpt-field span {
  font-size: 12px;
  font-weight: 700;
  color: #36594a;
}

.rpt-v5 .rpt-input {
  width: 100%;
  min-width: 0;
  height: 43px;
  padding: 0 12px;
  background: white;
  color: #28483b;
  border: 1px solid #dce6df;
  border-radius: 9px;
  font-size: 13px;
  outline: none;
}

.rpt-v5 .rpt-input:focus {
  border-color: #408567;
  box-shadow: 0 0 0 3px #eaf4ed;
}

.rpt-v5 .rpt-apply,
.rpt-v5 .rpt-reset {
  height: 43px;
  padding: 0 20px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  white-space: nowrap;
}

.rpt-v5 .rpt-apply {
  background: #18563e;
  color: white;
  border: 1px solid #18563e;
}

.rpt-v5 .rpt-reset {
  background: #f2f6f3;
  color: #466a57;
  border: 1px solid #e1eae3;
}

.rpt-v5 .rpt-apply:disabled {
  opacity: .6;
}

.rpt-v5 .rpt-section-title {
  font-size: 17px;
  font-weight: 750;
  margin: 28px 0 15px;
  color: #1c3c30;
}

.rpt-v5 .rpt-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 13px;
}

.rpt-v5 .rpt-stat {
  min-width: 0;
  background: white;
  border: 1px solid #e2e9e4;
  border-radius: 14px;
  padding: 20px 17px;
}

.rpt-v5 .rpt-stat-icon {
  display: grid;
  place-items: center;
  width: 39px;
  height: 39px;
  border-radius: 11px;
  background: #eaf4ec;
  color: #286d4e;
  font-size: 19px;
  margin-bottom: 17px;
}

.rpt-v5 .rpt-stat-label {
  color: #7b8d82;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .035em;
}

.rpt-v5 .rpt-stat-value {
  display: block;
  margin-top: 8px;
  color: #193c2d;
  font-size: 28px;
  font-weight: 780;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.rpt-v5 .rpt-stat-note {
  margin-top: 7px;
  color: #91a097;
  font-size: 11px;
}

.rpt-v5 .rpt-table-scroll {
  width: 100%;
  overflow-x: auto;
}

.rpt-v5 .rpt-table {
  width: 100%;
  min-width: 620px;
  border-collapse: collapse;
  font-family: inherit;
}

.rpt-v5 .rpt-table thead {
  background: #f8faf8;
}

.rpt-v5 .rpt-table th {
  padding: 15px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 750;
  color: #78897e;
  text-transform: uppercase;
  letter-spacing: .05em;
}

.rpt-v5 .rpt-table td {
  padding: 17px 20px;
  border-top: 1px solid #edf0ee;
  font-size: 13px;
  color: #425c4d;
}

.rpt-v5 .rpt-table tbody tr:hover {
  background: #fafcfb;
}

.rpt-v5 .rpt-course-name {
  color: #1d4834;
  font-weight: 700;
}

.rpt-v5 .rpt-completed {
  display: inline-block;
  padding: 5px 11px;
  border-radius: 20px;
  background: #e7f5eb;
  color: #28774e;
  font-weight: 750;
  font-size: 12px;
}

.rpt-v5 .rpt-empty {
  padding: 35px 20px;
  text-align: center;
  color: #839188;
  font-size: 13px;
}

.rpt-v5 .rpt-loading {
  padding: 26px;
  color: #7b8b81;
}

.rpt-v5 .rpt-error {
  margin-bottom: 18px;
}

@media (max-width: 1200px) {
  .rpt-v5 .rpt-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 850px) {
  .rpt-v5 .rpt-filters {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 650px) {
  .rpt-v5 {
    padding: 18px 14px 35px;
  }

  .rpt-v5 .rpt-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .rpt-v5 .rpt-title {
    font-size: 25px;
  }

  .rpt-v5 .rpt-stats {
    grid-template-columns: 1fr 1fr;
  }

  .rpt-v5 .rpt-filters {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .rpt-v5 .rpt-panel-head {
    padding: 17px;
  }

  .rpt-v5 .rpt-export {
    width: 100%;
  }
}

@media (max-width: 420px) {
  .rpt-v5 .rpt-stats {
    grid-template-columns: 1fr;
  }
}
`;

export function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  async function load(start = from, end = to) {
    setLoading(true);
    setError("");

    try {
      const response = await portalApi.reports(
        start || undefined,
        end || undefined
      );

      setData(response.data ?? null);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "The report could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    portalApi.reports()
      .then((response) => {
        if (!cancelled) {
          setData(response.data ?? null);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : "The report could not be loaded."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function download() {
    setExporting(true);
    setError("");

    try {
      const blob = await portalApi.exportReport(
        from || undefined,
        to || undefined
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "portal-report.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not export the report."
      );
    } finally {
      setExporting(false);
    }
  }

  const summary = data?.summary as
    | Record<string, unknown>
    | undefined;

  const assessments = summary?.assessments as
    | Record<string, number>
    | undefined;

  const courses = (
    (summary?.courses as Array<Record<string, unknown>>) ?? []
  );

  const stats = [
    {
      label: "Registrations",
      value: Number(summary?.registrations ?? 0),
      icon: "♙",
      note: "Registered therapists",
    },
    {
      label: "Enrollments",
      value: Number(summary?.enrollments ?? 0),
      icon: "▤",
      note: "Course enrollments",
    },
    {
      label: "Completions",
      value: Number(summary?.completions ?? 0),
      icon: "✓",
      note: "Completed courses",
    },
    {
      label: "Passed / Failed",
      value: `${assessments?.passed ?? 0} / ${assessments?.failed ?? 0}`,
      icon: "◉",
      note: "Assessment results",
    },
    {
      label: "Certificates",
      value: Number(summary?.certificates ?? 0),
      icon: "♧",
      note: "Certificates issued",
    },
  ];

  function resetFilters() {
    setFrom("");
    setTo("");
    load("", "");
  }

  return (
    <section className="rpt-v5">
      <style>{reportsStyles}</style>

      <div className="rpt-header">
        <div>
          <p className="rpt-eyebrow">
            Administration / Analytics
          </p>
          <h1 className="rpt-title">Reports & Analytics</h1>
          <p className="rpt-subtitle">
            Monitor learning performance, enrollments,
            assessments and certifications.
          </p>
        </div>

        <button
          type="button"
          className="rpt-export"
          onClick={download}
          disabled={exporting}
        >
          {exporting ? "Exporting..." : "↓ Export CSV"}
        </button>
      </div>

      {error && (
        <div className="rpt-error">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <div className="rpt-panel">
        <div className="rpt-panel-head">
          <h2>Report Filters</h2>
          <p>Select a date range to view specific analytics.</p>
        </div>

        <div className="rpt-filters">
          <label className="rpt-field">
            <span>From Date</span>
            <input
              className="rpt-input"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>

          <label className="rpt-field">
            <span>To Date</span>
            <input
              className="rpt-input"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="rpt-apply"
            onClick={() => load()}
            disabled={loading || Boolean(from && to && from > to)}
          >
            {loading ? "Loading..." : "Apply Filters"}
          </button>

          <button
            type="button"
            className="rpt-reset"
            onClick={resetFilters}
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </div>

      <h2 className="rpt-section-title">
        Performance Overview
      </h2>

      {loading && !summary ? (
        <div className="rpt-panel rpt-loading">
          Loading report statistics...
        </div>
      ) : summary ? (
        <div className="rpt-stats">
          {stats.map((stat) => (
            <article className="rpt-stat" key={stat.label}>
              <span className="rpt-stat-icon">
                {stat.icon}
              </span>

              <p className="rpt-stat-label">
                {stat.label}
              </p>

              <strong className="rpt-stat-value">
                {stat.value}
              </strong>

              <p className="rpt-stat-note">
                {stat.note}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rpt-panel rpt-empty">
          Report statistics are unavailable.
        </div>
      )}

      <h2 className="rpt-section-title">
        Course Performance
      </h2>

      <div className="rpt-panel">
        <div className="rpt-panel-head">
          <h2>Course Analytics</h2>
          <p>
            Enrollment and completion statistics for each course.
          </p>
        </div>

        {loading ? (
          <div className="rpt-loading">
            Loading course performance...
          </div>
        ) : courses.length === 0 ? (
          <div className="rpt-empty">
            No course performance data available.
          </div>
        ) : (
          <div className="rpt-table-scroll">
            <table className="rpt-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Enrollments</th>
                  <th>Completed</th>
                  <th>Completion Rate</th>
                </tr>
              </thead>

              <tbody>
                {courses.map((course, index) => {
                  const enrollments = Number(
                    course.enrollments ?? 0
                  );

                  const completed = Number(
                    course.completed ?? 0
                  );

                  const completionRate =
                    enrollments > 0
                      ? Math.round(
                          (completed / enrollments) * 100
                        )
                      : 0;

                  return (
                    <tr key={String(course.id ?? index)}>
                      <td>
                        <span className="rpt-course-name">
                          {String(course.title ?? "—")}
                        </span>
                      </td>

                      <td>{enrollments}</td>

                      <td>
                        <span className="rpt-completed">
                          {completed}
                        </span>
                      </td>

                      <td>
                        <strong>{completionRate}%</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

