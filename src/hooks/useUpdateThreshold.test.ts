import { useMutation } from '@tanstack/react-query'
import { waitFor } from '@testing-library/dom'
import { SafeClient } from '@safe-global/sdk-starter-kit'
import { useUpdateThreshold } from '@/hooks/useUpdateThreshold.js'
import * as useSendTransaction from '@/hooks/useSendTransaction.js'
import * as useSignerClientMutation from '@/hooks/useSignerClientMutation.js'
import { ethereumTxHash, safeMultisigTransaction, signerPrivateKeys } from '@test/fixtures/index.js'
import { configPredictedSafe } from '@test/config.js'
import { createCustomMutationResult } from '@test/fixtures/mutationResult/index.js'
import { renderHookInQueryClientProvider } from '@test/utils.js'
import { MutationKey } from '@/constants.js'

describe('useUpdateThreshold', () => {
  const threshold = 2
  const changeThresholdTxMock = safeMultisigTransaction
  const sendTransactionResultMock = ethereumTxHash

  const mutateFnName = 'updateThreshold'
  const variables = { threshold }
  const mutationIdleResult = createCustomMutationResult({ status: 'idle', mutateFnName })
  const mutationSuccessResult = createCustomMutationResult({
    status: 'success',
    mutateFnName,
    data: sendTransactionResultMock,
    variables
  })

  const useSendTransactionSpy = jest.spyOn(useSendTransaction, 'useSendTransaction')
  const useSignerClientMutationSpy = jest.spyOn(useSignerClientMutation, 'useSignerClientMutation')

  const createChangeThresholdTxMock = jest.fn().mockResolvedValue(changeThresholdTxMock)

  const sendTransactionAsyncMock = jest.fn().mockResolvedValue(sendTransactionResultMock)

  const signerClientMock = {
    createChangeThresholdTransaction: createChangeThresholdTxMock
  } as unknown as SafeClient

  beforeEach(() => {
    useSignerClientMutationSpy.mockImplementation(
      <SafeClientResult, UpdateThresholdVariables>({
        mutationSafeClientFn,
        mutationKey
      }: useSignerClientMutation.UseSignerClientMutationParams<
        SafeClientResult,
        UpdateThresholdVariables
      >) =>
        useMutation({
          mutationKey,
          mutationFn: (params: UpdateThresholdVariables) =>
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

  it('should return result of `useSignerClientMutation` call with `updateThreshold` + `updateThresholdAsync` functions', () => {
    const { result } = renderHookInQueryClientProvider(() => useUpdateThreshold())

    expect(useSendTransactionSpy).toHaveBeenCalledTimes(1)
    expect(useSendTransactionSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useSignerClientMutationSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientMutationSpy).toHaveBeenCalledWith({
      mutationSafeClientFn: expect.any(Function),
      mutationKey: [MutationKey.UpdateThreshold]
    })

    expect(result.current).toEqual(mutationIdleResult)

    expect(useSignerClientMutationSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientMutationSpy).toHaveBeenCalledWith({
      mutationKey: [MutationKey.UpdateThreshold],
      mutationSafeClientFn: expect.any(Function)
    })

    expect(createChangeThresholdTxMock).toHaveBeenCalledTimes(0)
    expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)
  })

  it('should accept a config to override the one from the SafeProvider', async () => {
    const config = { ...configPredictedSafe, signer: signerPrivateKeys[0] }

    const { result } = renderHookInQueryClientProvider(() => useUpdateThreshold({ config }))

    expect(useSendTransactionSpy).toHaveBeenCalledTimes(1)
    expect(useSendTransactionSpy).toHaveBeenCalledWith({ config })

    expect(useSignerClientMutationSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientMutationSpy).toHaveBeenCalledWith({
      config,
      mutationSafeClientFn: expect.any(Function),
      mutationKey: [MutationKey.UpdateThreshold]
    })

    expect(result.current).toEqual(mutationIdleResult)

    expect(createChangeThresholdTxMock).toHaveBeenCalledTimes(0)
    expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)
  })

  it.each<'updateThreshold' | 'updateThresholdAsync'>(['updateThreshold', 'updateThresholdAsync'])(
    'calling `%s` should create and send a transaction to change the threshold',
    async (fnName) => {
      const { result } = renderHookInQueryClientProvider(() => useUpdateThreshold())

      expect(createChangeThresholdTxMock).toHaveBeenCalledTimes(0)
      expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)

      const updateThresholdResult = await result.current[fnName](variables)

      if (fnName === 'updateThresholdAsync') {
        expect(updateThresholdResult).toEqual(sendTransactionResultMock)
      }

      await waitFor(() => expect(result.current.isSuccess).toBeTruthy())

      expect(result.current).toEqual(mutationSuccessResult)

      expect(createChangeThresholdTxMock).toHaveBeenCalledTimes(1)
      expect(createChangeThresholdTxMock).toHaveBeenCalledWith(variables)

      expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(1)
      expect(sendTransactionAsyncMock).toHaveBeenCalledWith({
        transactions: [changeThresholdTxMock]
      })
    }
  )

  describe('should return error data', () => {
    it.each<'updateThreshold' | 'updateThresholdAsync'>([
      'updateThreshold',
      'updateThresholdAsync'
    ])('if creating a transaction for updating the thresholds fails for `%s`', async (fnName) => {
      const error = new Error('Error creating transaction')
      const mutationErrorResult = createCustomMutationResult({
        status: 'error',
        mutateFnName,
        error,
        variables
      })

      createChangeThresholdTxMock.mockRejectedValueOnce(error)

      const { result } = renderHookInQueryClientProvider(() => useUpdateThreshold())

      if (fnName === 'updateThresholdAsync') {
        await expect(result.current.updateThresholdAsync(variables)).rejects.toEqual(error)
      } else {
        result.current.updateThreshold(variables)
      }

      await waitFor(() => expect(result.current.isError).toBeTruthy())

      expect(result.current).toEqual(mutationErrorResult)

      expect(createChangeThresholdTxMock).toHaveBeenCalledTimes(1)
      expect(createChangeThresholdTxMock).toHaveBeenCalledWith(variables)

      expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)
    })

    it.each<'updateThreshold' | 'updateThresholdAsync'>([
      'updateThreshold',
      'updateThresholdAsync'
    ])('if sending the threshold update transaction fails for `%s`', async (fnName) => {
      const error = new Error('Error sending transaction')
      const mutationErrorResult = createCustomMutationResult({
        status: 'error',
        mutateFnName,
        error,
        variables
      })

      sendTransactionAsyncMock.mockRejectedValueOnce(error)

      const { result } = renderHookInQueryClientProvider(() => useUpdateThreshold())

      if (fnName === 'updateThresholdAsync') {
        await expect(result.current.updateThresholdAsync(variables)).rejects.toEqual(error)
      } else {
        result.current.updateThreshold(variables)
      }

      await waitFor(() => expect(result.current.isError).toBeTruthy())

      expect(result.current).toEqual(mutationErrorResult)

      expect(createChangeThresholdTxMock).toHaveBeenCalledTimes(1)
      expect(createChangeThresholdTxMock).toHaveBeenCalledWith(variables)

      expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(1)
      expect(sendTransactionAsyncMock).toHaveBeenCalledWith({
        transactions: [changeThresholdTxMock]
      })
    })
  })
})
