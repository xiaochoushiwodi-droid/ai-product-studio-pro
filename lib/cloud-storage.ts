import { list, put } from "@vercel/blob";
import { makeId } from "@/lib/utils";
import type { CloudProjectSaveResult, CloudStoredAsset, SavedProject } from "@/types/product";

export class CloudStorageError extends Error {
  constructor(
    public code: "CLOUD_STORAGE_NOT_CONFIGURED" | "CLOUD_STORAGE_SAVE_FAILED",
    message: string,
    public status = 503
  ) {
    super(message);
    this.name = "CloudStorageError";
  }
}

export async function saveProjectToCloud(project: SavedProject): Promise<CloudProjectSaveResult> {
  const token = requireBlobToken();
  const savedAt = new Date().toISOString();
  const prefix = `togo-ai/projects/${safePath(project.marketplace)}/${safePath(project.id)}`;
  const assets: CloudStoredAsset[] = [];

  const originalImage = await putImageAsset({
    token,
    path: `${prefix}/original/${safePath(project.product.fileName || "original-product.png")}`,
    imageUrl: project.product.imageUrl,
    kind: "original-image"
  });
  if (originalImage) assets.push(originalImage);

  const generatedImages = await Promise.all(
    getGeneratedImageUrls(project).map((imageUrl, index) =>
      putImageAsset({
        token,
        path: `${prefix}/generated/generated-${String(index + 1).padStart(2, "0")}.png`,
        imageUrl,
        kind: "generated-image"
      })
    )
  );
  assets.push(...generatedImages.filter((asset): asset is CloudStoredAsset => Boolean(asset)));

  const versionHistoryAsset = await putJsonAsset({
    token,
    path: `${prefix}/version-history.json`,
    fileName: "version-history.json",
    kind: "version-history",
    value: {
      projectId: project.id,
      designVersions: project.designVersions ?? [],
      marketingAssets: project.marketingAssets ?? []
    }
  });
  assets.push(versionHistoryAsset);

  const projectAsset = await putJsonAsset({
    token,
    path: `${prefix}/project.json`,
    fileName: "project.json",
    kind: "project-json",
    value: {
      ...project,
      cloud: {
        provider: "vercel-blob",
        savedAt,
        assets
      }
    }
  });

  assets.unshift(projectAsset);

  return {
    provider: "vercel-blob",
    projectId: project.id,
    projectUrl: projectAsset.url,
    assets,
    savedAt
  };
}

export async function listCloudProjects() {
  const token = requireBlobToken();
  return list({
    prefix: "togo-ai/projects/",
    token
  });
}

export function createCloudStorageErrorResponse(error: unknown) {
  if (error instanceof CloudStorageError) {
    return {
      payload: {
        error: error.code,
        message: error.message
      },
      status: error.status
    };
  }

  return {
    payload: {
      error: "CLOUD_STORAGE_SAVE_FAILED",
      message: error instanceof Error ? error.message : "Cloud storage request failed."
    },
    status: 500
  };
}

function requireBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new CloudStorageError(
      "CLOUD_STORAGE_NOT_CONFIGURED",
      "Cloud storage requires BLOB_READ_WRITE_TOKEN. Local project save is still available, but cloud persistence is disabled.",
      503
    );
  }

  return token;
}

async function putJsonAsset(input: {
  token: string;
  path: string;
  fileName: string;
  kind: CloudStoredAsset["kind"];
  value: unknown;
}): Promise<CloudStoredAsset> {
  const body = JSON.stringify(input.value, null, 2);
  const blob = await put(input.path, body, {
    access: "public",
    contentType: "application/json",
    token: input.token
  });

  return {
    id: makeId("cloud-asset"),
    kind: input.kind,
    fileName: input.fileName,
    url: blob.url,
    contentType: "application/json",
    size: body.length,
    createdAt: new Date().toISOString()
  };
}

async function putImageAsset(input: {
  token: string;
  path: string;
  imageUrl: string;
  kind: "original-image" | "generated-image";
}): Promise<CloudStoredAsset | null> {
  if (!input.imageUrl || input.imageUrl.startsWith("/")) {
    return null;
  }

  const image = await imageUrlToBlob(input.imageUrl);
  if (!image) return null;

  const blob = await put(input.path, image.blob, {
    access: "public",
    contentType: image.contentType,
    token: input.token
  });

  return {
    id: makeId("cloud-asset"),
    kind: input.kind,
    fileName: input.path.split("/").at(-1) ?? "image.png",
    url: blob.url,
    contentType: image.contentType,
    size: image.size,
    createdAt: new Date().toISOString()
  };
}

function getGeneratedImageUrls(project: SavedProject) {
  const urls = new Set<string>();

  for (const version of project.designVersions ?? []) {
    if (version.resultImageUrl) urls.add(version.resultImageUrl);
    if (version.resultPreviewUrl) urls.add(version.resultPreviewUrl);
  }

  for (const asset of project.marketingAssets ?? []) {
    if (asset.layout.imageUrl) urls.add(asset.layout.imageUrl);
    if (asset.layout.layoutPreviewUrl) urls.add(asset.layout.layoutPreviewUrl);
  }

  return Array.from(urls).slice(0, 40);
}

async function imageUrlToBlob(imageUrl: string): Promise<{ blob: Blob; contentType: string; size: number } | null> {
  if (imageUrl.startsWith("data:")) {
    const [header, encoded] = imageUrl.split(",", 2);
    const contentType = header.match(/^data:(.*?);base64$/)?.[1] ?? "image/png";
    const buffer = Buffer.from(encoded, "base64");
    const bytes = new Uint8Array(buffer.byteLength);
    bytes.set(buffer);
    return {
      blob: new Blob([bytes], { type: contentType }),
      contentType,
      size: buffer.byteLength
    };
  }

  const response = await fetch(imageUrl);
  if (!response.ok) return null;
  const contentType = response.headers.get("content-type") ?? "image/png";
  const blob = await response.blob();
  return {
    blob,
    contentType,
    size: blob.size
  };
}

function safePath(value: string) {
  return value.trim().replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "asset";
}
