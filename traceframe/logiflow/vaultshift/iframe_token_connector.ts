import type { TokenDataPoint } from "./tokenDataFetcher"

export interface DataIframeConfig {
  containerId: string
  iframeUrl: string
  token: string
  apiBase: string
  refreshMs?: number
  messageType?: string
}

export class TokenDataIframeEmbedder {
  private iframe?: HTMLIFrameElement

  constructor(private cfg: DataIframeConfig) {}

  async init() {
    const container = document.getElementById(this.cfg.containerId)
    if (!container) throw new Error(`Container not found: ${this.cfg.containerId}`)

    this.iframe = document.createElement("iframe")
    this.iframe.src = this.cfg.iframeUrl
    this.iframe.style.border = "none"
    this.iframe.width = "100%"
    this.iframe.height = "100%"
    this.iframe.onload = () => this.postTokenData()
    container.appendChild(this.iframe)

    if (this.cfg.refreshMs) {
      setInterval(() => this.postTokenData(), this.cfg.refreshMs)
    }
  }

  private async postTokenData() {
    if (!this.iframe?.contentWindow) return
    const { TokenDataFetcher } = await import("./tokenDataFetcher")
    const fetcher = new TokenDataFetcher(this.cfg.apiBase)
    const data: TokenDataPoint[] = await fetcher.fetchHistory(this.cfg.token)
    this.iframe.contentWindow.postMessage(
      {
        type: this.cfg.messageType ?? "TOKEN_DATA",
        token: this.cfg.token,
        data,
        sentAt: Date.now(),
      },
      "*"
    )
  }

  /** Manually trigger a refresh outside of interval */
  async refresh() {
    await this.postTokenData()
  }

  /** Safely destroy iframe and cleanup */
  destroy() {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe)
    }
    this.iframe = undefined
  }
}
