import { statSync, readdirSync } from "node:fs"
import { join, extname, basename } from "node:path"

export type FileMetadata = {
  path: string
  exists: boolean
  sizeBytes: number
  modifiedAt: string | null
  extension: string
  isDirectory: boolean
}

/**
 * Atomic worker: read file metadata without loading file content.
 * Used by Mapper to assess scope before reading full content.
 */
export function readFileMetadata(filePath: string): FileMetadata {
  try {
    const stat = statSync(filePath)
    return {
      path: filePath,
      exists: true,
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      extension: extname(filePath),
      isDirectory: stat.isDirectory(),
    }
  } catch {
    return {
      path: filePath,
      exists: false,
      sizeBytes: 0,
      modifiedAt: null,
      extension: extname(filePath),
      isDirectory: false,
    }
  }
}

export type DirectoryListing = {
  path: string
  files: string[]
  directories: string[]
  totalEntries: number
}

/**
 * List directory contents one level deep without recursing.
 * Returns separate file and directory lists.
 */
export function listDirectory(dirPath: string): DirectoryListing {
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true })
    const files: string[] = []
    const directories: string[] = []
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      if (entry.isDirectory()) {
        directories.push(fullPath)
      } else {
        files.push(fullPath)
      }
    }
    return { path: dirPath, files, directories, totalEntries: entries.length }
  } catch {
    return { path: dirPath, files: [], directories: [], totalEntries: 0 }
  }
}

/**
 * Check if a file is large enough to warrant chunked reading.
 * Returns true if the file exceeds the given threshold in bytes.
 */
export function isLargeFile(filePath: string, thresholdBytes: number = 100_000): boolean {
  const meta = readFileMetadata(filePath)
  return meta.exists && !meta.isDirectory && meta.sizeBytes > thresholdBytes
}
