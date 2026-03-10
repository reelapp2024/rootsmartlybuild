// app/HomePageClient.tsx - Client Component
'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import AboutSection from '@/components/AboutSection'
import ServicesSection from '@/components/ServicesSection'
import Footer from '@/components/Footer'
import { useTheme } from '@/contexts/ThemeContext'
import { httpFile } from '@/config'
import Loader from '@/components/Loader'

interface HomePageClientProps {
  initialData: any
}

export default function HomePageClient({ initialData }: HomePageClientProps) {
  const { getThemeColors } = useTheme()
  const colors = getThemeColors()
  
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [projectCategory, setProjectCategory] = useState("")
  const [CTA, setCTA] = useState([])
  const [phoneNumber, setPhoneNumber] = useState("")
  const [backgroundImage, setBackgroundImage] = useState("")
  const [welcomeLine, setWelcomeLine] = useState('')
  const [projectSlogan, setProjectSlogan] = useState('')
  const [features, setFeatures] = useState([])
  const [heroHeadingPart1, setHeroHeadingPart1] = useState('')
  const [heroHeadingPart2, setHeroHeadingPart2] = useState('')

  // If no initial data, fetch on client
  useEffect(() => {
    if (!initialData) {
      const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'default'
      
      httpFile.post('/webapp/v1/my_site', {
        projectId,
        pageType: 'home',
        reqFrom: 'Hero'
      })
      .then(({ data }) => {
        processData(data)
        setData(data)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Fetch hero data error:', err)
        setIsLoading(false)
      })
    } else {
      processData(initialData)
      setIsLoading(false)
    }
  }, [initialData])

  const processData = (data: any) => {
    const info = data?.projectInfo || {}
    const about = data?.aboutUs || {}
    
    setCTA(info.cta || [])
    setBackgroundImage(info.images?.[2]?.url || "")
    setProjectCategory(info.serviceType || '')
    setWelcomeLine(info.welcomeLine || '')
    setPhoneNumber(about.phone || '')
    setProjectSlogan(info.projectSlogan || `Professional ${info.serviceType}`)
    
    // Process hero heading
    const words = info.heroHeading?.split(' ') || []
    const conjunctions = ['and', 'or', 'but', 'with', 'for']
    
    if (words.length > 3) {
      let breakIndex = -1
      for (let i = 0; i < words.length; i++) {
        if (conjunctions.includes(words[i].toLowerCase())) {
          breakIndex = i
          break
        }
      }
      
      if (breakIndex !== -1) {
        setHeroHeadingPart1(words.slice(0, breakIndex + 1).join(' ') || '')
        setHeroHeadingPart2(words.slice(breakIndex + 1).join(' ') || '')
      } else {
        setHeroHeadingPart1(words.slice(0, words.length - 2).join(' ') || '')
        setHeroHeadingPart2(words.slice(-2).join(' ') || '')
      }
    } else {
      setHeroHeadingPart1(words.slice(0, 1).join(' ') || '')
      setHeroHeadingPart2(words.slice(1).join(' ') || '')
    }
    
    // Process features
    const strip = (s: any) =>
      typeof s === 'string'
        ? s.trim().replace(/^[,\"\s]+|[,\"\s]+$/g, '')
        : ''
    
    const modifiedFeatures = (info.featuresSection || []).map((f: any) => ({
      serialno: f.serialno,
      iconName: strip(f.iconName),
      title: strip(f.title),
      subtitle: strip(f.subtitle),
    }))
    
    setFeatures(modifiedFeatures)
  }

  if (isLoading) {
    return <Loader message="Loading Home Page..." variant="elegant" size="lg" />
  }

  return (
    <div className="min-h-screen font-poppins">
      <Header />
      
      {/* Hero Section - Pass data as props */}
      <section
        id="home"
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.gradient.from} 0%, ${colors.gradient.to} 100%)`
        }}
      >
        {/* Your hero section JSX from Index.tsx */}
        {/* ... */}
      </section>

      <AboutSection />
      <ServicesSection />
      {/* ... other sections */}
      <Footer />
    </div>
  )
}


