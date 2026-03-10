const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',  // reference to the reviewer (User collection)
            required: true
        },

        blog: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Blog',  // reference to the blog being reviewed
            required: true
        },

        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },

        reviewText: {
            type: String,
            trim: true
        },

        verified: {
            type: Boolean,
            default: false  // can sync from User.emailVerified at creation
        },

        status: { type: Number, enum: [0, 1, 2], default: 0 }, // 0=pending,1=approved,2=rejected


        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'   // users who liked this review
            }
        ]
    },
    { timestamps: true } // adds createdAt and updatedAt
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;