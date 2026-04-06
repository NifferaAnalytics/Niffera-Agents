import type { TaskFormInput } from "./taskFormSchemas"
import { TaskFormSchema } from "./taskFormSchemas"

/**
 * Result of handling a Typeform webhook submission
 */
export interface HandleSubmissionResult {
  success: boolean
  message: string
  taskId?: string
}

/**
 * Minimal interface for a scheduler implementation used by this handler.
 * Provide an implementation that persists the task and configures a cron job in your runtime.
 */
export interface TaskScheduler {
  schedule(params: {
    id: string
    name: string
    type: string
    cron: string
    payload: Record<string, unknown>
  }): Promise<void>
}

/**
 * Processes a Typeform webhook payload to schedule a new task.
 * - Validates payload using TaskFormSchema
 * - Normalizes values (trim, lower-case type)
 * - Builds a deterministic task ID (no randomization)
 * - Optionally schedules the task via provided scheduler
 */
export async function handleTypeformSubmission(
  raw: unknown,
  scheduler?: TaskScheduler
): Promise<HandleSubmissionResult> {
  const parsed = TaskFormSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      message: buildValidationMessage(parsed.error.issues.map(i => i.message)),
    }
  }

  const data = normalizeInput(parsed.data)
  const taskId = buildDeterministicId({
    name: data.taskName,
    type: data.taskType,
    cron: data.scheduleCron,
    payload: data.parameters,
  })

  // If a scheduler is provided, attempt to persist/schedule the task
  if (scheduler) {
    try {
      await scheduler.schedule({
        id: taskId,
        name: data.taskName,
        type: data.taskType,
        cron: data.scheduleCron,
        payload: data.parameters as Record<string, unknown>,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown scheduling error"
      return {
        success: false,
        message: `Scheduling failed: ${msg}`,
      }
    }
  }

  return {
    success: true,
    message: `Task "${data.taskName}" scheduled`,
    taskId,
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Create a compact readable validation message */
function buildValidationMessage(messages: string[]): string {
  const unique = Array.from(new Set(messages.map(m => m.trim()))).filter(Boolean)
  return `Validation error: ${unique.join("; ")}`
}

/** Normalize/clean incoming payload before use */
function normalizeInput(input: TaskFormInput): TaskFormInput {
  const taskName = input.taskName.trim()
  const taskType = String(input.taskType).trim().toLowerCase()
  const scheduleCron = normalizeCron(input.scheduleCron)
  return {
    ...input,
    taskName,
    taskType,
    scheduleCron,
    parameters: input.parameters ?? {},
  }
}

/** Very light cron normalization: collapse whitespace and trim */
function normalizeCron(cron: string): string {
  const normalized = cron.replace(/\s+/g, " ").trim()
  if (!normalized) throw new Error("Cron expression is empty after normalization")
  return normalized
}

/**
 * Build a deterministic ID using FNV-1a 32-bit over stable JSON + fields
 * This avoids randomization while ensuring stable IDs for identical submissions
 */
function buildDeterministicId(input: {
  name: string
  type: string
  cron: string
  payload: unknown
}): string {
  const base = JSON.stringify({
    n: input.name,
    t: input.type,
    c: input.cron,
    p: stableSerialize(input.payload),
  })
  return `task_${fnv1a32(base)}`
}

/** Stable stringify with sorted object keys */
function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  const entries = keys.map(k => `"${k}":${stableSerialize(obj[k])}`)
  return `{${entries.join(",")}}`
}

/** FNV-1a 32-bit hash, returns lowercase hex */
function fnv1a32(str: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h.toString(16).padStart(8, "0")
}
