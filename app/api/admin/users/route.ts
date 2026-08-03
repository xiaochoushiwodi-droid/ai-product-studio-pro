import { NextResponse } from "next/server";
import { listAdminUsers, requireAdminCreditUser, updateUserAdminState, type UserRole, type UserStatus } from "@/lib/credits";

export async function GET(request: Request) {
  const admin = await requireAdminCreditUser(request);
  if (!admin.ok) {
    return NextResponse.json(admin.error, { status: admin.status });
  }

  return NextResponse.json({
    users: await listAdminUsers()
  });
}

export async function PATCH(request: Request) {
  const admin = await requireAdminCreditUser(request);
  if (!admin.ok) {
    return NextResponse.json(admin.error, { status: admin.status });
  }

  const body = (await request.json()) as {
    userId?: string;
    role?: UserRole;
    status?: UserStatus;
  };

  if (!body.userId) {
    return NextResponse.json({ error: "USER_ID_REQUIRED", message: "User id is required." }, { status: 400 });
  }

  try {
    const user = await updateUserAdminState({
      userId: body.userId,
      role: body.role,
      status: body.status
    });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "USER_UPDATE_FAILED", message: error instanceof Error ? error.message : "User update failed." },
      { status: 400 }
    );
  }
}
