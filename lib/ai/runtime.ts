export type AIProviderErrorCode =
  | "AI_PROVIDER_NOT_CONFIGURED"
  | "OPENAI_API_KEY_REQUIRED"
  | "VISION_API_FAILED"
  | "IMAGE_EDIT_API_FAILED"
  | "CONSISTENCY_CHECK_FAILED";

export class AIProviderError extends Error {
  constructor(
    public code: AIProviderErrorCode,
    message: string,
    public status = 503,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

export function allowMockAI() {
  return process.env.ALLOW_MOCK_AI === "true";
}

export function requireOpenAIKey(service: "Vision API" | "Image Edit API" | "Consistency Check") {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new AIProviderError(
      "OPENAI_API_KEY_REQUIRED",
      `${service} requires OPENAI_API_KEY. Mock fallback is disabled by default for TOGO AI commercial mode.`,
      503,
      {
        service,
        allowMockAI: allowMockAI()
      }
    );
  }

  return apiKey;
}

export function createAIProviderErrorResponse(error: unknown) {
  if (error instanceof AIProviderError) {
    return {
      payload: {
        error: error.code,
        message: error.message,
        details: error.details ?? null
      },
      status: error.status
    };
  }

  return {
    payload: {
      error: "AI_PROVIDER_ERROR",
      message: error instanceof Error ? error.message : "AI provider request failed.",
      details: null
    },
    status: 500
  };
}

export function getAIEnvironmentStatus() {
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  const visionProvider = process.env.AI_VISION_PROVIDER || "openai";
  const imageProvider = process.env.AI_IMAGE_PROVIDER || "openai-image";
  const visionModel = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
  const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

  return {
    ready: hasOpenAIKey && visionProvider === "openai" && imageProvider === "openai-image",
    mode: allowMockAI() ? "development-mock-enabled" : "commercial-real-ai-required",
    checks: {
      OPENAI_API_KEY: hasOpenAIKey ? "PASS" : "FAIL",
      VisionAPI: hasOpenAIKey && visionProvider === "openai" ? "READY" : "NOT_READY",
      ImageEditAPI: hasOpenAIKey && imageProvider === "openai-image" ? "READY" : "NOT_READY"
    },
    providers: {
      visionProvider,
      imageProvider,
      visionModel,
      imageModel
    }
  };
}
