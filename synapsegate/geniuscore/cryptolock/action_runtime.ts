import { z } from "zod"

/**
 * Base types for any flow action.
 */
export type ActionSchema = z.ZodObject<z.ZodRawShape>

export interface ActionResponse<T> {
  notice: string
  data?: T
  success: boolean
  error?: string
  startedAt: string
  finishedAt: string
  durationMs: number
  metadata?: Record<string, unknown>
}

export interface BaseAction<S extends ActionSchema, R, Ctx = unknown> {
  id: string
  summary: string
  input: S
  execute(args: { payload: z.infer<S>; context: Ctx }): Promise<ActionResponse<R>>
}

/**
 * Validate an arbitrary payload against a schema.
 */
export function validatePayload<S extends ActionSchema>(
  schema: S,
  payload: unknown
): { ok: true; value: z.infer<S> } | { ok: false; error: string } {
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    const fieldErrs = Object.entries(flat.fieldErrors)
      .flatMap(([k, v]) => v?.map(msg => `${k}: ${msg}`) ?? [])
      .join("; ")
    const formErrs = flat.formErrors.join("; ")
    const combined = [fieldErrs, formErrs].filter(Boolean).join("; ")
    return { ok: false, error: combined || "Invalid input" }
  }
  return { ok: true, value: parsed.data }
}

/**
 * Run an action with validation, timing, and consistent response envelope.
 */
export async function runAction<S extends ActionSchema, R, Ctx>(
  action: BaseAction<S, R, Ctx>,
  payload: unknown,
  context: Ctx,
  metadata?: Record<string, unknown>
): Promise<ActionResponse<R>> {
  const startedAt = new Date().toISOString()
  const t0 = Date.now()

  const check = validatePayload(action.input, payload)
  if (!check.ok) {
    const finishedAt = new Date().toISOString()
    return {
      notice: `Validation failed for action "${action.id}"`,
      success: false,
      error: check.error,
      startedAt,
      finishedAt,
      durationMs: Date.now() - t0,
      metadata,
    }
  }

  try {
    const res = await action.execute({ payload: check.value, context })
    const finishedAt = new Date().toISOString()
    return {
      notice: res.notice ?? `Action "${action.id}" completed`,
      data: res.data,
      success: res.success ?? true,
      error: res.error,
      startedAt,
      finishedAt,
      durationMs: Date.now() - t0,
      metadata: { ...(res.metadata as object), ...metadata },
    }
  } catch (err: any) {
    const finishedAt = new Date().toISOString()
    return {
      notice: `Execution error for action "${action.id}"`,
      success: false,
      error: err?.message || "Unknown error",
      startedAt,
      finishedAt,
      durationMs: Date.now() - t0,
      metadata,
    }
  }
}

/**
 * Convenience factory to define an action with proper typing.
 */
export function createAction<S extends ActionSchema, R, Ctx = unknown>(def: {
  id: string
  summary: string
  input: S
  handler: BaseAction<S, R, Ctx>["execute"]
}): BaseAction<S, R, Ctx> {
  return {
    id: def.id,
    summary: def.summary,
    input: def.input,
    execute: def.handler,
  }
}
