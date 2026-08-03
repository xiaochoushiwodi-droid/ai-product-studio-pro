import type { ProductAnalysis } from "@/types/product";

export function buildAnalyzeProductResponse(analysis: ProductAnalysis) {
  return {
    analysis,
    productIdentityJson: analysis.productIdentity.rawVisionJson,
    product_identity: analysis.productIdentity,
    design_lock: analysis.designLock,
    aiDebug: analysis.aiDebug
  };
}
