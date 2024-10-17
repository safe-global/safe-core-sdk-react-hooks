import { usePrevious } from './usePrevious.js'

/**
 * Hook to compare two objects.
 * @param object Object to compare.
 * @returns Whether the object has changed.
 */
export function useCompareObject(object?: object) {
  const prevObject = usePrevious(object)
  return JSON.stringify(prevObject) !== JSON.stringify(object)
}
