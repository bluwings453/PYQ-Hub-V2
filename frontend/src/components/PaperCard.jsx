import { useState } from "react";
import { api } from "../api";

export default function PaperCard({ paper, onUpvoted }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isImages = paper.fileType === "images";
  const pageCount = paper.files?.length || 0;

  const handleUpvote = async () => {
    try {
      const { upvotes } = await api.upvote(paper._id);
      onUpvoted(paper._id, upvotes);
    } catch {
      // silent - upvoting is a nice-to-have, not worth interrupting the person over
    }
  };

  if (!pageCount) return null; // an old-format record with no files - nothing safe to render

  return (
    <div className="border border-hairline bg-surface rounded-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-serif text-base text-ink truncate">
          {paper.subjectName}
          {paper.subjectCode && <span className="text-ink-soft font-sans text-sm"> · {paper.subjectCode}</span>}
        </p>
        <p className="text-sm text-ink-soft mt-0.5">
          {paper.instituteName} — {paper.branch}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-sm bg-paper border border-hairline px-2 py-0.5 text-xs text-ink-soft">
            Sem {paper.semester}
          </span>
          <span className="rounded-sm bg-paper border border-hairline px-2 py-0.5 text-xs text-ink-soft">
            {paper.examType}
          </span>
          <span className="rounded-sm bg-paper border border-hairline px-2 py-0.5 text-xs text-ink-soft">
            {paper.year}
          </span>
          {isImages && (
            <span className="rounded-sm bg-paper border border-hairline px-2 py-0.5 text-xs text-ink-soft">
              {pageCount} page{pageCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
        <button
          type="button"
          onClick={handleUpvote}
          className="text-xs text-ink-soft hover:text-maroon transition-colors"
          title="Mark this as helpful"
        >
          ▲ Helpful ({paper.upvotes})
        </button>
        <div className="flex gap-2">
          {isImages ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="rounded-sm bg-maroon px-4 py-2 text-sm text-on-maroon hover:bg-maroon-dark transition-colors whitespace-nowrap"
            >
              View pages
            </button>
          ) : (
            <>
              <a
                href={api.viewUrl(paper._id)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm border border-hairline px-4 py-2 text-sm text-ink-soft hover:border-maroon hover:text-maroon transition-colors whitespace-nowrap"
              >
                View
              </a>
              <a
                href={api.downloadUrl(paper._id)}
                className="rounded-sm bg-maroon px-4 py-2 text-sm text-on-maroon hover:bg-maroon-dark transition-colors whitespace-nowrap"
              >
                Download
              </a>
            </>
          )}
        </div>
      </div>

      {isImages && lightboxOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/80 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="bg-surface rounded-md max-w-2xl w-full my-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-hairline">
              <p className="font-serif text-ink">
                {paper.subjectName} — {pageCount} page{pageCount === 1 ? "" : "s"}
              </p>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="text-ink-soft hover:text-maroon text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              {paper.files.map((f, i) => (
                <div key={i}>
                  <img src={f.url} alt={`Page ${i + 1}`} className="w-full rounded-sm border border-hairline" />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-ink-soft">Page {i + 1}</span>
                    <a
                      href={api.downloadUrl(paper._id, i)}
                      className="text-xs text-maroon hover:underline"
                    >
                      Download this page
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
