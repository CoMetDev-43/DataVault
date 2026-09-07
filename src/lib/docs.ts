import fs from "fs";
import path from "path";
import { parseCodexHtml, nodeText, type CodexNode } from "./parse";
import { mastheadFor } from "./layout";

/**
 * ./output is the single source of truth for page content. Nothing in this file
 * rewrites it - it only reads, indexes and resolves references out of it.
 */
export const OUTPUT_DIR = path.join(process.cwd(), "output");
const IMAGES_DIR = path.join(process.cwd(), "public", "images");

export type CodexDoc = {
  /** Filename without the .htm extension. Doubles as the URL path segment. */
  slug: string;
  file: string;
  category: string;
  nodes: CodexNode[];
  /** The <PREFIX>_image001 masthead, hoisted out of the body to the top. */
  banner: string | null;
  text: string;
};

/* ------------------------------------------------------------------ *
 * File listing
 * ------------------------------------------------------------------ */

let fileCache: string[] | null = null;

/** All .htm filenames in ./output, sorted case-insensitively. */
export function listFiles(): string[] {
  if (!fileCache) {
    fileCache = fs
      .readdirSync(OUTPUT_DIR)
      .filter((f) => f.toLowerCase().endsWith(".htm"))
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }
  return fileCache;
}

export function slugOf(file: string): string {
  return file.replace(/\.htm$/i, "");
}

/** All slugs, in the same order as listFiles(). */
export function listSlugs(): string[] {
  return listFiles().map(slugOf);
}

let slugIndex: Map<string, string> | null = null;

/** Resolve a slug to its real filename, tolerating differences in case. */
export function resolveSlug(slug: string): string | null {
  if (!slugIndex) {
    slugIndex = new Map();
    for (const file of listFiles()) slugIndex.set(slugOf(file).toLowerCase(), file);
  }
  return slugIndex.get(decodeURIComponent(slug).toLowerCase()) ?? null;
}

/* ------------------------------------------------------------------ *
 * Images
 * ------------------------------------------------------------------ */

let imageIndex: Map<string, string> | null = null;

/**
 * Map an <img src> from the source to a path under /public/images.
 *
 * The .htm files reference images in the game's original casing
 * ("CIA_image001.png") while the files on disk are lowercase
 * ("cia_image001.png"), so the lookup is case-insensitive.
 */
export function resolveImage(src: string): string | null {
  if (!imageIndex) {
    imageIndex = new Map();
    if (fs.existsSync(IMAGES_DIR)) {
      for (const f of fs.readdirSync(IMAGES_DIR)) imageIndex.set(f.toLowerCase(), f);
    }
  }
  const key = src.replace(/^\.?\//, "").toLowerCase();
  const hit = imageIndex.get(key);
  return hit ? `/images/${hit}` : null;
}

/* ------------------------------------------------------------------ *
 * Categories
 * ------------------------------------------------------------------ */

/**
 * Category is derived from the filename prefix - the corpus has no other
 * grouping. Pages without a prefix (index, home, voyagerprogramcontactpage)
 * fall back to "Standalone".
 */
export const CATEGORIES = [
  "BLOGOSPHERE",
  "CDP",
  "CEA",
  "CIA",
  "Coalescence",
  "Collectables",
  "CTI",
  "DD",
  "FNN",
  "Omnipedia",
  "Vehicle",
  "Weapon",
  "WinslowAccord",
] as const;

/**
 * Every category that actually has entries, in CATEGORIES order with
 * "Standalone" last. Derived from the files rather than listed by hand, so a
 * category cannot appear in the menu with nothing behind it.
 */
export function listCategories(): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const slug of listSlugs()) {
    if (slug.toLowerCase() === "index") continue;
    const cat = categoryOf(slug);
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  const order = [...CATEGORIES, "Standalone"];
  return order
    .filter((c) => counts.has(c))
    .map((name) => ({ name, count: counts.get(name)! }));
}

/** The entries in one category, in the same order the index lists them. */
export function slugsInCategory(category: string): string[] {
  return listSlugs().filter(
    (slug) =>
      slug.toLowerCase() !== "index" &&
      categoryOf(slug).toLowerCase() === category.toLowerCase()
  );
}

/** The canonical spelling of a category name, or null if it has no entries. */
export function resolveCategory(name: string): string | null {
  const wanted = decodeURIComponent(name).toLowerCase();
  return listCategories().find((c) => c.name.toLowerCase() === wanted)?.name ?? null;
}

export function categoryOf(slug: string): string {
  const prefix = slug.split("-")[0];
  const hit = CATEGORIES.find((c) => c.toLowerCase() === prefix.toLowerCase());
  return hit ?? "Standalone";
}

/* ------------------------------------------------------------------ *
 * Documents
 * ------------------------------------------------------------------ */

const docCache = new Map<string, CodexDoc>();

/**
 * A page's masthead is the category logo the extractor appended at the end of
 * the file: "<PREFIX>_image001.png". It is pulled out of the body and shown at
 * the top of the panel, matching how the in-game browser lays a page out. Every
 * other image stays exactly where the source put it.
 */
function extractBanner(
  slug: string,
  nodes: CodexNode[],
  category: string
): { banner: string | null; rest: CodexNode[] } {
  const masthead = mastheadFor(slug, category);
  if (!masthead) return { banner: null, rest: nodes };

  const wanted = masthead.replace(/\.[a-z0-9]+$/i, "").toLowerCase();
  let banner: string | null = null;
  const rest = nodes.filter((n) => {
    if (banner || n.t !== "img") return true;
    const base = n.src.replace(/\.[a-z0-9]+$/i, "").toLowerCase();
    if (base !== wanted) return true;
    banner = n.src;
    return false;
  });

  // Pages such as CIA-HomePage never reference their masthead even though the
  // game still draws it, so fall back to the site's own.
  if (!banner && resolveImage(masthead)) banner = masthead;

  return { banner, rest };
}

export function getDoc(slug: string): CodexDoc | null {
  const cached = docCache.get(slug.toLowerCase());
  if (cached) return cached;

  const file = resolveSlug(slug);
  if (!file) return null;

  const raw = fs.readFileSync(path.join(OUTPUT_DIR, file), "utf-8");
  const parsed = parseCodexHtml(raw);
  const realSlug = slugOf(file);
  const category = categoryOf(realSlug);
  const { banner, rest } = extractBanner(realSlug, parsed, category);

  const doc: CodexDoc = {
    slug: realSlug,
    file,
    category,
    nodes: rest,
    banner,
    text: nodeText(rest),
  };
  docCache.set(realSlug.toLowerCase(), doc);
  return doc;
}

/**
 * The order the index lists entries in - the game's own running order, which
 * is what the Prev/Next pair either side of the panel steps through.
 *
 * index.htm links 453 of the 454 entries; anything it misses is appended in
 * filename order so no page is left unreachable from the pager.
 */
let indexOrderCache: string[] | null = null;

export function indexOrder(): string[] {
  if (indexOrderCache) return indexOrderCache;

  const seen = new Set<string>();
  const order: string[] = [];

  const walk = (nodes: CodexNode[]) => {
    for (const n of nodes) {
      if (n.t === "a") {
        const file = resolveSlug(n.href.replace(/^(?:\.\.?\/)+/, ""));
        if (file) {
          const slug = slugOf(file);
          if (slug.toLowerCase() !== "index" && !seen.has(slug)) {
            seen.add(slug);
            order.push(slug);
          }
        }
        walk(n.c);
      } else if (n.t === "p" || n.t === "b") {
        walk(n.c);
      } else if (n.t === "table") {
        for (const row of n.rows) for (const cell of row) walk(cell.c);
      }
    }
  };

  const index = getDoc("index");
  if (index) walk(index.nodes);

  for (const slug of listSlugs()) {
    if (slug.toLowerCase() === "index" || seen.has(slug)) continue;
    seen.add(slug);
    order.push(slug);
  }

  indexOrderCache = order;
  return order;
}

/** Previous/next in the global sorted order, wrapping at both ends. */
export function neighbours(slug: string): { prev: string; next: string } {
  const slugs = listSlugs();
  const i = slugs.findIndex((s) => s.toLowerCase() === slug.toLowerCase());
  if (i === -1) return { prev: slugs[0], next: slugs[0] };
  return {
    prev: slugs[(i - 1 + slugs.length) % slugs.length],
    next: slugs[(i + 1) % slugs.length],
  };
}

/**
 * Turn a filename into something readable, for search results and bookmarks.
 * "WinslowAccord-ProjectPrometheus" -> "WinslowAccord - Project Prometheus"
 */
export function humanise(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " "))
    .join(" - ");
}

/* ------------------------------------------------------------------ *
 * Search
 * ------------------------------------------------------------------ */

export type SearchHit = { slug: string; category: string; excerpt: string };

export function search(query: string, limit = 80): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: (SearchHit & { score: number })[] = [];
  for (const slug of listSlugs()) {
    const doc = getDoc(slug);
    if (!doc) continue;

    const inTitle = slug.toLowerCase().includes(q);
    const body = doc.text.toLowerCase();
    const at = body.indexOf(q);
    if (!inTitle && at === -1) continue;

    let excerpt = "";
    if (at !== -1) {
      const start = Math.max(0, at - 60);
      excerpt =
        (start > 0 ? "..." : "") +
        doc.text.slice(start, at + q.length + 90).replace(/\s+/g, " ").trim() +
        "...";
    }
    // Title matches rank above body matches.
    hits.push({ slug, category: doc.category, excerpt, score: inTitle ? 0 : 1 });
  }

  hits.sort((a, b) => a.score - b.score || a.slug.localeCompare(b.slug));
  return hits.slice(0, limit).map(({ score: _score, ...hit }) => hit);
}
