import { useSafeInfo } from '@/hooks/useSafeInfo/index.js'
import * as useAddress from '@/hooks/useSafeInfo/useAddress.js'
import * as useNonce from '@/hooks/useSafeInfo/useNonce.js'
import * as useThreshold from '@/hooks/useSafeInfo/useThreshold.js'
import * as useIsDeployed from '@/hooks/useSafeInfo/useIsDeployed.js'
import * as useOwners from '@/hooks/useSafeInfo/useOwners.js'
import { configPredictedSafe } from '@test/config.js'
import { renderHookInQueryClientProvider } from '@test/utils.js'
import {
  createCustomQueryResult,
  queryLoadingErrorResult,
  queryPendingResult
} from '@test/fixtures/queryResult.js'
import { safeInfo } from '@test/fixtures/index.js'

describe('useSafeInfo', () => {
  const useAddressSpy = jest.spyOn(useAddress, 'useAddress')
  const useNonceSpy = jest.spyOn(useNonce, 'useNonce')
  const useThresholdSpy = jest.spyOn(useThreshold, 'useThreshold')
  const useIsDeployedSpy = jest.spyOn(useIsDeployed, 'useIsDeployed')
  const useOwnersSpy = jest.spyOn(useOwners, 'useOwners')

  const addressQueryResultMock = createCustomQueryResult({
    status: 'success',
    data: safeInfo.address
  })
  const nonceQueryResultMock = createCustomQueryResult({ status: 'success', data: safeInfo.nonce })
  const thresholdQueryResultMock = createCustomQueryResult({
    status: 'success',
    data: safeInfo.threshold
  })
  const isDeployedQueryResultMock = createCustomQueryResult({
    status: 'success',
    data: safeInfo.isDeployed
  })
  const ownersQueryResultMock = createCustomQueryResult({
    status: 'success',
    data: safeInfo.owners
  })

  beforeEach(() => {
    useAddressSpy.mockReturnValue(addressQueryResultMock)
    useNonceSpy.mockReturnValue(nonceQueryResultMock)
    useThresholdSpy.mockReturnValue(thresholdQueryResultMock)
    useIsDeployedSpy.mockReturnValue(isDeployedQueryResultMock)
    useOwnersSpy.mockReturnValue(ownersQueryResultMock)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return fetch and return Safe infos using individual hooks', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refetch, ...expectedResult } = createCustomQueryResult({
      status: 'success',
      data: safeInfo
    })

    const { result } = renderHookInQueryClientProvider(() => useSafeInfo())

    expect(useAddressSpy).toHaveBeenCalledTimes(1)
    expect(useAddressSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useNonceSpy).toHaveBeenCalledTimes(1)
    expect(useNonceSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useThresholdSpy).toHaveBeenCalledTimes(1)
    expect(useThresholdSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useIsDeployedSpy).toHaveBeenCalledTimes(1)
    expect(useIsDeployedSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useOwnersSpy).toHaveBeenCalledTimes(1)
    expect(useOwnersSpy).toHaveBeenCalledWith({ config: undefined })

    expect(result.current).toEqual(expectedResult)
  })

  it('should accept a config to override the one from the SafeProvider', () => {
    renderHookInQueryClientProvider(() => useSafeInfo({ config: configPredictedSafe }))

    expect(useAddressSpy).toHaveBeenCalledTimes(1)
    expect(useAddressSpy).toHaveBeenCalledWith({ config: configPredictedSafe })

    expect(useNonceSpy).toHaveBeenCalledTimes(1)
    expect(useNonceSpy).toHaveBeenCalledWith({ config: configPredictedSafe })

    expect(useThresholdSpy).toHaveBeenCalledTimes(1)
    expect(useThresholdSpy).toHaveBeenCalledWith({ config: configPredictedSafe })

    expect(useIsDeployedSpy).toHaveBeenCalledTimes(1)
    expect(useIsDeployedSpy).toHaveBeenCalledWith({ config: configPredictedSafe })

    expect(useOwnersSpy).toHaveBeenCalledTimes(1)
    expect(useOwnersSpy).toHaveBeenCalledWith({ config: configPredictedSafe })
  })

  it('should return with loading state + partial data if any individual hook returns with loading state', async () => {
    useThresholdSpy.mockReturnValueOnce(createCustomQueryResult({ status: 'pending' }))

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refetch, ...expectedResult } = {
      ...queryPendingResult,
      data: { ...safeInfo, threshold: undefined }
    }

    const { result } = renderHookInQueryClientProvider(() => useSafeInfo())

    expect(useAddressSpy).toHaveBeenCalledTimes(1)
    expect(useAddressSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useNonceSpy).toHaveBeenCalledTimes(1)
    expect(useNonceSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useThresholdSpy).toHaveBeenCalledTimes(1)
    expect(useThresholdSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useIsDeployedSpy).toHaveBeenCalledTimes(1)
    expect(useIsDeployedSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useOwnersSpy).toHaveBeenCalledTimes(1)
    expect(useOwnersSpy).toHaveBeenCalledWith({ config: undefined })

    expect(result.current).toEqual(expectedResult)
  })

  it('should return error state + partial data if any individual hook returns with error state', async () => {
    useAddressSpy.mockReturnValueOnce(queryLoadingErrorResult)
    useOwnersSpy.mockReturnValueOnce(queryLoadingErrorResult)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refetch, ...expectedResult } = {
      ...queryLoadingErrorResult,
      errorUpdateCount: 2,
      data: { ...safeInfo, address: undefined, owners: undefined }
    }

    const { result } = renderHookInQueryClientProvider(() => useSafeInfo())

    expect(useAddressSpy).toHaveBeenCalledTimes(1)
    expect(useAddressSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useNonceSpy).toHaveBeenCalledTimes(1)
    expect(useNonceSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useThresholdSpy).toHaveBeenCalledTimes(1)
    expect(useThresholdSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useIsDeployedSpy).toHaveBeenCalledTimes(1)
    expect(useIsDeployedSpy).toHaveBeenCalledWith({ config: undefined })

    expect(useOwnersSpy).toHaveBeenCalledTimes(1)
    expect(useOwnersSpy).toHaveBeenCalledWith({ config: undefined })

    expect(result.current).toEqual(expectedResult)
  })
})
