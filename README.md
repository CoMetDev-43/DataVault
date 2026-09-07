# Black Ops III Data Vault

A Next.js rendering of the in-game Data Vault, built directly from the files
extracted from the game. Everything the site needs lives in this folder, so it
can be lifted out and moved anywhere as-is.

```
output/     455 .htm files - the source of truth. Never modified.
public/     audio (17 mp3), fonts (28 faces), images (150 png)
src/
  app/
    page.tsx          /            -> index.htm, the list of all entries
    [slug]/page.tsx   /<Filename>  -> one route per .htm file
    search/page.tsx   /search?q=
    globals.css       the terminal frame and all typography
  components/
    Terminal.tsx      the prop: glass panel, edge light, prompt bar, key bindings
    NodeRenderer.tsx  parsed nodes -> React
    BookmarksPanel.tsx
    AudioLink.tsx
  lib/
    parse.ts          the .htm parser
    docs.ts           file listing, slug/image resolution, search
    layout.ts         alignment + masthead settings  <- the two things you may want to tune
    audio-map.ts      mp3 <-> clip label pairing
    bookmarks.ts      the default bookmark list
```

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # prerenders all 455 pages as static HTML
npm start
```

## How content is handled

`output/` is read at build time and never written to. The pipeline is:

1. `parse.ts` turns a `.htm` file into a node tree.
2. `docs.ts` resolves links and images against the real files on disk.
3. `NodeRenderer.tsx` emits React, passing all text through verbatim.

The corpus uses exactly eight tags (`p b a br img table tr td`), two attributes
(`href`, `src`) and five entities, so the parser is purpose-built for that
subset rather than a general HTML sanitiser. Anything it does not recognise is
preserved as literal text, so no source text can silently vanish.

Verified across all 455 files:

- **0 text mismatches** - the rendered text is character-identical to the
  source once HTML whitespace is collapsed
- **1193 / 1193 links resolve** to a real file
- **404 / 404 image references resolve** to a file in `public/images`
- **455 / 455 pages return 200** when crawled

### Routing

The slug is the filename without its extension, so a source link of
`href="Omnipedia-DNI.htm"` becomes `/Omnipedia-DNI`. No link rewriting beyond
dropping the extension, which is why hyperlinks work without a mapping table.
`index.htm` is served at `/`; `/index` redirects there.

### Images

Sources reference the game's original casing (`CIA_image001.png`) while the
files on disk are lowercase (`cia_image001.png`), so lookup is
case-insensitive.

The extractor appends every `<img>` to the end of a file. The category masthead
(`<PREFIX>_image001.png`) is hoisted to the top of the panel, matching the
reference screenshots; every other image stays exactly where the source put it.

## Things the source could not tell us

Two presentation details are not recorded anywhere in `output/`, so they are
configured in **`src/lib/layout.ts`**:

- **Alignment.** Articles read left-aligned; the three menu screens (`home`,
  `CIA-HomePage`, `WinslowAccord-MainMenu`) are centred. Add a slug to
  `CENTRED` to centre another page.
- **Mastheads.** Most pages reference their own masthead. A few - `CIA-HomePage`
  among them - do not, even though the game still draws it, so the category
  supplies a fallback.

Audio is the third case. The extractor could only record clip filenames in a
trailing `<!-- links: ... .snd -->` comment, so **`src/lib/audio-map.ts`** pairs
the 17 mp3s with their labels on the two pages they belong to. The `.htm` files
themselves are untouched. `CIA-Zurich-AudioLandingPage` lists twelve further
clips that were never extracted, so it stays plain text until those files exist.

## Controls

| Key | Action |
| --- | --- |
| `Enter` | Follow the focused link (focuses the first one if none is) |
| `Esc` | Previous page, or close the bookmarks drawer |
| `X` | Close browser - returns to the index |
| `H` | Home page |
| `B` | Open / close bookmarks |
| `/` | Jump to the search box |
| `↑ ↓ PgUp PgDn Home End` | Scroll the panel |

## The frame

The terminal is drawn entirely in CSS - there is no background plate. The glass
is a six-sided `clip-path` with the two right corners cut, over a lit patch of
wall; the edge light, hinges, top rail, scanlines and grain are all generated.
Below 720px the prop drops away and the panel goes full-bleed.

Body text is sized with container query units (`cqw`) rather than viewport
units. The source preserves the game's own hard line breaks, so a line is only
as long as the original browser made it; sizing against the panel lets those
breaks land at the panel edge instead of leaving half the panel empty.
