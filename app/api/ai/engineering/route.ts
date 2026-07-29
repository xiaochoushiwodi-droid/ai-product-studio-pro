import { NextResponse } from "next/server";
import { buildEngineeringDrawingResponse } from "@/lib/engineering-drawings";
import { simulateLatency } from "@/lib/mock-ai";
import { createMissingReferenceError, hasStrictDesignLock, hasValidProductIdentity } from "@/lib/image-reference-workflow";
import type { DesignLock, ProductIdentity } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    productName?: string;
    productIdentity?: ProductIdentity;
    designLock?: DesignLock;
  };

  if (!hasValidProductIdentity(body.productIdentity) || !hasStrictDesignLock(body.designLock)) {
    return NextResponse.json(createMissingReferenceError("工程尺寸图生成"), { status: 400 });
  }

  await simulateLatency(650);

  return NextResponse.json(
    buildEngineeringDrawingResponse(body.productName?.trim() || "台灯", {
      productIdentity: body.productIdentity,
      designLock: body.designLock
    })
  );
}
