'use client';

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DOMPurify from "dompurify";
import axios from "axios";
import Header from "@/themes/multicolor/components/Header";
import Footer from "@/themes/multicolor/components/Footer";
import PageBreadcrumb from "@/themes/multicolor/components/PageBreadcrumb";
import RelatedBlogs from "@/components/blog/RelatedBlogs";
import Comments from "@/components/blog/Comments";
import AuthorComponent from "@/components/blog/AuthorComponent";
import { useTheme } from '@/themes/multicolor/contexts/ThemeContext';
import { BookOpen } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.smartlybuild.dev";
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || "";
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || "";

const BlogDetailPageClient: React.FC = () => {
  const params = useParams();
  const { slug } = params as { slug?: string };
  const router = useRouter();
  const [blogContent, setBlogContent] = useState("");
  const [blogId, setBlogId] = useState("");
  const [blogTitle, setBlogTitle] = useState("");
  const [currentSlug, setCurrentSlug] = useState(""); // Store currentSlug
  const [loading, setLoading] = useState(true);
  
  const { getThemeColors } = useTheme();
  
  // Fallback colors in case theme context is not loaded
  const fallbackColors = {
    primaryButton: { bg: '#e11d48', text: '#ffffff', hover: '#be123c' },
    secondaryButton: { bg: 'transparent', text: '#ffffff', border: '#e11d48', hover: 'rgba(225,29,72,0.1)' },
    accent: '#f59e0b',
    surface: '#f8fafc',
    gradient: { from: '#e11d48', to: '#f59e0b' },
    heading: '#1f2937',
    description: '#6b7280'
  };
  
  const safeColors = getThemeColors() || fallbackColors;

  // Fetch blog HTML
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);

        const formData = new FormData();
        formData.append("slug", slug || "");
        formData.append("projectId", PROJECT_ID);

        const res = await axios.post(`${API_URL}/webapp/v1/get_blog_by_slug`, formData, {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        });

        const blog = res.data.data;
        setBlogId(blog._id);
        setBlogTitle(blog.title);
        setCurrentSlug(blog.currentSlug || blog.slug); // Store currentSlug
        setBlogContent(DOMPurify.sanitize(new DOMParser().parseFromString(blog.content, "text/html").body.innerHTML));

        // Redirect to current slug if different
        if (blog.currentSlug && blog.currentSlug !== slug) {
          console.log(`Redirecting from ${slug} to ${blog.currentSlug}`);
          router.replace(`/blog/${blog.currentSlug}`);
        }

        // Inject CSS
        const doc = new DOMParser().parseFromString(blog.content, "text/html");
        doc.querySelectorAll("link[rel='stylesheet']").forEach((linkEl) => {
          const href = (linkEl as HTMLLinkElement).href;
          if (href && !document.querySelector(`link[href="${href}"]`)) {
            const newLink = document.createElement("link");
            newLink.rel = "stylesheet";
            newLink.href = href;
            document.head.appendChild(newLink);
          }
        });

        // Inject JS
        doc.querySelectorAll("script").forEach((scriptEl) => {
          const src = (scriptEl as HTMLScriptElement).src;
          if (src && !document.querySelector(`script[src="${src}"]`)) {
            const newScript = document.createElement("script");
            newScript.src = src;
            newScript.defer = true;
            document.body.appendChild(newScript);
          }
        });
      } catch (err) {
        console.error("Error fetching blog:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug, router]);


  const breadcrumbItems = [{ label: "Blogs" }];

  return (
    <div className="blog-page">

        <Header />
        <PageBreadcrumb items={breadcrumbItems} />

        <section id="blog-content" className="py-20 bg-gradient-to-b from-secondary to-background transition-colors duration-300">
          <div className="container mx-auto px-16">
            <div dangerouslySetInnerHTML={{ __html: blogContent }} />
            <RelatedBlogs excludeSlug={slug} limit={6} />
            {blogId && <Comments blogId={blogId} />}
            {blogId && <AuthorComponent blogId={blogId} />}
          </div>
        </section>

        <Footer />
      </div>
  );
};

export default BlogDetailPageClient;

