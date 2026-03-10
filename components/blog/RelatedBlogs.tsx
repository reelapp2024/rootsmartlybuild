'use client';

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { httpFile } from "@/config";
import { getProjectId } from "@/hooks/getProjectId";

interface RelatedBlogsProps {
  excludeSlug?: string;
  limit?: number;
  heading?: string;
}

interface BlogCard {
  slug: string;
  title: string;
  image: string;
  summary?: string;
}

const RelatedBlogs: React.FC<RelatedBlogsProps> = ({
  excludeSlug,
  limit = 6,
  heading = "Related Articles",
}) => {
  const projectId = getProjectId();
  const [blogs, setBlogs] = useState<BlogCard[]>([]);
  const [loading, setLoading] = useState(false);

  const requestPayload = useMemo(() => {
    if (!projectId) return null;
    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("limit", String(limit));
    if (excludeSlug) {
      formData.append("excludeSlug", excludeSlug);
    }
    return formData;
  }, [excludeSlug, limit, projectId]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!requestPayload) return;
      try {
        setLoading(true);
        const { data } = await httpFile.post("/admin/v1/related_blogs", requestPayload, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const rawItems = Array.isArray(data?.items) ? data.items : [];
        const normalized = rawItems
          .map((item: any): BlogCard | null => {
            const slug = String(item?.slug ?? "").trim();
            if (!slug) return null;

            const title =
              item?.title ||
              slug
                .split("-")
                .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ");

            const image =
              item?.coverImage?.url ||
              item?.coverImage ||
              "https://picsum.photos/seed/related-blog/600/400";

            return {
              slug,
              title,
              image,
              summary:
                typeof item?.information === "string"
                  ? item.information.slice(0, 120)
                  : undefined,
            };
          })
          .filter(Boolean) as BlogCard[];

        setBlogs(normalized);
      } catch (error) {
        console.error("Failed to load related blogs", error);
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [requestPayload]);

  if (!projectId) {
    return null;
  }

  if (loading && blogs.length === 0) {
    return (
      <section className="py-10">
        <p className="text-center text-sm text-gray-500">Loading related articles...</p>
      </section>
    );
  }

  if (blogs.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">{heading}</h3>
        <Link href="/blog" className="text-sm font-semibold text-pink-600 hover:underline">
          View all
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog) => (
          <Link
            key={blog.slug}
            href={`/blog/${blog.slug}`}
            className="group rounded-xl border border-gray-100 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative h-48 w-full overflow-hidden rounded-t-xl">
              <Image
                src={blog.image}
                alt={blog.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5 space-y-3">
              <h4 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {blog.title}
              </h4>
              {blog.summary && (
                <p className="text-sm text-gray-600 line-clamp-2">{blog.summary}</p>
              )}
              <span className="text-sm font-semibold text-pink-600">Read more →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedBlogs;



