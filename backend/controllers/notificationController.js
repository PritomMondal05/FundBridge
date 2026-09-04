import { notificationModel } from '../models/notificationModel.js';

export const notificationController = {
  async getNotifications(req, res) {
    try {
      const { userId } = req.query;
      const notifs = await notificationModel.getByUser(userId);
      res.status(200).json(notifs);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching notifications.' });
    }
  },

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const notif = await notificationModel.markAsRead(id);
      if (!notif) return res.status(404).json({ error: 'Notification not found.' });
      res.status(200).json({ message: 'Marked as read.', notification: notif });
    } catch (err) {
      res.status(500).json({ error: 'Error updating notification.' });
    }
  },

  async createNotification(req, res) {
    try {
      const { userId, title, message, type } = req.body;
      if (!userId || !title || !message) {
        return res.status(400).json({ error: 'User ID, title, and message are required.' });
      }
      const notif = await notificationModel.create(userId, title, message, type);
      res.status(201).json({ message: 'Notification dispatched.', notification: notif });
    } catch (err) {
      res.status(500).json({ error: 'Error creating notification.' });
    }
  }
};
