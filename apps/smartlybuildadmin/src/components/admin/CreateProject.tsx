import React, { useState, KeyboardEvent, useRef, useEffect } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wand2, Loader2, Clock } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Check, ChevronRight, ChevronLeft, ClipboardList, Bot, Upload, Mail, Phone, MapPin, Search, Info, Globe, Map, Building2, Layers, Eye, Users, Palette, FileText, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { httpFile } from "../../config.js";
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { AIServicesReviewDialog } from "./AIServicesReviewDialog";
interface CreateProjectProps {
  setActiveSection?: (section: string) => void; // Optional prop for sidebar navigation
}
export function CreateProject({ setActiveSection }: CreateProjectProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [wantImages, setWantImages] = useState<boolean>(true); // Always default to true (1)
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingLocalAreas, setLoadingLocalAreas] = useState<boolean>(false); // Already boolean, ensure consistency
  const [submitting, setSubmitting] = useState<boolean>(false); // Already boolean, ensure consistency
  const [showAIServicesReview, setShowAIServicesReview] = useState(false);
  const [aiGeneratedServices, setAIGeneratedServices] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [hasGeneratedServices, setHasGeneratedServices] = useState(false);

  // Check if we're in edit mode (from UpdateProject) or new project mode
  const navProjectId = location.state?.projectId;
  const isEditMode = location.state?.isEditMode || false;
  
  // Only use stored projectId if we're in edit mode, otherwise clear it for new projects
  const storedLastId = isEditMode ? localStorage.getItem("lastCreateProjectId") : null;
  const [projectId, setProjectId] = useState(navProjectId || (isEditMode ? storedLastId : null));
  
  // Clear localStorage when creating a new project (not in edit mode)
  useEffect(() => {
    // If no edit mode flag and no projectId in state, this is a new project
    if (!isEditMode && !navProjectId) {
      // Clear any existing projectId from localStorage for new project
      localStorage.removeItem("lastCreateProjectId");
      setProjectId(null);
      // Also reset form fields for new project
      setProjectName("");
      setServiceType("");
      setFocusKeyword("");
      setProjectKeywordsText("");
      setSelectedCategory(null);
      setCategoryInput("");
      setSelectedSubCategories([]);
      setManualSubCategories([]);
      setManualMicroCategories([]);
      setLastSavedProjectName("");
      setLastSavedServiceType("");
    }
  }, [isEditMode, navProjectId]);
  const [focusKeyword, setFocusKeyword] = useState<string>("");
  const [projectKeywordsText, setProjectKeywordsText] = useState<string>("");

  const [generatingFK, setGeneratingFK] = useState(false);
  const [generatingPK, setGeneratingPK] = useState(false);

  const draftKey = projectId || "new";
  const lastSubKey = projectId ? `createProjectLastSubmitted:${projectId}` : null;
  const [loadingLocalAreaGen, setLoadingLocalAreaGen] = useState<{ [city: string]: boolean }>({}); // Per-city generate loading
  // Location selection states
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([]);

  //API HIT OR UNHIT BASED ON BELOW

  const [lastSavedProjectName, setLastSavedProjectName] = useState("");
  const [lastSavedServiceType, setLastSavedServiceType] = useState("");
  const [lastSavedWantImages, setLastSavedWantImages] = useState(true); // Always true (hidden field)
  const [lastSavedCountries, setLastSavedCountries] = useState<Country[]>([]);
  const [lastSavedStates, setLastSavedStates] = useState<{ [country: string]: string[] }>({});
  const [lastSavedCities, setLastSavedCities] = useState<{ [state: string]: string[] }>({});
  const [lastSavedLocalAreas, setLastSavedLocalAreas] = useState<{ [city: string]: { id: string; name: string }[] }>({});
  const [lastSavedServiceOption, setLastSavedServiceOption] = useState<"manual" | "ai" | "">("");
  const [lastSavedServiceNames, setLastSavedServiceNames] = useState("");
  const [lastSavedAboutUsEmail, setLastSavedAboutUsEmail] = useState("");
  const [lastSavedAboutUsPhone, setLastSavedAboutUsPhone] = useState("");
  const [lastSavedAboutUsLocation, setLastSavedAboutUsLocation] = useState("");


  const [fetchedCountries, setFetchedCountries] = useState(false);
  const [fetchedStates, setFetchedStates] = useState(false);
  const [fetchedCities, setFetchedCities] = useState(false);
  const [fetchedLocalAreas, setFetchedLocalAreas] = useState(false);




  // Theme states
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [themeSecondaryColor, setThemeSecondaryColor] = useState<string>("#000000");
  const [lastSavedSelectedTheme, setLastSavedSelectedTheme] = useState<string>("");
  const [lastSavedThemeSecondaryColor, setLastSavedThemeSecondaryColor] = useState<string>("");

  // Color states
  // at the top of CreateProject
  const [subcolor, setSubcolor] = useState<string>("");

  const [primaryColor, setPrimaryColor] = useState<string>("#000000"); // Default solid color
  const [secondaryColor, setSecondaryColor] = useState<string>("#000000");
  const [accentColor, setAccentColor] = useState<string>("#000000");
  const [buttonColor, setButtonColor] = useState<string>("#000000");
  const [isPrimaryGradient, setIsPrimaryGradient] = useState<boolean>(false);
  const [isSecondaryGradient, setIsSecondaryGradient] = useState<boolean>(false);
  const [isAccentGradient, setIsAccentGradient] = useState<boolean>(false);
  const [isButtonGradient, setIsButtonGradient] = useState<boolean>(false);
  const [primaryGradient, setPrimaryGradient] = useState<{ color1: string; color2: string; direction: string }>({
    color1: "#000000",
    color2: "#FFFFFF",
    direction: "to right",
  });
  const [secondaryGradient, setSecondaryGradient] = useState<{ color1: string; color2: string; direction: string }>({
    color1: "#000000",
    color2: "#FFFFFF",
    direction: "to right",
  });
  const [accentGradient, setAccentGradient] = useState<{ color1: string; color2: string; direction: string }>({
    color1: "#000000",
    color2: "#FFFFFF",
    direction: "to right",
  });
  const [buttonGradient, setButtonGradient] = useState<{ color1: string; color2: string; direction: string }>({
    color1: "#000000",
    color2: "#FFFFFF",
    direction: "to right",
  });
  const [lastSavedPrimaryColor, setLastSavedPrimaryColor] = useState<string>("");
  const [lastSavedSecondaryColor, setLastSavedSecondaryColor] = useState<string>("");
  const [lastSavedAccentColor, setLastSavedAccentColor] = useState<string>("");
  const [lastSavedButtonColor, setLastSavedButtonColor] = useState<string>("");
  const [lastSavedIsPrimaryGradient, setLastSavedIsPrimaryGradient] = useState<boolean>(false);
  const [lastSavedIsSecondaryGradient, setLastSavedIsSecondaryGradient] = useState<boolean>(false);
  const [lastSavedIsAccentGradient, setLastSavedIsAccentGradient] = useState<boolean>(false);
  const [lastSavedIsButtonGradient, setLastSavedIsButtonGradient] = useState<boolean>(false);
  const [lastSavedPrimaryGradient, setLastSavedPrimaryGradient] = useState<{
    color1: string;
    color2: string;
    direction: string;
  }>({ color1: "", color2: "", direction: "" });
  const [lastSavedSecondaryGradient, setLastSavedSecondaryGradient] = useState<{
    color1: string;
    color2: string;
    direction: string;
  }>({ color1: "", color2: "", direction: "" });
  const [lastSavedAccentGradient, setLastSavedAccentGradient] = useState<{
    color1: string;
    color2: string;
    direction: string;
  }>({ color1: "", color2: "", direction: "" });
  const [lastSavedButtonGradient, setLastSavedButtonGradient] = useState<{
    color1: string;
    color2: string;
    direction: string;
  }>({ color1: "", color2: "", direction: "" });


  // With these:
  interface Country {
    countryId?: string; // Optional for manual countries
    name: string;
    status: number; // 0 or 1 to indicate "Create page" checkbox
  }

  interface State {
    id?: string; // Optional for API-fetched states
    name: string; // The display name of the state
    country_id?: string; // Optional, used for API-fetched states
    manual?: boolean; // Optional, to mark manual states
    status: number; // 0 or 1 to indicate "Create page" checkbox
  }

  interface City {
    id?: string; // Optional for API-fetched cities
    name: string;
    state_id?: string; // Optional, links to state
    manual?: boolean; // Marks manual cities
    status: number; // 0 or 1 for "Create page"
  }

  const [countrySearchInput, setCountrySearchInput] = useState("");
  const [currentCountryPage, setCurrentCountryPage] = useState(1);
  const countriesPerPage = 1000;

  // Page creation for countries

  // States management

  const [selectedStates, setSelectedStates] = useState<{ [country: string]: string[] }>({});
  const [stateInput, setStateInput] = useState<{ [country: string]: string }>({});
  const [statesByCountry, setStatesByCountry] = useState({});

  const [loadingStates, setLoadingStates] = useState<boolean>(false); // To show loading state


  // Cities management
  const [citiesByState, setCitiesByState] = useState<{ [state: string]: City[] }>({});
  const [selectedCities, setSelectedCities] = useState<{ [state: string]: string[] }>({});
  const [cityInput, setCityInput] = useState<{ [state: string]: string }>({});

  // Local areas management
  const [localAreas, setLocalAreas] = useState<{ [city: string]: { id: string; name: string }[] }>({});
  const [localAreaInput, setLocalAreaInput] = useState<{ [city: string]: string }>({});
  const [localAreaCount, setLocalAreaCount] = useState<number>(1); // Default count for generating local areas

  // Service states

  const [serviceOption, setServiceOption] = useState<"manual" | "ai" | "">("");
  const [serviceNames, setServiceNames] = useState("");

  // About Us states
  const [aboutUsEmail, setAboutUsEmail] = useState("");
  const [aboutUsPhone, setAboutUsPhone] = useState("");
  const [aboutUsLocation, setAboutUsLocation] = useState("");

  // Final success state
  const [showFinalSuccess, setShowFinalSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [redirectCounter, setRedirectCounter] = useState(7);


  // Types for themes coming from API
  type ApiTheme = {
    _id: string;
    themeName: string;
    supportThemeSubColor: boolean;
    supportSecondaryColor: boolean;
    themeDemoUrl: string;
    themeImageUrl: string;
    isActive: boolean;
  };

  // UI-ready theme shape
  type UiTheme = {
    id: string;
    name: string;
    preview: string;
    demoUrl: string;
    supportsSecondaryColor: boolean;
    supportThemeSubColor: boolean;
  };

  const [themesFromApi, setThemesFromApi] = useState<UiTheme[]>([]);
  const [themesLoading, setThemesLoading] = useState<boolean>(false);


  // Page creation option - removed from here, now managed per country


  // Add this function to clear local storage except specific keys
  const clearLocalStorageExcept = () => {
    const keysToKeep = ['adminProfile', 'Role', 'token'];
    Object.keys(localStorage).forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  };



  // Step 1: Categories state
  const [categories, setCategories] = useState<{ _id: string, name: string }[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<{ _id: string, name: string }[]>([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<{ _id: string, name: string } | null>(null);

  const [subCategories, setSubCategories] = useState<{ _id: string, name: string }[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<{ _id: string, name: string }[]>([]);
  const [subCategoryInput, setSubCategoryInput] = useState("");
  const [selectedSubCategories, setSelectedSubCategories] = useState<Array<string>>([]);
  const [manualSubCategories, setManualSubCategories] = useState<Array<string>>([]);

  const [microCategoryInput, setMicroCategoryInput] = useState("");
  const [manualMicroCategories, setManualMicroCategories] = useState<Array<string>>([]);

  // Fetch all categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await httpFile.get("/fetchCategories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(res,"data of res" )
        if (res.status === 200) {
          setCategories(res.data.data);
          setFilteredCategories(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!selectedCategory || !selectedCategory._id) return;
      try {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("categoryId", selectedCategory._id);
        const res = await httpFile.post("/fetchSubCategories", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 200) {
          setSubCategories(res.data.data);
          setFilteredSubCategories(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch subcategories", err);
      }
    };
    fetchSubCategories();
    setSelectedSubCategories([]); // Reset selected subcategories when category changes
    setManualSubCategories([]);
    setManualMicroCategories([]);
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory) setServiceType(selectedCategory.name);
  }, [selectedCategory]);

  // Load subcategories and microcategories from project data after category is selected
  useEffect(() => {
    if (projectId && selectedCategory && subCategories.length > 0) {
      const loadProjectSubCategories = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await httpFile.post(
            "/my_site",
            { projectId, pageType: "home" },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.status === 200) {
            const projectData = res.data.projectInfo || {};
            
            // Load subcategories
            if (projectData.subCategories && Array.isArray(projectData.subCategories)) {
              const subCatNames = projectData.subCategories.map((sc: any) => sc.name || sc);
              // Separate into selected (from API) and manual
              const apiSubCatNames = subCatNames.filter((name: string) => 
                subCategories.some(sc => sc.name === name)
              );
              const manualSubCatNames = subCatNames.filter((name: string) => 
                !subCategories.some(sc => sc.name === name)
              );
              
              setSelectedSubCategories(apiSubCatNames);
              setManualSubCategories(manualSubCatNames);
            }
            
            // Load microcategories
            if (projectData.microCategories && Array.isArray(projectData.microCategories)) {
              const microCatNames = projectData.microCategories.map((mc: any) => mc.name || mc);
              setManualMicroCategories(microCatNames);
            }
          }
        } catch (error) {
          console.error("LoadProjectSubCategories Error:", error);
        }
      };

      // Only load once when subcategories are available
      const hasSubCategories = selectedSubCategories.length === 0 && manualSubCategories.length === 0;
      if (hasSubCategories) {
        loadProjectSubCategories();
      }
    }
  }, [projectId, selectedCategory, subCategories.length]); // Run when category is selected and subcategories are loaded

  const handleSubCategorySelection = (subCategoryName: string) => {
    setSelectedSubCategories(prev => {
      if (prev.includes(subCategoryName)) {
        return prev.filter(name => name !== subCategoryName);
      } else {
        return [...prev, subCategoryName];
      }
    });
  };

  const handleManualSubCategory = () => {
    if (subCategoryInput.trim()) {
      setManualSubCategories(prev => {
        if (!prev.includes(subCategoryInput.trim())) {
          return [...prev, subCategoryInput.trim()];
        }
        return prev;
      });
      setSubCategoryInput(""); // Clear input after adding
    }
  };

  const handleManualMicroCategory = () => {
    if (microCategoryInput.trim()) {
      setManualMicroCategories(prev => {
        if (!prev.includes(microCategoryInput.trim())) {
          return [...prev, microCategoryInput.trim()];
        }
        return prev;
      });
      setMicroCategoryInput(""); // Clear input after adding
    }
  };





  useEffect(() => {
    const fetchActiveThemes = async () => {
      try {
        setThemesLoading(true);
        // If your base path already includes /admin/v1, keep '/list_themes'
        // Otherwise use: await httpFile.get('/admin/v1/list_themes')
        const res = await httpFile.get('/list_themes');

        // Handle various shapes your API might return
        const raw: ApiTheme[] =
          (Array.isArray(res.data) ? res.data :
            Array.isArray(res.data?.themes) ? res.data.themes :
              Array.isArray(res.data?.data) ? res.data.data : []) as ApiTheme[];

        // Only active themes
        const active = raw.filter(t => t.isActive);

        // Map to UI shape
        const mapped: UiTheme[] = active.map(t => ({
          id: t._id,
          name: t.themeName,
          preview: t.themeImageUrl,
          demoUrl: t.themeDemoUrl,
          supportsSecondaryColor: t.supportSecondaryColor,
          supportThemeSubColor: t.supportThemeSubColor,
        }));

        setThemesFromApi(mapped);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.response?.data?.message || "Failed to load themes",
          variant: "destructive",
        });
        setThemesFromApi([]);
      } finally {
        setThemesLoading(false);
      }
    };

    if (step === 9) {
      fetchActiveThemes();
    }
  }, [step]);


  useEffect(() => {
    // If there's no projectId (new project), reset all location-related states
    if (!projectId) {
      resetForm();
      // Clear local storage keys to prevent data leakage
      localStorage.removeItem(`createProjectDraft:new`);
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("createProjectLastSubmitted:")) {
          localStorage.removeItem(key);
        }
      });
    }
  }, []); // Empty dependency array to run only on mount

  const fetchStatesForCountry = async (countryId: string) => {
    setLoading(true); // Changed from true to 1
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.get("/fetch_states", {
        headers: { Authorization: `Bearer ${token}` },
        params: { country_ids: countryId },
      });

      console.log("FetchStates Response:", {
        countryId,
        status: res.status,
        data: res.data,
      });

      const states: State[] = res.data.data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        country_id: countryId,
        status: item.status !== undefined ? item.status : 0,
      })) || [];
      setStatesByCountry((prev) => ({
        ...prev,
        [countryId]: states,
      }));
    } catch (err: any) {
      console.error("FetchStates Error:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to fetch states.",
        variant: "destructive",
      });
    } finally {
      setLoading(false); // Changed from false to 0
    }
  };



  const cleanAIString = (str: any) =>
    typeof str === "string"
      ? str
        .replace(/^"+|"+$/g, "")
        .replace(/\\"/g, '"')
        .replace(/\\n/g, " ")
        .replace(/\n/g, " ")
        .trim()
      : "";





  const generateFocusKeyword = async () => {
    if (!projectName || !serviceType) {
      toast({
        title: "Missing info",
        description: "Please enter Service Type and Project Name first.",
        variant: "destructive",
      });
      return;
    }
    setGeneratingFK(true);
    try {

      const categoryPayload = selectedCategory?.name || categoryInput?.trim();
      // Combine selected subcategories from dropdown and manual entries
      const subCategoriesPayload = [
        ...selectedSubCategories,
        ...manualSubCategories
      ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

      const microCategoriesPayload = [...manualMicroCategories];

      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("serviceType", serviceType);
      form.append("projectName", projectName);
      form.append("categories", JSON.stringify([categoryPayload]));
      form.append("subCategories", JSON.stringify(subCategoriesPayload));
      form.append("microCategories", JSON.stringify(microCategoriesPayload));


      const res = await httpFile.post("/getFocusedKeyword", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const kw = cleanAIString(res?.data?.data || "");
      setFocusKeyword(kw);
      toast({ title: "Generated", description: `Focus keyword: ${kw}` });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to generate focus keyword.",
        variant: "destructive",
      });
    } finally {
      setGeneratingFK(false);
    }
  };

  const generateProjectKeywords = async () => {
    if (!projectName || !serviceType) {
      toast({
        title: "Missing info",
        description: "Please enter Service Type and Project Name first.",
        variant: "destructive",
      });
      return;
    }
    setGeneratingPK(true);
    try {

      const categoryPayload = selectedCategory?.name || categoryInput?.trim();
      // Combine selected subcategories from dropdown and manual entries
      const subCategoriesPayload = [
        ...selectedSubCategories,
        ...manualSubCategories
      ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

      const microCategoriesPayload = [...manualMicroCategories];

      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("serviceType", serviceType);
      form.append("projectName", projectName);
      form.append("categories", JSON.stringify([categoryPayload]));
      form.append("subCategories", JSON.stringify(subCategoriesPayload));
      form.append("microCategories", JSON.stringify(microCategoriesPayload));

      if (focusKeyword) form.append("focusKeyword", focusKeyword);

      const res = await httpFile.post("/getProjectKeywords", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const arr = Array.isArray(res?.data?.data) ? res.data.data : [];
      const joined = arr
        .map((s: any) => cleanAIString(String(s || "")))
        .filter(Boolean)
        .join(", ");
      setProjectKeywordsText(joined);

      toast({ title: "Generated", description: "Project keywords updated." });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to generate project keywords.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPK(false);
    }
  };




  const fetchCitiesForState = async (stateId: string, stateName: string, search: string = "") => {
    setLoading(true); // Changed from true to 1
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.get("/fetch_cities", {
        headers: { Authorization: `Bearer ${token}` },
        params: { state_ids: stateId, search },
      });

      console.log("FetchCities Response:", {
        stateId,
        stateName,
        status: res.status,
        data: res.data,
      });

      const cities: City[] = res.data.data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        state_id: stateId,
        manual: false,
        status: item.status !== undefined ? item.status : 0,
      })) || [];

      // Deduplicate cities based on name
      setCitiesByState((prev) => {
        const existingCities = prev[stateName] || [];
        const newCities = cities.filter(
          (city) => !existingCities.some((c: City) => c.name === city.name)
        );
        return {
          ...prev,
          [stateName]: [...existingCities, ...newCities],
        };
      });
    } catch (err: any) {
      console.error("FetchCities Error:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to fetch cities.",
        variant: "destructive",
      });
    } finally {
      setLoading(false); // Changed from false to 0
    }
  };


  const fetchProjectDetails = async () => {
    setLoadingLocalAreas(true);
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.post(
        "/my_site",
        { projectId, pageType: "home" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) {
        toast({
          title: "Error",
          description: "Invalid token",
          variant: "destructive",
        });
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (res.status === 200) {
        const projectData = res.data.projectInfo || {};
        const cityArr = projectData.locations?.city || [];
        const localsArr = projectData.locations?.localArea || [];

        // Initialize citiesByState and selectedCities
        const newCitiesByState: { [state: string]: City[] } = {};
        const newSelectedCities: { [state: string]: string[] } = {};

        cityArr.forEach((city: any) => {
          const country = selectedCountries.find((c) =>
            statesByCountry[c.countryId]?.some((s: State) => s.id === city.stateId)
          );
          if (!country || !country.countryId) return;

          const state = statesByCountry[country.countryId]?.find((s: State) => s.id === city.stateId);
          const stateName = state?.name || "Unknown";

          if (!newCitiesByState[stateName]) {
            newCitiesByState[stateName] = [];
            newSelectedCities[stateName] = [];
          }
          const cityObj: City = {
            id: city.cityId,
            name: city.name,
            state_id: city.stateId,
            manual: false,
            status: city.status || 0,
          };
          newCitiesByState[stateName].push(cityObj);
          if (!newSelectedCities[stateName].includes(city.name)) {
            newSelectedCities[stateName].push(city.name);
          }
        });

        setCitiesByState((prev) => ({ ...prev, ...newCitiesByState }));
        setSelectedCities((prev) => {
          const updated = { ...prev };
          Object.entries(newSelectedCities).forEach(([stateName, cities]) => {
            updated[stateName] = [
              ...(updated[stateName] || []),
              ...cities.filter((city) => !(updated[stateName] || []).includes(city)),
            ];
          });
          return updated;
        });

        // Initialize localAreas and localAreaInput
        const initialInputs: { [city: string]: string } = {};
        const apiLocalAreas: { [city: string]: { id: string; name: string }[] } = {};

        if (cityArr.length > 0) {
          cityArr.forEach((city: any) => {
            const cityName = city.name;
            initialInputs[cityName] = "";
            apiLocalAreas[cityName] = [];
          });
        } else {
          initialInputs["all"] = "";
          apiLocalAreas["all"] = [];
        }

        localsArr.forEach((local: any) => {
          const cityName = cityArr.find((c: any) => c.cityId === local.cityId)?.name || "all";
          if (!(cityName in apiLocalAreas)) {
            apiLocalAreas[cityName] = [];
            initialInputs[cityName] = "";
          }
          apiLocalAreas[cityName].push({
            id: local._id || Date.now().toString(),
            name: local.name,
          });
        });

        // Merge API local areas with existing localAreas
        setLocalAreas((prev) => {
          const merged = { ...prev };
          Object.entries(apiLocalAreas).forEach(([cityName, areas]) => {
            if (!merged[cityName]) {
              merged[cityName] = [];
            }
            areas.forEach((area) => {
              if (!merged[cityName].some((a) => a.name === area.name)) {
                merged[cityName].push(area);
              }
            });
          });
          return merged;
        });
        setLocalAreaInput(initialInputs);
        setLastSavedLocalAreas(apiLocalAreas);
      }
    } catch (error) {
      console.error("FetchProjectDetails Error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive",
      });
      setLocalAreaInput({ all: "" });
      setLocalAreas((prev) => ({ ...prev, all: [] }));
    } finally {
      setLoadingLocalAreas(false);
    }
  };

  // Generate local areas for a specific city via API
  const generateLocalAreasForCity = async (cityName: string, cityId: string) => {
    if (!cityId) {
      toast({
        title: "Error",
        description: "City ID not available. Please select an API-fetched city.",
        variant: "destructive",
      });
      return;
    }

    setLoadingLocalAreaGen(prev => ({ ...prev, [cityName]: true }));
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("cityId", cityId);
      formData.append("count", localAreaCount.toString()); // Send count to API

      const res = await httpFile.post(
        "/getLocalAreasWithPincodes",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200 && Array.isArray(res.data.data)) {
        const newAreas = res.data.data.map((item: string, index: number) => ({
          id: `${Date.now()}-${index}`,  // Unique ID
          name: item.trim()  // "Area Name (pincode)"
        })).filter(area => area.name.length > 0);  // Filter empty

        // Append to existing areas (avoid duplicates by name)
        setLocalAreas(prev => {
          const existing = prev[cityName] || [];
          const uniqueNew = newAreas.filter(newArea =>
            !existing.some(existingArea => existingArea.name === newArea.name)
          );
          return {
            ...prev,
            [cityName]: [...existing, ...uniqueNew]
          };
        });

        toast({
          title: "Success",
          description: `Generated and added ${newAreas.length} local areas for ${cityName}!`,
        });
      } else {
        toast({
          title: "Error",
          description: res.data?.message || "Failed to generate local areas.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Generate Local Areas Error:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to generate local areas.",
        variant: "destructive",
      });
    } finally {
      setLoadingLocalAreaGen(prev => ({ ...prev, [cityName]: false }));
    }
  };




  const handleCountryClick = (countryId: string) => {
    if (!statesByCountry[countryId]) {
      fetchStatesForCountry(countryId);
    }
  };

  const loadstates = async (countryId: string) => {
    setLoadingStates(true);
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.get("/fetch_states", {
        headers: { Authorization: `Bearer ${token}` },
        params: { country_ids: countryId },
      });

      const states: State[] = res.data.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        country_id: countryId,
        status: item.status !== undefined ? item.status : 0, // Use API status if provided, else 0
      }));
      setStatesByCountry((prev) => ({
        ...prev,
        [countryId]: states,
      }));
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch states.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(false);
    }
  };

  const handleStateKeyDown = (countryName: string, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && stateInput[countryName]?.trim() !== "") {
      const newStateName = stateInput[countryName].trim();
      const country = selectedCountries.find((c) => c.name === countryName);
      if (!country) return; // Safety check
      const countryId = country.countryId;

      if (!countryId) {
        toast({
          title: "Error",
          description: "Country ID is missing. Please ensure countries are saved correctly.",
          variant: "destructive",
        });
        return;
      }

      // Add manual state
      const newState: State = { name: newStateName, manual: true, status: 0, country_id: countryId };
      setStatesByCountry((prev) => ({
        ...prev,
        [countryId]: [...(prev[countryId] || []), newState],
      }));

      // Update selected states
      setSelectedStates((prev) => {
        const updated = {
          ...prev,
          [countryName]: [...(prev[countryName] || []), newStateName],
        };
        setLastSavedStates(updated);
        return updated;
      });

      setStateInput({ ...stateInput, [countryName]: "" });
    }
  };



  const toggleStatePageCreation = (countryName: string, stateName: string) => {
    const country = selectedCountries.find(c => c.name === countryName);
    if (!country || !country.countryId) return; // Safety check

    const countryId = country.countryId;

    // Update the state status to toggle between 1 and 0
    setStatesByCountry((prev) => ({
      ...prev,
      [countryId]: prev[countryId].map((state: State) =>
        state.name === stateName
          ? { ...state, status: state.status === 1 ? 0 : 1 } // Toggle the status for the "Create Page" checkbox
          : state
      ),
    }));
  };



  const toggleCityPageCreation = (stateName: string, cityName: string) => {
    setCitiesByState((prev) => ({
      ...prev,
      [stateName]: prev[stateName].map((city: City) =>
        city.name === cityName
          ? { ...city, status: city.status === 1 ? 0 : 1 }
          : city
      ),
    }));
  };


  useEffect(() => {
    async function fetchCountries() {
      try {
        const token = localStorage.getItem("token");
        const res = await httpFile.get("/fetch_countries", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Map API response to Country interface
        const countryList = res.data.data.map((item: any) => ({
          countryId: item.id,
          name: item.name,
          status: 0, // Initialize status as 0 (checkbox unchecked)
        }));
        console.log(countryList, "list of countries");
        setCountries(countryList);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch countries.",
          variant: "destructive",
        });
      }
    }
    fetchCountries();
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(`createProjectDraft:${draftKey}`);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        if (d.serviceType) setServiceType(d.serviceType);
        if (d.projectName) setProjectName(d.projectName);
        // wantImages always defaults to true (hidden field)
        setWantImages(true);
      } catch { }
    }
  }, [draftKey]);

  useEffect(() => {
    localStorage.setItem(
      `createProjectDraft:${draftKey}`,
      JSON.stringify({ serviceType, projectName, wantImages, projectId })
    );
  }, [serviceType, projectName, wantImages, projectId, draftKey]);

  useEffect(() => {
    console.log("Project Name Updated: ", projectName);
  }, [projectName]);

  useEffect(() => {
    console.log("Service Type Updated: ", serviceType);
  }, [serviceType]);

  // Redirect countdown effect
  // Inside CreateProject component

  // Define handleRedirect function to match sidebar's logic
  const handleRedirect = () => {
    if (setActiveSection) {
      setActiveSection("project-list"); // Update sidebar state
    }
    navigate("/admin/project-list"); // Update URL
  };

  // Update useEffect for auto-redirect
  useEffect(() => {
    if (showFinalSuccess && redirectCounter > 0) {
      const timer = setTimeout(() => {
        setRedirectCounter(redirectCounter - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showFinalSuccess && redirectCounter === 0) {
      handleRedirect(); // Trigger redirect
    }
  }, [showFinalSuccess, redirectCounter, navigate, setActiveSection]);


  // Initial load: Fetch project data when component mounts with projectId (for edit mode)
  useEffect(() => {
    if (projectId && step === 1 && categories.length > 0) {
      // Only load if we don't have data yet or if lastSaved values are empty
      const needsInitialLoad = !lastSavedProjectName || !lastSavedServiceType;
      
      if (needsInitialLoad) {
        const fetchInitialProjectData = async () => {
          try {
            const token = localStorage.getItem("token");
            const res = await httpFile.post(
              "/my_site",
              { projectId, pageType: "home" },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.status === 200) {
              const projectData = res.data.projectInfo || {};
              // Load Step 1 data immediately
              if (projectData.projectName) {
                setProjectName(projectData.projectName);
                setLastSavedProjectName(projectData.projectName);
              }
              if (projectData.serviceType) {
                setServiceType(projectData.serviceType);
                setLastSavedServiceType(projectData.serviceType);
              }
              setWantImages(true);
              setLastSavedWantImages(true);
              
              // Load focus keyword and project keywords if available
              if (projectData.focusKeyword) {
                setFocusKeyword(projectData.focusKeyword);
              }
              if (projectData.projectKeywordsText) {
                setProjectKeywordsText(projectData.projectKeywordsText);
              }
              
              // Load categories, subcategories, and microcategories
              if (projectData.categories && Array.isArray(projectData.categories) && projectData.categories.length > 0) {
                const firstCategory = projectData.categories[0];
                const categoryName = firstCategory.name || firstCategory;
                // Try to find category in the categories list
                const foundCategory = categories.find(c => c.name === categoryName || c._id === firstCategory._id);
                if (foundCategory) {
                  setSelectedCategory(foundCategory);
                } else if (categoryName) {
                  // If not found, set as manual category
                  setCategoryInput(categoryName);
                  setSelectedCategory({ _id: '', name: categoryName });
                }
              }
              
              // Subcategories and microcategories will be loaded after category is set
              // They will be loaded in a separate effect when selectedCategory changes
            }
          } catch (error) {
            console.error("FetchInitialProjectData Error:", error);
          }
        };

        fetchInitialProjectData();
      }
    }
  }, [projectId, step, categories]); // Run when projectId is set, we're on step 1, and categories are loaded

  // Step 1: Reload Project Details
  useEffect(() => {
    if (step === 1 && projectId) {
      // Check if we need to load data (either data changed or not loaded yet)
      const hasProjectDataChanged =
        projectName !== lastSavedProjectName ||
        serviceType !== lastSavedServiceType ||
        wantImages !== lastSavedWantImages;
      const needsLoad = !lastSavedProjectName || !lastSavedServiceType || hasProjectDataChanged;
      
      if (!needsLoad) return;

      const fetchProjectDetailsForStep1 = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await httpFile.post(
            "/my_site",
            { projectId, pageType: "home" },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.status === 200) {
            const projectData = res.data.projectInfo || {};
            setProjectName(projectData.projectName || "");
            setServiceType(projectData.serviceType || "");
            // wantImages always defaults to true (hidden field, always enabled)
            setWantImages(true);
            setLastSavedProjectName(projectData.projectName || "");
            setLastSavedServiceType(projectData.serviceType || "");
            setLastSavedWantImages(true); // Always true
            
            // Also load focus keyword and project keywords
            if (projectData.focusKeyword) {
              setFocusKeyword(projectData.focusKeyword);
            }
            if (projectData.projectKeywordsText) {
              setProjectKeywordsText(projectData.projectKeywordsText);
            }
            
            // Load categories, subcategories, and microcategories
            if (projectData.categories && Array.isArray(projectData.categories) && projectData.categories.length > 0) {
              const firstCategory = projectData.categories[0];
              const categoryName = firstCategory.name || firstCategory;
              // Try to find category in the categories list
              const foundCategory = categories.find(c => c.name === categoryName || c._id === firstCategory._id);
              if (foundCategory) {
                setSelectedCategory(foundCategory);
              } else if (categoryName) {
                // If not found, set as manual category
                setCategoryInput(categoryName);
                setSelectedCategory({ _id: '', name: categoryName });
              }
            }
            
            // Subcategories and microcategories will be loaded in a separate effect
            // after the category is selected and subcategories are fetched from API
          }
        } catch (error) {
          console.error("FetchProjectDetailsForStep1 Error:", error);
          toast({
            title: "Error",
            description: "Failed to fetch project details for Step 1",
            variant: "destructive",
          });
        }
      };

      fetchProjectDetailsForStep1();
    }
  }, [step, projectId, projectName, serviceType, wantImages]);

  // Step 2: Reload Countries
  useEffect(() => {
    if (step === 2 && projectId && !fetchedCountries) {
      const fetchCountriesForStep2 = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await httpFile.post(
            "/my_site",
            { projectId, pageType: "home" },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.status === 200) {
            const projectData = res.data.projectInfo || {};
            const countryArr = projectData.locations?.country || [];
            const apiCountries = countryArr.map((item: any) => ({
              countryId: item.countryId,
              name: item.name,
              status: item.status || 0,
            }));

            // Merge API countries with current selections, avoiding duplicates
            setSelectedCountries((prev) => {
              const merged = [...prev];
              apiCountries.forEach((apiCountry: Country) => {
                if (!merged.some((c) => c.name === apiCountry.name)) {
                  merged.push(apiCountry);
                }
              });
              return merged;
            });
            setLastSavedCountries(apiCountries);
            setFetchedCountries(true);
          }
        } catch (error) {
          console.error("FetchCountriesForStep2 Error:", error);
          toast({
            title: "Error",
            description: "Failed to fetch countries for Step 2",
            variant: "destructive",
          });
        }
      };

      fetchCountriesForStep2();
    } else if (step !== 2) {
      setFetchedCountries(false); // Reset when leaving Step 2
    }
  }, [step, projectId]);
  // Step 3: Reload States




  useEffect(() => {
    if (step === 3 && projectId && !fetchedStates) {
      const fetchStatesForStep3 = async () => {
        setLoadingStates(true);
        try {
          const token = localStorage.getItem("token");
          const res = await httpFile.post(
            "/my_site",
            { projectId, pageType: "home" },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.status === 200) {
            const projectData = res.data.projectInfo || {};
            const stateArr = projectData.locations?.state || [];

            const newSelectedStates: { [country: string]: string[] } = {};

            stateArr.forEach((state: any) => {
              const country = selectedCountries.find((c) => c.countryId === state.countryId);
              if (!country || !country.countryId) return;

              const countryName = country.name;
              if (!newSelectedStates[countryName]) {
                newSelectedStates[countryName] = [];
              }
              newSelectedStates[countryName].push(state.name);
            });

            // Merge with existing selections
            setSelectedStates((prev) => {
              const merged = { ...prev };
              Object.entries(newSelectedStates).forEach(([countryName, states]) => {
                if (!merged[countryName]) {
                  merged[countryName] = [];
                }
                states.forEach((stateName) => {
                  if (!merged[countryName].includes(stateName)) {
                    merged[countryName].push(stateName);
                  }
                });
              });
              return merged;
            });
            setLastSavedStates(newSelectedStates);
            setFetchedStates(true);

            for (const country of selectedCountries) {
              if (country.countryId && !statesByCountry[country.countryId]) {
                await fetchStatesForCountry(country.countryId);
              }
            }
          }
        } catch (error) {
          console.error("FetchStatesForStep3 Error:", error);
          toast({
            title: "Error",
            description: "Failed to fetch states for Step 3",
            variant: "destructive",
          });
        } finally {
          setLoadingStates(false);
        }
      };

      fetchStatesForStep3();
    } else if (step === 3 && !projectId) {
      setSelectedStates({});
      selectedCountries.forEach((country) => {
        if (country.countryId && !statesByCountry[country.countryId]) {
          fetchStatesForCountry(country.countryId);
        }
      });
    } else if (step !== 3) {
      setFetchedStates(false); // Reset when leaving Step 3
    }
  }, [step, projectId, selectedCountries, statesByCountry]);




  useEffect(() => {
    if (step === 4 && projectId && !fetchedCities) {
      const fetchCitiesForStep4 = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await httpFile.post(
            "/my_site",
            { projectId, pageType: "home" },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.status === 200) {
            const projectData = res.data.projectInfo || {};
            const cityArr = projectData.locations?.city || [];

            const newSelectedCities: { [state: string]: string[] } = {};

            cityArr.forEach((city: any) => {
              const country = selectedCountries.find((c) =>
                statesByCountry[c.countryId]?.some((s: State) => s.id === city.stateId)
              );
              if (!country || !country.countryId) return;

              const state = statesByCountry[country.countryId]?.find((s: State) => s.id === city.stateId);
              const stateName = state?.name || "Unknown";

              if (!newSelectedCities[stateName]) {
                newSelectedCities[stateName] = [];
              }
              if (!newSelectedCities[stateName].includes(city.name)) {
                newSelectedCities[stateName].push(city.name);
              }
            });

            // Merge with existing selections
            setSelectedCities((prev) => {
              const merged = { ...prev };
              Object.entries(newSelectedCities).forEach(([stateName, cities]) => {
                if (!merged[stateName]) {
                  merged[stateName] = [];
                }
                cities.forEach((cityName) => {
                  if (!merged[stateName].includes(cityName)) {
                    merged[stateName].push(cityName);
                  }
                });
              });
              return merged;
            });
            setLastSavedCities(newSelectedCities);
            setFetchedCities(true);
          }
        } catch (error) {
          console.error("FetchCitiesForStep4 Error:", error);
          toast({
            title: "Error",
            description: "Failed to fetch cities for Step 4",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchCitiesForStep4();
    } else if (step === 4 && !projectId) {
      setSelectedCities({});
    } else if (step !== 4) {
      setFetchedCities(false); // Reset when leaving Step 4
    }
  }, [step, projectId, selectedCountries, statesByCountry]);





  useEffect(() => {
    if (step === 5 && projectId && !fetchedLocalAreas) {
      fetchProjectDetails();
      setFetchedLocalAreas(true);
    } else if (step !== 5) {
      setFetchedLocalAreas(false); // Reset when leaving Step 5
    }
  }, [step, projectId]);




  // Add this function to handle the AI services count popup
  const handleAiServiceCount = async () => {
    const result = await Swal.fire({
      title: "How many AI services do you want to generate?",
      input: "number",
      inputLabel: "Enter the number of services",
      inputPlaceholder: "Enter a number",
      inputAttributes: {
        min: "1",
        step: "1",
      },
      showCancelButton: true,
      confirmButtonText: "Generate",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value || isNaN(Number(value)) || Number(value) < 1) {
          return "Please enter a valid number of services (minimum 1)";
        }
        return null;
      },
      customClass: {
        popup: 'swal-theme-popup',
        title: 'swal-theme-title',
        input: 'swal-theme-input',
        confirmButton: 'swal-theme-confirm',
        cancelButton: 'swal-theme-cancel',
      },
      buttonsStyling: false,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
    });

    return result;
  };





  // Filter countries based on search term
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearchInput.toLowerCase())
  );

  // Calculate pagination for countries
  const indexOfLastCountry = currentCountryPage * countriesPerPage;
  const indexOfFirstCountry = indexOfLastCountry - countriesPerPage;
  const currentCountries = filteredCountries.slice(indexOfFirstCountry, indexOfLastCountry);
  const totalCountryPages = Math.ceil(filteredCountries.length / countriesPerPage);

  const handleNextStep = async () => {


    if (step === 1) {
      const hasProjectDataChanged =
        projectName !== lastSavedProjectName ||
        serviceType !== lastSavedServiceType ||
        wantImages !== lastSavedWantImages;

      if (!projectName || !serviceType) return;

      if (!hasProjectDataChanged && projectId) {
        setStep(step + 1);
        return; // Reuse existing projectId, no API call needed
      }

      const admin = JSON.parse(localStorage.getItem("adminProfile") || "{}");





      // Derive serviceType from selected category
      const serviceTypeValue = selectedCategory?.name || categoryInput?.trim() || "DefaultServiceType";

      const categoryPayload = selectedCategory?.name || categoryInput?.trim();
      // Combine selected subcategories from dropdown and manual entries
      const subCategoriesPayload = [
        ...selectedSubCategories,
        ...manualSubCategories
      ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

      const microCategoriesPayload = [...manualMicroCategories];

      if (!categoryPayload) {
        toast({
          title: "Error",
          description: "Please select or enter a category.",
          variant: "destructive",
        });
        return;
      }


      const payload = {
        userId: admin._id,
        serviceType,
        projectName,
        projectKeywordsText,
        focusKeyword,
        categories: JSON.stringify([categoryPayload]),
        subCategories: JSON.stringify(subCategoriesPayload),
        microCategories: JSON.stringify(microCategoriesPayload),
        wantImages: wantImages ? 1 : 0,
      };

      console.log("Project payload: ", payload);
      setLoading(true);

      try {
        const token = localStorage.getItem("token");
        const res = await httpFile.post("/createProject", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          toast({
            title: "Error",
            description: "invalid token",
            variant: "destructive",
          });
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (res.status === 201) {
          const newId = res.data.data._id;


          toast({
            title: "Success",
            description: "Project created successfully!",
          });

          localStorage.setItem("lastCreateProjectId", newId);
          setProjectId(newId);
          localStorage.setItem(
            `createProjectLastSubmitted:${newId}`,
            JSON.stringify({ serviceType, projectName, wantImages })
          );
          localStorage.setItem(
            `createProjectDraft:${newId}`,
            JSON.stringify({ serviceType, projectName, wantImages, projectId: newId })
          );
          localStorage.removeItem("createProjectDraft:new");

          setLastSavedProjectName(projectName);
          setLastSavedServiceType(serviceType);
          setLastSavedWantImages(true); // Always true (hidden field, always enabled)

          setLoading(false);
          setStep(step + 1);
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.response?.data?.message || "An error occurred!",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      const hasCountriesChanged = JSON.stringify(selectedCountries) !== JSON.stringify(lastSavedCountries);
      // if (!hasCountriesChanged) {
      //   setStep(step + 1);
      //   return;
      // }

      const token = localStorage.getItem("token");
      const countriesPayload = selectedCountries.filter(item => item.countryId);
      const manualPayload = selectedCountries.filter(item => !item.countryId);

      try {
        const res = await httpFile.post(
          "/updateCountryInProject",
          { projectId, countries: countriesPayload, manualCountries: manualPayload },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );

        console.log("UpdateCountryInProject Response:", {
          status: res.status,
          data: res.data,
        });

        if ([200, 201, 204].includes(res.status)) {
          let updatedCountries = selectedCountries;
          if (res.data?.data && Array.isArray(res.data.data)) {
            updatedCountries = res.data.data.map((item: any) => ({
              countryId: item.id || item._id || item.countryId,
              name: item.name,
              status: selectedCountries.find(c => c.name === item.name)?.status || 0,
            }));
          }
          setSelectedCountries(updatedCountries);
          setLastSavedCountries(updatedCountries);
          setStep(step + 1);
          toast({
            title: "Success",
            description: "Countries updated successfully!",
          });
        } else {
          throw new Error(`Unexpected status code: ${res.status}`);
        }
      } catch (err: any) {
        console.error("UpdateCountryInProject Error:", err);
        toast({
          title: "Error",
          description: err.response?.data?.message || `Failed to update countries (Status: ${err.response?.status || "Unknown"})`,
          variant: "destructive",
        });
      }
    } else if (step === 3) {
      const hasStatesChanged = JSON.stringify(selectedStates) !== JSON.stringify(lastSavedStates);
      // if (!hasStatesChanged) {
      //   setStep(step + 1);
      //   return;
      // }

      const token = localStorage.getItem("token");
      const statesPayload: { countryId: string; stateId?: string; name: string; status: number }[] = [];
      const manualStatesPayload: { countryId: string; name: string; status: number }[] = [];

      Object.entries(selectedStates).forEach(([countryName, stateNames]) => {
        const country = selectedCountries.find((c) => c.name === countryName);
        if (!country || !country.countryId) return;
        const countryId = country.countryId;
        const countryStates = statesByCountry[countryId] || [];

        stateNames.forEach((stateName) => {
          const state = countryStates.find((s: State) => s.name === stateName);
          if (state) {
            const status = state.status !== undefined ? state.status : 0;
            if (state.manual) {
              manualStatesPayload.push({
                countryId,
                name: stateName,
                status,
              });
            } else {
              statesPayload.push({
                countryId,
                stateId: state.id,
                name: stateName,
                status,
              });
            }
          }
        });
      });




      try {
        const res = await httpFile.post(
          "/updateStateInProject",
          { projectId, states: statesPayload, manualStates: manualStatesPayload },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );

        if (res.status === 200 || res.status === 201) {
          toast({
            title: "Success",
            description: "States updated successfully!",
          });
          setLastSavedStates(selectedStates);
          setStep(step + 1);
        } else {
          throw new Error("Failed to update states");
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.response?.data?.message || "An error occurred while updating states!",
          variant: "destructive",
        });
      }
    } else if (step === 4) {
      const hasCitiesChanged = JSON.stringify(selectedCities) !== JSON.stringify(lastSavedCities);
      // if (!hasCitiesChanged) {
      //   setStep(step + 1);
      //   return;
      // }

      const token = localStorage.getItem("token");
      const citiesPayload: { stateId: string; cityId?: string; name: string; status: number }[] = [];
      const manualCitiesPayload: { stateId: string; name: string; status: number }[] = [];

      Object.entries(selectedCities).forEach(([stateName, cityNames]) => {
        const country = selectedCountries.find((c) => selectedStates[c.name]?.includes(stateName));
        if (!country || !country.countryId) return;
        const state = statesByCountry[country.countryId]?.find((s: State) => s.name === stateName);
        if (!state || !state.id) return;
        const stateId = state.id;
        const stateCities = citiesByState[stateName] || [];

        cityNames.forEach((cityName) => {
          const city = stateCities.find((c: City) => c.name === cityName);
          if (city) {
            const status = city.status !== undefined ? city.status : 0;
            if (city.manual) {
              manualCitiesPayload.push({
                stateId,
                name: cityName,
                status,
              });
            } else {
              citiesPayload.push({
                stateId,
                cityId: city.id,
                name: cityName,
                status,
              });
            }
          }
        });
      });

      try {
        const res = await httpFile.post(
          "/updateCityInProject",
          { projectId, cities: citiesPayload, manualCities: manualCitiesPayload },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );

        console.log("UpdateCityInProject Response:", {
          status: res.status,
          data: res.data,
        });

        if ([200, 201, 204].includes(res.status)) {
          toast({
            title: "Success",
            description: "Cities updated successfully!",
          });
          setLastSavedCities(selectedCities);
          setStep(step + 1);
        } else {
          throw new Error(`Unexpected status code: ${res.status}`);
        }
      } catch (err: any) {
        console.error("UpdateCityInProject Error:", err);
        toast({
          title: "Error",
          description: err.response?.data?.message || "An error occurred while updating cities!",
          variant: "destructive",
        });
      }
    } else if (step === 5) {
      const hasLocalAreasChanged = JSON.stringify(localAreas) !== JSON.stringify(lastSavedLocalAreas);
      // if (!hasLocalAreasChanged) {
      //   setStep(step + 1);
      //   return;
      // }

      const formattedData = Object.entries(localAreas).flatMap(([cityName, areas]) => {
        const stateName = Object.keys(selectedCities).find((state) =>
          selectedCities[state].includes(cityName)
        );
        const country = selectedCountries.find((c) => selectedStates[c.name]?.includes(stateName));
        const state = country
          ? statesByCountry[country.countryId]?.find((s: State) => s.name === stateName)
          : null;
        const city = state ? citiesByState[stateName]?.find((c: City) => c.name === cityName) : null;
        const cityId = city?.id || null;

        return areas.map((area: { id: string; name: string }) => ({
          name: area.name,
          cityId,
        }));
      });

      if (formattedData.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one local area or click Skip to proceed.",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);
      try {
        const token = localStorage.getItem("token");
        const res = await httpFile.post(
          "/updateLocalAreaInProject",
          { projectId, localAreas: formattedData },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("UpdateLocalAreaInProject Response:", {
          status: res.status,
          data: res.data,
        });

        if ([200, 201, 204].includes(res.status)) {
          toast({
            title: "Success",
            description: "Local areas updated successfully!",
          });
          setLastSavedLocalAreas(localAreas);
          setStep(step + 1);
        } else {
          throw new Error(`Unexpected status code: ${res.status}`);
        }
      } catch (error: any) {
        console.error("UpdateLocalAreaInProject Error:", error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "An error occurred while updating local areas!",
          variant: "destructive",
        });
        setStep(step + 1);
      } finally {
        setSubmitting(false);
      }

    } else if (step === 6) {
      const hasServiceOptionChanged = serviceOption !== lastSavedServiceOption;
      if (!hasServiceOptionChanged) {
        setStep(step + 1);
        return;
      }

      const mode = await Swal.fire({
        title: "How do you want to add services?",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "📋 Manual Entry",
        denyButtonText: "🤖 AI Services",
        cancelButtonText: "❌ Cancel",
      });

      if (mode.isDismissed) {
        return;
      }

      setServiceOption(mode.isDenied ? "ai" : "manual");
      setLastSavedServiceOption(mode.isDenied ? "ai" : "manual");
      setStep(step + 1);
    } else if (step === 7) {
      // Check if services have been added
      if (selectedServices.length === 0 && !lastSavedServiceNames) {
        toast({
          title: "Error",
          description: "Please add services before proceeding to the next step.",
          variant: "destructive",
        });
        return;
      }
      // If services are already saved, proceed to next step
      if (lastSavedServiceNames && selectedServices.length === 0) {
        setStep(step + 1);
        return;
      }
      // Save services if not already saved
      if (selectedServices.length > 0) {
        setSubmitting(true);
        try {
          const token = localStorage.getItem("token");
          const payload = { projectId, wantAiServices: 0, services: selectedServices };
          const res = await httpFile.post(
            "/addServicesToLocation",
            payload,
            { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
          );
          if (res.status === 200) {
            toast({ title: "Success", description: "Services saved successfully!" });
            setLastSavedServiceOption("manual");
            setLastSavedServiceNames(selectedServices.join("\n"));
            setStep(step + 1);
          } else {
            toast({ title: "Error", description: "Failed to save services", variant: "destructive" });
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.response?.data?.message || "An error occurred while saving services!",
            variant: "destructive",
          });
        } finally {
          setSubmitting(false);
        }
        return;
      }
      setStep(step + 1);
    } else if (step === 8) {
      if (!aboutUsEmail || !aboutUsPhone || !aboutUsLocation) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const hasAboutUsChanged =
        aboutUsEmail !== lastSavedAboutUsEmail ||
        aboutUsPhone !== lastSavedAboutUsPhone ||
        aboutUsLocation !== lastSavedAboutUsLocation;

      if (!hasAboutUsChanged) {
        setStep(step + 1); // Proceed to Step 9
        return;
      }

      setSubmitting(true);
      try {
        const admin = JSON.parse(localStorage.getItem("adminProfile") || "{}");
        const userId = admin._id;
        const payload = { userId, projectId, email: aboutUsEmail, phone: aboutUsPhone, mainLocation: aboutUsLocation };
        const token = localStorage.getItem("token");
        const res = await httpFile.put(
          "/updateAboutUs",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if ([200, 201, 204].includes(res.status)) {
          toast({
            title: "Success",
            description: "About Us information saved successfully!",
          });
          setLastSavedAboutUsEmail(aboutUsEmail);
          setLastSavedAboutUsPhone(aboutUsPhone);
          setLastSavedAboutUsLocation(aboutUsLocation);
          setStep(step + 1); // Proceed to Step 9
        } else {
          throw new Error("Failed to save About Us information");
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.response?.data?.message || "An error occurred while saving About Us information!",
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    } else if (step === 9) {
      // Validate theme selection
      if (!selectedTheme) {
        toast({
          title: "Error",
          description: "Please select a theme",
          variant: "destructive",
        });
        return;
      }

      const hasThemeChanged =
        selectedTheme !== lastSavedSelectedTheme ||
        themeSecondaryColor !== lastSavedThemeSecondaryColor;

      if (!hasThemeChanged) {
        resetForm();
        clearLocalStorageExcept();
        setShowFinalSuccess(true);
        return;
      }

      setSubmitting(true);
      try {
        const token = localStorage.getItem("token");
        const payload = {
          projectId,
          theme: selectedTheme,
          themeSecondaryColor: themeSecondaryColor,
          themeSubColor: subcolor,
        };

        const res = await httpFile.post(
          "/updateProjectTheme",
          payload,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );

        if ([200, 201, 204].includes(res.status)) {
          toast({
            title: "Success",
            description: "Theme saved successfully!",
          });

          await httpFile.post(
            "/makeEachLocaionPage",
            payload,
            { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
          );

          await httpFile.post(
            "/makeEachLocationServicePage",
            payload,
            { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
          );


          setLastSavedSelectedTheme(selectedTheme);
          setLastSavedThemeSecondaryColor(themeSecondaryColor);
          
          // Start processing monitoring
          setIsProcessing(true);
          setProcessingProgress(0);
          setProcessingStatus("Initializing project...");
          setElapsedTime(0);
          startProcessingMonitor(projectId);
          
          // Don't show final success yet, wait for processing to complete
          // resetForm();
          // clearLocalStorageExcept();
          // setShowFinalSuccess(true);
        } else {
          throw new Error("Failed to save theme");
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.response?.data?.message || "An error occurred while saving theme!",
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    }
  };



  // Monitor project processing status
  const startProcessingMonitor = async (projectId: string) => {
    const startTime = Date.now();
    const checkInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await httpFile.post(
          "/projectinfo",
          { ProjectId: projectId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const project = res.data?.projectInfo;
        const currentStatus = project?.status || 0;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);

        // Update progress based on status
        if (currentStatus === 2) {
          // Active status
          setProcessingProgress(100);
          setProcessingStatus("Project is now active!");
          clearInterval(checkInterval);
          setIsProcessing(false);
          
          // Show success after a brief delay
          setTimeout(() => {
            resetForm();
            clearLocalStorageExcept();
            setShowFinalSuccess(true);
          }, 1500);
        } else {
          // Calculate progress (0-90% while processing)
          const baseProgress = Math.min(90, (elapsed / 60) * 30); // 30% per minute, max 90%
          setProcessingProgress(baseProgress);
          
          // Update status message
          if (elapsed < 10) {
            setProcessingStatus("Creating project structure...");
          } else if (elapsed < 30) {
            setProcessingStatus("Generating pages and content...");
          } else if (elapsed < 60) {
            setProcessingStatus("Finalizing project setup...");
          } else {
            setProcessingStatus("Almost done, please wait...");
          }
        }

        // Timeout after 5 minutes
        if (elapsed > 300) {
          clearInterval(checkInterval);
          setIsProcessing(false);
          toast({
            title: "Processing Timeout",
            description: "Project is still processing. Please check back later.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error checking project status:", error);
      }
    }, 2000); // Check every 2 seconds

    // Cleanup on unmount
    return () => clearInterval(checkInterval);
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {

    setStep(6);
  };

  const handleCountrySearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && countrySearchInput.trim() !== "") {
      const trimmedInput = countrySearchInput.trim();

      // Check for exact match (case-insensitive)
      const exactMatch = countries.find((country) =>
        country.name.toLowerCase() === trimmedInput.toLowerCase()
      );

      let updatedCountries;
      if (exactMatch) {
        // Select existing country
        if (!selectedCountries.some((c) => c.name === exactMatch.name)) {
          updatedCountries = [...selectedCountries, { ...exactMatch, status: 0 }];
          setSelectedCountries(updatedCountries);
        }
      } else {
        // Add new manual country
        const newCountry: Country = { name: trimmedInput, status: 0 };
        setCountries([...countries, newCountry]);
        updatedCountries = [...selectedCountries, newCountry];
        setSelectedCountries(updatedCountries);
      }

      setLastSavedCountries(updatedCountries || selectedCountries);
      setCountrySearchInput("");
      setCurrentCountryPage(1); // Reset to first page
    }
  };


  const toggleState = (countryName: string, stateName: string) => {
    setSelectedStates((prev) => {
      const updated = {
        ...prev,
        [countryName]: prev[countryName]?.includes(stateName)
          ? prev[countryName].filter((s) => s !== stateName)
          : [...(prev[countryName] || []), stateName],
      };
      setLastSavedStates(updated);
      return updated;
    });
  };

  const selectAllStates = (countryName: string) => {
    const country = selectedCountries.find((c) => c.name === countryName);
    if (!country || !country.countryId) return; // Safety check
    const countryId = country.countryId;
    setSelectedStates((prev) => ({
      ...prev,
      [countryName]: (statesByCountry[countryId] || []).map((state: State) => state.name),
    }));
  };

  const deselectAllStates = (countryName: string) => {
    setSelectedStates((prev) => ({
      ...prev,
      [countryName]: [],
    }));
  };

  const removeState = (countryName: string, stateName: string) => {
    const country = selectedCountries.find((c) => c.name === countryName);
    if (!country || !country.countryId) return; // Safety check
    const countryId = country.countryId;
    // Optionally remove manual state from statesByCountry
    setStatesByCountry((prev) => ({
      ...prev,
      [countryId]: (prev[countryId] || []).filter((s: State) => s.name !== stateName || !s.manual),
    }));
    // Update selectedStates
    setSelectedStates((prev) => ({
      ...prev,
      [countryName]: prev[countryName]?.filter((s) => s !== stateName) || [],
    }));
  };

  const handleCityKeyDown = (stateName: string, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && cityInput[stateName]?.trim() !== "") {
      e.preventDefault();
      const newCityName = cityInput[stateName].trim();
      const country = selectedCountries.find((c) => selectedStates[c.name]?.includes(stateName));
      if (!country || !country.countryId) return; // Safety check
      const state = statesByCountry[country.countryId]?.find((s: State) => s.name === stateName);
      if (!state || !state.id) {
        toast({
          title: "Error",
          description: "State ID is missing. Please ensure states are saved correctly.",
          variant: "destructive",
        });
        return;
      }
      const stateId = state.id;

      // Check for existing city (case-insensitive)
      const existingCity = citiesByState[stateName]?.find(
        (c: City) => c.name.toLowerCase() === newCityName.toLowerCase()
      );
      if (existingCity) {
        // Select existing city if not already selected
        if (!selectedCities[stateName]?.includes(existingCity.name)) {
          setSelectedCities((prev) => {
            const updated = {
              ...prev,
              [stateName]: [...(prev[stateName] || []), existingCity.name],
            };
            setLastSavedCities(updated);
            return updated;
          });
        }
      } else {
        // Add manual city
        const newCity: City = { name: newCityName, state_id: stateId, manual: true, status: 0 };
        setCitiesByState((prev) => ({
          ...prev,
          [stateName]: [...(prev[stateName] || []), newCity],
        }));
        // Only add to selectedCities if it doesn't already exist
        setSelectedCities((prev) => {
          const currentCities = prev[stateName] || [];
          if (currentCities.includes(newCityName)) {
            setLastSavedCities(prev);
            return prev; // Prevent duplicate
          }
          const updated = {
            ...prev,
            [stateName]: [...currentCities, newCityName],
          };
          setLastSavedCities(updated);
          return updated;
        });
      }

      // Initialize local area input for this city
      setLocalAreaInput({ ...localAreaInput, [newCityName]: "" });
      setLocalAreas({ ...localAreas, [newCityName]: [] });
      setCityInput({ ...cityInput, [stateName]: "" });
    }
  };

  const handleLocalAreaKeyDown = (city: string, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && localAreaInput[city]?.trim() !== "") {
      e.preventDefault();
      const newLocalAreaName = localAreaInput[city].trim();
      const updatedLocalAreas = { ...localAreas };
      if (!updatedLocalAreas[city]) {
        updatedLocalAreas[city] = [];
      }
      const exists = updatedLocalAreas[city].some(
        (area: { id: string; name: string }) => area.name.toLowerCase() === newLocalAreaName.toLowerCase()
      );
      if (!exists) {
        updatedLocalAreas[city] = [
          ...updatedLocalAreas[city],
          { id: Date.now().toString(), name: newLocalAreaName },
        ];
      } else {
        toast({
          title: "Warning",
          description: "This local area already exists.",
          variant: "destructive",
        });
      }
      setLocalAreas(updatedLocalAreas);
      setLocalAreaInput({ ...localAreaInput, [city]: "" });
    }
  };

  const selectCountryFromList = (countryName: string) => {
    const country = countries.find((c) => c.name === countryName);
    if (country && !selectedCountries.some((c) => c.name === country.name)) {
      const updatedCountries = [...selectedCountries, { ...country, status: 0 }];
      setSelectedCountries(updatedCountries);
      // Update lastSavedCountries to prevent unnecessary API calls
      setLastSavedCountries(updatedCountries);
    }
  };

  const toggleCountryPageCreation = (countryName: string) => {
    setSelectedCountries(selectedCountries.map(country =>
      country.name === countryName
        ? { ...country, status: country.status === 1 ? 0 : 1 }
        : country
    ));
  };



  const toggleCity = (stateName: string, cityName: string) => {
    setSelectedCities((prev) => {
      const updated = {
        ...prev,
        [stateName]: prev[stateName]?.includes(cityName)
          ? prev[stateName].filter((c) => c !== cityName)
          : [...(prev[stateName] || []), cityName],
      };
      setLastSavedCities(updated);
      return updated;
    });
  };

  const selectAllCountries = () => {
    const newSelected = filteredCountries.map(country => ({ ...country, status: 0 }));
    setSelectedCountries(newSelected);
  };

  const deselectAllCountries = () => {
    setSelectedCountries([]);
  };


  const selectAllCities = (stateName: string) => {
    setSelectedCities((prev) => ({
      ...prev,
      [stateName]: (citiesByState[stateName] || []).map((city: City) => city.name),
    }));
  };

  const deselectAllCities = (stateName: string) => {
    setSelectedCities((prev) => ({
      ...prev,
      [stateName]: [],
    }));
  };

  const removeLocalArea = (city: string, areaId: string) => {
    const updatedLocalAreas = { ...localAreas };
    updatedLocalAreas[city] = updatedLocalAreas[city].filter((a: { id: string; name: string }) => a.id !== areaId);
    setLocalAreas(updatedLocalAreas);
  };

  const removeCountry = (countryName: string) => {
    const country = selectedCountries.find(c => c.name === countryName);
    setSelectedCountries(selectedCountries.filter(c => c.name !== countryName));
    if (!country?.countryId) {
      // Remove manual country from countries list
      setCountries(countries.filter(c => c.name !== countryName));
    }
  };



  const removeCity = (stateName: string, cityName: string) => {
    setCitiesByState((prev) => ({
      ...prev,
      [stateName]: prev[stateName].filter((c: City) => !(c.name === cityName && c.manual)),
    }));
    setSelectedCities((prev) => ({
      ...prev,
      [stateName]: prev[stateName]?.filter((c) => c !== cityName) || [],
    }));
  };

  const handleCompletedFirstStep = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setStep(2);
    }, 1500);
  };



  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // In a real app, you would process the file here
      // For demo purposes, we'll just show a success message
      toast({
        title: "File Uploaded",
        description: `${file.name} was successfully uploaded`,
      });
    }
  };


  const handleSelectAllCountries = () => {
    const updatedCountries = selectedCountries.map(country => ({
      ...country,
      status: 1, // Mark the 'Create Page' checkbox as checked (status = 1)
    }));
    setSelectedCountries(updatedCountries);
  };



  const handleDeselectAllCountries = () => {
    const updatedCountries = selectedCountries.map(country => ({
      ...country,
      status: 0, // Mark the 'Create Page' checkbox as unchecked (status = 0)
    }));
    setSelectedCountries(updatedCountries);
  };


  const selectAllStatesForCreatePage = (countryId: string) => {
    // Ensure the country exists in selectedCountries
    const country = selectedCountries.find((c) => c.countryId === countryId);
    if (!country) return; // Safety check if country is not found

    // Update the statesByCountry for the given country, setting status to 1 for all states
    setStatesByCountry((prev) => ({
      ...prev,
      [countryId]: prev[countryId].map((state: State) => ({
        ...state,
        status: 1, // Set status to 1 (checked) for all states of this country
      })),
    }));

    // Update selectedStates to include all states for this country
    setSelectedStates((prev) => ({
      ...prev,
      [countryId]: prev[countryId] || statesByCountry[countryId].map((state: State) => state.name),
    }));
  };

  const deselectAllStatesForCreatePage = (countryId: string) => {
    // Ensure the country exists in selectedCountries
    const country = selectedCountries.find((c) => c.countryId === countryId);
    if (!country) return; // Safety check if country is not found

    // Update the statesByCountry for the given country, setting status to 0 for all states
    setStatesByCountry((prev) => ({
      ...prev,
      [countryId]: prev[countryId].map((state: State) => ({
        ...state,
        status: 0, // Set status to 0 (unchecked) for all states of this country
      })),
    }));

    // Update selectedStates to remove all states for this country
    setSelectedStates((prev) => ({
      ...prev,
      [countryId]: [],
    }));
  };



  const selectAllCitiesForCreatePage = (stateId: string) => {
    setCitiesByState((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((stateName) => {
        const state = statesByCountry[selectedCountries.find((c) => c.countryId)?.countryId]?.find(
          (s: State) => s.id === stateId
        );
        if (state && state.name === stateName) {
          updated[stateName] = updated[stateName].map((city: City) => ({
            ...city,
            status: 1, // Set status to 1 (checked) for all cities in this state
          }));
        }
      });
      return updated;
    });
  };

  const deselectAllCitiesForCreatePage = (stateId: string) => {
    setCitiesByState((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((stateName) => {
        const state = statesByCountry[selectedCountries.find((c) => c.countryId)?.countryId]?.find(
          (s: State) => s.id === stateId
        );
        if (state && state.name === stateName) {
          updated[stateName] = updated[stateName].map((city: City) => ({
            ...city,
            status: 0, // Set status to 0 (unchecked) for all cities in this state
          }));
        }
      });
      return updated;
    });
  };





  const resetForm = () => {
    setSelectedCountries([]);
    setCountrySearchInput("");
    setCurrentCountryPage(1);
    setSelectedStates({});
    setStateInput({});
    setCitiesByState({});
    setSelectedCities({});
    setCityInput({});
    setLocalAreas({});
    setLocalAreaInput({});
    setServiceOption("");
    setServiceNames("");
    setAboutUsEmail("");
    setAboutUsPhone("");
    setAboutUsLocation("");
    setLastSavedCountries([]);
    setLastSavedStates({});
    setLastSavedCities({});
    setLastSavedLocalAreas({});
    setLastSavedProjectName("");
    setLastSavedServiceType("");
    setLastSavedWantImages(true); // Always true (hidden field, always enabled)
    setLastSavedServiceOption("");
    setLastSavedServiceNames("");
    setLastSavedAboutUsEmail("");
    setLastSavedAboutUsPhone("");
    setLastSavedAboutUsLocation("");
    setPrimaryColor("#000000");
    setSecondaryColor("#000000");
    setAccentColor("#000000");
    setButtonColor("#000000");
    setIsPrimaryGradient(false);
    setIsSecondaryGradient(false);
    setIsAccentGradient(false);
    setIsButtonGradient(false);
    setPrimaryGradient({ color1: "#000000", color2: "#FFFFFF", direction: "to right" });
    setSecondaryGradient({ color1: "#000000", color2: "#FFFFFF", direction: "to right" });
    setAccentGradient({ color1: "#000000", color2: "#FFFFFF", direction: "to right" });
    setButtonGradient({ color1: "#000000", color2: "#FFFFFF", direction: "to right" });
    setLastSavedPrimaryColor("");
    setLastSavedSecondaryColor("");
    setLastSavedAccentColor("");
    setLastSavedButtonColor("");
    setLastSavedIsPrimaryGradient(false);
    setLastSavedIsSecondaryGradient(false);
    setLastSavedIsAccentGradient(false);
    setLastSavedIsButtonGradient(false);
    setLastSavedPrimaryGradient({ color1: "", color2: "", direction: "" });
    setLastSavedSecondaryGradient({ color1: "", color2: "", direction: "" });
    setLastSavedAccentGradient({ color1: "", color2: "", direction: "" });
    setLastSavedButtonGradient({ color1: "", color2: "", direction: "" });
  };


  const handleManualServiceEntry = async () => {
    const manual = await Swal.fire({
      title: "Enter Service Names or Upload Excel",
      html: `
        <div style="text-align: left; margin-bottom: 1.5rem;">
          <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">
            Service Names (one per line)
          </label>
          <textarea id="swal-textarea" class="swal-theme-input"
            placeholder="One service name per line&#10;Example:&#10;Plumbing Services&#10;Drain Cleaning&#10;Water Heater Installation"
            style="width: 100%; min-height: 200px; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; resize: vertical; box-sizing: border-box; font-family: monospace;"></textarea>
        </div>
        <div style="text-align: left;">
          <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">
            Or Upload Excel File
          </label>
          <input type="file" id="swal-file" class="swal-theme-file"
            accept=".xlsx,.xls"
            style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; box-sizing: border-box;" />
        </div>
      `,
      focusConfirm: false,
      customClass: {
        popup: 'swal-theme-popup swal-manual-popup',
        title: 'swal-theme-title',
        confirmButton: 'swal-theme-confirm',
        cancelButton: 'swal-theme-cancel',
      },
      buttonsStyling: false,
      confirmButtonText: "Add Services",
      cancelButtonText: "Cancel",
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      preConfirm: () => {
        const text = (document.getElementById("swal-textarea") as HTMLTextAreaElement).value
          .split("\n")
          .map(l => l.trim())
          .filter(Boolean);

        const fileInput = document.getElementById("swal-file") as HTMLInputElement;
        const file = fileInput.files?.[0];
        if (!text.length && !file) {
          Swal.showValidationMessage(
            "Please enter at least one name or upload an Excel file."
          );
          return false;
        }
        if (file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
              try {
                const data = new Uint8Array(e.target.result as ArrayBuffer);
                const wb = XLSX.read(data, { type: "array" });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                const fromFile = rows
                  .map(r => r[0])
                  .filter(v => typeof v === "string" && v.trim());
                resolve([...text, ...fromFile]);
              } catch (err) {
                reject("Failed to parse Excel file.");
              }
            };
            reader.onerror = () => reject("Failed to read file.");
            reader.readAsArrayBuffer(file);
          });
        }
        return text;
      },
    });

    if (manual.isConfirmed) {
      const servicesArray = manual.value;
      if (Array.isArray(servicesArray) && servicesArray.length) {
        // Add services to step 7 display instead of going to next step
        // Merge with existing services (avoid duplicates)
        const existingServices = selectedServices;
        const newServices = servicesArray.filter(service => !existingServices.includes(service));
        const mergedServices = [...existingServices, ...newServices];
        setSelectedServices(mergedServices);
        setHasGeneratedServices(true);
        setLastSavedServiceOption("manual");
        setLastSavedServiceNames(mergedServices.join("\n"));
        toast({ 
          title: "Services Added", 
          description: `${newServices.length} new service(s) added! Total: ${mergedServices.length} service(s). Click Next to continue.` 
        });
      } else {
        toast({
          title: "Error",
          description: "No services to submit.",
          variant: "destructive",
        });
      }
    }
  };



  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            {/* Do you want images - Hidden, always set to true */}
            {/* Field is hidden from UI, wantImages always defaults to 1 */}


            {/* Category Section */}
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center space-x-2 mb-2">
                {React.createElement(FileText as any, { className: "h-4 w-4 text-blue-600" })}
                <Label className="text-base font-semibold text-gray-900">Category & Classification</Label>
              </div>

              {/* Category (CreatableSelect, single) */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  {React.createElement(CreatableSelect as any, {
                    id: "category",
                    isClearable: true,
                    placeholder: "Select or type category",
                    value: selectedCategory ? { label: selectedCategory.name, value: selectedCategory._id || selectedCategory.name } : null,
                    options: categories.map(c => ({ label: c.name, value: c._id, data: c })),
                    onChange: (option: any) => {
                      if (option) {
                        // If selected from list, use full object; if manual, only name
                        const found = categories.find(c => c._id === option.value);
                        if (found) {
                          setSelectedCategory(found);
                        } else {
                          setSelectedCategory({ _id: '', name: option.value });
                        }
                      } else {
                        setSelectedCategory(null);
                      }
                    },
                    onCreateOption: (inputValue: string) => {
                      setSelectedCategory({ _id: '', name: inputValue });
                    },
                    styles: {
                      control: (base: any) => ({
                        ...base,
                        borderColor: '#e5e7eb',
                        '&:hover': {
                          borderColor: '#3b82f6',
                        },
                        minHeight: '42px',
                      }),
                      placeholder: (base: any) => ({
                        ...base,
                        color: '#9ca3af',
                      }),
                    }
                  })}
                </div>
                <p className="text-xs text-gray-500">
                  Select an existing category or create a new one
                </p>
              </div>

              {/* Subcategory (CreatableSelect, multi) */}
              {selectedCategory && (
                <div className="space-y-2">
                  <Label htmlFor="subCategory" className="text-sm font-medium text-gray-700">
                    Sub Categories <span className="text-gray-400 text-xs">(Multiple Selection)</span>
                  </Label>
                  <div className="relative">
                    {React.createElement(CreatableSelect as any, {
                      id: "subCategory",
                      isMulti: true,
                      placeholder: "Select or type subcategories",
                      value: [
                        ...selectedSubCategories.map(name => ({ label: name, value: name })),
                        ...manualSubCategories.map(name => ({ label: name, value: name }))
                      ],
                      options: subCategories.map(sc => ({ label: sc.name, value: sc.name })),
                      onChange: (options: any) => {
                        const values = Array.isArray(options) ? options.map(o => o.value) : [];
                        setSelectedSubCategories(values);
                        setManualSubCategories([]); // All values are now in selectedSubCategories
                      },
                      onCreateOption: (inputValue: string) => {
                        setSelectedSubCategories(prev => [...prev, inputValue]);
                      },
                      styles: {
                        control: (base: any) => ({
                          ...base,
                          borderColor: '#e5e7eb',
                          '&:hover': {
                            borderColor: '#3b82f6',
                          },
                          minHeight: '42px',
                        }),
                        placeholder: (base: any) => ({
                          ...base,
                          color: '#9ca3af',
                        }),
                        multiValue: (base: any) => ({
                          ...base,
                          backgroundColor: '#dbeafe',
                          borderRadius: '6px',
                        }),
                        multiValueLabel: (base: any) => ({
                          ...base,
                          color: '#1e40af',
                          fontWeight: '500',
                        }),
                      }
                    })}
                  </div>
                  <p className="text-xs text-gray-500">
                    Add multiple subcategories to better classify your project
                  </p>
                </div>
              )}

              {/* Microcategory (CreatableSelect, multi, manual only) */}
              {selectedCategory && (
                <div className="space-y-2">
                  <Label htmlFor="microCategory" className="text-sm font-medium text-gray-700">
                    Micro Categories <span className="text-gray-400 text-xs">(Optional, Multiple)</span>
                  </Label>
                  <div className="relative">
                    {React.createElement(CreatableSelect as any, {
                      id: "microCategory",
                      isMulti: true,
                      placeholder: "Type micro categories",
                      value: manualMicroCategories.map(name => ({ label: name, value: name })),
                      options: [],
                      onChange: (options: any) => {
                        const values = Array.isArray(options) ? options.map(o => o.value) : [];
                        setManualMicroCategories(values);
                      },
                      onCreateOption: (inputValue: string) => {
                        setManualMicroCategories(prev => [...prev, inputValue]);
                      },
                      styles: {
                        control: (base: any) => ({
                          ...base,
                          borderColor: '#e5e7eb',
                          '&:hover': {
                            borderColor: '#3b82f6',
                          },
                          minHeight: '42px',
                        }),
                        placeholder: (base: any) => ({
                          ...base,
                          color: '#9ca3af',
                        }),
                        multiValue: (base: any) => ({
                          ...base,
                          backgroundColor: '#f0fdf4',
                          borderRadius: '6px',
                        }),
                        multiValueLabel: (base: any) => ({
                          ...base,
                          color: '#166534',
                          fontWeight: '500',
                        }),
                      }
                    })}
                  </div>
                  <p className="text-xs text-gray-500">
                    Add specific micro categories for detailed classification (optional)
                  </p>
                </div>
              )}
            </div>

            {/* --- FOCUS KEYWORD & PROJECT KEYWORDS --- */}
            <div className="space-y-4 pt-2 border-t">
              {/* Focus Keyword */}
              <div className="space-y-2">
                <Label htmlFor="focusKeyword">Main Focus Keyword</Label>
                <div className="flex gap-2">
                  <Input
                    id="focusKeyword"
                    placeholder="e.g., emergency electrician"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" onClick={generateFocusKeyword} disabled={generatingFK}>
                    {generatingFK ? React.createElement(Loader2 as any, { className: "h-4 w-4 animate-spin" }) : React.createElement(Wand2 as any, { className: "h-4 w-4" })}
                    <span className="ml-2 hidden sm:inline">Generate</span>
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  One primary keyword to focus your SEO (you can edit it).
                </p>
              </div>

              {/* Project Keywords */}
              <div className="space-y-2">
                <Label htmlFor="projectKeywords">Project Keywords (comma-separated)</Label>
                <div className="flex gap-2">
                  <Input
                    id="projectKeywords"
                    placeholder="e.g., 24 hour electrician, circuit breaker repair, wiring service"
                    value={projectKeywordsText}
                    onChange={(e) => setProjectKeywordsText(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" onClick={generateProjectKeywords} disabled={generatingPK}>
                    {generatingPK ? React.createElement(Loader2 as any, { className: "h-4 w-4 animate-spin" }) : React.createElement(Wand2 as any, { className: "h-4 w-4" })}
                    <span className="ml-2 hidden sm:inline">Generate</span>
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  We’ll prefill with an AI list; you can edit them. Stored/used as an array by splitting on commas.
                </p>
              </div>
            </div>
          </div>
        );


      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose Countries</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search or Add Country</Label>
                <div className="relative">
                  {React.createElement(Search as any, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" })}
                  <Input
                    placeholder="Search existing countries or type new country name and press Enter"
                    value={countrySearchInput}
                    onChange={(e) => {
                      setCountrySearchInput(e.target.value);
                      setCurrentCountryPage(1);
                    }}
                    onKeyDown={handleCountrySearchKeyDown}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Type to search existing countries or enter a new country name and press Enter to add it
                </p>
              </div>

              <div className="flex space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllCountries}>
                  Select All ({filteredCountries.length})
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={deselectAllCountries}>
                  Deselect All
                </Button>
              </div>

              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {currentCountries.map((country) => (
                    <div
                      key={country.countryId || country.name} // Unique key for country
                      className="border p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => selectCountryFromList(country.name)}
                          className="flex-1 text-left text-sm font-medium cursor-pointer hover:text-blue-600"
                          disabled={selectedCountries.some((c) => c.name === country.name)}
                        >
                          {country.name}
                          {selectedCountries.some((c) => c.name === country.name) && (
                            <span className="ml-2 text-green-600">✓ Selected</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalCountryPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentCountryPage(Math.max(1, currentCountryPage - 1))}
                      disabled={currentCountryPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentCountryPage} of {totalCountryPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentCountryPage(Math.min(totalCountryPages, currentCountryPage + 1))}
                      disabled={currentCountryPage === totalCountryPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex space-x-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAllCountries()}
                  >
                    Select All (Create Page)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeselectAllCountries()}
                  >
                    Deselect All (Create Page)
                  </Button>
                </div>

                <h4 className="text-sm font-medium mb-2">Selected Countries ({selectedCountries.length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedCountries.map((country) => (
                    <div
                      key={country.countryId || country.name} // Unique key for country
                      className="flex items-center justify-between p-3 bg-white rounded border"
                    >
                      <span className="font-medium">{country.name}</span>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`page-${country.name}`}
                            checked={country.status === 1}
                            onCheckedChange={() => toggleCountryPageCreation(country.name)}
                          />
                          <label
                            htmlFor={`page-${country.name}`}
                            className="text-xs text-blue-600 cursor-pointer"
                          >
                            Create page
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCountry(country.name)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          {React.createElement(X as any, { className: "h-4 w-4" })}
                        </button>
                      </div>
                    </div>
                  ))}
                  {selectedCountries.length === 0 && (
                    <div className="text-center p-4 text-gray-500 text-sm">
                      No countries selected yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose States</h3>
            <div className="space-y-6">
              {selectedCountries.map((country) => {
                if (!country.countryId) return null; // Skip countries without countryId
                const countryId = country.countryId;
                // Filter states based on search input
                const filteredStates = (statesByCountry[countryId] || []).filter((state: State) =>
                  state.name.toLowerCase().includes((stateInput[country.name] || "").toLowerCase())
                );
                return (
                  <div key={countryId} className="border p-4 rounded-md">
                    <h4 className="font-medium mb-2">{country.name}</h4>

                    <div className="space-y-2">
                      <Label>Search or Add State</Label>
                      <div className="relative">
                        {React.createElement(Search as any, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" })}
                        <Input
                          placeholder={`Search or add state for ${country.name}`}
                          value={stateInput[country.name] || ""}
                          onChange={(e) => setStateInput({ ...stateInput, [country.name]: e.target.value })}
                          onKeyDown={(e) => handleStateKeyDown(country.name, e)}
                          onClick={() => handleCountryClick(countryId)}
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Type to search existing states or enter a new state name and press Enter to add it
                      </p>
                    </div>

                    {loadingStates && <div className="text-sm text-gray-500">Loading states...</div>}

                    {filteredStates.length > 0 ? (
                      <div className="border rounded-lg p-4 max-h-96 overflow-y-auto mt-4">
                        <div className="flex space-x-2 mb-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => selectAllStates(country.name)}
                          >
                            Select All
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => deselectAllStates(country.name)}
                          >
                            Deselect All
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {filteredStates.map((state: State) => (
                            <div
                              key={state.id || state.name}
                              className="border p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => toggleState(country.name, state.name)}
                                  className="flex-1 text-left text-sm font-medium cursor-pointer hover:text-blue-600"
                                  disabled={selectedStates[country.name]?.includes(state.name)}
                                >
                                  {state.name}
                                  {selectedStates[country.name]?.includes(state.name) && (
                                    <span className="ml-2 text-green-600">✓ Selected</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : stateInput[country.name]?.trim() ? (
                      <div className="text-sm text-gray-500 mt-2">No matching states found</div>
                    ) : (
                      <div className="text-sm text-gray-500 mt-2">No states available</div>
                    )}

                    <div className="mt-4">
                      <div className="flex space-x-2 mb-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllStatesForCreatePage(country.countryId)}
                        >
                          Select All (Create Page)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => deselectAllStatesForCreatePage(country.countryId)}
                        >
                          Deselect All (Create Page)
                        </Button>
                      </div>

                      <h4 className="text-sm font-medium mb-2">Selected States ({selectedStates[country.name]?.length || 0})</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedStates[country.name]?.length > 0 ? (
                          selectedStates[country.name].map((stateName) => {
                            const state = statesByCountry[countryId]?.find((s: State) => s.name === stateName);
                            return (
                              <div key={stateName} className="flex items-center justify-between p-3 bg-white rounded border">
                                <span className="font-medium">{stateName}</span>
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`page-${country.name}-${stateName}`}
                                      checked={state?.status === 1}
                                      onCheckedChange={() => toggleStatePageCreation(country.name, stateName)}
                                    />
                                    <label
                                      htmlFor={`page-${country.name}-${stateName}`}
                                      className="text-xs text-blue-600 cursor-pointer"
                                    >
                                      Create page
                                    </label>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeState(country.name, stateName)}
                                    className="text-gray-500 hover:text-red-500"
                                  >
                                    {React.createElement(X as any, { className: "h-4 w-4" })}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center p-4 text-gray-500 text-sm">No states selected</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {selectedCountries.length === 0 && (
                <div className="text-center p-6 border border-dashed rounded-md">
                  <p className="text-gray-500">No countries selected. Please go back and select countries first.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose Cities</h3>
            <div className="space-y-6">
              {Object.entries(selectedStates).flatMap(([country, statesList]) =>
                statesList.map((state) => {
                  const countryObj = selectedCountries.find((c) => c.name === country);
                  if (!countryObj || !countryObj.countryId) return null;
                  const stateObj = statesByCountry[countryObj.countryId]?.find((s: State) => s.name === state);
                  if (!stateObj || !stateObj.id) return null;
                  const stateId = stateObj.id;
                  const filteredCities = (citiesByState[state] || []).filter((city: City) =>
                    city.name.toLowerCase().includes((cityInput[state] || "").toLowerCase())
                  );
                  return (
                    <div key={state} className="border p-4 rounded-md">
                      <h4 className="font-medium mb-2">{state}</h4>
                      <p className="text-xs text-gray-500 mb-2">({country})</p>

                      <div className="space-y-2">
                        <Label>Search or Add City</Label>
                        <div className="relative">
                          {React.createElement(Search as any, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" })}
                          <Input
                            placeholder={`Search or add city for ${state}`}
                            value={cityInput[state] || ""}
                            onChange={(e) => {
                              setCityInput({ ...cityInput, [state]: e.target.value });
                              if (!citiesByState[state]) {
                                fetchCitiesForState(stateId, state, e.target.value);
                              }
                            }}
                            onKeyDown={(e) => handleCityKeyDown(state, e)}
                            onFocus={() => {
                              if (!citiesByState[state]) {
                                fetchCitiesForState(stateId, state, cityInput[state] || "");
                              }
                            }}
                            className="pl-10"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Type to search existing cities or enter a new city name and press Enter to add it
                        </p>
                      </div>

                      {loading && <div className="text-sm text-gray-500">Loading cities...</div>}

                      {filteredCities.length > 0 ? (
                        <div className="border rounded-lg p-4 max-h-96 overflow-y-auto mt-4">
                          <div className="flex space-x-2 mb-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => selectAllCities(state)}
                            >
                              Select All
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => deselectAllCities(state)}
                            >
                              Deselect All
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {filteredCities.map((city: City) => (
                              <div key={city.id || city.name} className="border p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex items-center justify-between">
                                  <button
                                    type="button"
                                    onClick={() => toggleCity(state, city.name)}
                                    className="flex-1 text-left text-sm font-medium cursor-pointer hover:text-blue-600"
                                    disabled={selectedCities[state]?.includes(city.name)}
                                  >
                                    {city.name}
                                    {selectedCities[state]?.includes(city.name) && (
                                      <span className="ml-2 text-green-600">✓ Selected</span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : cityInput[state]?.trim() ? (
                        <div className="text-sm text-gray-500 mt-2">No matching cities found</div>
                      ) : (
                        <div className="text-sm text-gray-500 mt-2">No cities available</div>
                      )}

                      <div className="mt-4">
                        <div className="flex space-x-2 mb-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => selectAllCitiesForCreatePage(stateId)}
                          >
                            Select All (Create Page)
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => deselectAllCitiesForCreatePage(stateId)}
                          >
                            Deselect All (Create Page)
                          </Button>
                        </div>
                        <h4 className="text-sm font-medium mb-2">Selected Cities ({selectedCities[state]?.length || 0})</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedCities[state]?.length > 0 ? (
                            selectedCities[state].map((cityName) => {
                              const city = citiesByState[state]?.find((c: City) => c.name === cityName);
                              return (
                                <div key={cityName} className="flex items-center justify-between p-3 bg-white rounded border">
                                  <span className="font-medium">{cityName}</span>
                                  <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`page-${state}-${cityName}`}
                                        checked={city?.status === 1}
                                        onCheckedChange={() => toggleCityPageCreation(state, cityName)}
                                      />
                                      <label
                                        htmlFor={`page-${state}-${cityName}`}
                                        className="text-xs text-blue-600 cursor-pointer"
                                      >
                                        Create page
                                      </label>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => toggleCity(state, cityName)}
                                      className="text-gray-500 hover:text-red-500"
                                    >
                                      {React.createElement(X as any, { className: "h-4 w-4" })}
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center p-4 text-gray-500 text-sm">No cities selected</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {Object.values(selectedStates).every((states) => states.length === 0) && (
                <div className="text-center p-6 border border-dashed rounded-md">
                  <p className="text-gray-500">No states selected. Please go back and select states first.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 5:
        if (step !== 5) return null; // Safeguard to ensure Step 5 only renders when step is 5
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose Local Areas</h3>
            <div className="space-y-6">
              {loadingLocalAreas ? (
                <div className="text-center p-6">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                  <p className="text-gray-500 mt-2">Loading local areas...</p>
                </div>
              ) : Object.entries(selectedCities).flatMap(([state, citiesList]) =>
                citiesList.map((city) => (
                  <div key={city} className="border p-4 rounded-md">
                    <h4 className="font-medium mb-1">{city}</h4>
                    <p className="text-xs text-gray-500 mb-2">({state})</p>
                    <div className="space-y-2 mb-3">
                      <Label>Add Local Areas (Press Enter to Add):</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder={`Type local area for ${city} and press Enter`}
                          value={localAreaInput[city] || ""}
                          onChange={(e) => setLocalAreaInput({ ...localAreaInput, [city]: e.target.value })}
                          onKeyDown={(e) => handleLocalAreaKeyDown(city, e)}
                          disabled={submitting}
                          className="flex-1"
                        />
                        {/* Generate Button - Only if city has id (API city) */}
                        {(() => {
                          const cityObj = Object.values(citiesByState).flat().find((c: City) => c.name === city);
                          if (cityObj?.id) {
                            return (
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  max="50"
                                  placeholder="Count"
                                  value={localAreaCount}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (e.target.value === "") {
                                      setLocalAreaCount(1); // Reset to default if empty
                                    } else if (!isNaN(val)) {
                                      // Clamp value between 1 and 50
                                      const clampedVal = Math.max(1, Math.min(val, 50));
                                      setLocalAreaCount(clampedVal);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (isNaN(val) || val < 1) {
                                      setLocalAreaCount(1);
                                    } else if (val > 50) {
                                      setLocalAreaCount(50);
                                    }
                                  }}
                                  className="w-24"
                                  disabled={submitting || loadingLocalAreaGen[city]}
                                  title="Number of local areas to generate (1-50)"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateLocalAreasForCity(city, cityObj.id)}
                                  disabled={submitting || loadingLocalAreaGen[city]}
                                >
                                  {loadingLocalAreaGen[city] ? (
                                    React.createElement(Loader2 as any, { className: "h-4 w-4 mr-2 animate-spin" })
                                  ) : (
                                    React.createElement(Wand2 as any, { className: "h-4 w-4 mr-2" })
                                  )}
                                  Generate
                                </Button>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-xs font-medium mb-1 text-gray-500">Added Local Areas</h5>
                      <div className="flex flex-wrap gap-1">
                        {localAreas[city]?.map((area: { id: string; name: string }) => (
                          <Badge key={area.id} variant="secondary" className="flex items-center gap-1">
                            <span>{area.name}</span>
                            <button
                              type="button"
                              onClick={() => removeLocalArea(city, area.id)}
                              className="text-xs"
                              disabled={submitting}
                            >
                              {React.createElement(X as any, { className: "h-3 w-3" })}
                            </button>
                          </Badge>
                        ))}
                        {(!localAreas[city] || localAreas[city].length === 0) && (
                          <span className="text-xs text-gray-500">No local areas added</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {Object.values(selectedCities).every((cities) => cities.length === 0) && !loadingLocalAreas && (
                <div className="text-center p-6 border border-dashed rounded-md">
                  <p className="text-gray-500">No cities selected. Please go back and select cities first.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Preview</h3>
            <div className="space-y-4 border p-4 rounded-md bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Project Name</h4>
                  <p className="font-medium">{projectName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Service Type</h4>
                  <p className="font-medium">{serviceType}</p>
                </div>
              </div>

              {/* Want Images section hidden - always defaults to Yes (1) */}

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Countries with Page Creation</h4>
                <div className="space-y-2">
                  {selectedCountries.map((country) => (
                    <div
                      key={country.countryId || country.name}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <span className="font-medium">{country.name}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${country.status === 1 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {country.status === 1 ? "Page will be created" : "No page"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Locations</h4>
                <div className="space-y-3">
                  {selectedCountries.map((country) => {
                    const countryId = country.countryId || country.name;
                    return (
                      <div key={countryId} className="border-t pt-2">
                        <h5 className="font-medium">{country.name}</h5>
                        {selectedStates[country.name]?.length > 0 ? (
                          <div className="ml-4 mt-1 space-y-2">
                            {selectedStates[country.name].map((stateName) => {
                              const state = statesByCountry[countryId]?.find((s: State) => s.name === stateName);
                              return (
                                <div key={stateName}>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">{stateName}</p>
                                    <span
                                      className={`text-xs px-2 py-1 rounded ${state?.status === 1
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                      {state?.status === 1 ? "Page will be created" : "No page"}
                                    </span>
                                  </div>
                                  {selectedCities[stateName]?.length > 0 ? (
                                    <div className="ml-4">
                                      {selectedCities[stateName].map((city) => (
                                        <div key={city} className="mt-1">
                                          <p className="text-sm">{city}</p>
                                          {localAreas[city]?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 ml-4 mt-1">
                                              {localAreas[city].map((area) => (
                                                <Badge key={area.id} variant="outline" className="text-xs">
                                                  {area.name}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500 ml-4">No cities selected</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 ml-4">No states selected</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Choose How to Add Services</h3>
            <p className="text-gray-500">Select a method to add services to your project. You can either let our AI generate services automatically or input them manually.</p>
            
            {/* Display Selected Services */}
            {selectedServices.length > 0 && (
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-blue-900">
                    Selected Services ({selectedServices.length})
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedServices([]);
                      setHasGeneratedServices(false);
                      setLastSavedServiceNames("");
                    }}
                    className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedServices.map((service, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded border border-blue-200"
                    >
                      {service}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedServices(selectedServices.filter((_, i) => i !== index));
                        }}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                        title="Remove service"
                      >
                        <X className="h-3 w-3 text-blue-700" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: Generate AI-based Services */}
              <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  {React.createElement(Bot as any, { className: "h-8 w-8 text-blue-500" })}
                  <h4 className="text-lg font-semibold text-gray-800">Generate AI-based Services</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Let our AI analyze your project details (like project name, service type, and locations) and automatically generate relevant service titles tailored to your needs.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={async () => {
                      // Get projectId from state or localStorage
                      const currentProjectId = projectId || localStorage.getItem("lastCreateProjectId");
                      
                      if (!currentProjectId) {
                        toast({
                          title: "Error",
                          description: "Project ID is missing. Please complete previous steps first.",
                          variant: "destructive",
                        });
                        return;
                      }

                      const aiResult = await handleAiServiceCount();
                      if (aiResult.isDismissed) return;

                      const servicesCount = Number(aiResult.value);
                      if (isNaN(servicesCount) || servicesCount < 1) {
                        toast({
                          title: "Error",
                          description: "Please enter a valid number of services (minimum 1).",
                          variant: "destructive",
                        });
                        return;
                      }

                      setSubmitting(true);
                      try {
                        const token = localStorage.getItem("token");
                        // 1) Preview names via backend AI (no DB write)
                        const preview = await httpFile.post(
                          "/genrateAiProjectServices",
                          { projectId: currentProjectId, count: servicesCount },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        const aiNames: string[] = Array.isArray(preview.data?.services) ? preview.data.services : [];
                        if (!aiNames.length) {
                          toast({ title: "No Services", description: "AI did not return any service names", variant: "destructive" });
                          setSubmitting(false);
                          return;
                        }

                        // 2) Show review dialog
                        setAIGeneratedServices(aiNames);
                        setShowAIServicesReview(true);
                        setSubmitting(false);
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.response?.data?.message || "An error occurred while generating services!",
                          variant: "destructive",
                        });
                        setSubmitting(false);
                      }
                    }}
                    disabled={submitting}
                  >
                    {submitting ? "Generating..." : hasGeneratedServices ? "Regenerate" : "Generate AI Services"}
                  </Button>
                  {hasGeneratedServices && (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                      onClick={async () => {
                        // Get projectId from state or localStorage
                        const currentProjectId = projectId || localStorage.getItem("lastCreateProjectId");
                        
                        if (!currentProjectId) {
                          toast({
                            title: "Error",
                            description: "Project ID is missing. Please complete previous steps first.",
                            variant: "destructive",
                          });
                          return;
                        }

                        const aiResult = await handleAiServiceCount();
                        if (aiResult.isDismissed) return;

                        const servicesCount = Number(aiResult.value);
                        if (isNaN(servicesCount) || servicesCount < 1) {
                          toast({
                            title: "Error",
                            description: "Please enter a valid number of services (minimum 1).",
                            variant: "destructive",
                          });
                          return;
                        }

                        setSubmitting(true);
                        try {
                          const token = localStorage.getItem("token");
                          // Generate more services
                          const preview = await httpFile.post(
                            "/genrateAiProjectServices",
                            { projectId: currentProjectId, count: servicesCount },
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          const aiNames: string[] = Array.isArray(preview.data?.services) ? preview.data.services : [];
                          if (!aiNames.length) {
                            toast({ title: "No Services", description: "AI did not return any service names", variant: "destructive" });
                            setSubmitting(false);
                            return;
                          }

                          // Show review dialog to add more services
                          setAIGeneratedServices(aiNames);
                          setShowAIServicesReview(true);
                          setSubmitting(false);
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.response?.data?.message || "An error occurred while generating services!",
                            variant: "destructive",
                          });
                          setSubmitting(false);
                        }
                      }}
                      disabled={submitting}
                    >
                      Add More
                    </Button>
                  )}
                </div>
              </div>

              {/* Option 2: Generate Services Manually */}
              <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  {React.createElement(ClipboardList as any, { className: "h-8 w-8 text-green-500" })}
                  <h4 className="text-lg font-semibold text-gray-800">Generate Services Manually</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Take control by manually entering service titles that best represent your offerings. You can type each service name individually or upload an Excel file.
                </p>
                <Button
                  type="button"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleManualServiceEntry}
                  disabled={submitting}
                >
                  {submitting ? "Processing..." : "Add Services Manually"}
                </Button>
              </div>
            </div>
          </div>
        );
      case 8:
        // About us details
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Enter About Us Details</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {React.createElement(Mail as any, { className: "h-4 w-4 text-gray-500" })}
                  <Label htmlFor="aboutUsEmail">Email</Label>
                </div>
                <Input
                  id="aboutUsEmail"
                  type="email"
                  placeholder="Enter email"
                  value={aboutUsEmail}
                  onChange={(e) => setAboutUsEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {React.createElement(Phone as any, { className: "h-4 w-4 text-gray-500" })}
                  <Label htmlFor="aboutUsPhone">Phone</Label>
                </div>
                <Input
                  id="aboutUsPhone"
                  placeholder="Enter phone"
                  value={aboutUsPhone}
                  onChange={(e) => setAboutUsPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {React.createElement(MapPin as any, { className: "h-4 w-4 text-gray-500" })}
                  <Label htmlFor="aboutUsLocation">Main Location</Label>
                </div>
                <Input
                  id="aboutUsLocation"
                  placeholder="Enter main location"
                  value={aboutUsLocation}
                  onChange={(e) => setAboutUsLocation(e.target.value)}
                />
              </div>
            </div>
          </div>
        );


      case 9: {
        // Multicolor theme sub-colors (from website multicolor theme)
        const multicolorPalette = [
          { name: "crimson-jet", label: "Crimson Jet", hex: "#E11D48", accent: "#F59E0B" },
          { name: "indigo-sand", label: "Indigo Sand", hex: "#4F46E5", accent: "#EAB308" },
          { name: "saffron-charcoal", label: "Saffron Charcoal", hex: "#FDB022", accent: "#84CC16" },
          { name: "mint-slate", label: "Mint Slate", hex: "#22C55E", accent: "#60A5FA" },
          { name: "marine-teal", label: "Marine Teal", hex: "#0EA5A4", accent: "#A7F3D0" },
          { name: "royal-plum", label: "Royal Plum", hex: "#A855F7", accent: "#F59E0B" },
          { name: "electric-cobalt", label: "Electric Cobalt", hex: "#2563EB", accent: "#22D3EE" },
          { name: "copper-forest", label: "Copper Forest", hex: "#D97706", accent: "#34D399" },
          { name: "ruby-night", label: "Ruby Night", hex: "#DC2626", accent: "#FB923C" },
          { name: "citrus-navy", label: "Citrus Navy", hex: "#F59E0B", accent: "#10B981" },
        ];

        // Cleaning theme sub-colors (from website cleaning theme)
        const cleaningPalette = [
          { name: "Arctic Aurora", label: "Arctic Aurora", hex: "#06B6D4", accent: "#22C55E" },
          { name: "Desert Rose", label: "Desert Rose", hex: "#F43F5E", accent: "#F59E0B" },
          { name: "Graphite Neon", label: "Graphite Neon", hex: "#22D3EE", accent: "#A7F3D0" },
          { name: "Mocha Sky", label: "Mocha Sky", hex: "#8B5CF6", accent: "#F59E0B" },
          { name: "Sapphire Lime", label: "Sapphire Lime", hex: "#1D4ED8", accent: "#84CC16" },
          { name: "Ocean Breeze", label: "Ocean Breeze", hex: "#0EA5E9", accent: "#06B6D4" },
          { name: "Forest Emerald", label: "Forest Emerald", hex: "#10B981", accent: "#34D399" },
        ];

        const handleThemeSelect = (themeId: string) => {
          setSelectedTheme(themeId);
          // Reset subcolor when theme changes
          setSubcolor("");
        };

        // Generate preview URL from theme name - Same Logic as ThemeNew and ThemesManagement
        const getPreviewUrl = (themeName: string) => {
          if (!themeName) return '';
          
          // Normalize theme name to match website App.tsx logic
          const normalizedTheme = themeName.toLowerCase().trim();
          
          // Map theme names to valid theme types (same as website App.tsx)
          let themeParam = '';
          if (normalizedTheme === 'cleaning' || normalizedTheme.includes('cleaning')) {
            themeParam = 'cleaning';
          } else if (normalizedTheme === 'multicolor' || normalizedTheme === 'multi-color' || normalizedTheme.includes('multicolor') || normalizedTheme.includes('multi')) {
            themeParam = 'multicolor';
          } else {
            // If theme name doesn't match, use it as-is (lowercase, no spaces)
            themeParam = normalizedTheme.replace(/\s+/g, '-');
          }
          
          return `http://localhost:8081/?theme=${themeParam}`;
        };

        const selectedThemeData = themesFromApi.find(t => t.id === selectedTheme);
        
        // Determine which palette to show based on selected theme name
        const getPalette = () => {
          if (!selectedThemeData) return multicolorPalette;
          
          const themeName = selectedThemeData.name.toLowerCase();
          if (themeName.includes('multicolor') || themeName === 'multicolor') {
            return multicolorPalette;
          } else if (themeName.includes('cleaning') || themeName === 'cleaning') {
            return cleaningPalette;
          }
          // Default to multicolor if theme name doesn't match
          return multicolorPalette;
        };

        const palette = getPalette();

        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Choose Your Theme</h3>
              <p className="text-sm text-gray-600">
                Select a theme that best represents your brand. You can preview each theme before making your choice.
              </p>

              {themesLoading ? (
                <div className="text-sm text-muted-foreground">Loading themes…</div>
              ) : themesFromApi.length === 0 ? (
                <div className="text-sm text-muted-foreground">No active themes available.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {themesFromApi.map((theme) => (
                    <div
                      key={theme.id}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-lg ${selectedTheme === theme.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:border-gray-300'
                        }`}
                      onClick={() => handleThemeSelect(theme.id)}
                    >
                      <div className="relative">
                        <img
                          src={theme.preview}
                          alt={theme.name}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <Checkbox
                            checked={selectedTheme === theme.id}
                            onChange={() => handleThemeSelect(theme.id)}
                            className="bg-white"
                          />
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        <h4 className="font-medium text-sm">{theme.name}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(getPreviewUrl(theme.name), '_blank');
                          }}
                        >
                          Visit Demo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-accent picker (only if theme supports sub color) */}
              {selectedThemeData?.supportThemeSubColor && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Pick a Theme Color</h5>
                  <p className="text-xs text-gray-500 mb-3">
                    {selectedThemeData.name.toLowerCase().includes('multicolor') || selectedThemeData.name.toLowerCase() === 'multicolor'
                      ? "Choose from multicolor theme variations"
                      : "Choose from cleaning theme variations"}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {palette.map(c => (
                      <button
                        key={c.name}
                        onClick={() => setSubcolor(c.name)}
                        className={`
                          flex flex-col items-center p-3 rounded-lg border-2 transition-all
                          ${subcolor === c.name
                            ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50 scale-105"
                            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                          }
                        `}
                        aria-label={c.label || c.name}
                      >
                        <div className="flex gap-1 mb-2">
                          <div 
                            className="w-6 h-6 rounded-full ring-1 ring-gray-200"
                            style={{ backgroundColor: c.hex }}
                          />
                          {c.accent && (
                            <div 
                              className="w-6 h-6 rounded-full ring-1 ring-gray-200"
                              style={{ backgroundColor: c.accent }}
                            />
                          )}
                        </div>
                        <span className={`text-xs font-medium text-center ${subcolor === c.name ? 'text-blue-700' : 'text-gray-700'}`}>
                          {c.label || c.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Secondary color picker (only if theme supports secondary color) */}
              {selectedThemeData?.supportsSecondaryColor && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-md font-medium mb-3">Customize Theme Colors</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <Label htmlFor="themeSecondaryColor" className="text-sm min-w-0">
                        Secondary Color:
                      </Label>
                      <Input
                        type="color"
                        id="themeSecondaryColor"
                        value={themeSecondaryColor}
                        onChange={(e) => setThemeSecondaryColor(e.target.value)}
                        className="w-16 h-8"
                      />
                      <span className="text-xs text-gray-500 uppercase">{themeSecondaryColor}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      This color will be used for accents, highlights, and secondary elements in your theme.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }





      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Project Information";
      case 2: return "Country Selection";
      case 3: return "State Selection";
      case 4: return "City Selection";
      case 5: return "Local Area Selection";
      case 6: return "Preview";
      case 7: return serviceOption === "manual" ? "Manual Service Entry" : "AI Service Generation";
      case 8: return "About Us Details";
      case 9: return "Theme Selection";
      default: return "Project Creation";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Create New Project</h1>
      </div>

      {!showFinalSuccess && !isProcessing ? (
        <>
          {/* Progress Steps - Improved Design */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="relative">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${((step - 1) / 8) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Steps */}
                <div className="flex items-center justify-between relative">
                  {/* Step Indicators */}
                  {[
                    { num: 1, label: "Project Info", short: "Info", icon: Info },
                    { num: 2, label: "Countries", short: "Countries", icon: Globe },
                    { num: 3, label: "States", short: "States", icon: Map },
                    { num: 4, label: "Cities", short: "Cities", icon: Building2 },
                    { num: 5, label: "Local Areas", short: "Areas", icon: MapPin },
                    { num: 6, label: "Preview", short: "Preview", icon: Eye },
                    { num: 7, label: "Services", short: "Services", icon: Briefcase },
                    { num: 8, label: "About Us", short: "About", icon: Users },
                    { num: 9, label: "Theme", short: "Theme", icon: Palette },
                  ].map((stepInfo, index) => {
                    const isActive = step === stepInfo.num;
                    const isCompleted = step > stepInfo.num;
                    const isUpcoming = step < stepInfo.num;
                    const IconComponent = stepInfo.icon;
                    
                    return (
                      <div key={stepInfo.num} className="flex flex-col items-center flex-1 relative z-10">
                        {/* Step Circle */}
                        <div
                          className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                            isActive
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-110"
                              : isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {React.createElement(IconComponent as any, { className: "h-5 w-5" })}
                          {isActive && (
                            <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20" />
                          )}
                          {isCompleted && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              {React.createElement(Check as any, { className: "h-2.5 w-2.5 text-white" })}
                            </div>
                          )}
                        </div>
                        
                        {/* Step Label */}
                        <div className="mt-2 text-center">
                          <span
                            className={`text-xs font-medium block ${
                              isActive
                                ? "text-blue-600"
                                : isCompleted
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            <span className="hidden sm:inline">{stepInfo.label}</span>
                            <span className="sm:hidden">{stepInfo.short}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Current Step Info */}
                <div className="text-center pt-2 border-t">
                  <p className="text-sm text-gray-600">
                    Step <span className="font-semibold text-blue-600">{step}</span> of <span className="font-semibold">9</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {showSuccess && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  {React.createElement(Check as any, { className: "h-6 w-6 text-green-600" })}
                </div>
                <p className="text-lg font-medium">Project Created Successfully</p>
              </div>
            </div>
          )}



          <Card>
            <CardHeader>
              <CardTitle>{getStepTitle()}</CardTitle>
              <CardDescription>
                {step === 1 && "Enter the basic details for your new project."}
                {step === 2 && "Select the countries where your service will be available."}
                {step === 3 && "Select states or regions for your selected countries."}
                {step === 4 && "Select cities for your selected states."}
                {step === 5 && "Add local areas for your selected cities."}
                {step === 6 && "Review your project details before finalizing."}
                {step === 7 && serviceOption === "manual" && "Enter service names manually or upload a spreadsheet."}
                {step === 7 && serviceOption === "ai" && "Let our AI generate service suggestions for you."}
                {step === 8 && "Enter contact and location information for your business."}
                {step === 9 && "Choose a theme that best represents your brand and business."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderStep()}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackStep}
                disabled={step === 1 || submitting}
              >
                {React.createElement(ChevronLeft as any, { className: "mr-2 h-4 w-4" })}
                Back
              </Button>

              <div className="flex space-x-2">
                {step === 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                    disabled={submitting}
                  >
                    Skip
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading || submitting}
                  className={step === 9 && submitting ? "animate-pulse bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" : ""}
                >
                  {step < 9 ? (
                    <>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Next
                          {React.createElement(ChevronRight as any, { className: "ml-2 h-4 w-4" })}
                        </>
                      )}
                    </>
                  ) : (
                    submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        Create Project
                        {React.createElement(Wand2 as any, { className: "ml-2 h-4 w-4" })}
                      </>
                    )
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </>
      ) : isProcessing ? (
        <Card className="border-blue-500">
          <CardHeader className="bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
              <div>
                <CardTitle className="text-blue-700">Processing Project</CardTitle>
                <CardDescription className="text-blue-600">
                  Your project is being set up. This may take a few moments...
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{processingStatus}</span>
                  <span className="text-gray-500">{Math.round(processingProgress)}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              </div>

              {/* Time Information */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Elapsed: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s</span>
                </div>
                {estimatedTime > 0 && (
                  <div>
                    <span>Estimated: {Math.floor(estimatedTime / 60)}m {estimatedTime % 60}s</span>
                  </div>
                )}
              </div>

              {/* Status Steps */}
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className={`p-3 rounded-lg ${processingProgress > 10 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {processingProgress > 10 ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={`font-medium ${processingProgress > 10 ? 'text-green-700' : 'text-gray-500'}`}>
                      Structure Created
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${processingProgress > 50 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {processingProgress > 50 ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={`font-medium ${processingProgress > 50 ? 'text-green-700' : 'text-gray-500'}`}>
                      Content Generated
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${processingProgress === 100 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {processingProgress === 100 ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={`font-medium ${processingProgress === 100 ? 'text-green-700' : 'text-gray-500'}`}>
                      Project Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-500">
          <CardHeader className="bg-green-50 border-b border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                {React.createElement(Check as any, { className: "h-6 w-6 text-green-600" })}
              </div>
              <div>
                <CardTitle className="text-green-700">Success</CardTitle>
                <CardDescription className="text-green-600">
                  Your project has been successfully created and is now active!
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <p className="text-lg">
                Your project has been successfully created and is ready to use.
              </p>

              <div className="text-sm text-gray-500">
                Redirecting in <span className="font-bold">{redirectCounter}</span> seconds…
              </div>
              <Button
                onClick={handleRedirect}
                disabled={submitting}
              >
                Go to project listing page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Services Review Dialog */}
      <AIServicesReviewDialog
        open={showAIServicesReview}
        onOpenChange={setShowAIServicesReview}
        services={aiGeneratedServices}
        isLoading={submitting}
        isRegenerating={submitting}
        onRegenerate={async () => {
          // Get projectId from state or localStorage
          const currentProjectId = projectId || localStorage.getItem("lastCreateProjectId");
          
          if (!currentProjectId) {
            toast({
              title: "Error",
              description: "Project ID is missing. Please complete previous steps first.",
              variant: "destructive",
            });
            return;
          }

          const aiResult = await handleAiServiceCount();
          if (aiResult.isDismissed) return;

          const servicesCount = Number(aiResult.value);
          if (isNaN(servicesCount) || servicesCount < 1) {
            toast({
              title: "Error",
              description: "Please enter a valid number of services (minimum 1).",
              variant: "destructive",
            });
            return;
          }

          setSubmitting(true);
          try {
            const token = localStorage.getItem("token");
            // Regenerate AI services
            const preview = await httpFile.post(
              "/genrateAiProjectServices",
              { projectId: currentProjectId, count: servicesCount },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const aiNames: string[] = Array.isArray(preview.data?.services) ? preview.data.services : [];
            if (!aiNames.length) {
              toast({ title: "No Services", description: "AI did not return any service names", variant: "destructive" });
              setSubmitting(false);
              return;
            }

            // Update services in dialog
            setAIGeneratedServices(aiNames);
            setSubmitting(false);
          } catch (error: any) {
            toast({
              title: "Error",
              description: error.response?.data?.message || "An error occurred while regenerating services!",
              variant: "destructive",
            });
            setSubmitting(false);
          }
        }}
        onConfirm={async (servicesArray) => {
          setShowAIServicesReview(false);
          // Add services to step 7 display instead of going to next step
          // Merge with existing services (avoid duplicates)
          const existingServices = selectedServices;
          const newServices = servicesArray.filter(service => !existingServices.includes(service));
          const mergedServices = [...existingServices, ...newServices];
          setSelectedServices(mergedServices);
          setHasGeneratedServices(true);
          setLastSavedServiceOption("manual");
          setLastSavedServiceNames(mergedServices.join("\n"));
          toast({ 
            title: "Services Added", 
            description: `${newServices.length} new service(s) added! Total: ${mergedServices.length} service(s).` 
          });
        }}
      />
    </div>
  );
}
