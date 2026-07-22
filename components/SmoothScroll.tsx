"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { setLenisInstance } from "@/lib/lenis";

export function SmoothScroll() {
    const lenisRef = useRef<Lenis | null>(null);
    const pathname = usePathname();

    useEffect(() => {
    const lenis = new Lenis({
        duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        lerp: 0.08,
        wheelMultiplier: 0.9,
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        infinite: false,
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);

    function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
        cancelAnimationFrame(rafId);
        lenis.destroy();
        lenisRef.current = null;
        setLenisInstance(null);
    };
  }, []);

    useEffect(() => {
    if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
    } else {
        window.scrollTo(0, 0);
    }
  }, [pathname]);

    return null;
}
