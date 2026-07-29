import { tableLampDimensions, tableLampParts } from "@/lib/table-lamp-spec";
import { buildReferenceGenerationPolicy } from "@/lib/image-reference-workflow";
import type { DesignLock, ProductIdentity, ProductMaskRegion, ReferenceGenerationPrompt } from "@/types/product";

export type AmazonListingImage = {
  id: string;
  index: number;
  title: string;
  imageType: string;
  imageUrl: string;
  layoutPreviewUrl?: string;
  referenceImageUrl?: string;
  productIdentityId?: string;
  designLockApplied?: boolean;
  original_reference?: ProductIdentity["imageReference"];
  product_identity?: ProductIdentity;
  design_lock?: DesignLock;
  targetRegion?: string;
  generatedPrompt?: string;
  resolution: "1600 x 1600";
  amazonUse: "主图" | "副图";
  complianceNotes: string[];
};

export { tableLampDimensions } from "@/lib/table-lamp-spec";

export const amazonListingImages: AmazonListingImage[] = [
  {
    id: "amazon-main-white",
    index: 1,
    title: "Main Image",
    imageType: "Main Image",
    imageUrl: "/amazon-images/amazon-table-lamp-01-main-white.png",
    resolution: "1600 x 1600",
    amazonUse: "主图",
    complianceNotes: ["纯白背景", "无文字或图形覆盖", "仅展示产品"]
  },
  {
    id: "amazon-selling-points",
    index: 2,
    title: "Feature Image",
    imageType: "Feature Image",
    imageUrl: "/amazon-images/amazon-table-lamp-02-selling-points.png",
    resolution: "1600 x 1600",
    amazonUse: "副图",
    complianceNotes: ["副图信息图", "无违规徽章", "产品功能标签清晰"]
  },
  {
    id: "amazon-dimensions",
    index: 3,
    title: "Dimension Image",
    imageType: "Dimension Image",
    imageUrl: "/amazon-images/amazon-table-lamp-03-dimensions.png",
    resolution: "1600 x 1600",
    amazonUse: "副图",
    complianceNotes: ["尺寸可视化", "总高23cm", "灯罩17cm", "底座8cm", "尺寸清晰可读"]
  },
  {
    id: "amazon-materials",
    index: 4,
    title: "Material Image",
    imageType: "Material Image",
    imageUrl: "/amazon-images/amazon-table-lamp-04-materials.png",
    resolution: "1600 x 1600",
    amazonUse: "副图",
    complianceNotes: ["材质重点副图", "无未经验证的安全声明", "与产品分析一致"]
  },
  {
    id: "amazon-bedroom",
    index: 5,
    title: "Bedroom Scene",
    imageType: "Bedroom Scene",
    imageUrl: "/amazon-images/amazon-table-lamp-05-bedroom-scene.png",
    resolution: "1600 x 1600",
    amazonUse: "副图",
    complianceNotes: ["生活方式场景", "产品保持画面焦点", "不误导配件为随货商品"]
  },
  {
    id: "amazon-living-room",
    index: 6,
    title: "Living Room Scene",
    imageType: "Living Room Scene",
    imageUrl: "/amazon-images/amazon-table-lamp-06-living-room-scene.png",
    resolution: "1600 x 1600",
    amazonUse: "副图",
    complianceNotes: ["生活方式场景", "无竞品 Logo", "无未支撑的性能声明"]
  },
  {
    id: "amazon-detail",
    index: 7,
    title: "Detail Image",
    imageType: "Detail Image",
    imageUrl: "/amazon-images/amazon-table-lamp-07-product-detail.png",
    resolution: "1600 x 1600",
    amazonUse: "副图",
    complianceNotes: ["细节裁切", "展示真实可见部件", "无评论或评分语言"]
  },
  {
    id: "amazon-packaging",
    index: 8,
    title: "Package Image",
    imageType: "Package Image",
    imageUrl: "/amazon-images/amazon-table-lamp-08-packaging.png",
    resolution: "1600 x 1600",
    amazonUse: "副图",
    complianceNotes: ["包装可视化", "无虚假认证标识", "条码区域仅为概念展示"]
  },
  {
    id: "amazon-brand-story",
    index: 9,
    title: "Brand Story",
    imageType: "Brand Story",
    imageUrl: "/amazon-images/amazon-table-lamp-09-brand-story.png",
    resolution: "1600 x 1600",
    amazonUse: "副图",
    complianceNotes: ["品牌故事副图", "无不可验证奖项", "无引导评价文案"]
  }
];

export function buildAmazonListingImageResponse(
  productName: string,
  context: {
    productIdentity: ProductIdentity;
    designLock: DesignLock;
    targetRegion?: ProductMaskRegion | null;
    referencePrompt: ReferenceGenerationPrompt;
  }
) {
  const policy = buildReferenceGenerationPolicy(context.productIdentity, context.designLock);

  return {
    productName,
    imageReferenceMode: "enabled",
    referenceImageUrl: context.productIdentity.imageReference.imageUrl,
    original_reference: context.productIdentity.imageReference,
    product_identity: context.productIdentity,
    design_lock: context.designLock,
    productIdentity: context.productIdentity,
    designLock: context.designLock,
    targetRegion: context.targetRegion,
    referencePrompt: context.referencePrompt,
    generationPolicy: policy,
    marketplace: "Amazon US",
    resolution: "1600 x 1600",
    dimensions: tableLampDimensions,
    components: tableLampParts,
    count: amazonListingImages.length,
    ruleSummary: [
      "主图使用纯白背景，不添加文字、徽章、边框或道具。",
      "副图可使用卖点、尺寸、材质、场景、包装和品牌故事内容。",
      "避免虚假认证、评分语言、促销价格、竞品 Logo 和无法证明的安全声明。"
    ],
    images: amazonListingImages.map((image) => ({
      ...image,
      imageUrl: context.productIdentity.imageReference.imageUrl,
      layoutPreviewUrl: image.imageUrl,
      referenceImageUrl: context.productIdentity.imageReference.imageUrl,
      original_reference: context.productIdentity.imageReference,
      product_identity: context.productIdentity,
      design_lock: context.designLock,
      productIdentityId: context.productIdentity.id,
      designLockApplied: true,
      targetRegion: context.targetRegion?.label ?? "Scene",
      generatedPrompt: context.referencePrompt.systemPrompt,
      complianceNotes: [
        ...image.complianceNotes,
        "使用上传产品作为 reference",
        "锁定原产品轮廓、比例、零件位置和摄影角度",
        "禁止重新创造或替换为随机产品"
      ]
    }))
  };
}
