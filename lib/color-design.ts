import { tableLampParts } from "@/lib/table-lamp-spec";

export type HighResColorVariant = {
  id: string;
  title: string;
  imageUrl: string;
  resolution: string;
  shadeColor: string;
  changedPart: string;
  transparency: string;
  notes: string;
};

const protectedTableLampParts = tableLampParts.filter((part) => part !== "玻璃灯罩");

export const tableLampShadeColorVariants: HighResColorVariant[] = [
  {
    id: "shade-amber",
    title: "颜色 01 / 琥珀色",
    imageUrl: "/ai-designs/table-lamp-shade-amber.png",
    resolution: "2048 x 2048",
    shadeColor: "琥珀色",
    changedPart: "玻璃灯罩",
    transparency: "暖色透明玻璃",
    notes: "暖琥珀透明灯罩，适合营造温暖家居氛围。"
  },
  {
    id: "shade-smoke-grey",
    title: "颜色 02 / 烟灰色",
    imageUrl: "/ai-designs/table-lamp-shade-smoke-grey.png",
    resolution: "2048 x 2048",
    shadeColor: "烟灰色",
    changedPart: "玻璃灯罩",
    transparency: "烟熏半透明玻璃",
    notes: "烟灰透明灯罩，适合黑色高级科技风与工业风场景。"
  },
  {
    id: "shade-olive-green",
    title: "颜色 03 / 橄榄绿",
    imageUrl: "/ai-designs/table-lamp-shade-olive-green.png",
    resolution: "2048 x 2048",
    shadeColor: "橄榄绿",
    changedPart: "玻璃灯罩",
    transparency: "柔和绿色透明玻璃",
    notes: "橄榄绿透明灯罩，强调自然、复古和高端家居质感。"
  },
  {
    id: "shade-clear",
    title: "颜色 04 / 透明",
    imageUrl: "/ai-designs/table-lamp-shade-clear.png",
    resolution: "2048 x 2048",
    shadeColor: "透明",
    changedPart: "玻璃灯罩",
    transparency: "清透玻璃",
    notes: "清透玻璃灯罩，保持最干净的产品主图表现。"
  }
];

export function buildColorEditResponse(prompt: string) {
  return {
    prompt,
    constraints: [
      "保持产品比例",
      "保持结构",
      "只修改玻璃灯罩颜色",
      "保持玻璃透明质感"
    ],
    changedPart: "玻璃灯罩",
    protectedParts: protectedTableLampParts,
    targetColors: ["琥珀色", "烟灰色", "橄榄绿", "透明"],
    variants: tableLampShadeColorVariants
  };
}
