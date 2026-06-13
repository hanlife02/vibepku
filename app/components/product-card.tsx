import Link from "next/link";
import {
  displayCategory,
  fromStoredList,
  type ProductWithDrafts,
  visibleDraft,
} from "@/app/lib/products";

const CATEGORY_COLORS: Record<string, string> = {
  DEV_TOOL: '#6b8f8a',
  AI_AGENT: '#e8c274',
  CREATIVE_TOOL: '#c47070',
  GAME: '#7ab88a',
  OPEN_SOURCE: '#8a7ab8',
  OTHER: '#d4a853',
};

export function ProductCard({ product }: { product: ProductWithDrafts }) {
  const draft = product.published ?? visibleDraft(product);
  if (!draft) return null;

  const tags = fromStoredList(draft.tags).slice(0, 2);
  const color = CATEGORY_COLORS[draft.category] ?? '#888';
  const initial = draft.name[0]?.toUpperCase() ?? 'P';

  return (
    <Link href={`/products/${product.slug}`} className="row-item">
      <div className="row-icon" style={{ background: `${color}15`, color }}>
        {initial}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="row-title">{draft.name}</span>
          {product.featured ? (
            <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 100, background: 'var(--accent-dim)', color: 'var(--accent)', fontWeight: 600 }}>
              精选
            </span>
          ) : null}
        </div>
        <div className="row-desc">{draft.tagline}</div>
      </div>
      <div className="row-tags">
        {tags.map((tag) => (
          <span className="row-tag" key={tag}>#{tag}</span>
        ))}
      </div>
      <span className="row-cat">{displayCategory(draft.category)}</span>
      <svg className="row-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    </Link>
  );
}
