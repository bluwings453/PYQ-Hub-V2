import InstituteSearch from "./InstituteSearch";

export default function FilterBar({ catalog, filters, setFilters }) {
  if (!catalog) return null;

  const update = (patch) => setFilters((prev) => ({ ...prev, ...patch }));

  return (
    <div className="rounded-md border border-hairline bg-surface p-5 sm:p-6 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="block">
          <span className="text-xs text-ink-soft">Institute</span>
          <div className="mt-1">
            <InstituteSearch
              institutes={catalog.institutes}
              value={filters.institute}
              onChange={(code) => update({ institute: code })}
              allowClear
              clearLabel="All institutes"
            />
          </div>
        </div>

        <label className="block">
          <span className="text-xs text-ink-soft">Branch</span>
          <select
            value={filters.branch}
            onChange={(e) => update({ branch: e.target.value })}
            className="mt-1 w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-sm text-ink focus:border-maroon"
          >
            <option value="">All branches</option>
            {catalog.branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <span className="text-xs text-ink-soft">Semester</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => update({ semester: "" })}
            className={`rounded-sm px-3 py-1.5 text-sm border transition-colors ${
              filters.semester === ""
                ? "border-maroon bg-maroon-light text-maroon"
                : "border-hairline text-ink-soft hover:border-maroon"
            }`}
          >
            All
          </button>
          {catalog.semesters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ semester: String(s) })}
              className={`h-9 w-9 rounded-sm text-sm border transition-colors ${
                filters.semester === String(s)
                  ? "border-maroon bg-maroon-light text-maroon"
                  : "border-hairline text-ink-soft hover:border-maroon"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <span className="text-xs text-ink-soft">Exam</span>
          <div className="mt-1.5 flex gap-1.5">
            {["", ...catalog.examTypes].map((type) => (
              <button
                key={type || "all"}
                type="button"
                onClick={() => update({ examType: type })}
                className={`rounded-sm px-3 py-1.5 text-sm border transition-colors ${
                  filters.examType === type
                    ? "border-maroon bg-maroon-light text-maroon"
                    : "border-hairline text-ink-soft hover:border-maroon"
                }`}
              >
                {type === "" ? "All" : type.replace(" Semester", "")}
              </button>
            ))}
          </div>
        </div>

        <label className="block flex-1 min-w-[180px]">
          <span className="text-xs text-ink-soft">Subject</span>
          <input
            type="text"
            placeholder="Search by subject name"
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
            className="mt-1 w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-maroon"
          />
        </label>
      </div>
    </div>
  );
}
