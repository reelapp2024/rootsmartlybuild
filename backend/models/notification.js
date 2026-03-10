const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userFromId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional - can be empty for system notifications
    },
    userToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // If null, it's for all super admins
    },
    isSuperAdminNotification: {
      type: Boolean,
      default: false, // If true, show to all users with isSuper: 1
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'user_registered',
        'project_created',
        'hosting_added',
        'domain_added',
        'project_live',
        'project_failed',
        'blog_published',
        'blog_scheduled',
        'blog_review',
        'form_submission',
        'system'
      ],
      default: 'system'
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // ID of related project, blog, form, etc.
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      required: false,
    }
  },
  {
    timestamps: true, // createdAt and updatedAt
  }
);

// Index for faster queries
notificationSchema.index({ userToId: 1, createdAt: -1 });
notificationSchema.index({ isSuperAdminNotification: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

