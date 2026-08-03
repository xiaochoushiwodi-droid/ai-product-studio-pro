import { checkProductConsistencyWithVision } from "@/lib/ai/vision-provider";
import { AIProviderError, allowMockAI, requireOpenAIKey } from "@/lib/ai/runtime";
import { createOpenAIEditMaskBlob } from "@/lib/ai/mask-image";
import { makeId } from "@/lib/utils";
import type {
  DesignLock,
  ImageProviderName,
  ImageReference,
  ProductImageEditVariant,
  ProductIdentity,
  ProductMaskRegion,
  ProductConsistencyReport,
  VisionProviderName
} from "@/types/product";

export type ProductImageEditRequest = {
  originalReference: ImageReference;
  productIdentity: ProductIdentity;
  designLock: DesignLock;
  prompt: string;
  targetRegion?: ProductMaskRegion | null;
  variantCount?: number;
  imageProviderName?: ImageProviderName;
  visionProviderName?: VisionProviderName;
  resolution?: string;
  amazonMode?: boolean;
};

export type ProductImageEditResult = {
  imageToImageMode: true;
  source: ImageProviderName;
  modelName: string;
  variants: ProductImageEditVariant[];
  rejectedReports: ProductConsistencyReport[];
  message?: string;
};

export interface ImageProvider {
  name: ImageProviderName;
  editProductImage(input: ProductImageEditRequest): Promise<ProductImageEditResult>;
}

const defaultImageProvider: ImageProviderName = "openai-image";
const defaultOpenAIImageModel = "gpt-image-1";
const defaultImageSize = "1024x1024";

export function getImageProvider(providerName?: ImageProviderName): ImageProvider {
  const provider = providerName ?? normalizeImageProviderName(process.env.AI_IMAGE_PROVIDER) ?? defaultImageProvider;

  if (provider === "openai-image") {
    return new OpenAIImageProvider();
  }

  return new PlaceholderImageProvider(provider);
}

export async function editProductImageWithProvider(input: ProductImageEditRequest): Promise<ProductImageEditResult> {
  return getImageProvider(input.imageProviderName).editProductImage(input);
}

class OpenAIImageProvider implements ImageProvider {
  name: ImageProviderName = "openai-image";

  async editProductImage(input: ProductImageEditRequest): Promise<ProductImageEditResult> {
    const apiKey = allowMockAI() && !process.env.OPENAI_API_KEY ? "" : requireOpenAIKey("Image Edit API");
    const modelName = process.env.OPENAI_IMAGE_MODEL ?? defaultOpenAIImageModel;
    const variantCount = clampVariantCount(input.variantCount);

    if (!apiKey) {
      return buildMockEditResult(input, "mock-fallback", `${modelName}-mock`, "OPENAI_API_KEY is not configured. ALLOW_MOCK_AI=true returned reference-preserving mock variants.");
    }

    try {
      const formData = new FormData();
      const imageBlob = await imageUrlToBlob(input.originalReference.imageUrl);
      const outputSize = process.env.OPENAI_IMAGE_SIZE ?? defaultImageSize;
      formData.append("model", modelName);
      formData.append("image", imageBlob, input.originalReference.fileName || "original-product.png");
      if (input.targetRegion && input.targetRegion.id !== "scene") {
        const maskBlob = createOpenAIEditMaskBlob(input.targetRegion, getSquareMaskSize(outputSize));
        formData.append("mask", maskBlob, `${input.targetRegion.id}-edit-mask.png`);
      }
      formData.append("prompt", buildImageToImagePrompt(input));
      formData.append("n", String(variantCount));
      formData.append("size", outputSize);

      const response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorBody = await response.text();
        if (allowMockAI()) {
          return buildMockEditResult(input, "mock-fallback", `${modelName}-fallback`, `OpenAI image edit failed with ${response.status}: ${errorBody.slice(0, 240)}`);
        }
        throw new AIProviderError("IMAGE_EDIT_API_FAILED", `OpenAI Image Edit API failed with ${response.status}.`, 502, {
          status: response.status,
          body: errorBody.slice(0, 500)
        });
      }

      const data = (await response.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
      const generatedImages = (data.data ?? [])
        .map((item) => item.b64_json ? `data:image/png;base64,${item.b64_json}` : item.url)
        .filter((value): value is string => Boolean(value));

      const generatedAt = new Date().toISOString();
      const variants: ProductImageEditVariant[] = [];
      const rejectedReports: ProductConsistencyReport[] = [];

      for (const [index, imageUrl] of generatedImages.entries()) {
        const consistency = await checkProductConsistencyWithVision({
          originalReference: input.originalReference,
          generatedImageUrl: imageUrl,
          productIdentity: input.productIdentity,
          designLock: input.designLock,
          prompt: input.prompt,
          providerName: input.visionProviderName
        });

        if (!consistency.passed) {
          rejectedReports.push(consistency);
          continue;
        }

        variants.push(buildVariant({
          input,
          imageUrl,
          index,
          source: this.name,
          modelName,
          generatedAt,
          consistency
        }));
      }

      return {
        imageToImageMode: true,
        source: this.name,
        modelName,
        variants,
        rejectedReports,
        message: rejectedReports.length > 0 ? "Some generated images were hidden because structure consistency failed." : "OpenAI image-to-image edit completed."
      };
    } catch (error) {
      if (allowMockAI()) {
        return buildMockEditResult(input, "mock-fallback", `${modelName}-fallback`, error instanceof Error ? error.message : "OpenAI image edit failed.");
      }
      if (error instanceof AIProviderError) throw error;
      throw new AIProviderError("IMAGE_EDIT_API_FAILED", error instanceof Error ? error.message : "OpenAI image edit failed.", 502);
    }
  }
}

class PlaceholderImageProvider implements ImageProvider {
  constructor(public name: ImageProviderName) {}

  async editProductImage(input: ProductImageEditRequest): Promise<ProductImageEditResult> {
    if (!allowMockAI()) {
      throw new AIProviderError(
        "AI_PROVIDER_NOT_CONFIGURED",
        `${this.name} image provider is registered but not configured. Select OpenAI Image API or enable a real provider adapter.`,
        503
      );
    }

    return buildMockEditResult(
      input,
      "mock-fallback",
      `${this.name}-image-not-configured`,
      `${this.name} is registered in the unified Image Provider interface but not configured yet. Returned reference-preserving mock variants.`
    );
  }
}

function buildImageToImagePrompt(input: ProductImageEditRequest) {
  return [
    "IMAGE-TO-IMAGE EDIT ONLY.",
    "Use the attached Original Product Image as the exact visual reference.",
    "Do not generate a new product from text.",
    "",
    "User instruction:",
    input.prompt,
    "",
    input.targetRegion ? `Target editable region: ${input.targetRegion.label}. ${input.targetRegion.promptHint}` : "Target editable region: use only Product Identity editable areas.",
    input.targetRegion && input.targetRegion.id !== "scene"
      ? "A transparent PNG edit mask is attached. Edit only the transparent mask area; all opaque pixels must remain unchanged."
      : "No component mask is attached because this is a scene/background request; preserve the complete product.",
    "",
    "Preserve original:",
    "- product contour and silhouette",
    "- lamp shade shape and dimensions",
    "- base proportions",
    "- metal component position",
    "- component count and structure",
    "- camera angle and perspective",
    "",
    "Only modify:",
    input.designLock.allowedEdits.map((item) => `- ${item}`).join("\n"),
    "",
    "Product Identity JSON:",
    JSON.stringify(input.productIdentity.rawVisionJson),
    "",
    input.amazonMode ? "Amazon mode: product must remain 100% identical; only background, scene, and non-product overlays may change." : "Industrial design mode: keep all locked areas unchanged."
  ].join("\n");
}

function buildMockEditResult(input: ProductImageEditRequest, source: ImageProviderName, modelName: string, message: string): ProductImageEditResult {
  const generatedAt = new Date().toISOString();
  const variantCount = clampVariantCount(input.variantCount);
  const consistency = buildPassingConsistencyReport(message, "mock-fallback");

  return {
    imageToImageMode: true,
    source,
    modelName,
    variants: Array.from({ length: variantCount }, (_, index) =>
      buildVariant({
        input,
        imageUrl: input.originalReference.imageUrl,
        index,
        source,
        modelName,
        generatedAt,
        consistency
      })
    ),
    rejectedReports: [],
    message
  };
}

function buildVariant(input: {
  input: ProductImageEditRequest;
  imageUrl: string;
  index: number;
  source: ImageProviderName;
  modelName: string;
  generatedAt: string;
  consistency: ProductConsistencyReport;
}): ProductImageEditVariant {
  return {
    id: makeId("image-edit"),
    index: input.index + 1,
    title: `Image Edit ${String(input.index + 1).padStart(2, "0")}`,
    imageUrl: input.imageUrl,
    resolution: input.input.resolution ?? "1024 x 1024",
    prompt: input.input.prompt,
    source: input.source,
    modelName: input.modelName,
    imageToImageMode: true,
    original_reference: input.input.originalReference,
    product_identity: input.input.productIdentity,
    design_lock: input.input.designLock,
    consistency: input.consistency,
    generatedAt: input.generatedAt
  };
}

function buildPassingConsistencyReport(reason: string, provider: VisionProviderName): ProductConsistencyReport {
  return {
    passed: true,
    checks: {
      productContourConsistent: true,
      shadeShapeConsistent: true,
      baseProportionConsistent: true,
      metalPositionConsistent: true
    },
    reason,
    modelName: provider === "mock-fallback" ? "local-reference-check" : process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
    provider
  };
}

async function imageUrlToBlob(imageUrl: string) {
  if (imageUrl.startsWith("data:")) {
    const [header, encoded] = imageUrl.split(",", 2);
    const mime = header.match(/^data:(.*?);base64$/)?.[1] ?? "image/png";
    return new Blob([Buffer.from(encoded, "base64")], { type: mime });
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Unable to download source image for image-to-image edit: ${response.status}`);
  }

  return response.blob();
}

function clampVariantCount(value: number | undefined) {
  if (!value || !Number.isFinite(value)) return 3;
  return Math.min(Math.max(Math.floor(value), 3), 6);
}

function getSquareMaskSize(size: string) {
  const parsed = Number(size.split("x")[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1024;
}

export function normalizeImageProviderName(value: string | undefined): ImageProviderName | null {
  if (value === "openai-image" || value === "qwen-wanxiang" || value === "flux" || value === "mock-fallback") {
    return value;
  }

  return null;
}
