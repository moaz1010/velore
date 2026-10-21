import { useRef, type PointerEvent, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Props {
  href: string;
  children: ReactNode;
  className?: string;
}

export default function MagnetButton({ href, children, className = '' }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduceMotion = useReducedMotion();

  const onPointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    const element = ref.current;
    if (!element || reduceMotion || event.pointerType === 'touch') return;
    const bounds = element.getBoundingClientRect();
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    element.style.transform = `translate3d(${x * 0.06}px, ${y * 0.08}px, 0)`;
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <a
      ref={ref}
      className={`magnet-button ${className}`}
      href={href}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      onBlur={reset}
    >
      {children}
    </a>
  );
}
