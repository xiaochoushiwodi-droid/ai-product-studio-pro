import { NextResponse } from "next/server";
import { buildAmazonListingImageResponse } from "@/lib/amazon-images";
import { simulateLatency } from "@/lib/mock-ai";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    productName?: string;
  };

  await simulateLatency(850);

  return NextResponse.json(buildAmazonListingImageResponse(body.productName?.trim() || "台灯"));
}
