import { toolkitBuilder } from "@/ai/core"
import { FETCH_POOL_DATA_KEY } from "@/ai/modules/liquidity/pool-fetcher/key"
import { ANALYZE_POOL_HEALTH_KEY } from "@/ai/modules/liquidity/health-checker/key"
import { FetchPoolDataAction } from "@/ai/modules/liquidity/pool-fetcher/action"
import { AnalyzePoolHealthAction } from "@/ai/modules/liquidity/health-checker/action"

type Toolkit = ReturnType<typeof toolkitBuilder>

/** Extended liquidity tools mapped by stable keys */
export const EXTENDED_LIQUIDITY_TOOLS: Record<string, Toolkit> = Object.freeze({
  [`liquidityscan-${FETCH_POOL_DATA_KEY}`]: toolkitBuilder(new FetchPoolDataAction()),
  [`poolhealth-${ANALYZE_POOL_HEALTH_KEY}`]: toolkitBuilder(new AnalyzePoolHealthAction()),
})

/** Export a frozen list of available tool keys for safer consumption */
export const EXTENDED_LIQUIDITY_TOOL_KEYS = Object.freeze(
  Object.keys(EXTENDED_LIQUIDITY_TOOLS)
) as ReadonlyArray<string>

/** Small helper to access a tool by key with runtime validation */
export const getExtendedLiquidityTool = (key: string): Toolkit => {
  if (!(key in EXTENDED_LIQUIDITY_TOOLS)) throw new Error(`Unknown tool key: ${key}`)
  return EXTENDED_LIQUIDITY_TOOLS[key as keyof typeof EXTENDED_LIQUIDITY_TOOLS]
}
