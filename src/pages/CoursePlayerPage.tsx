
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_URL, ApiError } from "../api/client.ts";
import {
  portalApi,
  type Course,
  type Lesson,
  type Module,
} from "../api/portal.ts";
import { MediaImage } from "../components/MediaImage.tsx";
import { Notice } from "../components/ui.tsx";

interface PlayerData {
  course: Course;
  enrollment: {
    status: string;
    progress_percent: number;
  };
  modules: Module[];
  lessons: Lesson[];
  assessment: {
    id: string;
    title: string;
    unlocked: boolean;
    passed: boolean;
  } | null;
}

export function CoursePlayerPage() {
  const { courseId = "" } = useParams();

  const [data, setData] = useState<PlayerData | null>(null);
  const [lessonId, setLessonId] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(selectId?: string) {
    const response = await portalApi.course(courseId);
    const next = response.data as unknown as PlayerData;

    setData(next);

    setLessonId((current) => {
      const preferred = selectId || current;

      if (next.lessons.some((item) => item.id === preferred)) {
        return preferred;
      }

      return next.lessons[0]?.id || "";
    });
  }

  useEffect(() => {
    let active = true;

    setData(null);
    setLessonId("");
    setError("");
    setMessage("");

    portalApi
      .course(courseId)
      .then((response) => {
        if (!active) return;

        const next = response.data as unknown as PlayerData;

        setData(next);
        setLessonId(next.lessons[0]?.id || "");
      })
      .catch((caught) => {
        if (!active) return;

        setError(
          caught instanceof ApiError
            ? caught.message
            : "This course could not be opened."
        );
      });

    return () => {
      active = false;
    };
  }, [courseId]);

  const lesson =
    data?.lessons.find((item) => item.id === lessonId) ??
    data?.lessons[0];

  const lessonIndex = lesson
    ? data?.lessons.findIndex((item) => item.id === lesson.id) ?? -1
    : -1;

  useEffect(() => {
    setMediaUrl("");
    setMediaError(false);

    if (!lesson?.media_file) {
      setMediaLoading(false);
      return;
    }

    let active = true;
    let objectUrl = "";

    setMediaLoading(true);

    const baseUrl = API_URL.replace(/\/+$/, "");

    fetch(
      `${baseUrl}/api/media/${encodeURIComponent(
        lesson.media_file
      )}`,
      { credentials: "include" }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load media.");
        }

        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);

        if (active) {
          setMediaUrl(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      })
      .catch(() => {
        if (active) setMediaError(true);
      })
      .finally(() => {
        if (active) setMediaLoading(false);
      });

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [lesson?.media_file]);

  async function completeLesson() {
    if (!lesson || lesson.completed || busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await portalApi.completeLesson(lesson.id);
      await load(lesson.id);

      setMessage("Lesson marked as complete successfully.");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "The lesson could not be saved."
      );
    } finally {
      setBusy(false);
    }
  }

  function selectLesson(id: string) {
    setLessonId(id);
    setMessage("");
    setError("");
  }

  const completedLessons =
    data?.lessons.filter((item) => item.completed).length ?? 0;

  const totalLessons = data?.lessons.length ?? 0;

  const progress = Math.max(
    0,
    Math.min(
      100,
      Number(data?.enrollment.progress_percent ?? 0) || 0
    )
  );

  const totalDuration = Number(data?.course.durationMinutes ?? 0);

  return (
    <section className="shell-page cp-page">
      {!data ? (
        error ? (
          <Notice tone="error">{error}</Notice>
        ) : (
          <div className="shell-skeleton" />
        )
      ) : (
        <>
          {/* PAGE HEADER */}
          <header className="cp-page-header">
            <div className="cp-header-main">
              <Link to="/learning" className="cp-back-link">
                <span aria-hidden="true">←</span>
                Back to My Learning
              </Link>

              <p className="cp-eyebrow">
                YOUR LEARNING SPACE / COURSE PLAYER
              </p>

              <h1>{data.course.title}</h1>

              <p className="cp-course-description">
                {data.course.description}
              </p>

              <div className="cp-meta">
                {data.course.categoryName && (
                  <span className="cp-meta-item">
                    {data.course.categoryName}
                  </span>
                )}

                {totalDuration > 0 && (
                  <span className="cp-meta-item">
                    {totalDuration} minutes
                  </span>
                )}

                <span className="cp-meta-item">
                  {totalLessons}{" "}
                  {totalLessons === 1 ? "Lesson" : "Lessons"}
                </span>
              </div>
            </div>

            <div className="cp-progress-summary">
              <div className="cp-progress-heading">
                <span>Course Progress</span>
                <strong>{progress}%</strong>
              </div>

              <div
                className="cp-progress-track"
                role="progressbar"
                aria-label="Course progress"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${progress}%` }} />
              </div>

              <p>
                {completedLessons} of {totalLessons} lessons completed
              </p>
            </div>
          </header>

          {error && <Notice tone="error">{error}</Notice>}
          {message && <Notice tone="ok">{message}</Notice>}

          {/* COURSE CONTENT */}
          <div className="cp-content-grid">
            <div className="cp-main-column">
              {lesson ? (
                <article className="cp-lesson-card">
                  <div className="cp-lesson-header">
                    <div className="cp-lesson-heading">
                      <p className="cp-eyebrow">CURRENT LESSON</p>

                      <h2>{lesson.title}</h2>

                      <div className="cp-lesson-meta">
                        <span>
                          Lesson {lessonIndex + 1} of {totalLessons}
                        </span>

                        <span className="cp-dot">•</span>

                        <span>
                          {lesson.duration_minutes} min
                        </span>

                        <span className="cp-dot">•</span>

                        <span>
                          {lesson.is_required
                            ? "Required Lesson"
                            : "Optional Lesson"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`cp-status ${
                        lesson.completed
                          ? "cp-status-done"
                          : "cp-status-progress"
                      }`}
                    >
                      {lesson.completed
                        ? "✓ Completed"
                        : "In Progress"}
                    </span>
                  </div>

                  <div className="cp-lesson-content">
                    {lesson.kind === "text" && (
                      <div className="cp-reading-panel">
                        <div className="cp-reading-header">
                          <div className="cp-reading-icon">
                            <span aria-hidden="true">▤</span>
                          </div>

                          <div>
                            <h3>Lesson Content</h3>
                            <p>
                              Read and understand this lesson.
                            </p>
                          </div>
                        </div>

                        <div className="cp-reading-body">
                          {lesson.text_content ||
                            "No content has been added to this lesson yet."}
                        </div>
                      </div>
                    )}

                    {lesson.kind === "video" && (
                      <div className="cp-media-panel">
                        {mediaLoading ? (
                          <div className="cp-media-placeholder">
                            Loading video...
                          </div>
                        ) : mediaUrl ? (
                          <video
                            key={mediaUrl}
                            src={mediaUrl}
                            controls
                            className="cp-video"
                          />
                        ) : (
                          <div className="cp-media-placeholder">
                            {mediaError
                              ? "The video could not be loaded."
                              : "No video available for this lesson."}
                          </div>
                        )}
                      </div>
                    )}

                    {lesson.kind === "pdf" && (
                      <div className="cp-media-panel">
                        {mediaLoading ? (
                          <div className="cp-media-placeholder">
                            Loading document...
                          </div>
                        ) : mediaUrl ? (
                          <iframe
                            className="cp-pdf"
                            title={lesson.title}
                            src={mediaUrl}
                          />
                        ) : (
                          <div className="cp-media-placeholder">
                            {mediaError
                              ? "The document could not be loaded."
                              : "No document available for this lesson."}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* LESSON BUTTONS */}
                  <div className="cp-lesson-actions">
                    <button
                      type="button"
                      className="cp-button cp-button-outline"
                      disabled={lessonIndex <= 0}
                      onClick={() => {
                        const previous =
                          data.lessons[lessonIndex - 1];

                        if (previous) {
                          selectLesson(previous.id);
                        }
                      }}
                    >
                      ← Previous Lesson
                    </button>

                    <button
                      type="button"
                      className="cp-button cp-button-primary"
                      disabled={busy || lesson.completed}
                      onClick={completeLesson}
                    >
                      {busy
                        ? "Saving..."
                        : lesson.completed
                          ? "✓ Completed"
                          : "✓ Mark as Complete"}
                    </button>

                    <button
                      type="button"
                      className="cp-button cp-button-outline"
                      disabled={
                        lessonIndex < 0 ||
                        lessonIndex >= totalLessons - 1
                      }
                      onClick={() => {
                        const next =
                          data.lessons[lessonIndex + 1];

                        if (next) {
                          selectLesson(next.id);
                        }
                      }}
                    >
                      Next Lesson →
                    </button>
                  </div>
                </article>
              ) : (
                <div className="cp-empty">
                  <h2>No lessons available</h2>
                  <p>
                    Lessons will appear here when they are
                    added to this course.
                  </p>
                </div>
              )}

              {/* ASSESSMENT */}
              {data.assessment && (
                <section className="cp-assessment">
                  <div className="cp-assessment-icon">
                    <span aria-hidden="true">✦</span>
                  </div>

                  <div className="cp-assessment-info">
                    <h3>Course Assessment</h3>

                    <p>
                      {data.assessment.passed
                        ? "Congratulations! You have passed the assessment."
                        : data.assessment.unlocked
                          ? "Your assessment is ready. Test your knowledge."
                          : "Complete all required lessons to unlock your assessment."}
                    </p>
                  </div>

                  {data.assessment.passed ? (
                    <span className="cp-assessment-passed">
                      ✓ Passed
                    </span>
                  ) : data.assessment.unlocked ? (
                    <Link
                      to={`/assessments/${data.assessment.id}`}
                      className="cp-button cp-button-primary cp-assessment-link"
                    >
                      Start Assessment →
                    </Link>
                  ) : (
                    <span className="cp-assessment-locked">
                      Locked
                    </span>
                  )}
                </section>
              )}
            </div>

            {/* CURRICULUM SIDEBAR */}
            <aside className="cp-curriculum">
              <div className="cp-curriculum-header">
                <div>
                  <p className="cp-eyebrow">COURSE CONTENT</p>
                  <h2>Course Curriculum</h2>
                </div>

                <span className="cp-count-badge">
                  {totalLessons}{" "}
                  {totalLessons === 1 ? "Lesson" : "Lessons"}
                </span>
              </div>

              {data.course.thumbnail && (
                <div className="cp-thumbnail">
                  <MediaImage
                    file={data.course.thumbnail}
                    alt={data.course.title}
                  />
                </div>
              )}

              <div className="cp-curriculum-progress">
                <div className="cp-curriculum-progress-top">
                  <span>Your Progress</span>
                  <strong>{progress}%</strong>
                </div>

                <div className="cp-progress-track">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="cp-module-list">
                {data.modules.length === 0 && (
                  <div className="cp-no-modules">
                    No modules available yet.
                  </div>
                )}

                {data.modules.map((module, moduleIndex) => {
                  const moduleLessons = data.lessons.filter(
                    (item) => item.module_id === module.id
                  );

                  const moduleCompleted =
                    moduleLessons.filter(
                      (item) => item.completed
                    ).length;

                  return (
                    <div
                      className="cp-module"
                      key={module.id}
                    >
                      <div className="cp-module-header">
                        <span className="cp-module-number">
                          {String(moduleIndex + 1).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <div className="cp-module-info">
                          <h3>{module.title}</h3>

                          <p>
                            {moduleCompleted} of{" "}
                            {moduleLessons.length} lessons
                            completed
                          </p>
                        </div>
                      </div>

                      <div className="cp-module-lessons">
                        {moduleLessons.map(
                          (item, itemIndex) => {
                            const selected =
                              item.id === lesson?.id;

                            return (
                              <button
                                type="button"
                                key={item.id}
                                className={`cp-lesson-item ${
                                  selected
                                    ? "cp-lesson-selected"
                                    : ""
                                }`}
                                onClick={() =>
                                  selectLesson(item.id)
                                }
                              >
                                <span
                                  className={`cp-lesson-number ${
                                    item.completed
                                      ? "cp-lesson-number-done"
                                      : ""
                                  }`}
                                >
                                  {item.completed
                                    ? "✓"
                                    : itemIndex + 1}
                                </span>

                                <span className="cp-lesson-item-text">
                                  <strong>{item.title}</strong>

                                  <small>
                                    {item.duration_minutes} min
                                    {" · "}
                                    {item.completed
                                      ? "Completed"
                                      : item.is_required
                                        ? "Required"
                                        : "Optional"}
                                  </small>
                                </span>

                                {selected && (
                                  <span className="cp-active-dot" />
                                )}
                              </button>
                            );
                          }
                        )}

                        {moduleLessons.length === 0 && (
                          <p className="cp-module-empty">
                            No lessons in this module.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </>
      )}

      <style>{`
        .cp-page {
          --cp-green: #155b43;
          --cp-green-dark: #123d31;
          --cp-muted: #70847b;
          --cp-border: #dfe8e2;
          --cp-surface: #ffffff;
          --cp-soft: #f5f8f5;

          width: 100%;
          max-width: 1480px;
          margin: 0 auto;
          padding: 12px 0 48px;
          color: #173b30;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
        }

        .cp-page,
        .cp-page * {
          box-sizing: border-box;
        }

        .cp-page h1,
        .cp-page h2,
        .cp-page h3,
        .cp-page h4,
        .cp-page p,
        .cp-page button,
        .cp-page a,
        .cp-page span,
        .cp-page strong,
        .cp-page small {
          font-family: Arial, Helvetica, sans-serif;
        }

        .cp-page h1,
        .cp-page h2,
        .cp-page h3,
        .cp-page h4 {
          letter-spacing: -0.3px;
        }

        /* PAGE HEADER */

        .cp-page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .cp-header-main {
          flex: 1;
          min-width: 0;
        }

        .cp-back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 22px;
          text-decoration: none;
          color: var(--cp-green);
          font-size: 13px;
          font-weight: 700;
        }

        .cp-back-link:hover {
          text-decoration: underline;
        }

        .cp-eyebrow {
          margin: 0 0 11px;
          color: #52806c;
          font-size: 11px;
          line-height: 1.5;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .cp-header-main h1 {
          margin: 0 0 10px;
          font-size: clamp(27px, 3vw, 34px);
          line-height: 1.2;
          font-weight: 800;
          color: #102f27;
          overflow-wrap: anywhere;
        }

        .cp-course-description {
          margin: 0;
          color: var(--cp-muted);
          font-size: 14px;
          line-height: 1.8;
          max-width: 720px;
          overflow-wrap: anywhere;
        }

        .cp-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .cp-meta-item {
          display: inline-flex;
          align-items: center;
          padding: 8px 13px;
          border: 1px solid var(--cp-border);
          border-radius: 9px;
          background: #fff;
          color: #4f6c5d;
          font-size: 12px;
          font-weight: 600;
        }

        /* HEADER PROGRESS */

        .cp-progress-summary {
          flex: 0 0 265px;
          background: #fff;
          border: 1px solid var(--cp-border);
          border-radius: 15px;
          padding: 20px;
        }

        .cp-progress-heading,
        .cp-curriculum-progress-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .cp-progress-heading span {
          color: #60786b;
          font-size: 12px;
          font-weight: 600;
        }

        .cp-progress-heading strong {
          color: var(--cp-green);
          font-size: 23px;
          font-weight: 800;
        }

        .cp-progress-track {
          width: 100%;
          height: 8px;
          margin-top: 15px;
          border-radius: 20px;
          background: #e8eee8;
          overflow: hidden;
        }

        .cp-progress-track > span {
          display: block;
          height: 100%;
          background: var(--cp-green);
          border-radius: inherit;
          transition: width 0.25s ease;
        }

        .cp-progress-summary p {
          margin: 12px 0 0;
          font-size: 11px;
          color: #84958a;
        }

        /* TWO COLUMN LAYOUT */

        .cp-content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 24px;
          align-items: start;
        }

        .cp-main-column {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cp-lesson-card,
        .cp-curriculum,
        .cp-assessment,
        .cp-empty {
          background: #fff;
          border: 1px solid var(--cp-border);
          border-radius: 16px;
          overflow: hidden;
        }

        /* LESSON HEADER */

        .cp-lesson-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 27px 28px;
          border-bottom: 1px solid #e9eeea;
        }

        .cp-lesson-heading {
          min-width: 0;
          flex: 1;
        }

        .cp-lesson-heading h2 {
          margin: 0 0 12px;
          font-size: 21px;
          line-height: 1.4;
          font-weight: 800;
          color: #153e30;
          overflow-wrap: anywhere;
        }

        .cp-lesson-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          color: #788d80;
          font-size: 12px;
          line-height: 1.5;
        }

        .cp-dot {
          color: #b4c3b9;
        }

        .cp-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          padding: 9px 12px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .cp-status-progress {
          color: #a16a1b;
          background: #fff3e3;
        }

        .cp-status-done {
          color: #187247;
          background: #e2f5e9;
        }

        /* LESSON CONTENT */

        .cp-lesson-content {
          min-height: 240px;
          padding: 28px;
        }

        .cp-reading-panel {
          padding: 24px;
          border: 1px solid #e4ece5;
          border-radius: 13px;
          background: #f7faf7;
        }

        .cp-reading-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-bottom: 20px;
          margin-bottom: 22px;
          border-bottom: 1px solid #e2eae2;
        }

        .cp-reading-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 11px;
          background: #e5f1e9;
          color: var(--cp-green);
          font-size: 23px;
        }

        .cp-reading-header h3 {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 800;
          color: #153e30;
        }

        .cp-reading-header p {
          margin: 0;
          font-size: 12px;
          color: #85958b;
          line-height: 1.5;
        }

        .cp-reading-body {
          font-size: 14px;
          line-height: 1.9;
          color: #4a6053;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .cp-video {
          display: block;
          width: 100%;
          max-height: 540px;
          border-radius: 12px;
          background: #12241c;
        }

        .cp-pdf {
          display: block;
          width: 100%;
          height: 580px;
          border: 1px solid var(--cp-border);
          border-radius: 12px;
        }

        .cp-media-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 260px;
          padding: 20px;
          border: 1px dashed #d7e5d9;
          border-radius: 12px;
          background: var(--cp-soft);
          color: #718579;
          font-size: 14px;
          text-align: center;
        }

        /* LESSON ACTIONS */

        .cp-lesson-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 20px 28px;
          border-top: 1px solid #e9eeea;
        }

        .cp-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 43px;
          padding: 11px 16px;
          border-radius: 9px;
          font-size: 12px;
          line-height: 1.4;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .cp-button-primary {
          background: var(--cp-green);
          color: #fff;
          border: 1px solid var(--cp-green);
        }

        .cp-button-primary:hover:not(:disabled) {
          background: #104a35;
          border-color: #104a35;
        }

        .cp-button-outline {
          background: #fff;
          color: #355d48;
          border: 1px solid #dce6df;
        }

        .cp-button-outline:hover:not(:disabled) {
          background: #f2f8f3;
        }

        .cp-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* CURRICULUM */

        .cp-curriculum {
          position: sticky;
          top: 20px;
        }

        .cp-curriculum-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 22px 20px;
          border-bottom: 1px solid #e9eeea;
        }

        .cp-curriculum-header .cp-eyebrow {
          margin-bottom: 7px;
        }

        .cp-curriculum-header h2 {
          margin: 0;
          font-size: 17px;
          line-height: 1.4;
          font-weight: 800;
          color: #173d30;
        }

        .cp-count-badge {
          flex-shrink: 0;
          padding: 8px 10px;
          border-radius: 30px;
          background: #edf5ef;
          color: #2d694b;
          font-size: 10px;
          font-weight: 700;
        }

        .cp-thumbnail {
          padding: 16px 20px 0;
        }

        .cp-thumbnail img {
          display: block;
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 10px;
        }

        .cp-curriculum-progress {
          padding: 20px;
          border-bottom: 1px solid #e9eeea;
        }

        .cp-curriculum-progress-top span {
          font-size: 12px;
          color: #71867a;
        }

        .cp-curriculum-progress-top strong {
          font-size: 13px;
          font-weight: 800;
          color: var(--cp-green);
        }

        .cp-curriculum-progress .cp-progress-track {
          height: 6px;
          margin-top: 12px;
        }

        .cp-module-list {
          max-height: 560px;
          overflow-y: auto;
        }

        .cp-module + .cp-module {
          border-top: 1px solid #e9eeea;
        }

        .cp-module-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 20px;
          background: #fbfcfa;
        }

        .cp-module-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 33px;
          height: 33px;
          border-radius: 9px;
          background: #e5f1e8;
          color: var(--cp-green);
          font-size: 12px;
          font-weight: 800;
        }

        .cp-module-info {
          min-width: 0;
        }

        .cp-module-info h3 {
          margin: 0 0 7px;
          color: #1d4937;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .cp-module-info p {
          margin: 0;
          font-size: 11px;
          color: #8a9b8f;
        }

        .cp-module-lessons {
          padding: 8px;
        }

        .cp-lesson-item {
          display: flex;
          align-items: center;
          gap: 11px;
          width: 100%;
          padding: 13px 12px;
          border: 1px solid transparent;
          border-radius: 10px;
          background: transparent;
          color: #3b5848;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s;
        }

        .cp-lesson-item:hover {
          background: #f4f8f4;
        }

        .cp-lesson-selected {
          background: #edf6ee;
          border-color: #dbe9dd;
        }

        .cp-lesson-selected:hover {
          background: #e8f3e9;
        }

        .cp-lesson-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #edf2ed;
          color: #6d8173;
          font-size: 11px;
          font-weight: 800;
        }

        .cp-lesson-number-done {
          background: #daf1e1;
          color: #187247;
        }

        .cp-lesson-item-text {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1;
          min-width: 0;
        }

        .cp-lesson-item-text strong {
          font-size: 12px;
          font-weight: 700;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .cp-lesson-item-text small {
          color: #84968a;
          font-size: 10px;
          line-height: 1.4;
        }

        .cp-active-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #1c7751;
        }

        .cp-no-modules,
        .cp-module-empty {
          padding: 20px;
          color: #829389;
          font-size: 12px;
          line-height: 1.6;
        }

        .cp-module-empty {
          padding: 10px 12px;
          margin: 0;
        }

        /* ASSESSMENT */

        .cp-assessment {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 22px;
        }

        .cp-assessment-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: #e7f2e9;
          color: var(--cp-green);
          font-size: 22px;
        }

        .cp-assessment-info {
          flex: 1;
          min-width: 0;
        }

        .cp-assessment-info h3 {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 800;
          color: #194532;
        }

        .cp-assessment-info p {
          margin: 0;
          font-size: 12px;
          line-height: 1.7;
          color: #778a7d;
        }

        .cp-assessment-link {
          flex-shrink: 0;
          white-space: nowrap;
        }

        .cp-assessment-passed,
        .cp-assessment-locked {
          flex-shrink: 0;
          padding: 9px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
        }

        .cp-assessment-passed {
          color: #187247;
          background: #e2f5e9;
        }

        .cp-assessment-locked {
          color: #927548;
          background: #faf1e4;
        }

        .cp-empty {
          padding: 50px 24px;
          text-align: center;
        }

        .cp-empty h2 {
          margin: 0 0 10px;
          font-size: 20px;
          font-weight: 800;
        }

        .cp-empty p {
          margin: 0;
          font-size: 13px;
          color: #7a8b80;
        }

        /* RESPONSIVE */

        @media (max-width: 1150px) {
          .cp-content-grid {
            grid-template-columns: minmax(0, 1fr) 300px;
            gap: 16px;
          }

          .cp-page-header {
            align-items: stretch;
            flex-direction: column;
          }

          .cp-progress-summary {
            flex: auto;
            width: 100%;
          }
        }

        @media (max-width: 850px) {
          .cp-content-grid {
            grid-template-columns: 1fr;
          }

          .cp-curriculum {
            position: static;
          }

          .cp-module-list {
            max-height: none;
          }
        }

        @media (max-width: 600px) {
          .cp-page {
            padding-top: 0;
          }

          .cp-header-main h1 {
            font-size: 27px;
          }

          .cp-lesson-header {
            flex-direction: column;
            padding: 20px;
          }

          .cp-lesson-heading h2 {
            font-size: 19px;
          }

          .cp-lesson-content {
            padding: 16px;
          }

          .cp-reading-panel {
            padding: 16px;
          }

          .cp-lesson-actions {
            padding: 16px;
            gap: 10px;
          }

          .cp-button {
            flex: 1;
            min-width: 120px;
          }

          .cp-assessment {
            flex-wrap: wrap;
          }

          .cp-assessment-link {
            width: 100%;
          }

          .cp-meta {
            gap: 7px;
          }
        }
      `}</style>
    </section>
  );
}
