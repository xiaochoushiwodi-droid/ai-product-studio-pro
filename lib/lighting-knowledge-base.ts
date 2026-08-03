import type { LightingKnowledgeRule, ProductIdentity, ProductMaskRegion } from "@/types/product";

export const lightingKnowledgeBase: LightingKnowledgeRule[] = [
  {
    id: "shade-proportion",
    title: "Shade Proportion Rule",
    category: "shade",
    rule: "Shade width should remain visually larger than the base and must not compress the lamp silhouette.",
    designUse: "When editing shade material or color, preserve original shade outline, diameter, height ratio, and rim thickness."
  },
  {
    id: "light-source-position",
    title: "Light Source Position Rule",
    category: "light-source",
    rule: "Light source must remain centered under the shade and aligned with the metal frame and base axis.",
    designUse: "Changing glow color cannot move the LED module or alter visible component alignment."
  },
  {
    id: "glass-transmission",
    title: "Glass Transmission Rule",
    category: "transmission",
    rule: "Transparent or tinted glass should preserve readable edge highlights and believable light transmission.",
    designUse: "Glass shade color can change, but thickness, translucent edges, and realistic reflections must remain."
  },
  {
    id: "color-temperature",
    title: "Color Temperature Rule",
    category: "color-temperature",
    rule: "Warm bedroom or living-room lamp scenes should stay within soft warm light unless the user edits light color.",
    designUse: "Scene changes may alter background and ambience, but must not drift the product light-source position or structure."
  },
  {
    id: "metal-finish",
    title: "Metal Finish Rule",
    category: "metal-finish",
    rule: "Metal frame finish can change roughness, brushed direction, or color, but ring position and thickness must stay stable.",
    designUse: "Metal process edits affect only surface appearance, not frame geometry."
  },
  {
    id: "marble-base",
    title: "Marble Material Rule",
    category: "marble",
    rule: "Marble base can change stone family, veining, polish, and color, but footprint and height must stay locked.",
    designUse: "Base can switch to Calacatta, Indian Green, Nero Marquina, Travertine, or Onyx, without changing base dimensions or position."
  }
];

export function getLightingRulesForRegion(identity: ProductIdentity, region?: ProductMaskRegion | null) {
  if (!/lamp/i.test(identity.productType)) {
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

  if (region.id === "led" || region.id === "light-source") {
    return lightingKnowledgeBase.filter((rule) => ["light-source", "color-temperature"].includes(rule.category));
  }

  return lightingKnowledgeBase;
}
