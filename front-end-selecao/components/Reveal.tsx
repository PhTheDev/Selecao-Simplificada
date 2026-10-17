'use client';

import { useInView } from 'react-intersection-observer';

/** Entrada ao rolar: sobe 20px e aparece, uma vez. Sem JS o conteúdo fica visível. */
export default function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });
  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 motion-reduce:opacity-100 motion-reduce:translate-y-0'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
