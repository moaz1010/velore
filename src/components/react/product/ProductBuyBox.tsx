import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { publicSettingsEnvelopeSchema } from '@/lib/schemas/public.schema';
import { addToInquiry } from '@/lib/stores/inquiry';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import { formatEGP } from '@/lib/format';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { PublicProduct } from '@/types/api';

interface Props {
  product: PublicProduct;
}

export default function ProductBuyBox({ product }: Props) {
  const firstAvailable = product.variants.findIndex((variant) => variant.stock > 0);
  const [selectedIndex, setSelectedIndex] = useState(firstAvailable >= 0 ? firstAvailable : 0);
  const [whatsappNumber, setWhatsappNumber] = useState(import.meta.env.PUBLIC_WHATSAPP_NUMBER ?? '');
  const [notice, setNotice] = useState('');
  const reduceMotion = useReducedMotion();
  const selectedVariant = product.variants[selectedIndex] ?? product.variants[0];

  useEffect(() => {
    let active = true;
    fetch('/api/settings')
      .then((response) => response.json() as Promise<unknown>)
      .then((payload) => {
        const parsed = publicSettingsEnvelopeSchema.safeParse(payload);
        if (active && parsed.success) setWhatsappNumber(parsed.data.data.whatsappNumber);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!selectedVariant) return <p role="status">This fragrance has no available size options yet.</p>;
  const isOutOfStock = selectedVariant.stock <= 0;

  const addItem = () => {
    setNotice('');
    if (isOutOfStock) return;
    addToInquiry({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      gender: product.gender,
      volumeMl: selectedVariant.volumeMl,
      priceEGP: selectedVariant.priceEGP,
      isPlaceholder: product.isPlaceholder,
      quantity: 1,
    });
    setNotice(`${product.name}, ${selectedVariant.volumeMl}ml, added to your inquiry list.`);
  };

  const orderDirectly = () => {
    setNotice('');
    if (isOutOfStock) return;
    try {
      const message = buildWhatsAppMessage([{
        name: product.name,
        volumeMl: selectedVariant.volumeMl,
        quantity: 1,
        priceEGP: selectedVariant.priceEGP,
        productPath: `/product/${product.slug}`,
      }], window.location.origin);
      const url = buildWhatsAppUrl(whatsappNumber || import.meta.env.PUBLIC_WHATSAPP_NUMBER, message);
      if (!url) {
        setNotice('WhatsApp is not configured yet. The item can still be added to your inquiry list.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setNotice('The order link could not be prepared. Please try again.');
    }
  };

  const selectedPrice = formatEGP(selectedVariant.priceEGP);
  return (
    <div className="product-buy-box">
      {product.isPlaceholder && <p className="product-buy-box__sample">Sample catalog record — confirm product details, price and availability before launch.</p>}
      <label className="product-buy-box__volume">
        <span>Choose a size</span>
        <select aria-label="Choose fragrance volume" value={selectedIndex} onChange={(event) => {
          setSelectedIndex(Number(event.target.value));
          setNotice('');
        }}>
          {product.variants.map((variant, index) => (
            <option value={index} disabled={variant.stock <= 0} key={`${variant.volumeMl}-${variant.sku}`}>
              {variant.volumeMl}ml{variant.stock <= 0 ? ' — out of stock' : ''}
            </option>
          ))}
        </select>
      </label>
      <div className="product-buy-box__price-row">
        <span className="product-buy-box__price-label">Price</span>
        <motion.span
          className="product-buy-box__price"
          key={selectedPrice}
          aria-live="polite"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        >
          {selectedPrice}
        </motion.span>
        {selectedVariant.compareAtEGP !== undefined && selectedVariant.compareAtEGP > selectedVariant.priceEGP && (
          <span className="product-buy-box__compare">{formatEGP(selectedVariant.compareAtEGP)}</span>
        )}
      </div>
      <p className={isOutOfStock ? 'product-buy-box__stock is-out' : 'product-buy-box__stock'} role="status">
        {isOutOfStock ? 'Out of stock' : `${selectedVariant.stock} available for inquiry`}
      </p>
      <button type="button" className="button button--primary product-buy-box__add" disabled={isOutOfStock} onClick={addItem}>
        Add to order
      </button>
      <button type="button" className="button button--outline product-buy-box__direct" disabled={isOutOfStock} onClick={orderDirectly}>
        Order this size on WhatsApp
      </button>
      {notice && <p className="product-buy-box__notice" role="status">{notice}</p>}
      {import.meta.env.DEV && !whatsappNumber && !import.meta.env.PUBLIC_WHATSAPP_NUMBER && (
        <p className="product-buy-box__warning">Development only: set a country-code WhatsApp number before testing direct orders.</p>
      )}
      <p className="product-buy-box__fineprint">No checkout or payment is collected on this site. Availability and delivery are confirmed over WhatsApp.</p>
      <div className="product-buy-box__sticky">
        <span><strong>{product.name}</strong><small>{selectedVariant.volumeMl}ml · {selectedPrice}</small></span>
        <button type="button" className="button button--primary" disabled={isOutOfStock} onClick={addItem}>Add</button>
      </div>
    </div>
  );
}
