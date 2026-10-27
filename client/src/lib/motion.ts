export function supportsViewTransitions(): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return false;
  }

  const documentWithTransitions = document as Document & {
    startViewTransition?: unknown;
  };
  const reduceMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  return (
    typeof documentWithTransitions.startViewTransition === "function" &&
    !reduceMotion
  );
}
