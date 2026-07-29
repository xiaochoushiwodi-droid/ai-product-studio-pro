import { NextResponse } from "next/server";
import { buildColorEditResponse } from "@/lib/color-design";
import { simulateLatency } from "@/lib/mock-ai";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import type { DesignLock, ProductIdentity, ProductMaskRegionId } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    prompt?: string;
    productIdentity?: ProductIdentity;
    designLock?: DesignLock;
    targetRegionId?: ProductMaskRegionId;
  };

  const prompt =
    body.prompt?.trim() ||
    "把玻璃灯罩改成琥珀色、烟灰色、橄榄绿、透明四种玻璃颜色，保持结构、比例、金属环、LED光源、电池和大理石底座不变。";
  const validation = validateReferenceGenerationRequest({
    action: "颜色编辑生成",
    prompt,
    productIdentity: body.productIdentity,
    designLock: body.designLock,
    targetRegionId: body.targetRegionId ?? "shade"
  });

  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

  await simulateLatency(700);

  return NextResponse.json(
    buildColorEditResponse(prompt, {
      productIdentity: validation.productIdentity,
      designLock: validation.designLock,
      targetRegion: validation.targetRegion,
      referencePrompt: validation.referencePrompt
    })
  );
}
