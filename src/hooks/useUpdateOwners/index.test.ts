import * as useAddOwner from '@/hooks/useUpdateOwners/useAddOwner.js'
import * as useRemoveOwner from '@/hooks/useUpdateOwners/useRemoveOwner.js'
import * as useSwapOwner from '@/hooks/useUpdateOwners/useSwapOwner.js'
import { configExistingSafe } from '@test/config.js'
import { signerPrivateKeys } from '@test/fixtures/index.js'
import { renderHookInMockedSafeProvider } from '@test/utils.js'
import { createCustomMutationResult } from '@test/fixtures/mutationResult/index.js'
import { useUpdateOwners } from './index.js'

describe('useUpdateOwners', () => {
  const useAddOwnerSpy = jest.spyOn(useAddOwner, 'useAddOwner')
  const useRemoveOwnerSpy = jest.spyOn(useRemoveOwner, 'useRemoveOwner')
  const useSwapOwnerSpy = jest.spyOn(useSwapOwner, 'useSwapOwner')

  const useAddOwnerResultMock = createCustomMutationResult({
    status: 'idle',
    mutateFnName: 'addOwner'
  }) as unknown as useAddOwner.UseAddOwnerReturnType
  const useRemoveOwnerResultMock = createCustomMutationResult({
    status: 'idle',
    mutateFnName: 'removeOwner'
  }) as unknown as useRemoveOwner.UseRemoveOwnerReturnType
  const useSwapOwnerResultMock = createCustomMutationResult({
    status: 'idle',
    mutateFnName: 'swapOwner'
  }) as unknown as useSwapOwner.UseSwapOwnerReturnType

  beforeEach(() => {
    useAddOwnerSpy.mockReturnValue(useAddOwnerResultMock)
    useRemoveOwnerSpy.mockReturnValue(useRemoveOwnerResultMock)
    useSwapOwnerSpy.mockReturnValue(useSwapOwnerResultMock)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    ['without config parameter', { config: undefined }],
    ['with config parameter', { config: { ...configExistingSafe, signer: signerPrivateKeys[0] } }]
  ])(
    'should return object wrapping individual hooks to add, remove or swap an owner when being called %s',
    async (_label, params) => {
      const { result } = renderHookInMockedSafeProvider(() => useUpdateOwners(params), {
        config: { ...configExistingSafe, signer: signerPrivateKeys[0] }
      })

      expect(result.current).toMatchObject({
        add: useAddOwnerResultMock,
        remove: useRemoveOwnerResultMock,
        swap: useSwapOwnerResultMock
      })

      expect(useAddOwnerSpy).toHaveBeenCalledWith(params)
      expect(useRemoveOwnerSpy).toHaveBeenCalledWith(params)
      expect(useSwapOwnerSpy).toHaveBeenCalledWith(params)
    }
  )
})
