export interface Signal {
  id: string
  type: string
  timestamp: number
  payload: Record<string, any>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  status?: number
  raw?: any
}

export interface ClientOptions {
  timeoutMs?: number
  retries?: number
}

/**
 * HTTP client for fetching signals.
 */
export class SignalApiClient {
  private timeoutMs: number
  private retries: number

  constructor(private baseUrl: string, private apiKey?: string, opts: ClientOptions = {}) {
    this.timeoutMs = opts.timeoutMs ?? 10_000
    this.retries = Math.max(0, opts.retries ?? 1)
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`
    return headers
  }

  private async fetchWithTimeout(path: string): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      return await fetch(`${this.baseUrl}${path}`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }
  }

  private async getJson<T>(path: string): Promise<ApiResponse<T>> {
    let lastErr: any
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const res = await this.fetchWithTimeout(path)
        if (!res.ok) {
          return { success: false, error: `HTTP ${res.status}`, status: res.status }
        }
        const json = await res.json()
        return { success: true, data: json as T, status: res.status, raw: json }
      } catch (err: any) {
        lastErr = err
      }
    }
    return { success: false, error: lastErr?.message ?? "Unknown error" }
  }

  async fetchAllSignals(): Promise<ApiResponse<Signal[]>> {
    return this.getJson<Signal[]>("/signals")
  }

  async fetchSignalById(id: string): Promise<ApiResponse<Signal>> {
    return this.getJson<Signal>(`/signals/${encodeURIComponent(id)}`)
  }
}
