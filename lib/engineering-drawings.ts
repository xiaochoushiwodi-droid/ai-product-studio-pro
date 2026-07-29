import { tableLampDimensions, tableLampParts, tableLampStructure } from "@/lib/table-lamp-spec";
import { buildReferenceGenerationPolicy } from "@/lib/image-reference-workflow";
import type { DesignLock, EngineeringDrawingView, EngineeringExplodedPart, ProductIdentity, ProductMaskRegion, ReferenceGenerationPrompt } from "@/types/product";

export const tableLampExplodedParts: EngineeringExplodedPart[] = [
  {
    order: 1,
    name: "玻璃灯罩",
    material: "玻璃",
    role: "17cm 透光扩散件，也是主要可见颜色面。",
    editableScope: "颜色、透明度、口沿抛光"
  },
  {
    order: 2,
    name: "金属环",
    material: "金属",
    role: "固定灯罩、定位 LED，并形成可见连接线。",
    editableScope: "表面处理、厚度、圆角半径"
  },
  {
    order: 3,
    name: "LED光源",
    material: "LED模组",
    role: "位于灯罩下方中心的发光模组。",
    editableScope: "出光方向、扩散间隙"
  },
  {
    order: 4,
    name: "电池",
    material: "电池单元",
    role: "隐藏在底座结构内的供电模块。",
    editableScope: "检修口、安装间隙、安全标识"
  },
  {
    order: 5,
    name: "大理石底座",
    material: "石材",
    role: "8cm 加重底座，负责稳定性和材质表现。",
    editableScope: "石材种类、光泽、边缘圆角"
  }
];

export const engineeringDrawingViews: EngineeringDrawingView[] = [
  {
    id: "engineering-front-view",
    index: 1,
    title: "正视图",
    viewType: "front",
    imageUrl: "/engineering/table-lamp-front.svg",
    resolution: "1600 x 1200",
    scale: "1:2",
    drawingNotes: [
      `总高 ${tableLampDimensions.heightCm}cm`,
      `灯罩宽度 ${tableLampDimensions.shadeCm}cm`,
      `底座宽度 ${tableLampDimensions.baseCm}cm`,
      "中心线对齐锁定"
    ]
  },
  {
    id: "engineering-side-view",
    index: 2,
    title: "侧视图",
    viewType: "side",
    imageUrl: "/engineering/table-lamp-side.svg",
    resolution: "1600 x 1200",
    scale: "1:2",
    drawingNotes: [
      `总高 ${tableLampDimensions.heightCm}cm`,
      "玻璃灯罩侧面轮廓",
      "隐藏 LED 与电池堆叠",
      "底座稳定包络"
    ]
  },
  {
    id: "engineering-top-view",
    index: 3,
    title: "顶视图",
    viewType: "top",
    imageUrl: "/engineering/table-lamp-top.svg",
    resolution: "1600 x 1200",
    scale: "1:2",
    drawingNotes: [
      `灯罩直径 ${tableLampDimensions.shadeCm}cm`,
      `底座占位 ${tableLampDimensions.baseCm}cm`,
      "金属环与 LED 同心",
      "电池检修区域以虚线显示"
    ]
  },
  {
    id: "engineering-exploded-view",
    index: 4,
    title: "爆炸图",
    viewType: "exploded",
    imageUrl: "/engineering/table-lamp-exploded.svg",
    resolution: "1600 x 1200",
    scale: "装配图",
    drawingNotes: [
      `自动拆解为 ${tableLampParts.length} 个部件`,
      tableLampStructure,
      "装配顺序由上到下",
      "材质编辑目标已隔离"
    ]
  }
];

export function buildEngineeringDrawingResponse(
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
    mode: "engineering-dimensions",
    imageReferenceMode: "enabled",
    referenceImageUrl: context.productIdentity.imageReference.imageUrl,
    productIdentity: context.productIdentity,
    designLock: context.designLock,
    targetRegion: context.targetRegion,
    referencePrompt: context.referencePrompt,
    generationPolicy: policy,
    input: "生成正视图、侧视图、顶视图、爆炸图，并自动拆解产品结构。",
    dimensions: tableLampDimensions,
    structure: tableLampStructure,
    components: tableLampParts,
    autoExplodedParts: tableLampExplodedParts,
    count: engineeringDrawingViews.length,
    views: engineeringDrawingViews
  };
}
