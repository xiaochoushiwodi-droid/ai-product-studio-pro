import { makeId } from "@/lib/utils";
import type {
  ImageReference,
  ProductMaskEngineResult,
  ProductMaskRegion,
  ProductMaskRegionId,
  VisionProductIdentityJson
} from "@/types/product";

const requiredLampRegions = ["shade", "base", "metal", "led", "battery"] as const;

type RegionTemplate = Omit<ProductMaskRegion, "maskUrl" | "confidence" | "source"> & {
  aliases: string[];
  shape: "ellipse" | "rect" | "capsule";
};

const lampRegionTemplates: RegionTemplate[] = [
  {
    id: "shade",
    label: "Shade",
    partName: "Glass Shade",
    material: "Glass",
    editableProperties: ["material", "color", "surface_finish"],
    lockedNeighbors: ["Metal Ring", "LED", "Battery", "Marble Base"],
    promptHint: "Only edit the shade material, color, transparency, or finish. Preserve base, metal ring, LED, battery, product proportion, and camera angle.",
    bounds: { x: 30, y: 10, width: 40, height: 34 },
    aliases: ["shade", "glass shade", "lampshade", "dome"],
    shape: "ellipse"
  },
  {
    id: "metal",
    label: "Metal",
    partName: "Metal Frame",
    material: "Metal",
    editableProperties: ["material", "color", "surface_finish"],
    lockedNeighbors: ["Glass Shade", "LED", "Battery", "Marble Base"],
    promptHint: "Only edit the visible metal finish. Preserve shade, base, LED, battery, silhouette, and camera angle.",
    bounds: { x: 38, y: 42, width: 24, height: 14 },
    aliases: ["metal", "frame", "ring", "metal ring", "metal frame"],
    shape: "capsule"
  },
  {
    id: "led",
    label: "LED",
    partName: "LED",
    material: "LED",
    editableProperties: ["color", "surface_finish"],
    lockedNeighbors: ["Glass Shade", "Metal Frame", "Battery", "Marble Base"],
    promptHint: "Only tune the LED glow color or visible light finish. Preserve LED position, shade geometry, base material, and camera angle.",
    bounds: { x: 43, y: 36, width: 14, height: 12 },
    aliases: ["led", "light source", "light-source", "led module", "light"],
    shape: "ellipse"
  },
  {
    id: "battery",
    label: "Battery",
    partName: "Battery",
    material: "Battery",
    editableProperties: ["surface_finish"],
    lockedNeighbors: ["Glass Shade", "Metal Frame", "LED", "Marble Base"],
    promptHint: "Battery is a protected internal component. Do not move, expose, resize, or redesign it; only preserve its implied position.",
    bounds: { x: 41, y: 66, width: 18, height: 10 },
    aliases: ["battery", "power cell", "rechargeable battery"],
    shape: "capsule"
  },
  {
    id: "base",
    label: "Base",
    partName: "Marble Base",
    material: "Stone",
    editableProperties: ["material", "color", "surface_finish"],
    lockedNeighbors: ["Glass Shade", "Metal Frame", "LED", "Battery"],
    promptHint: "Only edit the base material, color, or finish. Preserve shade, metal structure, LED, battery, product proportion, and camera angle.",
    bounds: { x: 36, y: 72, width: 28, height: 18 },
    aliases: ["base", "marble", "stone", "marble base"],
    shape: "capsule"
  },
  {
    id: "logo",
    label: "Logo",
    partName: "Logo",
    material: "Graphic mark",
    editableProperties: ["color", "surface_finish"],
    lockedNeighbors: ["Glass Shade", "Metal Frame", "LED", "Battery", "Marble Base"],
    promptHint: "Only edit a small visible logo or brand mark. Do not add a logo if none exists.",
    bounds: { x: 44, y: 78, width: 12, height: 6 },
    aliases: ["logo", "brand", "brand mark"],
    shape: "rect"
  },
  {
    id: "scene",
    label: "Scene",
    partName: "Scene Background",
    material: "Environment",
    editableProperties: ["scene_background"],
    lockedNeighbors: ["Glass Shade", "Metal Frame", "LED", "Battery", "Marble Base"],
    promptHint: "Only change the environment or background. Preserve the full product exactly as uploaded.",
    bounds: { x: 0, y: 0, width: 100, height: 100 },
    aliases: ["scene", "background", "environment"],
    shape: "rect"
  }
];

export function createProductMaskEngineResult(input: {
  productIdentityId: string;
  imageReference: ImageReference;
  visionIdentity: VisionProductIdentityJson;
  isTableLamp: boolean;
}): ProductMaskEngineResult {
  const regions = buildProductMaskRegionsFromVision(input.visionIdentity, input.isTableLamp);

  return {
    id: makeId("mask-engine"),
    productIdentityId: input.productIdentityId,
    imageReference: input.imageReference,
    regions,
    requiredRegions: [...requiredLampRegions],
    source: "product-mask-engine",
    generatedAt: new Date().toISOString()
  };
}

export function buildProductMaskRegionsFromVision(identity: VisionProductIdentityJson, isTableLamp: boolean): ProductMaskRegion[] {
  if (!isTableLamp) {
    return [buildMaskRegion(lampRegionTemplates.find((region) => region.id === "scene")!, 0.86, "rule-based")];
  }

  const detectedParts = identity.parts.map((part) => [part.name, part.material, part.position].join(" ").toLowerCase());
  const detectedPartText = detectedParts.join(" ");
  const selectedTemplates = lampRegionTemplates.filter((template) => {
    if (template.id === "scene") return true;
    if (template.id === "logo") return detectedPartText.includes("logo") || detectedPartText.includes("brand");
    if (requiredLampRegions.includes(template.id as typeof requiredLampRegions[number])) return true;

    return template.aliases.some((alias) => detectedPartText.includes(alias));
  });

  return selectedTemplates.map((template) => {
    const detected = template.aliases.some((alias) => detectedPartText.includes(alias));
    return buildMaskRegion(template, detected ? 0.92 : 0.78, detected ? "vision-segmentation" : "product-mask-engine");
  });
}

function buildMaskRegion(template: RegionTemplate, confidence: number, source: ProductMaskRegion["source"]): ProductMaskRegion {
  return {
    id: template.id,
    label: template.label,
    partName: template.partName,
    material: template.material,
    editableProperties: template.editableProperties,
    lockedNeighbors: template.lockedNeighbors,
    promptHint: template.promptHint,
    bounds: template.bounds,
    maskUrl: buildSvgMaskDataUrl(template.id, template.bounds, template.shape),
    confidence,
    source
  };
}

function buildSvgMaskDataUrl(id: ProductMaskRegionId, bounds: ProductMaskRegion["bounds"], shape: RegionTemplate["shape"]) {
  const safeId = `mask-${id}`;
  const geometry = buildSvgGeometry(bounds, shape);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">`,
    `<rect width="100" height="100" fill="black"/>`,
    `<g id="${safeId}" fill="white">${geometry}</g>`,
    `</svg>`
  ].join("");

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildSvgGeometry(bounds: ProductMaskRegion["bounds"], shape: RegionTemplate["shape"]) {
  if (shape === "ellipse") {
    return `<ellipse cx="${bounds.x + bounds.width / 2}" cy="${bounds.y + bounds.height / 2}" rx="${bounds.width / 2}" ry="${bounds.height / 2}"/>`;
  }

  const radius = shape === "capsule" ? Math.min(bounds.width, bounds.height) / 2 : 1.5;
  return `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" rx="${radius}" ry="${radius}"/>`;
}
