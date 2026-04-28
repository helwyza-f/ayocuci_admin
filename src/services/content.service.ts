import api from "@/lib/api-client";

export type ContentCategory = "PROMO" | "INFORMASI";

export interface ContentBanner {
  id: number;
  category: ContentCategory;
  title: string;
  summary: string;
  body: string;
  image_url: string;
  published_at: string;
  is_active: boolean;
}

export const contentService = {
  getAll: async () => {
    const res = await api.get("/content");
    return res.data;
  },
  getOne: async (id: number) => {
    const res = await api.get(`/content/${id}`);
    return res.data;
  },
  create: async (data: FormData) => {
    const res = await api.post("/content", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  update: async (id: number, data: FormData) => {
    const res = await api.put(`/content/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  toggleStatus: async (id: number) => {
    const res = await api.patch(`/content/${id}/status`);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/content/${id}`);
    return res.data;
  },
};
