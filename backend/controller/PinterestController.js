const mongoose = require('mongoose');
const PinterestCategory = require('../models/pinterestCategory');
const PinterestProject = require('../models/pinterestProject');
const PinterestPin = require('../models/pinterestPin');
const PinterestWebsitePin = require('../models/pinterestWebsitePin');
const helper = require("../additional/addon");
const sharp = require("sharp");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { fetchJSONFromOpenAI } = require('../additional/openaiHelpers');
const fetchFreepikImages = require('../additional/freePik');
const { generateNanoBananaImages, generateWithRetry } = require('../additional/nanoBanana');

// ------------ Utilities ------------
const fetchImageBuffer = async (url) => {
  const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
  return Buffer.from(response.data, "binary");
};

// New: intelligent font discovery inside ../fonts/allfonts/<fontFolder>/*.(ttf|otf)
const findFontFileInAllFonts = (baseFontsDir, folderNames = []) => {
  // baseFontsDir expected relative to this controller (e.g. ../fonts/allfonts)
  try {
    const baseAbs = path.isAbsolute(baseFontsDir) ? baseFontsDir : path.join(__dirname, baseFontsDir);
    if (!fs.existsSync(baseAbs)) return null;

    // if specific folder names provided, try each in order
    for (const folderName of folderNames) {
      const folderPath = path.join(baseAbs, folderName);
      if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) continue;
      const files = fs.readdirSync(folderPath);
      // prefer ttf, then otf
      const ttf = files.find(f => f.toLowerCase().endsWith(".ttf"));
      if (ttf) return path.join(folderPath, ttf);
      const otf = files.find(f => f.toLowerCase().endsWith(".otf"));
      if (otf) return path.join(folderPath, otf);
    }

    // fallback: scan all subfolders and return the first ttf found
    const subfolders = fs.readdirSync(baseAbs).filter(name => {
      try { return fs.statSync(path.join(baseAbs, name)).isDirectory(); } catch { return false; }
    });
    for (const sf of subfolders) {
      const p = path.join(baseAbs, sf);
      const files = fs.readdirSync(p);
      const ttf = files.find(f => f.toLowerCase().endsWith(".ttf"));
      if (ttf) return path.join(p, ttf);
      const otf = files.find(f => f.toLowerCase().endsWith(".otf"));
      if (otf) return path.join(p, otf);
    }

    return null;
  } catch (err) {
    console.warn("findFontFileInAllFonts error:", err);
    return null;
  }
};

// embed a local font file as a data URL for @font-face in SVG
const loadFontDataUrl = (fontPath) => {
  try {
    const absolute = path.isAbsolute(fontPath) ? fontPath : path.join(__dirname, fontPath);
    if (!fs.existsSync(absolute)) return null;
    const buff = fs.readFileSync(absolute);
    const ext = path.extname(fontPath).toLowerCase().replace(".", "");
    const mime = ext === "ttf" ? "font/ttf" : ext === "otf" ? "font/otf" : "font/ttf";
    return `data:${mime};base64,${buff.toString("base64")}`;
  } catch (err) {
    console.warn("Could not load font", fontPath, err);
    return null;
  }
};

const escapeXml = (unsafe) => {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

// ------------ Canvas + Layout helpers ------------
const DEFAULT_CANVAS = { width: 1000, height: 1500 }; // Pinterest-friendly portrait

const gridLayout = (count, canvas) => {
  const W = canvas.width, H = canvas.height;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const gutter = Math.round(W * 0.02);
  const cellW = Math.floor((W - gutter * (cols + 1)) / cols);
  const cellH = Math.floor((H - gutter * (rows + 1)) / rows);
  const layouts = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (i >= count) break;
      layouts.push({ left: gutter + c * (cellW + gutter), top: gutter + r * (cellH + gutter), width: cellW, height: cellH });
    }
  }
  return layouts;
};

const verticalStack = (count, canvas) => {
  const W = canvas.width, H = canvas.height;
  const gutter = Math.round(H * 0.02);
  const availableH = H - (count + 1) * gutter;
  const cellH = Math.max(80, Math.floor(availableH / count));
  const cellW = Math.floor(W - 2 * gutter);
  const layouts = [];
  for (let i = 0; i < count; i++) layouts.push({ left: gutter, top: gutter + i * (cellH + gutter), width: cellW, height: cellH });
  return layouts;
};

const heroLeft = (count, canvas) => {
  const W = canvas.width, H = canvas.height;
  if (count === 1) return [{ left: Math.round(W * 0.05), top: Math.round(H * 0.05), width: Math.round(W * 0.9), height: Math.round(H * 0.9) }];
  const gutter = Math.round(W * 0.02);
  const heroW = Math.round(W * 0.62);
  const sideW = W - heroW - 3 * gutter;
  const sideCount = count - 1;
  const sideH = Math.floor((H - (sideCount + 1) * gutter) / sideCount);
  const layouts = [{ left: gutter, top: gutter, width: heroW, height: H - 2 * gutter }];
  for (let i = 0; i < sideCount; i++) layouts.push({ left: heroW + 2 * gutter, top: gutter + i * (sideH + gutter), width: sideW, height: sideH });
  return layouts;
};

const overlapping = (count, canvas) => {
  const W = canvas.width, H = canvas.height;
  const center = { left: Math.round(W * 0.2), top: Math.round(H * 0.18), width: Math.round(W * 0.6), height: Math.round(H * 0.6) };
  const smallW = Math.round(W * 0.28), smallH = Math.round(H * 0.18);
  const positions = [
    { left: Math.round(W * 0.06), top: Math.round(H * 0.06) },
    { left: Math.round(W * 0.66), top: Math.round(H * 0.06) },
    { left: Math.round(W * 0.06), top: Math.round(H * 0.76) },
    { left: Math.round(W * 0.66), top: Math.round(H * 0.76) }
  ];
  const layouts = [center];
  for (let i = 0; i < Math.min(count - 1, positions.length); i++) layouts.push({ left: positions[i].left, top: positions[i].top, width: smallW, height: smallH });
  if (count > layouts.length) {
    const extra = gridLayout(count - layouts.length, DEFAULT_CANVAS);
    extra.forEach(e => layouts.push(e));
  }
  return layouts;
};

const polaroidLayout = (count, canvas) => {
  const W = canvas.width, H = canvas.height;
  const cols = Math.min(3, Math.ceil(Math.sqrt(count)));
  const rows = Math.ceil(count / cols);
  const gutter = Math.round(W * 0.03);
  const cellW = Math.floor((W - (cols + 1) * gutter) / cols);
  const cellH = Math.floor((H * 0.6 - (rows + 1) * gutter) / rows);
  const layouts = [];
  const topOffset = Math.round(H * 0.08);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (i >= count) break;
      layouts.push({ left: gutter + c * (cellW + gutter), top: topOffset + gutter + r * (cellH + gutter), width: cellW, height: cellH });
    }
  }
  return layouts;
};

const pickLayoutForVariant = (variantId, count, canvas) => {
  switch (variantId) {
    case 1: return gridLayout(count, canvas);
    case 2: return verticalStack(count, canvas);
    case 3: return heroLeft(count, canvas);
    case 4: return overlapping(count, canvas);
    case 5: return polaroidLayout(count, canvas);
    case 6: return (() => {
      if (count === 1) return heroLeft(1, canvas);
      const topH = Math.round(canvas.height * 0.55);
      const layouts = [{ left: 0, top: 0, width: canvas.width, height: topH }];
      const remaining = Math.max(0, count - 1);
      const bottom = gridLayout(remaining || 1, { width: canvas.width, height: canvas.height - topH });
      bottom.forEach(b => layouts.push({ left: b.left, top: b.top + topH, width: b.width, height: b.height }));
      return layouts;
    })();
    case 7: return (() => {
      const gutter = Math.round(canvas.width * 0.02);
      const availableW = canvas.width - (count + 1) * gutter;
      const cellW = Math.max(80, Math.floor(availableW / count));
      const cellH = Math.floor(canvas.height - 2 * gutter);
      const layouts = [];
      for (let i = 0; i < count; i++) layouts.push({ left: gutter + i * (cellW + gutter), top: gutter, width: cellW, height: cellH });
      return layouts;
    })();
    case 8: return (() => { if (count === 1) return [{ left: 0, top: 0, width: canvas.width, height: canvas.height }]; return gridLayout(count, canvas); })();
    case 9: return (() => {
      if (count === 1) return [{ left: Math.round(canvas.width * 0.05), top: Math.round(canvas.height * 0.05), width: Math.round(canvas.width * 0.9), height: Math.round(canvas.height * 0.9) }];
      const center = { left: Math.round(canvas.width * 0.22), top: Math.round(canvas.height * 0.18), width: Math.round(canvas.width * 0.56), height: Math.round(canvas.height * 0.56) };
      const smallW = Math.round(canvas.width * 0.18), smallH = Math.round(canvas.height * 0.18);
      const positions = [
        { left: Math.round(canvas.width * 0.04), top: Math.round(canvas.height * 0.04) },
        { left: Math.round(canvas.width * 0.78), top: Math.round(canvas.height * 0.04) },
        { left: Math.round(canvas.width * 0.04), top: Math.round(canvas.height * 0.78) },
        { left: Math.round(canvas.width * 0.78), top: Math.round(canvas.height * 0.78) }
      ];
      const layouts = [center];
      for (let i = 0; i < Math.min(count - 1, positions.length); i++) layouts.push({ left: positions[i].left, top: positions[i].top, width: smallW, height: smallH });
      if (count > layouts.length) {
        const extra = gridLayout(count - layouts.length, canvas);
        extra.forEach(e => layouts.push(e));
      }
      return layouts;
    })();
    case 10: return polaroidLayout(count, canvas);
    default: return gridLayout(count, canvas);
  }
};

const buildTitleSvg = (canvas, text, opts = {}) => {
  const W = canvas.width;
  const H = Math.round(canvas.height * 0.16);
  const fontSize = opts.fontSize || Math.round(H * 0.36);
  const padding = 40;
  const bg = opts.bg || "rgba(0,0,0,0.55)";
  const color = opts.color || "#ffffff";
  const align = opts.align || "center";
  const x = align === "left" ? padding : (align === "center" ? W / 2 : W - padding);
  const textAnchor = align === "left" ? "start" : (align === "center" ? "middle" : "end");
  return `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <style>.t{ font-family: 'Poppins', 'Arial', sans-serif; font-weight:700; font-size:${fontSize}px; fill:${color}; }</style>
      <rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="${bg}" />
      <text x="${x}" y="${Math.round(H / 2 + fontSize * 0.32)}" class="t" text-anchor="${textAnchor}">${escapeXml(text)}</text>
    </svg>
  `;
};

const buildPolaroidFrameSvg = (w, h, caption) => {
  const frameW = w, frameH = h + Math.round(h * 0.15);
  const imgH = h;
  const captionSvg = caption ? `<text x="${frameW / 2}" y="${imgH + Math.round(h * 0.12)}" font-family="Poppins, Arial" font-size="${Math.round(h * 0.07)}" text-anchor="middle" fill="#111">${escapeXml(caption)}</text>` : "";
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${frameW}" height="${frameH}">
      <rect x="0" y="0" width="${frameW}" height="${frameH}" fill="#fff" rx="6" stroke="#e6e6e6"/>
      <rect x="${Math.round(frameW * 0.06)}" y="${Math.round(frameH * 0.04)}" width="${Math.round(frameW * 0.88)}" height="${imgH}" fill="none"/>
      ${captionSvg}
    </svg>
  `;
};

// ------------ Variants metadata ------------
const VARIANTS = {
  1: { name: "Grid Minimal", desc: "Clean grid, white background, subtle gutters", folderHint: "Poppins" },
  2: { name: "Pinterest Stack", desc: "Vertical stacked, great for long pins", folderHint: "Playfair_Display" },
  3: { name: "Hero Left", desc: "Large hero + side column", folderHint: "Montserrat_Alternates" },
  4: { name: "Overlapping", desc: "Center hero with surrounding images", folderHint: "Abril_Fatface" },
  5: { name: "Polaroid Collage", desc: "Polaroid frames with gentle shadows", folderHint: "Poppins" },
  6: { name: "Banner Split", desc: "Large header image with grid below", folderHint: "Playfair_Display" },
  7: { name: "Horizontal Banner", desc: "Horizontal tiles with bold color blocks", folderHint: "Montserrat" },
  8: { name: "Full Bleed Hero", desc: "Single-image dramatic cover", folderHint: "Abril_Fatface" },
  9: { name: "Mosaic Center", desc: "Large center photo + mosaic", folderHint: "Poppins" },
  10: { name: "Polaroid Stacked", desc: "Playful polaroid cluster", folderHint: "Montserrat" }
};

const PinterestController = {

  // ==================== CATEGORY CRUD ====================

  // Create Category
  createCategory: async (req, res) => {
    try {
      const { categoryName } = req.body;

      // Validation
      if (!categoryName || categoryName.trim() === '') {
        return helper.sendError(res, 400, 'Category name is required.');
      }

      // Check if category already exists
      const existing = await PinterestCategory.findOne({
        categoryName: categoryName.trim()
      });

      if (existing) {
        return helper.sendError(res, 400, 'Category with this name already exists.');
      }

      // Create new category
      const category = new PinterestCategory({
        categoryName: categoryName.trim(),
        status: 1 // Active by default
      });

      await category.save();

      return helper.sendSuccess(res, 201, 'Category created successfully.', category);

    } catch (error) {
      console.error('Error creating Pinterest category:', error);
      return helper.sendError(res, 500, error.message || 'Failed to create category.');
    }
  },

  // Read/Fetch Categories
  fetchCategories: async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.body;

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;

      // Build query
      let query = {};
      if (status !== undefined && (status === 0 || status === 1)) {
        query.status = status;
      }

      const total = await PinterestCategory.countDocuments(query);
      const categories = await PinterestCategory.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

      return helper.sendSuccess(res, 200, 'Categories fetched successfully.', {
        categories,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });

    } catch (error) {
      console.error('Error fetching Pinterest categories:', error);
      return helper.sendError(res, 500, error.message || 'Failed to fetch categories.');
    }
  },

  // Update Category
  updateCategory: async (req, res) => {
    try {
      const { categoryId, categoryName, status } = req.body;

      // Validation
      if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
        return helper.sendError(res, 400, 'Valid category ID is required.');
      }

      // Find category
      const category = await PinterestCategory.findById(categoryId);
      if (!category) {
        return helper.sendError(res, 404, 'Category not found.');
      }

      // Update fields
      if (categoryName && categoryName.trim() !== '') {
        // Check if new name conflicts with another category
        const existing = await PinterestCategory.findOne({
          categoryName: categoryName.trim(),
          _id: { $ne: categoryId }
        });

        if (existing) {
          return helper.sendError(res, 400, 'Category with this name already exists.');
        }

        category.categoryName = categoryName.trim();
      }

      if (status !== undefined && (status === 0 || status === 1)) {
        category.status = status;
      }

      await category.save();

      return helper.sendSuccess(res, 200, 'Category updated successfully.', category);

    } catch (error) {
      console.error('Error updating Pinterest category:', error);
      return helper.sendError(res, 500, error.message || 'Failed to update category.');
    }
  },

  // Delete Category
  deleteCategory: async (req, res) => {
    try {
      const { categoryId } = req.body;

      // Validation
      if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
        return helper.sendError(res, 400, 'Valid category ID is required.');
      }

      // Check if category has associated projects
      const projectCount = await PinterestProject.countDocuments({ categoryId });
      if (projectCount > 0) {
        return helper.sendError(res, 400, `Cannot delete category. ${projectCount} project(s) are using this category.`);
      }

      // Delete category
      const result = await PinterestCategory.findByIdAndDelete(categoryId);

      if (!result) {
        return helper.sendError(res, 404, 'Category not found.');
      }

      return helper.sendSuccess(res, 200, 'Category deleted successfully.');

    } catch (error) {
      console.error('Error deleting Pinterest category:', error);
      return helper.sendError(res, 500, error.message || 'Failed to delete category.');
    }
  },

  // ==================== PROJECT CRUD ====================

  // Create Pinterest Project
  createProject: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { categoryName, niche, font, websiteName } = req.body;

      // Validation
      if (!categoryName || categoryName.trim() === '') {
        return helper.sendError(res, 400, 'Category name is required.');
      }

      if (!niche || niche.trim() === '') {
        return helper.sendError(res, 400, 'Niche is required.');
      }

      // Find category by name
      const category = await PinterestCategory.findOne({
        categoryName: categoryName.trim(),
        status: 1 // Only active categories
      });

      if (!category) {
        return helper.sendError(res, 404, 'Category not found or inactive. Please select a valid category.');
      }

      // Create new Pinterest project
      const project = new PinterestProject({
        userId,
        categoryId: category._id,
        niche: niche.trim(),
        font: font ? font.trim() : null,
        websiteName: websiteName ? websiteName.trim() : null
      });

      await project.save();

      // Populate category info in response
      const populatedProject = await PinterestProject.findById(project._id)
        .populate('categoryId', 'categoryName')
        .lean();

      return helper.sendSuccess(res, 201, 'Pinterest project created successfully.', populatedProject);

    } catch (error) {
      console.error('Error creating Pinterest project:', error);
      return helper.sendError(res, 500, error.message || 'Failed to create Pinterest project.');
    }
  },

  // Generate Pinterest Pin Titles
  generatePinTitles: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { pinterestProjectId, count } = req.body;

      // Validation
      if (!pinterestProjectId || !mongoose.isValidObjectId(pinterestProjectId)) {
        return helper.sendError(res, 400, 'Valid Pinterest project ID is required.');
      }

      const n = Math.min(Math.max(Number(count) || 10, 1), 100);

      // Fetch Pinterest project with populated category
      const project = await PinterestProject.findById(pinterestProjectId)
        .populate('categoryId', 'categoryName')
        .lean();

      if (!project) {
        return helper.sendError(res, 404, 'Pinterest project not found.');
      }

      // Check if project belongs to the user
      if (project.userId.toString() !== userId.toString()) {
        return helper.sendError(res, 403, 'You do not have permission to access this project.');
      }

      const categoryName = project.categoryId?.categoryName || 'General';
      const niche = project.niche || '';
      const websiteName = project.websiteName || 'Website';
      const font = project.font || '';

      // Build Pinterest-optimized prompt
      const prompt = `You are an expert Pinterest content strategist specializing in viral, click-worthy pin titles.

Project Details:
- Website/Brand: "${websiteName}"
- Category: "${categoryName}"
- Niche: "${niche}"
- Font Style: "${font || 'N/A'}"

TASK: Generate EXACTLY ${n} UNIQUE, highly engaging Pinterest pin titles optimized for maximum clicks and saves.

Pinterest Title Requirements:
1. NUMERIC & LIST-BASED TITLES are ESSENTIAL:
   - Start with numbers: "10 Best...", "5 Easy...", "7 Ways to...", "15 Must-Have..."
   - Use "Top N", "Best N", "N Tips", "N Ideas", "N Secrets", "N Hacks"
   - Examples: "10 Best Travel Destinations", "5 Easy DIY Projects", "7 Ways to Save Money"

2. POWER WORDS & EMOTIONAL TRIGGERS:
   - Use: Best, Ultimate, Essential, Amazing, Perfect, Genius, Brilliant, Stunning, Beautiful
   - Use: Easy, Simple, Quick, Fast, Effortless, Beginner-Friendly
   - Use: Must-Have, Must-Try, Must-See, Game-Changing, Life-Changing

3. STYLE VARIETY (Mix these formats):
   - Listicles: "10 Best [Topic] for [Benefit]"
   - How-To: "How to [Action] Like a Pro"
   - Before/After: "[X] vs [Y]: Which is Better?"
   - Curated Lists: "Ultimate Guide to [Topic]"
   - Problem-Solution: "[N] Ways to Fix [Problem]"
   - Seasonal/Trending: "Best [Topic] for [Season/Year]"
   - Inspirational: "[N] [Adjective] Ideas That Will [Benefit]"

4. FORMATTING RULES:
   - 40-60 characters optimal (Pinterest best practice)
   - Title Case capitalization
   - No emojis (keep it clean)
   - Clear, concise, action-oriented
   - Include benefits/outcomes when possible

5. NICHE ALIGNMENT:
   - All titles MUST be relevant to the niche: "${niche}"
   - Incorporate category "${categoryName}" themes naturally
   - Appeal to Pinterest users searching in this niche

6. EXAMPLES OF GREAT PINTEREST TITLES:
   - "10 Best Budget Travel Destinations for 2025"
   - "5 Easy DIY Home Decor Projects Anyone Can Do"
   - "7 Proven Ways to Grow Your Instagram Followers Fast"
   - "15 Must-Try Healthy Breakfast Recipes"
   - "Ultimate Guide to Meal Prep for Beginners"
   - "10 Genius Organization Hacks for Small Spaces"

OUTPUT FORMAT:
- Return ONLY a pure JSON array of exactly ${n} title strings
- Format: ["Title 1", "Title 2", "Title 3", ...]
- NO explanations, NO keys, NO objects, NO markdown, NO extra text
- Each title must be unique and distinct
- Prioritize numeric/list-based titles (at least 70% of titles should start with numbers)

Generate ${n} viral-worthy Pinterest titles now:`.trim();

      // Call OpenAI
      let titles;
      try {
        titles = await fetchJSONFromOpenAI(
          prompt,
          'GENERATE_PINTEREST_TITLES',
          {
            userId: userId.toString(),
            projectId: pinterestProjectId,
            promptFrom: 'PinterestController',
            promptFor: `Pinterest Titles - ${categoryName} - ${niche}`
          }
        );
      } catch (error) {
        console.error('OpenAI API error:', error);
        return helper.sendError(res, 500, 'Failed to generate titles from AI: ' + error.message);
      }

      // Validate and clean response
      if (!Array.isArray(titles)) {
        console.error('OpenAI did not return an array:', titles);
        return helper.sendError(res, 502, 'AI did not return a valid array of titles.');
      }

      // Clean and deduplicate titles
      const cleanedTitles = [];
      const seen = new Set();

      for (const raw of titles) {
        const title = String(raw || '').trim().replace(/\s+/g, ' ');
        if (!title) continue;

        const key = title.toLowerCase();
        if (seen.has(key)) continue;

        seen.add(key);
        cleanedTitles.push(title);

        if (cleanedTitles.length >= n) break;
      }

      // If we don't have enough titles, add fallbacks
      const fallbackPrefixes = [
        'Top 10', 'Best 5', '7 Amazing', '10 Essential', '5 Must-Try',
        '8 Proven', '10 Easy', '6 Simple', '12 Ultimate', '15 Best'
      ];

      while (cleanedTitles.length < n) {
        const idx = cleanedTitles.length;
        const prefix = fallbackPrefixes[idx % fallbackPrefixes.length];
        const fallback = `${prefix} ${niche} Ideas for ${categoryName}`;

        if (!seen.has(fallback.toLowerCase())) {
          cleanedTitles.push(fallback);
          seen.add(fallback.toLowerCase());
        } else {
          cleanedTitles.push(`${fallback} #${idx + 1}`);
        }
      }

      return helper.sendSuccess(res, 200, 'Pinterest titles generated successfully.', {
        titles: cleanedTitles,
        meta: {
          projectId: pinterestProjectId,
          websiteName,
          category: categoryName,
          niche,
          requested: n,
          returned: cleanedTitles.length
        }
      });

    } catch (error) {
      console.error('Error in generatePinTitles:', error);
      return helper.sendError(res, 500, error.message || 'Failed to generate Pinterest titles.');
    }
  },

  // Generate Pinterest Blogs from Titles
  generatePinterestBlogs: async (req, res) => {
    try {
      const userId = req.user.userId;
      let { pinterestProjectId, titles } = req.body;

      if (typeof titles === 'string') {
        titles = JSON.parse(titles);
      }


      // Validation
      if (!pinterestProjectId || !mongoose.isValidObjectId(pinterestProjectId)) {
        return helper.sendError(res, 400, 'Valid Pinterest project ID is required.');
      }

      if (!Array.isArray(titles) || titles.length === 0) {
        return helper.sendError(res, 400, 'Titles array is required and must not be empty.');
      }

      // Fetch Pinterest project
      const project = await PinterestProject.findById(pinterestProjectId)
        .populate('categoryId', 'categoryName')
        .lean();

      if (!project) {
        return helper.sendError(res, 404, 'Pinterest project not found.');
      }

      // Check if project belongs to the user
      if (project.userId.toString() !== userId.toString()) {
        return helper.sendError(res, 403, 'You do not have permission to access this project.');
      }

      const categoryName = project.categoryId?.categoryName || 'General';
      const niche = project.niche || '';
      const websiteName = project.websiteName || 'Website';

      console.log(`[Pinterest Blogs] Processing ${titles.length} titles for project ${pinterestProjectId}`);

      const createdPins = [];
      const errors = [];

      // Process each title
      for (let i = 0; i < titles.length; i++) {
        const title = String(titles[i] || '').trim();
        if (!title) {
          errors.push({ title: titles[i], error: 'Empty title' });
          continue;
        }

        try {
          console.log(`[Pinterest Blogs] Processing ${i + 1}/${titles.length}: "${title}"`);

          // Generate slug from title
          const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 100);

          // Check if slug already exists for this project
          const existingPin = await PinterestWebsitePin.findOne({
            pinterestProjectId,
            slug
          });

          if (existingPin) {
            console.log(`[Pinterest Blogs] Slug "${slug}" already exists, skipping...`);
            errors.push({ title, error: 'Slug already exists' });
            continue;
          }

          // Step 1: Generate trending questions and answers
          const qaPrompt = `You are a Pinterest content expert. Generate 1-2 trending questions with detailed answers for the following Pinterest pin title.

Title: "${title}"
Category: "${categoryName}"
Niche: "${niche}"

Requirements:
- Generate 1-2 trending, engaging questions that Pinterest users would search for
- Questions should be related to the title and current trends (e.g., "What are the best [topic] for 2025?", "How to [action] in [current year]?")
- Provide comprehensive, helpful answers (100-150 words each)
- Focus on practical, actionable information
- Use natural, conversational language

OUTPUT FORMAT (IMPORTANT):
Return ONLY a JSON array of objects with this exact structure:
[
  {
    "question": "Question text here?",
    "answer": "Detailed answer here..."
  }
]

NO explanations, NO markdown, NO extra text. Just the JSON array.`;

          let questionsAnswers = [];
          try {
            questionsAnswers = await fetchJSONFromOpenAI(
              qaPrompt,
              'PINTEREST_TRENDING_QA',
              {
                userId: userId.toString(),
                projectId: pinterestProjectId,
                promptFrom: 'PinterestController',
                promptFor: `Trending Q&A - ${title}`
              }
            );

            if (!Array.isArray(questionsAnswers)) {
              questionsAnswers = [];
            }
          } catch (error) {
            console.error(`[Pinterest Blogs] Q&A generation failed for "${title}":`, error.message);
            questionsAnswers = [];
          }

           // Step 2: Extract number from title to determine how many image sections we need
           let imageCount = 5; // Default
           const numberMatch = title.match(/\b(\d+)\b/); // Match any number in the title
           if (numberMatch) {
             const extractedNumber = parseInt(numberMatch[1], 10);
             // Set reasonable limits (min 3, max 15)
             imageCount = Math.min(Math.max(extractedNumber, 3), 15);
             console.log(`[Pinterest Blogs] Extracted number ${extractedNumber} from title, will create ${imageCount} image sections`);
           }

           // Step 3: Generate specific image titles and metadata for each section
           console.log(`[Pinterest Blogs] Generating ${imageCount} specific image titles and metadata...`);
           
           const imageMetadataPrompt = `You are a Pinterest content expert. Generate ${imageCount} specific, detailed image titles with descriptions for the following Pinterest pin.

Pin Title: "${title}"
Category: "${categoryName}"
Niche: "${niche}"
Number of Images Needed: ${imageCount}

TASK: Generate ${imageCount} UNIQUE image concepts with:
1. Specific Image Title (8-12 words, descriptive and searchable)
2. Detailed Description (250-300 words, SEO-optimized, Pinterest-friendly)
3. Alt Text (12-15 words, accessibility-focused)

IMPORTANT:
- Each image title should represent a DIFFERENT aspect of the main topic
- Titles should be SPECIFIC enough to find relevant stock photos
- Descriptions should be detailed, engaging, and keyword-rich
- Make titles searchable (e.g., "Modern Boho Living Room with Natural Textures" not just "Living Room")

EXAMPLE for "10 Best Living Room Decor Ideas":
1. "Minimalist Scandinavian Living Room with White Walls"
2. "Cozy Rustic Farmhouse Living Room with Fireplace"
3. "Modern Industrial Loft Living Room Design"

OUTPUT FORMAT (IMPORTANT):
Return ONLY a JSON array of exactly ${imageCount} objects with this structure:
[
  {
    "imageTitle": "Specific descriptive title here",
    "description": "Detailed 250-300 word description here...",
    "altText": "Accessibility-focused alt text here"
  }
]

          NO explanations, NO markdown, NO extra text. Just the JSON array.`;

           let imageMetadataList = [];
           try {
             imageMetadataList = await fetchJSONFromOpenAI(
               imageMetadataPrompt,
               'PINTEREST_IMAGE_TITLES_METADATA',
               {
                 userId: userId.toString(),
                 projectId: pinterestProjectId,
                 promptFrom: 'PinterestController',
                 promptFor: `Image Titles & Metadata - ${title}`
               }
             );

             if (!Array.isArray(imageMetadataList)) {
               console.error(`[Pinterest Blogs] AI did not return array for image metadata`);
               imageMetadataList = [];
             }
           } catch (error) {
             console.error(`[Pinterest Blogs] Image metadata generation failed:`, error.message);
             imageMetadataList = [];
           }

           // If AI didn't generate enough, create fallbacks
           while (imageMetadataList.length < imageCount) {
             const idx = imageMetadataList.length + 1;
             imageMetadataList.push({
               imageTitle: `${title} - Idea ${idx}`,
               description: `Discover amazing ${niche} inspiration related to ${title}. This image showcases beautiful design elements and creative ideas that will inspire your next project.`,
               altText: `${title} inspiration ${idx}`
             });
           }

           // Limit to requested count
           imageMetadataList = imageMetadataList.slice(0, imageCount);

           console.log(`[Pinterest Blogs] Generated ${imageMetadataList.length} image metadata entries`);

           // Step 4: For each image metadata, fetch 2 specific images from Freepik
           const imagesWithMetadata = [];

           for (let j = 0; j < imageMetadataList.length; j++) {
             const metadata = imageMetadataList[j];
             const imageTitle = metadata.imageTitle || `${title} - ${j + 1}`;
             const imageDescription = metadata.description || `Image ${j + 1} for ${title}`;
             const imageAltText = metadata.altText || imageTitle;

             console.log(`[Pinterest Blogs] Fetching 2 images for: "${imageTitle}"`);

             // Fetch 2 images specifically for this title
             const specificImages = await fetchFreepikImages(imageTitle, pinterestProjectId, 2);

             if (!specificImages || specificImages.length === 0) {
               console.warn(`[Pinterest Blogs] No images found for "${imageTitle}", trying with main title...`);
               // Fallback: try with main title
               const fallbackImages = await fetchFreepikImages(title, pinterestProjectId, 2);
               if (fallbackImages && fallbackImages.length > 0) {
                 specificImages.push(...fallbackImages);
               }
             }

             // Store the metadata with its images
             imagesWithMetadata.push({
               title: imageTitle,
               description: imageDescription,
               altText: imageAltText,
               images: specificImages.slice(0, 2).map(img => img.url) // Store array of 2 image URLs
             });

             console.log(`[Pinterest Blogs] Added ${specificImages.length} images for "${imageTitle}"`);
           }

           // Check if we got any images at all
           const totalImages = imagesWithMetadata.reduce((sum, item) => sum + (item.images?.length || 0), 0);
           if (totalImages === 0) {
             console.warn(`[Pinterest Blogs] No images found for "${title}"`);
             errors.push({ title, error: 'No images found from Freepik' });
             continue;
           }

           console.log(`[Pinterest Blogs] Total: ${imagesWithMetadata.length} sections with ${totalImages} images for "${title}"`);


          // Step 4: Generate main pin description
          const descPrompt = `Generate a compelling Pinterest pin description for the following title.

          Title: "${title}"
          Category: "${categoryName}"
          Niche: "${niche}"

          Requirements:
          - 150-200 words
          - Engaging and click-worthy
          - Include relevant keywords naturally
          - Add a call-to-action
          - Use emojis sparingly (2-3 max)
          - Pinterest-optimized format

          Return ONLY the description text, no extra formatting or explanations.`;

          let description = `Discover amazing insights about ${title}. Click to learn more!`;
          try {
            const descResult = await fetchJSONFromOpenAI(
              descPrompt,
              'PINTEREST_PIN_DESCRIPTION',
              {
                userId: userId.toString(),
                projectId: pinterestProjectId,
                promptFrom: 'PinterestController',
                promptFor: `Pin Description - ${title}`
              }
            );

            if (typeof descResult === 'string') {
              description = descResult.trim();
            } else if (Array.isArray(descResult) && descResult.length > 0) {
              description = String(descResult[0]).trim();
            }
          } catch (error) {
            console.error(`[Pinterest Blogs] Description generation failed:`, error.message);
          }

           // Step 5: Create Pinterest Website Pin entry
           const mainImage = imagesWithMetadata[0]?.images?.[0] || ''; // First image from first section
           const mainAltText = imagesWithMetadata[0]?.altText || title;

           const newPin = new PinterestWebsitePin({
             pinterestProjectId,
             image: mainImage, // Main featured image
             slug,
             title,
             description,
             trendingQuestionsAnswers: questionsAnswers.slice(0, 2), // Max 2 Q&As
             images: imagesWithMetadata, // Array of sections with title, description, altText, and images array
             altText: mainAltText,
             authorName: websiteName,
             isScheduled: 0,
             scheduleTime: null
           });

          await newPin.save();
          console.log(`[Pinterest Blogs] ✅ Created pin: "${title}" (${slug})`);

          createdPins.push({
            id: newPin._id,
            title: newPin.title,
            slug: newPin.slug,
            imageSections: imagesWithMetadata.length,
            totalImages: totalImages,
            questionsCount: questionsAnswers.length
          });

        } catch (error) {
          console.error(`[Pinterest Blogs] Error processing "${title}":`, error);
          errors.push({ title, error: error.message });
        }
      }

      return helper.sendSuccess(res, 200, 'Pinterest blogs generated successfully.', {
        created: createdPins,
        errors: errors,
        summary: {
          total: titles.length,
          successful: createdPins.length,
          failed: errors.length
        }
      });

     } catch (error) {
       console.error('Error in generatePinterestBlogs:', error);
       return helper.sendError(res, 500, error.message || 'Failed to generate Pinterest blogs.');
     }
   },

   // Generate AI Images using Nano Banana
   generateNanoBananaImages: async (req, res) => {
     try {
       const userId = req.user.userId;
       const { pinterestProjectId, prompts, count, options } = req.body;

       // Validation
       if (!pinterestProjectId || !mongoose.isValidObjectId(pinterestProjectId)) {
         return helper.sendError(res, 400, 'Valid Pinterest project ID is required.');
       }

      if (!prompts || (typeof prompts !== 'string' && !Array.isArray(prompts))) {
        return helper.sendError(res, 400, 'Prompts (string or array) are required.');
      }

      // Fetch Pinterest project to verify ownership
      const project = await PinterestProject.findById(pinterestProjectId).lean();

      if (!project) {
        return helper.sendError(res, 404, 'Pinterest project not found.');
      }

      // Check if project belongs to the user
      if (project.userId.toString() !== userId.toString()) {
        return helper.sendError(res, 403, 'You do not have permission to access this project.');
      }

      // Parse prompts - handle stringified arrays, actual arrays, or single strings
      let promptArray = [];
      
      if (Array.isArray(prompts)) {
        // Already an array
        promptArray = prompts;
      } else if (typeof prompts === 'string') {
        // Check if it's a JSON array string
        const trimmed = prompts.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            // Try to parse as JSON array
            const parsed = JSON.parse(trimmed);
            promptArray = Array.isArray(parsed) ? parsed : [prompts];
          } catch (e) {
            // Not valid JSON, treat as single prompt
            promptArray = [prompts];
          }
        } else {
          // Single prompt string
          promptArray = [prompts];
        }
      }

      if (promptArray.length === 0) {
        return helper.sendError(res, 400, 'At least one prompt is required.');
      }

      console.log(`[Nano Banana API] Processing ${promptArray.length} prompt(s) for project ${pinterestProjectId}`);
      console.log(`[Nano Banana API] Parsed prompts:`, JSON.stringify(promptArray, null, 2));

       // Parse generation options
       const generationOptions = options || {};
       const imagesPerPrompt = Math.min(Math.max(parseInt(count) || 2, 1), 4); // 1-4 images per prompt

       const results = [];
       const errors = [];

       // Process each prompt
       for (let i = 0; i < promptArray.length; i++) {
         const prompt = String(promptArray[i] || '').trim();
         
         if (!prompt) {
           errors.push({ prompt: promptArray[i], error: 'Empty prompt' });
           continue;
         }

         try {
           console.log(`[Nano Banana API] Generating images ${i + 1}/${promptArray.length}: "${prompt}"`);

           // Generate images with retry logic
           const generatedImages = await generateWithRetry(
             prompt,
             pinterestProjectId,
             imagesPerPrompt,
             generationOptions,
             2 // Max 2 retries
           );

           if (generatedImages && generatedImages.length > 0) {
             results.push({
               prompt: prompt,
               images: generatedImages,
               count: generatedImages.length
             });
             console.log(`[Nano Banana API] ✅ Generated ${generatedImages.length} image(s) for: "${prompt}"`);
           } else {
             errors.push({ prompt, error: 'No images generated' });
           }

         } catch (error) {
           console.error(`[Nano Banana API] Failed to generate images for "${prompt}":`, error.message);
           errors.push({ prompt, error: error.message });
         }
       }

       // Calculate totals
       const totalImages = results.reduce((sum, r) => sum + r.count, 0);

       return helper.sendSuccess(res, 200, 'AI image generation completed.', {
         generated: results,
         errors: errors,
         summary: {
           totalPrompts: promptArray.length,
           successfulPrompts: results.length,
           failedPrompts: errors.length,
           totalImages: totalImages,
           imagesPerPrompt: imagesPerPrompt
         }
       });

     } catch (error) {
       console.error('Error in generateNanoBananaImages:', error);
       return helper.sendError(res, 500, error.message || 'Failed to generate AI images.');
     }
   },

   // ==================== IMAGE MANIPULATION ====================

  // POST /admin/v1/make_collage
  // body: { imageLinks: [urls], variantId?: 1-10, text?: string }
  make_collage: async (req, res) => {
    try {
      let { imageLinks, variantId, text } = req.body;
      if (!imageLinks) return helper.sendError(res, 400, "imageLinks is required");
      if (typeof imageLinks === "string") imageLinks = JSON.parse(imageLinks);
      if (!Array.isArray(imageLinks) || imageLinks.length === 0) return helper.sendError(res, 400, "imageLinks must be a non-empty array");

      if (variantId) variantId = Number(variantId);
      if (!variantId || variantId < 1 || variantId > 10) {
        const keys = Object.keys(VARIANTS);
        variantId = Number(keys[Math.floor(Math.random() * keys.length)]);
      }

      const canvas = DEFAULT_CANVAS;

      // Fetch images
      const fetched = await Promise.all(imageLinks.map(async (url) => {
        try {
          const b = await fetchImageBuffer(url);
          return { ok: true, buffer: b, url };
        } catch (err) {
          console.warn("fetch error:", url, err.message || err);
          return { ok: false, buffer: null, url };
        }
      }));

      const valid = fetched.filter(f => f.ok).map(f => f.buffer);
      if (valid.length === 0) return helper.sendError(res, 400, "None of the imageLinks could be downloaded");

      const layout = pickLayoutForVariant(variantId, valid.length, canvas);

      // Determine fonts location: look for backend/fonts/allfonts (relative path from controller)
      const allFontsRel = "../fonts/allfonts"; // <-- adjust if your fonts folder path differs
      // Build font map dynamically by trying to discover ttf inside these subfolders
      // keys used in SVG embedding below
      const fontFolders = {
        "Poppins": ["Poppins", "Poppins-Variable", "Poppins-Regular"],
        "Playfair_Display": ["Playfair_Display", "Playfair-Display", "PlayfairDisplay"],
        "Montserrat_Alternates": ["Montserrat_Alternates", "MontserratAlternates", "Montserrat_Alternates"],
        "Abril_Fatface": ["Abril_Fatface", "AbrilFatface", "Abril"],
        "Montserrat": ["Montserrat", "Montserrat-Regular", "MontserratAlternates"],
        // fallback general names
        "Open_Sans": ["Open_Sans", "OpenSans", "Open"],
      };

      const discoveredFonts = {};
      for (const [key, candidates] of Object.entries(fontFolders)) {
        const found = findFontFileInAllFonts(allFontsRel, candidates);
        if (found) discoveredFonts[key] = loadFontDataUrl(found);
        else discoveredFonts[key] = null;
      }

      // Build base canvas
      const variantBg = (variantId === 7) ? "#ffef66" : (variantId === 10 ? "#fff7f9" : "#ffffff");
      const base = sharp({ create: { width: canvas.width, height: canvas.height, channels: 3, background: variantBg } });
      const composites = [];

      // Polaroid variants
      if (variantId === 5 || variantId === 10) {
        for (let i = 0; i < valid.length; i++) {
          const slot = layout[i] || layout[layout.length - 1];
          const innerW = Math.round(slot.width * 0.9);
          const innerH = Math.round(slot.height * 0.82);
          const imgBuf = await sharp(valid[i]).resize({ width: innerW, height: innerH, fit: "cover" }).toBuffer();
          const frameSvg = buildPolaroidFrameSvg(slot.width, innerH, "");
          const imgLeft = slot.left + Math.round((slot.width - innerW) / 2);
          const imgTop = slot.top + Math.round((slot.height - innerH) / 6);
          composites.push({ input: imgBuf, left: imgLeft, top: imgTop });
          composites.push({ input: Buffer.from(frameSvg), left: slot.left, top: slot.top });
        }
      } else {
        for (let i = 0; i < valid.length; i++) {
          const slot = layout[i] || layout[layout.length - 1];
          const imgBuf = await sharp(valid[i]).resize({ width: slot.width, height: slot.height, fit: "cover" }).toBuffer();
          composites.push({ input: imgBuf, left: slot.left, top: slot.top });
          if (variantId === 4 || variantId === 9) {
            const borderSvg = `<svg width="${slot.width}" height="${slot.height}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${slot.width}" height="${slot.height}" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="6" rx="6"/></svg>`;
            composites.push({ input: Buffer.from(borderSvg), left: slot.left, top: slot.top });
          }
        }
      }

      // Handle text overlay smartly
      if (text && String(text).trim().length > 0) {
        const trimmed = String(text).trim();
        if (valid.length === 1) {
          if ([8, 3].includes(variantId)) {
            const titleSvg = buildTitleSvg(canvas, trimmed, { bg: "rgba(0,0,0,0.35)", color: "#fff", align: "center" });
            composites.push({ input: Buffer.from(titleSvg), left: 0, top: Math.round(canvas.height * 0.08) });
          } else if ([4, 9].includes(variantId)) {
            const titleSvg = buildTitleSvg(canvas, trimmed, { bg: "rgba(255,255,255,0.8)", color: "#111", align: "left" });
            composites.push({ input: Buffer.from(titleSvg), left: 0, top: Math.round(canvas.height * 0.05) });
          } else if ([5, 10].includes(variantId)) {
            const titleSvg = buildTitleSvg(canvas, trimmed, { bg: "rgba(0,0,0,0.45)", color: "#fff", align: "center" });
            composites.push({ input: Buffer.from(titleSvg), left: 0, top: canvas.height - Math.round(canvas.height * 0.18) - 24 });
          } else {
            const titleSvg = buildTitleSvg(canvas, trimmed, { bg: "rgba(0,0,0,0.55)", color: "#fff", align: "center" });
            composites.push({ input: Buffer.from(titleSvg), left: 0, top: canvas.height - Math.round(canvas.height * 0.16) - 24 });
          }
        } else {
          if ([2, 7].includes(variantId)) {
            const titleSvg = buildTitleSvg(canvas, trimmed, { bg: "rgba(0,0,0,0.65)", color: "#fff", align: "center" });
            composites.push({ input: Buffer.from(titleSvg), left: 0, top: 24 });
          } else {
            const titleSvg = buildTitleSvg(canvas, trimmed, { bg: "rgba(255,255,255,0.9)", color: "#111", align: "center" });
            composites.push({ input: Buffer.from(titleSvg), left: 0, top: canvas.height - Math.round(canvas.height * 0.16) - 24 });
          }
        }
      }

      const outputPath = path.join(__dirname, `../uploads/collage-${Date.now()}.jpg`);
      await base.composite(composites).jpeg({ quality: 92 }).toFile(outputPath);

      return helper.sendSuccess(res, 200, "Collage created successfully", { collageUrl: `/uploads/${path.basename(outputPath)}`, variant: VARIANTS[variantId] || {} });
    } catch (err) {
      console.error("make_collage error:", err);
      return helper.sendError(res, 500, err.message || err);
    }
  },

  // POST /admin/v1/add_numbering
  add_numbering: async (req, res) => {
    try {
      let { imageLinks, startNumber = 1 } = req.body;
      startNumber = Number(startNumber);

      if (!Array.isArray(imageLinks)) imageLinks = JSON.parse(imageLinks);
      if (!imageLinks || !Array.isArray(imageLinks) || imageLinks.length === 0) {
        return helper.sendError(res, 400, "imageLinks array is required");
      }

      // discover fonts from allfonts folder using the smarter finder
      const allFontsRel = "../fonts/allfonts";
      const fonts = {
        "Poppins": loadFontDataUrl(findFontFileInAllFonts(allFontsRel, ["Poppins", "Poppins-Variable", "Poppins-Regular"])),
        "Playfair": loadFontDataUrl(findFontFileInAllFonts(allFontsRel, ["Playfair_Display", "PlayfairDisplay", "Playfair-Display"])),
        "MontserratAlt": loadFontDataUrl(findFontFileInAllFonts(allFontsRel, ["Montserrat_Alternates", "MontserratAlternates", "Montserrat"])),
        "Abril": loadFontDataUrl(findFontFileInAllFonts(allFontsRel, ["Abril_Fatface", "AbrilFatface", "Abril"]))
      };

      const NUMBERING_VARIANTS = {
        1: { name: 'Modern Minimalist', position: 'top-right', style: 'circle', backgroundColor: '#FFFFFF', textColor: '#1f2937', borderColor: '#e6eef8', borderWidth: 2, fontKey: 'Poppins', fontFallback: 'Arial, sans-serif', fontWeight: '700', paddingRatio: 0.12, shadow: true },
        2: { name: 'Bold Accent', position: 'top-left', style: 'rounded-square', backgroundColor: '#FF6B6B', textColor: '#FFFFFF', borderColor: null, borderWidth: 0, fontKey: 'MontserratAlt', fontFallback: 'Helvetica, sans-serif', fontWeight: '700', paddingRatio: 0.10, shadow: true },
        3: { name: 'Elegant Badge', position: 'bottom-right', style: 'pill', backgroundColor: '#111827', textColor: '#F8FAFC', borderColor: null, borderWidth: 0, fontKey: 'Playfair', fontFallback: 'Georgia, serif', fontWeight: '700', paddingRatio: 0.12, shadow: true },
        4: { name: 'Clean Outline', position: 'bottom-left', style: 'outline-circle', backgroundColor: 'transparent', textColor: '#111827', borderColor: '#111827', borderWidth: 3, fontKey: 'Poppins', fontFallback: 'Arial, sans-serif', fontWeight: '700', paddingRatio: 0.10, shadow: false },
        5: { name: 'Premium Script', position: 'center', style: 'script-badge', backgroundColor: 'linear-gradient(135deg, #FDE68A 0%, #FCA5A5 100%)', textColor: '#111827', borderColor: null, borderWidth: 0, fontKey: 'Abril', fontFallback: 'cursive', fontWeight: '700', paddingRatio: 0.14, shadow: true }
      };

      const allVariantsResults = {};

      for (const [variantKey, numberingStyle] of Object.entries(NUMBERING_VARIANTS)) {
        const variant = parseInt(variantKey);
        const variantImages = [];

        for (let i = 0; i < imageLinks.length; i++) {
          const imgBuffer = await fetchImageBuffer(imageLinks[i]);
          const numberedImagePath = path.join(__dirname, `../uploads/numbered-v${variant}-${Date.now()}-${i + 1}.jpg`);

          const imageInfo = await sharp(imgBuffer).metadata();
          const { width, height } = imageInfo;

          const smaller = Math.min(width, height);
          const badgeSize = Math.round(smaller * 0.30);
          const fontSize = Math.round(Math.max(20, badgeSize * 0.45));
          const padding = Math.round(badgeSize * numberingStyle.paddingRatio);

          let x, y;
          switch (numberingStyle.position) {
            case 'top-right': x = width - badgeSize - padding; y = padding; break;
            case 'top-left': x = padding; y = padding; break;
            case 'bottom-right': x = width - badgeSize - padding; y = height - badgeSize - padding; break;
            case 'bottom-left': x = padding; y = height - badgeSize - padding; break;
            case 'center': x = Math.round((width - badgeSize) / 2); y = Math.round((height - badgeSize) / 2); break;
            default: x = width - badgeSize - padding; y = padding;
          }

          const dataUrl = fonts[numberingStyle.fontKey];
          let fontFaceCss = "";
          const fontFamilyName = numberingStyle.fontKey + "-Custom";
          if (dataUrl) {
            fontFaceCss = `
              @font-face {
                font-family: '${fontFamilyName}';
                src: url('${dataUrl}') format('truetype');
                font-weight: ${numberingStyle.fontWeight || '700'};
                font-style: normal;
              }
            `;
          }

          let badgeSvg;
          const shadowFilter = numberingStyle.shadow ? `
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="rgba(0,0,0,0.22)"/>
              </filter>
            </defs>
          ` : "";

          const stripePattern = `
            <defs>
              <pattern id="stripes" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(25)">
                <rect width="8" height="8" fill="rgba(255,255,255,0.03)"></rect>
                <path d="M0,0 L0,8" stroke="rgba(255,255,255,0.06)" stroke-width="2"></path>
              </pattern>
            </defs>
          `;

          if (numberingStyle.style === "outline-circle") {
            badgeSvg = `
              <svg width="${badgeSize}" height="${badgeSize}" xmlns="http://www.w3.org/2000/svg">
                <style>
                  ${fontFaceCss}
                  .num { font-family: '${dataUrl ? fontFamilyName : numberingStyle.fontFallback}'; font-weight: ${numberingStyle.fontWeight}; }
                </style>
                ${shadowFilter}
                <circle cx="${badgeSize / 2}" cy="${badgeSize / 2}" r="${badgeSize / 2 - padding / 2}" fill="transparent" stroke="${numberingStyle.borderColor}" stroke-width="${numberingStyle.borderWidth}"/>
                <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="num" font-size="${fontSize}" fill="${numberingStyle.textColor}" stroke="${numberingStyle.textColor}" stroke-width="${Math.max(1, Math.round(fontSize * 0.08))}">
                  ${startNumber + i}
                </text>
              </svg>
            `;
          } else if (numberingStyle.style === "script-badge") {
            badgeSvg = `
              <svg width="${badgeSize}" height="${badgeSize}" xmlns="http://www.w3.org/2000/svg">
                <style>
                  ${fontFaceCss}
                  .num { font-family: '${dataUrl ? fontFamilyName : numberingStyle.fontFallback}'; font-weight: ${numberingStyle.fontWeight}; }
                </style>
                ${shadowFilter}
                <defs>
                  <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#FDE68A"/>
                    <stop offset="100%" stop-color="#FCA5A5"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="${badgeSize}" height="${badgeSize}" rx="${badgeSize * 0.18}" ry="${badgeSize * 0.18}" fill="url(#g1)"/>
                ${stripePattern}
                <rect x="0" y="0" width="${badgeSize}" height="${badgeSize}" rx="${badgeSize * 0.18}" ry="${badgeSize * 0.18}" fill="url(#stripes)" opacity="0.2"/>
                <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="num" font-size="${fontSize}" fill="#111827" opacity="0.9" stroke="#ffffff" stroke-width="${Math.max(1, Math.round(fontSize * 0.08))}">
                  ${startNumber + i}
                </text>
                <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="num" font-size="${fontSize}" fill="${numberingStyle.textColor}" >
                  ${startNumber + i}
                </text>
              </svg>
            `;
          } else if (numberingStyle.style === "pill") {
            const rx = Math.round(badgeSize / 2);
            badgeSvg = `
              <svg width="${badgeSize}" height="${Math.round(badgeSize * 0.6)}" xmlns="http://www.w3.org/2000/svg">
                <style>
                  ${fontFaceCss}
                  .num { font-family: '${dataUrl ? fontFamilyName : numberingStyle.fontFallback}'; font-weight: ${numberingStyle.fontWeight}; }
                </style>
                ${shadowFilter}
                <rect x="0" y="0" width="${badgeSize}" height="${Math.round(badgeSize * 0.6)}" rx="${rx}" ry="${rx}" fill="${numberingStyle.backgroundColor}" />
                <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="num" font-size="${Math.round(Math.min(fontSize, badgeSize * 0.35))}" fill="${numberingStyle.textColor}">
                  ${startNumber + i}
                </text>
              </svg>
            `;
          } else {
            const border = numberingStyle.borderColor ? `stroke="${numberingStyle.borderColor}" stroke-width="${numberingStyle.borderWidth}"` : "";
            const rx = numberingStyle.style === "rounded-square" ? Math.round(badgeSize * 0.12) : Math.round(badgeSize / 2);
            badgeSvg = `
              <svg width="${badgeSize}" height="${badgeSize}" xmlns="http://www.w3.org/2000/svg">
                <style>
                  ${fontFaceCss}
                  .num { font-family: '${dataUrl ? fontFamilyName : numberingStyle.fontFallback}'; font-weight: ${numberingStyle.fontWeight}; }
                </style>
                ${shadowFilter}
                <rect x="0" y="0" width="${badgeSize}" height="${badgeSize}" rx="${rx}" ry="${rx}" fill="${numberingStyle.backgroundColor}" ${border}/>
                <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="num" font-size="${fontSize}" fill="${numberingStyle.textColor}" stroke="${numberingStyle.textColor}" stroke-width="${Math.max(1, Math.round(fontSize * 0.06))}">
                  ${startNumber + i}
                </text>
              </svg>
            `;
          }

          await sharp(imgBuffer)
            .composite([{ input: Buffer.from(badgeSvg), top: Math.round(y), left: Math.round(x) }])
            .jpeg()
            .toFile(numberedImagePath);

          variantImages.push(`/uploads/${path.basename(numberedImagePath)}`);
        }

        allVariantsResults[variant] = {
          variantName: numberingStyle.name,
          images: variantImages,
          style: {
            name: numberingStyle.name,
            position: numberingStyle.position,
            style: numberingStyle.style,
            colors: {
              background: numberingStyle.backgroundColor,
              text: numberingStyle.textColor,
              border: numberingStyle.borderColor
            },
            fontHint: numberingStyle.fontKey
          }
        };
      }

      return helper.sendSuccess(res, 200, "All variants generated successfully", {
        totalImages: imageLinks.length,
        totalVariants: Object.keys(NUMBERING_VARIANTS).length,
        variants: allVariantsResults,
        summary: {
          message: `Generated ${imageLinks.length} images in ${Object.keys(NUMBERING_VARIANTS).length} different styles`,
          variants: Object.values(allVariantsResults).map(v => v.variantName)
        }
      });

    } catch (error) {
      console.log(error);
      return helper.sendError(res, 500, error);
    }
  },

  // GET /admin/v1/get_variants
  get_variants: async (req, res) => {
    try {
      const variants = {
        1: { name: 'Modern Minimalist', description: 'Clean white circle with subtle border - perfect for professional content', position: 'top-right', style: 'circle', backgroundColor: '#FFFFFF', textColor: '#2D3748', borderColor: '#E2E8F0', bestFor: 'Professional, clean, minimalist designs' },
        2: { name: 'Bold Accent', description: 'Vibrant coral rounded square - great for attention-grabbing content', position: 'top-left', style: 'rounded-square', backgroundColor: '#FF6B6B', textColor: '#FFFFFF', bestFor: 'Bold, energetic, lifestyle content' },
        3: { name: 'Elegant Badge', description: 'Sophisticated dark pill shape - ideal for premium content', position: 'bottom-right', style: 'pill', backgroundColor: '#4A5568', textColor: '#FFFFFF', bestFor: 'Elegant, sophisticated, premium brands' },
        4: { name: 'Clean Outline', description: 'Transparent circle with dark outline - versatile and modern', position: 'bottom-left', style: 'outline-circle', backgroundColor: 'transparent', textColor: '#2D3748', borderColor: '#2D3748', bestFor: 'Versatile, modern, clean designs' },
        5: { name: 'Premium Script', description: 'Premium script/bold display with gradient — great for luxury and high-engagement pins', position: 'center', style: 'script-badge', backgroundColor: 'linear-gradient(135deg, #FDE68A 0%, #FCA5A5 100%)', textColor: '#111827', bestFor: 'Luxury, premium, high-end content' }
      };

      return helper.sendSuccess(res, 200, "Available numbering variants", {
        variants: variants,
        usage: {
          endpoint: "POST /admin/v1/add_numbering",
          parameters: {
            imageLinks: "Array of image URLs",
            startNumber: "Starting number (default: 1)"
          },
          note: "All 5 variants are generated automatically. Put premium font files in ./fonts to get consistent premium typography across outputs."
        }
      });

    } catch (error) {
      console.log(error);
      return helper.sendError(res, 500, error);
    }
  }

};

module.exports = PinterestController;

