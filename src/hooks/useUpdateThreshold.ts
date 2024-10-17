import { UseMutateAsyncFunction, UseMutateFunction, UseMutationResult } from '@tanstack/react-query'
import { SafeClientResult } from '@safe-global/sdk-starter-kit'
import { ConfigParam, SafeConfigWithSigner } from '@/types/index.js'
import { useSendTransaction } from '@/hooks/useSendTransaction.js'
import { useSignerClientMutation } from '@/hooks/useSignerClientMutation.js'
import { MutationKey } from '@/constants.js'

export type UpdateThresholdVariables = { threshold: number }

export type UseUpdateThresholdParams = ConfigParam<SafeConfigWithSigner>
export type UseUpdateThresholdReturnType = Omit<
  UseMutationResult<SafeClientResult, Error, UpdateThresholdVariables>,
  'mutate' | 'mutateAsync'
> & {
  updateThreshold: UseMutateFunction<SafeClientResult, Error, UpdateThresholdVariables, unknown>
  updateThresholdAsync: UseMutateAsyncFunction<
    SafeClientResult,
    Error,
    UpdateThresholdVariables,
    unknown
  >
}

/**
 * Hook to update the threshold of the connected Safe. It sends or (if the current threshold is > 1) proposes
 * a transaction to update the threshold of the Safe account and returns the transaction result.
 * @param params Parameters to customize the hook behavior.
 * @param params.config SafeConfig to use instead of the one provided by `SafeProvider`.
 * @returns Object containing the mutation state and the function to update the threshold.
 */
export function useUpdateThreshold(
  params: UseUpdateThresholdParams = {}
): UseUpdateThresholdReturnType {
  const { sendTransactionAsync } = useSendTransaction({ config: params.config })

  const { mutate, mutateAsync, ...result } = useSignerClientMutation<
    SafeClientResult,
    UpdateThresholdVariables
  >({
    ...params,
    mutationKey: [MutationKey.UpdateThreshold],
    mutationSafeClientFn: async (signerClient, updateThresholdParams) => {
      const updateThresholdTx =
        await signerClient.createChangeThresholdTransaction(updateThresholdParams)
      return sendTransactionAsync({ transactions: [updateThresholdTx] })
    }
  })

  return { ...result, updateThreshold: mutate, updateThresholdAsync: mutateAsync }
}
