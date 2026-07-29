import type { MaterialRecommendation } from "@/types/product";

export type MaterialLibraryItem = {
  id: string;
  name: string;
  category: "Stone" | "Glass";
  targetPart: "大理石底座" | "玻璃灯罩";
  imageUrl: string;
  productRenderUrl: string;
  resolution: string;
  texture: string;
  color: {
    name: string;
    hex: string;
  };
  gloss: {
    label: string;
    roughness: number;
    specular: number;
    metallic: number;
    transmission: number;
    clearcoat: number;
  };
};

export const materialLibraryItems: MaterialLibraryItem[] = [
  {
    id: "mat-calacatta-viola",
    name: "Calacatta Viola",
    category: "Stone",
    targetPart: "大理石底座",
    imageUrl: "/materials/calacatta-viola.png",
    productRenderUrl: "/ai-designs/table-lamp-calacatta-viola.png",
    resolution: "2048 x 2048",
    texture: "紫色纹理抛光大理石",
    color: { name: "暖白 / 紫色纹理", hex: "#d6ccc4" },
    gloss: { label: "抛光石材", roughness: 0.18, specular: 0.68, metallic: 0, transmission: 0, clearcoat: 0.28 }
  },
  {
    id: "mat-calacatta-gold",
    name: "Calacatta Gold",
    category: "Stone",
    targetPart: "大理石底座",
    imageUrl: "/materials/calacatta-gold.png",
    productRenderUrl: "/ai-designs/table-lamp-calacatta-gold.png",
    resolution: "2048 x 2048",
    texture: "金色纹理抛光大理石",
    color: { name: "象牙白 / 金色纹理", hex: "#ded8ca" },
    gloss: { label: "抛光石材", roughness: 0.16, specular: 0.72, metallic: 0, transmission: 0, clearcoat: 0.3 }
  },
  {
    id: "mat-indian-green",
    name: "Indian Green",
    category: "Stone",
    targetPart: "大理石底座",
    imageUrl: "/materials/indian-green.png",
    productRenderUrl: "/ai-designs/table-lamp-indian-green.png",
    resolution: "2048 x 2048",
    texture: "深绿色大理石与浅色纹理",
    color: { name: "深绿色", hex: "#205846" },
    gloss: { label: "抛光石材", roughness: 0.2, specular: 0.66, metallic: 0, transmission: 0, clearcoat: 0.24 }
  },
  {
    id: "mat-nero-marquina",
    name: "Nero Marquina",
    category: "Stone",
    targetPart: "大理石底座",
    imageUrl: "/materials/nero-marquina.png",
    productRenderUrl: "/ai-designs/table-lamp-nero-marquina.png",
    resolution: "2048 x 2048",
    texture: "黑色大理石与高对比白色纹理",
    color: { name: "黑色 / 白色纹理", hex: "#121414" },
    gloss: { label: "高光石材", roughness: 0.13, specular: 0.78, metallic: 0, transmission: 0, clearcoat: 0.34 }
  },
  {
    id: "mat-travertine",
    name: "Travertine",
    category: "Stone",
    targetPart: "大理石底座",
    imageUrl: "/materials/travertine.png",
    productRenderUrl: "/ai-designs/table-lamp-travertine.png",
    resolution: "2048 x 2048",
    texture: "线性填补洞石孔隙纹理",
    color: { name: "暖米色", hex: "#b59a74" },
    gloss: { label: "哑光磨砂石材", roughness: 0.42, specular: 0.38, metallic: 0, transmission: 0, clearcoat: 0.08 }
  },
  {
    id: "mat-white-onyx",
    name: "White Onyx",
    category: "Stone",
    targetPart: "大理石底座",
    imageUrl: "/materials/white-onyx.png",
    productRenderUrl: "/ai-designs/table-lamp-white-onyx.png",
    resolution: "2048 x 2048",
    texture: "柔和半透缟玛瑙层纹",
    color: { name: "乳白色", hex: "#e1ddcf" },
    gloss: { label: "抛光半透石材", roughness: 0.12, specular: 0.82, metallic: 0, transmission: 0.18, clearcoat: 0.36 }
  },
  {
    id: "mat-glass-amber",
    name: "琥珀玻璃",
    category: "Glass",
    targetPart: "玻璃灯罩",
    imageUrl: "/materials/glass-amber.png",
    productRenderUrl: "/ai-designs/table-lamp-shade-amber.png",
    resolution: "2048 x 2048",
    texture: "暖色透明染色玻璃",
    color: { name: "琥珀色", hex: "#f5a248" },
    gloss: { label: "高光透明玻璃", roughness: 0.04, specular: 0.92, metallic: 0, transmission: 0.72, clearcoat: 0.55 }
  },
  {
    id: "mat-glass-smoke-grey",
    name: "烟灰玻璃",
    category: "Glass",
    targetPart: "玻璃灯罩",
    imageUrl: "/materials/glass-smoke-grey.png",
    productRenderUrl: "/ai-designs/table-lamp-shade-smoke-grey.png",
    resolution: "2048 x 2048",
    texture: "烟熏半透明玻璃",
    color: { name: "烟灰色", hex: "#69747a" },
    gloss: { label: "烟熏高光玻璃", roughness: 0.06, specular: 0.86, metallic: 0, transmission: 0.58, clearcoat: 0.5 }
  },
  {
    id: "mat-glass-olive-green",
    name: "橄榄绿玻璃",
    category: "Glass",
    targetPart: "玻璃灯罩",
    imageUrl: "/materials/glass-olive-green.png",
    productRenderUrl: "/ai-designs/table-lamp-shade-olive-green.png",
    resolution: "2048 x 2048",
    texture: "柔和橄榄绿透明玻璃",
    color: { name: "橄榄绿", hex: "#6a8550" },
    gloss: { label: "高光透明玻璃", roughness: 0.05, specular: 0.88, metallic: 0, transmission: 0.64, clearcoat: 0.52 }
  },
  {
    id: "mat-glass-clear",
    name: "透明玻璃",
    category: "Glass",
    targetPart: "玻璃灯罩",
    imageUrl: "/materials/glass-clear.png",
    productRenderUrl: "/ai-designs/table-lamp-shade-clear.png",
    resolution: "2048 x 2048",
    texture: "清透玻璃与柔和边缘高光",
    color: { name: "透明", hex: "#d7ebf0" },
    gloss: { label: "清透高光玻璃", roughness: 0.02, specular: 0.95, metallic: 0, transmission: 0.86, clearcoat: 0.58 }
  }
];

export function buildLibraryMaterialRecommendation(item: MaterialLibraryItem): MaterialRecommendation {
  return {
    conceptId: "material-library",
    materialFamily: item.name,
    finish: item.gloss.label,
    shellMaterial: `${item.targetPart}：${item.texture}`,
    surfaceTreatment: `${item.name} 已应用到 ${item.targetPart}；颜色 ${item.color.name}；粗糙度 ${item.gloss.roughness.toFixed(2)}，高光 ${item.gloss.specular.toFixed(2)}，透射 ${item.gloss.transmission.toFixed(2)}。`,
    durability:
      item.category === "Glass"
        ? "保持玻璃壁厚、口沿抛光和热稳定验证，适用于染色玻璃灯罩方案。"
        : "验证边缘圆角、底部绒垫覆盖、抗磕碰和运输保护，适用于石材底座方案。",
    sustainability:
      item.category === "Glass"
        ? "可回收长寿命玻璃卖点，最好搭配可替换灯罩包装说明。"
        : "天然石材卖点，最好用供应商溯源和低损耗切割方案支撑。",
    costSignal: item.category === "Glass" ? "中高成本，色彩一致性会影响良率" : "高成本，重量和纹理筛选会影响落地成本",
    supplierBrief: [
      `匹配材质库纹理：${item.texture}。`,
      `目标颜色：${item.color.name}（${item.color.hex}）。`,
      `光泽参数：粗糙度 ${item.gloss.roughness}，高光 ${item.gloss.specular}，清漆层 ${item.gloss.clearcoat}。`
    ],
    complianceChecks: [
      "材质证明需要绑定供应商批次。",
      "包装需要验证跌落测试和平台图片声明一致。",
      "没有供应商文件时，不发布天然材质或玻璃安全相关声明。"
    ]
  };
}
