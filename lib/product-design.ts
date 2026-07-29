import { tableLampParts } from "@/lib/table-lamp-spec";
import { buildReferenceGenerationPolicy } from "@/lib/image-reference-workflow";
import type { DesignLock, ProductIdentity, ProductMaskRegion, ReferenceGenerationPrompt } from "@/types/product";

export type HighResDesignVariant = {
  id: string;
  title: string;
  imageUrl: string;
  materialPreviewUrl?: string;
  referenceImageUrl?: string;
  productIdentityId?: string;
  designLockApplied?: boolean;
  targetRegion?: string;
  generatedPrompt?: string;
  allowedEdits?: string[];
  lockSummary?: string;
  resolution: string;
  baseMaterial: string;
  notes: string;
};

const protectedTableLampParts = tableLampParts.filter((part) => part !== "大理石底座");

export const tableLampDesignVariants: HighResDesignVariant[] = [
  {
    id: "calacatta-viola",
    title: "方案 01 / Calacatta Viola",
    imageUrl: "/ai-designs/table-lamp-calacatta-viola.png",
    resolution: "2048 x 2048",
    baseMaterial: "Calacatta Viola",
    notes: "紫色脉络白底大理石，适合高端装饰风格。"
  },
  {
    id: "calacatta-gold",
    title: "方案 02 / Calacatta Gold",
    imageUrl: "/ai-designs/table-lamp-calacatta-gold.png",
    resolution: "2048 x 2048",
    baseMaterial: "Calacatta Gold",
    notes: "金色纹理白底大理石，提升暖奢质感。"
  },
  {
    id: "indian-green",
    title: "方案 03 / Indian Green",
    imageUrl: "/ai-designs/table-lamp-indian-green.png",
    resolution: "2048 x 2048",
    baseMaterial: "Indian Green",
    notes: "深绿色石材底座，强调稳重和自然纹理。"
  },
  {
    id: "nero-marquina",
    title: "方案 04 / Nero Marquina",
    imageUrl: "/ai-designs/table-lamp-nero-marquina.png",
    resolution: "2048 x 2048",
    baseMaterial: "Nero Marquina",
    notes: "黑底白纹大理石，适合强对比高级科技风。"
  },
  {
    id: "travertine",
    title: "方案 05 / Travertine",
    imageUrl: "/ai-designs/table-lamp-travertine.png",
    resolution: "2048 x 2048",
    baseMaterial: "Travertine",
    notes: "米色洞石纹理，适合温暖自然家居场景。"
  },
  {
    id: "white-onyx",
    title: "方案 06 / White Onyx",
    imageUrl: "/ai-designs/table-lamp-white-onyx.png",
    resolution: "2048 x 2048",
    baseMaterial: "White Onyx",
    notes: "半透白色缟玛瑙质感，强调柔和灯光氛围。"
  }
];

export function buildProductDesignResponse(
  prompt: string,
  context: {
    productIdentity: ProductIdentity;
    designLock: DesignLock;
    targetRegion?: ProductMaskRegion | null;
    referencePrompt: ReferenceGenerationPrompt;
  }
) {
  const policy = buildReferenceGenerationPolicy(context.productIdentity, context.designLock);

  return {
    prompt,
    imageReferenceMode: "enabled",
    referenceImageUrl: context.productIdentity.imageReference.imageUrl,
    productIdentity: context.productIdentity,
    designLock: context.designLock,
    targetRegion: context.targetRegion,
    referencePrompt: context.referencePrompt,
    generationPolicy: policy,
    constraints: [
      "Image Reference 模式：必须使用上传图片作为唯一产品参考",
      "Design Lock：锁定产品轮廓、尺寸比例、零件位置、摄影角度",
      "保持产品比例",
      "保持结构",
      "只修改材质",
      "输出高清产品图",
      "禁止重新创造产品"
    ],
    changedPart: "大理石底座",
    protectedParts: protectedTableLampParts,
    targetMaterial: "石材材质组",
    variants: tableLampDesignVariants.map((variant) => ({
      ...variant,
      imageUrl: context.productIdentity.imageReference.imageUrl,
      materialPreviewUrl: variant.imageUrl,
      referenceImageUrl: context.productIdentity.imageReference.imageUrl,
      productIdentityId: context.productIdentity.id,
      designLockApplied: true,
      targetRegion: context.targetRegion?.label ?? "Base",
      generatedPrompt: context.referencePrompt.systemPrompt,
      allowedEdits: ["材质", "颜色", "表面工艺"],
      lockSummary: "轮廓、比例、零件位置和摄影角度沿用上传图片；仅替换底座石材表现。"
    }))
  };
}
