import { exec } from "child_process"

/**
 * Execute a shell command and return stdout or throw on error.
 * @param command Shell command to run (e.g., "ls -la")
 * @param timeoutMs Optional timeout in milliseconds (default 30s)
 */
export function execCommand(command: string, timeoutMs: number = 30_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = exec(command, { timeout: timeoutMs }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`Command failed: ${stderr || error.message}`))
      }
      resolve(stdout.trim())
    })

    proc.on("error", err => {
      reject(new Error(`Process error: ${err.message}`))
    })

    proc.on("exit", code => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`))
      }
    })
  })
}

/**
 * Execute a shell command and capture both stdout and stderr.
 */
export async function execCommandWithOutput(
  command: string,
  timeoutMs: number = 30_000
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, { timeout: timeoutMs }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`Command failed: ${stderr || error.message}`))
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() })
    })
  })
}
