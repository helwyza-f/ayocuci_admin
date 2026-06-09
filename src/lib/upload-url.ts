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
