import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError } from "../api/client.ts";
import { portalApi, when } from "../api/portal.ts";

type Certificate = Record<string, unknown>;
const value = (v: unknown) => v == null ? "" : String(v);
const readableError = (caught: unknown, fallback: string) => caught instanceof ApiError ? caught.message : fallback;
const certificateCss = `
/* All styles remain local to this component and override generic admin typography. */
.cert-v5, .cert-verify-v5 { isolation:isolate; }
.cert-v5 :is(h1,h2,h3,p,span,strong,a,label,button,input), .cert-verify-v5 :is(h1,h2,h3,p,span,strong,a,button) { font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif !important; }
.cert-v5 :is(h1,h2,h3), .cert-verify-v5 :is(h1,h2,h3) { text-transform:none; font-style:normal; }
.cert-v5 button, .cert-v5 input { box-shadow:none; }
.cert-v5 button:focus-visible, .cert-v5 a:focus-visible, .cert-v5 input:focus-visible { outline:3px solid #9ad5bd;outline-offset:2px; }
.cert-v5 .cv-card:hover { border-color:#b9d6c8; box-shadow:0 10px 28px rgba(22,70,51,.07); }
.cert-v5 .cv-stat strong { font-weight:800; }
.cert-v5 .cv-dialog { overscroll-behavior:contain; }
.cert-v5 .cv-dialoghead { position:sticky;top:0;background:#fff;z-index:1; }
.cert-v5 .cv-btn { min-height:42px; }
.cert-v5 .cv-cardtop { min-height:104px; }
@media(max-width:600px){.cert-v5 .cv-panelhead{align-items:stretch}.cert-v5 .cv-search{width:100%;min-width:0}.cert-v5 .cv-actions .cv-btn{flex:1}.cert-v5 .cv-dialogactions .cv-btn{flex:1}.cert-v5 .cv-stat{padding:16px}}
.cert-v5,.cert-verify-v5{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif!important;color:#172d2a;box-sizing:border-box}
.cert-v5 *, .cert-verify-v5 *{box-sizing:border-box;font-family:inherit}
.cert-v5{width:100%;max-width:1320px;margin:0 auto;padding:26px 28px 70px}
.cert-v5 h1,.cert-v5 h2,.cert-v5 h3,.cert-verify-v5 h1,.cert-verify-v5 h2{font-family:inherit!important;letter-spacing:-.035em;margin:0;color:#172d2a;line-height:1.2}
.cert-v5 button,.cert-v5 input,.cert-verify-v5 button{font:inherit}
.cert-v5 .cv-kicker{font-size:11px;letter-spacing:.16em;font-weight:800;text-transform:uppercase;color:#4c8072;margin:0 0 8px}
.cert-v5 .cv-head{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:24px;flex-wrap:wrap}
.cert-v5 .cv-head h1{font-size:30px;font-weight:800}
.cert-v5 .cv-sub{font-size:14px;color:#71827d;margin:8px 0 0;line-height:1.6}
.cert-v5 .cv-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin-bottom:24px}
.cert-v5 .cv-stat{background:#fff;border:1px solid #e1e9e5;border-radius:15px;padding:20px;display:flex;gap:15px;align-items:center}
.cert-v5 .cv-stat-icon{width:44px;height:44px;flex:none;border-radius:12px;background:#e9f4ee;color:#175c46;display:grid;place-items:center;font-size:23px}
.cert-v5 .cv-stat span{display:block;font-size:12px;color:#75837e;margin-bottom:5px}
.cert-v5 .cv-stat strong{font-size:25px;line-height:1.2}
.cert-v5 .cv-panel{background:#fff;border:1px solid #e0e8e4;border-radius:17px;overflow:hidden}
.cert-v5 .cv-panelhead{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:21px 23px;border-bottom:1px solid #edf1ee;flex-wrap:wrap}
.cert-v5 .cv-panelhead h2{font-size:17px;font-weight:750}
.cert-v5 .cv-panelhead p{font-size:13px;color:#7a8983;margin:6px 0 0}
.cert-v5 .cv-search{min-width:220px;width:min(340px,100%);border:1px solid #dce5df;border-radius:10px;padding:11px 14px;background:#fff;color:#172d2a;outline:none;font-size:13px}
.cert-v5 .cv-search:focus{border-color:#24745b;box-shadow:0 0 0 3px #dcefe5}
.cert-v5 .cv-grid{padding:22px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px}
.cert-v5 .cv-card{border:1px solid #e0e8e4;border-radius:15px;overflow:hidden;background:#fff;min-width:0}
.cert-v5 .cv-cardtop{background:linear-gradient(115deg,#eaf3eb,#f7f3e8);padding:20px 22px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.cert-v5 .cv-medal{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#a47b2d;font-size:28px;box-shadow:0 3px 14px #244c3b12}
.cert-v5 .cv-tag{border-radius:30px;background:#e5f5eb;color:#17724d;font-size:11px;font-weight:750;padding:7px 11px;white-space:nowrap}
.cert-v5 .cv-cardbody{padding:20px 22px}
.cert-v5 .cv-cardbody h3{font-size:18px;font-weight:750;overflow-wrap:anywhere}
.cert-v5 .cv-code{font-size:12px;color:#678278;margin:9px 0 16px;overflow-wrap:anywhere}
.cert-v5 .cv-meta{display:flex;gap:8px;justify-content:space-between;border-top:1px solid #eef2ef;padding-top:13px;color:#788781;font-size:12px;flex-wrap:wrap}
.cert-v5 .cv-meta strong{color:#2b4640;font-weight:650}
.cert-v5 .cv-actions{display:flex;gap:10px;margin-top:19px;flex-wrap:wrap}
.cert-v5 .cv-btn{border:1px solid #dbe6df;border-radius:10px;background:#fff;color:#215844;padding:10px 15px;cursor:pointer;font-size:13px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:7px;text-decoration:none;transition:background .15s}
.cert-v5 .cv-btn:hover{background:#f1f7f3}
.cert-v5 .cv-btn-primary{background:#175c46;color:#fff;border-color:#175c46}
.cert-v5 .cv-btn-primary:hover{background:#104733}
.cert-v5 .cv-btn:disabled{opacity:.6;cursor:not-allowed}
.cert-v5 .cv-empty{padding:55px 20px;text-align:center;color:#75857d}
.cert-v5 .cv-empty strong{display:block;color:#1d3c33;font-size:17px;margin:8px 0}
.cert-v5 .cv-notice{border:1px solid #f1c7c7;background:#fff5f5;color:#a12d2d;padding:12px 16px;border-radius:10px;margin-bottom:16px;font-size:13px}
.cert-v5 .cv-loading{padding:50px;text-align:center;color:#71827d}
.cert-v5 .cv-overlay{position:fixed;inset:0;background:#0c2420aa;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}
.cert-v5 .cv-dialog{width:min(700px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 25px 90px #0003}
.cert-v5 .cv-dialoghead{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid #e8eeea}
.cert-v5 .cv-dialoghead h2{font-size:17px;font-weight:750}
.cert-v5 .cv-x{border:0;background:#f0f4f1;width:34px;height:34px;border-radius:9px;cursor:pointer;color:#254b3d;font-size:22px}
.cert-v5 .cv-certificate{margin:22px;border:7px solid #f1ebdc;outline:1px solid #c6ad76;outline-offset:-13px;padding:44px 28px;text-align:center;background:#fffdf8}
.cert-v5 .cv-certificate .cv-seal{font-size:42px;color:#ae8b43;margin-bottom:12px}
.cert-v5 .cv-certificate .cv-certlabel{font-size:12px;letter-spacing:.23em;font-weight:800;color:#9b7c42;text-transform:uppercase}
.cert-v5 .cv-certificate h2{font-size:30px;margin:15px 0 8px}
.cert-v5 .cv-certificate .cv-person{font-size:26px;font-weight:750;color:#175c46;margin:12px 0}
.cert-v5 .cv-certificate p{font-size:14px;color:#64766d;line-height:1.7}
.cert-v5 .cv-certificate .cv-course{font-size:20px;font-weight:750;color:#1a3e32;margin:8px 0 18px;overflow-wrap:anywhere}
.cert-v5 .cv-certfoot{border-top:1px solid #e8dfca;padding-top:16px;display:flex;justify-content:space-between;gap:10px;font-size:11px;color:#69786f;flex-wrap:wrap}
.cert-v5 .cv-dialogactions{display:flex;justify-content:flex-end;gap:10px;padding:0 22px 22px;flex-wrap:wrap}
.cert-verify-v5{min-height:100vh;background:linear-gradient(135deg,#eaf2ec,#f9f7f1);display:grid;place-items:center;padding:24px}
.cert-verify-v5 .cv-verifycard{background:#fff;border:1px solid #dce8e0;border-radius:22px;max-width:590px;width:100%;padding:40px;text-align:center;box-shadow:0 16px 45px #193c2810}
.cert-verify-v5 .cv-verifyicon{font-size:42px;margin-bottom:16px}
.cert-verify-v5 h1{font-size:28px;font-weight:800;margin:0 0 12px}
.cert-verify-v5 .cv-verifydesc{font-size:14px;color:#70837a;line-height:1.6}
.cert-verify-v5 .cv-verifyinfo{margin-top:24px;text-align:left;background:#f6f9f6;border:1px solid #e8eee9;border-radius:13px;padding:20px}
.cert-verify-v5 .cv-verifyrow{display:flex;justify-content:space-between;gap:15px;padding:11px 0;border-bottom:1px solid #e7ede8;font-size:13px;overflow-wrap:anywhere}
.cert-verify-v5 .cv-verifyrow:last-child{border:0}
.cert-verify-v5 .cv-verifyrow span{color:#71847a}
.cert-verify-v5 .cv-verifyrow strong{text-align:right;color:#24483b}
@media(max-width:850px){.cert-v5{padding:20px 15px 45px}.cert-v5 .cv-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.cert-v5 .cv-grid{grid-template-columns:1fr}}
@media(max-width:520px){.cert-v5 .cv-stats{grid-template-columns:1fr}.cert-v5 .cv-head h1{font-size:25px}.cert-v5 .cv-grid{padding:13px}.cert-v5 .cv-cardbody{padding:17px}.cert-v5 .cv-certificate{padding:35px 16px;margin:14px}.cert-v5 .cv-certificate h2{font-size:23px}.cert-v5 .cv-certificate .cv-person{font-size:21px}.cert-verify-v5 .cv-verifycard{padding:28px 20px}}
`;

export function CertificatesPage() {
  const [items, setItems] = useState<Certificate[] | null>(null);
  const [preview, setPreview] = useState<Certificate | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    setItems(null);
    portalApi.certificates()
      .then((response) => { if (active) setItems(response.data?.items ?? []); })
      .catch((caught) => {
        if (active) { setError(readableError(caught, "Certificates could not be loaded.")); setItems([]); }
      });
    return () => { active = false; };
  }, [reloadKey]);

  const filtered = useMemo(() => (items ?? []).filter((item) =>
    [item.course_title, item.certificate_code, item.therapist_name].some((v) => value(v).toLowerCase().includes(query.toLowerCase()))
  ), [items, query]);

  async function download(id: string, code: string) {
    setError("");
    setDownloading(id);
    let url: string | undefined;
    try {
      const blob = await portalApi.pdf(id);
      url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${code || "certificate"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (caught) {
      setError(readableError(caught, "Unable to download the certificate."));
    } finally {
      if (url) window.setTimeout(() => URL.revokeObjectURL(url!), 1000);
      setDownloading(null);
    }
  }

  return (
    <section className="cert-v5">
      <style>{certificateCss}</style>
      <div className="cv-head">
        <div><p className="cv-kicker">Learning achievements</p><h1>My Certificates</h1><p className="cv-sub">View, verify and download your earned professional certificates.</p></div>
        <button type="button" className="cv-btn" onClick={() => setReloadKey((key) => key + 1)}>↻ Refresh</button>
      </div>
      {error && <div className="cv-notice" role="alert">{error}</div>}
      <div className="cv-stats">
        <div className="cv-stat"><div className="cv-stat-icon">♛</div><div><span>Certificates Earned</span><strong>{items?.length ?? "—"}</strong></div></div>
        <div className="cv-stat"><div className="cv-stat-icon">▤</div><div><span>Courses Certified</span><strong>{items ? new Set(items.map((i) => value(i.course_title))).size : "—"}</strong></div></div>
        <div className="cv-stat"><div className="cv-stat-icon">✓</div><div><span>Available to Download</span><strong>{items?.length ?? "—"}</strong></div></div>
      </div>
      <div className="cv-panel">
        <div className="cv-panelhead"><div><h2>Certificate Library</h2><p>All certificates issued to your account.</p></div><input className="cv-search" aria-label="Search certificates" placeholder="Search course or certificate ID..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        {items === null ? <div className="cv-loading">Loading certificates...</div> : filtered.length === 0 ? (
          <div className="cv-empty"><div style={{fontSize:34}}>♧</div><strong>{query ? "No matching certificates" : "No certificates yet"}</strong><span>{query ? "Try a different search term." : "A certificate is issued when you pass a course assessment."}</span></div>
        ) : <div className="cv-grid">{filtered.map((item) => {
          const id = value(item.id), code = value(item.certificate_code);
          return <article className="cv-card" key={id}>
            <div className="cv-cardtop"><div className="cv-medal" aria-hidden="true">★</div><span className="cv-tag">✓ Issued</span></div>
            <div className="cv-cardbody"><h3>{value(item.course_title) || "Course Certificate"}</h3><p className="cv-code">Certificate ID: {code || "—"}</p>
              <div className="cv-meta"><span>Issue Date</span><strong>{item.issued_at ? when(item.issued_at) : "—"}</strong></div>
              <div className="cv-actions"><button type="button" className="cv-btn" onClick={() => setPreview(item)}>Preview</button><button type="button" className="cv-btn cv-btn-primary" disabled={downloading === id} onClick={() => void download(id, code)}>{downloading === id ? "Downloading..." : "↓ Download PDF"}</button></div>
            </div>
          </article>;
        })}</div>}
      </div>
      {preview && <div className="cv-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setPreview(null); }}>
        <div className="cv-dialog" role="dialog" aria-modal="true" aria-label="Certificate preview">
          <div className="cv-dialoghead"><h2>Certificate Preview</h2><button type="button" className="cv-x" aria-label="Close preview" onClick={() => setPreview(null)}>×</button></div>
          <div className="cv-certificate"><div className="cv-seal">✦</div><div className="cv-certlabel">Spa Therapist Portal</div><h2>Certificate of Completion</h2><p>This certificate is proudly presented to</p><div className="cv-person">{value(preview.therapist_name) || "Certificate Holder"}</div><p>for successfully completing the course</p><div className="cv-course">{value(preview.course_title)}</div><div className="cv-certfoot"><span>ID: {value(preview.certificate_code)}</span><span>Issued: {preview.issued_at ? when(preview.issued_at) : "—"}</span></div></div>
          <div className="cv-dialogactions"><a className="cv-btn" href={`/certificates/verify/${encodeURIComponent(value(preview.certificate_code))}`} target="_blank" rel="noopener noreferrer">Verify Certificate ↗</a><button type="button" className="cv-btn cv-btn-primary" disabled={downloading === value(preview.id)} onClick={() => void download(value(preview.id), value(preview.certificate_code))}>↓ Download PDF</button></div>
        </div>
      </div>}
    </section>
  );
}

export function VerifyCertificatePage() {
  const { code = "" } = useParams();
  const [record, setRecord] = useState<Certificate | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setRecord(null); setError(""); setLoading(true);
    if (!code.trim()) { setError("Certificate code is missing."); setLoading(false); return; }
    portalApi.verify(code)
      .then((response) => { if (active) setRecord(response.data ?? null); })
      .catch((caught) => { if (active) setError(readableError(caught, "This certificate could not be verified.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [code]);

  return <main className="cert-verify-v5"><style>{certificateCss}</style><article className="cv-verifycard">
    <div className="cv-verifyicon" aria-hidden="true">{loading ? "◌" : error || !record ? "⚠" : "✓"}</div>
    <h1>{loading ? "Checking Certificate" : error || !record ? "Certificate Not Verified" : "Certificate Verified"}</h1>
    <p className="cv-verifydesc">{loading ? "Please wait while we check this certificate." : error || !record ? (error || "No certificate was found for this code.") : "This certificate has been verified by Spa Therapist Portal."}</p>
    {record && !error && !loading && <div className="cv-verifyinfo">
      <div className="cv-verifyrow"><span>Therapist</span><strong>{value(record.therapistName)}</strong></div>
      <div className="cv-verifyrow"><span>Course</span><strong>{value(record.courseTitle)}</strong></div>
      <div className="cv-verifyrow"><span>Certificate ID</span><strong>{value(record.certificateCode)}</strong></div>
      <div className="cv-verifyrow"><span>Issue Date</span><strong>{record.issuedAt ? when(record.issuedAt) : "—"}</strong></div>
    </div>}
  </article></main>;
}
