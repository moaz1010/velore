import { useEffect, useRef } from 'react';

interface Props {
  enabled: boolean;
}

export default function GoldParticles({ enabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let stop: (() => void) | undefined;
    let cancelled = false;
    const start = async () => {
      const engine = await import('@/components/react/hero/goldParticlesEngine');
      if (!cancelled) stop = engine.startGoldParticles(canvas);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        void start();
        observer.disconnect();
      }
    });
    observer.observe(canvas);
    return () => {
      cancelled = true;
      observer.disconnect();
      stop?.();
    };
  }, [enabled]);

  return <canvas ref={canvasRef} className="gold-particles" aria-hidden="true" />;
}
