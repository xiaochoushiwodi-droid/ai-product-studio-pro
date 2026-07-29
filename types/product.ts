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
  uploadedAt: string;
};

export type ProductAnalysis = {
  productName: string;
  category: string;
  marketplace: Marketplace;
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
  analysis: ProductAnalysis | null;
  concepts: DesignConcept[];
  material: MaterialRecommendation | null;
  engineeringViews?: EngineeringDrawingView[];
  engineeringParts?: EngineeringExplodedPart[];
  savedAt: string;
  status: "Draft" | "Ready for sampling";
};
