import { useState } from 'react';
import type { PublicProduct } from '@/types/api';

interface Props {
  product: PublicProduct;
}

export default function ProductGallery({ product }: Props) {
  const realImages = product.isPlaceholder ? [] : product.images.filter((image) => !image.isPlaceholder);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = realImages[selectedIndex] ?? realImages[0];

  return (
    <div className="product-gallery">
      <div className="product-gallery__main">
        {selected ? (
          <img src={selected.url} alt={selected.alt} width="1000" height="1250" fetchPriority="high" decoding="async" />
        ) : (
          <img
            src="/brand/placeholder-bottle.svg"
            alt={`${product.name} — placeholder bottle illustration, not product photography`}
            width="640"
            height="800"
            fetchPriority="high"
            decoding="async"
          />
        )}
        {product.isPlaceholder && <span className="product-gallery__sample">Sample image</span>}
      </div>
      {realImages.length > 1 && (
        <div className="product-gallery__thumbs" role="group" aria-label="Product images">
          {realImages.map((image, index) => (
            <button
              className={index === selectedIndex ? 'product-gallery__thumb is-active' : 'product-gallery__thumb'}
              type="button"
              aria-label={`Show product image ${index + 1}: ${image.alt}`}
              aria-pressed={index === selectedIndex}
              key={`${image.url}-${index}`}
              onClick={() => setSelectedIndex(index)}
            >
              <img src={image.url} alt="" width="96" height="120" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
      {realImages.length === 0 && <p className="product-gallery__caption">Bottle illustration shown in place of product photography.</p>}
    </div>
  );
}
