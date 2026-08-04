/**
 * Ensure a default Author exists for a content website (projectType 2).
 * Uses the shared Author collection (same as business blogs).
 * Stores project.defaultAuthorId for blogs/articles.
 */

const Author = require('../models/authors');
const UserProject = require('../models/userProjects');

function pickBlueprintAuthor(blueprint = {}) {
  const list = Array.isArray(blueprint.authors) ? blueprint.authors : [];
  const first = list[0] || {};
  const name = String(first.name || first.title || '').trim();
  const jobTitle = String(first.role || first.jobTitle || first.title || 'Blogger & Creative Designer').trim();
  const bio = String(first.bio || first.about || '').trim();
  return { name, jobTitle, bio };
}

/**
 * Create (or reuse) the site's default author and link it on the project.
 * @returns {{ author: object, created: boolean }}
 */
async function ensureContentWebsiteAuthor({
  projectId,
  userId,
  blueprint = {},
  nicheName = '',
  projectName = '',
} = {}) {
  if (!projectId || !userId) {
    return { author: null, created: false, reason: 'missing_ids' };
  }

  const project = await UserProject.findById(projectId)
    .select('defaultAuthorId projectName contentBlueprint')
    .lean();
  if (!project) return { author: null, created: false, reason: 'no_project' };

  if (project.defaultAuthorId) {
    const existing = await Author.findById(project.defaultAuthorId).lean();
    if (existing) {
      return { author: existing, created: false };
    }
  }

  const fromBp = pickBlueprintAuthor(blueprint || project.contentBlueprint || {});
  const siteLabel =
    String(nicheName || projectName || project.projectName || 'Content').trim() || 'Content';

  let name = fromBp.name;
  if (!name) {
    // Distinct per site so dedupe-by-name doesn't collide across niches
    name = `${siteLabel} Editor`;
  }

  let author = await Author.findOne({ userId, name, projectId }).lean();
  let created = false;

  if (!author) {
    author = await Author.findOne({
      userId,
      name,
      $or: [{ projectId: null }, { projectId: { $exists: false } }],
    }).lean();
  }

  if (!author) {
    const bio =
      fromBp.bio ||
      `Hey, I'm ${name.split(/\s+/)[0]}, a writer and creative covering ${siteLabel}. I share practical guides, inspiration, and authentic tips for curious readers.`;
    const doc = await Author.create({
      name,
      jobTitle: fromBp.jobTitle || 'Blogger & Creative Designer',
      bio,
      image: '',
      links: [],
      userId,
      projectId,
      isDefault: true,
    });
    author = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    created = true;
  } else if (!author.projectId) {
    await Author.updateOne({ _id: author._id }, { $set: { projectId, isDefault: true } });
    author = { ...author, projectId, isDefault: true };
  }

  await UserProject.findByIdAndUpdate(projectId, {
    $set: { defaultAuthorId: author._id },
  });

  return { author, created };
}

module.exports = {
  ensureContentWebsiteAuthor,
  pickBlueprintAuthor,
};
