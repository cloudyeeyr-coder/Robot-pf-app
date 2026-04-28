import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  getNotificationsByUser,
  getUnreadCount,
  markAsRead,
  getNotificationIcon,
  getRelativeTime,
  type Notification,
} from '../../../lib/mockNotifications';

interface NotificationDropdownProps {
  userId: string;
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = () => {
    const userNotifs = getNotificationsByUser(userId);
    // Sort by created_at DESC, take max 10 for preview
    const sorted = [...userNotifs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setNotifications(sorted.slice(0, 10));
    setUnreadCount(getUnreadCount(userId));
  };

  useEffect(() => {
    loadNotifications();

    // 30-second polling for real-time updates
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    loadNotifications();
    navigate(notification.deep_link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unreadCount > 0 ? `알림 ${unreadCount}건` : '알림'}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              aria-live="polite"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0" role="menu">
        {/* Header */}
        <div className="p-4 border-b">
          <h3 className="font-semibold">알림</h3>
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>알림이 없습니다</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  role="menuitem"
                  className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    {/* Unread dot */}
                    {!notification.is_read && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-2 w-2 bg-blue-600 rounded-full" />
                      </div>
                    )}

                    {/* Icon */}
                    <div className="flex-shrink-0 text-xl">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm mb-1 ${
                          !notification.is_read ? 'font-semibold' : 'font-medium'
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t bg-gray-50">
            <Link
              to="/notifications"
              className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
            >
              전체 알림 보기
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
