import { useEffect, useState, type DragEvent, type SyntheticEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, AdminApiError } from './adminApi';
import { useAdminNotice } from './AdminRoot';
import type { AdminCategory } from '@/types/admin';
import type { CategoryInput } from '@/lib/schemas/category.schema';
import type { SettingsInput } from '@/lib/schemas/settings.schema';

const blankCategory: CategoryInput = {
  slug: '',
  name: '',
  kind: 'family',
  description: '',
  image: '',
  order: 0,
  isActive: true,
};

const blankSettings: SettingsInput = {
  whatsappNumber: '',
  deliveryNote: '',
  instagramHandle: 'velo.re15',
  announcementBar: { text: '', enabled: false },
};

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface CategorySaveVariables {
  id?: string;
  input: CategoryInput;
}

interface CategorySnapshot {
  previous?: AdminCategory[];
}

export function AdminCategories() {
  const queryClient = useQueryClient();
  const notify = useAdminNotice();
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: adminApi.categories });
  const [form, setForm] = useState<CategoryInput>({ ...blankCategory });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const saveMutation = useMutation<AdminCategory, Error, CategorySaveVariables, CategorySnapshot>({
    mutationFn: ({ id, input }) => id ? adminApi.updateCategory(id, input) : adminApi.createCategory(input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previous = queryClient.getQueryData<AdminCategory[]>(['categories']);
      const optimisticId = id ?? `optimistic-${Date.now()}`;
      const optimistic: AdminCategory = { ...input, id: optimisticId };
      queryClient.setQueryData<AdminCategory[]>(['categories'], (current) => {
        const categories = current ?? [];
        return id ? categories.map((item) => item.id === id ? optimistic : item) : [...categories, optimistic];
      });
      return { previous };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(['categories'], context?.previous);
      notify(error.message || 'Category could not be saved.');
    },
    onSuccess: (_category, variables) => {
      setForm({ ...blankCategory });
      setEditingId(null);
      setSlugTouched(false);
      notify(variables.id ? 'Category updated.' : 'Category created.');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const deleteMutation = useMutation<{ deleted: boolean }, Error, string, CategorySnapshot>({
    mutationFn: adminApi.deleteCategory,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previous = queryClient.getQueryData<AdminCategory[]>(['categories']);
      queryClient.setQueryData<AdminCategory[]>(['categories'], (current) => current?.filter((category) => category.id !== id));
      return { previous };
    },
    onError: (error, _id, context) => {
      queryClient.setQueryData(['categories'], context?.previous);
      notify(error.message || 'Category could not be deleted.');
    },
    onSuccess: () => notify('Category deleted.'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const reorderMutation = useMutation<AdminCategory[], Error, Array<{ id: string; order: number }>, CategorySnapshot>({
    mutationFn: adminApi.reorderCategories,
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previous = queryClient.getQueryData<AdminCategory[]>(['categories']);
      const positions = new Map(items.map((item) => [item.id, item.order]));
      queryClient.setQueryData<AdminCategory[]>(['categories'], (current) => current?.map((category) => ({ ...category, order: positions.get(category.id) ?? category.order })).sort((left, right) => left.kind.localeCompare(right.kind) || left.order - right.order || left.name.localeCompare(right.name)));
      return { previous };
    },
    onError: (error, _items, context) => {
      queryClient.setQueryData(['categories'], context?.previous);
      notify(error.message || 'Category order could not be saved.');
    },
    onSuccess: () => notify('Category order saved.'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const categories = categoriesQuery.data ?? [];

  function beginEdit(category: AdminCategory) {
    setForm({
      slug: category.slug,
      name: category.name,
      kind: category.kind,
      description: category.description ?? '',
      image: category.image ?? '',
      order: category.order,
      ...(category.parentId ? { parentId: category.parentId } : {}),
      isActive: category.isActive,
    });
    setEditingId(category.id);
    setSlugTouched(true);
  }

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    saveMutation.mutate({ id: editingId ?? undefined, input: { ...form, ...(form.parentId ? {} : { parentId: undefined }) } });
  }

  function dropOn(targetId: string, event: DragEvent<HTMLTableRowElement>) {
    event.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const current = [...categories];
    const sourceIndex = current.findIndex((category) => category.id === draggedId);
    const targetIndex = current.findIndex((category) => category.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || current[sourceIndex].kind !== current[targetIndex].kind) {
      setDraggedId(null);
      return;
    }
    const kind = current[sourceIndex].kind;
    const group = current.filter((category) => category.kind === kind);
    const from = group.findIndex((category) => category.id === draggedId);
    const to = group.findIndex((category) => category.id === targetId);
    const [moving] = group.splice(from, 1);
    if (!moving) return;
    group.splice(to, 0, moving);
    const items = group.map((category, order) => ({ id: category.id, order }));
    setDraggedId(null);
    reorderMutation.mutate(items);
  }

  if (categoriesQuery.isPending) return <div className="admin-loading" aria-live="polite">Loading categories…</div>;
  if (categoriesQuery.isError) {
    const message = categoriesQuery.error instanceof AdminApiError ? categoriesQuery.error.message : 'Categories could not be loaded.';
    return <div className="admin-alert" role="alert"><strong>Categories unavailable</strong><span>{message}</span></div>;
  }

  return (
    <div className="admin-catalog-layout">
      <section className="admin-panel">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">TAXONOMY</p><h2>Categories</h2></div><span className="admin-pill">{categories.length} total</span></div>
        <p className="admin-muted admin-section-note">Drag rows within the same category type to change their display order. Categories referenced by products or child categories cannot be deleted.</p>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Name</th><th>Type</th><th>Parent</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>
          {categories.map((category) => <tr key={category.id} draggable onDragStart={() => setDraggedId(category.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOn(category.id, event)} onDragEnd={() => setDraggedId(null)} className={draggedId === category.id ? 'is-dragging' : ''}>
            <td><span className="admin-drag-handle" aria-label={`Drag to reorder ${category.name}`}>Drag</span><span className="admin-order-number">{category.order}</span></td>
            <td><strong>{category.name}</strong><small className="admin-cell-subtext">/{category.slug}</small></td>
            <td>{category.kind}</td>
            <td>{categories.find((item) => item.id === category.parentId)?.name ?? '—'}</td>
            <td><span className={`admin-status ${category.isActive ? 'admin-status--published' : 'admin-status--archived'}`}>{category.isActive ? 'Active' : 'Hidden'}</span></td>
            <td><div className="admin-row-actions"><button className="admin-mini-button" type="button" onClick={() => beginEdit(category)}>Edit</button><button className="admin-mini-button admin-mini-button--danger" type="button" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Delete ${category.name}? The request will be blocked if products or child categories reference it.`)) deleteMutation.mutate(category.id); }}>Delete</button></div></td>
          </tr>)}
        </tbody></table>
        {categories.length === 0 && <div className="admin-empty-inline">No categories are available yet.</div>}</div>
      </section>

      <section className="admin-panel admin-category-editor">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">{editingId ? 'EDIT CATEGORY' : 'NEW CATEGORY'}</p><h2>{editingId ? 'Category details' : 'Create category'}</h2></div>{editingId && <button className="admin-text-link" type="button" onClick={() => { setEditingId(null); setForm({ ...blankCategory }); setSlugTouched(false); }}>Cancel edit</button>}</div>
        <form className="admin-form admin-form-grid" onSubmit={submit}>
          <label className="admin-field"><span>Name</span><input required maxLength={80} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.currentTarget.value, ...(!slugTouched ? { slug: slugify(event.currentTarget.value) } : {}) }))} /></label>
          <label className="admin-field"><span>Slug</span><input required maxLength={96} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => { setSlugTouched(true); setForm((current) => ({ ...current, slug: event.currentTarget.value })); }} /></label>
          <label className="admin-field"><span>Type</span><select value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.currentTarget.value as CategoryInput['kind'] }))}><option value="family">Fragrance family</option><option value="collection">Collection</option></select></label>
          <label className="admin-field"><span>Parent category</span><select value={form.parentId ?? ''} onChange={(event) => setForm((current) => ({ ...current, parentId: event.currentTarget.value || undefined }))}><option value="">None</option>{categories.filter((category) => category.id !== editingId).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="admin-field"><span>Display order</span><input type="number" min="0" max="10000" step="1" value={form.order} onChange={(event) => setForm((current) => ({ ...current, order: Number(event.currentTarget.value) || 0 }))} /></label>
          <label className="admin-field"><span>Image URL · optional</span><input maxLength={2048} value={form.image ?? ''} onChange={(event) => setForm((current) => ({ ...current, image: event.currentTarget.value }))} /></label>
          <label className="admin-field admin-field--wide"><span>Description</span><textarea maxLength={500} rows={3} value={form.description ?? ''} onChange={(event) => setForm((current) => ({ ...current, description: event.currentTarget.value }))} /></label>
          <label className="admin-checkbox-label admin-category-active"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.currentTarget.checked }))} /><span>Visible in public category navigation</span></label>
          <div className="admin-field--wide"><button className="admin-button admin-button--primary" type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : editingId ? 'Save category' : 'Create category'}</button></div>
        </form>
      </section>
    </div>
  );
}

export function AdminSettings() {
  const queryClient = useQueryClient();
  const notify = useAdminNotice();
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: adminApi.settings });
  const [form, setForm] = useState<SettingsInput>({ ...blankSettings, announcementBar: { ...blankSettings.announcementBar! } });

  useEffect(() => {
    if (settingsQuery.data) setForm({ ...settingsQuery.data, announcementBar: settingsQuery.data.announcementBar ?? { text: '', enabled: false } });
  }, [settingsQuery.data]);

  const saveMutation = useMutation<SettingsInput, Error, SettingsInput, { previous?: SettingsInput; previousDashboard: unknown }>({
    mutationFn: adminApi.updateSettings,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['settings'] });
      await queryClient.cancelQueries({ queryKey: ['dashboard'] });
      const previous = queryClient.getQueryData<SettingsInput>(['settings']);
      const previousDashboard = queryClient.getQueryData(['dashboard']);
      queryClient.setQueryData(['settings'], input);
      queryClient.setQueryData(['dashboard'], (current: unknown) => {
        if (!current || typeof current !== 'object') return current;
        const dashboard = current as { settings?: SettingsInput };
        return { ...dashboard, settings: input };
      });
      return { previous, previousDashboard };
    },
    onError: (error, _input, context) => {
      queryClient.setQueryData(['settings'], context?.previous);
      queryClient.setQueryData(['dashboard'], context?.previousDashboard);
      notify(error.message || 'Store settings could not be saved.');
    },
    onSuccess: () => notify('Store settings saved. Public settings can take up to about one minute to refresh.'),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: SettingsInput = {
      ...form,
      announcementBar: form.announcementBar ?? { text: '', enabled: false },
    };
    saveMutation.mutate(payload);
  }

  if (settingsQuery.isPending) return <div className="admin-loading" aria-live="polite">Loading store settings…</div>;
  if (settingsQuery.isError) return <div className="admin-alert" role="alert"><strong>Settings unavailable</strong><span>{settingsQuery.error instanceof AdminApiError ? settingsQuery.error.message : 'Store settings could not be loaded.'}</span></div>;

  return (
    <form className="admin-settings-form" onSubmit={submit}>
      <section className="admin-panel admin-form-section"><div className="admin-panel-heading"><div><p className="admin-eyebrow">CONTACT & DELIVERY</p><h2>Public store details</h2></div></div>
        <p className="admin-muted admin-section-note">Use verified brand details only. Customer orders remain WhatsApp inquiries; delivery zones are handled by GremLins and this is editable text, not shipping-rate logic.</p>
        <div className="admin-form-grid">
          <label className="admin-field"><span>WhatsApp number · digits only, with country code</span><input inputMode="numeric" autoComplete="tel" pattern="[0-9]{8,15}" maxLength={15} value={form.whatsappNumber} onChange={(event) => {
            const whatsappNumber = event.currentTarget.value.replace(/\D/g, '');
            setForm((current) => ({ ...current, whatsappNumber }));
          }} placeholder="Country code + number" /><small>The order link uses this verified number. Never enter a placeholder number.</small></label>
          <label className="admin-field"><span>Instagram handle</span><div className="admin-input-prefix"><span>@</span><input maxLength={30} value={form.instagramHandle} onChange={(event) => {
            const instagramHandle = event.currentTarget.value.replace(/^@/, '');
            setForm((current) => ({ ...current, instagramHandle }));
          }} /></div></label>
          <label className="admin-field admin-field--wide"><span>Delivery note</span><textarea rows={4} maxLength={1200} value={form.deliveryNote} onChange={(event) => {
            const deliveryNote = event.currentTarget.value;
            setForm((current) => ({ ...current, deliveryNote }));
          }} placeholder="Add verified delivery information only." /></label>
        </div>
      </section>
      <section className="admin-panel admin-form-section"><div className="admin-panel-heading"><div><p className="admin-eyebrow">ANNOUNCEMENT</p><h2>Announcement bar</h2></div></div>
        <div className="admin-form-grid"><label className="admin-field admin-field--wide"><span>Announcement text</span><input maxLength={180} value={form.announcementBar?.text ?? ''} onChange={(event) => {
          const text = event.currentTarget.value;
          setForm((current) => ({ ...current, announcementBar: { text, enabled: current.announcementBar?.enabled ?? false } }));
        }} /></label></div>
        <label className="admin-checkbox-label"><input type="checkbox" checked={form.announcementBar?.enabled ?? false} onChange={(event) => {
          const enabled = event.currentTarget.checked;
          setForm((current) => ({ ...current, announcementBar: { text: current.announcementBar?.text ?? '', enabled } }));
        }} /><span>Display the announcement bar on public pages</span></label>
      </section>
      <div className="admin-save-bar"><button className="admin-button admin-button--primary" type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save store settings'}</button></div>
    </form>
  );
}
