
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client.ts";
import { portalApi, when } from "../api/portal.ts";
import { Notice } from "../components/ui.tsx";

type Row = Record<string, unknown>;

interface DashboardData {
  cards: Record<string, number>;
  registrations: Row[];
  enrollments: Row[];
  completions: Row[];
  coursePerformance: Row[];
  assessmentPerformance: Row[];
}

const statConfig = [
  { key: "therapists", label: "Total Users", icon: "👥" },
  { key: "courses", label: "Total Courses", icon: "📚" },
  { key: "published_courses", label: "Published Courses", icon: "📖" },
  { key: "enrollments", label: "Total Enrollments", icon: "🎓" },
  { key: "active_learners", label: "Active Learners", icon: "📈" },
  { key: "completed_courses", label: "Completed Courses", icon: "✅" },
  { key: "assessments_completed", label: "Assessments Completed", icon: "📝" },
  { key: "certificates_issued", label: "Certificates Issued", icon: "🏅" },
];

export function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await portalApi.adminDashboard();
      setData(response.data as unknown as DashboardData);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "The dashboard could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <section className="shell-page admin-dashboard">
      <style>{`
        .admin-dashboard {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          color: #183c34;
        }

        .admin-dashboard *,
        .admin-dashboard *::before,
        .admin-dashboard *::after {
          box-sizing: border-box;
        }

        .admin-dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .admin-dashboard-kicker {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.6px;
          color: #5a897a;
          text-transform: uppercase;
          margin: 0 0 8px;
        }

        .admin-dashboard-title {
          font-family: inherit;
          font-size: clamp(25px, 3vw, 32px);
          font-weight: 750;
          line-height: 1.2;
          color: #173d33;
          margin: 0;
        }

        .admin-dashboard-subtitle {
          color: #758680;
          font-size: 13px;
          margin: 9px 0 0;
        }

        .admin-dashboard-refresh {
          border: 1px solid #d7e5de;
          background: #fff;
          color: #174d3e;
          border-radius: 9px;
          padding: 11px 17px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-dashboard-refresh:hover {
          background: #edf6f1;
        }

        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 30px;
        }

        .admin-stat-card {
          background: #fff;
          border: 1px solid #e1eae4;
          border-radius: 15px;
          padding: 20px;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-height: 120px;
        }

        .admin-stat-label {
          color: #71827b;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .4px;
          line-height: 1.5;
        }

        .admin-stat-value {
          display: block;
          font-size: 29px;
          font-weight: 750;
          color: #173d33;
          margin-top: 10px;
          line-height: 1.2;
        }

        .admin-stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 43px;
          height: 43px;
          background: #edf5ef;
          border-radius: 12px;
          font-size: 20px;
          flex-shrink: 0;
        }

        .admin-section-heading {
          font-size: 19px;
          font-weight: 750;
          margin: 0 0 16px;
          color: #173d33;
        }

        .admin-activity-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 30px;
        }

        .admin-panel {
          background: #fff;
          border: 1px solid #e1eae4;
          border-radius: 15px;
          overflow: hidden;
          min-width: 0;
        }

        .admin-panel-header {
          padding: 20px;
          border-bottom: 1px solid #edf0ed;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .admin-panel-title {
          font-size: 15px;
          font-weight: 750;
          color: #173d33;
          margin: 0;
        }

        .admin-panel-count {
          background: #eaf4ee;
          color: #24674e;
          border-radius: 20px;
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 700;
        }

        .admin-record-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .admin-record-item {
          padding: 14px 20px;
          border-bottom: 1px solid #f0f2ef;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .admin-record-item:last-child {
          border-bottom: none;
        }

        .admin-record-avatar {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e8f2ec;
          color: #23634f;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-record-info {
          min-width: 0;
          flex: 1;
        }

        .admin-record-name {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #233e36;
          overflow-wrap: anywhere;
        }

        .admin-record-detail {
          display: block;
          font-size: 11px;
          color: #83928b;
          margin-top: 4px;
          overflow-wrap: anywhere;
        }

        .admin-performance-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 25px;
        }

        .admin-table-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .admin-performance-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 12px;
        }

        .admin-performance-table th {
          padding: 15px 18px;
          background: #f8faf8;
          color: #71837b;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .5px;
          font-weight: 750;
          white-space: nowrap;
        }

        .admin-performance-table td {
          padding: 15px 18px;
          border-top: 1px solid #edf0ed;
          color: #26463a;
          overflow-wrap: anywhere;
        }

        .admin-performance-table td:not(:first-child) {
          font-weight: 750;
        }

        .admin-dashboard-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 22px;
        }

        .admin-reports-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #174d3e;
          color: #fff;
          border-radius: 9px;
          padding: 12px 20px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }

        .admin-reports-button:hover {
          background: #10392e;
          color: #fff;
        }

        .admin-empty {
          padding: 22px;
          color: #85938b;
          font-size: 12px;
        }

        @media (max-width: 1150px) {
          .admin-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-activity-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 850px) {
          .admin-performance-grid,
          .admin-activity-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 550px) {
          .admin-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .admin-stat-card {
            padding: 14px;
            min-height: 100px;
          }

          .admin-stat-value {
            font-size: 24px;
          }

          .admin-stat-icon {
            width: 32px;
            height: 32px;
            font-size: 15px;
          }

          .admin-dashboard-header {
            align-items: flex-start;
          }
        }
      `}</style>

      <header className="admin-dashboard-header">
        <div>
          <p className="admin-dashboard-kicker">
            Administration Overview
          </p>
          <h1 className="admin-dashboard-title">
            Admin Dashboard
          </h1>
          <p className="admin-dashboard-subtitle">
            Monitor your therapists, courses, enrollments and certifications.
          </p>
        </div>

        <button
          type="button"
          className="admin-dashboard-refresh"
          onClick={loadDashboard}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </header>

      {error && <Notice tone="error">{error}</Notice>}

      {loading && !data ? (
        <div className="shell-skeleton" />
      ) : data ? (
        <>
          {/* STATISTICS */}
          <div className="admin-stats-grid">
            {statConfig.map((stat) => (
              <article key={stat.key} className="admin-stat-card">
                <div>
                  <span className="admin-stat-label">
                    {stat.label}
                  </span>
                  <strong className="admin-stat-value">
                    {Number(data.cards?.[stat.key] ?? 0).toLocaleString()}
                  </strong>
                </div>
                <div className="admin-stat-icon" aria-hidden="true">
                  {stat.icon}
                </div>
              </article>
            ))}
          </div>

          {/* RECENT ACTIVITY */}
          <h2 className="admin-section-heading">
            Recent Activity
          </h2>

          <div className="admin-activity-grid">
            <ActivityPanel
              title="Recent Registrations"
              rows={data.registrations ?? []}
              nameKey="name"
              detailKey="created_at"
              formatDetail={(value) => when(value)}
            />

            <ActivityPanel
              title="Recent Enrollments"
              rows={data.enrollments ?? []}
              nameKey="user_name"
              detailKey="course_title"
            />

            <ActivityPanel
              title="Recent Completions"
              rows={data.completions ?? []}
              nameKey="user_name"
              detailKey="course_title"
            />
          </div>

          {/* PERFORMANCE */}
          <h2 className="admin-section-heading">
            Performance Overview
          </h2>

          <div className="admin-performance-grid">
            <PerformancePanel
              title="Course Performance"
              rows={data.coursePerformance ?? []}
              firstLabel="Enrollments"
              secondLabel="Completed"
              firstKey="enrollments"
              secondKey="completed"
            />

            <PerformancePanel
              title="Assessment Performance"
              rows={data.assessmentPerformance ?? []}
              firstLabel="Submitted"
              secondLabel="Passed"
              firstKey="submitted"
              secondKey="passed"
            />
          </div>

          <div className="admin-dashboard-footer">
            <Link
              className="admin-reports-button"
              to="/admin/reports"
            >
              View Detailed Reports →
            </Link>
          </div>
        </>
      ) : null}
    </section>
  );
}

function ActivityPanel({
  title,
  rows,
  nameKey,
  detailKey,
  formatDetail,
}: {
  title: string;
  rows: Row[];
  nameKey: string;
  detailKey: string;
  formatDetail?: (value: unknown) => string;
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <h3 className="admin-panel-title">{title}</h3>
        <span className="admin-panel-count">
          {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="admin-empty">
          No recent activity available.
        </div>
      ) : (
        <ul className="admin-record-list">
          {rows.map((row, index) => {
            const name = String(row[nameKey] ?? "Unknown");
            const detail = formatDetail
              ? formatDetail(row[detailKey])
              : String(row[detailKey] ?? "");

            return (
              <li
                key={`${String(row.id ?? index)}-${index}`}
                className="admin-record-item"
              >
                <span className="admin-record-avatar">
                  {name.charAt(0).toUpperCase()}
                </span>

                <div className="admin-record-info">
                  <strong className="admin-record-name">
                    {name}
                  </strong>
                  <span className="admin-record-detail">
                    {detail}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function PerformancePanel({
  title,
  rows,
  firstLabel,
  secondLabel,
  firstKey,
  secondKey,
}: {
  title: string;
  rows: Row[];
  firstLabel: string;
  secondLabel: string;
  firstKey: string;
  secondKey: string;
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <h3 className="admin-panel-title">{title}</h3>
      </div>

      {rows.length === 0 ? (
        <div className="admin-empty">
          No performance records available.
        </div>
      ) : (
        <div className="admin-table-scroll">
          <table className="admin-performance-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>{firstLabel}</th>
                <th>{secondLabel}</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={String(row.id ?? index)}>
                  <td>{String(row.title ?? "Untitled")}</td>
                  <td>{String(row[firstKey] ?? 0)}</td>
                  <td>{String(row[secondKey] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
