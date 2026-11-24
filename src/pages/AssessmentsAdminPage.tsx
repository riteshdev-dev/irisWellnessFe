import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../api/client.ts";
import { portalApi, when, type Course } from "../api/portal.ts";
import { ConfirmDialog, EmptyState, Notice } from "../components/ui.tsx";
import { toast } from "../components/Toast.tsx";

const css = `
.assess-v3,.assess-v3 *{box-sizing:border-box}
.assess-v3{--ink:#142e29;--muted:#70817b;--green:#145641;--line:#e2eae6;--canvas:#f7f9f7;--white:#fff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif!important;color:var(--ink);width:100%;max-width:none!important;min-width:0;padding:26px 30px 64px;line-height:1.5}
.assess-v3 h1,.assess-v3 h2,.assess-v3 h3,.assess-v3 p,.assess-v3 label,.assess-v3 button,.assess-v3 input,.assess-v3 select,.assess-v3 textarea,.assess-v3 th,.assess-v3 td{font-family:inherit!important;letter-spacing:normal}
.assess-v3 h1{font-size:clamp(25px,2.5vw,34px)!important;font-weight:750!important;line-height:1.2!important;margin:5px 0 7px!important;color:var(--ink)!important}
.assess-v3 h2{font-size:19px!important;font-weight:700!important;margin:0!important;color:var(--ink)!important}
.assess-v3 h3{font-size:15px!important;font-weight:700!important;margin:0!important;color:var(--ink)!important}
.assess-v3 p{margin:0!important;font-size:13px!important;color:var(--muted)!important}
.assess-v3 .av-eyebrow{font-size:11px!important;font-weight:750!important;letter-spacing:1.4px!important;color:#5b8577!important;text-transform:uppercase}
.assess-v3 .av-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:23px;flex-wrap:wrap}
.assess-v3 .av-head-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
.assess-v3 .av-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--line)!important;background:#fff!important;color:var(--ink)!important;border-radius:10px!important;padding:10px 16px!important;font-size:13px!important;font-weight:650!important;cursor:pointer;text-decoration:none!important;min-height:41px;white-space:nowrap;box-shadow:none!important;width:auto!important}
.assess-v3 .av-btn:hover{background:#eff5f1!important}
.assess-v3 .av-btn-primary{background:var(--green)!important;color:#fff!important;border-color:var(--green)!important}
.assess-v3 .av-btn-primary:hover{background:#0d4232!important}
.assess-v3 .av-btn-danger{color:#b53737!important;border-color:#f0d8d8!important}
.assess-v3 .av-btn-sm{padding:6px 10px!important;min-height:32px;font-size:12px!important}
.assess-v3 .av-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:22px}
.assess-v3 .av-stat{background:#fff;border:1px solid var(--line);border-radius:15px;padding:19px 20px;min-width:0}
.assess-v3 .av-stat-top{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#647a71;font-size:12px;font-weight:600}
.assess-v3 .av-stat-icon{width:36px;height:36px;border-radius:10px;background:#e9f4ed;color:#226f50;display:grid;place-items:center;font-size:17px}
.assess-v3 .av-stat strong{display:block;font-size:29px;font-weight:750;line-height:1.3;margin-top:8px}
.assess-v3 .av-card{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;margin-bottom:20px;min-width:0}
.assess-v3 .av-card-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:20px 22px;border-bottom:1px solid var(--line)}
.assess-v3 .av-card-body{padding:22px}
.assess-v3 .av-tabs{display:flex;gap:25px;padding:0 22px;border-bottom:1px solid var(--line);overflow:auto}
.assess-v3 .av-tab{border:0!important;border-bottom:3px solid transparent!important;border-radius:0!important;background:transparent!important;color:#70817b!important;padding:15px 2px!important;font-size:13px!important;font-weight:650!important;cursor:pointer;white-space:nowrap}
.assess-v3 .av-tab[aria-selected="true"]{border-bottom-color:var(--green)!important;color:var(--green)!important}
.assess-v3 .av-tools{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.assess-v3 .av-input,.assess-v3 .av-select,.assess-v3 .av-textarea{display:block;width:100%!important;min-width:0;border:1px solid #d9e4de!important;background:#fff!important;border-radius:10px!important;color:var(--ink)!important;font-size:13px!important;font-weight:450!important;padding:11px 13px!important;outline:none!important;box-shadow:none!important;min-height:44px!important}
.assess-v3 .av-input:focus,.assess-v3 .av-select:focus,.assess-v3 .av-textarea:focus{border-color:#44866b!important;box-shadow:0 0 0 3px #e1f2e8!important}
.assess-v3 .av-textarea{resize:vertical;min-height:95px!important}
.assess-v3 .av-tools .av-input{max-width:420px;flex:1 1 230px}
.assess-v3 .av-table-wrap{overflow-x:auto;width:100%}
.assess-v3 .av-table{width:100%;border-collapse:collapse;font-size:13px!important;min-width:760px}
.assess-v3 .av-table th{background:#f7faf8;color:#71827b!important;font-size:11px!important;letter-spacing:.55px!important;text-transform:uppercase;text-align:left;font-weight:750!important;padding:14px 17px!important;white-space:nowrap}
.assess-v3 .av-table td{padding:15px 17px!important;border-top:1px solid #edf1ee;vertical-align:middle;color:#263e35!important;font-size:13px!important}
.assess-v3 .av-table td strong{font-weight:700}
.assess-v3 .av-pill{display:inline-flex;align-items:center;padding:5px 10px;border-radius:100px;background:#e7f6eb;color:#167342;font-size:11px;font-weight:750;white-space:nowrap}
.assess-v3 .av-pill.off{background:#f4f1e9;color:#8b7651}.assess-v3 .av-pill.fail{background:#fff0ef;color:#b83b3b}
.assess-v3 .av-row-actions{display:flex;gap:7px;align-items:center}
.assess-v3 .av-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.assess-v3 .av-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.assess-v3 .av-field>label{font-size:12px!important;font-weight:700!important;color:#334c42!important}
.assess-v3 .av-field-wide{grid-column:1/-1}
.assess-v3 .av-check{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600}
.assess-v3 .av-check input{accent-color:var(--green);width:17px;height:17px}
.assess-v3 .av-form-foot{display:flex;justify-content:flex-end;gap:10px;margin-top:23px;padding-top:18px;border-top:1px solid var(--line)}
.assess-v3 .av-overlay{position:fixed;inset:0;background:rgba(9,29,23,.47);z-index:1000;display:flex;justify-content:flex-end;overscroll-behavior:contain}
.assess-v3 .av-drawer{height:100%;width:min(540px,100%);background:#fff;display:flex;flex-direction:column;box-shadow:-18px 0 45px #0002;overscroll-behavior:contain}
.assess-v3 .av-drawer-head{padding:23px 26px;border-bottom:1px solid var(--line);display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.assess-v3 .av-drawer-body{padding:25px 26px;overflow-y:auto;flex:1;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.assess-v3 .av-drawer-foot{padding:17px 26px;border-top:1px solid var(--line);display:flex;justify-content:flex-end;gap:10px}
.assess-v3 .av-question{padding:18px 20px;border:1px solid var(--line);border-radius:13px;margin-bottom:12px;background:#fff}
.assess-v3 .av-question-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.assess-v3 .av-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
.assess-v3 .av-option{background:#f7faf8;padding:10px 12px;border-radius:8px;font-size:12px}.assess-v3 .av-option.correct{background:#e6f5eb;color:#12653b;font-weight:650}
.assess-v3 .av-editor-grid{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:20px;align-items:start}
.assess-v3 .av-editor-grid .av-card{margin-bottom:0}
.assess-v3 .av-radio-row{display:flex;align-items:center;gap:9px}.assess-v3 .av-radio-row input{accent-color:var(--green)}
.assess-v3 .av-option-input{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end;margin-bottom:10px}
.assess-v3 .av-empty{padding:25px;color:var(--muted);font-size:13px;text-align:center}
@media(max-width:1100px){.assess-v3 .av-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.assess-v3 .av-editor-grid{grid-template-columns:1fr}}
@media(max-width:650px){.assess-v3{padding:18px 12px 45px}.assess-v3 .av-grid{grid-template-columns:1fr}.assess-v3 .av-stats{gap:9px}.assess-v3 .av-stat{padding:13px}.assess-v3 .av-stat strong{font-size:23px}.assess-v3 .av-card-head,.assess-v3 .av-card-body{padding:15px}.assess-v3 .av-head-actions{width:100%}.assess-v3 .av-head-actions .av-btn{flex:1}.assess-v3 .av-options{grid-template-columns:1fr}}
`;

const freshAssessment = () => ({ title: "", courseId: "", passingPercentage: 70, durationMinutes: "", maxAttempts: 2, isActive: true });
const freshQuestion = () => ({ id: "", prompt: "", marks: 1, options: [{ text: "", correct: true }, { text: "", correct: false }] });
const msg = (e: unknown, fallback: string) => e instanceof ApiError ? e.message : fallback;

export function AssessmentsAdminPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(freshAssessment());
  const [results, setResults] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [removeId, setRemoveId] = useState("");
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"assessments" | "results">("assessments");
  const [busy, setBusy] = useState(false);
  const drawerBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!creating) return;

    const handleWheel = (e: WheelEvent) => {
      const drawerBody = drawerBodyRef.current;
      if (drawerBody && drawerBody.contains(e.target as Node)) {
        const { scrollTop, scrollHeight, clientHeight } = drawerBody;
        const isScrollable = scrollHeight > clientHeight;

        if (isScrollable) {
          const delta = e.deltaY;
          const atTop = delta < 0 && scrollTop <= 0;
          const atBottom = delta > 0 && scrollTop + clientHeight >= scrollHeight - 1;

          if (!atTop && !atBottom) {
            return;
          }
        }
      }

      e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const drawerBody = drawerBodyRef.current;
      if (!drawerBody || !drawerBody.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCreating(false);
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
  }, [creating]);

  async function load() {
    try {
      const [assessments, courseData, resultData] = await Promise.all([
        portalApi.adminAssessments(q),
        portalApi.courses({ page: 1 }),
        portalApi.attemptResults({ page: 1 }),
      ]);
      setItems(assessments.data?.items ?? []);
      setCourses(courseData.data?.items ?? []);
      setResults(resultData.data?.items ?? []);
    } catch (caught) { setError(msg(caught, "Assessment data could not be loaded.")); }
  }
  useEffect(() => { void load(); }, [q]);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Please enter an assessment title.");
      setError("Please enter an assessment title.");
      return;
    }
    if (!form.courseId) {
      toast.error("Please select a course for the assessment.");
      setError("Please select a course for the assessment.");
      return;
    }
    setError(""); setSuccess(""); setBusy(true);
    try {
      await portalApi.saveAssessment(undefined, { ...form, durationMinutes: form.durationMinutes });
      setForm(freshAssessment()); setCreating(false);
      toast.success("Assessment created successfully.");
      setSuccess("Assessment created successfully.");
      await load();
    } catch (caught) {
      const errMsg = msg(caught, "The assessment could not be created.");
      toast.error(errMsg);
      setError(errMsg);
    }
    finally { setBusy(false); }
  }
  async function deleteSelected() {
    if (!removeId) return;
    setBusy(true); setError("");
    try {
      await portalApi.deleteAssessment(removeId);
      setRemoveId("");
      toast.success("Assessment deleted successfully.");
      setSuccess("Assessment deleted."); await load();
    } catch (caught) {
      const errMsg = msg(caught, "Could not delete assessment.");
      toast.error(errMsg);
      setError(errMsg);
    }
    finally { setBusy(false); }
  }

  const activeCount = items.filter(item => Boolean(item.is_active)).length;
  const passedCount = results.filter(row => Boolean(row.passed)).length;
  const questionsCount = items.reduce((sum, item) => sum + (Number(item.question_count) || 0), 0);

  return <section className="assess-v3"><style>{css}</style>
    <div className="av-head">
      <div><div className="av-eyebrow">Learning administration / Exams</div><h1>Assessment Management</h1><p>Manage exams, questions, passing criteria and learner results.</p></div>
      <div className="av-head-actions"><button type="button" className="av-btn" onClick={() => void load()}>↻ Refresh</button><button type="button" className="av-btn av-btn-primary" onClick={() => setCreating(true)}>＋ Create Assessment</button></div>
    </div>
    {error && <Notice tone="error">{error}</Notice>}{success && <Notice tone="ok">{success}</Notice>}
    <div className="av-stats">
      <div className="av-stat"><div className="av-stat-top">Total Assessments <span className="av-stat-icon">▤</span></div><strong>{items.length}</strong></div>
      <div className="av-stat"><div className="av-stat-top">Active Assessments <span className="av-stat-icon">✓</span></div><strong>{activeCount}</strong></div>
      <div className="av-stat"><div className="av-stat-top">Questions <span className="av-stat-icon">?</span></div><strong>{questionsCount}</strong></div>
      <div className="av-stat"><div className="av-stat-top">Passed Submissions <span className="av-stat-icon">★</span></div><strong>{passedCount}</strong></div>
    </div>
    <div className="av-card">
      <div className="av-card-head"><div><h2>Assessment Overview</h2><p>View and maintain your certification assessments.</p></div></div>
      <div className="av-tabs"><button type="button" className="av-tab" aria-selected={tab === "assessments"} onClick={() => setTab("assessments")}>Assessments ({items.length})</button><button type="button" className="av-tab" aria-selected={tab === "results"} onClick={() => setTab("results")}>Assessment Results ({results.length})</button></div>
      {tab === "assessments" ? <>
        <div className="av-card-body"><div className="av-tools"><input className="av-input" aria-label="Search assessments" placeholder="Search assessments by title..." value={q} onChange={e => setQ(e.target.value)} /></div></div>
        {items.length === 0 ? <EmptyState title="No assessments" text="Create an assessment for a course." /> : <div className="av-table-wrap"><table className="av-table"><thead><tr><th>Assessment</th><th>Course</th><th>Pass Mark</th><th>Attempts</th><th>Questions</th><th>Total Marks</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map(item => <tr key={String(item.id)}><td><strong>{String(item.title ?? "")}</strong></td><td>{String(item.course_title ?? "—")}</td><td>{String(item.passing_percentage ?? 0)}%</td><td>{String(item.max_attempts ?? 0)}</td><td>{String(item.question_count ?? 0)}</td><td>{String(item.total_marks ?? 0)}</td><td><span className={`av-pill ${item.is_active ? "" : "off"}`}>{item.is_active ? "Active" : "Inactive"}</span></td><td><div className="av-row-actions"><Link className="av-btn av-btn-sm" to={`/admin/assessments/${item.id}`}>Edit</Link><button type="button" className="av-btn av-btn-sm av-btn-danger" onClick={() => setRemoveId(String(item.id))}>Delete</button></div></td></tr>)}</tbody></table></div>}
      </> : results.length === 0 ? <EmptyState title="No submissions" text="Submitted attempts will appear here." /> : <div className="av-table-wrap"><table className="av-table"><thead><tr><th>Therapist</th><th>Assessment</th><th>Score</th><th>Result</th><th>Submitted</th><th style={{textAlign:"right"}}>Actions</th></tr></thead><tbody>{results.map((row, index) => <tr key={`${String(row.id ?? index)}`}><td><strong>{String(row.user_name ?? "—")}</strong></td><td>{String(row.assessment_title ?? "—")}</td><td>{String(row.percentage ?? 0)}%</td><td><span className={`av-pill ${row.passed ? "" : "fail"}`}>{row.passed ? "Passed" : "Failed"}</span></td><td>{when(row.submitted_at)}</td><td style={{textAlign:"right"}}>{!row.passed && row.user_id && row.assessment_id ? <button type="button" className="av-btn av-btn-sm" style={{background:"#f0f8f4",color:"#1e5c4a",borderColor:"#b6d8c7",fontWeight:700}} disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await portalApi.reassignAssessment(String(row.user_id), String(row.assessment_id)); toast.success(`Assessment re-created for ${String(row.user_name || "therapist")}.`); setSuccess(`Assessment re-created for ${String(row.user_name || "therapist")}.`); await load(); } catch (caught) { const errMsg = msg(caught, "Could not re-create assessment."); toast.error(errMsg); setError(errMsg); } finally { setBusy(false); } }}>🔄 Re-create / Retake</button> : row.passed ? <span style={{fontSize:"12px",color:"#167342",fontWeight:700}}>Certified ✓</span> : null}</td></tr>)}</tbody></table></div>}
    </div>
    {creating && <div className="av-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setCreating(false); }}><div className="av-drawer" role="dialog" aria-modal="true" aria-label="Create assessment"><div className="av-drawer-head"><div><div className="av-eyebrow">Assessment Setup</div><h2>Create New Assessment</h2><p>Set up a course exam and passing criteria.</p></div><button type="button" className="av-btn av-btn-sm" onClick={() => setCreating(false)}>✕</button></div><form onSubmit={create} style={{display:"contents"}}><div className="av-drawer-body" ref={drawerBodyRef}><div className="av-grid"><div className="av-field av-field-wide"><label htmlFor="av-create-title">Assessment Title *</label><input id="av-create-title" className="av-input" required value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="e.g. Swedish Massage Final Exam" /></div><div className="av-field av-field-wide"><label htmlFor="av-create-course">Course *</label><select id="av-create-course" className="av-select" required value={form.courseId} onChange={e => setForm({...form,courseId:e.target.value})}><option value="">Select course</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></div><div className="av-field"><label htmlFor="av-create-pass">Passing Percentage *</label><input id="av-create-pass" className="av-input" type="number" min={0} max={100} required value={form.passingPercentage} onChange={e => setForm({...form,passingPercentage:Number(e.target.value)})} /></div><div className="av-field"><label htmlFor="av-create-duration">Timer (minutes)</label><input id="av-create-duration" className="av-input" type="number" min={1} placeholder="No time limit" value={form.durationMinutes} onChange={e => setForm({...form,durationMinutes:e.target.value})} /></div><div className="av-field"><label htmlFor="av-create-attempts">Maximum Attempts *</label><input id="av-create-attempts" className="av-input" type="number" min={1} required value={form.maxAttempts} onChange={e => setForm({...form,maxAttempts:Number(e.target.value)})} /></div><div className="av-field"><label>Availability</label><label className="av-check"><input type="checkbox" checked={form.isActive} onChange={e => setForm({...form,isActive:e.target.checked})} /> Active assessment</label></div></div></div><div className="av-drawer-foot"><button type="button" className="av-btn" onClick={() => setCreating(false)}>Cancel</button><button type="submit" className="av-btn av-btn-primary" disabled={busy}>{busy ? "Saving..." : "Create Assessment"}</button></div></form></div></div>}
    {removeId && <ConfirmDialog title="Delete assessment" message="This deletes its questions and attempts." confirmLabel="Delete" onConfirm={deleteSelected} onClose={() => setRemoveId("")} />}
  </section>;
}

export function AssessmentEditorPage() {
  const { assessmentId = "" } = useParams();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ title: "", passingPercentage: 70, durationMinutes: "", maxAttempts: 1, isActive: true });
  const [question, setQuestion] = useState(freshQuestion());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [removeQuestionId, setRemoveQuestionId] = useState("");
  const [editorTab, setEditorTab] = useState<"questions" | "settings">("questions");

  async function load() {
    try {
      const response = await portalApi.assessment(assessmentId);
      const next = response.data ?? null;
      setData(next);
      const assessment = next?.assessment as Record<string, unknown> | undefined;
      if (assessment) setForm({ title: String(assessment.title ?? ""), passingPercentage: Number(assessment.passing_percentage ?? 70), durationMinutes: assessment.duration_minutes ? String(assessment.duration_minutes) : "", maxAttempts: Number(assessment.max_attempts ?? 1), isActive: Boolean(assessment.is_active) });
    } catch (caught) { setError(msg(caught, "Assessment not found.")); }
  }
  useEffect(() => { void load(); }, [assessmentId]);

  async function saveSettings(event: FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try { await portalApi.saveAssessment(assessmentId, form); setSuccess("Assessment settings saved."); await load(); }
    catch (caught) { setError(msg(caught, "Settings could not be saved.")); }
    finally { setBusy(false); }
  }
  async function saveQuestion(event: FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      await portalApi.saveQuestion(assessmentId, question, question.id || undefined);
      setQuestion(freshQuestion()); setSuccess("Question saved."); await load();
    } catch (caught) { setError(msg(caught, "The question could not be saved.")); }
    finally { setBusy(false); }
  }
  async function deleteQuestion() {
    if (!removeQuestionId) return;
    setBusy(true); setError("");
    try { await portalApi.deleteQuestion(removeQuestionId); setRemoveQuestionId(""); setSuccess("Question deleted."); await load(); }
    catch (caught) { setError(msg(caught, "Could not delete question.")); }
    finally { setBusy(false); }
  }
  if (!data) return <section className="assess-v3"><style>{css}</style>{error ? <Notice tone="error">{error}</Notice> : <p>Loading assessment...</p>}</section>;
  const questions = (data.questions as Array<Record<string, unknown>>) ?? [];
  const options = (data.options as Array<Record<string, unknown>>) ?? [];

  return <section className="assess-v3"><style>{css}</style>
    <div className="av-head"><div><div className="av-eyebrow">Admin / Assessments / Edit</div><h1>{form.title || "Assessment Editor"}</h1><p>Manage exam settings, questions and correct answers.</p></div><div className="av-head-actions"><Link className="av-btn" to="/admin/assessments">← All Assessments</Link><span className={`av-pill ${form.isActive ? "" : "off"}`}>{form.isActive ? "Active" : "Inactive"}</span></div></div>
    {error && <Notice tone="error">{error}</Notice>}{success && <Notice tone="ok">{success}</Notice>}
    <div className="av-stats" style={{gridTemplateColumns:"repeat(3,minmax(0,1fr))"}}><div className="av-stat"><div className="av-stat-top">Questions <span className="av-stat-icon">?</span></div><strong>{questions.length}</strong></div><div className="av-stat"><div className="av-stat-top">Passing Score <span className="av-stat-icon">✓</span></div><strong>{form.passingPercentage}%</strong></div><div className="av-stat"><div className="av-stat-top">Maximum Attempts <span className="av-stat-icon">↻</span></div><strong>{form.maxAttempts}</strong></div></div>
    <div className="av-card"><div className="av-tabs"><button type="button" className="av-tab" aria-selected={editorTab === "questions"} onClick={() => setEditorTab("questions")}>Question Bank ({questions.length})</button><button type="button" className="av-tab" aria-selected={editorTab === "settings"} onClick={() => setEditorTab("settings")}>Assessment Settings</button></div></div>
    {editorTab === "settings" ? <div className="av-card"><div className="av-card-head"><div><h2>Assessment Settings</h2><p>Update scoring, timing and availability.</p></div></div><div className="av-card-body"><form onSubmit={saveSettings}><div className="av-grid"><div className="av-field av-field-wide"><label htmlFor="av-edit-title">Assessment Title</label><input id="av-edit-title" className="av-input" required value={form.title} onChange={e => setForm({...form,title:e.target.value})} /></div><div className="av-field"><label htmlFor="av-edit-pass">Passing Percentage</label><input id="av-edit-pass" className="av-input" type="number" min={0} max={100} value={form.passingPercentage} onChange={e => setForm({...form,passingPercentage:Number(e.target.value)})} /></div><div className="av-field"><label htmlFor="av-edit-time">Timer (minutes)</label><input id="av-edit-time" className="av-input" type="number" min={1} placeholder="No time limit" value={form.durationMinutes} onChange={e => setForm({...form,durationMinutes:e.target.value})} /></div><div className="av-field"><label htmlFor="av-edit-attempts">Maximum Attempts</label><input id="av-edit-attempts" className="av-input" type="number" min={1} value={form.maxAttempts} onChange={e => setForm({...form,maxAttempts:Number(e.target.value)})} /></div><div className="av-field"><label>Availability</label><label className="av-check"><input type="checkbox" checked={form.isActive} onChange={e => setForm({...form,isActive:e.target.checked})} /> Active assessment</label></div></div><div className="av-form-foot"><button className="av-btn av-btn-primary" type="submit" disabled={busy}>{busy ? "Saving..." : "Save Settings"}</button></div></form></div></div> :
    <div className="av-editor-grid"><div className="av-card"><div className="av-card-head"><div><h2>Question Bank</h2><p>Review questions and edit their answer options.</p></div></div><div className="av-card-body">{questions.length === 0 ? <div className="av-empty">No questions yet. Use the form to add your first question.</div> : questions.map((item, index) => { const related = options.filter(option => option.question_id === item.id); return <article className="av-question" key={String(item.id)}><div className="av-question-head"><div><div className="av-eyebrow">Question {index + 1} · {String(item.marks ?? 1)} mark(s)</div><h3 style={{marginTop:7}}>{String(item.prompt ?? "")}</h3></div><div className="av-row-actions"><button type="button" className="av-btn av-btn-sm" onClick={() => { setQuestion({ id:String(item.id), prompt:String(item.prompt ?? ""), marks:Number(item.marks ?? 1), options:related.map(option => ({text:String(option.option_text ?? ""),correct:Boolean(option.is_correct)})) }); }}>Edit</button><button type="button" className="av-btn av-btn-sm av-btn-danger" onClick={() => setRemoveQuestionId(String(item.id))}>Delete</button></div></div><div className="av-options">{related.map((option, optionIndex) => <div key={String(option.id)} className={`av-option ${option.is_correct ? "correct" : ""}`}>{String.fromCharCode(65 + optionIndex)}. {String(option.option_text ?? "")}{option.is_correct ? " ✓" : ""}</div>)}</div></article>; })}</div></div>
    <div className="av-card"><div className="av-card-head"><div><h2>{question.id ? "Edit Question" : "Add New Question"}</h2><p>Choose exactly one correct answer.</p></div></div><div className="av-card-body"><form onSubmit={saveQuestion}><div className="av-field"><label htmlFor="av-question-prompt">Question *</label><textarea id="av-question-prompt" className="av-textarea" required value={question.prompt} onChange={e => setQuestion({...question,prompt:e.target.value})} placeholder="Enter your question..." rows={3}/></div><div className="av-field" style={{marginTop:16}}><label htmlFor="av-question-marks">Marks</label><input id="av-question-marks" className="av-input" type="number" min={1} required value={question.marks} onChange={e => setQuestion({...question,marks:Number(e.target.value)})}/></div><div style={{marginTop:18,marginBottom:10,fontSize:13,fontWeight:700}}>Answer Options</div>{question.options.map((option,index) => <div className="av-option-input" key={index}><div className="av-field"><label htmlFor={`av-option-${index}`}>Option {index+1}</label><input id={`av-option-${index}`} className="av-input" required value={option.text} onChange={e => { const next = question.options.slice(); next[index] = {...next[index],text:e.target.value}; setQuestion({...question,options:next}); }}/></div><label className="av-radio-row" style={{fontSize:12,paddingBottom:11}}><input type="radio" name="av-correct-answer" checked={option.correct} onChange={() => setQuestion({...question,options:question.options.map((o,i) => ({...o,correct:i===index}))})}/> Correct</label></div>)}<button type="button" className="av-btn av-btn-sm" onClick={() => setQuestion({...question,options:[...question.options,{text:"",correct:false}]})}>＋ Add Option</button><div className="av-form-foot">{question.id && <button type="button" className="av-btn" onClick={() => setQuestion(freshQuestion())}>Cancel Edit</button>}<button type="submit" className="av-btn av-btn-primary" disabled={busy}>{busy ? "Saving..." : question.id ? "Update Question" : "Add Question"}</button></div></form></div></div></div>}
    {removeQuestionId && <ConfirmDialog title="Delete question" message="This will permanently remove the question and its answer options." confirmLabel="Delete" onConfirm={deleteQuestion} onClose={() => setRemoveQuestionId("")} />}
  </section>;
}
