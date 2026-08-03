import { NextResponse } from "next/server";
import { listCreditCosts, requireAdminCreditUser, updateCreditCost, type CreditFeature } from "@/lib/credits";

export async function GET(request: Request) {
  const admin = await requireAdminCreditUser(request);
  if (!admin.ok) {
    return NextResponse.json(admin.error, { status: admin.status });
  }

  return NextResponse.json({
    costs: await listCreditCosts()
  });
}

export async function PATCH(request: Request) {
  const admin = await requireAdminCreditUser(request);
  if (!admin.ok) {
    return NextResponse.json(admin.error, { status: admin.status });
  }

  const body = (await request.json()) as {
    feature?: CreditFeature;
    credits?: number;
  };

  const credits = body.credits;
  if (!body.feature || typeof credits !== "number" || !Number.isInteger(credits)) {
    return NextResponse.json(
      { error: "INVALID_CREDIT_COST", message: "Feature and integer credits are required." },
      { status: 400 }
    );
  }

  try {
    const cost = await updateCreditCost(body.feature, credits);
    return NextResponse.json({ cost });
  } catch (error) {
    return NextResponse.json(
      { error: "CREDIT_COST_UPDATE_FAILED", message: error instanceof Error ? error.message : "Credit setting update failed." },
      { status: 400 }
    );
  }
}
