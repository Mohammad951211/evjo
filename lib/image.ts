/**
 * Returns a renderable image source, or null. Uploaded photos are data-URLs
 * and real assets are absolute (http/https or "/"-rooted). Bare catalog
 * filenames like "neta-x.webp" have no backing asset, so treat them as absent.
 */
export function photoSrc(image?: string | null): string | null {
  if (!image) return null;
  return /^(data:|https?:\/\/|\/)/.test(image) ? image : null;
}

/** Downscale + JPEG-compress a photo client-side so uploads stay tiny. */
export async function compressImage(file: File, max = 1280, quality = 0.72): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
  const img = document.createElement("img");
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("bad image"));
    img.src = dataUrl;
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}
