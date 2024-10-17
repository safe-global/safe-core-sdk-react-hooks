import { waitFor } from '@testing-library/react'
import { SafeClient } from '@safe-global/sdk-starter-kit'
import * as createClient from '@/createClient.js'
import { usePublicClient, UsePubicClientParams } from '@/hooks/usePublicClient.js'
import { configExistingSafe, configPredictedSafe } from '@test/config.js'
import { renderHookInSafeProvider } from '@test/utils.js'

describe('usePublicClient', () => {
  const publicClientExistingSafeMock = { safeClient: 'existing' } as unknown as SafeClient
  const publicClientPredictedSafeMock = { safeClient: 'predicted' } as unknown as SafeClient

  const createPublicClientSpy = jest.spyOn(createClient, 'createPublicClient')

  beforeEach(() => {
    createPublicClientSpy.mockImplementation(({ safeOptions }) =>
      Promise.resolve(safeOptions ? publicClientPredictedSafeMock : publicClientExistingSafeMock)
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return the SafeClient instance from the nearest SafeProvider', async () => {
    const { result } = renderHookInSafeProvider(() => usePublicClient(), {
      config: configExistingSafe
    })

    await waitFor(() => expect(result.current).toMatchObject(publicClientExistingSafeMock))

    expect(createPublicClientSpy).toHaveBeenCalledTimes(1)
    expect(createPublicClientSpy).toHaveBeenCalledWith(configExistingSafe)

    expect(result.current).toMatchObject(publicClientExistingSafeMock)
  })

  describe('if a config param is passed to the hook', () => {
    it('should create a new SafeClient instance and return it instead of the one from the context', async () => {
      const { result } = renderHookInSafeProvider(
        () => usePublicClient({ config: configPredictedSafe }),
        { config: configExistingSafe }
      )

      await waitFor(() => expect(result.current).toMatchObject(publicClientPredictedSafeMock))

      expect(createPublicClientSpy).toHaveBeenCalledTimes(2)
      expect(createPublicClientSpy).toHaveBeenNthCalledWith(1, configPredictedSafe)
      expect(createPublicClientSpy).toHaveBeenNthCalledWith(2, configExistingSafe)

      expect(result.current).toMatchObject(publicClientPredictedSafeMock)
    })

    it('should create a new SafeClient client if the passed config changes', async () => {
      const { result, rerender } = renderHookInSafeProvider(
        ({ config = configPredictedSafe }: UsePubicClientParams = {}) =>
          usePublicClient({ config }),
        { config: configExistingSafe }
      )

      await waitFor(() => expect(result.current).toMatchObject(publicClientPredictedSafeMock))

      expect(createPublicClientSpy).toHaveBeenCalledTimes(2)

      const newConfig = { ...configExistingSafe, provider: 'newProvider' }
      rerender({ config: newConfig })

      await waitFor(() => expect(result.current).toMatchObject(publicClientExistingSafeMock))

      expect(createPublicClientSpy).toHaveBeenCalledTimes(3)
      expect(createPublicClientSpy).toHaveBeenNthCalledWith(3, newConfig)

      expect(result.current).toMatchObject(publicClientExistingSafeMock)
    })

    it('should NOT create a new SafeClient client if the config param matches the one from previous render', async () => {
      const { result, rerender } = renderHookInSafeProvider(
        ({ config = configPredictedSafe }: UsePubicClientParams = {}) =>
          usePublicClient({ config }),
        { config: configExistingSafe }
      )

      await waitFor(() => expect(result.current).toMatchObject(publicClientPredictedSafeMock))

      expect(createPublicClientSpy).toHaveBeenCalledTimes(2)

      const newConfig = { ...configPredictedSafe }

      expect(newConfig === configPredictedSafe).toBe(false)

      rerender({ config: newConfig })

      await waitFor(() => expect(result.current).toMatchObject(publicClientPredictedSafeMock))

      expect(createPublicClientSpy).toHaveBeenCalledTimes(2)
      expect(result.current).toMatchObject(publicClientPredictedSafeMock)
    })
  })
})
