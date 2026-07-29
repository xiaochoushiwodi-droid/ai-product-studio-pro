import { NextResponse } from "next/server";
import { buildColorEditResponse } from "@/lib/color-design";
import { simulateLatency } from "@/lib/mock-ai";
import { createMissingReferenceError, hasStrictDesignLock, hasValidProductIdentity } from "@/lib/image-reference-workflow";
import type { DesignLock, ProductIdentity } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    prompt?: string;
    productIdentity?: ProductIdentity;
    designLock?: DesignLock;
  };

  if (!hasValidProductIdentity(body.productIdentity) || !hasStrictDesignLock(body.designLock)) {
    return NextResponse.json(createMissingReferenceError("颜色编辑生成"), { status: 400 });
  }

  await simulateLatency(700);

  return NextResponse.json(
    buildColorEditResponse(
      body.prompt?.trim() ||
        "把玻璃灯罩改成琥珀色、烟灰色、橄榄绿、透明四种玻璃颜色，保持结构、比例、金属环、LED光源、电池和大理石底座不变。",
      {
        productIdentity: body.productIdentity,
        designLock: body.designLock
      }
    )
  );
}
