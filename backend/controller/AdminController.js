const User = require("../models/users")
const fs = require('fs-extra');
const { Readable } = require('stream');
const path = require('path');
const unzipper = require('unzipper');
const archiver = require('archiver');
const { EJSON } = require('bson');
const ftp = require('basic-ftp'); // ✅ Required for FTP connections
const SftpClient = require('ssh2-sftp-client'); // ✅ Required for SSH/SFTP
const { deployReactApp } = require('../additional/deployHelper');  // legacy React (deprecated)
const { deployNextStaticApp } = require('../additional/deployNextStaticApp');
const {
    buildKeyForProject,
    readStaticBuildStatus,
    writeStaticBuildStatus,
} = require('../additional/staticBuildStatus');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { isValidObjectId, Types } = mongoose;
const { Client } = require('@googlemaps/google-maps-services-js');
const client = new Client();
const helper = require("../additional/addon");
const generateImages=require("../additional/imageProviderHelper")
const { stripLegacyImagePromptFields } = require("../sections/sectionImagePrompts");
const { coerceFaqSectionPayload } = require("../sections/_shared/faqAnswerGuards");
const {
    attachGeneratedImagesToSectionData,
} = require("../additional/sectionImageGenerationHelper");
const { parseSectionOrigin } = require("../imageengines");
const Users = require("../models/users")
const UserSiteContent = require('../models/UserSiteContent');
const userProjects = require("../models/userProjects");
const Blog = require("../models/blogs")
// at top of file
const SectionOrder = require('../models/SectionOrder');
const ThemeData = require("../models/themeData")
const Theme = require("../models/Theme")
const UserProject = require('../models/userProjects'); // Import UserProject model
const Country = require("../models/adminCountires")
const State = require("../models/adminStates");
const City = require("../models/adminCities");
const Author = require("../models/authors")
const { normalizeAuthorLinks } = require("../additional/authorLinks");
const AdminLocalArea = require('../models/adminLocalAreas'); // add this alongside your other model imports
const BusinessLocation = require('../models/businessLocation');
const WebsiteSection = require("../models/websiteSections");
const AboutUs = require("../models/aboutus");
const {
    getSeoForWebsitePage,
    upsertWebsitePageSeo,
    generatePageSeoWithAI,
    generateMissingSeoForAllProjectPages,
    seoEntryToLegacyApi,
    seoEntryToGeniebuild,
    geniebuildToSeoEntry,
    pickSeoFields,
    getActiveSeoFromPage,
    pageUrlFromPage,
    findWebsitePageByPublicUrl,
    upsertPageSeoSchema,
    deletePageSeoSchema,
    setPageSeoSchemaEnabled,
    regeneratePageSeoSchemas,
} = require("../services/pageSeoService")
const ThemeSetting = require("../models/themeSettings")
const ProjectDeployment = require("../models/ProjectDeployment");
const Slug = require("../models/slug")
const SiteHeaderFooter = require("../models/siteHeaderFooter")
const WebsitePage = require("../models/WebsitePage")
const PageSlugRedirect = require("../models/PageSlugRedirect")
const {
    normalizeSlugInput,
    assertSlugAvailable,
    getPageSlugHistory,
    updateHeaderFooterMenuUrls,
    updateExistingWebsitePage,
    attachServicePageLinksToGridItems,
} = require("../services/pageSlugService")
const {
    enrichHeaderFooterDocument,
    applyHeaderFooterDynamicsToSections,
    applyContactDynamicsToAllSections,
    buildNavSources,
    buildDefaultSiteMenu,
    mergeMenuWithNavSources,
    sortMenuByOrder,
    normalizeFooterLayout,
    syncLegacyMenuFromFooterLayout,
    prepareDefaultHeaderFooterPayload,
    rebuildProjectHeaderFooterMenus,
} = require("../services/headerFooterService")
const {
    mergeFooterLayoutIntoSettings,
    buildFooterLayoutFromDefaultMenu,
    buildPagesByIdMap,
    applyPageUrlsToFooterLayout,
} = require("../services/footerLayoutConfig")
const {
    syncHeaderFooterSectionsForProject,
} = require("../services/headerFooterSectionSync")
const { resolveThemeColorsForApi, buildBlogEditorThemePayload } = require("../utils/themeResolverBridge");
const { getResponseFromOpenAI } = require("../openAi/openAi")
const { trackCreditsUsage } = require("../additional/openaiHelpers");


const SectionContent = require("../models/SectionContent");
const secretKey = process.env.JWT_SECRET
const HostingConnection = require('../models/HostingConnection');
const ProjectCategory = require("../models/ProjectCategory");
const SubCategory = require("../models/SubCategory");
const MicroCategory = require("../models/MicroCategory");
const CreditWallet = require("../models/CreditWallet");
const CreditTransaction = require("../models/CreditTransaction");

const WebsiteComponent = require("../models/WebsiteComponent");
const WebsiteDesignsData = require("../models/WebsiteDesignsData");
const WebsiteElement = require("../models/WebsiteElement");
const BuilderElement = require("../models/BuilderElement");

// Helper function to ensure page exists in WebsiteDesignsData
async function ensurePageInDesignData(projectId, pageId) {
    try {
        // Find or create WebsiteDesignsData for this project
        let designData = await WebsiteDesignsData.findOne({ projectId });

        if (!designData) {
            // Get userId from project
            const project = await userProjects.findById(projectId);
            if (!project) {
                console.error('[ensurePageInDesignData] Project not found:', projectId);
                return;
            }

            // Create new WebsiteDesignsData with default values
            designData = new WebsiteDesignsData({
                projectId: projectId,
                userId: project.userId || project.user,
                schemaVersion: 2,
                pages: []
            });
        }

        // Check if page already exists in pages array
        const pageExists = designData.pages.some(
            p => p.pageId && p.pageId.toString() === pageId.toString()
        );

        if (!pageExists) {
            // Add page to pages array
            designData.pages.push({
                pageId: pageId,
                pageStyles: {},
                sectionLayout: [],
                sections: ensureHeaderFooterComponents([])
            });
            await designData.save();
            console.log('[ensurePageInDesignData] Page added to WebsiteDesignsData:', pageId);
        } else {
            console.log('[ensurePageInDesignData] Page already exists in WebsiteDesignsData:', pageId);
        }
    } catch (error) {
        console.error('[ensurePageInDesignData] Error:', error);
        // Don't throw - this is a helper function, we don't want to break the main flow
    }
}

/**
 * Recover designData.pages entries wiped by legacy single-page GenieBuild saves.
 * Rebuilds stubs from SectionContent so template pages (about/services/…) stay editable
 * and getWebsiteDesignData can resolve them without falling back incorrectly.
 */
async function repairDesignPagesFromSectionContent(projectId) {
    try {
        const designData = await WebsiteDesignsData.findOne({ projectId });
        if (!designData) return null;

        const [websitePages, contentDocs] = await Promise.all([
            WebsitePage.find({ projectId }).select("_id name pageType slug").lean(),
            SectionContent.find({
                projectId,
                isDeleted: { $ne: true },
            })
                .select("pageId sectionId")
                .lean(),
        ]);

        const sectionsByPage = new Map();
        for (const doc of contentDocs || []) {
            const pid = String(doc?.pageId || "").trim();
            const sid = String(doc?.sectionId || "").toLowerCase().trim();
            if (!pid || !sid) continue;
            if (sid === "service_sections" || sid.startsWith("service_sections.")) continue;
            if (!sectionsByPage.has(pid)) sectionsByPage.set(pid, new Set());
            sectionsByPage.get(pid).add(sid);
        }

        const pageHasContent = (page) => {
            const entries = getSectionEntriesFromPage(page);
            return entries.some((e) => {
                const t = String(e?.sectionType || "").toLowerCase().trim();
                return t && t !== "header" && t !== "navbar" && t !== "footer";
            });
        };

        // Prefer homepage header/footer for rebuilt stubs
        const homepageMeta = (websitePages || []).find((p) => {
            const slug = String(p?.slug || "").trim().replace(/^\/+|\/+$/g, "").toLowerCase();
            return String(p?.pageType || "") === "default" && (slug === "" || slug === "home");
        });
        const homepageDesign = homepageMeta
            ? (designData.pages || []).find(
                (p) => String(p?.pageId?._id || p?.pageId || "") === String(homepageMeta._id)
            )
            : (designData.pages || [])[0];
        const homepageSections = getSectionEntriesFromPage(homepageDesign || {}).map((e) => e.compData);
        const headerComp = homepageSections.find((c) => {
            const t = String(c?.sectionData?.type || "").toLowerCase();
            return t === "header" || t === "navbar";
        });
        const footerComp = homepageSections.find(
            (c) => String(c?.sectionData?.type || "").toLowerCase() === "footer"
        );

        let changed = false;
        for (const wp of websitePages || []) {
            const pid = String(wp._id);
            const sectionIds = [...(sectionsByPage.get(pid) || [])].filter(
                (s) => s !== "header" && s !== "navbar" && s !== "footer"
            );
            if (!sectionIds.length) continue;

            const idx = (designData.pages || []).findIndex(
                (p) => String(p?.pageId?._id || p?.pageId || "") === pid
            );
            if (idx >= 0 && pageHasContent(designData.pages[idx])) continue;

            const middle = sectionIds.map((type) => ({
                variant_uniqueId: "Default",
                uniqueId: "Default",
                componentId: null,
                sectionData: {
                    type,
                    content: {},
                    styles: {},
                    contentRef: {
                        scope: "page",
                        sectionId: type,
                        pageId: pid,
                    },
                },
            }));
            const rebuilt = ensureHeaderFooterComponents(
                [headerComp, ...middle, footerComp].filter(Boolean)
            );

            if (idx >= 0) {
                assignPageSections(designData.pages[idx], rebuilt);
            } else {
                designData.pages.push({
                    pageId: wp._id,
                    pageStyles: {},
                    sectionLayout: [],
                    sections: rebuilt,
                });
            }
            changed = true;
        }

        if (changed) {
            designData.markModified("pages");
            await designData.save();
            console.log("[repairDesignPagesFromSectionContent] Restored missing design pages", {
                projectId: String(projectId),
                totalPages: designData.pages.length,
            });
        }
        return designData;
    } catch (error) {
        console.error("[repairDesignPagesFromSectionContent] Error:", error);
        return null;
    }
}
const {
    fetchJSONFromOpenAI,
    fetchStringFromOpenAI,
    fetchSeoContentForPage,
    getResponseFromOpenAITracked
} = require('../additional/openaiHelpers');
const resolveSectionFile = require('../sections/resolveSectionFile');

const {
    testFTPConnection,
    testSSHConnection,
    testCpanelConnection,
    uploadFolderFTP,
    uploadFolderSFTP,
    uploadToCPanel,
    uploadFolderCPanel,
    uploadFileCPanel

} = require('../additional/connectionHelpers');


const redisQueue = require("../queue/redisQueue");
const generateServiceDescQueue = require("../queue/redisServiceDesc")
const addNewServicesQueue = require("../queue/addNewServicesQueue")
const Service = require("../models/service")
const Notification = require("../models/notification")

const axios = require('axios');
const { json } = require("express");
const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;
const slugify = require("../additional/slugify");
const {
    buildBusinessLocationPathMap,
    resolveLocationPageHref,
} = require("../additional/businessLocationPaths");

const projectBackgroundQueue = require("../queue/projectBackgroundQueue");
const redislatlngqueueQueue = require("../queue/queuelatlng")
const { sectionGenerationQueue, enqueueSectionGeneration } = require("../queue/sectionGeneration.queue");
const {
    getLiveProgressMap,
    getLiveProgress,
    getDefaultParallelWorkers,
    normalizeProgress,
} = require("../services/sectionGenerationProgress");
const {
    getSectionResolver,
    isServiceBundleSection
} = require("../additional/sectionResolverRegistry");
const {
    buildServiceRenderSections,
    sortSectionObjectsByCanonicalOrder,
    applyCanonicalSectionOrderToPageSections,
    resolveCanonicalPageKey,
} = require("../additional/siteSectionOrder.cjs");

function ensureHeaderFooterComponents(componentIds = []) {
    const list = Array.isArray(componentIds) ? [...componentIds] : [];
    const normalized = list.filter(Boolean);

    const isHeader = (comp) => {
        const t = String(comp?.sectionData?.type || "").toLowerCase();
        return t === "header" || t === "navbar";
    };
    const isFooter = (comp) => String(comp?.sectionData?.type || "").toLowerCase() === "footer";

    let headerComp =
        normalized.find((c) => String(c?.sectionData?.type || "").toLowerCase() === "header") ||
        normalized.find((c) => String(c?.sectionData?.type || "").toLowerCase() === "navbar");
    let footerComp = normalized.find(isFooter);

    if (!headerComp) {
        headerComp = {
            variant_uniqueId: "HeaderPlumbing",
            componentId: null,
            sectionData: { type: "header", content: {}, styles: { variant: "HeaderPlumbing" } },
        };
    } else if (String(headerComp.sectionData?.type || "").toLowerCase() === "navbar") {
        headerComp = {
            ...headerComp,
            sectionData: { ...headerComp.sectionData, type: "header" },
        };
    }

    if (!footerComp) {
        footerComp = {
            variant_uniqueId: "FooterPlumbing",
            componentId: null,
            sectionData: { type: "footer", content: {}, styles: { variant: "FooterPlumbing" } },
        };
    }

    const middle = normalized.filter((comp) => !isHeader(comp) && !isFooter(comp));
    return [headerComp, ...middle, footerComp];
}

function getPageSections(page = {}) {
    if (Array.isArray(page?.sections)) return page.sections;
    if (Array.isArray(page?.componentIds)) return page.componentIds;
    return [];
}

function assignPageSections(page = {}, sections = []) {
    const normalized = ensureHeaderFooterComponents(sections || []).map((sec, idx) => {
        const next = { ...sec, order: idx + 1 };
        if (!Array.isArray(next.elementIds) || next.elementIds.length === 0) delete next.elementIds;
        if (next.sectionData && typeof next.sectionData === "object") {
            if (!Array.isArray(next.sectionData.elements) || next.sectionData.elements.length === 0) {
                delete next.sectionData.elements;
            }
            if (next.sectionData.contentRef && typeof next.sectionData.contentRef === "object") {
                delete next.sectionData.contentRef.locationIds;
            }
        }
        return next;
    });
    page.sections = normalized;
    page.sectionLayout = normalized.map((s, idx) => ({
        order: idx + 1,
        sectionId: String(
            s?.sectionData?.id ||
            s?.id ||
            s?._id ||
            s?.uniqueId ||
            s?.variant_uniqueId ||
            `${String(s?.sectionData?.type || "section").toLowerCase()}-${idx + 1}`
        )
    }));
    if (Object.prototype.hasOwnProperty.call(page, "componentIds")) {
        delete page.componentIds;
    }
    return page;
}

async function upsertSectionContentRecord({
    projectId,
    pageId,
    serviceId = null,
    sectionId,
    locationId = null,
    data = {},
    meta = {},
}) {
    if (!projectId || !pageId || !sectionId) return;
    const normalizedPageId = normalizeMixedIdForStorage(pageId);
    const pageIdCandidates = buildMixedIdCandidates(pageId);
    const normalizedSectionId = normalizeSectionIdForStorage(sectionId);
    if (!isMeaningfulSectionData(data)) {
        const existing = await SectionContent.findOne({
            projectId,
            ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
            serviceId,
            sectionId: normalizedSectionId,
            locationId,
            isDeleted: { $ne: true }
        }).select("_id status").lean();
        if (!existing) {
            const pendingDoc = await SectionContent.findOneAndUpdate(
                {
                    projectId,
                    ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
                    serviceId,
                    sectionId: normalizedSectionId,
                    locationId,
                    isDeleted: { $ne: true }
                },
                {
                    $set: {
                        pageId: normalizedPageId,
                        data: {},
                        status: "pending",
                        error: null,
                        isDeleted: false,
                        meta,
                        serviceId
                    }
                },
                { upsert: true, new: true }
            );
            logSectionContentWrite("saved", {
                projectId,
                pageId,
                sectionId: normalizedSectionId,
                locationId,
                source: `${meta?.source || "unknown"}:pending-placeholder`
            });
            return pendingDoc;
        }
        logSectionContentWrite("skipped-empty", { projectId, pageId, sectionId, locationId, source: meta?.source || "unknown" });
        return existing;
    }
    const sanitizedData = sanitizeSectionDataForStorage(sectionId, data);
    const doc = await SectionContent.findOneAndUpdate(
        {
            projectId,
            ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
            serviceId,
            sectionId: normalizedSectionId,
            locationId,
            isDeleted: { $ne: true }
        },
        {
            $set: {
                pageId: normalizedPageId,
                data: sanitizedData,
                status: "generated",
                error: null,
                isDeleted: false,
                meta,
                serviceId
            }
        },
        { upsert: true, new: true }
    );
    try {
        const scopeRows = await SectionContent.find({
            projectId,
            ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
            serviceId,
            sectionId: normalizedSectionId,
            locationId,
            isDeleted: { $ne: true }
        }).select("_id updatedAt").sort({ updatedAt: -1, _id: -1 }).lean();
        if (scopeRows.length > 1) {
            const staleIds = scopeRows.slice(1).map((r) => r._id);
            if (staleIds.length) await SectionContent.deleteMany({ _id: { $in: staleIds } });
        }
    } catch (_e) { }
    logSectionContentWrite("saved", { projectId, pageId, sectionId, locationId, source: meta?.source || "unknown" });
    return doc;
}

async function upsertServiceBundleSectionRecord({
    projectId,
    serviceId,
    locationId = null,
    sectionId,
    data = {},
    meta = {},
}) {
    if (!projectId || !serviceId || !sectionId) return null;
    if (!isMeaningfulSectionData(data)) {
        const sectionKey = normalizeSectionIdForStorage(sectionId);
        const bundleDoc = await SectionContent.findOne({
            projectId,
            pageId: serviceId,
            serviceId,
            sectionId: "service_sections",
            locationId,
            isDeleted: { $ne: true }
        }).select("_id").lean();
        if (!bundleDoc) {
            const pendingDoc = await SectionContent.findOneAndUpdate(
                {
                    projectId,
                    pageId: serviceId,
                    serviceId,
                    sectionId: "service_sections",
                    locationId,
                    isDeleted: { $ne: true }
                },
                {
                    $set: {
                        [`data.sections.${sectionKey}`]: {},
                        "data.serviceId": serviceId,
                        "data.locationId": locationId,
                        status: "pending",
                        error: null,
                        isDeleted: false,
                        meta
                    }
                },
                { upsert: true, new: true }
            );
            logSectionContentWrite("saved", {
                projectId,
                pageId: serviceId,
                sectionId: `service_sections.${sectionKey}`,
                locationId,
                source: `${meta?.source || "unknown"}:pending-placeholder`
            });
            return pendingDoc;
        }
        logSectionContentWrite("skipped-empty", { projectId, pageId: serviceId, sectionId, locationId, source: meta?.source || "unknown" });
        return null;
    }
    const sanitizedData = sanitizeSectionDataForStorage(sectionId, data);
    const doc = await SectionContent.findOneAndUpdate(
        {
            projectId,
            pageId: serviceId,
            serviceId,
            sectionId: "service_sections",
            locationId,
            isDeleted: { $ne: true }
        },
        {
            $set: {
                [`data.sections.${String(sectionId).toLowerCase().trim()}`]: sanitizedData,
                "data.serviceId": serviceId,
                "data.locationId": locationId,
                status: "generated",
                error: null,
                isDeleted: false,
                meta
            }
        },
        { upsert: true, new: true }
    );
    logSectionContentWrite("saved", { projectId, pageId: serviceId, sectionId: `service_sections.${sectionId}`, locationId, source: meta?.source || "unknown" });
    return doc;
}

function buildAreaItemsFromLocations({
    allLocations = [],
    pageMeta = {},
    websitePages = [],
    projectType = 1,
}) {
    const safeLocations = Array.isArray(allLocations) ? allLocations : [];
    const isBulkProject = Number(projectType) === 0;
    const { getScopedAreaLocations } = require("../services/locationContentScope");

    const pageLocationSlugById = new Map();
    (Array.isArray(websitePages) ? websitePages : []).forEach((p) => {
        if (!p?.locationId) return;
        if (p?.isPublished === false) return;
        // Areas pills should route to location landing pages, not service pages.
        if (String(p?.pageType || "").toLowerCase().trim() === "service") return;
        const slug = String(p?.slug || "").trim().replace(/^\/+/, "");
        if (!slug) return;
        pageLocationSlugById.set(String(p.locationId), `/${slug}`);
    });
    const pathByLocationId = buildBusinessLocationPathMap(safeLocations);

    const currentLocationId = pageMeta?.locationId ? String(pageMeta.locationId) : null;
    const onHomepage = isHomepageMeta(pageMeta);

    const scopedLocations = getScopedAreaLocations({
        allLocations: safeLocations,
        projectType: isBulkProject ? 0 : 1,
        scopeLocationId: onHomepage ? null : currentLocationId,
        onHomepage,
    });

    const seen = new Set();
    const unique = [];
    for (const loc of scopedLocations) {
        const locId = String(loc?._id || "");
        const name = String(loc?.areaName || "").trim();
        if (!locId || !name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push({
            id: locId,
            title: name,
            link: resolveLocationPageHref(locId, pageLocationSlugById, pathByLocationId),
        });
    }

    return unique.slice(0, 24).map((item, idx) => ({
        id: `area-${idx + 1}`,
        locationId: item.id,
        title: item.title,
        link: item.link,
    }));
}

function titleCaseWords(value = "") {
    return String(value || "")
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

/**
 * Merge location-scoped SectionContent (OpenAI grid copy) with bundle-derived
 * structural fields (links, images). Saved card descriptions win when present.
 */
function mergeServicesGridWithBundle(savedContent = {}, bundleContent = {}) {
    const savedItems = Array.isArray(savedContent?.items) ? savedContent.items : [];
    const bundleItems = Array.isArray(bundleContent?.items) ? bundleContent.items : [];
    const bundleByServiceId = new Map();
    for (const it of bundleItems) {
        const sid = String(it?.serviceId || "").trim();
        if (sid) bundleByServiceId.set(sid, it);
    }

    console.log("[mergeServicesGridWithBundle] input:", {
        savedItemsCount: savedItems.length,
        bundleItemsCount: bundleItems.length,
        bundleServiceIds: Array.from(bundleByServiceId.keys()),
    });

    let mergedItems;
    if (savedItems.length > 0) {
        mergedItems = savedItems.map((saved, idx) => {
            const sid = String(saved?.serviceId || "").trim();
            const bundle = (sid && bundleByServiceId.get(sid)) || bundleItems[idx] || {};
            const savedDesc = String(saved?.description || "").trim();
            const bundleDesc = String(bundle?.description || "").trim();
            // Bundle description (from aboutservice.about_service) takes priority
            // since it's AI-generated and location-specific
            console.log(`[mergeServicesGridWithBundle] item[${idx}] serviceId=${sid} savedDesc=${savedDesc ? "YES" : "NO"} bundleDesc=${bundleDesc ? "YES" : "NO"} using=${bundleDesc ? "BUNDLE" : "SAVED"}`);
            const pickLink = (...candidates) => {
                for (const c of candidates) {
                    const s = String(c || "").trim();
                    if (!s || s === "#") continue;
                    // Listing path is not a service detail URL.
                    if (s === "/services" || s.toLowerCase() === "services") continue;
                    return s;
                }
                return "#";
            };
            // Prefer live WebsitePage links from the bundle over stale saved "#" links.
            const mergedLink = pickLink(bundle.link, bundle.href, saved.link, saved.href);
            return {
                ...bundle,
                ...saved,
                id: saved.id || bundle.id || `service-${idx + 1}`,
                serviceId: sid || String(bundle.serviceId || ""),
                title: bundleDesc ? (bundle.title || saved.title || "").trim() : (saved.title || bundle.title || "").trim(),
                description: bundleDesc || savedDesc,
                link: mergedLink,
                href: mergedLink,
                pageId: bundle.pageId || saved.pageId || null,
                slug: bundle.slug || saved.slug || "",
                imageUrl: String(bundle.imageUrl || saved.imageUrl || "").trim(),
                icon: saved.icon || bundle.icon,
                locationId:
                    bundle.locationId != null && bundle.locationId !== ""
                        ? bundle.locationId
                        : saved.locationId,
            };
        });
    } else {
        console.log("[mergeServicesGridWithBundle] no saved items, using bundle items directly");
        mergedItems = bundleItems;
    }

    const hasSavedHeader = Boolean(
        String(savedContent?.badgeText || "").trim() ||
            String(savedContent?.title || savedContent?.heading || "").trim() ||
            String(savedContent?.subtitle || savedContent?.descriptionText || "").trim() ||
            String(savedContent?.description || "").trim()
    );

    return {
        ...bundleContent,
        ...savedContent,
        badgeText: hasSavedHeader
            ? savedContent.badgeText || bundleContent.badgeText
            : bundleContent.badgeText,
        title: hasSavedHeader
            ? savedContent.title || savedContent.heading || bundleContent.title
            : bundleContent.title,
        heading: hasSavedHeader
            ? savedContent.heading || savedContent.title || bundleContent.heading || bundleContent.title
            : bundleContent.heading || bundleContent.title,
        subtitle: hasSavedHeader
            ? savedContent.subtitle || savedContent.descriptionText || bundleContent.subtitle
            : bundleContent.subtitle,
        description: hasSavedHeader
            ? savedContent.description || savedContent.subtitle || bundleContent.description
            : bundleContent.description,
        items: mergedItems,
    };
}

async function buildServicesGridContentFromBundle({ projectId, locationId = null, businessLocations = [], projectType = 1 }) {
    const allServices = await Service.find({ projectId })
        .select("_id name slug")
        .lean();
    if (!allServices.length) return null;

    const parents = (businessLocations || []).filter((loc) => Number(loc?.type) === 0);
    const firstParentLocation =
        parents.sort((a, b) => String(a?._id || "").localeCompare(String(b?._id || "")))[0] ||
        (await BusinessLocation.findOne({
            projectId,
            status: 1,
            type: 0
        })
            .sort({ createdAt: 1, _id: 1 })
            .select("_id areaName type parentId")
            .lean());

    let scopeLoc =
        locationId != null && String(locationId).trim() !== "" ? String(locationId).trim() : null;
    if (!scopeLoc && Number(projectType) === 1 && firstParentLocation?._id) {
        scopeLoc = String(firstParentLocation._id);
    }

    const byLocId = new Map(
        (businessLocations || []).map((l) => [String(l?._id || ""), l]).filter(([id]) => !!id)
    );

    async function fetchServicePages(forLocId) {
        const q = {
            projectId,
            pageType: "service",
            serviceId: { $exists: true, $ne: null },
        };
        if (forLocId) {
            const candidates = buildMixedIdCandidates(forLocId);
            if (candidates.length > 1) {
                q.locationId = { $in: candidates };
            } else if (candidates.length === 1) {
                q.locationId = candidates[0];
            }
            return WebsitePage.find(q).select("_id serviceId locationId slug").lean();
        }
        return WebsitePage.find({
            ...q,
            $or: [{ locationId: null }, { locationId: { $exists: false } }],
        })
            .select("_id serviceId locationId slug")
            .lean();
    }

    let servicePages = await fetchServicePages(scopeLoc);
    if ((!servicePages || !servicePages.length) && scopeLoc && Number(projectType) === 0) {
        servicePages = await fetchServicePages(null);
    }

    const validServiceIds = new Set(
        (servicePages || []).map((p) => String(p.serviceId || "")).filter(Boolean)
    );
    const filteredServices =
        validServiceIds.size > 0
            ? allServices.filter((s) => validServiceIds.has(String(s._id)))
            : allServices;

    const pageByServiceId = new Map((servicePages || []).map((p) => [String(p.serviceId || ""), p]));
    const serviceIds = filteredServices.map((s) => s?._id).filter(Boolean);
    const bundleDocs = serviceIds.length
        ? await SectionContent.find({
            projectId,
            $or: [{ serviceId: { $in: serviceIds } }, { pageId: { $in: serviceIds } }],
            sectionId: "service_sections",
            isDeleted: { $ne: true }
        })
            .select("serviceId pageId locationId data")
            .lean()
        : [];

    const bundleByServiceLocation = new Map(
        (bundleDocs || []).map((doc) => [
            `${String(doc.serviceId || doc.pageId || "")}::${String(doc.locationId || "")}`,
            doc?.data || {}
        ])
    );
    const bundleRowsByServiceId = new Map();
    for (const doc of bundleDocs || []) {
        const sid = String(doc?.serviceId || doc?.pageId || "").trim();
        if (!sid) continue;
        if (!bundleRowsByServiceId.has(sid)) bundleRowsByServiceId.set(sid, []);
        bundleRowsByServiceId.get(sid).push(doc);
    }

    console.log("[buildServicesGridContentFromBundle] bundle docs found:", {
        count: bundleDocs.length,
        scopeLoc,
        bundleKeys: Array.from(bundleByServiceLocation.keys()),
    });

    const pickBundleData = (serviceId, preferredLocationIds = []) => {
        const sid = String(serviceId || "").trim();
        if (!sid) return {};
        const normalizedLocs = (Array.isArray(preferredLocationIds) ? preferredLocationIds : [])
            .map((loc) => String(loc || "").trim())
            .filter(Boolean);
        for (const loc of normalizedLocs) {
            const hit = bundleByServiceLocation.get(`${sid}::${loc}`);
            if (hit && typeof hit === "object") {
                console.log(`[buildServicesGridContentFromBundle] bundle HIT service=${sid} loc=${loc} aboutservice=${Boolean(hit?.sections?.aboutservice)}`);
                return hit;
            }
        }
        const nullHit = bundleByServiceLocation.get(`${sid}::`);
        if (nullHit && typeof nullHit === "object") {
            console.log(`[buildServicesGridContentFromBundle] bundle HIT (null loc) service=${sid} aboutservice=${Boolean(nullHit?.sections?.aboutservice)}`);
            return nullHit;
        }
        console.log(`[buildServicesGridContentFromBundle] bundle MISS service=${sid} tried=[${normalizedLocs.join(",")}]`);
        return {};
    };

    const items = filteredServices.slice(0, 8).map((svc, idx) => {
        const servicePage = pageByServiceId.get(String(svc._id));
        const serviceLink = servicePage?.slug
            ? `/${String(servicePage.slug).trim().replace(/^\/+/, "")}`
            : "#";
        const serviceLoc = String(servicePage?.locationId || "").trim();
        const parentLoc =
            serviceLoc && byLocId.get(serviceLoc)?.parentId
                ? String(byLocId.get(serviceLoc).parentId)
                : "";
        const bundleData = pickBundleData(String(svc?._id || ""), [
            scopeLoc || "",
            serviceLoc && serviceLoc === String(scopeLoc || "") ? serviceLoc : "",
        ].filter(Boolean));
        const aboutContent =
            bundleData?.sections?.aboutservice ||
            bundleData?.sections?.servicedetailabout ||
            {};
        const heroContent =
            bundleData?.sections?.servicehero ||
            bundleData?.sections?.servicedetailhero ||
            {};
        const faqContent =
            bundleData?.sections?.faq ||
            bundleData?.sections?.servicedetailfaq ||
            {};
        const bundleSlug = String(bundleData?.servicePageSlug || "").trim().replace(/^\/+/, "");
        const finalServiceLink =
            serviceLink !== "#"
                ? serviceLink
                : (bundleSlug ? `/${bundleSlug}` : "#");

        const aboutTextRaw =
            aboutContent?.about_service ||
            aboutContent?.description ||
            heroContent?.serviceHeroSubtitle ||
            faqContent?.description ||
            aboutContent?.subtitle ||
            "";
        const aboutPlain = String(aboutTextRaw || "").trim();

        console.log(`[buildServicesGridContentFromBundle] service=${svc.name} aboutservice.about_service=${aboutContent?.about_service ? "YES (" + aboutContent.about_service.substring(0, 50) + "...)" : "NO"} finalDesc=${aboutPlain ? aboutPlain.substring(0, 50) + "..." : "EMPTY"}`);

        const itemLocationId =
            servicePage?.locationId != null && String(servicePage.locationId).trim()
                ? String(servicePage.locationId)
                : scopeLoc || null;

        return {
            id: `service-${idx + 1}`,
            serviceId: String(svc?._id || ""),
            locationId: itemLocationId,
            pageId: servicePage?._id ? String(servicePage._id) : null,
            slug: servicePage?.slug
                ? String(servicePage.slug).trim().replace(/^\/+/, "")
                : String(svc?.slug || "").trim(),
            icon: [
                "fas fa-screwdriver-wrench",
                "fas fa-shield-halved",
                "fas fa-bolt",
                "fas fa-house",
                "fas fa-helmet-safety",
                "fas fa-star",
                "fas fa-gear",
                "fas fa-briefcase"
            ][idx % 8],
            title:
                String(
                    aboutContent?.service_name ||
                    aboutContent?.title ||
                    heroContent?.serviceHeroTitle ||
                    svc?.name ||
                    ""
                ).trim() ||
                `Service ${idx + 1}`,
            link: finalServiceLink,
            href: finalServiceLink,
            imageUrl:
                aboutContent?.imageUrl ||
                (Array.isArray(aboutContent?.images) ? aboutContent.images[0]?.url || "" : ""),
            description: aboutPlain,
        };
    });

    // Re-attach links from ALL service WebsitePages for this project (not only
    // the location-scoped subset). Exact location → global → any fallback.
    const allServicePagesForLinks = await WebsitePage.find({
        projectId,
        pageType: "service",
        serviceId: { $exists: true, $ne: null },
        isPublished: { $ne: false },
    })
        .select("_id serviceId locationId slug pageType isPublished")
        .lean();
    const linkedItems = attachServicePageLinksToGridItems(
        items,
        allServicePagesForLinks,
        scopeLoc
    );

    const projectLean = await UserProject.findById(projectId)
        .select("serviceType projectName")
        .lean();
    const serviceTypeLabel = titleCaseWords(String(projectLean?.serviceType || "Service"));

    const headerLocationName = (() => {
        if (scopeLoc && byLocId.has(scopeLoc)) {
            return String(byLocId.get(scopeLoc).areaName || "").trim();
        }
        if (firstParentLocation?.areaName) {
            return String(firstParentLocation.areaName || "").trim();
        }
        return "";
    })();

    const dbHeader = {
        badgeText: `${serviceTypeLabel} Services`,
        heading: headerLocationName
            ? `${serviceTypeLabel} in ${headerLocationName}`
            : `${serviceTypeLabel} Services`,
        descriptionText: headerLocationName
            ? `Browse ${serviceTypeLabel.toLowerCase()} services for ${headerLocationName} homes and businesses.`
            : "Explore verified services available for your project.",
    };

    return {
        badgeText: dbHeader.badgeText,
        title: dbHeader.heading,
        heading: dbHeader.heading,
        subtitle: dbHeader.descriptionText,
        description: dbHeader.descriptionText,
        items: linkedItems,
    };
}

/**
 * When the homepage (or any non–service-page) "services" grid is saved from GenieBuild,
 * push per-card copy + image into each row's service_sections bundle so the dedicated
 * service page (aboutservice, etc.) stays aligned. WebsiteDesignsData / per-section
 * styles are unchanged — only SectionContent bundle fields are patched.
 */
async function propagateServicesGridItemsToServiceBundles({
    projectId,
    canonicalContent = {},
    effectiveLocationId = null,
    pageMeta = {},
}) {
    const items = Array.isArray(canonicalContent?.items) ? canonicalContent.items : [];
    if (!items.length || !projectId) return 0;

    let slugMap = null;
    const loadSlugMap = async () => {
        if (slugMap) return slugMap;
        slugMap = new Map();
        const pages = await WebsitePage.find({ projectId, pageType: "service", serviceId: { $exists: true, $ne: null } })
            .select("serviceId locationId slug")
            .lean();
        for (const p of pages || []) {
            const slug = String(p.slug || "")
                .trim()
                .replace(/^\/+|\/+$/g, "");
            if (!slug) continue;
            const loc = String(p.locationId || "");
            slugMap.set(`${slug}::${loc}`, p);
            if (!slugMap.has(slug)) slugMap.set(slug, p);
        }
        return slugMap;
    };

    let patched = 0;
    for (const item of items) {
        if (!item || typeof item !== "object") continue;

        let serviceId = item.serviceId || item.service_id;
        let locationId =
            item.locationId != null && String(item.locationId).trim() !== ""
                ? String(item.locationId).trim()
                : null;

        const link = String(item.link || "").trim();
        if ((!serviceId || !mongoose.isValidObjectId(String(serviceId))) && link) {
            const map = await loadSlugMap();
            const path = link
                .split("?")[0]
                .replace(/^https?:\/\/[^/]+/i, "")
                .replace(/^\/+|\/+$/g, "");
            const locHint =
                locationId ||
                (effectiveLocationId != null && String(effectiveLocationId).trim() !== ""
                    ? String(effectiveLocationId).trim()
                    : "") ||
                (pageMeta?.locationId ? String(pageMeta.locationId) : "");
            const pageRow =
                map.get(`${path}::${locHint}`) || map.get(path) || map.get(`${path}::${String(pageMeta?.locationId || "")}`);
            if (pageRow?.serviceId) {
                serviceId = String(pageRow.serviceId);
                if (!locationId && pageRow.locationId != null) locationId = String(pageRow.locationId);
            }
        }

        if (!serviceId || !mongoose.isValidObjectId(String(serviceId))) continue;

        if (!locationId) {
            if (effectiveLocationId != null && String(effectiveLocationId).trim() !== "") {
                locationId = String(effectiveLocationId).trim();
            } else if (pageMeta?.locationId) {
                locationId = String(pageMeta.locationId);
            }
        }

        const cardDesc = String(item.description || item.about_service || item.desc || "").trim();
        const imageUrl = String(item.imageUrl || item.img || "").trim();
        const title = String(item.title || "").trim();

        const $set = {};
        if (cardDesc) {
            $set["data.sections.aboutservice.about_service"] = cardDesc;
            $set["data.sections.aboutservice.description"] = cardDesc;
            $set["data.sections.servicedetailabout.about_service"] = cardDesc;
            $set["data.sections.servicedetailabout.description"] = cardDesc;
        }
        if (imageUrl) {
            $set["data.sections.aboutservice.imageUrl"] = imageUrl;
            $set["data.sections.servicedetailabout.imageUrl"] = imageUrl;
        }
        if (title) {
            $set["data.sections.aboutservice.service_name"] = title;
            $set["data.sections.servicedetailabout.service_name"] = title;
        }

        if (!Object.keys($set).length) continue;

        const bundleLocationId = locationId != null && String(locationId).trim() !== "" ? locationId : null;

        await SectionContent.findOneAndUpdate(
            {
                projectId,
                pageId: serviceId,
                serviceId,
                sectionId: "service_sections",
                locationId: bundleLocationId,
                isDeleted: { $ne: true },
            },
            {
                $set: {
                    ...$set,
                    projectId,
                    pageId: serviceId,
                    serviceId,
                    sectionId: "service_sections",
                    locationId: bundleLocationId,
                    "data.serviceId": serviceId,
                    status: "generated",
                    error: null,
                    isDeleted: false,
                },
            },
            { upsert: true }
        );
        logSectionContentWrite("saved", {
            projectId,
            pageId: serviceId,
            sectionId: "service_sections.aboutservice(from-services-grid)",
            locationId: bundleLocationId,
            source: "propagateServicesGridItemsToServiceBundles",
        });
        patched++;
    }
    return patched;
}

/**
 * When a service page (aboutservice / servicehero) is edited, push the
 * changed title / description / imageUrl back into the matching item inside
 * the homepage services grid SectionContent row (sectionId === "services").
 */
async function propagateServicePageEditsToServicesGrid({
    projectId,
    serviceId,
    sectionType,
    content = {},
    locationId = null,
}) {
    if (!projectId || !serviceId) return;

    const servicesRows = await SectionContent.find({
        projectId,
        sectionId: "services",
        isDeleted: { $ne: true },
    })
        .select("_id data locationId")
        .lean();

    if (!servicesRows.length) return;

    for (const row of servicesRows) {
        const items = Array.isArray(row?.data?.items) ? row.data.items : [];
        const idx = items.findIndex(
            (it) => String(it?.serviceId || "") === String(serviceId)
        );
        if (idx === -1) continue;

        const $set = {};
        if (sectionType === "aboutservice" || sectionType === "servicedetailabout") {
            const desc =
                String(content.about_service || content.description || "").trim();
            const title = String(content.service_name || content.title || "").trim();
            const imageUrl = String(content.imageUrl || "").trim();
            if (desc) $set[`data.items.${idx}.description`] = desc;
            if (title) $set[`data.items.${idx}.title`] = title;
            if (imageUrl) $set[`data.items.${idx}.imageUrl`] = imageUrl;
        } else if (sectionType === "servicehero" || sectionType === "servicedetailhero") {
            const title =
                String(content.serviceHeroTitle || content.title || "").trim();
            if (title) $set[`data.items.${idx}.title`] = title;
        }

        if (!Object.keys($set).length) continue;

        await SectionContent.updateOne({ _id: row._id }, { $set });
        logSectionContentWrite("reverse-propagated", {
            projectId,
            sectionContentId: String(row._id),
            serviceId,
            sectionType,
            source: "propagateServicePageEditsToServicesGrid",
        });
    }
}

async function terminateQueueJobs(queue, queueName) {
    const summary = {
        queue: queueName,
        waitingRemoved: 0,
        delayedRemoved: 0,
        pausedRemoved: 0,
        activeFailed: 0,
        errors: []
    };

    if (!queue || typeof queue.getJobs !== "function") {
        summary.errors.push("Queue not available");
        return summary;
    }

    try {
        // Pause worker consumption globally first so no new jobs start while clearing.
        await queue.pause(true);

        const [waitingJobs, delayedJobs, pausedJobs, activeJobs] = await Promise.all([
            queue.getJobs(["waiting"]),
            queue.getJobs(["delayed"]),
            queue.getJobs(["paused"]),
            queue.getJobs(["active"]),
        ]);

        for (const job of waitingJobs) {
            try {
                await job.remove();
                summary.waitingRemoved++;
            } catch (err) {
                summary.errors.push(`waiting#${job.id}: ${err.message}`);
            }
        }

        for (const job of delayedJobs) {
            try {
                await job.remove();
                summary.delayedRemoved++;
            } catch (err) {
                summary.errors.push(`delayed#${job.id}: ${err.message}`);
            }
        }

        for (const job of pausedJobs) {
            try {
                await job.remove();
                summary.pausedRemoved++;
            } catch (err) {
                summary.errors.push(`paused#${job.id}: ${err.message}`);
            }
        }

        // Active jobs are already running; mark failed so they stop and won't continue burning credits.
        for (const job of activeJobs) {
            try {
                if (typeof job.discard === "function") job.discard();
                if (typeof job.moveToFailed === "function") {
                    await job.moveToFailed(new Error("Terminated by admin danger zone"), true);
                }
                summary.activeFailed++;
            } catch (err) {
                summary.errors.push(`active#${job.id}: ${err.message}`);
            }
        }
    } catch (err) {
        summary.errors.push(`queue-op: ${err.message}`);
    } finally {
        try {
            await queue.resume(true);
        } catch (err) {
            summary.errors.push(`resume: ${err.message}`);
        }
    }

    return summary;
}

const DANGER_ZONE_COLLECTIONS = [
    { key: "userProjects", model: UserProject, filterByProject: false },
    { key: "aboutUs", model: AboutUs, filterByProject: true },
    { key: "businessLocations", model: BusinessLocation, filterByProject: true },
    { key: "sectionContents", model: SectionContent, filterByProject: true },
    { key: "services", model: Service, filterByProject: true },
    { key: "siteHeaderFooters", model: SiteHeaderFooter, filterByProject: true },
    { key: "websiteDesignsDatas", model: WebsiteDesignsData, filterByProject: true },
    { key: "websitePages", model: WebsitePage, filterByProject: true },
];

function isMeaningfulSectionData(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number" || typeof value === "boolean") return true;
    if (Array.isArray(value)) return value.some((item) => isMeaningfulSectionData(item));
    if (typeof value === "object") {
        const keys = Object.keys(value);
        if (!keys.length) return false;
        return keys.some((k) => isMeaningfulSectionData(value[k]));
    }
    return false;
}

function logSectionContentWrite(status, context = {}) {
    const line = `[SectionContent:${status}] project=${context.projectId || "-"} page=${context.pageId || "-"} section=${context.sectionId || "-"} location=${context.locationId || "null"} source=${context.source || "-"}`;
    if (status === "error") {
        console.error(line, context.error || "");
    } else if (status === "skipped-empty") {
        console.warn(line);
    } else {
        console.log(line);
    }
}

function sanitizeSectionDataForStorage(sectionId, value) {
    const normalizedSectionId = normalizeSectionIdForStorage(sectionId);
    if (!value || typeof value !== "object" || Array.isArray(value)) return value;
    const next = { ...value };
    if (
        normalizedSectionId === "areas" ||
        normalizedSectionId === "sublocations" ||
        normalizedSectionId === "serviceslistareas" ||
        normalizedSectionId === "locationareas"
    ) {
        delete next.items;
    }
    return next;
}

function normalizeSectionIdForStorage(sectionId = "") {
    const raw = String(sectionId || "").toLowerCase().trim();
    const aliases = {
        servicesgrid: "services",
        "why-choose-us": "whychooseus",
    };
    return aliases[raw] || raw;
}

function normalizeSectionTypeForClient(sectionId = "") {
    const raw = String(sectionId || "").toLowerCase().trim();
    const aliases = {
        whychooseus: "why-choose-us",
        servicesgrid: "services",
    };
    return aliases[raw] || raw;
}

function normalizeMixedIdForStorage(value) {
    const raw = String(value || "").trim();
    if (!raw) return raw;
    return mongoose.isValidObjectId(raw) ? new mongoose.Types.ObjectId(raw) : raw;
}

function buildMixedIdCandidates(value) {
    const raw = String(value || "").trim();
    if (!raw) return [];
    const candidates = [raw];
    if (mongoose.isValidObjectId(raw)) {
        candidates.push(new mongoose.Types.ObjectId(raw));
    }
    return candidates;
}

function shouldUseServiceBundleForPage(sectionId, pageMeta) {
    const normalized = String(sectionId || "").toLowerCase().trim();
    const isServicePage = String(pageMeta?.pageType || "").toLowerCase() === "service";
    if (!isServicePage || !pageMeta?.serviceId) return false;
    return isServiceBundleSection(normalized) || normalized === "faq";
}

function isHomepageMeta(pageMeta = {}) {
    const locId = pageMeta?.locationId ? String(pageMeta.locationId).trim() : "";
    const slugNorm = String(pageMeta?.slug || "").trim().replace(/^\/+|\/+$/g, "").toLowerCase();
    // Location landing pages (e.g. /gagret/guglehar) are not the site homepage even if name collides.
    if (locId && slugNorm && slugNorm !== "home") {
        return false;
    }
    const pageType = String(pageMeta?.pageType || "").toLowerCase().trim();
    const name = String(pageMeta?.name || "").toLowerCase().trim();
    const slug = String(pageMeta?.slug || "").toLowerCase().trim();
    return (
        pageType === "home" ||
        pageType === "homepage" ||
        name === "home" ||
        name === "homepage" ||
        slug === "/" ||
        slug === "" ||
        slug === "home"
    );
}

/**
 * Site-wide listing/core pages (no page.locationId) whose SectionContent is still
 * generated under the business primary parent — same as homepage.
 * Without this, resolve asks for locationId:null and misses parent-scoped AI rows,
 * so /services and /areas fall back to GenieBuild static placeholders.
 */
function isSiteWideListingPageMeta(pageMeta = {}) {
    if (pageMeta?.locationId) return false;
    const pageType = String(pageMeta?.pageType || "").toLowerCase().trim();
    const name = String(pageMeta?.name || "").toLowerCase().trim().replace(/\s+/g, "-");
    const slug = String(pageMeta?.slug || "")
        .toLowerCase()
        .trim()
        .replace(/^\/+|\/+$/g, "");
    const listingTypes = new Set([
        "services",
        "serviceslist",
        "areas",
        "allareas",
        "about",
        "contact",
        "blog",
        "blogs",
        "legal",
        "default",
    ]);
    const listingNames = new Set([
        "services",
        "areas",
        "allareas",
        "all-areas",
        "about",
        "about-us",
        "aboutus",
        "contact",
        "contact-us",
        "blog",
        "blogs",
        "legal",
        "privacy",
        "privacy-policy",
        "terms",
        "terms-of-service",
        "disclaimer",
    ]);
    if (listingNames.has(name) || listingNames.has(slug)) return true;
    if (pageType === "default" && (listingNames.has(name) || listingNames.has(slug))) return true;
    if (listingTypes.has(pageType) && pageType !== "default") return true;
    return false;
}

function resolvePrimaryParentLocationId(businessLocations = []) {
    const parentLocation = (businessLocations || []).find((loc) => Number(loc?.type) === 0);
    return parentLocation?._id ? String(parentLocation._id) : null;
}

function resolveLocationPreferenceForPage({
    preferredLocationId = null,
    projectType = 0,
    pageMeta = {},
    businessLocations = [],
}) {
    const pageLocationId = pageMeta?.locationId ? String(pageMeta.locationId) : null;
    const pageType = String(pageMeta?.pageType || "").toLowerCase().trim();

    // Single-service pages are always tied to their WebsitePage.locationId (from URL slug).
    if (pageType === "service" && pageLocationId) {
        return pageLocationId;
    }

    // Home-scoped service page (no locationId): business sites use primary parent
    // catalog — same pool as homepage services. Bulk home-scoped keeps null.
    if (pageType === "service" && !pageLocationId && Number(projectType) === 1) {
        const parentId = resolvePrimaryParentLocationId(businessLocations);
        if (parentId) return parentId;
    }

    // Location landing pages: content must match the page's own location, not a child from query.
    if (pageLocationId && !isHomepageMeta(pageMeta)) {
        return pageLocationId;
    }

    // Business projects: homepage + site-wide listing pages (/services, /areas, about, …)
    // store SectionContent under the primary parent — resolve must match that scope.
    if (
        Number(projectType) === 1 &&
        !pageLocationId &&
        !preferredLocationId &&
        (isHomepageMeta(pageMeta) || isSiteWideListingPageMeta(pageMeta))
    ) {
        const parentId = resolvePrimaryParentLocationId(businessLocations);
        if (parentId) return parentId;
    }

    if (!preferredLocationId) {
        return pageLocationId || null;
    }
    if (!isHomepageMeta(pageMeta) && !isSiteWideListingPageMeta(pageMeta)) {
        return preferredLocationId;
    }
    return Number(projectType) === 1 ? preferredLocationId : null;
}

function pickServiceBundleDoc(serviceBundleMap, serviceId, locationId, parentById = null) {
    if (!serviceId || !serviceBundleMap?.size) return null;
    const sid = String(serviceId);
    const loc = locationId != null && String(locationId).trim() !== ""
        ? String(locationId).trim()
        : "";

    if (!loc) {
        return serviceBundleMap.get(`${sid}::`) || null;
    }

    const exact = serviceBundleMap.get(`${sid}::${loc}`);
    if (exact) return exact;

    const { getAncestorIds } = require("../services/locationContentScope");
    const parentMap = parentById || new Map();
    for (const ancestorId of getAncestorIds(loc, parentMap)) {
        const ancestorDoc = serviceBundleMap.get(`${sid}::${ancestorId}`);
        if (ancestorDoc) return ancestorDoc;
    }

    return serviceBundleMap.get(`${sid}::`) || null;
}

function pickBestSectionDocByLocation(docs = [], preferredLocationId = null, parentById = null) {
    const { pickSectionDocForLocation } = require("../services/locationContentScope");
    return pickSectionDocForLocation(docs, preferredLocationId, parentById);
}

const PLUMBING_FAQ_PLACEHOLDER_FIRST =
    "Do you offer 24/7 emergency plumbing services?";

function isPlumbingDefaultFaqItems(items) {
    if (!Array.isArray(items) || !items.length) return false;
    const first = String(items[0]?.question || items[0]?.title || "").trim();
    return first === PLUMBING_FAQ_PLACEHOLDER_FIRST;
}

function normalizePickedSectionContentData(data) {
    if (Array.isArray(data)) {
        return { items: data };
    }
    if (!data || typeof data !== "object") return {};
    const out = { ...data };
    if (!Array.isArray(out.items) && Array.isArray(out.faqs)) out.items = out.faqs;
    if (!Array.isArray(out.items) && Array.isArray(out.questions)) out.items = out.questions;
    return out;
}

function canonicalizeSectionContent(content = {}) {
    if (Array.isArray(content)) {
        return canonicalizeSectionContent({ items: content });
    }
    if (!content || typeof content !== "object") return {};
    const title = String(content.title || content.heading || content.sectionTitle || "").trim();
    const subtitle = String(
        content.subtitle ||
        content.descriptionText ||
        content.description ||
        content.sectionSubtitle ||
        ""
    ).trim();
    const description = String(content.description || "").trim();

    const next = { ...content };
    if (title) next.title = title;
    if (subtitle) next.subtitle = subtitle;
    if (description) next.description = description;

    delete next.heading;
    delete next.descriptionText;
    delete next.sectionTitle;
    delete next.sectionSubtitle;
    delete next.buttonText;
    delete next.cta_label;
    delete next.contentRef;
    delete next.sectionContentId;
    delete next.sectionContentIds;
    delete next.locationIds;
    delete next.fullDescription;
    delete next.full_description;

    if (next.description && next.subtitle && String(next.description).trim() === String(next.subtitle).trim()) {
        delete next.description;
    }

    // Strip fullDescription from items[]; normalize FAQ rows for SiteNextJS / GenieBuild.
    if (Array.isArray(next.items)) {
        next.items = next.items.map((item) => {
            if (!item || typeof item !== "object") return item;
            const cleaned = { ...item };
            if (cleaned.fullDescription) {
                if (!cleaned.description) cleaned.description = cleaned.fullDescription;
                delete cleaned.fullDescription;
            }
            delete cleaned.full_description;
            const question = String(cleaned.question || cleaned.title || "").trim();
            const answer = String(
                cleaned.answer || cleaned.description || cleaned.content || ""
            ).trim();
            if (question) cleaned.question = question;
            if (answer) cleaned.answer = answer;
            return cleaned;
        });
    }
    return next;
}

function compactOverrideObject(value) {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) {
        return value
            .map((item) => compactOverrideObject(item))
            .filter((item) => item !== undefined);
    }
    if (value && typeof value === "object") {
        const out = {};
        Object.entries(value).forEach(([k, v]) => {
            const compacted = compactOverrideObject(v);
            if (compacted !== undefined) out[k] = compacted;
        });
        return Object.keys(out).length ? out : undefined;
    }
    return value;
}

function compactElementRecords(elementIds = []) {
    const walk = (el) => {
        if (!el || typeof el !== "object") return null;

        // GenieBuild canonical element shape
        // { id, type, content, style, children? }
        if (el.id) {
            const next = {
                id: String(el.id),
                type: String(el.type || "text"),
            };
            const style = compactOverrideObject(el.style || {});
            const content = compactOverrideObject(el.content || {});
            if (style && Object.keys(style).length) next.style = style;
            if (content && Object.keys(content).length) next.content = content;
            if (typeof el.order === "number" && el.order !== 0) next.order = el.order;
            if (el.parentElId) next.parentElId = el.parentElId;
            if (Array.isArray(el.children) && el.children.length) {
                const children = el.children.map(walk).filter(Boolean);
                if (children.length) next.children = children;
            }
            return next;
        }

        // Legacy element record shape
        // { elementId, elementType, style, data, children? }
        if (el.elementId) {
            const next = {
                id: String(el.elementId),
                type: String(el.elementType || "text"),
            };
            const style = compactOverrideObject(el.style || {});
            const content = compactOverrideObject(el.data || {});
            if (style && Object.keys(style).length) next.style = style;
            if (content && Object.keys(content).length) next.content = content;
            if (typeof el.order === "number" && el.order !== 0) next.order = el.order;
            if (el.parentElId) next.parentElId = el.parentElId;
            if (Array.isArray(el.children) && el.children.length) {
                const children = el.children.map(walk).filter(Boolean);
                if (children.length) next.children = children;
            }
            return next;
        }

        return null;
    };
    return (Array.isArray(elementIds) ? elementIds : []).map(walk).filter(Boolean);
}

function sanitizePageStyles(value = {}) {
    const raw = (value && typeof value === "object" && !Array.isArray(value)) ? { ...value } : {};
    delete raw.renderer;
    return raw;
}

function compactSectionStyleOverrides(style = {}, theme = {}) {
    const raw = compactOverrideObject(style || {}) || {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    // Keep styles.variant — SiteNextJS / GenieBuild must render the chosen layout.

    const defaults = {
        backgroundColor: theme?.colorSecondary || "#0E1214",
        textColor: "#D1D5DB",
        titleColor: theme?.colorAccent || "#F8FAFC",
        subtitleColor: "#D1D5DB",
        descriptionColor: "#D1D5DB",
        buttonBackgroundColor: theme?.colorPrimary || "#E11D48",
        buttonTextColor: "#FFFFFF",
        buttonStyle: "filled",
        maxWidth: "max-w-7xl",
        paddingTop: "py-24",
        paddingBottom: "py-24",
        backgroundImage: "",
        overlayColor: "#000000",
        overlayOpacityValue: "0.6",
    };

    for (const [key, defaultValue] of Object.entries(defaults)) {
        if (!Object.prototype.hasOwnProperty.call(raw, key)) continue;
        if (String(raw[key]) === String(defaultValue)) delete raw[key];
    }
    return raw;
}

function collectSectionContentIdsFromRef(contentRef = {}) {
    const ids = new Set();
    const legacyIds = Array.isArray(contentRef?.sectionContentIds) ? contentRef.sectionContentIds : [];
    legacyIds.forEach((id) => ids.add(String(id)));
    const sources = Array.isArray(contentRef?.sources) ? contentRef.sources : [];
    sources.forEach((src) => {
        if (String(src?.source || "").toLowerCase().trim() !== "section_content") return;
        const srcIds = Array.isArray(src?.ids) ? src.ids : [];
        srcIds.forEach((id) => ids.add(String(id)));
    });
    return Array.from(ids);
}

function buildContentRef({
    resolver = "page_scoped",
    sectionContentIds = [],
    locationIds = [],
    extraSources = []
}) {
    const normalizedSectionContentIds = (Array.isArray(sectionContentIds) ? sectionContentIds : [])
        .map((id) => String(id).trim())
        .filter(Boolean);
    const sources = [];
    if (normalizedSectionContentIds.length) {
        sources.push({ source: "section_content", ids: normalizedSectionContentIds });
    }
    for (const src of (Array.isArray(extraSources) ? extraSources : [])) {
        const source = String(src?.source || "").trim();
        const ids = (Array.isArray(src?.ids) ? src.ids : []).map((id) => String(id).trim()).filter(Boolean);
        if (!source || !ids.length) continue;
        sources.push({ source, ids });
    }
    return {
        resolver,
        sources,
    };
}

function getSectionEntriesFromPage(page = {}) {
    const sections = getPageSections(page);
    return sections
        .map((comp, idx) => {
            const sectionData = comp?.sectionData;
            if (!sectionData || typeof sectionData !== "object") return null;
            const fallbackType = String(comp?.variant_uniqueId || comp?.uniqueId || "")
                .split(/[_-]/)[0]
                .trim()
                .toLowerCase();
            const sectionType = normalizeSectionIdForStorage(String(sectionData?.type || fallbackType || "").toLowerCase().trim());
            if (!sectionType) return null;
            return {
                index: idx,
                sectionType,
                sectionData,
                compData: comp
            };
        })
        .filter(Boolean);
}

function resolveSectionContentWithPriority({
    sectionType,
    contentRef = {},
    pageIdStr,
    scopedPreferredLocationId = null,
    sectionContentDocs = [],
    sectionContentRowsByKey = new Map(),
    resolverType = "page_scoped",
    serviceBundleMap = new Map(),
    pageMeta = {},
    businessLocations = [],
    resolvedServicesGridContent = null,
    websitePages = [],
    projectType = 1,
}) {
    const key = `${pageIdStr}::${sectionType}`;
    const referencedIds = collectSectionContentIdsFromRef(contentRef);
    const referencedDocs = referencedIds.length
        ? (sectionContentDocs || []).filter((doc) => referencedIds.includes(String(doc?._id || "")))
        : [];
    const locationParentMap = (() => {
        const { buildLocationParentMap } = require("../services/locationContentScope");
        return buildLocationParentMap(businessLocations || []);
    })();
    const pageScopedDoc = pickBestSectionDocByLocation(
        sectionContentRowsByKey.get(key) || [],
        scopedPreferredLocationId,
        locationParentMap
    );
    let pickedDoc = pickBestSectionDocByLocation(
        [pickBestSectionDocByLocation(referencedDocs, scopedPreferredLocationId, locationParentMap), pageScopedDoc].filter(Boolean),
        scopedPreferredLocationId,
        locationParentMap
    );

    // Location pages: GenieBuild location* ids share content with homepage section ids
    if (!pickedDoc?.data || !isMeaningfulSectionData(pickedDoc.data)) {
        try {
            const { locationHomeTwinId } = require("../additional/locationHomeSectionMap.cjs");
            const twin = locationHomeTwinId(sectionType);
            if (twin && twin !== sectionType) {
                const twinKey = `${pageIdStr}::${twin}`;
                const twinDoc = pickBestSectionDocByLocation(
                    sectionContentRowsByKey.get(twinKey) || [],
                    scopedPreferredLocationId,
                    locationParentMap
                );
                if (twinDoc) pickedDoc = twinDoc;
            }
        } catch (_) {
            /* twin map optional */
        }
    }

    // Legal: GenieBuild legalhero/legalcontent can fall back to legacy combined packs
    if (
        (!pickedDoc?.data || !isMeaningfulSectionData(pickedDoc.data)) &&
        (sectionType === "legalhero" || sectionType === "legalcontent")
    ) {
        try {
            const { resolveLegalDocType, splitLegalPayload } = require("../services/legalSectionDynamics");
            const docType = resolveLegalDocType({
                sectionId: sectionType,
                pageName: pageMeta?.name || pageMeta?.displayName || "",
                pageSlug: pageMeta?.slug || "",
            });
            const legacyId =
                docType === "terms"
                    ? "legalterms"
                    : docType === "disclaimer"
                        ? "legaldisclaimer"
                        : "legalprivacy";
            const legacyKey = `${pageIdStr}::${legacyId}`;
            const legacyDoc = pickBestSectionDocByLocation(
                sectionContentRowsByKey.get(legacyKey) || [],
                scopedPreferredLocationId,
                locationParentMap
            );
            if (legacyDoc?.data) {
                const split = splitLegalPayload(legacyDoc.data, docType);
                pickedDoc = {
                    ...legacyDoc,
                    data: sectionType === "legalhero" ? split.hero : split.content,
                };
            }
        } catch (_) {
            /* optional */
        }
    }

    const useServiceBundleResolver =
        resolverType === "service_bundle" ||
        String(contentRef?.scope || "").toLowerCase() === "service_bundle" ||
        shouldUseServiceBundleForPage(sectionType, pageMeta);

    if (!pickedDoc && useServiceBundleResolver) {
        const serviceId = contentRef?.serviceId || pageMeta?.serviceId || null;
        const bundleLocationId = contentRef?.locationId || pageMeta?.locationId || null;
        const targetSection = String(contentRef?.sectionId || sectionType).toLowerCase().trim();

        // Canonical copy for service pages: homepage/location "services" SectionContent data.items[]
        // (matched by project + location + serviceId). Must win over service_sections bundles —
        // bundles are often stale after the user edits the grid in GenieBuild.
        let pickedFromServicesGrid = null;
        if (
            serviceId &&
            (targetSection === "aboutservice" ||
                targetSection === "servicedetailabout" ||
                targetSection === "servicehero" ||
                targetSection === "servicedetailhero")
        ) {
            const serviceLocationId = bundleLocationId || pageMeta?.locationId || scopedPreferredLocationId || null;
            const servicesGridCandidates = (sectionContentDocs || []).filter((doc) => {
                const sid = String(doc?.sectionId || "").toLowerCase().trim();
                return (
                    (sid === "services" || sid === "servicesgrid") &&
                    Array.isArray(doc?.data?.items) &&
                    doc.data.items.length
                );
            });
            const servicesGridDoc = pickBestSectionDocByLocation(
                servicesGridCandidates,
                serviceLocationId,
                locationParentMap
            );
            const matchedItem = servicesGridDoc
                ? (servicesGridDoc.data.items || []).find(
                    (it) => String(it?.serviceId || "") === String(serviceId)
                )
                : null;
            const itemHit = matchedItem;
            const parentBadge = servicesGridDoc?.data?.badgeText || resolvedServicesGridContent?.badgeText || "";
            if (itemHit) {
                if (targetSection === "aboutservice" || targetSection === "servicedetailabout") {
                    pickedFromServicesGrid = {
                        status: "generated",
                        data: {
                            title: itemHit.title || "",
                            about_service: itemHit.description || "",
                            description: itemHit.description || "",
                            imageUrl: itemHit.imageUrl || "",
                            service_name: itemHit.title || "",
                        }
                    };
                } else if (targetSection === "servicehero" || targetSection === "servicedetailhero") {
                    pickedFromServicesGrid = {
                        status: "generated",
                        data: {
                            serviceHeroTitle: itemHit.title || "",
                            serviceHeroSubtitle: itemHit.description || "",
                            serviceHeroBadge: parentBadge,
                        }
                    };
                }
            }
        }

        let pickedFromBundle = null;
        if (serviceId) {
            const bundleLoc =
                pageMeta?.locationId != null
                    ? String(pageMeta.locationId)
                    : bundleLocationId != null
                      ? String(bundleLocationId)
                      : "";
            const bundleDoc = pickServiceBundleDoc(
                serviceBundleMap,
                serviceId,
                bundleLoc,
                locationParentMap
            );
            const twinSection = (() => {
                try {
                    const { serviceDetailBundleTwinId } = require("../additional/siteSectionOrder.cjs");
                    return serviceDetailBundleTwinId(targetSection);
                } catch {
                    return null;
                }
            })();
            if (bundleDoc?.data?.sections?.[targetSection]) {
                pickedFromBundle = { status: bundleDoc.status, data: bundleDoc.data.sections[targetSection] };
            } else if (twinSection && bundleDoc?.data?.sections?.[twinSection]) {
                pickedFromBundle = { status: bundleDoc.status, data: bundleDoc.data.sections[twinSection] };
            }
        }

        // Service detail pages should prefer their own generated service bundle.
        // Homepage/services grid edits are a fallback only when bundle section is missing.
        pickedDoc = pickedFromBundle || pickedFromServicesGrid;
    }

    let resolvedContent = normalizePickedSectionContentData(pickedDoc?.data);

    // Area grids must always come from BusinessLocation rows (headers stay from SectionContent).
    // Prevents stale Downtown/# seed items in SectionContent from leaking into SiteNextJS.
    const forceHydrateAreaItems =
        sectionType === "areas" ||
        sectionType === "sublocations" ||
        sectionType === "serviceslistareas" ||
        sectionType === "locationareas";
    if (
        forceHydrateAreaItems &&
        (resolverType === "business_locations" || forceHydrateAreaItems)
    ) {
        const dynamicItems = buildAreaItemsFromLocations({
            allLocations: businessLocations || [],
            pageMeta,
            websitePages,
            projectType,
        }).map((item) => ({
            ...item,
            // SubLocationsDefault expects name/meta; AreasPlumbing expects title
            name: item.title,
            meta: "Service area",
            href: item.link,
            url: item.link,
        }));
        resolvedContent = {
            ...(resolvedContent && typeof resolvedContent === "object" ? resolvedContent : {}),
            items: dynamicItems,
        };
    }

    // Priority fallback after SectionContent: deterministic DB sources.
    if (
        !forceHydrateAreaItems &&
        !isMeaningfulSectionData(resolvedContent) &&
        resolverType === "business_locations"
    ) {
        const refLocationIds = Array.isArray(contentRef?.locationIds) ? contentRef.locationIds.map((id) => String(id)) : [];
        const businessLocationIdsFromSources = (Array.isArray(contentRef?.sources) ? contentRef.sources : [])
            .filter((s) => String(s?.source || "").toLowerCase().trim() === "business_locations")
            .flatMap((s) => Array.isArray(s?.ids) ? s.ids.map((id) => String(id)) : []);
        const effectiveLocationIds = refLocationIds.length ? refLocationIds : businessLocationIdsFromSources;
        const scopedLocations = effectiveLocationIds.length
            ? (businessLocations || []).filter((loc) => effectiveLocationIds.includes(String(loc?._id)))
            : (businessLocations || []);
        resolvedContent = {
            ...resolvedContent,
            items: buildAreaItemsFromLocations({
                allLocations: scopedLocations,
                pageMeta,
                websitePages,
                projectType,
            })
        };
    }
    if (
        (sectionType === "services" ||
            sectionType === "servicesgrid" ||
            sectionType === "serviceslistgrid") &&
        resolvedServicesGridContent
    ) {
        resolvedContent = mergeServicesGridWithBundle(
            resolvedContent && typeof resolvedContent === "object" ? resolvedContent : {},
            resolvedServicesGridContent
        );

        if (Array.isArray(resolvedContent?.items) && resolvedContent.items.length > 0) {
            resolvedContent.items = attachServicePageLinksToGridItems(
                resolvedContent.items,
                websitePages,
                scopedPreferredLocationId
            );
        }
    }

    // Related Services on service detail: same location-scoped catalog as the services
    // grid, minus the current service. Home-scoped service pages → home/parent pool;
    // location-scoped service pages → that location's siblings only.
    if (sectionType === "relatedservices" && resolvedServicesGridContent) {
        const excludeServiceId = String(
            pageMeta?.serviceId || contentRef?.serviceId || ""
        ).trim();
        const base =
            resolvedContent && typeof resolvedContent === "object" ? { ...resolvedContent } : {};

        // Normalize AI header aliases → UI keys
        const badgeText = String(
            base.badgeText || base.relatedServicesBadge || ""
        ).trim();
        const title = String(
            base.title || base.relatedServicesTitle || base.heading || ""
        ).trim();
        const subtitle = String(
            base.subtitle ||
                base.relatedServicesSubtitle ||
                base.descriptionText ||
                base.description ||
                ""
        ).trim();

        let items = Array.isArray(resolvedServicesGridContent.items)
            ? resolvedServicesGridContent.items.filter((it) => {
                  const sid = String(it?.serviceId || "").trim();
                  if (!sid) return false;
                  if (excludeServiceId && sid === excludeServiceId) return false;
                  return true;
              })
            : [];

        if (items.length > 0) {
            const linkScopeLocationId =
                pageMeta?.locationId != null
                    ? String(pageMeta.locationId)
                    : scopedPreferredLocationId != null
                      ? String(scopedPreferredLocationId)
                      : null;
            items = attachServicePageLinksToGridItems(
                items,
                websitePages,
                linkScopeLocationId
            ).slice(0, 6);
        }

        resolvedContent = {
            ...base,
            badgeText: badgeText || base.badgeText || "",
            title: title || base.title || "",
            subtitle: subtitle || base.subtitle || "",
            relatedServicesBadge: badgeText || base.relatedServicesBadge || "",
            relatedServicesTitle: title || base.relatedServicesTitle || "",
            relatedServicesSubtitle: subtitle || base.relatedServicesSubtitle || "",
            items,
            // Hint for UI / nav: which catalog scope was used
            locationId:
                pageMeta?.locationId != null
                    ? String(pageMeta.locationId)
                    : scopedPreferredLocationId != null
                      ? String(scopedPreferredLocationId)
                      : null,
            excludeServiceId: excludeServiceId || undefined,
        };
    }

    return {
        pickedDoc,
        resolvedContent
    };
}

/**
 * Merge design-row structure with resolved SectionContent.
 * Prefer AI/DB resolved fields over design-template placeholders so live pages
 * (/services, /areas, about, …) never show static GenieBuild demo titles when
 * SectionContent exists.
 */
function mergeGenieBuildDesignSectionContent(sectionType, resolvedContent = {}, sectionData = {}) {
    const st = String(sectionType || "").toLowerCase().trim();
    if (st === "services" || st === "servicesgrid" || st === "serviceslistgrid") {
        return resolvedContent && typeof resolvedContent === "object" ? { ...resolvedContent } : {};
    }
    if (st === "relatedservices") {
        const resolved =
            resolvedContent && typeof resolvedContent === "object" ? { ...resolvedContent } : {};
        const design =
            sectionData?.content && typeof sectionData.content === "object" && !Array.isArray(sectionData.content)
                ? sectionData.content
                : {};
        const merged = {
            ...design,
            ...resolved,
            badgeText: String(
                resolved.badgeText ||
                    resolved.relatedServicesBadge ||
                    design.badgeText ||
                    design.relatedServicesBadge ||
                    ""
            ).trim(),
            title: String(
                resolved.title ||
                    resolved.relatedServicesTitle ||
                    design.title ||
                    design.relatedServicesTitle ||
                    ""
            ).trim(),
            subtitle: String(
                resolved.subtitle ||
                    resolved.relatedServicesSubtitle ||
                    design.subtitle ||
                    design.relatedServicesSubtitle ||
                    ""
            ).trim(),
        };
        if (Array.isArray(resolved.items) && resolved.items.length > 0) {
            merged.items = resolved.items;
        } else {
            merged.items = [];
        }
        return merged;
    }
    const design =
        sectionData?.content && typeof sectionData.content === "object" && !Array.isArray(sectionData.content)
            ? sectionData.content
            : {};
    if (!design || !Object.keys(design).length) {
        return resolvedContent && typeof resolvedContent === "object" ? { ...resolvedContent } : {};
    }
    const resolved =
        resolvedContent && typeof resolvedContent === "object" ? { ...resolvedContent } : {};
    const contentRef = sectionData?.contentRef || {};
    const isServiceBundleFaq =
        st === "faq" &&
        (String(contentRef?.scope || "").toLowerCase() === "service_bundle" ||
            shouldUseServiceBundleForPage(st, { pageType: "service", serviceId: contentRef?.serviceId }));

    // Resolved (SectionContent) wins over design placeholders whenever it has real data.
    const merged = isMeaningfulSectionData(resolved)
        ? { ...design, ...resolved }
        : { ...resolved, ...design };

    if (isServiceBundleFaq || st === "faq" || st === "aboutfaq" || st === "areasfaq" || st === "contactfaq" || st === "serviceslistfaq" || st === "servicedetailfaq") {
        const resolvedItems = Array.isArray(resolved.items) ? resolved.items : [];
        const designItems = Array.isArray(design.items) ? design.items : [];
        if (resolvedItems.length > 0) {
            merged.items = resolvedItems;
        } else if (designItems.length > 0 && !isPlumbingDefaultFaqItems(designItems)) {
            merged.items = designItems;
        }
    }
    if (st === "cta" || st === "aboutcta" || st === "contactcta" || st === "serviceslistcta") {
        const resolvedItems = Array.isArray(resolved.items) ? resolved.items : [];
        if (resolvedItems.length > 0) {
            merged.items = resolvedItems;
        }
        if (resolved.phoneSubText) {
            merged.phoneSubText = resolved.phoneSubText;
        }
        if (resolved.phoneNumber || resolved.contactText) {
            merged.phoneNumber = resolved.phoneNumber || resolved.contactText;
            merged.contactText = resolved.contactText || resolved.phoneNumber;
        }
    }
    if (
        st === "areas" ||
        st === "sublocations" ||
        st === "serviceslistareas" ||
        st === "locationareas"
    ) {
        if (Array.isArray(resolved.items) && resolved.items.length > 0) {
            merged.items = resolved.items;
        }
    }
    return merged;
}

/**
 * Keep content single-sourced in SectionContent. We do not persist content payloads
 * into WebsiteDesignsData rows for services; only structure/styles belong there.
 */
function pickPersistableServicesSectionContent(rawSectionType, sectionContent = {}) {
    return {};
}

/**
 * Resolve GenieBuild layout variant for live SiteNextJS / API responses.
 * Prefer sectionData.styles.variant (user-chosen in builder), then componentIds.variant_uniqueId.
 */
function resolveChosenSectionVariant(sectionData = {}, compData = {}) {
    const fromStyles = String(sectionData?.styles?.variant || "").trim();
    if (fromStyles) return fromStyles;

    const fromTop = String(sectionData?.variant || "").trim();
    if (fromTop) return fromTop;

    const fromComp = String(
        compData?.variant_uniqueId || compData?.uniqueId || ""
    ).trim();
    if (!fromComp) return "";

    // Legacy mangled ids like "heroHeroCenter" → try to recover PascalCase file name.
    const type = String(sectionData?.type || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    if (type && fromComp.toLowerCase().startsWith(type) && fromComp.length > type.length) {
        const rest = fromComp.slice(type.length);
        if (rest) return rest.charAt(0).toUpperCase() + rest.slice(1);
    }
    return fromComp;
}

function toResolvedSectionShape(sectionData = {}, fallbackId = "", compData = null) {
    const type = normalizeSectionTypeForClient(String(sectionData?.type || "").trim().toLowerCase());
    const baseStyles =
        sectionData?.styles && typeof sectionData.styles === "object" ? { ...sectionData.styles } : {};
    const chosenVariant = resolveChosenSectionVariant(sectionData, compData || {});
    if (chosenVariant) {
        baseStyles.variant = chosenVariant;
    }
    const elements = Array.isArray(sectionData?.elements) ? sectionData.elements : [];
    const elementsById = {};
    const layout = [];
    elements.forEach((el, idx) => {
        const elementId = String(el?.id || `el_${idx + 1}`);
        elementsById[elementId] = {
            type: el?.type || "unknown",
            content: el?.content && typeof el.content === "object" ? el.content : {},
            style: el?.style && typeof el.style === "object" ? el.style : {},
        };
        layout.push({ order: idx + 1, elementId });
    });

    return {
        id: String(sectionData?.id || fallbackId || `${type}-${Date.now()}`),
        type,
        variant: String(baseStyles?.variant || chosenVariant || ""),
        status: String(sectionData?.status || "ready"),
        styles: baseStyles,
        data: canonicalizeSectionContent(sectionData?.content || {}),
        layout,
        elementsById,
    };
}
// Helper function to ensure component exists in WebsiteComponent (create if not exists with variant "a")
async function ensureComponentExists(componentName, uniqueId = null) {
    const normalizedName = componentName.toLowerCase().trim().replace(/-/g, '_');

    // Generate uniqueId if not provided (format: {name}_a)
    if (!uniqueId) {
        uniqueId = `${normalizedName}_a`;
    } else {
        uniqueId = uniqueId.toLowerCase().trim().replace(/-/g, '_');
    }

    // Extract variant from uniqueId (e.g., "hero_a" -> "a")
    const variant = uniqueId.split('_').slice(1).join('_') || 'a';

    // Check if component exists
    let component = await WebsiteComponent.findOne({ name: normalizedName });

    if (!component) {
        // Create new component with variant "a"
        component = new WebsiteComponent({
            name: normalizedName,
            variants: [{
                uniqueId: uniqueId,
                status: 1 // Enabled
            }]
        });
        await component.save();
        console.log(`[ensureComponentExists] Created new component: ${normalizedName} with variant ${variant}`);
    } else {
        // Check if variant exists in component
        const variantExists = component.variants && component.variants.some(v => v.uniqueId === uniqueId);

        if (!variantExists) {
            // Add variant to existing component
            if (!component.variants) {
                component.variants = [];
            }
            component.variants.push({
                uniqueId: uniqueId,
                status: 1 // Enabled
            });
            await component.save();
            console.log(`[ensureComponentExists] Added variant ${variant} to existing component: ${normalizedName}`);
        }
    }

    return component;
}

async function upsertContactUsFAQ({ project, email, phone, mainLocation }) {
    // Build the prompt to generate location-aware, contact-aware FAQs
    const prompt = `
Generate a JSON array of 6–8 FAQ objects for a Contact Us page.
Each object must have:
- "question": a clear, self-contained question about contacting or reaching the company
- "answer": 45–70 words, no pricing, no dates, no legal claims. Be helpful and specific.
Use the following details naturally where relevant (do not repeat them in every answer):
- Email: ${email || 'N/A'}
- Phone: ${phone || 'N/A'}
- Main Location: ${mainLocation || 'N/A'}
- Project Name: ${project.projectName}
- Service Type: ${project.serviceType}

Style notes:
- Keep language simple and professional.
- Prefer practical guidance (response times, what info to include in an email/call).
- Avoid hard promises and avoid ending every sentence with the exact contact info; weave it in where it fits also avoid the other personal info or details like availability or other things.

Return ONLY a flat JSON array like:
[
  {"question":"...","answer":"..."},
  {"question":"...","answer":"..."}
]
  `.trim();

    let faqs;
    try {
        faqs = await fetchJSONFromOpenAI(
            prompt,
            'FAQ',
            {
                userId: project.userId,
                projectId: project._id?.toString?.() || project.id,
                pageId: 'contact-us',
                promptFrom: 'controller',
                promptFor: 'Contact Us FAQ'
            }
        );
        if (!Array.isArray(faqs) || faqs.length === 0) {
            throw new Error('Empty or invalid FAQ payload from OpenAI');
        }
    } catch (e) {
        console.warn('[ContactUs FAQ] generation failed:', e.message);
        return; // Fail soft; do not block AboutUs update
    }

    // Upsert WebsiteSection for Contact page FAQs
    const filter = {
        projectId: project._id || project.id,
        sectionTitle: 'FAQ',
        referencePage: 'contact'
    };

    const update = {
        $set: {
            sectionTitle: 'FAQ',
            sectionContent: faqs,
            referencePage: 'contact',
            projectId: project._id || project.id
        }
    };

    const options = { upsert: true, new: true };

    try {
        const doc = await WebsiteSection.findOneAndUpdate(filter, update, options);
        console.log('[ContactUs FAQ] upserted, _id =', doc?._id?.toString?.());
    } catch (err) {
        console.error('[ContactUs FAQ] upsert failed:', err.message);
    }
}


const sharp = require('sharp');


const cleanOneLine = (s = "") =>
    String(s).replace(/^[\s"'"“"‘'`]+|[\s"'"“"‘'`]+$/g, "").replace(/\s+/g, " ").trim();


const normalizeArray = (input, fieldName, mandatory = false) => {
    if (!input) {
        if (mandatory) throw new Error(`${fieldName} is required`);
        return [];
    }

    let arr = [];
    if (typeof input === 'string') {
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) arr = parsed;
            else arr = [parsed];
        } catch {
            // single string, wrap in array
            arr = [input];
        }
    } else if (Array.isArray(input)) {
        arr = input;
    } else {
        arr = [String(input)];
    }

    // Trim strings and remove empty
    arr = arr.map(v => String(v).trim()).filter(Boolean);

    if (mandatory && arr.length === 0) throw new Error(`${fieldName} cannot be empty`);
    return arr;
};

module.exports = {

    getDashboardStats: async (req, res) => {
        try {
            const userId = req.user.userId;

            // Get counts
            const totalUsers = await Users.countDocuments();
            const totalProjects = await userProjects.countDocuments({ userId });
            const totalThemes = await Theme.countDocuments();

            return res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    totalProjects,
                    totalThemes
                }
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard statistics',
                error: error.message
            });
        }
    },

    uploadFileapi: async (req, res) => {
        try {
            const file = req?.files?.file; // express-fileupload: field name "file"
            if (!file) {
                return helper.sendError(res, 400, 'file is required');
            }

            const folderPath = 'public/files/';

            // If it's an image -> convert to WebP, then upload as a stream.
            if (file.mimetype && file.mimetype.startsWith('image/')) {
                // express-fileupload gives either tempFilePath (when useTempFiles:true) or data (Buffer)
                const input = file.tempFilePath ? file.tempFilePath : file.data;
                if (!input) {
                    return helper.sendError(res, 400, 'No valid image input (tempFilePath or data) found.');
                }

                const webpBuf = await sharp(input, { failOnError: false })
                    .rotate()
                    .webp({ quality: 78, effort: 5 })
                    .toBuffer();

                const stream = Readable.from(webpBuf);
                const webpFile = {
                    name: `${Date.now()}.webp`,     // your helper uses file.name
                    mimetype: 'image/webp',
                    size: webpBuf.length,
                    stream                              // your helper accepts file.stream
                };

                const savedName = await helper.uploadFile(webpFile, folderPath, null); // <- removed imgResp
                const url = `/files/${savedName}`;
                return helper.sendSuccess(res, 201, 'File uploaded successfully!!', { url });
            }

            // Non-image: pass through as-is
            // Your helper accepts either tempFilePath or stream. Prefer tempFilePath if present.
            let savedName;
            if (file.tempFilePath) {
                savedName = await helper.uploadFile(file, folderPath, null);
            } else if (file.data) {
                const stream = Readable.from(file.data);
                const passthrough = {
                    name: file.name,
                    mimetype: file.mimetype,
                    size: file.size,
                    stream
                };
                savedName = await helper.uploadFile(passthrough, folderPath, null);
            } else {
                return helper.sendError(res, 400, 'No valid file stream or tempFilePath found.');
            }

            const url = `/files/${savedName}`;
            return helper.sendSuccess(res, 201, 'File uploaded successfully!!', { url });
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, error?.message || 'Upload failed');
        }
    },
    openai: async (req, res) => {
        try {
            let prompt = req.body.prompt;
            if (!prompt) { throw "prompt is required" }

            const userId = req.user?.userId || req.body.userId || null;
            const projectId = req.body.projectId || null;

            const OpenAiResponse = await getResponseFromOpenAITracked(
                prompt,
                'OpenAIContentGeneration',
                {
                    userId,
                    projectId: projectId || 'general',
                    pageId: req.body.pageId || projectId || 'general',
                    promptFrom: req.body.promptFrom || 'admin_panel',
                    promptFor: req.body.promptFor || 'content_generation'
                }
            );

            return helper.sendSuccess(res, 201, 'Content generated Sucessfuly!!', OpenAiResponse);

        }
        catch (error) {
            console.error(error);
            return helper.sendError(res, 500, error);
        }

    },

    getFocusedKeyword: async (req, res) => {
        // console.log("right destination",req.body); return

        try {
            let { serviceType, projectName, categories, subCategories, microCategories } = req.body;

            categories = normalizeArray(categories, 'categories', false);
            subCategories = normalizeArray(subCategories, 'subCategories', false);
            microCategories = normalizeArray(microCategories, 'microCategories', false);





            let mainCategory = categories.length > 0 ? categories[0] : "";
            const subcategorieslist = []
                .concat(subCategories || [])
                .map(v => String(v).trim())
                .filter(Boolean)
                .join(', ');

            const microcategorieslist = []
                .concat(microCategories || [])
                .map(v => String(v).trim())
                .filter(Boolean)
                .join(', ');
            console.log(mainCategory, subcategorieslist, "sub<<< adn micro>>>", microcategorieslist, "<fast<<");

            if (!serviceType || !projectName) {
                return res.status(400).json({
                    message: 'serviceType, projectName are required'
                });
            }
            let userId = req.user.userId
            let label = "FOCUS KEYWROD"
            let promptFrom = "getFocusedKeyword"
            let promptFor = projectName
            let projectId = projectName
            let pageId = projectName

            let focusCategory = microcategorieslist || subcategorieslist || '';
            let prompt = `Suggest the best primary SEO keyword phrase (up to 5 words) for a website with the project name "${projectName}". The website is in the "${mainCategory}" category and focuses on "${focusCategory}". Return only the keyword phrase, without any extra explanation or punctuation.`;

            const result = await fetchStringFromOpenAI(prompt, label, { userId, projectId, pageId, promptFrom, promptFor });

            return res.status(200).json({
                message: 'Focused Keyword fetched successfully',
                data: result
            });


        }
        catch (error) {
            console.error('Error in getUsageByProject:', error);
            const statusCode = Number(error?.statusCode) || 500;
            return res.status(statusCode).json({
                message: error?.message || 'An error occurred while fetching OpenAI usage.'
            });
        }
    },


    getProjectKeywords: async (req, res) => {
        try {
            let { projectName, serviceType, focusKeyword, count, categories, subCategories, microCategories } = req.body;


            categories = normalizeArray(categories, 'categories', false);
            subCategories = normalizeArray(subCategories, 'subCategories', false);
            microCategories = normalizeArray(microCategories, 'microCategories', false);


            let mainCategory = categories.length > 0 ? categories[0] : "";
            const subcategorieslist = []
                .concat(subCategories || [])
                .map(v => String(v).trim())
                .filter(Boolean)
                .join(', ');

            const microcategorieslist = []
                .concat(microCategories || [])
                .map(v => String(v).trim())
                .filter(Boolean)
                .join(', ');

            // console.log(mainCategory, subcategorieslist, "sub<<< adn micro>>>", microcategorieslist, "<fast<<"); return


            if (!projectName || !serviceType) {
                return res.status(400).json({
                    message: 'projectName and serviceType are required'
                });
            }

            // Optional: how many keywords to generate (default 8; clamp 3..15)
            const n = Math.max(3, Math.min(Number(count) || 8, 15));

            // audit/meta (same style as your existing calls)
            const userId = req.user?.userId;
            const label = 'PROJECT_KEYWORDS';
            const promptFrom = 'getProjectKeywords';
            const promptFor = projectName;
            const projectId = projectName;
            const pageId = projectName;

            // Prompt: force *only* a JSON array of strings
            let focusCategory = microcategorieslist || subcategorieslist || '';

            const prompt = `
            Return ONLY a JSON array of ${n} SEO keywords (2–4 words each) for a website with the project name "${projectName}". 
            The site is in the "${mainCategory}" category and focuses on "${focusCategory}".
            ${focusKeyword ? `Include close variants of the focus keyword "${focusKeyword}" near the beginning.` : ''}
            Do not include any explanations, keys, or objects—just a raw JSON array of strings.
            `.trim();


            let result = await fetchJSONFromOpenAI(
                prompt,
                label,
                { userId, projectId, pageId, promptFrom, promptFor }
            );

            // Defensive: ensure we end with a string[] cleanly
            if (typeof result === 'string') {
                try { result = JSON.parse(result); } catch (_) { /* fall through */ }
            }
            if (!Array.isArray(result)) {
                return res.status(502).json({ message: 'Model did not return a JSON array.' });
            }

            // Sanitize items -> strings, trimmed, non-empty, unique
            const cleaned = Array.from(
                new Set(
                    result
                        .map(x => String(x || '').replace(/\s+/g, ' ').trim())
                        .filter(x => x.length > 0)
                )
            );

            return res.status(200).json({
                message: 'Keywords generated successfully',
                data: cleaned
            });
        } catch (error) {
            console.error('Error in getProjectKeywords:', error);
            const statusCode = Number(error?.statusCode) || 500;
            return res.status(statusCode).json({
                message: error?.message || 'Failed to generate keywords'
            });
        }
    },

    /* --- Generate Blog Meta Title --- */
    getBlogMetaTitle: async (req, res) => {
        try {
            const { title, type } = req.body;
            if (!title || !type) {
                return res.status(400).json({ message: "title and type are required" });
            }

            const userId = req.user?.userId;
            const label = "BLOG_META_TITLE";
            const promptFrom = "getBlogMetaTitle";
            const promptFor = title;
            const projectId = req.body.projectId || type;
            const pageId = title;

            const prompt = `
Write a concise SEO meta title for a blog post.
Inputs:
- Post title: "${title}"
- Content type/niche: "${type}"

Rules:
- Aim ≤ 60 characters (hard max 65).
- Use Title Case.
- Include the core idea from the post title.
- No brand name, quotes, emojis, or trailing punctuation.
- Return ONLY the title as plain text (no JSON, no extra words).
      `.trim();

            let result = await fetchStringFromOpenAI(prompt, label, {
                userId, projectId, pageId, promptFrom, promptFor,
            });

            // sanitize and softly enforce 65-char cap
            let out = cleanOneLine(result);
            const MAX = 65;
            if (out.length > MAX) out = out.slice(0, MAX).replace(/\s+\S*$/, "");

            return res.status(200).json({
                message: "Meta title generated successfully",
                data: out,
            });
        } catch (error) {
            console.error("Error in getBlogMetaTitle:", error);
            return res.status(500).json({ message: "Failed to generate meta title" });
        }
    },

    /* --- Generate Blog Meta Keywords --- */
    getBlogMetaKeywords: async (req, res) => {
        try {
            const { title, type, focusKeyword, count } = req.body;
            if (!title || !type) {
                return res.status(400).json({ message: "title and type are required" });
            }

            const n = Math.max(3, Math.min(Number(count) || 8, 15));

            const userId = req.user?.userId;
            const label = "BLOG_META_KEYWORDS";
            const promptFrom = "getBlogMetaKeywords";
            const promptFor = title;
            const projectId = req.body.projectId || type;
            const pageId = title;

            const prompt = `
Return ONLY a JSON array of ${n} SEO meta keywords (2–4 words each) for a blog post.
Context:
- Post title: "${title}"
- Content type/niche: "${type}"
${focusKeyword ? `- Optional focus keyword: "${focusKeyword}" (include close variants near the start)` : ""}

Strict rules:
- JSON array of strings ONLY (e.g., ["keyword one","keyword two"]).
- No explanations, no keys, no objects, no trailing text.
      `.trim();

            let result = await fetchJSONFromOpenAI(prompt, label, {
                userId, projectId, pageId, promptFrom, promptFor,
            });

            if (typeof result === "string") {
                try { result = JSON.parse(result); } catch (_) { /* ignore */ }
            }
            if (!Array.isArray(result)) {
                return res.status(502).json({ message: "Model did not return a JSON array." });
            }

            // sanitize -> unique string[]
            const cleaned = Array.from(new Set(
                result
                    .map(x => String(x || "").replace(/\s+/g, " ").trim())
                    .filter(x => x.length > 0)
            ));

            return res.status(200).json({
                message: "Meta keywords generated successfully",
                data: cleaned,
            });
        } catch (error) {
            console.error("Error in getBlogMetaKeywords:", error);
            return res.status(500).json({ message: "Failed to generate meta keywords" });
        }
    },

    /* --- Generate Blog Meta Description --- */
    getBlogMetaDescription: async (req, res) => {
        try {
            const { title, type } = req.body;
            if (!title || !type) {
                return res.status(400).json({ message: "title and type are required" });
            }

            const userId = req.user?.userId;
            const label = "BLOG_META_DESCRIPTION";
            const promptFrom = "getBlogMetaDescription";
            const promptFor = title;
            const projectId = req.body.projectId || type;
            const pageId = title;

            const prompt = `
Write a compelling SEO meta description for a blog post.
Inputs:
- Post title: "${title}"
- Content type/niche: "${type}"

Rules:
- 150–160 characters preferred (hard max 160).
- Active voice; clear benefit; natural keyword use from the title.
- No quotes, emojis, or call-to-action spam.
- Return ONLY the sentence as plain text (no JSON, no extra words).
      `.trim();

            let result = await fetchStringFromOpenAI(prompt, label, {
                userId, projectId, pageId, promptFrom, promptFor,
            });

            let out = cleanOneLine(result);
            const MAX = 160;
            if (out.length > MAX) out = out.slice(0, MAX).replace(/\s+\S*$/, "");

            return res.status(200).json({
                message: "Meta description generated successfully",
                data: out,
            });
        } catch (error) {
            console.error("Error in getBlogMetaDescription:", error);
            return res.status(500).json({ message: "Failed to generate meta description" });
        }
    },
    generateImageNanoBanana: async (req, res) => {
        try {
            const { prompt, projectId, pageId } = req.body;
            if (!prompt) {
                return res.status(400).json({ message: "prompt is required" });
            }
            if (!projectId || !String(projectId).trim()) {
                return res.status(400).json({ message: "projectId is required" });
            }

            const API_KEY = process.env.GEMINI_API_KEY;
            if (!API_KEY) {
                return res.status(500).json({ message: "GEMINI_API_KEY is not configured" });
            }

            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(API_KEY);

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
            const result = await model.generateContent(prompt);
            const response = await result.response;

            // Extract token usage information from response
            // usageMetadata can be in result.response or response object
            const usageMetadata = result.response?.usageMetadata || response?.usageMetadata || result?.usageMetadata || {};
            const inputTokens = usageMetadata.promptTokenCount || 0;
            const outputTokens = usageMetadata.candidatesTokenCount || 0;
            const totalTokens = usageMetadata.totalTokenCount || (inputTokens + outputTokens);

            // Pricing per million tokens (as per official Gemini pricing)
            // Text: Input: $0.30 / Output: $2.50 per million
            // Image: Input: $0.30 / Output: $0.039 per million (per image)
            // Since we're inputting text (prompt) and getting image output:
            const inputPricePerMillion = 0.30; // USD per million tokens (text input)
            const outputPricePerMillion = 0.039; // USD per million tokens (image output)

            // Calculate costs in USD
            const inputCostUSD = (inputTokens / 1_000_000) * inputPricePerMillion;
            const outputCostUSD = (outputTokens / 1_000_000) * outputPricePerMillion;
            const totalCostUSD = inputCostUSD + outputCostUSD;

            // Convert to INR (using approximate rate: 1 USD = 83 INR)
            const usdToInrRate = 83;
            const inputCostINR = inputCostUSD * usdToInrRate;
            const outputCostINR = outputCostUSD * usdToInrRate;
            const totalCostINR = totalCostUSD * usdToInrRate;

            // Log token usage and pricing information
            console.log('\n========== Gemini Image Generation Token Usage ==========');
            console.log(`📊 Input Tokens:  ${inputTokens.toLocaleString()}`);
            console.log(`📊 Output Tokens: ${outputTokens.toLocaleString()}`);
            console.log(`📊 Total Tokens:  ${totalTokens.toLocaleString()}`);
            console.log('\n💰 Cost Breakdown:');
            console.log(`   Input Cost:  $${inputCostUSD.toFixed(6)} (₹${inputCostINR.toFixed(4)})`);
            console.log(`   Output Cost: $${outputCostUSD.toFixed(6)} (₹${outputCostINR.toFixed(4)})`);
            console.log(`   Total Cost:  $${totalCostUSD.toFixed(6)} (₹${totalCostINR.toFixed(4)})`);
            console.log('==========================================================\n');

            // Extract image data from response structure
            const candidate = response.candidates?.[0];
            if (!candidate || !candidate.content || !candidate.content.parts) {
                return res.status(500).json({
                    message: "Failed to generate image: Invalid response structure",
                    error: "No image data found in response"
                });
            }

            // Find the part containing image data
            const imagePart = candidate.content.parts.find(part => part.inlineData);
            if (!imagePart || !imagePart.inlineData) {
                // If no inlineData, check if there's text that might contain image reference
                const textPart = candidate.content.parts.find(part => part.text);
                if (textPart && textPart.text) {
                    return res.status(500).json({
                        message: "Image generation returned text instead of image data",
                        error: textPart.text,
                        note: "The model may not support image generation or returned a text response"
                    });
                }
                return res.status(500).json({
                    message: "Failed to generate image: No image data found",
                    error: "Response does not contain image data"
                });
            }

            // Extract base64 image data
            const base64Image = imagePart.inlineData.data;

            // Convert base64 to Buffer
            const imageBuffer = Buffer.from(base64Image, 'base64');

            const orientation = generateImages.parseOrientation(
                req.body.orientation != null ? req.body.orientation : 1
            );

            const uploadFolder = `public/images/${String(projectId).trim()}`;

            // Same premium WebP + HD resize as /generateImage (origin Gemini)
            const imageUrl = await generateImages.saveBufferAsWebp(
                imageBuffer,
                "gemini-nano",
                orientation,
                uploadFolder
            );
            const savedFileName = imageUrl.split("/").pop() || `generated_${Date.now()}.webp`;
            const mimeType = "image/webp";

            if (req.user?.userId && projectId) {
                await trackCreditsUsage({
                    userId: String(req.user.userId),
                    projectId: String(projectId),
                    usageType: 2, // images (gemini/nano)
                    promptFrom: "AdminController",
                    promptFor: "generateImageNanoBanana",
                    pageId: String(pageId || projectId),
                    inputTokens: inputTokens,
                    outputTokens: outputTokens,
                    imagesCount: 1,
                    pricing: totalCostUSD,
                    status: 1,
                    is_retried: 0
                });
            }

            return res.status(200).json({
                message: "Image generated successfully",
                data: {
                    imageUrl: imageUrl,
                    fileName: savedFileName,
                    mimeType: mimeType,
                    prompt: prompt,
                    tokenUsage: {
                        inputTokens: inputTokens,
                        outputTokens: outputTokens,
                        totalTokens: totalTokens
                    },
                    cost: {
                        usd: {
                            input: inputCostUSD,
                            output: outputCostUSD,
                            total: totalCostUSD
                        },
                        inr: {
                            input: inputCostINR,
                            output: outputCostINR,
                            total: totalCostINR
                        }
                    }
                }
            });

        } catch (error) {
            console.error("Error in generateImage:", error);
            if (req.user?.userId && req.body?.projectId) {
                await trackCreditsUsage({
                    userId: String(req.user.userId),
                    projectId: String(req.body.projectId),
                    usageType: 2,
                    promptFrom: "AdminController",
                    promptFor: "generateImageNanoBanana",
                    pageId: String(req.body?.pageId || req.body.projectId),
                    inputTokens: 0,
                    outputTokens: 0,
                    imagesCount: 0,
                    pricing: 0,
                    status: 0,
                    is_retried: 0
                });
            }
            return res.status(500).json({
                message: "Failed to generate image",
                error: error.message
            });
        }
    },

    generateImage: async (req, res) => {
  try {
    const { prompt, origin, orientation, projectId } = req.body;
    let { total = 1 } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ message: "prompt is required and must be a non-empty string" });
    }
    if (!projectId || !String(projectId).trim()) {
      return res.status(400).json({ message: "projectId is required" });
    }

    const parsedOrigin = Number(origin);
    if (!origin || ![1, 2, 3, 4, 5].includes(parsedOrigin)) {
      return res.status(400).json({
        message:
          "origin is required: 1 (freepik), 2 (gemini), 3 (mixed), 4 (leonardo), 5 (flux)",
      });
    }

    const parsedOrientation = Number(orientation);
    if (!orientation || ![1, 2].includes(parsedOrientation)) {
      return res.status(400).json({
        message: "orientation is required: 1 (landscape), 2 (portrait)"
      });
    }

    total = Math.max(1, Math.min(10, Number(total) || 1));

    const result = await generateImages(prompt.trim(), total, parsedOrientation, parsedOrigin, {
      userId: req.user?.userId ? String(req.user.userId) : null,
      projectId: String(projectId),
      pageId: req.body?.pageId ? String(req.body.pageId) : (req.body?.projectId ? String(req.body.projectId) : null),
      promptFrom: "AdminController",
      promptFor: "generateImage",
    });

    if (!result.images || result.images.length === 0) {
      return res.status(500).json({
        message: "Image generation failed — no images were produced",
        data: { requested: total, generated: 0, images: [] }
      });
    }

    return res.status(200).json({
      message: result.images.length < total
        ? `Partial success: ${result.images.length} of ${total} images generated`
        : "Images generated successfully",
      data: result
    });

  } catch (error) {
    console.error("Error in generateImage:", error);
    return res.status(500).json({
      message: "Failed to generate images",
      error: error.message
    });
  }
},


    getLocalAreasWithPincodes: async (req, res) => {
        try {
            let { cityId, count } = req.body;

            if (!cityId) {
                return res.status(400).json({ message: "cityId is required" });
            }

            // Parse and validate count - default to 1, clamp between 1-50
            const parsedCount = count !== undefined && count !== null ? Number(count) : 1;
            const n = Math.max(1, Math.min(isNaN(parsedCount) ? 1 : parsedCount, 50));

            console.log("Generating local areas with pincodes for cityId:", cityId, "count:", n);

            // Fetch city->state->country text for prompt
            async function getAddressByCityId(cityId) {
                const city = await City.findOne({ id: cityId }).lean();
                if (!city) return null;
                const state = await State.findOne({ id: city.state_id }).lean();
                const country = state ? await Country.findOne({ id: state.country_id }).lean() : null;
                return `${city.name}, ${state?.name || ""}, ${country?.name || ""}`;
            }

            const address = await getAddressByCityId(cityId);
            console.log("Derived address for prompt:", address);
            if (!address) return res.status(404).json({ message: "City not found using cityId" });

            const parts = address.split(',').map(x => x.trim()).filter(Boolean);
            if (parts.length < 3) return res.status(400).json({ message: "Invalid cityId: Could not derive city,state,country" });

            const cityForPrompt = parts[0];
            const stateForPrompt = parts[1];
            const countryForPrompt = parts[2];

            // Prompt AI for area names & pincodes only
            const prompt = `Return ONLY a JSON array of ${n} local areas within 30km radius of "${cityForPrompt}", "${stateForPrompt}", "${countryForPrompt}" with their postal codes.
 
Requirements:
- Only include areas within 30 kilometer radius from ${cityForPrompt} city center
- Each object must have: { "areaName": "<exact local area name>", "pincode": "<valid postal code>" }
- Use real, verified postal codes only (format varies by country)
- Postal code format examples:
  * India: 6-digit (e.g., "201301")
  * USA: 5-digit ZIP (e.g., "90210") 
  * UK: Alphanumeric (e.g., "SW1A 1AA")
  * Canada: Alphanumeric (e.g., "M5H 2N2")
  * Germany: 5-digit (e.g., "10115")
  * Australia: 4-digit (e.g., "2000")
- Match postal code format to the country specified
- Do not include areas beyond 30km distance
- Return valid JSON array only, no additional text or explanations
 
Example format:
[
  {"areaName": "Area Name 1", "pincode": "201301"},
  {"areaName": "Area Name 2", "pincode": "201302"}
]`.trim();


            console.log("Prompt sent to OpenAI for area with pin codes:", prompt);

            let result = await fetchJSONFromOpenAI(prompt, "LOCAL_AREAS_PINCODES", {
                userId: req.user?.userId,
                projectId: cityId,
                pageId: cityId,
                promptFrom: "getLocalAreasWithPincodes",
                promptFor: address
            });

            console.log("Raw result from OpenAI:", result);

            if (typeof result === "string") {
                try { result = JSON.parse(result); } catch (e) { /* ignore */ }
            }

            if (!Array.isArray(result)) return res.status(502).json({ message: "Model did not return a valid JSON array." });

            // Deduplicate and filter invalid
            // Deduplicate and filter invalid
            const seen = new Set();
            const normalized = [];
            for (const item of result) {
                if (!item?.areaName || !item?.pincode) continue;
                const name = item.areaName.trim();
                const pin = String(item.pincode).trim(); // ✅ Just trim, no validation

                if (!name) continue; // ✅ Keep only name validation
                const key = `${name.toLowerCase()}::${pin}`;
                if (seen.has(key)) continue;
                seen.add(key);
                normalized.push({ areaName: name, pincode: pin });
            }


            if (normalized.length === 0) return res.status(422).json({ message: "No valid local areas returned by model." });

            const finalAreas = normalized.slice(0, n);

            // Format as requested: array of strings like "Area Name (pincode)"
            const formattedArray = finalAreas.map(area => `${area.areaName} (${area.pincode})`);

            return res.status(200).json({
                message: `Generated ${formattedArray.length} local areas with pincodes`,
                data: formattedArray
            });

        } catch (error) {
            console.log("Error in getLocalAreasWithPincodes:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    },




    getOpenAIUsageByProject: async (req, res) => {
        try {
            const { projectId } = req.body;
            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }

            const entriesRaw = await CreditTransaction.find({
                project_id: projectId,
                usage_type: 0,
                source: "usage",
            })
                .select("usage_type prompt_from prompt_for page_id input_tokens output_tokens pricing created_at")
                .sort({ created_at: -1 })
                .lean();
            if (!entriesRaw.length) {
                return res.status(404).json({ message: 'No usage data found for this project' });
            }

            const entries = entriesRaw.map(entry => ({
                usageType: entry.usage_type,
                promptFrom: entry.prompt_from,
                promptFor: entry.prompt_for,
                pageId: entry.page_id,
                inputTokens: entry.input_tokens,
                outputTokens: entry.output_tokens,
                cost: entry.pricing,
                when: entry.created_at
            }));

            // Totals
            const totals = entries.reduce((acc, e) => {
                acc.totalInputTokens += (e.inputTokens || 0);
                acc.totalOutputTokens += (e.outputTokens || 0);
                acc.totalCost += (e.cost || 0);
                return acc;
            }, { totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0 });

            return res.status(200).json({
                message: 'Usage data fetched successfully',
                data: {
                    totals,
                    entries
                }
            });

        } catch (error) {
            console.error('Error in getUsageByProject:', error);
            return res
                .status(500)
                .json({ message: 'An error occurred while fetching usage data.' });
        }
    },

    getCreditsUsageReport: async (req, res) => {
        try {
            let { page = 1, limit = 50, search = "", usageType } = req.body || {};
            page = Math.max(1, parseInt(page, 10) || 1);
            limit = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
            const requesterId = req.user?.userId;
            const requester = requesterId && mongoose.isValidObjectId(requesterId)
                ? await User.findById(requesterId).select("isSuper").lean()
                : null;
            const canViewUserName = Number(requester?.isSuper || 0) === 1;
            const requesterIdStr = requesterId ? String(requesterId) : "";

            const usageTypeFilter = usageType !== undefined && usageType !== null && usageType !== ""
                ? Number(usageType)
                : null;

            const docs = await CreditTransaction.find({})
                .select("user_id project_id usage_type type amount pricing prompt_from prompt_for page_id input_tokens output_tokens images_count status transaction_id subscription_purchase_id balance_after created_at updated_at")
                .lean();

            const projectIdSet = new Set();
            const userIdSet = new Set();
            for (const d of docs) {
                if (d?.project_id) projectIdSet.add(String(d.project_id));
                if (d?.user_id) userIdSet.add(String(d.user_id));
            }

            const rawProjectIds = Array.from(projectIdSet);
            const objectProjectIds = rawProjectIds.filter((id) => mongoose.isValidObjectId(id));
            const projects = objectProjectIds.length
                ? await UserProject.find({ _id: { $in: objectProjectIds } })
                    .select("_id projectName userId")
                    .lean()
                : [];

            const projectMap = new Map(projects.map((p) => [String(p._id), p]));

            const rawUserIds = Array.from(userIdSet);
            const objectUserIds = rawUserIds.filter((id) => mongoose.isValidObjectId(id));
            const users = objectUserIds.length
                ? await User.find({ _id: { $in: objectUserIds } })
                    .select("_id fullName email")
                    .lean()
                : [];
            const mergedUsers = [...users];
            const userMap = new Map(mergedUsers.map((u) => [String(u._id), u]));

            const usageTypeLabel = {
                0: "OpenAI",
                1: "FreePik",
                2: "Images",
                3: "Other",
            };

            const rows = [];
            for (const entry of docs) {
                const projectIdStr = String(entry.project_id || "");
                const project = projectMap.get(projectIdStr) || null;
                const ownerUserId = String(entry.user_id || (project?.userId || ""));
                if (!canViewUserName && requesterIdStr && ownerUserId !== requesterIdStr) continue;

                const ownerUser = userMap.get(ownerUserId) || null;
                const ownerName = ownerUser?.fullName || ownerUser?.email || "Unknown";

                const entryUsageType = Number(entry?.usage_type ?? 3);
                if (usageTypeFilter !== null && entryUsageType !== usageTypeFilter) continue;
                if (Number(entry?.amount || 0) <= 0) continue;

                rows.push({
                    projectId: projectIdStr || "-",
                    projectName: project?.projectName || "Unknown Project",
                    userId: ownerUserId || "system",
                    name: canViewUserName ? ownerName : "-",
                    usageType: entryUsageType,
                    usageTypeLabel: usageTypeLabel[entryUsageType] || "Other",
                    transactionType: String(entry.type || "debit"),
                    creditUsage: Number(entry.amount || 0),
                    pricing: Number(entry.pricing || 0),
                    creditsLeft: Number(entry?.balance_after || 0),
                    totalCredits: 0,
                    promptFrom: entry?.prompt_from || "default",
                    promptFor: entry?.prompt_for || "default",
                    pageId: entry?.page_id || projectIdStr,
                    inputTokens: Number(entry?.input_tokens || 0),
                    outputTokens: Number(entry?.output_tokens || 0),
                    imagesCount: Number(entry?.images_count || 0),
                    status: Number(entry?.status ?? 1),
                    transactionId: String(entry?.transaction_id || ""),
                    subscriptionPurchaseId: entry?.subscription_purchase_id ? String(entry.subscription_purchase_id) : "",
                    createdAt: entry?.created_at || null,
                    updatedAt: entry?.updated_at || null,
                });
            }

            rows.sort((a, b) => {
                const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return tb - ta;
            });

            // creditsLeft is directly stored as balance_after on each transaction.

            const q = String(search || "").trim().toLowerCase();
            const filtered = q
                ? rows.filter((r) =>
                    String(r.projectId).toLowerCase().includes(q) ||
                    String(r.projectName).toLowerCase().includes(q) ||
                    String(r.name).toLowerCase().includes(q) ||
                    String(r.promptFrom).toLowerCase().includes(q) ||
                    String(r.promptFor).toLowerCase().includes(q) ||
                    String(r.usageTypeLabel).toLowerCase().includes(q)
                )
                : rows;

            const total = filtered.length;
            const start = (page - 1) * limit;
            const end = start + limit;
            const pageRows = filtered.slice(start, end).map((r, idx) => ({
                serialNo: start + idx + 1,
                ...r,
            }));

            return res.status(200).json({
                message: "Credits usage report fetched successfully",
                data: pageRows,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: end < total,
                    hasPrev: page > 1,
                    canViewUserName,
                },
            });
        } catch (error) {
            console.error("Error in getCreditsUsageReport:", error);
            return res.status(500).json({
                message: "Failed to fetch credits usage report",
                error: error.message,
            });
        }
    },

    openAiString: async (req, res) => {

        try {
            const { prompt, label, userId, projectId, pageId, promptFrom, promptFor } = req.body;

            if (!prompt || !label || !userId || !projectId || !pageId || !promptFrom || !promptFor) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            const result = await fetchStringFromOpenAI(prompt, label, { userId, projectId, pageId, promptFrom, promptFor });
            return res.status(200).json({ result });
        } catch (err) {
            return res.status(500).json({ error: `Failed to fetch string: ${err.message}` });
        }

    },

    openAiJSON: async (req, res) => {
        try {
            const { prompt, label, userId, projectId, pageId, promptFrom, promptFor } = req.body;

            if (!prompt || !label || !userId || !projectId || !pageId || !promptFrom || !promptFor) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            const result = await fetchJSONFromOpenAI(prompt, label, { userId, projectId, pageId, promptFrom, promptFor });
            return res.status(200).json({ result });
        } catch (err) {
            return res.status(500).json({ error: `Failed to fetch JSON: ${err.message}` });
        }
    },

    queueLatLngCitiesCopyWithoutSpecificCountry: async (req, res) => {
        try {
            // Only cities not marked unavailable (notavailable != 1) 
            // and missing at least one coord
            const filter = {
                notavailable: { $ne: 1 },
                $or: [{ lat: null }, { lng: null }]
            };

            // 1) Count how many are still eligible
            const citiesCount = await City.countDocuments(filter);
            console.log(citiesCount, "cities remaining to queue");

            // 2) Fetch a batch
            const cities = await City.find(filter)
                .limit(4912)
                .lean();

            // 3) Build a map of state_id → { name, country_id }
            const stateIds = [...new Set(cities.map(c => c.state_id))];
            const states = await State.find({ id: { $in: stateIds } }).lean();
            const statesMap = {};
            states.forEach(s => {
                statesMap[s.id] = { name: s.name, country_id: s.country_id };
            });

            // 4) Build a map of country_id → countryName
            const countryIds = [...new Set(states.map(s => s.country_id))];
            const countries = await Country.find({ id: { $in: countryIds } }).lean();
            const countriesMap = {};
            countries.forEach(c => {
                countriesMap[c.id] = c.name;
            });

            // 5) Enqueue each city
            for (let city of cities) {
                const stateInfo = statesMap[city.state_id];
                if (!stateInfo) continue;

                const countryName = countriesMap[stateInfo.country_id];
                if (!countryName) continue;

                await redislatlngqueueQueue.add({
                    id: city.id,
                    cityName: city.name,
                    stateName: stateInfo.name,
                    countryName
                });
            }

            res.json({
                message: `${cities.length} cities queued for lat/lng update.`
            });

        } catch (err) {
            console.error('City Enqueue Error:', err);
            res.status(500).json({ message: 'Error queuing cities.' });
        }
    },


    queueLatLngSingleCity: async (req, res) => {
        try {
            // Only cities not marked unavailable (notavailable != 1) 
            // and missing at least one coord, and cities within states having country_id 231
            const filter = {

                $or: [{ lat: null }, { lng: null }],
                id: "46875"

            };

            // 1) Count how many are still eligible
            const citiesCount = await City.countDocuments(filter);
            console.log(citiesCount, "cities remaining to queue");

            // 2) Fetch a batch
            const cities = await City.find(filter)
                .limit(1)  // Limit to 4900 cities
                .lean();

            // 3) Build a map of state_id → { name, country_id }
            const stateIds = [...new Set(cities.map(c => c.state_id))];
            const states = await State.find({ id: { $in: stateIds } }).lean();
            const statesMap = {};
            states.forEach(s => {
                statesMap[s.id] = { name: s.name, country_id: s.country_id };
            });

            // 4) Build a map of country_id → countryName
            const countryIds = [...new Set(states.map(s => s.country_id))];
            const countries = await Country.find({ id: { $in: countryIds } }).lean();
            const countriesMap = {};
            countries.forEach(c => {
                countriesMap[c.id] = c.name;
            });

            // 5) Enqueue each city
            for (let city of cities) {
                const stateInfo = statesMap[city.state_id];
                if (!stateInfo) continue;

                const countryName = countriesMap[stateInfo.country_id];
                if (!countryName) continue;

                const id = city.id
                const cityName = city.name
                const stateName = stateInfo.name


                try {
                    const resp = await axios.get('https://us1.locationiq.com/v1/search.php', {
                        params: {
                            key: process.env.LOCATIONIQ_API_KEY,
                            q: `${cityName}, ${stateName}, ${countryName}`,
                            format: 'json',
                            limit: 1,
                        },
                        headers: { 'User-Agent': 'LatLngCityWorker/1.0' },
                    });

                    const location = resp.data[0];
                    if (!location) {
                        // mark as unavailable and skip
                        await City.updateOne({ id }, { $set: { notavailable: 1 } });
                        console.warn(`⚠️ No geocode result for ${cityName}; marking notavailable.`);
                        return;
                    }

                    // successful – write back lat/lng
                    await City.updateOne(
                        { id },
                        { $set: { lat: location.lat, lng: location.lon } }
                    );
                    console.log(`✅ Updated lat/lng for city: ${cityName}`);
                    //    const filter = {
                    //                 notavailable: { $ne: 1 },
                    //                 $or: [{ lat: null }, { lng: null }]
                    //             };

                    //             // 1) Count how many are still eligible
                    //             const citiesCount = await AdminCity.countDocuments(filter);
                    //             console.log(citiesCount, "cities remaining to queue");

                } catch (err) {
                    console.error(`❌ Error for city ${cityName}:`, err.message);

                    if (err.response?.status === 429) {
                        // rate-limit: retry
                        console.warn('⚠️ Rate limited. Retrying after delay...');
                        await delay(5000);
                        throw err;
                    } else {
                        // other errors: mark unavailable so we don't loop forever
                        await City.updateOne({ id }, { $set: { notavailable: 1 } });
                        console.warn(`⚠️ Marked ${cityName} notavailable due to error.`);
                    }
                }
            }

            res.json({
                message: `${cities.length} cities queued for lat/lng update.`
            });

        } catch (err) {
            console.error('City Enqueue Error:', err);
            res.status(500).json({ message: 'Error queuing cities.' });
        }
    },


    queueLatLngCities: async (req, res) => {
        try {
            // Only cities not marked unavailable (notavailable != 1) 
            // and missing at least one coord, and cities within states having country_id 231
            const filter = {
                notavailable: { $ne: 1 },
                $or: [{ lat: null }, { lng: null }],
                // state_id: { $in: (await State.find({ country_id: 231 }).select('id').lean()).map(state => state.id) }
            };

            // 1) Count how many are still eligible
            const citiesCount = await City.countDocuments(filter);
            console.log(citiesCount, "cities remaining to queue");

            // 2) Fetch a batch
            const cities = await City.find(filter)
                .limit(4900)  // Limit to 4900 cities
                .lean();

            // 3) Build a map of state_id → { name, country_id }
            const stateIds = [...new Set(cities.map(c => c.state_id))];
            const states = await State.find({ id: { $in: stateIds } }).lean();
            const statesMap = {};
            states.forEach(s => {
                statesMap[s.id] = { name: s.name, country_id: s.country_id };
            });

            // 4) Build a map of country_id → countryName
            const countryIds = [...new Set(states.map(s => s.country_id))];
            const countries = await Country.find({ id: { $in: countryIds } }).lean();
            const countriesMap = {};
            countries.forEach(c => {
                countriesMap[c.id] = c.name;
            });

            // 5) Enqueue each city
            for (let city of cities) {
                const stateInfo = statesMap[city.state_id];
                if (!stateInfo) continue;

                const countryName = countriesMap[stateInfo.country_id];
                if (!countryName) continue;

                await redislatlngqueueQueue.add({
                    id: city.id,
                    cityName: city.name,
                    stateName: stateInfo.name,
                    countryName
                });
            }

            res.json({
                message: `${cities.length} cities queued for lat/lng update.`
            });

        } catch (err) {
            console.error('City Enqueue Error:', err);
            res.status(500).json({ message: 'Error queuing cities.' });
        }
    },

    queueLatLngCitiesCount: async (req, res) => {
        try {
            // Only cities not marked unavailable (notavailable != 1) 
            // and missing at least one coord, and cities within states having country_id 231
            const filter = {
                notavailable: { $ne: 1 },
                $or: [{ lat: null }, { lng: null }],
                state_id: { $in: (await State.find({ country_id: 231 }).select('id').lean()).map(state => state.id) }
            };

            // 1) Count how many are still eligible
            const citiesCount = await City.countDocuments(filter);
            console.log(citiesCount, "cities remaining to queue");

            // 2) Fetch a batch


            res.json({
                message: `${citiesCount} cities queued for lat/lng update.`
            });

        } catch (err) {
            console.error('City Enqueue Error:', err);
            res.status(500).json({ message: 'Error queuing cities.' });
        }
    },


    queuelatlngSTATE: async (req, res) => {
        try {

            const statesCount = await State.countDocuments({
                $or: [{ lat: null }, { lng: null }]
            });

            console.log(statesCount, "Left statesCountstatesCountstatesCount");

            // Fetch states needing lat/lng
            const states = await State.find({
                $or: [{ lat: null }, { lng: null }]
            }).limit(1600).lean();

            // Get all unique country_ids
            const countryIds = [...new Set(states.map(state => state.country_id))];

            // Fetch corresponding countries
            const countriesMap = {};
            const countries = await Country.find({ id: { $in: countryIds } }).lean();
            countries.forEach(c => {
                countriesMap[c.id] = c.name;
            });

            // Enqueue each state with full location string
            for (let state of states) {
                const countryName = countriesMap[state.country_id];
                if (!countryName) {
                    console.warn(`⚠️ No country found for state ID ${state.id}`);
                    continue;
                }

                await redislatlngqueueQueue.add({
                    id: state.id,
                    name: state.name,
                    countryName
                });
            }

            res.json({ message: `${states.length} states queued for lat/lng update.` });
        } catch (err) {
            console.error('State Enqueue Error:', err);
            res.status(500).json({ message: 'Error queuing states.' });
        }
    },

    genSNofSt: async (req, res) => {
        try {
            const { country_id } = req.body;

            if (!country_id) {
                return res.status(400).json({ message: 'Country ID is required.' });
            }

            // Fetch country details from the database using the provided country_id
            const country = await Country.findOne({ id: country_id }).lean();

            if (!country) {
                return res.status(404).json({ message: `Country with ID ${country_id} not found.` });
            }

            const countryName = country.name;

            let hasMoreStates = true;

            while (hasMoreStates) {
                // Fetch up to 100 states without sort names for this country
                const states = await State.find({
                    sortname: { $exists: false },
                    country_id: country_id
                }).limit(100).lean();

                if (states.length === 0) {
                    console.log(`All states for ${countryName} have been processed.`);
                    hasMoreStates = false;
                    break;
                }

                // Prepare the dynamic prompt using country name from DB
                const stateNames = states.map(state => state.name).join(", ");
                const prompt = `What are the official short names or abbreviations for the following states in ${countryName}: ${stateNames}? Please provide them as a comma-separated list.`;

                let sortnames = [];
                let attempts = 0;
                const maxAttempts = 3;

                // Retry until correct number of sort names are retrieved
                while (sortnames.length !== states.length && attempts < maxAttempts) {
                    attempts++;

                    const userId = req.user?.userId || 'admin';
                    const projectId = 'system_admin';
                    const OpenAiResponse = await getResponseFromOpenAITracked(
                        prompt,
                        'StateSortNameGeneration',
                        {
                            userId,
                            projectId,
                            pageId: country_id?.toString() || 'system',
                            promptFrom: 'admin_panel',
                            promptFor: 'state_sortname_generation'
                        }
                    );

                    sortnames = OpenAiResponse.text.split(',').map(name => name.trim());

                    console.log(`OpenAI response for ${countryName}: ${OpenAiResponse}`);

                    if (sortnames.length !== states.length) {
                        console.error(`Mismatch: Expected ${states.length} sort names, but got ${sortnames.length}. Retrying...`);
                    }
                }

                if (sortnames.length !== states.length) {
                    console.error(`Failed to get correct number of sort names for ${countryName} after ${attempts} attempts.`);
                    return res.status(400).json({
                        message: `Mismatch between states and generated short names for ${countryName}. Expected ${states.length}, but got ${sortnames.length}.`
                    });
                }

                // Update each state's sort name
                const updates = states.map((state, index) => {
                    const shortname = sortnames[index] || state.name.toUpperCase().slice(0, 2); // Fallback to first 2 letters
                    return State.updateOne({ id: state.id }, { sortname: shortname })
                        .then(() => {
                            console.log(`State '${state.name}' updated with sortname: ${shortname}`);
                        })
                        .catch(err => {
                            console.error(`Error updating state '${state.name}':`, err);
                        });
                });

                await Promise.all(updates);
            }

            res.json({ message: `All states for ${countryName} processed successfully.` });

        } catch (err) {
            console.error('Error processing states:', err);
            res.status(500).json({ message: 'Internal server error.' });
        }
    },

    verifytoken: async (req, res) => {
        try {

            console.log("right verification wrong verifcation")

            let user = req.user

            console.log(user, "user is here")

            const existingUser = await User.findById(user.userId);

            if (existingUser) {
                return helper.sendSuccess(res, 201, 'User verified successfully', existingUser);

            }

            else {

                console.log("Unverified user")
                throw "Unverified user"
            }


        } catch (error) {
            return helper.sendError(res, 500, 'Internal Server Error');

        }
    },

    login: async (req, res) => {
        try {
            let { email, phone, password, country_code, deviceToken, deviceType } = req.body;

            const requiredFields = ['password', 'deviceToken', 'deviceType'];
            const nonRequiredFields = ['phone', 'email', 'country_code'];

            // Validate fields
            if (!await helper.validateFields(req.body, requiredFields, nonRequiredFields, res)) {
                return;
            }

            // Ensure at least one contact detail (email or phone) is provided
            if (!email && !phone) {
                return helper.sendError(res, 400, 'Either email or phone must be provided');
            }

            // Validate country_code presence when a phone is provided
            if (phone && !country_code) {
                return helper.sendError(res, 400, 'Country code is required if phone is provided');
            }

            let userDetails;


            // Find user by email or phone based on the request
            // **Accept both type 0 and 1** when looking up by email or phone
            const typeFilter = { $in: [0, 1] };
            if (email) {
                userDetails = await User.findOne({ email, type: typeFilter });
            } else {
                userDetails = await User.findOne({ country_code, phone, type: typeFilter });
            }
            console.log(req.body, "req.body okay")

            console.log(userDetails, "userDetails")
            if (!userDetails) {
                console.log(userDetails)
                return helper.sendError(res, 404, 'User not found');
            }

            // Verify password using bcrypt
            const authentication = bcrypt.compareSync(password, userDetails.password);

            if (!authentication) {
                return helper.sendError(res, 401, "Email, phone, or password doesn't match");
            }

            // Check for the device in the user's devices array
            const existingDevice = userDetails.devices.find(
                (device) => device.deviceToken === deviceToken && device.deviceType === deviceType
            );

            if (existingDevice) {
                // Increment the tokenVersion for this device
                existingDevice.tokenVersion += 1;
            } else {
                // Add new device to the user's devices array
                userDetails.devices.push({
                    deviceToken,
                    deviceType,
                    tokenVersion: 0, // Start tokenVersion at 0 for new devices

                });
            }

            // Save the updated user with device changes
            await userDetails.save();

            const token = jwt.sign(
                {
                    userId: userDetails._id,
                    deviceToken,
                    tokenVersion: existingDevice ? existingDevice.tokenVersion : 0,
                },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            // Return success with token
            let userObject = userDetails.toObject();
            userObject.token = token;

            console.log("login sucess", token)

            return helper.sendSuccess(res, 201, 'User logged in successfully', userObject);
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, 'Internal Server Error');
        }
    },

    logout: async (req, res) => {
        try {
            const userId = req.user.userId; // Extract user ID from the authenticated request
            let { logoutFromAll, deviceToken } = req.body;

            if (!deviceToken && !logoutFromAll) {
                logoutFromAll = true
            }
            if (logoutFromAll) {

                console.log("User Wants log out from all devices!!!")
                // Logout from all devices
                const user = await User.findById(userId);

                if (!user) {
                    return helper.sendError(res, 404, 'User not found');
                }

                // Increment tokenVersion for all devices
                user.devices = user.devices.map(device => ({
                    ...device,
                    tokenVersion: device.tokenVersion + 1 // Increment tokenVersion for all devices
                }));

                // Save updated user data
                await user.save();

                return helper.sendSuccess(res, 200, 'User logged out successfully from all devices');
            } else {

                console.log("User want to log out from a selected Device!!!")
                // Logout from a single device
                if (!deviceToken) {
                    return helper.sendError(res, 400, 'Device token is required for single device logout');
                }

                const user = await User.findOneAndUpdate(
                    { _id: userId, "devices.deviceToken": deviceToken }, // Find the user and the specific device
                    { $inc: { "devices.$.tokenVersion": 1 } }, // Increment the tokenVersion for the matching device
                    { new: true }
                );

                if (!user) {
                    return helper.sendError(res, 404, 'Device not found or user not found');
                }

                return helper.sendSuccess(res, 200, 'User logged out successfully from the specified device');
            }
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, 'Internal Server Error');
        }
    },

    dashboard: async (req, res) => {
        try {

            const UsersCount = await User.countDocuments({ type: 0 });
            const userProjectsCount = await userProjects.countDocuments();
            console.log('Number of documents:', UsersCount);


            console.log("success fetched dashboard")

            res.status(200).json({
                success: true,
                code: 200,
                message: 'Forms fetched successfully',
                body: 23,
                "TotalUsersCount": UsersCount,
                "TotalOrdersCount": userProjectsCount

            })



        } catch (error) {

            // Catch any errors and return a consistent error response
            console.log("Error in login API:", error.message || error);
            return res.status(400).json({
                success: false,
                code: 400,
                message: error.message || "An error occurred", // Make sure to return a string message
                body: {},
            });

        }
    },

    openAiTest: async (req, res) => {
        const { title } = req.body;

        if (!title || typeof title !== "string") {
            return res.status(400).json({ message: "Title is required and should be a string." });
        }

        console.log(`Generating YouTube Short script for: ${title}`);

        try {
            const prompt = `Create a 40-second YouTube short on a topic = ${title} with limited words ( maximum 300 ) that are readable in 40 seconds. Please provide me with up-to-date information that is easy to understand and has good content that should include interesting facts, real numbers, and real data. Make sure to include a separate title and description. Don't add any links to websites and YouTube channels in the content and don't use emojis. please don't miss the last line for CTA. Please don't add steps. And make sure all the content should be in Hindi and according to 2025 and the Indian audience. Please follow the exact instructions and don't miss any keywords do the work in sequence for all topics and start from the first topic
            make sure output will similar like;=

            Title:
            भारत के सबसे खूबसूरत पेट-फ्रेंडली सनसेट पॉइंट्स

            Description:
            अगर आप अपने पेट के साथ सनसेट का मजा लेना चाहते हैं, तो ये भारत के सबसे खूबसूरत पेट-फ्रेंडली सनसेट पॉइंट्स हैं।

            Script (40-Second YouTube Short):
            "क्या आप जानते हैं कि भारत में 10 से ज्यादा सनसेट पॉइंट्स अब पेट-फ्रेंडली हो चुके हैं? अगर आप अपने पेट के साथ सनसेट का मजा लेना चाहते हैं, तो ये जगहें आपके लिए परफेक्ट हैं।

            कन्याकुमारी: यहां पेट्स के साथ सनसेट का मजा लें।

            गोवा का पालोलेम बीच: पेट्स के साथ बीच पर सनसेट का अनुभव।

            उदयपुर का लेक पिचोला: यहां पेट्स के साथ लेकसाइड सनसेट का मजा लें।

            मसूरी का लाल टिब्बा: पेट्स के साथ हिल स्टेशन पर सनसेट का अनुभव।

            2025 तक, भारत में पेट-फ्रेंडली सनसेट पॉइंट्स की संख्या 15% बढ़ने की उम्मीद है। तो, कब प्लान कर रहे हैं अपने पेट के साथ सनसेट ट्रिप? कमेंट में बताएं!"

            CTA:
            "अगर आपको यह जानकारी पसंद आई हो, तो इस वीडियो को लाइक करें और हमारे चैनल को सब्सक्राइब करें।"


            
            
            `;

            const userId = req.user?.userId || req.body.userId || 'admin';
            const projectId = req.body.projectId || 'system';

            const OpenAiResponse = await getResponseFromOpenAITracked(
                prompt,
                'YouTubeShortScript',
                {
                    userId,
                    projectId,
                    pageId: req.body.pageId || projectId,
                    promptFrom: 'admin_panel',
                    promptFor: 'youtube_short_script'
                }
            );

            const cleanedResponse = OpenAiResponse.text.replace(/```json|```/g, "").trim();

            return res.status(200).send(cleanedResponse);
        } catch (error) {
            console.error("Error generating YouTube Short script:", error);
            return res.status(500).json({ message: "An error occurred while processing your request." });
        }
    },



    create_user: async (req, res) => {

        try {

            const { fullName, email, phone, password, address } = req.body;

            if (!fullName || !email || !phone || !password || !address) {

                console.log(req.body)
                return res.status(400).json({ message: 'All fields are required' });
            }
            // Check if user already exists (by email or phone)
            const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
            if (existingUser) {
                console.log("Exists user")
                throw 'User already exists with the given email or phone number'
            }


            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            console.log("here we go!!!!!")

            // Create a new user
            const newUser = new User({
                fullName,
                email,
                phone,
                password: hashedPassword,
                address,
            });

            // Save the new user to the database
            await newUser.save();
            await CreditWallet.findOneAndUpdate(
                { user_id: newUser._id },
                {
                    $setOnInsert: {
                        balance: 0,
                        total_earned: 0,
                        total_spent: 0,
                    },
                },
                { upsert: true, new: true }
            );

            // Create notification for super admins
            try {
                await Notification.create({
                    userFromId: newUser._id,
                    isSuperAdminNotification: true,
                    message: `New user registered: ${newUser.email}`,
                    type: 'user_registered',
                    relatedId: newUser._id
                });
            } catch (notifError) {
                console.error('Error creating user registration notification:', notifError);
            }

            return helper.sendSuccess(res, 201, 'User created successfully', newUser);

        } catch (error) {
            console.log(error, "error")
            return helper.sendError(res, 500, error);
        }
    },

    // ============================================
    // HEADER APIs (type = 0)
    // ============================================
    headerCreate: async (req, res) => {
        try {
            const { projectId, userId, variant, logo, menu, contactDetails, style, elementIds, settings } = req.body;

            if (!projectId || !userId) {
                return res.status(400).json({ message: 'Project ID and User ID are required' });
            }

            const hasMenu = Array.isArray(menu) && menu.length > 0;
            const prepared = !hasMenu ? await prepareDefaultHeaderFooterPayload(projectId, 0) : null;

            const header = new SiteHeaderFooter({
                projectId,
                userId,
                type: 0, // Header
                variant: variant || 'a',
                status: 'inactive',
                logo: logo || {},
                menu: prepared?.menu || menu || [],
                contactDetails: prepared?.contactDetails || contactDetails || {},
                style: prepared?.style || style || {},
                elementIds: elementIds || [],
                settings: prepared?.settings || settings || {}
            });

            await header.save();
            return res.status(201).json({
                message: 'Header created successfully',
                data: header
            });
        } catch (error) {
            console.error('Error in headerCreate:', error);
            return res.status(500).json({
                message: 'Error creating header',
                error: error.message
            });
        }
    },

    headerUpdate: async (req, res) => {
        try {
            const { id } = req.params;
            const { variant, logo, menu, contactDetails, style, elementIds, settings } = req.body;

            const header = await SiteHeaderFooter.findById(id);
            if (!header || header.type !== 0) {
                return res.status(404).json({ message: 'Header not found' });
            }

            // Update fields if provided (check for null/undefined, but allow empty arrays/objects)
            if (variant !== undefined && variant !== null) header.variant = variant;
            if (logo !== undefined && logo !== null) header.logo = logo;
            const sanitizeMenuItems = (menuItems, logPrefix = "headerUpdate") => {
                if (!Array.isArray(menuItems)) return [];

                return menuItems.map((item) => {
                    const sanitizedItem = { ...item };

                    if (sanitizedItem.serviceId) {
                        const sid = String(sanitizedItem.serviceId).trim();
                        const sidValid = /^[0-9a-fA-F]{24}$/.test(sid);
                        if (sidValid) {
                            sanitizedItem.serviceId = sid;
                            sanitizedItem.linkPerArea = true;
                            sanitizedItem.pageId = null;
                            sanitizedItem.id = `svc-${sid}`;
                        } else {
                            delete sanitizedItem.serviceId;
                        }
                    }

                    if (sanitizedItem.linkPerArea) {
                        sanitizedItem.pageId = null;
                    } else if (sanitizedItem.pageId) {
                        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(String(sanitizedItem.pageId));
                        if (!isValidObjectId) {
                            console.warn(`[${logPrefix}] Invalid pageId format, setting to null:`, sanitizedItem.pageId);
                            sanitizedItem.pageId = null;
                        }
                    } else {
                        sanitizedItem.pageId = null;
                    }

                    if (sanitizedItem.children && Array.isArray(sanitizedItem.children)) {
                        sanitizedItem.children = sanitizeMenuItems(sanitizedItem.children, logPrefix);
                    }

                    return sanitizedItem;
                });
            };

            if (menu !== undefined && menu !== null) {
                const catalogNav = await buildNavSources(header.projectId, { catalogOnly: true });
                header.menu = sortMenuByOrder(
                    mergeMenuWithNavSources(
                        sanitizeMenuItems(menu, "headerUpdate"),
                        catalogNav
                    )
                );
                console.log('[headerUpdate] Menu set:', { menuLength: header.menu.length, menu: header.menu });
            }
            if (contactDetails !== undefined && contactDetails !== null) header.contactDetails = contactDetails;
            if (style !== undefined && style !== null) header.style = style;
            if (elementIds !== undefined && elementIds !== null) {
                header.elementIds = Array.isArray(elementIds) ? elementIds : [];
            }
            if (settings !== undefined && settings !== null) header.settings = settings;

            await header.save();

            try {
                await syncHeaderFooterSectionsForProject(header.projectId);
            } catch (syncErr) {
                console.warn("[headerUpdate] header/footer section sync:", syncErr.message);
            }

            return res.status(200).json({
                success: true,
                message: 'Header updated successfully',
                data: header
            });
        } catch (error) {
            console.error('Error in headerUpdate:', error);
            return res.status(500).json({
                message: 'Error updating header',
                error: error.message
            });
        }
    },

    headerDelete: async (req, res) => {
        try {
            const { id } = req.params;
            const header = await SiteHeaderFooter.findById(id);
            if (!header || header.type !== 0) {
                return res.status(404).json({ message: 'Header not found' });
            }

            await SiteHeaderFooter.findByIdAndDelete(id);
            return res.status(200).json({ message: 'Header deleted successfully' });
        } catch (error) {
            console.error('Error in headerDelete:', error);
            return res.status(500).json({
                message: 'Error deleting header',
                error: error.message
            });
        }
    },

    headerGetById: async (req, res) => {
        try {
            const { id } = req.params;
            const header = await SiteHeaderFooter.findById(id);
            if (!header || header.type !== 0) {
                return res.status(404).json({ message: 'Header not found' });
            }
            return res.status(200).json({
                success: true,
                message: 'Header fetched successfully',
                data: header
            });
        } catch (error) {
            console.error('Error in headerGetById:', error);
            return res.status(500).json({
                message: 'Error fetching header',
                error: error.message
            });
        }
    },

    headerGetByProject: async (req, res) => {
        try {
            const { projectId } = req.params;
            const headers = await SiteHeaderFooter.find({
                projectId,
                type: 0
            }).sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                message: 'Headers fetched successfully',
                data: headers
            });
        } catch (error) {
            console.error('Error in headerGetByProject:', error);
            return res.status(500).json({
                message: 'Error fetching headers',
                error: error.message
            });
        }
    },

    headerGetActive: async (req, res) => {
        try {
            const { projectId } = req.params;
            const header = await SiteHeaderFooter.findOne({
                projectId,
                type: 0,
                status: 'active'
            });

            if (!header) {
                return res.status(404).json({ message: 'No active header found' });
            }

            const enriched = await enrichHeaderFooterDocument(header, projectId);

            return res.status(200).json({
                success: true,
                message: 'Active header fetched successfully',
                data: enriched
            });
        } catch (error) {
            console.error('Error in headerGetActive:', error);
            return res.status(500).json({
                message: 'Error fetching active header',
                error: error.message
            });
        }
    },

    headerActivate: async (req, res) => {
        try {
            const { id } = req.params;
            const header = await SiteHeaderFooter.findById(id);

            if (!header || header.type !== 0) {
                return res.status(404).json({ message: 'Header not found' });
            }

            // Deactivate all other headers for this project
            await SiteHeaderFooter.updateMany(
                { projectId: header.projectId, type: 0, _id: { $ne: id } },
                { status: 'inactive' }
            );

            // Activate this header
            header.status = 'active';
            await header.save();

            try {
                await syncHeaderFooterSectionsForProject(header.projectId);
            } catch (syncErr) {
                console.warn("[headerActivate] header/footer section sync:", syncErr.message);
            }

            return res.status(200).json({
                message: 'Header activated successfully',
                data: header
            });
        } catch (error) {
            console.error('Error in headerActivate:', error);
            return res.status(500).json({
                message: 'Error activating header',
                error: error.message
            });
        }
    },

    // ============================================
    // FOOTER APIs (type = 1)
    // ============================================
    footerCreate: async (req, res) => {
        try {
            const { projectId, userId, variant, logo, menu, contactDetails, style, elementIds, settings } = req.body;

            if (!projectId || !userId) {
                return res.status(400).json({ message: 'Project ID and User ID are required' });
            }

            const hasMenu = Array.isArray(menu) && menu.length > 0;
            const hasFooterLayout = Boolean(settings?.custom?.footer);
            const prepared =
                !hasMenu && !hasFooterLayout
                    ? await prepareDefaultHeaderFooterPayload(projectId, 1)
                    : null;

            const footer = new SiteHeaderFooter({
                projectId,
                userId,
                type: 1, // Footer
                variant: variant || 'a',
                status: 'inactive',
                logo: logo || {},
                menu: prepared?.menu || menu || [],
                contactDetails: prepared?.contactDetails || contactDetails || {},
                style: prepared?.style || style || {},
                elementIds: elementIds || [],
                settings: prepared?.settings || settings || {}
            });

            await footer.save();
            return res.status(201).json({
                message: 'Footer created successfully',
                data: footer
            });
        } catch (error) {
            console.error('Error in footerCreate:', error);
            return res.status(500).json({
                message: 'Error creating footer',
                error: error.message
            });
        }
    },

    footerUpdate: async (req, res) => {
        try {
            const { id } = req.params;
            const { variant, logo, menu, contactDetails, style, elementIds, settings } = req.body;

            console.log('[footerUpdate] Request received:', {
                id,
                hasMenu: !!menu,
                menuLength: menu?.length,
                hasLogo: !!logo,
                hasContactDetails: !!contactDetails,
                hasStyle: !!style,
                hasElementIds: !!elementIds,
                hasSettings: !!settings,
            });

            const footer = await SiteHeaderFooter.findById(id);
            if (!footer || footer.type !== 1) {
                console.error('[footerUpdate] Footer not found:', { id, footerType: footer?.type });
                return res.status(404).json({ message: 'Footer not found' });
            }

            const sanitizeMenuItems = (menuItems, logPrefix = "footerUpdate") => {
                if (!Array.isArray(menuItems)) return [];

                return menuItems.map((item) => {
                    const sanitizedItem = { ...item };

                    if (sanitizedItem.serviceId) {
                        const sid = String(sanitizedItem.serviceId).trim();
                        const sidValid = /^[0-9a-fA-F]{24}$/.test(sid);
                        if (sidValid) {
                            sanitizedItem.serviceId = sid;
                            sanitizedItem.linkPerArea = true;
                            sanitizedItem.pageId = null;
                            sanitizedItem.id = `svc-${sid}`;
                        } else {
                            delete sanitizedItem.serviceId;
                        }
                    }

                    if (sanitizedItem.linkPerArea) {
                        sanitizedItem.pageId = null;
                    } else if (sanitizedItem.pageId) {
                        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(String(sanitizedItem.pageId));
                        if (!isValidObjectId) {
                            console.warn(`[${logPrefix}] Invalid pageId format, setting to null:`, sanitizedItem.pageId);
                            sanitizedItem.pageId = null;
                        }
                    } else {
                        sanitizedItem.pageId = null;
                    }

                    if (sanitizedItem.children && Array.isArray(sanitizedItem.children)) {
                        sanitizedItem.children = sanitizeMenuItems(sanitizedItem.children, logPrefix);
                    }

                    return sanitizedItem;
                });
            };

            // Update fields if provided
            if (variant !== undefined) footer.variant = variant;
            if (logo !== undefined) footer.logo = logo;
            const catalogNav = await buildNavSources(footer.projectId, { catalogOnly: true });
            const pagesById = buildPagesByIdMap(catalogNav.pages || []);

            if (settings !== undefined) {
                footer.settings = settings;
                const rawFooterLayout = settings?.custom?.footer;
                if (rawFooterLayout && typeof rawFooterLayout === "object") {
                    const normalizedLayout = normalizeFooterLayout(rawFooterLayout);
                    const sanitizedLayout = applyPageUrlsToFooterLayout(
                        {
                            ...normalizedLayout,
                            quickLinks: {
                                items: sanitizeMenuItems(
                                    normalizedLayout.quickLinks?.items || [],
                                    "footerLayout.quickLinks"
                                ),
                            },
                            services: {
                                children: sanitizeMenuItems(
                                    normalizedLayout.services?.children || [],
                                    "footerLayout.services"
                                ),
                            },
                        },
                        pagesById
                    );
                    footer.settings = mergeFooterLayoutIntoSettings(footer.settings || {}, sanitizedLayout);
                    footer.menu = sortMenuByOrder(
                        mergeMenuWithNavSources(
                            syncLegacyMenuFromFooterLayout(sanitizedLayout),
                            catalogNav
                        )
                    );
                }
            }

            if (menu !== undefined && menu !== null && !settings?.custom?.footer) {
                footer.menu = sortMenuByOrder(
                    mergeMenuWithNavSources(
                        sanitizeMenuItems(menu, "footerUpdate"),
                        catalogNav
                    )
                );
                const migratedLayout = buildFooterLayoutFromDefaultMenu(
                    footer.menu,
                    catalogNav.services || []
                );
                footer.settings = mergeFooterLayoutIntoSettings(footer.settings || {}, migratedLayout);
                console.log('[footerUpdate] Menu migrated to footer layout');
            }

            if (contactDetails !== undefined) footer.contactDetails = contactDetails;
            if (style !== undefined) footer.style = style;
            if (elementIds !== undefined) footer.elementIds = elementIds;

            await footer.save();
            console.log('[footerUpdate] Footer saved successfully:', { id: footer._id, menuLength: footer.menu?.length });

            try {
                await syncHeaderFooterSectionsForProject(footer.projectId);
            } catch (syncErr) {
                console.warn("[footerUpdate] header/footer section sync:", syncErr.message);
            }

            return res.status(200).json({
                success: true,
                message: 'Footer updated successfully',
                data: footer
            });
        } catch (error) {
            console.error('Error in footerUpdate:', error);
            return res.status(500).json({
                message: 'Error updating footer',
                error: error.message
            });
        }
    },

    footerDelete: async (req, res) => {
        try {
            const { id } = req.params;
            const footer = await SiteHeaderFooter.findById(id);
            if (!footer || footer.type !== 1) {
                return res.status(404).json({ message: 'Footer not found' });
            }

            await SiteHeaderFooter.findByIdAndDelete(id);
            return res.status(200).json({ message: 'Footer deleted successfully' });
        } catch (error) {
            console.error('Error in footerDelete:', error);
            return res.status(500).json({
                message: 'Error deleting footer',
                error: error.message
            });
        }
    },

    footerGetById: async (req, res) => {
        try {
            const { id } = req.params;
            const footer = await SiteHeaderFooter.findById(id);
            if (!footer || footer.type !== 1) {
                return res.status(404).json({ message: 'Footer not found' });
            }
            return res.status(200).json({
                success: true,
                message: 'Footer fetched successfully',
                data: footer
            });
        } catch (error) {
            console.error('Error in footerGetById:', error);
            return res.status(500).json({
                message: 'Error fetching footer',
                error: error.message
            });
        }
    },

    footerGetByProject: async (req, res) => {
        try {
            const { projectId } = req.params;
            const footers = await SiteHeaderFooter.find({
                projectId,
                type: 1
            }).sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                message: 'Footers fetched successfully',
                data: footers
            });
        } catch (error) {
            console.error('Error in footerGetByProject:', error);
            return res.status(500).json({
                message: 'Error fetching footers',
                error: error.message
            });
        }
    },

    footerGetActive: async (req, res) => {
        try {
            const { projectId } = req.params;
            const footer = await SiteHeaderFooter.findOne({
                projectId,
                type: 1,
                status: 'active'
            });

            if (!footer) {
                return res.status(404).json({ message: 'No active footer found' });
            }

            const enriched = await enrichHeaderFooterDocument(footer, projectId);

            return res.status(200).json({
                success: true,
                message: 'Active footer fetched successfully',
                data: enriched
            });
        } catch (error) {
            console.error('Error in footerGetActive:', error);
            return res.status(500).json({
                message: 'Error fetching active footer',
                error: error.message
            });
        }
    },

    // API endpoint to update menu URLs when page slug changes
    // POST /admin/v1/header-footer/update-menu-urls
    // Body: { pageId: string, newSlug: string }
    updateMenuUrlsForPage: async (req, res) => {
        try {
            const { pageId, newSlug, oldSlug = "" } = req.body;

            if (!pageId || !newSlug) {
                return res.status(400).json({
                    success: false,
                    message: 'pageId and newSlug are required'
                });
            }

            const normalizedNewSlug = normalizeSlugInput(newSlug);
            const updatedCount = await updateHeaderFooterMenuUrls(
                pageId,
                oldSlug || normalizedNewSlug,
                normalizedNewSlug
            );

            return res.status(200).json({
                success: true,
                message: `Menu URLs updated successfully for ${updatedCount} header(s)/footer(s)`,
                updatedCount
            });
        } catch (error) {
            console.error('[updateMenuUrlsForPage] Error updating menu URLs:', error);
            return res.status(500).json({
                success: false,
                message: 'Error updating menu URLs',
                error: error.message
            });
        }
    },

    footerActivate: async (req, res) => {
        try {
            const { id } = req.params;
            const footer = await SiteHeaderFooter.findById(id);

            if (!footer || footer.type !== 1) {
                return res.status(404).json({ message: 'Footer not found' });
            }

            // Deactivate all other footers for this project
            await SiteHeaderFooter.updateMany(
                { projectId: footer.projectId, type: 1, _id: { $ne: id } },
                { status: 'inactive' }
            );

            // Activate this footer
            footer.status = 'active';
            await footer.save();

            try {
                await syncHeaderFooterSectionsForProject(footer.projectId);
            } catch (syncErr) {
                console.warn("[footerActivate] header/footer section sync:", syncErr.message);
            }

            return res.status(200).json({
                message: 'Footer activated successfully',
                data: footer
            });
        } catch (error) {
            console.error('Error in footerActivate:', error);
            return res.status(500).json({
                message: 'Error activating footer',
                error: error.message
            });
        }
    },

    // ============================================
    // CREATE DEFAULT HEADER/FOOTER
    // ============================================
    createDefaultHeaderFooter: async (req, res) => {
        try {
            let { projectId, userId, type } = req.body; // type: 0 = Header, 1 = Footer

            // Convert type to number if it's a string
            if (typeof type === 'string') {
                type = parseInt(type, 10);
            }

            if (!projectId || !userId || type === undefined || type === null) {
                return res.status(400).json({
                    message: 'Project ID, User ID, and Type are required'
                });
            }

            // Ensure type is a number and is either 0 or 1
            const typeNumber = Number(type);
            if (isNaN(typeNumber) || (typeNumber !== 0 && typeNumber !== 1)) {
                return res.status(400).json({
                    message: 'Type must be 0 (Header) or 1 (Footer)'
                });
            }

            // Use the converted number
            type = typeNumber;

            // Check if default already exists
            const existing = await SiteHeaderFooter.findOne({
                projectId,
                type,
                variant: 'a',
                status: 'active'
            });

            if (existing) {
                return res.status(400).json({
                    message: `Default ${type === 0 ? 'header' : 'footer'} already exists for this project`
                });
            }

            const prepared = await prepareDefaultHeaderFooterPayload(projectId, type);
            const defaultMenu = prepared.menu;
            const defaultSettings = prepared.settings;
            const defaultContactDetails = prepared.contactDetails;
            const defaultStyle = prepared.style;

            // Deactivate any existing active header/footer of this type
            await SiteHeaderFooter.updateMany(
                { projectId, type },
                { status: 'inactive' }
            );

            const defaultItem = new SiteHeaderFooter({
                projectId,
                userId,
                type,
                variant: 'a',
                status: 'active',
                logo: {
                    url: '',
                    alt: 'Logo',
                    width: 150,
                    height: 50,
                    style: {}
                },
                menu: defaultMenu,
                contactDetails: defaultContactDetails,
                style: defaultStyle,
                elementIds: [],
                settings: defaultSettings
            });

            await defaultItem.save();

            try {
                await syncHeaderFooterSectionsForProject(projectId);
            } catch (syncErr) {
                console.warn("[createDefaultHeaderFooter] section sync:", syncErr.message);
            }

            const enriched = await enrichHeaderFooterDocument(defaultItem, projectId);

            return res.status(201).json({
                message: `Default ${type === 0 ? 'header' : 'footer'} created successfully`,
                data: enriched || defaultItem
            });
        } catch (error) {
            console.error('Error in createDefaultHeaderFooter:', error);
            return res.status(500).json({
                message: 'Error creating default header/footer',
                error: error.message
            });
        }
    },

    /**
     * Rebuild header/footer menus from currently selected WebsitePage rows
     * (Home, About, Services, Areas, Blog, Contact — same shape as demo chrome).
     */
    rebuildHeaderFooterMenus: async (req, res) => {
        try {
            const projectId = String(req.body?.projectId || req.params?.projectId || "").trim();
            if (!projectId) {
                return res.status(400).json({ message: "projectId is required" });
            }
            const result = await rebuildProjectHeaderFooterMenus(projectId, {
                syncSections: req.body?.syncSections !== false,
            });
            return res.status(200).json({
                message: "Header/footer menus rebuilt from selected pages",
                data: result,
            });
        } catch (error) {
            console.error("Error in rebuildHeaderFooterMenus:", error);
            return res.status(500).json({
                message: "Error rebuilding header/footer menus",
                error: error.message,
            });
        }
    },

    create_author: async (req, res) => {
        try {
            let { name, about, jobTitle, links } = req.body;
            const image = req.files?.image; // Ensure image is correctly accessed
            console.log(req.body, req.files)

            // Accept JSON string, array, or map — keep every usable link
            links = normalizeAuthorLinks(links);

            // Validate required fields
            if (!name || !name.trim()) {
                return res.status(400).json({ message: 'Name is required' });
            }

            let userId = req.user.userId; // Get logged-in user ID from req.user.id
            console.log(userId, req.user);

            // Deduplicate by userId and name
            const existing = await Author.findOne({ userId, name: name.trim() });
            if (existing) {
                return res.status(400).json({ message: 'Author already exists for this user with the given name' });
            }

            // If an image is uploaded, process it using the helper
            let imageUrl = '';
            if (image) {
                const folderPath = 'public/files/authors/images'; // Path to store the image

                // Validate that the file has a valid mimetype (optional, for safety)
                if (!image.mimetype || !image.mimetype.startsWith('image/')) {
                    return res.status(400).json({ message: 'Uploaded file must be an image' });
                }

                // Handle image processing (similar to uploadFileapi)
                const input = image.tempFilePath ? image.tempFilePath : image.data;
                if (!input) {
                    return res.status(400).json({ message: 'No valid image input (tempFilePath or data) found.' });
                }

                // Convert to WebP using sharp
                const webpBuf = await sharp(input, { failOnError: false })
                    .rotate()
                    .webp({ quality: 78, effort: 5 })
                    .toBuffer();

                // Create a readable stream for the WebP buffer
                const stream = Readable.from(webpBuf);
                const webpFile = {
                    name: `${Date.now()}.webp`, // Unique filename
                    mimetype: 'image/webp',
                    size: webpBuf.length,
                    stream
                };

                // Upload the file using the helper
                const savedName = await helper.uploadFile(webpFile, folderPath, null);
                imageUrl = `/files/authors/images/${savedName}`; // Adjust the URL based on your folder structure
            }

            // Prepare the new Author object
            const author = new Author({
                name: name.trim(),
                jobTitle: jobTitle ? jobTitle.trim() : '',
                bio: about ? about.trim() : '',
                image: imageUrl,
                links: links || [],
                userId
            });

            // Save the author to the database
            await author.save();
            return helper.sendSuccess(res, 201, 'Author created successfully', author);
        } catch (error) {
            console.log(error, 'error');
            return helper.sendError(res, 500, error?.message || 'Failed to create author');
        }
    }
    ,

    edit_author: async (req, res) => {
        try {
            const { authorId } = req.params; // Get the author ID from URL params
            const { name, about, jobTitle, links } = req.body;
            const image = req.files?.image; // Image uploaded from request

            // Validate required fields
            if (!authorId || !mongoose.isValidObjectId(authorId)) {
                return res.status(400).json({ message: 'Valid authorId is required' });
            }

            const existingAuthor = await Author.findById(authorId);
            if (!existingAuthor) {
                return res.status(404).json({ message: 'Author not found' });
            }

            // If the name is provided and changed, check for duplicates
            if (name && name.trim() !== existingAuthor.name) {
                const duplicateAuthor = await Author.findOne({ userId: req.user.userId, name: name.trim() });
                if (duplicateAuthor) {
                    return res.status(400).json({ message: 'Author with this name already exists' });
                }
                existingAuthor.name = name.trim();
            }

            // Update fields
            if (about) {
                existingAuthor.bio = about.trim();
            }
            if (jobTitle) {
                existingAuthor.jobTitle = jobTitle.trim();
            }

            // If image is uploaded, process it using the helper
            if (image) {
                const folderPath = 'public/files/authors/images'; // Path to store the image

                // Validate that the file has a valid mimetype
                if (!image.mimetype || !image.mimetype.startsWith('image/')) {
                    return res.status(400).json({ message: 'Uploaded file must be an image' });
                }

                // Handle image processing (similar to uploadFileapi)
                const input = image.tempFilePath ? image.tempFilePath : image.data;
                if (!input) {
                    return res.status(400).json({ message: 'No valid image input (tempFilePath or data) found.' });
                }

                // Convert to WebP using sharp
                const webpBuf = await sharp(input, { failOnError: false })
                    .rotate()
                    .webp({ quality: 78, effort: 5 })
                    .toBuffer();

                // Create a readable stream for the WebP buffer
                const stream = Readable.from(webpBuf);
                const webpFile = {
                    name: `${Date.now()}.webp`, // Unique filename
                    mimetype: 'image/webp',
                    size: webpBuf.length,
                    stream
                };

                // Upload the file using the helper
                const savedName = await helper.uploadFile(webpFile, folderPath, null);
                existingAuthor.image = `/files/authors/images/${savedName}`; // Adjust the URL based on your folder structure
            }

            // Ensure links is always a clean [{label,url}] array when provided
            // IMPORTANT: only update when the client actually sent `links`
            // (otherwise image-only edits would wipe all social links)
            if (typeof links !== "undefined") {
                existingAuthor.links = normalizeAuthorLinks(links);
            }

            // Save the updated author object
            await existingAuthor.save();

            return helper.sendSuccess(res, 200, 'Author updated successfully', existingAuthor);
        } catch (error) {
            console.log(error, 'error');
            return helper.sendError(res, 500, error?.message || 'Failed to update author');
        }
    }
    ,
    // Fetch authors by userId
    fetch_authors: async (req, res) => {
        try {
            const userId = req.user.userId; // Get logged-in user ID from req.user.userId

            // Find authors for this user
            const authors = await Author.find({ userId }).exec();


            if (!authors || authors.length === 0) {
                return res.status(404).json({ message: 'No authors found for this user' });
            }

            return helper.sendSuccess(res, 200, 'Authors fetched successfully', authors);
        } catch (error) {
            console.log(error);
            return helper.sendError(res, 500, error?.message || 'Failed to fetch authors');
        }
    }
    ,

    fetch_author_by_blog_id: async (req, res) => {
        try {
            const blogId = req.body.blogId; // Get the blogId from the request body

            if (!blogId) {
                return res.status(400).json({ message: 'Blog ID is required' });
            }

            // Step 1: Find the blog by its ID to get the associated authorId
            const blog = await Blog.findById(blogId).exec();

            if (!blog) {
                return res.status(404).json({ message: 'Blog not found' });
            }

            // Step 2: Use the authorId from the blog to find the corresponding author
            const author = await Author.findById(blog.authorId).exec();

            if (!author) {
                return res.status(404).json({ message: 'Author not found for this blog' });
            }

            return helper.sendSuccess(res, 200, 'Author fetched successfully', author);
        } catch (error) {
            console.log(error);
            return helper.sendError(res, 500, error?.message || 'Failed to fetch author');
        }
    },

    // Delete an author by authorId
    delete_author: async (req, res) => {
        try {
            const { authorId } = req.params; // Get authorId from params
            const userId = req.user.userId; // Get logged-in user ID from req.user.userId

            // Validate if the author exists and belongs to the current user
            const author = await Author.findOne({ _id: authorId, userId }).exec();

            if (!author) {
                return res.status(404).json({ message: 'Author not found' });
            }

            // Delete the author
            await Author.findByIdAndDelete(authorId);

            return helper.sendSuccess(res, 200, 'Author deleted successfully');
        } catch (error) {
            console.log(error);
            return helper.sendError(res, 500, error?.message || 'Failed to delete author');
        }
    },

    fetch_users: async (req, res) => {
        const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit of 10
        console.log("hey how are ;you", req.query, req.body)

        try {
            // Fetch users from the database with pagination
            const users = await User.find()
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit) // Skip users from previous pages
                .limit(Number(limit)); // Limit the number of users per page

            // Get the total count of users (for pagination info)
            const totalUsers = await User.countDocuments();

            // Return the users with pagination information
            res.status(200).json({
                message: 'User list fetched successfully',
                data: users,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalUsers / limit),
                    totalUsers,
                }
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Server error. Please try again later.' });
        }



    },

    createProject: async (req, res) => {
        try {
            let {
                userId,
                serviceType,
                projectName,
                wantImages,
                sectionImageOrigin,
                focusKeyword,
                projectKeywordsText,
                categories,
                subCategories,
                microCategories
            } = req.body;

            // console.log(req.body, "Request body for creating project");return



            if (!serviceType) serviceType = categories[0];

            // wantImages always defaults to 1 (hidden field, always enabled)
            // Only allow 0 if explicitly provided, otherwise default to 1
            let finalWantImages = 1; // Default to 1
            if (wantImages !== undefined && wantImages !== null) {
                const parsed = parseInt(wantImages, 10);
                if (!isNaN(parsed) && parsed === 0) {
                    finalWantImages = 0; // Only allow 0 if explicitly set
                }
            }

            // Mandatory keywords
            if (!projectKeywordsText || !focusKeyword) {
                return res.status(400).json({
                    message: 'projectKeywordsText and focusKeyword are required'
                });
            }



            // Normalize arrays
            try {
                categories = normalizeArray(categories, 'categories', true);
                subCategories = normalizeArray(subCategories, 'subCategories', true);
                microCategories = normalizeArray(microCategories, 'microCategories', false);
            } catch (err) {
                return res.status(400).json({ message: err.message });
            }

            if (!userId) userId = "676556920ee225052d8cd600";
            if (!userId || !projectName) {
                return res.status(400).json({
                    message: 'userId and projectName are required'
                });
            }

            // Process categories: Check if exists, if not create with isManual: 1
            let categoryId = null;
            if (categories && categories.length > 0) {
                const categoryName = categories[0].trim();

                // Check if category exists
                let category = await ProjectCategory.findOne({ name: categoryName });

                if (!category) {
                    // Category doesn't exist, create it with isManual: 1
                    category = new ProjectCategory({
                        name: categoryName,
                        isManual: 1
                    });
                    await category.save();
                    console.log(`[CreateProject] Created manual category: ${categoryName}`);
                }

                categoryId = category._id;
            }

            // Process subcategories: Check if exists, if not create with isManual: 1
            const processedSubCategories = [];
            if (subCategories && subCategories.length > 0 && categoryId) {
                for (const subCatName of subCategories) {
                    const trimmedName = subCatName.trim();
                    if (!trimmedName) continue;

                    // Check if subcategory exists for this category
                    let subCategory = await SubCategory.findOne({
                        categoryId: categoryId,
                        name: trimmedName
                    });

                    if (!subCategory) {
                        // Subcategory doesn't exist, create it with isManual: 1
                        subCategory = new SubCategory({
                            categoryId: categoryId,
                            name: trimmedName,
                            isManual: 1
                        });
                        await subCategory.save();
                        console.log(`[CreateProject] Created manual subcategory: ${trimmedName} for category: ${categoryId}`);
                    }

                    processedSubCategories.push(trimmedName);
                }
            }

            // Process micro categories: Check if exists, if not create with isManual: 1
            const processedMicroCategories = [];
            if (microCategories && microCategories.length > 0 && categoryId && processedSubCategories.length > 0) {
                // Get the first subcategory ID for micro categories
                const firstSubCategory = await SubCategory.findOne({
                    categoryId: categoryId,
                    name: processedSubCategories[0]
                });

                if (firstSubCategory) {
                    for (const microCatName of microCategories) {
                        const trimmedName = microCatName.trim();
                        if (!trimmedName) continue;

                        // Check if micro category exists for this subcategory
                        let microCategory = await MicroCategory.findOne({
                            subCategoryId: firstSubCategory._id,
                            name: trimmedName
                        });

                        if (!microCategory) {
                            // Micro category doesn't exist, create it with isManual: 1
                            microCategory = new MicroCategory({
                                categoryId: categoryId,
                                subCategoryId: firstSubCategory._id,
                                name: trimmedName,
                                isManual: 1
                            });
                            await microCategory.save();
                            console.log(`[CreateProject] Created manual micro category: ${trimmedName} for subcategory: ${firstSubCategory._id}`);
                        }

                        processedMicroCategories.push(trimmedName);
                    }
                }
            }

            let finalSectionImageOrigin = 1;
            if (sectionImageOrigin !== undefined && sectionImageOrigin !== null) {
                finalSectionImageOrigin = parseSectionOrigin(sectionImageOrigin, 1);
            }

            // Save minimal project data immediately, include categories
            const newProject = new UserProject({
                userId,
                serviceType, // optional
                projectName,
                projectKeywordsText,
                focusKeyword,
                wantImages: finalWantImages, // Always defaults to 1
                sectionImageOrigin: finalSectionImageOrigin,
                status: 1,
                projectType: 0, // 0 = location based site
                categories: categories || [],
                subCategories: processedSubCategories,
                microCategories: processedMicroCategories
            });

            const savedProject = await newProject.save();

            // Bulk sites now use the business-website pipeline (BusinessLocation + section queue).
            // Legacy projectBackgroundQueue is not started on create.

            // Create notification for super admins
            try {
                const user = await Users.findById(userId).select('email username').lean();
                await Notification.create({
                    userFromId: userId,
                    isSuperAdminNotification: true,
                    message: `${user?.username || user?.email || 'User'} created new project "${projectName}"`,
                    type: 'project_created',
                    relatedId: savedProject._id
                });
            } catch (notifError) {
                console.error('Error creating project creation notification:', notifError);
            }

            return res
                .status(201)
                .json({ message: 'Project created successfully', data: savedProject });

        } catch (error) {
            console.error('Error in createProject:', error);
            return res
                .status(500)
                .json({ message: 'An error occurred while processing your request.' });
        }
    },

    deleteProject: async (req, res) => {

        console.log("Delete project API called", req.params)
        const projectId = req.params.id;

        try {
            // Check if project exists in UserProject collection
            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ ok: false, error: "Project not found" });
            }

            // Delete associated ProjectDeployment records
            await ProjectDeployment.deleteMany({ projectId });

            // Delete the project from UserProject
            await UserProject.findByIdAndDelete(projectId);

            return res.status(200).json({ ok: true, message: "Project deleted successfully" });
        } catch (error) {
            console.error('Error in deleteProject:', error);
            return res.status(500).json({ ok: false, error: error.message || 'An error occurred while deleting the project' });
        }
    },



    addTheme: async (req, res) => {
        try {
            let { themeId, themeName, sections, settings, isActive } = req.body;


            if (typeof sections == "string") {
                sections = JSON.parse(sections)
            }

            if (!themeId) {

                if (!themeName || !Array.isArray(sections) || sections.length === 0) {
                    return res.status(400).json({
                        message: 'themeName and a non-empty sections array are required'
                    });
                }
            }


            let themeData;

            if (themeId) {
                // 2a. UPDATE existing ThemeData
                themeData = await ThemeData.findById(themeId);
                if (!themeData) {
                    return res.status(404).json({ message: 'Theme data not found' });
                }

                themeData.themeName = themeName;
                themeData.sections = sections;
                if (settings !== undefined) themeData.settings = settings;
                if (isActive !== undefined) themeData.isActive = isActive;

                const updated = await themeData.save();
                return res.json({ message: 'Theme data updated', data: updated });

            } else {
                // 2b. CREATE new ThemeData
                const exists = await ThemeData.findOne({ themeName });
                if (exists) {
                    return res.status(409).json({ message: 'Theme already exists' });
                }

                themeData = new ThemeData({
                    themeName,
                    sections,
                    settings: settings || {},
                    isActive: !!isActive
                });

                const created = await themeData.save();
                return res.status(201).json({ message: 'Theme data created', data: created });
            }

        } catch (err) {
            console.error('addTheme error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },

    fetchThemeById: async (req, res) => {
        try {
            const { themeId } = req.body;

            if (!themeId) {
                return res.status(400).json({ message: 'themeId is required' });
            }

            const themeData = await ThemeData.findById(themeId);
            if (!themeData) {
                return res.status(404).json({ message: 'Theme data not found' });
            }

            return res.json({ message: 'Theme data fetched', data: themeData });
        } catch (err) {
            console.error('fetchThemeById error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },

    clearAllData: async (req, res) => {
        try {
            // Delete all documents in each collection
            let clear = await Promise.all([
                UserProject.deleteMany({}),
                Service.deleteMany({}),
                WebsiteSection.deleteMany({})
            ]);

            if (clear) {

                return res.status(200).json({
                    message: 'All data in UserProject, Service and WebsiteSection collections has been deleted.'
                });
            }
        } catch (error) {
            console.error('Error clearing all data:', error);
            return res.status(500).json({ message: 'Internal server error while clearing data.' });
        }
    },





    getUserProjects: async (req, res) => {
        try {
            let { page = 1, limit = 10, search, projectId } = req.query;
            page = parseInt(page, 10);
            limit = parseInt(limit, 10);
            if (isNaN(page) || page < 1) page = 1;
            if (isNaN(limit) || limit < 1) limit = 10;
            const skip = (page - 1) * limit;

            const userId = req.user.userId;
            if (!userId) {
                return res.status(400).json({ message: "userId is required" });
            }

            const user = await User.findById(userId).select("isSuper").lean();
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const baseFilter = {};
            if (user.isSuper === 0) {
                baseFilter.userId = userId;
            }

            if (projectId) {
                baseFilter._id = projectId;
            }

            const projectTypeParam = req.query?.projectType;
            if (
                projectTypeParam !== undefined &&
                projectTypeParam !== null &&
                projectTypeParam !== "" &&
                projectTypeParam !== "all"
            ) {
                const pt = Number(projectTypeParam);
                if ([0, 1, 2].includes(pt)) {
                    baseFilter.projectType = pt;
                }
            }

            if (search) {
                const regex = { $regex: search, $options: "i" };
                baseFilter.$or = [
                    { projectName: regex },
                    { serviceType: regex }
                ];
            }

            const attachDeploymentStatus = async (projects = []) => {
                const ids = projects.map((p) => p._id).filter(Boolean);
                if (!ids.length) return projects.map((p) => ({ ...p, deploymentStatus: "Not deployed yet" }));

                const deployments = await ProjectDeployment.find({ projectId: { $in: ids } })
                    .sort({ createdAt: -1 })
                    .select("projectId deploymentStatus")
                    .lean();

                const statusByProjectId = new Map();
                for (const row of deployments) {
                    const key = String(row.projectId);
                    if (!statusByProjectId.has(key)) {
                        statusByProjectId.set(key, row.deploymentStatus || "Not deployed yet");
                    }
                }

                return projects.map((project) => ({
                    ...project,
                    deploymentStatus: statusByProjectId.get(String(project._id)) || "Not deployed yet",
                }));
            };

            const attachContentGenerationStatus = async (projects = []) => {
                const ids = projects.map((p) => p._id).filter(Boolean);
                if (!ids.length) return projects;

                const liveMap = getLiveProgressMap(ids.map(String));
                const objectIds = ids.filter((id) => mongoose.isValidObjectId(id));
                const counts = objectIds.length
                    ? await SectionContent.aggregate([
                        {
                            $match: {
                                projectId: { $in: objectIds },
                                isDeleted: { $ne: true },
                                sectionId: { $nin: ["header", "footer", "navbar"] },
                            },
                        },
                        {
                            $group: {
                                _id: {
                                    projectId: "$projectId",
                                    status: "$status",
                                },
                                count: { $sum: 1 },
                            },
                        },
                    ])
                    : [];

                const byProject = new Map();
                for (const row of counts) {
                    const pid = String(row?._id?.projectId || "");
                    if (!pid) continue;
                    const bucket = byProject.get(pid) || { generated: 0, pending: 0, failed: 0 };
                    const st = String(row?._id?.status || "");
                    if (st === "generated") bucket.generated += row.count;
                    else if (st === "pending") bucket.pending += row.count;
                    else if (st === "failed") bucket.failed += row.count;
                    byProject.set(pid, bucket);
                }

                return projects.map((project) => {
                    const pid = String(project._id);
                    const live = liveMap[pid] || null;
                    const persisted = project.contentGeneration && typeof project.contentGeneration === "object"
                        ? project.contentGeneration
                        : null;
                    const dbCounts = byProject.get(pid) || { generated: 0, pending: 0, failed: 0 };
                    const dbTotal = dbCounts.generated + dbCounts.pending + dbCounts.failed;

                    let contentGeneration;
                    if (live && live.status === "generating") {
                        contentGeneration = normalizeProgress(live);
                    } else if (persisted && String(persisted.status) === "generating" && dbCounts.pending > 0) {
                        contentGeneration = normalizeProgress({
                            ...persisted,
                            projectId: pid,
                            done: dbCounts.generated,
                            failed: dbCounts.failed,
                            pending: dbCounts.pending,
                            total: Math.max(Number(persisted.total) || 0, dbTotal),
                        });
                    } else if (dbCounts.pending > 0) {
                        contentGeneration = normalizeProgress({
                            projectId: pid,
                            status: "generating",
                            total: dbTotal,
                            done: dbCounts.generated,
                            failed: dbCounts.failed,
                            skipped: 0,
                            pending: dbCounts.pending,
                            parallelWorkers: getDefaultParallelWorkers(),
                            message: "Section generation in progress",
                        });
                    } else if (
                        (persisted && (persisted.status === "completed" || persisted.status === "failed")) ||
                        dbCounts.generated > 0
                    ) {
                        const total = Math.max(
                            Number(persisted?.total) || 0,
                            dbTotal,
                            dbCounts.generated
                        );
                        contentGeneration = normalizeProgress({
                            ...(persisted || {}),
                            projectId: pid,
                            status: dbCounts.failed && !dbCounts.generated ? "failed" : "completed",
                            total,
                            done: dbCounts.generated || Number(persisted?.done) || total,
                            failed: dbCounts.failed || Number(persisted?.failed) || 0,
                            skipped: Number(persisted?.skipped) || 0,
                            pending: 0,
                            percent: 100,
                            parallelWorkers:
                                Number(persisted?.parallelWorkers) || getDefaultParallelWorkers(),
                            message: persisted?.message || "Section generation complete",
                        });
                    } else {
                        contentGeneration = normalizeProgress({
                            projectId: pid,
                            status: "idle",
                            message: "Not generated yet",
                        });
                    }

                    return { ...project, contentGeneration };
                });
            };

            if (projectId) {
                const project = await UserProject.findOne(baseFilter).lean();
                if (!project) {
                    return res.status(404).json({
                        message: "Project not found",
                        data: [],
                        count: 0,
                        page: 1,
                        limit: 1,
                        total: 0,
                        totalActiveProjects: 0,
                        totalPages: 0,
                    });
                }
                const [enrichedProject] = await attachContentGenerationStatus(
                    await attachDeploymentStatus([project])
                );
                return res.status(200).json({
                    message: "Project retrieved successfully",
                    data: [enrichedProject],
                    count: 1,
                    page: 1,
                    limit: 1,
                    total: 1,
                    totalActiveProjects: Number(project.status) === 2 ? 1 : 0,
                    totalPages: 1,
                });
            }

            const [totalProjects, totalActiveProjects, rawProjects] = await Promise.all([
                UserProject.countDocuments(baseFilter),
                UserProject.countDocuments({ ...baseFilter, status: 2 }),
                UserProject.find(baseFilter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
            ]);

            const withDeploy = await attachDeploymentStatus(rawProjects);
            const enrichedProjects = await attachContentGenerationStatus(withDeploy);
            const totalPages = Math.ceil(totalProjects / limit) || 1;

            return res.status(200).json({
                message: enrichedProjects.length
                    ? "Projects retrieved successfully"
                    : "No projects found",
                data: enrichedProjects,
                count: enrichedProjects.length,
                page,
                limit,
                total: totalProjects,
                totalActiveProjects,
                totalPages,
                generationMeta: {
                    defaultParallelWorkers: getDefaultParallelWorkers(),
                },
            });
        } catch (error) {
            console.error("Error occurred while fetching user projects:", error);
            return res.status(500).json({
                message: "An error occurred while fetching projects",
                error: error.message
            });
        }
    }
    ,

    getProjectsSectionGenerationProgress: async (req, res) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(400).json({ message: "userId is required" });
            }
            const rawIds = Array.isArray(req.body?.projectIds)
                ? req.body.projectIds
                : req.body?.projectId
                  ? [req.body.projectId]
                  : [];
            const projectIds = [...new Set(rawIds.map((id) => String(id || "").trim()).filter(Boolean))];
            if (!projectIds.length) {
                return res.status(400).json({ message: "projectIds required" });
            }

            const user = await User.findById(userId).select("isSuper").lean();
            if (!user) return res.status(404).json({ message: "User not found" });

            const filter = {
                _id: { $in: projectIds.filter((id) => mongoose.isValidObjectId(id)) },
            };
            if (user.isSuper === 0) filter.userId = userId;

            const projects = await UserProject.find(filter).select("_id contentGeneration").lean();
            const liveMap = getLiveProgressMap(projectIds);
            const data = {};
            for (const p of projects) {
                const pid = String(p._id);
                const live = liveMap[pid];
                data[pid] = live
                    ? normalizeProgress(live)
                    : normalizeProgress({
                          ...(p.contentGeneration || {}),
                          projectId: pid,
                          status: p.contentGeneration?.status || "idle",
                      });
            }

            return res.status(200).json({
                message: "ok",
                data,
                defaultParallelWorkers: getDefaultParallelWorkers(),
            });
        } catch (error) {
            console.error("getProjectsSectionGenerationProgress:", error);
            return res.status(500).json({ message: error.message || "Failed to fetch progress" });
        }
    }
    ,



    // 2. Update Country in Project API
    // controller/AdminController.js

    // controllers/AdminController.js

    // 1. Update Country
    updateCountryInProject: async (req, res) => {
        try {
            let { projectId, countries, manualCountries } = req.body;
            if (typeof countries === 'string') countries = JSON.parse(countries);
            if (typeof manualCountries === 'string') manualCountries = JSON.parse(manualCountries);

            if (
                !projectId ||
                (!(Array.isArray(countries) && countries.length)) &&
                (!(Array.isArray(manualCountries) && manualCountries.length))
            ) {
                return res.status(400).json({
                    message: 'Project ID and at least one country (selected or manual) are required!'
                });
            }

            // 1a) Handle manualCountries
            if (Array.isArray(manualCountries) && manualCountries.length) {
                const all = await Country.find().select('id').lean();
                const nums = all.map(c => parseInt(c.id, 10)).filter(n => !isNaN(n));
                let nextId = nums.length ? Math.max(...nums) + 1 : 1;

                for (let mc of manualCountries) {
                    const rawName = mc.name.trim();
                    const words = rawName.split(/\s+/);
                    const name = words
                        .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
                        .join(' ');
                    const sortname = words.map(w => w[0].toUpperCase()).join('');
                    const status = mc.status === 0 ? 0 : 1;

                    let existing = await Country.findOne({ name, manual: 1 });
                    let idStr = existing ? existing.id : (nextId++).toString();
                    if (!existing) {
                        await new Country({ id: idStr, sortname, name, manual: 1 }).save();
                    }

                    countries.push({ countryId: idStr, name, status });
                }
            }

            // 1b) Enrich lat/lng
            const enriched = [];
            for (let c of countries) {
                let { countryId, name } = c;
                let status = c.status === 0 ? 0 : 1;
                let doc = await Country.findOne({ id: countryId });
                let lat = doc?.lat ?? null;
                let lng = doc?.lng ?? null;

                if (lat == null || lng == null) {
                    try {
                        const geo = await axios.get('https://us1.locationiq.com/v1/search.php', {
                            params: {
                                key: process.env.LOCATIONIQ_API_KEY,
                                q: name,
                                format: 'json',
                                limit: 1
                            }
                        });
                        const loc = geo.data[0];
                        lat = loc.lat; lng = loc.lon;
                        if (lat && lng) {
                            await Country.updateOne({ id: countryId }, { $set: { lat, lng } });
                        }
                    } catch (err) {
                        console.error(`Geocode failed for ${name}:`, err.message);
                    }
                }

                enriched.push({ countryId, name, lat, lng, bounds: { southwest: null, northeast: null }, status });
            }

            // 1c) Persist to project
            const isCountry = enriched.some(e => e.status === 1) ? 1 : 0;
            const project = await UserProject.findByIdAndUpdate(
                projectId,
                { $set: { 'locations.country': enriched, isCountry } },
                { new: true }
            );
            if (!project) return res.status(404).json({ message: 'Project not found!' });

            // 1d) Upsert slugs
            for (let entry of enriched) {
                if (entry.status !== 1) continue;
                const slugText = slugify(entry.name, { lower: true });
                // Create showName by capitalizing the first letter of the country name
                const showName = entry.name.charAt(0).toUpperCase() + entry.name.slice(1).toLowerCase();


                const exists = await Slug.findOne({
                    slug: slugText,
                    slugService: slugText,
                    slugType: 'country',
                    locationId: entry.countryId,
                    showName: showName,
                    projectId
                });

                if (!exists) {
                    await Slug.create({
                        slug: slugText,
                        slugService: slugText,

                        slugType: 'country',
                        locationId: entry.countryId,
                        projectId,
                        showName: showName,

                    });
                }
                else { console.log("slug already exists", slugText) }
            }

            return res.status(200).json({
                message: 'Countries updated successfully!',
                data: project
            });
        } catch (error) {
            console.error('Error in updateCountryInProject:', error);
            return res.status(500).json({ message: 'An error occurred.' });
        }
    },

    // 2. Update State
    updateStateInProject: async (req, res) => {
        try {
            let { projectId, states, manualStates } = req.body;
            if (typeof states === 'string') states = JSON.parse(states);
            if (typeof manualStates === 'string') manualStates = JSON.parse(manualStates);

            if (
                !projectId ||
                ((!Array.isArray(states) || !states.length) &&
                    (!Array.isArray(manualStates) || !manualStates.length))
            ) {
                return res.status(400).json({
                    message: 'Project ID and at least one state (selected or manual) are required!'
                });
            }

            // 2a) Manual states
            if (Array.isArray(manualStates) && manualStates.length) {
                const all = await State.find().select('id').lean();
                const nums = all.map(c => parseInt(c.id, 10)).filter(n => !isNaN(n));
                let nextId = nums.length ? Math.max(...nums) + 1 : 1;

                for (let ms of manualStates) {
                    const { countryId, name: rawName } = ms;
                    const status = ms.status === 0 ? 0 : 1;
                    const words = rawName.trim().split(/\s+/);
                    const name = words
                        .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
                        .join(' ');

                    let existing = await State.findOne({ name, manual: 1, country_id: countryId });
                    let idStr = existing ? existing.id : (nextId++).toString();
                    if (!existing) {
                        await new State({ id: idStr, name, country_id: countryId, manual: 1 }).save();
                    }
                    states.push({ countryId, stateId: idStr, name, status });
                }
            }

            // 2b) Persist to project
            const isState = (states || []).some(s => s.status === 1) ? 1 : 0;
            const project = await UserProject.findByIdAndUpdate(
                projectId,
                { $set: { 'locations.state': states, isState } },
                { new: true }
            );
            if (!project) return res.status(404).json({ message: 'Project not found!' });

            // 2c) Upsert slugs (parent = country)
            for (let entry of states) {
                const countryEntry = project.locations.country.find(c => c.countryId === entry.countryId);

                // Fetch the sortName of the country
                const country = await Country.findOne({ id: entry.countryId }).select('sortname name');
                const sortName = country && country.sortname ? country.sortname : null;
                const countryName = country && country.name ? country.name : (countryEntry ? countryEntry.name : '');

                // Create showName: "StateName, countrySortName" OR "StateName, countryName" if no sortName
                let showName;
                if (sortName && sortName.trim()) {
                    showName = `${entry.name}, ${sortName}`;
                } else if (countryName && countryName.trim()) {
                    showName = `${entry.name}, ${countryName}`;
                } else {
                    showName = entry.name; // Fallback to just state name if no country info
                }



                const prefix = countryEntry?.status === 1
                    ? slugify(countryEntry.name, { lower: true }) + '/'
                    : '';
                const fullSlug = prefix + slugify(entry.name, { lower: true });

                const exists = await Slug.findOne({
                    slug: fullSlug,
                    slugType: 'state',
                    locationId: entry.stateId,
                    showName: showName,

                    projectId
                });
                if (!exists) {
                    await Slug.create({
                        slug: fullSlug,
                        slugType: 'state',
                        locationId: entry.stateId,
                        showName: showName,
                        projectId
                    });
                }
            }

            return res.status(200).json({
                message: 'States updated successfully!',
                data: project
            });
        } catch (error) {
            console.error('Error in updateStateInProject:', error);
            return res.status(500).json({ message: 'An error occurred.' });
        }
    },

    // 3. Update City
    updateCityInProject: async (req, res) => {
        try {
            let { projectId, cities, manualCities } = req.body;
            if (typeof cities === 'string') cities = JSON.parse(cities);
            if (typeof manualCities === 'string') manualCities = JSON.parse(manualCities);

            if (
                !projectId ||
                ((!Array.isArray(cities) || !cities.length) &&
                    (!Array.isArray(manualCities) || !manualCities.length))
            ) {
                return res.status(400).json({
                    message: 'Project ID and at least one city (selected or manual) are required!'
                });
            }

            // 1) Handle any manualCities
            if (Array.isArray(manualCities) && manualCities.length) {
                const all = await City.find().select('id').lean();
                const nums = all.map(c => parseInt(c.id, 10)).filter(n => !isNaN(n));
                let nextId = nums.length ? Math.max(...nums) + 1 : 1;

                for (let mc of manualCities) {
                    const { stateId, name: rawName } = mc;
                    const status = mc.status === 0 ? 0 : 1;
                    const name = rawName
                        .trim()
                        .split(/\s+/)
                        .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
                        .join(' ');

                    let existing = await City.findOne({ name, state_id: stateId, manual: 1 });
                    let idStr = existing ? existing.id : (nextId++).toString();
                    if (!existing) {
                        await new City({
                            id: idStr,
                            name,
                            state_id: stateId,
                            manual: 1
                        }).save();
                    }

                    cities.push({ stateId, cityId: idStr, name, status });
                }
            }

            // 2) Persist the city list to the project
            const cityData = (cities || []).map(c => ({
                stateId: c.stateId,
                cityId: c.cityId,
                name: c.name,
                status: c.status === 0 ? 0 : 1
            }));
            const isCity = cityData.some(c => c.status === 1) ? 1 : 0;

            const project = await UserProject.findByIdAndUpdate(
                projectId,
                { $set: { 'locations.city': cityData, isCity } },
                { new: true }
            );
            if (!project) {
                return res.status(404).json({ message: 'Project not found!' });
            }

            // 3) Upsert slugs for each city entry
            for (let entry of cityData) {
                // Find parent state and country records
                const stateEntry = project.locations.state.find(
                    s => String(s.stateId) === String(entry.stateId)
                );
                const countryEntry = stateEntry
                    ? project.locations.country.find(
                        c => String(c.countryId) === String(stateEntry.countryId)
                    )
                    : null;



                // Fetch the sortName and name of the state
                const state = await State.findOne({ id: entry.stateId }).select('sortname name');
                const sortNameOfState = state && state.sortname ? state.sortname : null;
                const stateName = state && state.name ? state.name : (stateEntry ? stateEntry.name : '');

                // Create showName: "CityName, stateSortName" OR "CityName, stateName" if no sortName
                let showName;
                if (sortNameOfState && sortNameOfState.trim()) {
                    showName = `${entry.name}, ${sortNameOfState}`;
                } else if (stateName && stateName.trim()) {
                    showName = `${entry.name}, ${stateName}`;
                } else {
                    showName = entry.name; // Fallback to just city name if no state info
                }

                // Build slug parts in hierarchy, skipping any with status!==1
                const slugParts = [];
                if (countryEntry && countryEntry.status === 1) {
                    slugParts.push(slugify(countryEntry.name, { lower: true }));
                }
                if (stateEntry && stateEntry.status === 1) {
                    slugParts.push(slugify(stateEntry.name, { lower: true }));
                }
                // Always include city itself
                slugParts.push(slugify(entry.name, { lower: true }));

                const fullSlug = slugParts.join('/');

                // Upsert the slug record
                const exists = await Slug.findOne({
                    slug: fullSlug,
                    slugType: 'city',
                    locationId: entry.cityId,
                    showName: showName,
                    projectId
                });
                if (!exists) {
                    await Slug.create({
                        slug: fullSlug,
                        slugType: 'city',
                        locationId: entry.cityId,
                        showName: showName,

                        projectId
                    });
                }
            }

            return res.status(200).json({
                message: 'Cities updated successfully!',
                data: project
            });
        } catch (error) {
            console.error('Error in updateCityInProject:', error);
            return res.status(500).json({ message: 'An error occurred.' });
        }
    },

    // 4. Update Local Area
    updateLocalAreaInProject: async (req, res) => {
        try {
            const { projectId, localAreas } = req.body;
            if (!projectId || !Array.isArray(localAreas)) {
                return res.status(400).json({
                    message: 'projectId and localAreas (array) are required'
                });
            }

            // 4a) Upsert AdminLocalArea
            const existing = await AdminLocalArea.find().select('id').lean();
            const nums = existing
                .map(a => parseInt(a.id, 10))
                .filter(n => !isNaN(n));
            let nextId = nums.length ? Math.max(...nums) + 1 : 1;
            const payload = [];

            for (let la of localAreas) {
                const { name: rawName, cityId } = la;
                const name = rawName
                    .trim()
                    .split(/\s+/)
                    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
                    .join(' ');

                let area = await AdminLocalArea.findOne({
                    name,
                    city_id: cityId,
                    manual: 1
                });
                if (!area) {
                    const idStr = (nextId++).toString();
                    area = await new AdminLocalArea({
                        id: idStr,
                        name,
                        city_id: cityId,
                        manual: 1
                    }).save();
                }
                payload.push({
                    localAreaId: area.id,
                    name,
                    cityId
                });
            }

            // 4b) Persist to project
            const project = await UserProject.findByIdAndUpdate(
                projectId,
                { $set: { 'locations.localArea': payload, isLocal: 1 } },
                { new: true }
            );
            if (!project) {
                return res.status(404).json({ message: 'Project not found!' });
            }

            // 4c) Upsert slugs (hierarchy: country → state → city → local area)
            for (let area of project.locations.localArea) {
                // find city, state, and country entries
                const cityEntry = project.locations.city.find(
                    c => String(c.cityId) === String(area.cityId)
                );
                const stateEntry = cityEntry
                    ? project.locations.state.find(
                        s => String(s.stateId) === String(cityEntry.stateId)
                    )
                    : null;
                const countryEntry = stateEntry
                    ? project.locations.country.find(
                        c => String(c.countryId) === String(stateEntry.countryId)
                    )
                    : null;

                // build slug parts dynamically, including only status===1
                const slugParts = [];
                if (countryEntry && countryEntry.status === 1) {
                    slugParts.push(slugify(countryEntry.name, { lower: true }));
                }
                if (stateEntry && stateEntry.status === 1) {
                    slugParts.push(slugify(stateEntry.name, { lower: true }));
                }
                if (cityEntry && cityEntry.status === 1) {
                    slugParts.push(slugify(cityEntry.name, { lower: true }));
                }
                // always include the local area itself
                slugParts.push(slugify(area.name, { lower: true }));

                const fullSlug = slugParts.join('/');

                // Fetch city sortName and name
                let citySortName = null;
                let cityName = null;

                if (cityEntry && cityEntry.cityId) {
                    const city = await City.findOne({ id: cityEntry.cityId }).select('sortname name').lean();
                    citySortName = city && city.sortname ? city.sortname : null;
                    cityName = city && city.name ? city.name : (cityEntry.name || null);
                }

                // Create showName: "LocalAreaName, citySortName" OR "LocalAreaName, cityName" if no sortName
                let showName;
                if (citySortName && citySortName.trim()) {
                    showName = `${area.name}, ${citySortName}`;
                } else if (cityName && cityName.trim()) {
                    showName = `${area.name}, ${cityName}`;
                } else {
                    showName = area.name; // Fallback to just area name if no city info
                }



                // upsert the slug
                const exists = await Slug.findOne({
                    slug: fullSlug,
                    slugType: 'local_area',
                    locationId: area.localAreaId,
                    showName: showName,
                    projectId
                });
                if (!exists) {
                    await Slug.create({
                        slug: fullSlug,
                        slugType: 'local_area',
                        locationId: area.localAreaId,
                        showName: showName,

                        projectId
                    });
                }
            }

            return res.status(200).json({
                message: 'Local areas updated successfully',
                data: project
            });
        } catch (error) {
            console.error('Error in updateLocalAreaInProject:', error);
            return res.status(500).json({ message: 'An error occurred.' });
        }
    },


    makeEachLocaionPage: async (req, res) => {
        try {
            const { projectId } = req.body;
            if (!projectId) return res.status(400).json({ message: 'projectId is required' });

            const project = await UserProject.findById(projectId);
            if (!project) return res.status(404).json({ message: 'Project not found' });

            const { locations } = project;

            let allLocations = [];

            // Country
            if (locations.country && Array.isArray(locations.country)) {
                allLocations = allLocations.concat(
                    locations.country.map(c => ({
                        id: c.countryId,
                        name: c.name,
                        lat: c.lat || null,
                        lng: c.lng || null,
                        areaType: 'country'
                    }))
                );
            }
            // State
            if (locations.state && Array.isArray(locations.state)) {
                allLocations = allLocations.concat(
                    locations.state.map(s => ({
                        id: s.stateId,
                        name: s.name,
                        lat: s.lat || null,
                        lng: s.lng || null,
                        areaType: 'state'
                    }))
                );
            }
            // City
            if (locations.city && Array.isArray(locations.city)) {
                allLocations = allLocations.concat(
                    locations.city.map(ci => ({
                        id: ci.cityId,
                        name: ci.name,
                        lat: ci.lat || null,
                        lng: ci.lng || null,
                        areaType: 'city'
                    }))
                );
            }
            // LocalArea
            if (locations.localArea && Array.isArray(locations.localArea)) {
                allLocations = allLocations.concat(
                    locations.localArea.map(la => ({
                        id: la.localAreaId,
                        name: la.name,
                        lat: la.lat || null,
                        lng: la.lng || null,
                        areaType: 'local_area'
                    }))
                );
            }

            // Optional: remove duplicates by id & areaType (if needed)
            // allLocations = _.uniqBy(allLocations, loc => `${loc.areaType}_${loc.id}`);

            await projectBackgroundQueue.add({
                projectId,
                worktype: "areapages",
                locations: allLocations
            });

            return res.status(200).json({
                message: 'Locations fetched',
                data: allLocations
            });
        } catch (err) {
            console.error('Error in getAllLocationsForProject:', err);
            return res.status(500).json({ message: 'An error occurred.' });
        }
    },

    // New endpoint: trigger area service page generation for a single location
    makeEachLocationServicePage: async (req, res) => {
        try {
            const { projectId } = req.body;
            if (!projectId) return res.status(400).json({ message: 'projectId is required' });

            const project = await UserProject.findById(projectId);
            if (!project) return res.status(404).json({ message: 'Project not found' });

            const { locations } = project;
            let allLocations = [];

            // Country
            if (locations.country && Array.isArray(locations.country)) {
                allLocations = allLocations.concat(
                    locations.country.map(c => ({
                        id: c.countryId,
                        name: c.name,
                        lat: c.lat || null,
                        lng: c.lng || null,
                        areaType: 'country',
                        slug: c.slug || undefined
                    }))
                );
            }
            // State
            if (locations.state && Array.isArray(locations.state)) {
                allLocations = allLocations.concat(
                    locations.state.map(s => ({
                        id: s.stateId,
                        name: s.name,
                        lat: s.lat || null,
                        lng: s.lng || null,
                        areaType: 'state',
                        slug: s.slug || undefined
                    }))
                );
            }
            // City
            if (locations.city && Array.isArray(locations.city)) {
                allLocations = allLocations.concat(
                    locations.city.map(ci => ({
                        id: ci.cityId,
                        name: ci.name,
                        lat: ci.lat || null,
                        lng: ci.lng || null,
                        areaType: 'city',
                        slug: ci.slug || undefined
                    }))
                );
            }
            // Local Area
            if (locations.localArea && Array.isArray(locations.localArea)) {
                allLocations = allLocations.concat(
                    locations.localArea.map(la => ({
                        id: la.localAreaId,
                        name: la.name,
                        lat: la.lat || null,
                        lng: la.lng || null,
                        areaType: 'local_area',
                        slug: la.slug || undefined
                    }))
                );
            }

            // Optional: Remove duplicates by id & areaType (if needed)
            // allLocations = _.uniqBy(allLocations, loc => `${loc.areaType}_${loc.id}`);

            if (!allLocations.length) {
                return res.status(404).json({ message: 'No locations found for this project.' });
            }


            // console.log(allLocations,"all locations are here");return 

            // Deprecated: generateServiceDescQueue is no longer used for area/service generation.

            return res.status(200).json({
                message: 'Area Service Page generation triggered for ALL locations of the project.',
                count: allLocations.length,
                data: allLocations
            });
        } catch (err) {
            console.error('Error in createOrUpdateAllAreaServicePages:', err);
            return res.status(500).json({ message: 'An error occurred.' });
        }
    },



    generateServices: async (req, res) => {
        try {
            // Get projectId from request body



            let { projectId, wantAiServices = 1, servicesCount = 2 } = req.body;

            console.log(servicesCount, "<><><>><><><>servicesCount")

            // console.log(req.body);return


            // Validate wantAiServices flag
            if (![0, 1].includes(Number(wantAiServices))) {
                return res.status(400).json({ message: 'wantAiServices must be 0 or 1' });
            }


            // Validate servicesCount, if AI services are enabled (wantAiServices is 1)
            if (wantAiServices === 1) {
                // Check if servicesCount is a string and try to convert it to a number
                if (typeof servicesCount === 'string' && !isNaN(servicesCount)) {
                    // Convert to number
                    servicesCount = Number(servicesCount);
                }

                // Validate if servicesCount is now a valid number
                if (typeof servicesCount !== 'number' || servicesCount <= 0) {
                    return res.status(400).json({ message: 'servicesCount must be a positive number' });
                }
                console.log("SERVICE COUNT TO SEND FROM API", servicesCount)
            }



            // Validate the project ID
            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required' });
            }

            // Fetch the project data
            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Extract data from the project (locations could be arrays of objects)
            const countries = project.locations.country || [];
            const states = project.locations.state || [];
            const cities = project.locations.city || [];
            const localAreas = project.locations.localArea || [];
            const homepage = [
                {
                    "countryId": "100001",
                    "name": "Homepage",
                    "_id": {
                        "$oid": "681471bdf400e439bec4c990"
                    }
                }
            ];

            console.log(`Received location data: Countries(${countries.length}), States(${states.length}), Cities(${cities.length}), LocalAreas(${localAreas.length})}`);

            // Send the success response immediately after validating the project and extracting the data
            res.status(200).json({
                message: 'All services and documents are being processed in the background!',
            });

            // Function to process jobs sequentially in different Redis queues
            async function processJobsSequentially(dataArray, queueName, type, projectId, wantAiServices, servicesCount) {
                console.log(`Starting to add ${type} jobs to ${queueName}. Total ${type} count: ${dataArray.length}, Want services is ${wantAiServices}`);
                for (const data of dataArray) {
                    // Add job to the Redis queue
                    await redisQueue.add({
                        queueName,  // Specific queue name (e.g., 'countryQueue')
                        type,       // 'country', 'state', 'city', 'local_area'
                        data,
                        projectId,
                        wantAiServices,
                        servicesCount // Include the servicesCount in the Redis job
                    });
                    console.log(`Added ${type} job for: ${JSON.stringify(data)}`);
                }
                console.log(`All ${type} jobs added to ${queueName}.`);
            }

            // Function to wait for a queue to complete processing its pending jobs
            async function waitForQueueCompletion(queueName) {
                let isQueueEmpty = false;
                while (!isQueueEmpty) {
                    // Get the count of jobs in the queue
                    const jobCount = await redisQueue.getJobCounts();
                    // Sum pending jobs: waiting, active, delayed
                    const pendingJobs = jobCount.waiting + jobCount.active + jobCount.delayed;

                    console.log(`Queue ${queueName}: Pending jobs count: ${pendingJobs}`);

                    // If there are no pending jobs, the queue is empty
                    if (pendingJobs === 0) {
                        isQueueEmpty = true;
                    } else {
                        // Wait for 1 second before checking again
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                console.log(`All jobs in ${queueName} have been processed!`);
            }

            // Process jobs in sequence, waiting for the previous one to complete before moving to the next
            await processJobsSequentially(homepage, 'homepageQueue', 'homepage', projectId, wantAiServices, servicesCount);
            await waitForQueueCompletion('homepageQueue');

            await processJobsSequentially(countries, 'countryQueue', 'country', projectId, wantAiServices, servicesCount);
            await waitForQueueCompletion('countryQueue');

            await processJobsSequentially(states, 'stateQueue', 'state', projectId, wantAiServices, servicesCount);
            await waitForQueueCompletion('stateQueue');

            await processJobsSequentially(cities, 'cityQueue', 'city', projectId, wantAiServices, servicesCount);
            await waitForQueueCompletion('cityQueue');

            await processJobsSequentially(localAreas, 'localAreaQueue', 'local_area', projectId, wantAiServices, servicesCount);
            await waitForQueueCompletion('localAreaQueue');

            // Generate Privacy Policy, Terms & Conditions, and About Us content in the background
            const projectName = project.projectName;
            const serviceType = project.serviceType;





            // Deprecated: generateServiceDescQueue is no longer used.



        } catch (error) {
            console.error('Error in addServicesToLocation:', error);
            return res.status(500).json({ message: 'An error occurred while processing your request.' });
        }
    },


    //6. Add services to location API
    addServicesToLocation: async (req, res) => {
        try {
            console.log("Request Body:", req.body);
            // 1) VALIDATION (unchanged)
            let { projectId, wantAiServices = 1, services = [], servicesCount = 2 } = req.body;
            const userId = req.user.userId;

            if (![0, 1].includes(Number(wantAiServices))) {
                return res.status(400).json({ message: 'wantAiServices must be 0 or 1' });
            }
            if (wantAiServices === 0 && typeof services === 'string') {
                services = JSON.parse(services);
            }
            if (wantAiServices === 0 && (!Array.isArray(services) || services.length === 0)) {
                return res.status(400).json({
                    message: 'When wantAiServices is 0, you must provide a non-empty services array'
                });
            }

            // Validate servicesCount, if AI services are enabled (wantAiServices is 1)
            if (wantAiServices === 1) {
                // Check if servicesCount is a string and try to convert it to a number
                if (typeof servicesCount === 'string' && !isNaN(servicesCount)) {
                    // Convert to number
                    servicesCount = Number(servicesCount);
                }

                // Validate if servicesCount is now a valid number
                if (typeof servicesCount !== 'number' || servicesCount <= 0) {
                    return res.status(400).json({ message: 'servicesCount must be a positive number' });
                }
                console.log("SERVICE COUNT TO SEND FROM API", servicesCount)
            }

            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required' });
            }

            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // 2) FILTER OUT ALREADY-GENERATED PAGES
            const doSite = !project.siteContentGenerated;
            const homepage = doSite
                ? [{ countryId: '100001', name: 'Homepage', _id: { $oid: '681471bdf400e439bec4c990' } }]
                : [];

            // Check if this is a business website (projectType = 1)
            const isBusinessWebsite = project.projectType === 1;

            let countries = [];
            let states = [];
            let cities = [];
            let localAreas = [];
            let businessLocations = []; // Parent locations (type = 0)
            let businessLocalAreas = []; // Child/local areas (type = 1)

            if (isBusinessWebsite) {
                // For business websites, fetch from BusinessLocation model
                const allBusinessLocations = await BusinessLocation.find({
                    projectId: projectId,
                    status: 1 // Active
                }).lean();

                // Separate parent locations (type = 0) and child/local areas (type = 1)
                businessLocations = allBusinessLocations
                    .filter(loc => loc.type === 0 && !loc.pageGenerated)
                    .map(loc => ({
                        _id: loc._id,
                        name: loc.areaName,
                        areaName: loc.areaName,
                        lat: loc.lat || null,
                        lng: loc.lng || null,
                        country: loc.country || null,
                        state: loc.state || null,
                        city: loc.city || null,
                        googlePlaceId: loc.googlePlaceId || null,
                        formattedAddress: loc.formattedAddress || null,
                        bounds: loc.bounds || null
                    }));

                businessLocalAreas = allBusinessLocations
                    .filter(loc => loc.type === 1 && !loc.pageGenerated)
                    .map(loc => ({
                        _id: loc._id,
                        name: loc.areaName,
                        areaName: loc.areaName,
                        parentId: loc.parentId,
                        lat: loc.lat || null,
                        lng: loc.lng || null,
                        country: loc.country || null,
                        state: loc.state || null,
                        city: loc.city || null,
                        googlePlaceId: loc.googlePlaceId || null,
                        formattedAddress: loc.formattedAddress || null,
                        bounds: loc.bounds || null
                    }));
            } else {
                // For location-based websites, use existing logic
                countries = project.locations.country
                    .filter(c => c.status === 1 && !c.pageGenerated);

                states = project.locations.state
                    .filter(s => s.status === 1 && !s.pageGenerated);

                cities = project.locations.city
                    .filter(c => c.status === 1 && !c.pageGenerated);

                localAreas = project.locations.localArea
                    .filter(l => l.status === 1 && !l.pageGenerated);
            }

            // 3) IF NOTHING TO DO → EARLY EXIT
            if (
                homepage.length === 0 &&
                countries.length === 0 &&
                states.length === 0 &&
                cities.length === 0 &&
                localAreas.length === 0 &&
                businessLocations.length === 0 &&
                businessLocalAreas.length === 0
            ) {
                return res.status(200).json({ message: 'All pages already generated—nothing to do.' });
            }

            // 4) ACK IMMEDIATE RESPONSE
            res.status(200).json({
                message: 'All services and documents are being processed in the background!',
            });
            console.log(servicesCount, "<><><>><><><>servicesCount")

            // 5) QUEUE HELPERS (unchanged)
            async function processJobsSequentially(dataArray, queueName, type) {
                console.log(`Adding ${type} jobs (${dataArray.length}) to ${queueName}`);
                for (const data of dataArray) {
                    await redisQueue.add({ queueName, type, data, projectId, wantAiServices, services, servicesCount });
                    console.log(` → added ${type} job for`, data);
                }
            }
            async function waitForQueueCompletion(queueName) {
                let pending = true;
                while (pending) {
                    const counts = await redisQueue.getJobCounts();
                    const total = counts.waiting + counts.active + counts.delayed;
                    console.log(`[${queueName}] pending jobs:`, total);
                    if (total === 0) pending = false;
                    else await new Promise(r => setTimeout(r, 1000));
                }
            }

            // 6) ENQUEUE IN ORDER
            await processJobsSequentially(homepage, 'homepageQueue', 'homepage');
            await waitForQueueCompletion('homepageQueue');

            if (isBusinessWebsite) {
                // For business websites: process business locations and local areas
                await processJobsSequentially(businessLocations, 'businessLocationQueue', 'business_location');
                await waitForQueueCompletion('businessLocationQueue');

                await processJobsSequentially(businessLocalAreas, 'businessLocalareaQueue', 'business_local_area');
                await waitForQueueCompletion('businessLocalareaQueue');
            } else {
                // For location-based websites: process country, state, city, local area
                await processJobsSequentially(countries, 'countryQueue', 'country');
                await waitForQueueCompletion('countryQueue');

                await processJobsSequentially(states, 'stateQueue', 'state');
                await waitForQueueCompletion('stateQueue');

                await processJobsSequentially(cities, 'cityQueue', 'city');
                await waitForQueueCompletion('cityQueue');

                await processJobsSequentially(localAreas, 'localAreaQueue', 'local_area');
                await waitForQueueCompletion('localAreaQueue');
            }

            // 7) GLOBAL SITE CONTENT (only once)
            if (doSite) {
                const projectName = project.projectName;
                const serviceType = project.serviceType;

                const privacyPolicyPrompt = `
                Write a privacy policy for the website of "${projectName}", which provides "${serviceType}" services. The policy should include:
                - Information about the types of personal data collected (e.g., name, email, payment details).
                - How this data is used (e.g., for service provision, marketing, customer support).
                - Details on how the data is protected and the security measures taken.
                - How users can manage their data preferences (e.g., opt-out, data deletion).
                - The company's stance on sharing data with third parties, and any exceptions (e.g., with partners or for legal purposes).
                - A mention of compliance with relevant laws (e.g., GDPR, CCPA).
                - A statement on cookie usage, if applicable.
                The content should be concise but cover all important aspects of a privacy policy, making it clear and transparent for users.
                Keep the content around 300-400 words.
                -make sure i want it in html tags format like heading and p tags.
                `;

                const termsAndConditionsPrompt = `
                Write terms and conditions for the website of "${projectName}", which offers "${serviceType}" services. The terms and conditions should include:
                - An introduction explaining the agreement between the company and the user.
                - A description of the services provided by the website.
                - Rules and obligations for users when accessing the website or using services (e.g., account creation, content usage).
                - A disclaimer of liability (e.g., for service interruptions or content errors).
                - The company's right to modify the terms and conditions and the notification process.
                - Information about the refund and cancellation policies, if applicable.
                - The governing law and jurisdiction in case of disputes.
                - A mention of the website's right to terminate accounts for violations of the terms.
                The content should be clear, legally sound, and professional. Aim for around 400-500 words.
                -make sure i want it in html tags format like heading and p tags.
                `;

                const aboutUsPrompt = `
                Write an "About Us" section for the website of "${projectName}", which offers "${serviceType}" services. The content should include:
                - An introduction to the company, its mission, and the services it provides.
                - A brief history of the company and its growth.
                - Key values or principles that drive the company (e.g., customer satisfaction, innovation, integrity).
                - The team behind the company, highlighting expertise or leadership.
                - A mention of any partnerships or unique selling points.
                The content should reflect the company's vision and its impact in the "${serviceType}" space.
                Keep the content around 300-400 words
                -make sure i want it in html tags format like heading and p tags.
            `;

                const updateOrCreateContent = async (sectionTitle, content) => {
                    await WebsiteSection.findOneAndUpdate(
                        { projectId, sectionTitle },
                        { $set: { sectionContent: content } },
                        { new: true, upsert: true }
                    );
                };

                const privacyPolicyContent = await fetchStringFromOpenAI(privacyPolicyPrompt, "privacypolicy", { userId, projectId, pageId: "privacy", promptFrom: "addServicesTolocationAPI", promptFor: "privacyPolicy" });
                await updateOrCreateContent('privacyPolicyContent', privacyPolicyContent);

                const tncContent = await fetchStringFromOpenAI(termsAndConditionsPrompt, "termsAndConditions", { userId, projectId, pageId: "terms", promptFrom: "addServicesTolocationAPI", promptFor: "termsAndConditions" });
                await updateOrCreateContent('termsAndConditionsContent', tncContent);

                const aboutUsContent = await fetchStringFromOpenAI(aboutUsPrompt, "aboutUs", { userId, projectId, pageId: "about", promptFrom: "addServicesTolocationAPI", promptFor: "aboutUs" });
                await updateOrCreateContent('aboutUsContent', aboutUsContent);

                project.siteContentGenerated = true;
            }

            // 8) ENQUEUE SERVICE-DESC AND AREA PAGES
            if (isBusinessWebsite) {
                // For business websites, send business locations to queues
                const allBusinessLocationsForQueues = [
                    ...businessLocations.map(loc => ({
                        id: loc._id.toString(),
                        name: loc.areaName || loc.name,
                        lat: loc.lat || null,
                        lng: loc.lng || null,
                        areaType: 'business_location'
                    })),
                    ...businessLocalAreas.map(loc => ({
                        id: loc._id.toString(),
                        name: loc.areaName || loc.name,
                        lat: loc.lat || null,
                        lng: loc.lng || null,
                        areaType: 'business_local_area'
                    }))
                ];

                console.log(`[addServicesToLocation] Business website detected. Preparing ${allBusinessLocationsForQueues.length} locations for queues:`,
                    allBusinessLocationsForQueues.map(l => ({ id: l.id, name: l.name, areaType: l.areaType })));

                // Deprecated: generateServiceDescQueue flow removed. Service content comes from step-6 generated sections.

                // Send to projectBackgroundQueue for area pages
                if (allBusinessLocationsForQueues.length > 0) {
                    console.log(`[addServicesToLocation] Sending ${allBusinessLocationsForQueues.length} locations to projectBackgroundQueue`);
                    await projectBackgroundQueue.add({
                        projectId,
                        worktype: "areapages",
                        locations: allBusinessLocationsForQueues
                    });
                    console.log(`[addServicesToLocation] ✅ Successfully added to projectBackgroundQueue`);
                }

                // Mark business locations as pageGenerated
                const businessLocationIds = businessLocations.map(loc => loc._id);
                const businessLocalAreaIds = businessLocalAreas.map(loc => loc._id);

                await BusinessLocation.updateMany(
                    { _id: { $in: [...businessLocationIds, ...businessLocalAreaIds] } },
                    { $set: { pageGenerated: true } }
                );
            } else {
                // Deprecated: generateServiceDescQueue flow removed.

                // Mark location-based pages as pageGenerated
                project.locations.country.forEach(c => { if (!c.pageGenerated) c.pageGenerated = true; });
                project.locations.state.forEach(s => { if (!s.pageGenerated) s.pageGenerated = true; });
                project.locations.city.forEach(c => { if (!c.pageGenerated) c.pageGenerated = true; });
                project.locations.localArea.forEach(l => { if (!l.pageGenerated) l.pageGenerated = true; });
            }

            await project.save();

        } catch (error) {
            console.error('Error in addServicesToLocation:', error);
            return res.status(500).json({ message: 'An error occurred while processing your request.' });
        }
    },

    addNewServices: async (req, res) => {
        try {
            let { projectId, wantAiServices = 1, services = [] } = req.body;
            wantAiServices = Number(wantAiServices);

            // Validate inputs
            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }
            if (![0, 1].includes(wantAiServices)) {
                return res.status(400).json({ message: 'wantAiServices must be 0 or 1' });
            }
            if (wantAiServices === 0) {
                if (typeof services === 'string') {
                    try { services = JSON.parse(services); }
                    catch { return res.status(400).json({ message: 'services must be JSON array' }); }
                }
                if (!Array.isArray(services) || services.length === 0) {
                    return res.status(400).json({ message: 'When wantAiServices=0, provide non-empty services array' });
                }
            }

            // Immediately respond so caller is not blocked
            res.status(200).json({
                message: 'New services will be added in background; description generation will follow.'
            });

            // Enqueue the add-new-services job
            await addNewServicesQueue.add({
                projectId,
                wantAiServices,
                services
            });

        } catch (err) {
            console.error('Error in addNewServices API:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    generateTnC_Au_Pp: async (req, res) => {
        try {
            const { projectId } = req.body;

            // Validate the project ID
            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required' });
            }

            // Fetch the project data
            const project = await UserProject.findById(projectId);

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }
            let projectName = project.projectName;
            let serviceType = project.serviceType;

            // Define prompts for Privacy Policy and Terms & Conditions
            const privacyPolicyPrompt = `
                Write a privacy policy for the website of "${projectName}", which provides "${serviceType}" services. The policy should include:
                - Information about the types of personal data collected (e.g., name, email, payment details).
                - How this data is used (e.g., for service provision, marketing, customer support).
                - Details on how the data is protected and the security measures taken.
                - How users can manage their data preferences (e.g., opt-out, data deletion).
                - The company's stance on sharing data with third parties, and any exceptions (e.g., with partners or for legal purposes).
                - A mention of compliance with relevant laws (e.g., GDPR, CCPA).
                - A statement on cookie usage, if applicable.
                The content should be concise but cover all important aspects of a privacy policy, making it clear and transparent for users.
                Keep the content around 300-400 words.
                -make sure i want it in html tags format like heading and p tags.
                `;

            const termsAndConditionsPrompt = `
                Write terms and conditions for the website of "${projectName}", which offers "${serviceType}" services. The terms and conditions should include:
                - An introduction explaining the agreement between the company and the user.
                - A description of the services provided by the website.
                - Rules and obligations for users when accessing the website or using services (e.g., account creation, content usage).
                - A disclaimer of liability (e.g., for service interruptions or content errors).
                - The company's right to modify the terms and conditions and the notification process.
                - Information about the refund and cancellation policies, if applicable.
                - The governing law and jurisdiction in case of disputes.
                - A mention of the website's right to terminate accounts for violations of the terms.
                The content should be clear, legally sound, and professional. Aim for around 400-500 words.
                -make sure i want it in html tags format like heading and p tags.
                `;

            const aboutUsPrompt = `
                Write an "About Us" section for the website of "${projectName}", which offers "${serviceType}" services. The content should include:
                - An introduction to the company, its mission, and the services it provides.
                - A brief history of the company and its growth.
                - Key values or principles that drive the company (e.g., customer satisfaction, innovation, integrity).
                - The team behind the company, highlighting expertise or leadership.
                - A mention of any partnerships or unique selling points.
                The content should reflect the company's vision and its impact in the "${serviceType}" space.
                Keep the content around 300-400 words
                -make sure i want it in html tags format like heading and p tags.
            `;

            // Update or create content sections
            const updateOrCreateContent = async (sectionTitle, content) => {
                try {
                    const updatedContent = await WebsiteSection.findOneAndUpdate(
                        {
                            projectId: projectId,
                            sectionTitle: sectionTitle
                        },
                        {
                            $set: {
                                sectionContent: content
                            }
                        },
                        {
                            new: true,        // Return the modified document
                            upsert: true      // Create a new document if not found
                        });

                    console.log(`Successfully ${updatedContent ? 'updated' : 'created'} ${sectionTitle}`);
                    return updatedContent;
                } catch (error) {
                    console.error(`Error updating or creating ${sectionTitle}:`, error);
                    return null;
                }
            };

            // Generate Privacy Policy, Terms & Conditions, and About Us content
            const userId = req.user?.userId || project.userId?.toString() || 'admin';

            const privacyPolicyContent = await getResponseFromOpenAITracked(
                privacyPolicyPrompt,
                'PrivacyPolicyGeneration',
                {
                    userId,
                    projectId,
                    pageId: projectId,
                    promptFrom: 'admin_panel',
                    promptFor: 'privacy_policy'
                }
            );
            await updateOrCreateContent('privacyPolicyContent', privacyPolicyContent.text);

            const termsAndConditionsContent = await getResponseFromOpenAITracked(
                termsAndConditionsPrompt,
                'TermsAndConditionsGeneration',
                {
                    userId,
                    projectId,
                    pageId: projectId,
                    promptFrom: 'admin_panel',
                    promptFor: 'terms_and_conditions'
                }
            );
            await updateOrCreateContent('termsAndConditionsContent', termsAndConditionsContent.text);

            const aboutUsContent = await getResponseFromOpenAITracked(
                aboutUsPrompt,
                'AboutUsGeneration',
                {
                    userId,
                    projectId,
                    pageId: projectId,
                    promptFrom: 'admin_panel',
                    promptFor: 'about_us'
                }
            );
            await updateOrCreateContent('aboutUsContent', aboutUsContent.text);

            return helper.sendSuccess(res, 201, 'Project updated successfully', project);

        } catch (error) {
            return helper.sendError(res, 500, error);
        }
    },

    generateUnsplashImages: async (req, res) => {
        try {
            let query = req.body.query;

            if (!query) {
                return res.status(400).json({ error: "Query parameter is required" });
            }

            const fetchImages = async (prompt) => {
                const apiKey = process.env.UNSPLASH_ACCESS_KEY;
                const url = `https://api.unsplash.com/search/photos`;


                try {
                    const response = await axios.get(url, {
                        params: {
                            query: prompt,
                            per_page: 10, // Number of results per page
                        },
                        headers: {
                            Authorization: `Client-ID ${apiKey}`,
                        },
                    });

                    const images = response.data.results.map((image) => ({
                        description: image.alt_description,
                        url: image.urls.full,
                    }));

                    console.log(images);


                    res.json({
                        images: images,

                    });
                } catch (error) {
                    console.error('Error fetching images:', error.response?.data || error.message);
                }
            };


            // Example usage
            fetchImages(query);

        } catch (error) {
            console.log(error, "error is");


        }
    },

    // Helper function to wait for queue processing completion

    my_site: async (req, res) => {
        try {
            const { projectId } = req.body;

            console.log(req.body, "body data");

            // Validate required field
            if (!projectId) {
                return res.status(400).json({ message: "Project ID is required!" });
            }

            // Fetch project information
            const projectInfo = await UserProject.findById(projectId).lean();
            if (!projectInfo) {
                return res.status(404).json({ message: "Project not found!" });
            }

            // Response with only project table data
            res.status(200).json({
                message: "Project data fetched successfully!",
                projectInfo,
            });
        } catch (error) {
            console.error("Error in mySite API:", error);
            res.status(500).json({ error: error.message });
        }
    },

    fetch_countries: async (req, res) => {
        const { page = 1, limit = 1000, search = "", sort = "asc" } = req.query;
        console.log("Fetching countries:", req.query);

        try {
            const query = search ? { name: { $regex: search, $options: "i" } } : {};
            const sortOrder = sort === "desc" ? -1 : 1;

            const countries = await Country.find(query)
                .sort({ name: sortOrder }) // Sorting A-Z or Z-A
            // .skip((page - 1) * limit)
            // .limit(Number(limit));

            const totalCountries = await Country.countDocuments(query);

            res.status(200).json({
                message: "Countries fetched successfully",
                data: countries,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCountries / limit),
                    totalCountries,
                },
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    },

    fetch_states: async (req, res) => {
        let { page = 1, limit = 100, search = "", country_ids, sort = "asc" } = req.query;
        console.log("Fetching states:", req.query);

        try {
            // Convert `page` & `limit` to numbers
            page = Number(page);
            limit = Number(limit);

            // Ensure `country_ids` is an array (supports comma-separated string)
            if (typeof country_ids === "string") {
                country_ids = country_ids
                    .split(",")
                    .map((id) => String(id).trim())
                    .filter(Boolean);
            } else if (Array.isArray(country_ids)) {
                country_ids = country_ids
                    .flatMap((id) =>
                        String(id).includes(",")
                            ? String(id).split(",").map((s) => s.trim())
                            : [String(id).trim()]
                    )
                    .filter(Boolean);
            } else {
                country_ids = [];
            }


            // console.log(country_ids,"country_ids");return

            const query = {
                ...(search && { name: { $regex: search, $options: "i" } }),
                ...(country_ids.length > 0 && { country_id: { $in: country_ids } }), // Use `$in` for multiple IDs
            };

            const sortOrder = sort === "desc" ? -1 : 1;

            const states = await State.find(query)
                .sort({ name: sortOrder })
            // .skip((page - 1) * limit)
            // .limit(limit); // Enable pagination

            const totalStates = await State.countDocuments(query);

            res.status(200).json({
                message: "States fetched successfully",
                data: states,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalStates / limit),
                    totalStates,
                },
            });
        } catch (error) {
            console.error("Error fetching states:", error);
            res.status(500).json({ message: "Server error" });
        }
    },


    fetch_cities: async (req, res) => {
        let { page = 1, limit = 100, search = "", state_ids, state_id, sort = "asc" } = req.query;
        console.log("Fetching cities:", req.query);

        try {
            if (!state_ids && state_id) state_ids = state_id;

            if (typeof state_ids === "string") {
                state_ids = state_ids
                    .split(",")
                    .map((id) => String(id).trim())
                    .filter(Boolean);
            } else if (Array.isArray(state_ids)) {
                state_ids = state_ids
                    .flatMap((id) =>
                        String(id).includes(",")
                            ? String(id).split(",").map((s) => s.trim())
                            : [String(id).trim()]
                    )
                    .filter(Boolean);
            } else {
                state_ids = [];
            }

            const query = {
                ...(search && { name: { $regex: search, $options: "i" } }),
                ...(state_ids.length && { state_id: { $in: state_ids } }),
            };
            const sortOrder = sort === "desc" ? -1 : 1;

            const cities = await City.find(query)
                .sort({ name: sortOrder })
            // .skip((page - 1) * limit)
            // .limit(Number(limit));

            const totalCities = await City.countDocuments(query);

            const updatedCities = cities.map(city => {
                const cityObject = city.toObject();  // Convert Mongoose document to plain JavaScript object
                cityObject._id = cityObject.id;     // Set _id to the value of id
                return cityObject;
            });


            res.status(200).json({
                message: "Cities fetched successfully",
                data: updatedCities,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCities / limit),
                    totalCities,
                },
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    },

    fetchServicesByProjectId: async (req, res) => {

        try {
            const { projectId } = req.params; // Get projectId from URL parameters

            if (!projectId) {
                return res.status(400).json({ message: 'ProjectId is required' });
            }

            // Fetch services from the database for the provided projectId
            const services = await Service.find({ projectId }).populate('projectId', 'projectName') // Optionally populate project details if needed
                .sort({ createdAt: -1 }); // Sort services by creation date (most recent first)

            if (!services.length) {
                return res.status(404).json({ message: 'No services found for this project' });
            }

            // Respond with the services data
            return res.status(200).json({
                message: 'Services fetched successfully',
                data: services
            });
        } catch (error) {
            console.error('Error fetching services:', error);
            return res.status(500).json({ message: 'Server error while fetching services' });
        }
    },


    updateAboutUs: async (req, res) => {
        try {
            const { projectId, email, phone, emails, phones, mainLocation, address } = req.body;

            // Ensure the project exists
            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            let normalizedEmails = Array.isArray(emails)
                ? emails
                    .filter((item) => item && typeof item.value === "string" && item.value.trim())
                    .map((item) => ({
                        value: item.value.trim(),
                        is_primary: item.is_primary === true,
                    }))
                : (email
                    ? [{ value: String(email).trim(), is_primary: true }]
                    : []);
            if (normalizedEmails.length > 0 && !normalizedEmails.some((e) => e.is_primary)) {
                normalizedEmails[0].is_primary = true;
            }

            let normalizedPhones = Array.isArray(phones)
                ? phones
                    .filter((item) => item && typeof item.value === "string" && item.value.trim())
                    .map((item) => ({
                        value: item.value.trim(),
                        is_primary: item.is_primary === true,
                    }))
                : (phone
                    ? [{ value: String(phone).trim(), is_primary: true }]
                    : []);
            if (normalizedPhones.length > 0 && !normalizedPhones.some((p) => p.is_primary)) {
                normalizedPhones[0].is_primary = true;
            }

            const primaryEmail = normalizedEmails.find((item) => item.is_primary)?.value || normalizedEmails[0]?.value || "";
            const primaryPhone = normalizedPhones.find((item) => item.is_primary)?.value || normalizedPhones[0]?.value || "";
            const normalizedAddress = address || mainLocation || "";

            // Keep a single AboutUs document per project (no duplicates)
            const aboutUs = await AboutUs.findOneAndUpdate(
                { projectId },
                {
                    $set: {
                        email: primaryEmail,
                        phone: primaryPhone,
                        emails: normalizedEmails,
                        phones: normalizedPhones,
                        address: normalizedAddress,
                        mainLocation: normalizedAddress
                    }
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            );

            // Generate/Upsert Contact Us FAQs (non-blocking)
            upsertContactUsFAQ({
                project,
                email: primaryEmail,
                phone: primaryPhone,
                mainLocation: normalizedAddress
            }).catch(err => console.warn('[ContactUs FAQ] async error:', err.message));

            return res.status(201).json({
                message: 'About Us saved successfully',
                data: aboutUs
            });
        } catch (error) {
            console.error('Error creating About Us:', error);
            return res.status(500).json({ message: 'Server error while creating About Us' });
        }
    },



    getAboutUs: async (req, res) => {
        try {

            console.log("we are in about converted contact js")
            const { projectId } = req.params;  // Get projectId from URL params

            if (!projectId) { throw "projectId is requiredh" }

            // Check if the project exists
            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Fetch latest AboutUs record for the given projectId
            const aboutUs = await AboutUs.findOne({ projectId }).sort({ _id: -1 });

            if (!aboutUs) {
                return res.status(404).json({ message: 'About Us information not found for this project' });
            }

            // Return the AboutUs details
            return res.status(200).json({ message: 'About Us details fetched successfully', data: aboutUs });
        } catch (error) {
            console.error('Error fetching About Us:', error);
            return res.status(500).json({ message: 'Server error while fetching About Us' });
        }
    },


    // Upsert Website Page - name is unique identifier (non-changeable), slug is changeable URL path
    upsertWebsitePage: async (req, res) => {
        try {
            console.log('[upsertWebsitePage] Request received:', req.body);
            console.log('[upsertWebsitePage] Query params:', req.query);
            console.log('[upsertWebsitePage] URL params:', req.params);

            // Try to get projectId from body, query params, or URL params
            let { projectId, name, slug, displayName, description, pageId } = req.body;
            projectId = projectId || req.query.projectId || req.params.projectId;

            // projectId is now required
            if (!projectId) {
                console.error('[upsertWebsitePage] Missing required field: projectId');
                console.error('[upsertWebsitePage] Request body:', req.body);
                console.error('[upsertWebsitePage] Request query:', req.query);
                console.error('[upsertWebsitePage] Request params:', req.params);
                return res.status(400).json({
                    message: 'projectId is required. Please provide projectId in the request body, query parameters, or URL parameters.',
                    received: {
                        body: req.body,
                        query: req.query,
                        params: req.params
                    }
                });
            }

            // Validate projectId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                console.error('[upsertWebsitePage] Invalid projectId format:', projectId);
                return res.status(400).json({ message: 'Invalid projectId format' });
            }

            // Verify project exists
            const project = await UserProject.findById(projectId);
            if (!project) {
                console.error('[upsertWebsitePage] Project not found:', projectId);
                return res.status(404).json({ message: 'Project not found' });
            }

            // If pageId is provided, try to find by ID first (and verify it belongs to this project)
            if (pageId) {
                if (!mongoose.Types.ObjectId.isValid(pageId)) {
                    console.log('[upsertWebsitePage] Invalid pageId format, will search by name');
                } else {
                    const existingPage = await WebsitePage.findOne({
                        _id: pageId,
                        projectId: projectId
                    });
                    if (existingPage) {
                        console.log('[upsertWebsitePage] Page found by ID:', existingPage._id);

                        try {
                            const { page: updatedPage } = await updateExistingWebsitePage({
                                projectId,
                                pageDoc: existingPage,
                                slug,
                                displayName,
                                description,
                            });

                            await ensurePageInDesignData(projectId, updatedPage._id);

                            return res.status(200).json({
                                message: 'Page updated successfully',
                                page: updatedPage,
                                data: updatedPage
                            });
                        } catch (slugError) {
                            if (slugError.statusCode === 409) {
                                return res.status(409).json({ message: slugError.message });
                            }
                            throw slugError;
                        }
                    } else {
                        console.log('[upsertWebsitePage] Page not found with given ID and projectId, will search by name');
                    }
                }
            }

            // For new pages, name is required
            if (!name || !displayName) {
                console.error('[upsertWebsitePage] Missing required fields:', { name, displayName });
                return res.status(400).json({ message: 'name and displayName are required' });
            }

            // Normalize name to lowercase for comparison (name is unique identifier, non-changeable)
            const normalizedName = name.toLowerCase().trim();
            console.log('[upsertWebsitePage] Normalized name:', normalizedName);

            // IMPORTANT: Check if page exists with SAME projectId + name combination
            // This ensures pages are unique per project, not globally
            let page = await WebsitePage.findOne({
                projectId: mongoose.Types.ObjectId.isValid(projectId) ? new mongoose.Types.ObjectId(projectId) : projectId,
                name: normalizedName
            });

            if (page) {
                // Verify it's the same project (double check)
                if (page.projectId && page.projectId.toString() === projectId.toString()) {
                    console.log('[upsertWebsitePage] Page already exists for this project:', page._id);

                    try {
                        const { page: updatedPage } = await updateExistingWebsitePage({
                            projectId,
                            pageDoc: page,
                            slug,
                            displayName,
                            description,
                        });

                        await ensurePageInDesignData(projectId, updatedPage._id);

                        return res.status(200).json({
                            message: 'Page already exists',
                            page: updatedPage,
                            data: updatedPage
                        });
                    } catch (slugError) {
                        if (slugError.statusCode === 409) {
                            return res.status(409).json({ message: slugError.message });
                        }
                        throw slugError;
                    }
                } else {
                    // Page exists but for different project - this shouldn't happen, but handle it
                    console.warn('[upsertWebsitePage] Page found but projectId mismatch. This may indicate a data inconsistency.');
                    // Continue to create new page for this project
                }
            }

            // Page doesn't exist for this project, create new one
            console.log('[upsertWebsitePage] Creating new page for project:', projectId);

            // Normalize slug (remove leading/trailing slashes, default to name if not provided)
            let normalizedSlug = slug ? normalizeSlugInput(slug) : normalizedName;
            if (!normalizedSlug) {
                normalizedSlug = normalizedName;
            }

            const availability = await assertSlugAvailable(projectId, normalizedSlug);
            if (!availability.ok) {
                return res.status(409).json({ message: availability.message });
            }

            page = new WebsitePage({
                projectId: mongoose.Types.ObjectId.isValid(projectId) ? new mongoose.Types.ObjectId(projectId) : projectId,
                name: normalizedName, // name is unique identifier, non-changeable
                slug: normalizedSlug, // slug is changeable URL path
                displayName: displayName.trim(),
                description: description ? description.trim() : ''
            });

            const isNewPageRecord = true;

            try {
                await page.save();
                console.log('[upsertWebsitePage] Page created successfully:', page._id);
            } catch (saveError) {
                // If save fails due to duplicate key, try to find the existing page
                if (saveError.code === 11000) {
                    console.log('[upsertWebsitePage] Duplicate key error during save, finding existing page with projectId + name...');

                    // Check if it's the old name_1 index causing the issue
                    if (saveError.keyPattern && saveError.keyPattern.name === 1 && !saveError.keyPattern.projectId) {
                        console.warn('[upsertWebsitePage] Old name_1 index detected! This index should be dropped. Run: node backend/scripts/dropWebsitePageNameIndex.js');
                        console.warn('[upsertWebsitePage] Attempting to find existing page by name only (legacy behavior)...');

                        // Try to find by name only (old index behavior)
                        const existingPageByName = await WebsitePage.findOne({ name: normalizedName });

                        if (existingPageByName) {
                            if (existingPageByName.projectId && existingPageByName.projectId.toString() === projectId.toString()) {
                                // Page exists for this project - use it
                                console.log('[upsertWebsitePage] Found existing page for this project (legacy index):', existingPageByName._id);
                                page = existingPageByName;
                            } else {
                                // Page exists for different project - this is the old index issue
                                console.error('[upsertWebsitePage] Page exists for different project due to old name_1 index. Please run migration script to fix.');
                                return res.status(409).json({
                                    message: 'A page with this name already exists for another project. This is due to a legacy database index. Please run the migration script: node backend/scripts/dropWebsitePageNameIndex.js',
                                    error: 'Legacy index conflict',
                                    suggestion: 'Run the migration script to fix this issue permanently.'
                                });
                            }
                        } else {
                            // Page not found - this shouldn't happen, but handle it
                            throw saveError;
                        }
                    } else {
                        // It's the compound index - find by projectId + name
                        const existingPage = await WebsitePage.findOne({
                            projectId: mongoose.Types.ObjectId.isValid(projectId) ? new mongoose.Types.ObjectId(projectId) : projectId,
                            name: normalizedName
                        });

                        if (existingPage && existingPage.projectId.toString() === projectId.toString()) {
                            // Page was created between our check and save - use the existing one
                            console.log('[upsertWebsitePage] Found existing page created concurrently:', existingPage._id);
                            page = existingPage;
                        } else {
                            // This is a real duplicate from another project or index issue - rethrow
                            throw saveError;
                        }
                    }
                } else {
                    throw saveError;
                }
            }

            // Add page to WebsiteDesignsData (for both new and existing pages)
            await ensurePageInDesignData(projectId, page._id);

            if (isNewPageRecord) {
                const newPageId = String(page._id);
                const userIdForSeo = req.user?._id;
                setImmediate(() => {
                    generateMissingSeoForAllProjectPages({
                        projectId,
                        userId: userIdForSeo,
                        pageIds: [newPageId],
                    }).catch((err) =>
                        console.error("[upsertWebsitePage] Auto SEO generation failed:", err.message)
                    );
                });
            }

            return res.status(201).json({
                message: 'Page created successfully',
                page: page,
                data: page
            });
        } catch (error) {
            console.error('Error upserting Website Page:', error);
            if (error.code === 11000) {
                // Duplicate key error - page was created between check and save, or old index conflict
                const normalizedName = (req.body.name || '').toLowerCase().trim();
                const projectId = req.body.projectId || req.query.projectId || req.params.projectId;

                console.log('[upsertWebsitePage] Duplicate key error detected, searching for existing page...');

                if (projectId && normalizedName) {
                    // First, try to find by projectId + name (correct way)
                    let existingPage = await WebsitePage.findOne({
                        projectId: projectId,
                        name: normalizedName
                    });

                    // If not found, try to find by name only (in case of old data or index conflict)
                    if (!existingPage) {
                        console.log('[upsertWebsitePage] Page not found with projectId, searching by name only...');
                        existingPage = await WebsitePage.findOne({
                            name: normalizedName
                        });

                        // If found but belongs to different project, this is due to old index
                        if (existingPage && existingPage.projectId && existingPage.projectId.toString() !== projectId.toString()) {
                            console.log('[upsertWebsitePage] Found page for different project due to old index. Skipping creation.');
                            // Skip this page - it belongs to another project
                            // Return a response indicating the page was skipped
                            return res.status(200).json({
                                message: 'Page with this name already exists for another project. Skipping creation.',
                                page: existingPage,
                                data: existingPage,
                                skipped: true,
                                warning: 'This page belongs to a different project due to legacy database constraints. Please use a different page name.'
                            });
                        }
                    }

                    if (existingPage) {
                        // Check if page belongs to this project
                        const belongsToThisProject = existingPage.projectId && existingPage.projectId.toString() === projectId.toString();

                        if (belongsToThisProject) {
                            // Ensure page exists in WebsiteDesignsData for this project
                            await ensurePageInDesignData(projectId, existingPage._id);

                            // Update page if displayName/description changed
                            let updated = false;
                            if (displayName && displayName.trim() !== existingPage.displayName) {
                                existingPage.displayName = displayName.trim();
                                updated = true;
                            }
                            if (description !== undefined && description !== existingPage.description) {
                                existingPage.description = description ? description.trim() : '';
                                updated = true;
                            }
                            if (updated) {
                                await existingPage.save();
                                console.log('[upsertWebsitePage] Updated existing page:', existingPage._id);
                            }

                            return res.status(200).json({
                                message: 'Page already exists',
                                page: existingPage,
                                data: existingPage
                            });
                        } else {
                            // Page exists but for different project - skip it
                            console.log('[upsertWebsitePage] Page exists for different project, skipping.');
                            return res.status(200).json({
                                message: 'Page with this name already exists for another project. Skipping creation.',
                                page: existingPage,
                                data: existingPage,
                                skipped: true
                            });
                        }
                    }
                }

                // If we can't find the page, it's a real duplicate key error
                console.error('[upsertWebsitePage] Duplicate key error but page not found. This may indicate a database index issue.');
                return res.status(409).json({
                    message: 'A page with this name already exists. Please use a different name.',
                    error: 'Duplicate key error',
                    suggestion: 'This may be due to a legacy database index. Please try a different page name or contact support.'
                });
            }
            return res.status(500).json({ message: 'Server error while upserting Website Page', error: error.message });
        }
    },

    // Bulk upsert and sync pages for a project
    // Accepts array of pages and optionally deletes pages not in the list
    bulkUpsertWebsitePages: async (req, res) => {
        try {
            const { projectId, pages, deleteMissing } = req.body;
            console.log(req.body, "this is body data of pages which need to upsert");

            if (!projectId) {
                return res.status(400).json({ message: "projectId is required" });
            }

            if (!Array.isArray(pages) || pages.length === 0) {
                return res.status(400).json({ message: "pages array is required" });
            }

            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }
            const results = {
                created: [],
                updated: [],
                deleted: [],
                errors: [],
            };

            const normalizedSelectedNames = pages
                .map((p) => String(p?.name || "").toLowerCase().trim())
                .filter(Boolean);

            for (const pageData of pages) {
                const { name, slug, displayName, componentIds = [], perLocationContent } = pageData;
                if (!name || !displayName) continue;

                const normalizedName = String(name).toLowerCase().trim();
                const inputSlug =
                    slug !== undefined && slug !== null && String(slug).trim() !== ""
                        ? String(slug)
                        : normalizedName;
                const normalizedSlug = normalizeSlugInput(inputSlug) || normalizedName;

                const processedComponents = componentIds.map((comp) => {
                    if (typeof comp === "string") {
                        const normalizedComponent = comp.toLowerCase().trim();
                        return {
                            componentName: normalizedComponent,
                            componentVariant: `${normalizedComponent}_a`,
                        };
                    }

                    return {
                        componentName: comp.componentName,
                        componentVariant: comp.componentVariant || `${comp.componentName}_a`,
                    };
                });

                let page = await WebsitePage.findOne({
                    projectId,
                    name: normalizedName,
                });

                if (page) {
                    page.slug = normalizedSlug || normalizedName;
                    page.displayName = displayName;
                    page.componentIds = processedComponents;
                    page.isPublished = true;
                    if (typeof perLocationContent === "boolean") {
                        page.perLocationContent = perLocationContent;
                    }
                    await page.save();

                    results.updated.push({
                        name: normalizedName,
                        pageId: page._id,
                    });
                } else {
                    page = await WebsitePage.create({
                        projectId,
                        name: normalizedName,
                        slug: normalizedSlug || normalizedName,
                        displayName,
                        componentIds: processedComponents,
                        isPublished: true,
                        perLocationContent: typeof perLocationContent === "boolean" ? perLocationContent : false,
                    });

                    results.created.push({
                        name: normalizedName,
                        pageId: page._id,
                    });
                }
            }

            // Optionally "delete" missing pages by unpublishing them.
            // Critical: never touch service detail pages (pageType:"service" with serviceId).
            if (deleteMissing) {
                // Always keep these core pages published
                const corePageNames = ["home", "contact", "about", "services"];
                const keep = normalizedSelectedNames.length
                    ? [...new Set([...normalizedSelectedNames, ...corePageNames])]
                    : corePageNames;

                // Find pages to unpublish, but EXCLUDE:
                // - Core pages (home, contact, about, services)
                // - Location pages (name starts with "location-" or has locationId)
                // - Service pages (pageType: "service" or has serviceId)
                const pagesToUnpublish = await WebsitePage.find({
                    projectId,
                    pageType: "default",
                    $or: [{ serviceId: { $exists: false } }, { serviceId: null }],
                    name: { $nin: keep, $not: /^location-/ }, // Exclude location pages by name pattern
                    locationId: { $in: [null, undefined] }, // Also exclude pages with locationId set
                    isPublished: true,
                }).select("_id name").lean();

                if (pagesToUnpublish.length) {
                    const ids = pagesToUnpublish.map((p) => p._id);
                    await WebsitePage.updateMany(
                        { _id: { $in: ids } },
                        { $set: { isPublished: false } }
                    );
                    results.deleted = pagesToUnpublish.map((p) => ({
                        name: p.name,
                        pageId: p._id,
                    }));
                }
            }

            return res.status(200).json({
                message: "Pages saved successfully",
                results,
            });
        } catch (error) {
            console.error("bulkUpsertWebsitePages error:", error);
            return res.status(500).json({
                message: "Server error",
            });
        }
    },


    // Upsert Website Component — merges variants into ONE document per section (name)
    upsertWebsiteComponent: async (req, res) => {
        try {
            const { mergeWebsiteComponentsFromScan } = require('../additional/mergeWebsiteComponentsFromScan');
            const pathMod = require('path');

            if (!req.body || (typeof req.body === 'object' && Object.keys(req.body).length === 0) || req.body.registerDefaults === true) {
                const genieBuildSectionsPath = pathMod.join(__dirname, '../../apps/geniebuild/components/sections');
                const out = await mergeWebsiteComponentsFromScan(WebsiteComponent, genieBuildSectionsPath);
                return res.status(200).json({
                    message: 'Default components synced from filesystem',
                    data: [],
                    summary: out.summary,
                    logLines: out.logLines,
                });
            }

            const componentsToProcess = Array.isArray(req.body) ? req.body : [req.body];
            const results = [];

            for (const componentData of componentsToProcess) {
                if (!componentData || typeof componentData !== 'object') {
                    results.push({ error: 'invalid body', data: null });
                    continue;
                }
                const { name, variant, uniqueId } = componentData;
                if (!name) {
                    results.push({ error: 'name is required', data: null });
                    continue;
                }
                const normalizedName = String(name).toLowerCase().trim();
                const raw = (uniqueId || variant || '').toString().trim();
                if (!raw) {
                    results.push({ error: 'uniqueId or variant is required', data: null });
                    continue;
                }
                const vid = raw.toLowerCase().replace(/\.tsx$/i, '');

                let doc = await WebsiteComponent.findOne({ name: normalizedName });
                const variants = [...(doc?.variants || [])];
                const idx = variants.findIndex((v) => v.uniqueId === vid);
                if (idx === -1) {
                    variants.push({ uniqueId: vid, status: 1 });
                }

                if (doc) {
                    await WebsiteComponent.updateOne(
                        { _id: doc._id },
                        { $set: { variants }, $unset: { variant: '', uniqueId: '' } }
                    );
                    doc = await WebsiteComponent.findById(doc._id);
                } else {
                    doc = await WebsiteComponent.create({
                        name: normalizedName,
                        variants: [{ uniqueId: vid, status: 1 }],
                    });
                }

                results.push({
                    message: 'Component merged',
                    data: doc,
                    uniqueId: vid,
                    componentId: doc._id,
                });
            }

            const ok = results.filter((r) => r.data && !r.error).length;
            return res.status(ok > 0 ? 201 : 400).json({
                message: `Processed ${componentsToProcess.length} component(s)`,
                data: results,
                summary: { total: componentsToProcess.length, merged: ok, errors: results.length - ok },
            });
        } catch (error) {
            console.error('Error upserting Website Component:', error);
            return res.status(500).json({ message: 'Server error while upserting Website Component', error: error.message });
        }
    },

    // Get all variants for a component name
    getComponentVariants: async (req, res) => {
        try {
            const { name } = req.query;

            if (!name) {
                return res.status(400).json({ message: 'Component name is required' });
            }

            const normalizedName = name.toLowerCase().trim();
            const doc = await WebsiteComponent.findOne({ name: normalizedName });

            return res.status(200).json({
                message: 'Component variants retrieved successfully',
                data: doc ? [doc] : []
            });
        } catch (error) {
            console.error('Error getting component variants:', error);
            return res.status(500).json({ message: 'Server error while getting component variants' });
        }
    },

    // Generate theme by picking random variants for components
    generateTheme: async (req, res) => {
        try {
            const { projectId, componentNames } = req.body;

            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }

            if (!Array.isArray(componentNames) || componentNames.length === 0) {
                return res.status(400).json({ message: 'componentNames array is required' });
            }

            // Get all variants for each component and pick random one
            const selectedComponents = [];

            for (const componentName of componentNames) {
                const normalizedName = componentName.toLowerCase().trim();

                // Find component by name (new structure with variants array)
                const component = await WebsiteComponent.findOne({ name: normalizedName });

                if (!component) {
                    console.warn(`[generateTheme] No component found: ${componentName}`);
                    continue;
                }

                // Get enabled variants from variants array
                const enabledVariants = (component.variants || []).filter(v => v.status === 1);

                if (enabledVariants.length === 0) {
                    console.warn(`[generateTheme] No enabled variants for component: ${componentName}`);
                    // Fallback to legacy uniqueId if variants array is empty
                    if (component.uniqueId) {
                        const parts = component.uniqueId.split('_');
                        selectedComponents.push({
                            componentName: normalizedName,
                            componentId: component._id,
                            variant: parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'A',
                            uniqueId: component.uniqueId
                        });
                    }
                    continue;
                }

                // Pick random enabled variant
                const randomIndex = Math.floor(Math.random() * enabledVariants.length);
                const selectedVariant = enabledVariants[randomIndex];

                // uniqueId is lowercase file basename (e.g. heroplumbing1); variant label for UI = same slug
                selectedComponents.push({
                    componentName: normalizedName,
                    componentId: component._id,
                    variant: selectedVariant.uniqueId,
                    uniqueId: selectedVariant.uniqueId
                });
            }

            return res.status(200).json({
                message: 'Theme generated successfully',
                data: selectedComponents
            });
        } catch (error) {
            console.error('Error generating theme:', error);
            return res.status(500).json({ message: 'Server error while generating theme' });
        }
    },

    // Save Website Design Data
    saveWebsiteDesignData: async (req, res) => {
        try {
            console.log('[saveWebsiteDesignData] Request received:', {
                projectId: req.body.projectId,
                colorScheme: req.body.colorScheme,
                pagesCount: req.body.pages?.length || 0
            });

            const {
                projectId,
                colorScheme,
                colorPrimary,
                colorSecondary,
                colorAccent,
                pageStyles,  // Default styles for whole website
                pages        // Pages array (replaces selectPages)
            } = req.body;

            // Phase 1 requirement: when skipAutoEnqueue is true, persist ONLY structure (no SectionContent writes).
            const skipAutoEnqueue = Boolean(req.body?.skipAutoEnqueue);

            if (!projectId) {
                console.error('[saveWebsiteDesignData] projectId is missing');
                return res.status(400).json({ message: 'projectId is required' });
            }

            // colorScheme is now optional - theme data is stored in ThemeSetting table
            // Keep for backward compatibility but don't require it
            if (!colorScheme) {
                console.log('[saveWebsiteDesignData] colorScheme not provided - theme is stored in ThemeSetting table');
            }

            // Ensure the project exists
            const project = await UserProject.findById(projectId);
            if (!project) {
                console.error('[saveWebsiteDesignData] Project not found:', projectId);
                return res.status(404).json({ message: 'Project not found' });
            }

            console.log('[saveWebsiteDesignData] Project found:', {
                projectId: project._id,
                projectName: project.projectName,
                userId: project.userId
            });

            const userId = project.userId || req.user?.userId;

            if (!userId) {
                console.error('[saveWebsiteDesignData] userId is missing from both project and request');
                return res.status(400).json({ message: 'userId is required' });
            }

            console.log('[saveWebsiteDesignData] Using userId:', userId);

            // Process pageStyles (default styles for whole website) - just a single object with style key
            const processedPageStyles = pageStyles && typeof pageStyles === 'object' && !Array.isArray(pageStyles)
                ? {
                    style: pageStyles.style || {},
                    ...(pageStyles.perLocationContentByPage &&
                    typeof pageStyles.perLocationContentByPage === 'object' &&
                    !Array.isArray(pageStyles.perLocationContentByPage)
                        ? { perLocationContentByPage: pageStyles.perLocationContentByPage }
                        : {}),
                }
                : { style: {} };

            console.log('[saveWebsiteDesignData] Processing pageStyles (default website styles)');

            // Validate pages structure
            if (pages && !Array.isArray(pages)) {
                console.error('[saveWebsiteDesignData] pages is not an array:', typeof pages);
                return res.status(400).json({ message: 'pages must be an array' });
            }

            console.log('[saveWebsiteDesignData] Processing pages:', pages?.length || 0);

            const incomingPageIds = (pages || [])
                .map((p) => p?.pageId)
                .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
                .map((id) => new mongoose.Types.ObjectId(id));
            const [pageMetaDocs, allBusinessLocations] = await Promise.all([
                incomingPageIds.length
                    ? WebsitePage.find({ projectId, _id: { $in: incomingPageIds } })
                        .select("_id name slug pageType serviceId locationId")
                        .lean()
                    : [],
                BusinessLocation.find({ projectId, status: 1 })
                    .select("_id type parentId areaName")
                    .lean()
            ]);
            const pageMetaById = new Map((pageMetaDocs || []).map((p) => [String(p._id), p]));
            const allParentLocationIds = (allBusinessLocations || [])
                .filter((l) => Number(l?.type) === 0)
                .map((l) => String(l._id));
            const childLocationIdsByParent = new Map();
            for (const loc of (allBusinessLocations || [])) {
                if (Number(loc?.type) !== 1 || !loc?.parentId) continue;
                const key = String(loc.parentId);
                if (!childLocationIdsByParent.has(key)) childLocationIdsByParent.set(key, []);
                childLocationIdsByParent.get(key).push(String(loc._id));
            }

            // Process pages array with pageStyles + sections structure.
            // Note: Using Promise.all because we need async operations inside the map (for component lookups)
            const processedPagesPromises = (pages || []).map(async (pageData, index) => {
                try {
                    const pageId = typeof pageData.pageId === 'string'
                        ? new mongoose.Types.ObjectId(pageData.pageId)
                        : pageData.pageId;

                    // Page-level override styles (if any)
                    const pageStyle = sanitizePageStyles(pageData.pageStyles || pageData.style || {});

                    // Process sections with style/layout overrides
                    // Note: Using Promise.all because we need async operations inside the map
                    const rawSections = Array.isArray(pageData.sections) ? pageData.sections : (pageData.componentIds || []);
                    const processedComponentsPromises = rawSections.map(async (compData) => {
                        try {
                            // GENIEBUILD FORMAT: variant_uniqueId, componentId, sectionData
                            // OLD FORMAT: uniqueId or componentId (backward compatibility)
                            let uniqueId = null;
                            let componentId = null;
                            let sectionData = null; // GenieBuild section data

                            if (typeof compData === 'string') {
                                // Old format - just componentId string (backward compatibility)
                                try {
                                    componentId = new mongoose.Types.ObjectId(compData);
                                    // Try to get uniqueId from component
                                    // This will be handled later if needed
                                } catch (err) {
                                    // Maybe it's a uniqueId string?
                                    if (compData.includes('_')) {
                                        uniqueId = compData.toLowerCase();
                                    } else {
                                        console.error(`[saveWebsiteDesignData] Invalid componentId string format: ${compData}`, err);
                                        return null;
                                    }
                                }
                            } else if (compData && compData.variant_uniqueId) {
                                // GENIEBUILD FORMAT: variant_uniqueId, componentId, sectionData
                                sectionData = compData.sectionData || null;
                                // Prefer the live styles.variant (user-chosen in GenieBuild) over a stale uniqueId.
                                const liveVariant = String(
                                    sectionData?.styles?.variant ||
                                        compData.variant_uniqueId ||
                                        ""
                                ).trim();
                                uniqueId = liveVariant.toLowerCase().trim();

                                if (compData.componentId) {
                                    const compIdValue = compData.componentId;
                                    if (typeof compIdValue === 'string' && mongoose.Types.ObjectId.isValid(compIdValue)) {
                                        componentId = new mongoose.Types.ObjectId(compIdValue);
                                    } else if (compIdValue && typeof compIdValue === 'object' && compIdValue._id) {
                                        componentId = compIdValue._id;
                                    }
                                }
                            } else if (compData && (compData.uniqueId || compData.componentId)) {
                                // Old format - prioritize uniqueId
                                if (compData.uniqueId) {
                                    uniqueId = compData.uniqueId.toLowerCase().trim();
                                }

                                if (compData.componentId) {
                                    // New format - object with componentId
                                    const compIdValue = compData.componentId;

                                    // Log for debugging
                                    console.log(`[saveWebsiteDesignData] Processing componentId:`, {
                                        type: typeof compIdValue,
                                        value: compIdValue,
                                        isObject: typeof compIdValue === 'object',
                                        isString: typeof compIdValue === 'string',
                                        keys: typeof compIdValue === 'object' ? Object.keys(compIdValue) : null
                                    });

                                    // Ensure it's a string before converting to ObjectId
                                    if (typeof compIdValue === 'string') {
                                        try {
                                            // Validate it's a valid ObjectId string format
                                            if (!mongoose.Types.ObjectId.isValid(compIdValue)) {
                                                console.error(`[saveWebsiteDesignData] Invalid ObjectId format: ${compIdValue}`);
                                                return null;
                                            }
                                            componentId = new mongoose.Types.ObjectId(compIdValue);
                                        } catch (err) {
                                            console.error(`[saveWebsiteDesignData] Error creating ObjectId from string: ${compIdValue}`, err);
                                            return null;
                                        }
                                    } else if (compIdValue && typeof compIdValue === 'object') {
                                        // If it's an object, it's invalid - componentId should be a string
                                        // This happens when the entire componentIdsMap[page.id] is passed instead of individual componentId
                                        console.error(`[saveWebsiteDesignData] ERROR: componentId is an object (should be string)!`, {
                                            compIdValue,
                                            keys: Object.keys(compIdValue),
                                            compData
                                        });
                                        return null;
                                    } else {
                                        console.error(`[saveWebsiteDesignData] Invalid componentId type: ${typeof compIdValue}. Value:`, compIdValue);
                                        return null;
                                    }
                                }
                            } else {
                                console.error(`[saveWebsiteDesignData] Invalid compData format:`, compData);
                                return null;
                            }

                            // Validate: must have either uniqueId or componentId
                            if (!uniqueId && !componentId) {
                                console.error(`[saveWebsiteDesignData] Missing both uniqueId and componentId in pageData at index ${index}:`, compData);
                                return null;
                            }

                            // If we have uniqueId but no componentId, try to find component by uniqueId (optional - for backward compatibility)
                            // Note: componentId is deprecated, we only need uniqueId now
                            if (uniqueId && !componentId) {
                                try {
                                    // Try to find component by uniqueId in variants array
                                    const component = await WebsiteComponent.findOne({
                                        'variants.uniqueId': uniqueId
                                    });
                                    if (component) {
                                        componentId = component._id; // Keep for backward compatibility only
                                    } else {
                                        // Fallback: try legacy uniqueId field
                                        const legacyComponent = await WebsiteComponent.findOne({ uniqueId: uniqueId });
                                        if (legacyComponent) {
                                            componentId = legacyComponent._id; // Keep for backward compatibility only
                                        }
                                    }
                                } catch (err) {
                                    // Not an error - componentId is optional now, we only need uniqueId
                                    console.log(`[saveWebsiteDesignData] No component found for uniqueId: ${uniqueId} (this is OK - components are only created via registry refresh)`);
                                }
                            }

                            // One WebsiteComponent document per section (name === sectionData.type)
                            if (!componentId && sectionData && sectionData.type) {
                                try {
                                    const sectionName = String(sectionData.type).toLowerCase().trim();
                                    const sectionDoc = await WebsiteComponent.findOne({ name: sectionName });
                                    if (sectionDoc) {
                                        componentId = sectionDoc._id;
                                    }
                                } catch (_e) { /* ignore */ }
                            }

                            // If we have componentId but no uniqueId, try to get uniqueId from component (for backward compatibility)
                            if (componentId && !uniqueId) {
                                try {
                                    const component = await WebsiteComponent.findById(componentId);
                                    if (component) {
                                        // Try to get from variants array (new structure)
                                        if (component.variants && component.variants.length > 0) {
                                            // Use first enabled variant or first variant
                                            const variant = component.variants.find(v => v.status === 1) || component.variants[0];
                                            uniqueId = variant?.uniqueId;
                                        }
                                        // Fallback to legacy uniqueId field
                                        if (!uniqueId && component.uniqueId) {
                                            uniqueId = component.uniqueId;
                                        }
                                    }
                                } catch (err) {
                                    console.warn(`[saveWebsiteDesignData] Could not get uniqueId for componentId: ${componentId}`, err);
                                }
                            }

                            // Ensure we have uniqueId (required field)
                            if (!uniqueId) {
                                console.error(`[saveWebsiteDesignData] Missing uniqueId for component. componentId: ${componentId}, compData:`, compData);
                                // Try to generate from componentName if available
                                if (compData.componentName) {
                                    uniqueId = `${compData.componentName.toLowerCase()}_a`; // Default to variant 'a'
                                    console.log(`[saveWebsiteDesignData] Generated uniqueId from componentName: ${uniqueId}`);
                                } else {
                                    console.error(`[saveWebsiteDesignData] Cannot generate uniqueId - missing both uniqueId and componentName`);
                                    return null;
                                }
                            }

                            // Component style (from sectionData.styles for GenieBuild, or compData.style for old format)
                            const componentStyle = compactSectionStyleOverrides(sectionData?.styles || compData.style || {}, {
                                colorPrimary,
                                colorSecondary,
                                colorAccent
                            }) || {};

                            // Process elementIds array (each element has elementId, style, and data)
                            // For GenieBuild, elementIds come from sectionData.elements if available
                            const elementIdsSource = sectionData?.elements || compData.elementIds || [];
                            const processedElements = elementIdsSource.map((elementData) => {
                                try {
                                    // Handle both old format (just elementId string) and object formats
                                    if (typeof elementData === 'string') {
                                        // Old format - just elementId
                                        return {
                                            elementId: elementData,
                                            style: {},
                                            data: {}
                                        };
                                    } else if (elementData && (elementData.elementId || elementData.id)) {
                                        // Legacy: { elementId, elementType, data }
                                        // GenieBuild: { id, type, content, style }
                                        return {
                                            elementId: elementData.elementId || elementData.id,
                                            elementType: elementData.elementType || elementData.type || 'text',
                                            style: compactOverrideObject(elementData.style || {}) || {},
                                            data: compactOverrideObject(
                                                elementData.data || elementData.content || {}
                                            ) || {},
                                            order: elementData.order !== undefined ? elementData.order : 0,
                                            parentElId: elementData.parentElId || null
                                        };
                                    } else {
                                        console.error(`[saveWebsiteDesignData] Invalid elementData:`, elementData);
                                        return null;
                                    }
                                } catch (err) {
                                    console.error(`[saveWebsiteDesignData] Error processing element:`, err);
                                    return null;
                                }
                            }).filter(el => el !== null);
                            const compactedElements = compactElementRecords(processedElements);

                            // Build the component object
                            const componentObj = {
                                variant_uniqueId: uniqueId,
                                uniqueId: uniqueId,
                                componentId: componentId || undefined,
                                elementIds: compactedElements
                            };
                            if (!sectionData && componentStyle && Object.keys(componentStyle).length > 0) {
                                componentObj.style = componentStyle;
                            }

                            // Add sectionData for GenieBuild format (structure/styles only).
                            // Content is persisted in SectionContent as single source of truth.
                            if (sectionData) {
                                const rawSectionType = String(sectionData?.type || '').toLowerCase().trim();
                                const sectionContent = sectionData?.content ?? {};
                                const resolverType = getSectionResolver(rawSectionType);
                                const pageMeta = pageMetaById.get(String(pageId));
                                let sectionContentDoc = null;
                                if (rawSectionType) {
                                    const pageNameForLoc = String(pageMeta?.name || "").toLowerCase().trim();
                                    const pageSlugForLoc = String(pageMeta?.slug || pageNameForLoc).toLowerCase().trim();
                                    const isHomepageForLoc = pageNameForLoc === "home" || pageNameForLoc === "homepage" || pageSlugForLoc === "home";
                                    const firstParentLocationId = allParentLocationIds.length ? allParentLocationIds[0] : null;
                                    const isSiteWideShell =
                                        rawSectionType === "header" ||
                                        rawSectionType === "navbar" ||
                                        rawSectionType === "footer";
                                    if (isSiteWideShell) {
                                        componentObj.sectionData = {
                                            id: sectionData?.id || undefined,
                                            type: rawSectionType,
                                            styles: compactSectionStyleOverrides(sectionData?.styles || {}, {
                                                colorPrimary,
                                                colorSecondary,
                                                colorAccent
                                            }) || {},
                                            elements: compactElementRecords(sectionData?.elements || []),
                                            content: {},
                                            contentRef: buildContentRef({
                                                resolver: "page_scoped",
                                                sectionContentIds: [],
                                                locationIds: [],
                                                extraSources: [{ source: "static_shell", ids: ["navbar_footer_shell"] }]
                                            })
                                        };
                                        return componentObj;
                                    }
                                    // Phase 1 structure-only save: do NOT create SectionContent placeholders.
                                    // Phase 2 generation/enqueue will create/fill SectionContent.
                                    if (!skipAutoEnqueue) {
                                        const preferredLocationId =
                                            sectionData?.locationId ||
                                            pageMeta?.locationId ||
                                            (isHomepageForLoc ? firstParentLocationId : null) ||
                                            null;
                                        if (shouldUseServiceBundleForPage(rawSectionType, pageMeta)) {
                                            sectionContentDoc = await upsertServiceBundleSectionRecord({
                                                projectId,
                                                serviceId: pageMeta.serviceId,
                                                locationId: preferredLocationId,
                                                sectionId: rawSectionType,
                                                data: sectionContent,
                                                meta: {
                                                    source: "saveWebsiteDesignData",
                                                    variantUniqueId: uniqueId,
                                                }
                                            });
                                        } else {
                                            sectionContentDoc = await upsertSectionContentRecord({
                                                projectId,
                                                pageId,
                                                sectionId: rawSectionType,
                                                locationId: preferredLocationId,
                                                data: sectionContent,
                                                meta: {
                                                    source: "saveWebsiteDesignData",
                                                    variantUniqueId: uniqueId,
                                                }
                                            });
                                        }
                                    }
                                }

                                let resolverLocationIds = [];
                                if (resolverType === "business_locations") {
                                    const pageName = String(pageMeta?.name || "").toLowerCase().trim();
                                    const pageSlug = String(pageMeta?.slug || pageName).toLowerCase().trim();
                                    const isHomepage = pageName === "home" || pageName === "homepage" || pageSlug === "home";
                                    if (isHomepage) {
                                        resolverLocationIds = allParentLocationIds;
                                    } else if (pageMeta?.locationId) {
                                        const pageLocationId = String(pageMeta.locationId);
                                        const childIds = childLocationIdsByParent.get(pageLocationId) || [];
                                        resolverLocationIds = childIds.length ? childIds : [pageLocationId];
                                    } else {
                                        resolverLocationIds = (allBusinessLocations || []).map((l) => String(l._id));
                                    }
                                }

                                componentObj.sectionData = {
                                    id: sectionData?.id || undefined,
                                    type: rawSectionType || sectionData?.type,
                                    styles: (() => {
                                        const styles =
                                            compactSectionStyleOverrides(sectionData?.styles || {}, {
                                                colorPrimary,
                                                colorSecondary,
                                                colorAccent
                                            }) || {};
                                        const chosen =
                                            String(styles.variant || sectionData?.styles?.variant || "").trim() ||
                                            String(compData?.variant_uniqueId || uniqueId || "").trim();
                                        if (chosen) styles.variant = chosen;
                                        return styles;
                                    })(),
                                    elements: compactElementRecords(sectionData?.elements || []),
                                    content: pickPersistableServicesSectionContent(rawSectionType, sectionContent),
                                    contentRef: buildContentRef({
                                        resolver: resolverType,
                                        sectionContentIds: sectionContentDoc?._id ? [String(sectionContentDoc._id)] : [],
                                        locationIds: resolverLocationIds,
                                        extraSources: resolverType === "business_locations"
                                            ? [{ source: "business_locations", ids: resolverLocationIds }]
                                            : []
                                    })
                                };
                            }

                            return componentObj;
                        } catch (err) {
                            console.error(`[saveWebsiteDesignData] Error processing component:`, err);
                            return null;
                        }
                    });

                    // Wait for all promises to resolve
                    const processedSections = await Promise.all(processedComponentsPromises);
                    const pageObj = {
                        pageId,
                        pageStyles: pageStyle,
                        sectionLayout: [],
                    };
                    assignPageSections(pageObj, processedSections.filter(comp => comp !== null));
                    return pageObj;
                } catch (err) {
                    console.error(`[saveWebsiteDesignData] Error processing pageData at index ${index}:`, err);
                    return null;
                }
            });

            // Wait for all page processing promises to resolve
            const processedPages = (await Promise.all(processedPagesPromises)).filter(page => page !== null);

            console.log('[saveWebsiteDesignData] Processed pages:', processedPages.length);
            console.log('[saveWebsiteDesignData] Processed pageStyles (default website styles)');

            // Check if design data already exists for this project
            let designData = await WebsiteDesignsData.findOne({ projectId });

            let createdNewDesignData = false;
            if (designData) {
                console.log('[saveWebsiteDesignData] Updating existing design data');
                // MERGE pages by pageId — GenieBuild often saves a single page.
                // Never replace the whole pages[] array (that hid/orphaned other pages
                // in getWebsitePages and broke live location/service renders).
                designData.schemaVersion = 2;
                if (processedPageStyles && typeof processedPageStyles === 'object') {
                    const incomingKeys = Object.keys(processedPageStyles);
                    // Only overwrite global pageStyles when the payload actually sent them
                    // (full wizard save). Empty/partial styles from single-page GenieBuild
                    // saves must not wipe perLocationContentByPage etc.
                    if (incomingKeys.length > 0) {
                        designData.pageStyles = {
                            ...(designData.pageStyles && typeof designData.pageStyles === 'object'
                                ? (designData.pageStyles.toObject
                                    ? designData.pageStyles.toObject()
                                    : designData.pageStyles)
                                : {}),
                            ...processedPageStyles,
                        };
                    }
                }
                const existingPages = Array.isArray(designData.pages) ? designData.pages : [];
                const byId = new Map(
                    existingPages
                        .map((p) => {
                            const id = String(p?.pageId?._id || p?.pageId || '').trim();
                            return id ? [id, p] : null;
                        })
                        .filter(Boolean)
                );
                for (const incoming of processedPages || []) {
                    const id = String(incoming?.pageId?._id || incoming?.pageId || '').trim();
                    if (!id) continue;
                    if (byId.has(id)) {
                        const idx = existingPages.findIndex(
                            (p) => String(p?.pageId?._id || p?.pageId || '') === id
                        );
                        if (idx >= 0) {
                            existingPages[idx] = {
                                ...(typeof existingPages[idx]?.toObject === 'function'
                                    ? existingPages[idx].toObject()
                                    : existingPages[idx]),
                                ...incoming,
                                pageId: existingPages[idx].pageId || incoming.pageId,
                            };
                            byId.set(id, existingPages[idx]);
                        }
                    } else {
                        existingPages.push(incoming);
                        byId.set(id, incoming);
                    }
                }
                designData.pages = existingPages;
                designData.markModified('pages');
                designData.markModified('pageStyles');
                await designData.save();
                console.log('[saveWebsiteDesignData] Design data updated successfully (merged pages)', {
                    incoming: (processedPages || []).length,
                    total: existingPages.length,
                });
            } else {
                console.log('[saveWebsiteDesignData] Creating new design data');
                // Create new design data
                designData = new WebsiteDesignsData({
                    schemaVersion: 2,
                    projectId: new mongoose.Types.ObjectId(projectId),
                    userId: new mongoose.Types.ObjectId(userId),
                    pageStyles: processedPageStyles,
                    pages: processedPages
                });
                await designData.save();
                console.log('[saveWebsiteDesignData] Design data created successfully:', designData._id);
                createdNewDesignData = true;
            }

            // Auto-enqueue on first save unless caller will enqueue (business website create).
            try {
                const skipAutoEnqueue = Boolean(req.body?.skipAutoEnqueue);
                if (createdNewDesignData && !skipAutoEnqueue) {
                    const allLocations = await BusinessLocation.find({ projectId, status: 1 })
                        .select("_id areaName parentId type")
                        .lean();
                    const selectedSectionIds = [...new Set(
                        (processedPages || [])
                            .flatMap((p) => getPageSections(p))
                            .map((comp) => String(comp?.sectionData?.type || "").toLowerCase().trim())
                            .filter((s) => s && s !== "header" && s !== "navbar" && s !== "footer")
                    )];
                    if (selectedSectionIds.length > 0) {
                        const queueLocations = (allLocations || []).map((loc) => ({
                            _id: String(loc._id),
                            name: String(loc.areaName || "").trim(),
                            parent_id: loc.parentId ? String(loc.parentId) : null,
                            type: Number(loc.type || 0),
                        }));
                        const queuedJob = await enqueueSectionGeneration({
                            projectId: String(projectId),
                            selectedSectionIds,
                            locations: queueLocations,
                            includeDefaultHomepage: true,
                            homepageLocationId: null,
                            perLocationContentByPage:
                                processedPageStyles?.perLocationContentByPage || null,
                            userId: String(userId),
                        });
                        console.log("[saveWebsiteDesignData] Auto-enqueued section generation job:", {
                            projectId: String(projectId),
                            jobId: queuedJob?.id || null,
                            selectedSectionsCount: selectedSectionIds.length,
                            locationsCount: queueLocations.length,
                        });
                    } else {
                        console.warn("[saveWebsiteDesignData] Auto-enqueue skipped: no selected sections found");
                    }
                }
            } catch (enqueueErr) {
                console.error("[saveWebsiteDesignData] Auto-enqueue failed:", enqueueErr.message);
            }

            return res.status(200).json({
                message: 'Website design data saved successfully',
                data: designData
            });
        } catch (error) {
            console.error('Error saving Website Design Data:', error);
            return res.status(500).json({ message: 'Server error while saving Website Design Data' });
        }
    },

    // Update Website Design Data (similar to saveWebsiteDesignData but ensures pages/components exist)
    updateWebsiteDesignData: async (req, res) => {
        try {
            console.log('[updateWebsiteDesignData] Request received:', {
                projectId: req.body.projectId,
                pageId: req.body.pageId,
                sectionsCount: req.body.sections?.length || req.body.componentIds?.length || 0
            });

            const { projectId, pageId, sections, componentIds, layout, sectionLayout, pageStyles } = req.body;

            if (!projectId) {
                console.error('[updateWebsiteDesignData] projectId is missing');
                return res.status(400).json({ success: false, message: 'projectId is required' });
            }

            if (!pageId) {
                console.error('[updateWebsiteDesignData] pageId is missing');
                return res.status(400).json({ success: false, message: 'pageId is required' });
            }

            // Ensure the project exists
            const project = await UserProject.findById(projectId);
            if (!project) {
                console.error('[updateWebsiteDesignData] Project not found:', projectId);
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            // Find or create the page (project-specific)
            let page;
            let finalPageId;
            try {
                // Try to find page by ID and projectId (project-specific)
                if (mongoose.Types.ObjectId.isValid(pageId)) {
                    page = await WebsitePage.findOne({
                        _id: pageId,
                        projectId: projectId
                    });
                }

                if (!page) {
                    console.log('[updateWebsiteDesignData] Page not found, will try to find by name or create');
                    // Try to find by name and projectId if pageId looks like a name
                    const pageName = typeof pageId === 'string' && !mongoose.Types.ObjectId.isValid(pageId)
                        ? pageId.toLowerCase().trim()
                        : null;

                    if (pageName) {
                        page = await WebsitePage.findOne({
                            projectId: projectId,
                            name: pageName
                        });
                    }

                    if (!page) {
                        // Page doesn't exist, create it with a default name (project-specific)
                        const defaultName = pageName || `page-${Date.now()}`;
                        page = new WebsitePage({
                            projectId: projectId,
                            name: defaultName,
                            displayName: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
                            description: ''
                        });
                        await page.save();
                        console.log('[updateWebsiteDesignData] Page created:', page._id);
                    } else {
                        console.log('[updateWebsiteDesignData] Page found by name:', page._id);
                    }
                } else {
                    console.log('[updateWebsiteDesignData] Page found by ID:', page._id);
                }

                finalPageId = page._id;
            } catch (err) {
                console.error('[updateWebsiteDesignData] Error finding/creating page:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error finding or creating page',
                    error: err.message
                });
            }

            // Process sections - ensure each component exists
            const processedComponentIds = [];
            const pageMeta = await WebsitePage.findOne({ _id: finalPageId, projectId })
                .select("_id name slug pageType serviceId locationId")
                .lean();
            const allBusinessLocations = await BusinessLocation.find({ projectId, status: 1 })
                .select("_id type parentId areaName")
                .lean();
            const allParentLocationIds = (allBusinessLocations || [])
                .filter((l) => Number(l?.type) === 0)
                .map((l) => String(l._id));
            const childLocationIdsByParent = new Map();
            for (const loc of (allBusinessLocations || [])) {
                if (Number(loc?.type) !== 1 || !loc?.parentId) continue;
                const key = String(loc.parentId);
                if (!childLocationIdsByParent.has(key)) childLocationIdsByParent.set(key, []);
                childLocationIdsByParent.get(key).push(String(loc._id));
            }
            const incomingSections = Array.isArray(sections) ? sections : (componentIds || []);
            for (const compData of incomingSections) {
                try {
                    let componentId = compData.componentId?._id || compData.componentId;

                    // If componentId is provided, verify it exists
                    if (componentId) {
                        let component;
                        if (mongoose.Types.ObjectId.isValid(componentId)) {
                            component = await WebsiteComponent.findById(componentId);
                        }

                        if (!component) {
                            console.log(`[updateWebsiteDesignData] Component ${componentId} not found`);
                            // Component doesn't exist - skip it (frontend should create it first via upsertWebsiteComponent)
                            console.warn(`[updateWebsiteDesignData] Component ${componentId} not found, skipping. Frontend should create it first.`);
                            continue;
                        }

                        const normalizedType = String(compData?.sectionData?.type || "").toLowerCase().trim();
                        if (normalizedType === "header" || normalizedType === "navbar" || normalizedType === "footer") {
                            processedComponentIds.push({
                                componentId: component._id,
                                variant_uniqueId: compData.variant_uniqueId || compData.uniqueId || compData.variant || component.variant || 'A',
                                uniqueId: compData.variant_uniqueId || compData.uniqueId || compData.variant || component.variant || 'A',
                                elementIds: compactElementRecords(compData.elementIds || []),
                                sectionData: {
                                    type: normalizedType,
                                    styles: compactSectionStyleOverrides(compData?.sectionData?.styles || {}, {}) || {},
                                    elements: compactElementRecords(compData?.sectionData?.elements || []),
                                    content: {},
                                    contentRef: buildContentRef({
                                        resolver: "page_scoped",
                                        sectionContentIds: [],
                                        locationIds: [],
                                        extraSources: [{ source: "static_shell", ids: ["navbar_footer_shell"] }]
                                    })
                                }
                            });
                            continue;
                        }
                        const resolverType = getSectionResolver(normalizedType);
                        const sectionContent = compData?.sectionData?.content || {};
                        let sectionContentDoc = null;
                        const pageNameForLoc = String(pageMeta?.name || "").toLowerCase().trim();
                        const pageSlugForLoc = String(pageMeta?.slug || pageNameForLoc).toLowerCase().trim();
                        const isHomepageForLoc = pageNameForLoc === "home" || pageNameForLoc === "homepage" || pageSlugForLoc === "home";
                        const firstParentLocationId = allParentLocationIds.length ? allParentLocationIds[0] : null;
                        const preferredLocationId =
                            compData?.sectionData?.locationId ||
                            pageMeta?.locationId ||
                            (isHomepageForLoc ? firstParentLocationId : null) ||
                            null;
                        if (normalizedType) {
                            if (shouldUseServiceBundleForPage(normalizedType, pageMeta)) {
                                sectionContentDoc = await upsertServiceBundleSectionRecord({
                                    projectId,
                                    serviceId: pageMeta.serviceId,
                                    locationId: preferredLocationId,
                                    sectionId: normalizedType,
                                    data: sectionContent,
                                    meta: { source: "updateWebsiteDesignData" }
                                });
                            } else {
                                sectionContentDoc = await upsertSectionContentRecord({
                                    projectId,
                                    pageId: finalPageId,
                                    sectionId: normalizedType,
                                    locationId: preferredLocationId,
                                    data: sectionContent,
                                    meta: { source: "updateWebsiteDesignData" }
                                });
                            }
                        }

                        let resolverLocationIds = [];
                        if (resolverType === "business_locations") {
                            const pageName = String(pageMeta?.name || "").toLowerCase().trim();
                            const pageSlug = String(pageMeta?.slug || pageName).toLowerCase().trim();
                            const isHomepage = pageName === "home" || pageName === "homepage" || pageSlug === "home";
                            if (isHomepage) {
                                resolverLocationIds = allParentLocationIds;
                            } else if (pageMeta?.locationId) {
                                const pageLocationId = String(pageMeta.locationId);
                                const childIds = childLocationIdsByParent.get(pageLocationId) || [];
                                resolverLocationIds = childIds.length ? childIds : [pageLocationId];
                            } else {
                                resolverLocationIds = (allBusinessLocations || []).map((l) => String(l._id));
                            }
                        }

                        processedComponentIds.push({
                            componentId: component._id,
                            variant_uniqueId: compData.variant_uniqueId || compData.uniqueId || compData.variant || component.variant || 'A',
                            uniqueId: compData.variant_uniqueId || compData.uniqueId || compData.variant || component.variant || 'A',
                            elementIds: compactElementRecords(compData.elementIds || []),
                            sectionData: {
                                type: normalizedType || compData?.sectionData?.type || "",
                                styles: compactSectionStyleOverrides(compData?.sectionData?.styles || {}, {}) || {},
                                elements: compactElementRecords(compData?.sectionData?.elements || []),
                                content: {},
                                contentRef: buildContentRef({
                                    resolver: resolverType,
                                    sectionContentIds: sectionContentDoc?._id ? [String(sectionContentDoc._id)] : [],
                                    locationIds: resolverLocationIds,
                                    extraSources: resolverType === "business_locations"
                                        ? [{ source: "business_locations", ids: resolverLocationIds }]
                                        : []
                                })
                            }
                        });
                    } else {
                        // No componentId provided - component should be created by frontend first
                        console.warn('[updateWebsiteDesignData] No componentId provided, skipping component');
                        continue;
                    }
                } catch (err) {
                    console.error('[updateWebsiteDesignData] Error processing component:', err);
                    continue;
                }
            }

            // Find or create WebsiteDesignsData for this project
            let designData = await WebsiteDesignsData.findOne({ projectId });

            if (designData) {
                console.log('[updateWebsiteDesignData] Updating existing design data');
                // Find the page in pages array
                const pageIndex = designData.pages.findIndex(p =>
                    String(p.pageId?._id || p.pageId) === String(finalPageId)
                );

                if (pageIndex >= 0) {
                    // Update existing page
                    assignPageSections(designData.pages[pageIndex], processedComponentIds);
                    designData.pages[pageIndex].pageStyles = sanitizePageStyles(pageStyles || designData.pages[pageIndex].pageStyles || {});
                    // Update layout if provided (for element-only pages)
                    const incomingLayout = Array.isArray(sectionLayout) ? sectionLayout : layout;
                    if (incomingLayout && Array.isArray(incomingLayout)) {
                        const validSectionIds = new Set(
                            (getPageSections(designData.pages[pageIndex]) || [])
                                .map((sec, idx) => String(
                                    sec?.sectionData?.id ||
                                    sec?.id ||
                                    sec?._id ||
                                    sec?.uniqueId ||
                                    sec?.variant_uniqueId ||
                                    `${String(sec?.sectionData?.type || "section").toLowerCase()}-${idx + 1}`
                                ))
                        );
                        const normalizedIncoming = incomingLayout
                            .map((l) => ({
                                ...(typeof l?.order === "number" ? { order: l.order } : {}),
                                ...(l?.elementId ? { elementId: l.elementId } : {}),
                                ...(l?.sectionId ? { sectionId: l.sectionId } : {}),
                            }))
                            .filter((l) => l.elementId || l.sectionId)
                            .filter((l) => l.elementId || validSectionIds.has(String(l.sectionId || "")));
                        if (normalizedIncoming.length) {
                            designData.pages[pageIndex].sectionLayout = normalizedIncoming;
                        }
                    }
                } else {
                    // Add new page
                    designData.pages.push({
                        pageId: finalPageId,
                        pageStyles: sanitizePageStyles(pageStyles || {}),
                        sectionLayout: ((Array.isArray(sectionLayout) ? sectionLayout : layout) && Array.isArray(Array.isArray(sectionLayout) ? sectionLayout : layout))
                            ? (Array.isArray(sectionLayout) ? sectionLayout : layout)
                                .map((l) => ({
                                    ...(typeof l?.order === "number" ? { order: l.order } : {}),
                                    ...(l?.elementId ? { elementId: l.elementId } : {}),
                                    ...(l?.sectionId ? { sectionId: l.sectionId } : {}),
                                }))
                                .filter((l) => l.elementId || l.sectionId)
                            : []
                    });
                    assignPageSections(designData.pages[designData.pages.length - 1], processedComponentIds);
                }
                await designData.save();
                console.log('[updateWebsiteDesignData] Design data updated successfully');
            } else {
                console.log('[updateWebsiteDesignData] Creating new design data');
                // Create new design data
                const userId = project.userId || req.user?.userId;
                designData = new WebsiteDesignsData({
                    projectId: new mongoose.Types.ObjectId(projectId),
                    userId: new mongoose.Types.ObjectId(userId || project.userId),
                    pageStyles: {},
                    pages: [{
                        pageId: finalPageId,
                        pageStyles: sanitizePageStyles(pageStyles || {}),
                        sectionLayout: ((Array.isArray(sectionLayout) ? sectionLayout : layout) && Array.isArray(Array.isArray(sectionLayout) ? sectionLayout : layout))
                            ? (Array.isArray(sectionLayout) ? sectionLayout : layout)
                                .map((l) => ({
                                    ...(typeof l?.order === "number" ? { order: l.order } : {}),
                                    ...(l?.elementId ? { elementId: l.elementId } : {}),
                                    ...(l?.sectionId ? { sectionId: l.sectionId } : {}),
                                }))
                                .filter((l) => l.elementId || l.sectionId)
                            : []
                    }]
                });
                assignPageSections(designData.pages[0], processedComponentIds);
                await designData.save();
                console.log('[updateWebsiteDesignData] Design data created successfully:', designData._id);
            }

            return res.status(200).json({
                success: true,
                message: 'Website design data updated successfully',
                data: designData
            });
        } catch (error) {
            console.error('Error updating Website Design Data:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error while updating Website Design Data',
                error: error.message
            });
        }
    },

    // Update Component Elements (for saving individual section changes)
    updateComponentElements: async (req, res) => {
        try {
            const {
                projectId,
                pageId,
                componentId,
                style, // Component-level styles (only changed values)
                elementIds // Array of { elementId, elementType, style, data, order }
            } = req.body;

            if (!projectId || !pageId || !componentId) {
                return res.status(400).json({
                    success: false,
                    message: 'projectId, pageId, and componentId are required'
                });
            }

            console.log('[updateComponentElements] Updating component:', {
                projectId,
                pageId,
                componentId,
                elementIdsCount: elementIds?.length || 0,
                hasStyle: !!style
            });

            // Debug: Log first few elements being sent
            if (elementIds && elementIds.length > 0) {
                console.log('[updateComponentElements] First 3 elements being sent:',
                    elementIds.slice(0, 3).map(el => ({
                        elementId: el.elementId,
                        elementType: el.elementType,
                        hasChildren: !!(el.children && el.children.length > 0)
                    }))
                );
            }

            // Find the design data
            const designData = await WebsiteDesignsData.findOne({ projectId });
            if (!designData) {
                return res.status(404).json({
                    success: false,
                    message: 'Website design data not found'
                });
            }

            // Find the page
            const pageIndex = designData.pages.findIndex(
                (p) => {
                    const pageIdValue = p.pageId?._id?.toString() || p.pageId?.toString() || p.pageId;
                    return pageIdValue === pageId.toString();
                }
            );
            if (pageIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Page not found in design data'
                });
            }

            const page = designData.pages[pageIndex];
            const pageSections = getPageSections(page);

            // Find the component in the page
            const componentIndex = pageSections.findIndex(
                (comp) => {
                    const compId = comp.componentId?._id?.toString() || comp.componentId?.toString() || comp.componentId;
                    return compId === componentId.toString();
                }
            );

            if (componentIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Component not found in page'
                });
            }

            // Update the component's style and elementIds
            if (style !== undefined) {
                const incomingStyle = compactOverrideObject(style || {}) || {};
                const sectionStyles = {
                    ...((pageSections[componentIndex].sectionData || {}).styles || {}),
                    ...incomingStyle
                };
                pageSections[componentIndex].sectionData = {
                    ...(pageSections[componentIndex].sectionData || {}),
                    styles: compactSectionStyleOverrides(sectionStyles, designData?.theme || {}) || {}
                };
            }

            if (elementIds !== undefined) {
                // Debug: Log raw incoming data
                console.log('[updateComponentElements] Raw elementIds received:', JSON.stringify(elementIds.slice(0, 2), null, 2));

                // Replace elementIds array (hierarchical structure with children)
                // Recursive function to process elements and their children (supports infinite nesting)
                const processElement = (el) => {
                    // Debug: Log if elementType is missing
                    if (!el.elementType) {
                        console.warn(`[updateComponentElements] INCOMING element missing elementType:`, {
                            elementId: el.elementId,
                            hasStyle: !!el.style,
                            hasData: !!el.data,
                            hasChildren: !!(el.children && el.children.length > 0),
                            keys: Object.keys(el)
                        });
                    }
                    // Validate required fields
                    if (!el.elementId) {
                        console.error(`[updateComponentElements] Missing elementId, skipping element:`, el);
                        return null;
                    }

                    // Ensure elementType is always present - it's required by the schema
                    if (!el.elementType) {
                        console.warn(`[updateComponentElements] Missing elementType for elementId: ${el.elementId}, using 'text' as fallback`);
                    }

                    const processed = {
                        elementId: el.elementId,
                        elementType: el.elementType || 'text', // Always include elementType (required field)
                        style: compactOverrideObject(el.style || {}) || {},
                        data: compactOverrideObject(el.data || {}) || {},
                        order: el.order !== undefined ? el.order : 0 // Ensure order is saved
                    };

                    // Process children recursively if they exist (supports infinite nesting)
                    if (el.children && Array.isArray(el.children) && el.children.length > 0) {
                        processed.children = el.children
                            .map(child => processElement(child))
                            .filter(child => child !== null); // Remove any null entries
                    }

                    return processed;
                };

                // Filter out any null entries from processing
                const processedElements = elementIds
                    .map(el => processElement(el))
                    .filter(el => el !== null);

                // Debug: Verify all processed elements have elementType
                const missingElementType = processedElements.filter(el => !el.elementType);
                if (missingElementType.length > 0) {
                    console.error(`[updateComponentElements] ERROR: ${missingElementType.length} processed elements still missing elementType:`,
                        missingElementType.map(el => el.elementId)
                    );
                } else {
                    console.log(`[updateComponentElements] ✓ All ${processedElements.length} processed elements have elementType`);
                }

                const compacted = compactElementRecords(processedElements);
                pageSections[componentIndex].elementIds = compacted;
                pageSections[componentIndex].sectionData = {
                    ...(pageSections[componentIndex].sectionData || {}),
                    elements: compactElementRecords(
                        compacted.map((el) => ({
                            elementId: el.elementId,
                            elementType: el.elementType,
                            style: el.style || {},
                            data: el.data || {},
                            order: typeof el.order === "number" ? el.order : 0,
                            children: el.children || []
                        }))
                    )
                };
            }
            assignPageSections(page, pageSections);

            // CRITICAL: Before saving, ensure ALL elements in ALL components have elementType
            // This fixes existing data that might be missing elementType
            const ensureElementType = (element) => {
                // Convert to plain object if it's a Mongoose document
                if (element && typeof element.toObject === 'function') {
                    Object.assign(element, element.toObject());
                }

                if (!element.elementType) {
                    // Try to infer from elementId or use default
                    const inferredType = element.elementId
                        ? element.elementId.split('-')[0].toLowerCase()
                        : 'text';
                    element.elementType = inferredType === 'element' ? 'text' : inferredType;
                    console.log(`[updateComponentElements] Added missing elementType '${element.elementType}' to elementId: ${element.elementId}`);
                }

                // Process children recursively
                if (element.children && Array.isArray(element.children)) {
                    element.children.forEach(child => ensureElementType(child));
                }
            };

            // Clean up ALL components in ALL pages to ensure elementType exists
            let totalElementsFixed = 0;
            designData.pages.forEach((page, pageIdx) => {
                const sectionsForPage = getPageSections(page);
                if (sectionsForPage && Array.isArray(sectionsForPage)) {
                    sectionsForPage.forEach((component, compIdx) => {
                        if (component.elementIds && Array.isArray(component.elementIds)) {
                            component.elementIds.forEach(element => {
                                const hadElementType = !!element.elementType;
                                ensureElementType(element);
                                if (!hadElementType && element.elementType) {
                                    totalElementsFixed++;
                                }
                            });
                        }
                    });
                }
            });

            if (totalElementsFixed > 0) {
                console.log(`[updateComponentElements] ✓ Fixed ${totalElementsFixed} elements missing elementType across all components`);
                // Mark the document as modified so Mongoose saves the changes
                designData.markModified('pages');
            }

            // Save the updated design data
            await designData.save();

            console.log('[updateComponentElements] Component updated successfully');

            return res.status(200).json({
                success: true,
                message: 'Component elements updated successfully',
                data: {
                    componentId,
                    elementIdsCount: elementIds?.length || 0
                }
            });
        } catch (error) {
            console.error('[updateComponentElements] Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error while updating component elements',
                error: error.message
            });
        }
    },

    // Get Website Design Data
    getWebsiteDesignData: async (req, res) => {
        try {
            const { projectId } = req.params;
            const targetPageId = req.params?.pageId || req.query?.pageId || null;
            const preferredLocationId =
                (req.query?.locationId != null && String(req.query.locationId).trim() !== "")
                    ? String(req.query.locationId).trim()
                    : (req.body?.locationId != null && String(req.body.locationId).trim() !== "")
                        ? String(req.body.locationId).trim()
                        : null;

            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }
            if (!targetPageId) {
                return res.status(400).json({ message: 'pageId is required for GenieBuild page data' });
            }
            const designData = await WebsiteDesignsData.findOne({ projectId }).lean();

            if (!designData) {
                return res.status(404).json({ message: 'Website design data not found for this project' });
            }
            let selectedPage = (designData.pages || []).find((p) => {
                const currentPageId = p?.pageId?._id || p?.pageId;
                return String(currentPageId) === String(targetPageId);
            });
            let sectionContentLookupPageId = String(targetPageId);
            const [projectDoc, pageMeta, themeSettings, sectionContentDocs, businessLocations, websitePages] = await Promise.all([
                userProjects.findById(projectId).select("projectType").lean(),
                WebsitePage.findById(targetPageId).select("_id pageType name slug displayName serviceId locationId seoSettings isPublished").lean(),
                ThemeSetting.findOne({ projectId }).lean(),
                SectionContent.find({
                    projectId,
                    isDeleted: { $ne: true }
                })
                    .select('pageId serviceId sectionId locationId data status')
                    .lean(),
                BusinessLocation.find({ projectId, status: 1 }).select("_id areaName type parentId locationType").lean(),
                WebsitePage.find({ projectId }).select("_id name slug displayName locationId pageType serviceId isPublished").lean()
            ]);

            const allowAdminBypass = Boolean(req.user?.userId);

            if (pageMeta && !allowAdminBypass) {
                if (pageMeta.isPublished === false) {
                    return res.status(404).json({ message: "This page is not published" });
                }
                if (pageMeta.locationId) {
                    const linkedLoc = await BusinessLocation.findById(pageMeta.locationId)
                        .select("status")
                        .lean();
                    if (linkedLoc && Number(linkedLoc.status) !== 1) {
                        return res.status(404).json({ message: "This location is disabled" });
                    }
                }
            }

            const isServicePageRequest =
                String(pageMeta?.pageType || "").toLowerCase().trim() === "service" &&
                !!pageMeta?.serviceId;

            // When request is for a service page, render service-specific sections from the
            // wizard service template (selected sections only — no forced FAQ).
            // Keep navbar/footer from existing entry when available; never fall back
            // to homepage/location sections for a service URL.
            if (isServicePageRequest) {
                const serviceIdStr = String(pageMeta.serviceId);
                const locationIdStr = pageMeta.locationId ? String(pageMeta.locationId) : null;
                const homepageDesign = (designData.pages || []).find((p) => {
                    const pid = String(p?.pageId?._id || p?.pageId || "");
                    const wp = (websitePages || []).find((w) => String(w._id) === pid);
                    const slug = String(wp?.slug || "").trim().replace(/^\/+|\/+$/g, "").toLowerCase();
                    return wp?.pageType === "default" && (slug === "" || slug === "home");
                }) || designData.pages?.[0] || null;
                const homepageSections = getSectionEntriesFromPage(homepageDesign).map((e) => e.compData);
                const headerComp = homepageSections.find((c) => {
                    const t = String(c?.sectionData?.type || "").toLowerCase();
                    return t === "header" || t === "navbar";
                });
                const footerComp = homepageSections.find(
                    (c) => String(c?.sectionData?.type || "").toLowerCase() === "footer"
                );

                const existingServiceDesign = selectedPage;
                const existingSections = existingServiceDesign
                    ? getSectionEntriesFromPage(existingServiceDesign).map((e) => e.compData)
                    : [];
                const findExistingByType = (type) =>
                    existingSections.find(
                        (c) => String(c?.sectionData?.type || "").toLowerCase().trim() === type
                    );

                const makeBundleSection = (type, variantKey) => {
                    const existing = findExistingByType(type);
                    if (existing) return existing;
                    return {
                        variant_uniqueId: variantKey,
                        componentId: null,
                        sectionData: {
                            type,
                            content: {},
                            contentRef: {
                                scope: "service_bundle",
                                sectionId: type,
                                serviceId: serviceIdStr,
                                locationId: locationIdStr
                            },
                            styles: {}
                        }
                    };
                };

                const syntheticSections = buildServiceRenderSections({
                    designData,
                    websitePages: websitePages || [],
                    headerComp,
                    footerComp,
                    serviceId: serviceIdStr,
                    locationId: locationIdStr,
                    existingSections,
                    makeBundleSection,
                });

                selectedPage = {
                    pageId: targetPageId,
                    pageStyles: existingServiceDesign?.pageStyles || {},
                    sections: syntheticSections
                };
                sectionContentLookupPageId = String(targetPageId);
                console.log(
                    `[getWebsiteDesignData] Service page render (synthetic=${!existingServiceDesign}) ` +
                    `project=${projectId} page=${targetPageId} service=${serviceIdStr} location=${locationIdStr}`
                );
            } else {
                // Helper to check if a design page has actual content sections (not just header/footer).
                const pageHasContentSections = (page) => {
                    if (!page) return false;
                    const entries = getSectionEntriesFromPage(page);
                    return entries.some((e) => {
                        const t = String(e?.sectionType || e?.sectionData?.type || "").toLowerCase().trim();
                        return t && t !== "header" && t !== "navbar" && t !== "footer";
                    });
                };

                // Pages added by ensurePageInDesignData only have header/footer and should
                // fall back to homepage template for content sections.
                // Exception: All Areas listing (`areas`) must never inherit Home — it only
                // uses allareas sections (sublocations / locationmap).
                const pageNameLc = String(pageMeta?.name || "").toLowerCase().trim();
                const pageSlugLc = String(pageMeta?.slug || "")
                    .trim()
                    .replace(/^\/+|\/+$/g, "")
                    .toLowerCase();
                const isAreasListingPage =
                    pageNameLc === "areas" ||
                    pageNameLc === "allareas" ||
                    pageSlugLc === "areas" ||
                    pageSlugLc === "allareas" ||
                    pageSlugLc === "all-areas";

                const needsHomepageFallback =
                    !isAreasListingPage &&
                    (!selectedPage || !pageHasContentSections(selectedPage));

                if (needsHomepageFallback) {
                    // Default/location page without content sections → fall back to homepage template.
                    const homepagePage = (websitePages || []).find((p) => {
                        const slug = String(p?.slug || "").trim().replace(/^\/+|\/+$/g, "").toLowerCase();
                        return p?.pageType === "default" && (slug === "" || slug === "home");
                    });
                    const fallbackTemplateId = homepagePage?._id
                        ? String(homepagePage._id)
                        : (designData.pages?.[0]?.pageId?._id || designData.pages?.[0]?.pageId || null);
                    if (fallbackTemplateId) {
                        const homepageDesign = (designData.pages || []).find((p) => {
                            const pid = String(p?.pageId?._id || p?.pageId || "");
                            return pid === String(fallbackTemplateId);
                        }) || null;
                        if (homepageDesign && pageHasContentSections(homepageDesign)) {
                            selectedPage = homepageDesign;
                            sectionContentLookupPageId = String(fallbackTemplateId);
                            console.log(
                                `[getWebsiteDesignData] Location page fallback to homepage template ` +
                                `project=${projectId} page=${targetPageId} homepage=${fallbackTemplateId}`
                            );
                        }
                    }
                    // Final check after fallback attempt
                    if (!selectedPage || !pageHasContentSections(selectedPage)) {
                        return res.status(404).json({ message: 'Page data not found for this project' });
                    }
                } else if (isAreasListingPage && (!selectedPage || !pageHasContentSections(selectedPage))) {
                    return res.status(404).json({
                        message: "Areas listing page has no sections — select Hero / Areas Grid / Reviews / FAQ in the wizard",
                    });
                }
            }
            const projectType = Number(projectDoc?.projectType ?? 0);
            const scopedPreferredLocationId = resolveLocationPreferenceForPage({
                preferredLocationId,
                projectType,
                pageMeta: pageMeta || {},
                businessLocations: businessLocations || [],
            });

            const resolvedServicesGridContent = await buildServicesGridContentFromBundle({
                projectId,
                locationId: scopedPreferredLocationId,
                businessLocations: businessLocations || [],
                projectType,
            });

            // Build lookup maps for section content rows.
            const sectionContentRowsByKey = new Map();
            const serviceBundleMap = new Map();
            (sectionContentDocs || []).forEach((doc) => {
                const pageKey = String(doc?.pageId || '');
                const sectionKey = String(doc?.sectionId || '').toLowerCase().trim();
                if (!pageKey || !sectionKey) return;
                const key = `${pageKey}::${sectionKey}`;
                const existing = sectionContentRowsByKey.get(key) || [];
                existing.push(doc);
                sectionContentRowsByKey.set(key, existing);

                if (sectionKey === "service_sections") {
                    const bundleKey = `${String(doc?.serviceId || doc?.pageId || "")}::${String(doc?.locationId || "")}`;
                    serviceBundleMap.set(bundleKey, doc);
                }
            });

            const sections = getSectionEntriesFromPage(selectedPage)
                .map((entry) => {
                    const { sectionData, sectionType, index, compData } = entry;
                    const sectionId = String(sectionData?.id || compData?.id || `${sectionType}-${index + 1}`);
                    const contentRef = sectionData?.contentRef || {};
                    const resolverType = getSectionResolver(sectionType);
                    const { pickedDoc, resolvedContent } = resolveSectionContentWithPriority({
                        sectionType,
                        contentRef,
                        pageIdStr: sectionContentLookupPageId,
                        scopedPreferredLocationId,
                        sectionContentDocs,
                        sectionContentRowsByKey,
                        resolverType,
                        serviceBundleMap,
                        pageMeta,
                        businessLocations,
                        resolvedServicesGridContent,
                        websitePages,
                        projectType,
                    });
                    const mergedContent = mergeGenieBuildDesignSectionContent(
                        sectionType,
                        resolvedContent,
                        sectionData
                    );
                    const chosenVariant = resolveChosenSectionVariant(sectionData, compData);
                    const mergedStyles = {
                        ...(sectionData?.styles && typeof sectionData.styles === "object"
                            ? sectionData.styles
                            : {}),
                        ...(chosenVariant ? { variant: chosenVariant } : {}),
                    };
                    const mergedSectionData = {
                        ...sectionData,
                        id: sectionId,
                        type: sectionType,
                        content: mergedContent,
                        styles: mergedStyles,
                        status: pickedDoc?.status === "generated" ? "ready" : "generating"
                    };
                    return toResolvedSectionShape(
                        mergedSectionData,
                        `${sectionType}-${index + 1}`,
                        compData
                    );
                })
                .filter(Boolean);

            const sectionsWithContact = await applyContactDynamicsToAllSections(
                sections,
                projectId
            );
            const navContextLocationId = pageMeta?.locationId
                ? String(pageMeta.locationId)
                : scopedPreferredLocationId || null;

            let sectionsWithDynamics = await applyHeaderFooterDynamicsToSections(
                sectionsWithContact,
                projectId,
                {
                    contextLocationId: navContextLocationId,
                    pageMeta: pageMeta || {},
                }
            );

            // Enforce deterministic modern section order on every page type.
            // Hero first → body → CTA → reviews → FAQ last. Header/footer stay shells.
            // Fixes wizard/GenieBuild saving a scrambled componentIds order.
            if (Array.isArray(sectionsWithDynamics) && sectionsWithDynamics.length) {
                const pageKeyForCanonicalOrder = resolveCanonicalPageKey(pageMeta || {});
                sectionsWithDynamics = applyCanonicalSectionOrderToPageSections(
                    pageKeyForCanonicalOrder,
                    sectionsWithDynamics
                );
            }

            const pageSeoEntry = pageMeta ? await getSeoForWebsitePage(pageMeta) : null;
            const seoForBuilder = pageSeoEntry ? seoEntryToGeniebuild(pageSeoEntry, pageMeta) : {};

            return res.status(200).json({
                message: 'GenieBuild page data fetched successfully',
                data: {
                    projectId,
                    pageId: targetPageId,
                    locationId: scopedPreferredLocationId || null,
                    seo: seoForBuilder,
                    seoSettings: pageSeoEntry ? [seoEntryToLegacyApi(pageSeoEntry, pageMeta)] : [],
                    sections: sectionsWithDynamics,
                    sectionOrder: sectionsWithDynamics.map((s, idx) => ({ order: idx + 1, sectionId: s.id, type: s.type })),
                    themeSettings: themeSettings
                        ? {
                            theme: themeSettings.theme || 'crimson-jet',
                            presetId: themeSettings.presetId || null,
                            customColors: themeSettings.customColors || null,
                            defaultSizes: themeSettings.defaultSizes || null,
                            defaultTypography: themeSettings.defaultTypography || null,
                            defaultFont: themeSettings.defaultFont || null,
                            globalElementStyles: themeSettings.globalElementStyles || null,
                            additionalCss: themeSettings.additionalCss || {
                                blogCss: '',
                                siteCss: '',
                                applyBlogCssToSite: false,
                            },
                        }
                        : {
                            theme: 'crimson-jet',
                            presetId: null,
                            customColors: null,
                            defaultSizes: null,
                            defaultTypography: null,
                            defaultFont: null,
                            globalElementStyles: null,
                            additionalCss: {
                                blogCss: '',
                                siteCss: '',
                                applyBlogCssToSite: false,
                            },
                        },
                    colors: resolveThemeColorsForApi(themeSettings),
                }
            });
        } catch (error) {
            console.error('Error fetching Website Design Data:', error);
            return res.status(500).json({ message: 'Server error while fetching Website Design Data' });
        }
    },

    // Get pages list for a project (for page selection dialog)
    getWebsitePages: async (req, res) => {
        try {
            const { projectId } = req.params;

            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }

            // Validate projectId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({ message: 'Invalid projectId format' });
            }

            // Also fetch design data to get component counts
            // Repair truncated designData.pages from SectionContent (legacy GenieBuild wipe).
            await repairDesignPagesFromSectionContent(projectId);

            const designData = await WebsiteDesignsData.findOne({ projectId })
                .select('pages.pageId pages.sections pages.componentIds')
                .lean();

            // Fetch all pages for this project directly from WebsitePage (project-specific).
            // WebsitePage is the source of truth — do NOT filter by WebsiteDesignsData.pages.
            // GenieBuild single-page saves used to truncate designData.pages, which made
            // this filter hide real pages (DB still had 20, admin list showed ~11).
            let websitePages = await WebsitePage.find({ projectId })
                .select('name slug displayName description seoSettings pageType serviceId locationId isPublished')
                .sort({ createdAt: -1 })
                .lean();

            // Create a map of pageId to component count from designData
            const componentCountMap = new Map();
            if (designData && designData.pages) {
                designData.pages.forEach(page => {
                    const pageId = page.pageId?._id || page.pageId;
                    if (pageId) {
                        componentCountMap.set(pageId.toString(), getPageSections(page).length || 0);
                    }
                });
            }

            const total = websitePages.length;
            const live = websitePages.filter((p) => p.isPublished !== false).length;
            const inactive = total - live;
            const redirects301 = await PageSlugRedirect.countDocuments({ projectId });

            const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limitNum = Math.max(0, parseInt(req.query.limit, 10) || 0);
            let slice = websitePages;
            let pagination = null;
            if (limitNum > 0) {
                const skip = (pageNum - 1) * limitNum;
                slice = websitePages.slice(skip, skip + limitNum);
                pagination = {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / limitNum)),
                };
            }

            // Map website pages to response format
            const pages = slice.map(page => {
                const activeSeo = getActiveSeoFromPage(page);
                const schemas = Array.isArray(activeSeo?.schemas) ? activeSeo.schemas : [];
                const enabledSchemas = schemas.filter((s) => s && s.enabled !== false);
                const hasMeta = Boolean(
                    String(activeSeo?.meta_title || "").trim() &&
                    String(activeSeo?.meta_description || "").trim()
                );
                return {
                pageId: page._id,
                _id: page._id,
                name: page.name || '', // Unique identifier, non-changeable
                slug: page.slug || page.name || '', // Changeable URL path
                displayName: page.displayName || '',
                description: page.description || '',
                componentCount: componentCountMap.get(page._id.toString()) || 0,
                seoSettings: page.seoSettings || [],
                hasSeo: hasMeta || enabledSchemas.length > 0,
                schemaCount: enabledSchemas.length,
                isPublished: page.isPublished !== false,
            };
            });

            return res.status(200).json({
                message: 'Website pages fetched successfully',
                data: pages,
                counts: {
                    total,
                    live,
                    inactive,
                    redirects301,
                },
                ...(pagination ? { pagination } : {}),
            });
        } catch (error) {
            console.error('Error fetching Website Pages:', error);
            return res.status(500).json({ message: 'Server error while fetching Website Pages', error: error.message });
        }
    },

    getPageSlugHistory: async (req, res) => {
        try {
            const { projectId, pageId } = req.params;

            if (!projectId || !pageId) {
                return res.status(400).json({ message: 'projectId and pageId are required' });
            }

            if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(pageId)) {
                return res.status(400).json({ message: 'Invalid projectId or pageId format' });
            }

            const history = await getPageSlugHistory(projectId, pageId);
            if (!history) {
                return res.status(404).json({ message: 'Page not found for this project' });
            }

            return res.status(200).json({
                message: 'Page slug history fetched successfully',
                data: history
            });
        } catch (error) {
            console.error('Error fetching page slug history:', error);
            return res.status(500).json({ message: 'Server error while fetching page slug history' });
        }
    },

    // Check if project is a business website (has WebsiteDesignsData)
    isBusinessWebsite: async (req, res) => {
        try {
            const { projectId } = req.params;

            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }

            const designData = await WebsiteDesignsData.findOne({ projectId });

            return res.status(200).json({
                message: 'Business website check completed',
                data: {
                    isBusinessWebsite: !!designData,
                    hasPages: designData ? (designData.pages?.length > 0) : false
                }
            });
        } catch (error) {
            console.error('Error checking business website:', error);
            return res.status(500).json({ message: 'Server error while checking business website' });
        }
    },

    // Save or Update Website Element
    saveWebsiteElement: async (req, res) => {
        try {
            const { projectId, componentId, pageId, elementId, elementType, order, props, style, defaultCode, defaultStyle } = req.body;

            if (!projectId || !componentId || !pageId || !elementId || !elementType) {
                return res.status(400).json({
                    message: 'projectId, componentId, pageId, elementId, and elementType are required'
                });
            }

            // Check if element already exists
            let element = await WebsiteElement.findOne({
                projectId,
                componentId,
                pageId,
                elementId
            });

            if (element) {
                // Update existing element
                element.elementType = elementType;
                element.order = order !== undefined ? order : element.order;
                element.props = props || element.props;
                element.style = style || element.style;
                if (defaultCode !== undefined) element.defaultCode = defaultCode;
                if (defaultStyle !== undefined) element.defaultStyle = defaultStyle;
                await element.save();
            } else {
                // Create new element
                element = new WebsiteElement({
                    projectId: new mongoose.Types.ObjectId(projectId),
                    componentId: new mongoose.Types.ObjectId(componentId),
                    pageId: new mongoose.Types.ObjectId(pageId),
                    elementId,
                    elementType,
                    order: order || 0,
                    props: props || {},
                    style: style || {},
                    defaultCode: defaultCode || '',
                    defaultStyle: defaultStyle || {}
                });
                await element.save();
            }

            return res.status(200).json({
                message: 'Website element saved successfully',
                data: element
            });
        } catch (error) {
            console.error('Error saving Website Element:', error);
            return res.status(500).json({ message: 'Server error while saving Website Element' });
        }
    },

    // Get Website Elements for a component
    getWebsiteElements: async (req, res) => {
        try {
            const { projectId, componentId, pageId } = req.query;

            if (!projectId || !componentId || !pageId) {
                return res.status(400).json({
                    message: 'projectId, componentId, and pageId are required'
                });
            }

            const elements = await WebsiteElement.find({
                projectId,
                componentId,
                pageId
            }).sort({ order: 1 });

            return res.status(200).json({
                message: 'Website elements fetched successfully',
                data: elements
            });
        } catch (error) {
            console.error('Error fetching Website Elements:', error);
            return res.status(500).json({ message: 'Server error while fetching Website Elements' });
        }
    },

    // Delete Website Element
    deleteWebsiteElement: async (req, res) => {
        try {
            const { elementId } = req.params;
            const { projectId, componentId, pageId } = req.query;

            if (!elementId) {
                return res.status(400).json({ message: 'elementId is required' });
            }

            const query = { elementId };
            if (projectId) query.projectId = projectId;
            if (componentId) query.componentId = componentId;
            if (pageId) query.pageId = pageId;

            const element = await WebsiteElement.findOneAndDelete(query);

            if (!element) {
                return res.status(404).json({ message: 'Website element not found' });
            }

            return res.status(200).json({
                message: 'Website element deleted successfully',
                data: element
            });
        } catch (error) {
            console.error('Error deleting Website Element:', error);
            return res.status(500).json({ message: 'Server error while deleting Website Element' });
        }
    },

    // Upsert Builder Elements
    upsertBuilderElements: async (req, res) => {
        try {
            // Get current count for ordering
            const existingCount = await BuilderElement.countDocuments();

            // Process elements from request body
            let elementsToAdd = [];
            if (req.body.elements) {
                let elements = req.body.elements;

                // If not array, try to parse as JSON
                if (!Array.isArray(elements)) {
                    try {
                        if (typeof elements === 'string') {
                            elements = JSON.parse(elements);
                        } else {
                            elements = [elements];
                        }
                    } catch (parseErr) {
                        return res.status(400).json({
                            message: 'Invalid elements format. Expected array or JSON string.',
                            error: parseErr.message
                        });
                    }
                }

                // Convert array of strings to element objects
                elementsToAdd = elements.map((el, index) => {
                    if (typeof el === 'string') {
                        // If string, create element object with elementId
                        const elementId = el.toLowerCase().trim();
                        return {
                            elementId: elementId,
                            elementType: elementId,
                            displayName: el.charAt(0).toUpperCase() + el.slice(1),
                            description: `${el} element`,
                            category: "basic",
                            order: existingCount + index + 1,
                            isActive: true
                        };
                    } else if (typeof el === 'object' && el.elementId) {
                        // If object, use it as is (with defaults)
                        return {
                            elementId: el.elementId.toLowerCase().trim(),
                            elementType: el.elementType || el.elementId.toLowerCase().trim(),
                            displayName: el.displayName || el.elementId.charAt(0).toUpperCase() + el.elementId.slice(1),
                            description: el.description || `${el.elementId} element`,
                            category: el.category || "basic",
                            order: el.order || existingCount + index + 1,
                            defaultCode: el.defaultCode || '',
                            defaultStyle: el.defaultStyle || {},
                            defaultProps: el.defaultProps || {},
                            isActive: el.isActive !== undefined ? el.isActive : true
                        };
                    } else {
                        return null;
                    }
                }).filter(el => el !== null);
            }

            // Check for existing elements and insert only new ones
            const insertedElements = [];
            const skippedElements = [];

            if (elementsToAdd.length > 0) {
                for (const elementData of elementsToAdd) {
                    try {
                        // Check if element already exists
                        const existing = await BuilderElement.findOne({
                            elementId: elementData.elementId
                        });

                        if (existing) {
                            skippedElements.push({
                                elementId: elementData.elementId,
                                reason: 'Already exists'
                            });
                            console.log(`[upsertBuilderElements] Element "${elementData.elementId}" already exists, skipping`);
                        } else {
                            // Insert new element
                            const newElement = new BuilderElement(elementData);
                            await newElement.save();
                            insertedElements.push(newElement);
                            console.log(`[upsertBuilderElements] Element "${elementData.elementId}" inserted successfully`);
                        }
                    } catch (err) {
                        if (err.code === 11000) {
                            // Duplicate key error
                            skippedElements.push({
                                elementId: elementData.elementId,
                                reason: 'Duplicate key'
                            });
                        } else {
                            console.error(`[upsertBuilderElements] Error inserting element "${elementData.elementId}":`, err);
                            skippedElements.push({
                                elementId: elementData.elementId,
                                reason: err.message
                            });
                        }
                    }
                }
            }

            // Get all elements
            const allElements = await BuilderElement.find({ isActive: true })
                .sort({ order: 1 });

            return res.status(200).json({
                message: 'Elements processed successfully',
                data: {
                    totalElements: allElements.length,
                    inserted: insertedElements.length,
                    skipped: skippedElements.length,
                    insertedElements: insertedElements,
                    skippedElements: skippedElements,
                    allElements: allElements
                }
            });
        } catch (error) {
            console.error('Error upserting Builder Elements:', error);
            return res.status(500).json({
                message: 'Server error while upserting Builder Elements',
                error: error.message
            });
        }
    },

    // Get All Builder Elements
    getBuilderElements: async (req, res) => {
        try {
            const { category, isActive } = req.query;

            console.log(req.query, req.body, "there are the logs")

            const query = {};
            if (category) query.category = category;
            if (isActive !== undefined) query.isActive = isActive === 'true';

            const elements = await BuilderElement.find(query)
                .sort({ order: 1 });

            return res.status(200).json({
                message: 'Builder elements fetched successfully',
                data: elements
            });
        } catch (error) {
            console.error('Error fetching Builder Elements:', error);
            return res.status(500).json({ message: 'Server error while fetching Builder Elements' });
        }
    },

    updateProjectTheme: async (req, res) => {
        try {
            console.log("we are in updateProjectTheme", req.body); // Debugging the incoming request

            // Extract projectId, theme, presetId, themeSubColor, customColors, defaultStyles, defaultFont, defaultSizes, defaultTypography, and globalElementStyles from request body
            const { projectId, theme, presetId, themeSubColor, customColors, defaultStyles, defaultFont, defaultSizes, defaultTypography, globalElementStyles } = req.body;

            if (!projectId) {
                return res.status(400).json({ message: "projectId is required" });
            }

            if (!theme) {
                return res.status(400).json({ message: "theme is required" });
            }

            // Check if the project exists
            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            const { resolveNumericPresetIdFromPayload } = require('../additional/presetThemeCatalog');
            // Always store numeric GenieBuild preset index (0–10), never Mongo Theme _id.
            let finalPresetId = null;
            if (theme && theme !== 'custom') {
                finalPresetId = resolveNumericPresetIdFromPayload({ theme, presetId });
            }

            const resolvedUserId =
                req.user?.userId ||
                project.userId ||
                (mongoose.Types.ObjectId.isValid(String(req.body.userId || ""))
                    ? req.body.userId
                    : null);

            if (!resolvedUserId) {
                return res.status(400).json({ message: "userId is required" });
            }

            // Fetch the current theme settings for the project
            let themeSettings = await ThemeSetting.findOne({ projectId });

            if (themeSettings) {
                // If theme settings exist, update them
                themeSettings.theme = theme;
                // Update presetId (null if custom theme)
                themeSettings.presetId = finalPresetId || null;
                if (themeSubColor) {
                    themeSettings.themeSubColor = themeSubColor; // Update the sub color if provided
                }
                // Update custom colors if provided (for custom theme)
                if (customColors && theme === 'custom') {
                    themeSettings.customColors = customColors;
                } else if (theme !== 'custom' && customColors) {
                    // For preset themes, still save font/size settings in customColors
                    // Only save headingSizes, buttonSizes, textSizes, and fontFamily
                    themeSettings.customColors = {
                        headingSizes: customColors.headingSizes,
                        buttonSizes: customColors.buttonSizes,
                        textSizes: customColors.textSizes,
                        fontFamily: customColors.fontFamily
                    };
                }
                // Save defaultStyles array for all themes
                if (defaultStyles && Array.isArray(defaultStyles)) {
                    themeSettings.defaultStyles = defaultStyles;
                }
                // Save defaultFont (separate key)
                if (defaultFont !== undefined) {
                    themeSettings.defaultFont = defaultFont || "Inter, sans-serif";
                }
                // Save defaultSizes if provided
                if (defaultSizes) {
                    themeSettings.defaultSizes = { ...themeSettings.defaultSizes, ...defaultSizes };
                }
                // Save defaultTypography if provided
                if (defaultTypography) {
                    themeSettings.defaultTypography = { ...themeSettings.defaultTypography, ...defaultTypography };
                }
                // Save globalElementStyles if provided (typography settings for headings, body, buttons, links)
                if (globalElementStyles !== undefined && globalElementStyles !== null) {
                    themeSettings.globalElementStyles = globalElementStyles;
                }
                await themeSettings.save();
            } else {
                // If no theme settings exist, create new theme settings
                const newThemeData = {
                    projectId,
                    userId: resolvedUserId,
                    theme, // Set the theme
                    presetId: finalPresetId || null, // Set presetId (looked up from theme name if needed)
                    themeSubColor: themeSubColor || null, // Set the sub color if provided
                };

                // Set custom colors based on theme type
                if (theme === 'custom' && customColors) {
                    newThemeData.customColors = customColors;
                } else if (customColors) {
                    // For preset themes, save only font/size settings
                    newThemeData.customColors = {
                        headingSizes: customColors.headingSizes,
                        buttonSizes: customColors.buttonSizes,
                        textSizes: customColors.textSizes,
                        fontFamily: customColors.fontFamily
                    };
                }

                // Save defaultStyles array
                if (defaultStyles && Array.isArray(defaultStyles)) {
                    newThemeData.defaultStyles = defaultStyles;
                }

                // Save defaultFont (separate key)
                if (defaultFont !== undefined) {
                    newThemeData.defaultFont = defaultFont || "Inter, sans-serif";
                }
                // Save defaultSizes if provided
                if (defaultSizes) {
                    newThemeData.defaultSizes = defaultSizes;
                }
                // Save defaultTypography if provided
                if (defaultTypography) {
                    newThemeData.defaultTypography = defaultTypography;
                }
                // Save globalElementStyles if provided
                if (globalElementStyles !== undefined && globalElementStyles !== null) {
                    newThemeData.globalElementStyles = globalElementStyles;
                }

                themeSettings = new ThemeSetting(newThemeData);
                await themeSettings.save();
            }

            console.log("[updateProjectTheme] Theme saved to ThemeSetting table:", {
                projectId,
                theme: themeSettings.theme,
                hasCustomColors: !!themeSettings.customColors,
                hasDefaultStyles: !!themeSettings.defaultStyles,
                hasGlobalElementStyles: !!themeSettings.globalElementStyles
            });

            // Send success response
            return res.status(200).json({ message: "Theme and sub color saved successfully!", data: themeSettings });
        } catch (error) {
            console.error("Error updating project theme:", error);
            return res.status(500).json({ message: "Server error while updating project theme" });
        }
    },

    /** WordPress/Wix-style Additional CSS for blogs + optional site-wide. */
    getAdditionalCss: async (req, res) => {
        try {
            const projectId = req.params?.projectId || req.query?.projectId || req.body?.projectId;
            if (!projectId) {
                return res.status(400).json({ message: "projectId is required" });
            }
            const project = await UserProject.findById(projectId).select("_id userId").lean();
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }
            const themeSettings = await ThemeSetting.findOne({ projectId })
                .select("theme additionalCss")
                .lean();
            const additionalCss = themeSettings?.additionalCss || {};
            return res.status(200).json({
                message: "Additional CSS fetched",
                data: {
                    projectId,
                    theme: themeSettings?.theme || "crimson-jet",
                    blogCss: String(additionalCss.blogCss || ""),
                    siteCss: String(additionalCss.siteCss || ""),
                    applyBlogCssToSite: Boolean(additionalCss.applyBlogCssToSite),
                },
            });
        } catch (error) {
            console.error("Error fetching additional CSS:", error);
            return res.status(500).json({ message: "Server error while fetching additional CSS" });
        }
    },

    /**
     * Theme tokens + prose CSS for admin blog editor WYSIWYG
     * (same look as live site headings / paragraphs).
     */
    getBlogEditorTheme: async (req, res) => {
        try {
            const projectId = req.params?.projectId || req.query?.projectId || req.body?.projectId;
            if (!projectId) {
                return res.status(400).json({ message: "projectId is required" });
            }
            const project = await UserProject.findById(projectId).select("_id").lean();
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }
            const themeSettings = await ThemeSetting.findOne({ projectId }).lean();
            const payload = buildBlogEditorThemePayload(themeSettings || null);
            return res.status(200).json({
                message: "Blog editor theme fetched",
                data: {
                    projectId,
                    theme: themeSettings?.theme || "crimson-jet",
                    ...payload,
                },
            });
        } catch (error) {
            console.error("Error fetching blog editor theme:", error);
            return res.status(500).json({ message: "Server error while fetching blog editor theme" });
        }
    },

    updateAdditionalCss: async (req, res) => {
        try {
            const {
                projectId,
                blogCss,
                siteCss,
                applyBlogCssToSite,
            } = req.body || {};

            if (!projectId) {
                return res.status(400).json({ message: "projectId is required" });
            }

            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            const sanitizeCss = (raw) => {
                let s = String(raw ?? "");
                // Block script/url javascript smuggling in CSS payloads
                s = s.replace(/<\/?script\b[^>]*>/gi, "");
                s = s.replace(/expression\s*\(/gi, "");
                s = s.replace(/javascript\s*:/gi, "");
                // Hard cap (~100KB) like typical WP custom CSS limits
                if (s.length > 100000) s = s.slice(0, 100000);
                return s;
            };

            const resolvedUserId =
                req.user?.userId ||
                project.userId ||
                null;

            let themeSettings = await ThemeSetting.findOne({ projectId });
            if (!themeSettings) {
                if (!resolvedUserId) {
                    return res.status(400).json({ message: "userId is required to create theme settings" });
                }
                themeSettings = new ThemeSetting({
                    projectId,
                    userId: resolvedUserId,
                    theme: "crimson-jet",
                    presetId: "0",
                    additionalCss: {
                        blogCss: "",
                        siteCss: "",
                        applyBlogCssToSite: false,
                    },
                });
            }

            themeSettings.additionalCss = {
                blogCss: sanitizeCss(blogCss),
                siteCss: sanitizeCss(siteCss),
                applyBlogCssToSite: Boolean(applyBlogCssToSite),
            };
            themeSettings.markModified("additionalCss");
            await themeSettings.save();

            return res.status(200).json({
                message: "Additional CSS saved successfully",
                data: {
                    projectId,
                    blogCss: themeSettings.additionalCss.blogCss,
                    siteCss: themeSettings.additionalCss.siteCss,
                    applyBlogCssToSite: themeSettings.additionalCss.applyBlogCssToSite,
                },
            });
        } catch (error) {
            console.error("Error updating additional CSS:", error);
            return res.status(500).json({ message: "Server error while updating additional CSS" });
        }
    },

    create_theme: async (req, res) => {
        try {
            const {
                themeName,
                supportThemeSubColor = false,
                supportSecondaryColor = false,
                themeDemoUrl,
                themeImageUrl,
                isActive = false
            } = req.body;

            if (!themeName || !themeDemoUrl || !themeImageUrl) {
                return res.status(400).json({ message: 'themeName, themeDemoUrl, themeImageUrl are required' });
            }

            if (isActive) {
                await Theme.updateMany({}, { $set: { isActive: false } });
            }

            const newTheme = new Theme({
                themeName,
                supportThemeSubColor,
                supportSecondaryColor,
                themeDemoUrl,
                themeImageUrl,
                isActive
            });

            await newTheme.save();

            return res.status(201).json({
                message: 'Theme created successfully!',
                theme: newTheme
            });
        } catch (error) {
            console.error('Error creating theme:', error);
            return res.status(500).json({ message: 'Error creating theme' });
        }
    },

    // EDIT / UPDATE
    update_theme: async (req, res) => {
        try {

            const {
                themeName,
                supportThemeSubColor,
                supportSecondaryColor,
                themeDemoUrl,
                themeImageUrl,
                themeId
            } = req.body;



            console.log(req.body, "update theme api data")
            const theme = await Theme.findById(themeId);
            if (!theme) {
                return res.status(404).json({ message: 'Theme not found' });
            }

            if (themeName !== undefined) theme.themeName = themeName;
            if (supportThemeSubColor !== undefined) theme.supportThemeSubColor = supportThemeSubColor;
            if (supportSecondaryColor !== undefined) theme.supportSecondaryColor = supportSecondaryColor;
            if (themeDemoUrl !== undefined) theme.themeDemoUrl = themeDemoUrl;
            if (themeImageUrl !== undefined) theme.themeImageUrl = themeImageUrl;

            await theme.save();

            return res.status(200).json({
                message: 'Theme updated successfully!',
                theme
            });
        } catch (error) {
            console.error('Error updating theme:', error);
            return res.status(500).json({ message: 'Error updating theme' });
        }
    },

    // CHANGE STATUS (activate/deactivate)
    change_theme_status: async (req, res) => {
        try {
            const { themeId, isActive } = req.body;

            if (!themeId) {
                return res.status(400).json({ message: 'themeId is required' });
            }

            // accept boolean or string "true"/"false"
            if (![true, false, 'true', 'false'].includes(isActive)) {
                return res.status(400).json({ message: 'isActive must be boolean (true/false)' });
            }

            const activate = (isActive === true || isActive === 'true');

            const theme = await Theme.findById(themeId);
            if (!theme) {
                return res.status(404).json({ message: 'Theme not found' });
            }

            theme.isActive = activate;
            await theme.save();

            return res.status(200).json({
                message: `Theme ${activate ? 'activated' : 'deactivated'} successfully!`,
                theme
            });
        } catch (error) {
            console.error('Error changing theme status:', error);
            return res.status(500).json({ message: 'Error changing theme status' });
        }
    },

    // LIST (optional filters ?active=true/false&search=xyz)
    list_themes: async (req, res) => {
        try {
            const { active, search } = req.query;

            const filter = {};
            if (active === 'true') filter.isActive = true;
            if (active === 'false') filter.isActive = false;
            if (search) filter.themeName = { $regex: search, $options: 'i' };

            const themes = await Theme.find(filter).sort({ createdAt: -1 });

            return res.status(200).json({
                message: 'Themes fetched successfully!',
                count: themes.length,
                themes
            });
        } catch (error) {
            console.error('Error listing themes:', error);
            return res.status(500).json({ message: 'Error listing themes' });
        }
    },

    seed_themes: async (req, res) => {
        try {
            console.log('🔄 Manual theme seeding triggered...');
            const seedThemes = require('../config/seedThemes');
            await seedThemes();

            // Small delay to ensure all saves are complete
            await new Promise(resolve => setTimeout(resolve, 300));

            // Fetch updated themes list
            const themes = await Theme.find().sort({ createdAt: -1 });

            console.log(`✅ Seeding complete. Total themes in database: ${themes.length}`);
            themes.forEach(t => {
                console.log(`   - ${t.themeName} (Active: ${t.isActive})`);
            });

            return res.status(200).json({
                message: 'Themes seeded successfully!',
                count: themes.length,
                themes
            });
        } catch (error) {
            console.error('❌ Error seeding themes:', error);
            return res.status(500).json({
                message: 'Error seeding themes',
                error: error.message
            });
        }
    },

    fetch_services: async (req, res) => {
        try {
            const { projectId, page = 1, limit = 10 } = req.body; // Accept page and limit from the request body

            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required' });
            }

            let project_info = await userProjects.findById(projectId).lean()
                .select('_id projectName fas_fa_icon');

            if (!project_info) {
                return res.status(400).json({ message: 'Project with this ID does not exist' });
            }

            // Calculate skip value for pagination
            const skip = (page - 1) * limit;

            // Fetch services with pagination
            const servicesRaw = await Service.find({ projectId })
                .select('_id name slug createdAt updatedAt')
                .skip(skip) // Skip previous records
                .limit(limit); // Limit the number of services returned
            const services = servicesRaw.map((s) => ({
                ...s.toObject(),
                service_name: s.name,
            }));

            // Get the total count of services for pagination
            const totalServices = await Service.countDocuments({ projectId });

            return res.json({
                project_info,
                services,
                totalServices,
            });
        } catch (error) {
            console.error('Error fetching content:', error);
            return res.status(500).json({ message: 'Error fetching content' });
        }
    },

    fetch_service_location_pages_status: async (req, res) => {
        try {
            const { projectId, serviceId } = req.body;
            if (!projectId || !serviceId) {
                return res.status(400).json({ message: "projectId and serviceId are required" });
            }

            const [project, service, locations] = await Promise.all([
                userProjects.findById(projectId).select("_id").lean(),
                Service.findOne({ _id: serviceId, projectId }).select("_id name slug").lean(),
                BusinessLocation.find({ projectId, status: 1 })
                    .select("_id areaName type parentId")
                    .lean(),
            ]);
            if (!project) return res.status(404).json({ message: "Project not found" });
            if (!service) return res.status(404).json({ message: "Service not found for project" });

            const locationIds = locations.map((l) => l._id);
            const [pages, sectionRows] = await Promise.all([
                WebsitePage.find({
                    projectId,
                    pageType: "service",
                    serviceId,
                    locationId: { $in: locationIds },
                })
                    .select("_id locationId slug updatedAt")
                    .lean(),
                SectionContent.find({
                    projectId,
                    sectionId: "service_sections",
                    serviceId,
                    locationId: { $in: locationIds },
                    isDeleted: { $ne: true },
                })
                    .select("locationId status error updatedAt")
                    .lean(),
            ]);

            const pagesByLocation = new Map(pages.map((p) => [String(p.locationId), p]));
            const contentByLocation = new Map(sectionRows.map((r) => [String(r.locationId), r]));
            const parentById = new Map(locations.map((l) => [String(l._id), l]));

            const statusFor = (pageDoc, contentDoc) => {
                if (!pageDoc) return "not_created"; // silver
                if (!contentDoc) return "pending"; // yellow
                if (contentDoc.status === "generated") return "generated"; // green
                if (contentDoc.status === "failed" || contentDoc.error) return "failed"; // red
                return "pending"; // yellow
            };

            const rows = locations
                .map((loc) => {
                    const key = String(loc._id);
                    const page = pagesByLocation.get(key) || null;
                    const content = contentByLocation.get(key) || null;
                    const parent =
                        loc.parentId && parentById.has(String(loc.parentId))
                            ? parentById.get(String(loc.parentId))
                            : null;
                    return {
                        locationId: key,
                        locationName: loc.areaName,
                        locationType: Number(loc.type || 0),
                        parentName: parent ? parent.areaName : null,
                        pageId: page ? String(page._id) : null,
                        pageUrl: page?.slug ? `/${String(page.slug).replace(/^\/+/, "")}` : null,
                        status: statusFor(page, content),
                        error: content?.error || null,
                        updatedAt: (content?.updatedAt || page?.updatedAt || null),
                    };
                })
                .sort((a, b) => {
                    if (a.locationType !== b.locationType) return a.locationType - b.locationType;
                    return String(a.locationName).localeCompare(String(b.locationName));
                });

            return res.status(200).json({
                message: "Service location page status fetched successfully",
                data: {
                    service: { _id: String(service._id), name: service.name, slug: service.slug },
                    rows,
                },
            });
        } catch (error) {
            console.error("Error fetching service location page status:", error);
            return res.status(500).json({ message: "Failed to fetch service location page status" });
        }
    },

    fetch_ordered_services: async (req, res) => {
        try {
            const { projectId } = req.body;
            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required' });
            }

            // 1) Verify project exists
            const project_info = await userProjects
                .findById(projectId)
                .lean()
                .select('_id projectName fas_fa_icon');
            if (!project_info) {
                return res
                    .status(400)
                    .json({ message: 'Project with this ID does not exist' });
            }

            // 2) Aggregation: match → sort → group → sort buckets → project shape
            const services = await Service.aggregate([
                {
                    $match: {
                        projectId: new mongoose.Types.ObjectId(projectId),
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        slug: 1,
                        firstLetter: {
                            $toUpper: { $substr: ["$name", 0, 1] }
                        }
                    }
                },
                { $sort: { name: 1 } },    // A→Z overall
                {
                    $group: {
                        _id: "$firstLetter",
                        services: {
                            $push: {
                                _id: "$_id",
                                service_name: "$name",
                                slug: "$slug"
                            }
                        }
                    }
                },
                { $sort: { _id: 1 } },             // A→Z buckets
                {
                    $project: {
                        _id: 0,
                        letter: "$_id",
                        services: 1
                    }
                }
            ]);

            // 3) Send down project + grouped services
            return res.json({
                project_info,
                services
            });

        } catch (error) {
            console.error('Error fetching services:', error);
            return res.status(500).json({ message: 'Error fetching services' });
        }
    },

    create_service: async (req, res) => {
        try {
            const { projectId, name, service_name } = req.body;
            const incomingName = name || service_name;

            // Validate required fields
            if (!projectId || !incomingName) {
                return res.status(400).json({ message: 'projectId and name are required' });
            }

            // Find the project by ID
            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            const normalizedName = String(incomingName).trim().toLowerCase();
            const normalizedSlug = slugify(normalizedName);

            const service = await Service.findOneAndUpdate(
                { projectId, name: normalizedName },
                {
                    $set: {
                        projectId,
                        name: normalizedName,
                        slug: normalizedSlug,
                    },
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                }
            );

            return res.status(201).json({
                message: 'Service saved successfully!',
                service: {
                    ...service.toObject(),
                    service_name: service.name,
                },
            });
        } catch (error) {
            console.error('Error creating service:', error);
            return res.status(500).json({ message: 'Error creating service' });
        }
    },

    update_service: async (req, res) => {
        try {
            const { serviceId } = req.params; // Get serviceId from URL parameter
            const { name, service_name, projectId } = req.body;
            const incomingName = name || service_name;

            // Validate required fields
            if (!incomingName || !projectId) {
                return res.status(400).json({ message: 'name and projectId are required' });
            }

            // Find the service by ID
            const service = await Service.findById(serviceId);
            if (!service) {
                return res.status(404).json({ message: 'Service not found' });
            }

            // Check if the projectId matches the service's projectId (optional check)
            if (service.projectId.toString() !== projectId) {
                return res.status(403).json({ message: 'You do not have permission to update this service' });
            }

            // Update the service with the new data
            service.name = String(incomingName).trim().toLowerCase();
            service.slug = slugify(service.name);

            // Save the updated service
            await service.save();

            // Respond with the updated service
            return res.status(200).json({
                message: 'Service updated successfully!',
                service: {
                    ...service.toObject(),
                    service_name: service.name,
                },
            });
        } catch (error) {
            console.error('Error updating service:', error);
            return res.status(500).json({ message: 'Error updating service' });
        }
    },

    delete_service: async (req, res) => {

        try {
            const { serviceId } = req.params; // Get serviceId from URL parameter

            // Validate serviceId
            if (!serviceId) {
                return res.status(400).json({ message: 'Service ID is required' });
            }

            // Find the service by ID and delete it
            const service = await Service.findByIdAndDelete(serviceId);

            if (!service) {
                return res.status(404).json({ message: 'Service not found' });
            }

            // Respond with success message
            return res.status(200).json({
                message: 'Service deleted successfully!',
            });
        } catch (error) {
            console.error('Error deleting service:', error);
            return res.status(500).json({ message: 'Error deleting service' });
        }


    },

    clear_redis: async (req, res) => {
        try {
            // 1. Pause the queue so no new jobs are processed
            await redisQueue.pause(/* shouldPauseAll = */ true);

            // 2. Remove every job from every state
            //    force:true is required to remove delayed jobs
            await redisQueue.obliterate({ force: true });

            return res
                .status(200)
                .json({ success: true, message: 'All Redis queue tasks have been permanently cleared.' });
        } catch (err) {
            console.error('Error clearing Redis queue:', err);
            return res
                .status(500)
                .json({ success: false, error: err.message });
        }
    },

    updateSeoSettings: async (req, res) => {
        try {
            const { projectId, pageUrl, pageId, metaTitle, metaDescription, metaKeywords, metaImage, canonicalUrl, ...rest } = req.body;
            if (!projectId) {
                return res.status(400).json({ message: "Project ID is required!" });
            }
            if (!metaTitle || !metaDescription || !metaKeywords) {
                return res.status(400).json({ message: "Meta Title, Description, and Keywords are required!" });
            }

            let pageDoc = null;
            if (pageId && mongoose.Types.ObjectId.isValid(pageId)) {
                pageDoc = await WebsitePage.findOne({ _id: pageId, projectId }).lean();
            }
            if (!pageDoc && pageUrl) {
                pageDoc = await findWebsitePageByPublicUrl(projectId, pageUrl);
            }
            if (!pageDoc) {
                return res.status(404).json({ message: "Website page not found for SEO update" });
            }

            const entry = await upsertWebsitePageSeo({
                projectId,
                pageId: String(pageDoc._id),
                patch: {
                    meta_title: metaTitle,
                    meta_description: metaDescription,
                    meta_keywords: metaKeywords,
                    meta_image: metaImage,
                    canonical_url: canonicalUrl,
                    ...rest,
                },
            });

            return res.status(200).json({
                message: "SEO data updated successfully!",
                data: seoEntryToLegacyApi(entry, pageDoc),
            });
        } catch (error) {
            console.error("Error in updateSeoSettings:", error);
            return res.status(500).json({ message: "An error occurred while updating SEO settings." });
        }
    },

    getWebsitePageSeo: async (req, res) => {
        try {
            const { projectId, pageId } = req.params;
            if (!projectId || !pageId) {
                return res.status(400).json({ message: "projectId and pageId are required" });
            }
            const pageDoc = await WebsitePage.findOne({ _id: pageId, projectId }).lean();
            if (!pageDoc) {
                return res.status(404).json({ message: "Page not found" });
            }
            // Prefer complete SEO; fall back to raw stored entry (e.g. schemas-only drafts)
            const entry =
                (await getSeoForWebsitePage(pageDoc)) || getActiveSeoFromPage(pageDoc);
            return res.status(200).json({
                message: "SEO settings fetched",
                data: entry
                    ? { ...seoEntryToLegacyApi(entry, pageDoc), seo: seoEntryToGeniebuild(entry, pageDoc) }
                    : null,
            });
        } catch (error) {
            console.error("Error in getWebsitePageSeo:", error);
            return res.status(500).json({ message: "Failed to fetch page SEO" });
        }
    },

    updateWebsitePageSeo: async (req, res) => {
        try {
            const { projectId, pageId, seo, ...flat } = req.body;
            if (!projectId || !pageId) {
                return res.status(400).json({ message: "projectId and pageId are required" });
            }
            const patch =
                seo && typeof seo === "object"
                    ? geniebuildToSeoEntry(seo)
                    : pickSeoFields(flat);
            const pageDoc = await WebsitePage.findOne({ _id: pageId, projectId }).lean();
            const entry = await upsertWebsitePageSeo({ projectId, pageId, patch });
            return res.status(200).json({
                message: "Page SEO updated",
                data: {
                    ...seoEntryToLegacyApi(entry, pageDoc),
                    seo: seoEntryToGeniebuild(entry, pageDoc),
                },
            });
        } catch (error) {
            console.error("Error in updateWebsitePageSeo:", error);
            return res.status(500).json({ message: error.message || "Failed to update page SEO" });
        }
    },

    generateWebsitePageSeo: async (req, res) => {
        try {
            const { projectId, pageId, locationName, serviceName } = req.body;
            if (!projectId || !pageId) {
                return res.status(400).json({ message: "projectId and pageId are required" });
            }
            const [project, page] = await Promise.all([
                UserProject.findById(projectId).lean(),
                WebsitePage.findOne({ _id: pageId, projectId }).lean(),
            ]);
            if (!project || !page) {
                return res.status(404).json({ message: "Project or page not found" });
            }
            const { shouldGenerateSeo, getSeoMode } = require("../seoprompts");
            if (!shouldGenerateSeo()) {
                return res.status(400).json({
                    message: `SEO generation disabled (seo_mode=${getSeoMode()}). Set seo_mode=1 or 2 in backend .env`,
                });
            }
            const entry = await generatePageSeoWithAI({
                project,
                page,
                locationName: locationName || "",
                serviceName: serviceName || "",
                userId: req.user?._id,
                projectId,
                pageId,
            });
            if (!entry) {
                return res.status(400).json({ message: "SEO generation skipped" });
            }
            return res.status(200).json({
                message: "SEO generated successfully",
                data: {
                    ...seoEntryToLegacyApi(entry, page),
                    seo: seoEntryToGeniebuild(entry, page),
                },
            });
        } catch (error) {
            console.error("Error in generateWebsitePageSeo:", error);
            return res.status(500).json({ message: error.message || "Failed to generate SEO" });
        }
    },

    upsertWebsitePageSeoSchema: async (req, res) => {
        try {
            const { projectId, pageId, schema } = req.body;
            if (!projectId || !pageId || !schema) {
                return res.status(400).json({ message: "projectId, pageId, and schema are required" });
            }
            const pageDoc = await WebsitePage.findOne({ _id: pageId, projectId }).lean();
            if (!pageDoc) return res.status(404).json({ message: "Page not found" });
            const entry = await upsertPageSeoSchema({ projectId, pageId, schema });
            return res.status(200).json({
                message: "Schema saved",
                data: {
                    ...seoEntryToLegacyApi(entry, pageDoc),
                    seo: seoEntryToGeniebuild(entry, pageDoc),
                },
            });
        } catch (error) {
            console.error("Error in upsertWebsitePageSeoSchema:", error);
            return res.status(500).json({ message: error.message || "Failed to save schema" });
        }
    },

    deleteWebsitePageSeoSchema: async (req, res) => {
        try {
            const { projectId, pageId, schemaId } = req.body;
            if (!projectId || !pageId || !schemaId) {
                return res.status(400).json({ message: "projectId, pageId, and schemaId are required" });
            }
            const pageDoc = await WebsitePage.findOne({ _id: pageId, projectId }).lean();
            if (!pageDoc) return res.status(404).json({ message: "Page not found" });
            const entry = await deletePageSeoSchema({ projectId, pageId, schemaId });
            return res.status(200).json({
                message: "Schema deleted",
                data: {
                    ...seoEntryToLegacyApi(entry, pageDoc),
                    seo: seoEntryToGeniebuild(entry, pageDoc),
                },
            });
        } catch (error) {
            console.error("Error in deleteWebsitePageSeoSchema:", error);
            return res.status(500).json({ message: error.message || "Failed to delete schema" });
        }
    },

    setWebsitePageSeoSchemaEnabled: async (req, res) => {
        try {
            const { projectId, pageId, schemaId, enabled } = req.body;
            if (!projectId || !pageId || !schemaId || typeof enabled === "undefined") {
                return res.status(400).json({
                    message: "projectId, pageId, schemaId, and enabled are required",
                });
            }
            const pageDoc = await WebsitePage.findOne({ _id: pageId, projectId }).lean();
            if (!pageDoc) return res.status(404).json({ message: "Page not found" });
            const entry = await setPageSeoSchemaEnabled({
                projectId,
                pageId,
                schemaId,
                enabled,
            });
            return res.status(200).json({
                message: "Schema updated",
                data: {
                    ...seoEntryToLegacyApi(entry, pageDoc),
                    seo: seoEntryToGeniebuild(entry, pageDoc),
                },
            });
        } catch (error) {
            console.error("Error in setWebsitePageSeoSchemaEnabled:", error);
            return res.status(500).json({ message: error.message || "Failed to update schema" });
        }
    },

    regenerateWebsitePageSeoSchemas: async (req, res) => {
        try {
            const { projectId, pageId } = req.body;
            if (!projectId || !pageId) {
                return res.status(400).json({ message: "projectId and pageId are required" });
            }
            const pageDoc = await WebsitePage.findOne({ _id: pageId, projectId }).lean();
            if (!pageDoc) return res.status(404).json({ message: "Page not found" });
            const entry = await regeneratePageSeoSchemas({ projectId, pageId });
            return res.status(200).json({
                message: "Schemas rebuilt",
                data: {
                    ...seoEntryToLegacyApi(entry, pageDoc),
                    seo: seoEntryToGeniebuild(entry, pageDoc),
                },
            });
        } catch (error) {
            console.error("Error in regenerateWebsitePageSeoSchemas:", error);
            return res.status(500).json({ message: error.message || "Failed to rebuild schemas" });
        }
    },

    /**
     * Regenerate SEO for all pages with missing/failed SEO in a project.
     * Also ensures homepage is published.
     */
    regenerateAllMissingSeo: async (req, res) => {
        try {
            const { projectId } = req.body;
            if (!projectId) {
                return res.status(400).json({ message: "projectId is required" });
            }

            const project = await UserProject.findById(projectId).lean();
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            // First, ensure homepage and core pages are published
            const corePageNames = ["home", "contact", "about", "services"];
            const fixedPublishedResult = await WebsitePage.updateMany(
                { projectId, name: { $in: corePageNames }, isPublished: false },
                { $set: { isPublished: true } }
            );
            console.log(`[regenerateAllMissingSeo] Fixed ${fixedPublishedResult.modifiedCount} core page(s) isPublished status`);

            // Then regenerate SEO for all pages with missing/incomplete SEO
            const result = await generateMissingSeoForAllProjectPages({
                projectId,
                userId: req.user?._id,
                project,
            });

            return res.status(200).json({
                message: "SEO regeneration completed",
                data: {
                    corePagesFixes: fixedPublishedResult.modifiedCount,
                    totalPages: result.total,
                    created: result.created,
                    alreadyComplete: result.alreadyComplete,
                    failed: result.failed,
                    stillMissing: result.stillMissing,
                    errors: result.errors,
                },
            });
        } catch (error) {
            console.error("Error in regenerateAllMissingSeo:", error);
            return res.status(500).json({ message: error.message || "Failed to regenerate SEO" });
        }
    },

    getSeoSettings: async (req, res) => {
        try {
            let { pageUrl, projectId } = req.body;
            if (!projectId) {
                return res.status(400).json({ message: "Project ID is required!" });
            }
            if (!pageUrl) {
                return res.status(400).json({ message: "pageUrl is required!" });
            }
            if (!String(pageUrl).startsWith("/")) pageUrl = "/" + pageUrl;
            if (pageUrl === "/home") pageUrl = "/";

            const pageDoc = await findWebsitePageByPublicUrl(projectId, pageUrl);

            if (!pageDoc) {
                return res.status(404).json({ message: "Page not found for this URL" });
            }

            const entry = await getSeoForWebsitePage(pageDoc);
            if (!entry) {
                return res.status(404).json({ message: "SEO data not found for this page & project!" });
            }

            return res.status(200).json({ data: seoEntryToLegacyApi(entry, pageDoc) });
        } catch (error) {
            console.error("Error in getSeoSettings:", error);
            return res.status(500).json({ message: "An error occurred while fetching SEO settings." });
        }
    },

    // Delete SEO data for a specific page
    deleteSeoSettings: async (req, res) => {
        try {
            const { pageUrl } = req.params;
            const { projectId } = req.query;
            if (!projectId) {
                return res.status(400).json({ message: "Project ID is required!" });
            }

            const pageDoc = await findWebsitePageByPublicUrl(projectId, `/${pageUrl || ""}`);
            if (!pageDoc) {
                return res.status(404).json({ message: "SEO data not found!" });
            }

            await WebsitePage.updateOne({ _id: pageDoc._id }, { $set: { seoSettings: [] } });

            return res.status(200).json({ message: "SEO data deleted successfully!" });
        } catch (error) {
            console.error("Error in deleteSeoSettings:", error);
            return res.status(500).json({ message: "An error occurred while deleting SEO settings." });
        }
    },

    // ALL HOsting APIs
    addHosting: async (req, res) => {
        try {
            let { connectionType, connectionConfig } = req.body;

            // Validate the input fields
            if (!connectionType || !connectionConfig) {
                return res.status(400).json({ message: 'Missing required fields.' });
            }

            // If connectionConfig is a string, parse it to JSON
            if (typeof connectionConfig === 'string') {
                connectionConfig = JSON.parse(connectionConfig);
            }

            // Test the connection based on the type
            switch (connectionType) {
                case 'ftp':
                    await testFTPConnection(connectionConfig);
                    break;
                case 'ssh':
                    await testSSHConnection(connectionConfig); // Test SSH for both SSH and VPS
                    break;
                case 'cpanel':
                    await testCpanelConnection(connectionConfig);
                    break;
                case 'vps': // Use SSH test for VPS
                    await testSSHConnection(connectionConfig);  // Use the same function for VPS
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid connectionType' });
            }

            const userId = req.user.userId;
            const configString = JSON.stringify(connectionConfig);

            // Check for an existing connection in the database
            const existing = await HostingConnection.findOne({
                userId,
                connectionType,
                connectionConfig: configString
            });

            if (existing) {
                // If the connection already exists, update its status and updatedAt fields
                existing.status = 'success';
                existing.updatedAt = new Date();
                await existing.save();

                return res.status(200).json({
                    message: 'Connection already exists. Timestamp and status updated.',
                    data: existing
                });
            }

            // If the connection does not exist, create a new entry
            const saved = await HostingConnection.create({
                userId,
                connectionType,
                connectionConfig: configString,
                status: 'success'
            });

            // Create notification for super admins (only for own server types: vps, ssh, ftp, sftp)
            try {
                const ownServerTypes = ['vps', 'ssh', 'ftp', 'sftp'];
                if (ownServerTypes.includes(connectionType)) {
                    const user = await Users.findById(userId).select('email username').lean();
                    await Notification.create({
                        userFromId: userId,
                        isSuperAdminNotification: true,
                        message: `${user?.username || user?.email || 'User'} registered new ${connectionType.toUpperCase()} hosting on their own server`,
                        type: 'hosting_added',
                        relatedId: saved._id
                    });
                }
            } catch (notifError) {
                console.error('Error creating hosting notification:', notifError);
            }

            return res.status(200).json({
                message: 'Hosting connection added successfully.',
                data: saved
            });

        } catch (error) {
            console.error('Connection failed:', error);

            try {
                // Only log the failure without using 'unknown' or any extra fields
                await HostingConnection.create({
                    userId: req.user?.userId || null,
                    connectionType: req.body.connectionType, // Use the provided connectionType from the request
                    connectionConfig: typeof req.body.connectionConfig === 'string'
                        ? req.body.connectionConfig
                        : JSON.stringify(req.body.connectionConfig),
                    status: 'failed'
                });
            } catch (logError) {
                console.error('Failed to log failed hosting:', logError.message);
            }

            return res.status(500).json({
                message: 'Failed to add hosting connection.',
                error: error.message
            });
        }
    },

    getMyHostings: async (req, res) => {
        try {
            const hostings = await HostingConnection.find({
                userId: req.user.userId
            }).sort({ createdAt: -1 });

            console.log(hostings, "hostings")

            return res.status(200).json({
                message: 'Hosting connections fetched.',
                data: hostings
            });
        } catch (error) {
            console.error('Error in getMyHostings:', error);
            return res.status(500).json({ message: 'Failed to fetch hostings.', error: error.message });
        }
    }
    ,

    updateHosting: async (req, res) => {
        try {
            const { id } = req.params;
            let { connectionType, connectionConfig } = req.body;

            if (typeof connectionConfig === 'string') {
                connectionConfig = JSON.parse(connectionConfig);
            }

            const updateFields = {
                ...(connectionType && { connectionType }),
                ...(connectionConfig && { connectionConfig: JSON.stringify(connectionConfig) })
            };

            const updated = await HostingConnection.findByIdAndUpdate(id, updateFields, { new: true });

            if (!updated) {
                return res.status(404).json({ message: 'Hosting not found.' });
            }

            return res.status(200).json({
                message: 'Hosting connection updated successfully.',
                data: updated
            });

        } catch (error) {
            console.error('Error in updateHosting:', error);
            return res.status(500).json({ message: 'Failed to update hosting.', error: error.message });
        }
    }
    ,
    deleteHosting: async (req, res) => {
        try {
            const { id } = req.params;

            const deleted = await HostingConnection.findByIdAndDelete(id);

            if (!deleted) {
                return res.status(404).json({ message: 'Hosting not found.' });
            }

            return res.status(200).json({ message: 'Hosting connection deleted successfully.' });

        } catch (error) {
            console.error('Error in deleteHosting:', error);
            return res.status(500).json({ message: 'Failed to delete hosting.', error: error.message });
        }
    }
    ,

    setCurrentHostingForProject: async (req, res) => {
        try {
            const { projectId, hostingId } = req.body;

            if (!projectId || !hostingId) {
                return res.status(400).json({ message: 'Missing required fields (projectId or hostingId).' });
            }

            // Find the project by projectId
            const project = await UserProject.findById(projectId);

            if (!project) {
                return res.status(404).json({ message: 'Project not found.' });
            }

            // Update the hostingId for the project
            project.hostingId = hostingId;
            const updatedProject = await project.save();

            return res.status(200).json({
                message: 'Project hosting updated successfully.',
                data: updatedProject
            });

        } catch (error) {
            console.error('Error in setCurrentHostingForProject:', error);
            return res.status(500).json({
                message: 'Failed to update project hosting.',
                error: error.message
            });
        }
    }
    ,
    getCurrentHostingForProject: async (req, res) => {
        try {
            const { projectId } = req.body;

            if (!projectId) {
                return res.status(400).json({ message: 'Missing projectId.' });
            }

            // Find the project by projectId and only select the hostingId field
            const project = await UserProject.findById(projectId).select('hostingId');

            if (!project) {
                return res.status(404).json({ message: 'Project not found.' });
            }

            // Return the hostingId of the project
            return res.status(200).json({
                message: 'Current hosting fetched successfully.',
                data: { hostingId: project.hostingId }
            });

        } catch (error) {
            console.error('Error in getCurrentHostingForProject:', error);
            return res.status(500).json({
                message: 'Failed to fetch current hosting for project.',
                error: error.message
            });
        }
    },

    getProjectConfiguration: async (req, res) => {
        try {
            const { projectId, hostingId, environment } = req.body;

            if (!projectId || !hostingId) {
                return res.status(400).json({ message: 'Missing required fields: projectId or hostingId.' });
            }

            const finalEnvironment = environment || 'development'; // Default to 'development' if no environment is provided

            // Fetch configurations for the given projectId and hostingId
            const configurations = await ProjectDeployment.findOne({
                projectId,
                hostingId,
                environment: finalEnvironment
            });

            // If no configurations are found, send a message saying so
            if (!configurations) {
                return res.status(404).json({ message: 'No configurations found for the given projectId and hostingId.' });
            }

            // Return the configurations if found
            return res.status(200).json({
                message: 'Configurations fetched successfully.',
                data: configurations
            });
        } catch (error) {
            console.error('Error in getProjectConfiguration:', error);
            return res.status(500).json({
                message: 'Failed to fetch configurations.',
                error: error.message
            });
        }
    }
    ,

    linkProjectToHosting: async (req, res) => {
        try {
            const { hostingId, projectId, domainName, rootPath, environment } = req.body;

            if (!hostingId || !projectId || !domainName) {
                return res.status(400).json({ message: 'Missing required fields.' });
            }

            const finalRootPath = rootPath || '/';
            const finalEnvironment = environment || 'development';

            // Check for duplicate project deployment
            const existing = await ProjectDeployment.findOne({
                hostingId,
                projectId,
                domainName,
                rootPath: finalRootPath,
                environment: finalEnvironment
            });

            if (existing) {
                existing.updatedAt = new Date();
                await existing.save();

                // Update the hostingId in UserProject
                const updatedProject = await UserProject.findByIdAndUpdate(
                    projectId,
                    { hostingId }, // Update the hostingId field
                    { new: true } // To return the updated project
                );

                return res.status(200).json({
                    message: 'Project already linked. Timestamp updated and hostingId updated in UserProject.',
                    data: existing,
                    updatedProject: updatedProject
                });
            }

            // Create new project deployment if not found
            const saved = await ProjectDeployment.create({
                hostingId,
                projectId,
                domainName,
                rootPath: finalRootPath,
                environment: finalEnvironment
            });

            // Update the hostingId in UserProject
            const updatedProject = await UserProject.findByIdAndUpdate(
                projectId,
                { hostingId },
                { new: true } // To return the updated project
            );

            return res.status(200).json({
                message: 'Project linked to hosting successfully. HostingId updated in UserProject.',
                data: saved,
                updatedProject: updatedProject
            });

        } catch (error) {
            console.error('Error in linkProjectToHosting:', error);
            return res.status(500).json({ message: 'Failed to link project.', error: error.message });
        }
    },

    getProjectDeploymentId: async (req, res) => {
        try {
            const { projectId, hostingId } = req.body;

            if (!projectId || !hostingId) {
                return res.status(400).json({ message: 'Missing projectId or hostingId.' });
            }

            console.log('Step 1: Searching for ProjectDeployment...');
            console.log(`Received projectId: ${projectId}, hostingId: ${hostingId}`);

            const deployment = await ProjectDeployment.findOne({ projectId, hostingId });

            if (!deployment) {
                console.log('Project deployment not found');
                return res.status(404).json({ message: 'Project deployment not found.' });
            }

            console.log('Project deployment found:', deployment._id);

            return res.status(200).json({
                message: 'Project deployment found.',
                data: {
                    projectDeploymentId: deployment._id,
                    domainName: deployment.domainName,
                    rootPath: deployment.rootPath,
                    environment: deployment.environment
                }
            });

        } catch (error) {
            console.error('Error in getProjectDeploymentId:', error);
            return res.status(500).json({ message: 'Failed to fetch project deployment.', error: error.message });
        }
    },


    getLinkedHostings: async (req, res) => {
        try {
            const { projectId } = req.params;

            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required.' });
            }

            const deployments = await ProjectDeployment.find({ projectId }).populate('hostingId');

            return res.status(200).json({
                message: 'Linked hostings/domains fetched.',
                data: deployments
            });

        } catch (error) {
            console.error('Error in getLinkedHostings:', error);
            return res.status(500).json({ message: 'Failed to fetch linked hostings.', error: error.message });
        }
    }
    ,
    updateLinkedHosting: async (req, res) => {
        try {
            const { id } = req.params;
            const { domainName, rootPath, environment } = req.body;

            const updateFields = {};
            if (domainName) updateFields.domainName = domainName;
            if (rootPath) updateFields.rootPath = rootPath;
            if (environment) updateFields.environment = environment;

            const updated = await ProjectDeployment.findByIdAndUpdate(id, updateFields, { new: true });

            if (!updated) {
                return res.status(404).json({ message: 'Linked hosting not found.' });
            }

            return res.status(200).json({
                message: 'Linked hosting updated successfully.',
                data: updated
            });

        } catch (error) {
            console.error('Error in updateLinkedHosting:', error);
            return res.status(500).json({ message: 'Failed to update linked hosting.', error: error.message });
        }
    },

    deleteLinkedHosting: async (req, res) => {
        try {
            const { id } = req.params;

            const deleted = await ProjectDeployment.findByIdAndDelete(id);

            if (!deleted) {
                return res.status(404).json({ message: 'Linked hosting not found.' });
            }

            return res.status(200).json({ message: 'Linked hosting deleted successfully.' });

        } catch (error) {
            console.error('Error in deleteLinkedHosting:', error);
            return res.status(500).json({ message: 'Failed to delete linked hosting.', error: error.message });
        }
    },

    uploadToHosting: async (req, res) => {
        try {
            const { projectDeploymentId } = req.body;

            if (!projectDeploymentId || !req.files || !req.files.zipFile) {
                return res.status(400).json({ message: 'Missing projectDeploymentId or zipFile.' });
            }

            const zipFile = req.files.zipFile;

            const tempZipPath = path.join(__dirname, '..', 'uploads', `${Date.now()}-${zipFile.name}`);
            await zipFile.mv(tempZipPath);

            const extractDir = tempZipPath.replace('.zip', '');
            await fs.promises.mkdir(extractDir, { recursive: true });
            await fs.createReadStream(tempZipPath)
                .pipe(unzipper.Extract({ path: extractDir }))
                .promise();

            const deployment = await ProjectDeployment.findById(projectDeploymentId);
            if (!deployment) return res.status(404).json({ message: 'Project deployment not found.' });

            const hosting = await HostingConnection.findById(deployment.hostingId);
            if (!hosting) return res.status(404).json({ message: 'Hosting connection not found.' });

            const config = JSON.parse(hosting.connectionConfig);
            const rootPath = deployment.rootPath || '/';

            if (hosting.connectionType === 'ftp') {
                const client = new ftp.Client();
                await client.access({
                    host: config.host,
                    user: config.username,
                    password: config.password,
                    port: config.port || 21,
                    secure: config.secure || false
                });
                await uploadFolderFTP(client, extractDir, rootPath);
                client.close();

            } else if (hosting.connectionType === 'ssh') {
                const sftp = new SftpClient();
                await sftp.connect({
                    host: config.host,
                    port: config.port || 22,
                    username: config.username,
                    password: config.password
                });
                await uploadFolderSFTP(sftp, extractDir, rootPath);
                await sftp.end();

            } else if (hosting.connectionType === 'cpanel') {

                await uploadToCPanel(config, extractDir, deployment.rootPath || '/public_html');


            } else {
                return res.status(400).json({ message: 'Only FTP, SSH and cPanel are supported for upload.' });
            }

            fs.unlinkSync(tempZipPath);
            fs.rmSync(extractDir, { recursive: true, force: true });

            return res.status(200).json({ message: 'Upload and deployment successful.' });

        } catch (error) {
            console.error('Upload error:', error);
            return res.status(500).json({ message: 'Upload failed.', error: error.message });
        }
    },

    browseHostingDirectories: async (req, res) => {
        let { hostingId, path: browsePath } = req.body;

        // Handle empty path or "/"
        if (browsePath === "" || browsePath === "/") {
            browsePath = undefined; // Set path to undefined or omit it from the operations
        }

        console.log(browsePath);

        console.log(req.body, "browseHostingDirectories console");

        if (!hostingId) {
            return res.status(400).json({ message: 'Missing hostingId.' });
        }

        try {
            const hosting = await HostingConnection.findById(hostingId);
            if (!hosting) {
                return res.status(404).json({ message: 'Hosting not found.' });
            }

            const config = JSON.parse(hosting.connectionConfig);

            if (hosting.connectionType === 'ftp') {
                const client = new ftp.Client();
                await client.access({
                    host: config.host,
                    user: config.username,
                    password: config.password,
                    port: config.port || 21,
                    secure: config.secure || false
                });

                // If browsePath is undefined, use the default root path
                browsePath = browsePath || '/';
                const list = await client.list(browsePath);
                const directories = list.filter(item => item.isDirectory).map(dir => ({
                    name: dir.name,
                    fullPath: path.posix.join(browsePath, dir.name) // Using path.posix
                }));

                client.close();

                return res.status(200).json({
                    message: 'Directories fetched successfully.',
                    data: directories
                });

            } else if (hosting.connectionType === 'ssh' || hosting.connectionType === "vps") {
                const sftp = new SftpClient();
                await sftp.connect({
                    host: config.host,
                    port: config.port || 22,
                    username: config.username,
                    password: config.password,
                    privateKey: config.privateKey // optional if provided
                });

                // If browsePath is undefined, use the default root path
                browsePath = browsePath || '/';
                const list = await sftp.list(browsePath);
                const directories = list.filter(item => item.type === 'd').map(dir => ({
                    name: dir.name,
                    fullPath: path.posix.join(browsePath, dir.name) // Using path.posix
                }));

                await sftp.end();

                return res.status(200).json({
                    message: 'Directories fetched successfully.',
                    data: directories
                });

            } else {
                return res.status(400).json({ message: 'Directory browsing is supported only for FTP and SSH.' });
            }

        } catch (error) {
            console.error('Error in browseHostingDirectories:', error);
            return res.status(500).json({
                message: 'Failed to browse directories.',
                error: error.message
            });
        }
    },

    /** Build SiteNextJS static export only (no hosting upload). Used from project Deploy page. */
    buildStaticSite: async (req, res) => {
        const io = req.app.get('io');
        const { projectId, domainName } = req.body;

        if (!projectId) {
            return res.status(400).json({ message: 'projectId is required.' });
        }
        const domainForBuild = String(domainName || '').trim().replace(/^www\./i, '');
        if (!domainForBuild) {
            return res.status(400).json({ message: 'Select a domain before building.' });
        }

        const buildKey = buildKeyForProject(projectId);

        await writeStaticBuildStatus(buildKey, {
            status: 'building',
            phase: 'queued',
            projectId: String(projectId),
            domainName: domainForBuild,
            message: 'Build queued…',
        });

        res.status(200).json({
            message: 'Static build started.',
            projectId,
            domainName: domainForBuild,
            buildKey,
        });

        (async () => {
            try {
                if (io) {
                    io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                        projectId,
                        status: 'building',
                    });
                }

                const artifactPath = await deployNextStaticApp(buildKey, projectId, domainForBuild);

                try {
                    await UserProject.findByIdAndUpdate(projectId, { domainName: domainForBuild });
                } catch (e) {
                    console.warn('[buildStaticSite] could not update project domain:', e.message);
                }

                if (io) {
                    io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                        projectId,
                        status: 'success',
                        artifactPath,
                        buildOnly: true,
                    });
                }
                console.log('[buildStaticSite] Done:', artifactPath);
            } catch (err) {
                console.error('[buildStaticSite] Failed:', err);
                try {
                    await writeStaticBuildStatus(buildKey, {
                        status: 'build_failed',
                        phase: 'error',
                        error: err?.message || String(err),
                        message: err?.message || String(err),
                    });
                } catch (_) { /* ignore */ }
                if (io) {
                    io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                        projectId,
                        status: 'build_failed',
                        error: err?.message || String(err),
                        buildOnly: true,
                    });
                }
            }
        })();
    },

    getStaticBuildStatus: async (req, res) => {
        try {
            const projectId = req.query.projectId || req.body?.projectId;
            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }
            const data = await readStaticBuildStatus(String(projectId).trim());
            return res.status(200).json(data);
        } catch (err) {
            console.error('[getStaticBuildStatus]', err);
            return res.status(500).json({ message: err.message || 'Failed to read build status' });
        }
    },

    // AdminController.js
    uploadToHostingFromBuild: async (req, res) => {
        const io = req.app.get('io');

        const { projectDeploymentId, projectId, domainName: bodyDomain } = req.body;

        if (!projectDeploymentId || !projectId) {
            console.log("[Error] Missing projectDeploymentId or projectId in request body.");
            return res.status(400).json({ message: 'Missing projectDeploymentId or projectId.' });
        }

        let domainForBuild = String(bodyDomain || '').trim().replace(/^www\./i, '');
        if (!domainForBuild) {
            try {
                const dep = await ProjectDeployment.findById(projectDeploymentId).select('domainName').lean();
                domainForBuild = String(dep?.domainName || '').trim().replace(/^www\./i, '');
            } catch (_) { /* ignore */ }
        }
        if (!domainForBuild) {
            return res.status(400).json({
                message: 'domainName is required. Choose a domain from your Domains list before deploying.',
            });
        }

        // ✅ Immediately respond to the client
        res.status(200).json({ message: 'Deployment started.', domainName: domainForBuild });

        // 🚀 Continue deployment in the background
        (async () => {
            try {
                console.log('Step 1: Starting deployment process...');
                console.log(`Received projectDeploymentId: ${projectDeploymentId}, projectId: ${projectId}`);

                await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "building" });
                io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                    projectId,
                    status: "building",
                });

                let distPath;
                try {
                    const deployDomain = domainForBuild;
                    distPath = await deployNextStaticApp(projectDeploymentId, projectId, deployDomain);
                    console.log('Step 2: SiteNextJS static build completed at:', distPath);

                    await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, {
                        deploymentStatus: "uploading",
                        domainName: deployDomain,
                    });

                    io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                        projectId,
                        status: "uploading",
                        artifactPath: distPath,
                    });
                } catch (buildErr) {
                    await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "build_failed" });
                    io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                        projectId,
                        status: "build_failed",
                        error: buildErr?.message || String(buildErr),
                    });
                    console.error('[Error] During build/deployNextStaticApp:', buildErr);
                    return;
                }

                let deployment;
                try {
                    deployment = await ProjectDeployment.findById(projectDeploymentId);
                    if (!deployment) {
                        console.log("[Error] Project deployment not found for ID:", projectDeploymentId);
                        return;
                    }
                    console.log("Step 3: ProjectDeployment found:", deployment._id);
                } catch (depErr) {
                    console.error('[Error] During ProjectDeployment.findById:', depErr);
                    return;
                }

                let hosting;
                try {
                    hosting = await HostingConnection.findById(deployment.hostingId);
                    if (!hosting) {
                        console.log("[Error] Hosting connection not found for ID:", deployment.hostingId);
                        return;
                    }
                    console.log("Step 4: HostingConnection found:", hosting._id);
                } catch (hostErr) {
                    console.error('[Error] During HostingConnection.findById:', hostErr);
                    return;
                }

                let config, rootPath;
                try {
                    config = JSON.parse(hosting.connectionConfig);
                    // Calculate rootPath from domainName to ensure it's always correct
                    // This fixes the issue where rootPath might point to old domain's directory
                    if (deployment.domainName && hosting.connectionType === 'vps') {
                        // For VPS, use the standard webroot path: /var/www/ai/{domainName}
                        const WEBROOT_BASE = "/var/www/ai";
                        rootPath = path.join(WEBROOT_BASE, deployment.domainName);
                    } else {
                        // For other hosting types, use stored rootPath or default
                        rootPath = deployment.rootPath || '/';
                    }
                    console.log("Step 5: Hosting config and rootPath loaded.", { rootPath, domainName: deployment.domainName });
                } catch (confErr) {
                    console.error('[Error] Parsing connectionConfig:', confErr);
                    return;
                }

                // Step 6: Upload based on connection type
                try {
                    console.log('Step 6: Uploading dist folder content to hosting...');

                    if (hosting.connectionType === 'ftp') {
                        const client = new ftp.Client();
                        try {
                            await client.access({
                                host: config.host,
                                user: config.username,
                                password: config.password,
                                secure: config.secure || false,
                                port: config.port || 21
                            });
                            console.log("FTP connection established.");
                            await uploadFolderFTP(client, distPath, rootPath);
                            console.log("FTP upload complete.");
                        } catch (ftpErr) {
                            console.error('[Error] During FTP upload:', ftpErr);
                            await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "upload_failed" });
                            io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                                projectId,
                                status: "upload_failed",
                            });
                            return;
                        } finally {
                            client.close();
                        }

                    } else if (hosting.connectionType === 'ssh' || hosting.connectionType === 'vps') {
                        const sftp = new SftpClient();
                        try {
                            await sftp.connect({
                                host: config.host,
                                port: config.port || 22,
                                username: config.username,
                                password: config.password
                            });
                            console.log("SFTP connection established.");
                            await uploadFolderSFTP(sftp, distPath, rootPath);
                            console.log("SFTP upload complete.");
                        } catch (sftpErr) {
                            console.error('[Error] During SFTP upload:', sftpErr);
                            await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "upload_failed" });
                            io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                                projectId,
                                status: "upload_failed",
                            });
                            return;
                        } finally {
                            await sftp.end().catch(() => { });
                        }

                    } else if (hosting.connectionType === 'cpanel') {
                        try {
                            await uploadFolderCPanel(config, distPath, rootPath);
                            console.log("cPanel upload complete.");
                        } catch (cpanelErr) {
                            console.error('[Error] During cPanel upload:', cpanelErr);
                            await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "upload_failed" });
                            io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                                projectId,
                                status: "upload_failed",
                            });
                            return;
                        }

                    } else {
                        console.log("[Error] Unsupported hosting type:", hosting.connectionType);
                        return;
                    }

                } catch (uploadErr) {
                    console.error('[Error] During upload process:', uploadErr);
                    await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "upload_failed" });
                    io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                        projectId,
                        status: "upload_failed",
                    });
                    return;
                }

                // Step 7: Cleanup
                try {
                    await fs.remove(path.resolve(__dirname, '..', 'deploy-temp', projectDeploymentId));
                    console.log("Temporary folder deleted after deployment.");
                } catch (deleteErr) {
                    console.warn('[Warning] Temp folder deletion failed:', deleteErr);
                }

                // Final Success
                await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "success" });
                io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                    projectId,
                    status: "success",
                    artifactPath: distPath,
                });
                console.log("Step 8: Build, upload, and deployment successful!");

                // Create success notification for user
                try {
                    const project = await userProjects.findById(projectId).select('userId projectName domainName').lean();
                    if (project && project.userId) {
                        await Notification.create({
                            userToId: project.userId,
                            message: `Your project "${project.projectName}" is now live${project.domainName ? ' on ' + project.domainName : ''}!`,
                            type: 'project_live',
                            relatedId: projectId
                        });
                    }
                } catch (notifError) {
                    console.error('Error creating project live notification:', notifError);
                }

            } catch (fatalError) {
                console.error('[Fatal Error] Unexpected failure during deployment:', fatalError);
                await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "upload_failed" });
                io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                    projectId,
                    status: "upload_failed",
                });

                // Create failure notification for user
                try {
                    const project = await userProjects.findById(projectId).select('userId projectName').lean();
                    if (project && project.userId) {
                        await Notification.create({
                            userToId: project.userId,
                            message: `Your project "${project.projectName}" failed to publish. Please check the deployment logs.`,
                            type: 'project_failed',
                            relatedId: projectId
                        });
                    }
                } catch (notifError) {
                    console.error('Error creating project failed notification:', notifError);
                }
            }
        })();
    },



    // Assume uploadFileCPanel is defined similarly to uploadFolderCPanel but for a single file
    // If not, implement it based on cPanel API or treat as FTP

    updateHostingSitemap: async (req, res) => {
        const io = req.app.get('io');
        const { projectId } = req.body;

        if (!projectId) {
            return res.status(400).json({ message: 'projectId is required' });
        }




        try {
            await axios.post(
                'https://apis.smartlybuild.dev/admin/v1/generateSitemap',
                { projectId }, // JSON body
                {

                    timeout: 10000
                }
            );
        } catch (e) {
            console.warn('Generate sitemap update call failed from updatehostingsitemap api:', e?.response?.data || e.message);
        }


        // Immediately respond to the client
        res.status(200).json({ message: 'Sitemap update started.' });

        // Continue in the background
        (async () => {
            try {
                // Fetch UserProject details
                const project = await UserProject.findById(projectId).select('hostingId siteHostRootPath siteMapFilePath');
                if (!project) {
                    console.log("[Error] Project not found for ID:", projectId);
                    io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                    return;
                }
                if (!project.hostingId) {
                    console.log("[Error] No hostingId found for project:", projectId);
                    io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                    return;
                }

                // Update ProjectDeployment status
                const deployment = await ProjectDeployment.findOne({ projectId, deploymentStatus: 'success' });
                if (deployment) {
                    await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'uploading' });
                    io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'uploading' });
                }

                // Fetch HostingConnection
                const hosting = await HostingConnection.findById(project.hostingId);
                if (!hosting) {
                    console.log("[Error] Hosting connection not found for ID:", project.hostingId);
                    io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                    return;
                }

                let config;
                try {
                    config = JSON.parse(hosting.connectionConfig);
                } catch (parseErr) {
                    console.error('[Error] Parsing connectionConfig:', parseErr);
                    io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                    if (deployment) {
                        await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'upload_failed' });
                    }
                    return;
                }

                // Calculate rootPath from domainName for VPS to ensure it's always correct
                let rootPath;
                if (deployment && deployment.domainName && hosting.connectionType === 'vps') {
                    // For VPS, use the standard webroot path: /var/www/ai/{domainName}
                    const WEBROOT_BASE = "/var/www/ai";
                    rootPath = path.join(WEBROOT_BASE, deployment.domainName);
                } else {
                    // For other hosting types, use stored siteHostRootPath or default
                    rootPath = project.siteHostRootPath || '/';
                }

                // Local sitemap path
                const sitemapRelativePath = project.siteMapFilePath ? project.siteMapFilePath.replace(/^\//, '') : `sitemaps/${projectId}/sitemap.xml`;
                const sitemapLocalPath = path.join(__dirname, '..', 'public', sitemapRelativePath);

                // Console log for where we are fetching the sitemap from
                console.log(`[Info] Fetching sitemap from: ${sitemapLocalPath}`);

                if (!fs.existsSync(sitemapLocalPath)) {
                    console.log("[Error] Sitemap file not found locally at:", sitemapLocalPath);
                    io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                    if (deployment) {
                        await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'upload_failed' });
                    }
                    return;
                }

                // Remote destination path
                const remoteSitemapPath = path.posix.join(rootPath, 'sitemap.xml');

                // Console log for where we are uploading the sitemap to
                console.log(`[Info] Uploading sitemap to: ${remoteSitemapPath}`);

                // Upload based on connection type
                console.log('Uploading sitemap.xml to hosting...');

                if (hosting.connectionType === 'ftp') {
                    const client = new ftp.Client();
                    try {
                        await client.access({
                            host: config.host,
                            user: config.username,
                            password: config.password,
                            secure: config.secure || false,
                            port: config.port || 21
                        });
                        await client.uploadFrom(sitemapLocalPath, remoteSitemapPath);
                        console.log("FTP upload complete.");
                    } catch (ftpErr) {
                        console.error('[Error] During FTP upload:', ftpErr);
                        io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                        if (deployment) {
                            await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'upload_failed' });
                        }
                        return;
                    } finally {
                        client.close();
                    }

                } else if (hosting.connectionType === 'ssh' || hosting.connectionType === 'vps') {
                    const sftp = new SftpClient();
                    try {
                        await sftp.connect({
                            host: config.host,
                            port: config.port || 22,
                            username: config.username,
                            password: config.password
                        });
                        await sftp.put(sitemapLocalPath, remoteSitemapPath);
                        console.log("SFTP upload complete.");
                    } catch (sftpErr) {
                        console.error('[Error] During SFTP upload:', sftpErr);
                        io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                        if (deployment) {
                            await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'upload_failed' });
                        }
                        return;
                    } finally {
                        await sftp.end().catch(() => { });
                    }

                } else if (hosting.connectionType === 'cpanel') {
                    try {
                        await uploadFileCPanel(config, sitemapLocalPath, remoteSitemapPath);
                        console.log("cPanel upload complete.");
                    } catch (cpanelErr) {
                        console.error('[Error] During cPanel upload:', cpanelErr);
                        io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                        if (deployment) {
                            await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'upload_failed' });
                        }
                        return;
                    }

                } else {
                    console.log("[Error] Unsupported hosting type:", hosting.connectionType);
                    io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                    if (deployment) {
                        await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'upload_failed' });
                    }
                    return;
                }

                console.log("Sitemap update successful!");
                io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'success' });
                if (deployment) {
                    await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'success' });
                }

            } catch (error) {
                console.error('[Error] During sitemap update:', error);
                io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                if (deployment) {
                    await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'upload_failed' });
                }
            }
        })();
    },




    generateSitemap: async (req, res) => {
        try {
            const projectId = req.query.projectId || req.body.projectId;
            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }

            // Helpers
            const normalizeHostname = (input) => {
                let v = String(input || '').trim();
                if (!v) return null;
                try {
                    if (!/^https?:\/\//i.test(v)) v = `http://${v}`;
                    const { hostname } = new URL(v);
                    if (!hostname || !/^[a-z0-9.-]+$/i.test(hostname)) return null;
                    return hostname.toLowerCase().replace(/\.$/, '');
                } catch {
                    return null

                        ;
                }
            };
            const escapeXml = (str) =>
                String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&apos;');

            // 0) Get domain from project
            const proj = await UserProject.findById(projectId).select('domainName').lean();
            if (!proj) return res.status(404).json({ message: 'Project not found' });
            const host = normalizeHostname(proj.domainName);
            if (!host) return res.status(400).json({ message: 'Invalid or missing domainName on project' });

            // Validate projectId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({ message: 'Invalid projectId format' });
            }

            // 1) Location slugs - with error handling
            let locationSlugs = [];
            try {
                const slugs = await Slug.distinct('slug', { projectId: new mongoose.Types.ObjectId(projectId) });
                locationSlugs = [...new Set(
                    slugs
                        .filter(s => typeof s === 'string' && s.trim())
                        .map(s => `/${s.trim().replace(/^\/+/, '')}`)
                        .sort((a, b) => a.localeCompare(b))
                )];
            } catch (err) {
                console.error('Error fetching location slugs:', err);
                // Continue with empty array if location slugs fail
                locationSlugs = [];
            }

            // 1a) Blog slugs - with error handling and null checks
            let blogSlugs = [];
            try {
                const blogs = await Blog.find({ projectId: new mongoose.Types.ObjectId(projectId) })
                    .select('slug oldSlugs')
                    .lean();

                blogSlugs = [
                    ...new Set(
                        blogs
                            .filter(blog => blog && blog.slug) // Filter out null/undefined blogs
                            .flatMap(blog => {
                                const slugs = [`/blog/${blog.slug}`];
                                // Safely handle oldSlugs - might be null, undefined, or empty array
                                if (blog.oldSlugs && Array.isArray(blog.oldSlugs) && blog.oldSlugs.length > 0) {
                                    slugs.push(...blog.oldSlugs
                                        .filter(oldSlug => oldSlug && typeof oldSlug === 'string' && oldSlug.trim())
                                        .map(oldSlug => `/blog/${oldSlug.trim()}`)
                                    );
                                }
                                return slugs;
                            })
                    )
                ];
            } catch (err) {
                console.error('Error fetching blog slugs:', err);
                // Continue with empty array if blog slugs fail
                blogSlugs = [];
            }

            console.log('Blog slugs:', blogSlugs);

            // 2) Static pages
            const staticSlugs = [
                "/",
                "/privacy-policy",
                "/about",
                "/contact",
                "/terms-conditions",
                "/services",
                "/areas"
            ];

            // 3) Service slugs - with error handling
            let serviceSlugs = [];
            try {
                const serviceNames = await Service.distinct('name', { projectId: new mongoose.Types.ObjectId(projectId) });
                serviceSlugs = serviceNames
                    .map(s => String(s).trim())
                    .filter(Boolean)
                    .map(name => slugify(name));
            } catch (err) {
                console.error('Error fetching service slugs:', err);
                // Continue with empty array if service slugs fail
                serviceSlugs = [];
            }

            // 3a) /services/<service>
            const servicePageSlugs = serviceSlugs.map(s => `/services/${s}`);

            // 3b) <location>/services/<service>
            const locationServiceSlugs = locationSlugs.flatMap(loc =>
                serviceSlugs.map(s => `${loc.replace(/\/$/, '')}/services/${s}`)
            );

            // 4) Combine and de-dupe - ensure all arrays are valid
            const allSlugs = [...new Set([
                ...staticSlugs,
                ...(locationSlugs || []),
                ...(blogSlugs || []),
                ...(servicePageSlugs || []),
                ...(locationServiceSlugs || [])
            ].filter(Boolean))]; // Filter out any null/undefined values


            console.log('All slugs for sitemap:', allSlugs);

            // 5) Generate sitemap.xml - with validation
            const baseUrl = `https://${host}`;
            const now = new Date().toISOString();

            // Filter out invalid routes and generate XML
            const urlsXml = allSlugs
                .filter(route => route && typeof route === 'string' && route.trim()) // Ensure route is valid string
                .map(route => {
                    try {
                        const cleanRoute = route.trim();
                        const loc = cleanRoute === '/' ? baseUrl : `${baseUrl}${cleanRoute}`;
                        const priority = cleanRoute === '/' ? '1.0' : '0.8';
                        return (
                            `<url>` +
                            `<loc>${escapeXml(loc)}</loc>` +
                            `<lastmod>${escapeXml(now)}</lastmod>` +
                            `<changefreq>weekly</changefreq>` +
                            `<priority>${escapeXml(priority)}</priority>` +
                            `</url>`
                        );
                    } catch (err) {
                        console.error(`Error generating XML for route ${route}:`, err);
                        return ''; // Skip invalid routes
                    }
                })
                .filter(Boolean) // Remove empty strings from failed routes
                .join('');

            const xml =
                `<?xml version="1.0" encoding="UTF-8"?>` +
                `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
                urlsXml +
                `</urlset>`;

            // 6) Upload sitemap.xml - convert XML string to Buffer
            // uploadFile expects Buffer, not a string stream
            const xmlBuffer = Buffer.from(xml, 'utf8');
            const file = {
                name: 'sitemap.xml',
                mimetype: 'application/xml',
                buffer: xmlBuffer // Pass Buffer directly instead of stream
            };
            const folderPath = `public/sitemaps/${projectId}`; // project-specific folder
            const fileName = 'sitemap.xml'; // Fixed filename
            await helper.uploadFile(file, folderPath, res, { overwrite: true }); // Modified to allow overwrite

            const filePath = `/sitemaps/${projectId}/${fileName}`;

            // 7) Save sitemap path to UserProject
            await UserProject.findByIdAndUpdate(
                projectId,
                { siteMapFilePath: filePath },
                { new: true }
            );

            return res.status(200).json({
                message: 'Sitemap generated',
                slugs: allSlugs,
                sitemap: {
                    fileName,
                    filePath
                }
            });
        } catch (err) {
            console.error('Error fetching sitemap slugs:', err);
            return res.status(500).json({ message: 'Server error while fetching sitemap slugs' });
        }
    },

    updateProjectDomain: async (req, res) => {
        try {
            function normalizeDomain(input) {
                let v = String(input || '').trim();
                if (!v) return null;
                try {
                    if (!/^https?:\/\//i.test(v)) v = `http://${v}`;
                    const { hostname } = new URL(v);
                    if (!hostname || !/^[a-z0-9.-]+$/i.test(hostname)) return null;
                    return hostname.toLowerCase().replace(/\.$/, '');
                } catch {
                    return null;
                }
            }
            const { projectId, domainName } = req.body;
            if (!projectId) return res.status(400).json({ message: 'projectId is required' });
            if (!domainName) return res.status(400).json({ message: 'domainName is required' });

            const project = await UserProject.findById(projectId);
            if (!project) return res.status(404).json({ message: 'Project not found' });

            const normalized = normalizeDomain(domainName);
            if (!normalized) return res.status(400).json({ message: 'Invalid domain format' });

            // Optional uniqueness check (uncomment if you want domain to be unique)
            // const exists = await UserProject.findOne({ domainName: normalized, _id: { $ne: projectId } });
            // if (exists) return res.status(409).json({ message: 'Domain already in use' });

            project.domainName = normalized;
            await project.save();

            return res.status(200).json({
                message: 'Domain updated successfully',
                data: { projectId: project._id, domainName: project.domainName }
            });
        } catch (err) {
            console.error('Error updating project domain:', err);
            return res.status(500).json({ message: 'Server error while updating domain' });
        }
    },


    getOurHostedDetails: async (req, res) => {
        try {
            let { id } = req.body;

            if (!id) {
                return res.status(400).json({ error: 'Project id is required' });
            }

            // If not already ObjectId but is valid string, convert
            if (!isValidObjectId(id)) {
                return res.status(400).json({ error: 'Invalid project id' });
            }
            if (!(id instanceof Types.ObjectId)) {
                id = new Types.ObjectId(id);
            }

            const proj = await UserProject.findById(id)
                .select('domainName siteHostRootPath')
                .lean();

            if (!proj) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const domain = proj.domainName || null;
            const root = proj.siteHostRootPath || '/';

            return res.json({ domain, root });
        } catch (err) {
            console.error('getOurHostedDetails error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    getDeployInfo: async (req, res) => {
        try {
            const { projectId } = req.body;
            const { environment } = req.body;

            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({ error: 'Invalid projectId' });
            }

            // Build the query for ProjectDeployment
            const query = { projectId };
            if (environment) query.environment = environment; // optional filter

            // Get the latest deployment for this project (optionally per environment)
            const deployment = await ProjectDeployment.findOne(query)
                .sort({ createdAt: -1 }) // latest if multiple exist
                .select('domainName rootPath hostingId _id')
                .populate({ path: 'hostingId', select: 'isOur connectionType' })
                .lean();

            if (!deployment) {
                return res.status(404).json({ error: 'No deployment found for the given projectId' });
            }

            const hosting = deployment.hostingId || {};

            return res.json({
                projectId,
                projectDeploymentId: deployment._id,


                domainName: deployment.domainName,
                rootPath: deployment.rootPath,
                connectionType: hosting.connectionType ?? null,
                isOur: typeof hosting.isOur === 'boolean' ? hosting.isOur : null,
            });
        } catch (err) {
            console.error('deployment-info error:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    },
    checkDomain: async (req, res) => {
        try {

            const { domainName } = req.body;




            // Get the latest deployment for this project (optionally per environment)
            const deployment = await ProjectDeployment.findOne({
                domainName: domainName.trim(),
            }).populate('projectId', 'projectName').lean();

            if (!deployment) {
                return res.status(200).json({ message: 'This domain is available to use' });
            }

            // Domain exists in another project - return conflict with options
            const conflictingProjectId = deployment.projectId?._id || deployment.projectId;
            const existingProjectName = deployment.projectId?.projectName || 'Unknown Project';

            // Convert to string if it's an ObjectId
            const existingProjectIdString = String(conflictingProjectId);

            return res.status(409).json({
                ok: false,
                error: 'Domain already exists in another project',
                domain: domainName.trim(),
                existingProject: {
                    projectId: existingProjectIdString,
                    projectName: existingProjectName
                },
                options: {
                    unlink: {
                        action: 'unlink',
                        message: 'Unlink this domain from the other project and connect it here',
                        api: '/admin/v1/unlinkDomain',
                        requiredParams: { projectId: existingProjectIdString, domainName: domainName.trim() }
                    },
                    useAnother: {
                        action: 'useAnother',
                        message: 'Use a different domain for this project'
                    }
                }
            });



        } catch (error) {
            console.log(error, "hey error!!")
            return res.status(500).json({ error: 'Server error' });

        }
    },

    getProjectLocationsHierarchy: async (req, res) => {
        try {
            const projectId = req.query.projectId || req.body.projectId;
            if (!projectId) return res.status(400).json({ message: "projectId is required" });

            const proj = await UserProject.findById(projectId, {
                "locations.country": 1,
                "locations.state": 1,
                "locations.city": 1,
                "locations.localArea": 1,
            }).lean();

            if (!proj) return res.status(404).json({ message: "Project not found" });

            const loc = proj.locations || {};
            const countries = Array.isArray(loc.country) ? loc.country : [];
            const states = Array.isArray(loc.state) ? loc.state : [];
            const cities = Array.isArray(loc.city) ? loc.city : [];
            const locals = Array.isArray(loc.localArea) ? loc.localArea : [];

            // Only treat explicit status===1 (or "1"/true) as active.
            const isActive = (x) => x?.status === 1 || x?.status === "1" || x?.status === true;
            const hasName = (x) => typeof x?.name === "string" && x.name.trim().length > 0;

            // Maps of ALL (for parent lookup even if parent is inactive)
            const allStatesById = states.reduce((m, s) => {
                const id = String(s.stateId || "");
                if (id) m[id] = s;
                return m;
            }, {});
            const allCitiesById = cities.reduce((m, c) => {
                const id = String(c.cityId || "");
                if (id) m[id] = c;
                return m;
            }, {});

            // Active, named only (these are the nodes we will show)
            const A_COUNTRY = countries.filter((c) => isActive(c) && hasName(c));
            const A_STATE = states.filter((s) => isActive(s) && hasName(s));
            const A_CITY = cities.filter((c) => isActive(c) && hasName(c));
            const A_LOCAL = locals.filter((l) => isActive(l) && hasName(l));

            // Node registries
            const countryNodesById = {};
            const stateNodesById = {};
            const cityNodesById = {};
            const roots = [];

            // Countries → roots
            for (const c of A_COUNTRY) {
                const node = { name: c.name, id: String(c.countryId || ""), children: [] };
                countryNodesById[node.id] = node;
                roots.push(node);
            }

            // States → attach to active country if exists; else become root
            for (const s of A_STATE) {
                const node = { name: s.name, id: String(s.stateId || ""), children: [] };
                stateNodesById[node.id] = node;
                const parentCountry = countryNodesById[String(s.countryId || "")];
                if (parentCountry) parentCountry.children.push(node);
                else roots.push(node);
            }

            // Cities → attach to active state; else to active country via its (possibly inactive) state; else root
            for (const c of A_CITY) {
                const node = { name: c.name, id: String(c.cityId || ""), children: [] };
                cityNodesById[node.id] = node;

                const sId = String(c.stateId || "");
                const activeState = stateNodesById[sId];
                if (activeState) {
                    activeState.children.push(node);
                    continue;
                }

                const stateRec = allStatesById[sId]; // may be inactive
                const activeCountry = stateRec && countryNodesById[String(stateRec.countryId || "")];
                if (activeCountry) activeCountry.children.push(node);
                else roots.push(node);
            }

            // Locals → attach to active city; else climb to state (active) or country (active); else root
            for (const l of A_LOCAL) {
                const node = { name: l.name, id: String(l.localAreaId || ""), children: [] };

                const cId = String(l.cityId || "");
                const activeCity = cityNodesById[cId];
                if (activeCity) {
                    activeCity.children.push(node);
                    continue;
                }

                const cityRec = allCitiesById[cId]; // may be inactive
                const sId = String(cityRec?.stateId || "");
                const activeState = stateNodesById[sId];
                if (activeState) {
                    activeState.children.push(node);
                    continue;
                }

                const stateRec = allStatesById[sId]; // may be inactive
                const activeCountry = stateRec && countryNodesById[String(stateRec.countryId || "")];
                if (activeCountry) activeCountry.children.push(node);
                else roots.push(node);
            }

            // Sort by name at every level
            const sortRec = (n) => {
                if (!n.children?.length) return;
                n.children.sort((a, b) => a.name.localeCompare(b.name));
                n.children.forEach(sortRec);
            };
            roots.sort((a, b) => a.name.localeCompare(b.name));
            roots.forEach(sortRec);

            return res.status(200).json({ message: "OK", data: roots });
        } catch (err) {
            console.error("getProjectLocationsHierarchy error:", err);
            return res.status(500).json({ message: "Failed to fetch project locations" });
        }
    },

    // Generate AI service names (preview only, no DB writes)
    genrateAiProjectServices: async (req, res) => {
        try {
            let { projectId, count } = req.body || {};
            if (!projectId) return res.status(400).json({ message: "projectId is required" });
            const n = Math.max(1, Math.min(Number(count) || 10, 50));

            // Load project context
            const project = await UserProject.findById(projectId).lean();
            if (!project) return res.status(404).json({ message: "Project not found" });

            // Existing service names to exclude
            const existingServices = await Service.find({ projectId }).select('serviceName').lean();
            const excludeNames = (existingServices || [])
                .map(s => (s.serviceName || '').toString().trim())
                .filter(Boolean);

            const uniq = (arr) => Array.from(new Set(arr.map(v => (v || '').toString().trim().toLowerCase())));
            const excludeSet = new Set(uniq(excludeNames));

            const focusKeyword = project.focusKeyword || project.focusedKeyword || '';
            const mainKeywords = Array.isArray(project.mainKeywords) ? project.mainKeywords.join(', ') : (project.mainKeywords || '');
            const mainCategory = project.mainCategory || project.serviceType || '';
            const categories = Array.isArray(project.categories) ? project.categories : (project.category ? [project.category] : []);
            const subcategories = Array.isArray(project.subcategories) ? project.subcategories : [];

            const excludeListForPrompt = excludeNames.slice(0, 100); // cap to keep prompt short

            const prompt = `You are an expert content strategist for home/local services websites.
            Project: ${project.projectName || ''}
            Primary Service Type / Main Category: ${mainCategory}
            Focus Keyword: ${focusKeyword}
            Main Keywords: ${mainKeywords}
            Categories: ${categories.join(', ')}
            Subcategories: ${subcategories.join(', ')}
            Exclude service names (avoid duplicates, synonyms, close variants): ${excludeListForPrompt.join(' | ') || 'None'}

            TASK: Generate EXACTLY ${n} unique, concise service names relevant to the project and category.
            Rules:
            - Return ONLY a JSON array of strings (no prose, no keys).
            - No duplicates, no near-duplicates, no trademarked brands.
            - Each name 2–6 words, title case, no punctuation at end.
            - Avoid generic words-only lists; keep them specific to ${mainCategory || 'the niche'}.
            `;

            let services;
            try {
                services = await fetchJSONFromOpenAI(
                    prompt,
                    'GENERATE_AI_SERVICE_NAMES',
                    {
                        userId: project.userId?.toString?.() || '',
                        projectId: project._id?.toString?.() || projectId,
                        promptFrom: 'controller',
                        promptFor: 'Service Names Preview'
                    }
                );
            } catch (e) {
                return res.status(500).json({ message: 'AI generation failed', error: e.message });
            }

            if (!Array.isArray(services)) services = [];
            // Sanitize and enforce uniqueness/excludes
            const cleaned = [];
            const seen = new Set();
            for (const raw of services) {
                const name = (raw || '').toString().trim();
                if (!name) continue;
                const key = name.toLowerCase();
                if (seen.has(key)) continue;
                if (excludeSet.has(key)) continue;
                seen.add(key);
                cleaned.push(name.replace(/\s+/g, ' '));
                if (cleaned.length >= n) break;
            }

            return res.status(200).json({ services: cleaned, countRequested: n, countReturned: cleaned.length });
        } catch (error) {
            console.error('Error in genrateAiProjectServices:', error);
            const statusCode = Number(error?.statusCode) || 500;
            return res.status(statusCode).json({
                message: error?.message || 'Server error while generating AI services'
            });
        }
    },

    // Controller: generateBlogTitles (refactored & hardened)
    generateBlogTitles: async (req, res) => {
        try {
            // -------- inputs --------
            let { projectId, style, count, locations } = req.body;
            if (!projectId) return res.status(400).json({ message: "projectId is required" });

            const styleText = String(style || "").trim();
            if (!styleText) {
                return res.status(400).json({ message: "style is required (e.g., 'vs', 'why', 'how to', ...)" });
            }

            // 1..100 (default 8)
            const n = Math.min(Math.max(Number(count) || 8, 1), 100);

            // -------- helpers --------
            const toArray = (val) => {
                if (val == null) return [];
                if (typeof val === "string") {
                    try {
                        const parsed = JSON.parse(val);
                        if (Array.isArray(parsed)) return parsed;
                    } catch { /* fall through */ }
                    return String(val)
                        .split(/[\n,]+/g)
                        .map(s => s.trim())
                        .filter(Boolean);
                }
                return Array.isArray(val) ? val : [val];
            };

            const unique = (arr) => Array.from(new Set(arr));

            const WORDS_MAJOR = new Set([
                // Words to Title Case even if short
                "AI", "API", "SEO", "PPC", "FAQ", "ROI", "KPI", "B2B", "B2C"
            ]);

            const SMALL_WORDS = new Set([
                "a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "per", "to", "via", "the", "vs", "vs."
            ]);

            const titleCase = (s) => {
                const parts = s.toLowerCase().replace(/\s+/g, " ").trim().split(" ");
                return parts.map((w, i) => {
                    if (WORDS_MAJOR.has(w.toUpperCase())) return w.toUpperCase();
                    if (i === 0 || i === parts.length - 1) return w.charAt(0).toUpperCase() + w.slice(1);
                    if (SMALL_WORDS.has(w)) return w;
                    return w.charAt(0).toUpperCase() + w.slice(1);
                }).join(" ");
            };

            // Detects cut-off endings like "Mainta", "Optimiza", "Configu"
            const isLikelyIncomplete = (t) => {
                const trimmed = t.trim();
                // Ends with a single unfinished token of 3–7 letters and no punctuation
                const m = trimmed.match(/([A-Za-z]{3,7})$/);
                if (!m) return false;
                const last = m[1].toLowerCase();
                // Whitelist common complete words to avoid false positives
                const commonWhole = new Set([
                    "guide", "faq", "tips", "vs", "versus", "case", "study", "checklist", "plan", "guide:", "myth", "myths", "facts"
                ]);
                if (commonWhole.has(last)) return false;

                // If the token looks like a stem of a longer known word, treat as incomplete
                const suspiciousStems = [/maint[a-z]?$/, /optimiza?$/, /configu?$/, /compli?$/, /securi?$/, /perfor?$/, /strateg?$/, /analyt?$/, /marketi?$/, /implementa?$/, /automati?$/];
                return suspiciousStems.some(rx => rx.test(last));
            };

            const wordCount = (t) => t.trim().split(/\s+/).filter(Boolean).length;

            const styleRule = (() => {
                const s = styleText.toLowerCase();
                if (/(^|\s)(vs|versus|comparison|compare)(\s|$)/.test(s)) {
                    return { kind: "vs", note: `ALL titles MUST be comparisons and MUST contain "vs" or "versus" between two clear options.` };
                }
                if (s.startsWith("why") || s.includes("why choose")) {
                    return { kind: "why", note: `ALL titles MUST start with "Why" or "Why Choose".` };
                }
                if (/how/.test(s)) {
                    return { kind: "how", note: `ALL titles MUST start with "How to".` };
                }
                if (/(^|\s)(list|top|best)(\s|$)/.test(s)) {
                    return { kind: "list", note: `ALL titles MUST be listicles that start with "Top <N>" or "Best <N>".` };
                }
                if (/case/.test(s)) return { kind: "case", note: `ALL titles MUST include "Case Study".` };
                if (/beginner/.test(s)) return { kind: "beginner", note: `ALL titles MUST include "Beginner's Guide" (or "Beginner's Guide").` };
                if (/trouble|fix|error|issue/.test(s)) return { kind: "troubleshoot", note: `ALL titles MUST include "Troubleshooting" or "Fix".` };
                if (/myth/.test(s)) return { kind: "myth", note: `ALL titles MUST include "Myth vs Fact" (or "Myths vs Facts").` };
                if (/tip/.test(s)) return { kind: "tips", note: `ALL titles MUST include the word "Tips".` };
                if (/faq|question/.test(s)) return { kind: "faq", note: `ALL titles MUST include "FAQ".` };
                return { kind: "generic", note: `Titles MUST match the requested style: "${styleText}".` };
            })();

            const rawLocs = toArray(locations);
            const locNames = unique(
                rawLocs.flatMap(l => {
                    if (!l) return [];
                    if (typeof l === "string") return [l.trim()].filter(Boolean);
                    if (typeof l === "object" && typeof l.name === "string") return [l.name.trim()].filter(Boolean);
                    return [];
                })
            );
            const hasLocations = locNames.length > 0;

            const enforceLocationExactlyOnce = (t, idx) => {
                if (!hasLocations) {
                    // strip any trailing 'in X' that may sneak in
                    return t
                        .replace(/\s*\((?:in|at|within|across)\s+[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,3}\)\s*$/i, "")
                        .replace(/\s*[-–:]\s*(?:in|at|within|across)\s+.+$/i, "")
                        .replace(/\s{2,}/g, " ")
                        .replace(/\s*[-–:,]\s*$/, "")
                        .trim();
                }
                const targetLoc = locNames[idx % locNames.length];

                // Remove ANY location-like tail, then add exactly one
                let out = t
                    .replace(/\s*\((?:in|at|within|across)\s+[^)]+\)\s*$/i, "")
                    .replace(/\s*[-–:]\s*(?:in|at|within|across)\s+.+$/i, "")
                    .trim();

                // If location already present elsewhere, keep it (but ensure only once)
                const hasTarget = new RegExp(`\\b${targetLoc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(out);
                if (!hasTarget) {
                    // append with "in X" (choose preposition that fits most cases)
                    out = `${out} in ${targetLoc}`.replace(/\s+/g, " ").trim();
                }

                // ensure not repeated
                const regexDupe = new RegExp(`\\b(in|at|within|across)\\s+(${targetLoc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\s+\\1\\s+\\2\\b`, "i");
                out = out.replace(regexDupe, "$1 $2");
                return out;
            };

            const matchesStyle = (t) => {
                const s = t.trim();
                switch (styleRule.kind) {
                    case "vs": return /\b(vs\.?|versus)\b/i.test(s);
                    case "why": return /^why(\s+choose)?\b/i.test(s);
                    case "how": return /^how to\b/i.test(s);
                    case "list": return /^(top|best)\s+\d+\b/i.test(s);
                    case "case": return /\bcase study\b/i.test(s);
                    case "beginner": return /\bbeginner['']s guide\b/i.test(s);
                    case "troubleshoot": return /\b(troubleshooting|fix)\b/i.test(s);
                    case "myth": return /\bmyth(s)?\s+vs\s+fact(s)?\b/i.test(s);
                    case "tips": return /\btips\b/i.test(s);
                    case "faq": return /\bfaq\b/i.test(s);
                    default: return true;
                }
            };

            const normalizeArtifacts = (t) =>
                t
                    .replace(/\b(in|at|within|across)\s+in\b/gi, "$1 ") // "in in X"
                    .replace(/\s+/g, " ")
                    .replace(/\s*[-–:,]\s*$/, "")
                    .trim();

            const clampWordCount = (t) => {
                const words = t.split(/\s+/);
                if (words.length > 14) {
                    return words.slice(0, 14).join(" ").replace(/\W+$/, ""); // hard cap
                }
                return t;
            };

            // Fallback maker that respects style + location
            const makeFallbackTitle = (idx, serviceName, locationOptional) => {
                const loc = hasLocations ? ` in ${locNames[idx % locNames.length]}` : "";
                const svc = serviceName || "Your Service";
                switch (styleRule.kind) {
                    case "vs":
                        return titleCase(`"${svc} A" vs "${svc} B": Key Differences${loc}`); // generic compare
                    case "why":
                        return titleCase(`Why Choose ${svc}${loc}`);
                    case "how":
                        return titleCase(`How to Get Started with ${svc}${loc}`);
                    case "list":
                        return titleCase(`Top 10 ${svc} Tips${loc}`);
                    case "case":
                        return titleCase(`${svc} Case Study: Real Results${loc}`);
                    case "beginner":
                        return titleCase(`${svc}: Beginner's Guide${loc}`);
                    case "troubleshoot":
                        return titleCase(`${svc} Troubleshooting: Common Issues and Fixes${loc}`);
                    case "myth":
                        return titleCase(`${svc} Myths vs Facts${loc}`);
                    case "tips":
                        return titleCase(`Pro Tips for ${svc}${loc}`);
                    case "faq":
                        return titleCase(`${svc} FAQ: Your Questions Answered${loc}`);
                    default:
                        return titleCase(`Essential Guide to ${svc}${loc}`);
                }
            };

            const enforceStyle = (t, idx, serviceName) => {
                if (matchesStyle(t)) return t;
                return makeFallbackTitle(idx, serviceName);
            };

            // -------- fetch project + main services --------
            const project = await UserProject.findById(projectId).lean();
            if (!project) return res.status(404).json({ message: "Project not found" });

            const projectName = (project.projectName || "Project").trim();
            const serviceType = (project.serviceType || "").trim();

            const services = await Service.find({ projectId })
                .select("name")
                .limit(50)
                .lean();

            const serviceNames = unique(
                services
                    .map(s => String(s.name || "").trim())
                    .filter(Boolean)
            ).slice(0, 20);

            // -------- prompt --------
            const locBlock = hasLocations
                ? `
Locations: Use EXACTLY ONE of the following per title, rotating round-robin (reuse if fewer than ${n}). 
Do NOT repeat the location twice in a single title; use the location EXACTLY as written.
${locNames.map((x, i) => `- ${i + 1}. ${x}`).join("\n")}
`
                : `
Location rule: DO NOT include any city, state, region, or country in the titles. Keep titles generic with no geographic qualifiers.
`;

            const prompt = `
Return ONLY a JSON array of EXACTLY ${n} UNIQUE blog post titles (strings).

Context:
- Brand/Project: "${projectName}"
- Service/Niche: "${serviceType || "(not set)"}"
- Top Services (for topical variety):
${serviceNames.length ? serviceNames.map((s, i) => `  ${i + 1}. ${s}`).join("\n") : "  (none)"}
- Requested style: "${styleText}"
- HARD STYLE RULE: ${styleRule.note}
${locBlock}

Writing rules:
- Each title 6–14 words, Title Case (Capitalize Major Words).
- Helpful, specific, natural language. Avoid emojis and clickbait.
${hasLocations
                    ? `- Include EXACTLY ONE of the provided locations in each title (round-robin).`
                    : `- Since no locations are provided, DO NOT include any location in the titles.`}
- Do NOT write duplicates or near-duplicates.
- Vary phrasing; do not repeat the brand in every title.

Output format (IMPORTANT):
- A pure JSON array of strings only, e.g. ["Title One","Title Two", ...].
- No keys, no objects, no extra text, no markdown.
`.trim();

            // -------- call model --------
            const userId = req.user?.userId;
            const pageId = `blog_titles_${projectId}_${Date.now()}`;

            let result = await fetchJSONFromOpenAI(prompt, "GENERATE_BLOG_TITLES", {
                userId,
                projectId,
                pageId,
                promptFrom: "generateBlogTitles",
                promptFor: `${projectName}::${styleText}`,
            });

            // -------- parse + light cleanup --------
            if (typeof result === "string") {
                try { result = JSON.parse(result); } catch { /* ignore */ }
            }
            if (!Array.isArray(result)) {
                return res.status(502).json({ message: "Model did not return a JSON array." });
            }

            const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();

            // Initial normalize
            let titles = result.map(clean).filter(Boolean);

            // De-dupe case-insensitive
            const seen = new Set();
            titles = titles.filter(t => {
                const k = t.toLowerCase();
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
            });

            // Artifact fixes
            titles = titles.map(normalizeArtifacts);

            // ---------- VALIDATE + REPAIR PIPELINE ----------
            const repaired = [];
            const servicesCycle = (i) => serviceNames[i % Math.max(serviceNames.length, 1)] || (serviceType || projectName);

            for (let i = 0; i < titles.length; i++) {
                let t = titles[i];

                // Fix incomplete endings by dropping last partial token when detected
                if (isLikelyIncomplete(t)) {
                    t = t.replace(/\s*[A-Za-z]{3,7}$/, "").trim();
                }

                // Title Case and clamp word count
                t = clampWordCount(titleCase(t));

                // Enforce style strictly; if not matched, replace with fallback
                t = enforceStyle(t, i, servicesCycle(i));

                // Enforce location rule exactly once (or none)
                t = enforceLocationExactlyOnce(t, i);

                // Final word-count guard (6–14)
                const wc = wordCount(t);
                if (wc < 6 || wc > 14) {
                    // replace with a compliant fallback
                    t = makeFallbackTitle(i, servicesCycle(i));
                }

                // If still looks incomplete (e.g., single trailing stem), replace
                if (isLikelyIncomplete(t)) {
                    t = makeFallbackTitle(i, servicesCycle(i));
                }

                repaired.push(t);
            }

            // Re-dedupe after repairs
            const seen2 = new Set();
            let finalTitles = repaired.filter(t => {
                const k = t.toLowerCase();
                if (seen2.has(k)) return false;
                seen2.add(k);
                return true;
            });

            // Top up to n with deterministic fallbacks
            while (finalTitles.length < n) {
                const idx = finalTitles.length;
                const fallback = makeFallbackTitle(idx, servicesCycle(idx));
                if (!seen2.has(fallback.toLowerCase())) {
                    finalTitles.push(fallback);
                    seen2.add(fallback.toLowerCase());
                } else {
                    // rare: tweak with "#<n>"
                    finalTitles.push(`${fallback} #${idx + 1}`);
                }
            }

            // Trim down if too many
            if (finalTitles.length > n) finalTitles = finalTitles.slice(0, n);

            return res.status(200).json({
                message: "Blog titles generated successfully",
                data: finalTitles,
                meta: {
                    projectName,
                    style: styleText,
                    requested: n,
                    locationsProvided: locNames,
                    servicesUsed: serviceNames,
                    styleRule: styleRule.kind
                },
            });
        } catch (err) {
            console.error("Error in generateBlogTitles:", err);
            return res.status(500).json({ message: "Failed to generate blog titles" });
        }
    },

    // Update Google Site Verification meta tag
    updateGoogleSiteVerification: async (req, res) => {
        try {
            const { projectId, verificationCode } = req.body;
            const userId = req.user.userId;

            if (!projectId) {
                return res.status(400).json({
                    message: 'projectId is required'
                });
            }

            if (!verificationCode || typeof verificationCode !== 'string' || verificationCode.trim() === '') {
                return res.status(400).json({
                    message: 'verificationCode is required and must be a non-empty string'
                });
            }

            // Validate that it contains a meta tag
            const trimmedCode = verificationCode.trim();
            if (!trimmedCode.includes('google-site-verification') || !trimmedCode.includes('<meta')) {
                return res.status(400).json({
                    message: 'Invalid format. Please provide the complete meta tag line (e.g., <meta name="google-site-verification" content="..." />)'
                });
            }

            // Check if project exists and belongs to user
            const project = await UserProject.findOne({
                _id: projectId,
                userId: userId
            });

            if (!project) {
                return res.status(404).json({
                    message: 'Project not found or you do not have permission'
                });
            }

            // Store the entire meta tag line as-is
            project.googleSiteVerification = trimmedCode;
            // Clear HTML file method when using meta tag method
            project.googleSiteVerificationHtmlFile = null;
            await project.save();

            console.log(`[Google Site Verification] Updated for project ${projectId}: ${trimmedCode}`);

            return res.status(200).json({
                message: 'Google Site Verification meta tag updated successfully',
                data: {
                    projectId: project._id,
                    googleSiteVerification: project.googleSiteVerification,
                    googleSiteVerificationHtmlFile: project.googleSiteVerificationHtmlFile
                }
            });
        } catch (error) {
            console.error('Error in updateGoogleSiteVerification:', error);
            return res.status(500).json({
                message: 'An error occurred while updating Google Site Verification meta tag'
            });
        }
    },

    // Upload Google Site Verification HTML file
    uploadGoogleSiteVerificationHtml: async (req, res) => {
        try {
            const { projectId, fileName } = req.body; // Get filename from body (sent separately to avoid truncation)
            const userId = req.user.userId;
            const file = req?.files?.htmlFile;

            if (!projectId) {
                return res.status(400).json({
                    message: 'projectId is required'
                });
            }

            if (!file) {
                return res.status(400).json({
                    message: 'HTML file is required'
                });
            }

            // Use filename from body if provided, otherwise fall back to file.name
            let finalFileName = fileName || file.name;

            // Validate file type - check both the provided filename and file.name
            if (!finalFileName.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.html')) {
                return res.status(400).json({
                    message: 'Only HTML files are allowed'
                });
            }

            // Ensure filename ends with .html
            if (!finalFileName.toLowerCase().endsWith('.html')) {
                finalFileName = finalFileName + '.html';
            }

            // Check if project exists and belongs to user
            const project = await UserProject.findOne({
                _id: projectId,
                userId: userId
            });

            if (!project) {
                return res.status(404).json({
                    message: 'Project not found or you do not have permission'
                });
            }

            // Upload file to uploads/{projectId} folder with exact filename
            const uploadsFolderPath = path.join(__dirname, '..', 'uploads', projectId.toString());

            // Ensure uploads/{projectId} directory exists
            if (!fs.existsSync(uploadsFolderPath)) {
                fs.mkdirSync(uploadsFolderPath, { recursive: true });
            }

            // Save file with exact name in project-specific folder (use finalFileName which came from body to avoid truncation)
            const filePath = path.join(uploadsFolderPath, finalFileName);

            // Handle file upload (using express-fileupload)
            if (file.tempFilePath) {
                // File was saved to temp location
                fs.copyFileSync(file.tempFilePath, filePath);
            } else if (file.data) {
                // File is in memory as buffer
                fs.writeFileSync(filePath, file.data);
            } else {
                return res.status(400).json({
                    message: 'Invalid file data'
                });
            }

            // Save relative path to database: uploads/{projectId}/filename.html
            const relativePath = path.join('uploads', projectId.toString(), finalFileName).replace(/\\/g, '/'); // Use forward slashes for cross-platform compatibility

            // Update project with relative path (includes projectId folder)
            project.googleSiteVerificationHtmlFile = relativePath;
            // Clear meta tag method when using HTML file method
            project.googleSiteVerification = null;
            await project.save();

            console.log(`[Google Site Verification HTML] Uploaded for project ${projectId}: ${relativePath} (original: ${file.name})`);

            return res.status(200).json({
                message: 'Google Site Verification HTML file uploaded successfully',
                data: {
                    projectId: project._id,
                    fileName: finalFileName,
                    filePath: relativePath,
                    googleSiteVerificationHtmlFile: project.googleSiteVerificationHtmlFile,
                    googleSiteVerification: project.googleSiteVerification
                }
            });
        } catch (error) {
            console.error('Error in uploadGoogleSiteVerificationHtml:', error);
            return res.status(500).json({
                message: 'An error occurred while uploading Google Site Verification HTML file'
            });
        }
    },

    // New function to scan themes folder and return available themes
    scan_website_themes: async (req, res) => {
        console.log('========================================');
        console.log('🚀 scan_website_themes API CALLED');
        console.log('   Method:', req.method);
        console.log('   URL:', req.url);
        console.log('   Original URL:', req.originalUrl);
        console.log('   Path:', req.path);
        console.log('   Base URL:', req.baseUrl);
        console.log('========================================');

        try {
            const fs = require('fs');
            const path = require('path');

            // Path to themes folder in website app - using path.resolve like deployHelper.js
            const themesPath = path.resolve(__dirname, '..', '..', 'apps', 'website', 'src', 'themes');

            console.log('🔍 Scanning themes folder...');
            console.log('   Full path:', themesPath);
            console.log('   __dirname:', __dirname);
            console.log('   process.cwd():', process.cwd());
            console.log('   Path exists:', fs.existsSync(themesPath));

            // Check if themes folder exists
            if (!fs.existsSync(themesPath)) {
                // Try alternative path (in case __dirname is different)
                const altPath = path.resolve(process.cwd(), 'apps', 'website', 'src', 'themes');
                console.log('   Trying alternative path:', altPath);
                console.log('   Alt path exists:', fs.existsSync(altPath));

                if (fs.existsSync(altPath)) {
                    console.log('✅ Found themes using alternative path');
                    // Continue with altPath
                    const items = fs.readdirSync(altPath, { withFileTypes: true });
                    const themes = [];

                    for (const item of items) {
                        if (item.isDirectory()) {
                            const themeName = item.name;
                            const themePath = path.join(altPath, themeName);
                            const pagesPath = path.join(themePath, 'pages');
                            const hasPages = fs.existsSync(pagesPath);
                            const componentsPath = path.join(themePath, 'components');
                            const hasComponents = fs.existsSync(componentsPath);
                            const previewUrl = `http://localhost:5173/?theme=${themeName}`;
                            const previewImage = `https://via.placeholder.com/800x600/6366F1/FFFFFF?text=${encodeURIComponent(themeName.charAt(0).toUpperCase() + themeName.slice(1))}+Theme`;

                            themes.push({
                                name: themeName,
                                displayName: themeName.charAt(0).toUpperCase() + themeName.slice(1),
                                previewUrl: previewUrl,
                                previewImage: previewImage,
                                hasPages: hasPages,
                                hasComponents: hasComponents,
                                indexFile: null,
                                path: themePath
                            });
                        }
                    }

                    return res.status(200).json({
                        message: 'Themes scanned successfully',
                        count: themes.length,
                        themes: themes
                    });
                }

                return res.status(404).json({
                    message: 'Themes folder not found',
                    error: `Path does not exist: ${themesPath}`,
                    debug: {
                        __dirname: __dirname,
                        processCwd: process.cwd(),
                        attemptedPath: themesPath,
                        alternativePath: altPath
                    },
                    themes: []
                });
            }

            // Read all directories in themes folder
            console.log('✅ Themes folder found, reading directories...');
            const items = fs.readdirSync(themesPath, { withFileTypes: true });
            console.log(`   Found ${items.length} items in themes folder`);

            const themes = [];

            for (const item of items) {
                if (item.isDirectory()) {
                    const themeName = item.name;
                    const themePath = path.join(themesPath, themeName);

                    console.log(`   📁 Processing theme: ${themeName}`);

                    // Check if theme has pages folder
                    const pagesPath = path.join(themePath, 'pages');
                    const hasPages = fs.existsSync(pagesPath);

                    // Check if theme has Index.tsx or Index.js
                    const indexFiles = ['Index.tsx', 'Index.js', 'index.tsx', 'index.js'];
                    let indexFile = null;

                    if (hasPages) {
                        for (const indexFileName of indexFiles) {
                            const indexPath = path.join(pagesPath, indexFileName);
                            if (fs.existsSync(indexPath)) {
                                indexFile = indexFileName;
                                break;
                            }
                        }
                    }

                    // Check for components folder
                    const componentsPath = path.join(themePath, 'components');
                    const hasComponents = fs.existsSync(componentsPath);

                    // Generate preview URL
                    // Website app port - can be set via WEBSITE_PORT env variable
                    // Default to 8081 (common Vite port when 5173 is busy)
                    const websitePort = process.env.WEBSITE_PORT || '8081';
                    const previewUrl = `http://localhost:${websitePort}/?theme=${themeName}`;

                    console.log(`   Preview URL for ${themeName}: ${previewUrl}`);

                    // Try to find preview image or use placeholder
                    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
                    let previewImage = null;

                    // Check for preview image in theme root
                    for (const ext of imageExtensions) {
                        const imagePath = path.join(themePath, `preview${ext}`);
                        if (fs.existsSync(imagePath)) {
                            previewImage = `/themes/${themeName}/preview${ext}`;
                            break;
                        }
                    }

                    // If no preview image, use placeholder
                    if (!previewImage) {
                        previewImage = `https://via.placeholder.com/800x600/6366F1/FFFFFF?text=${encodeURIComponent(themeName.charAt(0).toUpperCase() + themeName.slice(1))}+Theme`;
                    }

                    themes.push({
                        name: themeName,
                        displayName: themeName.charAt(0).toUpperCase() + themeName.slice(1),
                        previewUrl: previewUrl,
                        previewImage: previewImage,
                        hasPages: hasPages,
                        hasComponents: hasComponents,
                        indexFile: indexFile,
                        path: themePath
                    });

                    console.log(`   ✅ Added theme: ${themeName} (Pages: ${hasPages}, Components: ${hasComponents})`);
                } else {
                    console.log(`   ⚠️  Skipping non-directory: ${item.name}`);
                }
            }

            console.log(`✨ Total themes found: ${themes.length}`);
            console.log(`   Theme names:`, themes.map(t => t.name).join(', '));

            return res.status(200).json({
                message: 'Themes scanned successfully',
                count: themes.length,
                themes: themes
            });

        } catch (error) {
            console.error('❌ Error scanning themes:', error);
            console.error('   Error stack:', error.stack);
            return res.status(500).json({
                message: 'Error scanning themes folder',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                themes: []
            });
        }
    },

    // Update theme thumbnail image
    update_theme_thumbnail: async (req, res) => {
        try {
            const fs = require('fs');
            const path = require('path');

            const { themeName } = req.body;

            if (!themeName) {
                return res.status(400).json({
                    message: 'Theme name is required',
                    error: 'Missing themeName parameter'
                });
            }

            if (!req.files || !req.files.thumbnail) {
                return res.status(400).json({
                    message: 'Thumbnail image is required',
                    error: 'No file uploaded'
                });
            }

            const thumbnailFile = req.files.thumbnail;
            const themesPath = path.resolve(__dirname, '..', '..', 'apps', 'website', 'src', 'themes');
            const themePath = path.join(themesPath, themeName);

            // Check if theme exists
            if (!fs.existsSync(themePath)) {
                return res.status(404).json({
                    message: 'Theme not found',
                    error: `Theme "${themeName}" does not exist`
                });
            }

            // Allowed image extensions
            const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
            const fileExt = path.extname(thumbnailFile.name).toLowerCase();

            if (!allowedExtensions.includes(fileExt)) {
                return res.status(400).json({
                    message: 'Invalid file type',
                    error: `Only ${allowedExtensions.join(', ')} files are allowed`
                });
            }

            // Save thumbnail as preview.png in theme folder
            const thumbnailPath = path.join(themePath, 'preview.png');

            // If old preview exists, remove it first
            const oldExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
            for (const ext of oldExtensions) {
                const oldPath = path.join(themePath, `preview${ext}`);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            // Save new thumbnail
            await thumbnailFile.mv(thumbnailPath);

            // Return the new thumbnail URL
            const thumbnailUrl = `http://localhost:8081/themes/${themeName}/preview.png`;

            console.log(`✅ Thumbnail updated for theme: ${themeName}`);
            console.log(`   Saved to: ${thumbnailPath}`);

            return res.status(200).json({
                message: 'Thumbnail updated successfully',
                thumbnailUrl: thumbnailUrl,
                themeName: themeName
            });

        } catch (error) {
            console.error('Error updating theme thumbnail:', error);
            return res.status(500).json({
                message: 'Error updating thumbnail',
                error: error.message
            });
        }
    },

    // Refresh components from GenieBuild sections (file-driven, one doc per section)
    refreshComponentsFromRegistry: async (req, res) => {
        try {
            const path = require('path');
            const { mergeWebsiteComponentsFromScan } = require('../additional/mergeWebsiteComponentsFromScan');
            const genieBuildSectionsPath = path.join(__dirname, '../../apps/geniebuild/components/sections');

            const { results, added, updated, summary, logLines } = await mergeWebsiteComponentsFromScan(
                WebsiteComponent,
                genieBuildSectionsPath
            );

            return res.status(200).json({
                message: 'Components refreshed successfully from GenieBuild sections',
                summary: {
                    ...summary,
                    deleted: 0,
                },
                added,
                updated,
                deleted: [],
                components: results,
                logLines,
            });
        } catch (error) {
            console.error('[refreshComponentsFromRegistry] Error:', error);
            return res.status(500).json({
                message: 'Error refreshing components from registry',
                error: error.message
            });
        }
    },

    terminateAllRedisTasks: async (req, res) => {
        try {
            const queues = [
                { name: "projectBackgroundQueue", queue: projectBackgroundQueue },
                { name: "redisQueue", queue: redisQueue },
                { name: "addNewServicesQueue", queue: addNewServicesQueue },
                { name: "generateServiceDescQueue", queue: generateServiceDescQueue },
                { name: "sectionGenerationQueue", queue: sectionGenerationQueue },
            ];

            const results = [];
            for (const q of queues) {
                const summary = await terminateQueueJobs(q.queue, q.name);
                results.push(summary);
            }

            const totals = results.reduce(
                (acc, row) => {
                    acc.waitingRemoved += row.waitingRemoved || 0;
                    acc.delayedRemoved += row.delayedRemoved || 0;
                    acc.pausedRemoved += row.pausedRemoved || 0;
                    acc.activeFailed += row.activeFailed || 0;
                    acc.errors += (row.errors || []).length;
                    return acc;
                },
                { waitingRemoved: 0, delayedRemoved: 0, pausedRemoved: 0, activeFailed: 0, errors: 0 }
            );

            return res.status(200).json({
                success: true,
                message: "All current Redis queue jobs were terminated safely. New tasks can still be queued normally.",
                totals,
                queues: results,
            });
        } catch (error) {
            console.error("[terminateAllRedisTasks] Error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to terminate Redis queue jobs",
                error: error.message,
            });
        }
    },

    clearDangerZoneEntries: async (req, res) => {
        try {
            const summary = {};
            for (const cfg of DANGER_ZONE_COLLECTIONS) {
                const result = await cfg.model.deleteMany({});
                summary[cfg.key] = result?.deletedCount || 0;
            }
            return res.status(200).json({
                success: true,
                message: "Danger zone entries cleared successfully",
                deleted: summary,
            });
        } catch (error) {
            console.error("[clearDangerZoneEntries] Error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to clear danger zone entries",
                error: error.message,
            });
        }
    },

    createProjectDataBackupZip: async (req, res) => {
        try {
            const db = mongoose.connection.db;
            const collectionsMeta = await db.listCollections({}, { nameOnly: true }).toArray();
            const collectionNames = collectionsMeta
                .map((c) => c.name)
                .filter((name) => name && !String(name).startsWith("system."));

            const payload = {
                backupVersion: 1,
                exportedAt: new Date().toISOString(),
                scope: "full_database",
                collections: {},
            };

            for (const collectionName of collectionNames) {
                const docs = await db.collection(collectionName).find({}).toArray();
                payload.collections[collectionName] = docs;
            }

            res.setHeader("Content-Type", "application/zip");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="mongo-full-backup-${Date.now()}.zip"`
            );

            const archive = archiver("zip", { zlib: { level: 9 } });
            archive.on("error", (err) => {
                throw err;
            });
            archive.pipe(res);
            archive.append(EJSON.stringify(payload, null, 2), { name: "mongo-full-backup.ejson" });
            await archive.finalize();
        } catch (error) {
            console.error("[createProjectDataBackupZip] Error:", error);
            if (!res.headersSent) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to create backup zip",
                    error: error.message,
                });
            }
        }
    },

    restoreProjectDataBackupZip: async (req, res) => {
        try {
            const { backupBase64 } = req.body || {};
            if (!backupBase64 || typeof backupBase64 !== "string") {
                return res.status(400).json({ success: false, message: "backupBase64 is required" });
            }

            const zipBuffer = Buffer.from(backupBase64, "base64");
            const zipDirectory = await unzipper.Open.buffer(zipBuffer);
            const entry = zipDirectory.files.find((f) => f.path === "mongo-full-backup.ejson");
            if (!entry) {
                return res.status(400).json({ success: false, message: "Invalid backup zip: mongo-full-backup.ejson missing" });
            }

            const rawJson = (await entry.buffer()).toString("utf8");
            const parsed = EJSON.parse(rawJson || "{}");
            const collections = parsed?.collections || {};
            const restoreSummary = {};

            const db = mongoose.connection.db;
            for (const [collectionName, collectionDocs] of Object.entries(collections)) {
                if (!collectionName || String(collectionName).startsWith("system.")) continue;
                const docs = Array.isArray(collectionDocs) ? collectionDocs : [];
                if (!docs.length) {
                    restoreSummary[collectionName] = { inserted: 0, skipped: 0 };
                    continue;
                }

                let inserted = 0;
                let skipped = 0;
                const collection = db.collection(collectionName);
                for (const doc of docs) {
                    if (!doc?._id) {
                        await collection.insertOne(doc);
                        inserted++;
                        continue;
                    }
                    const existing = await collection.findOne({ _id: doc._id }, { projection: { _id: 1 } });
                    if (existing) {
                        skipped++;
                        continue;
                    }
                    await collection.updateOne(
                        { _id: doc._id },
                        { $setOnInsert: doc },
                        { upsert: true }
                    );
                    inserted++;
                }
                restoreSummary[collectionName] = { inserted, skipped };
            }

            return res.status(200).json({
                success: true,
                message: "Backup restored successfully (missing entries upserted)",
                summary: restoreSummary,
            });
        } catch (error) {
            console.error("[restoreProjectDataBackupZip] Error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to restore backup zip",
                error: error.message,
            });
        }
    },

    generateWebsiteSectionsData: async (req, res) => {
        try {
            const { projectId, locations = [] } = req.body;

            if (!projectId) {
                return res.status(400).json({ message: "projectId is required" });
            }

            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            // Read from WebsiteDesignsData instead of WebsitePage
            const designData = await WebsiteDesignsData.findOne({ projectId });

            if (!designData || !designData.pages || !designData.pages.length) {
                return res.status(404).json({ message: "No pages found in design data" });
            }

            let successCount = 0;
            let failedCount = 0;

            console.log(`[generateWebsiteSectionsData] Found ${designData.pages.length} pages for projectId: ${projectId}`);

            for (const pageData of designData.pages) {
                const pageId = pageData.pageId?._id?.toString() || pageData.pageId?.toString() || pageData._id?.toString();
                const sections = getPageSections(pageData);
                console.log(`[generateWebsiteSectionsData] Processing page: ${pageId}, has sections: ${sections.length}`);

                // GenieBuild sections - read from pages[].sections[].sectionData (single source of truth)
                for (const compData of sections) {
                    const section = compData.sectionData;
                    if (!section) {
                        console.warn(`[generateWebsiteSectionsData] Component ${compData.variant_uniqueId} has no sectionData, skipping`);
                        continue;
                    }
                    const sectionId = section.type; // type is same as filename/uniqueId
                    console.log(`[generateWebsiteSectionsData] Processing section: ${sectionId} (variant: ${compData.variant_uniqueId}) for page: ${pageId}`);

                    // GLOBAL PAGE (for non-business flow only)
                    if (!generationLocations.length) {
                        await generateSection(project, projectId, pageId, sectionId, null);
                        continue;
                    }

                    // LOCATION BASED
                    for (const loc of generationLocations) {
                        await generateSection(project, projectId, pageId, sectionId, loc);
                    }
                }
            }

            async function generateSection(project, projectId, pageId, sectionId, location) {

                const locationId = location?.id || location?._id || null;

                try {
                    const pageDoc =
                        mongoose.isValidObjectId(String(pageId || ""))
                            ? await WebsitePage.findOne({ _id: pageId, projectId })
                                .select("pageType name serviceId")
                                .lean()
                            : null;
                    const pageType = String(pageDoc?.pageType || "").toLowerCase();
                    const pageName = String(pageDoc?.name || "").toLowerCase();

                    const sectionFile = resolveSectionFile(sectionId, { pageType, pageFolder: pageName });

                    if (!sectionFile) {
                        throw new Error(`Section file missing: ${sectionId}`);
                    }

                    delete require.cache[require.resolve(sectionFile)];
                    const sectionModule = require(sectionFile);

                    const prompt = sectionModule.prompt({
                        project,
                        location
                    });

                    const result = await fetchJSONFromOpenAI(prompt, sectionId, {
                        projectId,
                        pageId,
                        promptFrom: "generateWebsiteSectionsData"
                    });

                    let resultToSave =
                        result && typeof result === "object" && !Array.isArray(result)
                            ? stripLegacyImagePromptFields({ ...result })
                            : result;

                    if (
                        typeof sectionModule.imageCount === "number" &&
                        resultToSave &&
                        typeof resultToSave === "object" &&
                        !Array.isArray(resultToSave)
                    ) {
                        resultToSave.image_count = sectionModule.imageCount;
                        const {
                            resolveImageSpec,
                            stampImageSpecOnData,
                        } = require("../imageengines");
                        resultToSave = stampImageSpecOnData(
                            resultToSave,
                            resolveImageSpec(
                                sectionModule,
                                resultToSave,
                                sectionId || sectionModule.id
                            )
                        );
                    }

                    if (sectionId === "hero" && resultToSave && typeof resultToSave === "object") {
                        const { ai_image_prompt, non_ai_image_prompt } = resultToSave;
                        if (ai_image_prompt || non_ai_image_prompt) {
                            await UserProject.findByIdAndUpdate(projectId, {
                                $set: {
                                    ...(ai_image_prompt && { ai_image_prompt }),
                                    ...(non_ai_image_prompt && { non_ai_image_prompt }),
                                    ...(typeof sectionModule.imageCount === "number"
                                        ? { image_count: sectionModule.imageCount }
                                        : {}),
                                },
                                $unset: { coverImagePrompt: "", otherImagesPrompt: "" },
                            });
                            console.log(
                                `[generateSection] Saved ai_image_prompt / non_ai_image_prompt / image_count to UserProject: ${projectId}`
                            );
                        }
                    }

                    if (resultToSave && typeof resultToSave === "object" && !Array.isArray(resultToSave)) {
                        resultToSave = await attachGeneratedImagesToSectionData({
                            project,
                            projectId,
                            sectionId,
                            sectionModule,
                            data: resultToSave,
                        });
                    }

                    if (sectionId === "faq" && resultToSave && typeof resultToSave === "object") {
                        resultToSave = coerceFaqSectionPayload(resultToSave);
                    }

                    // Save to SectionContent (without prompts for hero section)
                    if (!isMeaningfulSectionData(resultToSave)) {
                        logSectionContentWrite("skipped-empty", { projectId, pageId, sectionId, locationId, source: "generateWebsiteSectionsData" });
                        return;
                    }
                    await SectionContent.findOneAndUpdate(
                        {
                            projectId,
                            locationId,
                            pageId,
                            sectionId
                        },
                        {
                            $set: {
                                data: resultToSave,
                                status: "generated",
                                error: null
                            }
                        },
                        { upsert: true }
                    );
                    logSectionContentWrite("saved", { projectId, pageId, sectionId, locationId, source: "generateWebsiteSectionsData" });

                    // Do not write content back into WebsiteDesignsData.
                    // WebsiteDesignsData stores structure/styles only; content lives in SectionContent.

                    successCount++;

                } catch (err) {

                    await SectionContent.findOneAndUpdate(
                        {
                            projectId,
                            locationId,
                            pageId,
                            sectionId
                        },
                        {
                            $set: {
                                status: "failed",
                                error: err.message || "Generation failed"
                            }
                        },
                        { upsert: true }
                    );
                    logSectionContentWrite("error", { projectId, pageId, sectionId, locationId, source: "generateWebsiteSectionsData", error: err.message || "Generation failed" });

                    failedCount++;

                    console.error(`❌ ${sectionId} failed:`, err.message);
                }
            }

            return res.status(200).json({
                message: "Section generation completed",
                success: successCount,
                failed: failedCount
            });

        } catch (error) {
            console.error("generateWebsiteSectionsData error:", error);
            return res.status(500).json({ message: "Generation failed" });
        }
    },

    regenerateFailedSections: async (req, res) => {
        try {
            const { projectId, locations = [] } = req.body;

            if (!projectId) {
                return res.status(400).json({ message: "projectId is required" });
            }

            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }
            const isBusinessProject = Number(project?.projectType || 0) === 1;
            const primaryBusinessLocation = isBusinessProject
                ? await BusinessLocation.findOne({ projectId, type: 0, status: 1 }).sort({ createdAt: 1 }).lean()
                : null;
            const generationLocations = Array.isArray(locations) && locations.length
                ? locations
                : (isBusinessProject && primaryBusinessLocation ? [primaryBusinessLocation] : []);

            const pages = await WebsitePage.find({ projectId });

            if (!pages.length) {
                return res.status(404).json({ message: "No pages found" });
            }

            let successCount = 0;
            let failedCount = 0;
            let skipped = 0;

            for (const page of pages) {

                const pageId = page.slug || page._id.toString();

                for (const comp of page.componentIds || []) {

                    if (!comp.componentVariant) continue;

                    const sectionId = comp.componentVariant.split("_")[0];

                    // GLOBAL (for non-business flow only)
                    if (!generationLocations.length) {
                        await regenSection(project, projectId, pageId, sectionId, null);
                        continue;
                    }

                    // LOCATION BASED
                    for (const loc of generationLocations) {
                        await regenSection(project, projectId, pageId, sectionId, loc);
                    }
                }
            }

            async function regenSection(project, projectId, pageId, sectionId, location) {

                const locationId = location?.id || location?._id || null;

                const existing = await SectionContent.findOne({
                    projectId,
                    locationId,
                    pageId,
                    sectionId,
                    isDeleted: false
                });

                // Already generated → skip
                if (existing && existing.status === "generated") {
                    skipped++;
                    return;
                }

                try {
                    const regenPageDoc =
                        mongoose.isValidObjectId(String(pageId || ""))
                            ? await WebsitePage.findOne({ _id: pageId, projectId })
                                .select("pageType name serviceId")
                                .lean()
                            : null;
                    const regenPageType = String(regenPageDoc?.pageType || "").toLowerCase();
                    const regenPageName = String(regenPageDoc?.name || "").toLowerCase();

                    const sectionFile = resolveSectionFile(sectionId, {
                        pageType: regenPageType,
                        pageFolder: regenPageName,
                    });

                    if (!sectionFile) {
                        throw new Error(`Section file missing: ${sectionId}`);
                    }

                    delete require.cache[require.resolve(sectionFile)];
                    const sectionModule = require(sectionFile);

                    const prompt = sectionModule.prompt({
                        project,
                        location
                    });

                    let result = await fetchJSONFromOpenAI(prompt, sectionId, {
                        projectId,
                        pageId,
                        promptFrom: "regenerateFailedSections"
                    });

                    if (sectionId === "faq" && result && typeof result === "object" && !Array.isArray(result)) {
                        result = coerceFaqSectionPayload({ ...result });
                    }

                    if (!isMeaningfulSectionData(result)) {
                        logSectionContentWrite("skipped-empty", { projectId, pageId, sectionId, locationId, source: "regenerateFailedSections" });
                        return;
                    }
                    await SectionContent.findOneAndUpdate(
                        {
                            projectId,
                            locationId,
                            pageId,
                            sectionId
                        },
                        {
                            $set: {
                                data: result,
                                status: "generated",
                                error: null
                            }
                        },
                        { upsert: true }
                    );
                    logSectionContentWrite("saved", { projectId, pageId, sectionId, locationId, source: "regenerateFailedSections" });

                    successCount++;

                } catch (err) {

                    await SectionContent.findOneAndUpdate(
                        {
                            projectId,
                            locationId,
                            pageId,
                            sectionId
                        },
                        {
                            $set: {
                                status: "failed",
                                error: err.message || "Generation failed"
                            }
                        },
                        { upsert: true }
                    );
                    logSectionContentWrite("error", { projectId, pageId, sectionId, locationId, source: "regenerateFailedSections", error: err.message || "Generation failed" });

                    failedCount++;
                }
            }

            return res.status(200).json({
                message: "Regeneration completed",
                success: successCount,
                failed: failedCount,
                skipped
            });

        } catch (error) {
            console.error("regenerateFailedSections error:", error);
            return res.status(500).json({ message: "Regeneration failed" });
        }
    },

    // Upsert section content from GenieBuild editor save.
    // This makes "reset/default" actions use the latest user-saved content.
    upsertSectionContentFromBuilder: async (req, res) => {
        try {
            const { projectId, pageId, locationId = null, sections = [] } = req.body || {};

            if (!projectId || !pageId) {
                return res.status(400).json({ message: 'projectId and pageId are required' });
            }

            if (!Array.isArray(sections) || sections.length === 0) {
                return res.status(400).json({ message: 'sections array is required' });
            }

            const normalizedPageId = normalizeMixedIdForStorage(pageId);
            const pageIdCandidates = buildMixedIdCandidates(pageId);
            const normalizedSections = sections
                .map((s) => {
                    const sectionId = s?.sectionId
                        ? normalizeSectionIdForStorage(String(s.sectionId).trim().toLowerCase())
                        : '';
                    if (!sectionId) return null;
                    return { sectionId, content: s?.content ?? {} };
                })
                .filter(Boolean);

            if (!normalizedSections.length) {
                return res.status(400).json({ message: 'No valid sectionId found' });
            }

            let updatedCount = 0;
            let skippedUnchanged = 0;
            let pageContext = null;
            const projectDoc = await userProjects.findById(projectId).select("projectType").lean();
            const projectType = Number(projectDoc?.projectType ?? 0);
            if (mongoose.isValidObjectId(String(pageId))) {
                pageContext = await WebsitePage.findOne({ _id: pageId, projectId })
                    .select("pageType name slug serviceId locationId")
                    .lean();
            }
            const scopedLocationId = resolveLocationPreferenceForPage({
                preferredLocationId: locationId ? String(locationId) : null,
                projectType,
                pageMeta: pageContext || {}
            });
            const effectiveLocationId = scopedLocationId || pageContext?.locationId || null;
            let sectionEntriesForPage = [];
            try {
                const designData = await WebsiteDesignsData.findOne({ projectId }).select("pages").lean();
                const selectedPage = (designData?.pages || []).find((p) => String(p?.pageId?._id || p?.pageId) === String(pageId));
                sectionEntriesForPage = getSectionEntriesFromPage(selectedPage || {});
            } catch (_e) { }

            // Global dedupe guard for this page+location scope (covers old mixed pageId writes).
            try {
                const existingRows = await SectionContent.find({
                    projectId,
                    ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
                    locationId: effectiveLocationId,
                    isDeleted: { $ne: true }
                })
                    .select("_id sectionId serviceId updatedAt")
                    .sort({ updatedAt: -1, _id: -1 })
                    .lean();
                const seen = new Set();
                const staleIds = [];
                for (const row of existingRows) {
                    const key = `${String(row?.sectionId || "")}::${String(row?.serviceId || "null")}`;
                    if (seen.has(key)) staleIds.push(row._id);
                    else seen.add(key);
                }
                if (staleIds.length) {
                    await SectionContent.deleteMany({ _id: { $in: staleIds } });
                }
            } catch (_e) { }

            for (const s of normalizedSections) {
                const canonicalContent = canonicalizeSectionContent(s.content || {});
                if (!isMeaningfulSectionData(canonicalContent)) {
                    logSectionContentWrite("skipped-empty", {
                        projectId,
                        pageId,
                        sectionId: s.sectionId,
                        locationId: effectiveLocationId,
                        source: "upsertSectionContentFromBuilder"
                    });
                    continue;
                }
                const isBundleWrite = shouldUseServiceBundleForPage(s.sectionId, pageContext || {});
                if (isBundleWrite) {
                    const bundleLocationId = pageContext?.locationId || effectiveLocationId;
                    const serviceDoc = await Service.findOne({
                        _id: pageContext.serviceId,
                        projectId
                    }).select("name slug").lean();
                    const locationDoc = bundleLocationId
                        ? await BusinessLocation.findOne({ _id: bundleLocationId, projectId }).select("areaName").lean()
                        : null;

                    await SectionContent.findOneAndUpdate(
                        {
                            projectId,
                            pageId: pageContext.serviceId,
                            serviceId: pageContext.serviceId,
                            sectionId: "service_sections",
                            locationId: bundleLocationId,
                            isDeleted: { $ne: true }
                        },
                        {
                            $set: {
                                [`data.sections.${s.sectionId}`]: canonicalContent,
                                "data.serviceId": pageContext.serviceId,
                                "data.serviceName": serviceDoc?.name || "",
                                "data.serviceSlug": serviceDoc?.slug || "",
                                "data.locationId": bundleLocationId,
                                "data.locationName": locationDoc?.areaName || "",
                                status: "generated",
                                error: null,
                                isDeleted: false
                            }
                        },
                        { upsert: true }
                    );
                    logSectionContentWrite("saved", {
                        projectId,
                        pageId: pageContext.serviceId,
                        sectionId: `service_sections.${s.sectionId}`,
                        locationId: bundleLocationId,
                        source: "upsertSectionContentFromBuilder"
                    });

                    // Reverse-propagate: push edits from service page back into the
                    // homepage services grid SectionContent data.items[] entry.
                    if (
                        s.sectionId === "aboutservice" ||
                        s.sectionId === "servicedetailabout" ||
                        s.sectionId === "servicehero" ||
                        s.sectionId === "servicedetailhero"
                    ) {
                        try {
                            await propagateServicePageEditsToServicesGrid({
                                projectId,
                                serviceId: String(pageContext.serviceId),
                                sectionType: s.sectionId,
                                content: canonicalContent,
                                locationId: bundleLocationId,
                            });
                        } catch (revPropErr) {
                            console.warn(
                                "[upsertSectionContentFromBuilder] reverse service→grid propagation:",
                                revPropErr.message
                            );
                        }
                    }

                    updatedCount++;
                    continue;
                }

                // Shared reference propagation: if this page section references explicit
                // SectionContent IDs, update those rows so other linked pages stay in sync.
                try {
                    const matchingEntry = sectionEntriesForPage.find((e) => e.sectionType === s.sectionId);
                    const referencedIds = matchingEntry
                        ? collectSectionContentIdsFromRef(matchingEntry?.sectionData?.contentRef || {})
                        : [];
                    if (referencedIds.length) {
                        await SectionContent.updateMany(
                            { _id: { $in: referencedIds }, projectId, isDeleted: { $ne: true } },
                            { $set: { data: canonicalContent, status: "generated", error: null, isDeleted: false } }
                        );
                    }
                } catch (sharedWriteErr) {
                    console.warn("[upsertSectionContentFromBuilder] shared reference propagation skipped:", sharedWriteErr.message);
                }

                // Deduplicate legacy mixed-id duplicates for the same scope, keep latest row.
                const duplicateRows = await SectionContent.find({
                    projectId,
                    ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
                    locationId: effectiveLocationId,
                    sectionId: s.sectionId,
                    isDeleted: { $ne: true }
                })
                    .select("_id updatedAt")
                    .sort({ updatedAt: -1, _id: -1 })
                    .lean();
                if (duplicateRows.length > 1) {
                    const staleIds = duplicateRows.slice(1).map((r) => r._id);
                    if (staleIds.length) {
                        await SectionContent.deleteMany({ _id: { $in: staleIds } });
                    }
                }
                if (effectiveLocationId) {
                    await SectionContent.deleteMany({
                        projectId,
                        ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
                        sectionId: s.sectionId,
                        locationId: null,
                        isDeleted: { $ne: true }
                    });
                }

                const existingDoc = await SectionContent.findOne(
                    {
                        projectId,
                        ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
                        locationId: effectiveLocationId,
                        sectionId: s.sectionId,
                        isDeleted: { $ne: true }
                    }
                ).select("data").lean();
                if (existingDoc?.data && JSON.stringify(existingDoc.data) === JSON.stringify(canonicalContent)) {
                    skippedUnchanged++;
                    continue;
                }
                await SectionContent.findOneAndUpdate(
                    {
                        projectId,
                        ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
                        locationId: effectiveLocationId,
                        sectionId: s.sectionId,
                        isDeleted: { $ne: true }
                    },
                    {
                        $set: {
                            pageId: normalizedPageId,
                            data: canonicalContent,
                            status: 'generated',
                            error: null,
                            isDeleted: false
                        }
                    },
                    { upsert: true }
                );
                logSectionContentWrite("saved", {
                    projectId,
                    pageId,
                    sectionId: s.sectionId,
                    locationId: effectiveLocationId,
                    source: "upsertSectionContentFromBuilder"
                });
                updatedCount++;
                if (normalizeSectionIdForStorage(s.sectionId) === "services") {
                    try {
                        await propagateServicesGridItemsToServiceBundles({
                            projectId,
                            canonicalContent,
                            effectiveLocationId,
                            pageMeta: pageContext || {},
                        });
                    } catch (propErr) {
                        console.warn(
                            "[upsertSectionContentFromBuilder] services grid → bundle propagation:",
                            propErr.message
                        );
                    }
                }
            }

            return res.status(200).json({
                message: 'SectionContent upserted successfully',
                updatedCount,
                skippedUnchanged
            });
        } catch (error) {
            console.error('upsertSectionContentFromBuilder error:', error);
            return res.status(500).json({ message: 'Failed to upsert section content', error: error.message });
        }
    }

};