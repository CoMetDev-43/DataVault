import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listCategories, resolveCategory, slugsInCategory } from "@/lib/docs";

type Params = { cat: string };

/**
 * One page per category: the same plain listing the index gives, narrowed to a
 * single site section. Reached from the menu in the top right of the panel.
 */
export function generateStaticParams(): Params[] {
  return listCategories().map(({ name }) => ({ cat: name }));
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { cat } = await props.params;
  const name = resolveCategory(cat);
  return { title: name ? `${name} - Data Vault` : "Not found - Data Vault" };
}

export default async function CategoryPage(props: {
  params: Promise<Params>;
}) {
  const { cat } = await props.params;
  const name = resolveCategory(cat);
  if (!name) notFound();

  const slugs = slugsInCategory(name);

  return (
    <div className="dv-index">
      <p className="dv-index-title">
        {name} <span className="dv-index-count">{slugs.length} entries</span>
      </p>
      {slugs.map((slug) => (
        <div key={slug}>
          <Link href={`/${encodeURIComponent(slug)}`}>{slug}.htm</Link>
        </div>
      ))}
    </div>
  );
}
