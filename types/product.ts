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
  allowedEdits: AllowedProductEdit[];
  forbiddenChanges: string[];
  validationRule: string;
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
};

export type EngineeringExplodedPart = {
  order: number;
  name: string;
  material: string;
  role: string;
  editableScope: string;
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
  savedAt: string;
  status: "Draft" | "Ready for sampling";
};
