import { MutationObserverIdleResult } from '@tanstack/react-query'
import { RenameProp } from '@test/types.js'

export type MutationIdleResult<TMutateFnName extends string> = RenameProp<
  MutationObserverIdleResult,
  'mutate',
  TMutateFnName
> & { [key in `${TMutateFnName}Async`]: MutationObserverIdleResult['mutate'] }

export type CreateIdleMutationResultParam = {
  status: 'idle'
  mutateFnName: string
  data?: undefined
  variables?: undefined
  error?: undefined
}

export function createMutationIdleResult<TMutateFnName extends string>(
  mutateFnName: TMutateFnName
) {
  return {
    [mutateFnName]: expect.any(Function),
    [`${mutateFnName}Async`]: expect.any(Function),
    isIdle: true,
    isPaused: false,
    isPending: false,
    isSuccess: false,
    reset: expect.any(Function),
    status: 'idle',
    submittedAt: 0,
    variables: undefined,
    context: undefined,
    data: undefined,
    error: null,
    failureCount: 0,
    failureReason: null,
    isError: false
  } as MutationIdleResult<TMutateFnName>
}
