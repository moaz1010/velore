import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storageValues = new Map<string, string>();
let originalWindow: PropertyDescriptor | undefined;

function installBrowserStorage(): void {
  const localStorage = {
    getItem(key: string) {
      return storageValues.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      storageValues.set(key, value);
    },
    removeItem(key: string) {
      storageValues.delete(key);
    },
  } as Storage;
  const browserWindow = {
    localStorage,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as Window;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browserWindow });
}

describe('persistent inquiry store', () => {
  beforeEach(() => {
    storageValues.clear();
    originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    installBrowserStorage();
  });

  afterEach(() => {
    vi.resetModules();
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  });

  it('restores added items after a page-style module reload', async () => {
    const { addToInquiry, $inquiry } = await import('./inquiry');
    const unsubscribe = $inquiry.subscribe(() => undefined);
    const item = {
      productId: 'velore-no-01',
      slug: 'velore-no-01',
      name: 'Velore No. 01',
      gender: 'unisex' as const,
      volumeMl: 50,
      priceEGP: 1200,
      isPlaceholder: true,
      quantity: 1,
    };

    addToInquiry(item);
    unsubscribe();
    expect(JSON.parse(storageValues.get('velore-inquiry-v1') ?? 'null')).toEqual([item]);

    vi.resetModules();
    const reloaded = await import('./inquiry');
    const stopReloadedSubscription = reloaded.$inquiry.subscribe(() => undefined);
    expect(reloaded.$inquiry.get()).toEqual([item]);
    stopReloadedSubscription();
  });
});
