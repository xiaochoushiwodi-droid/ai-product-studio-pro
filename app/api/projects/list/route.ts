import { NextResponse } from "next/server";
import { createCloudStorageErrorResponse, listCloudProjects } from "@/lib/cloud-storage";

export async function GET() {
  try {
    const result = await listCloudProjects();
    return NextResponse.json({
      projects: result.blobs
    });
  } catch (error) {
    const response = createCloudStorageErrorResponse(error);
    return NextResponse.json(response.payload, { status: response.status });
  }
}
