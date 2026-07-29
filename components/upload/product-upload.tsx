"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { makeId } from "@/lib/utils";
import type { UploadedProduct } from "@/types/product";

const categories = ["厨房餐厨", "居家办公", "宠物用品", "运动户外", "电子产品"];

export function ProductUpload({
  product,
  onProductReady
}: {
  product: UploadedProduct | null;
  onProductReady: (product: UploadedProduct) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("台灯");
  const [category, setCategory] = useState(categories[1]);
  const [isDragging, setIsDragging] = useState(false);

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      onProductReady({
        id: makeId("product"),
        name: name.trim() || file.name.replace(/\.[^/.]+$/, ""),
        category,
        fileName: file.name,
        imageUrl: String(reader.result),
        uploadedAt: new Date().toISOString()
      });
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      readFile(file);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  }

  return (
    <Panel title="产品上传" eyebrow="步骤 1">
      <div className="grid gap-4 lg:grid-cols-[1fr_230px]">
        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold text-graphite">产品名称</span>
              <input
                className="h-10 w-full rounded-md border border-graphite/15 bg-white px-3 text-sm outline-none transition focus:border-canopy focus:ring-4 focus:ring-canopy/10"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold text-graphite">品类</span>
              <select
                className="h-10 w-full rounded-md border border-graphite/15 bg-white px-3 text-sm outline-none transition focus:border-canopy focus:ring-4 focus:ring-canopy/10"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div
            className={`mt-4 flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${
              isDragging ? "border-canopy bg-mint" : "border-graphite/15 bg-white/70 hover:border-canopy/60"
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
          >
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-md bg-mint text-canopy">
              <UploadCloud className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-ink">上传产品图片</p>
            <p className="mt-1 text-sm text-graphite">支持 PNG、JPG 或 WEBP 产品图。</p>
          </div>
        </div>

        <div className="rounded-lg border border-graphite/10 bg-white p-3">
          {product ? (
            <div>
              <div className="relative aspect-square overflow-hidden rounded-md bg-mist">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                <button
                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/90 text-graphite shadow-sm transition hover:text-coral"
                  title="替换图片"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-3 text-sm font-bold text-ink">{product.name}</p>
              <p className="text-xs text-graphite">{product.fileName}</p>
            </div>
          ) : (
            <div className="flex aspect-square flex-col items-center justify-center rounded-md bg-mist text-center">
              <ImagePlus className="mb-3 h-10 w-10 text-canopy" aria-hidden="true" />
              <p className="text-sm font-semibold text-graphite">尚未上传图片</p>
            </div>
          )}
          <Button
            type="button"
            variant="secondary"
            className="mt-3 w-full"
            icon={<ImagePlus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => inputRef.current?.click()}
          >
            选择文件
          </Button>
        </div>
      </div>
    </Panel>
  );
}
