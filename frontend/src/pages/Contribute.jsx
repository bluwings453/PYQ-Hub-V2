import { useEffect, useState } from "react";
import { api } from "../api";
import InstituteSearch from "../components/InstituteSearch";

const initialForm = {
  instituteCode: "",
  branch: "",
  semester: "",
  examType: "",
  subjectName: "",
  subjectCode: "",
  year: new Date().getFullYear(),
  uploaderName: "",
  uploaderContact: "",
  note: "",
};

export default function Contribute() {
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const loadCatalog = () => {
    setCatalogError("");
    api
      .getCatalog()
      .then(setCatalog)
      .catch(() => setCatalogError("Couldn't load the list of institutes/branches. The server may still be waking up."));
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const hasPdf = files.some((f) => f.type === "application/pdf");

  const handleFilesChosen = (e) => {
    const picked = Array.from(e.target.files);
    e.target.value = ""; // so picking the same file again still fires this handler

    const merged = [...files, ...picked];
    const mergedHasPdf = merged.some((f) => f.type === "application/pdf");
    if (mergedHasPdf && merged.length > 1) {
      setFileError("A PDF should be a single file — don't mix it with photos, or add more than one PDF.");
      return;
    }
    setFileError("");
    setFiles(merged);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError("");
  };

  const moveFile = (index, direction) => {
    setFiles((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.instituteCode) {
      setFileError("");
      setStatus({ state: "error", message: "Select an institute from the list." });
      return;
    }
    if (files.length === 0) {
      setFileError("Attach a PDF, or one-or-more photos of the paper.");
      return;
    }
    setStatus({ state: "submitting", message: "" });

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    files.forEach((f) => body.append("files", f));

    try {
      const res = await api.uploadPaper(body);
      setStatus({ state: "success", message: res.message });
      setForm(initialForm);
      setFiles([]);
      e.target.reset();
    } catch (err) {
      setStatus({ state: "error", message: err.message });
    }
  };

  if (status.state === "success") {
    return (
      <div className="mx-auto max-w-xl px-5 sm:px-8 py-16 text-center">
        <p className="font-serif text-2xl text-ink">Thank you.</p>
        <p className="mt-2 text-ink-soft">{status.message}</p>
        <button
          type="button"
          onClick={() => setStatus({ state: "idle", message: "" })}
          className="mt-6 rounded-sm bg-maroon px-4 py-2 text-sm text-on-maroon hover:bg-maroon-dark transition-colors"
        >
          Add another paper
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 sm:px-8 py-12 sm:py-16">
      <h1 className="font-serif text-3xl text-ink">Add a paper to the archive</h1>
      <p className="mt-2 text-ink-soft">
        A PDF, or photos of each page from your phone — either works. It goes to a quick review, then it's
        live for everyone after you.
      </p>

      {catalogError && (
        <div className="mt-4 rounded-sm border border-maroon/40 bg-maroon-light p-3 text-sm text-maroon flex items-center justify-between gap-3">
          <span>{catalogError}</span>
          <button type="button" onClick={loadCatalog} className="shrink-0 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-ink-soft">Institute</span>
            <div className="mt-1">
              <InstituteSearch
                institutes={catalog?.institutes || []}
                value={form.instituteCode}
                onChange={(code) => set({ instituteCode: code })}
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs text-ink-soft">Branch</span>
            <select
              required
              value={form.branch}
              onChange={(e) => set({ branch: e.target.value })}
              className="mt-1 w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-sm focus:border-maroon"
            >
              <option value="">Select branch</option>
              {catalog?.branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-ink-soft">Semester</span>
            <select
              required
              value={form.semester}
              onChange={(e) => set({ semester: e.target.value })}
              className="mt-1 w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-sm focus:border-maroon"
            >
              <option value="">Select semester</option>
              {catalog?.semesters.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-ink-soft">Exam</span>
            <select
              required
              value={form.examType}
              onChange={(e) => set({ examType: e.target.value })}
              className="mt-1 w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-sm focus:border-maroon"
            >
              <option value="">Select exam type</option>
              {catalog?.examTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-ink-soft">Subject name</span>
            <input
              required
              type="text"
              value={form.subjectName}
              onChange={(e) => set({ subjectName: e.target.value })}
              className="mt-1 w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-sm focus:border-maroon"
              placeholder="e.g. Data Structures"
            />
          </label>

          <label className="block">
            <span className="text-xs text-ink-soft">Subject code (optional)</span>
            <input
              type="text"
              value={form.subjectCode}
              onChange={(e) => set({ subjectCode: e.target.value })}
              className="mt-1 w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-sm focus:border-maroon"
              placeholder="e.g. CS201"
            />
          </label>

          <label className="block">
            <span className="text-xs text-ink-soft">Year of exam</span>
            <input
              required
              type="number"
              min="2005"
              max={new Date().getFullYear()}
              value={form.year}
              onChange={(e) => set({ year: e.target.value })}
              className="mt-1 w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-sm focus:border-maroon"
            />
          </label>
        </div>

        <div>
          <span className="text-xs text-ink-soft">PDF, or photos of each page</span>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            multiple={!hasPdf}
            onChange={handleFilesChosen}
            className="mt-1 w-full text-sm text-ink-soft file:mr-3 file:rounded-sm file:border-0 file:bg-maroon-light file:px-3 file:py-2 file:text-maroon"
          />
          <p className="mt-1 text-xs text-ink-soft">
            One PDF, or add photos one page at a time — they'll show in the order below.
          </p>

          {fileError && <p className="mt-2 text-xs text-maroon">{fileError}</p>}

          {files.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-sm border border-hairline bg-paper px-3 py-1.5 text-xs text-ink-soft"
                >
                  <span className="truncate">
                    {hasPdf ? "" : `Page ${i + 1} — `}
                    {f.name}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    {!hasPdf && files.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => moveFile(i, -1)}
                          disabled={i === 0}
                          className="hover:text-maroon disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFile(i, 1)}
                          disabled={i === files.length - 1}
                          className="hover:text-maroon disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>
                      </>
                    )}
                    <button type="button" onClick={() => removeFile(i)} className="hover:text-maroon" title="Remove">
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-hairline pt-5 space-y-4">
          <p className="text-xs text-ink-soft">
            Optional, but it helps us reach you if there's a question about this paper.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-ink-soft">Your name</span>
              <input
                type="text"
                value={form.uploaderName}
                onChange={(e) => set({ uploaderName: e.target.value })}
                className="mt-1 w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-sm focus:border-maroon"
              />
            </label>
            <label className="block">
              <span className="text-xs text-ink-soft">Email</span>
              <input
                type="email"
                value={form.uploaderContact}
                onChange={(e) => set({ uploaderContact: e.target.value })}
                className="mt-1 w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-sm focus:border-maroon"
              />
            </label>
          </div>
        </div>

        {status.state === "error" && <p className="text-sm text-maroon">{status.message}</p>}

        <button
          type="submit"
          disabled={status.state === "submitting"}
          className="w-full rounded-sm bg-maroon px-4 py-3 text-sm text-on-maroon hover:bg-maroon-dark transition-colors disabled:opacity-60"
        >
          {status.state === "submitting" ? "Submitting…" : "Add to archive"}
        </button>
      </form>
    </div>
  );
}
