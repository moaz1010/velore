import { createContext, useContext, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { adminFetch } from './adminApi';
import { AdminDashboard } from './AdminDashboard';
import { AdminProductForm, AdminProductList } from './AdminProducts';
import { AdminCategories, AdminSettings } from './AdminCatalog';
import '@/styles/admin.css';

export type AdminView = 'dashboard' | 'products' | 'product-new' | 'product-edit' | 'categories' | 'settings';

interface NoticeContextValue {
  notify: (message: string) => void;
}

const NoticeContext = createContext<NoticeContextValue | null>(null);

export function useAdminNotice(): (message: string) => void {
  const context = useContext(NoticeContext);
  if (!context) throw new Error('useAdminNotice must be used inside AdminRoot.');
  return context.notify;
}

interface Props {
  view: AdminView;
  productId?: string;
}

export function AdminRoot({ view, productId }: Props) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  }));
  const [notice, setNotice] = useState('');
  const noticeValue = useMemo(() => ({ notify: setNotice }), []);

  async function logout() {
    try {
      await adminFetch<{ redirectTo: string }>('/api/admin/logout', { method: 'POST' });
    } finally {
      window.location.assign('/admin/login');
    }
  }

  const navItems: Array<{ label: string; href: string; active: boolean }> = [
    { label: 'Overview', href: '/admin', active: view === 'dashboard' },
    { label: 'Products', href: '/admin/products', active: view === 'products' || view === 'product-new' || view === 'product-edit' },
    { label: 'Categories', href: '/admin/categories', active: view === 'categories' },
    { label: 'Store settings', href: '/admin/settings', active: view === 'settings' },
  ];

  let pageTitle = 'Overview';
  if (view === 'products') pageTitle = 'Products';
  if (view === 'product-new') pageTitle = 'New product';
  if (view === 'product-edit') pageTitle = 'Edit product';
  if (view === 'categories') pageTitle = 'Categories';
  if (view === 'settings') pageTitle = 'Store settings';

  let page: ReactNode;
  if (view === 'dashboard') page = <AdminDashboard />;
  else if (view === 'products') page = <AdminProductList />;
  else if (view === 'product-new') page = <AdminProductForm mode="create" />;
  else if (view === 'product-edit') page = <AdminProductForm mode="edit" productId={productId} />;
  else if (view === 'categories') page = <AdminCategories />;
  else page = <AdminSettings />;

  return (
    <QueryClientProvider client={queryClient}>
      <NoticeContext.Provider value={noticeValue}>
        <div className="admin-workspace">
          <aside className="admin-sidebar">
            <a className="admin-sidebar-brand" href="/admin" aria-label="Velore admin overview">
              <img src="/brand/monogram.png" alt="" width="42" height="42" />
              <span><strong>VELORE</strong><small>STORE ADMIN</small></span>
            </a>
            <nav className="admin-nav" aria-label="Admin navigation">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className={item.active ? 'is-active' : ''} aria-current={item.active ? 'page' : undefined}>
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="admin-sidebar-bottom">
              <a href="/" target="_blank" rel="noreferrer">View storefront</a>
              <button className="admin-link-button" type="button" onClick={() => void logout()}>Sign out</button>
            </div>
          </aside>
          <div className="admin-main-column">
            <header className="admin-topbar">
              <div className="admin-mobile-brand">
                <img src="/brand/monogram.png" alt="" width="32" height="32" />
                <span>VELORE ADMIN</span>
              </div>
              <nav className="admin-mobile-nav" aria-label="Admin sections">
                {navItems.map((item) => <a key={item.href} href={item.href} className={item.active ? 'is-active' : ''}>{item.label}</a>)}
              </nav>
              <span className="admin-session-indicator"><i aria-hidden="true" /> Owner session</span>
            </header>
            <main className="admin-content">
              <div className="admin-page-heading">
                <div><p className="admin-eyebrow">VELORE / PRIVATE ADMIN</p><h1>{pageTitle}</h1></div>
                {(view === 'products' || view === 'product-new' || view === 'product-edit') && (
                  <a className="admin-button admin-button--primary" href="/admin/products/new">Create product</a>
                )}
              </div>
              {page}
            </main>
            <footer className="admin-footer"><span>Velore owner dashboard</span><span>Changes update the public catalog shortly.</span></footer>
          </div>
          <div className={`admin-toast ${notice ? 'is-visible' : ''}`} role="status" aria-live="polite">{notice}</div>
        </div>
      </NoticeContext.Provider>
    </QueryClientProvider>
  );
}
