import { Link } from "react-router-dom";

export default function EmptyState() {
  return (
    <div className="border border-dashed border-hairline rounded-md p-10 text-center">
      <p className="font-serif text-lg text-ink">Nothing here yet.</p>
      <p className="text-sm text-ink-soft mt-1.5 max-w-sm mx-auto">
        No one's added a paper for this combination yet. If you have one sitting on your laptop, be the first.
      </p>
      <Link
        to="/contribute"
        className="inline-block mt-4 rounded-sm bg-maroon px-4 py-2 text-sm text-on-maroon hover:bg-maroon-dark transition-colors"
      >
        Add a paper
      </Link>
    </div>
  );
}
