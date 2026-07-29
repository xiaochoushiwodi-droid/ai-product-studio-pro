import { NextResponse } from "next/server";
import { buildDesignConcepts, simulateLatency } from "@/lib/mock-ai";
import type { ProductAnalysis } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    analysis?: ProductAnalysis;
  };

  if (!body.analysis) {
    return NextResponse.json({ error: "Analysis is required" }, { status: 400 });
  }

  await simulateLatency(850);

  return NextResponse.json({
    concepts: buildDesignConcepts(body.analysis)
  });
}
