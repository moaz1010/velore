import { useEffect, useState } from 'react';
import { publicSettingsEnvelopeSchema } from '@/lib/schemas/public.schema';

export default function DeliveryNote() {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  useEffect(() => {
    let active = true;
    fetch('/api/settings')
      .then(async (response) => {
        if (!response.ok) throw new Error('Settings unavailable.');
        const payload: unknown = await response.json();
        const parsed = publicSettingsEnvelopeSchema.safeParse(payload);
        if (!parsed.success) throw new Error('Settings response is invalid.');
        if (active) {
          setNote(parsed.data.data.deliveryNote.trim());
          setStatus('ready');
        }
      })
      .catch(() => { if (active) setStatus('unavailable'); });
    return () => { active = false; };
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
