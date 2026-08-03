import { buildProductIdentityFromVision, buildStrictDesignLock } from "@/lib/image-reference-workflow";
import { makeId } from "@/lib/utils";
import type {
  DesignConcept,
  ImageReference,
  Marketplace,
  MaterialRecommendation,
  ProductAnalysis,
  VisionProductIdentityJson,
  VisionProviderName
} from "@/types/product";

const categorySignals: Record<
  string,
  {
    buyer: string;
    priceBand: string;
    painPoints: string[];
    levers: string[];
  }
> = {
  "Kitchen & Dining": {
    buyer: "US shoppers who care about durability, easy cleaning, storage efficiency, and clear value.",
    priceBand: "$24.99 - $49.99",
    painPoints: [
      "Hard-to-clean edges reduce repurchase confidence.",
      "Oversized packaging increases FBA cost.",
      "Generic listing visuals are easy to ignore on comparison pages."
    ],
    levers: ["easy-clean seam detail", "stackable structure", "food-contact material communication"]
  },
  "Home Office": {
    buyer: "Remote workers who care about desk comfort, cable order, and a calmer setup.",
    priceBand: "$29.99 - $79.99",
    painPoints: [
      "Desk accessories can look cheap in lifestyle images.",
      "Compatibility details are often unclear.",
      "Complicated assembly creates review risk."
    ],
    levers: ["tool-free setup", "matte tactile finish", "cable path details"]
  },
  "Pet Supplies": {
    buyer: "Pet owners who care about safe materials, easy cleaning, and trustworthy product details.",
    priceBand: "$18.99 - $39.99",
    painPoints: [
      "Buyers worry about odor, coatings, and safety.",
      "Rounded edges directly affect trust.",
      "Images need scale references for different pet sizes."
    ],
    levers: ["BPA-free proof point", "rounded bite-resistant edges", "washable parts"]
  },
  "Sports & Outdoors": {
    buyer: "Outdoor users who care about weight, grip, water resistance, weather use, and compact storage.",
    priceBand: "$21.99 - $59.99",
    painPoints: [
      "Low-cost products often fail at seams or clips.",
      "Wet-hand use can lead to poor grip reviews.",
      "Outdoor categories need clear load and weather notes."
    ],
    levers: ["texture grip area", "reinforced load points", "flat storage structure"]
  },
  Electronics: {
    buyer: "Tech buyers who care about compatibility, heat control, finish quality, and reliability.",
    priceBand: "$34.99 - $99.99",
    painPoints: [
      "Heat, cable clutter, and fingerprints often appear in reviews.",
      "Vague compatibility claims lower trust.",
      "Cheap plastic feel weakens perceived value."
    ],
    levers: ["vent detail", "soft-touch grip", "compatibility icon system"]
  },
  Lighting: {
    buyer: "Home decor lighting buyers who care about material quality, warm diffusion, bedroom styling, and tabletop portability.",
    priceBand: "$39.99 - $129.99",
    painPoints: [
      "A glass shade can look fragile if thickness and diffusion are unclear.",
      "Metal rings need clean alignment in detail images.",
      "Battery and weighted base claims need credible visual support."
    ],
    levers: ["glass shade diffusion", "precision metal ring", "hidden LED and battery module", "natural marble base"]
  }
};

const marketplaceSignals: Record<Marketplace, string[]> = {
  US: ["Prime-friendly value framing", "review-driven trust points", "clear in-box content"],
  UK: ["compact storage language", "plain compliance copy", "recyclable packaging notes"],
  DE: ["precise specifications", "repairability cues", "material verification"],
  JP: ["space-saving form", "quiet premium details", "tidy package volume"],
  CA: ["bilingual package space", "cold-weather durability context", "responsible materials"]
};

export async function simulateLatency(ms = 700) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildProductAnalysis(input: {
  productName: string;
  category: string;
  marketplace: Marketplace;
  imageReference: ImageReference;
  visionIdentity?: VisionProductIdentityJson | null;
  visionModelName?: string;
  visionSource?: VisionProviderName;
  visionMessage?: string;
}): ProductAnalysis {
  const signal = categorySignals[input.category] ?? categorySignals["Kitchen & Dining"];
  const score = 78 + (input.productName.length % 12);
  const productIdentity = buildProductIdentityFromVision({
    productName: input.productName,
    category: input.category,
    imageReference: input.imageReference,
    visionIdentity: input.visionIdentity,
    visionModelName: input.visionModelName,
    visionProvider: input.visionSource
  });
  const designLock = buildStrictDesignLock();

  return {
    productName: input.productName,
    category: input.category,
    marketplace: input.marketplace,
    imageReferenceMode: "enabled",
    productIdentity,
    designLock,
    aiDebug: {
      originalImage: productIdentity.imageReference.imageUrl ? "PASS" : "FAIL",
      productIdentity: productIdentity.productType && productIdentity.partStructure.length > 0 ? "PASS" : "FAIL",
      designLock: designLock.mode === "strict-reference-lock" ? "PASS" : "FAIL",
      productMask: productIdentity.maskRegions.length >= 5 ? "PASS" : "FAIL",
      visionSource: input.visionSource ?? "mock-fallback",
      visionModel: input.visionModelName ?? productIdentity.visionModel.name,
      message: input.visionMessage
    },
    opportunityScore: Math.min(score, 92),
    targetBuyer: signal.buyer,
    positioning: `${input.productName} can improve Amazon conversion by keeping the original product identity while strengthening material proof, image hierarchy, and listing clarity.`,
    painPoints: signal.painPoints,
    competitorSignals: [
      ...marketplaceSignals[input.marketplace],
      "High-converting listings show real product use in the first three image slots.",
      "Buyers trust consistent product identity across main, detail, scene, package, and brand images."
    ],
    designLevers: signal.levers,
    complianceNotes: [
      "Material claims need supplier documentation before publishing.",
      "Package layouts should reserve space for barcode, origin, warning, and marketplace-specific copy.",
      "Avoid medical, safety, performance, or durability absolutes before testing."
    ],
    estimatedPriceBand: signal.priceBand
  };
}

export function buildDesignConcepts(analysis: ProductAnalysis): DesignConcept[] {
  const identity = analysis.productIdentity;
  const allowed = analysis.designLock.allowedEdits.join(" / ");

  return [
    {
      id: makeId("concept"),
      title: "Reference Material Upgrade",
      promise: "Raise perceived quality without changing the uploaded product silhouette or component layout.",
      rationale: `${identity.productType} is locked by Product Identity. The model may only change ${allowed}.`,
      featureChanges: [
        "Preserve the uploaded product shape and part arrangement.",
        "Replace only editable material texture, color, gloss, or finish.",
        "Use close-up images to explain material origin, grain, and surface treatment."
      ],
      colorPalette: ["deep stone green", "warm white", "brushed brass"],
      manufacturingImpact: "Low",
      listingAngle: `Designed for ${analysis.targetBuyer}`,
      score: Math.min(analysis.opportunityScore + 2, 96),
      risks: ["Material claims require supplier documentation."]
    },
    {
      id: makeId("concept"),
      title: "Color and Finish Set",
      promise: "Build a premium visual hierarchy with controlled color and surface finish variants.",
      rationale: "Generation must use the uploaded image as reference and cannot redraw or replace the product.",
      featureChanges: [
        "Preserve original camera angle, perspective, and product position.",
        "Adjust only visible glass, metal, or stone color and surface finish.",
        "Keep the same Product Identity across Amazon image sets."
      ],
      colorPalette: ["Indian Green", "clear glass", "brushed metal"],
      manufacturingImpact: "Low",
      listingAngle: "Premium daily-use design with Amazon-ready visual consistency.",
      score: Math.min(analysis.opportunityScore + 5, 97),
      risks: ["Premium feeling depends on clean photography and accurate texture detail."]
    },
    {
      id: makeId("concept"),
      title: "Amazon Reference Image Set",
      promise: "Generate main, feature, dimension, material, lifestyle, detail, package, and brand images from the same original product.",
      rationale: "Scene can change, but silhouette, dimensions, structure, component position, and camera angle remain locked.",
      featureChanges: [
        "Use the uploaded product as the only product body in all images.",
        "Change background and environment only where the template allows.",
        "Keep packaging and brand story consistent with the same Product Identity JSON."
      ],
      colorPalette: ["warm white", "soft grey", "natural stone"],
      manufacturingImpact: "Low",
      listingAngle: "Consistent product identity across an Amazon-ready nine-image set.",
      score: Math.max(analysis.opportunityScore, 72),
      risks: ["Scene images must not imply props or accessories are included."]
    }
  ];
}

export function buildMaterialRecommendation(input: {
  conceptId: string;
  materialFamily: string;
  finish: string;
}): MaterialRecommendation {
  const families: Record<string, Pick<MaterialRecommendation, "shellMaterial" | "durability" | "sustainability" | "costSignal">> = {
    "Calacatta Viola": {
      shellMaterial: "Polished Calacatta Viola marble base with reinforced felt pad",
      durability: "Premium stone feel with good stability; purple veining needs edge protection.",
      sustainability: "Natural stone selling point; best supported with quarry source and low-waste machining notes.",
      costSignal: "High cost, suited to luxury positioning."
    },
    "Calacatta Gold": {
      shellMaterial: "Polished Calacatta Gold marble base matched with warm metal details",
      durability: "Stable tabletop feel; vein consistency should be inspected in production.",
      sustainability: "Natural stone claim should be supported by supplier documentation.",
      costSignal: "Medium-high cost with broad premium appeal."
    },
    "Indian Green": {
      shellMaterial: "Polished Indian Green marble base with visible natural veining",
      durability: "Dense stone mass improves stability and perceived quality.",
      sustainability: "Natural material story can support premium Amazon imagery.",
      costSignal: "Medium-high cost, strong visual differentiation."
    },
    "Nero Marquina": {
      shellMaterial: "Nero Marquina black marble base with high-contrast white veining",
      durability: "Strong visual contrast; polished dark stone may show fingerprints.",
      sustainability: "Natural stone positioning should avoid unsupported eco claims.",
      costSignal: "Medium-high cost, strong modern luxury cue."
    },
    Travertine: {
      shellMaterial: "Filled and honed travertine stone base",
      durability: "Warm tactile stone look; pores need controlled filling for clean use.",
      sustainability: "Natural stone story with softer Mediterranean visual language.",
      costSignal: "Medium cost with warm lifestyle appeal."
    },
    "White Onyx": {
      shellMaterial: "Semi-translucent white onyx style stone base",
      durability: "Luxury look; translucent stone needs careful scratch and edge protection.",
      sustainability: "Premium natural stone claim requires documentation.",
      costSignal: "High cost, best for luxury brand mode."
    }
  };

  const selected = families[input.materialFamily] ?? {
    shellMaterial: `${input.materialFamily} applied only to the selected region`,
    durability: "Keep original structure and verify finish durability before launch.",
    sustainability: "Support material claims with supplier evidence.",
    costSignal: "Cost depends on supplier and finishing process."
  };

  return {
    conceptId: input.conceptId,
    materialFamily: input.materialFamily,
    finish: input.finish,
    shellMaterial: selected.shellMaterial,
    surfaceTreatment: input.finish,
    durability: selected.durability,
    sustainability: selected.sustainability,
    costSignal: selected.costSignal,
    supplierBrief: [
      "Apply material only to the selected masked region.",
      "Preserve original silhouette, dimensions, structure, component position, and camera angle.",
      "Provide texture, gloss, color tolerance, and finish samples before production."
    ],
    complianceChecks: [
      "Do not claim certification without documentation.",
      "Confirm finish scratch resistance before Amazon copy approval.",
      "Keep all generated images tied to original_reference and Product Identity JSON."
    ]
  };
}
