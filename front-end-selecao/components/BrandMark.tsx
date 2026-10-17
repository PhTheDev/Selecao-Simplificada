type BrandMarkProps = {
  className?: string;
  /** Use "light" sobre fundos escuros ou coloridos (ex.: lateral do login, rodapé). */
  tone?: "default" | "light";
};

export default function BrandMark({ className = "", tone = "default" }: BrandMarkProps) {
  const light = tone === "light";
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <svg viewBox="0 0 36 36" className="w-9 h-9" aria-hidden="true">
        <rect width="36" height="36" rx="9" className={light ? "fill-white" : "fill-primary"} />
        <path
          d="M10 18.5l5.5 5.5L26 12.5"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={light ? "stroke-primary" : "stroke-primary-foreground"}
        />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className={`font-display font-bold text-lg tracking-tight ${light ? "text-white" : "text-foreground"}`}>
          Seleção
        </span>
        <span className={`text-xs font-medium ${light ? "text-white/80" : "text-muted-foreground"}`}>
          Simplificada
        </span>
      </div>
    </div>
  );
}
