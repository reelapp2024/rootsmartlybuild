const mongoose = require('mongoose');
// Assuming the DynamicForm model and helper are imported globally or in this scope
const DynamicForm = require('../models/dynamicForm');
const UserProject = require('../models/userProjects');
const Notification = require('../models/notification');
const helper = require("../additional/addon");
const fs = require('fs');
const { Readable } = require('stream');
const DynamicFormData = require('../models/dynamicFormData'); // path adjust if needed


const DynamicFormController = {


    create_dynamic_form: async (req, res) => {
        try {
            const userId = req.user.userId;
            let { projectId, name, fields } = req.body;

            console.log(req.body,"req.body")

            if (typeof fields === 'string') {

                fields = JSON.parse(fields);
            }

            // 1. Basic Validation
            if (!projectId || !mongoose.isValidObjectId(projectId)) {
                return helper.sendError(res, 400, 'Valid Project ID is required.');
            }
            if (!fields || !Array.isArray(fields) || fields.length === 0) {
                return helper.sendError(res, 400, 'Form fields array is required and must not be empty.');
            }

            // 2. Check for existence (Optional: If you want to prevent creation if another form with the same name exists)
            // const existing = await DynamicForm.findOne({ userId, projectId, name: name?.trim() });
            // if (existing) {
            //     return helper.sendError(res, 400, 'A form with this name already exists for the project.');
            // }

            // 3. Auto-generate field names from labels
            const processedFields = fields.map(field => {
                // Auto-generate name from label if not provided or empty
                if (!field.name || field.name.trim() === '') {
                    field.name = field.label
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
                        .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
                }
                return field;
            });

            // 4. Disable all existing forms for this project (since we only allow one active form)
            await DynamicForm.updateMany(
                { projectId, userId, isEnabled: true },
                { $set: { isEnabled: false } }
            );

            // 5. Create the new form (always enabled by default)
            const newForm = new DynamicForm({
                projectId,
                userId,
                name: name ? name.trim() : `Form-${Date.now()}`,
                fields: processedFields,
                isEnabled: true, // Always enabled by default
            });

            await newForm.save();

            // 5. Update UserProject isFormExists to 1
            await UserProject.findByIdAndUpdate(projectId, { isFormExists: 1 });

            return helper.sendSuccess(res, 201, 'Dynamic Form created successfully.', newForm);

        } catch (error) {
            console.error('Error creating dynamic form:', error);
            // Mongoose validation errors often come with a 'name: ValidationError'
            const message = error.name === 'ValidationError' ? 'Invalid field structure provided.' : error.message;
            return helper.sendError(res, 500, message || 'Failed to create dynamic form.');
        }
    },



    edit_dynamic_form: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { formId } = req.body;
            let { name, fields } = req.body;

            console.log(req.body,"req.body")

            // Parse fields if stringified
            if (typeof fields === 'string') {
                try {
                    fields = JSON.parse(fields);
                } catch (e) {
                    return helper.sendError(res, 400, 'Invalid JSON format for fields.');
                }
            }

            // 1. Basic validation
            if (!formId || !mongoose.isValidObjectId(formId)) {
                return helper.sendError(res, 400, 'Valid Form ID is required.');
            }

            // 2. Find form
            const existingForm = await DynamicForm.findOne({ _id: formId, userId });
            if (!existingForm) {
                return helper.sendError(res, 404, 'Form not found or access denied.');
            }

            // 3. Prepare updates
            if (name) {
                existingForm.name = name.trim();
            }

            if (fields && Array.isArray(fields)) {
                // Filter out empty fields (fields with no label)
                const validFields = fields.filter(f => 
                    f.label && f.label.trim() !== ''
                );

                // Replace the entire fields array with the new one
                // This handles both updates to existing fields and addition of new fields
                existingForm.fields = validFields.map(field => {
                    // Auto-generate name from label if not provided or empty
                    if (!field.name || field.name.trim() === '') {
                        field.name = field.label
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
                            .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
                    }

                    // Keep the _id if it exists (for existing fields), otherwise Mongoose will generate a new one
                    if (field._id && mongoose.isValidObjectId(field._id)) {
                        return field;
                    } else {
                        // Remove _id for new fields so Mongoose generates a new one
                        const { _id, ...fieldWithoutId } = field;
                        return fieldWithoutId;
                    }
                });
            }

            // 4. Save updated form
            const updatedForm = await existingForm.save();

            return helper.sendSuccess(res, 200, 'Dynamic Form updated successfully.', updatedForm);

        } catch (error) {
            console.error('Error editing dynamic form:', error);
            const message =
                error.name === 'ValidationError'
                    ? 'Invalid field structure provided.'
                    : error.message;
            return helper.sendError(res, 500, message || 'Failed to update dynamic form.');
        }
    },



    delete_dynamic_form: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { formId } = req.body;

            // 1. Basic Validation
            if (!formId || !mongoose.isValidObjectId(formId)) {
                return helper.sendError(res, 400, 'Valid Form ID is required.');
            }

            // 2. Find and delete the form, ensuring it belongs to the user
            const result = await DynamicForm.findOneAndDelete({ _id: formId, userId });

            if (!result) {
                return helper.sendError(res, 404, 'Form not found or access denied.');
            }

            // 3. Check if any other ENABLED forms exist for this project
            const projectId = result.projectId;
            const anyEnabledForms = await DynamicForm.countDocuments({ 
                projectId, 
                userId,
                isEnabled: true 
            });

            // 4. Update UserProject isFormExists based on whether any enabled forms exist
            await UserProject.findByIdAndUpdate(
                projectId, 
                { isFormExists: anyEnabledForms > 0 ? 1 : 0 }
            );

            // NOTE: You may want to also delete related FormSubmission documents here
            // await DynamicFormData.deleteMany({ formId }); 

            return helper.sendSuccess(res, 200, 'Dynamic Form deleted successfully.');

        } catch (error) {
            console.error('Error deleting dynamic form:', error);
            return helper.sendError(res, 500, error.message || 'Failed to delete dynamic form.');
        }
    },



    enable_disable_form: async (req, res) => {
        try {
            const userId = req.user.userId;
            let { formId, isEnabled } = req.body;

            console.log('enable_disable_form - Request body:', req.body);
            console.log('enable_disable_form - formId:', formId, 'type:', typeof formId);
            console.log('enable_disable_form - isEnabled:', isEnabled, 'type:', typeof isEnabled);

            // 1. Validation
            if (!formId || !mongoose.isValidObjectId(formId)) {
                return helper.sendError(res, 400, 'Valid Form ID is required.');
            }

            // Convert string to boolean if needed
            if (typeof isEnabled === 'string') {
                isEnabled = isEnabled === 'true';
            }

            if (typeof isEnabled !== 'boolean') {
                console.log('Invalid isEnabled type:', typeof isEnabled, isEnabled);
                return helper.sendError(res, 400, `isEnabled must be a boolean value. Received: ${typeof isEnabled} - ${JSON.stringify(isEnabled)}`);
            }

            // 2. Find the target form
            const targetForm = await DynamicForm.findOne({ _id: formId, userId });

            if (!targetForm) {
                return helper.sendError(res, 404, 'Form not found or access denied.');
            }

            // 3. Simple logic
            if (isEnabled === true) {
                // Enable this form and disable all others in the project
                await DynamicForm.updateMany(
                    { projectId: targetForm.projectId, userId },
                    { $set: { isEnabled: false } }
                );
                
                // Enable the target form
                await DynamicForm.findByIdAndUpdate(formId, { isEnabled: true });
                
                // Update UserProject isFormExists to 1 (since we have an enabled form)
                await UserProject.findByIdAndUpdate(targetForm.projectId, { isFormExists: 1 });
                
                return helper.sendSuccess(res, 200, 'Form enabled successfully. Other forms disabled.');
            } else {
                // Disable this form
                await DynamicForm.findByIdAndUpdate(formId, { isEnabled: false });
                
                // Check if any other enabled forms exist for this project
                const anyEnabledForms = await DynamicForm.countDocuments({
                    projectId: targetForm.projectId,
                    userId,
                    isEnabled: true
                });
                
                // Update UserProject isFormExists based on whether any enabled forms exist
                await UserProject.findByIdAndUpdate(
                    targetForm.projectId,
                    { isFormExists: anyEnabledForms > 0 ? 1 : 0 }
                );
                
                return helper.sendSuccess(res, 200, 'Form disabled successfully.');
            }

        } catch (error) {
            console.error('Error enabling/disabling form:', error);
            return helper.sendError(res, 500, error.message || 'Failed to update form status.');
        }
    },



    fetch_dynamic_forms: async (req, res) => {
        try {
            const { projectId } = req.body;

            // 1. Validation
            if (!projectId || !mongoose.isValidObjectId(projectId)) {
                return helper.sendError(res, 400, 'Valid Project ID is required.');
            }

            // Prefer the enabled form for live websites; fall back to most recent.
            let forms = await DynamicForm.find({ projectId, isEnabled: true })
                .sort({ updatedAt: -1, createdAt: -1 })
                .limit(1)
                .exec();

            if (!forms || forms.length === 0) {
                forms = await DynamicForm.find({ projectId })
                    .sort({ updatedAt: -1, createdAt: -1 })
                    .limit(1)
                    .exec();
            }

            if (!forms || forms.length === 0) {
                // Return 200 with empty array if no forms exist, it's not strictly an error
                return helper.sendSuccess(res, 200, 'No dynamic forms found for this project.', []);
            }

            return helper.sendSuccess(res, 200, 'Dynamic Forms fetched successfully.', forms);

        } catch (error) {
            console.error('Error fetching dynamic forms:', error);
            return helper.sendError(res, 500, error.message || 'Failed to fetch dynamic forms.');
        }
    },

    // Admin API to fetch all forms for a project
    fetch_all_forms_admin: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { projectId } = req.body;

            // 1. Validation
            if (!projectId || !mongoose.isValidObjectId(projectId)) {
                return helper.sendError(res, 400, 'Valid Project ID is required.');
            }

            // 2. Find all forms belonging to the user and project (for admin panel)
            const forms = await DynamicForm.find({ userId, projectId })
                .sort({ updatedAt: -1, createdAt: -1 }) // Sort by most recently updated first
                .exec();

            if (!forms || forms.length === 0) {
                // Return 200 with empty array if no forms exist
                return helper.sendSuccess(res, 200, 'No dynamic forms found for this project.', []);
            }

            return helper.sendSuccess(res, 200, 'Dynamic Forms fetched successfully.', forms);

        } catch (error) {
            console.error('Error fetching forms for admin:', error);
            return helper.sendError(res, 500, error.message || 'Failed to fetch dynamic forms.');
        }
    },


    //FORM DATA APIS ARE BELLOW

    /**
 * Submit form data (simple)
 * - req.body must include formId and other keys where key = field.name
 * - req.files may include files with keys = field.name (for file type fields)
 */
    submit_form_data: async (req, res) => {
        try {
            const { formId, ...restBody } = req.body || {};

            if (!formId || !mongoose.isValidObjectId(formId)) {
                return helper.sendError(res, 400, 'Valid formId is required.');
            }

            // Load form definition
            const form = await DynamicForm.findById(formId).lean();
            if (!form) {
                return helper.sendError(res, 404, 'Form not found.');
            }

            const submittedData = {};
            const errors = [];

            // req.files may be undefined or an object of files keyed by field name
            const filesObj = req.files || {};

            // Validate required fields and collect values
            for (const field of (form.fields || [])) {
                const key = field.name;
                const isRequired = !!field.required;
                const fieldType = field.type;

                const hasBodyValue = Object.prototype.hasOwnProperty.call(restBody, key);
                const hasFile = Object.prototype.hasOwnProperty.call(filesObj, key);

                // required check
                if (isRequired) {
                    if (fieldType === 'file') {
                        if (!hasFile) {
                            errors.push({ field: key, message: 'This file field is required.' });
                            continue;
                        }
                    } else {
                        const val = restBody[key];
                        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
                            errors.push({ field: key, message: 'This field is required.' });
                            continue;
                        }
                    }
                }

                // If file field and file provided => upload and store URL
                if (fieldType === 'file') {
                    if (hasFile) {
                        // support single file or array (pick single)
                        const file = Array.isArray(filesObj[key]) ? filesObj[key][0] : filesObj[key];

                        // get input stream or buffer similar to your example
                        let input;
                        if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
                            input = fs.createReadStream(file.tempFilePath);
                        } else if (file.data) {
                            input = Readable.from(file.data);
                        } else {
                            errors.push({ field: key, message: 'Invalid file upload.' });
                            continue;
                        }

                        const uploadFileObj = {
                            name: file.name || `${Date.now()}`,
                            mimetype: file.mimetype || 'application/octet-stream',
                            size: file.size || (file.data ? file.data.length : undefined),
                            stream: input
                        };

                        const folderPath = `public/files/forms/${formId}`;
                        const savedName = await helper.uploadFile(uploadFileObj, folderPath, null);
                        const url = `/files/forms/${formId}/${savedName}`;
                        submittedData[key] = url;
                    }
                    // if no file provided and not required, skip (no key in submittedData)
                    continue;
                }

                // Non-file fields: take value from body if present
                if (hasBodyValue) {
                    let value = restBody[key];

                    // Basic type checks (simple)
                    if (fieldType === 'number' && value !== '') {
                        const n = Number(value);
                        if (Number.isNaN(n)) {
                            errors.push({ field: key, message: 'Value must be a number.' });
                            continue;
                        }
                        value = n;
                    }

                    if (fieldType === 'email' && value) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(String(value))) {
                            errors.push({ field: key, message: 'Invalid email address.' });
                            continue;
                        }
                    }

                    // store raw value (trim strings)
                    if (typeof value === 'string') value = value.trim();
                    submittedData[key] = value;
                }
                // if no body value and not required => skip storing
            }

            if (errors.length > 0) {
                console.log(errors)
                return helper.sendError(res, 400, 'Validation failed.',  errors );
            }

            // Save submission
            const submission = new DynamicFormData({
                formId,
                projectId: form.projectId,
                submittedData
            });

            await submission.save();

            // Create notification for project owner
            try {
                const project = await UserProject.findById(form.projectId).select('userId projectName').lean();
                if (project && project.userId) {
                    await Notification.create({
                        userToId: project.userId,
                        message: `New form submission received for project "${project.projectName}"`,
                        type: 'form_submission',
                        relatedId: form.projectId,
                        isSuperAdminNotification: false
                    });
                }
            } catch (notifError) {
                console.error('Error creating form submission notification:', notifError);
                // Don't fail the request if notification fails
            }

            return helper.sendSuccess(res, 201, 'Form submitted successfully.', submission);
        } catch (err) {
            console.error('submit_form_data_simple error:', err);
            return helper.sendError(res, 500, err?.message || 'Failed to submit form data.');
        }
    },


    /**
     * Fetch form submissions (simple)
     * - req.body: { formId, page, limit }
     */
    fetch_form_submissions: async (req, res) => {
        try {
            const { formId } = req.body;
            let { page = 1, limit = 20 } = req.body;

            if (!formId || !mongoose.isValidObjectId(formId)) {
                return helper.sendError(res, 400, 'Valid formId is required.');
            }

            page = parseInt(page, 10) || 1;
            limit = parseInt(limit, 10) || 20;

            // Ensure form exists
            const form = await DynamicForm.findById(formId).lean();
            if (!form) {
                return helper.sendError(res, 404, 'Form not found.');
            }

            const query = { formId };
            const total = await DynamicFormData.countDocuments(query);
            const submissions = await DynamicFormData.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            return helper.sendSuccess(res, 200, 'Submissions fetched successfully.', {
                meta: { total, page, limit, pages: Math.ceil(total / limit) },
                submissions
            });
        } catch (err) {
            console.error('fetch_form_submissions_simple error:', err);
            return helper.sendError(res, 500, err?.message || 'Failed to fetch submissions.');
        }
    },

};

module.exports = DynamicFormController;
