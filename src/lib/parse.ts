/**
 * Parser for the .htm files in ./output.
 *
 * The extracted corpus uses exactly eight tags and two attributes:
 *
 *   containers : p, b, a, table, tr, td   (all properly closed - verified balanced)
 *   void       : br, img
 *   attributes : href (on a), src (on img), align (on p and img),
 *                size (on p), align="right" (on td)
 *   entities   : &#x27; &quot; &amp; &lt; &gt;
 *   comments   : <!-- images: ... --> and <!-- links: ... -->
 *
 * Nothing else appears anywhere in the 455 files, so a small stack parser is
 * both sufficient and exact. It is deliberately strict: text is passed through
 * verbatim apart from HTML whitespace collapsing, and any tag it does not
 * recognise is preserved as literal text rather than silently dropped.
 */

export type CodexNode =
  | { t: "text"; v: string }
  | { t: "br" }
  | { t: "img"; src: string; centred: boolean }
  | { t: "p"; c: CodexNode[]; align: Align; size: number | null }
  | { t: "b"; c: CodexNode[] }
  | { t: "a"; href: string; c: CodexNode[] }
  | { t: "table"; rows: CodexCell[][] };

/**
 * One table cell. `right` is the game setting the cell against the right
 * margin rather than at a column stop - a weapon's country of origin, a
 * chapter's Next link.
 */
export type CodexCell = { c: CodexNode[]; right: boolean };

/** How the game set a block: centred, against the right margin, or default. */
export type Align = "center" | "right" | null;

/** Container tags that may appear in the source. */
const CONTAINERS = new Set(["p", "b", "a", "table", "tr", "td"]);
/** Self-closing tags that may appear in the source. */
const VOIDS = new Set(["br", "img"]);

const ENTITIES: Record<string, string> = {
  "&#x27;": "'",
  "&quot;": '"',
  "&lt;": "<",
  "&gt;": ">",
  "&amp;": "&",
};

/**
 * Decode the five entities the corpus uses. `&amp;` is applied last so that a
 * literal `&amp;lt;` in the source decodes to the text `&lt;`, not to `<`.
 */
function decodeEntities(s: string): string {
  return s
    .replace(/&#x27;|&quot;|&lt;|&gt;/g, (m) => ENTITIES[m])
    .replace(/&amp;/g, "&");
}

/**
 * Collapse HTML whitespace. Runs of whitespace become a single space, which is
 * what a browser would do with the raw markup. Line breaks are only ever
 * rendered from an explicit <br>, never from a newline in the file.
 */
function collapse(s: string): string {
  return s.replace(/\s+/g, " ");
}

type Frame = {
  tag: string;
  children: CodexNode[];
  href?: string;
  /** align on the source element. */
  align?: Align;
  /** size="N" on the source element - the game's own text size. */
  size?: number | null;
  /** align="right" on a td. */
  right?: boolean;
};

/**
 * The game stores a block's alignment as the X it starts at, and the
 * extractor turns that back into an align attribute - the way the markup this
 * imitates would have written it. Only "center" and "right" are ever emitted;
 * everything else is the default left.
 */
function alignAttr(attrs: string): Align {
  const raw = /\balign\s*=\s*"(center|right)"/i.exec(attrs)?.[1];
  return raw ? (raw.toLowerCase() as Align) : null;
}

/** align="center" as a plain flag, for the elements that only ever centre. */
function isCentredAttr(attrs: string): boolean {
  return alignAttr(attrs) === "center";
}

/**
 * A table cell the game sets against the right margin. It writes these as an
 * X far to the right that moves with the cell's own width, which the
 * extractor recognises and turns back into align="right".
 */
function isRightAttr(attrs: string): boolean {
  return alignAttr(attrs) === "right";
}

/**
 * The game lays every line out at one of six text sizes, and the extractor
 * carries that through as size="N". It is written only where it differs from
 * the body size the rest of the page is set in, so absent means body.
 */
function sizeAttr(attrs: string): number | null {
  const raw = /\bsize\s*=\s*"(\d+)"/i.exec(attrs)?.[1];
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseCodexHtml(html: string): CodexNode[] {
  const root: CodexNode[] = [];
  const stack: Frame[] = [{ tag: "#root", children: root }];

  const top = () => stack[stack.length - 1];

  /** Append a node to the innermost open element. */
  const push = (node: CodexNode) => top().children.push(node);

  const pushText = (raw: string) => {
    if (!raw) return;
    const v = decodeEntities(collapse(raw));
    if (!v) return;
    const siblings = top().children;
    const prev = siblings[siblings.length - 1];
    // A space immediately after a line break, or at the very start of a block,
    // is an artefact of the source being pretty-printed. Drop it so text sits
    // flush against the left edge the way it does in game.
    const atBlockStart = !prev && top().tag !== "#root";
    if ((prev && prev.t === "br") || atBlockStart) {
      const trimmed = v.replace(/^ +/, "");
      if (!trimmed) return;
      siblings.push({ t: "text", v: trimmed });
      return;
    }
    siblings.push({ t: "text", v });
  };

  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      pushText(html.slice(i));
      break;
    }
    pushText(html.slice(i, lt));

    // Comment: <!-- images: ... --> / <!-- links: ... -->
    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt);
      if (end === -1) {
        pushText(html.slice(lt));
        break;
      }
      i = end + 3;
      continue;
    }

    const gt = html.indexOf(">", lt);
    if (gt === -1) {
      // Unterminated '<' - treat the remainder as literal text.
      pushText(html.slice(lt));
      break;
    }

    const rawTag = html.slice(lt + 1, gt).trim();
    i = gt + 1;

    // Closing tag
    if (rawTag.startsWith("/")) {
      const name = rawTag.slice(1).trim().toLowerCase();
      const depth = stack.findIndex((f) => f.tag === name);
      if (depth <= 0) {
        // Stray close with no matching open - keep it visible as text rather
        // than throwing away part of the document.
        pushText(`</${name}>`);
        continue;
      }
      // Unwind to the matching open tag, closing anything left dangling.
      while (stack.length - 1 >= depth) closeFrame(stack);
      continue;
    }

    const nameMatch = /^([a-zA-Z][a-zA-Z0-9]*)/.exec(rawTag);
    if (!nameMatch) {
      pushText(`<${rawTag}>`);
      continue;
    }
    const name = nameMatch[1].toLowerCase();
    const attrs = rawTag.slice(nameMatch[1].length);

    if (VOIDS.has(name)) {
      if (name === "br") {
        push({ t: "br" });
      } else {
        const src = /\bsrc\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? "";
        if (src)
          push({ t: "img", src: decodeEntities(src), centred: isCentredAttr(attrs) });
      }
      continue;
    }

    if (CONTAINERS.has(name)) {
      const href =
        name === "a"
          ? decodeEntities(/\bhref\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? "")
          : undefined;
      stack.push({
        tag: name,
        children: [],
        href,
        align: alignAttr(attrs),
        size: sizeAttr(attrs),
        right: isRightAttr(attrs),
      });
      continue;
    }

    // Unknown tag - preserve verbatim so no source text can go missing.
    pushText(`<${rawTag}>`);
  }

  // Close anything still open at EOF.
  while (stack.length > 1) closeFrame(stack);
  return root;
}

/**
 * Pop the innermost frame and fold it into its parent as a node. Table rows and
 * cells are folded into the enclosing <table> rather than becoming nodes of
 * their own, which keeps the rendered tree shallow.
 */
function closeFrame(stack: Frame[]): void {
  const frame = stack.pop()!;
  const parent = stack[stack.length - 1];

  switch (frame.tag) {
    case "td": {
      // Attach to the open <tr>, creating one if the source omitted it.
      const tr = parent.tag === "tr" ? parent : null;
      if (tr) {
        (tr as Frame & { cells?: CodexCell[] }).cells ??= [];
        (tr as Frame & { cells?: CodexCell[] }).cells!.push({
          c: frame.children,
          right: !!frame.right,
        });
      } else {
        parent.children.push(...frame.children);
      }
      return;
    }
    case "tr": {
      const cells = (frame as Frame & { cells?: CodexCell[] }).cells ?? [];
      const table = parent.tag === "table" ? parent : null;
      if (table) {
        (table as Frame & { rows?: CodexCell[][] }).rows ??= [];
        (table as Frame & { rows?: CodexCell[][] }).rows!.push(cells);
      } else {
        for (const cell of cells) parent.children.push(...cell.c);
      }
      return;
    }
    case "table": {
      const rows = (frame as Frame & { rows?: CodexCell[][] }).rows ?? [];
      parent.children.push({ t: "table", rows });
      return;
    }
    case "a":
      parent.children.push({ t: "a", href: frame.href ?? "", c: frame.children });
      return;
    case "b":
      parent.children.push({ t: "b", c: frame.children });
      return;
    case "p":
      parent.children.push({
        t: "p",
        c: frame.children,
        align: frame.align ?? null,
        size: frame.size ?? null,
      });
      return;
    default:
      parent.children.push(...frame.children);
  }
}

/** Flatten a node tree to plain text - used for search indexing and titles. */
export function nodeText(nodes: CodexNode[]): string {
  let out = "";
  for (const n of nodes) {
    switch (n.t) {
      case "text":
        out += n.v;
        break;
      case "br":
        out += "\n";
        break;
      case "p":
        out += nodeText(n.c) + "\n";
        break;
      case "b":
      case "a":
        out += nodeText(n.c);
        break;
      case "table":
        for (const row of n.rows) {
          out += row.map((cell) => nodeText(cell.c)).join("\t") + "\n";
        }
        break;
      case "img":
        break;
    }
  }
  return out;
}
