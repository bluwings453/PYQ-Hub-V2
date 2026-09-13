import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import FilterBar from "../components/FilterBar";
import PaperCard from "../components/PaperCard";
import EmptyState from "../components/EmptyState";

const emptyFilters = { institute: "", branch: "", semester: "", examType: "", q: "" };

export default function Home() {
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slowLoad, setSlowLoad] = useState(false);
  const [papersError, setPapersError] = useState("");
  const slowTimerRef = useRef(null);

  const loadCatalog = () => {
    setCatalogError("");
    api
      .getCatalog()
      .then(setCatalog)
      .catch(() => setCatalogError("Couldn't load institutes/branches. The server may still be waking up."));
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    setLoading(true);
    setSlowLoad(false);

    // A free-tier backend that's been idle can take up to a minute to wake up
    // on the first request - if it's taking a while, say so instead of leaving
    // "Searching…" up with no explanation.
    slowTimerRef.current = setTimeout(() => setSlowLoad(true), 4000);

    const debounce = setTimeout(() => {
      api
        .getPapers(filters)
        .then((data) => {
          setPapers(data);
          setPapersError("");
        })
        .catch(() => setPapersError("Could not load papers right now. Try refreshing in a moment."))
        .finally(() => {
          setLoading(false);
          clearTimeout(slowTimerRef.current);
        });
    }, 250);

    return () => {
      clearTimeout(debounce);
      clearTimeout(slowTimerRef.current);
    };
  }, [filters]);

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8 py-12 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
          Every previous paper your seniors keep losing, in one place.
        </h1>
        <p className="mt-3 text-ink-soft">
          Pick your institute, branch and semester. Mid-sem or end-sem, any year that's been shared — no more
          hunting through WhatsApp groups two days before an exam.
        </p>
      </div>

      {catalogError ? (
        <div className="mt-8 rounded-sm border border-maroon/40 bg-maroon-light p-3 text-sm text-maroon flex items-center justify-between gap-3">
          <span>{catalogError}</span>
          <button type="button" onClick={loadCatalog} className="shrink-0 underline hover:no-underline">
            Retry
          </button>
        </div>
      ) : (
        <div className="mt-8">
          <FilterBar catalog={catalog} filters={filters} setFilters={setFilters} />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {papersError && <p className="text-sm text-maroon">{papersError}</p>}

        {!papersError && loading && (
          <p className="text-sm text-ink-soft">
            {slowLoad ? "Waking up the server — first load after a quiet spell can take a minute…" : "Searching…"}
          </p>
        )}

        {!papersError && !loading && papers.length === 0 && <EmptyState />}

        {!papersError &&
          !loading &&
          papers.map((paper) => (
            <PaperCard
              key={paper._id}
              paper={paper}
              onUpvoted={(id, upvotes) =>
                setPapers((prev) => prev.map((p) => (p._id === id ? { ...p, upvotes } : p)))
              }
            />
          ))}
      </div>
    </div>
  );
}
