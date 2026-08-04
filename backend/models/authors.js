// models/author.js
const mongoose = require('mongoose');

const AuthorSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        jobTitle: { type: String, trim: true }, // Add job title for author
        bio: { type: String, trim: true }, // Add a short bio for the author
        image: { type: String, trim: true }, // Add the author's image URL (e.g. https://cdn.example.com/img.jpg)
        links: [{ // Add the author's social links (e.g. LinkedIn, personal blog)
            label: { type: String, required: true }, // Label of the link, e.g. "LinkedIn"
            url: { type: String, required: true },   // URL of the link
        }],
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        /** Content website linkage (projectType 2). Business blogs may leave null. */
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'userProjects',
            required: false,
            default: null,
            index: true,
        },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true } // optional: createdAt/updatedAt
);

AuthorSchema.index({ userId: 1, name: 1, projectId: 1 });

module.exports = mongoose.model('Author', AuthorSchema);
