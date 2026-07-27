const MAX_UPLOAD_BYTES = 700 * 1024;
const MAX_DIMENSION = 1920;

export async function compressImageToMaxBytes(
  file: File,
  {
    maxBytes = MAX_UPLOAD_BYTES,
    maxDimension = MAX_DIMENSION,
  }: { maxBytes?: number; maxDimension?: number } = {}
) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }
  if (file.size <= maxBytes) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  let width = Math.max(1, Math.round(bitmap.width * scale));
  let height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: true });

  if (!context) {
    bitmap.close();
    throw new Error("Could not process image");
  }

  let quality = 0.85;
  let blob: Blob | null = null;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size <= maxBytes) break;

    if (quality > 0.45) quality -= 0.1;
    else {
      width = Math.max(640, Math.round(width * 0.85));
      height = Math.max(640, Math.round(height * 0.85));
    }
  }
  bitmap.close();

  if (!blob || blob.size > maxBytes) {
    throw new Error("Image is still too large. Choose a smaller photo.");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
