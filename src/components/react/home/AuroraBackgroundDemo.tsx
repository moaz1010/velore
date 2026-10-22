import { motion } from 'motion/react';
import Aurora from '@/components/ui/aceternity/Aurora';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import '@/styles/aurora-background-demo.css';

export default function AuroraBackgroundDemo() {
  const reducedMotion = useReducedMotion();

  return (
    <Aurora className="aurora-background-demo">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{
          delay: reducedMotion ? 0 : 0.3,
          duration: reducedMotion ? 0 : 0.8,
          ease: 'easeInOut',
        }}
        className="relative flex min-h-[30rem] flex-col items-center justify-center gap-4 px-4 text-center"
      >
        <p className="eyebrow aurora-background-demo__eyebrow">A light study</p>
        <h2 className="aurora-background-demo__title">The atmosphere of a first impression.</h2>
        <p className="aurora-background-demo__copy">
          An Aceternity Aurora study, tuned to Velore’s obsidian and gold palette.
        </p>
        <a className="button button--primary aurora-background-demo__cta" href="/shop">
          Explore the collection <span aria-hidden="true">↗</span>
        </a>
      </motion.div>
    </Aurora>
  );
}
