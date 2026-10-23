import { computed } from 'nanostores';
import {
  persistentAtom,
  setPersistentEngine,
  windowPersistentEvents,
  type PersistentEncoder,
  type PersistentStore,
} from '@nanostores/persistent';
import { z } from 'zod';

const inquiryLineSchema = z
  .object({
    productId: z.string().min(1).max(128),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1).max(160),
    gender: z.enum(['him', 'her', 'unisex']),
    volumeMl: z.number().int().positive().max(1000),
    priceEGP: z.number().int().nonnegative(),
    quantity: z.number().int().min(1).max(99),
    isPlaceholder: z.boolean(),
  })
  .strict();

export type InquiryLine = z.infer<typeof inquiryLineSchema>;

function createSafeStorage(): PersistentStore {
  const memory = Object.create(null) as PersistentStore;
  return new Proxy(memory, {
    get(target, property, receiver) {
      if (typeof property !== 'string') return Reflect.get(target, property, receiver) as string;
      try {
        return window.localStorage.getItem(property) ?? undefined;
      } catch {
        return target[property];
      }
    },
    set(target, property, value) {
      if (typeof property !== 'string') return Reflect.set(target, property, value);
      const encoded = String(value);
      try {
        window.localStorage.setItem(property, encoded);
        delete target[property];
      } catch {
        target[property] = encoded;
      }
      return true;
    },
    deleteProperty(target, property) {
      if (typeof property !== 'string') return Reflect.deleteProperty(target, property);
      try {
        window.localStorage.removeItem(property);
      } catch {
        // Keep deletion safe when browser storage is disabled or unavailable.
      }
      delete target[property];
      return true;
    },
  });
}

if (typeof window !== 'undefined') {
  setPersistentEngine(createSafeStorage(), windowPersistentEvents);
}

const inquiryEncoder: PersistentEncoder<InquiryLine[]> = {
  encode(value) {
    return JSON.stringify(value);
  },
  decode(encoded) {
    try {
      const parsed: unknown = JSON.parse(encoded);
      const result = z.array(inquiryLineSchema).safeParse(parsed);
      return result.success ? result.data : [];
    } catch {
      return [];
    }
  },
};

export const $inquiry = persistentAtom<InquiryLine[]>('velore-inquiry-v1', [], inquiryEncoder);
export const $inquiryCount = computed($inquiry, (items) =>
  items.reduce((count, item) => count + item.quantity, 0),
);
export const $inquiryTotal = computed($inquiry, (items) =>
  items.reduce((total, item) => total + item.priceEGP * item.quantity, 0),
);

export function addToInquiry(line: Omit<InquiryLine, 'quantity'> & { quantity?: number }): void {
  const incoming = inquiryLineSchema.safeParse({ ...line, quantity: line.quantity ?? 1 });
  if (!incoming.success) return;
  const current = $inquiry.get();
  const existing = current.find(
    (item) => item.productId === incoming.data.productId && item.volumeMl === incoming.data.volumeMl,
  );
  if (existing) {
    $inquiry.set(
      current.map((item) =>
        item === existing
          ? { ...item, quantity: Math.min(99, item.quantity + incoming.data.quantity) }
          : item,
      ),
    );
    return;
  }
  $inquiry.set([...current, incoming.data]);
}

export function setInquiryQuantity(productId: string, volumeMl: number, quantity: number): void {
  const safeQuantity = Math.max(1, Math.min(99, Math.trunc(quantity)));
  $inquiry.set(
    $inquiry.get().map((item) =>
      item.productId === productId && item.volumeMl === volumeMl
        ? { ...item, quantity: safeQuantity }
        : item,
    ),
  );
}

export function removeFromInquiry(productId: string, volumeMl: number): void {
  $inquiry.set(
    $inquiry.get().filter((item) => !(item.productId === productId && item.volumeMl === volumeMl)),
  );
}

export function clearInquiry(): void {
  $inquiry.set([]);
}
