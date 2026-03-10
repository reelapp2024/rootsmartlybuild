import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@ui/blocks'

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
  // Get projectId from environment variable
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '';
  
  return (
    <html lang="en">
      <head>
        {/* Google Fonts - Same as GenieBuild */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Poppins:wght@300;400;500;600;700;900&family=Montserrat:wght@300;400;600;800&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Nunito:wght@300;400;600;700&family=Raleway:wght@300;400;600;700&family=Ubuntu:wght@300;400;500;700&family=Work+Sans:wght@300;400;600&family=Source+Sans+Pro:wght@300;400;600&family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Merriweather:wght@300;400;700&family=Lora:wght@400;700&family=Crimson+Text:wght@400;600&family=Dancing+Script:wght@400;700&family=Pacifico&family=Great+Vibes&family=Satisfy&display=swap" rel="stylesheet" />
        {/* Font Awesome */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <body className="antialiased">
        <ThemeProvider projectId={projectId}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
