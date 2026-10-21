import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useId } from 'react';

interface Props {
  className?: string;
  idPrefix?: string;
}

export default function FlameDraw({ className = '', idPrefix = 'flame' }: Props) {
  const reduceMotion = useReducedMotion();
  const instanceId = `${idPrefix}-${useId().replace(/:/g, '')}`;
  const gradientId = `velore-ribbon-gradient-${instanceId}`;
  const glowId = `velore-ribbon-glow-${instanceId}`;
  return (
    <svg className={className} viewBox="0 0 180 74" role="img" aria-label="Decorative gold ribbon motif">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8E7340" />
          <stop offset="0.55" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#C5A059" />
        </linearGradient>
        <filter id={glowId} x="-30%" y="-50%" width="160%" height="200%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Approximate S-curve only; replace with the true client-supplied vector path when available. */}
      <motion.path
        d="M12 54C34 13 52 16 70 40S104 67 124 34 151 11 168 20"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        filter={`url(#${glowId})`}
        initial={reduceMotion ? false : { pathLength: 0, opacity: 0.5 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 1.6, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="168"
        cy="20"
        r="2.5"
        fill="#D4AF37"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 1.1 }}
      />
    </svg>
  );
}
