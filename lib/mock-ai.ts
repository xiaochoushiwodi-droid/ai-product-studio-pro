import type {
  DesignConcept,
  ImageReference,
  Marketplace,
  MaterialRecommendation,
  ProductAnalysis,
  VisionProductIdentityJson
} from "@/types/product";
import { makeId } from "@/lib/utils";
import { buildProductIdentityFromVision, buildStrictDesignLock } from "@/lib/image-reference-workflow";

const categorySignals: Record<
  string,
  {
    buyer: string;
    priceBand: string;
    painPoints: string[];
    levers: string[];
  }
> = {
  "Kitchen & Dining": {
    buyer: "关注耐用性、收纳体积和清洁效率的家庭烹饪用户。",
    priceBand: "$24.99 - $49.99",
    painPoints: [
      "难清洁的边角会降低复购信心。",
      "过大的包装会影响 FBA 成本。",
      "普通视觉语言容易在对比页里被忽略。"
    ],
    levers: ["易清洁接缝", "可堆叠结构", "食品接触材质表达"]
  },
  "Home Office": {
    buyer: "关注舒适度、线缆管理和桌面秩序的居家办公用户。",
    priceBand: "$29.99 - $79.99",
    painPoints: [
      "桌面配件在场景图中容易显得廉价。",
      "不同设备尺寸的兼容说明往往不够清晰。",
      "装配步骤复杂会带来差评风险。"
    ],
    levers: ["免工具安装", "哑光触感表面", "线缆路径细节"]
  },
  "Pet Supplies": {
    buyer: "关注安全材质、易清洁和信任信息的宠物主人。",
    priceBand: "$18.99 - $39.99",
    painPoints: [
      "买家会担心异味残留和不安全涂层。",
      "圆角细节会直接影响宠物安全感和购买信心。",
      "产品图需要给不同体型宠物提供比例参考。"
    ],
    levers: ["BPA-free 证明点", "圆角耐咬边缘", "可拆洗部件"]
  },
  "Sports & Outdoors": {
    buyer: "关注重量、握持、防水耐候和便携收纳的户外用户。",
    priceBand: "$21.99 - $59.99",
    painPoints: [
      "低价产品常在接缝和卡扣处失效。",
      "湿手或出汗场景容易带来握持差评。",
      "户外品类需要清晰的承重和耐候说明。"
    ],
    levers: ["纹理握持区", "加固承重点", "扁平收纳结构"]
  },
  Electronics: {
    buyer: "关注兼容性、散热和可靠感的科技产品用户。",
    priceBand: "$34.99 - $99.99",
    painPoints: [
      "散热、线缆杂乱和指纹残留常出现在评论中。",
      "过于笼统的兼容性描述会降低信任。",
      "廉价塑料感会削弱产品价值。"
    ],
    levers: ["散热开孔", "软触握持", "兼容性图标系统"]
  },
  Lighting: {
    buyer: "关注材质质感、暖光扩散和卧室/桌面搭配的家居照明买家。",
    priceBand: "$39.99 - $129.99",
    painPoints: [
      "玻璃灯罩如果厚度不清晰，会显得脆弱或廉价。",
      "金属环需要在近景图中与灯罩、LED光源干净对齐。",
      "电池仓和加重石材底座需要稳定性证明与可靠包装。"
    ],
    levers: ["玻璃灯罩扩散", "精密金属环", "隐藏式 LED 与电池堆叠"]
  }
};

const marketplaceSignals: Record<Marketplace, string[]> = {
  US: ["Prime 友好的价值表达", "基于评论痛点的信任信息", "套装差异化"],
  UK: ["紧凑收纳表达", "清晰易懂的合规语言", "可回收包装"],
  DE: ["精确规格", "可维修提示", "材质认证"],
  JP: ["节省空间的形态", "安静高级的细节", "整洁包装体积"],
  CA: ["双语包装空间", "低温环境耐用性", "环保材质表达"]
};

export async function simulateLatency(ms = 700) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildProductAnalysis(input: {
  productName: string;
  category: string;
  marketplace: Marketplace;
  imageReference: ImageReference;
  visionIdentity?: VisionProductIdentityJson | null;
  visionModelName?: string;
  visionSource?: ProductAnalysis["aiDebug"]["visionSource"];
  visionMessage?: string;
}): ProductAnalysis {
  const signal = categorySignals[input.category] ?? categorySignals["Kitchen & Dining"];
  const score = 78 + (input.productName.length % 12);
  const productIdentity = buildProductIdentityFromVision({
    productName: input.productName,
    category: input.category,
    imageReference: input.imageReference,
    visionIdentity: input.visionIdentity,
    visionModelName: input.visionModelName
  });
  const designLock = buildStrictDesignLock();

  return {
    productName: input.productName,
    category: input.category,
    marketplace: input.marketplace,
    imageReferenceMode: "enabled",
    productIdentity,
    designLock,
    aiDebug: {
      originalImage: productIdentity.imageReference.imageUrl ? "PASS" : "FAIL",
      productIdentity: productIdentity.productType && productIdentity.partStructure.length > 0 ? "PASS" : "FAIL",
      designLock: designLock.mode === "strict-reference-lock" ? "PASS" : "FAIL",
      visionSource: input.visionSource ?? "mock-fallback",
      visionModel: input.visionModelName ?? productIdentity.visionModel.name,
      message: input.visionMessage
    },
    opportunityScore: Math.min(score, 92),
    targetBuyer: signal.buyer,
    positioning: `${input.productName} 可以通过可见的品质升级、明确的 Amazon 卖点角度和易验证的材料/结构证据提升转化。`,
    painPoints: signal.painPoints,
    competitorSignals: [
      ...marketplaceSignals[input.marketplace],
      "高转化链接会在前三张图中展示真实使用方式",
      "评论更容易认可触感品质和低门槛使用体验"
    ],
    designLevers: signal.levers,
    complianceNotes: [
      "材质声明需要有供应商文件支撑。",
      "包装需预留条码、产地、警示语和平台特定文案空间。",
      "未测试前避免发布医疗、安全或耐用性绝对声明。"
    ],
    estimatedPriceBand: signal.priceBand
  };
}

export function buildDesignConcepts(analysis: ProductAnalysis): DesignConcept[] {
  const identity = analysis.productIdentity;
  const allowed = analysis.designLock.allowedEdits.join(" / ");

  return [
    {
      id: makeId("concept"),
      title: "Reference材质强化",
      promise: "只在原产品轮廓内提升材质可信度，降低买家对廉价感的担忧。",
      rationale: `${identity.productType} 的轮廓、比例、零件位置和摄影角度已经锁定；本方向只修改 ${allowed}。`,
      featureChanges: [
        "保留上传图片中的产品外形和部件布局。",
        "仅替换可编辑零件的材质纹理与光泽参数。",
        "用近景图解释材质来源、纹理和表面处理，不添加新零件。"
      ],
      colorPalette: ["石墨黑", "暖白", "信号琥珀"],
      manufacturingImpact: "Low",
      listingAngle: `面向${analysis.targetBuyer}`,
      score: Math.min(analysis.opportunityScore + 2, 96),
      risks: ["材质声明必须有供应商文件支撑。"]
    },
    {
      id: makeId("concept"),
      title: "颜色与表面工艺组",
      promise: "在不改变结构的前提下，用颜色和表面处理建立高端视觉层级。",
      rationale: "生成模型必须以上传图为 reference，不允许重画产品，只能在可编辑区域做颜色和工艺变化。",
      featureChanges: [
        "保持原摄影角度、透视和产品位置。",
        "只调整玻璃、金属或石材可见面的颜色、透明度、粗糙度和高光。",
        "主图和副图统一使用原产品身份，避免同类随机产品混入。"
      ],
      colorPalette: ["深绿", "石材", "拉丝镍"],
      manufacturingImpact: "Low",
      listingAngle: "兼具高端日用设计和 Amazon 合规细节。",
      score: Math.min(analysis.opportunityScore + 5, 97),
      risks: ["高端感需要产品摄影清楚呈现比例和纹理。"]
    },
    {
      id: makeId("concept"),
      title: "场景与Amazon图组",
      promise: "围绕原产品 reference 生成白底、尺寸、材质和场景图片，不替换产品主体。",
      rationale: "使用场景可以变化，但产品轮廓、比例、零件位置和摄影角度必须由 Product Identity 控制。",
      featureChanges: [
        "白底主图使用原产品主体，不添加道具或文字。",
        "场景图只替换背景和光线氛围，不改变产品外观结构。",
        "包装与品牌故事图使用同一 Product Identity，避免跨图产品不一致。"
      ],
      colorPalette: ["暖白", "雾灰", "浅木色"],
      manufacturingImpact: "Low",
      listingAngle: "原产品一致性强，适合 Amazon 详情页成组展示。",
      score: Math.max(analysis.opportunityScore, 72),
      risks: ["场景图不得暗示未随货配送的道具或配件。"]
    }
  ];
}

export function buildMaterialRecommendation(input: {
  conceptId: string;
  materialFamily: string;
  finish: string;
}): MaterialRecommendation {
  const families: Record<string, Pick<MaterialRecommendation, "shellMaterial" | "durability" | "sustainability" | "costSignal">> = {
    "Calacatta Viola": {
      shellMaterial: "抛光 Calacatta Viola 大理石底座，底部增加加固绒垫",
      durability: "具备高端石材手感和良好稳定性，紫色纹理边缘需要防崩保护。",
      sustainability: "天然石材卖点，最好搭配采石溯源和低损耗加工文件。",
      costSignal: "高成本，适合高端定位，需关注运输重量"
    },
    "Calacatta Gold": {
      shellMaterial: "抛光 Calacatta Gold 大理石底座，适配暖金属细节",
      durability: "适合桌面照明，稳定耐用，但金色纹理一致性需要加强检验。",
      sustainability: "天然大理石卖点，最好由供应商溯源和可复用保护包装支撑。",
      costSignal: "高成本，奢华感强"
    },
    "Indian Green": {
      shellMaterial: "抛光 Indian Green 大理石底座，底部增加防刮垫",
      durability: "重量足、稳定性好、视觉层次丰富；运输时需要保护边角。",
      sustainability: "天然石材卖点，更适合强调长寿命而不是回收含量。",
      costSignal: "中高成本，感知价值强"
    },
    "Nero Marquina": {
      shellMaterial: "抛光 Nero Marquina 黑色大理石底座，白色纹理形成强对比",
      durability: "视觉对比强、稳定性好，但深色高光表面需要检查指纹和划痕。",
      sustainability: "长寿命石材卖点，最好搭配可替换玻璃灯罩和可回收金属信息。",
      costSignal: "高成本，适合黑色高端定位"
    },
    Travertine: {
      shellMaterial: "填补并磨砂处理的 Travertine 洞石底座，表面孔隙封闭",
      durability: "有温暖建筑感纹理；需要封闭验证，避免染色和积灰。",
      sustainability: "天然多孔石材卖点，适合低光泽高级表达。",
      costSignal: "中高成本，封闭处理会影响良率"
    },
    "White Onyx": {
      shellMaterial: "抛光 White Onyx 底座，呈现半透石材层次",
      durability: "高级且轻盈的视觉感受，但需要严格检查崩边和裂纹。",
      sustainability: "高端天然材质卖点，最好由长寿命和可维修装配支撑。",
      costSignal: "高成本，适合精品材质定位"
    },
    玻璃: {
      shellMaterial: "壁厚受控的钢化乳白玻璃灯罩",
      durability: "钢化并抛光边缘后具备良好耐热性和更可靠的破裂表现。",
      sustainability: "长寿命可回收玻璃卖点，最好搭配可替换灯罩包装。",
      costSignal: "中高成本，对易碎包装敏感"
    },
    琥珀玻璃: {
      shellMaterial: "琥珀色钢化玻璃灯罩，口沿抛光",
      durability: "耐热性和暖光扩散表现良好，需要跨批次检查色彩一致性。",
      sustainability: "长寿命可回收玻璃卖点，灯罩可替换时更有说服力。",
      costSignal: "中高成本，染色色差影响良率"
    },
    烟灰玻璃: {
      shellMaterial: "烟灰色钢化玻璃灯罩，透明度受控",
      durability: "高级感强；深色玻璃需要在近景图前检查划痕和指纹。",
      sustainability: "耐用可回收玻璃卖点，适合搭配可替换灯罩包装。",
      costSignal: "中高成本，烟熏色质检敏感"
    },
    橄榄绿玻璃: {
      shellMaterial: "橄榄绿钢化玻璃灯罩，柔和透明染色",
      durability: "耐热性良好且颜色记忆点强，需要在暖光下校验色彩匹配。",
      sustainability: "长寿命可回收玻璃卖点，适合减少混合材料装配。",
      costSignal: "中高成本，定制颜色 MOQ 敏感"
    },
    透明玻璃: {
      shellMaterial: "清透钢化玻璃灯罩，边缘抛光高光",
      durability: "材质表达最干净，需要严格检查划痕、气泡和边缘抛光。",
      sustainability: "可回收长寿命玻璃卖点，可替换灯罩设计更有说服力。",
      costSignal: "中等成本，通透度检验影响良率"
    },
    金属: {
      shellMaterial: "粉末喷涂钢件，可搭配黄铜或拉丝金属细节",
      durability: "刚性高；焊接和表面一致性受控时感知质量强。",
      sustainability: "耐用可回收金属结构，灯罩和底座可拆时更有优势。",
      costSignal: "中等成本，表面质量决定感知价值"
    },
    石材: {
      shellMaterial: "抛光大理石底座，底部绒垫与防倾倒重量分布",
      durability: "稳定性和高级手感优秀，但边缘需要防崩保护。",
      sustainability: "天然材质卖点，需要谨慎处理采购和包装声明。",
      costSignal: "高成本，对运输重量敏感"
    },
    再生聚合物: {
      shellMaterial: "PCR ABS 混合材料，可见面使用新料覆盖层",
      durability: "抗冲击性较好，需要控制批次间色差。",
      sustainability: "供应商具备监管链文件时，可支撑回收含量声明。",
      costSignal: "中等成本，MOQ 敏感度适中"
    },
    食品级硅胶: {
      shellMaterial: "铂金硫化 LFGB/FDA 硅胶",
      durability: "弯折寿命高，适合反复清洁并具备良好耐热性。",
      sustainability: "适合耐用复用卖点，但不适合主打回收含量。",
      costSignal: "中高成本，模具容错较好"
    },
    阳极氧化铝: {
      shellMaterial: "6063 铝挤型，局部精密 CNC 接触点",
      durability: "刚性优秀，搭配耐刮表面处理后手感高级。",
      sustainability: "可回收金属卖点，最好减少混合材料装配。",
      costSignal: "高成本，感知价值强"
    },
    竹纤维复合材: {
      shellMaterial: "竹纤维复合表层，内部为结构聚合物核心",
      durability: "触感温暖，上线前需要湿度和抗污测试。",
      sustainability: "可讲天然材质故事，但声明需要避免夸大。",
      costSignal: "中等成本，供应商一致性有风险"
    }
  };

  const selected = families[input.materialFamily] ?? families.再生聚合物;

  return {
    conceptId: input.conceptId,
    materialFamily: input.materialFamily,
    finish: input.finish,
    shellMaterial: selected.shellMaterial,
    surfaceTreatment: `${input.finish} 表面处理，优化面向摄影的平整度，并增强用户接触区域的触感。`,
    durability: selected.durability,
    sustainability: selected.sustainability,
    costSignal: selected.costSignal,
    supplierBrief: [
      "正式拍摄前要求供应商提供两块表面样板和一个功能样机。",
      "根据品类要求 RoHS、REACH、FDA、LFGB 或 Prop 65 文件。",
      "报价需同时提供包装体积、单件重量和 EXW 单价。"
    ],
    complianceChecks: [
      "上架前对照平台政策确认卖点声明。",
      "材质证书需关联批次或供应商批号。",
      "执行与使用场景匹配的耐磨、清洁和气味测试。"
    ]
  };
}
