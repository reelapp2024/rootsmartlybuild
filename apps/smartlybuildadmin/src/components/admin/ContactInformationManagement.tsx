import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../../config.js";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Contact, Loader2, Save } from "lucide-react";
import { Step5ContactInfo } from "./businesswebsiteSteps/Step5ContactInfo";
import {
  SOCIAL_PRESET_PLATFORMS,
  applyAboutUsToContactState,
  buildSocialLinksFromForm,
  emptyPresetSocialUrls,
  stableSocialLinksPayload,
  validateContactForm,
  type ContactValue,
  type CustomSocialLinkRow,
  type SocialPresetKey,
} from "./businesswebsiteSteps/contactInfoUtils";

type ContactInformationManagementProps = {
  projectId?: string;
};

export default function ContactInformationManagement({
  projectId: propProjectId,
}: ContactInformationManagementProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const projectId = propProjectId || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emails, setEmails] = useState<ContactValue[]>([{ value: "", is_primary: true }]);
  const [phones, setPhones] = useState<ContactValue[]>([{ value: "", is_primary: true }]);
  const [presetSocialUrls, setPresetSocialUrls] = useState<Record<SocialPresetKey, string>>(
    emptyPresetSocialUrls()
  );
  const [customSocialLinks, setCustomSocialLinks] = useState<CustomSocialLinkRow[]>([]);
  const [mainLocation, setMainLocation] = useState("");

  const [lastSavedEmails, setLastSavedEmails] = useState("");
  const [lastSavedPhones, setLastSavedPhones] = useState("");
  const [lastSavedSocialLinks, setLastSavedSocialLinks] = useState(() =>
    stableSocialLinksPayload([])
  );

  const resolveMainLocationFallback = useCallback(async (): Promise<string> => {
    if (mainLocation.trim()) return mainLocation.trim();
    try {
      const token = localStorage.getItem("token");
      const res = await http.get(`/businessWebsite/${projectId}/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rows = res.data?.data?.locations || [];
      const first = rows[0];
      return String(first?.areaName || first?.address || "").trim();
    } catch {
      return "";
    }
  }, [mainLocation, projectId]);

  const loadContact = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await http.get(`/businessWebsite/${projectId}/contact`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data;
      if (data) {
        const parsed = applyAboutUsToContactState(data);
        setEmails(parsed.emails);
        setPhones(parsed.phones);
        setPresetSocialUrls(parsed.presetSocialUrls);
        setCustomSocialLinks(parsed.customSocialLinks);
        setMainLocation(parsed.mainLocation);
        setLastSavedEmails(JSON.stringify(parsed.emails));
        setLastSavedPhones(JSON.stringify(parsed.phones));
        setLastSavedSocialLinks(
          stableSocialLinksPayload(
            buildSocialLinksFromForm(parsed.presetSocialUrls, parsed.customSocialLinks)
          )
        );
      }
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        toast({
          title: "Load failed",
          description: error?.response?.data?.message || "Failed to load contact information",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadContact();
  }, [loadContact]);

  const updateContactValue = (type: "email" | "phone", index: number, value: string) => {
    if (type === "email") {
      setEmails((prev) => prev.map((item, i) => (i === index ? { ...item, value } : item)));
      return;
    }
    setPhones((prev) => prev.map((item, i) => (i === index ? { ...item, value } : item)));
  };

  const setPrimaryContact = (type: "email" | "phone", index: number) => {
    if (type === "email") {
      setEmails((prev) => prev.map((item, i) => ({ ...item, is_primary: i === index })));
      return;
    }
    setPhones((prev) => prev.map((item, i) => ({ ...item, is_primary: i === index })));
  };

  const addContactField = (type: "email" | "phone") => {
    if (type === "email") {
      setEmails((prev) => [...prev, { value: "", is_primary: prev.length === 0 }]);
      return;
    }
    setPhones((prev) => [...prev, { value: "", is_primary: prev.length === 0 }]);
  };

  const removeContactField = (type: "email" | "phone", index: number) => {
    if (type === "email") {
      setEmails((prev) => {
        const next = prev.filter((_, i) => i !== index);
        if (next.length === 0) return [{ value: "", is_primary: true }];
        if (!next.some((item) => item.is_primary)) next[0].is_primary = true;
        return next;
      });
      return;
    }
    setPhones((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) return [{ value: "", is_primary: true }];
      if (!next.some((item) => item.is_primary)) next[0].is_primary = true;
      return next;
    });
  };

  const handleSave = async () => {
    const validationError = validateContactForm({
      emails,
      phones,
      presetSocialUrls,
      customSocialLinks,
    });
    if (validationError) {
      toast({
        title: "Validation error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    const normalizedEmails = emails
      .map((item) => ({ ...item, value: item.value.trim() }))
      .filter((item) => item.value);
    const normalizedPhones = phones
      .map((item) => ({ ...item, value: item.value.trim() }))
      .filter((item) => item.value);
    const normalizedSocialLinks = buildSocialLinksFromForm(presetSocialUrls, customSocialLinks);
    const socialLinksSignature = stableSocialLinksPayload(normalizedSocialLinks);

    const hasContactChanged =
      JSON.stringify(normalizedEmails) !== lastSavedEmails ||
      JSON.stringify(normalizedPhones) !== lastSavedPhones ||
      socialLinksSignature !== lastSavedSocialLinks;

    if (!hasContactChanged) {
      toast({
        title: "No changes",
        description: "No contact changes to save.",
      });
      return;
    }

    setSaving(true);
    try {
      const admin = JSON.parse(localStorage.getItem("adminProfile") || "{}");
      const locationLabel = await resolveMainLocationFallback();
      const primaryEmail =
        normalizedEmails.find((item) => item.is_primary)?.value ||
        normalizedEmails[0]?.value ||
        "";
      const primaryPhone =
        normalizedPhones.find((item) => item.is_primary)?.value ||
        normalizedPhones[0]?.value ||
        "";

      const token = localStorage.getItem("token");
      const res = await http.put(
        `/businessWebsite/${projectId}/contact`,
        {
          userId: admin._id,
          projectId,
          email: primaryEmail,
          phone: primaryPhone,
          emails: normalizedEmails,
          phones: normalizedPhones,
          address: locationLabel,
          mainLocation: locationLabel,
          socialLinks: normalizedSocialLinks,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if ([200, 201, 204].includes(res.status)) {
        toast({
          title: "Settings updated",
          description: "Contact information saved successfully.",
        });
        setLastSavedEmails(JSON.stringify(normalizedEmails));
        setLastSavedPhones(JSON.stringify(normalizedPhones));
        setLastSavedSocialLinks(socialLinksSignature);
        if (locationLabel) setMainLocation(locationLabel);
      } else {
        throw new Error("Failed to save contact information");
      }
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error?.response?.data?.message || "Failed to save contact information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!projectId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Open this page from a project dashboard to manage contact information.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 font-poppins max-w-4xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 mt-0.5"
            onClick={() => navigate(`/admin/projects/${projectId}/dashboard`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Contact className="h-7 w-7 text-blue-600" />
              Contact Information
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage emails, phone numbers, and social links shown across your business website —
              header, footer, contact page, and CTAs.
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 shrink-0"
          onClick={handleSave}
          disabled={loading || saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save changes
            </>
          )}
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-16 flex items-center justify-center text-gray-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading contact information…
          </CardContent>
        </Card>
      ) : (
        <Step5ContactInfo
          title="Contact details"
          description="Primary email and phone are used in site headers, footers, and call-to-action sections. Social links are optional."
          emails={emails}
          phones={phones}
          addContactField={addContactField}
          updateContactValue={updateContactValue}
          setPrimaryContact={setPrimaryContact}
          removeContactField={removeContactField}
          socialPlatforms={SOCIAL_PRESET_PLATFORMS}
          presetSocialUrls={presetSocialUrls}
          setPresetSocialUrls={setPresetSocialUrls}
          customSocialLinks={customSocialLinks}
          setCustomSocialLinks={setCustomSocialLinks}
        />
      )}
    </div>
  );
}
