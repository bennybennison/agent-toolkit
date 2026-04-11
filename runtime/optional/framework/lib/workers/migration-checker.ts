import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

export type MigrationStatus = {
  hasMigrationDir: boolean
  migrationDir: string | null
  pendingFiles: string[]
  totalMigrations: number
  needsMigration: boolean
}

/**
 * Atomic worker: scan for migration files that may be needed by a change.
 * Checks common migration directories without executing DB commands.
 * Used by Auditor to flag schema changes that require accompanying migrations.
 */
export function checkMigrations(rootDir: string = process.cwd()): MigrationStatus {
  const candidates = ["migrations", "db/migrations", "database/migrations", "src/migrations", "prisma/migrations"]

  for (const candidate of candidates) {
    const fullPath = join(rootDir, candidate)
    if (existsSync(fullPath)) {
      const files = scanMigrationFiles(fullPath)
      return {
        hasMigrationDir: true,
        migrationDir: fullPath,
        pendingFiles: files.pending,
        totalMigrations: files.total,
        needsMigration: files.pending.length > 0,
      }
    }
  }

  return {
    hasMigrationDir: false,
    migrationDir: null,
    pendingFiles: [],
    totalMigrations: 0,
    needsMigration: false,
  }
}

function scanMigrationFiles(migrationDir: string): { total: number; pending: string[] } {
  try {
    const entries = readdirSync(migrationDir)
    const total = entries.filter((e: string) => isMigrationFile(e)).length
    const pending = entries.filter((e: string) => isPendingMigration(e)).map((e: string) => join(migrationDir, e))
    return { total, pending }
  } catch {
    return { total: 0, pending: [] }
  }
}

function isMigrationFile(name: string): boolean {
  return /\.(sql|ts|js|rb|py)$/.test(name) && name !== "README.md"
}

function isPendingMigration(name: string): boolean {
  // Common patterns: files with "pending", files in down/ dirs, or files not in a "baseline" dir
  return name.toLowerCase().includes("pending") || name.toLowerCase().includes("draft")
}

/**
 * Check whether any of the changed files are schema-adjacent (suggesting a migration may be needed).
 */
export function changesRequireMigration(changedFiles: string[]): boolean {
  const schemaPatterns = [/schema\.(prisma|sql|ts|rb)$/, /model[s]?\.(ts|js|py|rb)$/, /entity\.(ts|js)$/i, /migration/i]
  return changedFiles.some((f) => schemaPatterns.some((p) => p.test(f)))
}
