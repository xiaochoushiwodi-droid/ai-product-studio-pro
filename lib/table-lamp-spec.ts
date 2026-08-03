export const tableLampParts = ["Glass Shade", "Metal Ring", "LED Module", "Battery", "Marble Base"] as const;

export const tableLampStructure = tableLampParts.join(" / ");

export const tableLampMaterials = "Glass / Metal / LED Module / Battery / Stone";

export const tableLampDimensions = {
  heightCm: 23,
  shadeCm: 17,
  baseCm: 8
} as const;
