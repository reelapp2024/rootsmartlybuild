import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogFooter,

  DialogHeader,

  DialogTitle,

} from "@/components/ui/dialog";

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select";

import { http } from "../../config.js";

import { useToast } from "@/hooks/use-toast";

import { Loader2, Save, Sparkles } from "lucide-react";

import {

  EMPTY_PAGE_SEO,

  apiResponseToPageSeoForm,

  type PageSeoForm,

} from "@/lib/pageSeo";



export type { PageSeoForm };



interface Props {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  projectId: string;

  pageId: string;

  pageLabel: string;

}



export function PageSeoSettingsDialog({ open, onOpenChange, projectId, pageId, pageLabel }: Props) {

  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [generating, setGenerating] = useState(false);

  const [form, setForm] = useState<PageSeoForm>(EMPTY_PAGE_SEO);



  const loadSeo = async () => {

    if (!projectId || !pageId) return;

    setLoading(true);

    try {

      const token = localStorage.getItem("token");

      const res = await http.get(`/getWebsitePageSeo/${projectId}/${pageId}`, {

        headers: token ? { Authorization: `Bearer ${token}` } : {},

      });

      setForm(apiResponseToPageSeoForm(res.data?.data));

    } catch (e: unknown) {

      setForm(EMPTY_PAGE_SEO);

      const status = (e as { response?: { status?: number } })?.response?.status;

      if (status !== 404) {

        toast({ title: "Error", description: "Could not load SEO settings", variant: "destructive" });

      }

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    if (open) loadSeo();

  }, [open, projectId, pageId]);



  const patch = (key: keyof PageSeoForm, value: string) => setForm((f) => ({ ...f, [key]: value }));



  const handleSave = async () => {

    setSaving(true);

    try {

      const token = localStorage.getItem("token");

      await http.post(

        "/updateWebsitePageSeo",

        { projectId, pageId, ...form },

        { headers: token ? { Authorization: `Bearer ${token}` } : {} }

      );

      toast({ title: "Saved", description: "SEO settings updated on this page." });
      window.dispatchEvent(
        new CustomEvent("website-page-seo-updated", { detail: { projectId, pageId } })
      );
      onOpenChange(false);

    } catch (e: unknown) {

      const message =

        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||

        "Failed to save SEO";

      toast({ title: "Error", description: message, variant: "destructive" });

    } finally {

      setSaving(false);

    }

  };



  const handleGenerate = async () => {

    setGenerating(true);

    try {

      const token = localStorage.getItem("token");

      const res = await http.post(

        "/generateWebsitePageSeo",

        { projectId, pageId },

        { headers: token ? { Authorization: `Bearer ${token}` } : {} }

      );

      setForm(apiResponseToPageSeoForm(res.data?.data));

      toast({ title: "Generated", description: "AI SEO copy applied — review and save." });

    } catch (e: unknown) {

      const message =

        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||

        "AI generation failed";

      toast({ title: "Error", description: message, variant: "destructive" });

    } finally {

      setGenerating(false);

    }

  };



  return (

    <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0">

        <DialogHeader className="shrink-0 border-b px-6 pb-4 pt-6 pr-12">

          <DialogTitle>SEO — {pageLabel}</DialogTitle>

          <DialogDescription>

            Meta tags, Open Graph, and Twitter cards for this page. Stored on the website page record.

          </DialogDescription>

        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-6">

          {loading ? (

            <div className="flex justify-center py-12">

              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />

            </div>

          ) : (

            <>

              <div className="space-y-3">

                <h3 className="text-sm font-semibold">Search (Google)</h3>

                <div>

                  <Label>Meta title</Label>

                  <Input value={form.meta_title} onChange={(e) => patch("meta_title", e.target.value)} className="mt-1" />

                </div>

                <div>

                  <Label>Meta description</Label>

                  <Textarea value={form.meta_description} onChange={(e) => patch("meta_description", e.target.value)} rows={3} className="mt-1" />

                </div>

                <div>

                  <Label>Meta keywords</Label>

                  <Input value={form.meta_keywords} onChange={(e) => patch("meta_keywords", e.target.value)} className="mt-1" />

                </div>

                <div>

                  <Label>Meta image URL</Label>

                  <Input value={form.meta_image} onChange={(e) => patch("meta_image", e.target.value)} className="mt-1" />

                </div>

                <div>

                  <Label>Canonical URL</Label>

                  <Input value={form.canonical_url} onChange={(e) => patch("canonical_url", e.target.value)} placeholder="/your-page-slug" className="mt-1" />

                  <p className="text-xs text-muted-foreground mt-1">Uses the live slug after renames (301 redirects).</p>

                </div>

                <div>

                  <Label>Language</Label>

                  <Input value={form.language} onChange={(e) => patch("language", e.target.value)} className="mt-1" />

                </div>

              </div>



              <div className="space-y-3 border-t pt-4">

                <h3 className="text-sm font-semibold">Open Graph</h3>

                <div>

                  <Label>OG title</Label>

                  <Input value={form.og_title} onChange={(e) => patch("og_title", e.target.value)} className="mt-1" />

                </div>

                <div>

                  <Label>OG description</Label>

                  <Textarea value={form.og_description} onChange={(e) => patch("og_description", e.target.value)} rows={2} className="mt-1" />

                </div>

                <div>

                  <Label>OG image URL</Label>

                  <Input value={form.og_image} onChange={(e) => patch("og_image", e.target.value)} className="mt-1" />

                </div>

                <div>

                  <Label>OG type</Label>

                  <Input value={form.og_type} onChange={(e) => patch("og_type", e.target.value)} className="mt-1" />

                </div>

                <div>

                  <Label>OG site name</Label>

                  <Input value={form.og_site_name} onChange={(e) => patch("og_site_name", e.target.value)} className="mt-1" />

                </div>

              </div>



              <div className="space-y-3 border-t pt-4">

                <h3 className="text-sm font-semibold">Twitter</h3>

                <div>

                  <Label>Card type</Label>

                  <Select value={form.twitter_card} onValueChange={(v) => patch("twitter_card", v)}>

                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>

                    <SelectContent>

                      <SelectItem value="summary_large_image">Large image</SelectItem>

                      <SelectItem value="summary">Summary</SelectItem>

                    </SelectContent>

                  </Select>

                </div>

                <div>

                  <Label>Twitter @site</Label>

                  <Input value={form.twitter_site} onChange={(e) => patch("twitter_site", e.target.value)} placeholder="@yourbrand" className="mt-1" />

                </div>

              </div>



              <div className="space-y-3 border-t pt-4">

                <h3 className="text-sm font-semibold">Advanced</h3>

                <div>

                  <Label>Robots</Label>

                  <Select value={form.robots} onValueChange={(v) => patch("robots", v)}>

                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>

                    <SelectContent>

                      <SelectItem value="index,follow">index, follow</SelectItem>

                      <SelectItem value="noindex,nofollow">noindex, nofollow</SelectItem>

                      <SelectItem value="index,nofollow">index, nofollow</SelectItem>

                      <SelectItem value="noindex,follow">noindex, follow</SelectItem>

                    </SelectContent>

                  </Select>

                </div>

                <div>

                  <Label>Favicon URL</Label>

                  <Input value={form.favicon} onChange={(e) => patch("favicon", e.target.value)} className="mt-1" />

                </div>

                <div>

                  <Label>JSON-LD structured data</Label>

                  <Textarea value={form.structured_data} onChange={(e) => patch("structured_data", e.target.value)} rows={5} className="mt-1 font-mono text-xs" />

                </div>

              </div>

            </>

          )}

        </div>

        <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4">

          <Button variant="outline" onClick={handleGenerate} disabled={generating || loading}>

            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}

            Generate with AI

          </Button>

          <Button onClick={handleSave} disabled={saving || loading}>

            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}

            Save SEO

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  );

}


