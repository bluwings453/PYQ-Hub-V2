import { useEffect, useState } from "react";
import { api } from "../api";

export default function Admin() {
  const [token, setToken] = useState(sessionStorage.getItem("pyq_admin_token") || "");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [papers, setPapers] = useState([]);
  const [previewId, setPreviewId] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loadError, setLoadError] = useState("");

  const loadPending = (t) => {
    setLoadError("");
    api
      .adminGetPapers(t, "pending")
      .then(setPapers)
      .catch(() => setLoadError("Session expired, sign in again."));
  };

  useEffect(() => {
    if (token) loadPending(token);
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const { token: t } = await api.adminLogin(password);
      sessionStorage.setItem("pyq_admin_token", t);
      setToken(t);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const decide = async (id, status) => {
    await api.adminSetStatus(token, id, status);
    setPapers((prev) => prev.filter((p) => p._id !== id));
    if (previewId === id) closePreview();
  };

  const remove = async (id) => {
    await api.adminDelete(token, id);
    setPapers((prev) => prev.filter((p) => p._id !== id));
    if (previewId === id) closePreview();
  };

  const closePreview = () => {
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setPreviewUrls([]);
    setPreviewId(null);
  };

  const togglePreview = async (paper) => {
    if (previewId === paper._id) {
      closePreview();
      return;
    }
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setPreviewUrls([]);
    setPreviewId(paper._id);
    try {
      const blobs = await Promise.all(paper.files.map((_, i) => api.adminFileBlob(token, paper._id, i)));
      setPreviewUrls(blobs.map((b) => URL.createObjectURL(b)));
    } catch {
      setLoadError("Could not load the file for preview.");
      setPreviewId(null);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-sm px-5 py-20">
        <h1 className="font-serif text-2xl text-ink">Moderator sign-in</h1>
        <form onSubmit={handleLogin} className="mt-6 space-y-3">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-sm focus:border-maroon"
          />
          {loginError && <p className="text-sm text-maroon">{loginError}</p>}
          <button
            type="submit"
            className="w-full rounded-sm bg-maroon px-4 py-2 text-sm text-on-maroon hover:bg-maroon-dark transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">Review queue</h1>
        <span className="text-sm text-ink-soft">{papers.length} pending</span>
      </div>

      {loadError && <p className="mt-4 text-sm text-maroon">{loadError}</p>}
      {!loadError && papers.length === 0 && <p className="mt-6 text-sm text-ink-soft">Queue is clear. Nothing to review.</p>}

      <div className="mt-6 space-y-3">
        {papers.map((p) => (
          <div key={p._id} className="border border-hairline rounded-md p-4 bg-surface">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-serif text-base text-ink">
                  {p.subjectName} {p.subjectCode && <span className="text-ink-soft font-sans text-sm">· {p.subjectCode}</span>}
                </p>
                <p className="text-sm text-ink-soft mt-0.5">
                  {p.instituteName} — {p.branch} — Sem {p.semester} — {p.examType} — {p.year}
                </p>
                {p.uploaderName && (
                  <p className="text-xs text-ink-soft mt-1">
                    Submitted by {p.uploaderName} {p.uploaderContact && `(${p.uploaderContact})`}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => togglePreview(p)}
                  className="rounded-sm border border-hairline px-3 py-1.5 text-xs text-ink-soft hover:border-maroon"
                >
                  {previewId === p._id ? "Hide" : "Preview"}
                </button>
                <button
                  onClick={() => decide(p._id, "approved")}
                  className="rounded-sm bg-maroon px-3 py-1.5 text-xs text-on-maroon hover:bg-maroon-dark"
                >
                  Approve
                </button>
                <button
                  onClick={() => decide(p._id, "rejected")}
                  className="rounded-sm border border-hairline px-3 py-1.5 text-xs text-ink-soft hover:border-maroon"
                >
                  Reject
                </button>
                <button
                  onClick={() => remove(p._id)}
                  className="rounded-sm border border-hairline px-3 py-1.5 text-xs text-ink-soft hover:border-maroon"
                >
                  Delete
                </button>
              </div>
            </div>

            {previewId === p._id && (
              <div className="mt-4 space-y-2">
                {previewUrls.length === 0 && <p className="text-sm text-ink-soft">Loading preview…</p>}
                {p.fileType === "pdf"
                  ? previewUrls[0] && (
                      <iframe title={`preview-${p._id}`} src={previewUrls[0]} className="w-full h-96 border border-hairline rounded-sm" />
                    )
                  : previewUrls.map((url, i) => (
                      <img key={i} src={url} alt={`Page ${i + 1}`} className="w-full border border-hairline rounded-sm" />
                    ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
