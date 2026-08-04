/**
 * Enqueue AI blog generation for starter cluster keywords on content websites.
 * Uses the same Redis/Bull aiblogsQueue as the admin Blog Posts AI flow.
 */

const ProjectKeywords = require('../models/projectKeywords');
const UserProject = require('../models/userProjects');
const aiblogsQueue = require('../queue/aiblogsQueue');
const slugify = require('./slugify');
const {
  startBatch,
  getDefaultParallelWorkers,
} = require('../services/aiBlogGenerationProgress');

const STARTER_BLOG_LIMIT = Math.max(
  3,
  Math.min(8, Number(process.env.CONTENT_STARTER_BLOG_LIMIT || 5) || 5)
);

function inferBlogType(title = '') {
  const t = String(title || '').toLowerCase();
  if (/\bbest\b/.test(t)) return 'best';
  if (/\bvs\.?\b|versus|compared|comparison/.test(t)) return 'comparison';
  if (/^what\b|\bwhat is\b|\bwhat are\b|\bwhat'?s\b/.test(t)) return 'what';
  return 'how';
}

/**
 * Queue full AI articles for clustered starter intents (typically 4–5).
 * @returns {{ queued: boolean, count: number, jobIds: string[], reason?: string }}
 */
async function enqueueContentWebsiteStarterBlogs({
  projectId,
  userId,
  authorId,
  limit = STARTER_BLOG_LIMIT,
} = {}) {
  if (!projectId || !userId) {
    return { queued: false, count: 0, jobIds: [], reason: 'missing_ids' };
  }
  if (!authorId) {
    return { queued: false, count: 0, jobIds: [], reason: 'missing_author' };
  }

  const keywords = await ProjectKeywords.find({
    projectId,
    status: 'active',
    clusterId: { $ne: null },
    articleCreated: { $ne: true },
  })
    .sort({ createdAt: 1 })
    .limit(Math.max(1, Number(limit) || STARTER_BLOG_LIMIT))
    .lean();

  if (!keywords.length) {
    return { queued: false, count: 0, jobIds: [], reason: 'no_cluster_keywords' };
  }

  const project = await UserProject.findById(projectId).select('userId').lean();
  const blogOwnerUserId = String(project?.userId || userId);
  const workers = getDefaultParallelWorkers();
  const jobs = [];

  for (const kw of keywords) {
    const title = String(kw.primaryKeyword || '').trim();
    if (!title) continue;

    const job = await aiblogsQueue.add({
      userId: blogOwnerUserId,
      actorUserId: String(userId),
      projectId: String(projectId),
      type: inferBlogType(title),
      authorId: String(authorId),
      status: 1,
      title,
      slug: slugify(title),
      isSchedule: false,
      scheduleTime: null,
      scheduleKey: null,
      locations: [],
      seoMode: 1,
      version: 2,
      projectKeywordId: String(kw._id),
      source: 'content_website_starter',
    });
    jobs.push({ job, title, keywordId: String(kw._id) });
  }

  if (!jobs.length) {
    return { queued: false, count: 0, jobIds: [], reason: 'no_valid_titles' };
  }

  const jobIds = jobs.map((j) => String(j.job.id));
  startBatch(String(projectId), {
    total: jobs.length,
    parallelWorkers: workers,
    jobIds,
    jobsMeta: jobs.map((j) => ({ title: j.title })),
    message: `Queued ${jobs.length} starter article(s) · ${workers} parallel workers`,
  });

  console.log('[enqueueContentWebsiteStarterBlogs]', {
    projectId: String(projectId),
    count: jobs.length,
    jobIds,
  });

  return {
    queued: true,
    count: jobs.length,
    jobIds,
    titles: jobs.map((j) => j.title),
  };
}

module.exports = {
  enqueueContentWebsiteStarterBlogs,
  inferBlogType,
  STARTER_BLOG_LIMIT,
};
