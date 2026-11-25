import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client.ts";
import { portalApi, when } from "../api/portal.ts";
import { MediaImage } from "../components/MediaImage.tsx";
import { useAuth } from "../context/useAuth.ts";

interface DashboardData {
  stats: { enrolled: number; in_progress: number; completed: number; certificates: number };
  continueLearning: Array<Record<string, unknown>>;
  activity: Array<Record<string, unknown>>;
  recommended: Array<Record<string, unknown>>;
}

const dashboardStyles = `
.ud-v6,.ud-v6 *{box-sizing:border-box}
.ud-v6{width:100%;min-width:0;padding:26px 28px 56px;color:#19392f;font:14px/1.55 Inter,"Segoe UI",Arial,sans-serif}
.ud-v6 h1,.ud-v6 h2,.ud-v6 h3,.ud-v6 p{font-family:inherit!important;margin:0;letter-spacing:normal}
.ud-v6 button,.ud-v6 a{font-family:inherit}
.ud-v6 .ud-top{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:25px;flex-wrap:wrap}
.ud-v6 .ud-kicker{font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#5b8976}
.ud-v6 .ud-title{font-size:30px!important;line-height:1.2!important;font-weight:800!important;letter-spacing:-.035em!important;color:#173e2e;margin:6px 0!important}
.ud-v6 .ud-muted{font-size:13px;color:#798c82}
.ud-v6 .ud-pill{background:#e8f3ec;color:#206348;border-radius:99px;padding:9px 14px;font-size:12px;font-weight:750}
.ud-v6 .ud-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-bottom:27px}
.ud-v6 .ud-stat{background:#fff;border:1px solid #e2eae4;border-radius:15px;padding:20px;min-width:0;box-shadow:0 4px 18px rgba(22,63,42,.025)}
.ud-v6 .ud-stat-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px}
.ud-v6 .ud-stat-label{font-size:12px;font-weight:650;color:#72877b}
.ud-v6 .ud-icon{width:39px;height:39px;border-radius:11px;background:#eaf4ed;color:#276a4c;display:grid;place-items:center;font-size:20px;flex-shrink:0}
.ud-v6 .ud-stat-value{font-size:29px;font-weight:800;line-height:1.15;color:#183e2d;font-variant-numeric:tabular-nums}
.ud-v6 .ud-stat-foot{font-size:11px;color:#95a49a;margin-top:8px}
.ud-v6 .ud-columns{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,1fr);gap:18px;margin-bottom:26px;align-items:start}
.ud-v6 .ud-panel{min-width:0;background:#fff;border:1px solid #e2eae4;border-radius:16px;overflow:hidden}
.ud-v6 .ud-panel-head{padding:20px 22px;border-bottom:1px solid #edf1ed;display:flex;justify-content:space-between;align-items:center;gap:12px}
.ud-v6 .ud-section-title{font-size:17px!important;font-weight:800!important;color:#1c4030}
.ud-v6 .ud-text-link{font-size:12px;font-weight:750;color:#22664b;text-decoration:none}
.ud-v6 .ud-text-link:hover{text-decoration:underline}
.ud-v6 .ud-empty{padding:35px 23px;text-align:center}
.ud-v6 .ud-empty-icon{width:48px;height:48px;margin:0 auto 13px;border-radius:14px;background:#eff6f0;color:#3e795c;display:grid;place-items:center;font-size:24px}
.ud-v6 .ud-empty h3{font-size:14px!important;font-weight:750!important;color:#264c39}
.ud-v6 .ud-empty p{font-size:12px;color:#82948a;margin-top:6px}
.ud-v6 .ud-action{display:inline-flex;justify-content:center;align-items:center;min-height:38px;padding:9px 15px;background:#18583f;border:1px solid #18583f;border-radius:9px;color:#fff!important;text-decoration:none;font-size:12px;font-weight:750;cursor:pointer;transition:background .15s}
.ud-v6 .ud-action:hover{background:#104730}
.ud-v6 .ud-action:disabled{opacity:.6;cursor:wait}
.ud-v6 .ud-empty .ud-action{margin-top:17px}
.ud-v6 .ud-learning-item{display:flex;gap:15px;padding:17px 21px;border-bottom:1px solid #edf1ed;align-items:center}
.ud-v6 .ud-learning-item:last-child{border-bottom:0}
.ud-v6 .ud-learning-media{width:96px;height:76px;border-radius:10px;overflow:hidden;background:linear-gradient(135deg,#e0d3bb,#2c5a49);flex-shrink:0}
.ud-v6 .ud-learning-media img{width:100%;height:100%;object-fit:cover}
.ud-v6 .ud-learning-body{min-width:0;flex:1}
.ud-v6 .ud-learning-body h3{font-size:14px!important;font-weight:750!important;color:#1d4030}
.ud-v6 .ud-learning-meta{font-size:11px;color:#84958a;margin-top:4px}
.ud-v6 .ud-progress{height:7px;border-radius:20px;background:#e8efe9;overflow:hidden;margin:10px 0 5px}
.ud-v6 .ud-progress span{display:block;height:100%;border-radius:20px;background:#2b815a}
.ud-v6 .ud-progress-label{font-size:11px;color:#397154;font-weight:750}
.ud-v6 .ud-activity{list-style:none;padding:0;margin:0}
.ud-v6 .ud-activity li{display:flex;gap:11px;padding:16px 20px;border-bottom:1px solid #edf1ed}
.ud-v6 .ud-activity li:last-child{border-bottom:0}
.ud-v6 .ud-activity-dot{width:32px;height:32px;border-radius:50%;background:#e8f5eb;display:grid;place-items:center;color:#2e7a50;font-weight:800;flex-shrink:0}
.ud-v6 .ud-activity strong{font-size:12px;color:#244b38;display:block}
.ud-v6 .ud-activity small{font-size:11px;color:#83968a;display:block;margin-top:4px}
.ud-v6 .ud-recs-heading{display:flex;justify-content:space-between;align-items:center;margin:0 0 15px;gap:12px}
.ud-v6 .ud-courses{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px}
.ud-v6 .ud-course{background:#fff;border:1px solid #e2eae4;border-radius:15px;overflow:hidden;min-width:0;display:flex;flex-direction:column}
.ud-v6 .ud-course-media{height:165px;background:linear-gradient(120deg,#d7c7ab,#2d604d);overflow:hidden}
.ud-v6 .ud-course-media img{width:100%;height:100%;object-fit:cover}
.ud-v6 .ud-course-body{padding:20px;display:flex;flex-direction:column;flex:1}
.ud-v6 .ud-category{font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#548671}
.ud-v6 .ud-course h3{font-size:17px!important;font-weight:800!important;color:#1d4030;margin:8px 0!important}
.ud-v6 .ud-description{font-size:12px;color:#71867b;line-height:1.65;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ud-v6 .ud-course-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:auto;padding-top:20px}
.ud-v6 .ud-duration{font-size:12px;color:#788b80}
.ud-v6 .ud-notice{padding:13px 16px;border-radius:10px;margin-bottom:17px;font-size:13px}
.ud-v6 .ud-error{background:#fff0f0;color:#a73535;border:1px solid #f2cece}
.ud-v6 .ud-success{background:#eaf6ee;color:#206444;border:1px solid #cce6d4}
.ud-v6 .ud-skeleton{padding:40px;color:#7c9084;text-align:center}
@media(max-width:1100px){.ud-v6 .ud-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ud-v6 .ud-columns{grid-template-columns:1fr}}
@media(max-width:650px){.ud-v6{padding:18px 14px 38px}.ud-v6 .ud-title{font-size:25px!important}.ud-v6 .ud-courses{grid-template-columns:1fr}.ud-v6 .ud-stat{padding:16px}.ud-v6 .ud-panel-head{padding:16px}.ud-v6 .ud-learning-item{padding:14px;align-items:flex-start}.ud-v6 .ud-learning-media{width:75px;height:68px}}
@media(max-width:390px){.ud-v6 .ud-stats{grid-template-columns:1fr}}
`;

const text = (value: unknown, fallback = "") => value == null ? fallback : String(value);
const percentage = (value: unknown) => Math.max(0, Math.min(100, Number(value) || 0));

export function UserDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
   const courseIds = user?.courseIds ?? [];

     console.log("Dashboard User ID:", user?.id);
  console.log("Dashboard Course IDs:", courseIds);


useEffect(() => {
  let mounted = true;

  portalApi.dashboard()
    .then((response) => {
      if (!mounted) return;

      const dashboardData = response.data as unknown as DashboardData;

      const selectedIds = new Set(
        (user?.courseIds ?? []).map(String)
      );

      const filteredData: DashboardData = {
        ...dashboardData,

        continueLearning: dashboardData.continueLearning.filter(
          (course) => selectedIds.has(String(course.course_id))
        ),

        activity: dashboardData.activity.filter(
          (item) => selectedIds.has(String(item.course_id))
        ),

        recommended: dashboardData.recommended.filter(
          (course) => selectedIds.has(String(course.id))
        ),
      };

      console.log("Filtered Dashboard Data:", filteredData);

      setData(filteredData);
    })
    .catch((caught) => {
      if (mounted) {
        setError(
          caught instanceof ApiError
            ? caught.message
            : "The dashboard could not be loaded."
        );
      }
    });

  return () => {
    mounted = false;
  };
}, [user?.id, user?.courseIds]);

async function enroll(courseId: string) {
  setError("");
  setMessage("");
  setEnrollingId(courseId);

  try {
    await portalApi.enroll(courseId);

    setMessage("Enrollment successful! Open My Learning to begin.");

    const response = await portalApi.dashboard();
    const dashboardData = response.data as unknown as DashboardData;

    const selectedIds = new Set(
      (user?.courseIds ?? []).map(String)
    );

    const filteredData: DashboardData = {
      ...dashboardData,

      continueLearning: dashboardData.continueLearning.filter(
        (course) => selectedIds.has(String(course.course_id))
      ),

      activity: dashboardData.activity.filter(
        (item) => selectedIds.has(String(item.course_id))
      ),

      recommended: dashboardData.recommended.filter(
        (course) => selectedIds.has(String(course.id))
      ),
    };

    setData(filteredData);

  } catch (caught) {
    setError(
      caught instanceof ApiError
        ? caught.message
        : "Enrollment failed."
    );
  } finally {
    setEnrollingId(null);
  }
}

  const stats = data ? [
    { label: "Enrolled Courses", value: data.stats.enrolled, icon: "▤", note: "Courses you have joined" },
    { label: "In Progress", value: data.stats.in_progress, icon: "◷", note: "Keep learning" },
    { label: "Completed Courses", value: data.stats.completed, icon: "✓", note: "Learning milestones" },
    { label: "Certificates Earned", value: data.stats.certificates, icon: "✧", note: "Your achievements" },
  ] : [];

  return (
    <section className="ud-v6">
      <style>{dashboardStyles}</style>
      <header className="ud-top">
        <div>
          <p className="ud-kicker">Iris Wellness · Learning Space</p>
          <h1 className="ud-title">Welcome back, {user?.name || "Therapist"}</h1>
          <p className="ud-muted">Track your training, continue learning, and earn certifications.</p>
        </div>
        <span className="ud-pill">Therapist Dashboard</span>
      </header>

      {error && <div className="ud-notice ud-error" role="alert">{error}</div>}
      {message && <div className="ud-notice ud-success" role="status">{message}</div>}
      {!data ? (
        <div className="ud-panel ud-skeleton">{error ? "Dashboard data is unavailable." : "Loading your dashboard..."}</div>
      ) : (
        <>
          <div className="ud-stats">
            {stats.map((stat) => (
              <article className="ud-stat" key={stat.label}>
                <div className="ud-stat-head"><span className="ud-stat-label">{stat.label}</span><span className="ud-icon" aria-hidden="true">{stat.icon}</span></div>
                <strong className="ud-stat-value">{stat.value}</strong>
                <p className="ud-stat-foot">{stat.note}</p>
              </article>
            ))}
          </div>

          <div className="ud-columns">
            <section className="ud-panel">
              <div className="ud-panel-head"><h2 className="ud-section-title">Continue Learning</h2><Link className="ud-text-link" to="/my-learning">My Learning →</Link></div>
              {data.continueLearning.length === 0 ? (
                <div className="ud-empty"><div className="ud-empty-icon" aria-hidden="true">▤</div><h3>No courses in progress</h3><p>Enroll in a recommended course to begin your learning journey.</p><a className="ud-action" href="#recommended-courses">Explore Courses</a></div>
              ) : data.continueLearning.map((course) => (
                <article className="ud-learning-item" key={text(course.course_id)}>
                  <div className="ud-learning-media"><MediaImage file={course.thumbnail as string | null} alt={text(course.title)} /></div>
                  <div className="ud-learning-body">
                    <h3>{text(course.title)}</h3>
                    <p className="ud-learning-meta">{text(course.duration_minutes, "0")} min · {text(course.status).replaceAll("_", " ")}</p>
                    <div className="ud-progress" role="progressbar" aria-label={`${text(course.title)} progress`} aria-valuenow={percentage(course.progress_percent)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percentage(course.progress_percent)}%` }} /></div>
                    <span className="ud-progress-label">{percentage(course.progress_percent)}% completed</span>
                    <div style={{ marginTop: 10 }}><Link className="ud-text-link" to={`/learning/${course.course_id}`}>Continue course →</Link></div>
                  </div>
                </article>
              ))}
            </section>

            <section className="ud-panel">
              <div className="ud-panel-head"><h2 className="ud-section-title">Recent Activity</h2></div>
              {data.activity.length === 0 ? (
                <div className="ud-empty"><div className="ud-empty-icon" aria-hidden="true">◷</div><h3>No activity yet</h3><p>Your completed lessons and learning milestones will appear here.</p></div>
              ) : (
                <ul className="ud-activity">
                  {data.activity.map((item, index) => (
                    <li key={`${text(item.lesson_title)}-${index}`}><span className="ud-activity-dot" aria-hidden="true">✓</span><div><strong>{text(item.lesson_title)}</strong><small>{text(item.course_title)} · {item.completed_at ? when(item.completed_at) : ""}</small></div></li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section id="recommended-courses">
            <div className="ud-recs-heading"><h2 className="ud-section-title">Recommended Courses</h2><span className="ud-muted">Explore your next certification</span></div>
            {data.recommended.length === 0 ? (
              <div className="ud-panel"><div className="ud-empty"><div className="ud-empty-icon" aria-hidden="true">✧</div><h3>No new courses available</h3><p>Published courses you have not enrolled in will appear here.</p></div></div>
            ) : (
              <div className="ud-courses">
                {data.recommended.map((course) => (
                  <article className="ud-course" key={text(course.id)}>
                    <div className="ud-course-media"><MediaImage file={course.thumbnail as string | null} alt={text(course.title)} /></div>
                    <div className="ud-course-body">
                      <p className="ud-category">{text(course.category_name, "Therapy")} · {text(course.level, "Beginner")}</p>
                      <h3>{text(course.title)}</h3>
                      <p className="ud-description">{text(course.description, "Explore this professional training course.")}</p>
                      <div className="ud-course-footer"><span className="ud-duration">◷ {text(course.duration_minutes, "0")} min</span><button type="button" className="ud-action" disabled={enrollingId !== null} onClick={() => enroll(text(course.id))}>{enrollingId === text(course.id) ? "Enrolling..." : "Enroll Now →"}</button></div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
