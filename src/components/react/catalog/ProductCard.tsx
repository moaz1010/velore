import { formatEGP, getLowestPrice } from '@/lib/format';
import type { PublicProduct } from '@/types/api';

interface Props {
  product: PublicProduct;
}

export default function ProductCard({ product }: Props) {
  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0];
  const showPlaceholder = product.isPlaceholder || !primaryImage || primaryImage.isPlaceholder;
  const lowestPrice = getLowestPrice(product.variants);
  const genderLabel = product.gender === 'him' ? 'For him' : product.gender === 'her' ? 'For her' : 'Unisex';

  return (
    <article data-scroll-reveal className="product-card gold-glow-border">
      <a className="product-card__link" href={`/product/${product.slug}`} aria-label={`View ${product.name}`}>
        <div className="product-card__visual">
          {showPlaceholder ? (
            <img
              className="product-card__placeholder-image"
              src="/brand/placeholder-bottle.svg"
              alt={`${product.name} — placeholder bottle illustration, not product photography`}
              width="640"
              height="800"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <img
              className="product-card__image"
              src={primaryImage.url}
              alt={primaryImage.alt}
              width="800"
              height="1000"
              loading="lazy"
              decoding="async"
            />
          )}
          {product.badges.length > 0 && <span className="product-card__badge">{product.badges[0]}</span>}
          {product.isPlaceholder && <span className="product-card__sample">Sample</span>}
        </div>
        <div className="product-card__details">
          <div className="product-card__meta"><span>{genderLabel}</span><span>{product.concentration}</span></div>
          <h3>{product.name}</h3>
          <p className="product-card__price">{lowestPrice === null ? 'Price not set' : `From ${formatEGP(lowestPrice)}`}</p>
        </div>
      </a>
    </article>
  );
}
