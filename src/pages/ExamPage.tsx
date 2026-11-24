import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../api/client.ts";
import { portalApi } from "../api/portal.ts";
import { ConfirmDialog, Notice } from "../components/ui.tsx";

interface Option {
  id: string;
  question_id: string;
  option_text: string;
}

interface Question {
  id: string;
  prompt: string;
  marks: number;
}

interface Paper {
  attempt: {
    id: string;
    expires_at: string | null;
    submitted_at: string | null;
    title?: string;
  };
  questions: Question[];
  options: Option[];
}

const styles = `
.exam-v3, .exam-v3 * { box-sizing: border-box; }
.exam-v3 {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px 64px;
  color: #15382f;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
}

/* TOP HEADER */
.exam-v3 .ev-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 22px;
}
.exam-v3 .ev-kicker {
  font-size: 11px;
  font-weight: 800;
  color: #1e634e;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.exam-v3 .ev-title {
  font-size: 28px;
  font-weight: 760;
  color: #12362c;
  line-height: 1.25;
  margin: 0;
  letter-spacing: -0.02em;
}

/* TIMER CARD */
.exam-v3 .ev-timer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px;
  background: #ffffff;
  border: 1.5px solid #d4e3dc;
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(18, 48, 38, 0.04);
}
.exam-v3 .ev-timer.is-warning {
  border-color: #fca5a5;
  background: #fff5f5;
  animation: evTimerPulse 1.5s infinite;
}
@keyframes evTimerPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.2); }
  50% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0.15); }
}
.exam-v3 .ev-timer-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eef7f2;
  color: #1a5e4a;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.exam-v3 .ev-timer.is-warning .ev-timer-icon {
  background: #fee2e2;
  color: #dc2626;
}
.exam-v3 .ev-timer-meta {
  display: flex;
  flex-direction: column;
}
.exam-v3 .ev-timer-label {
  font-size: 10.5px;
  font-weight: 750;
  color: #698378;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.exam-v3 .ev-timer-value {
  font-size: 19px;
  font-weight: 800;
  color: #14382e;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  margin-top: 2px;
}
.exam-v3 .ev-timer.is-warning .ev-timer-value {
  color: #dc2626;
}

/* PROGRESS BAR */
.exam-v3 .ev-progress-wrap {
  background: #ffffff;
  border: 1px solid #e1ebe5;
  border-radius: 12px;
  padding: 12px 18px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.exam-v3 .ev-progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 650;
  color: #4b665c;
}
.exam-v3 .ev-progress-bar {
  height: 6px;
  background: #e8f0eb;
  border-radius: 100px;
  overflow: hidden;
}
.exam-v3 .ev-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1e5c4a, #288469);
  border-radius: 100px;
  transition: width 0.3s ease;
}

/* QUESTION CARD */
.exam-v3 .ev-card {
  background: #ffffff;
  border: 1px solid #dce6e0;
  border-radius: 18px;
  padding: 30px 34px 28px;
  box-shadow: 0 10px 30px -4px rgba(16, 44, 34, 0.04);
  margin-bottom: 22px;
}
.exam-v3 .ev-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
.exam-v3 .ev-question-pill {
  background: #eef6f1;
  color: #175442;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid #d3e7dc;
}
.exam-v3 .ev-marks-pill {
  background: #fbf8f2;
  color: #8c714e;
  font-size: 11px;
  font-weight: 750;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #ebd9c2;
}
.exam-v3 .ev-prompt {
  font-size: 20px;
  font-weight: 650;
  color: #13352c;
  line-height: 1.45;
  margin: 0 0 24px;
}

/* OPTIONS LIST */
.exam-v3 .ev-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.exam-v3 .ev-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: 1.5px solid #e1ece5;
  border-radius: 14px;
  background: #fafcfb;
  cursor: pointer;
  transition: all 0.18s ease;
  user-select: none;
}
.exam-v3 .ev-option:hover {
  background: #f1f8f4;
  border-color: #9eccb5;
  transform: translateY(-1px);
}
.exam-v3 .ev-option.is-selected {
  background: #edf7f2;
  border-color: #1e5c4a;
  box-shadow: 0 2px 12px rgba(30, 92, 74, 0.08);
}
.exam-v3 .ev-option-badge {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1.5px solid #d4e2db;
  background: #ffffff;
  color: #435e53;
  font-size: 13px;
  font-weight: 750;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}
.exam-v3 .ev-option.is-selected .ev-option-badge {
  background: #1e5c4a;
  border-color: #1e5c4a;
  color: #ffffff;
}
.exam-v3 .ev-option-text {
  flex: 1;
  font-size: 14.5px;
  color: #1e3931;
  line-height: 1.45;
}
.exam-v3 .ev-option-check {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid #c7d8cf;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: #fff;
  transition: all 0.15s ease;
}
.exam-v3 .ev-option.is-selected .ev-option-check {
  border-color: #1e5c4a;
  background: #1e5c4a;
  color: #fff;
}

/* BOTTOM PALETTE & NAVIGATION */
.exam-v3 .ev-nav-card {
  background: #ffffff;
  border: 1px solid #e1ebe5;
  border-radius: 16px;
  padding: 18px 24px;
  box-shadow: 0 6px 20px rgba(18, 48, 38, 0.03);
}
.exam-v3 .ev-nav-palette {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #edf2ee;
  flex-wrap: wrap;
}
.exam-v3 .ev-palette-label {
  font-size: 12px;
  font-weight: 750;
  color: #638075;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.exam-v3 .ev-palette-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.exam-v3 .ev-palette-chip {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1.5px solid #d5e2dc;
  background: #f7faf8;
  color: #3b574d;
  font-size: 13px;
  font-weight: 750;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.15s ease;
}
.exam-v3 .ev-palette-chip:hover {
  background: #eaf4ee;
  border-color: #92bfa9;
}
.exam-v3 .ev-palette-chip.is-answered {
  background: #1e5c4a;
  border-color: #1e5c4a;
  color: #ffffff;
}
.exam-v3 .ev-palette-chip.is-current {
  box-shadow: 0 0 0 3px #bee3d1;
  border-color: #1e5c4a;
}
.exam-v3 .ev-palette-chip.is-answered.is-current {
  box-shadow: 0 0 0 3px #bee3d1;
}

.exam-v3 .ev-nav-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}
.exam-v3 .ev-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 22px;
  border-radius: 11px;
  font-size: 13.5px;
  font-weight: 650;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 0;
  text-decoration: none;
}
.exam-v3 .ev-btn.secondary {
  background: #ffffff;
  border: 1.5px solid #d5ded8;
  color: #325044;
}
.exam-v3 .ev-btn.secondary:hover:not(:disabled) {
  background: #f0f6f2;
  border-color: #b7cbbf;
}
.exam-v3 .ev-btn.secondary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.exam-v3 .ev-btn.primary {
  background: #1e5c4a;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(30, 92, 74, 0.2);
}
.exam-v3 .ev-btn.primary:hover {
  background: #154537;
  transform: translateY(-1px);
}
.exam-v3 .ev-btn.submit {
  background: linear-gradient(135deg, #17654a, #114c37);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(23, 101, 74, 0.28);
  font-weight: 750;
  padding: 0 26px;
}
.exam-v3 .ev-btn.submit:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

/* RESULTS CARD */
.exam-v3 .ev-result-card {
  background: #ffffff;
  border: 1px solid #dce6df;
  border-radius: 20px;
  padding: 42px 36px;
  box-shadow: 0 16px 40px -8px rgba(16, 44, 34, 0.08);
  text-align: center;
  max-width: 640px;
  margin: 20px auto;
}
.exam-v3 .ev-result-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  margin: 0 auto 20px;
  display: grid;
  place-items: center;
  font-size: 32px;
}
.exam-v3 .ev-result-icon.passed {
  background: #e6f6ec;
  color: #167342;
}
.exam-v3 .ev-result-icon.failed {
  background: #fee2e2;
  color: #dc2626;
}
.exam-v3 .ev-result-title {
  font-size: 26px;
  font-weight: 800;
  color: #14362d;
  margin: 0 0 10px;
}
.exam-v3 .ev-result-desc {
  font-size: 14px;
  color: #556f64;
  line-height: 1.55;
  margin: 0 0 28px;
}
.exam-v3 .ev-result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 20px;
  background: #f7faf8;
  border-radius: 14px;
  border: 1px solid #e3ece6;
  margin-bottom: 28px;
}
.exam-v3 .ev-result-stat-label {
  font-size: 11px;
  font-weight: 700;
  color: #728a7f;
  text-transform: uppercase;
}
.exam-v3 .ev-result-stat-val {
  font-size: 22px;
  font-weight: 800;
  color: #14382e;
  margin-top: 4px;
}
.exam-v3 .ev-result-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 680px) {
  .exam-v3 { padding: 16px 8px 48px; }
  .exam-v3 .ev-header { flex-direction: column; align-items: flex-start; gap: 14px; }
  .exam-v3 .ev-timer { width: 100%; justify-content: space-between; }
  .exam-v3 .ev-card { padding: 22px 18px; }
  .exam-v3 .ev-prompt { font-size: 17px; }
  .exam-v3 .ev-nav-card { padding: 16px; }
  .exam-v3 .ev-nav-palette { flex-direction: column; align-items: flex-start; gap: 10px; }
  .exam-v3 .ev-result-stats { grid-template-columns: 1fr; }
}
`;

export function ExamPage() {
  const { assessmentId = "" } = useParams();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    portalApi
      .startAttempt(assessmentId)
      .then((response) => setPaper(response.data as unknown as Paper))
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : "The assessment could not be started.");
      });
  }, [assessmentId]);

  useEffect(() => {
    const expires = paper?.attempt.expires_at;
    if (!expires || result) return;
    const tick = () => {
      const left = new Date(expires).getTime() - Date.now();
      if (left <= 0) {
        setRemaining("00:00");
        return;
      }
      const minutes = Math.floor(left / 60000);
      const seconds = Math.floor((left % 60000) / 1000);
      setRemaining(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [paper?.attempt.expires_at, result]);

  const question = paper?.questions[index];

  async function submit() {
    if (!paper) return;
    setBusy(true);
    setError("");
    try {
      const response = await portalApi.submitAttempt(
        paper.attempt.id,
        paper.questions.map((item) => ({ questionId: item.id, optionId: answers[item.id] ?? "" })),
      );
      setResult(response.data ?? null);
      setConfirm(false);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The assessment could not be submitted.");
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleRetake() {
    setBusy(true);
    setError("");
    try {
      const response = await portalApi.startAttempt(assessmentId);
      setPaper(response.data as unknown as Paper);
      setResult(null);
      setAnswers({});
      setIndex(0);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The assessment could not be restarted.");
    } finally {
      setBusy(false);
    }
  }

  // RESULT SCREEN
  if (result) {
    const passed = Boolean(result.passed);
    return (
      <section className="exam-v3">
        <style>{styles}</style>
        <div className="ev-result-card">
          <div className={`ev-result-icon ${passed ? "passed" : "failed"}`}>
            {passed ? "✓" : "!"}
          </div>
          <h2 className="ev-result-title">
            {passed ? "Assessment Passed!" : "Assessment Completed"}
          </h2>
          <p className="ev-result-desc">
            {passed
              ? "Congratulations! You have successfully passed the assessment and met the certification standard."
              : "You did not achieve the required passing score. Review the learning materials or retake the assessment below."}
          </p>

          <div className="ev-result-stats">
            <div>
              <div className="ev-result-stat-label">Your Score</div>
              <div className="ev-result-stat-val">
                {String(result.score)} / {String(result.maxScore)}
              </div>
            </div>
            <div>
              <div className="ev-result-stat-label">Percentage</div>
              <div className="ev-result-stat-val" style={{ color: passed ? "#167342" : "#dc2626" }}>
                {String(result.percentage)}%
              </div>
            </div>
            <div>
              <div className="ev-result-stat-label">Passing Mark</div>
              <div className="ev-result-stat-val">{String(result.passingPercentage)}%</div>
            </div>
          </div>

          <div className="ev-result-actions">
            {passed ? (
              <Link className="ev-btn primary" to="/certificates">
                View My Certificate ↗
              </Link>
            ) : (
              <button
                type="button"
                className="ev-btn primary"
                disabled={busy}
                onClick={handleRetake}
              >
                {busy ? "Starting Retake…" : "🔄 Retake Assessment"}
              </button>
            )}
            <Link className="ev-btn secondary" to="/assessments">
              Back to Assessments
            </Link>
            <Link className="ev-btn secondary" to="/learning">
              Review Learning
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="exam-v3">
        <style>{styles}</style>
        <Notice tone="error">{error}</Notice>
        <div style={{ marginTop: 20 }}>
          <Link className="ev-btn secondary" to="/assessments">
            ← Back to Assessments
          </Link>
        </div>
      </section>
    );
  }

  if (!paper) {
    return <div className="shell-skeleton" style={{ maxWidth: 960, margin: "24px auto" }} />;
  }

  if (!paper.questions || paper.questions.length === 0 || !question) {
    return (
      <section className="exam-v3">
        <style>{styles}</style>
        <header className="ev-header">
          <div>
            <div className="ev-kicker">Assessment</div>
            <h1 className="ev-title">{paper.attempt?.title || "Assessment"}</h1>
          </div>
        </header>
        <article className="ev-card">
          <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>No Questions Available</h2>
          <p style={{ color: "#617d72", fontSize: 13.5, lineHeight: 1.5 }}>
            This assessment currently does not have any questions configured. Please check back later or contact your administrator.
          </p>
          <div style={{ marginTop: 20 }}>
            <Link className="ev-btn secondary" to="/assessments">
              ← Back to Assessments
            </Link>
          </div>
        </article>
      </section>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = paper.questions.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);
  const currentOptions = paper.options.filter((option) => option.question_id === question.id);
  const isTimeWarning = remaining.startsWith("00:") || remaining.startsWith("01:") || remaining.startsWith("02:");

  return (
    <section className="exam-v3">
      <style>{styles}</style>

      {/* HEADER WITH TITLE & TIMER */}
      <header className="ev-header">
        <div>
          <div className="ev-kicker">Examination · Online Certification</div>
          <h1 className="ev-title">{paper.attempt?.title || "Course Assessment"}</h1>
        </div>

        {remaining ? (
          <div className={`ev-timer ${isTimeWarning ? "is-warning" : ""}`} title="Time remaining for this exam">
            <div className="ev-timer-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="ev-timer-meta">
              <span className="ev-timer-label">Time Remaining</span>
              <strong className="ev-timer-value">{remaining}</strong>
            </div>
          </div>
        ) : null}
      </header>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {/* PROGRESS TRACKER */}
      <div className="ev-progress-wrap">
        <div className="ev-progress-info">
          <span>Question {index + 1} of {totalQuestions}</span>
          <span>{answeredCount} of {totalQuestions} answered ({progressPercent}%)</span>
        </div>
        <div className="ev-progress-bar">
          <div className="ev-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* MAIN QUESTION CARD */}
      <article className="ev-card">
        <div className="ev-card-top">
          <span className="ev-question-pill">QUESTION {String(index + 1).padStart(2, "0")}</span>
          <span className="ev-marks-pill">{question.marks} {question.marks === 1 ? "Mark" : "Marks"}</span>
        </div>

        <h2 className="ev-prompt">{question.prompt}</h2>

        <div className="ev-options">
          {currentOptions.map((option, optIdx) => {
            const isSelected = answers[question.id] === option.id;
            const letter = String.fromCharCode(65 + optIdx);
            return (
              <label
                key={option.id}
                className={`ev-option ${isSelected ? "is-selected" : ""}`}
                onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
              >
                <div className="ev-option-badge">{letter}</div>
                <span className="ev-option-text">{option.option_text}</span>
                <div className="ev-option-check">
                  {isSelected ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : null}
                </div>
              </label>
            );
          })}
        </div>
      </article>

      {/* BOTTOM QUESTION PALETTE & NAVIGATION */}
      <div className="ev-nav-card">
        <div className="ev-nav-palette">
          <span className="ev-palette-label">Question Jump</span>
          <div className="ev-palette-chips">
            {paper.questions.map((item, itemIndex) => {
              const isAnswered = Boolean(answers[item.id]);
              const isCurrent = itemIndex === index;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`ev-palette-chip ${isAnswered ? "is-answered" : ""} ${isCurrent ? "is-current" : ""}`}
                  onClick={() => setIndex(itemIndex)}
                  title={`Go to Question ${itemIndex + 1} (${isAnswered ? "Answered" : "Unanswered"})`}
                >
                  {itemIndex + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ev-nav-actions">
          <button
            type="button"
            className="ev-btn secondary"
            disabled={index === 0}
            onClick={() => setIndex((value) => value - 1)}
          >
            ← Previous Question
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            {index < totalQuestions - 1 ? (
              <button
                type="button"
                className="ev-btn primary"
                onClick={() => setIndex((value) => value + 1)}
              >
                Next Question →
              </button>
            ) : null}

            <button
              type="button"
              className="ev-btn submit"
              onClick={() => setConfirm(true)}
            >
              Submit Assessment ✓
            </button>
          </div>
        </div>
      </div>

      {confirm ? (
        <ConfirmDialog
          title="Submit Assessment"
          message={`You have answered ${answeredCount} of ${totalQuestions} questions. Are you sure you want to finish and submit your exam now?`}
          confirmLabel="Submit"
          busy={busy}
          onConfirm={submit}
          onClose={() => setConfirm(false)}
        />
      ) : null}
    </section>
  );
}
