/**
 * Presentation settings that the extracted .htm files cannot carry.
 *
 * Alignment used to live here as a hand-written list of centred pages. It no
 * longer does: the game stores each line's X, so the extractor can tell a
 * centred line from a left-aligned one and writes it into the markup. That
 * turned 3 guessed pages into 13 real ones. Only the masthead is left, which
 * genuinely is not in the source.
 */

/**
 * The masthead each site shows at the top of every one of its pages.
 *
 * Most pages carry their own "<CATEGORY>_image001.png" and it is hoisted out
 * of the body. A few - CIA-HomePage and home among them - do not reference it
 * even though the game still draws it, so the category supplies the fallback.
 */
const MASTHEADS: Record<string, string> = {
  BLOGOSPHERE: "BLOGOSPHERE_image001.png",
  CDP: "CDP_image001.png",
  CEA: "CEA_image001.png",
  CIA: "CIA_image001.png",
  Coalescence: "Coalescence_image001.png",
  Collectables: "Collectables_image001.png",
  CTI: "CTI_image001.png",
  DD: "DD_image001.png",
  FNN: "FNN_image001.png",
  Omnipedia: "Omnipedia_image001.png",
  Vehicle: "Vehicle_image001.png",
  Weapon: "Weapon_image001.png",
  WinslowAccord: "WinslowAccord_image001.png",
};

/** Per-page mastheads for the files that have no category prefix. */
const PAGE_MASTHEADS: Record<string, string> = {
  home: "home_image001.png",
  voyagerprogramcontactpage: "Coalescence_image001.png",
};

export function mastheadFor(slug: string, category: string): string | null {
  return (
    PAGE_MASTHEADS[slug.toLowerCase()] ?? MASTHEADS[category] ?? null
  );
}
