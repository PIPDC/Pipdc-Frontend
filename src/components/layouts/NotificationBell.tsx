import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNotifications } from '../../hooks/queries';
import { useMarkNotificationRead } from '../../hooks/mutations';
import type { Notification } from '../../types/notification';

/**
 * Admin notification bell.
 *
 * The only producer today is the development-project completion prompt, but the
 * feed is the existing generic notification channel rather than a
 * development-specific badge. The unread dot is driven by the server's
 * `isRead` values instead of being decorative, and opening an item marks it read
 * and navigates to wherever the backend said the action lives.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const navigate = useNavigate();

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close on outside click so the panel does not sit open over the page.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const openNotification = (notification: Notification) => {
    if (!notification.isRead) markRead.mutate(notification.id);
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const markAllRead = () => {
    notifications.filter((n) => !n.isRead).forEach((n) => markRead.mutate(n.id));
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[10px] font-semibold leading-none text-ink-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
      </Button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <span className="text-sm font-semibold text-ink-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-forest-600 hover:text-forest-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-500">Nothing yet.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    onClick={() => openNotification(notification)}
                    className={`block w-full border-b border-ink-50 px-4 py-3 text-left last:border-b-0 hover:bg-ink-50 ${
                      notification.isRead ? '' : 'bg-gold-50/40'
                    }`}
                  >
                    <span className="block text-sm font-medium text-ink-900">{notification.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-ink-600">
                      {notification.message}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}