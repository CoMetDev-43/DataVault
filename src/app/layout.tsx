import type { Metadata, Viewport } from "next";
import "./globals.css";
import Terminal from "@/components/Terminal";
import { indexOrder, listCategories } from "@/lib/docs";

export const metadata: Metadata = {
  title: "Data Vault",
  description:
    "The Black Ops III Data Vault, rendered from the files extracted from the game.",
};

export const viewport: Viewport = {
  themeColor: "#1d2118",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {/* The wall photo is the first thing seen, so start it with the page. */}
        <link rel="preload" as="image" href="/bg-desktop.png" />
        <Terminal categories={listCategories()} order={indexOrder()}>
          {children}
        </Terminal>
      </body>
    </html>
  );
}
