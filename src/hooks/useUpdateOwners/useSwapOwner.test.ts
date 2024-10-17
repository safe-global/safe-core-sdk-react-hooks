import { useMutation } from '@tanstack/react-query'
import { waitFor } from '@testing-library/dom'
import { SafeClient } from '@safe-global/sdk-starter-kit'
import * as useSendTransaction from '@/hooks/useSendTransaction.js'
import * as useSignerClientMutation from '@/hooks/useSignerClientMutation.js'
import { useSwapOwner } from '@/hooks/useUpdateOwners/useSwapOwner.js'
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

describe('useSwapOwner', () => {
  const mutateFnName = 'swapOwner'
  const variables = { oldOwnerAddress: accounts[0], newOwnerAddress: accounts[1] }
  const mutationIdleResult = createCustomMutationResult({ status: 'idle', mutateFnName })
  const mutationSuccessResult = createCustomMutationResult({
    status: 'success',
    mutateFnName,
    data: ethereumTxHash,
    variables
  })

  const useSendTransactionSpy = jest.spyOn(useSendTransaction, 'useSendTransaction')
  const useSignerClientMutationSpy = jest.spyOn(useSignerClientMutation, 'useSignerClientMutation')

  const createSwapOwnerTxResultMock = safeMultisigTransaction
  const createSwapOwnerTxMock = jest.fn().mockResolvedValue(createSwapOwnerTxResultMock)

  const sendTransactionResultMock = ethereumTxHash
  const sendTransactionAsyncMock = jest.fn().mockResolvedValue(sendTransactionResultMock)

  const signerClientMock = {
    createSwapOwnerTransaction: createSwapOwnerTxMock
  } as unknown as SafeClient

  beforeEach(() => {
    useSignerClientMutationSpy.mockImplementation(
      <SafeClientResult, SwapOwnerVariables>({
        mutationSafeClientFn,
        mutationKey
      }: useSignerClientMutation.UseSignerClientMutationParams<
        SafeClientResult,
        SwapOwnerVariables
      >) =>
        useMutation({
          mutationKey,
          mutationFn: (params: SwapOwnerVariables) => mutationSafeClientFn(signerClientMock, params)
        })
    )

    useSendTransactionSpy.mockReturnValue({
      sendTransactionAsync: sendTransactionAsyncMock
    } as unknown as useSendTransaction.UseSendTransactionReturnType)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return result of `useSignerClientMutation` call with `swapOwner` + `swapOwnerAsync` functions', () => {
    const { result } = renderHookInQueryClientProvider(() => useSwapOwner())

    expect(useSendTransactionSpy).toHaveBeenCalledTimes(1)
    expect(useSendTransactionSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useSignerClientMutationSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientMutationSpy).toHaveBeenCalledWith({
      mutationSafeClientFn: expect.any(Function),
      mutationKey: [MutationKey.SwapOwner]
    })

    expect(result.current).toEqual(mutationIdleResult)

    expect(useSignerClientMutationSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientMutationSpy).toHaveBeenCalledWith({
      mutationKey: [MutationKey.SwapOwner],
      mutationSafeClientFn: expect.any(Function)
    })

    expect(createSwapOwnerTxMock).toHaveBeenCalledTimes(0)
    expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)
  })

  it('should accept a config to override the one from the SafeProvider', async () => {
    const config = { ...configPredictedSafe, signer: signerPrivateKeys[0] }

    const { result } = renderHookInQueryClientProvider(() => useSwapOwner({ config }))

    expect(useSendTransactionSpy).toHaveBeenCalledTimes(1)
    expect(useSendTransactionSpy).toHaveBeenCalledWith({ config })

    expect(useSignerClientMutationSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientMutationSpy).toHaveBeenCalledWith({
      config,
      mutationSafeClientFn: expect.any(Function),
      mutationKey: [MutationKey.SwapOwner]
    })

    expect(result.current).toEqual(mutationIdleResult)

    expect(createSwapOwnerTxMock).toHaveBeenCalledTimes(0)
    expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)
  })

  it.each<'swapOwner' | 'swapOwnerAsync'>(['swapOwner', 'swapOwnerAsync'])(
    'calling `%s` should create and send a transaction to swap an owner',
    async (fnName) => {
      const { result } = renderHookInQueryClientProvider(() => useSwapOwner())

      expect(createSwapOwnerTxMock).toHaveBeenCalledTimes(0)
      expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)

      const swapOwnerResult = await result.current[fnName](variables)

      if (fnName === 'swapOwnerAsync') {
        expect(swapOwnerResult).toEqual(sendTransactionResultMock)
      }

      await waitFor(() => expect(result.current.isSuccess).toBeTruthy())

      expect(result.current).toEqual(mutationSuccessResult)

      expect(createSwapOwnerTxMock).toHaveBeenCalledTimes(1)
      expect(createSwapOwnerTxMock).toHaveBeenCalledWith(variables)

      expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(1)
      expect(sendTransactionAsyncMock).toHaveBeenCalledWith({
        transactions: [createSwapOwnerTxResultMock]
      })
    }
  )

  describe('should return error data', () => {
    it.each<'swapOwner' | 'swapOwnerAsync'>(['swapOwner', 'swapOwnerAsync'])(
      'if creating a transaction for swapping an owner fails for `%s`',
      async (fnName) => {
        const error = new Error('Error creating swapt owner transaction')
        const mutationErrorResult = createCustomMutationResult({
          status: 'error',
          mutateFnName,
          error,
          variables
        })

        createSwapOwnerTxMock.mockRejectedValueOnce(error)

        const { result } = renderHookInQueryClientProvider(() => useSwapOwner())

        if (fnName === 'swapOwnerAsync') {
          await expect(result.current.swapOwnerAsync(variables)).rejects.toEqual(error)
        } else {
          result.current.swapOwner(variables)
        }

        await waitFor(() => expect(result.current.isError).toBeTruthy())

        expect(result.current).toEqual(mutationErrorResult)

        expect(createSwapOwnerTxMock).toHaveBeenCalledTimes(1)
        expect(createSwapOwnerTxMock).toHaveBeenCalledWith(variables)

        expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)
      }
    )

    it.each<'swapOwner' | 'swapOwnerAsync'>(['swapOwner', 'swapOwnerAsync'])(
      'if sending a transaction for swapping an owner fails for `%s`',
      async (fnName) => {
        const error = new Error('Error sending swap owner transaction')
        const mutationErrorResult = createCustomMutationResult({
          status: 'error',
          mutateFnName,
          error,
          variables
        })

        sendTransactionAsyncMock.mockRejectedValueOnce(error)

        const { result } = renderHookInQueryClientProvider(() => useSwapOwner())

        if (fnName === 'swapOwnerAsync') {
          await expect(result.current.swapOwnerAsync(variables)).rejects.toEqual(error)
        } else {
          result.current.swapOwner(variables)
        }

        await waitFor(() => expect(result.current.isError).toBeTruthy())

        expect(result.current).toEqual(mutationErrorResult)

        expect(createSwapOwnerTxMock).toHaveBeenCalledTimes(1)
        expect(createSwapOwnerTxMock).toHaveBeenCalledWith(variables)

        expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(1)
        expect(sendTransactionAsyncMock).toHaveBeenCalledWith({
          transactions: [createSwapOwnerTxResultMock]
        })
      }
    )
  })
})
