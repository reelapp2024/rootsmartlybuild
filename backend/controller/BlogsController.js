// controllers/blog.controller.js
const Blog = require("../models/blogs");
const helper = require("../additional/addon");
const UserProject = require('../models/userProjects'); // Import UserProject model
const Service = require("../models/service");
const Author = require("../models/authors")
const Slug = require("../models/slug")
const Notification = require("../models/notification");
const slugify = require("../additional/slugify");

const axios = require("axios");
const https = require("https");
const sharp = require("sharp");
const { Readable } = require("stream");
const mongoose = require('mongoose');

// AI queue worker is registered via AiblogsControllerV2 / routes
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
const {
    fetchJSONFromOpenAI,
    fetchStringFromOpenAI,
    fetchSeoContentForPage,
    trackCreditsUsage
} = require('../additional/openaiHelpers');
module.exports = {
    // CREATE (owned)
    create_blog: async (req, res) => {
        try {
            const userId = req.user && req.user.userId;
            if (!userId) return res.status(401).json({ message: "Unauthorized: user missing" });

            const {
                projectId,
                title,
                information,
                content,
                status,              // 0 draft, 1 published, 2 archived
                type,                // required
                coverImage,
                // legacy nested allowed but optional
                seoMeta,
                // flat meta inputs
                meta_title,
                meta_description,
                meta_keywords,       // array OR '["a","b"]' OR 'a,b,c'
                authorId,            // ✅ now required (instead of authorName)
                isSchedule,
                scheduleTime,
                slug                 // NEW: required from req.body
            } = req.body;

            if (!title || !content || typeof type !== "string" || !type.trim()) {
                return res.status(400).json({ message: "title, content, and type are required" });
            }

            // Validate slug
            if (!slug || typeof slug !== "string" || !slug.trim()) {
                return res.status(400).json({ message: "valid slug is required" });
            }

            // ✅ validate authorId and ownership
            if (!authorId || !mongoose.isValidObjectId(authorId)) {
                return res.status(400).json({ message: "valid authorId is required" });
            }
            const authorExists = await Author.findOne({ _id: authorId, userId });
            if (!authorExists) {
                return res.status(404).json({ message: "Author not found" });
            }

            // Check slug uniqueness within project
            const queryBase = { slug: slug.trim() };
            if (projectId) queryBase.projectId = projectId;
            const slugExists = await Blog.exists(queryBase);
            if (slugExists) {
                return res.status(400).json({ message: "Slug already exists for this project" });
            }

            // Build SEO (flat first, fallback to legacy seoMeta)
            let keywords = [];
            if (meta_keywords !== undefined) {
                if (Array.isArray(meta_keywords)) {
                    keywords = meta_keywords.map(v => String(v).trim()).filter(Boolean);
                } else if (typeof meta_keywords === "string") {
                    const s = meta_keywords.trim();
                    if (s) {
                        try {
                            const parsed = JSON.parse(s);
                            if (Array.isArray(parsed)) {
                                keywords = parsed.map(v => String(v).trim()).filter(Boolean);
                            } else {
                                keywords = s.split(",").map(v => v.trim()).filter(Boolean);
                            }
                        } catch {
                            keywords = s.split(",").map(v => v.trim()).filter(Boolean);
                        }
                    }
                }
            } else if (seoMeta && Array.isArray(seoMeta.keywords)) {
                keywords = seoMeta.keywords.map(v => String(v).trim()).filter(Boolean);
            }

            const builtSeo = {
                metaTitle: meta_title ?? (seoMeta && seoMeta.metaTitle),
                metaDescription: meta_description ?? (seoMeta && seoMeta.metaDescription),
                keywords
            };

            // -----------------------
            // Scheduling (updated)
            // -----------------------
            let finalStatus = [0, 1, 2].includes(Number(status)) ? Number(status) : 0;

            // coerce isSchedule (handles "true"/"1"/"false"/"0")
            let scheduleFlag =
                typeof isSchedule === 'boolean'
                    ? isSchedule
                    : (typeof isSchedule === 'string'
                        ? ['true', '1', 'yes', 'on'].includes(isSchedule.toLowerCase())
                        : Boolean(isSchedule));

            // parse scheduleTime -> Date | null (accept epoch ms or ISO string)
            let scheduleAt = null;
            if (scheduleFlag && scheduleTime != null && String(scheduleTime).trim() !== '') {
                if (typeof scheduleTime === 'number') {
                    scheduleAt = new Date(scheduleTime);
                } else if (typeof scheduleTime === 'string') {
                    const n = Number(scheduleTime);
                    scheduleAt = Number.isFinite(n) ? new Date(n) : new Date(scheduleTime);
                } else {
                    scheduleAt = new Date(scheduleTime);
                }
            }

            if (scheduleFlag) {
                // validate parsed date
                if (!(scheduleAt instanceof Date) || Number.isNaN(scheduleAt.getTime())) {
                    return res.status(400).json({ message: "Valid scheduleTime is required when isSchedule is true" });
                }

                const now = new Date();
                if (scheduleAt <= now) {
                    // past/now -> publish immediately
                    scheduleFlag = false;
                    finalStatus = 1;
                    scheduleAt = null;
                } else {
                    // future -> keep as draft; worker will flip later
                    finalStatus = 0;
                }
            } else {
                // not scheduling -> ignore scheduleTime if sent
                scheduleAt = null;
            }
            // -----------------------

            const { normalizeCoverImageForSave } = require("../services/blogSectionDynamics");
            const normalizedCover = normalizeCoverImageForSave(coverImage, req.body);

            const blog = new Blog({
                userId,
                projectId,
                title: String(title).trim(),
                information,
                content,
                status: finalStatus,
                type: String(type).trim(),
                coverImage: normalizedCover || undefined,
                seoMeta: builtSeo,
                authorId,               // ✅ store the Author reference
                isSchedule: scheduleFlag,
                scheduleTime: scheduleAt, // <-- Date or null (schema: Date)
                slug: slug.trim(),       // NEW: use provided slug
                oldSlugs: [],
            });

            await blog.save();


            // fire-and-forget: trigger sitemap update for this project

            try {
                await axios.post(
                    'https://apis.smartlybuild.dev/admin/v1/updateHostingSitemap',
                    { projectId }, // JSON body
                    {

                        timeout: 10000
                    }
                );
            } catch (e) {
                console.warn('[create_blog] sitemap update call failed:', e?.response?.data || e.message);
            }

            // Create notification for user (blog published or scheduled)
            try {
                if (blog.status === 1) {
                    // Published
                    await Notification.create({
                        userToId: userId,
                        message: `Your blog "${blog.title}" has been published successfully`,
                        type: 'blog_published',
                        relatedId: blog._id
                    });
                } else if (blog.isSchedule && blog.scheduleTime) {
                    // Scheduled
                    await Notification.create({
                        userToId: userId,
                        message: `Your blog "${blog.title}" has been scheduled for ${new Date(blog.scheduleTime).toLocaleString()}`,
                        type: 'blog_scheduled',
                        relatedId: blog._id
                    });
                }
            } catch (notifError) {
                console.error('Error creating blog notification:', notifError);
            }

            return helper.sendSuccess(res, 201, "Blog created successfully", blog);
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, error);
        }
    },

    // UPDATE (owned) — supports flat meta fields
    update_blog: async (req, res) => {
        try {
            const userId = req.user && req.user.userId;
            if (!userId) return res.status(401).json({ message: "Unauthorized: user missing" });

            // accept id from either /updateBlog/:id or ?id=
            const id = req.params?.id || req.query?.id;
            if (!id) return res.status(400).json({ message: "Blog id is required" });

            const updatable = [
                "projectId", "title", "information", "content", "status", "type",
                "coverImage", "seoMeta", "authorId", "isSchedule", "scheduleTime",
                "meta_title", "meta_description", "meta_keywords", "slug"
            ];
            const payload = {};
            for (const key of updatable) {
                if (Object.prototype.hasOwnProperty.call(req.body, key)) {
                    payload[key] = req.body[key];
                }
            }

            if (Object.keys(payload).length === 0) {
                return res.status(400).json({ message: "No valid fields to update" });
            }

            // Normalize coverImage from object, string, or FormData flat keys
            const { normalizeCoverImageForSave } = require("../services/blogSectionDynamics");
            if (
                payload.coverImage !== undefined ||
                req.body["coverImage.url"] !== undefined ||
                req.body.coverImageUrl !== undefined
            ) {
                const normalizedCover = normalizeCoverImageForSave(payload.coverImage, req.body);
                if (normalizedCover) payload.coverImage = normalizedCover;
                else if (payload.coverImage === null || payload.coverImage === "") {
                    payload.coverImage = { url: "", alt: "" };
                } else {
                    delete payload.coverImage;
                }
            }

            // Ensure it exists & is owned by user
            const existing = await Blog.findOne({ _id: id, userId });
            if (!existing) return helper.sendError(res, 404, "Blog not found or not yours");

            // Validate slug if provided
            if (payload.slug !== undefined) {
                if (typeof payload.slug !== "string" || !payload.slug.trim()) {
                    return res.status(400).json({ message: "valid slug is required" });
                }
                const queryBase = {
                    $or: [
                        { slug: payload.slug.trim() },
                        { oldSlugs: payload.slug.trim() } // Check oldSlugs for conflicts
                    ],
                    _id: { $ne: id }
                };
                if (payload.projectId || existing.projectId) {
                    queryBase.projectId = payload.projectId || existing.projectId;
                }
                const slugExists = await Blog.exists(queryBase);
                if (slugExists) {
                    return res.status(400).json({ message: "Slug already exists for this project" });
                }
                // Move old slug to oldSlugs if changed
                if (payload.slug.trim() !== existing.slug) {
                    payload.oldSlugs = existing.oldSlugs || []; // Use payload to update oldSlugs
                    payload.oldSlugs.push(existing.slug);
                    // Optional: Limit oldSlugs to prevent bloat (e.g., keep last 5)
                    if (payload.oldSlugs.length > 5) payload.oldSlugs.shift();
                }
                payload.slug = payload.slug.trim();
            }

            // Basic normalizations (only if present)
            if (payload.title) payload.title = String(payload.title).trim();
            if (payload.type) payload.type = String(payload.type).trim();

            if (payload.status !== undefined) {
                payload.status = [0, 1, 2].includes(Number(payload.status))
                    ? Number(payload.status)
                    : existing.status ?? 0;
            }

            // ✅ authorId change: validate & ensure ownership
            if (payload.authorId !== undefined) {
                if (!payload.authorId || !mongoose.isValidObjectId(payload.authorId)) {
                    return res.status(400).json({ message: "valid authorId is required" });
                }
                const authorExists = await Author.findOne({ _id: payload.authorId, userId });
                if (!authorExists) {
                    return res.status(404).json({ message: "Author not found" });
                }
            }

            // ---------- SEO (flat fields take precedence) ----------
            if (
                payload.meta_title !== undefined ||
                payload.meta_description !== undefined ||
                payload.meta_keywords !== undefined
            ) {
                const currentSeo = payload.seoMeta || existing.seoMeta || {};

                // Normalize keywords from array / JSON string / comma string
                let kw = currentSeo.keywords || [];
                if (payload.meta_keywords !== undefined) {
                    if (Array.isArray(payload.meta_keywords)) {
                        kw = payload.meta_keywords.map(v => String(v).trim()).filter(Boolean);
                    } else if (typeof payload.meta_keywords === "string") {
                        const s = payload.meta_keywords.trim();
                        if (s) {
                            try {
                                const parsed = JSON.parse(s);
                                kw = Array.isArray(parsed)
                                    ? parsed.map(v => String(v).trim()).filter(Boolean)
                                    : s.split(",").map(v => v.trim()).filter(Boolean);
                            } catch {
                                kw = s.split(",").map(v => v.trim()).filter(Boolean);
                            }
                        } else {
                            kw = [];
                        }
                    } else {
                        kw = [];
                    }
                }

                payload.seoMeta = {
                    ...currentSeo,
                    metaTitle: payload.meta_title ?? currentSeo.metaTitle,
                    metaDescription: payload.meta_description ?? currentSeo.metaDescription,
                    keywords: kw
                };

                delete payload.meta_title;
                delete payload.meta_description;
                delete payload.meta_keywords;
            }
            // -------------------------------------------------------

            // ---------- Scheduling (same logic as create_blog) ----------
            if (payload.isSchedule !== undefined || payload.scheduleTime !== undefined) {
                // normalize isSchedule
                let scheduleFlag =
                    typeof payload.isSchedule === 'boolean'
                        ? payload.isSchedule
                        : (typeof payload.isSchedule === 'string'
                            ? ['true', '1', 'yes', 'on'].includes(payload.isSchedule.toLowerCase())
                            : Boolean(payload.isSchedule));

                // parse scheduleTime (accept ISO or epoch)
                let scheduleAt = null;
                if (payload.scheduleTime != null && String(payload.scheduleTime).trim() !== '') {
                    if (typeof payload.scheduleTime === 'number') {
                        scheduleAt = new Date(payload.scheduleTime);
                    } else if (typeof payload.scheduleTime === 'string') {
                        const n = Number(payload.scheduleTime);
                        scheduleAt = Number.isFinite(n) ? new Date(n) : new Date(payload.scheduleTime);
                    } else {
                        scheduleAt = new Date(payload.scheduleTime);
                    }
                }

                const hasValidDate = scheduleAt instanceof Date && !Number.isNaN(scheduleAt.getTime());
                const now = new Date();

                if (scheduleFlag) {
                    if (!hasValidDate) {
                        return res.status(400).json({ message: "Valid scheduleTime is required when isSchedule is true" });
                    }
                    if (scheduleAt <= now) {
                        payload.isSchedule = false;
                        payload.scheduleTime = scheduleAt;
                        payload.status = 1;
                    } else {
                        payload.isSchedule = true;
                        payload.scheduleTime = scheduleAt;
                        if (payload.status === undefined) payload.status = 0;
                    }
                } else if (payload.scheduleTime !== undefined) {
                    if (!hasValidDate) {
                        return res.status(400).json({ message: "Invalid scheduleTime" });
                    }
                    if (scheduleAt <= now) {
                        payload.isSchedule = false;
                        payload.scheduleTime = scheduleAt;
                        if (payload.status === undefined) payload.status = 1;
                    } else {
                        payload.isSchedule = true;
                        payload.scheduleTime = scheduleAt;
                        if (payload.status === undefined) payload.status = 0;
                    }
                } else {
                    payload.isSchedule = false;
                    payload.scheduleTime = null;
                }
            }
            // -----------------------------------------------------------

            const updated = await Blog.findOneAndUpdate(
                { _id: id, userId },
                { $set: payload }, // Use $set to update fields
                { new: true }
            );


            try {
                await axios.post(
                    'https://apis.smartlybuild.dev/admin/v1/updateHostingSitemap',
                    { projectId: updated.projectId }, // Get the projectId from the updated blog object
                    {
                        timeout: 10000
                    }
                );
            } catch (e) {
                console.warn('[update blog] sitemap update call failed:', e?.response?.data || e.message);
            }


            return helper.sendSuccess(res, 200, "Blog updated successfully", updated);
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, error);
        }
    },

    // READ ONE (owned)
    get_blog: async (req, res) => {
        try {
            const userId = req.user && req.user.userId;
            if (!userId) return res.status(401).json({ message: "Unauthorized: user missing" });

            const { id } = req.query;
            if (!id) return res.status(400).json({ message: "Blog id is required" });

            const blog = await Blog.findOne({ _id: id });
            if (!blog) return helper.sendError(res, 404, "Blog not found");

            return helper.sendSuccess(res, 200, "OK", blog);

        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, error);
        }
    },



    get_blog_by_slug: async (req, res) => {
        try {
            const projectId = String(
                req.body?.projectId || req.query?.projectId || ""
            ).trim();
            const rawSlug = String(
                req.body?.slug || req.query?.slug || ""
            ).trim();
            const blogId = String(
                req.body?.blogId || req.query?.blogId || ""
            ).trim();

            if (!projectId || !mongoose.isValidObjectId(projectId)) {
                return helper.sendError(res, 400, "Valid projectId is required");
            }
            if (!rawSlug && !blogId) {
                return helper.sendError(res, 400, "slug or blogId is required");
            }

            const slug = rawSlug
                .replace(/^\/+|\/+$/g, "")
                .replace(/^blog\//i, "")
                .toLowerCase();

            const {
                buildPublishedBlogDetailPayload,
            } = require("../services/blogSectionDynamics");

            const detail = await buildPublishedBlogDetailPayload(projectId, {
                slug,
                blogId,
            });
            if (!detail) {
                return helper.sendError(res, 404, "Blog not found");
            }

            // Non-blocking view bump
            Blog.updateOne({ _id: detail.blogId }, { $inc: { views: 1 } }).catch(() => {});

            return helper.sendSuccess(res, 200, "OK", detail);
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, error);
        }
    },

    /** Alias — GenieBuild / SiteNextJS live article API (same as get_blog_by_slug). */
    get_published_blog: async (req, res) => {
        return module.exports.get_blog_by_slug(req, res);
    },

    /**
     * Public: full author for a blog (all social / custom links).
     * Body/query: { blogId } | { authorId } | { projectId, slug }
     */
    get_blog_author: async (req, res) => {
        try {
            const { normalizeAuthorLinks } = require("../additional/authorLinks");
            const {
                absolutizeMediaUrl,
                extractMediaUrl,
            } = require("../services/blogSectionDynamics");

            const src = { ...(req.query || {}), ...(req.body || {}) };
            const blogId = String(src.blogId || "").trim();
            const authorId = String(src.authorId || "").trim();
            const projectId = String(src.projectId || "").trim();
            const slug = String(src.slug || "")
                .trim()
                .toLowerCase()
                .replace(/^\/+|\/+$/g, "")
                .replace(/^blog\//, "");

            let author = null;
            if (authorId && mongoose.isValidObjectId(authorId)) {
                author = await Author.findById(authorId).lean();
            } else if (blogId && mongoose.isValidObjectId(blogId)) {
                const blog = await Blog.findById(blogId).select("authorId").lean();
                if (blog?.authorId) {
                    author = await Author.findById(blog.authorId).lean();
                }
            } else if (projectId && slug) {
                const blog = await Blog.findOne({
                    projectId,
                    status: 1,
                    $or: [{ slug }, { oldSlugs: slug }],
                })
                    .select("authorId")
                    .lean();
                if (blog?.authorId) {
                    author = await Author.findById(blog.authorId).lean();
                }
            }

            if (!author) {
                return res.status(404).json({ message: "Author not found" });
            }

            const image = absolutizeMediaUrl(extractMediaUrl(author.image));
            return res.status(200).json({
                message: "OK",
                data: {
                    authorId: String(author._id),
                    name: String(author.name || "").trim(),
                    jobTitle: String(author.jobTitle || "").trim(),
                    bio: String(author.bio || "").trim(),
                    image,
                    avatar: image,
                    links: normalizeAuthorLinks(author.links),
                },
            });
        } catch (error) {
            console.error("[get_blog_author]", error);
            return helper.sendError(res, 500, error?.message || error);
        }
    },

    // LIST (owned)
    list_blogs: async (req, res) => {
        try {
            const userId = req.user && req.user.userId;
            if (!userId) return res.status(401).json({ message: "Unauthorized: user missing" });

            const {
                page = 1,
                limit = 10,
                status,
                projectId,
                type,
                authorName,
                isSchedule,
                scheduledFrom,
                scheduledTo
            } = req.query;

            const filter = { userId };

            if ([0, 1, 2].includes(Number(status))) filter.status = Number(status);
            if (projectId) filter.projectId = projectId;
            if (type) filter.type = type;
            // Legacy query param authorName — resolve via Author collection when possible
            if (authorName) {
                const authors = await Author.find({
                    name: { $regex: String(authorName), $options: "i" },
                })
                    .select("_id")
                    .lean();
                const ids = authors.map((a) => a._id);
                if (ids.length) filter.authorId = { $in: ids };
                else filter.authorId = null; // force empty
            }

            if (isSchedule !== undefined) {
                const flag = String(isSchedule).toLowerCase();
                const parsed = ["1", "true", "yes"].includes(flag)
                    ? true
                    : ["0", "false", "no"].includes(flag)
                        ? false
                        : undefined;
                if (parsed !== undefined) filter.isSchedule = parsed;
            }

            if (scheduledFrom || scheduledTo) {
                filter.scheduleTime = {};
                const parseTs = (v) => {
                    if (v === undefined) return undefined;
                    let n = Number(String(v).trim());
                    if (Number.isFinite(n)) {
                        if (n < 1e12) n *= 1000; // seconds -> ms
                        const d = new Date(n);
                        return isNaN(d) ? undefined : d;
                    }
                    const d = new Date(v);
                    return isNaN(d) ? undefined : d;
                };
                const from = parseTs(scheduledFrom);
                const to = parseTs(scheduledTo);
                if (from) filter.scheduleTime.$gte = from;
                if (to) filter.scheduleTime.$lte = to;
                if (Object.keys(filter.scheduleTime).length === 0) delete filter.scheduleTime;
            }

            const skip = (Number(page) - 1) * Number(limit);

            const [docs, total] = await Promise.all([
                Blog.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    // ⬇️ include authorId so we can map it to the author's name
                    .select("_id title type views authorId authorName coverImage slug status createdAt updatedAt scheduleTime")
                    .lean(),
                Blog.countDocuments(filter)
            ]);

            // ⬇️ NEW: map authorId -> author.name
            const authorIds = Array.from(
                new Set(
                    (docs || [])
                        .map(d => d.authorId)
                        .filter(Boolean)
                        .map(id => id.toString())
                )
            );

            let authorMap = new Map();
            if (authorIds.length) {
                const authors = await Author.find({ _id: { $in: authorIds } })
                    .select("_id name")
                    .lean();
                authorMap = new Map(authors.map(a => [a._id.toString(), a.name]));
            }

            const items = docs.map(d => ({
                _id: d._id,
                title: d.title,
                type: d.type,
                views: d.views,
                // Prefer name resolved from authorId; fallback to legacy authorName; else null
                author: authorMap.get((d.authorId || "").toString()) || d.authorName || null,
                coverImage: d.coverImage,
                coverImate: d.coverImage, // legacy typo alias (admin)
                slug: d.slug,
                status: d.status,
                createdAt: d.createdAt,
                updatedAt: d.updatedAt,
                scheduleTime: d.scheduleTime ?? null
            }));

            return helper.sendSuccess(res, 200, "OK", {
                items,
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit) || 1)
            });
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, error);
        }
    },

    /**
     * Public published blogs for a project (site / GenieBuild blogs page).
     * Query: projectId (required), page, limit, search, type
     */
    list_published_blogs: async (req, res) => {
        try {
            const projectId = String(
                req.query?.projectId || req.body?.projectId || ""
            ).trim();
            if (!projectId) {
                return res.status(400).json({ message: "projectId is required" });
            }
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({ message: "Invalid projectId" });
            }

            const page = Number(req.query?.page || req.body?.page || 1) || 1;
            const limit = Number(req.query?.limit || req.body?.limit || 9) || 9;
            const search = String(req.query?.search || req.body?.search || "").trim();
            const type = String(req.query?.type || req.body?.type || "").trim();

            const {
                buildBlogListSectionData,
                listPublishedBlogCategories,
            } = require("../services/blogSectionDynamics");

            const [payload, categories] = await Promise.all([
                buildBlogListSectionData(projectId, {
                    page,
                    limit,
                    search,
                    type,
                }),
                listPublishedBlogCategories(projectId),
            ]);
            const data = payload?.data || {};
            const pagination = data.pagination || payload?.meta?.pagination || {};

            return res.status(200).json({
                message: "OK",
                data: {
                    items: Array.isArray(data.items) ? data.items : [],
                    emptyStateMessage: data.emptyStateMessage || "No blogs found",
                    categories,
                    page: Number(pagination.page || page),
                    limit: Number(pagination.limit || limit),
                    total: Number(pagination.total || 0),
                    pages: Number(pagination.pages || 1),
                },
            });
        } catch (error) {
            console.error("list_published_blogs error:", error);
            return res.status(500).json({
                message: "Failed to list published blogs",
                error: String(error?.message || error),
            });
        }
    },

    related_blogs: async (req, res) => {
        try {
            const projectId = String(
                req.body?.projectId || req.query?.projectId || ""
            ).trim();
            const limit = Number(req.body?.limit || req.query?.limit || 6) || 6;
            const excludeSlug = String(
                req.body?.excludeSlug || req.query?.excludeSlug || ""
            ).trim();
            const slug = String(req.body?.slug || req.query?.slug || excludeSlug || "").trim();
            const blogId = String(req.body?.blogId || req.query?.blogId || "").trim();

            if (!projectId || !mongoose.isValidObjectId(projectId)) {
                return res.status(400).json({ message: "Valid projectId is required" });
            }

            const { buildBlogRelatedItems } = require("../services/blogSectionDynamics");
            const items = await buildBlogRelatedItems(projectId, {
                slug: slug.replace(/^blog\//i, ""),
                blogId,
                limit,
            });

            return res.status(200).json({
                message: "OK",
                data: { items },
                // legacy flat keys for aiblogsQueue consumers
                items,
                count: items.length,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Server error", error: String(error?.message || error) });
        }
    },





    // DELETE (owned)
    delete_blog: async (req, res) => {
        try {
            const userId = req.user && req.user.userId;
            if (!userId) return res.status(401).json({ message: "Unauthorized: user missing" });

            const { id } = req.query;
            if (!id) return res.status(400).json({ message: "Blog id is required" });

            const deleted = await Blog.findOneAndDelete({ _id: id, userId });
            if (!deleted) return helper.sendError(res, 404, "Blog not found or not yours");

            return helper.sendSuccess(res, 200, "Blog deleted successfully", deleted);
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, error);
        }
    },

    // STATUS (owned)
    set_blog_status: async (req, res) => {
        try {
            const userId = req.user && req.user.userId;
            if (!userId) return res.status(401).json({ message: "Unauthorized: user missing" });

            const { id } = req.query;
            const { status } = req.body; // 0/1/2
            if (!id || ![0, 1, 2].includes(Number(status))) {
                return res.status(400).json({ message: "Valid blog id and status are required" });
            }

            const blog = await Blog.findOneAndUpdate(
                { _id: id, userId },
                { status: Number(status) },
                { new: true }
            );
            if (!blog) return helper.sendError(res, 404, "Blog not found or not yours");

            return helper.sendSuccess(res, 200, "Status updated", blog);
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, error);
        }
    },

    // VIEWS (public)
    increment_views: async (req, res) => {
        try {
            const { id } = req.query;
            if (!id) return res.status(400).json({ message: "Blog id is required" });

            const blog = await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
            if (!blog) return helper.sendError(res, 404, "Blog not found");

            return helper.sendSuccess(res, 200, "View counted", { views: blog.views, id: blog._id });
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, error);
        }
    },

    // LIKE (public)
    like_blog: async (req, res) => {
        try {
            const { id } = req.query;
            if (!id) return res.status(400).json({ message: "Blog id is required" });

            const blog = await Blog.findByIdAndUpdate(id, { $inc: { likesCount: 1 } }, { new: true });
            if (!blog) return helper.sendError(res, 404, "Blog not found");

            return helper.sendSuccess(res, 200, "Liked", { likesCount: blog.likesCount, id: blog._id });
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, error);
        }
    },

    // UNLIKE (public)
    unlike_blog: async (req, res) => {
        try {
            const { id } = req.query;
            if (!id) return res.status(400).json({ message: "Blog id is required" });

            const blog = await Blog.findByIdAndUpdate(id, { $inc: { likesCount: -1 } }, { new: true });
            if (!blog) return helper.sendError(res, 404, "Blog not found");

            if (blog.likesCount < 0) {
                blog.likesCount = 0;
                await blog.save();
            }
            return helper.sendSuccess(res, 200, "Unliked", { likesCount: blog.likesCount, id: blog._id });
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, error);
        }
    },

    create_ai_blog_withoutqueue: async (req, res) => {
        try {
            // ---- auth ----
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ message: "Unauthorized: user missing" });

            // ---- inputs ----
            const { projectId, type, authorName, status } = req.body;
            if (!projectId) return res.status(400).json({ message: "projectId is required" });
            if (!type || !String(type).trim()) return res.status(400).json({ message: "type is required" });

            // Accept string OR array for title(s)
            const toArray = (v) => {
                if (v == null) return [];
                if (Array.isArray(v)) return v;
                if (typeof v === "string") {
                    try { const p = JSON.parse(v); if (Array.isArray(p)) return p; } catch { }
                    return v.split(/\n+/).map(s => String(s).trim()).filter(Boolean);
                }
                return [v].filter(Boolean);
            };
            const clean = (s) => String(s || "").trim();
            const titles = toArray(req.body.title).map(clean).filter(Boolean);
            if (!titles.length) return res.status(400).json({ message: "title (string or array) is required" });

            // ---- tiny utils (shared) ----
            const ensureOrigin = (d) => /^https?:\/\//i.test(d) ? d.replace(/\/+$/, "") : `https://${String(d || "").replace(/\/+$/, "")}`;
            const slugifyText = (s) => clean(s).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
            const normDash = (s) => slugifyText(s).replace(/\s+/g, "-");
            const tokensFrom = (s) => slugifyText(s).split(" ").filter(Boolean);
            const pathParts = (u) => {
                try { const { pathname } = new URL(u); return decodeURIComponent(pathname || "").toLowerCase().split("/").filter(Boolean); }
                catch { return String(u).toLowerCase().split("/").filter(Boolean); }
            };
            const containsAll = (hay, needles) => needles.every(nd => hay.includes(nd));
            const toTitleCase = (str) => str.replace(/\b[a-z]/g, c => c.toUpperCase());

            // ---- fetch project (once) ----
            const project = await UserProject.findById(projectId).lean();
            if (!project) return res.status(404).json({ message: "Project not found" });

            const domain = ensureOrigin(project.domainName || "");
            const projectName = clean(project.projectName || "Project");
            const serviceType = clean(project.serviceType || "");

            // ---- build site links once (domain + slugs/services) ----
            const rawSlugs = await Slug.distinct("slug", { projectId });
            const locationSlugs = [...new Set(
                rawSlugs.filter(s => typeof s === "string" && s.trim())
                    .map(s => `/${s.trim().replace(/^\/+/, "")}`)
            )].sort();

            const staticSlugs = ["/", "/privacy-policy", "/about", "/contact", "/terms-conditions", "/services", "/areas"];

            const rawServiceNames = await Service.distinct("name", { projectId });
            const serviceSlugs = rawServiceNames.map(clean).filter(Boolean).map(normDash).filter(Boolean);
            const servicePageSlugs = serviceSlugs.map(s => `/services/${s}`);
            const locationServiceSlugs = locationSlugs.flatMap(loc => serviceSlugs.map(s => `${loc.replace(/\/$/, "")}/services/${s}`));

            const allSlugs = [...new Set([...staticSlugs, ...locationSlugs, ...servicePageSlugs, ...locationServiceSlugs])];
            const siteLinks = allSlugs.map(slug => new URL(slug.replace(/^\/*/, "/"), domain + "/").href);

            // ---- services main (once) ----
            const servicesMain = await Service.find({ projectId }).select("name").limit(30).lean();
            const topServicesList = servicesMain.map((s, i) => `  ${i + 1}. ${clean(s.name)}`).join("\n");

            // ---- shared style rule ----
            const styleText = clean(type);
            const styleRule = (() => {
                const s = styleText.toLowerCase();
                if (/(^|\s)(vs|versus|comparison|compare)(\s|$)/.test(s)) return 'H1 must include "vs" or "versus"; include a concise comparison table and a verdict.';
                if (s.startsWith("why") || s.includes("why choose")) return 'H1 must start with "Why" or "Why Choose".';
                if (/how/.test(s)) return 'H1 must start with "How to"; include a numbered list of steps.';
                if (/(^|\s)(list|top|best|listicle)(\s|$)/.test(s)) return 'Make it a listicle with "Top <N>" or "Best <N>" and numbered H2 items.';
                if (/case/.test(s)) return 'Include "Case Study" in H1 and sections: Context, Approach, Results, Takeaways.';
                if (/beginner/.test(s)) return 'Include "Beginner’s Guide" and a simple checklist.';
                if (/trouble|fix|error|issue/.test(s)) return 'Make it "Troubleshooting": symptoms, causes, fixes, prevention.';
                if (/myth/.test(s)) return 'Include "Myth vs Fact" with 5–8 myths corrected.';
                if (/tip/.test(s)) return 'Include "Tips" and group them under H2 themes.';
                if (/faq|question/.test(s)) return 'Include "FAQ" section with 8–12 concise Q&As.';
                return `Match the requested style: "${styleText}".`;
            })();

            // ---- helpers used per-title ----
            const deriveSize = (url) => {
                const m1 = url.match(/[-_](\d{2,4})x(\d{2,4})(?=\.)/i);
                if (m1) return { w: +m1[1], h: +m1[2] };
                const m2 = url.match(/[_-](\d{3,5})(?=\.)/);
                if (m2) { const w = +m2[1]; return { w, h: Math.round(w * 0.62) }; }
                const m3 = url.match(/\/w[_-]?(\d{3,5}),h[_-]?(\d{3,5})\//i);
                if (m3) return { w: +m3[1], h: +m3[2] };
                return { w: 1200, h: 800 };
            };
            const bestAlt = (url) => {
                const parts = pathParts(url);
                const last = parts[parts.length - 1] || "";
                const base = last.replace(/\.[a-z0-9]+$/i, "");
                const readable = base.replace(/[-_]+/g, " ").trim();
                const ctx = serviceType || projectName;
                return readable ? `${toTitleCase(readable)} – ${ctx}` : `${projectName} ${ctx}`.trim();
            };
            const withImgAttrs = (html) => html.replace(/<img\b([^>]*)>/gi, (_m, attrs) => {
                let tag = attrs;
                const has = (n) => new RegExp(`\\b${n}\\s*=`, "i").test(tag);
                const get = (n) => { const mm = tag.match(new RegExp(`${n}\\s*=\\s*["']([^"']+)["']`, "i")); return mm ? mm[1] : ""; };
                const src = get("src");
                if (!src) return `<img${attrs}>`;
                if (!has("alt")) {
                    const alt = bestAlt(src).replace(/"/g, "&quot;");
                    tag += ` alt="${alt}"`;
                }
                const { w, h } = deriveSize(src);
                if (!has("width")) tag += ` width="${w}"`;
                if (!has("height")) tag += ` height="${h}"`;
                const ar = (w && h) ? (w / h).toFixed(3) : "1.500";
                const styleExists = get("style");
                const responsive = `max-width:800px;width:100%;height:auto;aspect-ratio:${ar}`;
                if (!styleExists) tag += ` style="${responsive}"`;
                else if (!/max-width|aspect-ratio|height:auto/i.test(styleExists)) tag = tag.replace(/style=["'][^"']*["']/, m => m.replace(/["']$/, `; ${responsive}"`));
                if (!has("loading")) tag += ` loading="lazy"`;
                if (!has("decoding")) tag += ` decoding="async"`;
                return `<img${tag}>`;
            });

            const anchorTextFor = (url, locationHints) => {
                const parts = pathParts(url);
                const hasServices = parts.includes("services");
                let svc = "";
                if (hasServices) {
                    const idx = parts.indexOf("services");
                    svc = parts[idx + 1] || "";
                }
                const locHit = locationHints.find(loc => containsAll(parts.join(" "), loc.split(" ")));
                const svcReadable = svc ? toTitleCase(svc.replace(/-/g, " ")) : "Services";
                return locHit ? `${svcReadable} in ${toTitleCase(locHit)}` : svcReadable;
            };

            const ensureInBodyAnchors = (html, wantUrls, minCount, locationHints) => {
                let out = html;
                const already = new Set(Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)).map(m => m[1]));
                const needed = wantUrls.filter(u => !already.has(u)).slice(0, Math.max(0, minCount - already.size));
                if (!needed.length) return { html: out, added: [] };

                const blocks = out.split(/(<\/?(?:p|h2|h3|li|section|div)[^>]*>)/gi);
                const added = [];

                const tryInsert = (blockIdx, url) => {
                    const anchorText = anchorTextFor(url, locationHints);
                    if (!anchorText) return false;
                    const re = new RegExp(`\\b(${anchorText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "i");
                    if (!/^</.test(blocks[blockIdx]) && re.test(blocks[blockIdx])) {
                        blocks[blockIdx] = blocks[blockIdx].replace(re, `<a href="${url}" rel="noopener noreferrer nofollow">$1</a>`);
                        added.push(url);
                        return true;
                    }
                    if (!/^</.test(blocks[blockIdx]) && /[a-z]/i.test(blocks[blockIdx])) {
                        blocks[blockIdx] = `${blocks[blockIdx]} <span>Learn more about <a href="${url}" rel="noopener noreferrer nofollow">${anchorText}</a>.</span>`;
                        added.push(url);
                        return true;
                    }
                    return false;
                };

                let bi = 0;
                for (const url of needed) {
                    let placed = false;
                    for (; bi < blocks.length && !placed; bi++) {
                        if (/(^<\/?(p|h2|h3|li|section|div)\b)/i.test(blocks[bi])) continue;
                        placed = tryInsert(bi, url);
                    }
                }

                out = blocks.join("");
                return { html: out, added };
            };

            // ---- per-title processor ----
            const processOne = async (blogTitle) => {
                // 1) Images for this title
                let coverUrl = "";
                let imagePool = [];
                try {
                    const mages = await axios.post("https://apis.smartlybuild.dev/admin/v1/fetch_and_save_images", { prompt: blogTitle });
                    const arr = Array.isArray(mages?.data?.data) ? mages.data.data : [];
                    imagePool = arr.slice(0, 20);
                    coverUrl = arr[2] || arr[0] || "";
                } catch { /* no images fine */ }

                // 2) Build relevance signals for this title
                const titleTokens = new Set(tokensFrom(blogTitle));

                const serviceSeedsText = [...new Set([serviceType, ...servicesMain.map(s => clean(s.name))].filter(Boolean))];
                const serviceVariants = new Set();
                for (const s of serviceSeedsText) {
                    const spaced = slugifyText(s);
                    const dashed = normDash(s);
                    if (spaced) serviceVariants.add(spaced);
                    if (dashed) serviceVariants.add(dashed);
                }
                const tks = tokensFrom(blogTitle);
                for (let n = 2; n <= 3; n++) for (let i = 0; i + n <= tks.length; i++) {
                    const gramSp = tks.slice(i, i + n).join(" ");
                    const gramDh = gramSp.replace(/\s+/g, "-");
                    serviceVariants.add(gramSp); serviceVariants.add(gramDh);
                }

                const locationHints = (() => {
                    const out = [];
                    const re = /\b(?:in|at|within|near)\s+([A-Za-z][A-Za-z0-9.'-]*(?:\s+[A-Za-z][A-Za-z0-9.'-]*){0,3})\b/gi;
                    let m; while ((m = re.exec(blogTitle))) out.push(slugifyText(m[1]));
                    return [...new Set(out)];
                })();

                // 3) Score links for this title
                const scoreLink = (url) => {
                    const parts = pathParts(url);
                    const hay = parts.join(" ");
                    let s = 0;

                    if (parts.includes("services")) s += 10;

                    let svcHits = 0;
                    for (const v of serviceVariants) if (v && hay.includes(v)) svcHits++;
                    s += svcHits * 6;

                    let locHits = 0;
                    for (const loc of locationHints) {
                        const lt = loc.split(" ").filter(Boolean);
                        if (lt.length && containsAll(hay, lt)) locHits++;
                    }
                    s += locHits * 10;

                    if (svcHits > 0 && locHits > 0) s += 30;

                    for (const tok of titleTokens) if (tok.length >= 3 && hay.includes(tok)) s += 2;

                    for (const seg of parts) if (serviceVariants.has(seg)) s += 8;

                    s += Math.max(0, 6 - Math.min(parts.length, 6));
                    return s;
                };

                const ranked = siteLinks.map(u => ({ u, s: scoreLink(u) })).sort((a, b) => b.s - a.s);

                const isLocService = (u) => {
                    const p = pathParts(u);
                    const hasSvc = Array.from(serviceVariants).some(v => p.includes(v) || p.join(" ").includes(v));
                    const hasLoc = locationHints.some(loc => containsAll(p.join(" "), loc.split(" ")));
                    return p.includes("services") && hasSvc && hasLoc;
                };
                const isSvcOnly = (u) => {
                    const p = pathParts(u);
                    const hasSvc = Array.from(serviceVariants).some(v => p.includes(v) || p.join(" ").includes(v));
                    return p[0] === "services" && hasSvc;
                };
                const isLocRoot = (u) => locationHints.some(loc => containsAll(pathParts(u).join(" "), loc.split(" ")));
                const isServicesRoot = (u) => pathParts(u)[0] === "services" && pathParts(u).length <= 2;

                const pushUnique = (arr, url) => { if (!arr.includes(url)) arr.push(url); };
                let selectedLinks = [];
                ranked.filter(x => isLocService(x.u)).forEach(x => pushUnique(selectedLinks, x.u));
                ranked.filter(x => isLocRoot(x.u)).forEach(x => pushUnique(selectedLinks, x.u));
                ranked.filter(x => isSvcOnly(x.u)).forEach(x => pushUnique(selectedLinks, x.u));
                ranked.filter(x => isServicesRoot(x.u)).forEach(x => pushUnique(selectedLinks, x.u));
                ranked.forEach(x => pushUnique(selectedLinks, x.u));
                selectedLinks = selectedLinks.slice(0, Math.min(6, Math.max(3, selectedLinks.length)));

                // 4) Build prompt (stateless)
                const imagesList = imagePool.map((u, i) => `  ${i + 1}. ${u}`).join("\n");
                const linksList = selectedLinks.map((u, i) => `  ${i + 1}. ${u}`).join("\n");
                const prompt = `
IMPORTANT: This is a standalone task. IGNORE any prior prompts, outputs, or context. Use ONLY the “Context”, “Media”, and “Internal Links” blocks below.

Return ONLY valid JSON with this shape:
{
  "title": string,
  "content_html": string,
  "used_links": string[],
  "used_images": string[],
  "meta": { "title": string, "description": string, "keywords": string[] }
}

Context:
- Project: "${projectName}"
- Service/Niche: "${serviceType || "(not set)"}"
- Provided Title: "${blogTitle}"
- Requested Style: "${styleText}"
- HARD STYLE RULE: ${styleRule}
- Top Services:
${topServicesList || "  (none)"}

Media:
- Cover image (optional): ${coverUrl || "(none)"}
- Candidate images (use 2–6 with alt+captions):
${imagesList || "  (none)"}

Internal Links (pre-filtered: prefer location-specific service pages; use 3–6 IN-BODY with descriptive anchor text):
${linksList || "  (none)"} and in internal links do not write learn more.

Writing Guide:
- You must write the INTRODUCTION yourself.
- Use clean, semantic HTML (~1200–1800 words) with H2/H3 sections.
- Include "Key Takeaways" bullets near the end.
- If appropriate, add a short "FAQ" (3–5 Q&As).
- Embed chosen images as <figure><img ...><figcaption>...</figcaption></figure>.
- Avoid artifacts like "in X in X". Do not repeat the same link/image twice.

Output Rules:
- Return ONLY the JSON object (no markdown fences, no extra text).
`.trim();

                const pageId = `ai_blog_${projectId}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
                let model = await fetchJSONFromOpenAI(prompt, "CREATE_AI_BLOG_SIMPLE", {
                    userId,
                    projectId,
                    pageId,
                    promptFrom: "createAIBlog",
                    promptFor: `${projectName}::${blogTitle}`,
                    disableMemory: true,
                    noFewShot: true,
                    newThread: true
                });

                if (typeof model === "string") { try { model = JSON.parse(model); } catch { } }
                if (!model || typeof model !== "object") throw new Error("Model did not return a valid JSON object.");

                let { title: aiTitle, content_html, used_links: usedLinks, used_images: usedImages, meta } = model;
                aiTitle = clean(aiTitle || blogTitle);
                if (!content_html || !clean(content_html)) throw new Error("Model did not return content_html.");
                content_html = content_html.replace(/\b(in|at|within|across)\s+in\b/gi, "$1 ").trim();

                // 5) Enforce in-body anchors
                const allowedLinks = new Set(selectedLinks);
                usedLinks = Array.isArray(usedLinks) ? usedLinks.map(clean).filter(u => allowedLinks.has(u)) : [];
                const minAnchors = Math.min(5, selectedLinks.length);
                const inj = ensureInBodyAnchors(content_html, selectedLinks, minAnchors, locationHints);
                content_html = inj.html;
                usedLinks = Array.from(new Set([...usedLinks, ...inj.added]));

                if (selectedLinks.length && usedLinks.length < Math.min(3, selectedLinks.length)) {
                    const extras = selectedLinks.filter(u => !usedLinks.includes(u)).slice(0, 5 - usedLinks.length);
                    if (extras.length) {
                        const list = extras.map(u => `<li><a href="${u}" rel="noopener noreferrer nofollow">${u.replace(/^https?:\/\//, "")}</a></li>`).join("");
                        content_html += `<section><h2>Related Resources</h2><ul>${list}</ul></section>`;
                        usedLinks = usedLinks.concat(extras);
                    }
                }

                // 6) Image width/height/alt/style; cover/gallery fallbacks
                content_html = withImgAttrs(content_html);
                if (coverUrl && !/img\s+[^>]*src=/i.test(content_html)) {
                    const { w, h } = deriveSize(coverUrl);
                    const alt = `${projectName} – ${serviceType || "Cover"}`.trim();
                    const fig = `<figure><img src="${coverUrl}" alt="${alt}" width="${w}" height="${h}" style="max-width:800px;width:100%;height:auto;aspect-ratio:${(w / h).toFixed(3)}" loading="lazy" decoding="async"><figcaption>${alt}</figcaption></figure>`;
                    content_html = `${fig}\n${content_html}`;
                }
                if (!/img\s+[^>]*src=/i.test(content_html) && imagePool.length) {
                    const gallery = imagePool.slice(0, Math.min(6, imagePool.length)).map(u => {
                        const { w, h } = deriveSize(u);
                        const alt = bestAlt(u);
                        return `<figure><img src="${u}" alt="${alt}" width="${w}" height="${h}" style="max-width:800px;width:100%;height:auto;aspect-ratio:${(w / h).toFixed(3)}" loading="lazy" decoding="async"><figcaption>${alt}</figcaption></figure>`;
                    }).join("");
                    content_html += `<section><h2>Gallery</h2>${gallery}</section>`;
                }
                const imgSrcs = Array.from(content_html.matchAll(/<img\b[^>]*src=["']([^"']+)["']/gi)).map(m => clean(m[1]));
                const poolSet = new Set(imagePool);
                const usedImagesFinal = Array.from(new Set(imgSrcs.filter(u => poolSet.has(u))));

                // 7) Meta
                const metaTitle = clean(meta?.title || aiTitle).slice(0, 60);
                const metaDescription = clean(meta?.description || `${projectName} ${serviceType}`).slice(0, 160);
                let keywords = Array.isArray(meta?.keywords) ? meta.keywords : [];
                keywords = Array.from(new Set(keywords.map(clean).filter(Boolean)));

                // 8) Persist
                const finalStatus = [0, 1, 2].includes(Number(status)) ? Number(status) : 0;

                const blogDoc = new Blog({
                    userId,
                    projectId,
                    title: aiTitle,
                    content: content_html,
                    status: finalStatus,
                    type: styleText,
                    coverImage: coverUrl ? { url: String(coverUrl).trim(), alt: "" } : undefined,
                    images: usedImagesFinal.length ? usedImagesFinal : undefined,
                    seoMeta: { metaTitle, metaDescription, keywords },
                    authorName: authorName ? clean(authorName) : undefined
                });
                await blogDoc.save();

                return {
                    data: {
                        _id: blogDoc._id,
                        projectId: blogDoc.projectId,
                        title: blogDoc.title,
                        type: blogDoc.type,
                        status: blogDoc.status,
                        coverImage: blogDoc.coverImage,
                        images: blogDoc.images,
                        seoMeta: blogDoc.seoMeta
                    },
                    ai_meta: {
                        selected_links: selectedLinks,
                        used_links: usedLinks,
                        used_images: usedImagesFinal,
                        services_used: servicesMain.map(s => clean(s.name)),
                        location_hints: locationHints
                    }
                };
            };

            // ---- process all titles (sequential to avoid rate limits; keep stable) ----
            const results = [];
            for (const t of titles) {
                try {
                    const r = await processOne(t);
                    results.push({ ok: true, ...r });
                } catch (e) {
                    results.push({ ok: false, error: String(e?.message || e), title: t });
                }
            }

            // If at least one success, 201; else error
            const okCount = results.filter(r => r.ok).length;
            if (!okCount) {
                return res.status(502).json({ message: "All AI blog generations failed", results });
            }

            return res.status(201).json({
                message: "AI blogs created",
                count: okCount,
                results
            });
        } catch (err) {
            console.error("Error in createAIBlog:", err);
            return res.status(500).json({ message: "Failed to create AI blogs" });
        }
    },

    create_ai_blog: async (req, res) => {
        // Legacy entrypoint — delegate to V2 content-only Redis queue
        return require("./AiblogsControllerV2").create_ai_blog(req, res);
    },


    fetch_and_save_images: async (req, res) => {
        try {
            console.log("fetch_and_save_images called");
            const FREEPIK_HOSTS_ALLOW = new Set(["img.freepik.com", "images.freepik.com"]);

            const { prompt, projectId: bodyProjectId, limit: bodyLimit, quality: bodyQuality } = req.body;
            if (!prompt || !String(prompt).trim()) return res.status(400).json({ message: "prompt is required" });
            if (!bodyProjectId || !String(bodyProjectId).trim()) {
                return res.status(400).json({ message: "projectId is required" });
            }


            console.log(prompt, "Prompt for fetch_and_save_images");
            if (!FREEPIK_API_KEY) return res.status(500).json({ message: "Image provider API key not configured" });

            const projectId = String(bodyProjectId).trim();
            const limit = Math.max(1, Math.min(10, Number(bodyLimit) || 5));     // 1..10
            const quality = Math.max(50, Math.min(95, Number(bodyQuality) || 78)); // 50..95
            const userId = req.user?.userId ? String(req.user.userId) : null;

            // simple retry helper
            async function retry(fn, attempts = 3, label = "") {
                let last;
                for (let i = 1; i <= attempts; i++) {
                    try { return await fn(); }
                    catch (e) { last = e; console.warn(`${label} attempt ${i} failed:`, e?.message || e); }
                }
                throw last;
            }

            function normalizeFreepikUrl(raw) {
                try {
                    const u = new URL(raw);
                    if (!FREEPIK_HOSTS_ALLOW.has(u.hostname)) u.hostname = "img.freepik.com";
                    u.protocol = "https:";
                    u.port = "";
                    return u.toString();
                } catch { return raw; }
            }

            async function fetchImageBuffer(url) {
                const httpsAgent = new https.Agent({ keepAlive: true, family: 4 });
                const headers = {
                    "User-Agent": "Mozilla/5.0",
                    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                    "Referer": "https://www.freepik.com/"
                };
                const tryOnce = () => axios.get(url, {
                    responseType: "arraybuffer",
                    timeout: 30000,
                    maxRedirects: 5,
                    httpsAgent,
                    headers,
                    validateStatus: s => s >= 200 && s < 400
                });
                try {
                    return await tryOnce();
                } catch (e) {
                    const nurl = normalizeFreepikUrl(url);
                    if (nurl !== url) {
                        return await axios.get(nurl, {
                            responseType: "arraybuffer",
                            timeout: 30000,
                            maxRedirects: 5,
                            httpsAgent,
                            headers,
                            validateStatus: s => s >= 200 && s < 400
                        });
                    }
                    throw e;
                }
            }

            // ---- main worker: returns string[] of hosted URLs
            async function fetchFreepikImages(term, projId, max = 5, q = 78) {
                const search = await retry(
                    () => axios.get("https://api.freepik.com/v1/resources", {
                        headers: { "x-freepik-api-key": FREEPIK_API_KEY },
                        params: {
                            order: "relevance",
                            "filters[orientation][landscape]": 1,
                            page: 1,
                            limit: max,
                            term: `Real looking ${String(term).trim()}`
                        },
                        timeout: 20000
                    }),
                    3,
                    "FreepikFetch"
                );

                const items = Array.isArray(search?.data?.data) ? search.data.data.slice(0, max) : [];
                if (!items.length) return [];

                const folderPath = `public/images/${projId}`;
                const hosted = [];

                for (let i = 0; i < items.length; i++) {
                    const rawUrl = items[i]?.image?.source?.url;
                    if (!rawUrl) continue;

                    try {
                        const safeUrl = normalizeFreepikUrl(rawUrl);
                        const host = new URL(safeUrl).hostname;
                        if (!FREEPIK_HOSTS_ALLOW.has(host)) continue;

                        const imgResp = await fetchImageBuffer(safeUrl);
                        const webpBuf = await sharp(Buffer.from(imgResp.data), { failOnError: false })
                            .rotate()
                            .webp({ quality: q, effort: 4 })
                            .toBuffer();

                        const file = {
                            name: `${Date.now()}_${i}.webp`,
                            mimetype: "image/webp",
                            size: webpBuf.length,
                            stream: Readable.from(webpBuf)
                        };

                        const fileName = await helper.uploadFile(file, folderPath, imgResp);

                        // BASE_URL for images - must be apis.smartlybuild.dev
                        const staticurl = process.env.BASE_URL || 'https://apis.smartlybuild.dev';
                        hosted.push(`${staticurl}/images/${projId}/${fileName}`);
                    } catch { /* skip this image */ }
                }

                return hosted;
            }

            // run and respond
            const urls = await fetchFreepikImages(prompt, projectId, limit, quality);

            if (userId && projectId) {
                await trackCreditsUsage({
                    userId,
                    projectId,
                    usageType: 1, // FreePik
                    promptFrom: "BlogsController",
                    promptFor: "fetch_and_save_images",
                    pageId: projectId,
                    inputTokens: 1,
                    outputTokens: urls.length,
                    imagesCount: urls.length,
                    pricing: 0,
                    status: urls.length > 0 ? 1 : 0,
                    is_retried: 0
                });
            }

            return res.status(200).json({
                message: "Images fetched successfully",
                data: urls, // <-- array of URLs
                meta: { projectId, prompt, requested: limit, hosted: urls.length }
            });
        } catch (err) {
            console.error("fetch_and_save_images error:", err);
            if (req.user?.userId && req.body?.projectId) {
                await trackCreditsUsage({
                    userId: String(req.user.userId),
                    projectId: String(req.body.projectId),
                    usageType: 1,
                    promptFrom: "BlogsController",
                    promptFor: "fetch_and_save_images",
                    pageId: String(req.body.projectId),
                    inputTokens: 1,
                    outputTokens: 0,
                    imagesCount: 0,
                    pricing: 0,
                    status: 0,
                    is_retried: 0
                });
            }
            return res.status(500).json({ message: "Failed to fetch/host images" });
        }
    },

    get_blog_slugs: async (req, res) => {
        try {
            const { projectId, status } = req.body;

            if (!projectId || !mongoose.isValidObjectId(projectId)) {
                return res.status(400).json({ message: 'Valid projectId is required in the URL.' });
            }

            // Build filter
            const filter = { projectId };

            // Add status to filter only if provided
            if (status !== undefined && status !== null) {
                filter.status = Number(status); // convert to number if sent as string
            }

            // Fetch slugs only, lean for speed
            const docs = await Blog.find(filter)
                .select({ slug: 1, _id: 0 })
                .sort({ createdAt: -1 })
                .lean();

            const data = docs
                .map(d => String(d.slug || '').trim())
                .filter(Boolean)
                .map(slug => ({ slug, url: `/blog/${slug}` }));

            return res.status(200).json({
                message: 'OK',
                count: data.length,
                data,
                meta: { projectId },
            });
        } catch (err) {
            console.error('getProjectBlogUrls error:', err);
            return res.status(500).json({ message: 'Failed to fetch blog URLs' });
        }
    }





};

