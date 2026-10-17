'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

const ease = [0.16, 1, 0.3, 1] as const;

/** Container: ao entrar na tela, anima os filhos `StaggerItem` em sequência. */
export function Stagger({ gap = 0.08, ...props }: { gap?: number } & HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
      {...props}
    />
  );
}

export function StaggerItem({ as = 'div', ...props }: { as?: 'div' | 'li' } & HTMLMotionProps<'div'>) {
  const Tag = (as === 'li' ? motion.li : motion.div) as typeof motion.div;
  return (
    <Tag
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
      }}
      {...props}
    />
  );
}
