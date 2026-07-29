import { NextResponse } from "next/server";
import { buildDesignConcepts, simulateLatency } from "@/lib/mock-ai";
import { createMissingReferenceError, hasStrictDesignLock, hasValidProductIdentity } from "@/lib/image-reference-workflow";
import type { ProductAnalysis } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    analysis?: ProductAnalysis;
  };

  if (
    !body.analysis ||
    !hasValidProductIdentity(body.analysis.productIdentity) ||
    !hasStrictDesignLock(body.analysis.designLock)
  ) {
    return NextResponse.json(createMissingReferenceError("AI设计方案生成"), { status: 400 });
  }

  await simulateLatency(850);

  return NextResponse.json({
    concepts: buildDesignConcepts(body.analysis)
  });
}
