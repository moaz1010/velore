import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ProductNotesRecord } from '@/types/catalog';

interface Props {
  notes: ProductNotesRecord;
}

const rows = [
  { key: 'top' as const, label: 'Top notes', detail: 'The opening' },
  { key: 'heart' as const, label: 'Heart notes', detail: 'The center' },
  { key: 'base' as const, label: 'Base notes', detail: 'The lasting impression' },
];

export default function FragranceNotes({ notes }: Props) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="notes-pyramid">
      {rows.map((row, index) => (
        <motion.section
          className={`notes-pyramid__row notes-pyramid__row--${row.key}`}
          key={row.key}
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : index * 0.12 }}
          aria-labelledby={`notes-${row.key}`}
        >
          <div className="notes-pyramid__heading">
            <p className="eyebrow" id={`notes-${row.key}`}>{row.label}</p>
            <span>{row.detail}</span>
          </div>
          <ul>
            {notes[row.key].length > 0
              ? notes[row.key].map((note, noteIndex) => <li key={`${note}-${noteIndex}`}>{note}</li>)
              : <li>Not provided</li>}
          </ul>
        </motion.section>
      ))}
    </div>
  );
}
