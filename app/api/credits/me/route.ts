import { NextResponse } from "next/server";
import { getCreditActivity, getRequestCreditUser, listCreditCosts, listPricingPlans } from "@/lib/credits";

export async function GET(request: Request) {
  const userResult = await getRequestCreditUser(request);
  if (!userResult.ok) {
    return NextResponse.json(userResult.error, { status: userResult.status });
  }

  const [activity, plans, costs] = await Promise.all([
    getCreditActivity(userResult.user.id),
    listPricingPlans(),
    listCreditCosts()
  ]);

  return NextResponse.json({
    user: userResult.user,
    plans,
    costs,
    ...activity
  });
}
