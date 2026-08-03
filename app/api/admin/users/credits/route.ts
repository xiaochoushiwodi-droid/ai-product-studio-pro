import { NextResponse } from "next/server";
import { adjustUserCredits, requireAdminCreditUser } from "@/lib/credits";

export async function POST(request: Request) {
  const admin = await requireAdminCreditUser(request);
  if (!admin.ok) {
    return NextResponse.json(admin.error, { status: admin.status });
  }

  const body = (await request.json()) as {
    userId?: string;
    amount?: number;
    description?: string;
  };

  const amount = body.amount;
  if (!body.userId || typeof amount !== "number" || !Number.isInteger(amount) || amount === 0) {
    return NextResponse.json(
      { error: "INVALID_CREDIT_ADJUSTMENT", message: "User id and non-zero integer amount are required." },
      { status: 400 }
    );
  }

  try {
    const user = await adjustUserCredits({
      userId: body.userId,
      amount,
      description: body.description ?? `Admin credit adjustment by ${admin.user.email}`
    });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "CREDIT_ADJUSTMENT_FAILED", message: error instanceof Error ? error.message : "Credit adjustment failed." },
      { status: 400 }
    );
  }
}
