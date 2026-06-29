'use client';

import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface LoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'minimal' | 'elegant';
}

const Loader: React.FC<LoaderProps> = ({ 
  message = "Loading...", 
  size = 'md',
  className = "",
  showIcon = true,
  variant = 'elegant'
}) => {
  // Consistent theme colors
  const colors = {
    primaryButton: { bg: '#e11d48', text: '#ffffff', hover: '#be123c' },
    accent: '#f59e0b',
    surface: '#f8fafc',
    heading: '#1f2937',
    description: '#6b7280'
  };

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'minimal':
        return {
          container: 'min-h-[200px]',
          background: 'transparent',
          card: 'bg-transparent shadow-none'
        };
      case 'elegant':
        return {
          container: 'min-h-screen',
          background: colors.surface,
          card: 'bg-white/80 backdrop-blur-sm shadow-xl'
        };
      default:
        return {
          container: 'min-h-screen',
          background: colors.surface,
          card: 'bg-white shadow-lg'
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div 
      className={`${variantStyles.container} font-poppins flex items-center justify-center ${className}`}
      style={{ backgroundColor: variantStyles.background }}
    >
      <div className="text-center">
        {/* Main Loader Card */}
        <div 
          className={`rounded-3xl p-8 transition-all duration-500 ${variantStyles.card}`}
          style={{
            border: `1px solid ${colors.primaryButton.bg}15`,
            boxShadow: variant === 'elegant' ? `0 20px 40px ${colors.primaryButton.bg}10` : undefined
          }}
        >
          {/* Background Pattern for Elegant Variant */}
          {variant === 'elegant' && (
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div 
                className="absolute top-4 left-4 w-8 h-8 border-2 rounded-full"
                style={{ borderColor: colors.primaryButton.bg }}
              ></div>
              <div 
                className="absolute bottom-4 right-4 w-6 h-6 border-2 rounded-lg rotate-45"
                style={{ borderColor: colors.accent }}
              ></div>
            </div>
          )}

          <div className="relative">
            {/* Icon */}
            {showIcon && (
              <div className="mb-6">
                <div
                  className={`${sizeClasses[size]} rounded-full flex items-center justify-center mx-auto shadow-lg transition-all duration-500`}
                  style={{
                    background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                  }}
                >
                  <Sparkles className={`${iconSizes[size]} text-white animate-pulse`} />
                </div>
              </div>
            )}

            {/* Spinner */}
            <div className="mb-6">
              <div 
                className={`${sizeClasses[size]} rounded-full border-4 mx-auto transition-all duration-500`}
                style={{ 
                  borderColor: `${colors.primaryButton.bg}20`,
                  borderTopColor: colors.primaryButton.bg,
                  animation: 'spin 1s linear infinite'
                }}
              ></div>
            </div>

            {/* Message */}
            <h2 
              className={`font-bold mb-3 transition-all duration-500 ${textSizes[size]}`}
              style={{ 
                backgroundImage: variant === 'elegant' ? `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})` : undefined,
                WebkitBackgroundClip: variant === 'elegant' ? 'text' : undefined,
                backgroundClip: variant === 'elegant' ? 'text' : undefined,
                color: variant === 'elegant' ? 'transparent' : colors.heading,
                WebkitTextFillColor: variant === 'elegant' ? 'transparent' : undefined
              }}
            >
              {message}
            </h2>

            {/* Description removed */}

            {/* Progress Dots */}
            <div className="flex justify-center mt-6 space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{
                    backgroundColor: colors.primaryButton.bg,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1.5s'
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
