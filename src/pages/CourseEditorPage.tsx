import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client.ts";
import { portalApi, type Course, type Lesson, type Module } from "../api/portal.ts";
import { MediaImage } from "../components/MediaImage.tsx";
import { ConfirmDialog, Notice } from "../components/ui.tsx";
import { toast } from "../components/Toast.tsx";

type CourseFormState = { title: string; description: string; categoryId: string; durationMinutes: number; level: string; price: string; learningObjectives: string; prerequisites: string; status: string };
type LessonFormState = { moduleId: string; title: string; kind: string; textContent: string; durationMinutes: number; isRequired: boolean; file: File | null; id: string };
const initialLesson = (moduleId = ""): LessonFormState => ({ moduleId, title: "", kind: "text", textContent: "", durationMinutes: 10, isRequired: true, file: null, id: "" });
const style = `
/* Isolated styles for this page only. No global element selectors. */
#course-editor-isolated.ce-root {
  width: 100%; max-width: none; min-width: 0; margin: 0; padding: 24px 28px 56px;
  background: transparent; color: #172e27;
  font-family: Inter, "Segoe UI", Arial, sans-serif;
  font-size: 14px; font-weight: 400; line-height: 1.55;
  letter-spacing: normal; text-align: left;
}
#course-editor-isolated.ce-root, #course-editor-isolated.ce-root * { box-sizing: border-box; }
#course-editor-isolated.ce-root :is(h1,h2,h3,h4,h5,h6,p,span,label,strong,a,button,input,select,textarea) {
  font-family: Inter, "Segoe UI", Arial, sans-serif;
  letter-spacing: normal;
}
#course-editor-isolated.ce-root :is(h1,h2,h3,h4,h5,h6) { text-transform: none; }
#course-editor-isolated.ce-root :is(button,input,select,textarea) { font-size: 14px; line-height: 1.45; }
#course-editor-isolated.ce-root .ce-field > span { font-size: 13px; font-weight: 600; color: #304b40; }
#course-editor-isolated.ce-root .ce-title { font-size: 30px !important; font-weight: 750; line-height: 1.2; }
#course-editor-isolated.ce-root .ce-panel-head h2 { font-size: 19px !important; font-weight: 700; }
#course-editor-isolated.ce-root .ce-summary-main h2 { font-size: 20px; font-weight: 700; }
#course-editor-isolated.ce-root .ce-field :is(input:not([type=checkbox]):not([type=file]),select,textarea) { font-size: 14px; border-radius: 10px; }
#course-editor-isolated.ce-root .ce-tab { font-size: 14px; font-weight: 650; }
#course-editor-isolated.ce-root .ce-btn { font-size: 13px; font-weight: 650; }
#course-editor-isolated.ce-root .ce-card { box-shadow: 0 2px 12px rgba(25,54,41,.035); }
#course-editor-isolated.ce-root .ce-panel { padding: 28px; }
#course-editor-isolated.ce-root .ce-top { margin-bottom: 24px; }
#course-editor-isolated.ce-root .ce-grid { gap: 20px; }
#course-editor-isolated.ce-root .ce-field { gap: 8px; }
@media(max-width:700px) { #course-editor-isolated.ce-root { padding: 16px 10px 40px; } #course-editor-isolated.ce-root .ce-panel { padding: 16px; } #course-editor-isolated.ce-root .ce-title { font-size: 25px !important; } }
.ce-root{--ce-ink:#152b25;--ce-green:#155641;--ce-muted:#708079;--ce-line:#e4ebe7;--ce-bg:#f7f9f7;color:var(--ce-ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:14px;line-height:1.5;max-width:none;margin:0;padding:24px 28px 56px;box-sizing:border-box}
.ce-root *{box-sizing:border-box}.ce-root button,.ce-root input,.ce-root select,.ce-root textarea{font:inherit}.ce-root button{cursor:pointer}.ce-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:22px}.ce-eyebrow{color:#64877a;font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;margin:0 0 6px}.ce-title{font-family:inherit!important;font-size:clamp(25px,3vw,34px)!important;line-height:1.2;font-weight:750;letter-spacing:-.035em;margin:0!important;color:#142a22}.ce-subtitle{color:var(--ce-muted);margin:7px 0 0;font-size:13px}.ce-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.ce-btn{border:1px solid var(--ce-line);border-radius:10px;padding:10px 16px;min-height:41px;background:#fff;color:#24483b;font-weight:650;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;white-space:nowrap}.ce-btn:hover{background:#f1f7f3}.ce-btn.primary{background:var(--ce-green);border-color:var(--ce-green);color:white}.ce-btn.primary:hover{background:#104631}.ce-btn.danger{color:#b04444}.ce-btn.small{padding:6px 10px;min-height:31px;font-size:12px;border-radius:8px}.ce-btn:disabled{opacity:.45;cursor:not-allowed}.ce-card{background:white;border:1px solid var(--ce-line);border-radius:16px;box-shadow:0 3px 18px rgba(19,55,41,.035);overflow:hidden}.ce-summary{display:flex;gap:20px;align-items:center;padding:18px;margin-bottom:20px}.ce-thumb{width:146px;height:94px;border-radius:12px;object-fit:cover;background:linear-gradient(135deg,#e8e8d9,#b9c9bd);flex-shrink:0}.ce-summary-main{flex:1;min-width:0}.ce-summary-main h2{font:700 19px/1.35 Inter,system-ui,sans-serif;margin:0 0 6px}.ce-summary-meta{display:flex;flex-wrap:wrap;gap:9px;align-items:center;color:#687b71;font-size:12px}.ce-pill{display:inline-flex;align-items:center;border-radius:999px;background:#e6f5eb;color:#17633d;font-weight:700;font-size:11px;padding:5px 10px;text-transform:capitalize}.ce-pill.draft{background:#fff2dc;color:#9c6313}.ce-pill.archived{background:#f1f2f4;color:#666}.ce-upload{position:relative;overflow:hidden}.ce-upload input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%}.ce-tabs{display:flex;gap:8px;overflow:auto;margin-bottom:20px;border-bottom:1px solid var(--ce-line);padding-bottom:0}.ce-tab{background:none;border:0;border-bottom:3px solid transparent;padding:13px 18px;color:#6d7d75;font-weight:700;white-space:nowrap}.ce-tab.active{color:#155641;border-bottom-color:#155641}.ce-panel{padding:24px}.ce-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}.ce-panel-head h2,.ce-section-title{font:750 18px/1.3 Inter,system-ui,sans-serif!important;margin:0!important;letter-spacing:-.02em}.ce-help{color:var(--ce-muted);font-size:12px;margin:5px 0 0}.ce-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px}.ce-field{display:flex;flex-direction:column;gap:7px;min-width:0}.ce-field.full{grid-column:1/-1}.ce-field>span{font-size:12px;font-weight:700;color:#344e42}.ce-field input:not([type=checkbox]):not([type=file]),.ce-field select,.ce-field textarea{width:100%;min-height:43px;padding:11px 13px;border:1px solid #dbe4df;background:#fff;color:#1e352b;border-radius:9px;outline:none}.ce-field textarea{resize:vertical;min-height:100px}.ce-field input:focus,.ce-field select:focus,.ce-field textarea:focus{border-color:#498c6e;box-shadow:0 0 0 3px rgba(37,117,77,.1)}.ce-field input[type=file]{padding:10px;border:1px dashed #cbdcd0;border-radius:9px;width:100%}.ce-check{display:flex;align-items:center;gap:9px;font-weight:600;color:#344e42}.ce-check input{width:16px;height:16px;accent-color:#155641}.ce-footer{display:flex;justify-content:flex-end;gap:10px;border-top:1px solid var(--ce-line);padding-top:20px;margin-top:22px}.ce-module{border:1px solid var(--ce-line);border-radius:12px;margin-bottom:12px;overflow:hidden;background:#fff}.ce-module-head{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:15px 17px;background:#fbfcfb}.ce-module-title{font-weight:750;font-size:14px;margin:0}.ce-module-desc{font-size:12px;color:var(--ce-muted);margin:3px 0 0}.ce-module-buttons{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.ce-lesson-row{padding:11px 17px;border-top:1px solid #eef2ef;display:flex;justify-content:space-between;align-items:center;gap:12px}.ce-lesson-name{font-weight:650;font-size:13px}.ce-lesson-meta{color:var(--ce-muted);font-size:11px;margin-top:3px}.ce-empty{padding:22px;border:1px dashed #d8e4dc;border-radius:12px;color:#73867b;text-align:center;background:#fcfdfc}.ce-split{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(310px,1fr);gap:18px;align-items:start}.ce-form-card{padding:20px}.ce-form-card h3{font:750 16px/1.4 Inter,system-ui,sans-serif!important;margin:0 0 16px!important}.ce-divider{height:1px;background:var(--ce-line);margin:20px 0}.ce-alert{margin-bottom:15px}.ce-curr-list{display:grid;gap:12px}.ce-curr-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px}.ce-curr-item strong{font-size:15px}.ce-curr-item p{margin:5px 0 0;color:var(--ce-muted);font-size:12px}.ce-badge{font-size:11px;color:#557367;background:#edf5ef;border-radius:99px;padding:5px 9px;font-weight:700}
@media(max-width:1000px){.ce-split{grid-template-columns:1fr}}@media(max-width:650px){.ce-root{padding:16px 12px 40px}.ce-top{flex-direction:column}.ce-summary{flex-wrap:wrap}.ce-thumb{width:100%;height:155px}.ce-panel{padding:16px}.ce-grid{grid-template-columns:1fr}.ce-field.full{grid-column:auto}.ce-module-head,.ce-lesson-row{align-items:flex-start;flex-direction:column}.ce-curr-item{flex-direction:column;align-items:flex-start}.ce-actions{width:100%}}
`;

export function CourseEditorPage() {
  const { courseId = "" } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState<CourseFormState>({ title: "", description: "", categoryId: "", durationMinutes: 60, level: "beginner", price: "", learningObjectives: "", prerequisites: "", status: "draft" });
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [lesson, setLesson] = useState<LessonFormState>(initialLesson());
  const [tab, setTab] = useState<"details" | "curriculum" | "new">("details");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [remove, setRemove] = useState<{ kind: "module" | "lesson"; id: string } | null>(null);
  const getError = (caught: unknown, fallback: string) => caught instanceof ApiError ? caught.message : fallback;
  function apply(nextCourse: Course, nextModules: Module[], nextLessons: Lesson[]) {
    setCourse(nextCourse); setModules(nextModules); setLessons(nextLessons);
    setForm({ title: nextCourse.title, description: nextCourse.description, categoryId: nextCourse.categoryId, durationMinutes: nextCourse.durationMinutes, level: nextCourse.level, price: nextCourse.priceCents === null ? "" : String(nextCourse.priceCents / 100), learningObjectives: nextCourse.learningObjectives, prerequisites: nextCourse.prerequisites, status: nextCourse.status });
    setLesson(current => ({ ...current, moduleId: nextModules.some(m => m.id === current.moduleId) ? current.moduleId : nextModules[0]?.id ?? "" }));
  }
  async function reload() {
    const response = await portalApi.courseAdmin(courseId);
    if (response.data) apply(response.data.course, response.data.modules, response.data.lessons);
  }
  useEffect(() => {
    setError("");
    portalApi.categories().then(r => setCategories(r.data?.items ?? [])).catch(e => setError(getError(e, "Categories could not be loaded.")));
    reload().catch(e => setError(getError(e, "Course not found.")));
  }, [courseId]);
  async function perform(action: () => Promise<unknown>, success: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      await action();
      await reload();
      setMessage(success);
      toast.success(success);
      return true;
    }
    catch (caught) {
      const err = getError(caught, "Something went wrong. Please try again.");
      setError(err);
      toast.error(err);
      return false;
    }
    finally { setBusy(false); }
  }
  async function saveCourse(event: FormEvent) { event.preventDefault(); await perform(() => portalApi.saveCourse(courseId, form), "Course updated successfully."); }
  async function addModule(event: FormEvent) {
    event.preventDefault(); if (!moduleTitle.trim()) return;
    if (await perform(() => portalApi.saveModule(courseId, { title: moduleTitle.trim(), description: moduleDescription }), "Module added.")) { setModuleTitle(""); setModuleDescription(""); setTab("curriculum"); }
  }
  async function move(list: string[], index: number, direction: -1 | 1, save: (ids: string[]) => Promise<unknown>) {
    const target = index + direction; if (target < 0 || target >= list.length) return;
    const next = [...list]; [next[index], next[target]] = [next[target]!, next[index]!];
    await perform(() => save(next), "Order updated.");
  }
  async function saveLesson(event: FormEvent) {
    event.preventDefault();
    if (!lesson.moduleId) {
      const err = "Please create or select a module first.";
      setError(err);
      toast.error(err);
      return;
    }
    const body = new FormData();
    body.set("title", lesson.title); body.set("kind", lesson.kind); body.set("textContent", lesson.textContent);
    body.set("durationMinutes", String(lesson.durationMinutes)); body.set("isRequired", String(lesson.isRequired));
    if (lesson.file) body.set("file", lesson.file);
    if (await perform(() => portalApi.saveLesson(lesson.moduleId, body, lesson.id || undefined), lesson.id ? "Lesson updated." : "Lesson added.")) { setLesson(initialLesson(lesson.moduleId)); setTab("curriculum"); }
  }
  async function confirmRemove() {
    if (!remove) return;
    const ok = await perform(() => remove.kind === "module" ? portalApi.deleteModule(remove.id) : portalApi.deleteLesson(remove.id), "Item deleted.");
    if (ok) setRemove(null);
  }
  const toTitleCase = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
};
  if (!course) return <><style>{style}</style><div className="ce-root" id="course-editor-isolated">{error ? <Notice tone="error">{error}</Notice> : <div className="ce-card ce-panel">Loading course editor…</div>}</div></>;
  const category = categories.find(c => c.id === course.categoryId)?.name ?? "Uncategorized";
  return <div className="ce-root" id="course-editor-isolated"><style>{style}</style>
    <div className="ce-top"><div><p className="ce-eyebrow">Admin / Courses / Edit</p><h1 className="ce-title">Edit Course</h1><p className="ce-subtitle">Manage course information, modules and lessons in one place.</p></div><div className="ce-actions"><button className="ce-btn" type="button" onClick={() => navigate("/admin/courses")}>← All Courses</button><button className="ce-btn primary" type="button" disabled={busy} onClick={() => setTab("details")}>Course Settings</button></div></div>
    {error && <div className="ce-alert"><Notice tone="error">{error}</Notice></div>}{message && <div className="ce-alert"><Notice tone="ok">{message}</Notice></div>}
    <div className="ce-card ce-summary"><MediaImage file={course.thumbnail} alt={course.title} className="ce-thumb"/><div className="ce-summary-main"><h2>{course.title}</h2><div className="ce-summary-meta"><span>{category}</span><span>•</span><span style={{textTransform:"capitalize"}}>{course.level}</span><span>•</span><span>{course.durationMinutes} minutes</span><span className={`ce-pill ${course.status}`}>{course.status}</span></div><p className="ce-help">{modules.length} modules · {lessons.length} lessons</p></div><label className="ce-btn ce-upload">↑ Upload thumbnail<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async e => { const file = e.target.files?.[0]; if (file) await perform(() => portalApi.thumbnail(courseId, file), "Thumbnail updated."); e.target.value = ""; }}/></label></div>
    <div className="ce-tabs" role="tablist"><button className={`ce-tab ${tab === "details" ? "active" : ""}`} type="button" onClick={() => setTab("details")}>Course Details</button><button className={`ce-tab ${tab === "curriculum" ? "active" : ""}`} type="button" onClick={() => setTab("curriculum")}>Curriculum ({modules.length})</button><button className={`ce-tab ${tab === "new" ? "active" : ""}`} type="button" onClick={() => setTab("new")}>Add Module / Lesson</button></div>
    {tab === "details" && <div className="ce-card ce-panel"><div className="ce-panel-head"><div><h2>Basic Information</h2><p className="ce-help">Update the details students see in the course catalogue.</p></div></div><form onSubmit={saveCourse}><div className="ce-grid"><label className="ce-field full"><span>Course Title *</span><input required value={form.title} onChange={e => setForm({ ...form, title: toTitleCase(e.target.value) })}/></label><label className="ce-field"><span>Category *</span><select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}><option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="ce-field"><span>Difficulty Level</span><select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><label className="ce-field full"><span>Course Description</span><textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: toTitleCase(e.target.value) })}/></label><label className="ce-field"><span>Duration (minutes)</span><input type="number" min={1} value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })}/></label><label className="ce-field"><span>Price (INR, optional)</span><input inputMode="decimal" placeholder="e.g. 4999" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}/></label><label className="ce-field full"><span>Learning Objectives</span><textarea rows={3} value={form.learningObjectives} onChange={e => setForm({ ...form, learningObjectives: toTitleCase(e.target.value) })}/></label><label className="ce-field full"><span>Prerequisites</span><textarea rows={3} value={form.prerequisites} onChange={e => setForm({ ...form, prerequisites: toTitleCase(e.target.value) })}/></label><label className="ce-field"><span>Publishing Status</span><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label></div><div className="ce-footer"><button type="button" className="ce-btn" onClick={() => setTab("curriculum")}>View Curriculum →</button><button disabled={busy} className="ce-btn primary" type="submit">{busy ? "Saving…" : "Save Changes"}</button></div></form></div>}
    {tab === "curriculum" && <div className="ce-card ce-panel"><div className="ce-panel-head"><div><h2>Modules & Lessons</h2><p className="ce-help">Expand a module to manage lessons and change their order.</p></div><button className="ce-btn primary" type="button" onClick={() => { setLesson(initialLesson(modules[0]?.id)); setTab("new"); }}>+ Add Content</button></div>{modules.length === 0 ? <div className="ce-empty">No modules yet. Select “Add Content” to create your first module.</div> : modules.map((m, index) => { const moduleLessons = lessons.filter(l => l.module_id === m.id); const open = expanded.includes(m.id); return <div className="ce-module" key={m.id}><div className="ce-module-head"><div><button type="button" onClick={() => setExpanded(v => open ? v.filter(id => id !== m.id) : [...v, m.id])} className="ce-btn small" style={{marginRight:9}}>{open ? "▾" : "▸"}</button><span className="ce-module-title">Module {index + 1}: {m.title}</span><p className="ce-module-desc">{m.description || "No description"} · {moduleLessons.length} lessons</p></div><div className="ce-module-buttons"><button disabled={busy || index === 0} className="ce-btn small" type="button" onClick={() => move(modules.map(x => x.id), index, -1, ids => portalApi.orderModules(courseId, ids))}>↑</button><button disabled={busy || index === modules.length - 1} className="ce-btn small" type="button" onClick={() => move(modules.map(x => x.id), index, 1, ids => portalApi.orderModules(courseId, ids))}>↓</button><button disabled={busy} className="ce-btn small danger" type="button" onClick={() => setRemove({ kind: "module", id: m.id })}>Delete</button></div></div>{open && <>{moduleLessons.length === 0 && <div className="ce-empty">No lessons in this module.</div>}{moduleLessons.map((l, i) => <div className="ce-lesson-row" key={l.id}><div><div className="ce-lesson-name">{i + 1}. {l.title}</div><div className="ce-lesson-meta">{l.kind.toUpperCase()} · {l.is_required ? "Required" : "Optional"} · {l.duration_minutes} min</div></div><div className="ce-module-buttons"><button className="ce-btn small" disabled={busy} type="button" onClick={() => { setLesson({ moduleId: m.id, title: l.title, kind: l.kind, textContent: l.text_content ?? "", durationMinutes: l.duration_minutes, isRequired: l.is_required, file: null, id: l.id }); setTab("new"); }}>Edit</button><button className="ce-btn small" disabled={busy || i === 0} type="button" onClick={() => move(moduleLessons.map(x => x.id), i, -1, ids => portalApi.orderLessons(m.id, ids))}>↑</button><button className="ce-btn small" disabled={busy || i === moduleLessons.length - 1} type="button" onClick={() => move(moduleLessons.map(x => x.id), i, 1, ids => portalApi.orderLessons(m.id, ids))}>↓</button><button className="ce-btn small danger" disabled={busy} type="button" onClick={() => setRemove({ kind: "lesson", id: l.id })}>Delete</button></div></div>)}<div style={{padding:12,borderTop:"1px solid #eef2ef"}}><button className="ce-btn small" type="button" onClick={() => { setLesson(initialLesson(m.id)); setTab("new"); }}>+ Add lesson to this module</button></div></>}</div>; })}</div>}
    {tab === "new" && <div className="ce-split"><div className="ce-card ce-form-card"><h3>Create a Module</h3><p className="ce-help" style={{marginBottom:18}}>Group related lessons into an organized learning module.</p><form onSubmit={addModule}><div className="ce-grid"><label className="ce-field full"><span>Module Title *</span><input required placeholder="e.g. Introduction to Swedish Massage" value={moduleTitle} onChange={e => setModuleTitle(toTitleCase(e.target.value))}/></label><label className="ce-field full"><span>Module Description</span><textarea rows={3} placeholder="What will students learn?" value={moduleDescription} onChange={e => setModuleDescription(toTitleCase(e.target.value))}/></label></div><div className="ce-footer"><button className="ce-btn primary" type="submit" disabled={busy}>+ Add Module</button></div></form></div><div className="ce-card ce-form-card"><h3>{lesson.id ? "Edit Lesson" : "Create a Lesson"}</h3><p className="ce-help" style={{marginBottom:18}}>Add text, video or PDF content to a module.</p><form onSubmit={saveLesson}><div className="ce-grid"><label className="ce-field full"><span>Module *</span><select required value={lesson.moduleId} onChange={e => setLesson({ ...lesson, moduleId: e.target.value })}><option value="">Select module</option>{modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></label><label className="ce-field full"><span>Lesson Title *</span><input required value={lesson.title} onChange={e => setLesson({ ...lesson, title: toTitleCase(e.target.value) })}/></label><label className="ce-field"><span>Content Type</span><select value={lesson.kind} onChange={e => setLesson({ ...lesson, kind: e.target.value, file: null })}><option value="text">Text</option><option value="video">Video</option><option value="pdf">PDF</option></select></label><label className="ce-field"><span>Duration (minutes)</span><input type="number" min={1} value={lesson.durationMinutes} onChange={e => setLesson({ ...lesson, durationMinutes: Number(e.target.value) })}/></label>{lesson.kind === "text" ? <label className="ce-field full"><span>Lesson Content</span><textarea rows={5} value={lesson.textContent} onChange={e => setLesson({ ...lesson, textContent: toTitleCase(e.target.value) })}/></label> : <label className="ce-field full"><span>{lesson.kind === "pdf" ? "PDF Document" : "Video File"}</span><input type="file" accept={lesson.kind === "pdf" ? "application/pdf" : "video/mp4,video/webm"} onChange={e => setLesson({ ...lesson, file: e.target.files?.[0] ?? null })}/>{lesson.id && <span style={{fontWeight:400,color:"#708079"}}>Leave blank to keep the existing file.</span>}</label>}<label className="ce-check full"><input type="checkbox" checked={lesson.isRequired} onChange={e => setLesson({ ...lesson, isRequired: e.target.checked })}/> Required lesson</label></div><div className="ce-footer">{lesson.id && <button className="ce-btn" type="button" onClick={() => setLesson(initialLesson(lesson.moduleId))}>Cancel Edit</button>}<button className="ce-btn primary" type="submit" disabled={busy || !modules.length}>{busy ? "Saving…" : lesson.id ? "Update Lesson" : "+ Add Lesson"}</button></div></form></div></div>}
    <div style={{marginTop:22}}><button className="ce-btn" type="button" onClick={() => navigate("/admin/curriculum")}>← Back to Module & Lesson Management</button></div>
    {remove && <ConfirmDialog title="Delete this item" message="This removes it for every enrolled therapist and recalculates progress." confirmLabel="Delete" onConfirm={confirmRemove} onClose={() => setRemove(null)}/>}
  </div>;
}

export function CurriculumPage() {
  const [items, setItems] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => { portalApi.courses({ page: 1, pageSize: 20 }).then(r => setItems(r.data?.items ?? [])).catch(e => setError(e instanceof ApiError ? e.message : "Courses could not be loaded.")); }, []);
  const filtered = items.filter(c => c.title.toLowerCase().includes(q.toLowerCase()));
  return <div className="ce-root" id="course-editor-isolated"><style>{style}</style><div className="ce-top"><div><p className="ce-eyebrow">Admin / Curriculum</p><h1 className="ce-title">Module & Lesson Management</h1><p className="ce-subtitle">Select a course to manage its learning content.</p></div><Link className="ce-btn primary" to="/admin/courses">View Courses</Link></div>{error && <div className="ce-alert"><Notice tone="error">{error}</Notice></div>}<div className="ce-card ce-panel"><div className="ce-panel-head"><h2>Courses</h2><span className="ce-badge">{filtered.length} shown</span></div><label className="ce-field" style={{marginBottom:20}}><span>Search courses</span><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by course name…"/></label><div className="ce-curr-list">{filtered.length === 0 ? <div className="ce-empty">No matching courses found.</div> : filtered.map(c => <div className="ce-card ce-curr-item" key={c.id}><div><strong>{c.title}</strong><p>Status: <span style={{textTransform:"capitalize"}}>{c.status}</span></p></div><Link className="ce-btn" to={`/admin/courses/${c.id}`}>Manage Modules & Lessons →</Link></div>)}</div></div></div>;
}
