import { NextResponse } from "next/server";
import { buildProductAnalysis, simulateLatency } from "@/lib/mock-ai";
import type { Marketplace } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    productName?: string;
    category?: string;
    marketplace?: Marketplace;
  };

  await simulateLatency();

  const analysis = buildProductAnalysis({
    productName: body.productName?.trim() || "Untitled product",
    category: body.category || "Kitchen & Dining",
    marketplace: body.marketplace || "US"
  });

  return NextResponse.json({ analysis });
}
