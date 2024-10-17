import { MutationObserverSuccessResult } from '@tanstack/react-query'
import { RenameProp } from '@test/types.js'
import { createMutationIdleResult } from './idle.js'

export type MutationSuccessResult<
  TMutateFnName extends string,
  TData,
  TVariables,
  TResult extends MutationObserverSuccessResult<
    TData,
    Error,
    TVariables
  > = MutationObserverSuccessResult<TData, Error, TVariables>
> = RenameProp<TResult, 'mutate', TMutateFnName> & {
  [key in `${TMutateFnName}Async`]: TResult['mutate']
}

export type CreateSuccessMutationResultParam = {
  status: 'success'
  mutateFnName: string
  data: unknown
  variables: unknown
  error?: undefined
}

export function createMutationSuccessResult<TMutateFnName extends string, TData, TVariables>(
  mutateFnName: TMutateFnName,
  data: TData,
  variables: TVariables
): MutationSuccessResult<TMutateFnName, TData, TVariables> {
  return {
    ...createMutationIdleResult(mutateFnName),
    data,
    variables,
    isIdle: false,
    isSuccess: true,
    status: 'success',
    submittedAt: expect.any(Number)
  }
}
