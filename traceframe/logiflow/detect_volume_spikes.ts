export interface VolumePoint {
  timestamp: number
  volumeUsd: number
}

export interface SpikeEvent {
  timestamp: number
  volume: number
  spikeRatio: number
  avgWindow: number
  windowSize: number
}

/**
 * Detects spikes in trading volume compared to a rolling average window.
 */
export function detectVolumeSpikes(
  points: VolumePoint[],
  windowSize: number = 10,
  spikeThreshold: number = 2.0
): SpikeEvent[] {
  const events: SpikeEvent[] = []
  const volumes = points.map(p => p.volumeUsd)

  for (let i = windowSize; i < volumes.length; i++) {
    const window = volumes.slice(i - windowSize, i)
    const avg = window.reduce((sum, v) => sum + v, 0) / (window.length || 1)
    const curr = volumes[i]
    const ratio = avg > 0 ? curr / avg : Infinity
    if (ratio >= spikeThreshold) {
      events.push({
        timestamp: points[i].timestamp,
        volume: curr,
        spikeRatio: Math.round(ratio * 100) / 100,
        avgWindow: Math.round(avg * 100) / 100,
        windowSize,
      })
    }
  }
  return events
}

/**
 * Utility to detect the largest spike event
 */
export function getLargestSpike(events: SpikeEvent[]): SpikeEvent | null {
  if (!events.length) return null
  return events.reduce((max, e) =>
    e.spikeRatio > max.spikeRatio ? e : max
  )
}

/**
 * Utility to calculate average spike ratio
 */
export function averageSpikeRatio(events: SpikeEvent[]): number {
  if (!events.length) return 0
  const total = events.reduce((sum, e) => sum + e.spikeRatio, 0)
  return total / events.length
}
