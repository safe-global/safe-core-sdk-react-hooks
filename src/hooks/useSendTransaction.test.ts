import { waitForTransactionReceipt } from 'wagmi/actions'
import { waitFor } from '@testing-library/react'
import { SafeClient } from '@safe-global/sdk-starter-kit'
import { useSendTransaction } from '@/hooks/useSendTransaction.js'
import * as useWaitForTransaction from '@/hooks/useWaitForTransaction.js'
import * as useSignerClientMutation from '@/hooks/useSignerClientMutation.js'
import { configExistingSafe } from '@test/config.js'
import { ethereumTxHash, safeAddress, safeTxHash, signerPrivateKeys } from '@test/fixtures/index.js'
import { createCustomMutationResult } from '@test/fixtures/mutationResult/index.js'
import { renderHookInQueryClientProvider } from '@test/utils.js'
import { MutationKey, QueryKey } from '@/constants.js'
import { queryClient } from '@/queryClient.js'
import { useMutation } from '@tanstack/react-query'

describe('useSendTransaction', () => {
  const transactionMock = { to: '0xABC', value: '0', data: '0x987' }

  const sendResponseMock = {
    safeAddress: safeAddress,
    description: 'Transaction sent',
    status: 'EXECUTED',
    transactions: {
      safeTxHash: undefined,
      ethereumTxHash: ethereumTxHash
    },
    messages: undefined,
    safeOperations: undefined,
    safeAccountDeployment: undefined
  }

  const mutateFnName = 'sendTransaction'
  const variables = { transactions: [transactionMock] }

  const mutationIdleResult = createCustomMutationResult({
    status: 'idle',
    mutateFnName
  })
  const mutationSuccessResult = createCustomMutationResult({
    status: 'success',
    mutateFnName,
    data: sendResponseMock,
    variables
  })

  const useWaitForTransactionSpy = jest.spyOn(useWaitForTransaction, 'useWaitForTransaction')
  const useSignerClientMutationSpy = jest.spyOn(useSignerClientMutation, 'useSignerClientMutation')
  const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries')

  const sendMock = jest.fn().mockResolvedValue(sendResponseMock)
  const signerClientMock = { send: sendMock } as unknown as SafeClient

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
      <SafeClientResult, SendTransactionVariables>({
        mutationSafeClientFn,
        mutationKey
      }: useSignerClientMutation.UseSignerClientMutationParams<
        SafeClientResult,
        SendTransactionVariables
      >) =>
        useMutation({
          mutationKey,
          mutationFn: (params: SendTransactionVariables) =>
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
  ])('should initialize correctly when being called %s', async (_label, params) => {
    const { result } = renderHookInQueryClientProvider(() => useSendTransaction(params))
    await waitFor(() => expect(result.current.isIdle).toEqual(true))

    expect(useSignerClientMutationSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientMutationSpy).toHaveBeenCalledWith({
      ...params,
      mutationKey: [MutationKey.SendTransaction],
      mutationSafeClientFn: expect.any(Function)
    })

    expect(sendMock).toHaveBeenCalledTimes(0)
  })

  it('should return mutation result object with `sendTransaction` and `sendTransactionAsync` functions', async () => {
    const { result } = renderHookInQueryClientProvider(() => useSendTransaction())
    await waitFor(() => expect(result.current.isIdle).toEqual(true))

    expect(result.current).toEqual(mutationIdleResult)

    expect(sendMock).toHaveBeenCalledTimes(0)
  })

  it.each<'sendTransaction' | 'sendTransactionAsync'>(['sendTransaction', 'sendTransactionAsync'])(
    'calling `%s` should call `send` from signer client with the provided data',
    async (fnName) => {
      const { result } = renderHookInQueryClientProvider(() => useSendTransaction())

      await waitFor(() => expect(result.current[fnName]).toEqual(expect.any(Function)))

      expect(sendMock).toHaveBeenCalledTimes(0)

      const sendResult = await result.current[fnName](variables)

      if (fnName === 'sendTransactionAsync') {
        expect(sendResult).toEqual(sendResponseMock)
      }

      await waitFor(() => expect(result.current.isSuccess).toBeTruthy())

      expect(result.current).toEqual(mutationSuccessResult)

      expect(sendMock).toHaveBeenCalledTimes(1)
      expect(sendMock).toHaveBeenCalledWith({ transactions: [transactionMock] })
    }
  )

  it.each<'sendTransaction' | 'sendTransactionAsync'>(['sendTransaction', 'sendTransactionAsync'])(
    'calling `%s` should invalidate queries for SafeInfo, PendingTransactions + Transactions if result contains `ethereumTxHash`',
    async (fnName) => {
      const { result } = renderHookInQueryClientProvider(() => useSendTransaction())

      await waitFor(() => expect(result.current[fnName]).toEqual(expect.any(Function)))

      const sendResult = await result.current[fnName]({
        transactions: [transactionMock]
      })

      if (fnName === 'sendTransactionAsync') {
        expect(sendResult).toEqual(sendResponseMock)
      }

      await waitFor(() => expect(result.current.isSuccess).toBeTruthy())

      expect(waitForTransactionReceiptMock).toHaveBeenCalledTimes(1)
      expect(waitForTransactionReceiptMock).toHaveBeenCalledWith(
        sendResponseMock.transactions.ethereumTxHash
      )

      expect(waitForTransactionIndexedMock).toHaveBeenCalledTimes(1)
      expect(waitForTransactionIndexedMock).toHaveBeenCalledWith(sendResponseMock.transactions)

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

  it.each<'sendTransaction' | 'sendTransactionAsync'>(['sendTransaction', 'sendTransactionAsync'])(
    'calling `%s` should invalidate queries for PendingTransactions if result contains `safeTxHash`',
    async (fnName) => {
      const sendResponseWithSafeTxHash = { ...sendResponseMock, transactions: { safeTxHash } }
      sendMock.mockResolvedValueOnce(sendResponseWithSafeTxHash)

      const { result } = renderHookInQueryClientProvider(() => useSendTransaction())

      await waitFor(() => expect(result.current[fnName]).toEqual(expect.any(Function)))

      const sendResult = await result.current[fnName]({
        transactions: [transactionMock]
      })

      if (fnName === 'sendTransactionAsync') {
        expect(sendResult).toEqual(sendResponseWithSafeTxHash)
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

  it.each<'sendTransaction' | 'sendTransactionAsync'>(['sendTransaction', 'sendTransactionAsync'])(
    'calling `%s` should return error data if the `send` request fails',
    async (fnName) => {
      const error = new Error('Send transaction failed :(')
      const mutationErrorResult = createCustomMutationResult({
        status: 'error',
        mutateFnName,
        error,
        variables
      })

      sendMock.mockRejectedValueOnce(error)

      const { result } = renderHookInQueryClientProvider(() => useSendTransaction())

      await waitFor(() => expect(result.current[fnName]).toEqual(expect.any(Function)))

      if (fnName === 'sendTransactionAsync') {
        await expect(() => result.current[fnName](variables)).rejects.toThrow(error)
      } else {
        result.current[fnName](variables)

        await waitFor(() => expect(result.current.isError).toEqual(true))

        expect(result.current).toEqual(mutationErrorResult)
      }

      expect(waitForTransactionReceiptMock).not.toHaveBeenCalled()
      expect(waitForTransactionIndexedMock).not.toHaveBeenCalled()
      expect(invalidateQueriesSpy).not.toHaveBeenCalled()
    }
  )
})
