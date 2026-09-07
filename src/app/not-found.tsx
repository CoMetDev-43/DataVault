import Link from "next/link";

export default function NotFound() {
  return (
    <div className="dv-results">
      <h1>404 - Page not found</h1>
      <p className="dv-result-excerpt">
        No such entry exists in this archive.
      </p>
      <p className="dv-result-excerpt">
        <Link href="/">Return to the index</Link>
      </p>
    </div>
  );
}
