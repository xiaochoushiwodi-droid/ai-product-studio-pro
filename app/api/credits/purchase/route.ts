import { NextResponse } from "next/server";
import { getRequestCreditUser, purchasePricingPlan } from "@/lib/credits";

export async function POST(request: Request) {
  const userResult = await getRequestCreditUser(request);
  if (!userResult.ok) {
    return NextResponse.json(userResult.error, { status: userResult.status });
  }

  const body = (await request.json()) as {
    planSlug?: string;
    provider?: "manual" | "stripe" | "alipay" | "wechat";
    externalId?: string;
  };

  if (!body.planSlug) {
    return NextResponse.json({ error: "PLAN_REQUIRED", message: "Pricing plan slug is required." }, { status: 400 });
  }

  try {
    const result = await purchasePricingPlan({
      email: userResult.user.email,
      planSlug: body.planSlug,
      provider: body.provider ?? "stripe",
      externalId: body.externalId
    });

    return NextResponse.json(result, { status: result.status === "CREDITS_ADDED" ? 200 : 501 });
  } catch (error) {
    return NextResponse.json(
      { error: "CREDIT_PURCHASE_FAILED", message: error instanceof Error ? error.message : "Credit purchase failed." },
      { status: 400 }
    );
  }
}
