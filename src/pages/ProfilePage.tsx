import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { ApiError, updateProfile } from "../api/client.ts";
import { portalApi, type Course } from "../api/portal.ts";
import { CountrySelect } from "../components/CountrySelect.tsx";
import { MediaImage } from "../components/MediaImage.tsx";
import { PhoneField } from "../components/PhoneField.tsx";
import { Notice } from "../components/ui.tsx";
import { useAuth } from "../context/useAuth.ts";
import { phoneIsValid } from "../data/countries.ts";

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [country, setCountry] = useState(user?.country ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [state, setState] = useState((user as typeof user & { state?: string })?.state ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? "");
  const [professionalDetails, setProfessionalDetails] = useState(user?.professionalDetails ?? "");
  const [phoneCountry, setPhoneCountry] = useState(user?.phoneCountryIso2 ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);


  type CourseOption = { id: string; title: string };
  const [availableCourses, setAvailableCourses] = useState<CourseOption[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [courseOpen, setCourseOpen] = useState(false);
  const courseDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!courseDropdownRef.current?.contains(event.target as Node)) {
        setCourseOpen(false);
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);
  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      setCoursesLoading(true);
      setCoursesError("");

      try {
        let currentPage = 1;
        let allCourses: Course[] = [];
        let total = 0;

        do {
          const response = await portalApi.courses({
            status: "PUBLISHED",
            page: currentPage,
          });

          const items = response.data?.items ?? [];
          total = response.data?.total ?? 0;

          allCourses = [...allCourses, ...items];

          if (items.length === 0) break;

          currentPage++;
        } while (allCourses.length < total);

        if (!cancelled) setAvailableCourses(allCourses);
      } catch (caught) {
        if (!cancelled) {
          setCoursesError(
            caught instanceof ApiError
              ? caught.message
              : "Courses could not be loaded."
          );
        }
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    }

    void loadCourses();
    return () => { cancelled = true; };
  }, []);

  const filteredCourses = availableCourses.filter((course) =>
    course.title.toLowerCase().includes(courseSearch.trim().toLowerCase()),
  );
  function toggleCourse(courseId: string) {
    setSelectedCourseIds((current) =>
      current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId],
    );
    setCourseOpen(false);
    setCourseSearch("");
  }

  if (!user) return null;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (!phoneIsValid(phoneCountry, phoneNumber)) {
      setError("Enter a valid mobile number for the selected country.");
      return;
    }
    setSaving(true);
    try {
      // Nationality is intentionally excluded from the UI and update payload.
      const response = await updateProfile({
        name: name.trim(),
        phoneCountryIso2: phoneCountry,
        phoneNumber,
        country,
        city,
        state,
        dateOfBirth,
        professionalDetails,
        courseIds: selectedCourseIds,
      });
      if (response.data?.user) setUser(response.data.user);
      setMessage("Profile details updated. State and course selections are not saved yet; backend integration is required.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The profile could not be saved.");
    } finally { setSaving(false); }
  }

  async function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setMessage("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const response = await portalApi.photo(file);
      if (response.data?.user) setUser(response.data.user);
      setMessage("Profile photo updated successfully.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The photo could not be uploaded.");
    } finally { setUploading(false); event.target.value = ""; }
  }

  return (
    <section className="sp-profile">
      <style>{`
        .sp-profile{--sp-green:#174f42;--sp-ink:#183b35;--sp-muted:#788781;--sp-line:#e4ebe7;--sp-bg:#f7f9f7;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;color:var(--sp-ink);width:100%;max-width:1180px;margin:0 auto;padding:28px 26px 60px;box-sizing:border-box}
        .sp-profile *{box-sizing:border-box}
        .sp-profile h1,.sp-profile h2,.sp-profile h3,.sp-profile p{margin:0;font-family:inherit!important;letter-spacing:normal}
        .sp-profile .sp-kicker{font-size:11px;font-weight:800;letter-spacing:1.5px;color:#6c9586;text-transform:uppercase;margin-bottom:9px}
        .sp-profile .sp-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:26px}
        .sp-profile h1{font-size:clamp(26px,3vw,34px);font-weight:800;line-height:1.2;color:#153b32}
        .sp-profile .sp-subtitle{font-size:13px;color:var(--sp-muted);margin-top:8px;line-height:1.6}
        .sp-profile .sp-pill{display:inline-flex;align-items:center;gap:7px;padding:9px 13px;border:1px solid #dbe9e0;background:#eff7f1;border-radius:99px;color:#286b4c;font-size:12px;font-weight:700;white-space:nowrap}
        .sp-profile .sp-layout{display:grid;grid-template-columns:minmax(235px,290px) minmax(0,1fr);align-items:start;gap:22px}
        .sp-profile .sp-card{background:#fff;border:1px solid var(--sp-line);border-radius:18px;box-shadow:0 5px 24px rgba(21,58,46,.035);min-width:0}
        .sp-profile .sp-identity{padding:30px 22px;text-align:center}
        .sp-profile .sp-avatar{width:112px;height:112px;margin:0 auto 17px;border-radius:50%;background:#e9f1ec;overflow:hidden;border:5px solid #f2f7f3;display:flex;align-items:center;justify-content:center}
        .sp-profile .sp-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}
        .sp-profile .sp-avatar-fallback{font-size:38px;font-weight:800;color:#286e56}
        .sp-profile .sp-identity h2{font-size:19px;font-weight:800;overflow-wrap:anywhere}
        .sp-profile .sp-email{font-size:12px;color:var(--sp-muted);margin:9px 0 13px;overflow-wrap:anywhere;line-height:1.6}
        .sp-profile .sp-role{display:inline-flex;background:#eaf6ee;color:#23684c;border-radius:99px;padding:6px 13px;font-size:11px;font-weight:800;letter-spacing:.4px;text-transform:uppercase}
        .sp-profile .sp-photo-label{display:flex;justify-content:center;align-items:center;gap:7px;margin-top:23px;border:1px solid #cbded3;background:#fff;color:#185443;border-radius:10px;min-height:42px;padding:10px 12px;font-size:12px;font-weight:750;cursor:pointer;transition:.2s}
        .sp-profile .sp-photo-label:hover{background:#f1f8f3}
        .sp-profile .sp-photo-label input{display:none}
        .sp-profile .sp-hint{font-size:11px;color:#9aa7a0;margin-top:11px;line-height:1.5}
        .sp-profile .sp-form-card{padding:27px 30px 30px}
        .sp-profile .sp-form-header{padding-bottom:20px;border-bottom:1px solid var(--sp-line);margin-bottom:23px}
        .sp-profile .sp-form-header h2{font-size:19px;font-weight:800}
        .sp-profile .sp-form-header p{font-size:12px;color:var(--sp-muted);margin-top:7px;line-height:1.5}
        .sp-profile .sp-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 18px;align-items:start}
        .sp-profile .sp-field{display:flex;flex-direction:column;gap:8px;min-width:0;font-size:12px;font-weight:700;color:#315348}
        .sp-profile .sp-field>input,.sp-profile .sp-field>textarea{display:block;width:100%;border:1px solid #dbe5de;background:#fff;border-radius:10px;padding:12px 14px;min-height:46px;font:400 13px Inter,ui-sans-serif,system-ui,sans-serif;color:#173b31;outline:none;transition:border-color .2s,box-shadow .2s}
        .sp-profile .sp-field>textarea{min-height:126px;resize:vertical;line-height:1.6}
        .sp-profile .sp-field>input:focus,.sp-profile .sp-field>textarea:focus{border-color:#3d9574;box-shadow:0 0 0 3px rgba(42,130,89,.09)}
        .sp-profile .sp-field>input[readonly]{background:#f7f9f7;color:#71847b;cursor:not-allowed}
        .sp-profile .sp-span{grid-column:1/-1;min-width:0}
        .sp-profile .sp-country,.sp-profile .sp-phone{min-width:0}
        .sp-profile .sp-country label,.sp-profile .sp-phone label{font-family:inherit!important;font-size:12px!important;font-weight:700!important;color:#315348!important}
        .sp-profile .sp-country input,.sp-profile .sp-country button,.sp-profile .sp-phone input,.sp-profile .sp-phone button,.sp-profile .sp-phone select{font-family:inherit!important;font-size:13px!important;max-width:100%;min-width:0}
        .sp-profile .sp-actions{display:flex;align-items:center;justify-content:flex-end;gap:14px;margin-top:28px;padding-top:22px;border-top:1px solid var(--sp-line)}
        .sp-profile .sp-save{background:var(--sp-green);border:1px solid var(--sp-green);border-radius:10px;color:white;min-height:44px;padding:0 24px;font-family:inherit;font-size:13px;font-weight:750;cursor:pointer;transition:.2s}
        .sp-profile .sp-save:hover:not(:disabled){background:#0e3c30}
        .sp-profile .sp-save:disabled{opacity:.65;cursor:wait}
        .sp-profile .sp-actions-note{font-size:11px;color:#8b9991}
        .sp-profile .sp-alert{margin-bottom:17px}
        /* Readability and form alignment refinements */
        .sp-profile{max-width:1320px;padding:24px 28px 52px;font-size:15px}
        .sp-profile .sp-heading{margin-bottom:22px}
        .sp-profile .sp-kicker{font-size:12px;margin-bottom:8px}
        .sp-profile h1{font-size:32px}
        .sp-profile .sp-subtitle{font-size:14px}
        .sp-profile .sp-layout{grid-template-columns:minmax(250px,300px) minmax(0,1fr);gap:22px}
        .sp-profile .sp-identity{padding:28px 20px}
        .sp-profile .sp-identity h2{font-size:20px}
        .sp-profile .sp-email{font-size:13px}
        .sp-profile .sp-form-card{padding:28px 30px}
        .sp-profile .sp-form-header h2{font-size:21px}
        .sp-profile .sp-form-header p{font-size:14px}
        .sp-profile .sp-fields{gap:19px 18px}
        .sp-profile .sp-field{font-size:14px;gap:9px}
        .sp-profile .sp-field>input,.sp-profile .sp-field>textarea{font-size:14px;min-height:50px}
        .sp-profile .sp-field>textarea{min-height:120px}
        .sp-profile .sp-country,.sp-profile .sp-phone{width:100%;min-width:0;display:flex;flex-direction:column;justify-content:flex-start;gap:8px}
        .sp-profile .sp-country label,.sp-profile .sp-phone label{font-size:14px!important;line-height:1.45!important}
        .sp-profile .sp-country input,.sp-profile .sp-country button,.sp-profile .sp-country select,.sp-profile .sp-phone input,.sp-profile .sp-phone button,.sp-profile .sp-phone select{font-size:14px!important;min-height:48px;box-sizing:border-box}
        .sp-profile .sp-country>div,.sp-profile .sp-phone>div{min-width:0;max-width:100%}
        .sp-profile .sp-photo-label{font-size:14px;min-height:46px}
        .sp-profile .sp-save{font-size:14px;min-height:46px}
        .sp-profile .sp-actions-note{font-size:12px}
        .sp-profile .sp-course-dropdown{position:relative;min-width:0}
        .sp-profile .sp-course-trigger{width:100%;min-height:50px;border:1px solid #dbe5de;border-radius:10px;background:#fff;color:#173b31;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;text-align:left;font:inherit;font-size:14px;cursor:pointer}
        .sp-profile .sp-course-trigger:focus-visible{outline:2px solid #3d9574;outline-offset:2px}
        .sp-profile .sp-course-menu{position:absolute;top:calc(100% + 5px);left:0;right:0;z-index:30;background:#fff;border:1px solid #dbe5de;border-radius:10px;padding:8px;box-shadow:0 12px 28px rgba(21,58,46,.12)}
        .sp-profile .sp-course-search{width:100%;min-height:48px;border:1px solid #dbe5de;border-radius:10px;padding:12px 14px;font:inherit;font-size:14px;color:#173b31;outline:none}
        .sp-profile .sp-course-search:focus{border-color:#3d9574;box-shadow:0 0 0 3px rgba(42,130,89,.09)}
        .sp-profile .sp-course-list{border:1px solid #dbe5de;border-radius:10px;max-height:190px;overflow-y:auto;padding:7px;background:#fff}
        .sp-profile .sp-course-option{display:flex;align-items:center;flex-direction:row;gap:10px;padding:11px 10px;cursor:pointer;border-radius:8px;font-size:14px;font-weight:500}
        .sp-profile .sp-course-option:hover{background:#f1f8f3}
        .sp-profile .sp-course-option input{width:17px;height:17px;accent-color:#174f42;flex-shrink:0}
        .sp-profile .sp-selected-courses{display:flex;flex-wrap:wrap;gap:8px}
        .sp-profile .sp-course-chip{display:inline-flex;align-items:center;gap:9px;padding:7px 12px;background:#eaf6ee;color:#174f42;border-radius:20px;font-size:13px;font-weight:600}
        .sp-profile .sp-course-chip button{border:0;background:transparent;color:inherit;cursor:pointer;font-size:18px;line-height:1}
        .sp-profile .sp-course-note{font-size:12px;color:#788781;font-weight:400;line-height:1.5}
        @media(max-width:1050px){.sp-profile .sp-layout{grid-template-columns:1fr}.sp-profile .sp-identity{display:grid;grid-template-columns:92px minmax(0,1fr);text-align:left;align-items:center;gap:5px 18px}.sp-profile .sp-avatar{grid-row:1/5;width:88px;height:88px;margin:0}.sp-profile .sp-photo-label,.sp-profile .sp-hint{grid-column:2;max-width:270px;margin-top:8px}}
        @media(max-width:600px){.sp-profile{padding:18px 12px 40px}.sp-profile .sp-fields{grid-template-columns:1fr}.sp-profile .sp-form-card{padding:20px 16px}.sp-profile .sp-identity{grid-template-columns:75px minmax(0,1fr)}.sp-profile .sp-avatar{width:72px;height:72px}.sp-profile h1{font-size:28px}.sp-profile .sp-actions{flex-direction:column;align-items:stretch}.sp-profile .sp-save{width:100%}}
        @media(max-width:950px){.sp-profile{padding:22px 16px 45px}.sp-profile .sp-layout{grid-template-columns:1fr}.sp-profile .sp-identity{display:grid;grid-template-columns:90px 1fr;column-gap:18px;text-align:left;align-items:center;padding:20px}.sp-profile .sp-avatar{width:85px;height:85px;grid-row:1/5;margin:0}.sp-profile .sp-photo-label{grid-column:2;margin-top:12px;max-width:190px}.sp-profile .sp-hint{grid-column:2}.sp-profile .sp-form-card{padding:23px}}
        @media(max-width:600px){.sp-profile{padding:17px 12px 38px}.sp-profile .sp-heading{align-items:flex-start}.sp-profile .sp-pill{display:none}.sp-profile .sp-fields{grid-template-columns:1fr;gap:17px}.sp-profile .sp-form-card{padding:20px 16px}.sp-profile .sp-identity{grid-template-columns:75px 1fr;gap:8px 13px;padding:17px}.sp-profile .sp-avatar{width:72px;height:72px}.sp-profile .sp-identity h2{font-size:16px}.sp-profile .sp-actions{flex-direction:column;align-items:stretch}.sp-profile .sp-save{width:100%}}
      `}</style>
      <header className="sp-heading">
        <div>
          <p className="sp-kicker">Account settings</p>
          <h1>My Profile</h1>
          <p className="sp-subtitle">Manage your personal information and professional details.</p>
        </div>
        <span className="sp-pill">● &nbsp; Your account</span>
      </header>
      {(error || message) && <div className="sp-alert">{error ? <Notice tone="error">{error}</Notice> : null}{message ? <Notice tone="ok">{message}</Notice> : null}</div>}
      <form className="sp-layout" onSubmit={save}>
        <aside className="sp-card sp-identity">
          <div className="sp-avatar">
            {user.profilePhoto ? <MediaImage file={user.profilePhoto} alt="Profile photo" className="sp-avatar-img" /> : <span className="sp-avatar-fallback">{(user.name || "U").trim().charAt(0).toUpperCase()}</span>}
          </div>
          <h2>{user.name}</h2>
          <p className="sp-email">{user.email}</p>
          <div><span className="sp-role">{user.role === "ADMIN" ? "Administrator" : "Therapist"}</span></div>
          <label className="sp-photo-label">
            {uploading ? "Uploading photo…" : "↥  Change profile photo"}
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={changePhoto} />
          </label>
          <p className="sp-hint">JPG, PNG or WebP · Max 5 MB</p>
        </aside>
        <div className="sp-card sp-form-card">
          <div className="sp-form-header">
            <h2>Personal Information</h2>
            <p>Keep your information accurate and up to date.</p>
          </div>
          <div className="sp-fields">
            <label className="sp-field">Full name <input value={name} required onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" /></label>
            <label className="sp-field">Email address <input value={user.email} readOnly title="Email cannot be edited here" /></label>
            <div className="sp-country"><CountrySelect id="profile-country" label="Country" value={country} onChange={setCountry} variant="nationality" placeholder="Select country" /></div>
            <label className="sp-field">State <input value={state} onChange={(e) => setState(e.target.value)} placeholder="Enter your state" /></label>
            <label className="sp-field">City <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter your city" /></label>
            <label className="sp-field">Date of birth <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></label>
            <div className="sp-phone"><PhoneField country={phoneCountry} number={phoneNumber} onCountryChange={setPhoneCountry} onNumberChange={setPhoneNumber} /></div>
            <div className="sp-field sp-span">
              <span id="profile-courses-label">Select Courses</span>
              <div className="sp-course-dropdown" ref={courseDropdownRef}>
                <button
                  type="button"
                  className="sp-course-trigger"
                  aria-haspopup="true"
                  aria-expanded={courseOpen}
                  aria-labelledby="profile-courses-label"
                  onClick={() => setCourseOpen((open) => !open)}
                >
                  <span>{selectedCourseIds.length ? `${selectedCourseIds.length} course(s) selected` : "Select courses"}</span>
                  <span aria-hidden="true">{courseOpen ? "▴" : "▾"}</span>
                </button>
                {courseOpen && (
                  <div className="sp-course-menu">
                    <input
                      className="sp-course-search"
                      type="search"
                      placeholder="Search available courses..."
                      aria-label="Search courses"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Escape") setCourseOpen(false); }}
                      autoFocus
                    />
                    <div className="sp-course-list">
                      {coursesLoading ? (
                        <p className="sp-course-note">Loading courses...</p>
                      ) : coursesError ? (
                        <p className="sp-course-note" role="alert">{coursesError}</p>
                      ) : filteredCourses.length === 0 ? (
                        <p className="sp-course-note">No published courses found.</p>
                      ) : filteredCourses.map((course) => (
                        <label className="sp-course-option" key={course.id}>
                          <input
                            type="checkbox"
                            checked={selectedCourseIds.includes(course.id)}
                            onChange={() => toggleCourse(course.id)}
                          />
                          <span>{course.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {selectedCourseIds.length > 0 && (
                <div className="sp-selected-courses">
                  {availableCourses.filter((course) => selectedCourseIds.includes(course.id)).map((course) => (
                    <span className="sp-course-chip" key={course.id}>
                      {course.title}
                      <button type="button" onClick={() => toggleCourse(course.id)} aria-label={`Remove ${course.title}`}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <span className="sp-course-note">Courses are loaded from the API. Selections are not yet saved to your account.</span>
            </div>
            <label className="sp-field sp-span">Professional details <textarea value={professionalDetails} onChange={(e) => setProfessionalDetails(e.target.value)} placeholder="Tell us about your spa therapy experience, specializations, and qualifications..." rows={5} /></label>

          </div>
          <div className="sp-actions"><span className="sp-actions-note">Existing profile fields will be saved. State and courses require API integration.</span><button className="sp-save" type="submit" disabled={saving}>{saving ? "Saving changes…" : "Save Changes"}</button></div>
        </div>
      </form>
    </section>
  );
}
