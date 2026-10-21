import { useEffect, useState } from 'react';
import { publicSettingsEnvelopeSchema } from '@/lib/schemas/public.schema';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp';

interface Props {
  initialInstagramHandle: string;
  initialWhatsappNumber: string;
}

export default function ContactLinks({ initialInstagramHandle, initialWhatsappNumber }: Props) {
  const [instagramHandle, setInstagramHandle] = useState(initialInstagramHandle);
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsappNumber);
  useEffect(() => {
    let active = true;
    fetch('/api/settings')
      .then((response) => response.json() as Promise<unknown>)
      .then((payload) => {
        const parsed = publicSettingsEnvelopeSchema.safeParse(payload);
        if (!active || !parsed.success) return;
        setInstagramHandle(parsed.data.data.instagramHandle);
        setWhatsappNumber(parsed.data.data.whatsappNumber);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const cleanHandle = instagramHandle.replace(/^@/, '');
  const safeHandle = /^[A-Za-z0-9._]{1,30}$/.test(cleanHandle) ? cleanHandle : 'velo.re15';
  const number = normalizeWhatsAppNumber(whatsappNumber || import.meta.env.PUBLIC_WHATSAPP_NUMBER);
  return (
    <div className="contact-links">
      <a className="contact-link" href={`https://instagram.com/${safeHandle}`} target="_blank" rel="noopener noreferrer">
        <span className="contact-link__label">Instagram</span><strong>@{safeHandle}</strong><span aria-hidden="true">↗</span>
      </a>
      {number ? (
        <a className="contact-link" href={`https://wa.me/${number}`} target="_blank" rel="noopener noreferrer">
          <span className="contact-link__label">WhatsApp</span><strong>Start an inquiry</strong><span aria-hidden="true">↗</span>
        </a>
      ) : (
        <div className="contact-link contact-link--disabled"><span className="contact-link__label">WhatsApp</span><strong>Number not configured</strong></div>
      )}
      {import.meta.env.DEV && !number && <p className="contact-links__warning" role="status">Development only: Velore's country-code WhatsApp number has not been supplied.</p>}
    </div>
  );
}
