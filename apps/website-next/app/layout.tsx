import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Step 5: Font Optimization - Poppins font with optimized loading
// display: "swap" ensures text is visible immediately (no invisible text)
// Next.js automatically optimizes font loading and adds preload hints
const poppins = Poppins({
  subsets: ["latin"], // Only load Latin subset (smaller file size)
  weight: ["300", "400", "500", "600", "700", "800"], // Keep all weights as before
  variable: "--font-poppins", // CSS variable for consistent usage
  display: "swap", // Show fallback font immediately, swap when Poppins loads
  preload: true, // Preload font for faster rendering
});

export const metadata: Metadata = {
  title: {
    default: "Multicolor Theme - Next.js",
    template: "%s | Multicolor Theme",
  },
  description: "Multicolor theme converted to Next.js",
  keywords: ["plumbing", "services", "professional"],
  authors: [{ name: "Your Company" }],
  creator: "Your Company",
  publisher: "Your Company",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Multicolor Theme',
    title: 'Multicolor Theme - Next.js',
    description: 'Multicolor theme converted to Next.js',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Performance hints
  other: {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'x-xss-protection': '1; mode=block',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <head>
        {/* Preconnect to API domain for faster LCP - Performance Step 1: 80ms savings */}
        {/* This helps establish connection early, critical for LCP image loading */}
        <link rel="preconnect" href="https://apis.smartlybuild.dev" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://apis.smartlybuild.dev" />
        
        {/* Step 5: Font Optimization - Preconnect to Google Fonts for faster Poppins loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preconnect to FontAwesome CDN for faster icon loading */}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        
        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="TK-mVY2Wtqsn9RLahsomlfuiNjqISyPZwCzNsatQUbM" />
        
        {/* Critical CSS Inline - Performance: Reduce render-blocking CSS (150ms savings) */}
        {/* Inline critical above-the-fold CSS to prevent render blocking */}
        {/* This includes minimal styles needed for first paint */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Critical CSS for above-the-fold content - prevents render blocking */
              *{font-family:var(--font-poppins),'Poppins',sans-serif}
              body{font-family:var(--font-poppins),'Poppins',sans-serif;margin:0;padding:0}
              .min-h-screen{min-height:100vh}
              .container{width:100%;margin-left:auto;margin-right:auto}
              @media (min-width:640px){.container{max-width:640px}}
              @media (min-width:768px){.container{max-width:768px}}
              @media (min-width:1024px){.container{max-width:1024px}}
              @media (min-width:1280px){.container{max-width:1280px}}
              :root{--background:0 0% 100%;--foreground:222.2 84% 4.9%;--primary:217 91% 60%;--primary-foreground:210 40% 98%}
              h1,h2,h3,h4,h5,h6{font-family:var(--font-poppins),'Poppins',sans-serif;font-weight:700;line-height:1.2}
              p{font-family:var(--font-poppins),'Poppins',sans-serif;font-weight:400;line-height:1.6}
            `,
          }}
        />
        
        {/* FontAwesome CSS - Load asynchronously to prevent render blocking (Performance Step 1) */}
        {/* Load CSS asynchronously using script to avoid blocking render */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
                link.integrity = 'sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==';
                link.crossOrigin = 'anonymous';
                link.referrerPolicy = 'no-referrer';
                document.head.appendChild(link);
              })();
            `,
          }}
        />
        {/* Font Display Optimization - Performance Step 4: Override FontAwesome font-display (20ms savings) */}
        {/* This ensures FontAwesome fonts use swap to prevent invisible text during font load */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Override FontAwesome CDN fonts to use font-display: swap */
              @font-face {
                font-family: 'Font Awesome 6 Free';
                font-display: swap;
                src: url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2') format('woff2');
              }
              @font-face {
                font-family: 'Font Awesome 6 Brands';
                font-display: swap;
                src: url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-brands-400.woff2') format('woff2');
              }
              @font-face {
                font-family: 'Font Awesome 6 Pro';
                font-display: swap;
              }
            `,
          }}
        />
      </head>
      <body className={poppins.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

