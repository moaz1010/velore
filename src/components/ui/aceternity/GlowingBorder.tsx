import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export default function GlowingBorder({ children, className = '' }: Props) {
  return <div className={`gold-glow-border ${className}`}>{children}</div>;
}
