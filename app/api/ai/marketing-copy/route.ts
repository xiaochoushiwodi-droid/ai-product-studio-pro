import { NextResponse } from "next/server";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import { withCreditGuard } from "@/lib/credits";
import { buildMarketingCopyResponse } from "@/lib/marketing-studio";
import { simulateLatency } from "@/lib/mock-ai";
import { resolveReferenceGenerationPayload, type ReferenceGenerationPayload } from "@/lib/reference-generation-payload";
import type { MarketingCopyMode, MarketingLanguage } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as ReferenceGenerationPayload & {
    mode?: MarketingCopyMode;
    language?: MarketingLanguage;
  };
  const prompt = body.prompt?.trim() || "Generate Amazon marketing copy from Product Identity JSON. Preserve existing product identity. Use US Amazon consumer language.";
  const resolved = resolveReferenceGenerationPayload(body);
  const validation = validateReferenceGenerationRequest({
    action: "AI Marketing Copy",
    prompt,
    originalReference: resolved.originalReference,
    productIdentity: resolved.productIdentity,
    designLock: resolved.designLock,
    targetRegionId: "scene"
  });

  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

  return withCreditGuard(
    request,
    {
      feature: "marketing_copy",
      model: "marketing-copy-engine",
      metadata: {
        productType: validation.productIdentity.productType,
        mode: body.mode ?? "amazon-conversion",
        language: body.language ?? "en"
      }
    },
    async () => {
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
  );
}
