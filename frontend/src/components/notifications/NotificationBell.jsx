import { useEffect, useRef, useState } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications.js';
import { formatRelativeTime } from '../../utils/relativeTime.js';
import { isInternalNotificationLink } from '../../constants/notificationTypes.js';

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    onNavigate
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const badge = unreadCount > 99 ? '99+' : String(unreadCount);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleOpen = async (item) => {
    try {
      if (!item.is_read) await markAsRead(item.id);
    } catch {
      /* still navigate */
    }
    setOpen(false);
    const link = item.link_url;
    if (link && isInternalNotificationLink(link) && typeof onNavigate === 'function') {
      onNavigate(link);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] px-1 py-0.5 bg-[#047857] text-white text-[9px] font-bold rounded-full ring-2 ring-white text-center">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] bg-white border border-slate-200 rounded-2xl shadow-xl p-4 space-y-3 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
            <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
            {unreadCount > 0 && (
              <button type="button" onClick={() => markAllAsRead()} className="text-[10px] font-semibold text-emerald-700 hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2 text-xs" role="list">
            {loading && <div className="space-y-2">{[1, 2, 3].map((key) => <div key={key} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>}
            {!loading && error && (
              <div className="py-4 text-center text-rose-700">
                <p>Couldn&apos;t load notifications.</p>
                <button type="button" className="mt-2 font-semibold underline" onClick={() => refreshNotifications()}>Try again</button>
              </div>
            )}
            {!loading && !error && notifications.length === 0 && (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <p className="font-semibold text-slate-600">No notifications yet</p>
                <p>We&apos;ll let you know when something important happens.</p>
              </div>
            )}
            {!loading && !error && notifications.map((item) => (
              <div key={item.id} role="listitem" className={`rounded-xl border p-3 ${item.is_read ? 'bg-slate-50 border-slate-100 opacity-80' : 'bg-emerald-50/60 border-emerald-200'}`}>
                <button type="button" onClick={() => handleOpen(item)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 text-[11px]">{item.title}</span>
                    <span className="text-[9px] text-slate-400 whitespace-nowrap">{formatRelativeTime(item.created_at)}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-tight">{item.message}</p>
                  {!item.is_read && <span className="sr-only">Unread</span>}
                </button>
                <button
                  type="button"
                  aria-label="Delete notification"
                  onClick={() => deleteNotification(item.id)}
                  className="mt-2 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
