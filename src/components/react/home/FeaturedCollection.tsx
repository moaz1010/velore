import { useEffect, useRef, useState } from 'react';
import ProductCard from '@/components/react/catalog/ProductCard';
import { publicProductListEnvelopeSchema } from '@/lib/schemas/public.schema';
import type { PublicProduct } from '@/types/api';

export default function FeaturedCollection() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [source, setSource] = useState<'database' | 'development-placeholder' | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/products?sort=featured&limit=8')
      .then(async (response) => {
        if (!response.ok) throw new Error('The catalog is temporarily unavailable.');
        const payload: unknown = await response.json();
        const parsed = publicProductListEnvelopeSchema.safeParse(payload);
        if (!parsed.success) throw new Error('The catalog response could not be verified.');
        if (!active) return;
        const featured = parsed.data.data.products.filter((product) => product.featured).slice(0, 8);
        setProducts(featured);
        setSource(parsed.data.data.source);
        setStatus(featured.length > 0 ? 'ready' : 'empty');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const scroll = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({ left: direction * Math.max(trackRef.current.clientWidth * 0.78, 260), behavior: 'smooth' });
  };

  return (
    <div className="featured-collection" aria-busy={status === 'loading'}>
      {source === 'development-placeholder' && (
        <p className="sample-catalog-note" role="status">Development sample catalog — not real Velore inventory.</p>
      )}
      {status === 'loading' && (
        <div className="featured-collection__track" aria-label="Loading featured fragrances">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="catalog-skeleton" aria-hidden="true" />)}
        </div>
      )}
      {status === 'ready' && (
        <>
          <div className="featured-collection__controls">
            <button type="button" className="carousel-arrow" onClick={() => scroll(-1)} aria-label="Previous featured fragrances">←</button>
            <button type="button" className="carousel-arrow" onClick={() => scroll(1)} aria-label="Next featured fragrances">→</button>
          </div>
          <div ref={trackRef} className="featured-collection__track" aria-label="Featured fragrances">
            {products.map((product) => <ProductCard product={product} key={product.id} />)}
          </div>
        </>
      )}
      {status === 'empty' && <p className="catalog-message">No fragrances are currently available. Please check back soon.</p>}
      {status === 'error' && <p className="catalog-message" role="status">The collection could not be loaded just now.</p>}
    </div>
  );
}
