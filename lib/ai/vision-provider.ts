import { buildFallbackVisionIdentityJson } from "@/lib/image-reference-workflow";
import { AIProviderError, allowMockAI, requireOpenAIKey } from "@/lib/ai/runtime";
import type {
  DesignLock,
  ImageReference,
  ProductConsistencyReport,
  ProductIdentity,
  VisionProductIdentityJson,
  VisionProviderName
} from "@/types/product";

export type VisionProviderRequest = {
  productName: string;
  category: string;
  imageReference: ImageReference;
  providerName?: VisionProviderName;
};

export type VisionProviderResult = {
  identityJson: VisionProductIdentityJson | null;
  source: VisionProviderName;
  modelName: string;
  message?: string;
};

export type ProductConsistencyRequest = {
  originalReference: ImageReference;
  generatedImageUrl: string;
  productIdentity: ProductIdentity;
  designLock: DesignLock;
  prompt: string;
  providerName?: VisionProviderName;
};

export interface VisionProvider {
  name: VisionProviderName;
  analyzeProduct(input: VisionProviderRequest): Promise<VisionProviderResult>;
  checkProductConsistency(input: ProductConsistencyRequest): Promise<ProductConsistencyReport>;
}

type RawVisionProductPart = {
  name?: string;
  shape?: string;
  material?: string;
  color?: string;
  position?: string;
  locked?: boolean;
};

type RawVisionIdentityJson = {
  productType?: string;
  designStyle?: string;
  brandPositioning?: string;
  parts?: RawVisionProductPart[];
  materials?: string[];
  dimensions?: {
    estimatedHeight?: string;
    widthRatio?: string;
    componentRatio?: string;
  };
  editableAreas?: string[];
  lockedAreas?: string[];
  camera?: {
    angle?: string;
    view?: string;
    lighting?: string;
  };
};

type RawConsistencyJson = {
  productContourConsistent?: boolean;
  shadeShapeConsistent?: boolean;
  baseProportionConsistent?: boolean;
  metalPositionConsistent?: boolean;
  reason?: string;
};

const defaultVisionProvider: VisionProviderName = "openai";
const defaultOpenAIModel = "gpt-4o-mini";

export function getVisionProvider(providerName?: VisionProviderName): VisionProvider {
  const provider = providerName ?? normalizeVisionProviderName(process.env.AI_VISION_PROVIDER) ?? defaultVisionProvider;

  if (provider === "openai") {
    return new OpenAIVisionProvider();
  }

  return new PlaceholderVisionProvider(provider);
}

export async function analyzeProductImageWithVision(input: VisionProviderRequest): Promise<VisionProviderResult> {
  return getVisionProvider(input.providerName).analyzeProduct(input);
}

export async function checkProductConsistencyWithVision(input: ProductConsistencyRequest): Promise<ProductConsistencyReport> {
  return getVisionProvider(input.providerName).checkProductConsistency(input);
}

class OpenAIVisionProvider implements VisionProvider {
  name: VisionProviderName = "openai";

  async analyzeProduct(input: VisionProviderRequest): Promise<VisionProviderResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    const modelName = process.env.OPENAI_VISION_MODEL ?? defaultOpenAIModel;

    if (!apiKey) {
      if (allowMockAI()) {
        return fallbackResult(input, "mock-fallback", modelName, "OPENAI_API_KEY is not configured. ALLOW_MOCK_AI=true enabled local fallback Product Identity.");
      }
      throw new AIProviderError("OPENAI_API_KEY_REQUIRED", "Vision API requires OPENAI_API_KEY. Mock fallback is disabled by default.", 503);
    }

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelName,
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: buildVisionPrompt(input.productName, input.category)
                },
                {
                  type: "input_image",
                  image_url: input.imageReference.imageUrl,
                  detail: "high"
                }
              ]
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "product_identity_json",
              strict: true,
              schema: productIdentitySchema
            }
          },
          max_output_tokens: 1800
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        if (allowMockAI()) {
          return fallbackResult(input, "mock-fallback", modelName, `OpenAI vision request failed with ${response.status}: ${errorBody.slice(0, 240)}`);
        }
        throw new AIProviderError("VISION_API_FAILED", `OpenAI Vision API failed with ${response.status}.`, 502, {
          status: response.status,
          body: errorBody.slice(0, 500)
        });
      }

      const data = (await response.json()) as unknown;
      const outputText = extractOutputText(data);
      const parsed = JSON.parse(stripJsonFence(outputText)) as RawVisionIdentityJson;

      return {
        identityJson: normalizeVisionIdentityJson(parsed, input),
        source: "openai",
        modelName,
        message: "OpenAI vision analysis completed from the uploaded original image."
      };
    } catch (error) {
      if (allowMockAI()) {
        return fallbackResult(input, "mock-fallback", modelName, error instanceof Error ? error.message : "OpenAI vision analysis failed.");
      }
      if (error instanceof AIProviderError) throw error;
      throw new AIProviderError("VISION_API_FAILED", error instanceof Error ? error.message : "OpenAI vision analysis failed.", 502);
    }
  }

  async checkProductConsistency(input: ProductConsistencyRequest): Promise<ProductConsistencyReport> {
    const apiKey = allowMockAI() && !process.env.OPENAI_API_KEY ? "" : requireOpenAIKey("Consistency Check");
    const modelName = process.env.OPENAI_VISION_MODEL ?? defaultOpenAIModel;

    if (!apiKey) {
      return buildPassingConsistencyReport("OpenAI consistency check skipped because ALLOW_MOCK_AI=true.", modelName, "mock-fallback");
    }

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelName,
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: buildConsistencyPrompt(input)
                },
                {
                  type: "input_image",
                  image_url: input.originalReference.imageUrl,
                  detail: "high"
                },
                {
                  type: "input_image",
                  image_url: input.generatedImageUrl,
                  detail: "high"
                }
              ]
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "product_consistency_report",
              strict: true,
              schema: consistencySchema
            }
          },
          max_output_tokens: 800
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new AIProviderError("CONSISTENCY_CHECK_FAILED", `OpenAI consistency check failed with ${response.status}.`, 502, {
          status: response.status,
          body: errorBody.slice(0, 500)
        });
      }

      const data = (await response.json()) as unknown;
      const outputText = extractOutputText(data);
      const parsed = JSON.parse(stripJsonFence(outputText)) as RawConsistencyJson;
      const checks = {
        productContourConsistent: parsed.productContourConsistent === true,
        shadeShapeConsistent: parsed.shadeShapeConsistent === true,
        baseProportionConsistent: parsed.baseProportionConsistent === true,
        metalPositionConsistent: parsed.metalPositionConsistent === true
      };
      const passed = Object.values(checks).every(Boolean);

      return {
        passed,
        error: passed ? undefined : "PRODUCT_STRUCTURE_CHANGED",
        checks,
        reason: parsed.reason?.trim() || (passed ? "Generated image preserves the locked product structure." : "Generated image changed a locked structure."),
        modelName,
        provider: "openai"
      };
    } catch (error) {
      if (allowMockAI()) {
        return buildPassingConsistencyReport(error instanceof Error ? error.message : "OpenAI consistency check failed.", modelName, "mock-fallback");
      }
      if (error instanceof AIProviderError) throw error;
      throw new AIProviderError("CONSISTENCY_CHECK_FAILED", error instanceof Error ? error.message : "OpenAI consistency check failed.", 502);
    }
  }
}

class PlaceholderVisionProvider implements VisionProvider {
  constructor(public name: VisionProviderName) {}

  async analyzeProduct(input: VisionProviderRequest): Promise<VisionProviderResult> {
    if (!allowMockAI()) {
      throw new AIProviderError(
        "AI_PROVIDER_NOT_CONFIGURED",
        `${this.name} vision provider is registered but not configured. Select OpenAI or enable a real provider adapter.`,
        503
      );
    }

    return fallbackResult(
      input,
      "mock-fallback",
      `${this.name}-vision-not-configured`,
      `${this.name} provider is registered in the unified Vision Provider interface but not configured yet. Used local fallback Product Identity.`
    );
  }

  async checkProductConsistency(): Promise<ProductConsistencyReport> {
    if (!allowMockAI()) {
      throw new AIProviderError(
        "AI_PROVIDER_NOT_CONFIGURED",
        `${this.name} consistency provider is registered but not configured.`,
        503
      );
    }

    return buildPassingConsistencyReport(`${this.name} consistency provider is not configured. Used local pass-through check.`, `${this.name}-vision-not-configured`, "mock-fallback");
  }
}

function buildVisionPrompt(productName: string, category: string) {
  return [
    "You are an industrial design vision analyst for TOGO AI, an AI product design intelligent platform.",
    "Analyze ONLY the uploaded product image. Do not invent or redesign the product.",
    "Return ONLY JSON matching the schema.",
    "",
    `Product name hint: ${productName || "unknown"}`,
    `Category hint: ${category || "unknown"}`,
    "",
    "Identify:",
    "1. Product type such as Table Lamp, Floor Lamp, or Wall Lamp.",
    "2. Visible product parts such as Shade, Base, Metal Frame, LED Module, Battery, and Switch.",
    "3. Materials such as Glass, Marble, Metal, Fabric, Wood, LED, or plastic.",
    "4. Proportions: height relationship, width ratio, and component ratio.",
    "5. Camera information: front, side, 45-degree, top view, lighting style.",
    "",
    "Design-lock instruction:",
    "- Set all visible component shapes, positions, dimensions, and camera angle as locked.",
    "- Editable areas must be limited to material, color, and surface_finish.",
    "- Never suggest changing silhouette, structure, product type, component count, or camera angle."
  ].join("\n");
}

function buildConsistencyPrompt(input: ProductConsistencyRequest) {
  return [
    "Compare two images of the same product.",
    "Image 1 is the original uploaded product reference. Image 2 is the generated edit result.",
    "Return ONLY JSON matching the schema.",
    "",
    "The generated image must preserve:",
    "- product contour and silhouette",
    "- lamp shade shape and dimensions",
    "- base proportions",
    "- metal component position",
    "- camera angle and product viewpoint",
    "",
    "Allowed edits:",
    input.designLock.allowedEdits.join(", "),
    "",
    "User edit instruction:",
    input.prompt,
    "",
    "Product Identity JSON:",
    JSON.stringify(input.productIdentity.rawVisionJson)
  ].join("\n");
}

const productIdentitySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "productType",
    "designStyle",
    "brandPositioning",
    "parts",
    "materials",
    "dimensions",
    "editableAreas",
    "lockedAreas",
    "camera"
  ],
  properties: {
    productType: { type: "string" },
    designStyle: { type: "string" },
    brandPositioning: { type: "string" },
    parts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "shape", "material", "color", "position", "locked"],
        properties: {
          name: { type: "string" },
          shape: { type: "string" },
          material: { type: "string" },
          color: { type: "string" },
          position: { type: "string" },
          locked: { type: "boolean" }
        }
      }
    },
    materials: {
      type: "array",
      items: { type: "string" }
    },
    dimensions: {
      type: "object",
      additionalProperties: false,
      required: ["estimatedHeight", "widthRatio", "componentRatio"],
      properties: {
        estimatedHeight: { type: "string" },
        widthRatio: { type: "string" },
        componentRatio: { type: "string" }
      }
    },
    editableAreas: {
      type: "array",
      items: {
        type: "string",
        enum: ["material", "color", "surface_finish"]
      }
    },
    lockedAreas: {
      type: "array",
      items: {
        type: "string",
        enum: ["shape", "dimension", "structure", "camera_angle"]
      }
    },
    camera: {
      type: "object",
      additionalProperties: false,
      required: ["angle", "view", "lighting"],
      properties: {
        angle: { type: "string" },
        view: { type: "string" },
        lighting: { type: "string" }
      }
    }
  }
};

const consistencySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "productContourConsistent",
    "shadeShapeConsistent",
    "baseProportionConsistent",
    "metalPositionConsistent",
    "reason"
  ],
  properties: {
    productContourConsistent: { type: "boolean" },
    shadeShapeConsistent: { type: "boolean" },
    baseProportionConsistent: { type: "boolean" },
    metalPositionConsistent: { type: "boolean" },
    reason: { type: "string" }
  }
};

function normalizeVisionIdentityJson(raw: RawVisionIdentityJson, fallback: Pick<VisionProviderRequest, "productName" | "category">): VisionProductIdentityJson {
  const fallbackIdentity = buildFallbackVisionIdentityJson(fallback);
  const parts = (raw.parts ?? [])
    .map((part) => ({
      name: normalizeText(part.name, ""),
      shape: normalizeText(part.shape, "Detected component shape"),
      material: normalizeText(part.material, "Detected from uploaded image"),
      color: normalizeText(part.color, "Detected from uploaded image"),
      position: normalizeText(part.position, "Detected component position"),
      locked: part.locked !== false
    }))
    .filter((part) => part.name);

  return {
    productType: normalizeText(raw.productType, fallbackIdentity.productType),
    designStyle: normalizeText(raw.designStyle, fallbackIdentity.designStyle),
    brandPositioning: normalizeText(raw.brandPositioning, fallbackIdentity.brandPositioning),
    parts: parts.length > 0 ? parts : fallbackIdentity.parts,
    materials: normalizeStringArray(raw.materials, fallbackIdentity.materials),
    dimensions: {
      estimatedHeight: normalizeText(raw.dimensions?.estimatedHeight, fallbackIdentity.dimensions.estimatedHeight),
      widthRatio: normalizeText(raw.dimensions?.widthRatio, fallbackIdentity.dimensions.widthRatio),
      componentRatio: normalizeText(raw.dimensions?.componentRatio, fallbackIdentity.dimensions.componentRatio)
    },
    editableAreas: normalizeEditableAreas(raw.editableAreas),
    lockedAreas: normalizeStringArray(raw.lockedAreas, fallbackIdentity.lockedAreas),
    camera: {
      angle: normalizeText(raw.camera?.angle, fallbackIdentity.camera.angle),
      view: normalizeText(raw.camera?.view, fallbackIdentity.camera.view),
      lighting: normalizeText(raw.camera?.lighting, fallbackIdentity.camera.lighting)
    }
  };
}

function fallbackResult(input: VisionProviderRequest, source: VisionProviderName, modelName: string, message: string): VisionProviderResult {
  return {
    identityJson: buildFallbackVisionIdentityJson(input),
    source,
    modelName,
    message
  };
}

function buildPassingConsistencyReport(reason: string, modelName: string, provider: VisionProviderName): ProductConsistencyReport {
  return {
    passed: true,
    checks: {
      productContourConsistent: true,
      shadeShapeConsistent: true,
      baseProportionConsistent: true,
      metalPositionConsistent: true
    },
    reason,
    modelName,
    provider
  };
}

function extractOutputText(data: unknown) {
  if (typeof data !== "object" || data === null) {
    throw new Error("Vision response was not an object.");
  }

  const maybeOutputText = (data as { output_text?: unknown }).output_text;
  if (typeof maybeOutputText === "string" && maybeOutputText.trim()) {
    return maybeOutputText;
  }

  const output = (data as { output?: unknown }).output;
  if (Array.isArray(output)) {
    for (const item of output) {
      const content = typeof item === "object" && item !== null ? (item as { content?: unknown }).content : null;
      if (!Array.isArray(content)) continue;

      for (const part of content) {
        if (typeof part !== "object" || part === null) continue;
        const text = (part as { text?: unknown }).text;
        if (typeof text === "string" && text.trim()) return text;
      }
    }
  }

  throw new Error("Vision response did not include JSON text.");
}

function stripJsonFence(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function normalizeText(value: string | undefined, fallback: string) {
  const text = value?.trim();
  return text && text.length > 0 ? text : fallback;
}

function normalizeStringArray(values: string[] | undefined, fallback: string[]) {
  const normalized = Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean)));
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeEditableAreas(values: string[] | undefined): VisionProductIdentityJson["editableAreas"] {
  const allowed = new Set(["material", "color", "surface_finish"]);
  const normalized = (values ?? [])
    .map((value) => value.trim().toLowerCase().replace(/[\s-]+/g, "_"))
    .filter((value) => allowed.has(value));

  const unique = Array.from(new Set(normalized)) as VisionProductIdentityJson["editableAreas"];
  return unique.length > 0 ? unique : ["material", "color", "surface_finish"];
}

export function normalizeVisionProviderName(value: string | undefined): VisionProviderName | null {
  if (value === "openai" || value === "qwen" || value === "zhipu" || value === "claude" || value === "mock-fallback") {
    return value;
  }

  return null;
}
