function parseList(payload) {
  return Array.isArray(payload) ? payload : [];
}

export function createNotificationService(apiBase) {
  const base = String(apiBase || '').replace(/\/$/, '');

  async function request(path, options = {}) {
    const res = await fetch(`${base}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Notification request failed.');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  return {
    async getNotifications(userId, { limit = 50 } = {}) {
      if (!userId) return [];
      const data = await request(`/api/notifications?userId=${encodeURIComponent(userId)}&limit=${limit}`);
      return parseList(data).slice(0, limit);
    },
    async markNotificationAsRead(notificationId, userId) {
      return request(`/api/notifications/${encodeURIComponent(notificationId)}/read?userId=${encodeURIComponent(userId || '')}`, {
        method: 'PUT',
        body: JSON.stringify({ userId })
      });
    },
    async markAllNotificationsAsRead(userId) {
      return request('/api/notifications/read-all', {
        method: 'PUT',
        body: JSON.stringify({ userId })
      });
    },
    async deleteNotification(notificationId, userId) {
      return request(`/api/notifications/${encodeURIComponent(notificationId)}?userId=${encodeURIComponent(userId || '')}`, {
        method: 'DELETE'
      });
    }
  };
}
