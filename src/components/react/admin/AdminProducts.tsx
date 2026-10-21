import { useEffect, useMemo, useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, AdminApiError, type AdminProductList, type ProductFilters } from './adminApi';
import { useAdminNotice } from './AdminRoot';
import type { AdminCategory, AdminProduct } from '@/types/admin';
import type { ProductInput } from '@/lib/schemas/product.schema';
import { badges, concentrations, genders, occasions, seasons } from '@/types/catalog';

const defaultProduct: ProductInput = {
  slug: '',
  name: '',
  tagline: '',
  description: '',
  categoryIds: [],
  gender: 'unisex',
  concentration: 'EDP',
  notes: { top: [], heart: [], base: [] },
  accords: [],
  longevity: { hours: 0, rating: 3 },
  sillage: 3,
  seasons: [],
  occasions: [],
  variants: [{ volumeMl: 50, priceEGP: 0, stock: 0, sku: '' }],
  images: [],
  badges: [],
  type: 'single',
  includedProductIds: [],
  status: 'draft',
  featured: false,
  isPlaceholder: true,
  seo: {},
};

function toProductInput(product: AdminProduct): ProductInput {
  return {
    slug: product.slug,
    name: product.name,
    tagline: product.tagline ?? '',
    description: product.description,
    categoryIds: product.categoryIds,
    gender: product.gender,
    concentration: product.concentration,
    notes: { top: [...product.notes.top], heart: [...product.notes.heart], base: [...product.notes.base] },
    accords: product.accords.map((accord) => ({ ...accord })),
    longevity: { ...product.longevity },
    sillage: product.sillage,
    seasons: [...product.seasons],
    occasions: [...product.occasions],
    variants: product.variants.map((variant) => ({ ...variant })),
    images: product.images.map((image) => ({ ...image })),
    badges: [...product.badges],
    type: product.type,
    includedProductIds: [...(product.includedProductIds ?? [])],
    status: product.status,
    featured: product.featured,
    isPlaceholder: product.isPlaceholder,
    seo: { ...product.seo },
  };
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value);
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

interface StockVariables {
  id: string;
  sku: string;
  stock: number;
}

interface ProductSnapshot {
  previous: Array<[readonly unknown[], AdminProductList | undefined]>;
}

export function AdminProductList() {
  const queryClient = useQueryClient();
  const notify = useAdminNotice();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const filters = useMemo<ProductFilters>(() => ({ q: search.trim(), status, page, limit: 24 }), [search, status, page]);
  const productQuery = useQuery({ queryKey: ['products', filters], queryFn: () => adminApi.products(filters) });

  const stockMutation = useMutation<AdminProduct, Error, StockVariables, ProductSnapshot>({
    mutationFn: ({ id, sku, stock }) => adminApi.updateStock(id, sku, stock),
    onMutate: async ({ id, sku, stock }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previous = queryClient.getQueriesData<AdminProductList>({ queryKey: ['products'] });
      queryClient.setQueriesData<AdminProductList>({ queryKey: ['products'] }, (current) => current ? {
        ...current,
        products: current.products.map((product) => product.id !== id ? product : {
          ...product,
          variants: product.variants.map((variant) => variant.sku === sku ? { ...variant, stock } : variant),
        }),
      } : current);
      return { previous };
    },
    onError: (error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      notify(error.message || 'Stock could not be updated.');
    },
    onSuccess: () => notify('Stock updated.'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const archiveMutation = useMutation<{ modified: number }, Error, string[], ProductSnapshot>({
    mutationFn: (ids) => adminApi.bulkArchive(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previous = queryClient.getQueriesData<AdminProductList>({ queryKey: ['products'] });
      queryClient.setQueriesData<AdminProductList>({ queryKey: ['products'] }, (current) => current ? {
        ...current,
        products: current.products.map((product) => ids.includes(product.id) ? { ...product, status: 'archived' } : product),
      } : current);
      return { previous };
    },
    onError: (error, _ids, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      notify(error.message || 'Selected products could not be archived.');
    },
    onSuccess: (result) => {
      setSelected([]);
      notify(`${result.modified} product${result.modified === 1 ? '' : 's'} archived.`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  function toggleSelected(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function archiveSelected() {
    if (selected.length === 0) return;
    if (!window.confirm(`Archive ${selected.length} selected product${selected.length === 1 ? '' : 's'}? They will be hidden from the storefront.`)) return;
    archiveMutation.mutate(selected);
  }

  if (productQuery.isPending) return <div className="admin-loading" aria-live="polite">Loading products…</div>;
  if (productQuery.isError) {
    const message = productQuery.error instanceof AdminApiError ? productQuery.error.message : 'The product list could not be loaded.';
    return <div className="admin-alert" role="alert"><strong>Products unavailable</strong><span>{message}</span></div>;
  }

  const data = productQuery.data;
  const allVisibleSelected = data.products.length > 0 && data.products.every((product) => selected.includes(product.id));
  return (
    <section className="admin-panel admin-products-panel">
      <div className="admin-filter-row">
        <label className="admin-field admin-search-field"><span>Search products</span><input type="search" value={search} onChange={(event) => { setSearch(event.currentTarget.value); setPage(1); }} placeholder="Name or slug" /></label>
        <label className="admin-field admin-status-filter"><span>Status</span><select value={status} onChange={(event) => { setStatus(event.currentTarget.value); setPage(1); }}><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>
        <span className="admin-result-count">{data.total} record{data.total === 1 ? '' : 's'}</span>
      </div>
      {selected.length > 0 && <div className="admin-bulk-bar"><span>{selected.length} selected</span><button className="admin-button admin-button--danger" type="button" disabled={archiveMutation.isPending} onClick={archiveSelected}>Archive selected</button></div>}
      <div className="admin-table-wrap"><table className="admin-table admin-product-table"><thead><tr><th><input aria-label="Select all visible products" type="checkbox" checked={allVisibleSelected} onChange={() => setSelected(allVisibleSelected ? [] : data.products.map((product) => product.id))} /></th><th>Product</th><th>Status</th><th>Gender</th><th>Price from</th><th>Variant stock</th><th>Updated</th></tr></thead>
        <tbody>{data.products.map((product) => (
          <tr key={product.id}>
            <td><input aria-label={`Select ${product.name}`} type="checkbox" checked={selected.includes(product.id)} onChange={() => toggleSelected(product.id)} /></td>
            <td><a className="admin-product-name" href={`/admin/products/${product.id}`}>{product.name}</a><small className="admin-cell-subtext">/{product.slug}{product.isPlaceholder ? ' · placeholder' : ''}</small></td>
            <td><span className={`admin-status admin-status--${product.status}`}>{statusLabel(product.status)}</span></td>
            <td>{product.gender}</td>
            <td>{formatPrice(Math.min(...product.variants.map((variant) => variant.priceEGP)))}</td>
            <td><div className="admin-stock-editor">{product.variants.map((variant) => {
              const key = `${product.id}:${variant.sku}`;
              const draft = stockDrafts[key] ?? String(variant.stock);
              return <div className="admin-stock-edit-row" key={variant.sku}>
                <label><span>{variant.volumeMl} ml</span><input aria-label={`Stock for ${product.name}, ${variant.volumeMl} ml`} inputMode="numeric" type="number" min="0" max="1000000" value={draft} onChange={(event) => setStockDrafts((current) => ({ ...current, [key]: event.currentTarget.value }))} /></label>
                <button className="admin-mini-button" type="button" disabled={stockMutation.isPending || Number(draft) === variant.stock} onClick={() => stockMutation.mutate({ id: product.id, sku: variant.sku, stock: Math.max(0, Number(draft) || 0) })}>Save</button>
              </div>;
            })}</div></td>
            <td>{product.updatedAt ? new Intl.DateTimeFormat('en-EG', { dateStyle: 'medium' }).format(new Date(product.updatedAt)) : '—'}</td>
          </tr>
        ))}</tbody>
      </table>
      {data.products.length === 0 && <div className="admin-empty-state"><strong>No products found</strong><span>Create a record or adjust the search and status filters.</span><a className="admin-button admin-button--primary" href="/admin/products/new">Create product</a></div>}
      </div>
      <div className="admin-pagination"><span>Page {data.page} of {Math.max(1, Math.ceil(data.total / data.limit))}</span><div><button className="admin-button admin-button--secondary" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><button className="admin-button admin-button--secondary" type="button" disabled={page * data.limit >= data.total} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>
    </section>
  );
}

interface TagEditorProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}

function TagEditor({ label, values, onChange }: TagEditorProps) {
  const [draft, setDraft] = useState('');
  function addDraft() {
    const value = draft.trim().replace(/,$/, '');
    if (!value || values.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    onChange([...values, value]);
    setDraft('');
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addDraft();
    }
  }
  return (
    <div className="admin-field admin-tag-field">
      <span>{label}</span>
      <div className="admin-tag-list">{values.map((value) => <button type="button" className="admin-tag" key={value} onClick={() => onChange(values.filter((item) => item !== value))} aria-label={`Remove ${value}`}>{value}<span aria-hidden="true"> ×</span></button>)}</div>
      <div className="admin-inline-entry"><input value={draft} onChange={(event) => setDraft(event.currentTarget.value)} onKeyDown={onKeyDown} placeholder={`Add ${label.toLowerCase()} note, then press Enter`} /><button className="admin-mini-button" type="button" onClick={addDraft}>Add</button></div>
    </div>
  );
}

function ChoiceGroup<T extends string>({ label, values, selected, onToggle }: { label: string; values: readonly T[]; selected: T[]; onToggle: (value: T) => void }) {
  return <fieldset className="admin-choice-group"><legend>{label}</legend><div>{values.map((value) => <label key={value} className="admin-checkbox-label"><input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} /><span>{value}</span></label>)}</div></fieldset>;
}

function numberInput(value: number | undefined, onChange: (value: number | undefined) => void, options: { min?: number; max?: number; step?: number } = {}) {
  return <input type="number" min={options.min ?? 0} max={options.max} step={options.step ?? 1} value={value ?? ''} onChange={(event) => onChange(event.currentTarget.value === '' ? undefined : Number(event.currentTarget.value))} />;
}

interface FormProps {
  mode: 'create' | 'edit';
  productId?: string;
}

interface SaveVariables {
  payload: ProductInput;
  mode: 'create' | 'edit';
}

interface SaveSnapshot extends ProductSnapshot {
  previousDetail?: AdminProduct;
}

interface DeleteSnapshot extends ProductSnapshot {
  previousDetail?: AdminProduct;
}

export function AdminProductForm({ mode, productId }: FormProps) {
  const queryClient = useQueryClient();
  const notify = useAdminNotice();
  const [form, setForm] = useState<ProductInput>({ ...defaultProduct, notes: { top: [], heart: [], base: [] }, variants: [{ ...defaultProduct.variants[0] }], images: [], accords: [], categoryIds: [], includedProductIds: [], seasons: [], occasions: [], badges: [], seo: {} });
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const filters = useMemo<ProductFilters>(() => ({ q: '', status: '', page: 1, limit: 100 }), []);
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: adminApi.categories });
  const productsQuery = useQuery({ queryKey: ['products', filters], queryFn: () => adminApi.products(filters) });
  const productQuery = useQuery({ queryKey: ['product', productId], queryFn: () => adminApi.product(productId ?? ''), enabled: mode === 'edit' && Boolean(productId) });

  useEffect(() => {
    if (productQuery.data) setForm(toProductInput(productQuery.data));
  }, [productQuery.data]);

  const saveMutation = useMutation<AdminProduct, Error, SaveVariables, SaveSnapshot>({
    mutationFn: ({ payload, mode: saveMode }) => saveMode === 'create'
      ? adminApi.createProduct(payload)
      : adminApi.updateProduct(productId ?? '', payload),
    onMutate: async ({ payload, mode: saveMode }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previous = queryClient.getQueriesData<AdminProductList>({ queryKey: ['products'] });
      const previousDetail = productId ? queryClient.getQueryData<AdminProduct>(['product', productId]) : undefined;
      const optimisticId = productId ?? `optimistic-${Date.now()}`;
      const optimistic = { ...payload, id: optimisticId } as AdminProduct;
      queryClient.setQueriesData<AdminProductList>({ queryKey: ['products'] }, (current) => {
        if (!current) return current;
        const found = current.products.some((product) => product.id === optimisticId);
        return { ...current, products: found
          ? current.products.map((product) => product.id === optimisticId ? optimistic : product)
          : saveMode === 'create' ? [optimistic, ...current.products] : current.products };
      });
      if (productId) queryClient.setQueryData(['product', productId], optimistic);
      return { previous, previousDetail };
    },
    onError: (error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (productId) queryClient.setQueryData(['product', productId], context?.previousDetail);
      const fields = error instanceof AdminApiError ? Object.values(error.fields) : [];
      notify(fields.length ? `${error.message} ${fields[0]}` : error.message || 'Product could not be saved.');
    },
    onSuccess: (product) => {
      queryClient.setQueryData(['product', product.id], product);
      notify(mode === 'create' ? 'Product created.' : 'Product updated.');
      window.location.assign(mode === 'create' ? '/admin/products' : `/admin/products/${product.id}`);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      if (productId) void queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });

  const archiveMutation = useMutation<{ product: AdminProduct | null; deleted: boolean }, Error, boolean, DeleteSnapshot>({
    mutationFn: (hard) => adminApi.deleteProduct(productId ?? '', hard),
    onMutate: async (hard) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      await queryClient.cancelQueries({ queryKey: ['product', productId] });
      const previous = queryClient.getQueriesData<AdminProductList>({ queryKey: ['products'] });
      const previousDetail = productId ? queryClient.getQueryData<AdminProduct>(['product', productId]) : undefined;
      for (const [key, data] of previous) {
        if (!data) continue;
        const filters = key[1] as ProductFilters | undefined;
        const shouldRemove = hard || Boolean(filters?.status && filters.status !== 'archived');
        const containsProduct = data.products.some((product) => product.id === productId);
        queryClient.setQueryData<AdminProductList>(key, {
          ...data,
          products: shouldRemove
            ? data.products.filter((product) => product.id !== productId)
            : data.products.map((product) => product.id === productId ? { ...product, status: 'archived' } : product),
          total: shouldRemove && containsProduct ? Math.max(0, data.total - 1) : data.total,
        });
      }
      if (productId) {
        queryClient.setQueryData<AdminProduct | undefined>(['product', productId], (current) =>
          hard ? undefined : current ? { ...current, status: 'archived' } : current,
        );
      }
      return { previous, previousDetail };
    },
    onSuccess: (result) => {
      notify(result.deleted ? 'Product permanently deleted.' : 'Product archived.');
      window.location.assign('/admin/products');
    },
    onError: (error, _hard, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (productId) queryClient.setQueryData(['product', productId], context?.previousDetail);
      notify(error.message || 'Product could not be archived.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      if (productId) void queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });

  function setField<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateName(value: string) {
    setForm((current) => ({ ...current, name: value, ...(!slugTouched ? { slug: value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } : {}) }));
  }

  function toggleArray<T extends string>(key: 'seasons' | 'occasions' | 'badges', value: T) {
    setForm((current) => {
      const list = current[key] as T[];
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      return { ...current, [key]: next };
    });
  }

  function changeVariant(index: number, key: keyof ProductInput['variants'][number], value: string | number | undefined) {
    setForm((current) => ({ ...current, variants: current.variants.map((variant, position) => position === index ? { ...variant, [key]: value } : variant) }));
  }

  function changeImage(index: number, key: keyof ProductInput['images'][number], value: string | boolean) {
    setForm((current) => ({ ...current, images: current.images.map((image, position) => position === index ? { ...image, [key]: value } : key === 'isPrimary' && value ? { ...image, isPrimary: false } : image) }));
  }

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.type === 'discovery-set' && !form.includedProductIds?.length) {
      notify('Choose at least one fragrance for the discovery set.');
      return;
    }
    if (form.isPlaceholder && form.status === 'published' && !window.confirm('This record is marked as a placeholder. Publish it anyway?')) return;
    saveMutation.mutate({ payload: form, mode });
  }

  if (mode === 'edit' && productQuery.isPending) return <div className="admin-loading" aria-live="polite">Loading product…</div>;
  if (mode === 'edit' && productQuery.isError) return <div className="admin-alert" role="alert"><strong>Product unavailable</strong><span>{productQuery.error.message}</span></div>;
  if (!productId && mode === 'edit') return <div className="admin-alert" role="alert">A product ID is required.</div>;

  const categories: AdminCategory[] = categoriesQuery.data ?? [];
  const availableProducts = (productsQuery.data?.products ?? []).filter((product) => product.type === 'single' && product.id !== productId);
  return (
    <form className="admin-product-form" onSubmit={submit}>
      <div className="admin-form-toolbar"><a className="admin-text-link" href="/admin/products">← Back to products</a>{mode === 'edit' && <button className="admin-button admin-button--danger" type="button" disabled={archiveMutation.isPending} onClick={() => { if (window.confirm('Archive this product? It will be hidden from the storefront.')) archiveMutation.mutate(false); }}>Archive product</button>}</div>

      <section className="admin-panel admin-form-section"><div className="admin-panel-heading"><div><p className="admin-eyebrow">01 / BASICS</p><h2>Product identity</h2></div></div>
        <div className="admin-form-grid">
          <label className="admin-field"><span>Name</span><input required maxLength={100} value={form.name} onChange={(event) => updateName(event.currentTarget.value)} /></label>
          <label className="admin-field"><span>Slug</span><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={96} value={form.slug} onChange={(event) => { setSlugTouched(true); setField('slug', event.currentTarget.value); }} /></label>
          <label className="admin-field"><span>Tagline</span><input maxLength={140} value={form.tagline ?? ''} onChange={(event) => setField('tagline', event.currentTarget.value)} /></label>
          <label className="admin-field"><span>Gender</span><select value={form.gender} onChange={(event) => setField('gender', event.currentTarget.value as ProductInput['gender'])}>{genders.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="admin-field"><span>Concentration</span><select value={form.concentration} onChange={(event) => setField('concentration', event.currentTarget.value as ProductInput['concentration'])}>{concentrations.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="admin-field"><span>Product type</span><select value={form.type} onChange={(event) => setField('type', event.currentTarget.value as ProductInput['type'])}><option value="single">Single fragrance</option><option value="discovery-set">Discovery set</option></select></label>
          <label className="admin-field"><span>Categories</span><select multiple value={form.categoryIds} onChange={(event) => setField('categoryIds', Array.from(event.currentTarget.selectedOptions, (option) => option.value))}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name} · {category.kind}</option>)}</select><small>Use Ctrl/⌘ to select more than one.</small></label>
          <label className="admin-field admin-field--wide"><span>Description</span><textarea required rows={4} maxLength={3000} value={form.description} onChange={(event) => setField('description', event.currentTarget.value)} /></label>
        </div>
        {form.type === 'discovery-set' && <label className="admin-field admin-discovery-select"><span>Included fragrances</span><select multiple value={form.includedProductIds ?? []} onChange={(event) => setField('includedProductIds', Array.from(event.currentTarget.selectedOptions, (option) => option.value))}>{availableProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><small>Choose one or more single fragrances. A discovery set cannot be saved empty.</small></label>}
        <div className="admin-inline-checks"><label className="admin-checkbox-label"><input type="checkbox" checked={form.featured} onChange={(event) => setField('featured', event.currentTarget.checked)} /><span>Feature in storefront</span></label><label className="admin-checkbox-label"><input type="checkbox" checked={form.isPlaceholder} onChange={(event) => setField('isPlaceholder', event.currentTarget.checked)} /><span>Mark as placeholder content</span></label></div>
      </section>

      <section className="admin-panel admin-form-section"><div className="admin-panel-heading"><div><p className="admin-eyebrow">02 / NOTES</p><h2>Notes pyramid</h2></div></div>
        <div className="admin-note-grid"><TagEditor label="Top notes" values={form.notes.top} onChange={(values) => setField('notes', { ...form.notes, top: values })} /><TagEditor label="Heart notes" values={form.notes.heart} onChange={(values) => setField('notes', { ...form.notes, heart: values })} /><TagEditor label="Base notes" values={form.notes.base} onChange={(values) => setField('notes', { ...form.notes, base: values })} /></div>
      </section>

      <section className="admin-panel admin-form-section"><div className="admin-panel-heading"><div><p className="admin-eyebrow">03 / ACCORDS</p><h2>Accord strengths</h2></div><button className="admin-button admin-button--secondary" type="button" onClick={() => setField('accords', [...form.accords, { name: '', strength: 50 }])}>Add accord</button></div>
        {form.accords.length === 0 && <p className="admin-empty-inline">No accords added.</p>}
        <div className="admin-accord-list">{form.accords.map((accord, index) => <div className="admin-accord-row" key={`accord-${index}`}><label className="admin-field"><span>Accord name</span><input maxLength={48} value={accord.name} onChange={(event) => setField('accords', form.accords.map((item, position) => position === index ? { ...item, name: event.currentTarget.value } : item))} /></label><label className="admin-field"><span>Strength · {accord.strength}%</span><input type="range" min="0" max="100" value={accord.strength} onChange={(event) => setField('accords', form.accords.map((item, position) => position === index ? { ...item, strength: Number(event.currentTarget.value) } : item))} /></label><button className="admin-icon-button" type="button" aria-label="Remove accord" onClick={() => setField('accords', form.accords.filter((_item, position) => position !== index))}>×</button></div>)}</div>
      </section>

      <section className="admin-panel admin-form-section"><div className="admin-panel-heading"><div><p className="admin-eyebrow">04 / VARIANTS</p><h2>Volumes and pricing</h2></div><button className="admin-button admin-button--secondary" type="button" onClick={() => setField('variants', [...form.variants, { volumeMl: 50, priceEGP: 0, stock: 0, sku: '' }])}>Add size</button></div>
        <div className="admin-variant-list">{form.variants.map((variant, index) => <div className="admin-variant-row" key={`variant-${index}`}>
          <label className="admin-field"><span>Volume ml</span>{numberInput(variant.volumeMl, (value) => changeVariant(index, 'volumeMl', value ?? 0), { min: 1, max: 1000 })}</label>
          <label className="admin-field"><span>Price · EGP</span>{numberInput(variant.priceEGP, (value) => changeVariant(index, 'priceEGP', value ?? 0), { min: 0, max: 10_000_000 })}</label>
          <label className="admin-field"><span>Compare-at · EGP</span>{numberInput(variant.compareAtEGP, (value) => changeVariant(index, 'compareAtEGP', value), { min: 0, max: 10_000_000 })}</label>
          <label className="admin-field"><span>Stock</span>{numberInput(variant.stock, (value) => changeVariant(index, 'stock', value ?? 0), { min: 0, max: 1_000_000 })}</label>
          <label className="admin-field"><span>SKU</span><input required maxLength={40} value={variant.sku} onChange={(event) => changeVariant(index, 'sku', event.currentTarget.value)} /></label>
          <button className="admin-icon-button" type="button" aria-label={`Remove ${variant.volumeMl} ml size`} disabled={form.variants.length === 1} onClick={() => setField('variants', form.variants.filter((_item, position) => position !== index))}>×</button>
        </div>)}</div>
      </section>

      <section className="admin-panel admin-form-section"><div className="admin-panel-heading"><div><p className="admin-eyebrow">05 / IMAGES</p><h2>Image URLs and accessibility</h2></div><button className="admin-button admin-button--secondary" type="button" onClick={() => setField('images', [...form.images, { url: '', alt: '', isPrimary: form.images.length === 0, isPlaceholder: true }])}>Add image</button></div>
        <p className="admin-muted admin-section-note">Paste a site-relative path or HTTPS URL. Uploads are not part of this admin workflow.</p>
        <div className="admin-image-list">{form.images.map((image, index) => <div className="admin-image-row" key={`image-${index}`}>
          <div className="admin-image-preview">{image.url ? <img src={image.url} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span>Live preview</span>}</div>
          <label className="admin-field"><span>Image URL</span><input type="text" inputMode="url" required maxLength={2048} value={image.url} onChange={(event) => changeImage(index, 'url', event.currentTarget.value)} placeholder="https://… or /images/…" /></label>
          <label className="admin-field"><span>Alt text</span><input required maxLength={180} value={image.alt} onChange={(event) => changeImage(index, 'alt', event.currentTarget.value)} /></label>
          <div className="admin-inline-checks"><label className="admin-checkbox-label"><input type="radio" name="primary-image" checked={image.isPrimary} onChange={() => changeImage(index, 'isPrimary', true)} /><span>Primary image</span></label><label className="admin-checkbox-label"><input type="checkbox" checked={image.isPlaceholder} onChange={(event) => changeImage(index, 'isPlaceholder', event.currentTarget.checked)} /><span>Placeholder</span></label></div>
          <button className="admin-icon-button" type="button" aria-label="Remove image" onClick={() => { const next = form.images.filter((_item, position) => position !== index); if (next.length > 0 && !next.some((item) => item.isPrimary)) next[0] = { ...next[0], isPrimary: true }; setField('images', next); }}>×</button>
        </div>)}</div>
      </section>

      <section className="admin-panel admin-form-section"><div className="admin-panel-heading"><div><p className="admin-eyebrow">06 / METRICS</p><h2>Performance and occasions</h2></div></div>
        <div className="admin-form-grid admin-form-grid--compact"><label className="admin-field"><span>Longevity · hours</span>{numberInput(form.longevity.hours, (value) => setField('longevity', { ...form.longevity, hours: value ?? 0 }), { min: 0, max: 48, step: 0.5 })}</label><label className="admin-field"><span>Longevity rating · 1–5</span>{numberInput(form.longevity.rating, (value) => setField('longevity', { ...form.longevity, rating: Math.min(5, Math.max(1, value ?? 1)) as ProductInput['longevity']['rating'] }), { min: 1, max: 5 })}</label><label className="admin-field"><span>Sillage · 1–5</span>{numberInput(form.sillage, (value) => setField('sillage', Math.min(5, Math.max(1, value ?? 1)) as ProductInput['sillage']), { min: 1, max: 5 })}</label></div>
        <div className="admin-choice-grid"><ChoiceGroup label="Seasons" values={seasons} selected={form.seasons} onToggle={(value) => toggleArray('seasons', value)} /><ChoiceGroup label="Occasions" values={occasions} selected={form.occasions} onToggle={(value) => toggleArray('occasions', value)} /><ChoiceGroup label="Badges" values={badges} selected={form.badges} onToggle={(value) => toggleArray('badges', value)} /></div>
      </section>

      <section className="admin-panel admin-form-section"><div className="admin-panel-heading"><div><p className="admin-eyebrow">07 / SEO & STATUS</p><h2>Search presentation</h2></div></div>
        <div className="admin-form-grid"><label className="admin-field"><span>SEO title</span><input maxLength={70} value={form.seo.title ?? ''} onChange={(event) => setField('seo', { ...form.seo, title: event.currentTarget.value })} /></label><label className="admin-field"><span>Status</span><select value={form.status} onChange={(event) => setField('status', event.currentTarget.value as ProductInput['status'])}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="admin-field admin-field--wide"><span>SEO description</span><textarea rows={3} maxLength={180} value={form.seo.description ?? ''} onChange={(event) => setField('seo', { ...form.seo, description: event.currentTarget.value })} /></label></div>
      </section>

      <div className="admin-save-bar">{saveMutation.isError && <p className="admin-form-error" role="alert">{saveMutation.error.message}</p>}<a className="admin-button admin-button--secondary" href="/admin/products">Cancel</a><button className="admin-button admin-button--primary" type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : mode === 'create' ? 'Create product' : 'Save changes'}</button></div>
      {mode === 'edit' && <section className="admin-panel admin-hard-delete"><div><strong>Permanent deletion</strong><p>This cannot be undone. A product included in a discovery set cannot be deleted.</p></div><button type="button" className="admin-button admin-button--danger" disabled={archiveMutation.isPending} onClick={() => { if (window.confirm('Permanently delete this product? This action cannot be undone.')) archiveMutation.mutate(true); }}>Delete permanently</button></section>}
    </form>
  );
}
