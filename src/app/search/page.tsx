import Link from "next/link";
import { humanise, search } from "@/lib/docs";

export const metadata = { title: "Search - Data Vault" };

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await props.searchParams;
  const query = q.trim();
  const hits = query ? search(query) : [];

  return (
    <div className="dv-results">
      <h1>
        {query
          ? `${hits.length} result${hits.length === 1 ? "" : "s"} for "${query}"`
          : "Search"}
      </h1>

      {!query && (
        <p className="dv-result-excerpt">
          Type a query in the prompt bar below, or press <b>/</b> to jump
          straight to it.
        </p>
      )}

      {query && hits.length === 0 && (
        <p className="dv-result-excerpt">Nothing in the archive matches that.</p>
      )}

      {hits.map((hit) => (
        <div className="dv-result" key={hit.slug}>
          <Link href={`/${encodeURIComponent(hit.slug)}`}>
            {humanise(hit.slug)}
          </Link>
          <span className="dv-result-cat">{hit.category}</span>
          {hit.excerpt && <p className="dv-result-excerpt">{hit.excerpt}</p>}
        </div>
      ))}
    </div>
  );
}
