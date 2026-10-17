/**
 * Navega com a cortina de transição (para botões que usam router.push).
 * Retorna false se a cortina não se aplica (mesma zona, movimento reduzido); aí use router.push normal.
 */
export function navigateWithCurtain(href: string): boolean {
  const detail = { href, handled: false };
  window.dispatchEvent(new CustomEvent('curtain:navigate', { detail }));
  return detail.handled;
}
