import * as sdkStarterKit from '@safe-global/sdk-starter-kit'
import { waitFor } from '@testing-library/dom'
import { useConfig } from '@/hooks/useConfig.js'
import { configExistingSafe, configPredictedSafe } from '@test/config.js'
import { catchHookError, renderHookInSafeProvider } from '@test/utils.js'
import * as createClient from '@/createClient.js'

describe('useConfig', () => {
  const publicClientMock = { safeClient: 'public' } as unknown as sdkStarterKit.SafeClient
  const signerClientMock = { safeClient: 'signer' } as unknown as sdkStarterKit.SafeClient

  const createPublicClientSpy = jest.spyOn(createClient, 'createPublicClient')
  const createSignerClientSpy = jest.spyOn(createClient, 'createSignerClient')

  beforeEach(() => {
    createPublicClientSpy.mockResolvedValue(publicClientMock)
    createSignerClientSpy.mockResolvedValue(signerClientMock)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return the config from the `SafeProvider` if no parameter is passed', async () => {
    const { result } = renderHookInSafeProvider(() => useConfig(), { config: configExistingSafe })
    await waitFor(() => result.current.length === 2)

    expect(result.current).toMatchObject([configExistingSafe, expect.any(Function)])
  })

  it('should return the config from the `SafeProvider` if passed config object is `undefined`', async () => {
    const { result } = renderHookInSafeProvider(() => useConfig({ config: undefined }), {
      config: configExistingSafe
    })
    await waitFor(() => result.current.length === 2)

    expect(result.current).toMatchObject([configExistingSafe, expect.any(Function)])
  })

  it('should return the config passed to the hook instead of the one from the `SafeProvider`', async () => {
    const { result } = renderHookInSafeProvider(() => useConfig({ config: configPredictedSafe }), {
      config: configExistingSafe
    })
    await waitFor(() => result.current.length === 2)

    expect(result.current).toMatchObject([configPredictedSafe, expect.any(Function)])
  })

  it('should throw if not rendered inside a `SafeProvider`', () => {
    const error = catchHookError(() => useConfig())

    expect(error?.message).toEqual('`useConfig` must be used within `SafeProvider`.')
  })
})
