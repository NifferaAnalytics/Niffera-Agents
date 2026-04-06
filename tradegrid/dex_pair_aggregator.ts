export interface PairInfo {
  exchange: string
  pairAddress: string
  baseSymbol: string
  quoteSymbol: string
  liquidityUsd: number
  volume24hUsd: number
  priceUsd: number
  fetchedAt?: number
}

export interface DexSuiteConfig {
  apis: Array<{ name: string; baseUrl: string; apiKey?: string }>
  timeoutMs?: number
  retries?: number
  retryDelayMs?: number
}

type ApiDef = { name: string; baseUrl: string; apiKey?: string }

export class DexSuite {
  constructor(private config: DexSuiteConfig) {}

  private get timeoutMs(): number {
    return this.config.timeoutMs ?? 10_000
  }
  private get retries(): number {
    return Math.max(0, this.config.retries ?? 1)
  }
  private get retryDelayMs(): number {
    return Math.max(0, this.config.retryDelayMs ?? 350)
  }

  /** Basic number sanitizer to avoid NaN creeping in */
  private safeNumber(v: unknown): number {
    const n = typeof v === "string" ? Number(v) : (v as number)
    return Number.isFinite(n) ? n : 0
  }

  /** Normalize heterogeneous API payloads into a common shape */
  private normalizePairResponse(apiName: string, pairAddress: string, data: any): PairInfo {
    // Tries common shapes first, then falls back to generic keys
    const token0 = data.token0 ?? data.base ?? data.baseToken ?? {}
    const token1 = data.token1 ?? data.quote ?? data.quoteToken ?? {}
    const baseSymbol = token0.symbol ?? token0.ticker ?? "BASE"
    const quoteSymbol = token1.symbol ?? token1.ticker ?? "QUOTE"

    return {
      exchange: apiName,
      pairAddress,
      baseSymbol,
      quoteSymbol,
      liquidityUsd: this.safeNumber(data.liquidityUsd ?? data.liquidityUSD ?? data.liquidity_usd),
      volume24hUsd: this.safeNumber(
        data.volume24hUsd ?? data.volume24hUSD ?? data.volume_24h_usd ?? data.volumeUsd24h
      ),
      priceUsd: this.safeNumber(data.priceUsd ?? data.priceUSD ?? data.price_usd ?? data.price),
      fetchedAt: Date.now(),
    }
  }

  /** Fetch helper with timeout, abort, and optional retry */
  private async fetchFromApi<T>(api: ApiDef, path: string): Promise<T> {
    let attempt = 0
    let lastError: unknown

    while (attempt <= this.retries) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.timeoutMs)
      try {
        const res = await fetch(`${api.baseUrl}${path}`, {
          headers: api.apiKey ? { Authorization: `Bearer ${api.apiKey}` } : {},
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`${api.name} ${path} ${res.status}`)
        return (await res.json()) as T
      } catch (err) {
        lastError = err
        if (attempt === this.retries) break
        await this.delay(this.retryDelayMs)
      } finally {
        clearTimeout(timer)
      }
      attempt++
    }
    throw lastError instanceof Error ? lastError : new Error("Unknown fetch error")
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Retrieve aggregated pair info across all configured DEX APIs.
   * @param pairAddress Blockchain address of the trading pair
   */
  async getPairInfo(pairAddress: string): Promise<PairInfo[]> {
    const results: PairInfo[] = []
    const tasks = this.config.apis.map(async api => {
      try {
        const data = await this.fetchFromApi<any>(api, `/pair/${pairAddress}`)
        results.push(this.normalizePairResponse(api.name, pairAddress, data))
      } catch {
        // skip failed API
      }
    })
    await Promise.all(tasks)
    return results
  }

  /**
   * Compare a list of pairs across exchanges, returning the best volume and liquidity.
   */
  async comparePairs(
    pairs: string[]
  ): Promise<Record<string, { bestVolume: PairInfo | null; bestLiquidity: PairInfo | null }>> {
    const entries = await Promise.all(
      pairs.map(async addr => {
        const infos = await this.getPairInfo(addr)
        if (infos.length === 0) return [addr, { bestVolume: null, bestLiquidity: null }] as const
        const bestVolume = infos.reduce((a, b) => (b.volume24hUsd > a.volume24hUsd ? b : a), infos[0])
        const bestLiquidity = infos.reduce((a, b) => (b.liquidityUsd > a.liquidityUsd ? b : a), infos[0])
        return [addr, { bestVolume, bestLiquidity }] as const
      })
    )
    return Object.fromEntries(entries)
  }

  /**
   * Find the best price across all exchanges for a pair, optionally requiring a minimum liquidity
   */
  async getBestPrice(pairAddress: string, minLiquidityUsd = 0): Promise<PairInfo | null> {
    const infos = await this.getPairInfo(pairAddress)
    const filtered = infos.filter(i => i.liquidityUsd >= minLiquidityUsd)
    if (filtered.length === 0) return null
    // Choose the highest liquidity, then lowest price spread candidate (here: simply lowest price)
    return filtered.reduce((best, curr) => {
      if (curr.liquidityUsd > best.liquidityUsd) return curr
      if (curr.liquidityUsd === best.liquidityUsd && curr.priceUsd < best.priceUsd) return curr
      return best
    }, filtered[0])
  }

  /**
   * Aggregate stats across APIs for a given pair (median price, total liquidity, total 24h volume)
   */
  async getAggregatedStats(pairAddress: string): Promise<{
    pairAddress: string
    exchanges: number
    medianPriceUsd: number
    totalLiquidityUsd: number
    totalVolume24hUsd: number
    lastUpdated: number | null
  }> {
    const infos = await this.getPairInfo(pairAddress)
    if (infos.length === 0) {
      return {
        pairAddress,
        exchanges: 0,
        medianPriceUsd: 0,
        totalLiquidityUsd: 0,
        totalVolume24hUsd: 0,
        lastUpdated: null,
      }
    }

    const prices = infos.map(i => i.priceUsd).sort((a, b) => a - b)
    const mid = Math.floor(prices.length / 2)
    const median =
      prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid]

    const totalLiquidityUsd = infos.reduce((s, i) => s + i.liquidityUsd, 0)
    const totalVolume24hUsd = infos.reduce((s, i) => s + i.volume24hUsd, 0)
    const lastUpdated = infos.reduce((m, i) => Math.max(m, i.fetchedAt ?? 0), 0)

    return {
      pairAddress,
      exchanges: infos.length,
      medianPriceUsd: median,
      totalLiquidityUsd,
      totalVolume24hUsd,
      lastUpdated: lastUpdated || null,
    }
  }
}
