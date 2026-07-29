import { getLightingRulesForRegion } from "@/lib/lighting-knowledge-base";
import {
  buildReferenceGenerationPolicy,
  hasStrictDesignLock,
  hasValidProductIdentity
} from "@/lib/image-reference-workflow";
import type {
  DesignLock,
  ProductIdentity,
  ProductMaskRegion,
  ProductMaskRegionId,
  ReferenceGenerationPrompt
} from "@/types/product";

const forbiddenPromptPatterns = [
  /redesign/i,
  /new\s+product/i,
  /different\s+product/i,
  /change\s+(the\s+)?(shape|silhouette|proportion|dimension|dimensions|structure|component\s+position|camera\s+angle)/i,
  /(add|remove|move)\s+(a\s+)?(part|component|shade|base|frame|light\s+source)/i,
  /replace\s+(the\s+)?(whole\s+)?(product|part|component)/i,
  /改变(形状|轮廓|比例|尺寸|结构|零件位置|摄影角度|相机角度)/,
  /重新(设计|创造)/,
  /(增加|删除|移动)(零件|部件|灯罩|底座|金属|光源)/,
  /换成(另一个|新的)产品/
];

const regionKeywords: Record<ProductMaskRegionId, string[]> = {
  shade: ["shade", "lampshade", "灯罩", "玻璃灯罩"],
  metal: ["metal", "frame", "ring", "金属", "金属环", "金属结构"],
  base: ["base", "marble", "stone", "底座", "大理石", "石材"],
  logo: ["logo", "brand mark", "标志", "品牌", "logo"],
  "light-source": ["light", "led", "source", "光源", "LED", "发光"],
  scene: ["scene", "background", "environment", "bedroom", "living room", "场景", "背景", "卧室", "客厅"]
};

const editActionPattern = /(change|modify|edit|replace|make|turn|apply|调整|修改|替换|改成|应用|变成)/i;

export function getMaskRegion(identity: ProductIdentity, regionId?: ProductMaskRegionId | null) {
  if (!regionId) return null;
  return identity.maskRegions.find((region) => region.id === regionId) ?? null;
}

export function validateReferenceGenerationRequest(input: {
  action: string;
  prompt: string;
  productIdentity?: ProductIdentity | null;
  designLock?: DesignLock | null;
  targetRegionId?: ProductMaskRegionId | null;
}) {
  if (!hasValidProductIdentity(input.productIdentity)) {
    return {
      ok: false as const,
      status: 400,
      error: {
        error: "IMAGE_REFERENCE_REQUIRED",
        message: `${input.action} 必须使用上传产品图片作为 reference，并先完成 Product Identity JSON。`
      }
    };
  }

  if (!hasStrictDesignLock(input.designLock)) {
    return {
      ok: false as const,
      status: 409,
      error: createDesignLockViolationError("Design Lock 未开启或锁定项不完整。")
    };
  }

  const forbidden = forbiddenPromptPatterns.find((pattern) => pattern.test(input.prompt));
  if (forbidden) {
    return {
      ok: false as const,
      status: 409,
      error: createDesignLockViolationError("Prompt 试图改变产品轮廓、尺寸、结构、零件位置或摄影角度。")
    };
  }

  const targetRegion = getMaskRegion(input.productIdentity, input.targetRegionId);
  if (input.targetRegionId && !targetRegion) {
    return {
      ok: false as const,
      status: 409,
      error: createDesignLockViolationError("选择的编辑区域不存在于 Product Identity Mask。")
    };
  }

  if (targetRegion && regionPromptTouchesLockedNeighbor(input.prompt, targetRegion)) {
    return {
      ok: false as const,
      status: 409,
      error: createDesignLockViolationError(`当前只允许修改 ${targetRegion.label}，Prompt 触及了锁定的相邻区域。`)
    };
  }

  return {
    ok: true as const,
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
    new RegExp(`(preserve|keep|保持)[^。,.，;；]*${escapedKeyword}`, "i").test(prompt) ||
    new RegExp(`${escapedKeyword}[^。,.，;；]*(unchanged|不变|保持)`, "i").test(prompt)
  );
}
