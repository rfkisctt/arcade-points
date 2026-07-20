"use client";

import { useState, useEffect } from "react";

interface CountingNumberProps {
  value: number;
  duration?: number;
}

export function CountingNumber({ value, duration = 1500 }: CountingNumberProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(String(value), 10);
    if (isNaN(end) || end === 0) {
      setCount(end || 0);
      return;
    }

    const totalFrames = Math.round(duration / 16);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.round(end * easeOut);

      if (frame >= totalFrames) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(currentCount);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}
