export interface TokenDataPoint {
  timestamp: number
  priceUsd: number
  volumeUsd: number
  marketCapUsd: number
}

export interface TokenSummary {
  symbol: string
  latestPrice: number
  avgVolume24h: number
  marketCap: number
  dataPoints: number
}

export class TokenDataFetcher {
  constructor(private apiBase: string) {}

  /**
   * Fetches an array of TokenDataPoint for the given token symbol.
   * Expects endpoint: `${apiBase}/tokens/${symbol}/history`
   */
  async fetchHistory(symbol: string): Promise<TokenDataPoint[]> {
    const res = await fetch(`${this.apiBase}/tokens/${encodeURIComponent(symbol)}/history`)
    if (!res.ok) throw new Error(`Failed to fetch history for ${symbol}: ${res.status}`)
    const raw = (await res.json()) as any[]
    return raw.map(r => ({
      timestamp: r.time * 1000,
      priceUsd: Number(r.priceUsd),
      volumeUsd: Number(r.volumeUsd),
      marketCapUsd: Number(r.marketCapUsd),
    }))
  }

  /**
   * Fetch the latest datapoint for a token.
   */
  async fetchLatest(symbol: string): Promise<TokenDataPoint | null> {
    const history = await this.fetchHistory(symbol)
    if (!history.length) return null
    return history[history.length - 1]
  }

  /**
   * Produce a summary for a token including average 24h volume.
   */
  async fetchSummary(symbol: string): Promise<TokenSummary | null> {
    const history = await this.fetchHistory(symbol)
    if (!history.length) return null
    const latest = history[history.length - 1]
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    const last24h = history.filter(dp => dp.timestamp >= cutoff)
    const avgVolume24h =
      last24h.length > 0
        ? last24h.reduce((sum, dp) => sum + dp.volumeUsd, 0) / last24h.length
        : 0
    return {
      symbol,
      latestPrice: latest.priceUsd,
      avgVolume24h,
      marketCap: latest.marketCapUsd,
      dataPoints: history.length,
    }
  }
}
