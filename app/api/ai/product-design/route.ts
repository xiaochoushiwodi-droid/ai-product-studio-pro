import { NextResponse } from "next/server";
import { buildProductDesignResponse } from "@/lib/product-design";
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
    return NextResponse.json(createMissingReferenceError("AI产品设计生成"), { status: 400 });
  }

  await simulateLatency(900);

  return NextResponse.json(
    buildProductDesignResponse(
      body.prompt?.trim() ||
        "把底座改成6种石材方案：Calacatta Viola、Calacatta Gold、Indian Green、Nero Marquina、Travertine、White Onyx。",
      {
        productIdentity: body.productIdentity,
        designLock: body.designLock
      }
    )
  );
}
