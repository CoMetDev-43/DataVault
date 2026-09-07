"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEFAULT_BOOKMARKS, STORAGE_KEY, type Bookmark } from "@/lib/bookmarks";

/**
 * The bookmark drawer, rising over the lower part of the panel exactly as in
 * "Page Example with bookmarks open.png". The four entries the game ships with
 * are always present; anything the reader saves is kept in localStorage and
 * listed underneath.
 */
export default function BookmarksPanel({
  currentSlug,
  onClose,
}: {
  currentSlug: string | null;
  onClose: () => void;
}) {
  const [saved, setSaved] = useState<Bookmark[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw) as Bookmark[]);
    } catch {
      // Private browsing or blocked storage - defaults still work.
    }
  }, []);

  function persist(next: Bookmark[]) {
    setSaved(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* not fatal */
    }
  }

  const alreadySaved =
    !!currentSlug &&
    (saved.some((b) => b.slug === currentSlug) ||
      DEFAULT_BOOKMARKS.some((b) => b.slug === currentSlug));

  // Focus the first bookmark so ENTER follows it, as the prompt bar promises.
  useEffect(() => {
    const first = document.querySelector<HTMLElement>(".dv-bookmarks a");
    first?.focus();
  }, []);

  return (
    <div className="dv-bookmarks" role="dialog" aria-label="Bookmarks">
      <h2 />
      <ul>
        <li>
          <Link href="/" onClick={onClose}>
            INDEX
          </Link>
        </li>
        {DEFAULT_BOOKMARKS.map((b) => (
          <li key={b.slug}>
            <Link href={`/${encodeURIComponent(b.slug)}`} onClick={onClose}>
              {b.label}
            </Link>
          </li>
        ))}
        {saved.map((b) => (
          <li key={b.slug}>
            <Link href={`/${encodeURIComponent(b.slug)}`} onClick={onClose}>
              {b.label}
            </Link>
            <button
              type="button"
              className="dv-bm-remove"
              onClick={() => persist(saved.filter((s) => s.slug !== b.slug))}
              aria-label={`Remove ${b.label}`}
            >
              &times;
            </button>
          </li>
        ))}
      </ul>

      {currentSlug && !alreadySaved && (
        <button
          type="button"
          className="dv-bm-remove"
          style={{ marginLeft: 0, marginTop: "0.75rem" }}
          onClick={() =>
            persist([...saved, { label: currentSlug, slug: currentSlug }])
          }
        >
          + Bookmark this page
        </button>
      )}
    </div>
  );
}
