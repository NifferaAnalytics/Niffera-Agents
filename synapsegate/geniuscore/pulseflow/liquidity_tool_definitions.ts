import { toolkitBuilder } from "@/ai/core"
import { FETCH_POOL_DATA_KEY } from "@/ai/modules/liquidity/pool-fetcher/key"
import { ANALYZE_POOL_HEALTH_KEY } from "@/ai/modules/liquidity/health-checker/key"
import { FetchPoolDataAction } from "@/ai/modules/liquidity/pool-fetcher/action"
import { AnalyzePoolHealthAction } from "@/ai/modules/liquidity/health-checker/action"

type Toolkit = ReturnType<typeof toolkitBuilder>

const TOOL_PREFIXES = {
  fetch: "liquidityscan",
  health: "poolhealth",
} as const

export const LIQUIDITY_ANALYSIS_TOOLS = {
  [`${TOOL_PREFIXES.fetch}-${FETCH_POOL_DATA_KEY}`]: toolkitBuilder(new FetchPoolDataAction()),
  [`${TOOL_PREFIXES.health}-${ANALYZE_POOL_HEALTH_KEY}`]: toolkitBuilder(new AnalyzePoolHealthAction()),
} as const satisfies Record<string, Toolkit>

export type LiquidityAnalysisToolKey = keyof typeof LIQUIDITY_ANALYSIS_TOOLS
