import fetch from "node-fetch"

/*------------------------------------------------------
 * Types
 *----------------------------------------------------*/

interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export type CandlestickPattern =
  | "Hammer"
  | "ShootingStar"
  | "BullishEngulfing"
  | "BearishEngulfing"
  | "Doji"
  | "SpinningTop"

export interface PatternSignal {
  timestamp: number
  pattern: CandlestickPattern
  confidence: number
}

/*------------------------------------------------------
 * Detector
 *----------------------------------------------------*/

export class CandlestickPatternDetector {
  constructor(private readonly apiUrl: string) {}

  /** Fetch recent OHLC candles with optional timeframe */
  async fetchCandles(symbol: string, limit = 100, timeframe = "1m"): Promise<Candle[]> {
    const res = await fetch(
      `${this.apiUrl}/markets/${symbol}/candles?limit=${limit}&timeframe=${timeframe}`,
      { timeout: 10_000 }
    )
    if (!res.ok) {
      throw new Error(`Failed to fetch candles ${res.status}: ${res.statusText}`)
    }
    const data = (await res.json()) as Candle[]
    if (!Array.isArray(data)) throw new Error("Unexpected response format for candles")
    return data
  }

  /* ------------------------- Pattern helpers ---------------------- */

  private isHammer(c: Candle): number {
    const body = Math.abs(c.close - c.open)
    const lowerWick = Math.min(c.open, c.close) - c.low
    const ratio = body > 0 ? lowerWick / body : 0
    return ratio > 2 && body / (c.high - c.low) < 0.3 ? Math.min(ratio / 3, 1) : 0
  }

  private isShootingStar(c: Candle): number {
    const body = Math.abs(c.close - c.open)
    const upperWick = c.high - Math.max(c.open, c.close)
    const ratio = body > 0 ? upperWick / body : 0
    return ratio > 2 && body / (c.high - c.low) < 0.3 ? Math.min(ratio / 3, 1) : 0
  }

  private isBullishEngulfing(prev: Candle, curr: Candle): number {
    const cond =
      curr.close > curr.open &&
      prev.close < prev.open &&
      curr.close > prev.open &&
      curr.open < prev.close
    if (!cond) return 0
    const bodyPrev = Math.abs(prev.close - prev.open)
    const bodyCurr = Math.abs(curr.close - curr.open)
    return bodyPrev > 0 ? Math.min(bodyCurr / bodyPrev, 1) : 0.8
  }

  private isBearishEngulfing(prev: Candle, curr: Candle): number {
    const cond =
      curr.close < curr.open &&
      prev.close > prev.open &&
      curr.open > prev.close &&
      curr.close < prev.open
    if (!cond) return 0
    const bodyPrev = Math.abs(prev.close - prev.open)
    const bodyCurr = Math.abs(curr.close - curr.open)
    return bodyPrev > 0 ? Math.min(bodyCurr / bodyPrev, 1) : 0.8
  }

  private isDoji(c: Candle): number {
    const range = c.high - c.low
    const body = Math.abs(c.close - c.open)
    const ratio = range > 0 ? body / range : 1
    return ratio < 0.1 ? 1 - ratio * 10 : 0
  }

  private isSpinningTop(c: Candle): number {
    const body = Math.abs(c.close - c.open)
    const range = c.high - c.low
    const ratio = range > 0 ? body / range : 1
    return ratio >= 0.1 && ratio <= 0.3 ? 1 - Math.abs(0.2 - ratio) * 5 : 0
  }

  /** Analyze last N candles and return detected signals */
  async detectPatterns(symbol: string, limit = 50): Promise<PatternSignal[]> {
    const candles = await this.fetchCandles(symbol, limit)
    const signals: PatternSignal[] = []

    for (let i = 1; i < candles.length; i++) {
      const prev = candles[i - 1]
      const curr = candles[i]

      const hammer = this.isHammer(curr)
      if (hammer > 0) signals.push({ timestamp: curr.timestamp, pattern: "Hammer", confidence: hammer })

      const shootingStar = this.isShootingStar(curr)
      if (shootingStar > 0) signals.push({ timestamp: curr.timestamp, pattern: "ShootingStar", confidence: shootingStar })

      const bullEngulf = this.isBullishEngulfing(prev, curr)
      if (bullEngulf > 0) signals.push({ timestamp: curr.timestamp, pattern: "BullishEngulfing", confidence: bullEngulf })

      const bearEngulf = this.isBearishEngulfing(prev, curr)
      if (bearEngulf > 0) signals.push({ timestamp: curr.timestamp, pattern: "BearishEngulfing", confidence: bearEngulf })

      const doji = this.isDoji(curr)
      if (doji > 0) signals.push({ timestamp: curr.timestamp, pattern: "Doji", confidence: doji })

      const spinning = this.isSpinningTop(curr)
      if (spinning > 0) signals.push({ timestamp: curr.timestamp, pattern: "SpinningTop", confidence: spinning })
    }

    return signals
  }
}
