import { createConfig, useChains } from 'wagmi'
import type { ConfigParam, SafeConfig } from '@/types/index.js'

export type UseChainParams = ConfigParam<SafeConfig>
export type UseChainReturnType = SafeConfig['chain']

/**
 * Hook to get the configured chain depending on the config from the nearest `SafeProvider`.
 * @param params Parameters to customize the hook behavior.
 * @param params.config SafeConfig to use instead of the one provided by `SafeProvider`.
 * @returns Object describing the configured chain.
 */
export function useChain(params: UseChainParams = {}): UseChainReturnType {
  const wagmiConfig = params.config
    ? createConfig({
        chains: [params.config.chain],
        transports: { [params.config.chain.id]: params.config.transport }
      })
    : undefined

  const chains = wagmiConfig ? useChains({ config: wagmiConfig }) : useChains()

  if (chains.length === 0) {
    throw new Error('`useChain` must be used within `SafeProvider`.')
  }

  return chains[0]
}
