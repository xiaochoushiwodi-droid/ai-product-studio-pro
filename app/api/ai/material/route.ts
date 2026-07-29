import { NextResponse } from "next/server";
import { buildMaterialRecommendation, simulateLatency } from "@/lib/mock-ai";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    conceptId?: string;
    materialFamily?: string;
    finish?: string;
  };

  if (!body.conceptId) {
    return NextResponse.json({ error: "Concept is required" }, { status: 400 });
  }

  await simulateLatency(650);

  return NextResponse.json({
    recommendation: buildMaterialRecommendation({
      conceptId: body.conceptId,
      materialFamily: body.materialFamily || "Recycled Polymer",
      finish: body.finish || "Soft matte"
    })
  });
}
