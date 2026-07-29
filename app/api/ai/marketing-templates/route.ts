import { NextResponse } from "next/server";
import { amazonMarketingTemplates } from "@/lib/marketing-studio";

export async function GET() {
  return NextResponse.json({
    table: "Template",
    templates: amazonMarketingTemplates,
    marketplace: "Amazon US"
  });
}
