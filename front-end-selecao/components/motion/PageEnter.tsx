'use client';

import { motion } from 'framer-motion';

/** Entrada suave do conteúdo a cada troca de página. Usado em template.tsx, que remonta a cada rota. */
export default function PageEnter({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
