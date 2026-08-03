import { PNG } from "pngjs";
import type { ProductMaskRegion } from "@/types/product";

const defaultMaskSize = 1024;

export function createOpenAIEditMaskBlob(region: ProductMaskRegion, size = defaultMaskSize) {
  const png = new PNG({
    width: size,
    height: size
  });

  const bounds = {
    x: Math.round((region.bounds.x / 100) * size),
    y: Math.round((region.bounds.y / 100) * size),
    width: Math.round((region.bounds.width / 100) * size),
    height: Math.round((region.bounds.height / 100) * size)
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (size * y + x) << 2;
      const insideRegion = isInsideRegion(x, y, bounds, region.id);

      png.data[index] = 0;
      png.data[index + 1] = 0;
      png.data[index + 2] = 0;
      png.data[index + 3] = insideRegion ? 0 : 255;
    }
  }

  const buffer = PNG.sync.write(png);
  const bytes = new Uint8Array(buffer.byteLength);
  bytes.set(buffer);
  return new Blob([bytes], { type: "image/png" });
}

function isInsideRegion(
  x: number,
  y: number,
  bounds: { x: number; y: number; width: number; height: number },
  regionId: ProductMaskRegion["id"]
) {
  if (regionId === "shade" || regionId === "led") {
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const rx = bounds.width / 2;
    const ry = bounds.height / 2;
    const normalizedX = (x - cx) / rx;
    const normalizedY = (y - cy) / ry;
    return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
  }

  return x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height;
}
