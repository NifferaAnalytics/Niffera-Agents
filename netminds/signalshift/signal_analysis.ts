import type { Signal } from "./SignalApiClient"

/**
 * Processes raw signals into actionable events and summaries.
 */
export class SignalProcessor {
  /**
   * Filter signals by type and recency.
   * @param signals Array of Signal
   * @param type Desired signal type
   * @param sinceTimestamp Only include signals after this time
   */
  filter(signals: Signal[], type: string, sinceTimestamp: number): Signal[] {
    return signals.filter(
      s => s.type === type && s.timestamp > sinceTimestamp
    )
  }

  /**
   * Aggregate signals by type, counting occurrences.
   * @param signals Array of Signal
   */
  aggregateByType(signals: Signal[]): Record<string, number> {
    return signals.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  /**
   * Transform a signal into a human-readable summary string.
   */
  summarize(signal: Signal): string {
    const time = new Date(signal.timestamp).toISOString()
    return `[${time}] ${signal.type.toUpperCase()}: ${JSON.stringify(signal.payload)}`
  }

  /**
   * Group signals by type.
   */
  groupByType(signals: Signal[]): Record<string, Signal[]> {
    return signals.reduce((acc, s) => {
      if (!acc[s.type]) acc[s.type] = []
      acc[s.type].push(s)
      return acc
    }, {} as Record<string, Signal[]>)
  }

  /**
   * Sort signals by timestamp.
   */
  sortByTimestamp(signals: Signal[], order: "asc" | "desc" = "asc"): Signal[] {
    return [...signals].sort((a, b) =>
      order === "asc" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
    )
  }

  /**
   * Compute simple stats for a set of signals.
   */
  stats(signals: Signal[]): {
    total: number
    earliest?: number
    latest?: number
    uniqueTypes: number
  } {
    if (signals.length === 0) {
      return { total: 0, uniqueTypes: 0 }
    }
    const timestamps = signals.map(s => s.timestamp)
    const types = new Set(signals.map(s => s.type))
    return {
      total: signals.length,
      earliest: Math.min(...timestamps),
      latest: Math.max(...timestamps),
      uniqueTypes: types.size,
    }
  }
}
