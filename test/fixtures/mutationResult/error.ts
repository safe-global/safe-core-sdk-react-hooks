import { MutationObserverErrorResult } from '@tanstack/react-query'
import { RenameProp } from '@test/types.js'
import { createMutationIdleResult } from './idle.js'

export type MutationErrorResult<
  TMutateFnName extends string,
  TError extends Error,
  TVariables,
  TResult extends MutationObserverErrorResult<
    unknown,
    TError,
    TVariables
  > = MutationObserverErrorResult<unknown, TError, TVariables>
> = RenameProp<TResult, 'mutate', TMutateFnName> & {
  [key in `${TMutateFnName}Async`]: TResult['mutate']
}

export type CreateErrorMutationResultParam = {
  status: 'error'
  mutateFnName: string
  error: Error
  variables: unknown
  data?: undefined
}

export function createMutationErrorResult<
  TMutateFnName extends string,
  TError extends Error,
  TVariables
>(
  mutateFnName: TMutateFnName,
  error: TError,
  variables: TVariables
): MutationErrorResult<TMutateFnName, TError, TVariables> {
  return {
    ...createMutationIdleResult(mutateFnName),
    isIdle: false,
    isError: true,
    status: 'error',
    failureCount: 1,
    submittedAt: expect.any(Number),
    error,
    failureReason: error,
    variables
  }
}
