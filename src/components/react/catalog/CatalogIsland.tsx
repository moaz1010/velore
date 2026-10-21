import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import ProductCard from '@/components/react/catalog/ProductCard';
import { publicProductListEnvelopeSchema } from '@/lib/schemas/public.schema';
import { parseProductListQuery } from '@/lib/services/query-params';
import type { ProductListQuery } from '@/lib/schemas/product.schema';
import type { ProductListResult, PublicCategory } from '@/types/api';

interface Props {
  initialData: ProductListResult;
  initialFilters: ProductListQuery;
  categories: PublicCategory[];
  initialError?: string;
}

function queryForApi(filters: ProductListQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params;
}

function pathForFamily(family?: string): string {
  return family ? `/shop/${encodeURIComponent(family)}` : '/shop';
}

function urlQuery(filters: ProductListQuery): string {
  const pathFamily = window.location.pathname.startsWith('/shop/')
    ? decodeURIComponent(window.location.pathname.slice('/shop/'.length).split('/')[0] ?? '')
    : undefined;
  const params = queryForApi(filters);
  if (filters.family && filters.family === pathFamily) params.delete('family');
  return params.toString();
}

export default function CatalogIsland({ initialData, initialFilters, categories, initialError }: Props) {
  const [filters, setFilters] = useState<ProductListQuery>(initialFilters);
  const [products, setProducts] = useState(initialData.products);
  const [total, setTotal] = useState(initialData.total);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [source, setSource] = useState(initialData.source);
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>(initialError ? 'error' : 'ready');
  const [error, setError] = useState(initialError ?? '');
  const [searchDraft, setSearchDraft] = useState(initialFilters.q ?? '');
  const [minimumDraft, setMinimumDraft] = useState(initialFilters.minPrice?.toString() ?? '');
  const [maximumDraft, setMaximumDraft] = useState(initialFilters.maxPrice?.toString() ?? '');
  const firstRequest = useRef(true);
  const previousPage = useRef(initialFilters.page);

  const updateFilters = useCallback((patch: Partial<ProductListQuery>) => {
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));
  }, []);

  const submitFilters = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const min = minimumDraft.trim() ? Number(minimumDraft) : undefined;
    const max = maximumDraft.trim() ? Number(maximumDraft) : undefined;
    if ((min !== undefined && (!Number.isInteger(min) || min < 0)) || (max !== undefined && (!Number.isInteger(max) || max < 0))) {
      setStatus('error');
      setError('Enter whole-pound prices using non-negative integers.');
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      setStatus('error');
      setError('The minimum price must not exceed the maximum price.');
      return;
    }
    setStatus('ready');
    setError('');
    updateFilters({ q: searchDraft.trim() || undefined, minPrice: min, maxPrice: max });
  };

  useEffect(() => {
    const onPopState = () => {
      const parsed = parseProductListQuery(new URLSearchParams(window.location.search));
      if (!parsed.ok) return;
      const path = window.location.pathname;
      const pathFamily = path.startsWith('/shop/') ? decodeURIComponent(path.slice('/shop/'.length).split('/')[0] ?? '') : undefined;
      const next = { ...parsed.data, family: parsed.data.family ?? pathFamily };
      setSearchDraft(next.q ?? '');
      setMinimumDraft(next.minPrice?.toString() ?? '');
      setMaximumDraft(next.maxPrice?.toString() ?? '');
      setFilters(next);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (firstRequest.current) {
      firstRequest.current = false;
      return;
    }
    const controller = new AbortController();
    const query = queryForApi(filters).toString();
    const apiUrl = query ? `/api/products?${query}` : '/api/products';
    const targetPath = pathForFamily(filters.family);
    const queryText = urlQuery(filters);
    const browserUrl = `${targetPath}${queryText ? `?${queryText}` : ''}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (browserUrl !== currentUrl) {
      if (targetPath !== window.location.pathname) window.history.pushState({}, '', browserUrl);
      else window.history.replaceState({}, '', browserUrl);
    }

    setStatus('loading');
    setError('');
    fetch(apiUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('The catalog could not be updated. Please try again.');
        const payload: unknown = await response.json();
        const parsed = publicProductListEnvelopeSchema.safeParse(payload);
        if (!parsed.success) throw new Error('The catalog response could not be verified.');
        const result = parsed.data.data;
        setProducts((current) => filters.page > 1 ? [...current, ...result.products] : result.products);
        setTotal(result.total);
        setHasMore(result.hasMore);
        setSource(result.source);
        setStatus('ready');
        previousPage.current = filters.page;
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof Error ? requestError.message : 'The catalog could not be updated.');
        setStatus('error');
      });
    return () => controller.abort();
  }, [filters]);

  const families = categories.filter((category) => category.kind === 'family' && category.isActive);
  const currentFamily = filters.family ?? '';

  return (
    <div className="catalog-layout" aria-busy={status === 'loading'}>
      <form className="catalog-filters" onSubmit={submitFilters} aria-label="Filter fragrances">
        <div className="catalog-filters__row">
          <label className="catalog-field">
            <span>Search</span>
            <input type="search" value={searchDraft} maxLength={100} placeholder="Name or note" onChange={(event) => setSearchDraft(event.target.value)} />
          </label>
          <label className="catalog-field">
            <span>Family</span>
            <select value={currentFamily} onChange={(event) => updateFilters({ family: event.target.value || undefined })}>
              <option value="">All families</option>
              {families.map((family) => <option value={family.slug} key={family.id}>{family.name}</option>)}
            </select>
          </label>
          <label className="catalog-field">
            <span>For</span>
            <select value={filters.gender ?? ''} onChange={(event) => updateFilters({ gender: (event.target.value || undefined) as ProductListQuery['gender'] })}>
              <option value="">Everyone</option>
              <option value="him">Him</option>
              <option value="her">Her</option>
              <option value="unisex">Unisex</option>
            </select>
          </label>
          <label className="catalog-field">
            <span>Volume (ml)</span>
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              inputMode="numeric"
              value={filters.volume ?? ''}
              placeholder="Any"
              onChange={(event) => {
                const value = event.target.value ? Number(event.target.value) : undefined;
                if (value === undefined || (Number.isInteger(value) && value > 0 && value <= 1000)) updateFilters({ volume: value });
              }}
            />
          </label>
          <label className="catalog-field">
            <span>Sort by</span>
            <select value={filters.sort} onChange={(event) => updateFilters({ sort: event.target.value as ProductListQuery['sort'] })}>
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>
        <div className="catalog-filters__price-row">
          <span className="catalog-filters__price-label">Price range (EGP)</span>
          <label className="catalog-field catalog-field--compact"><span>Minimum</span><input type="number" min="0" step="1" inputMode="numeric" value={minimumDraft} onChange={(event) => setMinimumDraft(event.target.value)} placeholder="0" /></label>
          <label className="catalog-field catalog-field--compact"><span>Maximum</span><input type="number" min="0" step="1" inputMode="numeric" value={maximumDraft} onChange={(event) => setMaximumDraft(event.target.value)} placeholder="No limit" /></label>
          <button className="button button--outline catalog-filters__apply" type="submit">Apply filters</button>
        </div>
      </form>

      <div className="catalog-results__summary" aria-live="polite">
        <span>{status === 'loading' ? 'Updating collection…' : `${total} ${total === 1 ? 'fragrance' : 'fragrances'}`}</span>
        {source === 'development-placeholder' && <span className="catalog-results__sample">Development sample catalog — not real inventory.</span>}
      </div>
      {error && <p className="catalog-message" role="alert">{error}</p>}
      {status !== 'error' && products.length === 0 && status !== 'loading' && <p className="catalog-message">No fragrances match these filters.</p>}
      <div className="catalog-grid">
        {products.map((product) => <ProductCard product={product} key={product.id} />)}
      </div>
      {hasMore && (
        <div className="catalog-load-more">
          <button type="button" className="button button--outline" disabled={status === 'loading'} onClick={() => updateFilters({ page: filters.page + 1 })}>
            {status === 'loading' && previousPage.current < filters.page ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
