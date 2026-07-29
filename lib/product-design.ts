import { tableLampParts } from "@/lib/table-lamp-spec";

export type HighResDesignVariant = {
  id: string;
  title: string;
  imageUrl: string;
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

export function buildProductDesignResponse(prompt: string) {
  return {
    prompt,
    constraints: [
      "保持产品比例",
      "保持结构",
      "只修改材质",
      "输出高清产品图"
    ],
    changedPart: "大理石底座",
    protectedParts: protectedTableLampParts,
    targetMaterial: "石材材质组",
    variants: tableLampDesignVariants
  };
}
