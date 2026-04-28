"use client";

import { use, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ContentForm } from "../../content-form";
import { ContentBanner, contentService } from "@/services/content.service";

export default function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<ContentBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentService
      .getOne(Number(id))
      .then((res) => {
        if (res.status) setItem(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#FF4500]" />
      </div>
    );
  }

  if (!item) {
    return <div className="p-6 font-bold text-slate-500">Konten tidak ditemukan.</div>;
  }

  return <ContentForm initial={item} />;
}
