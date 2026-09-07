"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * The menu in the top right of the panel: the site sections, each opening a
 * listing of just that section's entries.
 *
 * The categories are counted on the server and passed in, so this stays a
 * plain toggle and the file listing never reaches the browser.
 */
export default function CategoryMenu({
  categories,
}: {
  categories: { name: string; count: number }[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Following a link should close the menu behind you.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    // Capture, so Escape closes the menu before the browser's own Escape
    // binding takes it as "go back a page".
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="dv-menu" ref={rootRef}>
      <button
        type="button"
        className="dv-menu-button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={open ? "Close categories" : "Browse categories"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="dv-menu-bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </button>

      {open && (
        <nav className="dv-menu-panel" aria-label="Categories">
          {/* The rail down the left edge, as on the panel itself. */}
          <span className="dv-menu-rail" aria-hidden="true" />
          <div className="dv-menu-screen">
            <p className="dv-menu-heading">Categories</p>
            <ul>
              <li>
                <Link href="/">
                  INDEX <span className="dv-menu-count">all</span>
                </Link>
              </li>
              {categories.map(({ name, count }) => (
                <li key={name}>
                  <Link href={`/category/${encodeURIComponent(name)}`}>
                    {name} <span className="dv-menu-count">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </div>
  );
}
