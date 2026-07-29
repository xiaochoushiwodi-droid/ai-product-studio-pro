import type { LightingKnowledgeRule, ProductIdentity, ProductMaskRegion } from "@/types/product";

export const lightingKnowledgeBase: LightingKnowledgeRule[] = [
  {
    id: "shade-proportion",
    title: "灯罩比例规则",
    category: "shade",
    rule: "Shade width should remain visually larger than the base and must not compress the lamp silhouette.",
    designUse: "修改灯罩材质或颜色时保持原始灯罩外轮廓、直径和高度比例。"
  },
  {
    id: "light-source-position",
    title: "光源位置规则",
    category: "light-source",
    rule: "Light source must remain centered under the shade and aligned with the metal frame and base axis.",
    designUse: "调整发光颜色或光晕时不能移动 LED 光源位置。"
  },
  {
    id: "glass-transmission",
    title: "透光规则",
    category: "transmission",
    rule: "Transparent or tinted glass should preserve readable edge highlights and believable light transmission.",
    designUse: "玻璃灯罩可以调色，但必须保留玻璃厚度、透明边缘和真实反射。"
  },
  {
    id: "color-temperature",
    title: "色温规则",
    category: "color-temperature",
    rule: "Warm bedroom or living-room lamp scenes should stay within soft warm light unless user explicitly edits light color.",
    designUse: "场景图允许改变背景和氛围，但不能让产品光源位置或结构漂移。"
  },
  {
    id: "metal-finish",
    title: "金属工艺规则",
    category: "metal-finish",
    rule: "Metal frame finish can change roughness, brushed direction, or color, but the ring position and thickness must remain stable.",
    designUse: "金属处理只影响表面视觉，不改变金属环结构。"
  },
  {
    id: "marble-base",
    title: "大理石材质规则",
    category: "marble",
    rule: "Marble base can change stone family, veining, polish, and color, but base footprint and height must stay locked.",
    designUse: "底座可替换 Calacatta、Indian Green、Nero Marquina 等石材，但不能改变底座尺寸和位置。"
  }
];

export function getLightingRulesForRegion(identity: ProductIdentity, region?: ProductMaskRegion | null) {
  if (identity.productType !== "Table Lamp" && identity.productType !== "台灯") {
    return [];
  }

  if (!region) {
    return lightingKnowledgeBase;
  }

  if (region.id === "shade") {
    return lightingKnowledgeBase.filter((rule) => ["shade", "transmission", "color-temperature"].includes(rule.category));
  }

  if (region.id === "metal") {
    return lightingKnowledgeBase.filter((rule) => rule.category === "metal-finish");
  }

  if (region.id === "base") {
    return lightingKnowledgeBase.filter((rule) => rule.category === "marble");
  }

  if (region.id === "light-source") {
    return lightingKnowledgeBase.filter((rule) => ["light-source", "color-temperature"].includes(rule.category));
  }

  return lightingKnowledgeBase;
}
