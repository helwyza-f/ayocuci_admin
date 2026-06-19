const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.ayocuci.id/api/v1"
).replace(/\/api\/v1\/?$/, "");

export function resolveUploadUrl(path?: string | null) {
  const value = path?.trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (value.startsWith("/")) return `${API_ROOT}${value}`;
  if (value.startsWith("uploads/")) return `${API_ROOT}/${value}`;
  return `${API_ROOT}/uploads/${value}`;
}

export function resolveImageVariantUrl(
  path?: string | null,
  options: { width: number; webp?: boolean; quality?: number } = { width: 720 },
) {
  const url = resolveUploadUrl(path);
  if (!url || !url.includes(".aliyuncs.com/")) return url;

  const width = Math.min(Math.max(Math.round(options.width), 1), 4096);
  const quality = Math.min(Math.max(Math.round(options.quality ?? 80), 1), 100);
  const processParts = [
    `image/resize,w_${width}`,
    `quality,q_${quality}`,
    ...(options.webp ?? true ? ["format,webp"] : []),
  ];

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}x-oss-process=${processParts.join("/")}`;
}
