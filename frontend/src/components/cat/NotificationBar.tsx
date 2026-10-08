"use client";

import { useState } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Bell, X, Check, AlertCircle, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { NotificationType } from "@/contexts/NotificationContext";

const ICONS: Record<NotificationType, any> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const COLORS: Record<NotificationType, string> = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
};

export function NotificationBar() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        title="Notifications"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#D21245] text-white text-xs">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute right-0 top-full z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[500px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-3 sm:px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-[#00264D]" />
                <span className="font-semibold text-sm text-[#00264D]">Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-slate-600 hover:text-[#00264D]"
                  >
                    <Check className="size-3 mr-1" />
                    Mark all
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Bell className="size-8 mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => {
                    const Icon = ICONS[notification.type];
                    return (
                      <div
                        key={notification.id}
                        className={`px-3 sm:px-4 py-3 transition-colors ${
                          !notification.read ? "bg-slate-50" : "bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 rounded-full p-1.5 ${COLORS[notification.type]}`}
                          >
                            <Icon className="size-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-slate-900">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="mt-1 size-2 shrink-0 rounded-full bg-[#D21245]" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {notification.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeNotification(notification.id)}
                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-slate-200 px-3 sm:px-4 py-2 bg-slate-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    notifications.forEach((n) => removeNotification(n.id));
                  }}
                  className="w-full text-xs text-slate-600 hover:text-slate-900"
                >
                  Clear all notifications
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
