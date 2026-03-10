const mongoose = require('mongoose');
const Notification = require('../models/notification');
const User = require('../models/users');
const helper = require("../additional/addon");

const NotificationController = {

  // Create a notification
  createNotification: async (req, res) => {
    try {
      const { userFromId, userToId, isSuperAdminNotification, message, type, relatedId } = req.body;

      // Validation
      if (!message || message.trim() === '') {
        return helper.sendError(res, 400, 'Notification message is required.');
      }

      // If not for super admins, userToId is required
      if (!isSuperAdminNotification && (!userToId || !mongoose.isValidObjectId(userToId))) {
        return helper.sendError(res, 400, 'Valid userToId is required for user notifications.');
      }

      const notification = new Notification({
        userFromId: userFromId || null,
        userToId: userToId || null,
        isSuperAdminNotification: isSuperAdminNotification || false,
        message: message.trim(),
        type: type || 'system',
        relatedId: relatedId || null,
      });

      await notification.save();

      return helper.sendSuccess(res, 201, 'Notification created successfully.', notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      return helper.sendError(res, 500, error.message || 'Failed to create notification.');
    }
  },

  // Fetch notifications for a user
  fetchNotifications: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.body;

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;

      // Check if user is super admin
      const user = await User.findById(userId).select('isSuper').lean();
      const isSuper = user?.isSuper === 1;

      // Build query
      let query = {};
      if (isSuper) {
        // Super admin: show super admin notifications OR notifications to this specific user
        query = {
          $or: [
            { isSuperAdminNotification: true },
            { userToId: userId }
          ]
        };
      } else {
        // Regular user: only their own notifications
        query = { userToId: userId };
      }

      const total = await Notification.countDocuments(query);
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('userFromId', 'username email')
        .lean();

      return helper.sendSuccess(res, 200, 'Notifications fetched successfully.', {
        notifications,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return helper.sendError(res, 500, error.message || 'Failed to fetch notifications.');
    }
  },

  // Fetch latest N notifications (for header bell)
  fetchLatestNotifications: async (req, res) => {
    try {
      const userId = req.user.userId;
      const limit = 10; // Always fetch latest 10

      // Check if user is super admin
      const user = await User.findById(userId).select('isSuper').lean();
      const isSuper = user?.isSuper === 1;

      // Build query
      let query = {};
      if (isSuper) {
        query = {
          $or: [
            { isSuperAdminNotification: true },
            { userToId: userId }
          ]
        };
      } else {
        query = { userToId: userId };
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userFromId', 'username email')
        .lean();

      const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

      return helper.sendSuccess(res, 200, 'Latest notifications fetched successfully.', {
        notifications,
        unreadCount
      });
    } catch (error) {
      console.error('Error fetching latest notifications:', error);
      return helper.sendError(res, 500, error.message || 'Failed to fetch notifications.');
    }
  },

  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { notificationId } = req.body;

      if (!notificationId || !mongoose.isValidObjectId(notificationId)) {
        return helper.sendError(res, 400, 'Valid notification ID is required.');
      }

      // Check if user is super admin
      const user = await User.findById(userId).select('isSuper').lean();
      const isSuper = user?.isSuper === 1;

      // Build query to ensure user has access to this notification
      let query = { _id: notificationId };
      if (isSuper) {
        query = {
          _id: notificationId,
          $or: [
            { isSuperAdminNotification: true },
            { userToId: userId }
          ]
        };
      } else {
        query = { _id: notificationId, userToId: userId };
      }

      const notification = await Notification.findOneAndUpdate(
        query,
        { 
          isRead: true,
          readAt: new Date()
        },
        { new: true }
      );

      if (!notification) {
        return helper.sendError(res, 404, 'Notification not found or access denied.');
      }

      return helper.sendSuccess(res, 200, 'Notification marked as read.', notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return helper.sendError(res, 500, error.message || 'Failed to mark notification as read.');
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.userId;

      // Check if user is super admin
      const user = await User.findById(userId).select('isSuper').lean();
      const isSuper = user?.isSuper === 1;

      // Build query
      let query = {};
      if (isSuper) {
        query = {
          $or: [
            { isSuperAdminNotification: true },
            { userToId: userId }
          ],
          isRead: false
        };
      } else {
        query = { userToId: userId, isRead: false };
      }

      const result = await Notification.updateMany(
        query,
        { 
          isRead: true,
          readAt: new Date()
        }
      );

      return helper.sendSuccess(res, 200, 'All notifications marked as read.', {
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return helper.sendError(res, 500, error.message || 'Failed to mark notifications as read.');
    }
  },

  // Helper function to create notification (can be called from other controllers)
  createNotificationHelper: async (data) => {
    try {
      const { userFromId, userToId, isSuperAdminNotification, message, type, relatedId } = data;

      if (!message || message.trim() === '') {
        console.error('Notification message is required');
        return null;
      }

      const notification = new Notification({
        userFromId: userFromId || null,
        userToId: userToId || null,
        isSuperAdminNotification: isSuperAdminNotification || false,
        message: message.trim(),
        type: type || 'system',
        relatedId: relatedId || null,
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification (helper):', error);
      return null;
    }
  }

};

module.exports = NotificationController;

