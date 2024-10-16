import { UseMutateAsyncFunction, UseMutateFunction, UseMutationResult } from '@tanstack/react-query'
import { SafeClient, SafeClientResult } from '@safe-global/sdk-starter-kit'
import { ConfigParam, SafeConfigWithSigner } from '@/types/index.js'
import { useSignerClientMutation } from '@/hooks/useSignerClientMutation.js'
import { useSendTransaction } from '@/hooks/useSendTransaction.js'
import { MutationKey } from '@/constants.js'

export type AddOwnerVariables = Parameters<SafeClient['createAddOwnerTransaction']>[0]

export type UseAddOwnerParams = ConfigParam<SafeConfigWithSigner>
export type UseAddOwnerReturnType = Omit<
  UseMutationResult<SafeClientResult, Error, AddOwnerVariables>,
  'mutate' | 'mutateAsync'
> & {
  addOwner: UseMutateFunction<SafeClientResult, Error, AddOwnerVariables, unknown>
  addOwnerAsync: UseMutateAsyncFunction<SafeClientResult, Error, AddOwnerVariables, unknown>
}

/**
 * Hook to add an owner to the connected Safe.
 * @param params Parameters to customize the hook behavior.
 * @param params.config SafeConfig to use instead of the one provided by `SafeProvider`.
 * @returns Object containing the mutation state and the function to add an owner.
 */
export function useAddOwner(params: UseAddOwnerParams = {}): UseAddOwnerReturnType {
  const { sendTransactionAsync } = useSendTransaction({ config: params.config })

  const { mutate, mutateAsync, ...result } = useSignerClientMutation<
    SafeClientResult,
    AddOwnerVariables
  >({
    ...params,
    mutationKey: [MutationKey.AddOwner],
    mutationSafeClientFn: async (safeClient, params) => {
      const addOwnerTx = await safeClient.createAddOwnerTransaction(params)
      return sendTransactionAsync({ transactions: [addOwnerTx] })
    }
  })

  return { ...result, addOwner: mutate, addOwnerAsync: mutateAsync }
}
