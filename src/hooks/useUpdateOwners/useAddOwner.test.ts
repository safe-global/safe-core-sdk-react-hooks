import { useMutation } from '@tanstack/react-query'
import { waitFor } from '@testing-library/dom'
import { SafeClient } from '@safe-global/sdk-starter-kit'
import * as useSendTransaction from '@/hooks/useSendTransaction.js'
import * as useSignerClientMutation from '@/hooks/useSignerClientMutation.js'
import { useAddOwner } from '@/hooks/useUpdateOwners/useAddOwner.js'
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

describe('useAddOwner', () => {
  const ownerAddress = accounts[1]

  const mutateFnName = 'addOwner'
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

  const createAddOwnerTxResultMock = safeMultisigTransaction
  const createAddOwnerTxMock = jest.fn().mockResolvedValue(createAddOwnerTxResultMock)

  const sendTransactionResultMock = ethereumTxHash
  const sendTransactionAsyncMock = jest.fn().mockResolvedValue(sendTransactionResultMock)

  const signerClientMock = {
    createAddOwnerTransaction: createAddOwnerTxMock
  } as unknown as SafeClient

  beforeEach(() => {
    useSignerClientMutationSpy.mockImplementation(
      <SafeClientResult, AddOwnerVariables>({
        mutationSafeClientFn,
        mutationKey
      }: useSignerClientMutation.UseSignerClientMutationParams<
        SafeClientResult,
        AddOwnerVariables
      >) =>
        useMutation({
          mutationKey,
          mutationFn: (params: AddOwnerVariables) => mutationSafeClientFn(signerClientMock, params)
        })
    )

    useSendTransactionSpy.mockReturnValue({
      sendTransactionAsync: sendTransactionAsyncMock
    } as unknown as useSendTransaction.UseSendTransactionReturnType)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return result of `useSignerClientMutation` call with `addOwner` + `addOwnerAsync` functions', () => {
    const { result } = renderHookInQueryClientProvider(() => useAddOwner())

    expect(useSendTransactionSpy).toHaveBeenCalledTimes(1)
    expect(useSendTransactionSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useSignerClientMutationSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientMutationSpy).toHaveBeenCalledWith({
      mutationSafeClientFn: expect.any(Function),
      mutationKey: [MutationKey.AddOwner]
    })

    expect(result.current).toEqual(mutationIdleResult)

    expect(useSignerClientMutationSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientMutationSpy).toHaveBeenCalledWith({
      mutationKey: [MutationKey.AddOwner],
      mutationSafeClientFn: expect.any(Function)
    })

    expect(createAddOwnerTxMock).toHaveBeenCalledTimes(0)
    expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)
  })

  it('should accept a config to override the one from the SafeProvider', async () => {
    const config = { ...configPredictedSafe, signer: signerPrivateKeys[0] }

    const { result } = renderHookInQueryClientProvider(() => useAddOwner({ config }))

    expect(useSendTransactionSpy).toHaveBeenCalledTimes(1)
    expect(useSendTransactionSpy).toHaveBeenCalledWith({ config })

    expect(useSignerClientMutationSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientMutationSpy).toHaveBeenCalledWith({
      config,
      mutationSafeClientFn: expect.any(Function),
      mutationKey: [MutationKey.AddOwner]
    })

    expect(result.current).toEqual(mutationIdleResult)

    expect(createAddOwnerTxMock).toHaveBeenCalledTimes(0)
    expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)
  })

  it.each<'addOwner' | 'addOwnerAsync'>(['addOwner', 'addOwnerAsync'])(
    'calling `%s` should create and send a transaction to add an owner',
    async (fnName) => {
      const { result } = renderHookInQueryClientProvider(() => useAddOwner())

      expect(createAddOwnerTxMock).toHaveBeenCalledTimes(0)
      expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)

      const addOwnerResult = await result.current[fnName](variables)

      if (fnName === 'addOwnerAsync') {
        expect(addOwnerResult).toEqual(sendTransactionResultMock)
      }

      await waitFor(() => expect(result.current.isSuccess).toBeTruthy())

      expect(result.current).toEqual(mutationSuccessResult)

      expect(createAddOwnerTxMock).toHaveBeenCalledTimes(1)
      expect(createAddOwnerTxMock).toHaveBeenCalledWith(variables)

      expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(1)
      expect(sendTransactionAsyncMock).toHaveBeenCalledWith({
        transactions: [createAddOwnerTxResultMock]
      })
    }
  )

  describe('should return error data', () => {
    it.each<'addOwner' | 'addOwnerAsync'>(['addOwner', 'addOwnerAsync'])(
      'if creating a transaction for adding an owner fails for `%s`',
      async (fnName) => {
        const error = new Error('Error creating add owner transaction')
        const mutationErrorResult = createCustomMutationResult({
          status: 'error',
          mutateFnName,
          error,
          variables
        })

        createAddOwnerTxMock.mockRejectedValueOnce(error)

        const { result } = renderHookInQueryClientProvider(() => useAddOwner())

        if (fnName === 'addOwnerAsync') {
          await expect(result.current.addOwnerAsync(variables)).rejects.toEqual(error)
        } else {
          result.current.addOwner(variables)
        }

        await waitFor(() => expect(result.current.isError).toBeTruthy())

        expect(result.current).toEqual(mutationErrorResult)

        expect(createAddOwnerTxMock).toHaveBeenCalledTimes(1)
        expect(createAddOwnerTxMock).toHaveBeenCalledWith(variables)

        expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(0)
      }
    )

    it.each<'addOwner' | 'addOwnerAsync'>(['addOwner', 'addOwnerAsync'])(
      'if sending a transaction for adding an owner fails for `%s`',
      async (fnName) => {
        const error = new Error('Error sending add owner transaction')
        const mutationErrorResult = createCustomMutationResult({
          status: 'error',
          mutateFnName,
          error,
          variables
        })

        sendTransactionAsyncMock.mockRejectedValueOnce(error)

        const { result } = renderHookInQueryClientProvider(() => useAddOwner())

        if (fnName === 'addOwnerAsync') {
          await expect(result.current.addOwnerAsync(variables)).rejects.toEqual(error)
        } else {
          result.current.addOwner(variables)
        }

        await waitFor(() => expect(result.current.isError).toBeTruthy())

        expect(result.current).toEqual(mutationErrorResult)

        expect(createAddOwnerTxMock).toHaveBeenCalledTimes(1)
        expect(createAddOwnerTxMock).toHaveBeenCalledWith(variables)

        expect(sendTransactionAsyncMock).toHaveBeenCalledTimes(1)
        expect(sendTransactionAsyncMock).toHaveBeenCalledWith({
          transactions: [createAddOwnerTxResultMock]
        })
      }
    )
  })
})
