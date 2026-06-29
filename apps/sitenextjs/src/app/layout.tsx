import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@ui/blocks'
import { DEFAULT_TYPOGRAPHY, buildGoogleFontsCssUrl } from '@geniebuild/constants'

// Default metadata (will be overridden by page-level metadata if available)
export const metadata: Metadata = {
  title: {
    default: 'Custom Website',
    template: '%s | SmartlyBuild',
  },
  description: 'Website created with SmartlyBuild',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts - Same as GenieBuild */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={buildGoogleFontsCssUrl()} rel="stylesheet" />
        {/* Font Awesome */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <body className="antialiased">
        <ThemeProvider projectId={null} isBuilder={false} typography={DEFAULT_TYPOGRAPHY}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
