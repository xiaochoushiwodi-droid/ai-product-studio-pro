"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Boxes,
  Brush,
  Camera,
  CheckCircle2,
  CircuitBoard,
  Cuboid,
  Download,
  FileImage,
  FolderOpen,
  Gem,
  Home,
  ImagePlus,
  Library,
  LayoutTemplate,
  Lightbulb,
  LogOut,
  Move3D,
  Package,
  Palette,
  PenTool,
  Save,
  ScanLine,
  Sparkles,
  ShoppingCart,
  SunMedium,
  TextCursorInput,
  Upload,
  Wand2
} from "lucide-react";
import { LoginCard } from "@/components/auth/login-card";
import { AIDebugPanel } from "@/components/dashboard/ai-debug-panel";
import { DesignLockPanel } from "@/components/dashboard/design-lock-panel";
import { DesignVersionHistory } from "@/components/dashboard/design-version-history";
import { LightingKnowledgePanel } from "@/components/dashboard/lighting-knowledge-panel";
import { MarketingCopyPanel } from "@/components/dashboard/marketing-copy-panel";
import { MarketingImageEditor } from "@/components/dashboard/marketing-image-editor";
import { MarketingLayerInspector } from "@/components/dashboard/marketing-layer-inspector";
import { MarketingTemplateLibrary } from "@/components/dashboard/marketing-template-library";
import { ProductIdentityPanel } from "@/components/dashboard/product-identity-panel";
import { ProductMaskOverlay, ProductMaskPanel } from "@/components/dashboard/product-mask-panel";
import { makeId } from "@/lib/utils";
import { loadSavedProjects, saveProject } from "@/lib/storage";
import type { HighResDesignVariant } from "@/lib/product-design";
import type { HighResColorVariant } from "@/lib/color-design";
import { buildLibraryMaterialRecommendation, materialLibraryItems, type MaterialLibraryItem } from "@/lib/material-library";
import type { AmazonListingImage } from "@/lib/amazon-images";
import { tableLampDimensions, tableLampMaterials, tableLampParts, tableLampStructure } from "@/lib/table-lamp-spec";
import { lightingKnowledgeBase } from "@/lib/lighting-knowledge-base";
import { amazonMarketingTemplates } from "@/lib/marketing-studio";
import {
  createImageReference,
  describeIdentityMaterials,
  describeIdentityStructure,
  toProductIdentityPreview
} from "@/lib/image-reference-workflow";
import type {
  DesignLock,
  DesignConcept,
  EngineeringDrawingView,
  EngineeringExplodedPart,
  MaterialRecommendation,
  MarketingAsset,
  MarketingAutoLayout,
  MarketingCopy,
  MarketingCopyMode,
  MarketingEditorLayer,
  MarketingLanguage,
  MarketingLayerIcon,
  ProductAnalysis,
  ProductIdentity,
  ProductMaskRegion,
  ProductMaskRegionId,
  DesignVersion,
  DesignVersionKind,
  SavedProject,
  SellerSession,
  UploadedProduct
} from "@/types/product";

const categoryOptions = [
  { value: "Kitchen & Dining", label: "厨房餐厨" },
  { value: "Home Office", label: "居家办公" },
  { value: "Pet Supplies", label: "宠物用品" },
  { value: "Sports & Outdoors", label: "运动户外" },
  { value: "Electronics", label: "电子产品" },
  { value: "Lighting", label: "照明灯具" }
];

const menuItems = [
  { id: "home", label: "首页", icon: Home },
  { id: "upload", label: "上传产品", icon: Upload },
  { id: "ai-analysis", label: "AI分析", icon: ScanLine },
  { id: "ai-design", label: "AI设计", icon: Wand2 },
  { id: "material", label: "材质替换", icon: Gem },
  { id: "material-library", label: "材质库", icon: Library },
  { id: "color", label: "颜色编辑", icon: Palette },
  { id: "structure", label: "结构调整", icon: Move3D },
  { id: "lighting", label: "灯光效果", icon: SunMedium },
  { id: "scene", label: "场景生成", icon: Camera },
  { id: "amazon", label: "Amazon图片", icon: FileImage },
  { id: "marketing-copy", label: "图片文案编辑", icon: TextCursorInput },
  { id: "marketing-layout", label: "图片排版", icon: LayoutTemplate },
  { id: "listing", label: "Listing优化", icon: ShoppingCart },
  { id: "packaging", label: "包装设计", icon: Package },
  { id: "drawing", label: "工程图", icon: PenTool },
  { id: "exploded", label: "爆炸图", icon: Boxes }
];

const bottomModules = [
  { id: "amazon", label: "Amazon图片", icon: FileImage },
  { id: "drawing", label: "工程图", icon: CircuitBoard },
  { id: "exploded", label: "爆炸图", icon: Boxes },
  { id: "packaging", label: "包装模块", icon: Package }
];

const materialFamilies = [
  "Calacatta Viola",
  "Calacatta Gold",
  "Indian Green",
  "Nero Marquina",
  "Travertine",
  "White Onyx",
  "琥珀玻璃",
  "烟灰玻璃",
  "橄榄绿玻璃",
  "透明玻璃",
  "玻璃",
  "金属",
  "石材",
  "再生聚合物",
  "食品级硅胶",
  "阳极氧化铝",
  "竹纤维复合材"
];
const finishes = ["乳白半透", "拉丝金属", "抛光石材", "透明染色", "柔和哑光", "细腻纹理", "缎面阳极氧化", "温润天然", "高光点缀"];

type LoadingTask =
  | "analyze"
  | "design"
  | "product-design"
  | "color-edit"
  | "engineering"
  | "amazon-images"
  | "marketing-copy"
  | "marketing-layout"
  | "material"
  | "save"
  | null;

type UploadAnalysisDetails = {
  productType: string;
  structure: string;
  material: string;
  editableAreas: string[];
};

export function ProductStudioApp() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<SellerSession | null>(null);
  const [product, setProduct] = useState<UploadedProduct | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [concepts, setConcepts] = useState<DesignConcept[]>([]);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [material, setMaterial] = useState<MaterialRecommendation | null>(null);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingTask>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState("ai-design");
  const [bottomTab, setBottomTab] = useState("amazon");
  const [productName, setProductName] = useState("台灯");
  const [category, setCategory] = useState("Lighting");
  const [materialFamily, setMaterialFamily] = useState(materialFamilies[0]);
  const [finish, setFinish] = useState(finishes[0]);
  const [designPrompt, setDesignPrompt] = useState(
    "把底座改成6种石材方案：Calacatta Viola、Calacatta Gold、Indian Green、Nero Marquina、Travertine、White Onyx。"
  );
  const [productDesignResults, setProductDesignResults] = useState<HighResDesignVariant[]>([]);
  const [selectedDesignVariantId, setSelectedDesignVariantId] = useState<string | null>(null);
  const [colorPrompt, setColorPrompt] = useState(
    "把玻璃灯罩改成琥珀色、烟灰色、橄榄绿、透明四种玻璃颜色，保持结构、比例、金属环、LED光源、电池和大理石底座不变。"
  );
  const [colorDesignResults, setColorDesignResults] = useState<HighResColorVariant[]>([]);
  const [selectedColorVariantId, setSelectedColorVariantId] = useState<string | null>(null);
  const [appliedLibraryMaterial, setAppliedLibraryMaterial] = useState<MaterialLibraryItem | null>(null);
  const [amazonImages, setAmazonImages] = useState<AmazonListingImage[]>([]);
  const [selectedAmazonImageId, setSelectedAmazonImageId] = useState<string | null>(null);
  const [engineeringViews, setEngineeringViews] = useState<EngineeringDrawingView[]>([]);
  const [engineeringParts, setEngineeringParts] = useState<EngineeringExplodedPart[]>([]);
  const [selectedEngineeringViewId, setSelectedEngineeringViewId] = useState<string | null>(null);
  const [selectedMaskRegionId, setSelectedMaskRegionId] = useState<ProductMaskRegionId | null>(null);
  const [designVersions, setDesignVersions] = useState<DesignVersion[]>([]);
  const [selectedDesignVersionId, setSelectedDesignVersionId] = useState<string | null>(null);
  const [restoredVersion, setRestoredVersion] = useState<DesignVersion | null>(null);
  const [marketingCopyMode, setMarketingCopyMode] = useState<MarketingCopyMode>("amazon-conversion");
  const [marketingLanguage, setMarketingLanguage] = useState<MarketingLanguage>("en");
  const [marketingCopy, setMarketingCopy] = useState<MarketingCopy | null>(null);
  const [marketingLayouts, setMarketingLayouts] = useState<MarketingAutoLayout[]>([]);
  const [selectedMarketingLayoutId, setSelectedMarketingLayoutId] = useState<string | null>(null);
  const [selectedMarketingLayerId, setSelectedMarketingLayerId] = useState<string | null>(null);
  const [marketingAssets, setMarketingAssets] = useState<MarketingAsset[]>([]);

  useEffect(() => {
    setProjects(loadSavedProjects());
  }, []);

  const selectedConcept = useMemo(
    () => concepts.find((concept) => concept.id === selectedConceptId) ?? null,
    [concepts, selectedConceptId]
  );

  const selectedDesignVariant = useMemo(
    () => productDesignResults.find((variant) => variant.id === selectedDesignVariantId) ?? null,
    [productDesignResults, selectedDesignVariantId]
  );

  const selectedColorVariant = useMemo(
    () => colorDesignResults.find((variant) => variant.id === selectedColorVariantId) ?? null,
    [colorDesignResults, selectedColorVariantId]
  );

  const selectedAmazonImage = useMemo(
    () => amazonImages.find((image) => image.id === selectedAmazonImageId) ?? null,
    [amazonImages, selectedAmazonImageId]
  );

  const selectedEngineeringView = useMemo(
    () => engineeringViews.find((view) => view.id === selectedEngineeringViewId) ?? null,
    [engineeringViews, selectedEngineeringViewId]
  );

  const productIdentity = analysis?.productIdentity ?? null;
  const designLock = analysis?.designLock ?? null;
  const selectedMaskRegion = useMemo(
    () => productIdentity?.maskRegions.find((region) => region.id === selectedMaskRegionId) ?? null,
    [productIdentity, selectedMaskRegionId]
  );
  const selectedMarketingLayout = useMemo(
    () => marketingLayouts.find((layout) => layout.id === selectedMarketingLayoutId) ?? null,
    [marketingLayouts, selectedMarketingLayoutId]
  );
  const selectedMarketingLayer = useMemo(
    () => selectedMarketingLayout?.layers.find((layer) => layer.id === selectedMarketingLayerId) ?? null,
    [selectedMarketingLayerId, selectedMarketingLayout]
  );

  const progress = useMemo(() => {
    return [
      { label: "产品", done: Boolean(product) },
      { label: "分析", done: Boolean(analysis) },
      { label: "身份", done: Boolean(analysis?.productIdentity && analysis?.designLock) },
      { label: "方案", done: concepts.length > 0 },
      { label: "颜色", done: colorDesignResults.length > 0 },
      { label: "材质", done: Boolean(material || appliedLibraryMaterial) },
      { label: "工程", done: engineeringViews.length === 4 },
      { label: "Amazon", done: amazonImages.length === 9 },
      { label: "文案", done: Boolean(marketingCopy) },
      { label: "排版", done: marketingLayouts.length === 9 }
    ];
  }, [amazonImages.length, analysis, appliedLibraryMaterial, colorDesignResults.length, concepts.length, engineeringViews.length, marketingCopy, marketingLayouts.length, material, product]);

  const uploadAnalysisDetails = useMemo(
    () => buildUploadAnalysisDetails(product, analysis, material),
    [analysis, material, product]
  );

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      readProductImage(file);
    }
    event.target.value = "";
  }

  function readProductImage(file: File) {
    if (!isSupportedProductImage(file)) {
      setUploadError("仅支持 JPG 或 PNG 产品图片。");
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const cleanName = productName.trim() || file.name.replace(/\.[^/.]+$/, "");
      const baseProduct: UploadedProduct = {
        id: makeId("product"),
        name: cleanName,
        category,
        fileName: file.name,
        imageUrl: String(reader.result),
        uploadedAt: new Date().toISOString()
      };
      const nextProduct: UploadedProduct = {
        ...baseProduct,
        imageReference: createImageReference(baseProduct)
      };

      setProduct(nextProduct);
      setProductName(cleanName);
      setAnalysis(null);
      setConcepts([]);
      setSelectedConceptId(null);
      setMaterial(null);
      setProductDesignResults([]);
      setSelectedDesignVariantId(null);
      setColorDesignResults([]);
      setSelectedColorVariantId(null);
      setAppliedLibraryMaterial(null);
      setAmazonImages([]);
      setSelectedAmazonImageId(null);
      setEngineeringViews([]);
      setEngineeringParts([]);
      setSelectedEngineeringViewId(null);
      setSelectedMaskRegionId(null);
      setDesignVersions([]);
      setSelectedDesignVersionId(null);
      setRestoredVersion(null);
      setMarketingCopy(null);
      setMarketingLayouts([]);
      setSelectedMarketingLayoutId(null);
      setSelectedMarketingLayerId(null);
      setMarketingAssets([]);
      setLastSavedAt(null);
      setActiveTool("ai-analysis");
      void analyzeProduct(nextProduct);
    };
    reader.readAsDataURL(file);
  }

  async function analyzeProduct(targetProduct: UploadedProduct) {
    if (!session) return;
    const imageReference = targetProduct.imageReference ?? createImageReference(targetProduct);

    setLoading("analyze");
    setActiveTool("ai-analysis");
    setConcepts([]);
    setSelectedConceptId(null);
    setMaterial(null);
    setProduct((current) => {
      if (!current || current.id !== targetProduct.id || current.imageReference) return current;
      return { ...current, imageReference };
    });

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim() || targetProduct.name,
          category: targetProduct.category,
          marketplace: session.marketplace,
          imageReference
        })
      });
      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        setUploadError(error?.message ?? "视觉分析失败：缺少上传图片 reference。");
        return;
      }
      const data = (await response.json()) as { analysis: ProductAnalysis };
      setAnalysis(data.analysis);
      setSelectedMaskRegionId(data.analysis.productIdentity.maskRegions.find((region) => region.id === "base")?.id ?? data.analysis.productIdentity.maskRegions[0]?.id ?? null);
      setUploadError(null);
      await generateMarketingCopyForIdentity(data.analysis.productIdentity, data.analysis.designLock, {
        productDisplayName: targetProduct.name,
        switchTool: false
      });
    } finally {
      setLoading(null);
    }
  }

  async function handleAnalyze() {
    if (!product) return;
    await analyzeProduct(product);
  }

  async function handleGenerateDesigns() {
    if (!analysis?.productIdentity || !analysis.designLock) return;

    setLoading("design");
    setMaterial(null);
    setAppliedLibraryMaterial(null);

    try {
      const response = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis })
      });
      const data = (await response.json()) as { concepts: DesignConcept[] };
      setConcepts(data.concepts);
      setSelectedConceptId(data.concepts[0]?.id ?? null);
      setActiveTool("material");
    } finally {
      setLoading(null);
    }
  }

  async function handleGenerateProductDesigns() {
    if (!product || !productIdentity || !designLock) return;

    setLoading("product-design");
    setActiveTool("ai-design");

    try {
      const response = await fetch("/api/ai/product-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          prompt: designPrompt,
          productIdentity,
          designLock,
          targetRegionId: selectedMaskRegionId ?? "base",
          constraints: {
            keepProportion: true,
            keepStructure: true,
            onlyModifyMaterial: true,
            variantCount: 6
          }
        })
      });
      const data = (await response.json()) as { variants: HighResDesignVariant[] };
      setProductDesignResults(data.variants);
      addDesignVersion({
        kind: "product-design",
        prompt: designPrompt,
        resultTitle: data.variants[0]?.title ?? "AI产品设计",
        resultImageUrl: data.variants[0]?.imageUrl ?? product.imageUrl,
        resultPreviewUrl: data.variants[0]?.materialPreviewUrl,
        resultCount: data.variants.length,
        targetRegion: selectedMaskRegion
      });
      setSelectedDesignVariantId(data.variants[0]?.id ?? null);
      setSelectedColorVariantId(null);
      setAppliedLibraryMaterial(null);
      setSelectedAmazonImageId(null);
      setSelectedEngineeringViewId(null);
      setMaterialFamily(data.variants[0]?.baseMaterial ?? "石材");
      setFinish("抛光石材");
    } finally {
      setLoading(null);
    }
  }

  async function handleGenerateColorDesigns() {
    if (!product || !productIdentity || !designLock) return;

    setLoading("color-edit");
    setActiveTool("color");

    try {
      const response = await fetch("/api/ai/color-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          prompt: colorPrompt,
          productIdentity,
          designLock,
          targetRegionId: "shade",
          constraints: {
            keepProportion: true,
            keepStructure: true,
            changedPart: "玻璃灯罩",
            colorCount: 4
          }
        })
      });
      const data = (await response.json()) as { variants: HighResColorVariant[] };
      setColorDesignResults(data.variants);
      const shadeRegion = productIdentity.maskRegions.find((region) => region.id === "shade") ?? selectedMaskRegion;
      addDesignVersion({
        kind: "color-edit",
        prompt: colorPrompt,
        resultTitle: data.variants[0]?.title ?? "颜色编辑",
        resultImageUrl: data.variants[0]?.imageUrl ?? product.imageUrl,
        resultPreviewUrl: data.variants[0]?.colorPreviewUrl,
        resultCount: data.variants.length,
        targetRegion: shadeRegion
      });
      setSelectedColorVariantId(data.variants[0]?.id ?? null);
      setSelectedDesignVariantId(null);
      setAppliedLibraryMaterial(null);
      setSelectedAmazonImageId(null);
      setSelectedEngineeringViewId(null);
      setFinish("透明染色");
    } finally {
      setLoading(null);
    }
  }

  async function handleGenerateEngineeringDrawings() {
    if (!product || !productIdentity || !designLock) return;

    setLoading("engineering");
    setActiveTool("drawing");
    setBottomTab("drawing");

    try {
      const response = await fetch("/api/ai/engineering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          productIdentity,
          designLock,
          targetRegionId: selectedMaskRegionId ?? undefined,
          dimensions: tableLampDimensions,
          components: tableLampParts
        })
      });
      const data = (await response.json()) as {
        views: EngineeringDrawingView[];
        autoExplodedParts: EngineeringExplodedPart[];
      };
      setEngineeringViews(data.views);
      setEngineeringParts(data.autoExplodedParts);
      addDesignVersion({
        kind: "engineering",
        prompt: "生成正视图、侧视图、顶视图和爆炸图",
        resultTitle: data.views[0]?.title ?? "工程尺寸图",
        resultImageUrl: data.views[0]?.imageUrl ?? product.imageUrl,
        resultCount: data.views.length,
        targetRegion: selectedMaskRegion
      });
      setSelectedEngineeringViewId(data.views[0]?.id ?? null);
      setSelectedAmazonImageId(null);
      setSelectedDesignVariantId(null);
      setSelectedColorVariantId(null);
      setAppliedLibraryMaterial(null);
    } finally {
      setLoading(null);
    }
  }

  async function handleGenerateAmazonImages() {
    if (!product || !productIdentity || !designLock) return;

    setLoading("amazon-images");
    setActiveTool("amazon");
    setBottomTab("amazon");

    try {
      const response = await fetch("/api/ai/amazon-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          category,
          marketplace: session?.marketplace ?? "US",
          productIdentity,
          designLock,
          targetRegionId: "scene",
          resolution: "1600 x 1600",
          imageCount: 9
        })
      });
      const data = (await response.json()) as { images: AmazonListingImage[] };
      setAmazonImages(data.images);
      const sceneRegion = productIdentity.maskRegions.find((region) => region.id === "scene") ?? null;
      addDesignVersion({
        kind: "amazon-images",
        prompt: "生成 Amazon 9 张图片，产品100%一致，只改变背景、场景和卖点信息",
        resultTitle: data.images[0]?.title ?? "Amazon图片",
        resultImageUrl: data.images[0]?.imageUrl ?? product.imageUrl,
        resultPreviewUrl: data.images[0]?.layoutPreviewUrl,
        resultCount: data.images.length,
        targetRegion: sceneRegion
      });
      setSelectedAmazonImageId(data.images[0]?.id ?? null);
      setSelectedDesignVariantId(null);
      setSelectedColorVariantId(null);
      setAppliedLibraryMaterial(null);
      setSelectedEngineeringViewId(null);
    } finally {
      setLoading(null);
    }
  }

  async function generateMarketingCopyForIdentity(
    targetIdentity: ProductIdentity,
    targetDesignLock: DesignLock,
    options: {
      productDisplayName?: string;
      switchTool?: boolean;
      mode?: MarketingCopyMode;
      language?: MarketingLanguage;
    } = {}
  ) {
    setLoading("marketing-copy");
    if (options.switchTool) {
      setActiveTool("marketing-copy");
    }

    const mode = options.mode ?? marketingCopyMode;
    const language = options.language ?? marketingLanguage;

    try {
      const response = await fetch("/api/ai/marketing-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: options.productDisplayName ?? productName,
          productIdentity: targetIdentity,
          designLock: targetDesignLock,
          mode,
          language
        })
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        setUploadError(error?.message ?? "Marketing copy requires Product Identity and Design Lock.");
        return null;
      }

      const data = (await response.json()) as { copy: MarketingCopy };
      setMarketingCopy(data.copy);
      setMarketingCopyMode(data.copy.mode);
      setMarketingLanguage(data.copy.language);
      return data.copy;
    } finally {
      setLoading(null);
    }
  }

  async function handleGenerateMarketingCopy() {
    if (!productIdentity || !designLock) return;

    await generateMarketingCopyForIdentity(productIdentity, designLock, {
      switchTool: true,
      mode: marketingCopyMode,
      language: marketingLanguage
    });
  }

  async function handleGenerateMarketingLayouts() {
    if (!product || !productIdentity || !designLock) return;

    const copy =
      marketingCopy ??
      (await generateMarketingCopyForIdentity(productIdentity, designLock, {
        productDisplayName: productName,
        switchTool: false,
        mode: marketingCopyMode,
        language: marketingLanguage
      }));

    if (!copy) return;

    setLoading("marketing-layout");
    setActiveTool("marketing-layout");

    try {
      const response = await fetch("/api/ai/marketing-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          productIdentity,
          designLock,
          copy,
          mode: marketingCopyMode,
          language: marketingLanguage
        })
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        setUploadError(error?.message ?? "Marketing auto layout requires original reference.");
        return;
      }

      const data = (await response.json()) as {
        layouts: MarketingAutoLayout[];
        marketingAssets: MarketingAsset[];
      };
      setMarketingLayouts(data.layouts);
      setMarketingAssets(data.marketingAssets);
      setSelectedMarketingLayoutId(data.layouts[0]?.id ?? null);
      setSelectedMarketingLayerId(data.layouts[0]?.layers[0]?.id ?? null);
      addDesignVersion({
        kind: "marketing-layout",
        prompt: "AI Marketing Image Studio Auto Layout / Amazon 9 Images",
        resultTitle: data.layouts[0]?.templateName ?? "Marketing Layout",
        resultImageUrl: data.layouts[0]?.imageUrl ?? product.imageUrl,
        resultPreviewUrl: data.layouts[0]?.layoutPreviewUrl,
        resultCount: data.layouts.length,
        targetRegion: productIdentity.maskRegions.find((region) => region.id === "scene") ?? null
      });
    } finally {
      setLoading(null);
    }
  }

  function handleSelectMarketingLayout(layoutId: string) {
    const layout = marketingLayouts.find((item) => item.id === layoutId);
    setSelectedMarketingLayoutId(layoutId);
    setSelectedMarketingLayerId(layout?.layers[0]?.id ?? null);
    setActiveTool("marketing-layout");
  }

  function handleUpdateMarketingLayer(layerId: string, patch: Partial<MarketingEditorLayer>) {
    setMarketingLayouts((current) =>
      current.map((layout) =>
        layout.id === selectedMarketingLayoutId
          ? {
              ...layout,
              layers: layout.layers.map((layer) => (layer.id === layerId ? { ...layer, ...patch } : layer))
            }
          : layout
      )
    );
  }

  function handleAddMarketingTextLayer() {
    if (!selectedMarketingLayout) return;

    const layer: MarketingEditorLayer = {
      id: makeId("layer"),
      type: "text",
      text: marketingCopy?.imageCopy[0] ?? "New Selling Point",
      x: 8,
      y: 14,
      width: 46,
      fontSize: 34,
      fontFamily: "Inter",
      fontWeight: "800",
      color: "#111827",
      opacity: 1,
      align: "left"
    };
    appendMarketingLayer(layer);
  }

  function handleAddMarketingIconLayer(icon: MarketingLayerIcon) {
    if (!selectedMarketingLayout) return;

    const layer: MarketingEditorLayer = {
      id: makeId("layer"),
      type: "icon",
      icon,
      text: "Feature",
      x: 8,
      y: 72,
      width: 24,
      fontSize: 18,
      fontFamily: "Inter",
      fontWeight: "700",
      color: "#111827",
      opacity: 0.95,
      align: "center"
    };
    appendMarketingLayer(layer);
  }

  function appendMarketingLayer(layer: MarketingEditorLayer) {
    setMarketingLayouts((current) =>
      current.map((layout) =>
        layout.id === selectedMarketingLayoutId ? { ...layout, layers: [...layout.layers, layer] } : layout
      )
    );
    setSelectedMarketingLayerId(layer.id);
  }

  function handleDeleteMarketingLayer() {
    if (!selectedMarketingLayout || !selectedMarketingLayerId) return;

    setMarketingLayouts((current) =>
      current.map((layout) =>
        layout.id === selectedMarketingLayout.id
          ? { ...layout, layers: layout.layers.filter((layer) => layer.id !== selectedMarketingLayerId) }
          : layout
      )
    );
    setSelectedMarketingLayerId(null);
  }

  async function handleModifyMaterial() {
    if (!product || !selectedConceptId || !productIdentity || !designLock) return;

    setLoading("material");

    try {
      const response = await fetch("/api/ai/material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId: selectedConceptId,
          materialFamily,
          finish,
          productIdentity,
          designLock,
          targetRegionId: selectedMaskRegionId ?? "base"
        })
      });
      const data = (await response.json()) as { recommendation: MaterialRecommendation };
      setMaterial(data.recommendation);
      addDesignVersion({
        kind: "material-edit",
        prompt: `${selectedMaskRegion?.label ?? "Base"} / ${materialFamily} / ${finish}`,
        resultTitle: data.recommendation.materialFamily,
        resultImageUrl: product.imageUrl,
        resultCount: 1,
        targetRegion: selectedMaskRegion
      });
      setAppliedLibraryMaterial(null);
      setSelectedAmazonImageId(null);
      setSelectedEngineeringViewId(null);
      setActiveTool("material");
    } finally {
      setLoading(null);
    }
  }

  function handleApplyLibraryMaterial(item: MaterialLibraryItem) {
    if (!product || !productIdentity || !designLock) return;

    const libraryTargetRegionId: ProductMaskRegionId = item.category === "Glass" ? "shade" : "base";
    const libraryTargetRegion = productIdentity.maskRegions.find((region) => region.id === libraryTargetRegionId) ?? selectedMaskRegion;

    setAppliedLibraryMaterial(item);
    setMaterial(buildLibraryMaterialRecommendation(item));
    addDesignVersion({
      kind: "material-library",
      prompt: `Apply ${item.name} to ${item.targetPart}`,
      resultTitle: item.name,
      resultImageUrl: product.imageUrl,
      resultPreviewUrl: item.productRenderUrl,
      resultCount: 1,
      targetRegion: libraryTargetRegion
    });
    setMaterialFamily(item.name);
    setFinish(item.gloss.label);
    setSelectedDesignVariantId(null);
    setSelectedColorVariantId(null);
    setSelectedAmazonImageId(null);
    setSelectedEngineeringViewId(null);
    setActiveTool("material-library");
  }

  function addDesignVersion(input: {
    kind: DesignVersionKind;
    prompt: string;
    resultTitle: string;
    resultImageUrl: string;
    resultPreviewUrl?: string;
    resultCount?: number;
    targetRegion: ProductMaskRegion | null;
  }) {
    if (!product || !productIdentity || !designLock) return;

    const version: DesignVersion = {
      id: makeId("version"),
      label: buildVersionLabel(designVersions.length),
      kind: input.kind,
      createdAt: new Date().toISOString(),
      originalImageUrl: product.imageUrl,
      prompt: input.prompt,
      targetRegion: input.targetRegion,
      productIdentity,
      designLock,
      resultTitle: input.resultTitle,
      resultImageUrl: input.resultImageUrl,
      resultPreviewUrl: input.resultPreviewUrl,
      resultCount: input.resultCount
    };

    setDesignVersions((current) => [version, ...current].slice(0, 12));
    setSelectedDesignVersionId(version.id);
    setRestoredVersion(null);
  }

  function handleRestoreVersion(versionId: string) {
    const version = designVersions.find((item) => item.id === versionId);
    if (!version) return;

    setSelectedDesignVersionId(version.id);
    setRestoredVersion(version);
    setSelectedMaskRegionId(version.targetRegion?.id ?? selectedMaskRegionId);

    if (version.kind === "product-design") {
      setActiveTool("ai-design");
      setSelectedAmazonImageId(null);
      setSelectedEngineeringViewId(null);
    } else if (version.kind === "color-edit") {
      setActiveTool("color");
      setSelectedAmazonImageId(null);
      setSelectedEngineeringViewId(null);
    } else if (version.kind === "amazon-images") {
      setActiveTool("amazon");
      setBottomTab("amazon");
    } else if (version.kind === "engineering") {
      setActiveTool("drawing");
      setBottomTab("drawing");
    } else if (version.kind === "marketing-layout") {
      setActiveTool("marketing-layout");
    } else {
      setActiveTool("material");
    }
  }

  function buildMarketingAssetsForSave() {
    if (!product || !productIdentity || !designLock || marketingLayouts.length === 0) {
      return marketingAssets;
    }

    return marketingLayouts.map((layout, index) => {
      const existing = marketingAssets.find((asset) => asset.layout.id === layout.id);
      const template = amazonMarketingTemplates.find((item) => item.id === layout.templateId) ?? amazonMarketingTemplates[0];

      return {
        id: existing?.id ?? makeId("marketing-asset"),
        productId: product.id,
        imageId: layout.imageId,
        copyText: layout.layers.map((layer) => layer.text).filter(Boolean).join(" | "),
        template,
        version: existing?.version ?? buildVersionLabel(index),
        language: layout.language,
        layout,
        original_reference: productIdentity.imageReference,
        product_identity: productIdentity,
        design_lock: designLock,
        createdAt: existing?.createdAt ?? new Date().toISOString()
      };
    });
  }

  function buildProject(status: SavedProject["status"]): SavedProject | null {
    if (!session || !product) return null;

    return {
      id: makeId("project"),
      sellerName: session.sellerName,
      marketplace: session.marketplace,
      product: {
        ...product,
        name: productName.trim() || product.name,
        category
      },
      productIdentity,
      designLock,
      analysis,
      concepts,
      material,
      engineeringViews,
      engineeringParts,
      designVersions,
      marketingCopy,
      marketingAssets: buildMarketingAssetsForSave(),
      marketingTemplates: amazonMarketingTemplates,
      savedAt: new Date().toISOString(),
      status
    };
  }

  function handleSave() {
    const project = buildProject(material ? "Ready for sampling" : "Draft");
    if (!project) return;

    setLoading("save");
    const nextProjects = saveProject(project);
    setProjects(nextProjects);
    setLastSavedAt(project.savedAt);
    window.setTimeout(() => setLoading(null), 350);
  }

  function handleExport() {
    const project = buildProject(material ? "Ready for sampling" : "Draft");
    if (!project) return;

    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.product.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-design-project.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleOpenProject(project: SavedProject) {
    setProduct(project.product);
    setProductName(project.product.name);
    setCategory(project.product.category);
    setAnalysis(project.analysis);
    setConcepts(project.concepts);
    setSelectedConceptId(project.concepts[0]?.id ?? null);
    setMaterial(project.material);
    setProductDesignResults([]);
    setSelectedDesignVariantId(null);
    setColorDesignResults([]);
    setSelectedColorVariantId(null);
    setAppliedLibraryMaterial(null);
    setAmazonImages([]);
    setSelectedAmazonImageId(null);
    setEngineeringViews(project.engineeringViews ?? []);
    setEngineeringParts(project.engineeringParts ?? []);
    setSelectedEngineeringViewId(project.engineeringViews?.[0]?.id ?? null);
    setDesignVersions(project.designVersions ?? []);
    setSelectedDesignVersionId(project.designVersions?.[0]?.id ?? null);
    setRestoredVersion(null);
    setMarketingCopy(project.marketingCopy ?? null);
    setMarketingLayouts(project.marketingAssets?.map((asset) => asset.layout) ?? []);
    setMarketingAssets(project.marketingAssets ?? []);
    setSelectedMarketingLayoutId(project.marketingAssets?.[0]?.layout.id ?? null);
    setSelectedMarketingLayerId(project.marketingAssets?.[0]?.layout.layers[0]?.id ?? null);
    setMarketingCopyMode(project.marketingCopy?.mode ?? "amazon-conversion");
    setMarketingLanguage(project.marketingCopy?.language ?? "en");
    setSelectedMaskRegionId(project.analysis?.productIdentity.maskRegions.find((region) => region.id === "base")?.id ?? project.analysis?.productIdentity.maskRegions[0]?.id ?? null);
    setLastSavedAt(project.savedAt);
    setActiveTool("ai-design");
  }

  if (!session) {
    return <LoginCard onLogin={setSession} />;
  }

  return (
    <div className="h-screen overflow-hidden bg-studio text-zinc-100">
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFileChange} />

      <TopBar
        session={session}
        productName={productName}
        canExport={Boolean(product)}
        onExport={handleExport}
        onLogout={() => setSession(null)}
      />

      <div className="grid h-[calc(100vh-58px)] grid-cols-[236px_minmax(0,1fr)_360px] grid-rows-[minmax(0,1fr)_172px]">
        <LeftToolMenu activeTool={activeTool} onSelect={setActiveTool} />

        <ProductCanvas
          product={product}
          productName={productName}
          activeTool={activeTool}
          progress={progress}
          productIdentity={productIdentity}
          designLock={designLock}
          selectedMaskRegionId={selectedMaskRegionId}
          restoredVersion={restoredVersion}
          material={material}
          selectedConcept={selectedConcept}
          uploadAnalysisDetails={uploadAnalysisDetails}
          selectedDesignVariant={selectedDesignVariant}
          selectedColorVariant={selectedColorVariant}
          appliedLibraryMaterial={appliedLibraryMaterial}
          selectedAmazonImage={selectedAmazonImage}
          selectedEngineeringView={selectedEngineeringView}
          selectedMarketingLayout={selectedMarketingLayout}
          selectedMarketingLayerId={selectedMarketingLayerId}
          onSelectMaskRegion={setSelectedMaskRegionId}
          onSelectMarketingLayer={setSelectedMarketingLayerId}
          onUpdateMarketingLayer={handleUpdateMarketingLayer}
          onUpload={() => fileInputRef.current?.click()}
        />

        <AIAssistantPanel
          session={session}
          product={product}
          productName={productName}
          category={category}
          analysis={analysis}
          productIdentity={productIdentity}
          designLock={designLock}
          selectedMaskRegionId={selectedMaskRegionId}
          concepts={concepts}
          selectedConceptId={selectedConceptId}
          material={material}
          materialFamily={materialFamily}
          finish={finish}
          designPrompt={designPrompt}
          productDesignResults={productDesignResults}
          selectedDesignVariantId={selectedDesignVariantId}
          colorPrompt={colorPrompt}
          colorDesignResults={colorDesignResults}
          selectedColorVariantId={selectedColorVariantId}
          appliedLibraryMaterial={appliedLibraryMaterial}
          amazonImages={amazonImages}
          selectedAmazonImageId={selectedAmazonImageId}
          engineeringViews={engineeringViews}
          selectedEngineeringViewId={selectedEngineeringViewId}
          engineeringParts={engineeringParts}
          projects={projects}
          loading={loading}
          uploadError={uploadError}
          uploadAnalysisDetails={uploadAnalysisDetails}
          lastSavedAt={lastSavedAt}
          designVersions={designVersions}
          selectedDesignVersionId={selectedDesignVersionId}
          marketingCopy={marketingCopy}
          marketingCopyMode={marketingCopyMode}
          marketingLanguage={marketingLanguage}
          marketingLayouts={marketingLayouts}
          selectedMarketingLayoutId={selectedMarketingLayoutId}
          selectedMarketingLayer={selectedMarketingLayer}
          onProductNameChange={setProductName}
          onCategoryChange={setCategory}
          onAnalyze={handleAnalyze}
          onGenerateDesigns={handleGenerateDesigns}
          onDesignPromptChange={setDesignPrompt}
          onGenerateProductDesigns={handleGenerateProductDesigns}
          onSelectDesignVariant={(id) => {
            setSelectedDesignVariantId(id);
            setSelectedColorVariantId(null);
            setAppliedLibraryMaterial(null);
            setSelectedAmazonImageId(null);
            setSelectedEngineeringViewId(null);
          }}
          onColorPromptChange={setColorPrompt}
          onGenerateColorDesigns={handleGenerateColorDesigns}
          onSelectColorVariant={(id) => {
            setSelectedColorVariantId(id);
            setSelectedDesignVariantId(null);
            setAppliedLibraryMaterial(null);
            setSelectedAmazonImageId(null);
            setSelectedEngineeringViewId(null);
          }}
          onApplyLibraryMaterial={handleApplyLibraryMaterial}
          onGenerateEngineeringDrawings={handleGenerateEngineeringDrawings}
          onSelectEngineeringView={(id) => {
            setSelectedEngineeringViewId(id);
            setSelectedAmazonImageId(null);
            setSelectedDesignVariantId(null);
            setSelectedColorVariantId(null);
            setAppliedLibraryMaterial(null);
          }}
          onGenerateAmazonImages={handleGenerateAmazonImages}
          onSelectAmazonImage={(id) => {
            setSelectedAmazonImageId(id);
            setSelectedEngineeringViewId(null);
            setSelectedDesignVariantId(null);
            setSelectedColorVariantId(null);
            setAppliedLibraryMaterial(null);
          }}
          onSelectConcept={setSelectedConceptId}
          onSelectMaskRegion={setSelectedMaskRegionId}
          onMaterialFamilyChange={setMaterialFamily}
          onFinishChange={setFinish}
          onModifyMaterial={handleModifyMaterial}
          onSave={handleSave}
          onSelectDesignVersion={setSelectedDesignVersionId}
          onRestoreDesignVersion={handleRestoreVersion}
          onMarketingCopyModeChange={setMarketingCopyMode}
          onMarketingLanguageChange={setMarketingLanguage}
          onGenerateMarketingCopy={handleGenerateMarketingCopy}
          onGenerateMarketingLayouts={handleGenerateMarketingLayouts}
          onSelectMarketingLayout={handleSelectMarketingLayout}
          onAddMarketingTextLayer={handleAddMarketingTextLayer}
          onAddMarketingIconLayer={handleAddMarketingIconLayer}
          onUpdateSelectedMarketingLayer={(patch) => {
            if (selectedMarketingLayerId) {
              handleUpdateMarketingLayer(selectedMarketingLayerId, patch);
            }
          }}
          onDeleteMarketingLayer={handleDeleteMarketingLayer}
          onOpenProject={handleOpenProject}
          onUpload={() => fileInputRef.current?.click()}
        />

        <BottomModuleDock
          activeTab={bottomTab}
          product={product}
          concepts={concepts}
          material={material}
          amazonImages={amazonImages}
          selectedAmazonImageId={selectedAmazonImageId}
          engineeringViews={engineeringViews}
          selectedEngineeringViewId={selectedEngineeringViewId}
          engineeringParts={engineeringParts}
          onSelectTab={setBottomTab}
          onSelectAmazonImage={(id) => {
            setSelectedAmazonImageId(id);
            setSelectedEngineeringViewId(null);
            setSelectedDesignVariantId(null);
            setSelectedColorVariantId(null);
            setAppliedLibraryMaterial(null);
          }}
          onSelectEngineeringView={(id) => {
            setSelectedEngineeringViewId(id);
            setSelectedAmazonImageId(null);
            setSelectedDesignVariantId(null);
            setSelectedColorVariantId(null);
            setAppliedLibraryMaterial(null);
          }}
        />
      </div>
    </div>
  );
}

function TopBar({
  session,
  productName,
  canExport,
  onExport,
  onLogout
}: {
  session: SellerSession;
  productName: string;
  canExport: boolean;
  onExport: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="flex h-[58px] items-center justify-between border-b border-white/10 bg-black/95 px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
          <Cuboid className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-bold text-white">AI Product Studio Pro</h1>
            <span className="rounded border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-zinc-400">
              Amazon {session.marketplace}
            </span>
          </div>
          <p className="truncate text-xs text-zinc-500">{productName || "Untitled product"} / {session.sellerName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-cyan-400/35 bg-cyan-400/10 px-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-45"
          type="button"
          disabled={!canExport}
          onClick={onExport}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          导出
        </button>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:text-white"
          type="button"
          title="退出登录"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function LeftToolMenu({
  activeTool,
  onSelect
}: {
  activeTool: string;
  onSelect: (tool: string) => void;
}) {
  return (
    <aside className="row-span-2 border-r border-white/10 bg-[#090a0c]">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">设计模块</p>
      </div>
      <nav className="p-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = activeTool === item.id;

          return (
            <button
              key={item.id}
              className={`mb-1 flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                active
                  ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-100 shadow-[inset_3px_0_0_rgba(34,211,238,0.9)]"
                  : "border border-transparent text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
              }`}
              type="button"
              onClick={() => onSelect(item.id)}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function ProductCanvas({
  product,
  productName,
  activeTool,
  progress,
  productIdentity,
  designLock,
  selectedMaskRegionId,
  restoredVersion,
  material,
  selectedConcept,
  uploadAnalysisDetails,
  selectedDesignVariant,
  selectedColorVariant,
  appliedLibraryMaterial,
  selectedAmazonImage,
  selectedEngineeringView,
  selectedMarketingLayout,
  selectedMarketingLayerId,
  onSelectMaskRegion,
  onSelectMarketingLayer,
  onUpdateMarketingLayer,
  onUpload
}: {
  product: UploadedProduct | null;
  productName: string;
  activeTool: string;
  progress: Array<{ label: string; done: boolean }>;
  productIdentity: ProductIdentity | null;
  designLock: DesignLock | null;
  selectedMaskRegionId: ProductMaskRegionId | null;
  restoredVersion: DesignVersion | null;
  material: MaterialRecommendation | null;
  selectedConcept: DesignConcept | null;
  uploadAnalysisDetails: UploadAnalysisDetails;
  selectedDesignVariant: HighResDesignVariant | null;
  selectedColorVariant: HighResColorVariant | null;
  appliedLibraryMaterial: MaterialLibraryItem | null;
  selectedAmazonImage: AmazonListingImage | null;
  selectedEngineeringView: EngineeringDrawingView | null;
  selectedMarketingLayout: MarketingAutoLayout | null;
  selectedMarketingLayerId: string | null;
  onSelectMaskRegion: (regionId: ProductMaskRegionId) => void;
  onSelectMarketingLayer: (layerId: string | null) => void;
  onUpdateMarketingLayer: (layerId: string, patch: Partial<MarketingEditorLayer>) => void;
  onUpload: () => void;
}) {
  const activeLabel = menuItems.find((item) => item.id === activeTool)?.label ?? "AI设计";
  const marketingToolActive = ["marketing-copy", "marketing-layout", "listing"].includes(activeTool);
  const renderVariant = selectedColorVariant ?? selectedDesignVariant;
  const lockedMaterialRenderUrl = appliedLibraryMaterial ? productIdentity?.imageReference.imageUrl ?? appliedLibraryMaterial.productRenderUrl : undefined;
  const renderImageUrl = restoredVersion?.resultImageUrl ?? selectedEngineeringView?.imageUrl ?? selectedAmazonImage?.imageUrl ?? lockedMaterialRenderUrl ?? renderVariant?.imageUrl;
  const renderTitle = restoredVersion ? `History / ${restoredVersion.label}` : selectedEngineeringView ? `工程图 / ${selectedEngineeringView.title}` : selectedAmazonImage ? `Amazon图片 / ${selectedAmazonImage.title}` : appliedLibraryMaterial ? `材质库 / ${appliedLibraryMaterial.name}` : renderVariant?.title ?? productName;
  const renderResolution = selectedEngineeringView?.resolution ?? selectedAmazonImage?.resolution ?? appliedLibraryMaterial?.resolution ?? renderVariant?.resolution;

  return (
    <main className="relative min-w-0 overflow-hidden border-r border-white/10 bg-[#101114]">
      <div className="flex h-12 items-center justify-between border-b border-white/10 bg-[#0c0d10]/95 px-4">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-300">
            画布 / {activeLabel}
          </span>
          <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-200">
            {productIdentity ? "Image Reference 已锁定" : "等待视觉分析"}
          </span>
          {designLock ? (
            <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-100">
              Design Lock
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
          <span>3D 视图</span>
          <span className="h-1 w-1 rounded-full bg-zinc-600" />
          <span>72%</span>
          <span className="h-1 w-1 rounded-full bg-zinc-600" />
          <span>透视</span>
        </div>
      </div>

      <div className="canvas-grid relative h-[calc(100%-48px)] overflow-hidden">
        <div className="absolute left-4 top-4 z-10 flex gap-2">
          {progress.map((item) => (
            <span
              key={item.label}
              className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                item.done ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-black/30 text-zinc-500"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>

        <div className="absolute right-4 top-4 z-10 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">当前选择</p>
          <p className="mt-1 text-xs font-semibold text-zinc-200">{selectedMarketingLayout?.templateName ?? selectedEngineeringView?.title ?? selectedConcept?.title ?? "产品主体"}</p>
          {selectedEngineeringView ? <p className="mt-1 text-[11px] font-semibold text-cyan-100">{selectedEngineeringView.scale}</p> : null}
        </div>

        <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-400/10" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-cyan-400/10" />

        <div className={`flex h-full items-center justify-center px-10 ${selectedEngineeringView ? "pb-8 pt-20" : "pb-12 pt-16"}`}>
          {product ? (
            <div className={`relative w-full ${selectedEngineeringView ? "max-w-[620px]" : "max-w-[680px]"}`}>
              <div className="absolute -inset-8 border border-cyan-400/10 bg-black/20 shadow-[0_0_90px_rgba(34,211,238,0.08)]" />
              {marketingToolActive && selectedMarketingLayout ? (
                <MarketingImageEditor
                  layout={selectedMarketingLayout}
                  selectedLayerId={selectedMarketingLayerId}
                  onSelectLayer={onSelectMarketingLayer}
                  onUpdateLayer={onUpdateMarketingLayer}
                />
              ) : (
              <div className="relative mx-auto aspect-[4/3] overflow-hidden rounded-md border border-white/10 bg-[#17191d] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={renderImageUrl ?? product.imageUrl}
                  alt={renderTitle}
                  className="h-full w-full object-contain p-8"
                />
                {!selectedEngineeringView ? (
                  <ProductMaskOverlay
                    productIdentity={productIdentity}
                    selectedRegionId={selectedMaskRegionId}
                    onSelectRegion={onSelectMaskRegion}
                  />
                ) : null}
                {!selectedEngineeringView ? (
                  <div className="absolute left-4 top-4 rounded-md border border-white/10 bg-black/50 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                      {selectedAmazonImage ? "Amazon 图片" : appliedLibraryMaterial || renderVariant ? "AI 产品渲染" : "产品图层"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-100">{renderTitle}</p>
                    {renderResolution ? <p className="mt-1 text-[11px] text-cyan-100">{renderResolution}</p> : null}
                  </div>
                ) : null}
                {selectedEngineeringView ? (
                  <div className="absolute bottom-4 right-4 max-w-[260px] rounded-md border border-cyan-400/20 bg-black/60 px-3 py-2">
                    <p className="text-xs font-semibold text-cyan-100">{selectedEngineeringView.title} / {selectedEngineeringView.scale}</p>
                    <p className="mt-1 text-[11px] leading-4 text-zinc-500">{selectedEngineeringView.drawingNotes[0]}</p>
                  </div>
                ) : selectedAmazonImage ? (
                  <div className="absolute bottom-4 right-4 rounded-md border border-cyan-400/20 bg-black/60 px-3 py-2">
                    <p className="text-xs font-semibold text-cyan-100">{selectedAmazonImage.imageType}</p>
                    <p className="text-[11px] text-zinc-500">{selectedAmazonImage.amazonUse}</p>
                  </div>
                ) : appliedLibraryMaterial ? (
                  <div className="absolute bottom-4 right-4 rounded-md border border-cyan-400/20 bg-black/60 px-3 py-2">
                    <p className="text-xs font-semibold text-cyan-100">{appliedLibraryMaterial.name}</p>
                    <p className="text-[11px] text-zinc-500">已应用到 {appliedLibraryMaterial.targetPart}</p>
                  </div>
                ) : selectedColorVariant ? (
                  <div className="absolute bottom-4 right-4 rounded-md border border-cyan-400/20 bg-black/60 px-3 py-2">
                    <p className="text-xs font-semibold text-cyan-100">{selectedColorVariant.shadeColor}</p>
                    <p className="text-[11px] text-zinc-500">仅修改玻璃灯罩颜色</p>
                  </div>
                ) : selectedDesignVariant ? (
                  <div className="absolute bottom-4 right-4 rounded-md border border-cyan-400/20 bg-black/60 px-3 py-2">
                    <p className="text-xs font-semibold text-cyan-100">{selectedDesignVariant.baseMaterial}</p>
                    <p className="text-[11px] text-zinc-500">仅修改底座材质</p>
                  </div>
                ) : material ? (
                  <div className="absolute bottom-4 right-4 rounded-md border border-cyan-400/20 bg-black/60 px-3 py-2">
                    <p className="text-xs font-semibold text-cyan-100">{material.materialFamily}</p>
                    <p className="text-[11px] text-zinc-500">{material.finish}</p>
                  </div>
                ) : null}
              </div>
              )}
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <AnalysisMetric label="产品类型" value={uploadAnalysisDetails.productType} />
                <AnalysisMetric label="结构" value={uploadAnalysisDetails.structure} />
                <AnalysisMetric label="材质" value={uploadAnalysisDetails.material} />
                <div className="rounded-md border border-cyan-400/15 bg-black/35 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">可编辑区域</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {uploadAnalysisDetails.editableAreas.map((area) => (
                      <span key={area} className="rounded border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] font-semibold text-cyan-100">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {designLock ? (
                <div className="mt-3 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">Design Lock</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-300">
                    锁定产品轮廓、尺寸比例、零件位置、摄影角度；仅允许修改 {designLock.allowedEdits.join(" / ")}。
                  </p>
                </div>
              ) : null}
              <div className="mx-auto mt-5 h-5 w-2/3 rounded-[50%] bg-black/60 blur-lg" />
            </div>
          ) : (
            <button
              className="flex min-h-[330px] w-full max-w-[560px] flex-col items-center justify-center rounded-md border border-dashed border-cyan-400/30 bg-black/25 text-center transition hover:border-cyan-300 hover:bg-cyan-400/5"
              type="button"
              onClick={onUpload}
            >
              <ImagePlus className="mb-4 h-12 w-12 text-cyan-200" aria-hidden="true" />
              <span className="text-base font-bold text-white">上传产品图片</span>
              <span className="mt-2 text-sm text-zinc-500">Product canvas will generate analysis layers after upload.</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function AIAssistantPanel({
  session,
  product,
  productName,
  category,
  analysis,
  productIdentity,
  designLock,
  selectedMaskRegionId,
  concepts,
  selectedConceptId,
  material,
  materialFamily,
  finish,
  designPrompt,
  productDesignResults,
  selectedDesignVariantId,
  colorPrompt,
  colorDesignResults,
  selectedColorVariantId,
  appliedLibraryMaterial,
  amazonImages,
  selectedAmazonImageId,
  engineeringViews,
  selectedEngineeringViewId,
  engineeringParts,
  projects,
  loading,
  uploadError,
  uploadAnalysisDetails,
  lastSavedAt,
  designVersions,
  selectedDesignVersionId,
  marketingCopy,
  marketingCopyMode,
  marketingLanguage,
  marketingLayouts,
  selectedMarketingLayoutId,
  selectedMarketingLayer,
  onProductNameChange,
  onCategoryChange,
  onAnalyze,
  onGenerateDesigns,
  onDesignPromptChange,
  onGenerateProductDesigns,
  onSelectDesignVariant,
  onColorPromptChange,
  onGenerateColorDesigns,
  onSelectColorVariant,
  onApplyLibraryMaterial,
  onGenerateEngineeringDrawings,
  onSelectEngineeringView,
  onGenerateAmazonImages,
  onSelectAmazonImage,
  onSelectConcept,
  onSelectMaskRegion,
  onMaterialFamilyChange,
  onFinishChange,
  onModifyMaterial,
  onSave,
  onSelectDesignVersion,
  onRestoreDesignVersion,
  onMarketingCopyModeChange,
  onMarketingLanguageChange,
  onGenerateMarketingCopy,
  onGenerateMarketingLayouts,
  onSelectMarketingLayout,
  onAddMarketingTextLayer,
  onAddMarketingIconLayer,
  onUpdateSelectedMarketingLayer,
  onDeleteMarketingLayer,
  onOpenProject,
  onUpload
}: {
  session: SellerSession;
  product: UploadedProduct | null;
  productName: string;
  category: string;
  analysis: ProductAnalysis | null;
  productIdentity: ProductIdentity | null;
  designLock: DesignLock | null;
  selectedMaskRegionId: ProductMaskRegionId | null;
  concepts: DesignConcept[];
  selectedConceptId: string | null;
  material: MaterialRecommendation | null;
  materialFamily: string;
  finish: string;
  designPrompt: string;
  productDesignResults: HighResDesignVariant[];
  selectedDesignVariantId: string | null;
  colorPrompt: string;
  colorDesignResults: HighResColorVariant[];
  selectedColorVariantId: string | null;
  appliedLibraryMaterial: MaterialLibraryItem | null;
  amazonImages: AmazonListingImage[];
  selectedAmazonImageId: string | null;
  engineeringViews: EngineeringDrawingView[];
  selectedEngineeringViewId: string | null;
  engineeringParts: EngineeringExplodedPart[];
  projects: SavedProject[];
  loading: LoadingTask;
  uploadError: string | null;
  uploadAnalysisDetails: UploadAnalysisDetails;
  lastSavedAt: string | null;
  designVersions: DesignVersion[];
  selectedDesignVersionId: string | null;
  marketingCopy: MarketingCopy | null;
  marketingCopyMode: MarketingCopyMode;
  marketingLanguage: MarketingLanguage;
  marketingLayouts: MarketingAutoLayout[];
  selectedMarketingLayoutId: string | null;
  selectedMarketingLayer: MarketingEditorLayer | null;
  onProductNameChange: (name: string) => void;
  onCategoryChange: (category: string) => void;
  onAnalyze: () => void;
  onGenerateDesigns: () => void;
  onDesignPromptChange: (prompt: string) => void;
  onGenerateProductDesigns: () => void;
  onSelectDesignVariant: (id: string) => void;
  onColorPromptChange: (prompt: string) => void;
  onGenerateColorDesigns: () => void;
  onSelectColorVariant: (id: string) => void;
  onApplyLibraryMaterial: (item: MaterialLibraryItem) => void;
  onGenerateEngineeringDrawings: () => void;
  onSelectEngineeringView: (id: string) => void;
  onGenerateAmazonImages: () => void;
  onSelectAmazonImage: (id: string) => void;
  onSelectConcept: (id: string) => void;
  onSelectMaskRegion: (regionId: ProductMaskRegionId) => void;
  onMaterialFamilyChange: (value: string) => void;
  onFinishChange: (value: string) => void;
  onModifyMaterial: () => void;
  onSave: () => void;
  onSelectDesignVersion: (versionId: string) => void;
  onRestoreDesignVersion: (versionId: string) => void;
  onMarketingCopyModeChange: (mode: MarketingCopyMode) => void;
  onMarketingLanguageChange: (language: MarketingLanguage) => void;
  onGenerateMarketingCopy: () => void;
  onGenerateMarketingLayouts: () => void;
  onSelectMarketingLayout: (layoutId: string) => void;
  onAddMarketingTextLayer: () => void;
  onAddMarketingIconLayer: (icon: MarketingLayerIcon) => void;
  onUpdateSelectedMarketingLayer: (patch: Partial<MarketingEditorLayer>) => void;
  onDeleteMarketingLayer: () => void;
  onOpenProject: (project: SavedProject) => void;
  onUpload: () => void;
}) {
  const productIdentityJson = productIdentity ? JSON.stringify(toProductIdentityPreview(productIdentity), null, 2) : "";

  return (
    <aside className="row-span-2 overflow-hidden bg-[#0b0c0f]">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-violet-300/25 bg-violet-400/10 text-violet-200">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI设计助手</h2>
              <p className="text-xs text-zinc-500">{session.email}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <PanelBlock title="项目输入">
            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-500">产品名称</span>
              <input
                className="h-9 w-full rounded-md border border-white/10 bg-black/35 px-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/60"
                value={productName}
                onChange={(event) => onProductNameChange(event.target.value)}
              />
            </label>
            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-500">品类</span>
              <select
                className="h-9 w-full rounded-md border border-white/10 bg-black/35 px-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/60"
                value={category}
                onChange={(event) => onCategoryChange(event.target.value)}
              >
                {categoryOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <button
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.06] text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.1]"
              type="button"
              onClick={onUpload}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              上传产品
            </button>
            <p className="mt-2 text-[11px] text-zinc-500">支持 JPG、PNG。上传后自动进入 AI 分析。</p>
            {uploadError ? <p className="mt-2 rounded border border-red-400/25 bg-red-500/10 px-2 py-1.5 text-xs text-red-200">{uploadError}</p> : null}
          </PanelBlock>

          <PanelBlock title="Image Reference模式">
            {!product ? (
              <EmptyPanel icon={ImagePlus} label="上传产品后建立图片引用" />
            ) : !productIdentity || !designLock ? (
              <div className="rounded-md border border-amber-400/25 bg-amber-400/10 p-3">
                <p className="text-xs font-bold text-amber-100">等待视觉模型分析</p>
                <p className="mt-2 text-[11px] leading-5 text-zinc-400">
                  上传图已就绪，但还没有 Product Identity JSON。生成图片前必须先锁定上传产品身份。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-md border border-emerald-400/20 bg-emerald-400/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-emerald-100">Reference 已锁定</p>
                    <span className="rounded bg-black/35 px-2 py-0.5 text-[10px] font-bold text-emerald-100">
                      {productIdentity.imageReference.referenceStrength}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-[11px] text-zinc-300">{productIdentity.imageReference.fileName}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">Identity / {productIdentity.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["产品轮廓", "尺寸比例", "零件位置", "摄影角度"].map((item) => (
                    <div key={item} className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1.5 text-[11px] font-semibold text-cyan-100">
                      锁定 {item}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-zinc-500">允许修改</p>
                  <div className="flex flex-wrap gap-1.5">
                    {designLock.allowedEdits.map((item) => (
                      <span key={item} className="rounded border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[11px] font-semibold text-emerald-100">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <pre className="max-h-56 overflow-auto rounded-md border border-white/10 bg-black/35 p-3 text-[10px] leading-4 text-zinc-400">
                  {productIdentityJson}
                </pre>
              </div>
            )}
          </PanelBlock>

          <PanelBlock title="AI Debug">
            <AIDebugPanel
              product={product}
              productIdentity={productIdentity}
              designLock={designLock}
              aiDebug={analysis?.aiDebug ?? null}
            />
          </PanelBlock>

          <PanelBlock title="Product Identity">
            <ProductIdentityPanel productIdentity={productIdentity} designLock={designLock} />
          </PanelBlock>

          <PanelBlock title="Product Mask">
            <ProductMaskPanel
              productIdentity={productIdentity}
              selectedRegionId={selectedMaskRegionId}
              onSelectRegion={onSelectMaskRegion}
            />
          </PanelBlock>

          <PanelBlock title="Design Lock">
            <DesignLockPanel designLock={designLock} />
          </PanelBlock>

          <PanelBlock title="AI流程">
            <div className="grid gap-2">
              <ActionButton disabled={!product} loading={loading === "analyze"} icon={ScanLine} onClick={onAnalyze}>
                AI分析产品
              </ActionButton>
              <ActionButton disabled={!productIdentity || !designLock} loading={loading === "design"} icon={Sparkles} onClick={onGenerateDesigns}>
                生成设计方案
              </ActionButton>
            </div>

            {analysis ? (
              <div className="mt-4 rounded-md border border-emerald-400/20 bg-emerald-400/10 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-200">机会评分</span>
                  <span className="text-lg font-black text-white">{analysis.opportunityScore}</span>
                </div>
                <p className="text-xs leading-5 text-zinc-300">{analysis.positioning}</p>
              </div>
            ) : null}
          </PanelBlock>

          <PanelBlock title="AI分析结果">
            {!product ? (
              <EmptyPanel icon={ScanLine} label="上传 JPG 或 PNG 后自动分析" />
            ) : loading === "analyze" ? (
              <div className="rounded-md border border-cyan-400/25 bg-cyan-400/10 p-3 text-sm font-semibold text-cyan-100">
                正在调用视觉模型识别产品类型、零件结构、材质、比例和关键特征...
              </div>
            ) : (
              <div className="space-y-3">
                <AnalysisRow label="产品类型" value={uploadAnalysisDetails.productType} />
                <AnalysisRow label="结构" value={uploadAnalysisDetails.structure} />
                <AnalysisRow label="材质" value={uploadAnalysisDetails.material} />
                <div>
                  <p className="mb-2 text-xs font-semibold text-zinc-500">可编辑区域</p>
                  <div className="flex flex-wrap gap-2">
                    {uploadAnalysisDetails.editableAreas.map((area) => (
                      <span key={area} className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </PanelBlock>

          <PanelBlock title="AI产品设计">
            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-500">设计指令</span>
              <textarea
                className="min-h-20 w-full resize-none rounded-md border border-white/10 bg-black/35 px-3 py-2 text-sm leading-5 text-zinc-100 outline-none transition focus:border-cyan-300/60"
                value={designPrompt}
                onChange={(event) => onDesignPromptChange(event.target.value)}
              />
            </label>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {["Image Reference", "Design Lock", "只修改材质", "禁止重创产品"].map((rule) => (
                <div key={rule} className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-100">
                  {rule}
                </div>
              ))}
            </div>
            <ActionButton disabled={!productIdentity || !designLock} loading={loading === "product-design"} icon={Wand2} onClick={onGenerateProductDesigns}>
              生成6个高清方案
            </ActionButton>

            {productDesignResults.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {productDesignResults.map((variant) => {
                  const selected = variant.id === selectedDesignVariantId;
                  return (
                    <div
                      key={variant.id}
                      className={`rounded-md border p-2 transition ${
                        selected ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-black/25"
                      }`}
                    >
                      <button className="block w-full text-left" type="button" onClick={() => onSelectDesignVariant(variant.id)}>
                        <div className="aspect-square overflow-hidden rounded bg-black">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={variant.imageUrl} alt={variant.title} className="h-full w-full object-cover" />
                        </div>
                        <p className="mt-2 truncate text-xs font-bold text-zinc-100">{variant.title}</p>
                        <p className="text-[11px] text-zinc-500">{variant.resolution}</p>
                        {variant.lockSummary ? <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-emerald-200">{variant.lockSummary}</p> : null}
                      </button>
                      <a
                        className="mt-2 inline-flex h-7 w-full items-center justify-center gap-1 rounded border border-white/10 bg-white/[0.06] text-[11px] font-bold text-zinc-200 transition hover:bg-white hover:text-black"
                        href={variant.imageUrl}
                        download
                      >
                        <Download className="h-3 w-3" aria-hidden="true" />
                        下载高清图
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </PanelBlock>

          <PanelBlock title="颜色编辑">
            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-500">颜色指令</span>
              <textarea
                className="min-h-20 w-full resize-none rounded-md border border-white/10 bg-black/35 px-3 py-2 text-sm leading-5 text-zinc-100 outline-none transition focus:border-cyan-300/60"
                value={colorPrompt}
                onChange={(event) => onColorPromptChange(event.target.value)}
              />
            </label>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {["玻璃灯罩", "琥珀色", "烟灰色", "橄榄绿", "透明"].map((color) => (
                <div key={color} className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1.5 text-[11px] font-semibold text-cyan-100">
                  {color}
                </div>
              ))}
            </div>
            <ActionButton disabled={!productIdentity || !designLock} loading={loading === "color-edit"} icon={Palette} onClick={onGenerateColorDesigns}>
              生成4个灯罩颜色
            </ActionButton>

            {colorDesignResults.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {colorDesignResults.map((variant) => {
                  const selected = variant.id === selectedColorVariantId;
                  return (
                    <div
                      key={variant.id}
                      className={`rounded-md border p-2 transition ${
                        selected ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-black/25"
                      }`}
                    >
                      <button className="block w-full text-left" type="button" onClick={() => onSelectColorVariant(variant.id)}>
                        <div className="aspect-square overflow-hidden rounded bg-black">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={variant.imageUrl} alt={variant.title} className="h-full w-full object-cover" />
                        </div>
                        <p className="mt-2 truncate text-xs font-bold text-zinc-100">{variant.title}</p>
                        <p className="text-[11px] text-zinc-500">{variant.resolution}</p>
                        {variant.lockSummary ? <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-emerald-200">{variant.lockSummary}</p> : null}
                      </button>
                      <a
                        className="mt-2 inline-flex h-7 w-full items-center justify-center gap-1 rounded border border-white/10 bg-white/[0.06] text-[11px] font-bold text-zinc-200 transition hover:bg-white hover:text-black"
                        href={variant.imageUrl}
                        download
                      >
                        <Download className="h-3 w-3" aria-hidden="true" />
                        下载高清图
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </PanelBlock>

          <PanelBlock title="设计方案">
            {concepts.length === 0 ? (
              <EmptyPanel icon={Lightbulb} label="等待生成设计方向" />
            ) : (
              <div className="space-y-2">
                {concepts.map((concept) => {
                  const selected = concept.id === selectedConceptId;
                  return (
                    <button
                      key={concept.id}
                      className={`w-full rounded-md border p-3 text-left transition ${
                        selected ? "border-cyan-300/50 bg-cyan-400/10" : "border-white/10 bg-black/25 hover:bg-white/[0.05]"
                      }`}
                      type="button"
                      onClick={() => onSelectConcept(concept.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-white">{concept.title}</h3>
                        <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-cyan-100">{concept.score}</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-zinc-400">{concept.promise}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </PanelBlock>

          <PanelBlock title="材质库">
            <div className="mb-3 grid grid-cols-2 gap-2">
              {materialLibraryItems.map((item) => {
                const selected = item.id === appliedLibraryMaterial?.id;
                return (
                  <button
                    key={item.id}
                    className={`min-w-0 rounded-md border p-2 text-left transition ${
                      selected ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/[0.05]"
                    } disabled:cursor-not-allowed disabled:opacity-45`}
                    type="button"
                    disabled={!productIdentity || !designLock}
                    onClick={() => onApplyLibraryMaterial(item)}
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold text-zinc-100">{item.name}</p>
                      <span className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">{item.category === "Glass" ? "玻璃" : "石材"}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-zinc-500">纹理 / {item.texture}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-4 w-4 shrink-0 rounded border border-white/20" style={{ backgroundColor: item.color.hex }} />
                      <span className="truncate text-[10px] font-semibold text-zinc-300">颜色 / {item.color.name}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] font-semibold text-zinc-500">
                      <span>R {item.gloss.roughness}</span>
                      <span>S {item.gloss.specular}</span>
                      <span>C {item.gloss.clearcoat}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {appliedLibraryMaterial ? (
              <div className="rounded-md border border-cyan-400/20 bg-cyan-400/10 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-cyan-100">{appliedLibraryMaterial.name}</p>
                  <span className="rounded bg-black/35 px-2 py-0.5 text-[10px] font-bold text-cyan-100">{appliedLibraryMaterial.targetPart}</span>
                </div>
                <p className="text-[11px] leading-5 text-zinc-300">{appliedLibraryMaterial.texture}</p>
                <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                  光泽 / {appliedLibraryMaterial.gloss.label} · 粗糙度 {appliedLibraryMaterial.gloss.roughness} · 高光 {appliedLibraryMaterial.gloss.specular}
                </p>
              </div>
            ) : (
              <p className="text-[11px] leading-5 text-zinc-500">上传并完成视觉分析后，点击材质即可应用到玻璃灯罩或大理石底座，并保持原产品 reference。</p>
            )}
          </PanelBlock>

          <PanelBlock title="工程尺寸图">
            <div className="mb-3 rounded-md border border-white/10 bg-black/25 p-3">
              <p className="text-xs font-bold text-zinc-100">输入：自动拆解台灯</p>
              <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                生成正视图、侧视图、顶视图和爆炸图；锁定总高 {tableLampDimensions.heightCm}cm、灯罩 {tableLampDimensions.shadeCm}cm、底座 {tableLampDimensions.baseCm}cm。
              </p>
            </div>
            <div className="mb-3 grid grid-cols-4 gap-2">
              {["正视图", "侧视图", "顶视图", "爆炸图"].map((view) => (
                <div key={view} className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1.5 text-center text-[11px] font-semibold text-cyan-100">
                  {view}
                </div>
              ))}
            </div>
            <ActionButton disabled={!productIdentity || !designLock} loading={loading === "engineering"} icon={PenTool} onClick={onGenerateEngineeringDrawings}>
              生成工程尺寸图
            </ActionButton>

            {engineeringViews.length > 0 ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {engineeringViews.map((view) => {
                    const selected = view.id === selectedEngineeringViewId;
                    return (
                      <div
                        key={view.id}
                        className={`rounded-md border p-2 transition ${
                          selected ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-black/25"
                        }`}
                      >
                        <button className="block w-full text-left" type="button" onClick={() => onSelectEngineeringView(view.id)}>
                          <div className="aspect-[4/3] overflow-hidden rounded bg-[#08090b]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={view.imageUrl} alt={view.title} className="h-full w-full object-cover" />
                          </div>
                          <p className="mt-2 truncate text-xs font-bold text-zinc-100">{view.index}. {view.title}</p>
                          <p className="text-[11px] text-zinc-500">{view.scale} / {view.resolution}</p>
                        </button>
                        <a
                          className="mt-2 inline-flex h-7 w-full items-center justify-center gap-1 rounded border border-white/10 bg-white/[0.06] text-[11px] font-bold text-zinc-200 transition hover:bg-white hover:text-black"
                          href={view.imageUrl}
                          download
                        >
                          <Download className="h-3 w-3" aria-hidden="true" />
                          下载SVG
                        </a>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 rounded-md border border-white/10 bg-black/25 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-cyan-100" aria-hidden="true" />
                    <p className="text-xs font-bold text-zinc-100">自动拆件</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {engineeringParts.map((part) => (
                      <span key={part.name} className="rounded border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] font-semibold text-cyan-100">
                        {part.order}. {part.name}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </PanelBlock>

          <PanelBlock title="Amazon图片生成">
            <div className="mb-3 grid grid-cols-3 gap-2">
              {["1600×1600", "9张图片", "Amazon US"].map((item) => (
                <div key={item} className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1.5 text-center text-[11px] font-semibold text-cyan-100">
                  {item}
                </div>
              ))}
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {[
                `总高 ${tableLampDimensions.heightCm}cm`,
                `灯罩 ${tableLampDimensions.shadeCm}cm`,
                `底座 ${tableLampDimensions.baseCm}cm`
              ].map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-black/25 px-2 py-1.5 text-center text-[11px] font-semibold text-zinc-300">
                  {item}
                </div>
              ))}
            </div>
            <div className="mb-3 rounded-md border border-white/10 bg-black/25 p-3">
              <p className="text-xs font-bold text-zinc-100">美国 Amazon 规则</p>
              <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                主图纯白底、无文字、无徽章、无道具；所有图片必须使用上传产品作为 reference，避免虚假认证、评分语言和随机替换产品。
              </p>
            </div>
            <ActionButton disabled={!productIdentity || !designLock} loading={loading === "amazon-images"} icon={FileImage} onClick={onGenerateAmazonImages}>
              自动生成9张Amazon图片
            </ActionButton>

            {amazonImages.length > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {amazonImages.map((image) => {
                  const selected = image.id === selectedAmazonImageId;
                  return (
                    <div
                      key={image.id}
                      className={`rounded-md border p-2 transition ${
                        selected ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-black/25"
                      }`}
                    >
                      <button className="block w-full text-left" type="button" onClick={() => onSelectAmazonImage(image.id)}>
                        <div className="aspect-square overflow-hidden rounded bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.imageUrl} alt={image.title} className="h-full w-full object-cover" />
                        </div>
                        <p className="mt-2 truncate text-[11px] font-bold text-zinc-100">{image.index}. {image.title}</p>
                        <p className="text-[10px] text-zinc-500">{image.resolution}</p>
                      </button>
                      <a
                        className="mt-2 inline-flex h-7 w-full items-center justify-center gap-1 rounded border border-white/10 bg-white/[0.06] text-[10px] font-bold text-zinc-200 transition hover:bg-white hover:text-black"
                        href={image.imageUrl}
                        download
                      >
                        <Download className="h-3 w-3" aria-hidden="true" />
                        下载
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </PanelBlock>

          <PanelBlock title="AI Marketing Image Studio">
            <MarketingCopyPanel
              copy={marketingCopy}
              mode={marketingCopyMode}
              language={marketingLanguage}
              loading={loading === "marketing-copy"}
              disabled={!productIdentity || !designLock}
              onModeChange={onMarketingCopyModeChange}
              onLanguageChange={onMarketingLanguageChange}
              onGenerate={onGenerateMarketingCopy}
            />
          </PanelBlock>

          <PanelBlock title="Amazon图片模板库">
            <MarketingTemplateLibrary
              templates={amazonMarketingTemplates}
              layouts={marketingLayouts}
              selectedLayoutId={selectedMarketingLayoutId}
              loading={loading === "marketing-layout"}
              disabled={!productIdentity || !designLock}
              onGenerateLayouts={onGenerateMarketingLayouts}
              onSelectLayout={onSelectMarketingLayout}
            />
          </PanelBlock>

          <PanelBlock title="图片文字编辑器">
            <MarketingLayerInspector
              selectedLayer={selectedMarketingLayer}
              disabled={marketingLayouts.length === 0}
              onAddText={onAddMarketingTextLayer}
              onAddIcon={onAddMarketingIconLayer}
              onUpdateLayer={onUpdateSelectedMarketingLayer}
              onDeleteLayer={onDeleteMarketingLayer}
            />
          </PanelBlock>

          <PanelBlock title="Listing优化">
            {marketingCopy ? (
              <div className="space-y-2">
                <AnalysisRow label="Amazon Title" value={marketingCopy.title} />
                <AnalysisRow label="Conversion Mode" value={marketingCopyMode} />
                <AnalysisRow label="Language" value={marketingLanguage.toUpperCase()} />
                <div className="rounded-md border border-emerald-400/20 bg-emerald-400/10 p-3">
                  <p className="text-xs font-bold text-emerald-100">Reference-first Listing</p>
                  <p className="mt-2 text-[11px] leading-5 text-zinc-300">
                    original_reference、product_identity、design_lock 已绑定到 MarketingAssets 表；图片文字由程序图层渲染，不写入AI生成图片。
                  </p>
                </div>
              </div>
            ) : (
              <EmptyPanel icon={ShoppingCart} label="等待生成 Listing 文案" />
            )}
          </PanelBlock>

          <PanelBlock title="材质替换">
            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-500">材质</span>
              <select
                className="h-9 w-full rounded-md border border-white/10 bg-black/35 px-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/60"
                value={materialFamily}
                onChange={(event) => onMaterialFamilyChange(event.target.value)}
              >
                {materialFamilies.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-500">表面处理</span>
              <select
                className="h-9 w-full rounded-md border border-white/10 bg-black/35 px-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/60"
                value={finish}
                onChange={(event) => onFinishChange(event.target.value)}
              >
                {finishes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <ActionButton disabled={!selectedConceptId || !productIdentity || !designLock} loading={loading === "material"} icon={Brush} onClick={onModifyMaterial}>
              应用材质
            </ActionButton>
            {material ? <p className="mt-3 text-xs leading-5 text-zinc-400">{material.surfaceTreatment}</p> : null}
          </PanelBlock>

          <PanelBlock title="项目库">
            {projects.length === 0 ? (
              <EmptyPanel icon={FolderOpen} label="暂无保存项目" />
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 4).map((project) => (
                  <button
                    key={project.id}
                    className="flex w-full items-center gap-3 rounded-md border border-white/10 bg-black/25 p-2 text-left transition hover:bg-white/[0.05]"
                    type="button"
                    onClick={() => onOpenProject(project)}
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-zinc-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={project.product.imageUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-zinc-100">{project.product.name}</p>
                      <p className="text-[11px] text-zinc-500">{project.status}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </PanelBlock>

          <PanelBlock title="Lighting Knowledge Base">
            <LightingKnowledgePanel rules={lightingKnowledgeBase} />
          </PanelBlock>

          <PanelBlock title="History">
            <DesignVersionHistory
              versions={designVersions}
              selectedVersionId={selectedDesignVersionId}
              onSelectVersion={onSelectDesignVersion}
              onRestoreVersion={onRestoreDesignVersion}
            />
          </PanelBlock>
        </div>

        <div className="border-t border-white/10 p-4">
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-bold text-black transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
            type="button"
            disabled={!product}
            onClick={onSave}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            保存项目
          </button>
          {lastSavedAt ? <p className="mt-2 text-center text-[11px] text-zinc-500">已保存 {new Date(lastSavedAt).toLocaleString()}</p> : null}
        </div>
      </div>
    </aside>
  );
}

function BottomModuleDock({
  activeTab,
  product,
  concepts,
  material,
  amazonImages,
  selectedAmazonImageId,
  engineeringViews,
  selectedEngineeringViewId,
  engineeringParts,
  onSelectTab,
  onSelectAmazonImage,
  onSelectEngineeringView
}: {
  activeTab: string;
  product: UploadedProduct | null;
  concepts: DesignConcept[];
  material: MaterialRecommendation | null;
  amazonImages: AmazonListingImage[];
  selectedAmazonImageId: string | null;
  engineeringViews: EngineeringDrawingView[];
  selectedEngineeringViewId: string | null;
  engineeringParts: EngineeringExplodedPart[];
  onSelectTab: (tab: string) => void;
  onSelectAmazonImage: (id: string) => void;
  onSelectEngineeringView: (id: string) => void;
}) {
  const drawingViews = engineeringViews.filter((view) => view.viewType !== "exploded");
  const explodedView = engineeringViews.find((view) => view.viewType === "exploded") ?? null;

  return (
    <section className="col-start-2 border-r border-t border-white/10 bg-[#08090b]">
      <div className="flex h-full flex-col">
        <div className="flex h-11 items-center border-b border-white/10 px-3">
          {bottomModules.map((module) => {
            const Icon = module.icon;
            const active = activeTab === module.id;
            return (
              <button
                key={module.id}
                className={`mr-1 inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-bold transition ${
                  active ? "bg-white text-black" : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
                }`}
                type="button"
                onClick={() => onSelectTab(module.id)}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {module.label}
              </button>
            );
          })}
        </div>
        {activeTab === "amazon" && amazonImages.length > 0 ? (
          <div className="grid flex-1 grid-cols-9 gap-2 overflow-hidden p-3">
            {amazonImages.map((image) => {
              const selected = image.id === selectedAmazonImageId;
              return (
                <button
                  key={image.id}
                  className={`min-w-0 rounded-md border p-1.5 text-left transition ${
                    selected ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"
                  }`}
                  type="button"
                  onClick={() => onSelectAmazonImage(image.id)}
                >
                  <div className="aspect-square overflow-hidden rounded bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.imageUrl} alt={image.title} className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-1 truncate text-[10px] font-bold text-zinc-200">{image.index}. {image.title}</p>
                  <p className="truncate text-[9px] text-zinc-500">{image.resolution}</p>
                </button>
              );
            })}
          </div>
        ) : activeTab === "drawing" && drawingViews.length > 0 ? (
          <div className="grid flex-1 grid-cols-3 gap-3 overflow-hidden p-3">
            {drawingViews.map((view) => {
              const selected = view.id === selectedEngineeringViewId;
              return (
                <button
                  key={view.id}
                  className={`min-w-0 rounded-md border p-2 text-left transition ${
                    selected ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"
                  }`}
                  type="button"
                  onClick={() => onSelectEngineeringView(view.id)}
                >
                  <div className="aspect-[16/9] overflow-hidden rounded bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={view.imageUrl} alt={view.title} className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-1 truncate text-xs font-bold text-zinc-200">{view.title}</p>
                  <p className="truncate text-[10px] text-zinc-500">{view.drawingNotes[0]}</p>
                </button>
              );
            })}
          </div>
        ) : activeTab === "exploded" && explodedView ? (
          <div className="grid flex-1 grid-cols-[1.3fr_repeat(5,minmax(0,1fr))] gap-3 overflow-hidden p-3">
            <button
              className={`min-w-0 rounded-md border p-2 text-left transition ${
                explodedView.id === selectedEngineeringViewId ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"
              }`}
              type="button"
              onClick={() => onSelectEngineeringView(explodedView.id)}
            >
              <div className="aspect-[16/9] overflow-hidden rounded bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={explodedView.imageUrl} alt={explodedView.title} className="h-full w-full object-cover" />
              </div>
              <p className="mt-1 truncate text-xs font-bold text-zinc-200">{explodedView.title}</p>
              <p className="truncate text-[10px] text-zinc-500">Auto split assembly</p>
            </button>
            {engineeringParts.map((part) => (
              <div key={part.name} className="min-w-0 rounded-md border border-white/10 bg-white/[0.035] p-3">
                <p className="text-[10px] font-black text-cyan-100">0{part.order}</p>
                <p className="mt-1 truncate text-xs font-bold text-zinc-200">{part.name}</p>
                <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-zinc-500">{part.material} / {part.editableScope}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid flex-1 gap-3 p-3 ${activeTab === "exploded" ? "grid-cols-5" : activeTab === "drawing" ? "grid-cols-3" : "grid-cols-4"}`}>
            {renderBottomItems(activeTab, product, concepts, material).map((item) => (
              <div key={item.title} className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                <p className="text-xs font-bold text-zinc-200">{item.title}</p>
                <p className="mt-2 text-[11px] leading-5 text-zinc-500">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function renderBottomItems(
  activeTab: string,
  product: UploadedProduct | null,
  concepts: DesignConcept[],
  material: MaterialRecommendation | null
) {
  const productLabel = product?.name ?? "未上传产品";
  const conceptLabel = concepts[0]?.title ?? "暂无方案";
  const materialLabel = material?.materialFamily ?? "暂无材质";

  const items = {
    amazon: [
      { title: "主图", description: `${productLabel} 纯白背景主图，适配 Amazon 主图规则。` },
      { title: "卖点图", description: `${conceptLabel} 卖点标注，使用简洁合规的副图文案。` },
      {
        title: "尺寸图",
        description: `总高 ${tableLampDimensions.heightCm}cm / 灯罩 ${tableLampDimensions.shadeCm}cm / 底座 ${tableLampDimensions.baseCm}cm 尺寸标注层。`
      },
      { title: "场景图", description: "家居场景渲染方向，画面构图适配电商副图。" }
    ],
    drawing: [
      { title: "正视图", description: "玻璃灯罩、金属环和大理石底座中心线对齐。" },
      { title: "侧视图", description: `总高 ${tableLampDimensions.heightCm}cm，显示隐藏 LED光源 与电池堆叠。` },
      { title: "顶视图", description: `灯罩 ${tableLampDimensions.shadeCm}cm 与底座 ${tableLampDimensions.baseCm}cm 占位对齐。` }
    ],
    exploded: [
      { title: "玻璃灯罩", description: `17cm 扩散层；颜色和玻璃透明度可编辑。` },
      { title: "金属环", description: "固定环、LED 座位和可见金属表面处理控制。" },
      { title: "LED光源", description: "发光模组层，锁定原始产品比例。" },
      { title: "电池", description: "内部供电模块，预留检修和安全间隙。" },
      { title: "大理石底座", description: `8cm 加重石材底座；当前材质目标：${materialLabel}。` }
    ],
    packaging: [
      { title: "彩盒正面", description: "品牌、主渲染图和前三个卖点。 " },
      { title: "背面信息", description: "条码、产地、电池提示、警示语和 Amazon 合规空间。" },
      { title: "内托", description: "保护内托与 FBA 跌落测试规划。" },
      { title: "开箱", description: "说明卡、配件和降低差评风险的开箱信息。" }
    ]
  };

  return items[activeTab as keyof typeof items] ?? items.amazon;
}

function isSupportedProductImage(file: File) {
  const allowedTypes = new Set(["image/jpeg", "image/png"]);
  const allowedExtensions = /\.(jpe?g|png)$/i;
  return allowedTypes.has(file.type) || allowedExtensions.test(file.name);
}

function buildVersionLabel(index: number) {
  const alphabetIndex = index % 26;
  const cycle = Math.floor(index / 26);
  const letter = String.fromCharCode(65 + alphabetIndex);

  return cycle === 0 ? `Version ${letter}` : `Version ${letter}${cycle + 1}`;
}

function buildUploadAnalysisDetails(
  product: UploadedProduct | null,
  analysis: ProductAnalysis | null,
  material: MaterialRecommendation | null
): UploadAnalysisDetails {
  if (analysis?.productIdentity) {
    return {
      productType: analysis.productIdentity.productType,
      structure: describeIdentityStructure(analysis.productIdentity),
      material: material?.shellMaterial ?? describeIdentityMaterials(analysis.productIdentity),
      editableAreas: analysis.productIdentity.editableAreas
    };
  }

  const category = analysis?.category ?? product?.category ?? "待识别";
  const presets: Record<string, Omit<UploadAnalysisDetails, "productType">> = {
    "Kitchen & Dining": {
      structure: "主体容器 / 握持区 / 接触边缘 / 底部支撑",
      material: "食品级塑料、硅胶或不锈钢",
      editableAreas: ["外观轮廓", "握持纹理", "食品接触面", "颜色分区", "包装主图"]
    },
    "Home Office": {
      structure: "主体框架 / 支撑脚 / 收纳槽 / 防滑底座",
      material: "ABS、铝合金、TPE 防滑件",
      editableAreas: ["支撑结构", "表面材质", "边角半径", "颜色方案", "Logo 区域"]
    },
    "Pet Supplies": {
      structure: "圆角主体 / 可拆部件 / 接触面 / 清洁边界",
      material: "BPA-free 塑料、硅胶或织物复合材料",
      editableAreas: ["安全圆角", "耐咬边缘", "可拆结构", "材质触感", "尺寸标注"]
    },
    "Sports & Outdoors": {
      structure: "承力主体 / 握持区 / 连接点 / 防水边界",
      material: "尼龙复合、TPU、铝件或橡胶",
      editableAreas: ["握持纹理", "承力连接", "防滑区", "耐候涂层", "场景图角度"]
    },
    Electronics: {
      structure: "外壳 / 散热孔 / 接口区 / 内部支撑筋",
      material: "阻燃 ABS、PC、铝合金或软触涂层",
      editableAreas: ["散热结构", "接口开孔", "表面涂层", "指示灯区", "产品主图"]
    },
    Lighting: {
      structure: tableLampStructure,
      material: tableLampMaterials,
      editableAreas: [...tableLampParts]
    }
  };

  const preset = presets[category] ?? {
    structure: "主体外壳 / 功能区 / 连接结构 / 支撑面",
    material: "工程塑料、金属或复合材料",
    editableAreas: ["外观轮廓", "表面材质", "颜色分区", "结构细节", "包装视觉"]
  };

  return {
    productType: isTableLamp(product) ? "台灯" : getCategoryLabel(category),
    structure: preset.structure,
    material: material?.shellMaterial ?? preset.material,
    editableAreas: preset.editableAreas
  };
}

function isTableLamp(product: UploadedProduct | null) {
  const name = product?.name.toLowerCase() ?? "";
  return name.includes("table lamp") || name.includes("台灯");
}

function getCategoryLabel(value: string) {
  return categoryOptions.find((item) => item.value === value)?.label ?? value;
}

function AnalysisMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-cyan-400/15 bg-black/35 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-zinc-100">{value}</p>
    </div>
  );
}

function AnalysisRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-3">
      <p className="mb-1 text-xs font-semibold text-zinc-500">{label}</p>
      <p className="text-sm font-semibold leading-5 text-zinc-100">{value}</p>
    </div>
  );
}

function PanelBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 border-b border-white/10 pb-4 last:border-b-0">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{title}</h3>
      {children}
    </section>
  );
}

function ActionButton({
  children,
  disabled,
  loading,
  icon: Icon,
  onClick
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  icon: typeof Bot;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-cyan-300/30 bg-cyan-400/10 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-zinc-600"
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

function EmptyPanel({ icon: Icon, label }: { icon: typeof Bot; label: string }) {
  return (
    <div className="flex min-h-20 items-center justify-center gap-2 rounded-md border border-dashed border-white/10 bg-black/25 px-3 text-sm text-zinc-500">
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </div>
  );
}
