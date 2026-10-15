type BrandMarkProps = {
  className?: string;
};

export default function BrandMark({
  className = "text-white text-2xl font-semibold tracking-tight",
}: BrandMarkProps) {
  return <span className={className}>Seleção Simplificada</span>;
}
