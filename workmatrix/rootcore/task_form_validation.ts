import { z } from "zod"

/** Allowed task types */
export const TASK_TYPES = ["anomalyScan", "tokenAnalytics", "whaleMonitor"] as const
export type TaskType = (typeof TASK_TYPES)[number]

/** Helpers */
const trim = (s: unknown) => (typeof s === "string" ? s.trim() : s)

/** Cron validation supporting: wildcards (*), steps (*/n), ranges (a-b), lists (a,b,c) */
function isValidCron5(expr: string): boolean {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return false
  const ranges: Array<{ min: number; max: number }> = [
    { min: 0, max: 59 }, // minute
    { min: 0, max: 23 }, // hour
    { min: 1, max: 31 }, // day of month
    { min: 1, max: 12 }, // month
    { min: 0, max: 6 },  // day of week
  ]

  const validatePart = (part: string, idx: number): boolean => {
    const { min, max } = ranges[idx]
    const token = part.trim()

    if (token === "*") return true

    // step: */n or a-b/n or list/n
    const [base, stepStr] = token.split("/")
    if (stepStr !== undefined) {
      const step = Number(stepStr)
      if (!Number.isInteger(step) || step <= 0) return false
      return validatePart(base, idx)
    }

    // list: a,b,c
    if (base.includes(",")) {
      return base.split(",").every(item => validatePart(item, idx))
    }

    // range: a-b
    if (base.includes("-")) {
      const [a, b] = base.split("-").map(Number)
      if (![a, b].every(n => Number.isInteger(n))) return false
      if (a > b) return false
      return a >= min && b <= max
    }

    // single number
    const n = Number(base)
    if (!Number.isInteger(n)) return false
    return n >= min && n <= max
  }

  return parts.every((p, i) => validatePart(p, i))
}

/**
 * Schema for scheduling a new task via Typeform submission.
 * - trims strings
 * - validates allowed task types
 * - enforces non-empty parameters (keys & values)
 * - validates 5-part cron with wildcards, ranges, lists, and steps
 */
export const TaskFormSchema = z.object({
  taskName: z.preprocess(trim, z.string().min(3).max(100)),
  taskType: z.preprocess(
    v => (typeof v === "string" ? v.trim() : v),
    z.string().refine(v => (TASK_TYPES as readonly string[]).includes(v), {
      message: `taskType must be one of: ${TASK_TYPES.join(", ")}`,
    })
  ),
  parameters: z
    .record(
      z.preprocess(trim, z.string().min(1, "Parameter keys must be non-empty")),
      z.preprocess(trim, z.string().min(1, "Parameter values must be non-empty"))
    )
    .refine(obj => Object.keys(obj).length > 0, "Parameters must include at least one key"),
  scheduleCron: z
    .preprocess(trim, z.string())
    .refine(isValidCron5, "Invalid cron expression (expected 5 fields with *, steps, ranges, or lists)"),
}).strict()

export type TaskFormInput = z.infer<typeof TaskFormSchema>

/** Optional: sanitized parsing helper returning typed data or throwing ZodError */
export function parseTaskForm(input: unknown): TaskFormInput {
  const parsed = TaskFormSchema.parse(input)
  return parsed
}
