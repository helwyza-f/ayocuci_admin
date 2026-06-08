"use client";

import { use, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TutorialForm } from "../../tutorial-form";
import { TutorialItem, tutorialService } from "@/services/tutorial.service";

export default function EditTutorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<TutorialItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tutorialService
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
    return (
      <div className="p-6 font-bold text-slate-500">
        Tutorial tidak ditemukan.
      </div>
    );
  }

  return <TutorialForm initial={item} />;
}
