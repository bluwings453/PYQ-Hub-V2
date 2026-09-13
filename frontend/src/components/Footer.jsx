import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-hairline mt-20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-ink-soft">
        <p>Built by students, kept alive by students.</p>
        <Link to="/admin" className="text-ink-soft hover:text-ink transition-colors">
          Moderator sign-in
        </Link>
      </div>
    </footer>
  );
}
