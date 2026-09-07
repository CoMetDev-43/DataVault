import { getDoc } from "@/lib/docs";
import { renderNodes } from "@/components/NodeRenderer";

export const metadata = { title: "Index - Data Vault" };

/**
 * The root of the site is index.htm: the plain list of all 453 linked entries,
 * exactly as the in-game browser shows it.
 */
export default function IndexPage() {
  const doc = getDoc("index");

  if (!doc) {
    return (
      <div className="dv-index">
        <p>index.htm was not found in ./output.</p>
      </div>
    );
  }

  return (
    <div className="dv-index">{renderNodes(doc.nodes)}</div>
  );
}
