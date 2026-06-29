'use client';

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import { Calendar, Clock, ArrowRight, BookOpen, Search, Filter } from 'lucide-react';

import Header from "@/themes/multicolor/components/Header";
import Footer from "@/themes/multicolor/components/Footer";
import { httpFile } from "@/config";
import { getProjectId } from '@/hooks/getProjectId';
import { useTheme } from '@/themes/multicolor/contexts/ThemeContext';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

type BlogItem = { 
  slug: string; 
  url?: string; 
  featured_image?: string;
  title?: string;
  quick_answer?: string;
  published_date?: string;
};

const BlogPageClient = () => {
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
  
  const projectId = getProjectId();

  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  console.log("ListBlogs loading state:", loading);

  // Function to generate quick answer based on title (exactly 15 words)
  const generateQuickAnswer = (title: string) => {
    const quickAnswers = [
      "Expert tips and professional insights for better results and success.",
      "Professional guidance and proven techniques for optimal results and outcomes.",
      "Comprehensive solutions and expert advice for your specific needs and requirements.",
      "Proven methods and professional tips for achieving the best possible results.",
      "Expert insights and professional guidance for better outcomes and improved performance.",
      "Professional advice and proven techniques for success and optimal performance.",
      "Comprehensive guide with expert tips and professional insights for better results.",
      "Expert solutions and professional guidance for your specific needs and success."
    ];
    
    // Use title hash to get consistent quick answer
    const hash = title.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return quickAnswers[Math.abs(hash) % quickAnswers.length];
  };

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch blog data with featured images using the same API as RelatedBlogs
        const formData = new FormData();
        formData.append("projectId", projectId || "");
        formData.append("limit", "50"); // Get more blogs

        const { data } = await httpFile.post("/admin/v1/related_blogs", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const raw = Array.isArray(data?.items) ? data.items : [];
        const normalized: BlogItem[] = raw
          .map((item: any) => {
            const slug = String(item?.slug ?? "").trim();
            if (!slug) return null;

            // Get featured image using same logic as RelatedBlogs
            const getImgSrc = () => {
              if (item.coverImage?.url) return item.coverImage.url;
              if (typeof item.coverImate === "string" && item.coverImate.trim()) return item.coverImate;
              return "https://picsum.photos/seed/blog-fallback/640/400";
            };

            const title = item?.title || slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
            
            return { 
              slug, 
              url: `/blog/${slug}`,
              featured_image: getImgSrc(),
              title: title,
              quick_answer: generateQuickAnswer(title),
              published_date: item?.published_date || new Date().toISOString().split('T')[0]
            };
          })
          .filter(Boolean) as BlogItem[];

        setBlogs(normalized);
      } catch (err) {
        console.error(err);
        setError("Failed to load blogs.");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchBlogs();
    } else {
      setLoading(false);
      setError("Project ID is missing. Set NEXT_PUBLIC_PROJECT_ID in .env.local or provide ?siteId= in URL.");
    }
  }, [projectId]);

  // Filter blogs based on search term
  const filteredBlogs = blogs.filter(blog =>
    blog.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen font-poppins" style={{ backgroundColor: safeColors.surface }}>
        <Header />

        {/* Hero Section */}
        <section 
          className="relative py-8 sm:py-12 lg:py-16 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${safeColors.gradient.from}, ${safeColors.gradient.to})`
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 rounded-full animate-pulse" style={{ backgroundColor: safeColors.accent }}></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full animate-pulse" style={{ animationDelay: '1s', backgroundColor: safeColors.primaryButton.bg }}></div>
            <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-full animate-pulse" style={{ animationDelay: '2s', backgroundColor: safeColors.accent }}></div>
          </div>

          {/* Breadcrumb - Top Left */}
          <div className="absolute top-6 left-4 sm:left-8 lg:left-16 z-30">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/" className="flex items-center text-xs text-gray-600 hover:text-gray-900 transition-colors">
                        <Home className="w-3 h-3 mr-1" />
                        Home
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium text-xs" style={{ color: safeColors.primaryButton.bg }}>Blogs</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-8 lg:px-16 text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                {loading ? (
                  /* Skeleton Loading */
                  <>
                    <div className="w-20 h-20 rounded-full mx-auto mb-6 bg-white/50 animate-pulse"></div>
                    <div className="h-10 sm:h-12 lg:h-14 w-full max-w-2xl bg-white/50 rounded animate-pulse mx-auto mb-6"></div>
                    <div className="space-y-2 max-w-3xl mx-auto">
                      <div className="h-5 w-full bg-white/50 rounded animate-pulse"></div>
                      <div className="h-5 w-5/6 bg-white/40 rounded animate-pulse mx-auto"></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                      style={{
                        background: `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                      }}
                    >
                      <BookOpen className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6" style={{ color: '#ffffff' }}>
                      Our Blog & Articles
                    </h1>
                    <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
                      Discover insights, tips, and expert advice from our team of professionals
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4 sm:px-8 lg:px-16">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search blogs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300"
                  style={{
                    '--tw-ring-color': safeColors.primaryButton.bg
                  } as React.CSSProperties}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Blogs Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-8 lg:px-16">
            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-4" style={{ backgroundColor: `${safeColors.primaryButton.bg}15`, color: safeColors.primaryButton.bg }}>
                Latest Articles
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Explore Our Content
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
                Stay updated with the latest insights and expert advice from our team
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: safeColors.primaryButton.bg }}></div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: safeColors.heading }}>Loading Blogs...</h2>
                  <p style={{ color: safeColors.description }}>Please wait while we load the blogs.</p>
                  <p className="text-xs text-gray-500 mt-2">Loading state: {loading.toString()}</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${safeColors.primaryButton.bg}15` }}>
                  <BookOpen className="w-8 h-8" style={{ color: safeColors.primaryButton.bg }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Blogs</h3>
              <p className="text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* No Blogs State */}
            {!loading && !error && blogs.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${safeColors.primaryButton.bg}15` }}>
                  <BookOpen className="w-8 h-8" style={{ color: safeColors.primaryButton.bg }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Blogs Found</h3>
                <p className="text-gray-600">We're working on adding new content. Please check back later.</p>
              </div>
            )}

            {/* No Search Results */}
            {!loading && !error && blogs.length > 0 && filteredBlogs.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${safeColors.primaryButton.bg}15` }}>
                  <Search className="w-8 h-8" style={{ color: safeColors.primaryButton.bg }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600">Try adjusting your search terms.</p>
              </div>
            )}

            {/* Blogs Grid */}
            {!loading && !error && filteredBlogs.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBlogs.map((blog, index) => (
                  <Link
                    key={blog.slug}
                    href={blog.url || `/blog/${blog.slug}` || '#'}
                    className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                    style={{
                      border: `1px solid ${safeColors.primaryButton.bg}15`
                    }}
                  >
                    {/* Featured Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={blog.featured_image}
                        alt={blog.title || blog.slug.replace(/-/g, " ")}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        decoding="async"
                        width="400"
                        height="192"
                        onError={(e) => {
                          e.currentTarget.src = "https://picsum.photos/seed/blog-fallback/640/400";
                        }}
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                      
                      {/* Blog Category Badge */}
                      <div className="absolute top-4 left-4">
                        <div 
                          className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm"
                          style={{
                            backgroundColor: `${safeColors.primaryButton.bg}90`,
                            color: 'white'
                          }}
                        >
                          Article
                        </div>
                      </div>

                      {/* Read More Arrow */}
                      <div 
                        className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                        style={{
                          backgroundColor: `${safeColors.primaryButton.bg}90`,
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    {/* Blog Card Content */}
                    <div className="p-6 space-y-4">
                      {/* Blog Title */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-bold leading-tight text-gray-900 group-hover:transition-colors duration-300">
                          {blog.title || blog.slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        
                        {/* Quick Answer - Simple */}
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {blog.quick_answer}
                        </p>
                      </div>

                      {/* Blog Meta */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{blog.published_date || new Date().toISOString().split('T')[0]}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>5 min read</span>
                        </div>
                      </div>

                      {/* Read More Button */}
                      <div className="flex items-center justify-center pt-2">
                        <div className="flex items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:gap-3" style={{ color: safeColors.primaryButton.bg }}>
                          Read More
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Bottom Accent Line */}
                      <div 
                        className="h-1 rounded-full transition-all duration-500 group-hover:w-full"
                        style={{
                          width: '3rem',
                          background: `linear-gradient(90deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                        }}
                      ></div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Results Count */}
            {!loading && !error && blogs.length > 0 && (
              <div className="text-center mt-8">
                <p className="text-sm text-gray-600">
                  Showing {filteredBlogs.length} of {blogs.length} articles
                </p>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
  );
};

export default BlogPageClient;

