import { getLightingRulesForRegion } from "@/lib/lighting-knowledge-base";
import {
  buildReferenceGenerationPolicy,
  createMissingReferenceError,
  hasStrictDesignLock,
  hasValidImageReference,
  hasValidProductIdentity
} from "@/lib/image-reference-workflow";
import type {
  DesignLock,
  ImageReference,
  ProductIdentity,
  ProductMaskRegion,
  ProductMaskRegionId,
  ReferenceGenerationPrompt
} from "@/types/product";

const forbiddenPromptPatterns = [
  /redesign/i,
  /new\s+product/i,
  /different\s+product/i,
  /random\s+product/i,
  /change\s+(the\s+)?(shape|silhouette|proportion|dimension|dimensions|structure|component\s+position|camera\s+angle)/i,
  /(add|remove|move)\s+(a\s+)?(part|component|shade|base|frame|ring|light\s+source|led|battery)/i,
  /replace\s+(the\s+)?(whole\s+)?(product|part|component)/i
];

const regionKeywords: Record<ProductMaskRegionId, string[]> = {
  shade: ["shade", "lampshade", "glass shade"],
  metal: ["metal", "frame", "ring", "metal ring", "metal frame"],
  base: ["base", "marble", "stone", "marble base"],
  led: ["led", "light", "light source", "led module", "glow"],
  battery: ["battery", "power cell", "rechargeable", "power module"],
  logo: ["logo", "brand mark", "brand"],
  "light-source": ["light", "led", "source", "light source", "led module", "battery"],
  scene: ["scene", "background", "environment", "bedroom", "living room", "office", "hotel"]
};

const editActionPattern = /(change|modify|edit|replace|make|turn|apply|update|convert)/i;

export function getMaskRegion(identity: ProductIdentity, regionId?: ProductMaskRegionId | null) {
  if (!regionId) return null;
  return identity.maskRegions.find((region) => region.id === regionId) ?? null;
}

export function validateReferenceGenerationRequest(input: {
  action: string;
  prompt: string;
  originalReference?: ImageReference | null;
  productIdentity?: ProductIdentity | null;
  designLock?: DesignLock | null;
  targetRegionId?: ProductMaskRegionId | null;
}) {
  const originalReference = input.originalReference ?? input.productIdentity?.imageReference ?? null;

  if (!hasValidImageReference(originalReference) || !hasValidProductIdentity(input.productIdentity)) {
    return {
      ok: false as const,
      status: 400,
      error: createMissingReferenceError(input.action)
    };
  }

  if (!hasStrictDesignLock(input.designLock)) {
    return {
      ok: false as const,
      status: 409,
      error: createDesignLockViolationError("Design Lock is missing or incomplete.")
    };
  }

  const forbidden = forbiddenPromptPatterns.find((pattern) => pattern.test(input.prompt));
  if (forbidden) {
    return {
      ok: false as const,
      status: 409,
      error: createDesignLockViolationError("Prompt attempts to change a locked shape, dimension, structure, component position, or camera angle.")
    };
  }

  const targetRegion = getMaskRegion(input.productIdentity, input.targetRegionId);
  if (input.targetRegionId && !targetRegion) {
    return {
      ok: false as const,
      status: 409,
      error: createDesignLockViolationError("Selected edit region does not exist in the Product Identity mask.")
    };
  }

  if (targetRegion && regionPromptTouchesLockedNeighbor(input.prompt, targetRegion)) {
    return {
      ok: false as const,
      status: 409,
      error: createDesignLockViolationError(`Current edit is limited to ${targetRegion.label}. The prompt touches a locked neighboring region.`)
    };
  }

  return {
    ok: true as const,
    originalReference,
    productIdentity: input.productIdentity,
    designLock: input.designLock,
    targetRegion,
    referencePrompt: buildReferencePrompt({
      prompt: input.prompt,
      productIdentity: input.productIdentity,
      designLock: input.designLock,
      targetRegion
    })
  };
}

export function buildReferencePrompt(input: {
  prompt: string;
  productIdentity: ProductIdentity;
  designLock: DesignLock;
  targetRegion?: ProductMaskRegion | null;
}): ReferenceGenerationPrompt {
  const lightingRules = getLightingRulesForRegion(input.productIdentity, input.targetRegion);
  const policy = buildReferenceGenerationPolicy(input.productIdentity, input.designLock);

  return {
    systemPrompt: [
      "Use uploaded product image as exact reference.",
      "",
      "Preserve original:",
      "- shape",
      "- dimensions",
      "- structure",
      "- components",
      "- camera angle",
      "",
      "Only modify:",
      "- material",
      "- color",
      "- finish",
      "- environment",
      "",
      "Never redesign the product."
    ].join("\n"),
    userPrompt: [
      input.prompt,
      input.targetRegion ? `Target mask region: ${input.targetRegion.label}. ${input.targetRegion.promptHint}` : "Target mask region: use only allowed editable areas from Product Identity.",
      `Original reference: ${input.productIdentity.imageReference.fileName}`,
      `Product Identity JSON: ${JSON.stringify(input.productIdentity.rawVisionJson)}`,
      `Design Lock: ${JSON.stringify(policy.design_lock)}`,
      `Reference policy: ${policy.instruction}`,
      lightingRules.length > 0
        ? `Lighting rules: ${lightingRules.map((rule) => `${rule.title}: ${rule.rule}`).join(" | ")}`
        : ""
    ].filter(Boolean).join("\n"),
    targetRegion: input.targetRegion ?? undefined,
    lockSummary: [
      "Product silhouette locked",
      "Product proportion locked",
      "Component position locked",
      "Camera angle locked",
      "Overall dimensions locked"
    ],
    lightingRules
  };
}

export function createDesignLockViolationError(reason: string) {
  return {
    error: "DESIGN_LOCK_VIOLATION",
    message: reason,
    locked: [
      "Product silhouette",
      "Product proportion",
      "Component position",
      "Camera angle",
      "Overall dimensions"
    ],
    allowedEdits: ["Material", "Color", "Surface finish", "Scene background"]
  };
}

function regionPromptTouchesLockedNeighbor(prompt: string, targetRegion: ProductMaskRegion) {
  if (!editActionPattern.test(prompt)) return false;

  const normalizedPrompt = prompt.toLowerCase();

  return targetRegion.lockedNeighbors.some((neighbor) => {
    const neighborRegionId = Object.keys(regionKeywords).find((key) => {
      const regionId = key as ProductMaskRegionId;
      return neighbor.toLowerCase().includes(regionId.replace("-", " ")) || regionKeywords[regionId].some((keyword) => neighbor.toLowerCase().includes(keyword.toLowerCase()));
    }) as ProductMaskRegionId | undefined;

    const keywords = neighborRegionId ? regionKeywords[neighborRegionId] : [neighbor];
    return keywords.some((keyword) => {
      const normalizedKeyword = keyword.toLowerCase();
      return normalizedPrompt.includes(normalizedKeyword) && !isPreserveMention(normalizedPrompt, normalizedKeyword);
    });
  });
}

function isPreserveMention(prompt: string, keyword: string) {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    new RegExp(`(preserve|keep)[^.]*${escapedKeyword}`, "i").test(prompt) ||
    new RegExp(`${escapedKeyword}[^.]*(unchanged|preserved|locked)`, "i").test(prompt)
  );
}
