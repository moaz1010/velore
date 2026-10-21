import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Props {
  text: string;
  className?: string;
}

export default function SplitTextReveal({ text, className = '' }: Props) {
  const reduceMotion = useReducedMotion();
  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true" className="split-text__line">
        {text.split(' ').map((word, index) => (
          <motion.span
            className="split-text__word"
            key={`${word}-${index}`}
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : index * 0.09 }}
          >
            {word}
          </motion.span>
        ))}
      </span>
    </span>
  );
}
