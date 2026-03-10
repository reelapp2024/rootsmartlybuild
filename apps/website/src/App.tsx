
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { Helmet } from "react-helmet-async";
import { DynamicColorProvider } from "./components/DynamicColorProvider";
import ScrollToTop from "./components/ScrollToTop";

import React, { useEffect, useState } from 'react';
import { httpFile } from '../src/config.js';    // wherever your config lives
// Dynamic Theme Components
import ThemeIndex from "./components/ThemeIndex";
import ThemeAbout from "./components/ThemeAbout";
import ThemeServices from "./components/ThemeServices";
import ThemeContact from "./components/ThemeContact";
import ThemeServiceDetail from "./components/ThemeServiceDetail";
import ThemeAreas from "./components/ThemeAreas";
import ThemeAreaDetail from "./components/ThemeAreaDetail";
import ThemeCountry from "./components/ThemeCountry";
import ThemeState from "./components/ThemeState";
import ThemeCity from "./components/ThemeCity";
import ThemePrivacyPolicy from "./components/ThemePrivacyPolicy"
import ThemeTermsConditions from "./components/ThemeTermsConditons";
// Legal Pages
import StateDetail from "./pages/StateDetail";
import CityDetail from "./pages/CityDetail";
import TermsConditions from "./pages/TermsConditions";
import Disclaimer from "./pages/Disclaimer";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

// Theme-specific legal pages
import CleaningTermsConditions from "./themes/cleaning/pages/CleaningTermsConditions";
import CleaningPrivacyPolicy from "./themes/cleaning/pages/CleaningPrivacyPolicy";
import CleaningDisclaimer from "./themes/cleaning/pages/CleaningDisclaimer";
import CleaningColorPicker from "./themes/cleaning/pages/CleaningColorPicker";


import MultiBlog from "./themes/multicolor/pages/multiblog"
import ListBlogs from "./themes/multicolor/pages/ListBlogs"

// Resolve theme CSS URLs so they work in production builds
const cleaningCssUrl = new URL('./cleaning.css', import.meta.url).href;
const multicolorCssUrl = new URL('./multicolor.css', import.meta.url).href;

const queryClient = new QueryClient();
// import ThemeToggle from "./themes/multicolor/components/ThemeToggle";
import { ThemeProvider } from "./themes/multicolor/contexts/ThemeContext";
import { ThemeProvider as UIThemeProvider } from "@ui/blocks";

// Dynamic theme configuration - define the type properly

export type ThemeType =
  | 'cleaning'
  | 'multicolor';

// 2) Declare and export a mutable theme variable
export let currentTheme: ThemeType;

const cleaningcss = "../src/cleaningcss.css"

const App = () => {

  const [theme, setTheme] = useState<'cleaning' | 'multicolor' | null>(null);
  const [themeSubColor, setThemeSubColor] = useState<string | null>(null);  // New state for themeSubColor

  useEffect(() => {
    const projectId = import.meta.env.VITE_PROJECT_ID || 'default';
    console.log('Project ID:', projectId);

    // For development, use multicolor theme as default
    if (!import.meta.env.VITE_PROJECT_ID) {
      console.log('No project ID found, using multicolor theme as default');
      setTheme('multicolor');
      setThemeSubColor('multicolor');
      return;
    }

    httpFile
      .post<{ theme: ThemeType, themeSubColor: string }>('/webapp/v1/theme', { projectId })
      .then(({ data }) => {
        console.log('Theme API response:', data);
        const fetchedTheme = data.theme;
        const fetchedThemeSubColor = data.themeSubColor || null;

        // Set the theme and themeSubColor in state
        setTheme(fetchedTheme);
        setThemeSubColor(fetchedThemeSubColor);

        // Save the theme and themeSubColor to localStorage
        // Priority: API theme always takes precedence
        localStorage.setItem('maintheme', fetchedTheme);
        
        // Only save themeSubColor if API provided it, otherwise keep existing or use default
        if (fetchedThemeSubColor) {
        localStorage.setItem('theme', fetchedThemeSubColor);

          // For cleaning theme, also save to 'cleaningTheme' and 'selectedTheme' for compatibility
          if (fetchedTheme === 'cleaning') {
            localStorage.setItem('cleaningTheme', fetchedThemeSubColor);
            localStorage.setItem('selectedTheme', fetchedThemeSubColor);
          }
        } else {
          // If API didn't provide themeSubColor, use default based on theme
          const defaultSubColor = fetchedTheme === 'cleaning' ? 'Desert Rose' : 'crimson-jet';
          localStorage.setItem('theme', defaultSubColor);
          if (fetchedTheme === 'cleaning') {
            localStorage.setItem('cleaningTheme', defaultSubColor);
            localStorage.setItem('selectedTheme', defaultSubColor);
          }
        }

        console.log('API Theme loaded:', fetchedTheme, 'ThemeSubColor:', fetchedThemeSubColor);

        currentTheme = fetchedTheme;  // Dynamically export the fetched theme
      })
      .catch((error) => {
        console.error('Theme API error:', error);
        // Only fallback if API completely fails - don't set default themeSubColor here
        // Let the theme components use their defaults
        setTheme('multicolor');
        // Don't set themeSubColor on error - let components use their static defaults
      });
    
    // No safety fallback timer - let components handle their own defaults
    // This prevents premature theme switching
  }, []);


  if (!theme) {
    console.log('Theme not loaded yet...');
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #f3f4f6', borderTopColor: '#e11d48', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
          <div style={{ marginTop: 12, color: '#4b5563' }}>Loading...</div>
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  console.log('Current theme:', theme);



  return (


    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <Helmet>
          {/* Load theme-specific CSS via bundled asset URLs */}
          {theme === 'cleaning' && <link rel="stylesheet" href={cleaningCssUrl} />}
          {theme === 'multicolor' && <link rel="stylesheet" href={multicolorCssUrl} />}
        </Helmet>


        <DynamicColorProvider>
          <ThemeProvider>
            <UIThemeProvider projectId={import.meta.env.VITE_PROJECT_ID || undefined} isBuilder={false}>
              <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  {/* Main Theme Routes */}
                  <Route path="/" element={<ThemeIndex />} />
                  <Route path="/about" element={<ThemeAbout />} />
                  <Route path="/services" element={<ThemeServices />} />
                  <Route path="/:countryname/services" element={<ThemeServices />} />
                  <Route path="/:countryname/:statename/services" element={<ThemeServices />} />
                  <Route path="/:countryname/:statename/:cityname/services" element={<ThemeServices />} />
                  <Route path="/:countryname/:statename/:cityname/:localareaname/services" element={<ThemeServices />} />

                  <Route path="/contact" element={<ThemeContact />} />
                  <Route path="/services/:serviceName" element={<ThemeServiceDetail />} />
                  <Route path="/:countryname/services/:serviceName" element={<ThemeServiceDetail />} />
                  <Route path="/:countryname/:statename/services/:serviceName" element={<ThemeServiceDetail />} />
                  <Route path="/:countryname/:statename/:cityname/services/:serviceName" element={<ThemeServiceDetail />} />
                  <Route path="/:countryname/:statename/:cityname/:localareaname/services/:serviceName" element={<ThemeServiceDetail />} />

                  <Route path="/areas" element={<ThemeAreas />} />
                  <Route path="/areas/:slug" element={<ThemeAreaDetail />} />
                  <Route path="/:slug" element={<ThemeCountry />} />
                  <Route path="/country/:countryname" element={<ThemeCountry />} />
                  <Route path="/:countryname" element={<ThemeCountry />} />
                  <Route path="/:countryname/:statename" element={<ThemeCountry />} />
                  <Route path="/:countryname/:statename/:cityname" element={<ThemeCountry />} />
                  <Route path="/:countryname/:statename/:cityname/:localareaname" element={<ThemeCountry />} />
                  <Route path="/states" element={<ThemeState />} />
                  <Route path="/cities" element={<ThemeCity />} />
                  <Route path="/privacy-policy" element={<ThemePrivacyPolicy />} />
                  <Route path="/terms-conditions" element={<ThemeTermsConditions />} />
                  <Route path="/cities/:slug" element={<CityDetail />} />
                  <Route path="/states/:slug" element={<StateDetail />} />
                  {/* Theme-specific Legal Pages */}
                  <Route path="/disclaimer" element={<CleaningDisclaimer />} />
                  <Route path="/color-picker" element={<CleaningColorPicker />} />
                  <Route path="/terms-conditions" element={<CleaningTermsConditions />} />
                  <Route path="/privacy-policy" element={<CleaningPrivacyPolicy />} />

                  {/* General Legal Pages */}
                  <Route path="/terms-conditions" element={<TermsConditions />} />
                  <Route path="/disclaimer" element={<Disclaimer />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                  <Route path="/blog/:slug" element={<MultiBlog />} />
                  <Route path="/blogs" element={<ListBlogs />} />
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>

              {/* Show the colors bar of primary secondary color change in multi color theme */}
              {/* {theme === 'multicolor' && <ThemeToggle />} */}

            </TooltipProvider>
            </UIThemeProvider>
          </ThemeProvider>

        </DynamicColorProvider>
      </HelmetProvider>
    </QueryClientProvider>
  )
};

export default App;
