import nodemailer from "nodemailer"

export interface AlertConfig {
  email?: {
    host: string
    port: number
    user: string
    pass: string
    from: string
    to: string[]
    secure?: boolean
  }
  console?: boolean
  prefix?: string
}

export interface AlertSignal {
  title: string
  message: string
  level: "info" | "warning" | "critical"
  timestamp?: number
}

export class AlertService {
  constructor(private cfg: AlertConfig) {}

  private async sendEmail(signal: AlertSignal) {
    if (!this.cfg.email) return
    const { host, port, user, pass, from, to, secure } = this.cfg.email
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: secure ?? false,
      auth: { user, pass },
    })

    await transporter.sendMail({
      from,
      to,
      subject: `[${signal.level.toUpperCase()}] ${signal.title}`,
      text: `${signal.message}\n\nTime: ${new Date(signal.timestamp ?? Date.now()).toISOString()}`,
    })
  }

  private logConsole(signal: AlertSignal) {
    if (!this.cfg.console) return
    const prefix = this.cfg.prefix ? `[${this.cfg.prefix}]` : "[Alert]"
    const time = new Date(signal.timestamp ?? Date.now()).toISOString()
    console.log(
      `${prefix}[${signal.level.toUpperCase()}] ${signal.title}\n${signal.message}\nTime: ${time}`
    )
  }

  async dispatch(signals: AlertSignal[]) {
    for (const sig of signals) {
      try {
        await this.sendEmail(sig)
        this.logConsole(sig)
      } catch (err) {
        console.error("Alert dispatch error:", err)
      }
    }
  }

  /** Utility to send a single alert without wrapping it in an array */
  async notify(signal: AlertSignal) {
    await this.dispatch([signal])
  }
}
