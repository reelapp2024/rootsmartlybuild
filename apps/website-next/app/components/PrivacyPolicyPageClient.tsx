'use client';

import React, { useEffect, useMemo, useState } from "react";
import Header from '@/themes/multicolor/components/Header';
import Footer from '@/themes/multicolor/components/Footer';
// import SEOHead from '@/themes/multicolor/components/SEOHead'; // Removed - using Next.js Metadata API instead
import { useSchemaMarkup } from '../../hooks/useSchemaMarkup';
import { generateWebPageSchema } from '@/themes/multicolor/utils/schemaGenerator';
import { useTheme } from '@/themes/multicolor/contexts/ThemeContext';
import { Shield, AlertTriangle, Eye, Lock, User, Database, Globe, Mail } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

import Link from 'next/link';
import { httpFile } from "@/config";
import { getProjectId } from '../../hooks/getProjectId';
import DOMPurify from "dompurify";

const PrivacyPolicyPageClient = () => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();

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

  const safeColors = colors || fallbackColors;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = origin ? `${origin}/privacy-policy` : '/privacy-policy';
  const pageSchema = useMemo(() => generateWebPageSchema({
    name: 'Privacy Policy - US Plumbers',
    description: 'Privacy Policy for US Plumbers - Learn how we collect, use, and protect your personal information.',
    url: canonicalUrl
  }), [canonicalUrl]);

  useSchemaMarkup(pageSchema, 'privacy-policy-page');

  // ---- Dynamic content logic start ----
  const [privacyContent, setPrivacyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const projectId = getProjectId();

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/fetchTnC_Au_Pp", { projectId });
        if (data.privacyPolicy) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(data.privacyPolicy, "text/html");
          const bodyContent = doc.body.innerHTML;
          const cleanHTML = DOMPurify.sanitize(bodyContent);
          setPrivacyContent(cleanHTML);
        } else {
          setPrivacyContent("<p>No privacy policy available.</p>");
        }
      } catch (err) {
        setError("Failed to load privacy policy.");
        setPrivacyContent("");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);
  // ---- Dynamic content logic end ----

  return (
    <div className="min-h-screen font-poppins" style={{ backgroundColor: safeColors.surface }}>
      {/* SEO Meta Tags - handled by Next.js Metadata API */}

      <Header />
      
      {/* Custom Styles for Dynamic Content */}
      <style>
        {`
          .dynamic-content h1 {
            font-size: 1.25rem !important;
            font-weight: 700 !important;
            color: #1f2937 !important;
            margin-bottom: 0.75rem !important;
            margin-top: 0 !important;
            line-height: 1.3 !important;
          }
          .dynamic-content h2 {
            font-size: 1.125rem !important;
            font-weight: 600 !important;
            color: #374151 !important;
            margin-top: 1rem !important;
            margin-bottom: 0.5rem !important;
            line-height: 1.4 !important;
          }
          .dynamic-content h3 {
            font-size: 1rem !important;
            font-weight: 600 !important;
            color: #4b5563 !important;
            margin-top: 0.75rem !important;
            margin-bottom: 0.375rem !important;
            line-height: 1.4 !important;
          }
          .dynamic-content p {
            font-size: 0.875rem !important;
            color: #6b7280 !important;
            margin-bottom: 0.75rem !important;
            line-height: 1.5 !important;
          }
          .dynamic-content ul {
            margin-bottom: 0.75rem !important;
            padding-left: 1rem !important;
          }
          .dynamic-content li {
            font-size: 0.875rem !important;
            color: #6b7280 !important;
            margin-bottom: 0.25rem !important;
            line-height: 1.5 !important;
          }
          .dynamic-content strong {
            font-weight: 600 !important;
            color: #374151 !important;
          }
          .dynamic-content em {
            font-style: italic !important;
            color: #6b7280 !important;
          }
          .dynamic-content a {
            color: ${safeColors.primaryButton.bg} !important;
            text-decoration: underline !important;
          }
          .dynamic-content a:hover {
            color: ${safeColors.primaryButton.hover} !important;
          }
        `}
      </style>
      
      {/* Hero Section */}
      <section className="relative py-8 sm:py-12 lg:py-16 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 border-2 rounded-full" style={{ borderColor: safeColors.primaryButton.bg }}></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 border-2 rounded-lg rotate-45" style={{ borderColor: safeColors.accent }}></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 border rounded-full" style={{ borderColor: safeColors.primaryButton.bg }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative">
          {/* Breadcrumb */}
          <div className="mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg inline-block">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/" className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
                        <Home className="w-4 h-4 mr-2" />
                        Home
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium text-sm" style={{ color: safeColors.primaryButton.bg }}>Privacy Policy</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                }}
              >
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 
                className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Privacy Policy
              </h1>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-3xl mx-auto">
                Your privacy is important to us. This policy explains how we collect, use, and protect your information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4 sm:px-8 lg:px-16">
          <div className="max-w-5xl mx-auto">
            {/* Important Notice */}
            <div 
              className="rounded-2xl p-4 mb-6"
              style={{
                backgroundColor: `${safeColors.primaryButton.bg}08`,
                border: `1px solid ${safeColors.primaryButton.bg}20`
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                  }}
                >
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Privacy Notice</h3>
                  <p className="text-gray-700 leading-relaxed text-xs">
                    We are committed to protecting your privacy and ensuring the security of your personal information. 
                    Please read this policy carefully to understand how we handle your data.
                  </p>
                </div>
              </div>
            </div>

            {/* Dynamic Content Card */}
            <div
              className="group bg-white rounded-2xl p-4 transition-all duration-500 hover:-translate-y-1 shadow-md hover:shadow-lg"
              style={{
                border: `1px solid ${safeColors.primaryButton.bg}15`
              }}
            >
              {/* Hover Border Effect */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  border: `2px solid ${safeColors.primaryButton.bg}40`,
                  boxShadow: `0 0 20px ${safeColors.primaryButton.bg}20`
                }}
              ></div>

              <div className="relative">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all duration-500 group-hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                    }}
                  >
                    <Lock className="text-white text-lg" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                      Privacy Policy Details
                    </h2>
                    <p className="text-gray-600 leading-relaxed text-xs">
                      Our comprehensive privacy policy for data protection and user rights
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  
                  {error && (
                    <div className="text-center py-6">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2"
                        style={{ backgroundColor: `${safeColors.primaryButton.bg}10` }}
                      >
                        <AlertTriangle className="w-4 h-4" style={{ color: safeColors.primaryButton.bg }} />
                      </div>
                      <p className="text-red-500 text-xs">{error}</p>
                    </div>
                  )}
                  
                  {!loading && !error && (
                    <div
                      className="dynamic-content max-w-none"
                      style={{
                        color: safeColors.description,
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}
                      dangerouslySetInnerHTML={{ __html: privacyContent }}
                    />
                  )}
                </div>

                {/* Bottom Accent Line */}
                <div
                  className="h-0.5 rounded-full transition-all duration-500 group-hover:w-full mt-4"
                  style={{
                    width: '2rem',
                    background: `linear-gradient(90deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPageClient;
