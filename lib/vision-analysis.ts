import type { ImageReference, VisionProductIdentityJson } from "@/types/product";

type VisionAnalysisResult = {
  identityJson: VisionProductIdentityJson | null;
  source: "openai" | "mock-fallback";
  modelName: string;
  message?: string;
};

type RawVisionIdentityJson = {
  productType?: string;
  parts?: string[];
  materials?: Array<{
    part?: string;
    material?: string;
  }>;
  dimensions?: {
    heightCm?: number | null;
    widthCm?: number | null;
    depthCm?: number | null;
    shadeCm?: number | null;
    baseCm?: number | null;
    summary?: string;
    relationships?: string[];
  };
  editableAreas?: string[];
  designLock?: {
    locked?: string[];
    allowedEdits?: string[];
    forbiddenChanges?: string[];
  };
};

const defaultVisionModel = "gpt-4o-mini";

export async function analyzeProductImageWithVision(input: {
  productName: string;
  category: string;
  imageReference: ImageReference;
}): Promise<VisionAnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const modelName = process.env.OPENAI_VISION_MODEL ?? defaultVisionModel;

  if (!apiKey) {
    return {
      identityJson: null,
      source: "mock-fallback",
      modelName,
      message: "OPENAI_API_KEY is not configured. Used local fallback Product Identity."
    };
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
        max_output_tokens: 1400
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        identityJson: null,
        source: "mock-fallback",
        modelName,
        message: `OpenAI vision request failed with ${response.status}: ${errorBody.slice(0, 240)}`
      };
    }

    const data = (await response.json()) as unknown;
    const outputText = extractOutputText(data);
    const parsed = JSON.parse(stripJsonFence(outputText)) as RawVisionIdentityJson;

    return {
      identityJson: normalizeVisionIdentityJson(parsed, input),
      source: "openai",
      modelName,
      message: "OpenAI vision analysis completed."
    };
  } catch (error) {
    return {
      identityJson: null,
      source: "mock-fallback",
      modelName,
      message: error instanceof Error ? error.message : "OpenAI vision analysis failed."
    };
  }
}

function buildVisionPrompt(productName: string, category: string) {
  return [
    "You are an industrial product vision analyst for AI Product Studio Pro.",
    "Analyze the uploaded product image and return ONLY JSON matching the schema.",
    "Do not invent a new product. Identify the exact product in the uploaded image.",
    "",
    `Product name hint: ${productName || "unknown"}`,
    `Category hint: ${category || "unknown"}`,
    "",
    "Required analysis:",
    "- product type",
    "- product structure",
    "- visible parts/components",
    "- visible materials",
    "- proportions and approximate dimensions if inferable",
    "- editable areas for material, color, surface finish, or scene only",
    "- design lock rules preserving original outline, proportions, component positions, camera angle, and dimensions"
  ].join("\n");
}

const productIdentitySchema = {
  type: "object",
  additionalProperties: false,
  required: ["productType", "parts", "materials", "dimensions", "editableAreas", "designLock"],
  properties: {
    productType: { type: "string" },
    parts: {
      type: "array",
      items: { type: "string" }
    },
    materials: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["part", "material"],
        properties: {
          part: { type: "string" },
          material: { type: "string" }
        }
      }
    },
    dimensions: {
      type: "object",
      additionalProperties: false,
      required: ["heightCm", "widthCm", "depthCm", "shadeCm", "baseCm", "summary", "relationships"],
      properties: {
        heightCm: { type: ["number", "null"] },
        widthCm: { type: ["number", "null"] },
        depthCm: { type: ["number", "null"] },
        shadeCm: { type: ["number", "null"] },
        baseCm: { type: ["number", "null"] },
        summary: { type: "string" },
        relationships: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    editableAreas: {
      type: "array",
      items: { type: "string" }
    },
    designLock: {
      type: "object",
      additionalProperties: false,
      required: ["locked", "allowedEdits", "forbiddenChanges"],
      properties: {
        locked: {
          type: "array",
          items: { type: "string" }
        },
        allowedEdits: {
          type: "array",
          items: { type: "string" }
        },
        forbiddenChanges: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  }
};

function normalizeVisionIdentityJson(
  raw: RawVisionIdentityJson,
  fallback: {
    productName: string;
    category: string;
  }
): VisionProductIdentityJson {
  return {
    productType: normalizeText(raw.productType, fallback.productName || fallback.category || "Unknown Product"),
    parts: normalizeStringArray(raw.parts, ["Main Body"]),
    materials: normalizeMaterials(raw.materials),
    dimensions: {
      heightCm: numberOrUndefined(raw.dimensions?.heightCm),
      widthCm: numberOrUndefined(raw.dimensions?.widthCm),
      depthCm: numberOrUndefined(raw.dimensions?.depthCm),
      shadeCm: numberOrUndefined(raw.dimensions?.shadeCm),
      baseCm: numberOrUndefined(raw.dimensions?.baseCm),
      summary: normalizeText(raw.dimensions?.summary, "Preserve uploaded product proportions and visible component relationships."),
      relationships: normalizeStringArray(raw.dimensions?.relationships, ["Preserve original component positions."])
    },
    editableAreas: normalizeStringArray(raw.editableAreas, ["Material", "Color", "Surface Finish", "Scene Background"]),
    designLock: {
      locked: normalizeStringArray(raw.designLock?.locked, [
        "Product silhouette",
        "Product proportion",
        "Component position",
        "Camera angle",
        "Overall dimensions"
      ]),
      allowedEdits: normalizeStringArray(raw.designLock?.allowedEdits, ["Material", "Color", "Surface finish", "Scene background"]),
      forbiddenChanges: normalizeStringArray(raw.designLock?.forbiddenChanges, ["Redesign product", "Change silhouette", "Move components"])
    }
  };
}

function extractOutputText(data: unknown) {
  if (typeof data !== "object" || data === null) {
    throw new Error("OpenAI response was not an object.");
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

  throw new Error("OpenAI response did not include JSON text.");
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

function normalizeMaterials(values: RawVisionIdentityJson["materials"]) {
  const normalized = (values ?? [])
    .filter((item) => item.part?.trim() && item.material?.trim())
    .map((item) => ({
      part: item.part?.trim() ?? "",
      material: item.material?.trim() ?? ""
    }));

  return normalized.length > 0 ? normalized : [{ part: "Main Body", material: "Detected from uploaded image" }];
}

function numberOrUndefined(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
