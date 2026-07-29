export type Marketplace = "US" | "UK" | "DE" | "JP" | "CA";

export type SellerSession = {
  sellerName: string;
  email: string;
  marketplace: Marketplace;
};

export type UploadedProduct = {
  id: string;
  name: string;
  category: string;
  fileName: string;
  imageUrl: string;
  imageReference?: ImageReference;
  uploadedAt: string;
};

export type ImageReference = {
  mode: "image-reference";
  sourceProductId: string;
  fileName: string;
  imageUrl: string;
  uploadedAt: string;
  referenceStrength: "strict";
};

export type AllowedProductEdit = "材质" | "颜色" | "表面工艺" | "使用场景";

export type ProductMaskRegionId = "shade" | "metal" | "base" | "logo" | "light-source" | "scene";

export type ProductMaskRegion = {
  id: ProductMaskRegionId;
  label: string;
  partName: string;
  material: string;
  editableProperties: AllowedProductEdit[];
  lockedNeighbors: string[];
  promptHint: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type ProductIdentityMaterial = {
  part: string;
  material: string;
  editableProperties: AllowedProductEdit[];
};

export type ProductIdentity = {
  id: string;
  sourceProductId: string;
  productType: string;
  partStructure: string[];
  materials: ProductIdentityMaterial[];
  proportions: {
    overall: string;
    dimensions?: {
      heightCm?: number;
      shadeCm?: number;
      baseCm?: number;
    };
    relationships: string[];
  };
  keyFeatures: string[];
  editableAreas: string[];
  maskRegions: ProductMaskRegion[];
  imageReference: ImageReference;
  visionModel: {
    name: string;
    status: "completed";
    analyzedAt: string;
  };
};

export type DesignLock = {
  mode: "strict-reference-lock";
  productOutline: "locked";
  sizeProportion: "locked";
  partPositions: "locked";
  cameraAngle: "locked";
  overallDimensions: "locked";
  allowedEdits: AllowedProductEdit[];
  forbiddenChanges: string[];
  validationRule: string;
};

export type LightingKnowledgeRule = {
  id: string;
  title: string;
  category: "shade" | "light-source" | "transmission" | "color-temperature" | "metal-finish" | "marble";
  rule: string;
  designUse: string;
};

export type MarketingCopyMode = "amazon-conversion" | "luxury-brand" | "simple-selling";

export type MarketingLanguage = "en" | "zh" | "ja" | "de";

export type MarketingCopy = {
  id: string;
  productId: string;
  productIdentityId: string;
  designLockMode: DesignLock["mode"];
  mode: MarketingCopyMode;
  language: MarketingLanguage;
  title: string;
  bulletPoints: string[];
  imageCopy: string[];
  listingDescription: string;
  translations: Record<MarketingLanguage, {
    title: string;
    imageCopy: string[];
  }>;
  createdAt: string;
};

export type MarketingTemplateKind =
  | "main-image"
  | "feature-image"
  | "dimension-image"
  | "material-image"
  | "lifestyle-bedroom"
  | "lifestyle-living-room"
  | "lifestyle-office"
  | "lifestyle-hotel"
  | "detail-image"
  | "package-image"
  | "brand-story";

export type MarketingTemplate = {
  id: string;
  imageIndex: number;
  kind: MarketingTemplateKind;
  name: string;
  size: {
    width: 1600;
    height: 1600;
  };
  rules: string[];
  layoutRules: string[];
  sceneOptions?: Array<"Bedroom" | "Living Room" | "Office" | "Hotel">;
};

export type MarketingLayerIcon = "sparkle" | "check" | "ruler" | "gem" | "package" | "story";

export type MarketingEditorLayer = {
  id: string;
  type: "text" | "icon";
  text: string;
  icon?: MarketingLayerIcon;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: "500" | "600" | "700" | "800";
  color: string;
  opacity: number;
  align: "left" | "center" | "right";
};

export type MarketingAutoLayout = {
  id: string;
  imageId: string;
  templateId: string;
  templateName: string;
  imageIndex: number;
  imageUrl: string;
  layoutPreviewUrl?: string;
  language: MarketingLanguage;
  copyMode: MarketingCopyMode;
  title: string;
  layers: MarketingEditorLayer[];
  original_reference: ImageReference;
  product_identity: ProductIdentity;
  design_lock: DesignLock;
  generatedAt: string;
};

export type MarketingAsset = {
  id: string;
  productId: string;
  imageId: string;
  copyText: string;
  template: MarketingTemplate;
  version: string;
  language: MarketingLanguage;
  layout: MarketingAutoLayout;
  original_reference: ImageReference;
  product_identity: ProductIdentity;
  design_lock: DesignLock;
  createdAt: string;
};

export type ReferenceGenerationPrompt = {
  systemPrompt: string;
  userPrompt: string;
  targetRegion?: ProductMaskRegion;
  lockSummary: string[];
  lightingRules: LightingKnowledgeRule[];
};

export type ProductAnalysis = {
  productName: string;
  category: string;
  marketplace: Marketplace;
  imageReferenceMode: "enabled";
  productIdentity: ProductIdentity;
  designLock: DesignLock;
  opportunityScore: number;
  targetBuyer: string;
  positioning: string;
  painPoints: string[];
  competitorSignals: string[];
  designLevers: string[];
  complianceNotes: string[];
  estimatedPriceBand: string;
};

export type DesignConcept = {
  id: string;
  title: string;
  promise: string;
  rationale: string;
  featureChanges: string[];
  colorPalette: string[];
  manufacturingImpact: "Low" | "Medium" | "High";
  listingAngle: string;
  score: number;
  risks: string[];
};

export type MaterialRecommendation = {
  conceptId: string;
  materialFamily: string;
  finish: string;
  shellMaterial: string;
  surfaceTreatment: string;
  durability: string;
  sustainability: string;
  costSignal: string;
  supplierBrief: string[];
  complianceChecks: string[];
};

export type EngineeringDrawingView = {
  id: string;
  index: number;
  title: string;
  viewType: "front" | "side" | "top" | "exploded";
  imageUrl: string;
  resolution: string;
  scale: string;
  drawingNotes: string[];
  original_reference?: ImageReference;
  product_identity?: ProductIdentity;
  design_lock?: DesignLock;
};

export type EngineeringExplodedPart = {
  order: number;
  name: string;
  material: string;
  role: string;
  editableScope: string;
};

export type DesignVersionKind = "product-design" | "color-edit" | "material-library" | "material-edit" | "amazon-images" | "engineering" | "marketing-layout";

export type DesignVersion = {
  id: string;
  label: string;
  kind: DesignVersionKind;
  createdAt: string;
  originalImageUrl: string;
  prompt: string;
  targetRegion: ProductMaskRegion | null;
  productIdentity: ProductIdentity;
  designLock: DesignLock;
  resultTitle: string;
  resultImageUrl: string;
  resultPreviewUrl?: string;
  resultCount?: number;
};

export type SavedProject = {
  id: string;
  sellerName: string;
  marketplace: Marketplace;
  product: UploadedProduct;
  productIdentity: ProductIdentity | null;
  designLock: DesignLock | null;
  analysis: ProductAnalysis | null;
  concepts: DesignConcept[];
  material: MaterialRecommendation | null;
  engineeringViews?: EngineeringDrawingView[];
  engineeringParts?: EngineeringExplodedPart[];
  designVersions?: DesignVersion[];
  marketingCopy?: MarketingCopy | null;
  marketingAssets?: MarketingAsset[];
  marketingTemplates?: MarketingTemplate[];
  savedAt: string;
  status: "Draft" | "Ready for sampling";
};
