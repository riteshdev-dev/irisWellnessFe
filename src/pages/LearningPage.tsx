import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client.ts";
import { portalApi, when } from "../api/portal.ts";
import { MediaImage } from "../components/MediaImage.tsx";

const filters = [
  ["", "All courses"],
  ["not_started", "Not started"],
  ["in_progress", "In progress"],
  ["completed", "Completed"],
] as const;

type LearningCourse = Record<string, unknown>;
const asText = (value: unknown, fallback = "") => value == null ? fallback : String(value);
const asNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const progressOf = (value: unknown) => Math.max(0, Math.min(100, asNumber(value)));

const styles = `
.ml-page,.ml-page *{box-sizing:border-box}
.ml-page{width:100%;min-width:0;padding:28px 30px 65px;color:#183d30;font-family:Inter,"Segoe UI",Arial,sans-serif;font-size:14px;line-height:1.5}
.ml-page h1,.ml-page h2,.ml-page h3,.ml-page p{font-family:inherit!important;letter-spacing:normal;margin:0}
.ml-page button,.ml-page input,.ml-page a{font-family:inherit}
.ml-page .ml-header{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:24px}
.ml-page .ml-eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;color:#5b8a74;text-transform:uppercase;margin-bottom:7px}
.ml-page .ml-title{font-size:31px!important;line-height:1.2!important;font-weight:800!important;letter-spacing:-.03em!important;color:#173d2e}
.ml-page .ml-subtitle{margin-top:8px;color:#788b80;font-size:13px}
.ml-page .ml-count{padding:9px 15px;border:1px solid #dbe8df;background:#eaf4ed;border-radius:999px;color:#236347;font-weight:700;font-size:12px}
.ml-page .ml-toolbar{background:#fff;border:1px solid #e0e9e2;border-radius:16px;padding:19px 21px;margin-bottom:23px;box-shadow:0 5px 22px rgba(22,63,42,.025)}
.ml-page .ml-search-wrap{position:relative;margin-bottom:17px}
.ml-page .ml-search-icon{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:#719383;font-size:19px;pointer-events:none}
.ml-page .ml-search{display:block;width:100%;height:46px;border:1px solid #dbe6df;border-radius:10px;padding:0 15px 0 45px;background:#fff;color:#173d2e;font-size:13px;outline:none;transition:border-color .15s,box-shadow .15s}
.ml-page .ml-search:focus{border-color:#317a59;box-shadow:0 0 0 3px rgba(49,122,89,.1)}
.ml-page .ml-search::placeholder{color:#98a69d}
.ml-page .ml-filters{display:flex;gap:9px;flex-wrap:wrap}
.ml-page .ml-filter{border:1px solid #dfe8e0;background:#fff;border-radius:9px;padding:9px 15px;color:#647e70;font-size:12px;font-weight:700;cursor:pointer;transition:.15s}
.ml-page .ml-filter:hover{border-color:#91b7a1;color:#225d44}
.ml-page .ml-filter.active{background:#195740;border-color:#195740;color:white}
.ml-page .ml-list-heading{display:flex;align-items:center;justify-content:space-between;gap:15px;margin:0 0 15px}
.ml-page .ml-section-title{font-size:17px!important;font-weight:800!important;color:#1a4030}
.ml-page .ml-result-count{font-size:12px;color:#819287}
.ml-page .ml-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.ml-page .ml-card{min-width:0;background:#fff;border:1px solid #e0e9e2;border-radius:16px;overflow:hidden;box-shadow:0 5px 20px rgba(20,60,40,.025);display:flex;flex-direction:column}
.ml-page .ml-image{height:180px;position:relative;overflow:hidden;background:linear-gradient(120deg,#d9c8aa,#315e4d)}
.ml-page .ml-image img{width:100%;height:100%;object-fit:cover;display:block}
.ml-page .ml-status{position:absolute;top:14px;right:14px;padding:7px 11px;border-radius:999px;background:#fff;color:#2b674c;font-size:11px;font-weight:800;box-shadow:0 2px 9px rgba(0,0,0,.08);text-transform:capitalize}
.ml-page .ml-status.completed{color:#197044;background:#e7f7ec}
.ml-page .ml-status.in_progress{color:#936010;background:#fff4df}
.ml-page .ml-card-body{padding:21px;display:flex;flex-direction:column;flex:1}
.ml-page .ml-card-title{font-size:18px!important;line-height:1.35!important;font-weight:800!important;color:#1a3f30}
.ml-page .ml-enrolled{font-size:12px;color:#84958a;margin-top:7px}
.ml-page .ml-progress-head{display:flex;justify-content:space-between;gap:12px;margin-top:22px;font-size:12px;font-weight:700;color:#557763}
.ml-page .ml-percent{color:#206747}
.ml-page .ml-progress-track{height:8px;background:#e9f0eb;border-radius:99px;overflow:hidden;margin:9px 0 8px}
.ml-page .ml-progress-fill{display:block;height:100%;background:#2c855e;border-radius:99px;transition:width .2s}
.ml-page .ml-lessons{font-size:12px;color:#87978c}
.ml-page .ml-card-bottom{display:flex;align-items:center;justify-content:space-between;gap:14px;border-top:1px solid #edf1ed;margin-top:20px;padding-top:17px}
.ml-page .ml-small-label{font-size:11px;color:#829487}
.ml-page .ml-button{display:inline-flex;align-items:center;justify-content:center;text-align:center;text-decoration:none!important;border:1px solid #195740;border-radius:9px;background:#195740;color:white!important;padding:10px 16px;min-height:40px;font-size:12px;font-weight:800;transition:background .15s}
.ml-page .ml-button:hover{background:#104631}
.ml-page .ml-empty{background:#fff;border:1px solid #e0e9e2;border-radius:17px;text-align:center;padding:58px 20px;max-width:100%}
.ml-page .ml-empty-icon{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 16px;border-radius:18px;background:#edf5ef;color:#2a7554;font-size:30px}
.ml-page .ml-empty h2{font-size:19px!important;font-weight:800!important;color:#234b37}
.ml-page .ml-empty p{max-width:430px;margin:9px auto 21px;font-size:13px;color:#829388;line-height:1.7}
.ml-page .ml-notice{padding:14px 16px;border-radius:10px;margin-bottom:18px;background:#fff0f0;border:1px solid #f2cdcd;color:#a33535;font-size:13px}
.ml-page .ml-loading{background:#fff;border:1px solid #e0e9e2;border-radius:16px;padding:45px;text-align:center;color:#718a7a}
@media(max-width:1050px){.ml-page .ml-grid{grid-template-columns:1fr}}
@media(max-width:650px){.ml-page{padding:18px 14px 42px}.ml-page .ml-title{font-size:26px!important}.ml-page .ml-toolbar{padding:15px}.ml-page .ml-card-body{padding:17px}.ml-page .ml-card-bottom{align-items:flex-start;flex-direction:column}.ml-page .ml-button{width:100%}.ml-page .ml-image{height:160px}}
`;

export function LearningPage() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<LearningCourse[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setItems(null);
    setError("");
    portalApi.learning(status || undefined, q || undefined)
      .then((response) => {
        if (active) setItems(response.data?.items ?? []);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : "Courses could not be loaded.");
      });
    return () => { active = false; };
  }, [status, q]);

  return (
    <section className="ml-page">
      <style>{styles}</style>
      <header className="ml-header">
        <div>
          <p className="ml-eyebrow">Your learning journey</p>
          <h1 className="ml-title">My Learning</h1>
          <p className="ml-subtitle">Manage your courses, track progress, and continue your training.</p>
        </div>
        <span className="ml-count">Your courses</span>
      </header>

      <div className="ml-toolbar">
        <div className="ml-search-wrap">
          <span className="ml-search-icon" aria-hidden="true">⌕</span>
          <input
            className="ml-search"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search your enrolled courses..."
            aria-label="Search courses"
          />
        </div>
        <div className="ml-filters" aria-label="Filter courses by progress">
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`ml-filter${status === value ? " active" : ""}`}
              onClick={() => setStatus(value)}
              aria-pressed={status === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="ml-notice" role="alert">{error}</div>}
      {items === null && !error ? (
        <div className="ml-loading" role="status">Loading your courses...</div>
      ) : items !== null && items.length > 0 ? (
        <>
          <div className="ml-list-heading">
            <h2 className="ml-section-title">Enrolled Courses</h2>
            <span className="ml-result-count">{items.length} {items.length === 1 ? "course" : "courses"} found</span>
          </div>
          <div className="ml-grid">
            {items.map((course) => {
              const progress = progressOf(course.progress_percent);
              const currentStatus = asText(course.status, "not_started");
              const courseId = asText(course.course_id ?? course.id);
              return (
                <article className="ml-card" key={asText(course.id ?? course.course_id)}>
                  <div className="ml-image">
                    <MediaImage file={course.thumbnail as string | null} alt={asText(course.title)} />
                    <span className={`ml-status ${currentStatus}`}>
                      {currentStatus.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="ml-card-body">
                    <h3 className="ml-card-title">{asText(course.title, "Untitled course")}</h3>
                    <p className="ml-enrolled">Enrolled {course.enrolled_at ? when(course.enrolled_at) : "recently"}</p>
                    <div className="ml-progress-head">
                      <span>Course progress</span>
                      <span className="ml-percent">{progress}%</span>
                    </div>
                    <div className="ml-progress-track" role="progressbar" aria-label={`${asText(course.title)} progress`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                      <span className="ml-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="ml-lessons">{asNumber(course.completed_lessons)} of {asNumber(course.total_lessons)} lessons completed</p>
                    <div className="ml-card-bottom">
                      <span className="ml-small-label">{progress === 100 ? "Course completed" : "Keep moving forward"}</span>
                      <Link className="ml-button" to={`/learning/${courseId}`}>
                        {progress === 100 ? "View Course →" : progress > 0 ? "Continue Learning →" : "Start Learning →"}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : !error ? (
        <div className="ml-empty">
          <div className="ml-empty-icon" aria-hidden="true">▤</div>
          <h2>{q || status ? "No matching courses" : "Your learning journey starts here"}</h2>
          <p>
            {q || status
              ? "No enrolled courses match your search or selected filter. Try another search or view all courses."
              : "You haven't enrolled in any courses yet. Explore available therapy courses from your dashboard and begin learning."}
          </p>
          {q || status ? (
            <button type="button" className="ml-button" onClick={() => { setQ(""); setStatus(""); }}>Clear Filters</button>
          ) : (
            <Link to="/dashboard" className="ml-button">Explore Courses →</Link>
          )}
        </div>
      ) : null}
    </section>
  );
}
