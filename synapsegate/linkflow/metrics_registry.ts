export interface MetricEntry {
  key: string
  value: number
  updatedAt: number
}

export class MetricsCache {
  private cache = new Map<string, MetricEntry>()

  get(key: string): MetricEntry | undefined {
    return this.cache.get(key)
  }

  set(key: string, value: number): void {
    this.cache.set(key, { key, value, updatedAt: Date.now() })
  }

  hasRecent(key: string, maxAgeMs: number): boolean {
    const entry = this.cache.get(key)
    return !!entry && Date.now() - entry.updatedAt < maxAgeMs
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  entries(): MetricEntry[] {
    return Array.from(this.cache.values())
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  values(): number[] {
    return Array.from(this.cache.values()).map(e => e.value)
  }

  /** Return metrics updated within a given timeframe */
  recentEntries(maxAgeMs: number): MetricEntry[] {
    const now = Date.now()
    return this.entries().filter(e => now - e.updatedAt < maxAgeMs)
  }

  /** Export all metrics as a plain object for external use */
  toObject(): Record<string, number> {
    const out: Record<string, number> = {}
    for (const { key, value } of this.cache.values()) {
      out[key] = value
    }
    return out
  }
}
