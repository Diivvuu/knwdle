// hooks/useAutoHeight.ts
'use client';
import { useLayoutEffect, useRef } from 'react';

export function useAutoHeight(deps: any[] = []) {
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // measure current → lock height
    const from = el.getBoundingClientRect().height;
    el.style.height = from + 'px';
    el.style.overflow = 'hidden';

    // next frame: expand/shrink to new content height
    requestAnimationFrame(() => {
      el.style.transition = 'height 280ms ease';
      el.style.height = el.scrollHeight + 'px';
    });

    const handle = window.setTimeout(() => {
      // cleanup: back to auto once animation done
      el.style.height = 'auto';
      el.style.transition = '';
      el.style.overflow = '';
    }, 300);

    return () => window.clearTimeout(handle);
    // re-run whenever deps change (e.g., audience)
  }, deps);

  return ref;
}
