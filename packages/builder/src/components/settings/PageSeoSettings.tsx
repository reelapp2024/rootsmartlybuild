'use client';

import React, { useState, useEffect } from 'react';
import { http } from '../../config';
import { Search, Save, Loader2 } from 'lucide-react';

interface PageSeoSettingsProps {
  projectId?: string;
  pageId?: string;
}

interface SeoSettingsData {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  meta_image: string;
  canonical_url: string;
}

export default function PageSeoSettings({ projectId, pageId }: PageSeoSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seoData, setSeoData] = useState<SeoSettingsData>({
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    meta_image: '',
    canonical_url: '',
  });

  // Fetch SEO settings on mount
  useEffect(() => {
    if (projectId) {
      fetchSeoSettings();
    }
  }, [projectId, pageId]);

  const fetchSeoSettings = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error('Authentication token not found');
        return;
      }

      const queryParams = new URLSearchParams({ projectId: projectId });
      if (pageId) {
        queryParams.append('pageId', pageId);
      }

      const response = await http.get(`/builderSeoSettings?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.data) {
        setSeoData({
          meta_title: response.data.data.meta_title || '',
          meta_description: response.data.data.meta_description || '',
          meta_keywords: response.data.data.meta_keywords || '',
          meta_image: response.data.data.meta_image || '',
          canonical_url: response.data.data.canonical_url || '',
        });
      } else {
        // Reset to empty if no data found
        setSeoData({
          meta_title: '',
          meta_description: '',
          meta_keywords: '',
          meta_image: '',
          canonical_url: '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching SEO settings:', error);
      // If 404 or no data, reset to empty
      setSeoData({
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        meta_image: '',
        canonical_url: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!projectId) {
      alert('Project ID is required');
      return;
    }

    if (!seoData.meta_title || !seoData.meta_description || !seoData.meta_keywords) {
      alert('Meta Title, Description, and Keywords are required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert('Authentication token not found');
        return;
      }

      const response = await http.post(
        '/builderSeoSettings',
        {
          projectId,
          pageId: pageId || undefined,
          metaTitle: seoData.meta_title,
          metaDescription: seoData.meta_description,
          metaKeywords: seoData.meta_keywords,
          metaImage: seoData.meta_image,
          canonicalUrl: seoData.canonical_url,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        alert('SEO settings saved successfully!');
      }
    } catch (error: any) {
      console.error('Error saving SEO settings:', error);
      alert(error.response?.data?.message || 'Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Loading SEO settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {/* Meta Title */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Meta Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={seoData.meta_title}
            onChange={(e) => setSeoData({ ...seoData, meta_title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter meta title (50-60 characters recommended)"
            maxLength={60}
          />
          <p className="text-xs text-gray-500 mt-1">{seoData.meta_title.length}/60 characters</p>
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Meta Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={seoData.meta_description}
            onChange={(e) => setSeoData({ ...seoData, meta_description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Enter meta description (150-160 characters recommended)"
            rows={3}
            maxLength={160}
          />
          <p className="text-xs text-gray-500 mt-1">{seoData.meta_description.length}/160 characters</p>
        </div>

        {/* Meta Keywords */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Meta Keywords <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={seoData.meta_keywords}
            onChange={(e) => setSeoData({ ...seoData, meta_keywords: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter keywords separated by commas"
          />
          <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
        </div>

        {/* Meta Image */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Meta Image (Open Graph)
          </label>
          <input
            type="url"
            value={seoData.meta_image}
            onChange={(e) => setSeoData({ ...seoData, meta_image: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/image.jpg"
          />
          <p className="text-xs text-gray-500 mt-1">URL for social media preview image (1200x630px recommended)</p>
        </div>

        {/* Canonical URL */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Canonical URL
          </label>
          <input
            type="url"
            value={seoData.canonical_url}
            onChange={(e) => setSeoData({ ...seoData, canonical_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/page"
          />
          <p className="text-xs text-gray-500 mt-1">Preferred URL for this page (optional)</p>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !projectId}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save SEO Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

