export const tableLampParts = ["玻璃灯罩", "金属环", "LED光源", "电池", "大理石底座"] as const;

export const tableLampStructure = tableLampParts.join(" / ");

export const tableLampMaterials = "玻璃 / 金属 / LED模组 / 电池 / 石材";

export const tableLampDimensions = {
  heightCm: 23,
  shadeCm: 17,
  baseCm: 8
} as const;
