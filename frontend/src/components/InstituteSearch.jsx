import { useEffect, useMemo, useRef, useState } from "react";
import { useTypewriter } from "../useTypewriter";

const TYPE_LABELS = { IIT: "IITs", NIT: "NITs", IIIT: "IIITs", Other: "Other Engineering Colleges" };
const TYPE_ORDER = ["IIT", "NIT", "IIIT", "Other"];
const DEFAULT_EXAMPLES = ["IIT Bombay", "NIT Warangal", "NIT Patna", "IIIT Allahabad"];

function computeResults(institutes, rawQuery) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return institutes.slice(0, 60);

  const scored = [];
  for (const inst of institutes) {
    const name = inst.name.toLowerCase();
    let score = null;
    if (name.startsWith(query)) score = 0;
    else if (name.includes(query)) score = 1;
    if (score !== null) scored.push({ ...inst, _score: score });
  }
  scored.sort((a, b) => a._score - b._score || a.name.localeCompare(b.name));
  return scored.slice(0, 60);
}

function groupByType(results) {
  const buckets = {};
  results.forEach((r) => {
    buckets[r.type] = buckets[r.type] || [];
    buckets[r.type].push(r);
  });
  return TYPE_ORDER.filter((t) => buckets[t]).map((t) => ({ type: t, items: buckets[t] }));
}

function highlightMatch(text, query) {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="text-maroon">{text.slice(idx, idx + q.length)}</strong>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function InstituteSearch({
  institutes,
  value,
  onChange,
  allowClear = false,
  clearLabel = "All institutes",
  placeholderWords = DEFAULT_EXAMPLES,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef(null);
  const typed = useTypewriter(placeholderWords);

  const selected = institutes.find((i) => i.code === value) || null;

  useEffect(() => {
    setQuery(selected ? selected.name : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery(selected ? selected.name : "");
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [selected]);

  const results = useMemo(() => computeResults(institutes, query), [institutes, query]);
  const grouped = useMemo(() => groupByType(results), [results]);

  const selectInstitute = (inst) => {
    onChange(inst ? inst.code : "");
    setQuery(inst ? inst.name : "");
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[highlight]) selectInstitute(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(selected ? selected.name : "");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={`${typed}|`}
        autoComplete="off"
        className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 pr-7 text-sm text-ink focus:border-maroon"
      />
      {query && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => selectInstitute(null)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-soft hover:text-maroon text-sm"
          tabIndex={-1}
          title="Clear"
        >
          ✕
        </button>
      )}

      {open && (
        <div className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-sm border border-hairline bg-surface shadow-lg">
          {allowClear && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectInstitute(null)}
              className="block w-full text-left px-3 py-2 text-sm text-ink-soft hover:bg-paper border-b border-hairline"
            >
              {clearLabel}
            </button>
          )}

          {results.length === 0 && <p className="px-3 py-3 text-sm text-ink-soft">No matches.</p>}

          {grouped.map((group) => (
            <div key={group.type}>
              <p className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-ink-soft/70">
                {TYPE_LABELS[group.type] || group.type}
              </p>
              {group.items.map((inst) => {
                const idx = results.indexOf(inst);
                return (
                  <button
                    key={inst.code}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectInstitute(inst)}
                    onMouseEnter={() => setHighlight(idx)}
                    className={`block w-full text-left px-3 py-2 text-sm ${
                      idx === highlight ? "bg-maroon-light text-maroon" : "text-ink hover:bg-paper"
                    }`}
                  >
                    {highlightMatch(inst.name, query)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
