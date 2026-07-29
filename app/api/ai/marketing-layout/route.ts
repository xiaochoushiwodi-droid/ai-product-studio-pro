import { NextResponse } from "next/server";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import { buildMarketingCopyResponse, buildMarketingLayoutResponse } from "@/lib/marketing-studio";
import { simulateLatency } from "@/lib/mock-ai";
import type {
  DesignLock,
  MarketingCopy,
  MarketingCopyMode,
  MarketingLanguage,
  ProductIdentity
} from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    productName?: string;
    productIdentity?: ProductIdentity;
    designLock?: DesignLock;
    copy?: MarketingCopy | null;
    mode?: MarketingCopyMode;
    language?: MarketingLanguage;
  };

  const prompt = "Auto layout Amazon marketing images. Use original product reference and program-rendered text overlays only.";
  const validation = validateReferenceGenerationRequest({
    action: "AI Marketing Auto Layout",
    prompt,
    productIdentity: body.productIdentity,
    designLock: body.designLock,
    targetRegionId: "scene"
  });

  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

  await simulateLatency(650);

  const mode = body.mode ?? body.copy?.mode ?? "amazon-conversion";
  const language = body.language ?? body.copy?.language ?? "en";
  const copy =
    body.copy ??
    buildMarketingCopyResponse({
      productName: body.productName?.trim() || validation.productIdentity.productType,
      productIdentity: validation.productIdentity,
      designLock: validation.designLock,
      mode,
      language
    }).copy;

  return NextResponse.json(
    buildMarketingLayoutResponse({
      productName: body.productName?.trim() || validation.productIdentity.productType,
      productIdentity: validation.productIdentity,
      designLock: validation.designLock,
      copy,
      mode,
      language
    })
  );
}
