import { useEffect, useRef } from 'react';

/**
 * Auto-grows a one-line <textarea> as the value wraps, up to `maxHeight` px,
 * after which it scrolls. Returns a ref to attach to the textarea.
 */
export function useAutoGrowTextarea(value: string, maxHeight = 160) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  return ref;
}