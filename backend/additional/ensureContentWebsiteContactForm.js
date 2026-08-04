/**
 * Ensure a default enabled DynamicForm for content websites (projectType 2).
 * Bound to the contact page via contactPageDynamics / ContactFormFunky.
 */

const DynamicForm = require('../models/dynamicForm');
const UserProject = require('../models/userProjects');

const DEFAULT_FIELDS = [
  {
    name: 'name',
    type: 'text',
    label: 'Name',
    required: true,
    placeholder: 'Your name',
    options: [],
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    required: true,
    placeholder: 'you@example.com',
    options: [],
  },
  {
    name: 'message',
    type: 'textarea',
    label: 'Message',
    required: true,
    placeholder: 'How can we help?',
    options: [],
  },
];

/**
 * Create (or reuse) one enabled contact form for the content site.
 * @returns {{ form: object|null, created: boolean, reason?: string }}
 */
async function ensureContentWebsiteContactForm({
  projectId,
  userId,
  projectName = '',
} = {}) {
  if (!projectId || !userId) {
    return { form: null, created: false, reason: 'missing_ids' };
  }

  const existingEnabled = await DynamicForm.findOne({
    projectId,
    isEnabled: true,
  }).lean();
  if (existingEnabled) {
    await UserProject.findByIdAndUpdate(projectId, { isFormExists: 1 });
    return { form: existingEnabled, created: false };
  }

  const anyForm = await DynamicForm.findOne({ projectId }).sort({ createdAt: 1 });
  if (anyForm) {
    await DynamicForm.updateMany({ projectId }, { $set: { isEnabled: false } });
    anyForm.isEnabled = true;
    await anyForm.save();
    await UserProject.findByIdAndUpdate(projectId, { isFormExists: 1 });
    return { form: anyForm.toObject ? anyForm.toObject() : anyForm, created: false };
  }

  const label = String(projectName || 'Contact').trim() || 'Contact';
  const form = await DynamicForm.create({
    projectId,
    userId,
    name: `${label} Contact Form`,
    isEnabled: true,
    fields: DEFAULT_FIELDS,
  });

  await UserProject.findByIdAndUpdate(projectId, { isFormExists: 1 });

  return {
    form: form.toObject ? form.toObject() : form,
    created: true,
  };
}

module.exports = {
  ensureContentWebsiteContactForm,
  DEFAULT_FIELDS,
};
