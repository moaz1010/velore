import { useEffect, useState } from 'react';
import { z } from 'zod';
import '@/styles/footer-details.css';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp';

const responseSchema = z
  .object({
    ok: z.literal(true),
    data: z
      .object({
        whatsappNumber: z.string().optional(),
        deliveryNote: z.string().optional(),
        instagramHandle: z.string().optional(),
      })
      .passthrough(),
  })
  .strict();

interface Props {
  initialInstagramHandle: string;
  initialWhatsappNumber: string;
}

export default function FooterDetails({ initialInstagramHandle, initialWhatsappNumber }: Props) {
  const [instagramHandle, setInstagramHandle] = useState(initialInstagramHandle);
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsappNumber);
  const [deliveryNote, setDeliveryNote] = useState('');

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetch('/api/settings', { cache: 'no-store' });
        if (!response.ok) return;
        const payload: unknown = await response.json();
        const parsed = responseSchema.safeParse(payload);
        if (!active || !parsed.success) return;
        const settings = parsed.data.data;
        if (settings.instagramHandle) setInstagramHandle(settings.instagramHandle);
        if (settings.whatsappNumber !== undefined) setWhatsappNumber(settings.whatsappNumber);
        if (settings.deliveryNote !== undefined) setDeliveryNote(settings.deliveryNote);
      } catch {
        // Preserve the last valid public settings during a temporary API failure.
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

  const safeHandle = /^[A-Za-z0-9._]{1,30}$/.test(instagramHandle.replace(/^@/, ''))
    ? instagramHandle.replace(/^@/, '')
    : 'velo.re15';
  const number = normalizeWhatsAppNumber(whatsappNumber || import.meta.env.PUBLIC_WHATSAPP_NUMBER);
  const whatsappHref = number ? `https://wa.me/${number}` : undefined;

  return (
    <div className="footer-details">
      <p className="footer-details__delivery" aria-live="polite">
        {deliveryNote.trim() || 'Delivery information has not been provided yet.'}
      </p>
      <a href={`https://instagram.com/${safeHandle}`} target="_blank" rel="noopener noreferrer">
        Instagram <span>@{safeHandle}</span>
      </a>
      {whatsappHref ? (
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      ) : (
        <span className="footer-details__unconfigured">WhatsApp number not configured</span>
      )}
      {import.meta.env.DEV && !number && (
        <small className="footer-details__warning" role="status">
          Development placeholder only: add a country-code WhatsApp number (format: 20XXXXXXXXXX).
        </small>
      )}
    </div>
  );
}
