import { NextResponse } from "next/server";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import { buildMarketingCopyResponse } from "@/lib/marketing-studio";
import { simulateLatency } from "@/lib/mock-ai";
import type { DesignLock, MarketingCopyMode, MarketingLanguage, ProductIdentity } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    productName?: string;
    productIdentity?: ProductIdentity;
    designLock?: DesignLock;
    mode?: MarketingCopyMode;
    language?: MarketingLanguage;
  };

  const prompt = "Generate Amazon marketing copy from Product Identity JSON. Preserve existing product identity. Use US Amazon consumer language.";
  const validation = validateReferenceGenerationRequest({
    action: "AI Marketing Copy",
    prompt,
    productIdentity: body.productIdentity,
    designLock: body.designLock,
    targetRegionId: "scene"
  });

  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

  await simulateLatency(550);

  return NextResponse.json(
    buildMarketingCopyResponse({
      productName: body.productName?.trim() || validation.productIdentity.productType,
      productIdentity: validation.productIdentity,
      designLock: validation.designLock,
      mode: body.mode ?? "amazon-conversion",
      language: body.language ?? "en"
    })
  );
}
