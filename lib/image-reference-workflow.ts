import { tableLampDimensions } from "@/lib/table-lamp-spec";
import { makeId } from "@/lib/utils";
import type { DesignLock, ImageReference, ProductIdentity, ProductMaskRegion, UploadedProduct } from "@/types/product";

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
      designLock.cameraAngle === "locked" &&
      designLock.overallDimensions === "locked"
  );
}

export const tableLampMaskRegions: ProductMaskRegion[] = [
  {
    id: "shade",
    label: "Shade",
    partName: "Shade",
    material: "Glass",
    editableProperties: ["材质", "颜色", "表面工艺"],
    lockedNeighbors: ["Metal Frame", "Base", "Light Source"],
    promptHint: "Only edit the lamp shade. Preserve base, metal frame, light source, product proportion, and camera angle.",
    bounds: { x: 30, y: 10, width: 40, height: 34 }
  },
  {
    id: "metal",
    label: "Metal",
    partName: "Metal Frame",
    material: "Metal",
    editableProperties: ["材质", "颜色", "表面工艺"],
    lockedNeighbors: ["Shade", "Base", "Light Source"],
    promptHint: "Only edit the metal frame finish. Preserve shade, base, light source, silhouette, and camera angle.",
    bounds: { x: 39, y: 43, width: 22, height: 13 }
  },
  {
    id: "base",
    label: "Base",
    partName: "Base",
    material: "Marble",
    editableProperties: ["材质", "颜色", "表面工艺"],
    lockedNeighbors: ["Shade", "Metal Frame", "Light Source"],
    promptHint: "Only edit the base material, color, or finish. Preserve shade, metal frame, light source, product proportion, and camera angle.",
    bounds: { x: 36, y: 72, width: 28, height: 18 }
  },
  {
    id: "logo",
    label: "Logo",
    partName: "Logo",
    material: "Graphic mark",
    editableProperties: ["颜色", "表面工艺"],
    lockedNeighbors: ["Shade", "Metal Frame", "Base", "Light Source"],
    promptHint: "Only edit a small logo or brand mark if visible. Do not add a logo when none exists.",
    bounds: { x: 44, y: 78, width: 12, height: 6 }
  },
  {
    id: "light-source",
    label: "Light Source",
    partName: "Light Source",
    material: "LED",
    editableProperties: ["颜色"],
    lockedNeighbors: ["Shade", "Metal Frame", "Base"],
    promptHint: "Only tune visible light color or glow. Preserve component position, shade geometry, and base material.",
    bounds: { x: 43, y: 39, width: 14, height: 10 }
  },
  {
    id: "scene",
    label: "Scene",
    partName: "Scene Background",
    material: "Environment",
    editableProperties: ["使用场景"],
    lockedNeighbors: ["Shade", "Metal Frame", "Base", "Light Source"],
    promptHint: "Only change environment or background. Preserve the full product exactly as uploaded.",
    bounds: { x: 0, y: 0, width: 100, height: 100 }
  }
];

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
      productType: "Table Lamp",
      partStructure: ["Shade", "Metal Frame", "Base", "Light Source"],
      materials: [
        { part: "Shade", material: "Glass", editableProperties: ["材质", "颜色", "表面工艺"] },
        { part: "Metal Frame", material: "Metal", editableProperties: ["材质", "颜色", "表面工艺"] },
        { part: "Base", material: "Marble", editableProperties: ["材质", "颜色", "表面工艺"] }
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
        "Shape",
        "Proportion",
        "Silhouette",
        "Camera Angle"
      ],
      editableAreas: [
        "Shade",
        "Metal Frame",
        "Base",
        "Logo",
        "Light Source",
        "Scene Background"
      ],
      maskRegions: tableLampMaskRegions,
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
    maskRegions: [
      {
        id: "scene",
        label: "Scene",
        partName: "Scene Background",
        material: "Environment",
        editableProperties: ["使用场景"],
        lockedNeighbors: ["Original product"],
        promptHint: "Only change the scene background. Preserve uploaded product exactly.",
        bounds: { x: 0, y: 0, width: 100, height: 100 }
      }
    ],
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
    overallDimensions: "locked",
    allowedEdits: [...allowedReferenceEdits],
    forbiddenChanges: [
      "禁止重新创造产品",
      "禁止改变产品轮廓",
      "禁止改变尺寸比例",
      "禁止改变整体尺寸",
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
      "摄影角度",
      "整体尺寸"
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
    maskRegions: identity.maskRegions.map((region) => ({
      id: region.id,
      label: region.label,
      partName: region.partName,
      material: region.material,
      editableProperties: region.editableProperties,
      lockedNeighbors: region.lockedNeighbors
    })),
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
  if (isTableLampIdentity(identity)) {
    return "Glass / Metal / Marble";
  }

  return identity.materials.map((item) => `${item.part}: ${item.material}`).join(" / ");
}

export function describeIdentityStructure(identity: ProductIdentity) {
  if (isTableLampIdentity(identity)) {
    return "Shade / Metal Frame / Base / Light Source";
  }

  return identity.partStructure.join(" / ");
}

export function isTableLampIdentity(identity: ProductIdentity) {
  return identity.productType === "Table Lamp" || identity.productType === "台灯";
}
