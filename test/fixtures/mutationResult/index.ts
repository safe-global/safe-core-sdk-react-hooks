import {
  CreateIdleMutationResultParam,
  createMutationIdleResult,
  MutationIdleResult
} from './idle.js'
import {
  createMutationPendingResult,
  CreatePendingMutationResultParam,
  MutationPendingResult
} from './pending.js'
import {
  createMutationSuccessResult,
  CreateSuccessMutationResultParam,
  MutationSuccessResult
} from './success.js'
import {
  CreateErrorMutationResultParam,
  createMutationErrorResult,
  MutationErrorResult
} from './error.js'

type CreateCustomMutationResultParam =
  | CreateIdleMutationResultParam
  | CreatePendingMutationResultParam
  | CreateSuccessMutationResultParam
  | CreateErrorMutationResultParam

export function createCustomMutationResult<TMutateFnName extends string>(
  param: CreateIdleMutationResultParam
): MutationIdleResult<TMutateFnName>

export function createCustomMutationResult<TMutateFnName extends string>(
  param: CreatePendingMutationResultParam
): MutationPendingResult<TMutateFnName>

export function createCustomMutationResult<
  TMutateFnName extends string,
  TData = unknown,
  TVariables = unknown
>(param: CreateSuccessMutationResultParam): MutationSuccessResult<TMutateFnName, TData, TVariables>

export function createCustomMutationResult<
  TMutateFnName extends string,
  TError extends Error = Error,
  TVariables = unknown
>(param: CreateErrorMutationResultParam): MutationErrorResult<TMutateFnName, TError, TVariables>

export function createCustomMutationResult({
  status,
  mutateFnName,
  data,
  error,
  variables
}: CreateCustomMutationResultParam) {
  if (status === 'idle') {
    return createMutationIdleResult(mutateFnName)
  }
  if (status === 'pending') {
    return createMutationPendingResult(mutateFnName)
  }
  if (status === 'success') {
    return createMutationSuccessResult(mutateFnName, data, variables)
  }
  return createMutationErrorResult(mutateFnName, error, variables)
}
