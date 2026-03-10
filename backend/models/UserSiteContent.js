const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the schema for user-generated pages (Country, State, City, and general pages)
const userSiteContentSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true, // Removes extra spaces
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the user who created the page
            required: true,
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project', // Reference to the associated project
            required: true,
        },
        
        pageType: {
            type: String,
            enum: ['country', 'state', 'city','pincode' ,'home', 'about', 'contact', 'services', 'custom'], // Extend to include other page types
            required: true,
        },

        parentId: { // NEW FIELD
            type: mongoose.Schema.Types.ObjectId, // Reference to parent (Country -> State, State -> City)
            ref: 'UserSiteContent', // Points to the same collection for hierarchical relationship
            default: null, // Null for top-level pages like countries
        },
        
        content: [
            {
                contentNumber: {
                    type: Number, // Order of the content (1, 2, 3,...)
                    required: true,
                },
                contentType: {
                    type: String, // Example: 'header', 'paragraph', 'image', 'footer', etc.
                    required: true,
                    enum: ['header','category_divs' ,'paragraph', 'image', 'footer', 'list', 'video', 'other'], // Adding more types like 'video', 'list', etc.
                },
                content: {
                    type: Schema.Types.Mixed, // The actual content (can be text or URL for images)
                    required: true,
                },
            }
        ],
        createdAt: {
            type: Date,
            default: Date.now, // Automatically set to current date when created
        },
        updatedAt: {
            type: Date,
            default: Date.now, // Automatically set to current date when created
        },
    },
    {
        timestamps: true, // Automatically manages createdAt and updatedAt
    }
);

// Create the model from the schema
const UserSiteContent = mongoose.model('UserSiteContent', userSiteContentSchema);

module.exports = UserSiteContent;
