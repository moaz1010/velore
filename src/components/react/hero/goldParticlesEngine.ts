const PARTICLE_LIMIT = 26;

interface Particle {
  progress: number;
  speed: number;
  radius: number;
  phase: number;
  alpha: number;
}

function curvePoint(progress: number, width: number, height: number): { x: number; y: number } {
  const x = width * (0.08 + 0.84 * progress);
  const wave = Math.sin(progress * Math.PI * 2.2);
  const y = height * (0.63 - 0.2 * wave - 0.12 * progress);
  return { x, y };
}

export function startGoldParticles(canvas: HTMLCanvasElement): () => void {
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return () => undefined;
  const particles: Particle[] = Array.from({ length: PARTICLE_LIMIT }, (_, index) => ({
    progress: index / PARTICLE_LIMIT,
    speed: 0.000035 + Math.random() * 0.00004,
    radius: 0.7 + Math.random() * 1.3,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.22 + Math.random() * 0.42,
  }));
  let width = 1;
  let height = 1;
  let frame = 0;
  let active = true;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const render = (time: number) => {
    if (!active) return;
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      particle.progress = (particle.progress + particle.speed * 16) % 1;
      const point = curvePoint(particle.progress, width, height);
      const drift = Math.sin(time / 1250 + particle.phase) * 8;
      context.beginPath();
      context.arc(point.x + drift, point.y - particle.progress * 20, particle.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(212, 175, 55, ${particle.alpha})`;
      context.fill();
    }
    frame = window.requestAnimationFrame(render);
  };
  frame = window.requestAnimationFrame(render);

  return () => {
    active = false;
    window.cancelAnimationFrame(frame);
    observer.disconnect();
    context.clearRect(0, 0, width, height);
  };
}
