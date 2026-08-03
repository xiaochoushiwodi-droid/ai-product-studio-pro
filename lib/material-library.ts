import type { MaterialRecommendation } from "@/types/product";

export type MaterialLibraryItem = {
  id: string;
  name: string;
  category: "Stone" | "Glass";
  targetPart: "Marble Base" | "Glass Shade";
  imageUrl: string;
  productRenderUrl: string;
  resolution: string;
  texture: string;
  color: {
    name: string;
    hex: string;
  };
  gloss: {
    label: string;
    roughness: number;
    specular: number;
    metallic: number;
    transmission: number;
    clearcoat: number;
  };
};

export const materialLibraryItems: MaterialLibraryItem[] = [
  {
    id: "mat-calacatta-viola",
    name: "Calacatta Viola",
    category: "Stone",
    targetPart: "Marble Base",
    imageUrl: "/materials/calacatta-viola.png",
    productRenderUrl: "/ai-designs/table-lamp-calacatta-viola.png",
    resolution: "2048 x 2048",
    texture: "polished white marble with purple veining",
    color: { name: "warm white / purple vein", hex: "#d6ccc4" },
    gloss: { label: "polished stone", roughness: 0.18, specular: 0.68, metallic: 0, transmission: 0, clearcoat: 0.28 }
  },
  {
    id: "mat-calacatta-gold",
    name: "Calacatta Gold",
    category: "Stone",
    targetPart: "Marble Base",
    imageUrl: "/materials/calacatta-gold.png",
    productRenderUrl: "/ai-designs/table-lamp-calacatta-gold.png",
    resolution: "2048 x 2048",
    texture: "polished white marble with warm gold veining",
    color: { name: "ivory / gold vein", hex: "#ded8ca" },
    gloss: { label: "polished stone", roughness: 0.16, specular: 0.72, metallic: 0, transmission: 0, clearcoat: 0.3 }
  },
  {
    id: "mat-indian-green",
    name: "Indian Green",
    category: "Stone",
    targetPart: "Marble Base",
    imageUrl: "/materials/indian-green.png",
    productRenderUrl: "/ai-designs/table-lamp-indian-green.png",
    resolution: "2048 x 2048",
    texture: "deep green marble with light natural veining",
    color: { name: "deep green", hex: "#205846" },
    gloss: { label: "polished stone", roughness: 0.2, specular: 0.66, metallic: 0, transmission: 0, clearcoat: 0.24 }
  },
  {
    id: "mat-nero-marquina",
    name: "Nero Marquina",
    category: "Stone",
    targetPart: "Marble Base",
    imageUrl: "/materials/nero-marquina.png",
    productRenderUrl: "/ai-designs/table-lamp-nero-marquina.png",
    resolution: "2048 x 2048",
    texture: "black marble with high-contrast white veining",
    color: { name: "black / white vein", hex: "#121414" },
    gloss: { label: "high gloss stone", roughness: 0.13, specular: 0.78, metallic: 0, transmission: 0, clearcoat: 0.34 }
  },
  {
    id: "mat-travertine",
    name: "Travertine",
    category: "Stone",
    targetPart: "Marble Base",
    imageUrl: "/materials/travertine.png",
    productRenderUrl: "/ai-designs/table-lamp-travertine.png",
    resolution: "2048 x 2048",
    texture: "filled travertine with linear pores and warm stone grain",
    color: { name: "warm beige", hex: "#b59a74" },
    gloss: { label: "honed matte stone", roughness: 0.42, specular: 0.38, metallic: 0, transmission: 0, clearcoat: 0.08 }
  },
  {
    id: "mat-white-onyx",
    name: "White Onyx",
    category: "Stone",
    targetPart: "Marble Base",
    imageUrl: "/materials/white-onyx.png",
    productRenderUrl: "/ai-designs/table-lamp-white-onyx.png",
    resolution: "2048 x 2048",
    texture: "soft semi-translucent onyx-like stone layers",
    color: { name: "milky white", hex: "#e1ddcf" },
    gloss: { label: "polished translucent stone", roughness: 0.12, specular: 0.82, metallic: 0, transmission: 0.18, clearcoat: 0.36 }
  },
  {
    id: "mat-glass-amber",
    name: "Amber Glass",
    category: "Glass",
    targetPart: "Glass Shade",
    imageUrl: "/materials/glass-amber.png",
    productRenderUrl: "/ai-designs/table-lamp-shade-amber.png",
    resolution: "2048 x 2048",
    texture: "warm transparent tinted glass",
    color: { name: "amber", hex: "#f5a248" },
    gloss: { label: "gloss transparent glass", roughness: 0.04, specular: 0.92, metallic: 0, transmission: 0.72, clearcoat: 0.55 }
  },
  {
    id: "mat-glass-smoke-grey",
    name: "Smoke Grey Glass",
    category: "Glass",
    targetPart: "Glass Shade",
    imageUrl: "/materials/glass-smoke-grey.png",
    productRenderUrl: "/ai-designs/table-lamp-shade-smoke-grey.png",
    resolution: "2048 x 2048",
    texture: "smoked semi-transparent glass",
    color: { name: "smoke grey", hex: "#69747a" },
    gloss: { label: "smoked glossy glass", roughness: 0.06, specular: 0.86, metallic: 0, transmission: 0.58, clearcoat: 0.5 }
  },
  {
    id: "mat-glass-olive-green",
    name: "Olive Green Glass",
    category: "Glass",
    targetPart: "Glass Shade",
    imageUrl: "/materials/glass-olive-green.png",
    productRenderUrl: "/ai-designs/table-lamp-shade-olive-green.png",
    resolution: "2048 x 2048",
    texture: "soft olive green transparent glass",
    color: { name: "olive green", hex: "#6a8550" },
    gloss: { label: "gloss transparent glass", roughness: 0.05, specular: 0.88, metallic: 0, transmission: 0.64, clearcoat: 0.52 }
  },
  {
    id: "mat-glass-clear",
    name: "Clear Glass",
    category: "Glass",
    targetPart: "Glass Shade",
    imageUrl: "/materials/glass-clear.png",
    productRenderUrl: "/ai-designs/table-lamp-shade-clear.png",
    resolution: "2048 x 2048",
    texture: "clear glass with soft rim highlights",
    color: { name: "clear", hex: "#d7ebf0" },
    gloss: { label: "clear high-gloss glass", roughness: 0.02, specular: 0.95, metallic: 0, transmission: 0.86, clearcoat: 0.58 }
  }
];

export function buildLibraryMaterialRecommendation(item: MaterialLibraryItem): MaterialRecommendation {
  return {
    conceptId: "material-library",
    materialFamily: item.name,
    finish: item.gloss.label,
    shellMaterial: `${item.targetPart}: ${item.texture}`,
    surfaceTreatment: `${item.name} applied to ${item.targetPart}; color ${item.color.name}; roughness ${item.gloss.roughness.toFixed(2)}; specular ${item.gloss.specular.toFixed(2)}; transmission ${item.gloss.transmission.toFixed(2)}.`,
    durability:
      item.category === "Glass"
        ? "Preserve glass wall thickness, rim highlights, and thermal stability checks for tinted shade variants."
        : "Verify rounded edges, bottom felt coverage, scratch resistance, and shipping protection for stone base variants.",
    sustainability:
      item.category === "Glass"
        ? "Recyclable long-life glass can be used as a supportable material story when supplier data is available."
        : "Natural stone positioning should be supported by source and low-waste machining documentation.",
    costSignal: item.category === "Glass" ? "Medium-high cost; tint consistency affects yield." : "High cost; weight and vein selection affect landed cost.",
    supplierBrief: [
      `Match material texture: ${item.texture}.`,
      `Target color: ${item.color.name} (${item.color.hex}).`,
      `Gloss parameters: roughness ${item.gloss.roughness}, specular ${item.gloss.specular}, clearcoat ${item.gloss.clearcoat}.`
    ],
    complianceChecks: [
      "Bind material claims to supplier batch documentation.",
      "Keep packaging and listing claims consistent with verified material data.",
      "Do not publish natural material or glass safety claims without documentation."
    ]
  };
}
