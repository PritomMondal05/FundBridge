import { auditLogModel } from '../models/auditLogModel.js';

export const auditLogController = {
  async getAllLogs(req, res) {
    try {
      const logs = await auditLogModel.getAll();
      res.status(200).json(logs);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching audit logs.' });
    }
  },

  async getFounderLogs(req, res) {
    try {
      const { founderId } = req.params;
      const logs = await auditLogModel.getByFounder(founderId);
      res.status(200).json(logs);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching founder audit logs.' });
    }
  },

  async createFounderLog(req, res) {
    try {
      const { founderId } = req.params;
      const { category, title, status } = req.body;
      const log = await auditLogModel.createFounderLog({ founderId, category, title, status });
      res.status(201).json({ message: 'Audit log recorded.', log });
    } catch (err) {
      res.status(500).json({ error: 'Error recording founder audit log.' });
    }
  },

  async getInvestorLogs(req, res) {
    try {
      const { investorId } = req.params;
      const logs = await auditLogModel.getByInvestor(investorId);
      res.status(200).json(logs);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching investor audit logs.' });
    }
  },

  async createInvestorLog(req, res) {
    try {
      const { investorId } = req.params;
      const { category, title, status } = req.body;
      const log = await auditLogModel.createInvestorLog({ investorId, category, title, status });
      res.status(201).json({ message: 'Audit log recorded.', log });
    } catch (err) {
      res.status(500).json({ error: 'Error recording investor audit log.' });
    }
  }
};
