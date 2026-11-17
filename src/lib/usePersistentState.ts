import { useEffect, useState } from 'react';

export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw) as unknown;
      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        initial &&
        typeof initial === 'object' &&
        !Array.isArray(initial)
      ) {
        return { ...(initial as object), ...(parsed as object) } as T;
      }
      return parsed as T;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // modo privado o sin espacio: se ignora
    }
  }, [key, value]);

  return [value, setValue] as const;
}
