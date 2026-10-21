import { useEffect, useState } from 'react';
import { publicCategoriesEnvelopeSchema, type PublicCategorySchema } from '@/lib/schemas/public.schema';

const tileStyles: Record<string, string> = {
  woody: 'family-tile--wood',
  floral: 'family-tile--floral',
  'oriental-amber': 'family-tile--amber',
  'fresh-citrus': 'family-tile--fresh',
  gourmand: 'family-tile--gourmand',
};

export default function FragranceFamilies() {
  const [families, setFamilies] = useState<PublicCategorySchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/categories')
      .then(async (response) => {
        if (!response.ok) throw new Error('Categories unavailable.');
        const payload: unknown = await response.json();
        const parsed = publicCategoriesEnvelopeSchema.safeParse(payload);
        if (!parsed.success) throw new Error('Invalid category response.');
        if (active) setFamilies(parsed.data.data.filter((category) => category.kind === 'family' && category.isActive));
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="family-grid" aria-label="Loading fragrance families" aria-busy="true">{Array.from({ length: 5 }, (_, index) => <div className="family-skeleton" key={index} aria-hidden="true" />)}</div>;
  }
  if (failed) return <p className="catalog-message" role="status">Fragrance families are temporarily unavailable.</p>;
  if (families.length === 0) return <p className="catalog-message">No fragrance families are currently available.</p>;

  return (
    <div className="family-grid">
      {families.map((family, index) => (
        <a className={`family-tile ${tileStyles[family.slug] ?? ''}`} href={`/shop/${family.slug}`} key={family.id}>
          <span className="family-tile__index">0{index + 1}</span>
          <span className="family-tile__rule" aria-hidden="true" />
          <h3>{family.name}</h3>
          {family.description?.includes('Placeholder') && <span className="family-tile__sample">Sample family</span>}
          <span className="family-tile__arrow" aria-hidden="true">↗</span>
        </a>
      ))}
    </div>
  );
}
