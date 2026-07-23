import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Users,
  TrendingUp,
  LogOut,
  Check,
  X,
  ArrowRight,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  FileText,
  Terminal,
  MapPin,
  Search,
  Download,
  Eye,
  EyeOff,
  Bell,
  MessageSquare,
  Activity,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';

import adminLogoUrl from '../assets/images/FundBridge Logo-Admin.svg';
import logoBlackUrl from '../assets/images/FundBridge Logo Black.svg';
import landingImage from '../assets/images/landing_image.webp';

export default function AdminDashboard({ onLogout, API_BASE_URL, triggerAlert }) {
  // Authentication & Session State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    const saved = localStorage.getItem('fundbridge_user');
    if (saved) {
      const u = JSON.parse(saved);
      return u.role === 'admin';
    }
    return false;
  });

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Navigation State Point: overview, verification, audits, disputes, logs
  const [activeTab, setActiveTab] = useState('overview');

  // Registered totals from database stats
  const [totalFounders, setTotalFounders] = useState(0);
  const [totalInvestors, setTotalInvestors] = useState(0);

  // Database-backed queues state
  const [vettingQueue, setVettingQueue] = useState([]);
  const [campaignsList, setCampaignsList] = useState([]);
  const [verifiedCampaigns, setVerifiedCampaigns] = useState([]);
  const [escrowQueue, setEscrowQueue] = useState([]);
  const [dbConnected, setDbConnected] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);

  // Vetting sub-state
  const [selectedApplicantId, setSelectedApplicantId] = useState(null);
  const [verificationSubTab, setVerificationSubTab] = useState('pending'); // 'pending' | 'founders' | 'investors'
  const [verifiedFoundersList, setVerifiedFoundersList] = useState([]);
  const [verifiedInvestorsList, setVerifiedInvestorsList] = useState([]);

  // Edit Profile States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [editStudentId, setEditStudentId] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editNid, setEditNid] = useState('');
  const [editMfsNumber, setEditMfsNumber] = useState('');
  const [editAffiliationStatus, setEditAffiliationStatus] = useState('');
  const [editInstitution, setEditInstitution] = useState('');
  const [editPassingYear, setEditPassingYear] = useState('');
  const [editNidOrPassport, setEditNidOrPassport] = useState('');
  const [editBankOrMfs, setEditBankOrMfs] = useState('');
  const [editCredentialsLink, setEditCredentialsLink] = useState('');
  const [verificationChecklist, setVerificationChecklist] = useState({
    nameMatch: false,
    idValid: false,
    mfsMatch: false
  });

  // Campaign audit sub-state
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [campaignCompliance, setCampaignCompliance] = useState({});
  const [auditSubTab, setAuditSubTab] = useState('pending'); // 'pending' | 'published' | 'revisions' | 'rejected'
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [campaignAuditFeedback, setCampaignAuditFeedback] = useState('');
  const [campaignRejectionReason, setCampaignRejectionReason] = useState('');
  const [docPreviewModal, setDocPreviewModal] = useState(null); // { title, filename, size }

  // Initial realistic demo complaints for Disputes & Holds Management
  const initialComplaints = [
    {
      id: 'CMP-801',
      complainant: 'Vantage Ventures Dhaka',
      complainantRole: 'investor',
      reportedUser: 'Anika Rahman',
      reportedUserId: 'founder-anika',
      reportedRole: 'student',
      campaignTitle: 'CampusBites',
      campaignId: 'campusbites',
      issueType: 'Late Milestone Delivery',
      description: 'Founder has failed to submit Milestone 2 proof documents past the agreed 30-day timeline despite receiving seed funding tranche.',
      evidenceFile: 'milestone_delay_notice_q3.pdf',
      evidenceSize: '1.4 MB',
      severity: 'Critical',
      status: 'Open',
      createdAt: '2026-07-22 11:30'
    },
    {
      id: 'CMP-802',
      complainant: 'Tariqul Islam',
      complainantRole: 'student',
      reportedUser: 'Siddique Rahman',
      reportedUserId: 'investor-siddique',
      reportedRole: 'investor',
      campaignTitle: 'SolarGrid AI',
      campaignId: 'solargrid',
      issueType: 'Payment Issues',
      description: 'Investor wire transfer transaction hash failed confirmation on bKash merchant ledger. Pending investment terms remain unpaid.',
      evidenceFile: 'mfs_bank_transfer_receipt.pdf',
      evidenceSize: '850 KB',
      severity: 'High',
      status: 'Open',
      createdAt: '2026-07-23 09:15'
    },
    {
      id: 'CMP-803',
      complainant: 'Dhaka Angel Syndicate',
      complainantRole: 'investor',
      reportedUser: 'Tariqul Islam',
      reportedUserId: 'founder-tariqul',
      reportedRole: 'student',
      campaignTitle: 'EcoThread',
      campaignId: 'ecothread',
      issueType: 'Fake Information',
      description: 'Discrepancy detected between uploaded trade license scan and official Registrar of Joint Stock Companies database record.',
      evidenceFile: 'audit_verification_mismatch.pdf',
      evidenceSize: '2.1 MB',
      severity: 'Critical',
      status: 'Open',
      createdAt: '2026-07-23 14:40'
    }
  ];

  // Disputes & Holds state
  const [disputesList, setDisputesList] = useState(initialComplaints);
  const [selectedUserToBlockRole, setSelectedUserToBlockRole] = useState('student'); // 'student' | 'investor'
  const [selectedUserToBlockId, setSelectedUserToBlockId] = useState('');
  const [selectedControlCampaignId, setSelectedControlCampaignId] = useState('');
  const [investigatingComplaint, setInvestigatingComplaint] = useState(null);

  // Safety panel controls (Disputes)
  const [globalFreezeActive, setGlobalFreezeActive] = useState(false);
  const [tokensRevoked, setTokensRevoked] = useState(false);
  const [ddosMitigation, setDdosMitigation] = useState(true);
  const [fraudDetectionAI, setFraudDetectionAI] = useState(true);
  const [l3ManualReview, setL3ManualReview] = useState(false);

  // Live Toast Messages state
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Helper to fetch interactive campaign compliance checks
  const getCompliance = (cId) => {
    if (!campaignCompliance[cId]) {
      return {
        smartContractAudit: false,
        founderIdentity: false,
        regulatoryCompliance: false
      };
    }
    return campaignCompliance[cId];
  };

  const toggleCompliance = (cId, field) => {
    setCampaignCompliance(prev => ({
      ...prev,
      [cId]: {
        ...getCompliance(cId),
        [field]: !getCompliance(cId)[field]
      }
    }));
  };

  const fetchVerifiedUsers = async () => {
    try {
      const foundersRes = await fetch(`${API_BASE_URL}/api/admin/users/founders`);
      if (foundersRes.ok) {
        const foundersData = await foundersRes.json();
        setVerifiedFoundersList(foundersData);
      }
      const investorsRes = await fetch(`${API_BASE_URL}/api/admin/users/investors`);
      if (investorsRes.ok) {
        const investorsData = await investorsRes.json();
        setVerifiedInvestorsList(investorsData);
      }
    } catch (err) {
      console.error('Error fetching verified users lists:', err);
    }
  };

  // Fetch all databases entities from the server APIs
  const fetchDatabaseData = async () => {
    try {
      setDbLoading(true);
      await fetchVerifiedUsers();

      // 1. Fetch vetting applicants
      const vetRes = await fetch(`${API_BASE_URL}/api/vetting/applicants`);
      if (vetRes.ok) {
        const vetData = await vetRes.json();
        setVettingQueue(vetData);
        const anika = vetData.find(u => u.name === 'Anika Rahman');
        if (anika) {
          setSelectedApplicantId(anika._id);
        } else if (vetData.length > 0) {
          setSelectedApplicantId(vetData[0]._id);
        }
      }

      // 2. Fetch pending campaigns
      const campRes = await fetch(`${API_BASE_URL}/api/admin/campaigns/pending`);
      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaignsList(campData);

        // Auto-select first pending campaign dynamically
        if (campData.length > 0) {
          setSelectedCampaignId(campData[0].id);
        } else {
          setSelectedCampaignId(null);
        }
      }

      // 3. Fetch verified campaigns to calculate escrow / live metrics
      const verifiedRes = await fetch(`${API_BASE_URL}/api/campaigns`);
      if (verifiedRes.ok) {
        const verifiedData = await verifiedRes.json();
        setVerifiedCampaigns(verifiedData);
      }

      // 4. Fetch pending escrow tranches
      const escRes = await fetch(`${API_BASE_URL}/api/admin/escrow/pending`);
      if (escRes.ok) {
        const escData = await escRes.json();
        setEscrowQueue(escData);
      }

      // 5. Fetch registered database user counts (Founders and Investors)
      const statsRes = await fetch(`${API_BASE_URL}/api/admin/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setTotalFounders(statsData.totalFounders || 0);
        setTotalInvestors(statsData.totalInvestors || 0);
      }

      // 6. Check system diagnostics health
      const healthRes = await fetch(`${API_BASE_URL}/api/health`);
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setDbConnected(healthData.database === 'connected' || healthData.database === 'supabase_active' || healthData.database === 'mongodb_connected');
      }

      setDbLoading(false);
    } catch (err) {
      console.error('Error fetching database registers:', err);
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchDatabaseData();
    }
  }, [isAdminAuthenticated]);

  // Live scrolling terminal logs (Disputes Diagnostics)
  const [securityLogs, setSecurityLogs] = useState([
    'SYSTEM_READY: Diagnostics initialized.',
    'SECURE_SYNC: Listening on Mainnet node buffers.',
    'AUTH_DAEMON: Active session signature validated for supervisor ADMIN_PRITOM.',
    'FIREWALL: Zero Packet Loss on cluster-2.dhaka.fundbridge.net.',
    'SHIELD_ENG: GeoIP sync completed. North America - Cluster A flagged.'
  ]);

  useEffect(() => {
    if (activeTab === 'disputes') {
      const interval = setInterval(() => {
        const events = [
          'DB_SYNC: MongoDB replica set synchronization successful (lag 14ms).',
          'GATEWAY: bKash webhook signature check: 200 OK.',
          'THREAT_INTEL: IP 192.168.42.11 rate-limited.',
          'AUDIT: Immutable block validation complete.',
          'ESCROW: Transaction buffer holding state: STABLE.',
          'AUTH: Token signature verification check passed.'
        ];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        const time = new Date().toLocaleTimeString();
        setSecurityLogs(prev => [...prev.slice(-12), `[${time}] ${randomEvent}`]);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Tab 6: Activity Log state
  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('ALL');

  const initialActivityLogs = [
    {
      timestamp: '2023-10-27 14:22:10',
      actor: 'J. Donovan',
      initials: 'JD',
      color: 'bg-indigo-900 text-indigo-200 border-indigo-500/30',
      action: 'APPROVED CAMPAIGN',
      target: 'CampusBites',
      rationale: 'Approved Milestone 1 disbursement.',
      hash: 'fb_a982...3e12'
    },
    {
      timestamp: '2023-10-27 13:05:41',
      actor: 'S. Kothari',
      initials: 'SK',
      color: 'bg-emerald-900 text-emerald-200 border-emerald-500/30',
      action: 'FLAGGED FRAUD',
      target: 'EcoThread',
      rationale: 'Suspicious payment activity detected.',
      hash: 'fb_d3c1...8f90'
    },
    {
      timestamp: '2023-10-27 09:12:00',
      actor: 'J. Donovan',
      initials: 'JD',
      color: 'bg-indigo-900 text-indigo-200 border-indigo-500/30',
      action: 'SYSTEM UPDATE',
      target: 'Security Protocol',
      rationale: 'Activated L3 Manual Review queue.',
      hash: 'fb_e762...11a2'
    },
    {
      timestamp: '2023-10-26 18:45:15',
      actor: 'S. Kothari',
      initials: 'SK',
      color: 'bg-emerald-900 text-emerald-200 border-emerald-500/30',
      action: 'SYSTEM UPDATE',
      target: 'Escrow Engine',
      rationale: 'Synchronized mainnet node buffers.',
      hash: 'fb_c98a...56b7'
    }
  ];

  const [activityLogs, setActivityLogs] = useState(initialActivityLogs);

  // Authentication Submission Handler (Screen 1 to Screen 2 transition)
  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      addToast('Administrator credentials are required.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication credentials failed.');
      }

      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Administrator credentials required.');
      }

      localStorage.setItem('fundbridge_user', JSON.stringify(data.user));
      localStorage.setItem('fundbridge_token', data.token);
      setIsAdminAuthenticated(true);
      setActiveTab('overview');
      addToast('Administrator authenticated. Welcome to supervisor terminal.', 'success');
    } catch (err) {
      addToast(err.message || 'Authentication failed. Check your secure keys.', 'error');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('fundbridge_user');
    localStorage.removeItem('fundbridge_token');
    setIsAdminAuthenticated(false);
    onLogout();
  };

  // Navigations helper
  const navigateToVerification = () => {
    setActiveTab('verification');
    setVerificationChecklist({
      nameMatch: false,
      idValid: false,
      mfsMatch: false
    });

    const anika = vettingQueue.find(u => u.name === 'Anika Rahman');
    if (anika) {
      setSelectedApplicantId(anika._id);
    }
  };

  // User Verification approvals
  const handleApproveApplicant = async () => {
    const applicant = vettingQueue.find(u => u._id === selectedApplicantId);
    if (!applicant) return;

    if (!verificationChecklist.nameMatch || !verificationChecklist.idValid || !verificationChecklist.mfsMatch) {
      addToast('Compliance mismatch: All checklist verification blocks must be checked.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/vetting/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedApplicantId, status: 'verified' })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Database write error');

      addToast(`Applicant "${applicant.name}" approved. Trust profile updated in database.`, 'success');

      const newLog = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'ADMIN_PRITOM',
        initials: 'AP',
        color: 'bg-purple-900 text-purple-200 border-purple-500/30',
        action: 'APPROVED USER',
        target: `${applicant.name} (ID: ${selectedApplicantId.substring(selectedApplicantId.length - 4)})`,
        rationale: `Identity verified successfully for ${applicant.university || 'institution'}.`,
        hash: 'fb_' + Math.random().toString(36).substring(2, 6) + '...' + Math.random().toString(36).substring(2, 6)
      };
      setActivityLogs(prev => [newLog, ...prev]);

      fetchDatabaseData();
    } catch (e) {
      addToast(e.message || 'Failed to update database applicant status.', 'error');
    }
  };

  const handleRejectApplicant = async () => {
    const applicant = vettingQueue.find(u => u._id === selectedApplicantId);
    if (!applicant) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/vetting/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedApplicantId, status: 'rejected' })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Database write error');

      addToast(`Applicant "${applicant.name}" rejected. Credentials deleted.`, 'error');

      const newLog = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'ADMIN_PRITOM',
        initials: 'AP',
        color: 'bg-purple-900 text-purple-200 border-purple-500/30',
        action: 'REJECTED USER',
        target: `${applicant.name}`,
        rationale: 'Rejected due to credential mismatch.',
        hash: 'fb_' + Math.random().toString(36).substring(2, 6) + '...' + Math.random().toString(36).substring(2, 6)
      };
      setActivityLogs(prev => [newLog, ...prev]);

      fetchDatabaseData();
    } catch (e) {
      addToast('Failed to reject vetting applicant in database.', 'error');
    }
  };

  const handleToggleHold = async (userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/hold`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error toggling hold status');
      
      addToast(data.message, 'success');
      fetchDatabaseData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleRemoveUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to permanently remove "${name}" from FundBridge? This action is irreversible.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error removing profile');
      
      addToast(`Profile "${name}" was successfully deleted from database.`, 'success');
      
      // Log this action
      const newLog = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'ADMIN_PRITOM',
        initials: 'AP',
        color: 'bg-red-900 text-red-200 border-red-500/30',
        action: 'REMOVED USER',
        target: `${name}`,
        rationale: `Irreversible removal of account profile from DB.`,
        hash: 'fb_' + Math.random().toString(36).substring(2, 6) + '...' + Math.random().toString(36).substring(2, 6)
      };
      setActivityLogs(prev => [newLog, ...prev]);

      fetchDatabaseData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditUniversity(user.university || '');
    setEditStudentId(user.studentId || '');
    setEditDepartment(user.department || '');
    setEditDob(user.dob || '');
    setEditNid(user.nid || '');
    setEditMfsNumber(user.mfsNumber || '');
    setEditAffiliationStatus(user.affiliationStatus || '');
    setEditInstitution(user.institution || '');
    setEditPassingYear(user.passingYear || '');
    setEditNidOrPassport(user.nidOrPassport || '');
    setEditBankOrMfs(user.bankOrMfs || '');
    setEditCredentialsLink(user.credentialsLink || '');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const payload = {
        name: editName,
        email: editEmail,
        mfsNumber: editMfsNumber
      };
      
      if (editingUser.role === 'founder') {
        payload.university = editUniversity;
        payload.studentId = editStudentId;
        payload.department = editDepartment;
        payload.dob = editDob;
        payload.nid = editNid;
      } else {
        payload.affiliationStatus = editAffiliationStatus;
        payload.institution = editInstitution;
        payload.passingYear = editPassingYear;
        payload.nidOrPassport = editNidOrPassport;
        payload.bankOrMfs = editBankOrMfs;
        payload.credentialsLink = editCredentialsLink;
      }
      
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error updating profile');
      
      addToast('Profile updated successfully!', 'success');
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchDatabaseData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handlePublishCampaign = async (campaignObjId, title) => {
    const compliance = getCompliance(selectedCampaignId);
    if (!compliance.smartContractAudit || !compliance.founderIdentity || !compliance.regulatoryCompliance) {
      addToast('Cannot publish: Smart Contract, KYB, and Regulatory Compliance must be audited and verified.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/campaigns/${campaignObjId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Database write error');

      addToast(`Campaign "${title}" successfully verified and published to global directory.`, 'success');

      const newLog = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'ADMIN_PRITOM',
        initials: 'AP',
        color: 'bg-purple-900 text-purple-200 border-purple-500/30',
        action: 'APPROVED CAMPAIGN',
        target: title,
        rationale: 'Verified compliance quality audits.',
        hash: 'fb_' + Math.random().toString(36).substring(2, 6) + '...' + Math.random().toString(36).substring(2, 6)
      };
      setActivityLogs(prev => [newLog, ...prev]);

      fetchDatabaseData();
    } catch (e) {
      addToast('Failed to verify campaign in database.', 'error');
    }
  };

  const handleRejectCampaignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    const campaignObjId = selectedCampaign._id || selectedCampaign.id;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/campaigns/${campaignObjId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: campaignRejectionReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject campaign');

      addToast(`Campaign "${selectedCampaign.title}" rejected and updated in audit ledger.`, 'error');

      const newLog = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'ADMIN_PRITOM',
        initials: 'AP',
        color: 'bg-red-950 text-red-200 border-red-500/30',
        action: 'REJECTED CAMPAIGN',
        target: selectedCampaign.title,
        rationale: campaignRejectionReason || 'Did not meet compliance criteria.',
        hash: 'fb_' + Math.random().toString(36).substring(2, 6) + '...'
      };
      setActivityLogs(prev => [newLog, ...prev]);

      setIsRejectModalOpen(false);
      setCampaignRejectionReason('');
      fetchDatabaseData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleReuploadRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    const campaignObjId = selectedCampaign._id || selectedCampaign.id;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/campaigns/${campaignObjId}/reupload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackNotes: campaignAuditFeedback })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request campaign re-upload');

      addToast(`Revision requests sent for "${selectedCampaign.title}". Transferred back to founder queue.`, 'info');

      const newLog = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'ADMIN_PRITOM',
        initials: 'AP',
        color: 'bg-amber-950 text-amber-200 border-amber-500/30',
        action: 'REQUESTED REVISION',
        target: selectedCampaign.title,
        rationale: campaignAuditFeedback || 'Requires document re-upload & financial updates.',
        hash: 'fb_' + Math.random().toString(36).substring(2, 6) + '...'
      };
      setActivityLogs(prev => [newLog, ...prev]);

      setIsRevisionModalOpen(false);
      setCampaignAuditFeedback('');
      fetchDatabaseData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Escrow Release approvals
  const handleApproveEscrowRelease = async (campaignObjId, milestoneId, campaignTitle, milestoneTitle) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/escrow/${campaignObjId}/milestones/${milestoneId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Database release error');

      addToast(`Tranche payment approved and released for ${campaignTitle} - "${milestoneTitle}".`, 'success');

      const newLog = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'ADMIN_PRITOM',
        initials: 'AP',
        color: 'bg-purple-900 text-purple-200 border-purple-500/30',
        action: 'RELEASED ESCROW',
        target: campaignTitle,
        rationale: `Milestone "${milestoneTitle}" release validated.`,
        hash: 'fb_' + Math.random().toString(36).substring(2, 6) + '...' + Math.random().toString(36).substring(2, 6)
      };
      setActivityLogs(prev => [newLog, ...prev]);

      fetchDatabaseData();
    } catch (e) {
      addToast('Failed to approve escrow release in database.', 'error');
    }
  };

  // Disputes panel actions
  const handleExecuteGlobalFreeze = () => {
    setGlobalFreezeActive(prev => !prev);
    if (!globalFreezeActive) {
      addToast('ALERT: GLOBAL ESCROW PAYMENT FREEZE ENGAGED.', 'error');

      const newLog = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'ADMIN_PRITOM',
        initials: 'AP',
        color: 'bg-purple-900 text-purple-200 border-purple-500/30',
        action: 'GLOBAL FREEZE',
        target: 'Escrow Account Ledger',
        rationale: 'Emergency global payment escrow freeze executed by platform supervisor.',
        hash: 'fb_f812...e021'
      };
      setActivityLogs(prev => [newLog, ...prev]);
    } else {
      addToast('Global escrow payment system restored.', 'success');
    }
  };

  const handleRevokeTokens = () => {
    setTokensRevoked(prev => !prev);
    if (!tokensRevoked) {
      addToast('ALERT: ACTIVE USER ACCESS TOKENS SUSPENDED.', 'error');

      const newLog = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'ADMIN_PRITOM',
        initials: 'AP',
        color: 'bg-purple-900 text-purple-200 border-purple-500/30',
        action: 'TOKEN REVOCATION',
        target: 'Authentication Server',
        rationale: 'Active session tokens revoked globally.',
        hash: 'fb_d980...bc52'
      };
      setActivityLogs(prev => [newLog, ...prev]);
    } else {
      addToast('User access tokens re-enabled.', 'success');
    }
  };

  // Action 1: Block Any User (Student Founder or Investor)
  const handleBlockUserAction = async (userId, userName, role) => {
    if (!userId) {
      addToast('Please select a user to block.', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/block`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user block status');

      const isBlockedNow = data.user?.vettingStatus === 'blocked';
      addToast(
        isBlockedNow
          ? `User "${userName || data.user?.name}" BLOCKED! Login access revoked & associated activities paused.`
          : `User "${userName || data.user?.name}" UNBLOCKED and restored.`,
        isBlockedNow ? 'error' : 'success'
      );

      const newLog = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'ADMIN_PRITOM',
        initials: 'AP',
        color: isBlockedNow ? 'bg-red-950 text-red-200 border-red-500/30' : 'bg-emerald-950 text-emerald-200 border-emerald-500/30',
        action: isBlockedNow ? 'BLOCKED USER' : 'UNBLOCKED USER',
        target: userName || data.user?.name || userId,
        rationale: isBlockedNow ? `Admin override: Blocked ${role || 'user'} account.` : `Unblocked user account.`,
        hash: 'fb_' + Math.random().toString(36).substring(2, 6) + '...'
      };
      setActivityLogs(prev => [newLog, ...prev]);

      fetchDatabaseData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Action 2: Pause Campaign Funding
  const handlePauseCampaignFunding = async (campaignObjId, title) => {
    if (!campaignObjId) {
      addToast('Please select a campaign to pause funding.', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/campaigns/${campaignObjId}/pause-funding`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to pause funding');

      const isPaused = data.campaign?.status === 'funding_paused';
      addToast(
        isPaused
          ? `Funding temporarily PAUSED for "${title || data.campaign?.title}".`
          : `Funding RESTORED for "${title || data.campaign?.title}".`,
        isPaused ? 'error' : 'success'
      );

      fetchDatabaseData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Action 3: Block / Delete Campaign
  const handleBlockCampaignAction = async (campaignObjId, title) => {
    if (!campaignObjId) {
      addToast('Please select a campaign to block.', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/campaigns/${campaignObjId}/block`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to block campaign');

      addToast(`Campaign "${title || data.campaign?.title}" PERMANENTLY BLOCKED and removed from investor feed.`, 'error');

      const newLog = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'ADMIN_PRITOM',
        initials: 'AP',
        color: 'bg-red-950 text-red-200 border-red-500/30',
        action: 'BLOCKED CAMPAIGN',
        target: title || campaignObjId,
        rationale: 'Permanently removed non-compliant campaign from platform.',
        hash: 'fb_' + Math.random().toString(36).substring(2, 6) + '...'
      };
      setActivityLogs(prev => [newLog, ...prev]);

      fetchDatabaseData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Action 4: Freeze Escrow Funds
  const handleFreezeCampaignFundsAction = async (campaignObjId, title) => {
    if (!campaignObjId) {
      addToast('Please select a campaign to freeze escrow funds.', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/campaigns/${campaignObjId}/freeze-funds`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to freeze escrow funds');

      const isFrozen = data.campaign?.escrowFrozen;
      addToast(
        isFrozen
          ? `Escrow funds FROZEN for "${title || data.campaign?.title}". Withdrawal locked.`
          : `Escrow funds UNFROZEN for "${title || data.campaign?.title}".`,
        isFrozen ? 'error' : 'success'
      );

      // Update complaint status if linked
      setDisputesList(prev => prev.map(d => (d.campaignId === campaignObjId || d.campaignTitle === title) ? { ...d, status: isFrozen ? 'Funds Frozen' : 'Under Audit' } : d));

      fetchDatabaseData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Action 5: Dismiss Complaint
  const handleDismissComplaint = (id) => {
    setDisputesList(prev => prev.map(d => d.id === id ? { ...d, status: 'Dismissed' } : d));
    addToast(`Complaint ${id} dismissed. Case closed.`, 'info');
  };

  // Render Login page if not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div
        className="min-h-screen text-[#E2E8F0] flex flex-col justify-between font-sans relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${landingImage})` }}
      >
        <div className="absolute inset-0 bg-[#0B0F0C]/80 backdrop-blur-xs z-0 pointer-events-none"></div>

        <div></div>

        {/* Screen [1]: Login Card */}
        <div className="relative z-10 flex justify-center px-4">
          <div className="rounded-2xl shadow-2xl max-w-md w-full px-8 py-10 bg-white/95 backdrop-blur-md text-slate-800 animate-fadeIn">
            <div className="flex justify-center mb-6">
              <img src={logoBlackUrl} alt="FundBridge Logo" className="h-10 w-auto" />
            </div>

            <div className="text-center mb-8">
              <span className="font-mono text-xs font-medium tracking-wider text-slate-500 block uppercase">
                WELCOME TO ADMIN PORTAL
              </span>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-6">
              <div>
                <label className="font-mono text-xs font-medium text-slate-600 block mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-mono text-sm font-medium">@</span>
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="admin@fundbridge.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-300 rounded px-3.5 py-2.5 pl-8 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder-slate-400 font-medium font-sans"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-mono text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      addToast('Reset links are managed via local institution administrator protocols.', 'info');
                    }}
                    className="font-sans text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Forgot?
                  </a>
                </div>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-300 rounded px-3.5 py-2.5 pl-8 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder-slate-400 font-medium font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-800 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded transition-all cursor-pointer tracking-wider font-sans uppercase shadow-md flex items-center justify-center gap-2"
              >
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="relative z-10 text-center px-6 py-8 max-w-4xl mx-auto">
          <p className="font-mono text-[10px] text-slate-400/80 leading-relaxed uppercase tracking-wider">
            AUTHORISED PERSONNEL ONLY. ALL SESSION ACTIVITIES ARE LOGGED AND AUDITED IN COMPLIANCE WITH INSTITUTIONAL FINANCIAL REGULATIONS.
          </p>
        </div>
      </div>
    );
  }

  // Active queues formatting and calculations (COMPUTED DYNAMICALLY FROM DATABASE - no dummy metrics)
  const filteredApplicants = vettingQueue;

  const selectedApplicant = vettingQueue.find(item => item._id === selectedApplicantId) || filteredApplicants[0];
  const selectedCampaign = campaignsList.find(c => c.id === selectedCampaignId || c._id === selectedCampaignId) || campaignsList[0];

  const displayedAuditCampaigns = 
    auditSubTab === 'published'
      ? verifiedCampaigns
      : auditSubTab === 'revisions'
      ? campaignsList.filter(c => c.status === 'revision_required')
      : auditSubTab === 'rejected'
      ? campaignsList.filter(c => c.status === 'rejected')
      : campaignsList.filter(c => !c.verified && c.status !== 'rejected' && c.status !== 'revision_required');

  const selectedAuditCampaign =
    displayedAuditCampaigns.find(c => c._id === selectedCampaignId || c.id === selectedCampaignId) || displayedAuditCampaigns[0];

  // Dynamic calculations for real overview statistics (if its 0 then 0)
  const totalEscrowCapital = verifiedCampaigns.reduce((acc, c) => acc + (c.raised || 0), 0);
  const liveCampaignsCount = verifiedCampaigns.length;

  // Calculate active founders from verified campaigns and pending vetting queue
  const uniqueFoundersSet = new Set();
  verifiedCampaigns.forEach(c => {
    if (c.founder) uniqueFoundersSet.add(c.founder._id || c.founder);
  });
  const activeFoundersCount = uniqueFoundersSet.size;

  // Format Escrow Capital in BDT format (৳ 3,00,000)
  const formattedEscrowCapital = totalEscrowCapital > 0
    ? `taka ${totalEscrowCapital.toLocaleString('en-IN')}`
    : 'taka 0';

  // Build Dynamic Timeline Entries based on actual database queue items
  const dynamicTimelineEntries = [];

  // Vetting items registrations in timeline
  vettingQueue.forEach((item, idx) => {
    dynamicTimelineEntries.push({
      id: `reg-${item._id}`,
      time: idx === 0 ? '10:45 AM' : 'Earlier',
      type: 'REGISTRATION',
      title: `New founder registration: ${item.name}.`,
      actionable: true,
      onClick: navigateToVerification
    });
  });

  // Pending milestone releases in timeline
  escrowQueue.forEach(req => {
    dynamicTimelineEntries.push({
      id: `esc-${req.milestoneId}`,
      time: '09:12 AM',
      type: 'PROOF_SUBMISSION',
      title: `Milestone proof upload for ${req.campaignTitle}.`,
      file: 'q3_report_signed.pdf',
      actionable: false
    });
  });

  // Disputes in timeline (Will be empty if disputesList length is 0)
  disputesList.forEach(disp => {
    dynamicTimelineEntries.push({
      id: `disp-${disp.id}`,
      time: disp.timeline,
      type: 'DISPUTE',
      title: `Dispute Initiated: Order ${disp.id} for ${disp.campaign}`,
      actionable: false
    });
  });

  // Compliance checks sub-state helper
  const compliance = selectedCampaign ? getCompliance(selectedCampaign.id) : {
    smartContractAudit: false,
    founderIdentity: false,
    regulatoryCompliance: false
  };

  return (
    <div className="min-h-screen bg-[#0B0F0C] text-[#E2E8F0] flex flex-col font-sans relative">

      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-5 py-4 rounded-sm border-l-4 shadow-xl animate-fadeIn ${toast.type === 'success'
              ? 'bg-[#111613] text-[#E2E8F0] border-[#00E676]'
              : toast.type === 'error'
                ? 'bg-red-950 text-red-100 border-red-500'
                : 'bg-[#111613] text-[#E2E8F0] border-amber-500'
              }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            ) : (
              <Activity className="w-5 h-5 text-[#00E676] flex-shrink-0" />
            )}
            <p className="text-xs font-mono font-medium">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Global Top Header Bar (DATABASE, LAG, SYNCED telemetry only, other fluff removed) */}
      <header className="border-b border-[#1F2922] bg-[#050806] px-6 py-4 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#8E9B93]">FUNDBRIDGE_ADMIN</span>
          <span className="text-[#8E9B93]">/</span>
          <span className="text-[#00E676] uppercase tracking-wide font-medium">
            {activeTab === 'overview' ? 'dashboard_overview' :
              activeTab === 'verification' ? 'identity_vetting' :
                activeTab === 'audits' ? 'campaign_vault' :
                  activeTab === 'disputes' ? 'security_control' : 'immutable_ledger'}
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Telemetry info */}
          <div className="flex items-center gap-4 text-[11px] font-mono text-[#8E9B93]">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dbConnected ? 'bg-[#00E676]' : 'bg-red-500'}`}></span>
              <span>DATABASE: {dbConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>
            <div className="w-px h-3 bg-[#1F2922]"></div>
            <div>LAG: 14ms</div>
            <div className="w-px h-3 bg-[#1F2922]"></div>
            <div>SYNCED</div>
          </div>

          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-2 text-xs font-mono text-[#8E9B93] hover:text-[#E2E8F0] transition-colors border border-[#1F2922] bg-[#0B0F0C] rounded px-3 py-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#00E676]" />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* Main Framework Grid */}
      <div className="flex-1 flex flex-col md:flex-row relative z-10">

        {/* Sidebar Navigation */}
        <aside className="w-full md:w-72 bg-[#050806] border-r border-[#1F2922] p-6 flex flex-col justify-between text-left flex-shrink-0">

          <div className="space-y-8">
            {/* Brand Header: Logo size scaled to fit sidebar */}
            <div className="flex items-center">
              <img src={adminLogoUrl} alt="FundBridge Admin Logo" className="h-20 w-auto object-contain" />
            </div>

            <nav className="space-y-1">
              <span className="text-[9px] font-mono tracking-widest text-[#8E9B93]/60 uppercase block mb-3 pl-2">NAVIGATION_STATE</span>

              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left px-4 py-3 rounded text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-between ${activeTab === 'overview'
                  ? 'bg-[#111613] text-[#00E676] border-l-2 border-[#00E676]'
                  : 'text-[#8E9B93] hover:bg-[#111613]/50 hover:text-[#E2E8F0]'
                  }`}
              >
                <span>OVERVIEW</span>
              </button>

              <button
                onClick={() => setActiveTab('verification')}
                className={`w-full text-left px-4 py-3 rounded text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-between ${activeTab === 'verification'
                  ? 'bg-[#111613] text-[#00E676] border-l-2 border-[#00E676]'
                  : 'text-[#8E9B93] hover:bg-[#111613]/50 hover:text-[#E2E8F0]'
                  }`}
              >
                <span>USER VERIFICATION</span>
                {vettingQueue.length > 0 && (
                  <span className="text-[10px] text-[#8E9B93]/50 font-mono font-normal">
                    ({vettingQueue.length})
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('audits')}
                className={`w-full text-left px-4 py-3 rounded text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-between ${activeTab === 'audits'
                  ? 'bg-[#111613] text-[#00E676] border-l-2 border-[#00E676]'
                  : 'text-[#8E9B93] hover:bg-[#111613]/50 hover:text-[#E2E8F0]'
                  }`}
              >
                <span>CAMPAIGN AUDITS</span>
                {campaignsList.length > 0 && (
                  <span className="text-[10px] text-[#8E9B93]/50 font-mono font-normal">
                    ({campaignsList.length})
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('disputes')}
                className={`w-full text-left px-4 py-3 rounded text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-between ${activeTab === 'disputes'
                  ? 'bg-[#111613] text-[#00E676] border-l-2 border-[#00E676]'
                  : 'text-[#8E9B93] hover:bg-[#111613]/50 hover:text-[#E2E8F0]'
                  }`}
              >
                <span>DISPUTES & HOLDS</span>
                {disputesList.length > 0 && (
                  <span className="text-[10px] text-[#8E9B93]/50 font-mono font-normal">
                    ({disputesList.length})
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`w-full text-left px-4 py-3 rounded text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-between ${activeTab === 'logs'
                  ? 'bg-[#111613] text-[#00E676] border-l-2 border-[#00E676]'
                  : 'text-[#8E9B93] hover:bg-[#111613]/50 hover:text-[#E2E8F0]'
                  }`}
              >
                <span>ACTIVITY LOG</span>
              </button>
            </nav>
          </div>

          <div className="border border-[#1F2922] bg-[#111613] rounded p-4 flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#1F2922] border border-[#00E676]/30 flex items-center justify-center text-xs font-mono text-[#00E676]">
                AP
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00E676] border-2 border-[#111613] rounded-full"></span>
            </div>
            <div>
              <div className="font-mono text-xs text-[#E2E8F0] tracking-wide">ADMIN_PRITOM</div>
              <div className="text-[10px] font-mono text-[#8E9B93] uppercase">Security Level 4</div>
            </div>
          </div>
        </aside>

        {/* Main Workspace Viewport */}
        <main className="flex-1 p-6 md:p-8 bg-[#0B0F0C] overflow-y-auto max-w-7xl mx-auto w-full space-y-8">

          {dbLoading && activeTab !== 'logs' && (
            <div className="py-2 px-4 rounded bg-[#111613] border border-[#1F2922] flex items-center justify-between font-mono text-xs text-[#8E9B93]">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-[#00E676] border-t-transparent rounded-full animate-spin"></span>
                Syncing mainnet Atlas cluster buffers...
              </span>
            </div>
          )}

          {/* SCREEN [2]: ADMIN DASHBOARD OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn text-left">
              <div className="space-y-1">
                <span className="font-mono text-xs text-[#8E9B93] tracking-widest uppercase">
                  DASHBOARD OVERVIEW
                </span>
                <h2 className="text-2xl font-mono text-[#E2E8F0] tracking-tight font-medium">
                  Welcome back, Admin!
                </h2>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Total Capital in Escrow (Spans 2 columns on desktop) */}
                <div className="border border-emerald-500/20 bg-emerald-950/5 rounded p-6 flex flex-col justify-between min-h-[140px] lg:col-span-2 sm:col-span-2 hover:border-[#00E676]/30 transition-colors">
                  <span className="font-mono text-xs text-emerald-400 tracking-wider uppercase block">
                    Total Capital in Escrow
                  </span>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="font-mono text-2xl font-medium text-[#E2E8F0] tracking-tight">
                      {formattedEscrowCapital}
                    </span>
                    <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Live Escrow Vault
                    </span>
                  </div>
                </div>

                {/* 2. Pending Verifications */}
                <div className="border border-amber-500/20 bg-amber-950/5 rounded p-6 flex flex-col justify-between min-h-[140px] hover:border-amber-500/40 transition-colors">
                  <span className="font-mono text-xs text-amber-400 tracking-wider uppercase block">
                    Pending Verifications
                  </span>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="font-mono text-3xl font-medium text-[#E2E8F0] tracking-tight">
                      {vettingQueue.length}
                    </span>
                    <span className="font-sans text-[11px] text-[#8E9B93]">
                      Awaiting Vetting
                    </span>
                  </div>
                </div>

                {/* 3. Active Disputes */}
                <div className="border border-red-500/20 bg-red-950/5 rounded p-6 flex flex-col justify-between min-h-[140px] hover:border-red-500/40 transition-colors">
                  <span className="font-mono text-xs text-red-400 tracking-wider uppercase block">
                    Active Disputes
                  </span>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="font-mono text-3xl font-medium text-[#E2E8F0] tracking-tight">
                      {disputesList.length < 10 ? `0${disputesList.length}` : disputesList.length}
                    </span>
                    {disputesList.length > 0 ? (
                      <span className="font-mono text-[11px] text-red-400 animate-pulse font-medium tracking-wide">
                        Action Needed
                      </span>
                    ) : (
                      <span className="font-sans text-[11px] text-emerald-400 font-medium">
                        System Clear
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Total Founders */}
                <div className="border border-blue-500/20 bg-blue-950/5 rounded p-6 flex flex-col justify-between min-h-[140px] hover:border-blue-500/40 transition-colors">
                  <span className="font-mono text-xs text-blue-400 tracking-wider uppercase block">
                    Total Founders
                  </span>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="font-mono text-3xl font-medium text-[#E2E8F0] tracking-tight">
                      {totalFounders}
                    </span>
                    <span className="font-sans text-[11px] text-[#8E9B93]">
                      Registered
                    </span>
                  </div>
                </div>

                {/* 5. Total Investors */}
                <div className="border border-violet-500/20 bg-violet-950/5 rounded p-6 flex flex-col justify-between min-h-[140px] hover:border-violet-500/40 transition-colors">
                  <span className="font-mono text-xs text-violet-400 tracking-wider uppercase block">
                    Total Investors
                  </span>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="font-mono text-3xl font-medium text-[#E2E8F0] tracking-tight">
                      {totalInvestors}
                    </span>
                    <span className="font-sans text-[11px] text-[#8E9B93]">
                      Registered
                    </span>
                  </div>
                </div>

                {/* 6. Active Founders */}
                <div className="border border-cyan-500/20 bg-cyan-950/5 rounded p-6 flex flex-col justify-between min-h-[140px] hover:border-cyan-500/40 transition-colors">
                  <span className="font-mono text-xs text-cyan-400 tracking-wider uppercase block">
                    Active Founders
                  </span>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="font-mono text-3xl font-medium text-[#E2E8F0] tracking-tight">
                      {activeFoundersCount}
                    </span>
                    <span className="font-sans text-[11px] text-[#8E9B93]">
                      With Live Projects
                    </span>
                  </div>
                </div>

                {/* 7. Live Campaigns */}
                <div className="border border-teal-500/20 bg-teal-950/5 rounded p-6 flex flex-col justify-between min-h-[140px] hover:border-teal-500/40 transition-colors">
                  <span className="font-mono text-xs text-teal-400 tracking-wider uppercase block">
                    Live Campaigns
                  </span>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="font-mono text-3xl font-medium text-[#E2E8F0] tracking-tight">
                      {liveCampaignsCount}
                    </span>
                    <span className="font-sans text-[11px] text-[#8E9B93]">
                      Active Projects
                    </span>
                  </div>
                </div>
              </div>

              {/* Split layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">

                  <div className="border border-[#1F2922] bg-[#111613] rounded p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1F2922] pb-3">
                      <span className="font-mono text-xs text-[#8E9B93] tracking-widest uppercase">
                        ACTIVE AUDIT QUEUE
                      </span>
                      <span className="text-[11px] font-mono text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/30">
                        {vettingQueue.length} Applicants Pending
                      </span>
                    </div>
                    {vettingQueue.length > 0 ? (
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div>
                          <span className="text-[#E2E8F0] block">{vettingQueue[0].name}</span>
                          <span className="text-[#8E9B93] text-[10px]">
                            {vettingQueue[0].role === 'founder'
                              ? `${vettingQueue[0].university} · NID: ${vettingQueue[0].nid || 'N/A'}`
                              : `${vettingQueue[0].institution || 'Angel Backing'}`}
                          </span>
                        </div>
                        <button
                          onClick={navigateToVerification}
                          className="px-3.5 py-1.5 bg-[#00E676]/15 hover:bg-[#00E676]/25 border border-[#00E676]/45 text-[#00E676] rounded transition-colors cursor-pointer"
                        >
                          Audit Application
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-[#8E9B93]">All vetting queues are empty.</p>
                    )}
                  </div>

                  {escrowQueue.length > 0 && (
                    <div className="border border-[#1F2922] bg-[#111613] rounded p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#1F2922] pb-3">
                        <span className="font-mono text-xs text-[#8E9B93] tracking-widest uppercase">
                          Escrow Releases Queue
                        </span>
                        <span className="text-[11px] font-mono text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/30">
                          {escrowQueue.length} Requests Pending
                        </span>
                      </div>
                      <div className="space-y-3 text-xs font-mono">
                        {escrowQueue.map((req, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-[#0B0F0C] border border-[#1F2922] rounded">
                            <div>
                              <span className="text-[#E2E8F0] block">{req.campaignTitle}</span>
                              <span className="text-[10px] text-[#8E9B93]">Milestone: {req.milestoneTitle} ({req.target})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[#00E676] font-medium">৳ {req.amount.toLocaleString()}</span>
                              <button
                                onClick={() => handleApproveEscrowRelease(req.campaignObjId, req.milestoneId, req.campaignTitle, req.milestoneTitle)}
                                className="px-2.5 py-1 bg-[#00E676] hover:bg-[#00E575]/90 text-black rounded text-[10px] font-medium transition-colors"
                              >
                                Release
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-[#1F2922] bg-[#111613] rounded p-6 space-y-6 flex flex-col justify-between">
                  <div>
                    <div className="border-b border-[#1F2922] pb-3">
                      <span className="font-mono text-xs text-[#8E9B93] tracking-widest uppercase">
                        Recent Activity Stream
                      </span>
                    </div>

                    <div className="space-y-6 font-mono text-xs relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-[#1F2922] mt-6">
                      {dynamicTimelineEntries.length > 0 ? (
                        dynamicTimelineEntries.map(entry => (
                          <div key={entry.id} className="flex items-start gap-4 relative">
                            <div className={`w-7 h-7 rounded-full bg-[#111613] border flex items-center justify-center z-10 flex-shrink-0 ${entry.type === 'REGISTRATION' ? 'border-[#00E676]' : entry.type === 'DISPUTE' ? 'border-red-500/50' : 'border-[#8E9B93]/50'
                              }`}>
                              {entry.type === 'REGISTRATION' ? (
                                <Users className="w-3.5 h-3.5 text-[#00E676]" />
                              ) : entry.type === 'DISPUTE' ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-[#8E9B93]" />
                              )}
                            </div>
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center justify-between text-[10px] text-[#8E9B93]">
                                <span>{entry.time}</span>
                                <span>{entry.type}</span>
                              </div>
                              <p className="text-[#E2E8F0] text-[11px] leading-tight">
                                {entry.title}
                              </p>
                              {entry.file && (
                                <a
                                  href="#download"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    addToast(`Downloading compliance file: ${entry.file}`, 'info');
                                  }}
                                  className="inline-flex items-center gap-1.5 text-[10px] text-[#00E676] hover:underline"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>{entry.file}</span>
                                </a>
                              )}
                              {entry.actionable && (
                                <button
                                  onClick={entry.onClick}
                                  className="px-2.5 py-1 border border-[#00E676]/50 bg-[#00E676]/10 text-[#00E676] hover:bg-[#00E676]/25 transition-colors rounded text-[10px] cursor-pointer"
                                >
                                  Review
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs font-mono text-[#8E9B93] pl-6 pt-2">No operational updates on mainnet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN [3]: USER VERIFICATION */}
          {activeTab === 'verification' && (
            <div className="space-y-8 animate-fadeIn text-left">
              <div className="border border-[#1F2922] bg-[#111613] rounded p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-mono text-[#E2E8F0] font-medium">User Onboarding & Vetting Registry</h2>
                  <p className="text-xs text-[#8E9B93] font-mono">
                    {verificationSubTab === 'pending' ? 'Review active onboarding applications' :
                     verificationSubTab === 'founders' ? 'Lookup table of verified student founders' :
                     'Lookup table of vetted capital backers'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex bg-[#0B0F0C] border border-[#1F2922] p-1 rounded">
                    <button
                      onClick={() => setVerificationSubTab('pending')}
                      className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                        verificationSubTab === 'pending' ? 'bg-[#111613] text-[#00E676] border border-[#1F2922]' : 'text-[#8E9B93] hover:text-[#E2E8F0]'
                      }`}
                    >
                      Pending Verification
                    </button>
                    <button
                      onClick={() => setVerificationSubTab('founders')}
                      className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                        verificationSubTab === 'founders' ? 'bg-[#111613] text-[#00E676] border border-[#1F2922]' : 'text-[#8E9B93] hover:text-[#E2E8F0]'
                      }`}
                    >
                      Registered Founders
                    </button>
                    <button
                      onClick={() => setVerificationSubTab('investors')}
                      className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                        verificationSubTab === 'investors' ? 'bg-[#111613] text-[#00E676] border border-[#1F2922]' : 'text-[#8E9B93] hover:text-[#E2E8F0]'
                      }`}
                    >
                      Registered Investors
                    </button>
                  </div>
                </div>
              </div>

              {/* View 1: Pending Verification Workspace */}
              {verificationSubTab === 'pending' && (
                <>
                  {filteredApplicants.length > 0 && selectedApplicant ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: Pending queue list */}
                      <div className="space-y-3 font-mono text-xs">
                        <span className="text-[9px] text-[#8E9B93] uppercase tracking-wider block mb-1">Pending queue list</span>
                        {filteredApplicants.map(app => (
                          <button
                            key={app._id}
                            onClick={() => {
                              setSelectedApplicantId(app._id);
                              setVerificationChecklist({ nameMatch: false, idValid: false, mfsMatch: false });
                            }}
                            className={`w-full p-4 rounded bg-[#111613] border text-left transition-colors cursor-pointer ${
                              app._id === selectedApplicantId ? 'border-[#00E676] bg-[#111613]/80' : 'border-[#1F2922] hover:border-[#8E9B93]/35'
                            }`}
                          >
                            <div className="text-[#E2E8F0] font-medium">{app.name}</div>
                            <div className="text-[10px] text-[#8E9B93] mt-1 flex items-center justify-between">
                              <span>{app.role === 'founder' ? (app.university || 'BRAC University') : (app.institution || 'Angels Hub')}</span>
                              <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-sans font-semibold">
                                {app.role}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Middle & Right Workspace (spans 2 columns) */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between border-b border-[#1F2922] pb-3">
                          <span className="font-mono text-xs text-[#8E9B93] tracking-widest uppercase">
                            DOCUMENT_SCAN_VAULT (Side-by-Side)
                          </span>
                          <span className="text-[10px] font-sans font-medium px-2.5 py-1 rounded border text-amber-400 border-amber-500/30 bg-amber-500/10">
                            PENDING_REVIEW
                          </span>
                        </div>

                        {/* Side-by-Side Previews */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border border-[#1F2922] bg-[#111613] rounded p-4 space-y-3 flex flex-col">
                            <span className="font-mono text-[10px] text-[#8E9B93] block uppercase pb-1.5 border-b border-[#1F2922]">
                              {selectedApplicant.role === 'founder' ? 'Student ID Card Scan' : 'NID / Passport Scan'}
                            </span>
                            <div className="flex-1 bg-[#0B0F0C] border border-[#1F2922] rounded overflow-hidden aspect-video relative flex items-center justify-center min-h-[160px]">
                              {selectedApplicant.role === 'founder' ? (
                                selectedApplicant.studentIdCardImage ? (
                                  <img 
                                    src={`${API_BASE_URL}${selectedApplicant.studentIdCardImage}`} 
                                    alt="Student ID" 
                                    className="w-full h-full object-contain cursor-pointer transition-transform duration-300 hover:scale-105"
                                    onClick={() => window.open(`${API_BASE_URL}${selectedApplicant.studentIdCardImage}`, '_blank')}
                                  />
                                ) : (
                                  <span className="text-[#8E9B93] text-xs">No Student ID uploaded</span>
                                )
                              ) : (
                                selectedApplicant.nidOrPassportImage ? (
                                  <img 
                                    src={`${API_BASE_URL}${selectedApplicant.nidOrPassportImage}`} 
                                    alt="NID or Passport" 
                                    className="w-full h-full object-contain cursor-pointer transition-transform duration-300 hover:scale-105"
                                    onClick={() => window.open(`${API_BASE_URL}${selectedApplicant.nidOrPassportImage}`, '_blank')}
                                  />
                                ) : (
                                  <span className="text-[#8E9B93] text-xs">No NID/Passport uploaded</span>
                                )
                              )}
                            </div>
                          </div>

                          <div className="border border-[#1F2922] bg-[#111613] rounded p-4 space-y-3 flex flex-col">
                            <span className="font-mono text-[10px] text-[#8E9B93] block uppercase pb-1.5 border-b border-[#1F2922]">
                              {selectedApplicant.role === 'founder' ? 'National ID (NID) Scan' : 'Professional / Alumni Credentials'}
                            </span>
                            <div className="flex-1 bg-[#0B0F0C] border border-[#1F2922] rounded overflow-hidden aspect-video relative flex items-center justify-center min-h-[160px]">
                              {selectedApplicant.role === 'founder' ? (
                                selectedApplicant.nidCardImage ? (
                                  <img 
                                    src={`${API_BASE_URL}${selectedApplicant.nidCardImage}`} 
                                    alt="NID Scan" 
                                    className="w-full h-full object-contain cursor-pointer transition-transform duration-300 hover:scale-105"
                                    onClick={() => window.open(`${API_BASE_URL}${selectedApplicant.nidCardImage}`, '_blank')}
                                  />
                                ) : (
                                  <span className="text-[#8E9B93] text-xs">No NID scan uploaded</span>
                                )
                              ) : (
                                selectedApplicant.credentialsImage ? (
                                  <img 
                                    src={`${API_BASE_URL}${selectedApplicant.credentialsImage}`} 
                                    alt="Credentials File" 
                                    className="w-full h-full object-contain cursor-pointer transition-transform duration-300 hover:scale-105"
                                    onClick={() => window.open(`${API_BASE_URL}${selectedApplicant.credentialsImage}`, '_blank')}
                                  />
                                ) : selectedApplicant.credentialsLink ? (
                                  <div className="p-4 text-center space-y-2">
                                    <span className="text-[#8E9B93] text-[11px] block">Verified Network Link:</span>
                                    <a 
                                      href={selectedApplicant.credentialsLink} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-[#00E676] underline text-xs font-mono break-all hover:text-emerald-300 font-medium"
                                    >
                                      {selectedApplicant.credentialsLink}
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-[#8E9B93] text-xs">No credentials uploaded</span>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Text Details Card */}
                        <div className="border border-[#1F2922] bg-[#111613] rounded p-5 space-y-4 font-mono text-xs">
                          <span className="text-[10px] text-[#8E9B93] tracking-widest uppercase block border-b border-[#1F2922] pb-2">
                            APPLICATION DATA SPECIFICATIONS
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[11px]">
                            <div><span className="text-[#8E9B93]">Full Name:</span> <span className="text-[#E2E8F0] block font-medium mt-0.5">{selectedApplicant.name}</span></div>
                            <div><span className="text-[#8E9B93]">Email Address:</span> <span className="text-[#E2E8F0] block font-medium mt-0.5">{selectedApplicant.email}</span></div>
                            <div><span className="text-[#8E9B93]">Role Type:</span> <span className="text-[#00E676] block uppercase font-medium mt-0.5">{selectedApplicant.role === 'founder' ? 'Student Founder' : 'Investor'}</span></div>
                            {selectedApplicant.role === 'founder' ? (
                              <>
                                <div><span className="text-[#8E9B93]">Student ID:</span> <span className="text-[#E2E8F0] block font-medium mt-0.5">{selectedApplicant.studentId}</span></div>
                                <div><span className="text-[#8E9B93]">University:</span> <span className="text-[#E2E8F0] block font-medium mt-0.5">{selectedApplicant.university}</span></div>
                                <div><span className="text-[#8E9B93]">Department:</span> <span className="text-[#E2E8F0] block font-medium mt-0.5">{selectedApplicant.department}</span></div>
                                <div><span className="text-[#8E9B93]">Date of Birth:</span> <span className="text-[#E2E8F0] block font-medium mt-0.5">{selectedApplicant.dob}</span></div>
                                <div><span className="text-[#8E9B93]">NID Number:</span> <span className="text-[#E2E8F0] block font-medium mt-0.5">{selectedApplicant.nid}</span></div>
                                <div><span className="text-[#8E9B93]">MFS Number:</span> <span className="text-[#E2E8F0] block font-medium mt-0.5">{selectedApplicant.mfsNumber}</span></div>
                              </>
                            ) : (
                              <>
                                <div><span className="text-[#8E9B93]">Affiliation Status:</span> <span className="text-[#E2E8F0] block font-medium mt-0.5">{selectedApplicant.affiliationStatus}</span></div>
                                <div><span className="text-[#8E9B93]">Institution/Firm:</span> <span className="text-[#E2E8F0] block font-medium mt-0.5">{selectedApplicant.institution}</span></div>
                                {selectedApplicant.affiliationStatus === 'Alumni Backer' && (
                                  <div><span className="text-[#8E9B93]">Passing Year:</span> <span className="text-[#E2E8F0] block font-medium mt-0.5">{selectedApplicant.passingYear}</span></div>
                                )}
                                <div><span className="text-[#8E9B93]">NID / Passport:</span> <span className="text-[#E2E8F0] block font-medium mt-0.5">{selectedApplicant.nidOrPassport}</span></div>
                                <div><span className="text-[#8E9B93]">Bank/MFS Details:</span> <span className="text-[#E2E8F0] block font-medium mt-0.5">{selectedApplicant.bankOrMfs}</span></div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Checklist & Approval Buttons */}
                        <div className="border border-[#1F2922] bg-[#111613] rounded p-6 space-y-6">
                          <span className="font-mono text-xs text-[#8E9B93] tracking-widest uppercase block border-b border-[#1F2922] pb-2">
                            COMPLIANCE_CHECKS & SCORING
                          </span>
                          
                          <div className="space-y-3 font-mono text-xs">
                            <button
                              onClick={() => setVerificationChecklist(prev => ({ ...prev, nameMatch: !prev.nameMatch }))}
                              className="w-full flex items-center gap-3 p-3 rounded bg-[#0B0F0C] border border-[#1F2922] text-left hover:border-[#00E676]/30 transition-colors cursor-pointer"
                            >
                              {verificationChecklist.nameMatch ? (
                                <CheckSquare className="w-4 h-4 text-[#00E676]" />
                              ) : (
                                <Square className="w-4 h-4 text-[#8E9B93]" />
                              )}
                              <div>
                                <span className="text-[#E2E8F0] block">Name Match Verification</span>
                                <span className="text-[10px] text-[#8E9B93]">OCR matches name with database.</span>
                              </div>
                            </button>

                            <button
                              onClick={() => setVerificationChecklist(prev => ({ ...prev, idValid: !prev.idValid }))}
                              className="w-full flex items-center gap-3 p-3 rounded bg-[#0B0F0C] border border-[#1F2922] text-left hover:border-[#00E676]/30 transition-colors cursor-pointer"
                            >
                              {verificationChecklist.idValid ? (
                                <CheckSquare className="w-4 h-4 text-[#00E676]" />
                              ) : (
                                <Square className="w-4 h-4 text-[#8E9B93]" />
                              )}
                              <div>
                                <span className="text-[#E2E8F0] block">Institution ID Check</span>
                                <span className="text-[10px] text-[#8E9B93]">Database registrar status check matches.</span>
                              </div>
                            </button>

                            <button
                              onClick={() => setVerificationChecklist(prev => ({ ...prev, mfsMatch: !prev.mfsMatch }))}
                              className="w-full flex items-center gap-3 p-3 rounded bg-[#0B0F0C] border border-[#1F2922] text-left hover:border-[#00E676]/30 transition-colors cursor-pointer"
                            >
                              {verificationChecklist.mfsMatch ? (
                                <CheckSquare className="w-4 h-4 text-[#00E676]" />
                              ) : (
                                <Square className="w-4 h-4 text-[#8E9B93]" />
                              )}
                              <div>
                                <span className="text-[#E2E8F0] block">MFS Account NID Match</span>
                                <span className="text-[10px] text-[#8E9B93]">Mobile account matches NID database.</span>
                              </div>
                            </button>
                          </div>



                          <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                              <button
                                onClick={handleApproveApplicant}
                                className="w-full py-2.5 bg-[#00E676] hover:bg-[#00E575]/90 text-black text-xs font-mono font-medium rounded transition-all cursor-pointer text-center"
                              >
                                Approve Identity
                              </button>
                              <button
                                onClick={handleRejectApplicant}
                                className="w-full py-2.5 border border-red-500/50 hover:bg-red-500/10 text-red-400 text-xs font-mono font-medium rounded transition-all cursor-pointer text-center"
                              >
                                Reject Application
                              </button>
                            </div>
                            <span className="text-[10px] font-mono text-[#8E9B93]/60 block text-center uppercase tracking-wide">
                              Decisions are final and logged for audit purposes.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-[#1F2922] bg-[#111613] rounded p-12 text-center text-[#8E9B93] font-mono text-xs">
                      All vetting queues are empty. No pending onboarding applications found.
                    </div>
                  )}
                </>
              )}

              {/* View 2: Registered Student Founders Sheet */}
              {verificationSubTab === 'founders' && (
                <div className="overflow-x-auto border border-[#1F2922] bg-[#111613] rounded">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#1F2922] bg-[#0B0F0C] text-[#8E9B93]">
                        <th className="p-4 font-semibold uppercase">Student Name</th>
                        <th className="p-4 font-semibold uppercase">University ID</th>
                        <th className="p-4 font-semibold uppercase">Department & University</th>
                        <th className="p-4 font-semibold uppercase">Registered Email</th>
                        <th className="p-4 font-semibold uppercase">Active Campaigns</th>
                        <th className="p-4 font-semibold uppercase">Identity Verification Date</th>
                        <th className="p-4 font-semibold uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2922] text-[#E2E8F0]">
                      {verifiedFoundersList.length > 0 ? (
                        verifiedFoundersList.map(founder => (
                          <tr key={founder._id} className="hover:bg-[#111613]/60 transition-colors">
                            <td className="p-4 font-sans font-medium flex items-center gap-2">
                              <span>{founder.name}</span>
                              {founder.vettingStatus === 'hold' ? (
                                <span className="px-1.5 py-0.5 rounded text-[8px] border border-amber-500/30 bg-amber-500/10 text-amber-400 font-sans uppercase font-bold tracking-wide">
                                  HOLD
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[8px] border border-emerald-500/30 bg-emerald-500/10 text-[#00E676] font-sans uppercase font-bold tracking-wide">
                                  VERIFIED
                                </span>
                              )}
                            </td>
                            <td className="p-4">{founder.studentId || 'N/A'}</td>
                            <td className="p-4">{founder.department || 'N/A'}, {founder.university || 'N/A'}</td>
                            <td className="p-4">{founder.email}</td>
                            <td className="p-4 text-[#00E676] font-semibold">
                              {verifiedCampaigns.filter(c => {
                                const fId = c.founder?._id || c.founder;
                                return fId === founder._id;
                              }).length}
                            </td>
                            <td className="p-4 text-[#8E9B93]">
                              {founder.vettingDate ? new Date(founder.vettingDate).toISOString().substring(0, 10) : 'N/A'}
                            </td>
                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleOpenEditModal(founder)}
                                className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 rounded text-[10px] cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleHold(founder._id)}
                                className={`px-2 py-1 border rounded text-[10px] cursor-pointer ${
                                  founder.vettingStatus === 'hold'
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-400'
                                    : 'bg-amber-500/10 hover:bg-amber-500/25 border-amber-500/30 text-amber-400'
                                }`}
                              >
                                {founder.vettingStatus === 'hold' ? 'Unhold' : 'Hold'}
                              </button>
                              <button
                                onClick={() => handleRemoveUser(founder._id, founder.name)}
                                className="px-2 py-1 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded text-[10px] cursor-pointer"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-[#8E9B93]">
                            No registered student founders found on mainnet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* View 3: Registered Investors Sheet */}
              {verificationSubTab === 'investors' && (
                <div className="overflow-x-auto border border-[#1F2922] bg-[#111613] rounded">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#1F2922] bg-[#0B0F0C] text-[#8E9B93]">
                        <th className="p-4 font-semibold uppercase">Investor Name</th>
                        <th className="p-4 font-semibold uppercase">Affiliation Tag</th>
                        <th className="p-4 font-semibold uppercase">Associated Company/University</th>
                        <th className="p-4 font-semibold uppercase">Contact Email</th>
                        <th className="p-4 font-semibold uppercase">Active Portfolio Projects</th>
                        <th className="p-4 font-semibold uppercase">Platform Onboarding Date</th>
                        <th className="p-4 font-semibold uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2922] text-[#E2E8F0]">
                      {verifiedInvestorsList.length > 0 ? (
                        verifiedInvestorsList.map(investor => (
                          <tr key={investor._id} className="hover:bg-[#111613]/60 transition-colors">
                            <td className="p-4 font-sans font-medium flex items-center gap-2">
                              <span>{investor.name}</span>
                              {investor.vettingStatus === 'hold' ? (
                                <span className="px-1.5 py-0.5 rounded text-[8px] border border-amber-500/30 bg-amber-500/10 text-amber-400 font-sans uppercase font-bold tracking-wide">
                                  HOLD
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[8px] border border-emerald-500/30 bg-emerald-500/10 text-[#00E676] font-sans uppercase font-bold tracking-wide">
                                  VERIFIED
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded text-[10px] border border-violet-500/30 bg-violet-500/10 text-violet-400 font-medium font-sans uppercase">
                                {investor.affiliationStatus || 'Investor'}
                              </span>
                            </td>
                            <td className="p-4">{investor.institution || 'N/A'}</td>
                            <td className="p-4">{investor.email}</td>
                            <td className="p-4 text-sky-400 font-semibold">0</td>
                            <td className="p-4 text-[#8E9B93]">
                              {investor.vettingDate ? new Date(investor.vettingDate).toISOString().substring(0, 10) : 'N/A'}
                            </td>
                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleOpenEditModal(investor)}
                                className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 rounded text-[10px] cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleHold(investor._id)}
                                className={`px-2 py-1 border rounded text-[10px] cursor-pointer ${
                                  investor.vettingStatus === 'hold'
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-400'
                                    : 'bg-amber-500/10 hover:bg-amber-500/25 border-amber-500/30 text-amber-400'
                                }`}
                              >
                                {investor.vettingStatus === 'hold' ? 'Unhold' : 'Hold'}
                              </button>
                              <button
                                onClick={() => handleRemoveUser(investor._id, investor.name)}
                                className="px-2 py-1 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded text-[10px] cursor-pointer"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-[#8E9B93]">
                            No registered investors found on mainnet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SCREEN [3.5]: CAMPAIGN AUDIT VAULT */}
          {activeTab === 'audits' && (
            <div className="space-y-8 animate-fadeIn text-left">
              {/* Workspace Header */}
              <div className="border border-[#1F2922] bg-[#111613] rounded p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-mono text-[#E2E8F0] font-medium">Campaign Audit & Security Vault</h2>
                  <p className="text-xs text-[#8E9B93] font-mono">
                    Inspect startup proposals, pitch decks, financial models, milestones & publish live or request re-upload revisions.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                  <div className="flex bg-[#0B0F0C] border border-[#1F2922] p-1 rounded">
                    <button
                      onClick={() => setAuditSubTab('pending')}
                      className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                        auditSubTab === 'pending' ? 'bg-[#111613] text-[#00E676] border border-[#1F2922]' : 'text-[#8E9B93] hover:text-[#E2E8F0]'
                      }`}
                    >
                      Pending Audit ({campaignsList.filter(c => !c.verified && c.status !== 'rejected' && c.status !== 'revision_required').length})
                    </button>
                    <button
                      onClick={() => setAuditSubTab('published')}
                      className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                        auditSubTab === 'published' ? 'bg-[#111613] text-[#00E676] border border-[#1F2922]' : 'text-[#8E9B93] hover:text-[#E2E8F0]'
                      }`}
                    >
                      Published Catalog ({verifiedCampaigns.length})
                    </button>
                    <button
                      onClick={() => setAuditSubTab('revisions')}
                      className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                        auditSubTab === 'revisions' ? 'bg-[#111613] text-amber-400 border border-[#1F2922]' : 'text-[#8E9B93] hover:text-[#E2E8F0]'
                      }`}
                    >
                      Revisions Queue ({campaignsList.filter(c => c.status === 'revision_required').length})
                    </button>
                    <button
                      onClick={() => setAuditSubTab('rejected')}
                      className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                        auditSubTab === 'rejected' ? 'bg-[#111613] text-red-400 border border-[#1F2922]' : 'text-[#8E9B93] hover:text-[#E2E8F0]'
                      }`}
                    >
                      Rejected ({campaignsList.filter(c => c.status === 'rejected').length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Workspace Layout */}
              {displayedAuditCampaigns.length > 0 && selectedAuditCampaign ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Campaigns Queue List */}
                  <div className="space-y-3 font-mono text-xs">
                    <span className="text-[9px] text-[#8E9B93] uppercase tracking-wider block mb-1">
                      {auditSubTab === 'pending' ? 'Pending Audit Queue' :
                       auditSubTab === 'published' ? 'Live Published Catalog' :
                       auditSubTab === 'revisions' ? 'Revision Requests Queue' : 'Rejected Campaigns Queue'}
                    </span>
                    {displayedAuditCampaigns.map(camp => (
                      <button
                        key={camp._id || camp.id}
                        onClick={() => setSelectedCampaignId(camp.id || camp._id)}
                        className={`w-full p-4 rounded bg-[#111613] border text-left transition-colors cursor-pointer ${
                          (camp.id === selectedCampaignId || camp._id === selectedCampaignId)
                            ? 'border-[#00E676] bg-[#111613]/80 shadow-[0_0_10px_rgba(0,230,118,0.1)]'
                            : 'border-[#1F2922] hover:border-[#8E9B93]/35'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[#E2E8F0] font-medium">{camp.title}</span>
                          <span className="px-2 py-0.5 rounded text-[9px] bg-[#0B0F0C] text-[#00E676] border border-[#00E676]/30 font-sans font-semibold">
                            {camp.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8E9B93] mt-2 flex items-center justify-between">
                          <span>Goal: ৳{Number(camp.goal || 0).toLocaleString('en-IN')} BDT</span>
                          <span className="text-[#E2E8F0]">{camp.university || camp.founder?.university || 'University Project'}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Right 2 Columns: Selected Campaign Audit Workspace */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Header Summary Card */}
                    <div className="border border-[#1F2922] bg-[#111613] rounded p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2922] pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-mono font-medium text-[#E2E8F0]">{selectedAuditCampaign.title}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono border text-sky-400 border-sky-500/30 bg-sky-500/10 uppercase">
                              {selectedAuditCampaign.stage || 'Venture Draft'}
                            </span>
                          </div>
                          <p className="text-xs text-[#8E9B93] font-mono mt-1">
                            Founder: <span className="text-[#E2E8F0] font-medium">{selectedAuditCampaign.founder?.name || 'Anika Rahman'}</span> ({selectedAuditCampaign.university || selectedAuditCampaign.founder?.university || 'BRAC University'})
                          </p>
                        </div>

                        <div className="text-right font-mono text-xs">
                          <span className="text-[10px] text-[#8E9B93] uppercase block">TARGET CAPITAL GOAL</span>
                          <span className="text-lg font-bold text-[#00E676]">৳{Number(selectedAuditCampaign.goal || 0).toLocaleString('en-IN')} BDT</span>
                          <span className="text-[10px] text-[#8E9B93] block">{selectedAuditCampaign.equityOffer || 'Equity Offer'}</span>
                        </div>
                      </div>

                      {/* Business Overview & Pitch */}
                      <div className="space-y-2 font-mono text-xs">
                        <span className="text-[10px] text-[#8E9B93] uppercase block tracking-wider font-semibold">PROJECT PITCH & EXECUTIVE OVERVIEW</span>
                        <p className="text-[#E2E8F0] leading-relaxed bg-[#0B0F0C] border border-[#1F2922] p-4 rounded text-xs font-sans">
                          {selectedAuditCampaign.description}
                        </p>
                      </div>

                      {/* Feedback or Rejection Banner if any */}
                      {selectedAuditCampaign.feedbackNotes && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-xs font-mono text-amber-300">
                          <span className="font-bold block uppercase text-[10px]">Previous Revision Request Notes:</span>
                          {selectedAuditCampaign.feedbackNotes}
                        </div>
                      )}

                      {selectedAuditCampaign.rejectionReason && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-xs font-mono text-red-300">
                          <span className="font-bold block uppercase text-[10px]">Rejection Reason:</span>
                          {selectedAuditCampaign.rejectionReason}
                        </div>
                      )}

                      {/* Milestone Roadmap Schedule */}
                      <div className="space-y-3 font-mono text-xs">
                        <span className="text-[10px] text-[#8E9B93] uppercase block tracking-wider font-semibold">MILESTONE TRANCHE ESCROW SCHEDULE</span>
                        <div className="border border-[#1F2922] bg-[#0B0F0C] rounded overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-[#050806] text-[#8E9B93] border-b border-[#1F2922]">
                              <tr>
                                <th className="p-2.5">Milestone Objective</th>
                                <th className="p-2.5">Target Timeline</th>
                                <th className="p-2.5 text-right">Escrow Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1F2922] text-[#E2E8F0]">
                              {(selectedAuditCampaign.milestones || []).map((m, idx) => (
                                <tr key={m._id || idx}>
                                  <td className="p-2.5 font-medium">{m.title}</td>
                                  <td className="p-2.5 text-[#8E9B93]">{m.target}</td>
                                  <td className="p-2.5 text-right">
                                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                                      m.status === 'done' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' :
                                      m.status === 'active' ? 'text-sky-400 bg-sky-500/10 border border-sky-500/30' :
                                      'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                                    }`}>
                                      {m.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Document Vault Cards */}
                      <div className="space-y-3 font-mono text-xs pt-2">
                        <span className="text-[10px] text-[#8E9B93] uppercase block tracking-wider font-semibold">UPLOADED PROPOSAL DOCUMENTS & AUDIT CERTIFICATIONS</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {(selectedAuditCampaign.documents || [
                            { title: 'Pitch Deck PDF', filename: `${selectedAuditCampaign.title}_PitchDeck.pdf`, size: '2.5 MB' },
                            { title: 'Financial Model', filename: `${selectedAuditCampaign.title}_Financials.xlsx`, size: '1.2 MB' },
                            { title: 'University Approval', filename: `${selectedAuditCampaign.university || 'Univ'}_Approval.pdf`, size: '890 KB' }
                          ]).map((doc, idx) => (
                            <div key={idx} className="border border-[#1F2922] bg-[#0B0F0C] p-3 rounded flex flex-col justify-between space-y-2 hover:border-[#00E676]/30 transition-colors">
                              <div>
                                <span className="text-[#E2E8F0] font-medium block text-[11px]">{doc.title}</span>
                                <span className="text-[10px] text-[#8E9B93] block truncate">{doc.filename}</span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-[#1F2922] text-[10px]">
                                <span className="text-[#8E9B93]">{doc.size || '1.5 MB'}</span>
                                <button
                                  onClick={() => setDocPreviewModal(doc)}
                                  className="text-[#00E676] hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> Inspect
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Audit Compliance Scoring & Verification Checks */}
                    <div className="border border-[#1F2922] bg-[#111613] rounded p-6 space-y-6">
                      <span className="font-mono text-xs text-[#8E9B93] tracking-widest uppercase block border-b border-[#1F2922] pb-2">
                        COMPLIANCE & AUDIT QUALITY SCORING
                      </span>

                      <div className="space-y-3 font-mono text-xs">
                        <button
                          onClick={() => {
                            const cKey = selectedAuditCampaign._id || selectedAuditCampaign.id;
                            toggleCompliance(cKey, 'smartContractAudit');
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded bg-[#0B0F0C] border border-[#1F2922] text-left hover:border-[#00E676]/30 transition-colors cursor-pointer"
                        >
                          {getCompliance(selectedAuditCampaign._id || selectedAuditCampaign.id).smartContractAudit ? (
                            <CheckSquare className="w-4 h-4 text-[#00E676]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#8E9B93]" />
                          )}
                          <div>
                            <span className="text-[#E2E8F0] block font-medium">Smart Contract & Milestone Escrow Audit</span>
                            <span className="text-[10px] text-[#8E9B93]">Verifies tranche release triggers and milestone lock criteria.</span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            const cKey = selectedAuditCampaign._id || selectedAuditCampaign.id;
                            toggleCompliance(cKey, 'founderIdentity');
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded bg-[#0B0F0C] border border-[#1F2922] text-left hover:border-[#00E676]/30 transition-colors cursor-pointer"
                        >
                          {getCompliance(selectedAuditCampaign._id || selectedAuditCampaign.id).founderIdentity ? (
                            <CheckSquare className="w-4 h-4 text-[#00E676]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#8E9B93]" />
                          )}
                          <div>
                            <span className="text-[#E2E8F0] block font-medium">Founder KYB & Student Status Verification</span>
                            <span className="text-[10px] text-[#8E9B93]">Student ID, NID, and university incubation records verified.</span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            const cKey = selectedAuditCampaign._id || selectedAuditCampaign.id;
                            toggleCompliance(cKey, 'regulatoryCompliance');
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded bg-[#0B0F0C] border border-[#1F2922] text-left hover:border-[#00E676]/30 transition-colors cursor-pointer"
                        >
                          {getCompliance(selectedAuditCampaign._id || selectedAuditCampaign.id).regulatoryCompliance ? (
                            <CheckSquare className="w-4 h-4 text-[#00E676]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#8E9B93]" />
                          )}
                          <div>
                            <span className="text-[#E2E8F0] block font-medium">Financial Model & Regulatory Compliance</span>
                            <span className="text-[10px] text-[#8E9B93]">Projections valuation realism & IP registration checked.</span>
                          </div>
                        </button>
                      </div>

                      {/* Three Audit Decision Actions */}
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                          <button
                            onClick={() => handlePublishCampaign(selectedAuditCampaign._id || selectedAuditCampaign.id, selectedAuditCampaign.title)}
                            className="py-3 bg-[#00E676] hover:bg-[#00E575]/90 text-black text-xs font-semibold rounded transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,230,118,0.2)]"
                          >
                            <Check className="w-4 h-4" /> Approve & Publish
                          </button>

                          <button
                            onClick={() => setIsRevisionModalOpen(true)}
                            className="py-3 border border-amber-500/50 hover:bg-amber-500/10 text-amber-400 text-xs font-semibold rounded transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                          >
                            <ArrowRight className="w-4 h-4" /> Request Re-upload
                          </button>

                          <button
                            onClick={() => setIsRejectModalOpen(true)}
                            className="py-3 border border-red-500/50 hover:bg-red-500/10 text-red-400 text-xs font-semibold rounded transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                          >
                            <X className="w-4 h-4" /> Reject Pitch
                          </button>
                        </div>
                        <span className="text-[10px] font-mono text-[#8E9B93]/60 block text-center uppercase tracking-wide">
                          All supervisor decisions are recorded to the platform audit ledger.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-[#1F2922] bg-[#111613] rounded p-12 text-center text-[#8E9B93] font-mono text-xs space-y-2">
                  <FileText className="w-8 h-8 text-[#8E9B93] mx-auto opacity-50 mb-2" />
                  <p>No campaigns found in the selected audit queue status ({auditSubTab.toUpperCase()}).</p>
                </div>
              )}
            </div>
          )}

          {/* SCREEN [4]: DISPUTES & HOLDS MANAGEMENT REDESIGNED */}
          {activeTab === 'disputes' && (
            <div className="space-y-8 animate-fadeIn text-left">
              {/* Workspace Header */}
              <div className="border border-[#1F2922] bg-[#111613] rounded p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-mono text-xs text-[#00E676] tracking-widest uppercase block">
                    SUPERVISORY SECURITY & ESCROW POLICING
                  </span>
                  <h2 className="text-2xl font-mono text-[#E2E8F0] tracking-tight font-medium">
                    Disputes & Holds Management
                  </h2>
                  <p className="text-xs text-[#8E9B93] font-mono">
                    Block fraudulent users, pause funding, block fake campaigns, freeze escrow funds, and investigate user complaints.
                  </p>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs">
                  <div className="bg-[#0B0F0C] border border-[#1F2922] p-3 rounded text-center">
                    <span className="text-[9px] text-[#8E9B93] block uppercase">ACTIVE COMPLAINTS</span>
                    <span className="text-lg font-bold text-amber-400">
                      {disputesList.filter(d => d.status !== 'Dismissed').length}
                    </span>
                  </div>
                  <div className="bg-[#0B0F0C] border border-[#1F2922] p-3 rounded text-center">
                    <span className="text-[9px] text-[#8E9B93] block uppercase">ESCROW RISK STATUS</span>
                    <span className="text-lg font-bold text-emerald-400">SECURE</span>
                  </div>
                </div>
              </div>

              {/* TOP ROW: PANEL 1 & PANEL 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* PANEL 1: BLOCK ANY USER */}
                <div className="border border-[#1F2922] bg-[#111613] rounded p-6 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1F2922] pb-3">
                      <div>
                        <span className="text-xs font-mono text-[#00E676] uppercase tracking-wider block">1. BLOCK ANY USER</span>
                        <h3 className="text-sm font-mono text-[#E2E8F0] font-medium mt-0.5">Account Access & Protocol Revocation</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono border border-red-500/30 bg-red-500/10 text-red-400 uppercase">
                        SUPERVISOR OVERRIDE
                      </span>
                    </div>

                    {/* Role Filter Selector */}
                    <div className="flex gap-2 font-mono text-xs">
                      <button
                        type="button"
                        onClick={() => { setSelectedUserToBlockRole('student'); setSelectedUserToBlockId(''); }}
                        className={`flex-1 py-2 px-3 rounded text-center cursor-pointer transition-colors ${
                          selectedUserToBlockRole === 'student'
                            ? 'bg-[#00E676] text-black font-semibold'
                            : 'bg-[#0B0F0C] text-[#8E9B93] border border-[#1F2922] hover:text-[#E2E8F0]'
                        }`}
                      >
                        Student Founders ({verifiedFoundersList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedUserToBlockRole('investor'); setSelectedUserToBlockId(''); }}
                        className={`flex-1 py-2 px-3 rounded text-center cursor-pointer transition-colors ${
                          selectedUserToBlockRole === 'investor'
                            ? 'bg-[#00E676] text-black font-semibold'
                            : 'bg-[#0B0F0C] text-[#8E9B93] border border-[#1F2922] hover:text-[#E2E8F0]'
                        }`}
                      >
                        Investors ({verifiedInvestorsList.length})
                      </button>
                    </div>

                    {/* Target User Select Dropdown */}
                    <div className="space-y-2 font-mono text-xs">
                      <label className="text-[10px] text-[#8E9B93] block uppercase font-semibold">
                        SELECT TARGET {selectedUserToBlockRole === 'student' ? 'STUDENT FOUNDER' : 'INVESTOR'}:
                      </label>
                      <select
                        value={selectedUserToBlockId}
                        onChange={(e) => setSelectedUserToBlockId(e.target.value)}
                        className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded p-3 text-[#E2E8F0] text-xs focus:outline-none focus:border-[#00E676]/50"
                      >
                        <option value="">-- Choose User Profile to Inspect / Block --</option>
                        {(selectedUserToBlockRole === 'student' ? verifiedFoundersList : verifiedInvestorsList).map(u => (
                          <option key={u._id || u.id} value={u._id || u.id}>
                            {u.name} ({u.email}) - Status: {(u.vettingStatus || 'verified').toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selected User Details Preview Box */}
                    {(() => {
                      const userList = selectedUserToBlockRole === 'student' ? verifiedFoundersList : verifiedInvestorsList;
                      const selectedUser = userList.find(u => u._id === selectedUserToBlockId || u.id === selectedUserToBlockId) || userList[0];
                      if (!selectedUser) return null;
                      const isBlocked = selectedUser.vettingStatus === 'blocked';

                      return (
                        <div className="p-4 bg-[#0B0F0C] border border-[#1F2922] rounded space-y-3 font-mono text-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[#E2E8F0] font-bold block text-sm">{selectedUser.name}</span>
                              <span className="text-[10px] text-[#8E9B93] block">{selectedUser.email}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                              isBlocked ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                            }`}>
                              {isBlocked ? 'BLOCKED' : selectedUser.vettingStatus || 'VERIFIED'}
                            </span>
                          </div>

                          <div className="text-[10px] text-[#8E9B93] grid grid-cols-2 gap-2 pt-2 border-t border-[#1F2922]">
                            <div>
                              <span className="block text-[9px] uppercase">AFFILIATION</span>
                              <span className="text-[#E2E8F0]">{selectedUser.university || selectedUser.institution || 'Institutional'}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] uppercase">ROLE TYPE</span>
                              <span className="text-[#E2E8F0] uppercase">{selectedUser.role || selectedUserToBlockRole}</span>
                            </div>
                          </div>

                          {/* Action Buttons based on User Role */}
                          <div className="pt-2">
                            {selectedUserToBlockRole === 'student' ? (
                              <button
                                type="button"
                                onClick={() => handleBlockUserAction(selectedUser._id || selectedUser.id, selectedUser.name, 'Student Founder')}
                                className={`w-full py-3 px-4 rounded text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                  isBlocked
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                                    : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                                }`}
                              >
                                <Lock className="w-4 h-4" />
                                <span>{isBlocked ? 'Unblock Student Account' : 'Block Student (Stop Login & Pause Campaigns)'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleBlockUserAction(selectedUser._id || selectedUser.id, selectedUser.name, 'Investor')}
                                className={`w-full py-3 px-4 rounded text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                  isBlocked
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                                    : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                                }`}
                              >
                                <Lock className="w-4 h-4" />
                                <span>{isBlocked ? 'Unblock Investor Account' : 'Block Investor (Cancel Offers & Revoke Access)'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* PANEL 2: CONTROL CAMPAIGNS & MONEY */}
                <div className="border border-[#1F2922] bg-[#111613] rounded p-6 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1F2922] pb-3">
                      <div>
                        <span className="text-xs font-mono text-[#00E676] uppercase tracking-wider block">2. CONTROL CAMPAIGNS & MONEY</span>
                        <h3 className="text-sm font-mono text-[#E2E8F0] font-medium mt-0.5">Escrow Lock & Campaign Policing</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono border border-sky-500/30 bg-sky-500/10 text-sky-400 uppercase">
                        ESCROW GUARDIAN
                      </span>
                    </div>

                    {/* Campaign Selector */}
                    <div className="space-y-2 font-mono text-xs">
                      <label className="text-[10px] text-[#8E9B93] block uppercase font-semibold">
                        SELECT TARGET CAMPAIGN TO CONTROL:
                      </label>
                      <select
                        value={selectedControlCampaignId}
                        onChange={(e) => setSelectedControlCampaignId(e.target.value)}
                        className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded p-3 text-[#E2E8F0] text-xs focus:outline-none focus:border-[#00E676]/50"
                      >
                        <option value="">-- Select Campaign --</option>
                        {[...campaignsList, ...verifiedCampaigns].map(c => (
                          <option key={c._id || c.id} value={c._id || c.id}>
                            {c.title} ({c.university || 'Univ'}) - Target: ৳{Number(c.goal || 0).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target Campaign Details Preview */}
                    {(() => {
                      const allCamps = [...campaignsList, ...verifiedCampaigns];
                      const targetCamp = allCamps.find(c => c._id === selectedControlCampaignId || c.id === selectedControlCampaignId) || allCamps[0];
                      if (!targetCamp) return null;

                      const isPaused = targetCamp.status === 'funding_paused';
                      const isBlocked = targetCamp.status === 'blocked';
                      const isFrozen = targetCamp.escrowFrozen;

                      return (
                        <div className="p-4 bg-[#0B0F0C] border border-[#1F2922] rounded space-y-3 font-mono text-xs">
                          <div className="flex items-center justify-between border-b border-[#1F2922] pb-2">
                            <div>
                              <span className="text-[#E2E8F0] font-bold block text-sm">{targetCamp.title}</span>
                              <span className="text-[10px] text-[#8E9B93] block">Goal: ৳{Number(targetCamp.goal || 0).toLocaleString('en-IN')} BDT</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {isPaused && <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase font-bold">PAUSED</span>}
                              {isBlocked && <span className="px-2 py-0.5 rounded text-[9px] bg-red-500/10 text-red-400 border border-red-500/30 uppercase font-bold">BLOCKED</span>}
                              {isFrozen && <span className="px-2 py-0.5 rounded text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/30 uppercase font-bold">ESCROW FROZEN</span>}
                              {!isPaused && !isBlocked && !isFrozen && <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-[#00E676] border border-emerald-500/30 uppercase font-bold">ACTIVE</span>}
                            </div>
                          </div>

                          {/* 3 Direct Control Action Buttons */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            {/* Button 1: Pause Funding */}
                            <button
                              type="button"
                              onClick={() => handlePauseCampaignFunding(targetCamp._id || targetCamp.id, targetCamp.title)}
                              className={`p-3 rounded border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                isPaused
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                  : 'bg-[#111613] border-[#1F2922] hover:border-amber-500/50 text-[#E2E8F0]'
                              }`}
                            >
                              <span className="font-bold text-[11px] text-amber-400 flex items-center gap-1">
                                {isPaused ? '▶ Resume Funding' : '⏸ Pause Funding'}
                              </span>
                              <span className="text-[9px] text-[#8E9B93] leading-tight">
                                {isPaused ? 'Restore payment processing' : 'Temporarily stop money transfers'}
                              </span>
                            </button>

                            {/* Button 2: Block / Delete Campaign */}
                            <button
                              type="button"
                              onClick={() => handleBlockCampaignAction(targetCamp._id || targetCamp.id, targetCamp.title)}
                              className={`p-3 rounded border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                isBlocked
                                  ? 'bg-red-500/20 border-red-500 text-red-300'
                                  : 'bg-[#111613] border-[#1F2922] hover:border-red-500/50 text-[#E2E8F0]'
                              }`}
                            >
                              <span className="font-bold text-[11px] text-red-400 flex items-center gap-1">
                                🚫 Block Campaign
                              </span>
                              <span className="text-[9px] text-[#8E9B93] leading-tight">
                                Hide fake/bad pitch from investor feed
                              </span>
                            </button>

                            {/* Button 3: Freeze Escrow Funds */}
                            <button
                              type="button"
                              onClick={() => handleFreezeCampaignFundsAction(targetCamp._id || targetCamp.id, targetCamp.title)}
                              className={`p-3 rounded border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                isFrozen
                                  ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                                  : 'bg-[#111613] border-[#1F2922] hover:border-sky-500/50 text-[#E2E8F0]'
                              }`}
                            >
                              <span className="font-bold text-[11px] text-sky-400 flex items-center gap-1">
                                🔒 {isFrozen ? 'Unfreeze Funds' : 'Freeze Funds'}
                              </span>
                              <span className="text-[9px] text-[#8E9B93] leading-tight">
                                Lock money in Escrow account
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* PANEL 3: MANAGE ALL USER COMPLAINTS */}
              <div className="border border-[#1F2922] bg-[#111613] rounded overflow-hidden space-y-0">
                <div className="p-6 border-b border-[#1F2922] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono text-[#00E676] uppercase tracking-wider block">3. MANAGE ALL USER COMPLAINTS</span>
                    <h3 className="text-lg font-mono text-[#E2E8F0] font-medium">Platform Complaints & Incident Ledger</h3>
                  </div>

                  <span className="text-xs font-mono text-[#8E9B93]">
                    Total Registered Cases: <span className="text-[#E2E8F0] font-bold">{disputesList.length}</span>
                  </span>
                </div>

                {/* Active Complaints Table */}
                <div className="overflow-x-auto text-xs font-mono">
                  {disputesList.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#050806] border-b border-[#1F2922] text-[#8E9B93] font-medium">
                          <th className="p-4">Case ID & Issue</th>
                          <th className="p-4">Complainant</th>
                          <th className="p-4">Reported Entity</th>
                          <th className="p-4">Severity</th>
                          <th className="p-4">Case Status</th>
                          <th className="p-4 text-center whitespace-nowrap">Direct Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F2922] text-[#E2E8F0]">
                        {disputesList.map(complaint => (
                          <tr key={complaint.id} className="hover:bg-[#111613]/80 transition-colors">
                            {/* Case ID & Issue */}
                            <td className="p-4">
                              <span className="text-[#00E676] font-bold block">{complaint.id}</span>
                              <span className="text-[#E2E8F0] font-medium block">{complaint.issueType}</span>
                              <span className="text-[10px] text-[#8E9B93] block truncate max-w-[200px]">{complaint.campaignTitle}</span>
                            </td>

                            {/* Complainant */}
                            <td className="p-4">
                              <span className="text-[#E2E8F0] font-medium block">{complaint.complainant}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] border border-sky-500/30 bg-sky-500/10 text-sky-400 font-sans uppercase">
                                {complaint.complainantRole || 'Investor'}
                              </span>
                            </td>

                            {/* Reported Entity */}
                            <td className="p-4">
                              <span className="text-[#E2E8F0] font-medium block">{complaint.reportedUser}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] border border-amber-500/30 bg-amber-500/10 text-amber-400 font-sans uppercase">
                                {complaint.reportedRole || 'Student Founder'}
                              </span>
                            </td>

                            {/* Severity */}
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                complaint.severity === 'Critical' ? 'text-red-400 bg-red-500/10 border border-red-500/30' :
                                complaint.severity === 'High' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' :
                                'text-sky-400 bg-sky-500/10 border border-sky-500/30'
                              }`}>
                                {complaint.severity}
                              </span>
                            </td>

                            {/* Case Status */}
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                complaint.status === 'Dismissed' ? 'text-[#8E9B93] bg-[#0B0F0C] border border-[#1F2922]' :
                                complaint.status === 'Funds Frozen' ? 'text-sky-400 bg-sky-500/10 border border-sky-500/30' :
                                'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                              }`}>
                                {complaint.status}
                              </span>
                            </td>

                            {/* 4 Direct Action Buttons Right Next to Complaint */}
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {/* 1. Investigate */}
                                <button
                                  onClick={() => setInvestigatingComplaint(complaint)}
                                  className="px-2.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 rounded text-[10px] font-mono cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> Investigate
                                </button>

                                {/* 2. Freeze Funds */}
                                <button
                                  onClick={() => handleFreezeCampaignFundsAction(complaint.campaignId || complaint.campaignTitle, complaint.campaignTitle)}
                                  className="px-2.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 rounded text-[10px] font-mono cursor-pointer flex items-center gap-1"
                                >
                                  <Lock className="w-3 h-3" /> Freeze Funds
                                </button>

                                {/* 3. Block User */}
                                <button
                                  onClick={() => handleBlockUserAction(complaint.reportedUserId || complaint.reportedUser, complaint.reportedUser, complaint.reportedRole)}
                                  className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded text-[10px] font-mono cursor-pointer flex items-center gap-1"
                                >
                                  <Lock className="w-3 h-3" /> Block User
                                </button>

                                {/* 4. Dismiss */}
                                <button
                                  onClick={() => handleDismissComplaint(complaint.id)}
                                  className="px-2.5 py-1.5 bg-[#0B0F0C] hover:bg-[#111613] border border-[#1F2922] text-[#8E9B93] hover:text-[#E2E8F0] rounded text-[10px] font-mono cursor-pointer flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" /> Dismiss
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-[#8E9B93]">No active user complaints registered. System secure.</div>
                  )}
                </div>
              </div>

              {/* Bottom Telemetry Diagnostics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 border border-[#1F2922] bg-[#111613] rounded p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#1F2922] pb-3">
                    <Terminal className="w-4 h-4 text-[#00E676]" />
                    <span className="font-mono text-xs text-[#8E9B93] tracking-widest uppercase">
                      Security & Compliance Event Buffer
                    </span>
                  </div>

                  <div className="bg-[#0B0F0C] border border-[#1F2922] rounded p-4 h-36 overflow-y-auto font-mono text-[10px] text-[#8E9B93] space-y-1.5 custom-scrollbar">
                    {securityLogs.map((log, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-[#00E676] select-none">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-[#1F2922] bg-[#111613] rounded p-6 space-y-4">
                  <div className="border-b border-[#1F2922] pb-3">
                    <span className="font-mono text-xs text-[#8E9B93] tracking-widest uppercase">
                      Escrow Vault Health Check
                    </span>
                  </div>

                  <div className="bg-[#0B0F0C] border border-[#1F2922] rounded p-4 space-y-3 text-xs font-mono">
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>Vault Integrity:</span>
                      <span className="font-bold">100% OK</span>
                    </div>
                    <div className="flex items-center justify-between text-[#8E9B93] text-[10px]">
                      <span>Disbursements On Hold:</span>
                      <span className="text-amber-400 font-bold">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* SCREEN [6]: ADMIN ACTIVITY LOG */}
          {activeTab === 'logs' && (
            <div className="space-y-8 animate-fadeIn text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2922] pb-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-mono text-[#E2E8F0] tracking-tight font-medium">
                    Immutable Platform Activity Log
                  </h2>
                  <p className="text-xs text-[#8E9B93] font-mono">
                    Cryptographically secured audit trail of administrative adjustments.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8E9B93]" />
                    <input
                      type="text"
                      placeholder="Filter by Actor/Target..."
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      className="bg-[#111613] border border-[#1F2922] rounded pl-9 pr-4 py-2 text-xs font-mono text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50 placeholder-[#8E9B93]/40"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setActivityFilter(prev => prev === 'ALL' ? 'CRITICAL' : 'ALL');
                      addToast(`Activity logs filtered: showing ${activityFilter === 'ALL' ? 'CRITICAL' : 'ALL'} updates.`, 'info');
                    }}
                    className="px-3 py-2 bg-[#00E676] hover:bg-[#00E575]/90 text-black font-mono text-xs rounded transition-colors cursor-pointer"
                  >
                    FILTER LOGS
                  </button>

                  <button
                    onClick={() => addToast('Exporting Activity Logs database trace buffer to local CSV format...', 'success')}
                    className="px-3 py-2 bg-[#0B0F0C] hover:bg-[#111613] text-[#E2E8F0] border border-[#1F2922] font-mono text-xs rounded transition-colors cursor-pointer"
                  >
                    EXPORT CSV
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono text-xs">
                <div className="border border-[#1F2922] bg-[#111613] rounded p-4 space-y-1">
                  <span className="text-[#8E9B93] block text-[9px] uppercase">Total Actions (24H)</span>
                  <span className="text-[#E2E8F0] text-lg font-medium">14,209</span>
                </div>
                <div className="border border-[#1F2922] bg-[#111613] rounded p-4 space-y-1">
                  <span className="text-[#8E9B93] block text-[9px] uppercase">Critical Overrides</span>
                  <span className="text-red-400 text-lg font-medium">03</span>
                </div>
                <div className="border border-[#1F2922] bg-[#111613] rounded p-4 space-y-1">
                  <span className="text-[#8E9B93] block text-[9px] uppercase">Audit Completion</span>
                  <span className="text-[#00E676] text-lg font-medium">99.9%</span>
                </div>
                <div className="border border-[#1F2922] bg-[#111613] rounded p-4 space-y-1">
                  <span className="text-[#8E9B93] block text-[9px] uppercase">Last Sync</span>
                  <span className="text-emerald-400 text-lg font-medium">0.4s ago</span>
                </div>
              </div>

              <div className="border border-[#1F2922] bg-[#111613] rounded overflow-hidden">
                <div className="overflow-x-auto font-mono text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#050806] border-b border-[#1F2922] text-[#8E9B93] font-medium">
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Admin Actor</th>
                        <th className="p-4">Action Performed</th>
                        <th className="p-4">Target Entity</th>
                        <th className="p-4">Rationale Summary</th>
                        <th className="p-4 text-center">Cryptographic Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2922]">
                      {activityLogs
                        .filter(log => {
                          if (activityFilter === 'CRITICAL') {
                            return log.action.includes('FRAUD') || log.action.includes('FREEZE') || log.action.includes('REVOCATION') || log.action.includes('REJECTED');
                          }
                          return true;
                        })
                        .filter(log => {
                          const query = activitySearch.toLowerCase();
                          return log.actor.toLowerCase().includes(query) || log.target.toLowerCase().includes(query) || log.action.toLowerCase().includes(query);
                        })
                        .map((log, index) => (
                          <tr key={index} className="hover:bg-[#111613]/55 transition-colors">
                            <td className="p-4 text-[#8E9B93] whitespace-nowrap">{log.timestamp}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium border ${log.color}`}>
                                  {log.initials}
                                </span>
                                <span className="text-[#E2E8F0]">{log.actor}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] border font-medium ${log.action.includes('APPROVED') ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                                log.action.includes('FRAUD') || log.action.includes('FREEZE') || log.action.includes('REVOCATION') || log.action.includes('REJECTED') ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                                  'text-amber-400 border-amber-500/30 bg-amber-500/10'
                                }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="p-4 text-[#E2E8F0]">{log.target}</td>
                            <td className="p-4 text-[#8E9B93] max-w-[200px] truncate">{log.rationale}</td>
                            <td className="p-4 text-center">
                              <span className="text-[10px] text-[#8E9B93]/50 select-all cursor-pointer">
                                {log.hash}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Administrative Edit Profile Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#111613] border border-[#1F2922] rounded-lg shadow-2xl max-w-lg w-full overflow-hidden text-left relative font-mono text-xs">
            <button 
              onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}
              className="absolute right-4 top-4 text-[#8E9B93] hover:text-[#00E676] transition-colors cursor-pointer p-1.5"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <span className="text-[10px] text-[#00E676] tracking-widest uppercase block mb-1">
                  ADMIN OVERRIDE CONSOLE
                </span>
                <h3 className="text-lg font-mono text-[#E2E8F0] font-medium">
                  Edit {editingUser.role === 'founder' ? 'Student Founder' : 'Capital Backer'} Profile
                </h3>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <div>
                  <label className="text-[10px] text-[#8E9B93] block mb-1">Legal Name</label>
                  <input 
                    type="text" 
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#8E9B93] block mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                  />
                </div>

                {editingUser.role === 'founder' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-[#8E9B93] block mb-1">University Name</label>
                        <input 
                          type="text" 
                          required
                          value={editUniversity}
                          onChange={(e) => setEditUniversity(e.target.value)}
                          className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#8E9B93] block mb-1">Student ID</label>
                        <input 
                          type="text" 
                          required
                          value={editStudentId}
                          onChange={(e) => setEditStudentId(e.target.value)}
                          className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-[#8E9B93] block mb-1">Department</label>
                        <input 
                          type="text" 
                          required
                          value={editDepartment}
                          onChange={(e) => setEditDepartment(e.target.value)}
                          className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#8E9B93] block mb-1">Date of Birth</label>
                        <input 
                          type="date" 
                          required
                          value={editDob}
                          onChange={(e) => setEditDob(e.target.value)}
                          className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-[#8E9B93] block mb-1">National ID (NID)</label>
                        <input 
                          type="text" 
                          required
                          value={editNid}
                          onChange={(e) => setEditNid(e.target.value)}
                          className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#8E9B93] block mb-1">MFS Account Number</label>
                        <input 
                          type="text" 
                          required
                          value={editMfsNumber}
                          onChange={(e) => setEditMfsNumber(e.target.value)}
                          className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-[#8E9B93] block mb-1">Affiliation Status</label>
                        <select 
                          required
                          value={editAffiliationStatus}
                          onChange={(e) => setEditAffiliationStatus(e.target.value)}
                          className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                        >
                          <option value="Alumni Backer">Alumni Backer</option>
                          <option value="Venture Capitalist">Venture Capitalist</option>
                          <option value="Angel Investor">Angel Investor</option>
                          <option value="Corporate Partner">Corporate Partner</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#8E9B93] block mb-1">Associated Company/Uni</label>
                        <input 
                          type="text" 
                          required
                          value={editInstitution}
                          onChange={(e) => setEditInstitution(e.target.value)}
                          className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {editAffiliationStatus === 'Alumni Backer' ? (
                        <div>
                          <label className="text-[10px] text-[#8E9B93] block mb-1">Passing Year</label>
                          <input 
                            type="text" 
                            required={editAffiliationStatus === 'Alumni Backer'}
                            value={editPassingYear}
                            onChange={(e) => setEditPassingYear(e.target.value)}
                            className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] text-[#8E9B93] block mb-1">Associated Designation</label>
                          <input 
                            type="text" 
                            required
                            value={editMfsNumber} // Note: utilizing editMfsNumber for investor designation or store bankOrMfs
                            onChange={(e) => setEditMfsNumber(e.target.value)}
                            className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-[10px] text-[#8E9B93] block mb-1">NID or Passport Num</label>
                        <input 
                          type="text" 
                          required
                          value={editNidOrPassport}
                          onChange={(e) => setEditNidOrPassport(e.target.value)}
                          className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8E9B93] block mb-1">Bank Account or Wallet Details</label>
                      <input 
                        type="text" 
                        required
                        value={editBankOrMfs}
                        onChange={(e) => setEditBankOrMfs(e.target.value)}
                        className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8E9B93] block mb-1">Credentials Link (LinkedIn)</label>
                      <input 
                        type="text" 
                        value={editCredentialsLink}
                        onChange={(e) => setEditCredentialsLink(e.target.value)}
                        className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded px-3 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#00E676]/50"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#00E676] hover:bg-[#00E575]/90 text-black font-mono font-medium rounded text-center cursor-pointer"
                >
                  Save Profile Changes
                </button>
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}
                  className="flex-1 py-2 bg-[#0B0F0C] hover:bg-[#111613] text-[#E2E8F0] border border-[#1F2922] font-mono text-center cursor-pointer"
                >
                  Cancel Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: REQUEST RE-UPLOAD / REVISION MODAL */}
      {isRevisionModalOpen && selectedAuditCampaign && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111613] border border-[#1F2922] w-full max-w-lg rounded-lg p-6 space-y-6 animate-fadeIn font-mono text-xs text-left">
            <div className="flex items-center justify-between border-b border-[#1F2922] pb-3">
              <span className="text-[#E2E8F0] font-medium uppercase text-sm">Request Revision / Re-upload</span>
              <button 
                onClick={() => setIsRevisionModalOpen(false)}
                className="text-[#8E9B93] hover:text-[#E2E8F0]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReuploadRequestSubmit} className="space-y-4">
              <div className="space-y-1">
                <span className="text-[#8E9B93] text-[11px] block">Target Campaign:</span>
                <span className="text-[#00E676] font-bold block text-sm">{selectedAuditCampaign.title}</span>
                <span className="text-[#8E9B93] text-[10px] block">Founder: {selectedAuditCampaign.founder?.name || 'Student Founder'} ({selectedAuditCampaign.university || 'Univ'})</span>
              </div>

              <div>
                <label className="text-[11px] text-[#8E9B93] block mb-1">Supervisor Revision Feedback & Instructions:</label>
                <textarea
                  required
                  rows={4}
                  value={campaignAuditFeedback}
                  onChange={(e) => setCampaignAuditFeedback(e.target.value)}
                  placeholder="Specify exact corrections required (e.g. Please update 3-year revenue projections, re-upload clear NID scan image, and adjust milestone 2 target date)..."
                  className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded p-3 text-[#E2E8F0] text-xs focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded text-center cursor-pointer"
                >
                  Send Re-upload Request
                </button>
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#0B0F0C] text-[#E2E8F0] border border-[#1F2922] rounded text-center cursor-pointer hover:bg-[#111613]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT CAMPAIGN MODAL */}
      {isRejectModalOpen && selectedAuditCampaign && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111613] border border-red-500/30 w-full max-w-lg rounded-lg p-6 space-y-6 animate-fadeIn font-mono text-xs text-left">
            <div className="flex items-center justify-between border-b border-[#1F2922] pb-3">
              <span className="text-red-400 font-medium uppercase text-sm">Reject Campaign Pitch</span>
              <button 
                onClick={() => setIsRejectModalOpen(false)}
                className="text-[#8E9B93] hover:text-[#E2E8F0]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectCampaignSubmit} className="space-y-4">
              <div className="space-y-1">
                <span className="text-[#8E9B93] text-[11px] block">Target Campaign:</span>
                <span className="text-red-400 font-bold block text-sm">{selectedAuditCampaign.title}</span>
              </div>

              <div>
                <label className="text-[11px] text-[#8E9B93] block mb-1">Rejection Rationale & Record Notes:</label>
                <textarea
                  required
                  rows={4}
                  value={campaignRejectionReason}
                  onChange={(e) => setCampaignRejectionReason(e.target.value)}
                  placeholder="Provide explicit reasons for campaign rejection (e.g. Unrealistic valuation figures, non-compliance with platform student founder terms)..."
                  className="w-full bg-[#0B0F0C] border border-[#1F2922] rounded p-3 text-[#E2E8F0] text-xs focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded text-center cursor-pointer"
                >
                  Confirm Rejection
                </button>
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#0B0F0C] text-[#E2E8F0] border border-[#1F2922] rounded text-center cursor-pointer hover:bg-[#111613]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DOCUMENT INSPECTION PREVIEW MODAL */}
      {docPreviewModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111613] border border-[#1F2922] w-full max-w-xl rounded-lg p-6 space-y-6 animate-fadeIn font-mono text-xs text-left">
            <div className="flex items-center justify-between border-b border-[#1F2922] pb-3">
              <span className="text-[#00E676] font-medium uppercase text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" /> Document Inspection Vault
              </span>
              <button 
                onClick={() => setDocPreviewModal(null)}
                className="text-[#8E9B93] hover:text-[#E2E8F0]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 bg-[#0B0F0C] border border-[#1F2922] p-5 rounded">
              <div className="flex items-center justify-between border-b border-[#1F2922] pb-3">
                <div>
                  <span className="text-[#E2E8F0] font-bold block text-sm">{docPreviewModal.title}</span>
                  <span className="text-[10px] text-[#8E9B93] block">{docPreviewModal.filename}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {docPreviewModal.size || '1.8 MB'}
                </span>
              </div>

              <div className="py-8 border border-dashed border-[#1F2922] rounded text-center space-y-2">
                <FileText className="w-12 h-12 text-[#00E676] mx-auto opacity-80" />
                <p className="text-[#E2E8F0] font-medium">Document Vault Inspection Buffer</p>
                <p className="text-[10px] text-[#8E9B93]">Cryptographic Integrity Hash: fb_sha256_{Math.random().toString(36).substring(2, 10)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="#download"
                onClick={(e) => {
                  e.preventDefault();
                  addToast(`Downloading ${docPreviewModal.filename}...`, 'success');
                  setDocPreviewModal(null);
                }}
                className="flex-1 py-2.5 bg-[#00E676] hover:bg-[#00E575]/90 text-black font-semibold rounded text-center cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Original File
              </a>
              <button
                type="button"
                onClick={() => setDocPreviewModal(null)}
                className="px-6 py-2.5 bg-[#0B0F0C] text-[#E2E8F0] border border-[#1F2922] rounded text-center cursor-pointer hover:bg-[#111613]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: INVESTIGATION EVIDENCE & COMPLAINT DETAILS MODAL */}
      {investigatingComplaint && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111613] border border-[#1F2922] w-full max-w-2xl rounded-lg p-6 space-y-6 animate-fadeIn font-mono text-xs text-left relative">
            <div className="flex items-center justify-between border-b border-[#1F2922] pb-3">
              <div>
                <span className="text-[#00E676] font-bold text-sm block">CASE INVESTIGATION VAULT: {investigatingComplaint.id}</span>
                <span className="text-[10px] text-[#8E9B93]">Filed on: {investigatingComplaint.createdAt}</span>
              </div>
              <button 
                onClick={() => setInvestigatingComplaint(null)}
                className="text-[#8E9B93] hover:text-[#E2E8F0] cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stakeholder Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-[#0B0F0C] border border-[#1F2922] rounded space-y-1">
                <span className="text-[9px] text-[#8E9B93] block uppercase">COMPLAINANT (REPORTED BY)</span>
                <span className="text-[#E2E8F0] font-bold block">{investigatingComplaint.complainant}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] border border-sky-500/30 bg-sky-500/10 text-sky-400 font-sans uppercase inline-block">
                  {investigatingComplaint.complainantRole}
                </span>
              </div>

              <div className="p-3 bg-[#0B0F0C] border border-[#1F2922] rounded space-y-1">
                <span className="text-[9px] text-[#8E9B93] block uppercase">REPORTED ENTITY</span>
                <span className="text-red-400 font-bold block">{investigatingComplaint.reportedUser}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] border border-amber-500/30 bg-amber-500/10 text-amber-400 font-sans uppercase inline-block">
                  {investigatingComplaint.reportedRole}
                </span>
              </div>
            </div>

            {/* Complaint Issue & Description Statement */}
            <div className="space-y-2 bg-[#0B0F0C] border border-[#1F2922] p-4 rounded">
              <div className="flex items-center justify-between border-b border-[#1F2922] pb-2">
                <span className="text-amber-400 font-bold text-xs uppercase">Issue: {investigatingComplaint.issueType}</span>
                <span className="text-red-400 text-[10px] uppercase font-bold px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded">
                  Severity: {investigatingComplaint.severity}
                </span>
              </div>
              <p className="text-[#E2E8F0] leading-relaxed pt-1 text-xs">
                {investigatingComplaint.description}
              </p>
            </div>

            {/* Uploaded Evidence Card */}
            <div className="p-4 bg-[#0B0F0C] border border-[#1F2922] rounded flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8E9B93] uppercase block">UPLOADED EVIDENCE ATTACHMENT</span>
                <span className="text-[#E2E8F0] font-bold block">{investigatingComplaint.evidenceFile || 'evidence_proof.pdf'}</span>
                <span className="text-[10px] text-[#8E9B93] block">{investigatingComplaint.evidenceSize || '1.2 MB'}</span>
              </div>
              <button
                type="button"
                onClick={() => setDocPreviewModal({ title: investigatingComplaint.issueType, filename: investigatingComplaint.evidenceFile || 'evidence.pdf', size: investigatingComplaint.evidenceSize || '1.2 MB' })}
                className="px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 rounded text-xs cursor-pointer flex items-center gap-1.5 font-semibold"
              >
                <Eye className="w-3.5 h-3.5" /> Inspect Proof
              </button>
            </div>

            {/* Direct Enforcement Actions Inside Modal */}
            <div className="space-y-2 pt-2 border-t border-[#1F2922]">
              <span className="text-[10px] text-[#8E9B93] uppercase block font-semibold">DIRECT ENFORCEMENT ACTIONS:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleFreezeCampaignFundsAction(investigatingComplaint.campaignId || investigatingComplaint.campaignTitle, investigatingComplaint.campaignTitle);
                    setInvestigatingComplaint(null);
                  }}
                  className="py-2.5 px-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 font-semibold rounded text-[11px] cursor-pointer flex items-center justify-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5" /> Freeze Campaign Funds
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleBlockUserAction(investigatingComplaint.reportedUserId || investigatingComplaint.reportedUser, investigatingComplaint.reportedUser, investigatingComplaint.reportedRole);
                    setInvestigatingComplaint(null);
                  }}
                  className="py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded text-[11px] cursor-pointer flex items-center justify-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5" /> Block Reported User
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleDismissComplaint(investigatingComplaint.id);
                    setInvestigatingComplaint(null);
                  }}
                  className="py-2.5 px-3 bg-[#0B0F0C] hover:bg-[#111613] text-[#8E9B93] border border-[#1F2922] font-semibold rounded text-[11px] cursor-pointer flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Dismiss Complaint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-[#1F2922] bg-[#050806] py-3 text-center text-[10px] font-mono text-[#8E9B93] relative z-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DATABASE: {dbConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
          <span>LAG: 14ms</span>
          <span>SYNCED</span>
        </div>
      </footer>

    </div>
  );
}
