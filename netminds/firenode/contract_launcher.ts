export interface LaunchConfig {
  contractName: string
  parameters: Record<string, any>
  deployEndpoint: string
  apiKey?: string
  timeoutMs?: number
  retries?: number
}

export interface LaunchResult {
  success: boolean
  address?: string
  transactionHash?: string
  error?: string
  raw?: any
}

export class LaunchNode {
  private timeoutMs: number
  private retries: number

  constructor(private config: LaunchConfig) {
    this.timeoutMs = config.timeoutMs ?? 15_000
    this.retries = Math.max(0, config.retries ?? 1)
  }

  private async fetchWithTimeout(url: string, opts: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      return await fetch(url, { ...opts, signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  async deploy(): Promise<LaunchResult> {
    const { deployEndpoint, apiKey, contractName, parameters } = this.config
    const body = JSON.stringify({ contractName, parameters })

    let lastErr: any
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const res = await this.fetchWithTimeout(deployEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body,
        })

        if (!res.ok) {
          const text = await res.text()
          lastErr = new Error(`HTTP ${res.status}: ${text}`)
          continue
        }

        const json = await res.json()
        return {
          success: true,
          address: json.contractAddress,
          transactionHash: json.txHash,
          raw: json,
        }
      } catch (err: any) {
        lastErr = err
      }
    }

    return { success: false, error: lastErr?.message ?? String(lastErr) }
  }
}
