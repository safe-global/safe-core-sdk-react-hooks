import { useMutation } from '@tanstack/react-query'
import { waitFor } from '@testing-library/dom'
import { SafeClient } from '@safe-global/sdk-starter-kit'
import * as useSendTransaction from '@/hooks/useSendTransaction.js'
import * as useSignerClientMutation from '@/hooks/useSignerClientMutation.js'
import { useRemoveOwner } from '@/hooks/useUpdateOwners/useRemoveOwner.js'
import {
  accounts,
  ethereumTxHash,
  safeMultisigTransaction,
  signerPrivateKeys
} from '@test/fixtures/index.js'
import { configPredictedSafe } from '@test/config.js'
import { createCustomMutationResult } from '@test/fixtures/mutationResult/index.js'
import { renderHookInQueryClientProvider } from '@test/utils.js'
import { MutationKey } from '@/constants.js'

describe('useRemoveOwner', () => {
  const ownerAddress = accounts[1]

  const mutateFnName = 'removeOwner'
  const variables = { ownerAddress }
  const mutationIdleResult = createCustomMutationResult({ status: 'idle', mutateFnName })
  const mutationSuccessResult = createCustomMutationResult({
    status: 'success',
    mutateFnName,
    data: ethereumTxHash,
    variables
  })

  const useSendTransactionSpy = jest.spyOn(useSendTransaction, 'useSendTransaction')
  const useSignerClientMutationSpy = jest.spyOn(useSignerClientMutation, 'useSignerClientMutation')

  const createRemoveOwnerTxResultMock = safeMultisigTransaction
  const createRemoveOwnerTxMock = jest.fn().mockResolvedValue(createRemoveOwnerTxResultMock)

  const sendTransactionResultMock = ethereumTxHash
  const sendTransactionAsyncMock = jest.fn().mockResolvedValue(sendTransactionResultMock)

  const signerClientMock = {
    createRemoveOwnerTransaction: createRemoveOwnerTxMock
  } as unknown as SafeClient

  beforeEach(() => {
    useSignerClientMutationSpy.mockImplementation(
      <SafeClientResult, RemoveOwnerVariables>({
        mutationSafeClientFn,
        mutationKey
      }: useSignerClientMutation.UseSignerClientMutationParams<
        SafeClientResult,
        RemoveOwnerVariables
      >) =>
        useMutation({
          mutationKey,
          mutationFn: (params: RemoveOwnerVariables) =>
            mutationSafeClientFn(signerClientMock, params)
        })
    )

    useSendTransactionSpy.mockReturnValue({
      sendTransactionAsync: sendTransactionAsyncMock
    } as unknown as useSendTransaction.UseSendTransactionReturnType)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return result of `useSignerClientMutation` call with `removeOwner` + `removeOwnerAsync` functions', () => {
    const { result } = renderHookInQueryClientProvider(() => useRemoveOwner())

    expect(useSendTransactionSpy).toHaveBeenCalledTimes(1)
    expect(useSendTransactionSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useSignerClientMutationSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientMutationSpy).toHaveBeenCalledWith({
      mutationSafeClientFn: expect.any(Function),
      mutationKey: [MutationKey.RemoveOwner]
    })

    expect(result.current).toEqual(mutationIdleResult)

    expect(useSignerClientMutationSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientMutationSpy).toHaveBeenCalledWith({
      mutationKey: [MutationKey.RemoveOwner],
      mutationSafeClientFn: expect.any(Function)
    })

    expect(createRemoveOwnerTxMock).toHaveBeenCalledTimes(0)
    expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)
  })

  it('should accept a config to override the one from the SafeProvider', async () => {
    const config = { ...configPredictedSafe, signer: signerPrivateKeys[0] }

    const { result } = renderHookInQueryClientProvider(() => useRemoveOwner({ config }))

    expect(useSendTransactionSpy).toHaveBeenCalledTimes(1)
    expect(useSendTransactionSpy).toHaveBeenCalledWith({ config })

    expect(useSignerClientMutationSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientMutationSpy).toHaveBeenCalledWith({
      config,
      mutationSafeClientFn: expect.any(Function),
      mutationKey: [MutationKey.RemoveOwner]
    })

    expect(result.current).toEqual(mutationIdleResult)

    expect(createRemoveOwnerTxMock).toHaveBeenCalledTimes(0)
    expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)
  })

  it.each<'removeOwner' | 'removeOwnerAsync'>(['removeOwner', 'removeOwnerAsync'])(
    'calling `%s` should create and send a transaction to remove an owner',
    async (fnName) => {
      const { result } = renderHookInQueryClientProvider(() => useRemoveOwner())

      expect(createRemoveOwnerTxMock).toHaveBeenCalledTimes(0)
      expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)

      const removeOwnerResult = await result.current[fnName](variables)

      if (fnName === 'removeOwnerAsync') {
        expect(removeOwnerResult).toEqual(sendTransactionResultMock)
      }

      await waitFor(() => expect(result.current.isSuccess).toBeTruthy())

      expect(result.current).toEqual(mutationSuccessResult)

      expect(createRemoveOwnerTxMock).toHaveBeenCalledTimes(1)
      expect(createRemoveOwnerTxMock).toHaveBeenCalledWith(variables)

      expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(1)
      expect(sendTransactionAsyncMock).toHaveBeenCalledWith({
        transactions: [createRemoveOwnerTxResultMock]
      })
    }
  )

  describe('should return error data', () => {
    it.each<'removeOwner' | 'removeOwnerAsync'>(['removeOwner', 'removeOwnerAsync'])(
      'if creating a transaction for removing an owner fails for `%s`',
      async (fnName) => {
        const error = new Error('Error creating remove owner transaction')
        const mutationErrorResult = createCustomMutationResult({
          status: 'error',
          mutateFnName,
          error,
          variables
        })

        createRemoveOwnerTxMock.mockRejectedValueOnce(error)

        const { result } = renderHookInQueryClientProvider(() => useRemoveOwner())

        if (fnName === 'removeOwnerAsync') {
          await expect(result.current.removeOwnerAsync(variables)).rejects.toEqual(error)
        } else {
          result.current.removeOwner(variables)
        }

        await waitFor(() => expect(result.current.isError).toBeTruthy())

        expect(result.current).toEqual(mutationErrorResult)

        expect(createRemoveOwnerTxMock).toHaveBeenCalledTimes(1)
        expect(createRemoveOwnerTxMock).toHaveBeenCalledWith(variables)

        expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)
      }
    )

    it.each<'removeOwner' | 'removeOwnerAsync'>(['removeOwner', 'removeOwnerAsync'])(
      'if sending a transaction for removing an owner fails for `%s`',
      async (fnName) => {
        const error = new Error('Error sending remove owner transaction')
        const mutationErrorResult = createCustomMutationResult({
          status: 'error',
          mutateFnName,
          error,
          variables
        })

        sendTransactionAsyncMock.mockRejectedValueOnce(error)

        const { result } = renderHookInQueryClientProvider(() => useRemoveOwner())

        if (fnName === 'removeOwnerAsync') {
          await expect(result.current.removeOwnerAsync(variables)).rejects.toEqual(error)
        } else {
          result.current.removeOwner(variables)
        }

        await waitFor(() => expect(result.current.isError).toBeTruthy())

        expect(result.current).toEqual(mutationErrorResult)

        expect(createRemoveOwnerTxMock).toHaveBeenCalledTimes(1)
        expect(createRemoveOwnerTxMock).toHaveBeenCalledWith(variables)

        expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(1)
        expect(sendTransactionAsyncMock).toHaveBeenCalledWith({
          transactions: [createRemoveOwnerTxResultMock]
        })
      }
    )
  })
})
