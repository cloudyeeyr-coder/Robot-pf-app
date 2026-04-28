import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Bell } from 'lucide-react';
import { Card, CardContent } from '../app/components/ui/card';
import { Button } from '../app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../app/components/ui/tabs';
import {
  getNotificationsByUser,
  markAsRead,
  markAllAsRead,
  getNotificationIcon,
  getRelativeTime,
  type Notification,
} from '../lib/mockNotifications';
import { useAuth } from '../contexts/AuthContext';

const ITEMS_PER_PAGE = 20;

export function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const loadNotifications = () => {
    if (!user) return;
    const userNotifs = getNotificationsByUser(user.id);
    // Sort by created_at DESC
    const sorted = [...userNotifs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setNotifications(sorted);
  };

  useEffect(() => {
    loadNotifications();

    // 30-second polling for real-time updates
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read;
    return true;
  });

  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedNotifications = filteredNotifications.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    loadNotifications();
    navigate(notification.deep_link);
  };

  const handleMarkAllAsRead = () => {
    if (!user) return;
    markAllAsRead(user.id);
    loadNotifications();
  };

  const getTypeColor = (type: Notification['type']): string => {
    switch (type) {
      case 'escrow':
        return 'bg-purple-100 text-purple-800';
      case 'as':
        return 'bg-red-100 text-red-800';
      case 'badge':
        return 'bg-yellow-100 text-yellow-800';
      case 'proposal':
        return 'bg-indigo-100 text-indigo-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">알림</h1>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                모두 읽음 처리
              </Button>
            )}
          </div>
          <p className="text-gray-600">
            미읽음 {unreadCount}건 · 전체 {notifications.length}건
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v: any) => {
          setActiveTab(v);
          setCurrentPage(1); // Reset to page 1 when changing tabs
        }}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">전체 ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">미읽음만 ({unreadCount})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {/* Notification List */}
            {paginatedNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {activeTab === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === 'unread'
                      ? '새로운 알림이 도착하면 여기에 표시됩니다.'
                      : '아직 받은 알림이 없습니다.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {paginatedNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      !notification.is_read ? 'border-blue-200 bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Unread dot */}
                        {!notification.is_read && (
                          <div className="flex-shrink-0 mt-1">
                            <div className="h-2 w-2 bg-blue-600 rounded-full" />
                          </div>
                        )}

                        {/* Icon */}
                        <div className="flex-shrink-0 text-2xl">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3
                              className={`${
                                !notification.is_read ? 'font-bold' : 'font-semibold'
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <span
                              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getTypeColor(
                                notification.type
                              )}`}
                            >
                              {notification.type === 'escrow' && '에스크로'}
                              {notification.type === 'as' && 'AS'}
                              {notification.type === 'badge' && '뱃지'}
                              {notification.type === 'proposal' && '제안'}
                              {notification.type === 'system' && '시스템'}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{notification.body}</p>
                          <p className="text-sm text-gray-500">
                            {getRelativeTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  이전
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  다음
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
