import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client.ts";
import { portalApi } from "../api/portal.ts";
import { Notice } from "../components/ui.tsx";

const filters = ["Available", "Pending", "Completed", "Passed", "Failed"] as const;
type Filter = (typeof filters)[number];

interface AssessmentItem {
  id: string;
  title: string;
  courseTitle: string;
  passingPercentage: number;
  durationMinutes: number | null;
  maxAttempts: number;
  attemptsUsed: number;
  passed: boolean;
  bestPercentage: number | null;
  unlocked: boolean;
  openAttemptId: string | null;
}

function matches(item: AssessmentItem, filter: Filter) {
  if (filter === "Available") return item.unlocked && !item.passed;
  if (filter === "Pending") return item.unlocked && !item.passed && (item.attemptsUsed === 0 || Boolean(item.openAttemptId));
  if (filter === "Completed") return item.attemptsUsed > 0;
  if (filter === "Passed") return item.passed;
  return item.attemptsUsed > 0 && !item.passed;
}

const styles = `
.assessments-modern { width: 100%; max-width: 1180px; margin: 0 auto; padding: 24px 8px 70px; color: #153b33; font-family: inherit; box-sizing: border-box; }
.assessments-modern *, .assessments-modern *::before, .assessments-modern *::after { box-sizing: border-box; }
.assessments-modern .am-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-bottom: 28px; }
.assessments-modern .am-kicker { margin: 0 0 9px; color: #638d80; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
.assessments-modern .am-heading h1 { margin: 0; color: #113b30; font-size: clamp(28px, 3vw, 36px); font-family: inherit; font-weight: 800; line-height: 1.2; letter-spacing: -.8px; }
.assessments-modern .am-subtitle { margin: 10px 0 0; color: #778781; font-size: 13px; line-height: 1.6; }
.assessments-modern .am-count { flex-shrink: 0; padding: 10px 16px; background: #eaf4ee; border: 1px solid #d5e9df; border-radius: 40px; color: #24664d; font-size: 12px; font-weight: 700; }
.assessments-modern .am-panel { background: #fff; border: 1px solid #e1e9e4; border-radius: 18px; padding: 22px; box-shadow: 0 7px 28px rgba(21,59,51,.035); }
.assessments-modern .am-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
.assessments-modern .am-filter { border: 1px solid #dde8e0; background: #f8faf8; color: #49665c; border-radius: 10px; padding: 11px 18px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; transition: .18s ease; }
.assessments-modern .am-filter:hover { border-color: #9bbdab; background: #f0f7f2; }
.assessments-modern .am-filter.active { background: #164c3b; color: white; border-color: #164c3b; }
.assessments-modern .am-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 18px; }
.assessments-modern .am-card { min-width: 0; border: 1px solid #e1e9e4; border-radius: 15px; padding: 22px; background: #fff; }
.assessments-modern .am-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.assessments-modern .am-course { margin: 0 0 9px; color: #6b9b82; font-size: 11px; font-weight: 800; letter-spacing: 1.1px; text-transform: uppercase; }
.assessments-modern .am-card h3 { margin: 0; font-size: 19px; font-weight: 800; color: #183f33; overflow-wrap: anywhere; }
.assessments-modern .am-badge { flex-shrink: 0; background: #e9f5ed; color: #26704d; padding: 6px 10px; border-radius: 40px; font-size: 11px; font-weight: 800; }
.assessments-modern .am-badge.failed { background: #fff0eb; color: #b24c32; }
.assessments-modern .am-badge.retake { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.assessments-modern .am-badge.locked { background: #f1f3f2; color: #6f7a75; }
.assessments-modern .am-metrics { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; margin: 22px 0; }
.assessments-modern .am-metric { background: #f6f9f6; border-radius: 10px; padding: 13px; min-width: 0; }
.assessments-modern .am-metric small { display: block; color: #7b8c83; font-size: 11px; margin-bottom: 6px; }
.assessments-modern .am-metric strong { display: block; color: #21483a; font-size: 15px; font-weight: 800; }
.assessments-modern .am-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.assessments-modern .am-button { display: inline-flex; justify-content: center; align-items: center; min-height: 42px; padding: 10px 16px; background: #164c3b; color: white; border: 1px solid #164c3b; border-radius: 10px; font: inherit; font-size: 12px; font-weight: 750; text-decoration: none; cursor: pointer; }
.assessments-modern .am-button.secondary { color: #164c3b; background: #fff; border-color: #cbded1; }
.assessments-modern .am-button:hover { filter: brightness(.94); }
.assessments-modern .am-empty { text-align: center; padding: 60px 20px; background: #fbfcfa; border: 1px dashed #cfdfd4; border-radius: 14px; }
.assessments-modern .am-empty-icon { display: grid; place-items: center; width: 62px; height: 62px; margin: 0 auto 18px; border-radius: 18px; background: #e8f3eb; color: #245c45; font-size: 27px; }
.assessments-modern .am-empty h2 { margin: 0 0 9px; font-family: inherit; font-size: 20px; font-weight: 800; }
.assessments-modern .am-empty p { max-width: 440px; margin: 0 auto 20px; color: #79877f; font-size: 13px; line-height: 1.7; }
.assessments-modern .am-results { margin-top: 25px; background: white; border: 1px solid #e1e9e4; border-radius: 16px; padding: 20px; }
.assessments-modern .am-results-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.assessments-modern .am-results h2 { margin: 0; font-family: inherit; font-size: 19px; font-weight: 800; }
.assessments-modern .am-table-scroll { width: 100%; overflow-x: auto; }
.assessments-modern .am-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 490px; }
.assessments-modern .am-table th { padding: 13px 12px; background: #f5f8f5; color: #6d8176; font-size: 11px; text-transform: uppercase; letter-spacing: .6px; }
.assessments-modern .am-table td { padding: 15px 12px; border-bottom: 1px solid #edf1ed; font-size: 13px; color: #29483c; }
.assessments-modern .am-loading { padding: 35px; color: #6f8178; text-align: center; }
@media (max-width: 760px) { .assessments-modern { padding: 16px 0 40px; } .assessments-modern .am-heading { align-items: flex-start; flex-direction: column; } .assessments-modern .am-panel { padding: 15px; } .assessments-modern .am-grid { grid-template-columns: 1fr; } .assessments-modern .am-filter { padding: 9px 12px; } }
@media (max-width: 400px) { .assessments-modern .am-metrics { grid-template-columns: 1fr 1fr; gap: 7px; } .assessments-modern .am-metric { padding: 10px; } }
`;

export function AssessmentsPage() {
  const [filter, setFilter] = useState<Filter>("Available");
  const [items, setItems] = useState<AssessmentItem[] | null>(null);
  const [results, setResults] = useState<Array<Record<string, unknown>>>([]);
  const [selected, setSelected] = useState("");
  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    portalApi.assessments()
      .then((response) => { if (active) setItems((response.data?.items ?? []) as unknown as AssessmentItem[]); })
      .catch((caught) => { if (active) { setItems([]); setError(caught instanceof ApiError ? caught.message : "Assessments could not be loaded."); } });
    return () => { active = false; };
  }, []);

  async function showResults(id: string) {
    setSelected(id);
    setResults([]);
    setResultsLoading(true);
    setError("");
    try {
      const response = await portalApi.results(id);
      setResults(response.data?.items ?? []);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Results could not be loaded.");
    } finally {
      setResultsLoading(false);
    }
  }

  const visible = (items ?? []).filter((item) => matches(item, filter));
  const availableCount = (items ?? []).filter((item) => matches(item, "Available")).length;

  return (
    <section className="assessments-modern">
      <style>{styles}</style>
      <header className="am-heading">
        <div>
          <p className="am-kicker">Learning / Examinations</p>
          <h1>My Assessments</h1>
          <p className="am-subtitle">Track your exams, view results and take the next step toward certification.</p>
        </div>
        <span className="am-count">{availableCount} Available</span>
      </header>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="am-panel">
        <nav className="am-filters" aria-label="Assessment filters">
          {filters.map((item) => (
            <button key={item} type="button" aria-pressed={filter === item} className={`am-filter${filter === item ? " active" : ""}`} onClick={() => { setFilter(item); setSelected(""); }}>
              {item}
            </button>
          ))}
        </nav>

        {!items ? (
          <div className="am-loading">Loading assessments…</div>
        ) : visible.length === 0 ? (
          <div className="am-empty">
            <div className="am-empty-icon" aria-hidden="true">✓</div>
            <h2>No {filter.toLowerCase()} assessments</h2>
            <p>{filter === "Available" || filter === "Pending" ? "Complete the required lessons in your enrolled courses to unlock assessments." : `You don't have any ${filter.toLowerCase()} assessments yet.`}</p>
            <Link className="am-button" to="/learning">Go to My Learning</Link>
          </div>
        ) : (
          <div className="am-grid">
            {visible.map((item) => {
              const remaining = Math.max(0, item.maxAttempts - item.attemptsUsed);
              const canStart = item.unlocked && !item.passed;
              const isRetake = item.attemptsUsed > 0 && !item.passed;
              return (
                <article key={item.id} className="am-card">
                  <div className="am-card-top">
                    <div>
                      <p className="am-course">{item.courseTitle}</p>
                      <h3>{item.title}</h3>
                    </div>
                    <span className={`am-badge${item.passed ? "" : !item.unlocked ? " locked" : isRetake ? " retake" : ""}`}>
                      {item.passed ? "Passed" : !item.unlocked ? "Locked" : item.openAttemptId ? "In progress" : isRetake ? "Retake Available" : "Ready"}
                    </span>
                  </div>
                  <div className="am-metrics">
                    <div className="am-metric"><small>Passing score</small><strong>{item.passingPercentage}%</strong></div>
                    <div className="am-metric"><small>Time limit</small><strong>{item.durationMinutes ? `${item.durationMinutes} min` : "No timer"}</strong></div>
                    <div className="am-metric"><small>Attempts remaining</small><strong>{isRetake ? "Retake Granted" : `${remaining} / ${item.maxAttempts}`}</strong></div>
                    <div className="am-metric"><small>Best score</small><strong>{item.bestPercentage == null ? "Not attempted" : `${item.bestPercentage}%`}</strong></div>
                  </div>
                  <div className="am-actions">
                    {canStart ? (
                      <Link className="am-button" to={`/assessments/${item.id}`}>
                        {item.openAttemptId ? "Continue Assessment" : isRetake ? "Retake Assessment" : "Start Assessment"}
                      </Link>
                    ) : null}
                    {item.attemptsUsed > 0 ? <button type="button" className="am-button secondary" onClick={() => showResults(item.id)}>View Results</button> : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selected ? (
        <section className="am-results">
          <div className="am-results-head">
            <h2>Assessment Results</h2>
            <button type="button" className="am-button secondary" onClick={() => setSelected("")}>Close</button>
          </div>
          {resultsLoading ? <p className="am-loading">Loading results…</p> : results.length === 0 ? <p>No submitted results found.</p> : (
            <div className="am-table-scroll">
              <table className="am-table">
                <thead><tr><th>Submitted</th><th>Score</th><th>Result</th></tr></thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={String(result.id)}>
                      <td>{result.submitted_at ? new Date(String(result.submitted_at)).toLocaleString() : "—"}</td>
                      <td>{String(result.score)} / {String(result.max_score)} ({String(result.percentage)}%)</td>
                      <td>{result.passed ? "Passed" : "Failed"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}
