import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { pagePublicPath } from "@/utils/url";

export interface FooterMenuItem {
  id: string;
  name: string;
  url: string;
  pageId?: string;
  serviceId?: string;
  linkPerArea?: boolean;
  icon?: string;
  target: string;
  order: number;
  children: FooterMenuItem[];
  style: Record<string, unknown>;
}

export interface FooterLayoutConfig {
  version: number;
  showCtaBanner: boolean;
  cta: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
  };
  columns: {
    about: { enabled: boolean; order: number };
    quickLinks: { enabled: boolean; order: number };
    services: { enabled: boolean; order: number };
    contact: { enabled: boolean; order: number };
  };
  about: {
    showTagline: boolean;
    tagline: string;
    showSocial: boolean;
  };
  quickLinks: { items: FooterMenuItem[] };
  services: { children: FooterMenuItem[] };
  contact: {
    showPhone: boolean;
    showEmail: boolean;
    showLocation: boolean;
    showHours: boolean;
    hoursText: string;
    hoursSub: string;
    phoneSub: string;
    emailSub: string;
  };
}

export const DEFAULT_FOOTER_LAYOUT: FooterLayoutConfig = {
  version: 1,
  showCtaBanner: true,
  cta: {
    title: "",
    subtitle: "",
    buttonText: "Book Now",
    buttonLink: "/contact",
  },
  columns: {
    about: { enabled: true, order: 0 },
    quickLinks: { enabled: true, order: 1 },
    services: { enabled: true, order: 2 },
    contact: { enabled: true, order: 3 },
  },
  about: {
    showTagline: true,
    tagline: "",
    showSocial: true,
  },
  quickLinks: { items: [] },
  services: { children: [] },
  contact: {
    showPhone: true,
    showEmail: true,
    showLocation: true,
    showHours: true,
    hoursText: "Open 24/7",
    hoursSub: "Always on call",
    phoneSub: "Available 24/7",
    emailSub: "We reply within an hour",
  },
};

function isServicesItem(item: FooterMenuItem) {
  const url = String(item.url || "").replace(/^\//, "").toLowerCase();
  const name = String(item.name || "").toLowerCase();
  return item.id === "services" || name.includes("service") || url === "services";
}

/** Build layout from legacy footer menu when settings.custom.footer is missing. */
export function migrateMenuToFooterLayout(menu: FooterMenuItem[] = []): FooterLayoutConfig {
  const sorted = [...menu].sort((a, b) => a.order - b.order);
  const servicesParent = sorted.find(isServicesItem);
  const quickItems = sorted
    .filter((item) => !isServicesItem(item))
    .map((item) => ({ ...item, children: [] }));
  return {
    ...DEFAULT_FOOTER_LAYOUT,
    quickLinks: { items: quickItems },
    services: { children: servicesParent?.children || [] },
  };
}

export type FooterLivePreview = {
  tagline?: string;
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
};

/** Match live footer text in the editor (stored layout + site/project fallbacks). */
export function mergeFooterLayoutWithLivePreview(
  layout: FooterLayoutConfig,
  live?: FooterLivePreview | null
): FooterLayoutConfig {
  if (!live) return layout;
  return {
    ...layout,
    cta: {
      ...layout.cta,
      title: String(layout.cta.title || live.ctaTitle || "").trim(),
      subtitle: String(layout.cta.subtitle || live.ctaSubtitle || "").trim(),
      buttonText:
        String(layout.cta.buttonText || live.ctaButtonText || "Book Now").trim() || "Book Now",
      buttonLink:
        String(layout.cta.buttonLink || live.ctaButtonLink || "/contact").trim() || "/contact",
    },
    about: {
      ...layout.about,
      tagline: String(layout.about.tagline || live.tagline || "").trim(),
    },
  };
}

export function getFooterLayoutFromItem(item: {
  settings?: { custom?: { footer?: FooterLayoutConfig } };
  footerLayout?: FooterLayoutConfig;
  footerMarketing?: FooterLivePreview;
  menu?: FooterMenuItem[];
}): FooterLayoutConfig {
  const stored = item?.settings?.custom?.footer || item?.footerLayout;
  if (stored && stored.version >= 1) {
    const base: FooterLayoutConfig = {
      ...DEFAULT_FOOTER_LAYOUT,
      ...stored,
      columns: { ...DEFAULT_FOOTER_LAYOUT.columns, ...stored.columns },
      cta: { ...DEFAULT_FOOTER_LAYOUT.cta, ...stored.cta },
      about: {
        ...DEFAULT_FOOTER_LAYOUT.about,
        ...stored.about,
        tagline: String(
          stored.about?.tagline || (stored.about as { taglineOverride?: string })?.taglineOverride || ""
        ).trim(),
      },
      contact: { ...DEFAULT_FOOTER_LAYOUT.contact, ...stored.contact },
      quickLinks: stored.quickLinks || DEFAULT_FOOTER_LAYOUT.quickLinks,
      services: stored.services || DEFAULT_FOOTER_LAYOUT.services,
    };
    return mergeFooterLayoutWithLivePreview(base, item.footerMarketing);
  }
  if (Array.isArray(item?.menu) && item.menu.length) {
    return mergeFooterLayoutWithLivePreview(migrateMenuToFooterLayout(item.menu), item.footerMarketing);
  }
  return mergeFooterLayoutWithLivePreview({ ...DEFAULT_FOOTER_LAYOUT }, item.footerMarketing);
}

function SortableLinkRow({
  item,
  pages,
  onChange,
  onRemove,
}: {
  item: FooterMenuItem;
  pages: Array<{ pageId?: string; _id?: string; name: string; slug?: string; displayName: string }>;
  onChange: (patch: Partial<FooterMenuItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const isCatalog = Boolean(item.linkPerArea || item.serviceId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background"
    >
      <button type="button" className="cursor-grab text-muted-foreground" {...attributes} {...listeners}>
        ⋮⋮
      </button>
      <Input
        className="flex-1 min-w-[120px]"
        value={item.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      {isCatalog ? (
        <span className="text-xs text-muted-foreground px-2">Linked to services per area</span>
      ) : (
        <select
          className="h-9 rounded-md border px-2 text-sm min-w-[140px]"
          value={item.pageId || ""}
          onChange={(e) => {
            const pageId = e.target.value;
            const page = pages.find((p) => (p.pageId || p._id) === pageId);
            onChange({
              pageId: pageId || undefined,
              url: page ? pagePublicPath(page) : item.url,
              name: page?.displayName || item.name,
            });
          }}
        >
          <option value="">Custom URL</option>
          {pages.map((p) => {
            const id = p.pageId || p._id || "";
            return (
              <option key={id} value={id}>
                {p.displayName || p.name}
              </option>
            );
          })}
        </select>
      )}
      {!isCatalog && (
        <Input
          className="flex-1 min-w-[100px]"
          value={item.url}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="/path"
        />
      )}
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}

interface FooterLayoutEditorProps {
  layout: FooterLayoutConfig;
  onChange: (layout: FooterLayoutConfig) => void;
  pages: Array<{ pageId?: string; _id?: string; name: string; slug?: string; displayName: string }>;
  navSources?: {
    services?: Array<{ label: string; link: string; serviceId?: string; linkPerArea?: boolean }>;
  };
  livePreview?: FooterLivePreview | null;
}

export function FooterLayoutEditor({
  layout,
  onChange,
  pages,
  navSources,
  livePreview,
}: FooterLayoutEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const displayLayout = useMemo(
    () => mergeFooterLayoutWithLivePreview(layout, livePreview),
    [layout, livePreview]
  );

  const patchDisplay = (partial: Partial<FooterLayoutConfig>) => {
    onChange({ ...displayLayout, ...partial });
  };

  const reorderList = (
    listKey: "quickLinks" | "services",
    activeId: string,
    overId: string
  ) => {
    const items =
      listKey === "quickLinks" ? displayLayout.quickLinks.items : displayLayout.services.children;
    const oldIndex = items.findIndex((i) => i.id === activeId);
    const newIndex = items.findIndex((i) => i.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      order: idx,
    }));
    if (listKey === "quickLinks") {
      patchDisplay({ quickLinks: { items: next } });
    } else {
      patchDisplay({ services: { children: next } });
    }
  };

  const addQuickLink = () => {
    const items = displayLayout.quickLinks.items || [];
    patchDisplay({
      quickLinks: {
        items: [
          ...items,
          {
            id: `ql-${Date.now()}`,
            name: "New Link",
            url: "/",
            target: "_self",
            order: items.length,
            children: [],
            style: {},
          },
        ],
      },
    });
  };

  const syncCatalogServices = () => {
    const catalog = navSources?.services || [];
    const existing = new Set(
      (displayLayout.services.children || []).map((c) => String(c.serviceId || ""))
    );
    const next = [...(displayLayout.services.children || [])];
    catalog.forEach((row, idx) => {
      const sid = String(row.serviceId || "").trim();
      if (!sid || existing.has(sid)) return;
      next.push({
        id: `svc-${sid}`,
        name: row.label || "Service",
        url: "#",
        serviceId: sid,
        linkPerArea: true,
        target: "_self",
        order: next.length + idx,
        children: [],
        style: {},
      });
    });
    patchDisplay({ services: { children: next } });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Top CTA banner</CardTitle>
          <CardDescription>
            Same text as the book-now strip on your live footer. Edit here and save to update the site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Show CTA banner</Label>
            <Switch
              checked={displayLayout.showCtaBanner !== false}
              onCheckedChange={(checked) => patchDisplay({ showCtaBanner: checked })}
            />
          </div>
          {displayLayout.showCtaBanner !== false && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Headline</Label>
                <Input
                  value={displayLayout.cta.title}
                  placeholder="e.g. Get in touch with your business name"
                  onChange={(e) => patchDisplay({ cta: { ...displayLayout.cta, title: e.target.value } })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Supporting line</Label>
                <Textarea
                  rows={2}
                  value={displayLayout.cta.subtitle}
                  placeholder="Short line under the headline"
                  onChange={(e) => patchDisplay({ cta: { ...displayLayout.cta, subtitle: e.target.value } })}
                />
              </div>
              <div>
                <Label>Button text</Label>
                <Input
                  value={displayLayout.cta.buttonText}
                  onChange={(e) => patchDisplay({ cta: { ...displayLayout.cta, buttonText: e.target.value } })}
                />
              </div>
              <div>
                <Label>Button link</Label>
                <Input
                  value={displayLayout.cta.buttonLink}
                  onChange={(e) => patchDisplay({ cta: { ...displayLayout.cta, buttonLink: e.target.value } })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Footer columns</CardTitle>
          <CardDescription>Choose which sections appear on the live site</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["about", "About (logo, description, social)"],
              ["quickLinks", "Quick links"],
              ["services", "Services"],
              ["contact", "Contact"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between border rounded-md p-3">
              <Label>{label}</Label>
              <Switch
                checked={displayLayout.columns[key]?.enabled !== false}
                onCheckedChange={(checked) =>
                  patchDisplay({
                    columns: {
                      ...displayLayout.columns,
                      [key]: { ...displayLayout.columns[key], enabled: checked },
                    },
                  })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About column</CardTitle>
          <CardDescription>
            Logo is set under Footer logo below. Social links come from About Us.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Show description under logo</Label>
            <Switch
              checked={displayLayout.about.showTagline !== false}
              onCheckedChange={(checked) =>
                patchDisplay({ about: { ...displayLayout.about, showTagline: checked } })
              }
            />
          </div>
          {displayLayout.about.showTagline !== false && (
            <div>
              <Label>Footer description (under logo)</Label>
              <Textarea
                rows={3}
                value={displayLayout.about.tagline}
                placeholder={
                  livePreview?.tagline ||
                  "Generated footer description appears here after site build, or type your own."
                }
                onChange={(e) =>
                  patchDisplay({ about: { ...displayLayout.about, tagline: e.target.value } })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Shown on your live site under the logo. Uses AI-generated copy from your site build when
                empty; edit and save to override.
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label>Show social links</Label>
            <Switch
              checked={displayLayout.about.showSocial !== false}
              onCheckedChange={(checked) =>
                patchDisplay({ about: { ...displayLayout.about, showSocial: checked } })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Quick links</CardTitle>
              <CardDescription>Main pages (Home, About, Areas, Contact, etc.)</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addQuickLink}>
              <Plus className="h-4 w-4 mr-1" />
              Add link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => {
              const { active, over } = e;
              if (over && active.id !== over.id) {
                reorderList("quickLinks", String(active.id), String(over.id));
              }
            }}
          >
            <SortableContext
              items={displayLayout.quickLinks.items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {displayLayout.quickLinks.items.map((item, idx) => (
                  <SortableLinkRow
                    key={item.id}
                    item={item}
                    pages={pages}
                    onChange={(p) => {
                      const items = [...displayLayout.quickLinks.items];
                      items[idx] = { ...items[idx], ...p };
                      patchDisplay({ quickLinks: { items } });
                    }}
                    onRemove={() => {
                      patchDisplay({
                        quickLinks: {
                          items: displayLayout.quickLinks.items.filter((_, i) => i !== idx),
                        },
                      });
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Services column</CardTitle>
              <CardDescription>Same catalog services as header — linked per area on the live site</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={syncCatalogServices}>
              Sync from catalog
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => {
              const { active, over } = e;
              if (over && active.id !== over.id) {
                reorderList("services", String(active.id), String(over.id));
              }
            }}
          >
            <SortableContext
              items={displayLayout.services.children.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {displayLayout.services.children.map((item, idx) => (
                  <SortableLinkRow
                    key={item.id}
                    item={item}
                    pages={pages}
                    onChange={(p) => {
                      const children = [...displayLayout.services.children];
                      children[idx] = { ...children[idx], ...p };
                      patchDisplay({ services: { children } });
                    }}
                    onRemove={() => {
                      patchDisplay({
                        services: {
                          children: displayLayout.services.children.filter((_, i) => i !== idx),
                        },
                      });
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact column</CardTitle>
          <CardDescription>Phone, email, and location come from About Us. Customize labels below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              ["showPhone", "Show phone"],
              ["showEmail", "Show email"],
              ["showLocation", "Show location"],
              ["showHours", "Show availability / hours"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label>{label}</Label>
              <Switch
                checked={displayLayout.contact[key] !== false}
                onCheckedChange={(checked) =>
                  patchDisplay({ contact: { ...displayLayout.contact, [key]: checked } })
                }
              />
            </div>
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Phone subtext</Label>
              <Input
                value={displayLayout.contact.phoneSub}
                onChange={(e) =>
                  patchDisplay({ contact: { ...displayLayout.contact, phoneSub: e.target.value } })
                }
              />
            </div>
            <div>
              <Label>Email subtext</Label>
              <Input
                value={displayLayout.contact.emailSub}
                onChange={(e) =>
                  patchDisplay({ contact: { ...displayLayout.contact, emailSub: e.target.value } })
                }
              />
            </div>
            <div>
              <Label>Availability title</Label>
              <Input
                value={displayLayout.contact.hoursText}
                onChange={(e) =>
                  patchDisplay({ contact: { ...displayLayout.contact, hoursText: e.target.value } })
                }
              />
            </div>
            <div>
              <Label>Availability subtext</Label>
              <Input
                value={displayLayout.contact.hoursSub}
                onChange={(e) =>
                  patchDisplay({ contact: { ...displayLayout.contact, hoursSub: e.target.value } })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
