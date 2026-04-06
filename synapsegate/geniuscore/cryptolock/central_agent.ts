import type { BaseAction, ActionResponse } from "./action_types"
import { z } from "zod"

export interface AgentContext {
  apiEndpoint: string
  apiKey: string
  traceId?: string
}

/**
 * Central Agent: routes calls to registered actions with validation and timing.
 */
export class Agent {
  private actions = new Map<string, BaseAction<any, any, AgentContext>>()

  /**
   * Register an action. Throws if the id already exists.
   */
  register<S extends z.ZodObject<any>, R>(action: BaseAction<S, R, AgentContext>): void {
    if (this.actions.has(action.id)) {
      throw new Error(`Action with id "${action.id}" is already registered`)
    }
    this.actions.set(action.id, action)
  }

  /**
   * Remove an action by id. Returns true if removed.
   */
  unregister(actionId: string): boolean {
    return this.actions.delete(actionId)
  }

  /**
   * Check whether an action id is registered.
   */
  has(actionId: string): boolean {
    return this.actions.has(actionId)
  }

  /**
   * List all registered action ids.
   */
  listActions(): string[] {
    return Array.from(this.actions.keys())
  }

  /**
   * Get id + summary for quick discovery.
   */
  describeActions(): Array<{ id: string; summary: string }> {
    return Array.from(this.actions.values()).map(a => ({ id: a.id, summary: a.summary }))
  }

  /**
   * Invoke a registered action by id with schema validation and consistent envelope.
   */
  async invoke<R>(
    actionId: string,
    payload: unknown,
    ctx: AgentContext
  ): Promise<ActionResponse<R>> {
    const action = this.actions.get(actionId)
    const startedAt = new Date().toISOString()
    const t0 = Date.now()

    if (!action) {
      const finishedAt = new Date().toISOString()
      return {
        notice: `Unknown action "${actionId}"`,
        success: false,
        error: "Action not found",
        startedAt,
        finishedAt,
        durationMs: Date.now() - t0,
      }
    }

    const parsed = action.input.safeParse(payload)
    if (!parsed.success) {
      const finishedAt = new Date().toISOString()
      const flat = parsed.error.flatten()
      const fieldErrs = Object.entries(flat.fieldErrors)
        .flatMap(([k, v]) => v?.map(m => `${k}: ${m}`) ?? [])
        .join("; ")
      const formErrs = flat.formErrors.join("; ")
      const message = [fieldErrs, formErrs].filter(Boolean).join("; ") || "Invalid input payload"
      return {
        notice: `Validation failed for action "${actionId}"`,
        success: false,
        error: message,
        startedAt,
        finishedAt,
        durationMs: Date.now() - t0,
      }
    }

    try {
      const res = await action.execute({ payload: parsed.data, context: ctx })
      const finishedAt = new Date().toISOString()
      return {
        notice: res.notice ?? `Action "${actionId}" completed`,
        data: res.data,
        success: (res as any).success ?? true,
        error: (res as any).error,
        startedAt,
        finishedAt,
        durationMs: Date.now() - t0,
      }
    } catch (err: any) {
      const finishedAt = new Date().toISOString()
      return {
        notice: `Execution error for action "${actionId}"`,
        success: false,
        error: err?.message || "Unknown error",
        startedAt,
        finishedAt,
        durationMs: Date.now() - t0,
      }
    }
  }
}
