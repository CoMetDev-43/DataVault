"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BookmarksPanel from "@/components/BookmarksPanel";
import CategoryMenu from "@/components/CategoryMenu";
import Pager from "@/components/Pager";

/**
 * The terminal prop: the six-sided glass panel, its mounting hardware and edge
 * light, the white rectangular frame that holds the scrolling page, and the
 * prompt bar along the bottom.
 *
 * Key bindings follow the in-game browser:
 *   ENTER  follow the focused link      ESC  previous page
 *   X      close browser (back to index) H    home page
 *   B      open/close bookmarks          /    search
 */
export default function Terminal({
  children,
  categories,
  order,
}: {
  children: React.ReactNode;
  /** Counted on the server - see listCategories in src/lib/docs.ts. */
  categories: { name: string; count: number }[];
  /** The index's running order, for the Prev/Next pair - see indexOrder. */
  order: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);

  // A new page always starts at the top of the panel.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setBookmarksOpen(false);
  }, [pathname]);

  const scrollBy = useCallback((amount: number) => {
    scrollRef.current?.scrollBy({ top: amount, behavior: "smooth" });
  }, []);

  /** Enter is only meaningful once a link is focused, so give it one. */
  const focusFirstLink = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return false;
    const link = root.querySelector<HTMLElement>("a[href], button.dv-audio");
    if (!link) return false;
    link.focus();
    return true;
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (typing) {
        if (e.key === "Escape") target?.blur();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case "Enter": {
          // If a link already has focus the browser follows it for us.
          const active = document.activeElement as HTMLElement | null;
          if (active?.tagName === "A" || active?.classList.contains("dv-audio")) return;
          if (focusFirstLink()) e.preventDefault();
          return;
        }
        case "Escape":
          e.preventDefault();
          if (bookmarksOpen) setBookmarksOpen(false);
          else router.back();
          return;
        case "x":
        case "X":
          e.preventDefault();
          router.push("/");
          return;
        case "h":
        case "H":
          e.preventDefault();
          router.push("/home");
          return;
        case "b":
        case "B":
          e.preventDefault();
          setBookmarksOpen((v) => !v);
          return;
        case "/":
          e.preventDefault();
          searchRef.current?.focus();
          return;
        case "ArrowDown":
          e.preventDefault();
          scrollBy(90);
          return;
        case "ArrowUp":
          e.preventDefault();
          scrollBy(-90);
          return;
        case "PageDown":
          e.preventDefault();
          scrollBy((scrollRef.current?.clientHeight ?? 600) * 0.85);
          return;
        case "PageUp":
          e.preventDefault();
          scrollBy(-(scrollRef.current?.clientHeight ?? 600) * 0.85);
          return;
        case "Home":
          e.preventDefault();
          scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          return;
        case "End":
          e.preventDefault();
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
          });
          return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bookmarksOpen, focusFirstLink, router, scrollBy]);

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchRef.current?.value.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  /** The slug of the entry on screen, or null on /, /search and /category. */
  const slug =
    pathname === "/" ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/category")
      ? null
      : decodeURIComponent(pathname.slice(1));

  return (
    <div className="dv-stage">
      <div className="dv-topbar">
        <a
          className="dv-brand"
          href="https://www.youtube.com/@NoQuestionBeats"
          target="_blank"
          rel="noreferrer"
          title="NoQuestion on YouTube"
        >
          <img src="/images/NoQLogo.png" alt="" />
          <span>NoQuestion</span>
        </a>
        <CategoryMenu categories={categories} />
      </div>

      <div className="dv-viewport">
        <div className="dv-rig" aria-hidden="true" />
        <div className="dv-halo" aria-hidden="true" />

        <div className="dv-glass">
          <div className="dv-lightbar" aria-hidden="true" />

          <div className="dv-screen">
            <div className="dv-scroll" ref={scrollRef}>
              {children}
            </div>

            {bookmarksOpen && (
              <BookmarksPanel
                currentSlug={slug}
                onClose={() => setBookmarksOpen(false)}
              />
            )}
          </div>

          {/* In the frosted margin below the screen, so it does not scroll
              away with the page. */}
          <Pager order={order} slug={slug} />
        </div>

        {/* Mounting hardware, outside the panel so it can overhang its edge. */}
        <div className="dv-mount" aria-hidden="true">
          <div className="dv-rail" />
          <div className="dv-hinge dv-hinge--top" />
          <div className="dv-hinge dv-hinge--bottom" />
        </div>
      </div>

      <div className="dv-hud">
        {bookmarksOpen ? (
          <div className="dv-hud-group">
            <span className="dv-hint">
              <span className="dv-key">ENTER</span> Follow Bookmark
            </span>
            <button
              type="button"
              className="dv-hint"
              onClick={() => setBookmarksOpen(false)}
            >
              <span className="dv-key">ESC</span> Close Bookmarks
            </button>
          </div>
        ) : (
          <>
            <div className="dv-hud-group">
              <button type="button" className="dv-hint" onClick={() => focusFirstLink()}>
                <span className="dv-key">ENTER</span> Follow Link
              </button>
              <button type="button" className="dv-hint" onClick={() => router.back()}>
                <span className="dv-key">ESC</span> Previous Page
              </button>
              <button type="button" className="dv-hint" onClick={() => router.push("/")}>
                <span className="dv-key">X</span> Close Browser
              </button>
              <button
                type="button"
                className="dv-hint"
                onClick={() => router.push("/home")}
              >
                <span className="dv-key">H</span> Home Page
              </button>
            </div>

            <div className="dv-hud-group">
              <form onSubmit={runSearch}>
                <input
                  ref={searchRef}
                  className="dv-search"
                  type="search"
                  placeholder="Search"
                  aria-label="Search the data vault"
                />
              </form>
              <button
                type="button"
                className="dv-hint"
                onClick={() => setBookmarksOpen(true)}
              >
                <span className="dv-key">B</span> Open Bookmarks
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
