import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

import { type ContractCatalogEntry } from "./contracts"

type JsonSchema = {
  title?: string
  type?: string | string[]
  enum?: Array<string | number | boolean | null>
  const?: string | number | boolean | null
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  additionalProperties?: boolean
}

interface GeneratedModel {
  name: string
  body: string[]
}

export interface PydanticEmitOptions {
  workspaceRoot: string
  contract: ContractCatalogEntry
  outPath?: string
  force?: boolean
}

export interface PydanticEmitResult {
  outputPath: string
}

function toPascalCase(value: string): string {
  return value
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
}

function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .toLowerCase()
    .replace(/^_+|_+$/g, "")
}

function normalizeType(node: JsonSchema): string[] {
  if (Array.isArray(node.type)) return node.type
  if (typeof node.type === "string") return [node.type]
  if (node.enum || Object.prototype.hasOwnProperty.call(node, "const")) return ["string"]
  return ["object"]
}

function pythonLiteral(value: string | number | boolean | null): string {
  if (value === null) return "None"
  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "boolean") return value ? "True" : "False"
  return String(value)
}

function buildDefaultOutputPath(workspaceRoot: string, contractId: string): string {
  return resolve(workspaceRoot, ".agent-artifacts", "python-pydantic", `${contractId}.py`)
}

function emitType(
  node: JsonSchema,
  classNameHint: string,
  models: GeneratedModel[],
  seen: Set<string>,
  imports: Set<string>,
): string {
  if (node.enum) {
    imports.add("Literal")
    return `Literal[${node.enum.map((value) => pythonLiteral(value)).join(", ")}]`
  }

  if (Object.prototype.hasOwnProperty.call(node, "const")) {
    imports.add("Literal")
    return `Literal[${pythonLiteral(node.const ?? null)}]`
  }

  const types = normalizeType(node)
  const nullable = types.includes("null")
  const nonNullTypes = types.filter((entry) => entry !== "null")
  const primary = nonNullTypes[0] ?? "object"

  let result: string
  switch (primary) {
    case "string":
      result = "str"
      break
    case "integer":
      result = "int"
      break
    case "number":
      result = "float"
      break
    case "boolean":
      result = "bool"
      break
    case "array": {
      const itemType = node.items
        ? emitType(node.items, `${classNameHint}Item`, models, seen, imports)
        : "Any"
      if (!node.items) imports.add("Any")
      result = `list[${itemType}]`
      break
    }
    case "object": {
      if (!node.properties || Object.keys(node.properties).length === 0) {
        imports.add("Any")
        result = "dict[str, Any]"
        break
      }

      const nestedName = toPascalCase(classNameHint)
      if (!seen.has(nestedName)) {
        seen.add(nestedName)

        const required = new Set(node.required ?? [])
        const body: string[] = []
        if (node.additionalProperties === false) {
          body.push('model_config = ConfigDict(extra="forbid")')
          body.push("")
        }

        for (const [propName, propSchema] of Object.entries(node.properties)) {
          const propType = emitType(
            propSchema,
            `${nestedName}${toPascalCase(propName)}`,
            models,
            seen,
            imports,
          )
          const fieldName = propName
          if (required.has(propName)) {
            body.push(`${fieldName}: ${propType}`)
          } else {
            body.push(`${fieldName}: ${propType} | None = None`)
          }
        }

        if (body.length === 0) body.push("pass")
        models.push({ name: nestedName, body })
      }

      result = nestedName
      break
    }
    default:
      imports.add("Any")
      result = "Any"
  }

  return nullable ? `${result} | None` : result
}

function renderModelFile(contract: ContractCatalogEntry): string {
  const schema = JSON.parse(readFileSync(contract.schemaPath, "utf8")) as JsonSchema
  const imports = new Set<string>()
  const models: GeneratedModel[] = []
  const seen = new Set<string>()
  const rootName = toPascalCase(schema.title ?? contract.id)

  emitType(
    {
      ...schema,
      title: rootName,
    },
    rootName,
    models,
    seen,
    imports,
  )

  const importNames = ["BaseModel", "ConfigDict"]
  const typingImports = [...imports].sort()

  const lines: string[] = [
    "from __future__ import annotations",
    "",
    `from pydantic import ${importNames.join(", ")}`,
  ]

  if (typingImports.length > 0) {
    lines.push(`from typing import ${typingImports.join(", ")}`)
  }

  lines.push("")
  lines.push("")
  lines.push(`"""Optional Pydantic projection for toolkit contract \`${contract.id}\`.`)
  lines.push("")
  lines.push(`Canonical ownership remains in:`)
  lines.push(`- ${contract.contractPath}`)
  lines.push(`- ${contract.schemaPath}`)
  lines.push(`- ${contract.templatePath}`)
  lines.push('"""')
  lines.push("")

  for (const model of models) {
    lines.push(`class ${model.name}(BaseModel):`)
    if (model.body.length === 0) {
      lines.push("    pass")
    } else {
      for (const bodyLine of model.body) {
        lines.push(bodyLine ? `    ${bodyLine}` : "")
      }
    }
    lines.push("")
  }

  return `${lines.join("\n").trimEnd()}\n`
}

export function emitToolkitContractPydantic(options: PydanticEmitOptions): PydanticEmitResult {
  const outputPath = options.outPath
    ? resolve(options.workspaceRoot, options.outPath)
    : buildDefaultOutputPath(options.workspaceRoot, options.contract.id)

  if (existsSync(outputPath) && !options.force) {
    throw new Error(`Refusing to overwrite existing file without --force: ${outputPath}`)
  }

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, renderModelFile(options.contract), "utf8")

  return { outputPath }
}
