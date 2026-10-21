import { useRef, type PointerEvent, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export default function Spotlight({ children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    ref.current?.style.setProperty('--spotlight-x', `${event.clientX - bounds.left}px`);
    ref.current?.style.setProperty('--spotlight-y', `${event.clientY - bounds.top}px`);
  };
  return (
    <div ref={ref} className={`velore-spotlight ${className}`} onPointerMove={onPointerMove}>
      {children}
    </div>
  );
}
