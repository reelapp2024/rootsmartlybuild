import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { httpFile } from "../../config.js";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Bell, BellOff, Check, CheckCheck, Clock, User as UserIcon } from "lucide-react";

interface Notification {
  _id: string;
  userFromId?: {
    _id: string;
    username: string;
    email: string;
  };
  userToId?: string;
  isSuperAdminNotification: boolean;
  message: string;
  type: string;
  relatedId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function NotificationsManagement() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [currentPage]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No authentication token found");
        navigate("/login");
        return;
      }

      const res = await httpFile.post(
        "/fetchNotifications",
        { page: currentPage, limit },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) {
        localStorage.clear();
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (res.status === 200 && res.data?.data) {
        setNotifications(res.data.data.notifications || []);
        setTotal(res.data.data.meta?.total || 0);
        setTotalPages(res.data.data.meta?.pages || 1);
      }
    } catch (err: any) {
      // Silently handle 404 - API endpoint might not exist yet
      if (err.response?.status === 404) {
        console.warn("Notifications endpoint not found (404) - feature may not be implemented yet");
        setNotifications([]);
        setTotal(0);
        setTotalPages(1);
      } else {
        console.error("Error fetching notifications:", err);
        toast.error(err.response?.data?.message || "Failed to fetch notifications");
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.post(
        "/markNotificationAsRead",
        { notificationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        toast.success("Notification marked as read");
        fetchNotifications();
      }
    } catch (err: any) {
      console.error("Error marking notification as read:", err);
      toast.error(err.response?.data?.message || "Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.post(
        "/markAllNotificationsAsRead",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        toast.success("All notifications marked as read");
        fetchNotifications();
      }
    } catch (err: any) {
      console.error("Error marking all as read:", err);
      toast.error(err.response?.data?.message || "Failed to mark all as read");
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-10 w-10";
    switch (type) {
      case 'user_registered':
        return <UserIcon className={iconClass} />;
      case 'project_created':
      case 'project_live':
        return <Bell className={iconClass} />;
      case 'project_failed':
        return <BellOff className={iconClass} />;
      case 'form_submission':
        return <Check className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'user_registered':
        return 'from-blue-500 to-blue-600';
      case 'project_created':
        return 'from-green-500 to-green-600';
      case 'project_live':
        return 'from-emerald-500 to-emerald-600';
      case 'project_failed':
        return 'from-red-500 to-red-600';
      case 'hosting_added':
        return 'from-purple-500 to-purple-600';
      case 'domain_added':
        return 'from-indigo-500 to-indigo-600';
      case 'blog_published':
        return 'from-orange-500 to-orange-600';
      case 'blog_scheduled':
        return 'from-yellow-500 to-yellow-600';
      case 'blog_review':
        return 'from-pink-500 to-pink-600';
      case 'form_submission':
        return 'from-teal-500 to-teal-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 font-poppins">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                Notifications
              </h1>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Stay updated with your activity
              </p>
            </div>
          </div>
        </div>
        <Button onClick={markAllAsRead} variant="outline">
          <CheckCheck className="h-4 w-4 mr-2" />
          Mark All as Read
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <BellOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {notifications.map((notification) => (
              <Card
                key={notification._id}
                className={`${
                  notification.isRead ? 'bg-white' : 'bg-blue-50 border-l-4 border-l-blue-600'
                } transition-all hover:shadow-md`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${getNotificationColor(notification.type)} text-white flex-shrink-0`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatRelativeTime(notification.createdAt)}
                        </div>
                        {notification.userFromId && (
                          <div className="flex items-center text-xs text-gray-500">
                            <UserIcon className="h-3 w-3 mr-1" />
                            {notification.userFromId.username || notification.userFromId.email}
                          </div>
                        )}
                        {notification.isSuperAdminNotification && (
                          <Badge variant="secondary" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Mark as Read Button */}
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notification._id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => setCurrentPage(i + 1)}
                          isActive={currentPage === i + 1}
                          className="cursor-pointer"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

