import { waitFor } from '@testing-library/react'
import * as tanstackQuery from '@tanstack/react-query'
import { SafeClient } from '@safe-global/sdk-starter-kit'
import { usePublicClientQuery } from '@/hooks/usePublicClientQuery.js'
import * as usePublicClient from '@/hooks/usePublicClient.js'
import * as useConfig from '@/hooks/useConfig.js'
import { configExistingSafe, configPredictedSafe } from '@test/config.js'
import { safeAddress } from '@test/fixtures/index.js'
import { renderHookInQueryClientProvider } from '@test/utils.js'

// This is necessary to set a spy on the `useQuery` function without getting the following error:
// "TypeError: Cannot redefine property: useQuery"
jest.mock('@tanstack/react-query', () => ({
  __esModule: true,
  ...jest.requireActual('@tanstack/react-query')
}))

describe('usePublicClientQuery', () => {
  const useConfigSpy = jest.spyOn(useConfig, 'useConfig')
  const usePublicClientSpy = jest.spyOn(usePublicClient, 'usePublicClient')
  const useQuerySpy = jest.spyOn(tanstackQuery, 'useQuery')
  const publicClientMock = {
    protocolKit: {
      getAddress: jest.fn().mockResolvedValue(safeAddress)
    }
  }

  const querySafeClientFnMock = jest.fn((safeClient) => safeClient.protocolKit.getAddress())

  beforeEach(() => {
    useConfigSpy.mockReturnValue([configExistingSafe, () => {}])
    usePublicClientSpy.mockReturnValue(publicClientMock as unknown as SafeClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call the passed function with a SafeClient instance and return the query result', async () => {
    const { result } = renderHookInQueryClientProvider(() =>
      usePublicClientQuery({
        querySafeClientFn: querySafeClientFnMock,
        queryKey: ['test']
      })
    )

    expect(usePublicClientSpy).toHaveBeenCalledTimes(1)
    expect(usePublicClientSpy).toHaveBeenCalledWith({ config: undefined })

    expect(result.current).toMatchObject({ data: undefined, status: 'pending' })

    await waitFor(() =>
      expect(result.current).toMatchObject({ data: safeAddress, status: 'success' })
    )

    expect(publicClientMock.protocolKit.getAddress).toHaveBeenCalledTimes(1)

    expect(useQuerySpy).toHaveBeenCalledTimes(2)
    expect(useQuerySpy).toHaveBeenCalledWith({
      queryKey: ['test', configExistingSafe],
      queryFn: expect.any(Function)
    })

    expect(querySafeClientFnMock).toHaveBeenCalledTimes(1)
    expect(querySafeClientFnMock).toHaveBeenCalledWith(publicClientMock)

    expect(usePublicClientSpy).toHaveBeenCalledTimes(2)
    expect(usePublicClientSpy).toHaveBeenCalledWith({ config: undefined })
  })

  it('should accept a config to override the one from the SafeProvider', async () => {
    const { result } = renderHookInQueryClientProvider(() =>
      usePublicClientQuery({
        config: configPredictedSafe,
        querySafeClientFn: querySafeClientFnMock,
        queryKey: ['test']
      })
    )

    expect(useConfigSpy).toHaveBeenCalledTimes(1)
    expect(useConfigSpy).toHaveBeenCalledWith({ config: configPredictedSafe })

    expect(usePublicClientSpy).toHaveBeenCalledTimes(1)
    expect(usePublicClientSpy).toHaveBeenCalledWith({ config: configPredictedSafe })

    await waitFor(() =>
      expect(result.current).toMatchObject({ data: safeAddress, status: 'success' })
    )

    expect(useConfigSpy).toHaveBeenCalledTimes(2)
    expect(useConfigSpy).toHaveBeenCalledWith({ config: configPredictedSafe })

    expect(usePublicClientSpy).toHaveBeenCalledTimes(2)
    expect(usePublicClientSpy).toHaveBeenCalledWith({ config: configPredictedSafe })
  })

  it('should return no data if the public client is not initialized', async () => {
    usePublicClientSpy.mockReturnValueOnce(undefined)

    const { result } = renderHookInQueryClientProvider(() =>
      usePublicClientQuery({
        querySafeClientFn: querySafeClientFnMock,
        queryKey: ['test']
      })
    )

    expect(usePublicClientSpy).toHaveBeenCalledTimes(1)
    expect(usePublicClientSpy).toHaveBeenCalledWith({ config: undefined })

    expect(result.current).toMatchObject({ data: undefined, status: 'pending' })
  })

  it('should return no data if the request fails', async () => {
    publicClientMock.protocolKit.getAddress.mockRejectedValue(new Error('Address error'))

    const { result } = renderHookInQueryClientProvider(() =>
      usePublicClientQuery({
        querySafeClientFn: querySafeClientFnMock,
        queryKey: ['test']
      })
    )

    expect(usePublicClientSpy).toHaveBeenCalledTimes(1)
    expect(usePublicClientSpy).toHaveBeenCalledWith({ config: undefined })

    expect(result.current).toMatchObject({ data: undefined, status: 'pending' })
  })
})
