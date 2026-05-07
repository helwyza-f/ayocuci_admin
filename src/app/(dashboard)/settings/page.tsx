"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Loader2, Globe, Smartphone, MessageSquare, Mail, Instagram, Facebook, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";

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
      toast.error("Failed to load application registry");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put("/app-settings", formData);
      if (res.data?.status) {
        toast.success("Global parameters synchronized");
      } else {
        toast.error("Failed to persist changes");
      }
    } catch (error) {
      toast.error("Network synchronization error");
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
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Settings className="h-5 w-5 text-primary" />
            Core Configuration
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Define global application metadata, social touchpoints, and versioning.
          </p>
        </div>

        <div className="flex items-center gap-2">
           <Button 
            onClick={handleSave} 
            disabled={loading || saving}
            size="sm"
            className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-none"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Commit Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
           <Card className="p-5 border border-slate-200 shadow-none rounded-lg bg-white">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-3">
                 <MessageSquare className="h-4 w-4 text-primary" />
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Communication & Socials</h3>
              </div>

              {loading ? (
                 <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="whatsapp_number" className="text-[9px] font-bold uppercase tracking-tight text-slate-400 ml-1">WhatsApp Endpoint</Label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                      <Input
                        id="whatsapp_number"
                        name="whatsapp_number"
                        placeholder="e.g. 089587387236"
                        value={formData.whatsapp_number}
                        onChange={handleChange}
                        className="pl-8 h-9 border-slate-200 font-bold text-xs shadow-none"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="instagram_username" className="text-[9px] font-bold uppercase tracking-tight text-slate-400 ml-1">Instagram Handle</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                      <Input
                        id="instagram_username"
                        name="instagram_username"
                        placeholder="e.g. ayocuci"
                        value={formData.instagram_username}
                        onChange={handleChange}
                        className="pl-8 h-9 border-slate-200 font-bold text-xs shadow-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="facebook_username" className="text-[9px] font-bold uppercase tracking-tight text-slate-400 ml-1">Facebook Identity</Label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                      <Input
                        id="facebook_username"
                        name="facebook_username"
                        placeholder="e.g. ayocuci.official"
                        value={formData.facebook_username}
                        onChange={handleChange}
                        className="pl-8 h-9 border-slate-200 font-bold text-xs shadow-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-[9px] font-bold uppercase tracking-tight text-slate-400 ml-1">Support Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="e.g. hello@ayocuci.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-8 h-9 border-slate-200 font-bold text-xs shadow-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="tiktok_username" className="text-[9px] font-bold uppercase tracking-tight text-slate-400 ml-1">TikTok Channel</Label>
                    <div className="relative">
                      <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                      <Input
                        id="tiktok_username"
                        name="tiktok_username"
                        placeholder="e.g. ayocuci.id"
                        value={formData.tiktok_username}
                        onChange={handleChange}
                        className="pl-8 h-9 border-slate-200 font-bold text-xs shadow-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="website_url" className="text-[9px] font-bold uppercase tracking-tight text-slate-400 ml-1">Official Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                      <Input
                        id="website_url"
                        name="website_url"
                        placeholder="e.g. ayocuci.com"
                        value={formData.website_url}
                        onChange={handleChange}
                        className="pl-8 h-9 border-slate-200 font-bold text-xs shadow-none"
                      />
                    </div>
                  </div>
                </div>
              )}
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="p-5 border border-slate-200 shadow-none rounded-lg bg-white">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-3">
                 <Smartphone className="h-4 w-4 text-primary" />
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Distribution & Build</h3>
              </div>

              <div className="space-y-5">
                <div className="space-y-1">
                  <Label htmlFor="playstore_url" className="text-[9px] font-bold uppercase tracking-tight text-slate-400 ml-1">Play Store URI</Label>
                  <Input
                    id="playstore_url"
                    name="playstore_url"
                    placeholder="market://details?id=..."
                    value={formData.playstore_url}
                    onChange={handleChange}
                    className="h-9 rounded border-slate-200 font-bold text-xs shadow-none"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="app_version" className="text-[9px] font-bold uppercase tracking-tight text-slate-400 ml-1">Registry Version</Label>
                  <div className="flex items-center gap-2">
                     <Input
                        id="app_version"
                        name="app_version"
                        placeholder="e.g. 2.4.0"
                        value={formData.app_version}
                        onChange={handleChange}
                        className="h-9 rounded border-slate-200 font-bold text-primary text-base font-heading shadow-none"
                      />
                      <Badge variant="secondary" className="h-9 px-2 rounded bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[8px] uppercase">Stable</Badge>
                  </div>
                </div>
              </div>
           </Card>

           <div className="p-4 rounded-lg bg-slate-900 text-white space-y-3">
              <h4 className="text-[9px] font-bold uppercase tracking-widest opacity-60">System Information</h4>
              <p className="text-[11px] font-medium leading-relaxed opacity-80">
                These settings control the "About Us" and contact information displayed in the mobile ecosystem. Changes update all client instances immediately.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
