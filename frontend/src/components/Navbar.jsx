import { Link, useLocation } from "react-router-dom";
import { useDarkMode } from "../useDarkMode";

export default function Navbar() {
  const location = useLocation();
  const [dark, setDark] = useDarkMode();

  const linkClass = (path) =>
    `text-sm transition-colors ${
      location.pathname === path ? "text-ink" : "text-ink-soft hover:text-ink"
    }`;

  return (
    <header className="border-b border-hairline bg-paper/90 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-maroon text-on-maroon font-serif text-sm">
            PQ
          </span>
          <span className="font-serif text-lg text-ink">PYQ Hub</span>
        </Link>

        <nav className="flex items-center gap-5">
          <Link to="/" className={linkClass("/")}>
            Browse
          </Link>
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="text-ink-soft hover:text-ink transition-colors text-base leading-none"
          >
            {dark ? "☀️" : "🌙"}
          </button>
          <Link
            to="/contribute"
            className="rounded-sm bg-maroon px-4 py-2 text-sm text-on-maroon hover:bg-maroon-dark transition-colors"
          >
            Add a paper
          </Link>
        </nav>
      </div>
    </header>
  );
}
