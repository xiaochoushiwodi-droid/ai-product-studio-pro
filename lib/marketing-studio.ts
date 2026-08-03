import { amazonListingImages } from "@/lib/amazon-images";
import { tableLampDimensions } from "@/lib/table-lamp-spec";
import { makeId } from "@/lib/utils";
import type {
  DesignLock,
  MarketingAsset,
  MarketingAutoLayout,
  MarketingCopy,
  MarketingCopyMode,
  MarketingEditorLayer,
  MarketingLanguage,
  MarketingTemplate,
  ProductIdentity
} from "@/types/product";

export const marketingCopyModes: Array<{ id: MarketingCopyMode; label: string; goal: string }> = [
  { id: "amazon-conversion", label: "Amazon Conversion", goal: "Increase conversion rate" },
  { id: "luxury-brand", label: "Luxury Brand", goal: "Create premium brand feeling" },
  { id: "simple-selling", label: "Simple Selling", goal: "Keep benefits direct and easy" }
];

export const marketingLanguages: Array<{ id: MarketingLanguage; label: string }> = [
  { id: "en", label: "English" },
  { id: "zh", label: "Chinese" },
  { id: "ja", label: "Japanese" },
  { id: "de", label: "Deutsch" }
];

export const amazonMarketingTemplates: MarketingTemplate[] = [
  {
    id: "template-main-image",
    imageIndex: 1,
    kind: "main-image",
    name: "Main Image",
    size: { width: 1600, height: 1600 },
    rules: ["White background", "Product occupies the main area", "No text or icons"],
    layoutRules: ["Center product", "Leave clean white margin", "No graphic overlays"]
  },
  {
    id: "template-feature-image",
    imageIndex: 2,
    kind: "feature-image",
    name: "Feature Image",
    size: { width: 1600, height: 1600 },
    rules: ["Original product reference required", "Use short selling text", "No unverifiable claims"],
    layoutRules: ["Title in upper left", "Feature bullets on the right", "Product remains dominant"]
  },
  {
    id: "template-dimension-image",
    imageIndex: 3,
    kind: "dimension-image",
    name: "Dimension Image",
    size: { width: 1600, height: 1600 },
    rules: ["Show CM and inch", "Use Product Identity dimensions", "Keep product proportions locked"],
    layoutRules: ["Dimension callouts around product", "Use high-contrast measurement labels"]
  },
  {
    id: "template-material-image",
    imageIndex: 4,
    kind: "material-image",
    name: "Material Image",
    size: { width: 1600, height: 1600 },
    rules: ["Explain visible materials only", "No fake certifications", "Use identity materials"],
    layoutRules: ["Material headline", "Texture callouts near related components"]
  },
  {
    id: "template-bedroom-scene",
    imageIndex: 5,
    kind: "lifestyle-bedroom",
    name: "Bedroom Scene",
    size: { width: 1600, height: 1600 },
    rules: ["Bedroom context", "Original product unchanged", "Scene background may change"],
    layoutRules: ["Ambient headline", "Small room-use label", "Avoid blocking product silhouette"],
    sceneOptions: ["Bedroom", "Living Room", "Office", "Hotel"]
  },
  {
    id: "template-living-room-scene",
    imageIndex: 6,
    kind: "lifestyle-living-room",
    name: "Living Room Scene",
    size: { width: 1600, height: 1600 },
    rules: ["Living room context", "Original product unchanged", "Scene background may change"],
    layoutRules: ["Editorial headline", "Secondary copy near lower third"],
    sceneOptions: ["Bedroom", "Living Room", "Office", "Hotel"]
  },
  {
    id: "template-detail-image",
    imageIndex: 7,
    kind: "detail-image",
    name: "Detail Image",
    size: { width: 1600, height: 1600 },
    rules: ["Show product details", "Use real visible components", "No new product parts"],
    layoutRules: ["Detail callouts", "Compact labels", "Keep product center visible"]
  },
  {
    id: "template-package-image",
    imageIndex: 8,
    kind: "package-image",
    name: "Package Image",
    size: { width: 1600, height: 1600 },
    rules: ["Package concept allowed", "No fake certification marks", "Keep product reference consistent"],
    layoutRules: ["Package title", "Included-in-box callout", "Reference product shown beside package"]
  },
  {
    id: "template-brand-story",
    imageIndex: 9,
    kind: "brand-story",
    name: "Brand Story",
    size: { width: 1600, height: 1600 },
    rules: ["Brand story copy allowed", "No review or rating language", "No unsupported awards"],
    layoutRules: ["Large story headline", "Three concise value pillars"]
  }
];

export function buildMarketingCopyResponse(input: {
  productName: string;
  productIdentity: ProductIdentity;
  designLock: DesignLock;
  mode: MarketingCopyMode;
  language: MarketingLanguage;
}) {
  const copy = buildMarketingCopy(input);

  return {
    copy,
    marketplace: "Amazon US",
    source: "Product Identity JSON",
    original_reference: input.productIdentity.imageReference,
    product_identity: input.productIdentity,
    design_lock: input.designLock,
    requestContract: {
      original_reference: input.productIdentity.imageReference,
      product_identity: input.productIdentity.rawVisionJson,
      design_lock: input.designLock,
      prompt: "Generate Amazon selling copy from Product Identity JSON."
    },
    rules: [
      "US Amazon consumer language",
      "English-first copy",
      "No unverifiable certification, rating, price, or guarantee claims",
      "Copy is generated from Product Identity JSON"
    ]
  };
}

export function buildMarketingLayoutResponse(input: {
  productName: string;
  productIdentity: ProductIdentity;
  designLock: DesignLock;
  copy: MarketingCopy;
  language: MarketingLanguage;
  mode: MarketingCopyMode;
}) {
  const generatedAt = new Date().toISOString();
  const layouts = amazonMarketingTemplates.map((template) => {
    const sourceImage = amazonListingImages.find((image) => image.index === template.imageIndex);
    return buildAutoLayout({
      template,
      productIdentity: input.productIdentity,
      designLock: input.designLock,
      copy: input.copy,
      language: input.language,
      mode: input.mode,
      imageUrl: input.productIdentity.imageReference.imageUrl,
      layoutPreviewUrl: sourceImage?.imageUrl,
      generatedAt
    });
  });

  const marketingAssets: MarketingAsset[] = layouts.map((layout) => {
    const template = amazonMarketingTemplates.find((item) => item.id === layout.templateId) ?? amazonMarketingTemplates[0];
    return {
      id: makeId("marketing-asset"),
      productId: input.productIdentity.sourceProductId,
      imageId: layout.imageId,
      copyText: layout.layers.map((layer) => layer.text).filter(Boolean).join(" | "),
      template,
      version: "Version A",
      language: input.language,
      layout,
      original_reference: input.productIdentity.imageReference,
      product_identity: input.productIdentity,
      design_lock: input.designLock,
      createdAt: generatedAt
    };
  });

  return {
    studio: "AI Marketing Image Studio",
    workflow: [
      "uploaded product image",
      "AI vision analysis",
      "Product Identity JSON",
      "Design Lock",
      "commercial image generation",
      "AI selling copy",
      "auto layout",
      "Amazon 9 images"
    ],
    templates: amazonMarketingTemplates,
    layouts,
    marketingAssets,
    tables: {
      MarketingAssets: marketingAssets,
      Template: amazonMarketingTemplates
    },
    original_reference: input.productIdentity.imageReference,
    product_identity: input.productIdentity,
    design_lock: input.designLock,
    requestContract: {
      original_reference: input.productIdentity.imageReference,
      product_identity: input.productIdentity.rawVisionJson,
      design_lock: input.designLock,
      prompt: "Auto layout Amazon marketing images using program-rendered text overlays."
    }
  };
}

function buildMarketingCopy(input: {
  productName: string;
  productIdentity: ProductIdentity;
  designLock: DesignLock;
  mode: MarketingCopyMode;
  language: MarketingLanguage;
}): MarketingCopy {
  const isLamp = input.productIdentity.productType.toLowerCase().includes("lamp");
  const baseTitle = isLamp ? titleByMode[input.mode] : `${input.productName} for Modern Homes`;
  const bulletPoints = isLamp ? bulletsByMode[input.mode] : genericBullets(input.productIdentity);
  const imageCopy = isLamp ? imageCopyByMode[input.mode] : ["Premium Materials", "Designed for Daily Use", "Modern Product Detail"];
  const listingDescription = isLamp
    ? descriptionByMode[input.mode]
    : `Designed for US Amazon shoppers, this ${input.productName} keeps the original product structure and highlights its most important materials, functions, and everyday benefits.`;

  return {
    id: makeId("marketing-copy"),
    productId: input.productIdentity.sourceProductId,
    productIdentityId: input.productIdentity.id,
    designLockMode: input.designLock.mode,
    mode: input.mode,
    language: input.language,
    title: localizeText(baseTitle, input.language),
    bulletPoints: bulletPoints.map((item) => localizeText(item, input.language)),
    imageCopy: imageCopy.map((item) => localizeText(item, input.language)),
    listingDescription: localizeText(listingDescription, input.language),
    translations: {
      en: {
        title: baseTitle,
        imageCopy
      },
      zh: {
        title: "Modern Rechargeable Marble Table Lamp",
        imageCopy: ["Premium Marble Base", "Warm Light Atmosphere", "Portable Wireless Design"]
      },
      ja: {
        title: "Modern Rechargeable Marble Table Lamp",
        imageCopy: ["Premium Marble Base", "Warm Light Atmosphere", "Portable Wireless Design"]
      },
      de: {
        title: "Moderne wiederaufladbare Marmor-Tischlampe",
        imageCopy: ["Hochwertiger Marmorsockel", "Warme Lichtatmosphaere", "Kabelloses tragbares Design"]
      }
    },
    createdAt: new Date().toISOString()
  };
}

function buildAutoLayout(input: {
  template: MarketingTemplate;
  productIdentity: ProductIdentity;
  designLock: DesignLock;
  copy: MarketingCopy;
  language: MarketingLanguage;
  mode: MarketingCopyMode;
  imageUrl: string;
  layoutPreviewUrl?: string;
  generatedAt: string;
}): MarketingAutoLayout {
  return {
    id: makeId("marketing-layout"),
    imageId: `amazon-${String(input.template.imageIndex).padStart(2, "0")}`,
    templateId: input.template.id,
    templateName: input.template.name,
    imageIndex: input.template.imageIndex,
    imageUrl: input.imageUrl,
    layoutPreviewUrl: input.layoutPreviewUrl,
    language: input.language,
    copyMode: input.mode,
    title: input.template.name,
    layers: buildTemplateLayers(input.template, input.copy),
    original_reference: input.productIdentity.imageReference,
    product_identity: input.productIdentity,
    design_lock: input.designLock,
    generatedAt: input.generatedAt
  };
}

function buildTemplateLayers(template: MarketingTemplate, copy: MarketingCopy): MarketingEditorLayer[] {
  const shortCopy = copy.imageCopy;
  const title = copy.title;

  if (template.kind === "main-image") {
    return [];
  }

  if (template.kind === "dimension-image") {
    return [
      textLayer("Dimensions", 7, 8, 44, 42, 800),
      textLayer(`Height ${tableLampDimensions.heightCm} cm / ${toInch(tableLampDimensions.heightCm)} in`, 6, 76, 48, 24, 700),
      textLayer(`Shade ${tableLampDimensions.shadeCm} cm / ${toInch(tableLampDimensions.shadeCm)} in`, 56, 14, 34, 22, 700),
      textLayer(`Base ${tableLampDimensions.baseCm} cm / ${toInch(tableLampDimensions.baseCm)} in`, 57, 79, 34, 22, 700)
    ];
  }

  if (template.kind === "material-image") {
    return [
      textLayer(shortCopy[0] ?? "Premium Marble Base", 7, 8, 48, 36, 800),
      iconLayer("gem", "Natural Stone", 7, 68),
      textLayer("Glass Shade / Metal Ring / Marble Base", 7, 78, 54, 19, 700)
    ];
  }

  if (template.kind === "package-image") {
    return [
      textLayer("Ready for Gifting", 7, 8, 46, 38, 800),
      iconLayer("package", "Secure Package", 7, 67),
      textLayer("Lamp body, charging cable, user guide", 7, 78, 52, 19, 700)
    ];
  }

  if (template.kind === "brand-story") {
    return [
      textLayer("Designed for Modern Calm", 7, 8, 52, 36, 800),
      iconLayer("sparkle", "Premium", 7, 65),
      iconLayer("check", "Useful", 31, 65),
      iconLayer("story", "Timeless", 55, 65)
    ];
  }

  if (template.kind === "lifestyle-bedroom") {
    return [
      textLayer(shortCopy[1] ?? "Warm Light Atmosphere", 7, 8, 48, 36, 800),
      textLayer("Bedroom", 7, 76, 28, 20, 700)
    ];
  }

  if (template.kind === "lifestyle-living-room") {
    return [
      textLayer("Effortless Ambient Style", 7, 8, 50, 36, 800),
      textLayer(shortCopy[2] ?? "Portable Wireless Design", 7, 76, 48, 20, 700)
    ];
  }

  if (template.kind === "detail-image") {
    return [
      textLayer("Product Details", 7, 8, 44, 36, 800),
      iconLayer("check", "Touch Dimming", 7, 67),
      iconLayer("ruler", "Compact Size", 35, 67),
      iconLayer("sparkle", "Warm LED", 63, 67)
    ];
  }

  return [
    textLayer(title, 7, 8, 54, 34, 800),
    iconLayer("check", shortCopy[0] ?? "Premium Feature", 7, 65),
    iconLayer("sparkle", shortCopy[1] ?? "Warm Light", 7, 76),
    iconLayer("ruler", shortCopy[2] ?? "Portable Design", 7, 87)
  ];
}

function textLayer(
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  fontWeight: 500 | 600 | 700 | 800
): MarketingEditorLayer {
  return {
    id: makeId("layer"),
    type: "text",
    text,
    x,
    y,
    width,
    fontSize,
    fontFamily: "Inter",
    fontWeight: String(fontWeight) as MarketingEditorLayer["fontWeight"],
    color: "#111827",
    opacity: 1,
    align: "left"
  };
}

function iconLayer(icon: MarketingEditorLayer["icon"], text: string, x: number, y: number): MarketingEditorLayer {
  return {
    id: makeId("layer"),
    type: "icon",
    icon,
    text,
    x,
    y,
    width: 22,
    fontSize: 19,
    fontFamily: "Inter",
    fontWeight: "700",
    color: "#111827",
    opacity: 0.92,
    align: "center"
  };
}

function toInch(cm: number) {
  return (cm / 2.54).toFixed(1);
}

function genericBullets(identity: ProductIdentity) {
  return [
    `Premium ${identity.materials[0]?.material ?? "Material"} Construction`,
    "Designed for Everyday Use",
    "Modern Functional Detail",
    "Compact Product Profile",
    "Amazon-Ready Presentation"
  ];
}

const titleByMode: Record<MarketingCopyMode, string> = {
  "amazon-conversion": "Modern Rechargeable Marble Table Lamp",
  "luxury-brand": "Luxury Rechargeable Marble Table Lamp for Elegant Interiors",
  "simple-selling": "Portable Rechargeable Marble Table Lamp"
};

const bulletsByMode: Record<MarketingCopyMode, string[]> = {
  "amazon-conversion": [
    "Premium Natural Marble Base",
    "Warm Ambient Lighting",
    "USB-C Rechargeable Design",
    "Touch Dimming Control",
    "Elegant Home Decoration"
  ],
  "luxury-brand": [
    "Premium Natural Marble Base",
    "Soft Sculptural Glass Shade",
    "Warm Ambient Glow for Refined Spaces",
    "Rechargeable Cordless Convenience",
    "Elegant Accent for Bedroom or Living Room"
  ],
  "simple-selling": [
    "Natural Marble Base",
    "Warm LED Light",
    "Rechargeable and Portable",
    "Simple Touch Control",
    "Great for Home Decoration"
  ]
};

const imageCopyByMode: Record<MarketingCopyMode, string[]> = {
  "amazon-conversion": ["Premium Marble Base", "Warm Light Atmosphere", "Portable Wireless Design"],
  "luxury-brand": ["Natural Marble Elegance", "Soft Ambient Glow", "Cordless Luxury Accent"],
  "simple-selling": ["Marble Base", "Warm Light", "Rechargeable Design"]
};

const descriptionByMode: Record<MarketingCopyMode, string> = {
  "amazon-conversion":
    "Bring warm, cordless lighting to your nightstand, shelf, or reading corner. This rechargeable marble table lamp combines a glass shade, metal ring, LED module, battery, and natural marble base for a modern look made for everyday home use.",
  "luxury-brand":
    "A refined lighting accent for calm interiors, this rechargeable marble table lamp pairs a translucent glass shade with a polished metal ring and substantial natural stone base. It brings soft atmosphere to bedrooms, living rooms, boutique hospitality spaces, and curated shelves.",
  "simple-selling":
    "This portable rechargeable table lamp adds warm LED light wherever you need it. The marble base, glass shade, and metal ring create a clean modern look for bedrooms, living rooms, desks, and small spaces."
};

function localizeText(text: string, language: MarketingLanguage) {
  if (language === "en") return text;

  const dictionary: Record<MarketingLanguage, Record<string, string>> = {
    en: {},
    zh: {
      "Premium Marble Base": "Premium Marble Base",
      "Warm Light Atmosphere": "Warm Light Atmosphere",
      "Portable Wireless Design": "Portable Wireless Design",
      "Modern Rechargeable Marble Table Lamp": "Modern Rechargeable Marble Table Lamp"
    },
    ja: {
      "Premium Marble Base": "Premium Marble Base",
      "Warm Light Atmosphere": "Warm Light Atmosphere",
      "Portable Wireless Design": "Portable Wireless Design",
      "Modern Rechargeable Marble Table Lamp": "Modern Rechargeable Marble Table Lamp"
    },
    de: {
      "Premium Marble Base": "Hochwertiger Marmorsockel",
      "Warm Light Atmosphere": "Warme Lichtatmosphaere",
      "Portable Wireless Design": "Kabelloses tragbares Design",
      "Modern Rechargeable Marble Table Lamp": "Moderne wiederaufladbare Marmor-Tischlampe"
    }
  };

  return dictionary[language][text] ?? text;
}
