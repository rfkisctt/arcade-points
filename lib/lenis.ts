import Lenis from "lenis";

let lenisInstance: Lenis | null = null;

export function setLenisInstance(lenis: Lenis | null) {
  lenisInstance = lenis;
}

export function getLenisInstance(): Lenis | null {
  return lenisInstance;
}

export function lenisScrollTo(
  target: HTMLElement | number | string,
  options?: { offset?: number; immediate?: boolean; duration?: number }
) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target as HTMLElement, {
      offset: options?.offset ?? -80,
      immediate: options?.immediate ?? false,
      duration: options?.duration,
    });
  } else {
    if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: "smooth" });
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}
