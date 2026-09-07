"use client";

import Link from "next/link";

/**
 * Prev/Next either side of the panel, stepping through the index's own running
 * order.
 *
 * These sit in the frosted margin below the screen rather than inside it, so
 * they stay put while the page scrolls - unlike the game's own Prev/Next,
 * which belongs to an article's text and scrolls away with it.
 */
export default function Pager({
  order,
  slug,
}: {
  /** The index's running order - see indexOrder in src/lib/docs.ts. */
  order: string[];
  /** The entry on screen, or null on the index, a category or search. */
  slug: string | null;
}) {
  if (!slug) return null;

  const i = order.findIndex((s) => s.toLowerCase() === slug.toLowerCase());
  if (i === -1) return null;

  // Wrapping at both ends, so the pager is never a dead control.
  const prev = order[(i - 1 + order.length) % order.length];
  const next = order[(i + 1) % order.length];

  return (
    <>
      <Link
        className="dv-pager dv-pager--prev"
        href={`/${encodeURIComponent(prev)}`}
        title={prev}
      >
        <span aria-hidden="true">&lsaquo;</span> Prev
      </Link>
      <Link
        className="dv-pager dv-pager--next"
        href={`/${encodeURIComponent(next)}`}
        title={next}
      >
        Next <span aria-hidden="true">&rsaquo;</span>
      </Link>
    </>
  );
}
