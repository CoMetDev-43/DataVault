import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getDoc, humanise, listSlugs, resolveImage } from "@/lib/docs";
import { renderNodes } from "@/components/NodeRenderer";

type Params = { slug: string };

/**
 * One route per .htm file in ./output. The slug is the filename without its
 * extension, so a source link of href="Omnipedia-DNI.htm" becomes /Omnipedia-DNI
 * and resolves without any rewriting of the content.
 */
export function generateStaticParams(): Params[] {
  return listSlugs()
    .filter((slug) => slug.toLowerCase() !== "index")
    .map((slug) => ({ slug }));
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = getDoc(slug);
  if (!doc) return { title: "Not found - Data Vault" };
  return { title: `${humanise(doc.slug)} - Data Vault` };
}

export default async function EntryPage(props: { params: Promise<Params> }) {
  const { slug } = await props.params;

  // index.htm is served at the site root.
  if (decodeURIComponent(slug).toLowerCase() === "index") redirect("/");

  const doc = getDoc(slug);
  if (!doc) notFound();

  const banner = doc.banner ? resolveImage(doc.banner) : null;

  return (
    <article className={`dv-doc cat-${doc.category}`}>
      {banner && (
        <div className="dv-banner">
          <img src={banner} alt="" />
        </div>
      )}
      {renderNodes(doc.nodes)}
    </article>
  );
}
