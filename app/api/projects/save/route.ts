import { NextResponse } from "next/server";
import { createCloudStorageErrorResponse, saveProjectToCloud } from "@/lib/cloud-storage";
import type { SavedProject } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    project?: SavedProject;
  };

  if (!body.project?.id || !body.project.product) {
    return NextResponse.json({
      error: "INVALID_PROJECT_PAYLOAD",
      message: "Cloud save requires a complete SavedProject payload."
    }, { status: 400 });
  }

  try {
    const result = await saveProjectToCloud(body.project);
    return NextResponse.json({
      cloud: result
    });
  } catch (error) {
    const response = createCloudStorageErrorResponse(error);
    return NextResponse.json(response.payload, { status: response.status });
  }
}
