import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { motion } from 'motion/react';
import { z } from 'zod';
import { createPortal } from 'react-dom';
import { formatEGP } from '@/lib/format';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import {
  $inquiry,
  $inquiryCount,
  $inquiryTotal,
  clearInquiry,
  removeFromInquiry,
  setInquiryQuantity,
} from '@/lib/stores/inquiry';

const publicSettingsResponseSchema = z
  .object({
    ok: z.literal(true),
    data: z.object({ whatsappNumber: z.string().optional() }).passthrough(),
  })
  .strict();

export default function InquiryBadge() {
  const items = useStore($inquiry);
  const count = useStore($inquiryCount);
  const total = useStore($inquiryTotal);
  const [open, setOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [messageError, setMessageError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/settings')
      .then((response) => response.json() as Promise<unknown>)
      .then((payload) => {
        const parsed = publicSettingsResponseSchema.safeParse(payload);
        if (active && parsed.success) setWhatsappNumber(parsed.data.data.whatsappNumber ?? '');
      })
      .catch(() => undefined);
      return () => {
        active = false;
      };
    }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    dialog?.querySelector<HTMLElement>('[data-dialog-close]')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [open]);

  const sendOrder = () => {
    setMessageError('');
    try {
      const message = buildWhatsAppMessage(
        items.map((item) => ({
          name: item.name,
          volumeMl: item.volumeMl,
          quantity: item.quantity,
          priceEGP: item.priceEGP,
          productPath: `/product/${item.slug}`,
        })),
        window.location.origin,
      );
      const url = buildWhatsAppUrl(whatsappNumber || import.meta.env.PUBLIC_WHATSAPP_NUMBER, message);
      if (!url) {
        setMessageError('WhatsApp is not configured yet. Please contact Velore through Instagram.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setMessageError('The inquiry could not be prepared. Please review your order and try again.');
    }
  };

  return (
    <>
      <button
        type="button"
        className="inquiry-trigger"
        aria-label={`Open inquiry list, ${count} ${count === 1 ? 'item' : 'items'}`}
        aria-expanded={open}
        aria-controls="velore-inquiry-drawer"
        onClick={() => setOpen(true)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path d="M5 8.5h14l-1.2 11H6.2L5 8.5Z" stroke="currentColor" strokeWidth="1.3" />
          <path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        <span className="inquiry-trigger__label">Order</span>
        <span className="inquiry-trigger__count" aria-live="polite">{count}</span>
      </button>

      {open && createPortal(
        <div className="inquiry-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <motion.div
            id="velore-inquiry-drawer"
            ref={dialogRef}
            className="inquiry-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inquiry-title"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.22 }}
          >
            <header className="inquiry-drawer__header">
              <div>
                <p className="eyebrow">Velore</p>
                <h2 id="inquiry-title">Your order inquiry</h2>
              </div>
              <button type="button" data-dialog-close className="icon-button" onClick={() => setOpen(false)} aria-label="Close order inquiry">
                <span aria-hidden="true">×</span>
              </button>
            </header>

            {items.length === 0 ? (
              <div className="inquiry-empty">
                <p>Your list is waiting for a fragrance.</p>
                <a className="button button--outline" href="/shop" onClick={() => setOpen(false)}>Explore the collection</a>
              </div>
            ) : (
              <>
                <ul className="inquiry-list">
                  {items.map((item) => (
                    <li className="inquiry-item" key={`${item.productId}-${item.volumeMl}`}>
                      <div className="inquiry-item__body">
                        <div className="inquiry-item__title-row">
                          <h3>{item.name}</h3>
                          {item.isPlaceholder && <span className="sample-label">Sample</span>}
                        </div>
                        <p>{item.volumeMl}ml · {formatEGP(item.priceEGP)} each</p>
                        <div className="inquiry-item__controls" aria-label={`Quantity for ${item.name}`}>
                          <button type="button" aria-label={`Decrease ${item.name} quantity`} disabled={item.quantity <= 1} onClick={() => setInquiryQuantity(item.productId, item.volumeMl, item.quantity - 1)}>−</button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button type="button" aria-label={`Increase ${item.name} quantity`} disabled={item.quantity >= 99} onClick={() => setInquiryQuantity(item.productId, item.volumeMl, item.quantity + 1)}>+</button>
                          <button type="button" className="inquiry-remove" onClick={() => removeFromInquiry(item.productId, item.volumeMl)}>Remove</button>
                        </div>
                      </div>
                      <strong>{formatEGP(item.priceEGP * item.quantity)}</strong>
                    </li>
                  ))}
                </ul>
                <div className="inquiry-drawer__total">
                  <span>Total</span>
                  <strong>{formatEGP(total)}</strong>
                </div>
                <p className="inquiry-disclaimer">Availability and delivery details are confirmed with Velore over WhatsApp.</p>
                {messageError && <p className="form-error" role="alert">{messageError}</p>}
                <button type="button" className="button button--primary inquiry-send" onClick={sendOrder}>
                  Send on WhatsApp
                </button>
                <button type="button" className="text-button" onClick={clearInquiry}>Clear inquiry list</button>
                {import.meta.env.DEV && !whatsappNumber && !import.meta.env.PUBLIC_WHATSAPP_NUMBER && (
                  <p className="dev-warning" role="status">Development only: add a country-code number in `.env` (example format: 20XXXXXXXXXX).</p>
                )}
              </>
            )}
          </motion.div>
        </div>,
        document.body,
      )}
    </>
  );
}
