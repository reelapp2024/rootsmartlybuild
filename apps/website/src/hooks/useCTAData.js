
import { useMySiteData } from './useMySiteData.js';

export const useCTAData = () => {
  const { data, isLoading, error } = useMySiteData({
    pageType: "home",
    reqFrom: "CTA"
  });

  return {
    phoneNumber: data?.aboutUs?.phone || "",
    CTA: data?.projectInfo?.callToAction || "",
    projectCategory: data?.projectInfo?.serviceType || "",
    isLoading,
    error
  };
};
