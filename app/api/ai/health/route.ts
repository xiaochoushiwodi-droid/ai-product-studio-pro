import { NextResponse } from "next/server";
import { getAIEnvironmentStatus } from "@/lib/ai/runtime";

export async function GET() {
  const status = getAIEnvironmentStatus();
  return NextResponse.json(status, { status: status.ready ? 200 : 503 });
}
