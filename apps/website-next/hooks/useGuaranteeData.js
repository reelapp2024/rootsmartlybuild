
import { useMySiteData } from './useMySiteData';

export const useGuaranteeData = () => {
  const { data, isLoading, error } = useMySiteData({
    pageType: "home",
    reqFrom: "Guarantees"
  });

  return {
    guarantees: data?.projectInfo?.ourGuaranteeSection || [],
    guaranteeText: data?.projectInfo?.ourGuaranteeText || "",
    promiseLine: data?.projectInfo?.promiseLine || "",
    projectCategory: data?.projectInfo?.serviceType || "",
    isLoading,
    error
  };
};








