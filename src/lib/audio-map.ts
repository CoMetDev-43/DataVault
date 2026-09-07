/**
 * Audio overlay.
 *
 * The extracted pages now link their clips directly: a run of text that plays
 * a sound carries the game's own resource name as its href, taken from the
 * record's resource index rather than guessed from the label. So the only
 * thing left to record here is which extracted .mp3 stands in for each of
 * those .snd resources, which is a matter of what happens to be in
 * /public/audio and cannot be derived from the source files.
 *
 * Any .snd the site has no audio for stays as plain text rather than
 * becoming a dead link - see AudioLink's use in NodeRenderer.
 */

/** Game resource name (without the .snd suffix) -> file in /public/audio. */
export const AUDIO_FILES: Record<string, string> = {
  // CIA-COALESCENCE-AudioLandingPage
  vox_safe_stems_visual_extracts_000_stem: "VE.mp3",
  vox_safe_medical_logs_000_salm: "mt1.mp3",
  vox_safe_stems_medical_log_000_stem: "mt2.mp3",
  vox_safe_medical_logs_003_salm: "mt3.mp3",
  vox_safe_medical_logs_004_salm: "mt4.mp3",
  vox_safe_medical_logs_005_salm: "mt5.mp3",
  vox_safe_stems_krueger_log_000_stem: "pal.mp3",

  // CIA-Infection-AudioLandingPage
  vox_safe_salim_journal_001_salm: "ej1.mp3",
  vox_safe_salim_journal_002_salm: "ej2.mp3",
  vox_safe_salim_journal_003_salm: "ej3.mp3",
  vox_safe_salim_journal_004_salm: "ej4.mp3",
  vox_safe_salim_journal_005_salm: "ej5.mp3",
  vox_safe_salim_journal_006_salm: "ej6.mp3",
  vox_safe_salim_journal_007_salm: "ej7.mp3",
  vox_safe_salim_journal_008_salm: "ej8.mp3",
  vox_safe_medical_logs_006_salm: "ej9.mp3",
  vox_safe_stems_meeting_000_stem: "ma238.mp3",
};

/** True for an href that names a sound resource rather than a page. */
export function isAudioHref(href: string): boolean {
  return /\.snd$/i.test(href.trim());
}

/**
 * The playable file for a .snd href, or null when the clip was never
 * extracted - most of the 70 sounds the corpus references have no audio on
 * disk, and those must not render as links to a file that isn't there.
 */
export function audioFileFor(href: string): string | null {
  const name = href.trim().replace(/^\.?\//, "").replace(/\.snd$/i, "");
  return AUDIO_FILES[name] ?? null;
}
