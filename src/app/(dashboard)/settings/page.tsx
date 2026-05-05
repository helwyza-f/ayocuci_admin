"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api-client";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    whatsapp_number: "",
    instagram_username: "",
    facebook_username: "",
    email: "",
    tiktok_username: "",
    website_url: "",
    playstore_url: "",
    app_version: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/app-settings");
      if (res.data?.status && res.data.data) {
        setFormData({
          whatsapp_number: res.data.data.whatsapp_number || "",
          instagram_username: res.data.data.instagram_username || "",
          facebook_username: res.data.data.facebook_username || "",
          email: res.data.data.email || "",
          tiktok_username: res.data.data.tiktok_username || "",
          website_url: res.data.data.website_url || "",
          playstore_url: res.data.data.playstore_url || "",
          app_version: res.data.data.app_version || "",
        });
      }
    } catch (error) {
      toast.error("Gagal mengambil data pengaturan");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put("/app-settings", formData);
      if (res.data?.status) {
        toast.success("Pengaturan berhasil disimpan");
      } else {
        toast.error("Gagal menyimpan pengaturan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan data");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Pengaturan <span className="text-[#FF4500]">Aplikasi</span>
        </h2>
        <p className="text-sm font-medium text-slate-500">
          Atur tautan "Tentang Kami" dan versi aplikasi yang akan muncul di HP pengguna.
        </p>
      </div>

      <Card className="p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-orange-50 p-2.5 text-[#FF4500]">
            <Settings className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-slate-900">
            Tautan Sosial Media & Kontak
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">Nomor WhatsApp</Label>
              <Input
                id="whatsapp_number"
                name="whatsapp_number"
                placeholder="Cth: 089587387236"
                value={formData.whatsapp_number}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="instagram_username">Username Instagram</Label>
              <Input
                id="instagram_username"
                name="instagram_username"
                placeholder="Cth: ayocuci"
                value={formData.instagram_username}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook_username">Username/Link Facebook</Label>
              <Input
                id="facebook_username"
                name="facebook_username"
                placeholder="Cth: ayocuci"
                value={formData.facebook_username}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Cth: admin@ayocuci.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktok_username">Username TikTok</Label>
              <Input
                id="tiktok_username"
                name="tiktok_username"
                placeholder="Cth: ayocuci"
                value={formData.tiktok_username}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">URL Website</Label>
              <Input
                id="website_url"
                name="website_url"
                placeholder="Cth: ayocuci.com"
                value={formData.website_url}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="playstore_url">Link Playstore</Label>
              <Input
                id="playstore_url"
                name="playstore_url"
                placeholder="Cth: market://details?id=com.ayocuci.app"
                value={formData.playstore_url}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="app_version">Versi Aplikasi yang Tampil</Label>
              <Input
                id="app_version"
                name="app_version"
                placeholder="Cth: 2.4.0"
                value={formData.app_version}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={loading || saving}
            className="bg-[#FF4500] hover:bg-[#E63E00]"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Simpan Perubahan
          </Button>
        </div>
      </Card>
    </div>
  );
}
