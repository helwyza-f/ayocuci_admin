import api from "@/lib/api-client";

export type TutorialType = "VIDEO" | "GUIDE" | "FAQ";
export type TutorialCategory =
  | "TRANSAKSI"
  | "LAPORAN"
  | "PELANGGAN"
  | "OUTLET"
  | "PRINTER"
  | "KOIN"
  | "REFERRAL";

export interface TutorialItem {
  id: number;
  type: TutorialType;
  category: TutorialCategory;
  title: string;
  summary: string;
  body: string;
  video_url: string;
  youtube_id: string;
  pdf_url: string;
  duration: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TutorialPayload {
  type: TutorialType;
  category: TutorialCategory;
  title: string;
  summary: string;
  body: string;
  video_url: string;
  youtube_id: string;
  pdf_url: string;
  duration: string;
  sort_order: number;
}

export const tutorialTypes: Array<{ value: TutorialType; label: string }> = [
  { value: "VIDEO", label: "Video" },
  { value: "GUIDE", label: "Panduan" },
  { value: "FAQ", label: "FAQ" },
];

export const tutorialCategories: Array<{
  value: TutorialCategory;
  label: string;
}> = [
  { value: "TRANSAKSI", label: "Transaksi" },
  { value: "LAPORAN", label: "Laporan" },
  { value: "PELANGGAN", label: "Pelanggan" },
  { value: "OUTLET", label: "Outlet" },
  { value: "PRINTER", label: "Printer" },
  { value: "KOIN", label: "Koin" },
  { value: "REFERRAL", label: "Referral" },
];

export const tutorialService = {
  getAll: async () => {
    const res = await api.get("/tutorials");
    return res.data;
  },
  getOne: async (id: number) => {
    const res = await api.get(`/tutorials/${id}`);
    return res.data;
  },
  create: async (data: TutorialPayload) => {
    const res = await api.post("/tutorials", data);
    return res.data;
  },
  update: async (id: number, data: TutorialPayload) => {
    const res = await api.put(`/tutorials/${id}`, data);
    return res.data;
  },
  toggleStatus: async (id: number) => {
    const res = await api.patch(`/tutorials/${id}/status`);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/tutorials/${id}`);
    return res.data;
  },
};
