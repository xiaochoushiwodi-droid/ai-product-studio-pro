import { NextResponse } from "next/server";
import { buildEngineeringDrawingResponse } from "@/lib/engineering-drawings";
import { simulateLatency } from "@/lib/mock-ai";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    productName?: string;
  };

  await simulateLatency(650);

  return NextResponse.json(buildEngineeringDrawingResponse(body.productName?.trim() || "台灯"));
}
