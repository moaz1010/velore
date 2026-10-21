export interface WhatsAppOrderItem {
  name: string;
  volumeMl: number;
  quantity: number;
  priceEGP: number;
  productPath: string;
}

export function normalizeWhatsAppNumber(value: string | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return /^\d{8,15}$/.test(digits) ? digits : null;
}

function safeLabel(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

export function buildWhatsAppMessage(items: readonly WhatsAppOrderItem[], origin: string): string {
  if (items.length === 0) throw new Error('Add at least one fragrance before sending an inquiry.');
  const base = new URL(origin);
  if (base.protocol !== 'https:' && base.protocol !== 'http:') {
    throw new Error('The product link origin must use HTTP or HTTPS.');
  }

  const rows = items.map((item) => {
    if (!Number.isInteger(item.volumeMl) || item.volumeMl <= 0) throw new Error('Invalid fragrance volume.');
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) throw new Error('Invalid inquiry quantity.');
    if (!Number.isInteger(item.priceEGP) || item.priceEGP < 0) throw new Error('Invalid fragrance price.');
    if (!item.productPath.startsWith('/') || item.productPath.startsWith('//')) {
      throw new Error('Product links must be site-relative paths.');
    }
    const productUrl = new URL(item.productPath, base).toString();
    return `• ${safeLabel(item.name)} ${item.volumeMl}ml × ${item.quantity} (${item.priceEGP * item.quantity} EGP)\n  ${productUrl}`;
  });
  const total = items.reduce((sum, item) => sum + item.priceEGP * item.quantity, 0);
  return `Hello Velore, I'd like to order:\n\n${rows.join('\n\n')}\n\nTotal: ${total} EGP\nName:\nDelivery area:`;
}

export function buildWhatsAppUrl(number: string | undefined, message: string): string | null {
  const normalizedNumber = normalizeWhatsAppNumber(number);
  if (!normalizedNumber) return null;
  return `https://wa.me/${normalizedNumber}?${new URLSearchParams({ text: message }).toString()}`;
}
