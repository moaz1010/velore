import { useState, type SyntheticEvent } from 'react';
import { adminFetch, AdminApiError } from './adminApi';
import '@/styles/admin.css';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage('');
    try {
      const result = await adminFetch<{ redirectTo: string }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      window.location.assign(result.redirectTo);
    } catch (error) {
      setMessage(error instanceof AdminApiError ? error.message : 'Sign-in is temporarily unavailable.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="login-title">
        <img src="/brand/monogram.png" alt="Velore" width="76" height="76" className="admin-login-mark" />
        <p className="admin-eyebrow">Private owner access</p>
        <h1 id="login-title">Velore Admin</h1>
        <p className="admin-muted">Sign in to manage products, categories and store details.</p>
        <form className="admin-form admin-login-form" onSubmit={submit}>
          <label className="admin-field">
            <span>Email address</span>
            <input autoComplete="username" type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required maxLength={254} />
          </label>
          <label className="admin-field">
            <span>Password</span>
            <input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.currentTarget.value)} required maxLength={200} />
          </label>
          {message && <p className="admin-form-error" role="alert">{message}</p>}
          <button className="admin-button admin-button--primary admin-button--wide" type="submit" disabled={pending}>
            {pending ? 'Checking access…' : 'Sign in'}
          </button>
        </form>
        <p className="admin-login-footnote">Owner-only access. Contact your project administrator if credentials need to be rotated.</p>
      </section>
    </main>
  );
}
