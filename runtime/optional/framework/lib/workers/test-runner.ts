import { execSync } from "node:child_process"

export type TestRunResult = {
  ok: boolean
  passed: number
  failed: number
  total: number
  durationMs: number
  output: string
  errorOutput: string
}

/**
 * Atomic worker: run a test file or pattern and return structured results.
 * Defaults to bun test runner used by this repo.
 */
export function runTests(
  testPatternOrFile: string,
  options: { cwd?: string; timeoutMs?: number } = {},
): TestRunResult {
  const cwd = options.cwd ?? process.cwd()
  const timeoutMs = options.timeoutMs ?? 30_000
  const start = Date.now()

  try {
    const output = execSync(`bun ${testPatternOrFile}`, {
      cwd,
      timeout: timeoutMs,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    const durationMs = Date.now() - start
    const { passed, failed, total } = parseTestOutput(output)
    return { ok: failed === 0, passed, failed, total, durationMs, output, errorOutput: "" }
  } catch (err: any) {
    const durationMs = Date.now() - start
    const output: string = err?.stdout ?? ""
    const errorOutput: string = err?.stderr ?? ""
    const { passed, failed, total } = parseTestOutput(output + "\n" + errorOutput)
    return { ok: false, passed, failed, total, durationMs, output, errorOutput }
  }
}

function parseTestOutput(output: string): { passed: number; failed: number; total: number } {
  // Bun test output patterns: "X pass" / "X fail"
  const passMatch = output.match(/(\d+)\s+pass/i)
  const failMatch = output.match(/(\d+)\s+fail/i)
  const passed = passMatch ? parseInt(passMatch[1], 10) : 0
  const failed = failMatch ? parseInt(failMatch[1], 10) : 0
  return { passed, failed, total: passed + failed }
}

/**
 * Check whether the test suite passes for a given pattern without throwing.
 * Returns true if all discovered tests pass.
 */
export function testSuitePasses(testPatternOrFile: string, cwd?: string): boolean {
  return runTests(testPatternOrFile, { cwd }).ok
}
