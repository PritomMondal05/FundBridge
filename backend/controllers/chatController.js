import { messageModel } from '../models/messageModel.js';
import { getIO } from '../config/socket.js';

export const chatController = {
  async getMessages(req, res) {
    try {
      const { senderId, receiverId, campaignId } = req.query;
      const messages = await messageModel.getMessages({ senderId, receiverId, campaignId });
      res.status(200).json(messages);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching chat messages.' });
    }
  },

  getThread(req, res) {
    try {
      const { senderId, receiverId } = req.query;
      const thread = messageModel.getThread(senderId, receiverId);
      res.status(200).json(thread);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching thread.' });
    }
  },

  async createMessage(req, res) {
    try {
      const { senderId, receiverId, text, campaignId, senderName } = req.body;
      if (!senderId || !text) {
        return res.status(400).json({ error: 'Sender and text message are required.' });
      }

      const msgObj = {
        id: 'msg_' + Date.now(),
        sender_id: senderId,
        receiver_id: receiverId || 'all',
        sender_name: senderName || 'User',
        campaign_id: campaignId || '',
        text,
        created_at: new Date().toISOString()
      };

      const created = await messageModel.createMessage(msgObj);

      const io = getIO();
      if (io) {
        const targetRoom = campaignId || 'general';
        io.to(targetRoom).emit('receive_message', msgObj);
        io.emit('new_direct_message', msgObj);
      }

      res.status(201).json({ message: 'Message sent.', chatMessage: created });
    } catch (err) {
      res.status(500).json({ error: 'Error creating chat message.' });
    }
  }
};
