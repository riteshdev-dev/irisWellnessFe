import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client.ts";
import { money, portalApi, type Course } from "../api/portal.ts";
import { ConfirmDialog, EmptyState, Notice, Pager } from "../components/ui.tsx";
import { toast } from "../components/Toast.tsx";

const emptyCourse = {
  title: "", description: "", categoryId: "", durationMinutes: 60,
  level: "beginner", price: "", learningObjectives: "", prerequisites: "", status: "draft",
};
type CourseDraft = typeof emptyCourse;
type Category = { id: string; name: string; description: string };
const styles = `
.course-modern, .course-modern * { box-sizing:border-box; }
.course-modern { font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; color:#172c29; width:100%; max-width:none; padding:24px clamp(16px,3vw,42px) 64px; margin:0; }
.course-modern h1,.course-modern h2,.course-modern h3,.course-modern p { margin:0; font-family:inherit; }
.course-modern button,.course-modern input,.course-modern select,.course-modern textarea { font:inherit; }
.cm-topline { display:flex; justify-content:space-between; align-items:center; gap:18px; margin-bottom:22px; }
.cm-eyebrow { color:#51806f; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; font-weight:800; margin-bottom:7px!important; }
.cm-topline h1 { font-size:clamp(25px,2.5vw,34px); letter-spacing:-1.2px; line-height:1.2; font-weight:750; }
.cm-muted { color:#71817c; font-size:13px; margin-top:7px!important; line-height:1.6; }
.cm-primary { border:0; border-radius:10px; background:#145441; color:white; padding:12px 18px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:9px; justify-content:center; white-space:nowrap; box-shadow:0 4px 10px #0f4b3820; }
.cm-primary:hover { background:#0c4031; }
.cm-ghost { border:1px solid #dce5e0; border-radius:9px; background:white; padding:10px 14px; color:#2c4e42; font-weight:650; cursor:pointer; }
.cm-ghost:hover { background:#f1f7f3; }
.cm-hero { border:1px solid #dce8df; border-radius:16px; background:linear-gradient(105deg,#e8f3e9,#f6f8f0 60%,#e9f1e8); padding:20px 24px; margin-bottom:18px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
.cm-hero h2 { font-size:19px; font-weight:750; letter-spacing:-.4px; }
.cm-hero p { font-size:13px; color:#56736a; margin-top:6px!important; }
.cm-hero-icon { width:55px;height:55px;border-radius:15px;background:#d1e6d6;display:grid;place-items:center;font-size:27px; }
.cm-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:22px; }
.cm-stat { background:white; border:1px solid #e4eae6; border-radius:13px; padding:18px; min-width:0; display:flex; align-items:center; justify-content:space-between; gap:8px; }
.cm-stat-label { color:#697b73; font-size:12px; font-weight:600; }
.cm-stat-value { color:#123b2f; font-size:27px; font-weight:800; margin-top:7px; letter-spacing:-1px; }
.cm-stat-icon { background:#eaf4ec; color:#21694e; border-radius:12px; width:42px; height:42px; display:grid;place-items:center; font-size:20px; flex-shrink:0; }
.cm-panel { background:white; border:1px solid #e1e8e3; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px #1d49300a; }
.cm-panel-header { padding:22px 23px 0; display:flex; justify-content:space-between; gap:14px; align-items:center; }
.cm-panel-header h2 { font-size:18px; font-weight:750; letter-spacing:-.4px; }
.cm-tabs { display:flex; gap:24px; border-bottom:1px solid #e8ede9; padding:0 23px; margin-top:19px; }
.cm-tab { padding:13px 2px; background:none; border:0; border-bottom:3px solid transparent; color:#7b8a83; font-weight:650; cursor:pointer; }
.cm-tab.active { color:#155b44; border-bottom-color:#155b44; }
.cm-filters { display:flex; flex-wrap:wrap; gap:12px; padding:18px 23px; }
.cm-field { background:white; border:1px solid #dbe5df; border-radius:10px; min-height:44px; padding:10px 13px; color:#244339; outline:none; width:100%; }
.cm-field:focus { border-color:#278464; box-shadow:0 0 0 3px #27846418; }
.cm-search { flex:1 1 260px; }
.cm-filter { flex:0 1 190px; }
.cm-table-wrap { width:100%; overflow-x:auto; }
.cm-table { width:100%; border-collapse:collapse; text-align:left; font-size:13px; }
.cm-table thead { background:#f6f9f6; }
.cm-table th { color:#697c72; font-size:11px; text-transform:uppercase; letter-spacing:.65px; font-weight:800; padding:15px 19px; white-space:nowrap; }
.cm-table td { padding:18px 19px; border-top:1px solid #edf1ed; vertical-align:middle; }
.cm-table tbody tr:hover { background:#fbfdfa; }
.cm-course-title { color:#1b3c31; font-weight:750; text-decoration:none; }
.cm-course-title:hover { text-decoration:underline; }
.cm-small { color:#7b8a83; font-size:11px; margin-top:4px!important; }
.cm-pill { display:inline-flex; border-radius:30px; padding:6px 10px; font-size:11px; font-weight:750; text-transform:capitalize; white-space:nowrap; }
.cm-pill.published { background:#e2f5e8; color:#17683b; }
.cm-pill.draft { background:#fff0d7; color:#99600a; }
.cm-pill.archived { background:#eef0f1; color:#5e6870; }
.cm-actions { display:flex; align-items:center; gap:9px; white-space:nowrap; }
.cm-link { color:#176049; text-decoration:none; font-weight:750; }
.cm-delete { background:none; border:0; color:#ba4848; cursor:pointer; font-weight:650; padding:5px; }
.cm-bottom { padding:18px 23px; border-top:1px solid #edf1ed; }
.cm-category-row { display:flex; align-items:center; justify-content:space-between; gap:16px; border-top:1px solid #edf1ed; padding:17px 23px; }
.cm-category-row strong { font-size:13px; }
.cm-category-row p { color:#7a8982; font-size:12px; margin-top:4px!important; }
.cm-category-form { display:grid; grid-template-columns:1fr 1.5fr auto; align-items:end; gap:12px; background:#f8faf8; border-top:1px solid #e6eee8; padding:20px 23px; }
.cm-label { display:flex; flex-direction:column; gap:7px; color:#345348; font-size:12px; font-weight:700; }
.cm-overlay { position:fixed; inset:0; background:#0c231b80; z-index:1000; display:flex; justify-content:flex-end; overscroll-behavior:contain; }
.cm-drawer { background:#fff; width:min(620px,100%); height:100%; display:flex; flex-direction:column; box-shadow:-12px 0 35px #071b1825; overscroll-behavior:contain; }
.cm-drawer-head { padding:23px 28px; border-bottom:1px solid #e7eee9; display:flex; justify-content:space-between; gap:15px; align-items:flex-start; }
.cm-drawer-head h2 { font-size:23px; font-weight:800; letter-spacing:-.6px; }
.cm-close { width:35px; height:35px; border-radius:9px; background:#f1f5f2; border:0; cursor:pointer; font-size:20px; }
.cm-steps { display:flex; gap:8px; padding:17px 28px; border-bottom:1px solid #e7eee9; }
.cm-step { flex:1; border:1px solid #e1eae3; border-radius:9px; background:white; padding:10px 6px; font-size:12px; font-weight:700; color:#7a8980; cursor:pointer; }
.cm-step.active { background:#e9f5ed; border-color:#9dcbb1; color:#15563e; }
.cm-drawer-body { overflow-y:auto; flex:1; padding:25px 28px; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; }
.cm-section-title { font-size:16px!important; font-weight:800; padding-bottom:15px; border-bottom:1px solid #e9eee9; margin-bottom:20px!important; }
.cm-form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px 14px; }
.cm-span { grid-column:1/-1; }
.cm-drawer textarea { resize:vertical; min-height:100px; }
.cm-drawer-foot { display:flex; justify-content:space-between; gap:12px; padding:17px 28px; border-top:1px solid #e7eee9; background:white; }
.cm-note { background:#f1f8f3; border:1px solid #dceee0; border-radius:10px; padding:14px; font-size:12px; color:#496c5b; line-height:1.6; }
@media(max-width:1100px) { .cm-stats {grid-template-columns:repeat(2,minmax(0,1fr));} }
@media(max-width:650px) { .course-modern {padding:16px 12px 40px;} .cm-topline {align-items:flex-start;flex-direction:column;} .cm-stats {gap:9px;} .cm-stat {padding:13px;} .cm-stat-value {font-size:23px;} .cm-stat-icon {width:32px;height:32px;font-size:16px;} .cm-panel-header,.cm-filters,.cm-bottom {padding-left:15px;padding-right:15px;} .cm-tabs {padding:0 15px;} .cm-category-form {grid-template-columns:1fr;} .cm-drawer-head,.cm-drawer-body,.cm-drawer-foot {padding-left:17px;padding-right:17px;} .cm-steps {padding:12px 17px;} .cm-form-grid {grid-template-columns:1fr;} .cm-span {grid-column:auto;} }
`;

export function CoursesPage() {
  const [items, setItems] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState<CourseDraft>({ ...emptyCourse });
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removeId, setRemoveId] = useState("");
  const [tab, setTab] = useState<"courses" | "categories">("courses");
  const [drawer, setDrawer] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  function load() {
    portalApi.courses({ q, status, page }).then((response) => {
      setItems(response.data?.items ?? []);
      setTotal(response.data?.total ?? 0);
    }).catch((caught) => setError(caught instanceof ApiError ? caught.message : "Courses could not be loaded."));
    portalApi.categories().then((response) => setCategories(response.data?.items ?? []))
      .catch(() => setError("Categories could not be loaded."));
  }
  useEffect(() => { load(); }, [q, status, page]);

  async function createCourse(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Please enter a course title.");
      setError("Please enter a course title.");
      return;
    }
    if (!form.categoryId) {
      toast.error("Please select a course category.");
      setError("Please select a course category.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const response = await portalApi.saveCourse(undefined, form);
      toast.success("Course created successfully.");
      setMessage("Course created successfully.");
      setForm({ ...emptyCourse });
      setDrawer(false);
      load();
      if (response.data?.course) navigate(`/admin/courses/${response.data.course.id}`);
    } catch (caught) {
      const errMsg = caught instanceof ApiError ? caught.message : "The course could not be created.";
      toast.error(errMsg);
      setError(errMsg);
    } finally { setSaving(false); }
  }
  async function createCategory(event: FormEvent) {
    event.preventDefault();
    if (!categoryName.trim()) {
      toast.error("Please enter a category name.");
      setError("Please enter a category name.");
      return;
    }
    setError("");
    try {
      await portalApi.saveCategory({ name: categoryName, description: categoryDescription });
      setCategoryName(""); setCategoryDescription("");
      toast.success("Category saved successfully.");
      setMessage("Category saved successfully."); load();
    } catch (caught) {
      const errMsg = caught instanceof ApiError ? caught.message : "The category could not be saved.";
      toast.error(errMsg);
      setError(errMsg);
    }
  }
  async function removeCategory(id: string) {
    if (!window.confirm("Delete this category?")) return;
    setError("");
    try {
      await portalApi.deleteCategory(id);
      toast.success("Category deleted.");
      setMessage("Category deleted."); load();
    } catch (caught) {
      const errMsg = caught instanceof ApiError ? caught.message : "The category could not be deleted.";
      toast.error(errMsg);
      setError(errMsg);
    }
  }
  async function removeCourse() {
    try {
      const response = await portalApi.deleteCourse(removeId);
      toast.success(response.message || "Course removed successfully.");
      setMessage(response.message); setRemoveId(""); load();
    } catch (caught) {
      const errMsg = caught instanceof ApiError ? caught.message : "The course could not be removed.";
      toast.error(errMsg);
      setError(errMsg);
    }
  }
  const published = items.filter((item) => item.status === "published").length;
  const drafts = items.filter((item) => item.status === "draft").length;

  return <section className="course-modern">
    <style>{styles}</style>
    <header className="cm-topline">
      <div><p className="cm-eyebrow">Learning Administration / Courses</p><h1>Course Management</h1><p className="cm-muted">Create, organize and publish professional therapy courses.</p></div>
      <button className="cm-primary" type="button" onClick={() => { setStep(0); setDrawer(true); }}>＋ Add New Course</button>
    </header>
    {error && <Notice tone="error">{error}</Notice>}
    {message && <Notice tone="ok">{message}</Notice>}
    <div className="cm-hero"><div><h2>Your therapy course catalogue</h2><p>Manage training content and keep your courses up to date.</p></div><div className="cm-hero-icon">✦</div></div>
    <div className="cm-stats">
      {[
        { label: "Total Courses", value: total, icon: "▤" },
        { label: "Published on This Page", value: published, icon: "✓" },
        { label: "Drafts on This Page", value: drafts, icon: "✎" },
        { label: "Categories", value: categories.length, icon: "▦" },
      ].map((stat) => <div className="cm-stat" key={stat.label}><div><div className="cm-stat-label">{stat.label}</div><div className="cm-stat-value">{stat.value}</div></div><div className="cm-stat-icon">{stat.icon}</div></div>)}
    </div>
    <div className="cm-panel">
      <div className="cm-panel-header"><div><h2>Course Catalogue</h2><p className="cm-muted">Browse and manage your courses and categories.</p></div><button className="cm-ghost" type="button" onClick={load}>↻ Refresh</button></div>
      <div className="cm-tabs"><button className={`cm-tab ${tab === "courses" ? "active" : ""}`} onClick={() => setTab("courses")}>Courses</button><button className={`cm-tab ${tab === "categories" ? "active" : ""}`} onClick={() => setTab("categories")}>Categories ({categories.length})</button></div>
      {tab === "courses" ? <>
        <div className="cm-filters"><input className="cm-field cm-search" value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} placeholder="Search courses by name..." aria-label="Search courses"/><select className="cm-field cm-filter" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }} aria-label="Filter status"><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
        {items.length === 0 ? <EmptyState title="No courses found" text="Create a course or change your search filters." /> : <div className="cm-table-wrap"><table className="cm-table"><thead><tr><th>Course</th><th>Category</th><th>Level</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map((course) => <tr key={course.id}><td><Link className="cm-course-title" to={`/admin/courses/${course.id}`}>{course.title}</Link><p className="cm-small">Therapy certification course</p></td><td>{course.categoryName || "—"}</td><td style={{textTransform:"capitalize"}}>{course.level}</td><td>{money(course.priceCents)}</td><td><span className={`cm-pill ${course.status}`}>{course.status}</span></td><td><div className="cm-actions"><Link className="cm-link" to={`/admin/courses/${course.id}`}>Edit</Link><button className="cm-delete" type="button" onClick={() => setRemoveId(course.id)}>Delete</button></div></td></tr>)}</tbody></table></div>}
        <div className="cm-bottom"><Pager page={page} total={total} pageSize={8} onPage={setPage}/></div>
      </> : <>
        {categories.length === 0 ? <EmptyState title="No categories" text="Add your first course category below."/> : categories.map((category) => <div className="cm-category-row" key={category.id}><div><strong>{category.name}</strong><p>{category.description || "No description"}</p></div><button type="button" className="cm-delete" onClick={() => void removeCategory(category.id)}>Delete</button></div>)}
        <form className="cm-category-form" onSubmit={createCategory}><label className="cm-label">Category Name<input className="cm-field" required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Swedish Massage"/></label><label className="cm-label">Description<input className="cm-field" value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} placeholder="Describe this category"/></label><button className="cm-primary" type="submit">＋ Add Category</button></form>
      </>}
    </div>
    {drawer && <div className="cm-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setDrawer(false); }}><div className="cm-drawer" role="dialog" aria-modal="true" aria-label="Create new course"><div className="cm-drawer-head"><div><p className="cm-eyebrow">Course Setup</p><h2>Create New Course</h2><p className="cm-muted">Set up a new therapy certification course.</p></div><button type="button" className="cm-close" aria-label="Close" onClick={() => setDrawer(false)}>×</button></div><div className="cm-steps">{["Basic Info","Learning Details","Publishing"].map((name,index) => <button type="button" key={name} className={`cm-step ${step===index?"active":""}`} onClick={() => { if (index > 0 && (!form.title.trim() || !form.categoryId)) { if (!form.title.trim()) toast.error("Please enter a course title."); else if (!form.categoryId) toast.error("Please select a course category."); return; } setStep(index); }}>{index+1}. {name}</button>)}</div><CourseForm categories={categories} form={form} setForm={setForm} onSubmit={createCourse} step={step} footer={<><button type="button" className="cm-ghost" onClick={() => step === 0 ? setDrawer(false) : setStep(step-1)}>{step===0?"Cancel":"← Back"}</button>{step < 2 ? <button type="button" className="cm-primary" onClick={() => { if (step === 0) { if (!form.title.trim()) { toast.error("Please enter a course title."); setError("Please enter a course title."); return; } if (!form.categoryId) { toast.error("Please select a course category."); setError("Please select a course category."); return; } } setError(""); setStep(step+1); }}>Next →</button> : <button type="submit" className="cm-primary" disabled={saving}>{saving?"Saving...":"Save Course"}</button>}</>}/></div></div>}
    {removeId && <ConfirmDialog title="Remove course" message="A course with enrollments will be archived. A course with no enrollments will be deleted." confirmLabel="Remove" onConfirm={removeCourse} onClose={() => setRemoveId("")}/>}
  </section>;
}

export function CourseForm({ categories, form, setForm, onSubmit, step, footer }: {
  categories: Array<{ id: string; name: string }>;
  form: CourseDraft;
  setForm: (value: CourseDraft) => void;
  onSubmit: (event: FormEvent) => void;
  step?: number;
  footer?: ReactNode;
}) {
  const [localStep, setLocalStep] = useState(0);
  const activeStep = step ?? localStep;
  const toTitleCase = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
};
  return <form noValidate onSubmit={onSubmit} style={{display:"flex",flexDirection:"column",minHeight:0,flex:1}}>
    <div className="cm-drawer-body">
      {activeStep === 0 && <><h3 className="cm-section-title">01 · Basic Information</h3><div className="cm-form-grid"><label className="cm-label cm-span">Course Title *<input className="cm-field" required value={form.title} onChange={(event) => setForm({...form,title:toTitleCase(event.target.value)})} placeholder="e.g. Swedish Massage Therapy Certification"/></label><label className="cm-label">Category *<select className="cm-field" required value={form.categoryId} onChange={(event) => setForm({...form,categoryId:event.target.value})}><option value="">Select category</option>{categories.map((category)=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="cm-label">Difficulty Level<select className="cm-field" value={form.level} onChange={(event)=>setForm({...form,level:event.target.value})}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><label className="cm-label cm-span">Course Description<textarea className="cm-field" rows={5} value={form.description} onChange={(event)=>setForm({...form,description:toTitleCase(event.target.value)})} placeholder="Describe what students will learn..."/></label></div></>}
      {activeStep === 1 && <><h3 className="cm-section-title">02 · Learning Details</h3><div className="cm-form-grid"><label className="cm-label">Duration (minutes)<input className="cm-field" type="number" min={1} value={form.durationMinutes} onChange={(event)=>setForm({...form,durationMinutes:Number(event.target.value)})}/></label><label className="cm-label">Price (optional, INR)<input className="cm-field" value={form.price} onChange={(event)=>setForm({...form,price:event.target.value})} placeholder="e.g. 4999"/></label><label className="cm-label cm-span">Learning Objectives<textarea className="cm-field" rows={5} value={form.learningObjectives} onChange={(event)=>setForm({...form,learningObjectives:toTitleCase(event.target.value)})} placeholder="What will learners achieve?"/></label><label className="cm-label cm-span">Prerequisites<textarea className="cm-field" rows={4} value={form.prerequisites} onChange={(event)=>setForm({...form,prerequisites:toTitleCase(event.target.value)})} placeholder="Any requirements before taking this course?"/></label></div></>}
      {activeStep === 2 && <><h3 className="cm-section-title">03 · Publishing</h3><div className="cm-form-grid"><label className="cm-label cm-span">Course Status<select className="cm-field" value={form.status} onChange={(event)=>setForm({...form,status:event.target.value})}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><div className="cm-span cm-note">Save as Draft if you want to add lessons or assessments before publishing. Your existing backend controls which fields are required.</div><div className="cm-span"><strong style={{fontSize:13}}>Course summary</strong><p className="cm-muted">{form.title || "Untitled course"} · {form.level} · {form.durationMinutes} minutes</p></div></div></>}
    </div>
    <div className="cm-drawer-foot">{footer ?? <><button type="button" className="cm-ghost" onClick={()=>setLocalStep(Math.max(0,localStep-1))}>Back</button>{activeStep < 2 ? <button type="button" className="cm-primary" onClick={()=>setLocalStep(activeStep+1)}>Next →</button> : <button className="cm-primary" type="submit">Save Course</button>}</>}</div>
  </form>;
}
