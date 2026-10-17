type BrandMarkProps = {
  className?: string;
  /** Use "light" sobre fundos escuros ou coloridos (ex.: lateral do login, rodapé). */
  tone?: "default" | "light";
};

// Marca no estilo </PH>: o nome inteiro vira uma tag de código. Só tipografia, uma linha.
export default function BrandMark({ className = "", tone = "default" }: BrandMarkProps) {
  const light = tone === "light";
  const tag = light ? "text-white/70" : "text-primary";
  return (
    <span
      className={`group inline-flex items-baseline gap-1 whitespace-nowrap font-mono text-lg tracking-tight select-none ${light ? "text-white" : "text-foreground"} ${className}`}
      aria-label="Seleção Simplificada"
    >
      <span aria-hidden="true" className={`font-bold transition-transform duration-300 group-hover:-translate-x-0.5 ${tag}`}>&lt;/</span>
      <span aria-hidden="true" className="font-extrabold">Seleção</span>
      <span aria-hidden="true" className={light ? "font-normal text-white/70" : "font-normal text-muted-foreground"}>Simplificada</span>
      <span aria-hidden="true" className={`font-bold transition-transform duration-300 group-hover:translate-x-0.5 ${tag}`}>&gt;</span>
    </span>
  );
}
