import { NextResponse } from "next/server";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import { withCreditGuard } from "@/lib/credits";
import { buildMarketingCopyResponse, buildMarketingLayoutResponse } from "@/lib/marketing-studio";
import { simulateLatency } from "@/lib/mock-ai";
import { resolveReferenceGenerationPayload, type ReferenceGenerationPayload } from "@/lib/reference-generation-payload";
import type { MarketingCopy, MarketingCopyMode, MarketingLanguage } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as ReferenceGenerationPayload & {
    copy?: MarketingCopy | null;
    mode?: MarketingCopyMode;
    language?: MarketingLanguage;
  };
  const prompt = body.prompt?.trim() || "Auto layout Amazon marketing images. Use original product reference and program-rendered text overlays only.";
  const resolved = resolveReferenceGenerationPayload(body);
  const validation = validateReferenceGenerationRequest({
    action: "AI Marketing Auto Layout",
    prompt,
    originalReference: resolved.originalReference,
    productIdentity: resolved.productIdentity,
    designLock: resolved.designLock,
    targetRegionId: "scene"
  });

  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

  const mode = body.mode ?? body.copy?.mode ?? "amazon-conversion";
  const language = body.language ?? body.copy?.language ?? "en";

  return withCreditGuard(
    request,
    {
      feature: "marketing_layout",
      model: "marketing-layout-engine",
      metadata: {
        productType: validation.productIdentity.productType,
        mode,
        language
      }
    },
    async () => {
      await simulateLatency(650);

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
  );
}
