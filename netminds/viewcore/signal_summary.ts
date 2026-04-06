import type { SightCoreMessage } from "./WebSocketClient"

export interface AggregatedSignal {
  topic: string
  count: number
  lastPayload: any
  lastTimestamp: number
  firstTimestamp?: number
}

export class SignalAggregator {
  private counts: Record<string, AggregatedSignal> = {}

  /**
   * Process a new incoming message and update aggregation.
   */
  processMessage(msg: SightCoreMessage): AggregatedSignal {
    const { topic, payload, timestamp } = msg
    const entry =
      this.counts[topic] || {
        topic,
        count: 0,
        lastPayload: null,
        lastTimestamp: 0,
        firstTimestamp: timestamp,
      }
    entry.count += 1
    entry.lastPayload = payload
    entry.lastTimestamp = timestamp
    this.counts[topic] = entry
    return entry
  }

  /**
   * Get aggregation for a single topic.
   */
  getAggregated(topic: string): AggregatedSignal | undefined {
    return this.counts[topic]
  }

  /**
   * Get all aggregated signals as an array.
   */
  getAllAggregated(): AggregatedSignal[] {
    return Object.values(this.counts)
  }

  /**
   * Remove aggregation data for a single topic.
   */
  remove(topic: string): void {
    delete this.counts[topic]
  }

  /**
   * Reset all stored aggregation.
   */
  reset(): void {
    this.counts = {}
  }

  /**
   * Get summary statistics across all topics.
   */
  getSummary(): {
    totalTopics: number
    totalMessages: number
    mostActiveTopic?: string
  } {
    const entries = Object.values(this.counts)
    const totalMessages = entries.reduce((s, e) => s + e.count, 0)
    const mostActive = entries.reduce(
      (a, b) => (b.count > (a?.count ?? 0) ? b : a),
      undefined as AggregatedSignal | undefined
    )
    return {
      totalTopics: entries.length,
      totalMessages,
      mostActiveTopic: mostActive?.topic,
    }
  }
}
