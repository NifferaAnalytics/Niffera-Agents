import { execCommand } from "./execCommand"

export interface ShellTask {
  id: string
  command: string
  description?: string
  createdAt?: number
}

export interface ShellResult {
  taskId: string
  output?: string
  error?: string
  executedAt: number
  durationMs?: number
}

export class ShellTaskRunner {
  private tasks: ShellTask[] = []

  /**
   * Schedule a shell task for execution.
   */
  scheduleTask(task: ShellTask): void {
    const enriched: ShellTask = { ...task, createdAt: Date.now() }
    this.tasks.push(enriched)
  }

  /**
   * Remove a scheduled task by id before execution.
   */
  cancelTask(taskId: string): boolean {
    const before = this.tasks.length
    this.tasks = this.tasks.filter(t => t.id !== taskId)
    return this.tasks.length < before
  }

  /**
   * Execute all scheduled tasks in sequence.
   */
  async runAll(): Promise<ShellResult[]> {
    const results: ShellResult[] = []
    for (const task of this.tasks) {
      const start = Date.now()
      try {
        const output = await execCommand(task.command)
        results.push({
          taskId: task.id,
          output,
          executedAt: start,
          durationMs: Date.now() - start,
        })
      } catch (err: any) {
        results.push({
          taskId: task.id,
          error: err.message,
          executedAt: start,
          durationMs: Date.now() - start,
        })
      }
    }
    this.tasks = []
    return results
  }

  /**
   * Execute a single task immediately without scheduling.
   */
  async runSingle(task: ShellTask): Promise<ShellResult> {
    const start = Date.now()
    try {
      const output = await execCommand(task.command)
      return {
        taskId: task.id,
        output,
        executedAt: start,
        durationMs: Date.now() - start,
      }
    } catch (err: any) {
      return {
        taskId: task.id,
        error: err.message,
        executedAt: start,
        durationMs: Date.now() - start,
      }
    }
  }

  /**
   * Return all currently scheduled tasks.
   */
  listScheduled(): ShellTask[] {
    return [...this.tasks]
  }

  /**
   * Clear all scheduled tasks without executing them.
   */
  clear(): void {
    this.tasks = []
  }
}
