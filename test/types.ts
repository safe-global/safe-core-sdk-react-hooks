// Utility type to rename a property in an object
export type RenameProp<T, K extends keyof T, N extends string> = Pick<T, Exclude<keyof T, K>> & {
  [P in N]: T[K]
}
