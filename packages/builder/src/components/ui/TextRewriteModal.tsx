import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';

interface TextRewriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentText: string;
  onRewrite: (rewrittenText: string) => void;
  serviceName?: string; // Optional service name for context
  projectId?: string;
  userId?: string;
  pageId?: string;
}

// Predefined prompts for different contexts
const PREDEFINED_PROMPTS = [
  {
    value: 'hero_section',
    label: 'Hero Section - Make it engaging and compelling',
    prompt: 'This is for a hero section. Rewrite it to be more engaging, compelling, and attention-grabbing while maintaining professionalism.'
  },
  {
    value: 'service_description',
    label: 'Service Description - Make it clear and professional',
    prompt: 'This is for a service description. Rewrite it to be clear, professional, and highlight the key benefits and value proposition.'
  },
  {
    value: 'heading',
    label: 'Heading - Make it impactful and concise',
    prompt: 'This is for a heading. Rewrite it to be more impactful, concise, and attention-grabbing while keeping it short and punchy.'
  },
  {
    value: 'paragraph',
    label: 'Paragraph - Make it clear and readable',
    prompt: 'This is for a paragraph. Rewrite it to be clearer, more readable, and better structured while maintaining the original meaning.'
  },
  {
    value: 'call_to_action',
    label: 'Call to Action - Make it persuasive',
    prompt: 'This is for a call to action. Rewrite it to be more persuasive, action-oriented, and compelling to encourage user engagement.'
  },
  {
    value: 'testimonial',
    label: 'Testimonial - Make it authentic and credible',
    prompt: 'This is for a testimonial. Rewrite it to sound more authentic, credible, and natural while highlighting the key positive points.'
  },
  {
    value: 'about_us',
    label: 'About Us - Make it personal and engaging',
    prompt: 'This is for an about us section. Rewrite it to be more personal, engaging, and relatable while maintaining professionalism.'
  },
  {
    value: 'custom',
    label: 'Custom Prompt',
    prompt: ''
  }
];

export default function TextRewriteModal({
  isOpen,
  onClose,
  currentText,
  onRewrite,
  serviceName,
  projectId,
  userId,
  pageId
}: TextRewriteModalProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<string>('hero_section');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [wordCount, setWordCount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate current word count
  const currentWordCount = useMemo(() => {
    if (!currentText || typeof currentText !== 'string') return 0;
    return currentText.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, [currentText]);

  // Initialize word count with current word count
  useEffect(() => {
    if (isOpen && wordCount === '') {
      setWordCount(currentWordCount);
    }
  }, [isOpen, currentWordCount, wordCount]);

  // Get the active prompt text
  const activePromptText = useMemo(() => {
    if (selectedPrompt === 'custom') {
      return customPrompt;
    }
    const prompt = PREDEFINED_PROMPTS.find(p => p.value === selectedPrompt);
    return prompt?.prompt || '';
  }, [selectedPrompt, customPrompt]);

  // Build the final prompt with service context if available
  const finalPrompt = useMemo(() => {
    let prompt = activePromptText;
    
    // Add service context if service name is provided
    if (serviceName && serviceName.trim() !== '') {
      prompt = `${prompt} The text is related to the service: "${serviceName}". Make sure the rewritten text is relevant to this service.`;
    }
    
    return prompt;
  }, [activePromptText, serviceName]);

  const handleRewrite = async () => {
    if (!activePromptText || activePromptText.trim() === '') {
      setError('Please select or enter a prompt');
      return;
    }

    if (!currentText || currentText.trim() === '') {
      setError('No text to rewrite');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get API URL from environment or use default
      let apiUrl = (window as any).__API_URL__ || 'https://apis.smartlybuild.dev';
      
      // Remove /admin/v1 if present (handle both with and without trailing slash)
      apiUrl = apiUrl.replace(/\/admin\/v1\/?$/, '');
      
      // Ensure no trailing slash before appending
      apiUrl = apiUrl.replace(/\/$/, '');
      
      // Construct endpoint - ensure single slash
      const endpoint = `${apiUrl}/custom/v1/rewrite_text`;
      
      console.log('[TextRewriteModal] API URL:', apiUrl);
      console.log('[TextRewriteModal] Endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentText: currentText.trim(),
          promptText: finalPrompt,
          words: wordCount !== '' ? Number(wordCount) : undefined,
          userId: userId || undefined,
          projectId: projectId || undefined,
          pageId: pageId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.rewrittenText) {
        onRewrite(data.data.rewrittenText);
        onClose();
      } else {
        throw new Error(data.message || 'Failed to rewrite text');
      }
    } catch (err: any) {
      console.error('[TextRewriteModal] Error:', err);
      setError(err.message || 'Failed to rewrite text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Rewrite Text</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current Text Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Text
            </label>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-700">{currentText || '(empty)'}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Word count: <span className="font-medium">{currentWordCount}</span> words
            </p>
          </div>

          {/* Prompt Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rewrite Prompt
            </label>
            <select
              value={selectedPrompt}
              onChange={(e) => {
                setSelectedPrompt(e.target.value);
                if (e.target.value !== 'custom') {
                  setCustomPrompt('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {PREDEFINED_PROMPTS.map((prompt) => (
                <option key={prompt.value} value={prompt.value}>
                  {prompt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Prompt Input */}
          {selectedPrompt === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter your custom rewrite instructions..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          )}

          {/* Service Context (if available) */}
          {serviceName && serviceName.trim() !== '' && (
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-xs text-blue-700">
                <span className="font-medium">Service Context:</span> {serviceName}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                The service name will be included in the rewrite prompt for better context.
              </p>
            </div>
          )}

          {/* Word Count Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Word Count (Optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={wordCount}
                onChange={(e) => {
                  const val = e.target.value;
                  setWordCount(val === '' ? '' : Math.max(1, parseInt(val) || 1));
                }}
                placeholder={currentWordCount.toString()}
                min="1"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setWordCount(currentWordCount)}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                disabled={loading}
              >
                Use Current ({currentWordCount})
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to keep the same word count as current text
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleRewrite}
            disabled={loading || !activePromptText || activePromptText.trim() === ''}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rewriting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Rewrite Text
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

