import { useQuery } from '@tanstack/react-query';
import { adminApi, AdminApiError } from './adminApi';

function dateLabel(value?: string): string {
  if (!value) return 'Not yet updated';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Not yet updated' : new Intl.DateTimeFormat('en-EG', { dateStyle: 'medium' }).format(date);
}

export function AdminDashboard() {
  const query = useQuery({ queryKey: ['dashboard'], queryFn: adminApi.dashboard });
  if (query.isPending) return <div className="admin-loading" aria-live="polite">Loading store overview…</div>;
  if (query.isError) {
    const message = query.error instanceof AdminApiError ? query.error.message : 'The store overview could not be loaded.';
    return <div className="admin-alert" role="alert"><strong>Overview unavailable</strong><span>{message}</span></div>;
  }

  const data = query.data;
  const cards = [
    { label: 'Total products', value: data.stats.total, note: 'All catalog statuses' },
    { label: 'Published', value: data.stats.published, note: 'Visible in the storefront' },
    { label: 'Draft', value: data.stats.draft, note: 'Not yet public' },
    { label: 'Archived', value: data.stats.archived, note: 'Hidden from the catalog' },
  ];

  return (
    <div className="admin-dashboard">
      <section className="admin-stat-grid" aria-label="Product totals">
        {cards.map((card) => (
          <article className="admin-stat-card" key={card.label}>
            <p>{card.label}</p><strong>{card.value}</strong><span>{card.note}</span>
          </article>
        ))}
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">INVENTORY</p><h2>Stock watch</h2></div><span className="admin-pill">{data.stats.lowStockVariants} low</span></div>
          {data.lowStock.length === 0 ? <p className="admin-empty-inline">No published variants at five units or below.</p> : (
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Size</th><th>SKU</th><th>Stock</th></tr></thead><tbody>
              {data.lowStock.map((item) => <tr key={`${item.productId}-${item.sku}`}><td><a href={`/admin/products/${item.productId}`}>{item.name}</a></td><td>{item.volumeMl} ml</td><td>{item.sku}</td><td><span className={item.stock === 0 ? 'admin-stock admin-stock--empty' : 'admin-stock'}>{item.stock}</span></td></tr>)}
            </tbody></table></div>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">CONTENT QUALITY</p><h2>Placeholder content remaining</h2></div></div>
          <ul className="admin-checklist">
            {data.checklist.map((item) => (
              <li key={item.id} className={item.complete ? 'is-complete' : 'is-pending'}>
                <span className="admin-checkmark" aria-hidden="true">{item.complete ? '✓' : '—'}</span>
                <div><strong>{item.label}</strong><small>{item.detail}</small></div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">RECENT ACTIVITY</p><h2>Recently edited</h2></div><a className="admin-text-link" href="/admin/products">All products</a></div>
        {data.recentlyEdited.length === 0 ? <p className="admin-empty-inline">No product records are available yet.</p> : (
          <div className="admin-recent-list">
            {data.recentlyEdited.map((product) => (
              <a href={`/admin/products/${product.id}`} className="admin-recent-row" key={product.id}>
                <span><strong>{product.name}</strong><small>/{product.slug}</small></span>
                <span className={`admin-status admin-status--${product.status}`}>{product.status}</span>
                <time dateTime={product.updatedAt}>{dateLabel(product.updatedAt)}</time>
              </a>
            ))}
          </div>
        )}
      </section>

      {!/^\d{8,15}$/.test(data.settings.whatsappNumber) && (
        <aside className="admin-notice"><strong>WhatsApp is not configured.</strong><span>Set the verified international number in Store settings before launch. The placeholder is never used to send orders.</span><a href="/admin/settings">Open store settings</a></aside>
      )}
    </div>
  );
}
