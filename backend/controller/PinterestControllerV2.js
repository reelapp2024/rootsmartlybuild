const mongoose = require('mongoose');
const helper = require('../additional/addon');
const ContentWebsiteGoal = require('../models/contentWebsiteGoal');
const ContentWebsiteLanguage = require('../models/contentWebsiteLanguage');
const PinterestCategory = require('../models/pinterestCategory');
const PinterestNiche = require('../models/pinterestNiche');
const UserProject = require('../models/userProjects');
const Users = require('../models/users');
const Notification = require('../models/notification');
const CONTENT_CATEGORY_SEED = require('../data/contentWebsiteCategorySeed');
const { collectNicheSignals } = require('../nicheengines');
const { fetchJSONFromOpenAI } = require('../additional/openaiHelpers');

const DEFAULT_GOALS = [
  'Pinterest Traffic',
  'Ads',
  'Amazon Affiliate',
  'Digital Products',
  'Local Business',
  'Brand Building',
  'Email List',
];

const DEFAULT_LANGUAGES = [
  { code: 'EN', name: 'English' },
  { code: 'ES', name: 'Spanish' },
  { code: 'DE', name: 'German' },
  { code: 'FR', name: 'French' },
  { code: 'HI', name: 'Hindi' },
];

function toSlug(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parsePagination(body = {}) {
  const page = Math.max(parseInt(body.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(body.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function statusQuery(status) {
  if (status === 0 || status === 1 || status === '0' || status === '1') {
    return { status: Number(status) };
  }
  return {};
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {object} body
 * @param {string[]} allowedSortFields
 * @param {string} defaultSort
 */
function parseListOptions(body = {}, allowedSortFields = ['createdAt'], defaultSort = 'createdAt') {
  const { page, limit, skip } = parsePagination(body);
  const search = String(body.search || '').trim();
  const rawSort = String(body.sortBy || defaultSort).trim();
  const sortBy = allowedSortFields.includes(rawSort) ? rawSort : defaultSort;
  const sortOrder = String(body.sortOrder || 'asc').toLowerCase() === 'desc' ? -1 : 1;
  return { page, limit, skip, search, sortBy, sortOrder, sort: { [sortBy]: sortOrder } };
}

const PinterestControllerV2 = {
  // ==================== GOALS ====================

  addGoals: async (req, res) => {
    try {
      let { goals } = req.body || {};

      if (typeof goals === 'string') {
        try {
          goals = JSON.parse(goals);
        } catch {
          goals = [goals];
        }
      }

      const names =
        Array.isArray(goals) && goals.length > 0
          ? goals.map((g) => String(g).trim()).filter(Boolean)
          : DEFAULT_GOALS;

      const created = [];
      const skipped = [];

      for (const name of names) {
        const slug = toSlug(name);
        if (!slug) continue;

        const existing = await ContentWebsiteGoal.findOne({
          $or: [{ name }, { slug }],
        }).lean();

        if (existing) {
          skipped.push(existing);
          continue;
        }

        created.push(
          await ContentWebsiteGoal.create({ name, slug, status: 1 })
        );
      }

      return helper.sendSuccess(res, 201, 'Goals processed successfully.', {
        created,
        skipped,
        defaults: DEFAULT_GOALS,
      });
    } catch (error) {
      console.error('[PinterestV2] addGoals error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to add goals.');
    }
  },

  createGoal: async (req, res) => {
    try {
      const { name, status } = req.body || {};
      if (!name || String(name).trim() === '') {
        return helper.sendError(res, 400, 'Goal name is required.');
      }

      const goalName = String(name).trim();
      const slug = toSlug(goalName);
      const existing = await ContentWebsiteGoal.findOne({
        $or: [{ name: goalName }, { slug }],
      }).lean();

      if (existing) {
        return helper.sendError(res, 400, 'Goal with this name already exists.');
      }

      const goal = await ContentWebsiteGoal.create({
        name: goalName,
        slug,
        status: status === 0 ? 0 : 1,
      });

      return helper.sendSuccess(res, 201, 'Goal created successfully.', goal);
    } catch (error) {
      if (error?.code === 11000) {
        return helper.sendError(res, 400, 'Goal with this name already exists.');
      }
      console.error('[PinterestV2] createGoal error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to create goal.');
    }
  },

  fetchGoals: async (req, res) => {
    try {
      const { page, limit, skip, search, sortBy, sortOrder, sort } = parseListOptions(
        req.body,
        ['name', 'slug', 'status', 'createdAt'],
        'name'
      );
      const query = statusQuery(req.body?.status);
      if (search) {
        const rx = new RegExp(escapeRegex(search), 'i');
        query.$or = [{ name: rx }, { slug: rx }];
      }

      const [total, goals] = await Promise.all([
        ContentWebsiteGoal.countDocuments(query),
        ContentWebsiteGoal.find(query).sort(sort).skip(skip).limit(limit).lean(),
      ]);

      return helper.sendSuccess(res, 200, 'Goals fetched successfully.', {
        goals,
        meta: { total, page, limit, pages: Math.ceil(total / limit) || 1, sortBy, sortOrder: sortOrder === -1 ? 'desc' : 'asc', search },
      });
    } catch (error) {
      console.error('[PinterestV2] fetchGoals error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to fetch goals.');
    }
  },

  updateGoal: async (req, res) => {
    try {
      const { goalId, name, status } = req.body || {};
      if (!goalId || !mongoose.isValidObjectId(goalId)) {
        return helper.sendError(res, 400, 'Valid goal ID is required.');
      }

      const goal = await ContentWebsiteGoal.findById(goalId);
      if (!goal) return helper.sendError(res, 404, 'Goal not found.');

      if (name && String(name).trim()) {
        const goalName = String(name).trim();
        const slug = toSlug(goalName);
        const conflict = await ContentWebsiteGoal.findOne({
          $or: [{ name: goalName }, { slug }],
          _id: { $ne: goalId },
        }).lean();
        if (conflict) {
          return helper.sendError(res, 400, 'Goal with this name already exists.');
        }
        goal.name = goalName;
        goal.slug = slug;
      }

      if (status === 0 || status === 1) goal.status = status;

      await goal.save();
      return helper.sendSuccess(res, 200, 'Goal updated successfully.', goal);
    } catch (error) {
      console.error('[PinterestV2] updateGoal error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to update goal.');
    }
  },

  deleteGoal: async (req, res) => {
    try {
      const { goalId } = req.body || {};
      if (!goalId || !mongoose.isValidObjectId(goalId)) {
        return helper.sendError(res, 400, 'Valid goal ID is required.');
      }

      const result = await ContentWebsiteGoal.findByIdAndDelete(goalId);
      if (!result) return helper.sendError(res, 404, 'Goal not found.');

      return helper.sendSuccess(res, 200, 'Goal deleted successfully.');
    } catch (error) {
      console.error('[PinterestV2] deleteGoal error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to delete goal.');
    }
  },

  // ==================== LANGUAGES ====================

  seedLanguages: async (req, res) => {
    try {
      const created = [];
      const skipped = [];

      for (const item of DEFAULT_LANGUAGES) {
        const existing = await ContentWebsiteLanguage.findOne({ code: item.code }).lean();
        if (existing) {
          skipped.push(existing);
          continue;
        }
        created.push(await ContentWebsiteLanguage.create({ ...item, status: 1 }));
      }

      return helper.sendSuccess(res, 201, 'Languages seeded successfully.', {
        created,
        skipped,
        defaults: DEFAULT_LANGUAGES,
      });
    } catch (error) {
      console.error('[PinterestV2] seedLanguages error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to seed languages.');
    }
  },

  createLanguage: async (req, res) => {
    try {
      const { code, name, status } = req.body || {};
      if (!code || String(code).trim() === '') {
        return helper.sendError(res, 400, 'Language code is required.');
      }
      if (!name || String(name).trim() === '') {
        return helper.sendError(res, 400, 'Language name is required.');
      }

      const langCode = String(code).trim().toUpperCase();
      const existing = await ContentWebsiteLanguage.findOne({ code: langCode }).lean();
      if (existing) {
        return helper.sendError(res, 400, 'Language with this code already exists.');
      }

      const language = await ContentWebsiteLanguage.create({
        code: langCode,
        name: String(name).trim(),
        status: status === 0 ? 0 : 1,
      });

      return helper.sendSuccess(res, 201, 'Language created successfully.', language);
    } catch (error) {
      if (error?.code === 11000) {
        return helper.sendError(res, 400, 'Language with this code already exists.');
      }
      console.error('[PinterestV2] createLanguage error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to create language.');
    }
  },

  fetchLanguages: async (req, res) => {
    try {
      const { page, limit, skip, search, sortBy, sortOrder, sort } = parseListOptions(
        req.body,
        ['code', 'name', 'status', 'createdAt'],
        'code'
      );
      const query = statusQuery(req.body?.status);
      if (search) {
        const rx = new RegExp(escapeRegex(search), 'i');
        query.$or = [{ code: rx }, { name: rx }];
      }

      const [total, languages] = await Promise.all([
        ContentWebsiteLanguage.countDocuments(query),
        ContentWebsiteLanguage.find(query).sort(sort).skip(skip).limit(limit).lean(),
      ]);

      return helper.sendSuccess(res, 200, 'Languages fetched successfully.', {
        languages,
        meta: { total, page, limit, pages: Math.ceil(total / limit) || 1, sortBy, sortOrder: sortOrder === -1 ? 'desc' : 'asc', search },
      });
    } catch (error) {
      console.error('[PinterestV2] fetchLanguages error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to fetch languages.');
    }
  },

  updateLanguage: async (req, res) => {
    try {
      const { languageId, code, name, status } = req.body || {};
      if (!languageId || !mongoose.isValidObjectId(languageId)) {
        return helper.sendError(res, 400, 'Valid language ID is required.');
      }

      const language = await ContentWebsiteLanguage.findById(languageId);
      if (!language) return helper.sendError(res, 404, 'Language not found.');

      if (code && String(code).trim()) {
        const langCode = String(code).trim().toUpperCase();
        const conflict = await ContentWebsiteLanguage.findOne({
          code: langCode,
          _id: { $ne: languageId },
        }).lean();
        if (conflict) {
          return helper.sendError(res, 400, 'Language with this code already exists.');
        }
        language.code = langCode;
      }

      if (name && String(name).trim()) language.name = String(name).trim();
      if (status === 0 || status === 1) language.status = status;

      await language.save();
      return helper.sendSuccess(res, 200, 'Language updated successfully.', language);
    } catch (error) {
      console.error('[PinterestV2] updateLanguage error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to update language.');
    }
  },

  deleteLanguage: async (req, res) => {
    try {
      const { languageId } = req.body || {};
      if (!languageId || !mongoose.isValidObjectId(languageId)) {
        return helper.sendError(res, 400, 'Valid language ID is required.');
      }

      const result = await ContentWebsiteLanguage.findByIdAndDelete(languageId);
      if (!result) return helper.sendError(res, 404, 'Language not found.');

      return helper.sendSuccess(res, 200, 'Language deleted successfully.');
    } catch (error) {
      console.error('[PinterestV2] deleteLanguage error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to delete language.');
    }
  },

  // ==================== CATEGORIES ====================

  createCategory: async (req, res) => {
    try {
      const { categoryName, status } = req.body || {};

      if (!categoryName || String(categoryName).trim() === '') {
        return helper.sendError(res, 400, 'Category name is required.');
      }

      const name = String(categoryName).trim();
      const existing = await PinterestCategory.findOne({ categoryName: name }).lean();
      if (existing) {
        return helper.sendError(res, 400, 'Category with this name already exists.');
      }

      const category = await PinterestCategory.create({
        categoryName: name,
        status: status === 0 ? 0 : 1,
      });

      return helper.sendSuccess(res, 201, 'Category created successfully.', category);
    } catch (error) {
      console.error('[PinterestV2] createCategory error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to create category.');
    }
  },

  fetchCategories: async (req, res) => {
    try {
      const { page, limit, skip, search, sortBy, sortOrder, sort } = parseListOptions(
        req.body,
        ['categoryName', 'status', 'createdAt'],
        'categoryName'
      );
      const query = statusQuery(req.body?.status);
      if (search) {
        query.categoryName = new RegExp(escapeRegex(search), 'i');
      }

      const [total, categories] = await Promise.all([
        PinterestCategory.countDocuments(query),
        PinterestCategory.find(query).sort(sort).skip(skip).limit(limit).lean(),
      ]);

      return helper.sendSuccess(res, 200, 'Categories fetched successfully.', {
        categories,
        meta: { total, page, limit, pages: Math.ceil(total / limit) || 1, sortBy, sortOrder: sortOrder === -1 ? 'desc' : 'asc', search },
      });
    } catch (error) {
      console.error('[PinterestV2] fetchCategories error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to fetch categories.');
    }
  },

  updateCategory: async (req, res) => {
    try {
      const { categoryId, categoryName, status } = req.body || {};
      if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
        return helper.sendError(res, 400, 'Valid category ID is required.');
      }

      const category = await PinterestCategory.findById(categoryId);
      if (!category) return helper.sendError(res, 404, 'Category not found.');

      if (categoryName && String(categoryName).trim()) {
        const name = String(categoryName).trim();
        const conflict = await PinterestCategory.findOne({
          categoryName: name,
          _id: { $ne: categoryId },
        }).lean();
        if (conflict) {
          return helper.sendError(res, 400, 'Category with this name already exists.');
        }
        category.categoryName = name;
      }

      if (status === 0 || status === 1) category.status = status;

      await category.save();
      return helper.sendSuccess(res, 200, 'Category updated successfully.', category);
    } catch (error) {
      console.error('[PinterestV2] updateCategory error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to update category.');
    }
  },

  deleteCategory: async (req, res) => {
    try {
      const { categoryId } = req.body || {};
      if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
        return helper.sendError(res, 400, 'Valid category ID is required.');
      }

      const nicheCount = await PinterestNiche.countDocuments({ categoryId });
      if (nicheCount > 0) {
        return helper.sendError(
          res,
          400,
          `Cannot delete category. ${nicheCount} niche(s) are linked. Delete niches first.`
        );
      }

      const result = await PinterestCategory.findByIdAndDelete(categoryId);
      if (!result) return helper.sendError(res, 404, 'Category not found.');

      return helper.sendSuccess(res, 200, 'Category deleted successfully.');
    } catch (error) {
      console.error('[PinterestV2] deleteCategory error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to delete category.');
    }
  },

  /**
   * Seed 15 evergreen categories × 30 niches (450).
   * Each niche is upserted ONLY under its parent category (never cross-linked).
   */
  seedCategoriesAndNiches: async (req, res) => {
    try {
      const summary = {
        categoriesCreated: 0,
        categoriesUpdated: 0,
        nichesCreated: 0,
        nichesSkipped: 0,
        categories: [],
      };

      for (const item of CONTENT_CATEGORY_SEED) {
        const categoryName = String(item.categoryName || '').trim();
        if (!categoryName) continue;

        // Exact parent category for this block — niches go only under this doc
        let category = await PinterestCategory.findOne({ categoryName });
        let categoryCreated = false;

        if (!category) {
          category = await PinterestCategory.create({
            categoryName,
            status: 1,
          });
          summary.categoriesCreated += 1;
          categoryCreated = true;
        } else {
          summary.categoriesUpdated += 1;
          if (category.status !== 1) {
            category.status = 1;
            await category.save();
          }
        }

        const parentCategoryId = category._id;
        let nichesCreated = 0;
        let nichesSkipped = 0;
        const nicheNames = [];

        for (const nicheRaw of item.niches || []) {
          const nicheName = String(nicheRaw || '').trim();
          if (!nicheName) continue;
          nicheNames.push(nicheName);

          // Upsert scoped to THIS category only (unique index: categoryId + nicheName)
          const result = await PinterestNiche.findOneAndUpdate(
            { categoryId: parentCategoryId, nicheName },
            {
              $setOnInsert: {
                categoryId: parentCategoryId,
                nicheName,
              },
              $set: { status: 1 },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true }
          );

          const wasInsert =
            result?.lastErrorObject?.upserted != null ||
            result?.lastErrorObject?.updatedExisting === false;

          if (wasInsert) {
            nichesCreated += 1;
            summary.nichesCreated += 1;
          } else {
            nichesSkipped += 1;
            summary.nichesSkipped += 1;
          }
        }

        const linkedCount = await PinterestNiche.countDocuments({
          categoryId: parentCategoryId,
          nicheName: { $in: nicheNames },
          status: 1,
        });

        summary.categories.push({
          categoryName,
          categoryId: String(parentCategoryId),
          categoryCreated,
          expectedNiches: nicheNames.length,
          nichesCreated,
          nichesSkipped,
          linkedUnderCategory: linkedCount,
          ok: linkedCount === nicheNames.length,
        });
      }

      const allOk = summary.categories.every((c) => c.ok);

      return helper.sendSuccess(res, 201, 'Categories and niches seeded successfully.', {
        ...summary,
        allOk,
        totals: {
          expectedCategories: CONTENT_CATEGORY_SEED.length,
          expectedNiches: CONTENT_CATEGORY_SEED.reduce(
            (n, c) => n + (c.niches?.length || 0),
            0
          ),
          categoriesCreated: summary.categoriesCreated,
          nichesCreated: summary.nichesCreated,
        },
      });
    } catch (error) {
      console.error('[PinterestV2] seedCategoriesAndNiches error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to seed categories and niches.');
    }
  },

  // ==================== NICHES (subcategory) ====================

  createNiche: async (req, res) => {
    try {
      const { categoryId, nicheName, status } = req.body || {};

      if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
        return helper.sendError(res, 400, 'Valid category ID is required.');
      }
      if (!nicheName || String(nicheName).trim() === '') {
        return helper.sendError(res, 400, 'Niche name is required.');
      }

      const category = await PinterestCategory.findById(categoryId).lean();
      if (!category) {
        return helper.sendError(res, 404, 'Category not found.');
      }

      const name = String(nicheName).trim();
      const existing = await PinterestNiche.findOne({
        categoryId,
        nicheName: name,
      }).lean();

      if (existing) {
        return helper.sendError(res, 400, 'Niche with this name already exists for this category.');
      }

      const niche = await PinterestNiche.create({
        categoryId,
        nicheName: name,
        status: status === 0 ? 0 : 1,
      });

      return helper.sendSuccess(res, 201, 'Niche created successfully.', niche);
    } catch (error) {
      if (error?.code === 11000) {
        return helper.sendError(res, 400, 'Niche with this name already exists for this category.');
      }
      console.error('[PinterestV2] createNiche error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to create niche.');
    }
  },

  /**
   * Bulk create niches under one category.
   * Accepts `niches` as string[] OR multiline string (one name per line).
   */
  createNichesBulk: async (req, res) => {
    try {
      const { categoryId, status } = req.body || {};
      let { niches, nicheNames, nicheName } = req.body || {};

      if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
        return helper.sendError(res, 400, 'Valid category ID is required.');
      }

      const category = await PinterestCategory.findById(categoryId).lean();
      if (!category) {
        return helper.sendError(res, 404, 'Category not found.');
      }

      // Normalize input → unique trimmed names (preserve first-seen order)
      let rawList = niches ?? nicheNames ?? nicheName;
      if (typeof rawList === 'string') {
        try {
          const parsed = JSON.parse(rawList);
          rawList = Array.isArray(parsed) ? parsed : String(rawList).split(/\r?\n/);
        } catch {
          rawList = String(rawList).split(/\r?\n/);
        }
      }
      if (!Array.isArray(rawList)) {
        return helper.sendError(res, 400, 'Provide niches as a multiline string or array.');
      }

      const seen = new Set();
      const names = [];
      for (const item of rawList) {
        const name = String(item || '').trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        names.push(name);
      }

      if (names.length === 0) {
        return helper.sendError(res, 400, 'At least one niche name is required.');
      }

      const existing = await PinterestNiche.find({
        categoryId,
        nicheName: { $in: names },
      })
        .select('nicheName')
        .lean();

      const existingSet = new Set(existing.map((e) => e.nicheName.toLowerCase()));
      const toCreate = names.filter((n) => !existingSet.has(n.toLowerCase()));
      const skipped = names.filter((n) => existingSet.has(n.toLowerCase()));

      let created = [];
      if (toCreate.length > 0) {
        const docs = toCreate.map((nicheName) => ({
          categoryId,
          nicheName,
          status: status === 0 ? 0 : 1,
        }));
        created = await PinterestNiche.insertMany(docs, { ordered: false });
      }

      return helper.sendSuccess(res, 201, 'Niches processed successfully.', {
        categoryId,
        categoryName: category.categoryName,
        created: created.map((d) => ({ _id: d._id, nicheName: d.nicheName })),
        skipped,
        createdCount: created.length,
        skippedCount: skipped.length,
        requestedCount: names.length,
      });
    } catch (error) {
      console.error('[PinterestV2] createNichesBulk error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to create niches.');
    }
  },

  fetchNiches: async (req, res) => {
    try {
      const { categoryId } = req.body || {};
      const { page, limit, skip, search, sortBy, sortOrder } = parseListOptions(
        req.body,
        ['nicheName', 'status', 'createdAt', 'categoryName'],
        'nicheName'
      );

      const matchQuery = statusQuery(req.body?.status);
      if (categoryId && categoryId !== 'all') {
        if (!mongoose.isValidObjectId(categoryId)) {
          return helper.sendError(res, 400, 'Valid category ID is required.');
        }
        matchQuery.categoryId = new mongoose.Types.ObjectId(categoryId);
      }

      const categoryColl = PinterestCategory.collection.name;
      const sortField = sortBy === 'categoryName' ? 'category.categoryName' : sortBy;
      const sortStage = { [sortField]: sortOrder === -1 ? -1 : 1 };

      const pipeline = [
        { $match: matchQuery },
        {
          $lookup: {
            from: categoryColl,
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      ];

      if (search) {
        const rx = new RegExp(escapeRegex(search), 'i');
        pipeline.push({
          $match: {
            $or: [{ nicheName: rx }, { 'category.categoryName': rx }],
          },
        });
      }

      pipeline.push({
        $facet: {
          meta: [{ $count: 'total' }],
          rows: [
            { $sort: sortStage },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                nicheName: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
                categoryId: {
                  _id: '$category._id',
                  categoryName: '$category.categoryName',
                },
              },
            },
          ],
        },
      });

      const [facet] = await PinterestNiche.aggregate(pipeline);
      const total = facet?.meta?.[0]?.total || 0;
      const niches = facet?.rows || [];

      return helper.sendSuccess(res, 200, 'Niches fetched successfully.', {
        niches,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1,
          sortBy,
          sortOrder: sortOrder === -1 ? 'desc' : 'asc',
          search,
        },
      });
    } catch (error) {
      console.error('[PinterestV2] fetchNiches error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to fetch niches.');
    }
  },

  updateNiche: async (req, res) => {
    try {
      const { nicheId, nicheName, categoryId, status } = req.body || {};
      if (!nicheId || !mongoose.isValidObjectId(nicheId)) {
        return helper.sendError(res, 400, 'Valid niche ID is required.');
      }

      const niche = await PinterestNiche.findById(nicheId);
      if (!niche) return helper.sendError(res, 404, 'Niche not found.');

      let nextCategoryId = niche.categoryId;
      if (categoryId) {
        if (!mongoose.isValidObjectId(categoryId)) {
          return helper.sendError(res, 400, 'Valid category ID is required.');
        }
        const category = await PinterestCategory.findById(categoryId).lean();
        if (!category) return helper.sendError(res, 404, 'Category not found.');
        nextCategoryId = categoryId;
        niche.categoryId = categoryId;
      }

      if (nicheName && String(nicheName).trim()) {
        const name = String(nicheName).trim();
        const conflict = await PinterestNiche.findOne({
          categoryId: nextCategoryId,
          nicheName: name,
          _id: { $ne: nicheId },
        }).lean();
        if (conflict) {
          return helper.sendError(res, 400, 'Niche with this name already exists for this category.');
        }
        niche.nicheName = name;
      }

      if (status === 0 || status === 1) niche.status = status;

      await niche.save();
      return helper.sendSuccess(res, 200, 'Niche updated successfully.', niche);
    } catch (error) {
      console.error('[PinterestV2] updateNiche error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to update niche.');
    }
  },

  deleteNiche: async (req, res) => {
    try {
      const { nicheId } = req.body || {};
      if (!nicheId || !mongoose.isValidObjectId(nicheId)) {
        return helper.sendError(res, 400, 'Valid niche ID is required.');
      }

      const result = await PinterestNiche.findByIdAndDelete(nicheId);
      if (!result) return helper.sendError(res, 404, 'Niche not found.');

      return helper.sendSuccess(res, 200, 'Niche deleted successfully.');
    } catch (error) {
      console.error('[PinterestV2] deleteNiche error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to delete niche.');
    }
  },

  // ==================== NICHE ANALYSIS (Step 3) ====================

  /**
   * Analyze niche with Google Ads / Suggest + Trends + OpenAI scoring.
   * Honest labels: dataLabel = "real" | "estimate"
   */
  analyzeNiche: async (req, res) => {
    try {
      const userId = req.user?.userId;
      const {
        categoryId,
        nicheId,
        country,
        language,
        categoryName: bodyCategoryName,
        nicheName: bodyNicheName,
        contentGoal,
      } = req.body || {};

      let categoryName = bodyCategoryName ? String(bodyCategoryName).trim() : '';
      let nicheName = bodyNicheName ? String(bodyNicheName).trim() : '';

      if (categoryId) {
        if (!mongoose.isValidObjectId(categoryId)) {
          return helper.sendError(res, 400, 'Valid category ID is required.');
        }
        const category = await PinterestCategory.findById(categoryId).lean();
        if (!category) return helper.sendError(res, 404, 'Category not found.');
        categoryName = category.categoryName;
      }

      if (nicheId) {
        if (!mongoose.isValidObjectId(nicheId)) {
          return helper.sendError(res, 400, 'Valid niche ID is required.');
        }
        const niche = await PinterestNiche.findById(nicheId).lean();
        if (!niche) return helper.sendError(res, 404, 'Niche not found.');
        nicheName = niche.nicheName;
        if (!categoryName && niche.categoryId) {
          const cat = await PinterestCategory.findById(niche.categoryId).lean();
          if (cat) categoryName = cat.categoryName;
        }
      }

      if (!nicheName) {
        return helper.sendError(res, 400, 'nicheId or nicheName is required.');
      }
      if (!categoryName) {
        return helper.sendError(res, 400, 'categoryId or categoryName is required.');
      }

      const countryLabel = String(country || 'US').trim() || 'US';
      const langCode = String(language || 'EN').trim().toUpperCase() || 'EN';
      const keyword = nicheName;

      const signals = await collectNicheSignals({
        keyword,
        country: countryLabel,
        language: langCode,
      });

      const adsPrimary = signals.ads?.primary || {};
      const trendSummary = signals.trends?.summary || {};
      const relatedKeywords = (signals.ads?.related || [])
        .map((r) => r.keyword)
        .filter(Boolean)
        .slice(0, 8);

      const prompt = `
You are a niche research analyst for a Pinterest / content-website business.

Return ONLY valid JSON with this exact shape:
{
  "competition": { "level": "High|Medium|Low", "summary": "2-3 sentences" },
  "searches": { "level": "High|Medium|Low", "summary": "2-3 sentences about demand" },
  "pinterestPotential": { "level": "High|Medium|Low", "summary": "why it works or not on Pinterest" },
  "affiliatePotential": { "level": "High|Medium|Low", "summary": "affiliate / Amazon angle" },
  "adsPotential": { "level": "High|Medium|Low", "summary": "paid ads viability" },
  "digitalProductPotential": { "level": "High|Medium|Low", "summary": "printables / digital products" },
  "difficulty": { "level": "High|Medium|Low", "summary": "how hard to rank / win" },
  "seasonality": { "level": "Strong|Moderate|Steady|Unknown", "summary": "seasonal pattern" },
  "overallScore": 0,
  "verdict": "one short paragraph: go / caution / avoid and why",
  "recommendedNextSteps": ["3 short actionable bullets"]
}

Rules:
- overallScore is integer 0-100
- Prefer the provided DATA SIGNALS when present
- If a signal is labeled estimate, do NOT invent exact search volumes — speak in High/Medium/Low only
- Be honest; do not overhype thin niches

CONTEXT:
- Category: ${categoryName}
- Niche / keyword: ${nicheName}
- Country: ${countryLabel}
- Language: ${langCode}
- Content goal: ${contentGoal || 'n/a'}

DATA SIGNALS (from APIs):
${JSON.stringify(
  {
    adsMode: signals.ads?.mode,
    adsDataLabel: signals.ads?.dataLabel,
    volumeRange: adsPrimary.volumeRange,
    volumeLevel: adsPrimary.volumeLevel,
    competitionHint: adsPrimary.competition,
    avgMonthlySearches: adsPrimary.avgMonthlySearches,
    relatedKeywords,
    trendsMode: signals.trends?.mode,
    trendsDataLabel: signals.trends?.dataLabel,
    trendDirection: trendSummary.trendDirection,
    seasonality: trendSummary.seasonality,
    averageInterest: trendSummary.averageInterest,
    peakInterest: trendSummary.peakInterest,
    rising: trendSummary.rising,
  },
  null,
  2
)}
`.trim();

      let ai = null;
      try {
        ai = await fetchJSONFromOpenAI(prompt, 'NICHE_ANALYSIS', {
          userId: userId ? String(userId) : undefined,
          promptFrom: 'PinterestControllerV2',
          promptFor: `Niche Analysis - ${categoryName} / ${nicheName}`,
        });
      } catch (aiErr) {
        console.warn('[PinterestV2] analyzeNiche AI failed:', aiErr.message);
        // heuristic fallback score if AI fails
        const vol =
          adsPrimary.volumeLevel === 'High'
            ? 75
            : adsPrimary.volumeLevel === 'Medium'
              ? 55
              : 35;
        const trendBoost = trendSummary.rising ? 10 : 0;
        ai = {
          competition: {
            level: adsPrimary.competition || 'Medium',
            summary: 'AI scoring unavailable; competition inferred from demand signals.',
          },
          searches: {
            level: adsPrimary.volumeLevel || 'Medium',
            summary: `Volume signal: ${adsPrimary.volumeRange || 'estimate'} (${signals.ads?.dataLabel || 'estimate'}).`,
          },
          pinterestPotential: {
            level: 'Medium',
            summary: 'Visual niches usually work on Pinterest; validate with pin tests.',
          },
          affiliatePotential: { level: 'Medium', summary: 'Depends on product density in niche.' },
          adsPotential: { level: 'Medium', summary: 'Needs CPC validation before paid spend.' },
          digitalProductPotential: {
            level: 'Medium',
            summary: 'Printables/checklists may fit if how-to intent is strong.',
          },
          difficulty: {
            level: 'Medium',
            summary: 'Treat as medium until real SERP review.',
          },
          seasonality: {
            level:
              trendSummary.seasonality === 'strong'
                ? 'Strong'
                : trendSummary.seasonality === 'moderate'
                  ? 'Moderate'
                  : trendSummary.seasonality === 'steady'
                    ? 'Steady'
                    : 'Unknown',
            summary: `Trend direction: ${trendSummary.trendDirection || 'unknown'}.`,
          },
          overallScore: Math.min(100, Math.max(0, vol + trendBoost)),
          verdict: 'Partial analysis (AI unavailable). Review signals before scaling.',
          recommendedNextSteps: [
            'Validate top related keywords manually',
            'Publish a Phase-1 test set of 10 articles',
            'Measure Pinterest CTR before scaling',
          ],
          _fallback: true,
        };
      }

      const overallScore = Math.min(
        100,
        Math.max(0, parseInt(ai?.overallScore, 10) || 0)
      );

      return helper.sendSuccess(res, 200, 'Niche analysis completed.', {
        input: {
          categoryId: categoryId || null,
          nicheId: nicheId || null,
          categoryName,
          nicheName,
          country: countryLabel,
          language: langCode,
          contentGoal: contentGoal || null,
          keyword,
        },
        signals: {
          ads: {
            mode: signals.ads?.mode,
            dataLabel: signals.ads?.dataLabel,
            primary: adsPrimary,
            related: signals.ads?.related || [],
          },
          trends: {
            mode: signals.trends?.mode,
            dataLabel: signals.trends?.dataLabel,
            summary: trendSummary,
            geo: signals.trends?.geo || null,
            error: signals.trends?.error || null,
          },
          collectedAt: signals.collectedAt,
        },
        analysis: {
          ...ai,
          overallScore,
        },
        labels: {
          volume: signals.ads?.dataLabel || 'estimate',
          trends: signals.trends?.dataLabel || 'estimate',
          note:
            'Fields marked estimate are High/Medium/Low guidance — not exact Keyword Planner volumes.',
        },
      });
    } catch (error) {
      console.error('[PinterestV2] analyzeNiche error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to analyze niche.');
    }
  },

  // ==================== CONTENT WEBSITE PROJECT ====================

  createContentWebsite: async (req, res) => {
    try {
      const userId = req.user?.userId;
      const {
        projectName,
        contentGoal,
        language,
        categoryId,
        nicheId,
      } = req.body || {};

      if (!userId) {
        return helper.sendError(res, 401, 'Unauthorized.');
      }
      if (!projectName || String(projectName).trim() === '') {
        return helper.sendError(res, 400, 'Project name is required.');
      }
      if (!contentGoal || String(contentGoal).trim() === '') {
        return helper.sendError(res, 400, 'Content goal is required.');
      }

      const lang = String(language || '').trim().toUpperCase();
      const languageDoc = await ContentWebsiteLanguage.findOne({
        code: lang,
        status: 1,
      }).lean();
      if (!languageDoc) {
        return helper.sendError(
          res,
          400,
          'Language not found or inactive. Add it under Content Websites → Settings.'
        );
      }

      if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
        return helper.sendError(res, 400, 'Valid category ID is required.');
      }
      if (!nicheId || !mongoose.isValidObjectId(nicheId)) {
        return helper.sendError(res, 400, 'Valid niche ID is required.');
      }

      const category = await PinterestCategory.findById(categoryId).lean();
      if (!category || category.status !== 1) {
        return helper.sendError(res, 404, 'Category not found or inactive.');
      }

      const niche = await PinterestNiche.findOne({
        _id: nicheId,
        categoryId,
        status: 1,
      }).lean();
      if (!niche) {
        return helper.sendError(res, 404, 'Niche not found for this category.');
      }

      const goalName = String(contentGoal).trim();
      const goalDoc = await ContentWebsiteGoal.findOne({
        name: goalName,
        status: 1,
      }).lean();
      if (!goalDoc) {
        return helper.sendError(
          res,
          400,
          'Goal not found or inactive. Add it under Content Websites → Settings.'
        );
      }

      const name = String(projectName).trim();

      const project = await UserProject.create({
        userId,
        projectName: name,
        contentGoal: goalName,
        language: lang,
        contentCategoryId: category._id,
        contentNicheId: niche._id,
        categories: [category.categoryName],
        subCategories: [niche.nicheName],
        serviceType: category.categoryName,
        projectType: 2,
        status: 1,
        wantImages: 1,
        focusKeyword: niche.nicheName,
        projectKeywordsText: `${niche.nicheName}, ${category.categoryName}, ${goalName}`,
      });

      try {
        const user = await Users.findById(userId).select('email username').lean();
        await Notification.create({
          userFromId: userId,
          isSuperAdminNotification: true,
          message: `${user?.username || user?.email || 'User'} created content website "${name}"`,
          type: 'project_created',
          relatedId: project._id,
        });
      } catch (notifError) {
        console.error('[PinterestV2] notification error:', notifError);
      }

      return helper.sendSuccess(res, 201, 'Content website created successfully.', project);
    } catch (error) {
      console.error('[PinterestV2] createContentWebsite error:', error);
      return helper.sendError(res, 500, error.message || 'Failed to create content website.');
    }
  },
};

module.exports = PinterestControllerV2;
