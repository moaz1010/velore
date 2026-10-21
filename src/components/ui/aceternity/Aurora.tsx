import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export default function Aurora({ children, className = '' }: Props) {
  return (
    <div className={`velore-aurora ${className}`}>
      <div className="velore-aurora__wash" aria-hidden="true" />
      {children}
    </div>
  );
}
