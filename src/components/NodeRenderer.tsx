import Link from "next/link";
import { Fragment } from "react";
import type { Align, CodexNode } from "@/lib/parse";
import { resolveImage } from "@/lib/docs";
import { audioFileFor, isAudioHref } from "@/lib/audio-map";
import AudioLink from "@/components/AudioLink";

/**
 * Renders the parsed node tree.
 *
 * Every piece of text is emitted exactly as it appears in the source file. The
 * only transformations are structural: an href of "Foo.htm" becomes the route
 * "/Foo", a sound resource becomes a player, and an <img src> is resolved
 * against /public/images.
 */

/**
 * "Omnipedia-DNI.htm" -> "/Omnipedia-DNI"
 *
 * Every page is a single flat route, but a few of the game's own link
 * resources are written relative to wherever that page sat in its original
 * tree - CEA-VictoryisWithinOurGrasp points at "../../Omnipedia-NRC.htm".
 * The leading hops are dropped: the file they arrive at is the same one.
 */
function hrefToRoute(href: string): string {
  const trimmed = href.trim().replace(/^(?:\.\.?\/)+/, "");
  if (/^(https?:|mailto:|#)/i.test(trimmed)) return trimmed;
  return "/" + encodeURIComponent(trimmed.replace(/\.html?$/i, ""));
}

/**
 * The body size every page is mostly set in. The extractor writes the game's
 * own number, so a heading at 44 comes out 44/36 of the body - the game's
 * ratio rather than one picked here. Kept relative, in em, so it still scales
 * with the panel-width sizing .dv-doc does.
 */
const BODY_SIZE = 36;

/** The class for a block the game centred or set against the right margin. */
function alignClass(align: Align): string | undefined {
  if (align === "center") return "dv-center";
  if (align === "right") return "dv-right";
  return undefined;
}

function sizeStyle(size: number | null): React.CSSProperties | undefined {
  if (!size || size === BODY_SIZE) return undefined;
  return { fontSize: `${(size / BODY_SIZE).toFixed(3)}em` };
}

/** Flatten a node tree to the text it renders, for an audio clip's label. */
function plainText(nodes: CodexNode[]): string {
  let out = "";
  for (const n of nodes) {
    if (n.t === "text") out += n.v;
    else if (n.t === "b" || n.t === "a") out += plainText(n.c);
  }
  return out;
}

/** How many playable clips a cell holds, so a list of them can be laid out. */
function countClips(nodes: CodexNode[]): number {
  let n = 0;
  for (const node of nodes) {
    if (node.t === "a" && isAudioHref(node.href) && audioFileFor(node.href)) n += 1;
    else if (node.t === "b") n += countClips(node.c);
  }
  return n;
}

export function renderNodes(nodes: CodexNode[]): React.ReactNode {
  return nodes.map((node, i) => <Fragment key={i}>{renderNode(node)}</Fragment>);
}

function renderNode(node: CodexNode): React.ReactNode {
  switch (node.t) {
    case "text":
      return node.v;

    case "br":
      return <br />;

    case "b":
      return <b>{renderNodes(node.c)}</b>;

    case "p":
      return (
        <p className={alignClass(node.align)} style={sizeStyle(node.size)}>
          {renderNodes(node.c)}
        </p>
      );

    case "a": {
      // A sound resource is a player, not a page. Clips the site has no
      // audio for stay as plain text - the game links them, but linking to
      // a file that was never extracted would just be a dead end.
      if (isAudioHref(node.href)) {
        const file = audioFileFor(node.href);
        if (!file) return renderNodes(node.c);
        return <AudioLink src={`/audio/${file}`} label={plainText(node.c)} />;
      }

      const route = hrefToRoute(node.href);
      const isExternal = /^(https?:|mailto:)/i.test(route);
      if (isExternal) {
        return (
          <a href={route} target="_blank" rel="noreferrer">
            {renderNodes(node.c)}
          </a>
        );
      }
      return <Link href={route}>{renderNodes(node.c)}</Link>;
    }

    case "img": {
      const src = resolveImage(node.src);
      // If an image is genuinely absent, render nothing rather than a broken
      // icon. Every src in the current corpus resolves.
      if (!src) return null;
      return (
        <img
          className={node.centred ? "dv-center" : undefined}
          src={src}
          alt=""
          loading="lazy"
        />
      );
    }

    case "table":
      return (
        <table>
          <tbody>
            {node.rows.map((cells, r) => (
              <tr key={r}>
                {cells.map((cell, c) => (
                  <td key={c} className={cell.right ? "dv-right" : undefined}>
                    {renderCell(cell.c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}

/*
 * A chapter's Prev/Next row used to be recognised here by matching the words
 * "Prev" and "Next". It no longer needs to be: the game records that cell's
 * position, and the extractor can tell a cell set against the right margin
 * from one at a column stop, so the markup arrives already saying which it
 * is. That reading also covers the weapon pages' country of origin and
 * anything else set the same way, which the word match never could.
 */

/**
 * A cell holding several clips is a list of them. The source runs the labels
 * together on one line, so each is given a line of its own here - one entry
 * per row, the way the in-game player lists them - rather than being left to
 * wrap mid-run and land two to a line.
 */
function renderCell(cell: CodexNode[]): React.ReactNode {
  if (countClips(cell) > 1) {
    return <span className="dv-audio-list">{renderNodes(cell)}</span>;
  }
  return renderNodes(cell);
}
