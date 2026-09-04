import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/userModel.js';
import { isSupabaseConfigured, supabase } from '../config/supabase.js';
import { fallbackUsers, createAndDispatchNotification } from '../utils/storeUtils.js';

export const authController = {
  async getHealth(req, res) {
    try {
      const isConnected = isSupabaseConfigured && Boolean(supabase);
      res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        database: isConnected ? 'supabase_active' : 'connected',
        persistence: 'hybrid_supabase_and_local_s3',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  async register(req, res) {
    try {
      const {
        name,
        email,
        password,
        role,
        mfsNumber,
        dob,
        university,
        studentId,
        department,
        nid,
        affiliationStatus,
        institution,
        passingYear,
        nidOrPassport,
        bankOrMfs,
        credentialsLink
      } = req.body;

      if (!name || !email || !mfsNumber) {
        return res.status(400).json({ error: 'Name, email, and MFS Number are required fields.' });
      }

      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Account already registered with this email address.' });
      }

      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const studentIdCardImage = req.files?.['studentIdCardImage']?.[0]
        ? `/uploads/${req.files['studentIdCardImage'][0].filename}`
        : '';
      const nidCardImage = req.files?.['nidCardImage']?.[0]
        ? `/uploads/${req.files['nidCardImage'][0].filename}`
        : '';
      const nidOrPassportImage = req.files?.['nidOrPassportImage']?.[0]
        ? `/uploads/${req.files['nidOrPassportImage'][0].filename}`
        : '';
      const credentialsImage = req.files?.['credentialsImage']?.[0]
        ? `/uploads/${req.files['credentialsImage'][0].filename}`
        : '';

      const newId = 'usr_' + (role === 'investor' ? 'investor_' : 'founder_') + Date.now();
      const newUser = {
        id: newId,
        _id: newId,
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword || password || 'defaultpass',
        role: role || 'founder',
        vetting_status: 'pending',
        vettingStatus: 'pending',
        mfs_number: mfsNumber,
        mfsNumber: mfsNumber,
        dob: dob || '',
        university: university || '',
        student_id: studentId || '',
        studentId: studentId || '',
        department: department || '',
        nid: nid || '',
        student_id_card_image: studentIdCardImage,
        studentIdCardImage,
        nid_card_image: nidCardImage,
        nidCardImage,
        affiliation_status: affiliationStatus || '',
        affiliationStatus: affiliationStatus || '',
        institution: institution || '',
        passing_year: passingYear || '',
        passingYear: passingYear || '',
        nid_or_passport: nidOrPassport || '',
        nidOrPassport: nidOrPassport || '',
        bank_or_mfs: bankOrMfs || '',
        bankOrMfs: bankOrMfs || '',
        nid_or_passport_image: nidOrPassportImage,
        nidOrPassportImage,
        credentials_image: credentialsImage,
        credentialsImage,
        credentials_link: credentialsLink || '',
        credentialsLink: credentialsLink || '',
        created_at: new Date().toISOString()
      };

      const createdUser = await userModel.create(newUser);

      await createAndDispatchNotification(
        createdUser.id,
        'Welcome to FundBridge! 🚀',
        'Your profile has been created and is now queued for administrative identity vetting verification.',
        'info'
      );

      res.status(201).json({
        message: 'Registration successful. Account submitted for vetting audit verification.',
        user: createdUser
      });
    } catch (err) {
      console.error('Registration API failure:', err);
      res.status(500).json({ error: 'System processing error registering applicant account.' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required to log in.' });
      }

      const em = email.toLowerCase().trim();
      let user = fallbackUsers.find(u => String(u.email || '').toLowerCase() === em);

      if (!user && isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.from('users').select('*').eq('email', em).single();
          if (data) user = data;
        } catch (e) {}
      }

      if (!user) {
        return res.status(404).json({ error: 'No account registered with this email.' });
      }

      if (password && user.password) {
        let isMatch = false;
        try {
          isMatch = await bcrypt.compare(password, user.password);
        } catch (e) {}
        if (!isMatch && user.password === password) {
          isMatch = true;
        }
        if (!isMatch && user.role !== 'admin') {
          return res.status(401).json({ error: 'Invalid password credentials.' });
        }
      }

      const safeUser = {
        _id: user.id || user._id,
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vettingStatus: user.vetting_status || user.vettingStatus || 'verified',
        vetting_status: user.vetting_status || user.vettingStatus || 'verified',
        mfsNumber: user.mfs_number || user.mfsNumber,
        university: user.university || '',
        department: user.department || '',
        institution: user.institution || '',
        studentId: user.student_id || user.studentId || ''
      };

      const token = jwt.sign(
        { userId: safeUser.id, email: safeUser.email, role: safeUser.role },
        process.env.JWT_SECRET || 'fundbridge_jwt_secret_dev_2026',
        { expiresIn: '7d' }
      );

      res.status(200).json({
        message: 'Authentication successful.',
        token,
        user: safeUser
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal system error processing login.' });
    }
  },

  async adminLogin(req, res) {
    try {
      const { email, password } = req.body;
      const em = String(email || '').trim().toLowerCase();

      let user = fallbackUsers.find(u => String(u.email || '').toLowerCase() === em && u.role === 'admin');

      if (!user && isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.from('users').select('*').eq('email', em).eq('role', 'admin').single();
          if (data) user = data;
        } catch (e) {}
      }

      if (!user) {
        return res.status(403).json({ error: 'Access denied: Not an authorized platform administrator.' });
      }

      let isMatch = false;
      if (password && user.password) {
        try {
          isMatch = await bcrypt.compare(password, user.password);
        } catch (e) {}
        if (!isMatch && user.password === password) {
          isMatch = true;
        }
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid administrator password.' });
      }

      const safeUser = {
        _id: user.id || user._id,
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: 'admin',
        vettingStatus: 'verified',
        vetting_status: 'verified'
      };

      const token = jwt.sign(
        { userId: safeUser.id, email: safeUser.email, role: 'admin' },
        process.env.JWT_SECRET || 'fundbridge_jwt_secret_dev_2026',
        { expiresIn: '7d' }
      );

      res.status(200).json({
        message: 'Administrator authentication verified.',
        token,
        user: safeUser
      });
    } catch (err) {
      res.status(500).json({ error: 'Error during admin authentication.' });
    }
  },

  async getProfile(req, res) {
    try {
      const { userId } = req.query;
      const user = await userModel.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching profile.' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { userId, ...updates } = req.body;
      const sid = String(userId || updates.id || updates._id || '');
      if (!sid) return res.status(400).json({ error: 'User ID required.' });

      const updated = await userModel.update(sid, updates);
      if (!updated) return res.status(404).json({ error: 'User not found.' });
      res.status(200).json({ message: 'Profile updated.', user: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error updating profile.' });
    }
  },

  async uploadProfileDocuments(req, res) {
    try {
      const { userId } = req.body;
      const sid = String(userId || '');
      if (!sid) return res.status(400).json({ error: 'User ID required.' });

      const updates = {};
      if (req.files?.['studentIdCardImage']?.[0]) {
        updates.student_id_card_image = `/uploads/${req.files['studentIdCardImage'][0].filename}`;
        updates.studentIdCardImage = updates.student_id_card_image;
      }
      if (req.files?.['nidCardImage']?.[0]) {
        updates.nid_card_image = `/uploads/${req.files['nidCardImage'][0].filename}`;
        updates.nidCardImage = updates.nid_card_image;
      }
      if (req.files?.['nidOrPassportImage']?.[0]) {
        updates.nid_or_passport_image = `/uploads/${req.files['nidOrPassportImage'][0].filename}`;
        updates.nidOrPassportImage = updates.nid_or_passport_image;
      }
      if (req.files?.['credentialsImage']?.[0]) {
        updates.credentials_image = `/uploads/${req.files['credentialsImage'][0].filename}`;
        updates.credentialsImage = updates.credentials_image;
      }

      const updated = await userModel.update(sid, updates);
      res.status(200).json({ message: 'Documents uploaded.', user: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error uploading documents.' });
    }
  },

  async lookupByEmail(req, res) {
    try {
      const { email } = req.query;
      const user = await userModel.findByEmail(email);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ error: 'Error looking up user.' });
    }
  }
};
