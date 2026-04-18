import { createToolkitEnvironment } from "../../../../lib/toolkit-environment"
import { listToolkitRecipes } from "../../../../lib/tooling/recipe-catalog"
import type { ContractMode } from "../../../../lib/tooling/contracts"
import type { RuntimeRecipeId } from "../contracts/handoff"

export type RuntimeRecipeMetadata = {
  id: RuntimeRecipeId
  contractMode: ContractMode
  artifactRoot: string
  requiredContracts: string[]
}

export function getRuntimeRecipeMetadata(recipeId: RuntimeRecipeId): RuntimeRecipeMetadata {
  const env = createToolkitEnvironment(process.cwd())
  const recipe = listToolkitRecipes(env).find((entry) => entry.id === recipeId)

  return {
    id: recipeId,
    contractMode: recipe?.contractMode ?? "advisory",
    artifactRoot: recipe?.artifactRoot ?? ".agent-artifacts/",
    requiredContracts: recipe?.requiredContracts ?? [],
  }
}
