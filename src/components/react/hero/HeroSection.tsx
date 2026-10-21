import '@/styles/hero.css';
import Aurora from '@/components/ui/aceternity/Aurora';
import Spotlight from '@/components/ui/aceternity/Spotlight';
import MagnetButton from '@/components/ui/reactbits/MagnetButton';
import SplitTextReveal from '@/components/ui/reactbits/SplitTextReveal';
import FlameDraw from '@/components/react/hero/FlameDraw';
import GoldParticles from '@/components/react/hero/GoldParticles';
import ShinyText from '@/components/ui/reactbits/ShinyText';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function HeroSection() {
  const reduceMotion = useReducedMotion();
  return (
    <Aurora className="hero-shell">
      <Spotlight className="hero-spotlight">
        <section className="hero-section" aria-labelledby="hero-title">
          <GoldParticles enabled={!reduceMotion} />
          <div className="hero-section__content container-editorial">
            <p className="eyebrow hero-section__eyebrow">A fragrance study</p>
            <FlameDraw className="hero-section__flame" idPrefix="hero" />
            <img
              src="/brand/logo-lockup.png"
              alt="Velore Eau de Parfum — temporary placeholder logo"
              width="360"
              height="300"
              fetchPriority="high"
              decoding="async"
              className="hero-section__lockup"
            />
            <h1 id="hero-title" className="hero-section__title">
              <SplitTextReveal text="Find your signature." />
            </h1>
            <p className="hero-section__copy">Explore the collection and build an order inquiry, one scent at a time.</p>
            <MagnetButton href="/shop" className="button button--primary hero-section__cta">
              <ShinyText>Discover the Collection</ShinyText>
              <span aria-hidden="true">↗</span>
            </MagnetButton>
            {import.meta.env.DEV && (
              <p className="hero-section__sample-note" role="status">Preview content is sample-only; confirm all brand assets and product details before launch.</p>
            )}
          </div>
          <a className="hero-section__scroll" href="#featured" aria-label="Scroll to featured fragrances">
            <span aria-hidden="true" />
          </a>
        </section>
      </Spotlight>
    </Aurora>
  );
}
