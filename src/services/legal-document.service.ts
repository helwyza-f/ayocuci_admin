import api from "@/lib/api-client";

export type LegalDocumentType = "TERMS" | "PRIVACY";

export interface LegalDocument {
  id: number;
  type: LegalDocumentType;
  title: string;
  effective_label: string;
  body: string;
  created_at?: string;
  updated_at?: string;
}

export const legalDocumentService = {
  getAll: async () => {
    const res = await api.get("/legal-documents");
    return res.data;
  },
  getOne: async (type: LegalDocumentType) => {
    const res = await api.get(`/legal-documents/${type}`);
    return res.data;
  },
  save: async (
    type: LegalDocumentType,
    payload: Pick<LegalDocument, "title" | "effective_label" | "body">,
  ) => {
    const res = await api.put(`/legal-documents/${type}`, payload);
    return res.data;
  },
};
