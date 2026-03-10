import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_PROJECT_URL || "https://apis.smartlybuild.dev";
const PROJECT_ID = import.meta.env.VITE_PROJECT_ID;

type CoverImageObj = {
  url?: string;
  alt?: string;
};

type RelatedItem = {
  title: string;
  slug: string;
  // current API shape
  coverImage?: CoverImageObj;
  information?: string;

  // backward-compat if older API sends a plain string key 'coverImate'
  coverImate?: string;
};

type Props = {
  excludeSlug?: string;
  limit?: number;
};

const RelatedBlogs: React.FC<Props> = ({ excludeSlug, limit = 6 }) => {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchRelated = async () => {
    if (!PROJECT_ID) {
      setErr("PROJECT_ID missing");
      return;
    }

    try {
      setLoading(true);
      setErr(null);

      const form = new FormData();
      form.append("projectId", PROJECT_ID);
      if (excludeSlug) form.append("excludeSlug", excludeSlug);
      if (limit) form.append("limit", String(limit));

      const res = await axios.post(`${API_URL}/admin/v1/related_blogs`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const apiItems = (res?.data?.items || []) as RelatedItem[];
      setItems(apiItems);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Failed to load related articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelated();
  }, [excludeSlug, limit]);

  const getImgSrc = (it: RelatedItem) => {
    if (it.coverImage?.url) return it.coverImage.url;
    if (typeof it.coverImate === "string" && it.coverImate.trim()) return it.coverImate;
    return "https://picsum.photos/seed/related-fallback/640/400";
  };

  const getImgAlt = (it: RelatedItem) => {
    return it.coverImage?.alt || it.title || "Related article";
  };

  if (loading) {
    return (
      <section id="related" className="nx-card nx-related" aria-label="Related articles">
        <h2 className="nx-h2">Related Articles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(3)].map((_, i) => (
            <article key={i} className="nx-related-item animate-pulse">
              <div className="nx-related-media bg-gray-200" style={{ width: "100%", paddingTop: "62.5%" }} />
              <h3 className="nx-h3 text-lg mt-2 bg-gray-200 h-6 w-3/4 rounded" />
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (err || items.length === 0) {
    return (
      <section id="related" className="nx-card nx-related" aria-label="Related articles">
        <h2 className="nx-h2">Related Articles</h2>
        {err ? <p className="text-red-600">{err}</p> : <p>No related articles found.</p>}
      </section>
    );
  }

  return (
    <section id="related" className="nx-card nx-related max-w-6xl mx-auto p-6" aria-label="Related articles">
      <h2 className="nx-h2">Related Articles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((it, idx) => {
          const imgSrc = getImgSrc(it);
          const alt = getImgAlt(it);

          return (
            <article className="nx-related-item" key={`${it.slug}-${idx}`}>
              <Link className="nx-related-media" to={`/blog/${it.slug}`}>
                <img 
                  src={imgSrc} 
                  alt={alt} 
                  loading="lazy" 
                  decoding="async"
                  width="300"
                  height="200"
                  onError={(e) => {
                    e.currentTarget.src = "https://picsum.photos/seed/related-fallback/640/400";
                  }}
                />
              </Link>
              <h3 className="nx-h3 text-lg">
                <Link to={`/blog/${it.slug}`}>{it.title}</Link>
              </h3>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default RelatedBlogs;
