import { tableLampDimensions, tableLampMaterials, tableLampParts, tableLampStructure } from "@/lib/table-lamp-spec";
import { makeId } from "@/lib/utils";
import type { DesignLock, ImageReference, ProductIdentity, UploadedProduct } from "@/types/product";

export const allowedReferenceEdits = ["材质", "颜色", "表面工艺", "使用场景"] as const;

export function createImageReference(product: UploadedProduct): ImageReference {
  return {
    mode: "image-reference",
    sourceProductId: product.id,
    fileName: product.fileName,
    imageUrl: product.imageUrl,
    uploadedAt: product.uploadedAt,
    referenceStrength: "strict"
  };
}

export function hasValidImageReference(imageReference: ImageReference | undefined | null): imageReference is ImageReference {
  return Boolean(
    imageReference &&
      imageReference.mode === "image-reference" &&
      imageReference.referenceStrength === "strict" &&
      imageReference.imageUrl &&
      imageReference.sourceProductId
  );
}

export function hasValidProductIdentity(productIdentity: ProductIdentity | undefined | null): productIdentity is ProductIdentity {
  return Boolean(
    productIdentity &&
      productIdentity.id &&
      productIdentity.sourceProductId &&
      productIdentity.productType &&
      Array.isArray(productIdentity.partStructure) &&
      productIdentity.partStructure.length > 0 &&
      hasValidImageReference(productIdentity.imageReference)
  );
}

export function hasStrictDesignLock(designLock: DesignLock | undefined | null): designLock is DesignLock {
  return Boolean(
    designLock &&
      designLock.mode === "strict-reference-lock" &&
      designLock.productOutline === "locked" &&
      designLock.sizeProportion === "locked" &&
      designLock.partPositions === "locked" &&
      designLock.cameraAngle === "locked"
  );
}

export function buildProductIdentityFromVision(input: {
  productName: string;
  category: string;
  imageReference: ImageReference;
}): ProductIdentity {
  const isTableLamp = input.category === "Lighting" || /table lamp|台灯/i.test(input.productName);
  const analyzedAt = new Date().toISOString();

  if (isTableLamp) {
    return {
      id: makeId("identity"),
      sourceProductId: input.imageReference.sourceProductId,
      productType: "台灯",
      partStructure: [...tableLampParts],
      materials: [
        { part: "玻璃灯罩", material: "Glass", editableProperties: ["颜色", "表面工艺"] },
        { part: "金属环", material: "Metal", editableProperties: ["材质", "颜色", "表面工艺"] },
        { part: "LED光源", material: "LED模组", editableProperties: [] },
        { part: "电池", material: "Battery", editableProperties: [] },
        { part: "大理石底座", material: "Stone", editableProperties: ["材质", "颜色", "表面工艺"] }
      ],
      proportions: {
        overall: `保持上传图片中的台灯竖向轮廓；总高 ${tableLampDimensions.heightCm}cm，灯罩 ${tableLampDimensions.shadeCm}cm，底座 ${tableLampDimensions.baseCm}cm。`,
        dimensions: tableLampDimensions,
        relationships: [
          "玻璃灯罩位于顶部，中心线与金属环、LED光源和底座对齐。",
          "灯罩视觉宽度大于底座，底座保持低矮加重比例。",
          "LED光源和电池属于内部功能层，不允许被生成模型新增、删除或外露。",
          "摄影角度、产品朝向和画面透视必须沿用上传图片。"
        ]
      },
      keyFeatures: [
        "顶部透明或半透明玻璃灯罩",
        "灯罩下方金属环连接线",
        "中心隐藏 LED 光源",
        "底座内部电池结构",
        "底部石材加重底座"
      ],
      editableAreas: [
        "玻璃灯罩颜色",
        "玻璃灯罩透明度与光泽",
        "金属环表面工艺",
        "大理石底座材质与纹理",
        "使用场景背景"
      ],
      imageReference: input.imageReference,
      visionModel: {
        name: "Reference Vision Analyzer v1",
        status: "completed",
        analyzedAt
      }
    };
  }

  return {
    id: makeId("identity"),
    sourceProductId: input.imageReference.sourceProductId,
    productType: input.productName || input.category,
    partStructure: ["主体轮廓", "功能部件", "连接区域", "支撑区域"],
    materials: [
      { part: "主体轮廓", material: "由上传图片视觉识别", editableProperties: ["材质", "颜色", "表面工艺"] },
      { part: "功能部件", material: "由上传图片视觉识别", editableProperties: ["表面工艺"] },
      { part: "使用场景", material: "背景环境", editableProperties: ["使用场景"] }
    ],
    proportions: {
      overall: "保持上传图片中的产品轮廓、尺寸比例、部件相对位置和摄影角度。",
      relationships: [
        "主体轮廓不得改变。",
        "功能部件的位置不得移动。",
        "可见零件数量不得新增或减少。",
        "摄影角度、产品朝向和透视必须沿用上传图片。"
      ]
    },
    keyFeatures: ["上传图片中的外轮廓", "可见功能部件", "部件连接关系", "原始拍摄角度"],
    editableAreas: ["材质", "颜色", "表面工艺", "使用场景"],
    imageReference: input.imageReference,
    visionModel: {
      name: "Reference Vision Analyzer v1",
      status: "completed",
      analyzedAt
    }
  };
}

export function buildStrictDesignLock(): DesignLock {
  return {
    mode: "strict-reference-lock",
    productOutline: "locked",
    sizeProportion: "locked",
    partPositions: "locked",
    cameraAngle: "locked",
    allowedEdits: [...allowedReferenceEdits],
    forbiddenChanges: [
      "禁止重新创造产品",
      "禁止改变产品轮廓",
      "禁止改变尺寸比例",
      "禁止移动、增加或删除零件",
      "禁止改变摄影角度",
      "禁止把上传产品替换成同类随机产品"
    ],
    validationRule: "生成前必须存在上传图片引用、Product Identity JSON 和 Design Lock；如果无法基于 reference 修改，则返回错误，不输出随机产品。"
  };
}

export function buildReferenceGenerationPolicy(identity: ProductIdentity, designLock: DesignLock) {
  return {
    mode: "Image Reference",
    sourceProductId: identity.sourceProductId,
    identityId: identity.id,
    sourceFileName: identity.imageReference.fileName,
    locked: [
      "产品轮廓",
      "尺寸比例",
      "零件位置",
      "摄影角度"
    ],
    allowedEdits: designLock.allowedEdits,
    forbiddenChanges: designLock.forbiddenChanges,
    instruction:
      "Use the uploaded image as the only visual reference. Preserve the original product identity, silhouette, proportions, part layout, and camera angle. Edit only material, color, surface finish, or usage scene."
  };
}

export function createMissingReferenceError(action: string) {
  return {
    error: "IMAGE_REFERENCE_REQUIRED",
    message: `${action} 必须先完成上传图片的视觉分析，并携带 Product Identity JSON 与 Design Lock。`,
    requiredWorkflow: [
      "上传 JPG/PNG 产品图片",
      "调用视觉模型分析上传图片",
      "创建 Product Identity JSON",
      "应用 Design Lock",
      "再基于原图 reference 生成"
    ]
  };
}

export function toProductIdentityPreview(identity: ProductIdentity) {
  return {
    id: identity.id,
    sourceProductId: identity.sourceProductId,
    productType: identity.productType,
    partStructure: identity.partStructure,
    materials: identity.materials,
    proportions: identity.proportions,
    keyFeatures: identity.keyFeatures,
    editableAreas: identity.editableAreas,
    imageReference: {
      mode: identity.imageReference.mode,
      fileName: identity.imageReference.fileName,
      referenceStrength: identity.imageReference.referenceStrength,
      imageUrl: "[uploaded image reference]"
    },
    visionModel: identity.visionModel
  };
}

export function describeIdentityMaterials(identity: ProductIdentity) {
  if (identity.productType === "台灯") {
    return tableLampMaterials;
  }

  return identity.materials.map((item) => `${item.part}: ${item.material}`).join(" / ");
}

export function describeIdentityStructure(identity: ProductIdentity) {
  if (identity.productType === "台灯") {
    return tableLampStructure;
  }

  return identity.partStructure.join(" / ");
}
