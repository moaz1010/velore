import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Velore adaptation of Aceternity UI's Aurora Background.
 * Reference: https://ui.aceternity.com/components/aurora-background
 * The source's background-position animation is replaced with transform/opacity
 * drift to follow the approved motion and reduced-motion requirements.
 */
export default function Aurora({ children, className = '' }: Props) {
  return (
    <div className={`velore-aurora ${className}`.trim()}>
      <div className="velore-aurora__sky" aria-hidden="true">
        <span className="velore-aurora__ribbon velore-aurora__ribbon--one" />
        <span className="velore-aurora__ribbon velore-aurora__ribbon--two" />
        <span className="velore-aurora__ribbon velore-aurora__ribbon--three" />
      </div>
      <div className="velore-aurora__content">{children}</div>
    </div>
  );
}
