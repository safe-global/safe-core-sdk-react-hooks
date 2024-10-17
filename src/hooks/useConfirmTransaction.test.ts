import { waitForTransactionReceipt } from 'wagmi/actions'
import { useMutation } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import { SafeClient } from '@safe-global/sdk-starter-kit'
import { useConfirmTransaction } from '@/hooks/useConfirmTransaction.js'
import * as useWaitForTransaction from '@/hooks/useWaitForTransaction.js'
import * as useSignerClientMutation from '@/hooks/useSignerClientMutation.js'
import { configExistingSafe } from '@test/config.js'
import { ethereumTxHash, safeAddress, safeTxHash, signerPrivateKeys } from '@test/fixtures/index.js'
import { createCustomMutationResult } from '@test/fixtures/mutationResult/index.js'
import { renderHookInQueryClientProvider } from '@test/utils.js'
import { MutationKey, QueryKey } from '@/constants.js'
import { queryClient } from '@/queryClient.js'

describe('useConfirmTransaction', () => {
  const confirmResponseMock = {
    safeAddress: safeAddress,
    description: 'Transaction confirmed',
    status: 'EXECUTED',
    transactions: {
      safeTxHash: safeTxHash,
      ethereumTxHash: ethereumTxHash
    },
    messages: undefined,
    safeOperations: undefined,
    safeAccountDeployment: undefined
  }

  const mutateFnName = 'confirmTransaction'
  const variables = { safeTxHash }
  const mutationIdleResult = createCustomMutationResult({
    status: 'idle',
    mutateFnName
  })
  const mutationSuccessResult = createCustomMutationResult({
    status: 'success',
    mutateFnName,
    data: confirmResponseMock,
    variables
  })

  const useWaitForTransactionSpy = jest.spyOn(useWaitForTransaction, 'useWaitForTransaction')
  const useSignerClientMutationSpy = jest.spyOn(useSignerClientMutation, 'useSignerClientMutation')
  const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries')

  const confirmMock = jest.fn().mockResolvedValue(confirmResponseMock)
  const signerClientMock = { confirm: confirmMock } as unknown as SafeClient

  const waitForTransactionReceiptMock = jest.fn(
    () =>
      Promise.resolve({ status: 'success' } as unknown) as ReturnType<
        typeof waitForTransactionReceipt
      >
  )
  const waitForTransactionIndexedMock = jest.fn(() => Promise.resolve())

  beforeEach(() => {
    useWaitForTransactionSpy.mockReturnValue({
      waitForTransactionIndexed: waitForTransactionIndexedMock,
      waitForTransactionReceipt: waitForTransactionReceiptMock
    })

    useSignerClientMutationSpy.mockImplementation(
      <SafeClientResult, ConfirmTransactionVariables>({
        mutationSafeClientFn,
        mutationKey
      }: useSignerClientMutation.UseSignerClientMutationParams<
        SafeClientResult,
        ConfirmTransactionVariables
      >) =>
        useMutation({
          mutationKey,
          mutationFn: (params: ConfirmTransactionVariables) =>
            mutationSafeClientFn(signerClientMock, params)
        })
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    ['without config parameter', { config: undefined }],
    ['with config parameter', { config: { ...configExistingSafe, signer: signerPrivateKeys[0] } }]
  ])('should initialize signer client correctly when being called %s', async (_label, params) => {
    const { result } = renderHookInQueryClientProvider(() => useConfirmTransaction(params))
    await waitFor(() => expect(result.current.isIdle).toEqual(true))

    expect(useSignerClientMutationSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientMutationSpy).toHaveBeenCalledWith({
      ...params,
      mutationKey: [MutationKey.ConfirmTransaction],
      mutationSafeClientFn: expect.any(Function)
    })

    expect(confirmMock).toHaveBeenCalledTimes(0)
  })

  it('should return mutation result object with `confirmTransaction` and `confirmTransactionAsync` functions', async () => {
    const { result } = renderHookInQueryClientProvider(() => useConfirmTransaction())
    await waitFor(() => expect(result.current.isIdle).toEqual(true))

    expect(result.current).toEqual(mutationIdleResult)

    expect(confirmMock).toHaveBeenCalledTimes(0)
  })

  it.each<'confirmTransaction' | 'confirmTransactionAsync'>([
    'confirmTransaction',
    'confirmTransactionAsync'
  ])(
    'calling `%s` should call `confirm` from signer client with the provided safeTxHash',
    async (fnName) => {
      const { result } = renderHookInQueryClientProvider(() => useConfirmTransaction())

      await waitFor(() => expect(result.current[fnName]).toEqual(expect.any(Function)))

      expect(confirmMock).toHaveBeenCalledTimes(0)

      const confirmResult = await result.current[fnName]({ safeTxHash })

      if (fnName === 'confirmTransactionAsync') {
        expect(confirmResult).toEqual(confirmResponseMock)
      }

      await waitFor(() => expect(result.current.isSuccess).toBeTruthy())

      expect(result.current).toEqual(mutationSuccessResult)

      expect(confirmMock).toHaveBeenCalledTimes(1)
      expect(confirmMock).toHaveBeenCalledWith({ safeTxHash })
    }
  )

  it.each<'confirmTransaction' | 'confirmTransactionAsync'>([
    'confirmTransaction',
    'confirmTransactionAsync'
  ])(
    'calling `%s` should invalidate queries for SafeInfo, PendingTransactions + Transactions if result contains `ethereumTxHash`',
    async (fnName) => {
      const { result } = renderHookInQueryClientProvider(() => useConfirmTransaction())

      await waitFor(() => expect(result.current[fnName]).toEqual(expect.any(Function)))

      const confirmResult = await result.current[fnName]({ safeTxHash })

      if (fnName === 'confirmTransactionAsync') {
        expect(confirmResult).toEqual(confirmResponseMock)
      }

      await waitFor(() => expect(result.current.isSuccess).toBeTruthy())

      expect(waitForTransactionReceiptMock).toHaveBeenCalledTimes(1)
      expect(waitForTransactionReceiptMock).toHaveBeenCalledWith(
        confirmResponseMock.transactions.ethereumTxHash
      )

      expect(waitForTransactionIndexedMock).toHaveBeenCalledTimes(1)
      expect(waitForTransactionIndexedMock).toHaveBeenCalledWith(confirmResponseMock.transactions)

      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(8)

      expect(invalidateQueriesSpy).toHaveBeenNthCalledWith(3, {
        queryKey: [QueryKey.Address]
      })
      expect(invalidateQueriesSpy).toHaveBeenNthCalledWith(4, {
        queryKey: [QueryKey.Nonce]
      })
      expect(invalidateQueriesSpy).toHaveBeenNthCalledWith(5, {
        queryKey: [QueryKey.Threshold]
      })
      expect(invalidateQueriesSpy).toHaveBeenNthCalledWith(6, {
        queryKey: [QueryKey.IsDeployed]
      })
      expect(invalidateQueriesSpy).toHaveBeenNthCalledWith(7, {
        queryKey: [QueryKey.Owners]
      })
      expect(invalidateQueriesSpy).toHaveBeenNthCalledWith(8, {
        queryKey: [QueryKey.Transactions]
      })
    }
  )

  it.each<'confirmTransaction' | 'confirmTransactionAsync'>([
    'confirmTransaction',
    'confirmTransactionAsync'
  ])(
    'calling `%s` should invalidate queries for PendingTransactions if result contains `safeTxHash`',
    async (fnName) => {
      const confirmResponseWithSafeTxHash = { ...confirmResponseMock, transactions: { safeTxHash } }
      confirmMock.mockResolvedValueOnce(confirmResponseWithSafeTxHash)

      const { result } = renderHookInQueryClientProvider(() => useConfirmTransaction())

      await waitFor(() => expect(result.current[fnName]).toEqual(expect.any(Function)))

      const confirmResult = await result.current[fnName]({ safeTxHash })

      if (fnName === 'confirmTransactionAsync') {
        expect(confirmResult).toEqual(confirmResponseWithSafeTxHash)
      }

      await waitFor(() => expect(result.current.isSuccess).toBeTruthy())

      expect(waitForTransactionReceiptMock).not.toHaveBeenCalled()
      expect(waitForTransactionIndexedMock).not.toHaveBeenCalled()

      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(1)
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: [QueryKey.PendingTransactions]
      })
    }
  )

  it.each<'confirmTransaction' | 'confirmTransactionAsync'>([
    'confirmTransaction',
    'confirmTransactionAsync'
  ])('calling `%s` should return error data if the `confirm` request fails', async (fnName) => {
    const error = new Error('Confirm transaction failed :(')
    const mutationErrorResult = createCustomMutationResult({
      status: 'error',
      mutateFnName,
      error,
      variables
    })

    confirmMock.mockRejectedValueOnce(error)

    const { result } = renderHookInQueryClientProvider(() => useConfirmTransaction())

    await waitFor(() => expect(result.current[fnName]).toEqual(expect.any(Function)))

    if (fnName === 'confirmTransactionAsync') {
      await expect(() => result.current[fnName]({ safeTxHash })).rejects.toThrow(error)
    } else {
      result.current[fnName]({ safeTxHash })

      await waitFor(() => expect(result.current.isError).toEqual(true))

      expect(result.current).toEqual(mutationErrorResult)
    }

    expect(waitForTransactionReceiptMock).not.toHaveBeenCalled()
    expect(waitForTransactionIndexedMock).not.toHaveBeenCalled()
    expect(invalidateQueriesSpy).not.toHaveBeenCalled()
  })
})
