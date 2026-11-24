
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.ts";
import { Icon } from "./ui.tsx";

const userLinks: Array<{
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}> = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/profile", label: "My Profile", icon: "profile" },
  { to: "/learning", label: "My Learning", icon: "learning" },
  { to: "/assessments", label: "My Assessments", icon: "assessment" },
  { to: "/certificates", label: "My Certificates", icon: "certificate" },
];

const adminLinks: Array<{
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}> = [
  { to: "/admin", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/admin/courses", label: "Course Management", icon: "courses" },
  { to: "/admin/curriculum", label: "Module & Lesson Management", icon: "modules" },
  { to: "/admin/assessments", label: "Assessment Management", icon: "assessment" },
  { to: "/admin/users", label: "User Management", icon: "users" },
  { to: "/admin/enrollments", label: "Enrollments", icon: "enrollments" },
  { to: "/admin/certificates", label: "Certificates", icon: "certificate" },
  { to: "/admin/reports", label: "Reports", icon: "reports" },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("spa-sidebar") === "collapsed"
  );

  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const links = user?.role === "ADMIN" ? adminLinks : userLinks;

  useEffect(() => {
    localStorage.setItem(
      "spa-sidebar",
      collapsed ? "collapsed" : "expanded"
    );
  }, [collapsed]);

  async function signOut() {
    setLeaving(true);

    try {
      await logout();
    } finally {
      navigate("/", { replace: true });
    }
  }

  return (
    <div
      className={`app-shell${collapsed ? " is-collapsed" : ""}${
        open ? " is-open" : ""
      }`}
    >
      {/* CSS INSIDE EXISTING FILE */}
      <style>{`
        /* Small sidebar toggle */

        .sidebar-toggle {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          width: calc(100% - 28px);
          height: 38px;
          margin: 12px 14px 20px;
          padding: 0 12px;
          box-sizing: border-box;
          border: none;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.10);
          color: #ffffff;
          cursor: pointer;
          overflow: hidden;
          transition: background 0.2s ease;
        }

        .sidebar-toggle:hover {
          background: rgba(255, 255, 255, 0.18);
        }

        .sidebar-toggle-symbol {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          font-size: 18px;
          font-weight: 600;
          line-height: 1;
          flex-shrink: 0;
        }

        .sidebar-toggle-text {
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }

        /* Collapsed sidebar toggle */

        .app-shell.is-collapsed .sidebar-toggle {
          width: 38px;
          height: 38px;
          margin: 12px auto 20px;
          padding: 0;
          justify-content: center;
        }

        .app-shell.is-collapsed .sidebar-toggle-text {
          display: none;
        }

        /* Hide old topbar */

        .app-topbar {
          display: none;
        }

        /* Mobile controls */

        .shell-mobile-menu {
          display: none;
        }

        .sidebar-mobile-close {
          display: none;
        }

        @media (max-width: 768px) {
          .sidebar-toggle {
            display: none !important;
          }

          .shell-mobile-menu {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            margin: 12px 16px;
            padding: 8px;
            position: relative;
            z-index: 2;
          }

          .shell-mobile-menu svg {
            width: 20px;
            height: 20px;
          }

          .sidebar-mobile-close {
            display: block;
            margin: 12px 14px 20px;
            padding: 10px 14px;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 10px;
            background: transparent;
            color: white;
            cursor: pointer;
          }
        }
      `}</style>

      {/* MOBILE BACKDROP */}
      <button
        type="button"
        className="shell-backdrop"
        aria-label="Close menu"
        onClick={() => setOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className="app-sidebar">

        {/* BRAND */}
        <div className="sidebar-brand">
          <span>Spa Therapist</span>
          <strong>
            {user?.role === "ADMIN"
              ? "Administration"
              : "Certification"}
          </strong>
        </div>

        {/* SMALL SIDEBAR TOGGLE */}
        <button
          type="button"
          className="sidebar-toggle desktop-only"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((value) => !value)}
        >
          <span className="sidebar-toggle-symbol">
            {collapsed ? "»" : "«"}
          </span>

          {!collapsed && (
            <span className="sidebar-toggle-text">
              Collapse Menu
            </span>
          )}
        </button>

        {/* MOBILE CLOSE */}
        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={() => setOpen(false)}
        >
          Close Menu ×
        </button>

        {/* NAVIGATION */}
        <nav aria-label="Primary">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end ?? link.to === "/dashboard"}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " is-active" : ""}`
              }
              onClick={() => setOpen(false)}
            >
              <Icon name={link.icon} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* LOGOUT */}
        <button
          type="button"
          className="sidebar-link sidebar-logout"
          onClick={signOut}
          disabled={leaving}
        >
          <Icon name="logout" />
          <span>
            {leaving ? "Signing out…" : "Logout"}
          </span>
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <div className="app-main">

        {/* MOBILE MENU */}
        <button
          type="button"
          className="shell-icon-button shell-mobile-menu"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Icon name="modules" />
        </button>

        {/* PAGES */}
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
