import { useEffect, useState } from 'react';
import { publicSettingsEnvelopeSchema } from '@/lib/schemas/public.schema';

export default function DeliveryNote() {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetch('/api/settings', { cache: 'no-store' });
        if (!response.ok) throw new Error('Settings unavailable.');
        const payload: unknown = await response.json();
        const parsed = publicSettingsEnvelopeSchema.safeParse(payload);
        if (!parsed.success) throw new Error('Settings response is invalid.');
        if (active) {
          setNote(parsed.data.data.deliveryNote.trim());
          setStatus('ready');
        }
      } catch {
        if (active) setStatus((current) => current === 'loading' ? 'unavailable' : current);
      }
    }
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return (
    <div className="delivery-note" aria-live="polite" aria-busy={status === 'loading'}>
      {status === 'loading' ? <p>Loading delivery information…</p> : null}
      {status === 'unavailable' ? <p>Delivery information is temporarily unavailable.</p> : null}
      {status === 'ready' ? (
        note ? <p>{note}</p> : <p>Delivery details will appear here once provided by Velore.</p>
      ) : null}
    </div>
  );
}
