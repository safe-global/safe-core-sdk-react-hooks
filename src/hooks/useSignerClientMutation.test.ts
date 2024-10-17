import { waitFor } from '@testing-library/react'
import * as tanstackQuery from '@tanstack/react-query'
import { SafeClient } from '@safe-global/sdk-starter-kit'
import { useSignerClientMutation } from '@/hooks/useSignerClientMutation.js'
import * as useSignerClient from '@/hooks/useSignerClient.js'
import * as useConfig from '@/hooks/useConfig.js'
import { configExistingSafe } from '@test/config.js'
import { safeMultisigTransaction, signerPrivateKeys } from '@test/fixtures/index.js'
import { createCustomMutationResult } from '@test/fixtures/mutationResult/index.js'
import { renderHookInQueryClientProvider } from '@test/utils.js'

// This is necessary to set a spy on the `useMutation` function without getting the following error:
// "TypeError: Cannot redefine property: useMutation"
jest.mock('@tanstack/react-query', () => ({
  __esModule: true,
  ...jest.requireActual('@tanstack/react-query')
}))

describe('useSignerClientMutation', () => {
  const useConfigSpy = jest.spyOn(useConfig, 'useConfig')
  const useSignerClientSpy = jest.spyOn(useSignerClient, 'useSignerClient')
  const useMutationSpy = jest.spyOn(tanstackQuery, 'useMutation')

  const createAddOwnerTxMock = jest.fn().mockResolvedValue(safeMultisigTransaction)

  const variables = 'test'
  const mutationIdleResult = createCustomMutationResult({ status: 'idle', mutateFnName: 'mutate' })
  const mutationSuccessResult = createCustomMutationResult({
    status: 'success',
    mutateFnName: 'mutate',
    data: safeMultisigTransaction,
    variables
  })

  const signerClientMock = { protocolKit: { createAddOwnerTx: createAddOwnerTxMock } }
  const mutationKeyMock = 'test-mutation-key'

  const mutationSafeClientFnMock = jest.fn((safeClient, params) =>
    safeClient.protocolKit.createAddOwnerTx(params)
  )

  beforeEach(() => {
    useConfigSpy.mockReturnValue([configExistingSafe, () => {}])
    useSignerClientSpy.mockReturnValue(signerClientMock as unknown as SafeClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    ['without config parameter', { config: undefined }],
    ['with config parameter', { config: { ...configExistingSafe, signer: signerPrivateKeys[0] } }]
  ])('should initialize signer client correctly when being called %s', async (_label, params) => {
    const { result } = renderHookInQueryClientProvider(() =>
      useSignerClientMutation({
        ...params,
        mutationSafeClientFn: mutationSafeClientFnMock,
        mutationKey: [mutationKeyMock]
      })
    )
    await waitFor(() => expect(result.current.isIdle).toEqual(true))

    expect(useSignerClientSpy).toHaveBeenCalledTimes(1)
    expect(useSignerClientSpy).toHaveBeenCalledWith(params)

    expect(useConfigSpy).toHaveBeenCalledTimes(1)
    expect(useConfigSpy).toHaveBeenCalledWith(params)

    expect(mutationSafeClientFnMock).toHaveBeenCalledTimes(0)
    expect(createAddOwnerTxMock).toHaveBeenCalledTimes(0)
  })

  it('should return mutation result object', async () => {
    const { result } = renderHookInQueryClientProvider(() =>
      useSignerClientMutation({
        mutationSafeClientFn: mutationSafeClientFnMock,
        mutationKey: [mutationKeyMock]
      })
    )
    await waitFor(() => expect(result.current.isIdle).toEqual(true))

    expect(result.current).toEqual(mutationIdleResult)

    expect(useMutationSpy).toHaveBeenCalledTimes(1)
    expect(useMutationSpy).toHaveBeenCalledWith({
      mutationFn: expect.any(Function),
      mutationKey: [mutationKeyMock, configExistingSafe]
    })

    expect(mutationSafeClientFnMock).toHaveBeenCalledTimes(0)
    expect(createAddOwnerTxMock).toHaveBeenCalledTimes(0)
  })

  describe('when calling the `mutate` function', () => {
    it('should call the passed `mutationSafeClientFn` function with a SafeClient instance and return the mutation result', async () => {
      const { result } = renderHookInQueryClientProvider(() =>
        useSignerClientMutation({
          mutationSafeClientFn: mutationSafeClientFnMock,
          mutationKey: [mutationKeyMock]
        })
      )

      await waitFor(() => expect(result.current.mutate).toEqual(expect.any(Function)))

      result.current.mutate(variables)

      await waitFor(() => expect(result.current.isSuccess).toEqual(true))

      expect(result.current).toEqual(mutationSuccessResult)

      expect(mutationSafeClientFnMock).toHaveBeenCalledTimes(1)
      expect(mutationSafeClientFnMock).toHaveBeenCalledWith(signerClientMock, 'test')

      expect(createAddOwnerTxMock).toHaveBeenCalledTimes(1)
      expect(createAddOwnerTxMock).toHaveBeenCalledWith('test')
    })

    it('should return error data if signer client is not connected', async () => {
      const error = new Error('Signer client is not available')
      const mutationErrorResult = createCustomMutationResult({
        status: 'error',
        mutateFnName: 'mutate',
        error,
        variables
      })

      useSignerClientSpy.mockReturnValueOnce(undefined)

      const { result } = renderHookInQueryClientProvider(() =>
        useSignerClientMutation({
          mutationSafeClientFn: mutationSafeClientFnMock,
          mutationKey: [mutationKeyMock]
        })
      )

      await waitFor(() => expect(result.current.mutate).toEqual(expect.any(Function)))

      result.current.mutate(variables)

      await waitFor(() => expect(result.current.isError).toEqual(true))

      expect(result.current).toEqual(mutationErrorResult)

      expect(mutationSafeClientFnMock).toHaveBeenCalledTimes(0)
      expect(createAddOwnerTxMock).toHaveBeenCalledTimes(0)
    })

    it('should return error data if the request fails', async () => {
      const error = new Error('Error :(')
      const mutationErrorResult = createCustomMutationResult({
        status: 'error',
        mutateFnName: 'mutate',
        error,
        variables
      })

      createAddOwnerTxMock.mockRejectedValueOnce(new Error('Error :('))

      const { result } = renderHookInQueryClientProvider(() =>
        useSignerClientMutation({
          mutationSafeClientFn: mutationSafeClientFnMock,
          mutationKey: [mutationKeyMock]
        })
      )

      await waitFor(() => expect(result.current.mutate).toEqual(expect.any(Function)))

      result.current.mutate(variables)

      await waitFor(() => expect(result.current.isError).toEqual(true))

      expect(result.current).toEqual(mutationErrorResult)

      expect(mutationSafeClientFnMock).toHaveBeenCalledTimes(1)
      expect(mutationSafeClientFnMock).toHaveBeenCalledWith(signerClientMock, variables)

      expect(createAddOwnerTxMock).toHaveBeenCalledTimes(1)
      expect(createAddOwnerTxMock).toHaveBeenCalledWith(variables)
    })
  })

  describe('when calling the `mutateAsync` function', () => {
    it('should call the passed `mutationSafeClientFn` function with a SafeClient instance and resolve with result', async () => {
      const { result } = renderHookInQueryClientProvider(() =>
        useSignerClientMutation({
          mutationSafeClientFn: mutationSafeClientFnMock,
          mutationKey: [mutationKeyMock]
        })
      )

      await waitFor(() => expect(result.current.mutateAsync).toEqual(expect.any(Function)))

      const sendResult = await result.current.mutateAsync(variables)

      expect(sendResult).toEqual(safeMultisigTransaction)

      expect(mutationSafeClientFnMock).toHaveBeenCalledTimes(1)
      expect(mutationSafeClientFnMock).toHaveBeenCalledWith(signerClientMock, variables)

      expect(createAddOwnerTxMock).toHaveBeenCalledTimes(1)
      expect(createAddOwnerTxMock).toHaveBeenCalledWith(variables)
    })

    it('should return error if signer client is not connected', async () => {
      useSignerClientSpy.mockReturnValueOnce(undefined)

      const { result } = renderHookInQueryClientProvider(() =>
        useSignerClientMutation({
          mutationSafeClientFn: mutationSafeClientFnMock,
          mutationKey: [mutationKeyMock]
        })
      )

      await waitFor(() => expect(result.current.mutateAsync).toEqual(expect.any(Function)))

      await expect(() => result.current.mutateAsync(variables)).rejects.toThrow(
        'Signer client is not available'
      )

      expect(mutationSafeClientFnMock).toHaveBeenCalledTimes(0)
      expect(createAddOwnerTxMock).toHaveBeenCalledTimes(0)
    })

    it('should throw error if the request fails', async () => {
      createAddOwnerTxMock.mockRejectedValueOnce(new Error('Error :('))

      const { result } = renderHookInQueryClientProvider(() =>
        useSignerClientMutation({
          mutationSafeClientFn: mutationSafeClientFnMock,
          mutationKey: [mutationKeyMock]
        })
      )

      await waitFor(() => expect(result.current.mutateAsync).toEqual(expect.any(Function)))

      await expect(() => result.current.mutateAsync(variables)).rejects.toThrow('Error :(')

      expect(mutationSafeClientFnMock).toHaveBeenCalledTimes(1)
      expect(mutationSafeClientFnMock).toHaveBeenCalledWith(signerClientMock, variables)

      expect(createAddOwnerTxMock).toHaveBeenCalledTimes(1)
      expect(createAddOwnerTxMock).toHaveBeenCalledWith(variables)
    })
  })
})
