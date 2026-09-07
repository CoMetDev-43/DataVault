/**
 * The bookmark list the in-game browser ships with, as seen in
 * "Page Example with bookmarks open.png". Each entry points at a real file in
 * ./output. Anything the reader bookmarks themselves is stored in
 * localStorage and appended below these.
 */

export type Bookmark = { label: string; slug: string };

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  { label: "CIA Home Page", slug: "CIA-HomePage" },
  { label: "Welcome to the Winslow Accord", slug: "WinslowAccord-MainMenu" },
  { label: "Omnipedia - Winslow Accord", slug: "Omnipedia-WinslowAccord" },
  { label: "Omnipedia - Common Defense Pact", slug: "Omnipedia-CDP" },
];

export const STORAGE_KEY = "datavault.bookmarks";
