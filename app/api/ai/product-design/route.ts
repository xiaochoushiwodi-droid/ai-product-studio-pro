import { NextResponse } from "next/server";
import { buildProductDesignResponse } from "@/lib/product-design";
import { simulateLatency } from "@/lib/mock-ai";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    prompt?: string;
  };

  await simulateLatency(900);

  return NextResponse.json(
    buildProductDesignResponse(
      body.prompt?.trim() ||
        "把底座改成6种石材方案：Calacatta Viola、Calacatta Gold、Indian Green、Nero Marquina、Travertine、White Onyx。"
    )
  );
}
