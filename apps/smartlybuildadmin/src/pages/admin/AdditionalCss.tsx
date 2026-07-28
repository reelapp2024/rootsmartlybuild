import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { http } from "../../config.js";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Code2, Loader2, Save } from "lucide-react";

/**
 * Additional CSS — WordPress Customizer / Wix-style freeform CSS.
 * Blog CSS targets .blog-prose and .gb-* element classes.
 * Site CSS applies to the whole live site.
 */
export default function AdditionalCss() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blogCss, setBlogCss] = useState("");
  const [siteCss, setSiteCss] = useState("");
  const [applyBlogCssToSite, setApplyBlogCssToSite] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const currentSnapshot = useMemo(
    () => JSON.stringify({ blogCss, siteCss, applyBlogCssToSite }),
    [blogCss, siteCss, applyBlogCssToSite]
  );
  const isDirty = currentSnapshot !== savedSnapshot;

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await http.get(`/additionalCss/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data || {};
      const nextBlog = String(data.blogCss || "");
      const nextSite = String(data.siteCss || "");
      const nextApply = Boolean(data.applyBlogCssToSite);
      setBlogCss(nextBlog);
      setSiteCss(nextSite);
      setApplyBlogCssToSite(nextApply);
      setSavedSnapshot(
        JSON.stringify({
          blogCss: nextBlog,
          siteCss: nextSite,
          applyBlogCssToSite: nextApply,
        })
      );
    } catch (e: any) {
      toast({
        title: "Failed to load Additional CSS",
        description: e?.response?.data?.message || e?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await http.post(
        "/updateAdditionalCss",
        {
          projectId,
          blogCss,
          siteCss,
          applyBlogCssToSite,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedSnapshot(currentSnapshot);
      toast({
        title: "Additional CSS saved",
        description: "Changes apply on the live site after the next page load.",
      });
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.response?.data?.message || e?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!projectId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Missing project id.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/admin/projects/${projectId}/dashboard/design`)}
            aria-label="Back to Design"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Code2 className="h-6 w-6" />
              Additional CSS
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Theme blog posts like WordPress / Wix — and optionally style the whole site.
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || loading || !isDirty}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save CSS
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Blog CSS</CardTitle>
              <CardDescription>
                Styles blog article bodies. Prefer selectors like{" "}
                <code className="text-xs bg-muted px-1 rounded">.blog-prose</code>,{" "}
                <code className="text-xs bg-muted px-1 rounded">.gb-h2</code>,{" "}
                <code className="text-xs bg-muted px-1 rounded">.gb-p</code>,{" "}
                <code className="text-xs bg-muted px-1 rounded">.gb-link</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blog-css">Custom blog CSS</Label>
                <Textarea
                  id="blog-css"
                  value={blogCss}
                  onChange={(e) => setBlogCss(e.target.value)}
                  placeholder={`.blog-prose .gb-h2 {\n  letter-spacing: -0.02em;\n}\n.blog-prose .gb-quote {\n  background: rgba(0,0,0,0.03);\n}`}
                  className="font-mono text-sm min-h-[220px]"
                  spellCheck={false}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <Label htmlFor="apply-blog-site" className="text-base">
                    Also apply blog class styles site-wide
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    When on, <code className="text-xs">.gb-*</code> theme colors also apply outside blog posts
                    (shared element language across the site).
                  </p>
                </div>
                <Switch
                  id="apply-blog-site"
                  checked={applyBlogCssToSite}
                  onCheckedChange={setApplyBlogCssToSite}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Site-wide CSS</CardTitle>
              <CardDescription>
                Injected on every live page (like WordPress Additional CSS). Use carefully — invalid CSS can
                affect layout.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="site-css">Custom site CSS</Label>
                <Textarea
                  id="site-css"
                  value={siteCss}
                  onChange={(e) => setSiteCss(e.target.value)}
                  placeholder={`#canvas-root a {\n  text-underline-offset: 4px;\n}`}
                  className="font-mono text-sm min-h-[180px]"
                  spellCheck={false}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Element classes reference</CardTitle>
              <CardDescription>
                AI and the post editor stamp these on blog HTML so theme CSS can target them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                gb-h1 … gb-h6 · gb-p · gb-link · gb-ul · gb-ol · gb-li · gb-quote · gb-strong · gb-em · gb-img ·
                gb-hr · gb-el
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
