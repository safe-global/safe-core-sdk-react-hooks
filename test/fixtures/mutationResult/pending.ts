import { MutationObserverLoadingResult } from '@tanstack/react-query'
import { RenameProp } from '@test/types.js'
import { createMutationIdleResult } from './idle.js'

export type MutationPendingResult<TMutateFnName extends string> = RenameProp<
  MutationObserverLoadingResult,
  'mutate',
  TMutateFnName
> & { [key in `${TMutateFnName}Async`]: MutationObserverLoadingResult['mutate'] }

export type CreatePendingMutationResultParam = {
  status: 'pending'
  mutateFnName: string
  data?: undefined
  variables?: undefined
  error?: undefined
}

export function createMutationPendingResult<TMutateFnName extends string>(
  mutateFnName: TMutateFnName
): MutationPendingResult<TMutateFnName> {
  return {
    ...createMutationIdleResult(mutateFnName),
    isIdle: false,
    isPending: true,
    status: 'pending'
  }
}
