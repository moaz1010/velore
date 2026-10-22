import type { ComponentPropsWithoutRef } from 'react';

type AuroraProps = ComponentPropsWithoutRef<'div'> & {
  showRadialGradient?: boolean;
};

/**
 * Velore adaptation of Aceternity UI's Aurora Background.
 * Recreates the source's layered repeating gradients, blur, fixed overlay,
 * difference blend, radial mask, and slow sweep in the site's gold palette.
 * The sweep uses only transform/opacity and is disabled for reduced motion.
 * Source: https://ui.aceternity.com/components/aurora-background
 */
export default function Aurora({
  children,
  className,
  showRadialGradient = true,
  ...props
}: AuroraProps) {
  const classes = [
    'velore-aurora',
    showRadialGradient ? 'velore-aurora--radial' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div {...props} className={classes}>
      <div className="velore-aurora__sky" aria-hidden="true">
        <div className="velore-aurora__wash" />
      </div>
      <div className="velore-aurora__content">{children}</div>
    </div>
  );
}
