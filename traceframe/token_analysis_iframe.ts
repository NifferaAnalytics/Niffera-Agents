import type { TokenMetrics } from "./tokenAnalysisCalculator"

export interface IframeConfig {
  containerId: string
  srcUrl: string
  metrics: TokenMetrics
  refreshIntervalMs?: number
  messageType?: string
  targetOrigin?: string
  sandbox?: string
  title?: string
  allow?: string
  debug?: boolean
}

export class TokenAnalysisIframe {
  private iframeEl: HTMLIFrameElement | null = null
  private intervalId: number | null = null

  constructor(private config: IframeConfig) {}

  init(): void {
    if (this.iframeEl) return
    const container = document.getElementById(this.config.containerId)
    if (!container) throw new Error("Container not found: " + this.config.containerId)

    const iframe = document.createElement("iframe")
    iframe.src = this.config.srcUrl
    iframe.width = "100%"
    iframe.height = "100%"
    iframe.style.border = "0"
    if (this.config.title) iframe.title = this.config.title
    if (this.config.allow) iframe.allow = this.config.allow
    if (this.config.sandbox) iframe.setAttribute("sandbox", this.config.sandbox)

    iframe.onload = () => this.postMetrics()
    container.appendChild(iframe)
    this.iframeEl = iframe

    if (this.config.refreshIntervalMs && this.config.refreshIntervalMs > 0) {
      this.intervalId = window.setInterval(
        () => this.postMetrics(),
        this.config.refreshIntervalMs
      )
    }
  }

  /** Post current metrics to the iframe */
  private postMetrics(): void {
    if (!this.iframeEl?.contentWindow) return
    if (!this.isValidMetrics(this.config.metrics)) return

    const type = this.config.messageType ?? "TOKEN_ANALYSIS_METRICS"
    const targetOrigin = this.resolveTargetOrigin()

    this.iframeEl.contentWindow.postMessage(
      { type, payload: this.config.metrics, sentAt: Date.now() },
      targetOrigin
    )

    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log("[TokenAnalysisIframe] posted metrics", {
        type,
        targetOrigin,
        metrics: this.config.metrics,
      })
    }
  }

  /** Update metrics and optionally push immediately */
  updateMetrics(metrics: TokenMetrics, pushNow = true): void {
    this.config.metrics = metrics
    if (pushNow) this.postMetrics()
  }

  /** Manually trigger a refresh (re-post current metrics) */
  refresh(): void {
    this.postMetrics()
  }

  /** Remove interval, detach iframe, and cleanup */
  destroy(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.iframeEl && this.iframeEl.parentNode) {
      this.iframeEl.parentNode.removeChild(this.iframeEl)
    }
    this.iframeEl = null
  }

  /** Basic runtime validation to avoid posting malformed data */
  private isValidMetrics(m: TokenMetrics): boolean {
    if (!m) return false
    const nums = [m.averagePrice, m.volatility, m.maxPrice, m.minPrice]
    return nums.every(v => typeof v === "number" && Number.isFinite(v))
  }

  /** Decide the safest targetOrigin for postMessage */
  private resolveTargetOrigin(): string {
    if (this.config.targetOrigin) return this.config.targetOrigin
    try {
      const url = new URL(this.config.srcUrl, window.location.href)
      // For http(s) we can restrict by origin; for others (data:, blob:) fall back to "*"
      return /^https?:$/.test(url.protocol) ? url.origin : "*"
    } catch {
      return "*"
    }
  }
}
