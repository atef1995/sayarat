import { useRef, useEffect } from "react";

/**
 * useDebounce - Returns a debounced version of the provided function (sync or async).
 * @param fn The function to debounce (can be async).
 * @param delay The debounce delay in milliseconds.
 * @returns A debounced function with the same arguments and return type as `fn`.
 *
 * @example
 * const debouncedSearch = useDebounce(async (query: string) => { ... }, 300);
 * debouncedSearch("hello");
 */
function useDebounce<
  T extends (...args: unknown[]) => unknown | Promise<unknown>
>(fn: T, delay: number): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function debouncedFn(...args: Parameters<T>): void {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // Support both sync and async functions
      void fn(...args);
    }, delay);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return debouncedFn;
}

export default useDebounce;

// #TODO: Consider supporting cancellation of async operations if needed.
// #TODO: Add unit tests for both sync and async usage.
// #TODO: Add documentation for usage with async functions and error handling.
