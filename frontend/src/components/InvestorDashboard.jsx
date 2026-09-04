                                import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  LayoutDashboard,
  Rocket,
  Wallet,
  Users,
  History,
  Settings,
  Bell,
  MessageSquare,
  Search,
  FileText,
  X,
  LogOut,
  Info,
  ShieldCheck,
  CheckCircle2,
  Bookmark,
  Flag,
  UserPlus,
  ArrowUpRight,
  Download,
  Eye,
  SlidersHorizontal,
  Scale,
  AlertTriangle,
  ChevronRight,
  Briefcase,
  Layers,
  Send,
  Building2,
  Clock,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
  User,
  AlertCircle,
  XCircle,
  Heart,
  Plus,
  Upload
} from 'lucide-react';

import logoUrl from '../assets/images/FundBridge Logo.svg';

export default function InvestorDashboard({ currentUser, onLogout, API_BASE_URL, triggerAlert }) {
  const user = currentUser || {
    id: 'usr_investor_1',
    name: 'Javeria Doe',
    email: 'investor@firm.com',
    institution: 'Alumni Backer - BRACU & BUET Syndicate',
    vettingStatus: 'verified',
    mfsNumber: '01711223344'
  };

  // Sidebar Active Tabs: 'overview' | 'campaigns' | 'portfolio' | 'wallet' | 'investors' | 'audit-logs' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  // Header State
  const [globalSearch, setGlobalSearch] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');

  const [profileUser, setProfileUser] = useState({
    name: user.name || 'Javeria Doe',
    email: user.email || 'investor@firm.com',
    institution: user.institution || 'Alumni Backer - BRACU & BUET Syndicate',
    mfsNumber: user.mfsNumber || '01711223344',
    bio: 'Active venture partner backing university tech startups across Bangladesh.',
    ticketSize: '৳ 5,00,000',
    vettingStatus: user.vettingStatus || 'verified'
  });

  // Real Database State
  const [campaigns, setCampaigns] = useState([]);
  // S3: open/verified relief campaigns for Explore
  const [reliefCampaigns, setReliefCampaigns] = useState([]);
  const [exploreMarket, setExploreMarket] = useState('startup'); // startup | relief
  const [selectedReliefDetail, setSelectedReliefDetail] = useState(null);
  // S3: Add Money / donate to relief
  const [reliefDonateTarget, setReliefDonateTarget] = useState(null);
  const [reliefDonateAmount, setReliefDonateAmount] = useState('');
  const [reliefDonateMethod, setReliefDonateMethod] = useState('bkash');
  const [reliefDonateReference, setReliefDonateReference] = useState('');
  const [submittingReliefDonate, setSubmittingReliefDonate] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [coInvestors, setCoInvestors] = useState([]);
  const [foundersList, setFoundersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  // S3: investor wallet (aligned with founder wallet)
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCommitted, setWalletCommitted] = useState(0);
  const [walletAvailable, setWalletAvailable] = useState(0);
  const [walletPendingHeld, setWalletPendingHeld] = useState(0);
  const [walletInflows, setWalletInflows] = useState([]);
  const [walletOutflows, setWalletOutflows] = useState([]);
  const [walletNote, setWalletNote] = useState('');
  const [walletDeposits, setWalletDeposits] = useState([]);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [addMoneyMethod, setAddMoneyMethod] = useState('bkash');
  const [addMoneyReference, setAddMoneyReference] = useState('');
  const [addMoneyNote, setAddMoneyNote] = useState('');
  const [addMoneyProof, setAddMoneyProof] = useState(null);
  const [submittingAddMoney, setSubmittingAddMoney] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [bookmarkedFounders, setBookmarkedFounders] = useState([]);
  const [investorConnections, setInvestorConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Explore Directory Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [scaleFilter, setScaleFilter] = useState('all');

  // Selected Campaign Detail Modal (Full Business Profile & Detailed Founder Info)
  const [selectedCampaignDetail, setSelectedCampaignDetail] = useState(null);

  // Proposal Submission Form Modal
  const [selectedProposalCampaign, setSelectedProposalCampaign] = useState(null);
  const [proposalAmount, setProposalAmount] = useState('500000');
  const [proposalTerms, setProposalTerms] = useState('8% Revenue Share');
  const [proposalNotes, setProposalNotes] = useState('');

  // Flag/Report Modal
  const [flagModalCampaign, setFlagModalCampaign] = useState(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagDescription, setFlagDescription] = useState('');

  // Proposals Table Modal (Opened via My Investments tab)
  const [showProposalsModal, setShowProposalsModal] = useState(false);
  const [proposalDetailModal, setProposalDetailModal] = useState(null);

  // Modals for Overview 6 Metric Cards
  const [showInvestmentsModal, setShowInvestmentsModal] = useState(false);
  const [showRejectedProposalsModal, setShowRejectedProposalsModal] = useState(false);
  const [showConnectedInvestorsModal, setShowConnectedInvestorsModal] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [showBookmarkedFoundersModal, setShowBookmarkedFoundersModal] = useState(false);

  // View All Registered Founders Modal (Directory of 100 founders to mark interest)
  const [showAllFoundersModal, setShowAllFoundersModal] = useState(false);
  const [modalFounderSearch, setModalFounderSearch] = useState('');

  // 3-Startup Head-to-Head Comparison Matrix State
  const [comparisonIds, setComparisonIds] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Co-Investors Search
  const [investorSearch, setInvestorSearch] = useState('');

  // Audit Log Search
  const [auditSearch, setAuditSearch] = useState('');

  // Generic Decision Confirmation Modal ("Are you sure?")
  const [confirmModal, setConfirmModal] = useState(null);

  // S3: write to this investor’s audit only (never founder audit)
  const recordInvestorAudit = async ({ category, title, status = 'RECORDED' }) => {
    const investorId = currentUser?.id || currentUser?._id || user.id || user._id;
    if (!investorId || !title) return;
    try {
      await fetch(`${API_BASE_URL}/api/investors/${encodeURIComponent(investorId)}/audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title, status })
      });
    } catch (e) {}
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Export CSV Helper
  const exportToCSV = (filename, rows) => {
    if (!rows || !rows.length) {
      showToast('No data available to export.', 'error');
      return;
    }
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map(row => {
          return keys
            .map(k => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              if (typeof cell === 'object') cell = JSON.stringify(cell);
              cell = cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
              return cell;
            })
            .join(separator);
        })
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded ${filename} successfully!`, 'success');
  };

  // Fetch Database Records
  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = user.id || user._id;

      // 1. Fetch Campaigns
      const campRes = await fetch(`${API_BASE_URL}/api/campaigns`);
      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaigns(campData || []);
      }

      // S3: Fetch approved relief campaigns (Explore Relief tab)
      const reliefRes = await fetch(`${API_BASE_URL}/api/relief-drives`);
      if (reliefRes.ok) {
        const reliefData = await reliefRes.json();
        setReliefCampaigns(Array.isArray(reliefData) ? reliefData : []);
      }

      // 2. Fetch Proposals submitted by this Investor
      if (userId) {
        const propRes = await fetch(`${API_BASE_URL}/api/proposals/investor/${userId}`);
        if (propRes.ok) {
          const propData = await propRes.json();
          setProposals(propData || []);
        }
      }

      // 3. Fetch Registered Co-Investors
      const invRes = await fetch(`${API_BASE_URL}/api/admin/users/investors`);
      if (invRes.ok) {
        const invData = await invRes.json();
        setCoInvestors(invData || []);
      }

      // 4. Fetch Registered Student Founders
      const foundersRes = await fetch(`${API_BASE_URL}/api/admin/users/founders`);
      if (foundersRes.ok) {
        const foundersData = await foundersRes.json();
        setFoundersList(foundersData || []);
      }

      // 5. S3: investor-only audit (do not use global /api/audit-logs — that mixes founder actions)
      if (userId) {
        const auditRes = await fetch(`${API_BASE_URL}/api/investors/${encodeURIComponent(userId)}/audit-logs`);
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          setAuditLogs(Array.isArray(auditData) ? auditData : []);
        } else {
          setAuditLogs([]);
        }
      } else {
        setAuditLogs([]);
      }

      // 6. S3: investor wallet (not founder payouts)
      if (userId) {
        try {
          const walRes = await fetch(`${API_BASE_URL}/api/investors/${encodeURIComponent(userId)}/wallet`);
          if (walRes.ok) {
            const wal = await walRes.json();
            setWalletBalance(Number(wal.balance) || 0);
            setWalletCommitted(Number(wal.capital_committed) || 0);
            setWalletAvailable(Number(wal.available_to_deploy) || 0);
            setWalletPendingHeld(Number(wal.pending_commitments) || 0);
            setWalletInflows(Array.isArray(wal.inflows) ? wal.inflows : []);
            setWalletOutflows(Array.isArray(wal.outflows) ? wal.outflows : []);
            setWalletNote(wal.note || '');
          }
          const depRes = await fetch(`${API_BASE_URL}/api/investors/${encodeURIComponent(userId)}/wallet/deposits`);
          if (depRes.ok) {
            const deps = await depRes.json();
            setWalletDeposits(Array.isArray(deps) ? deps : []);
          }
        } catch (e) {}
      }

      // 7. Fetch Real-Time Notifications
      if (userId) {
        const notifRes = await fetch(`${API_BASE_URL}/api/notifications?userId=${userId}`);
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData || []);
        }
      }

      // 8. Fetch Watchlist Pins
      if (userId) {
        const watchRes = await fetch(`${API_BASE_URL}/api/investors/watchlist?userId=${userId}`);
        if (watchRes.ok) {
          const watchData = await watchRes.json();
          setWatchlist(watchData.map(w => w.campaign_id || w.campaignId) || []);
        }
      }

      // 9. Fetch Bookmarked Founders
      if (userId) {
        const bmRes = await fetch(`${API_BASE_URL}/api/investors/bookmarked-founders?userId=${userId}`);
        if (bmRes.ok) {
          const bmData = await bmRes.json();
          setBookmarkedFounders(bmData.map(b => b.founder_id || b.founderId) || []);
        }
      }

      // 10. Fetch Investor Connections
      if (userId) {
        const connRes = await fetch(`${API_BASE_URL}/api/investors/connections?userId=${userId}`);
        if (connRes.ok) {
          const connData = await connRes.json();
          setInvestorConnections(connData || []);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading database records:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket.io real-time connection
    const newSocket = io(API_BASE_URL);
    const userId = currentUser?.id || currentUser?._id || user.id;

    if (userId) {
      newSocket.emit('join_room', userId);
    }

    newSocket.on('receive_notification', (newNotif) => {
      if (newNotif.user_id === userId || newNotif.user_id === 'all') {
        setNotifications(prev => [newNotif, ...prev]);
        showToast(`🔔 ${newNotif.title}: ${newNotif.message}`, 'info');
        // S3: reload proposals when founder accepts / declines / counters
        const t = String(newNotif.title || '').toLowerCase();
        if (t.includes('proposal') || t.includes('counter-offer') || t.includes('counter')) {
          (async () => {
            try {
              const propRes = await fetch(`${API_BASE_URL}/api/proposals/investor/${userId}`);
              if (propRes.ok) setProposals(await propRes.json() || []);
              const campRes = await fetch(`${API_BASE_URL}/api/campaigns`);
              if (campRes.ok) setCampaigns(await campRes.json() || []);
            } catch (e) { /* keep prior */ }
          })();
        }
      }
    });

    newSocket.on('new_notification_broadcast', (newNotif) => {
      if (!newNotif.user_id || newNotif.user_id === userId || newNotif.user_id === 'all') {
        setNotifications(prev => [newNotif, ...prev]);
      }
    });

    // S3: live proposal status/amount/counter from founder actions
    newSocket.on('proposal_updated', (prop) => {
      if (!prop) return;
      const inv = prop.investor_id || prop.investorId;
      if (inv && String(inv) !== String(userId)) return;
      setProposals((prev) => {
        const id = prop.id || prop._id;
        const idx = prev.findIndex((p) => (p.id || p._id) === id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...prop };
          return next;
        }
        return [prop, ...prev];
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Execute Submit Proposal
  const executeCreateProposal = async (targetCampaign) => {
    const camp = targetCampaign || selectedProposalCampaign;
    if (!camp) return;
    try {
      const campId = camp.id || camp._id;
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${campId}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorId: user.id || user._id || 'usr_investor_1',
          investorName: profileUser.name || 'Verified Investor',
          amount: Number(proposalAmount),
          terms: proposalTerms,
          customNotes: proposalNotes
        })
      });

      if (res.ok) {
        showToast('Investment proposal submitted to Founder!', 'success');
        recordInvestorAudit({
          category: 'PROPOSAL',
          title: `Submitted investment offer ৳ ${Number(proposalAmount).toLocaleString()} on ${camp.title || campId}`,
          status: 'PENDING'
        });
        setSelectedProposalCampaign(null);
        setProposalNotes('');
        fetchData();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to submit proposal', 'error');
      }
    } catch (err) {
      showToast('Error submitting proposal.', 'error');
    }
  };

  // Submit Proposal Form Trigger (Prompts Automated Confirmation First)
  const handleCreateProposal = (e) => {
    e.preventDefault();
    if (!selectedProposalCampaign) return;

    if (profileUser.vettingStatus === 'pending' || profileUser.vetting_status === 'pending') {
      showToast('Your investor profile is pending Admin approval. You cannot submit investment proposals until your profile is verified by Super Admin.', 'error');
      return;
    }

    const campaignToSubmit = selectedProposalCampaign;
    setConfirmModal({
      title: 'Confirm Investment Offer Submission',
      message: `Are you sure you want to submit an investment proposal of ৳ ${Number(proposalAmount).toLocaleString()} with terms "${proposalTerms}" for "${campaignToSubmit.title}"?`,
      warning: 'This will issue a formal term sheet to the student founder for review.',
      confirmText: 'Yes, Submit Offer',
      confirmColor: 'bg-[#047857] hover:bg-[#065f46]',
      onConfirm: () => {
        setConfirmModal(null);
        executeCreateProposal(campaignToSubmit);
      }
    });
  };

  // S3: open Add Money modal for a relief campaign
  const openReliefDonate = (drive) => {
    setReliefDonateTarget(drive);
    setReliefDonateAmount('');
    setReliefDonateMethod('bkash');
    setReliefDonateReference('');
  };

  const handleReliefDonate = async (e) => {
    e.preventDefault();
    if (!reliefDonateTarget) return;
    const amt = Number(reliefDonateAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      showToast('Enter a valid amount to add.', 'error');
      return;
    }
    const driveId = reliefDonateTarget.id || reliefDonateTarget._id;
    const donorId = currentUser?.id || currentUser?._id || user.id || user._id || 'usr_investor_1';
    setSubmittingReliefDonate(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/relief-drives/${encodeURIComponent(driveId)}/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorId: donorId,
          investorName: profileUser.name || currentUser?.name || user.name || 'Donor',
          amount: amt,
          method: reliefDonateMethod,
          reference: reliefDonateReference
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to add money to relief campaign.', 'error');
        return;
      }
      const newRaised = Number(data.drive?.raised ?? (Number(reliefDonateTarget.raised || 0) + amt));
      showToast(`Donated ৳ ${amt.toLocaleString()} — relief raised is now ৳ ${newRaised.toLocaleString()}.`, 'success');
      // server also writes investor audit; refresh list
      if (data.drive) {
        setReliefCampaigns((prev) => {
          const id = data.drive.id || data.drive._id;
          const exists = prev.some((d) => (d.id || d._id) === id);
          if (!exists) return [data.drive, ...prev];
          return prev.map((d) => ((d.id || d._id) === id ? { ...d, ...data.drive } : d));
        });
        if (selectedReliefDetail && (selectedReliefDetail.id || selectedReliefDetail._id) === driveId) {
          setSelectedReliefDetail(data.drive);
        }
      }
      setReliefDonateTarget(null);
      setReliefDonateAmount('');
      setReliefDonateReference('');
      await fetchData();
    } catch (err) {
      showToast('Server error adding money to relief campaign.', 'error');
    } finally {
      setSubmittingReliefDonate(false);
    }
  };

  // Execute Withdraw Proposal
  const executeWithdrawProposal = async (proposalId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}/withdraw`, {
        method: 'POST'
      });
      if (res.ok) {
        showToast('Investment proposal withdrawn.', 'info');
        recordInvestorAudit({
          category: 'PROPOSAL',
          title: `Withdrew investment proposal ${proposalId}`,
          status: 'WITHDRAWN'
        });
        setProposalDetailModal(null);
        fetchData();
      } else {
        showToast('Failed to withdraw proposal', 'error');
      }
    } catch (err) {
      showToast('Error withdrawing proposal', 'error');
    }
  };

  // Withdraw Proposal Trigger (Prompts Confirmation First)
  const handleWithdrawProposal = (proposalId) => {
    const prop = proposals.find(p => (p.id === proposalId || p._id === proposalId));
    const amountStr = prop ? `৳ ${Number(prop.amount || 0).toLocaleString()}` : '';

    setConfirmModal({
      title: 'Confirm Proposal Withdrawal',
      message: `Are you sure you want to withdraw your pending investment offer of ${amountStr}?`,
      warning: 'This action cannot be undone once confirmed.',
      confirmText: 'Yes, Withdraw Offer',
      confirmColor: 'bg-[#047857] hover:bg-[#065f46] text-white',
      onConfirm: () => {
        setConfirmModal(null);
        executeWithdrawProposal(proposalId);
      }
    });
  };

  // Toggle Watchlist Pin
  const handleToggleWatchlist = async (campaignId) => {
    try {
      const userId = user.id || user._id;
      const res = await fetch(`${API_BASE_URL}/api/investors/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, campaignId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'added') {
          setWatchlist(prev => [...prev, campaignId]);
          showToast('Startup pinned to Watchlist!', 'success');
        } else {
          setWatchlist(prev => prev.filter(id => id !== campaignId));
          showToast('Startup removed from Watchlist.', 'info');
        }
      }
    } catch (err) {
      showToast('Error updating Watchlist.', 'error');
    }
  };

  // Toggle Bookmark / Interest in Founder
  const handleToggleBookmarkFounder = async (founderId) => {
    try {
      const investorId = user.id || user._id;
      const res = await fetch(`${API_BASE_URL}/api/investors/bookmark-founder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investorId, founderId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'bookmarked') {
          setBookmarkedFounders(prev => [...prev, founderId]);
          showToast('Student Founder added to your Interested list!', 'success');
        } else {
          setBookmarkedFounders(prev => prev.filter(id => id !== founderId));
          showToast('Student Founder removed from your Interested list.', 'info');
        }
      }
    } catch (err) {
      showToast('Error bookmarking founder.', 'error');
    }
  };

  // Connection Request
  const handleSendConnectionRequest = async (receiverId) => {
    try {
      const requesterId = user.id || user._id;
      const res = await fetch(`${API_BASE_URL}/api/investors/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId, receiverId })
      });
      if (res.ok) {
        showToast('Connection request sent to Co-Investor!', 'success');
        fetchData();
      }
    } catch (err) {
      showToast('Error sending connection request.', 'error');
    }
  };

  // Execute Flag / Report Campaign
  const executeReportCampaign = async () => {
    if (!flagModalCampaign) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complainantName: profileUser.name || 'Investor Backer',
          complainantRole: 'investor',
          reportedUser: flagModalCampaign.founder?.name || 'Student Founder',
          reportedUserId: flagModalCampaign.founder_id || flagModalCampaign.founderId || '',
          reportedRole: 'founder',
          campaignTitle: flagModalCampaign.title,
          campaignId: flagModalCampaign.id || flagModalCampaign._id,
          issueType: flagReason || 'Fraudulent Activity Concern',
          description: flagDescription || 'Investor flagged campaign for review by admins.',
          severity: 'High'
        })
      });
      if (res.ok) {
        showToast('Report submitted directly to Platform Admins for moderation.', 'success');
        setFlagModalCampaign(null);
        setFlagReason('');
        setFlagDescription('');
      } else {
        showToast('Report submitted to moderation queue.', 'info');
        setFlagModalCampaign(null);
      }
    } catch (err) {
      showToast('Error submitting report.', 'error');
    }
  };

  // Flag / Report Campaign Trigger
  const handleReportCampaign = (e) => {
    e.preventDefault();
    if (!flagModalCampaign) return;

    setConfirmModal({
      title: 'Confirm Flag / Report Campaign Submission',
      message: `Are you sure you want to flag and report "${flagModalCampaign.title}" to platform Administrators?`,
      warning: 'This will initiate a formal compliance audit of the founder and campaign.',
      confirmText: 'Yes, Submit Flag Report',
      confirmColor: 'bg-[#047857] hover:bg-[#065f46] text-white',
      onConfirm: () => {
        setConfirmModal(null);
        executeReportCampaign();
      }
    });
  };

  // Logout Trigger
  const handlePromptLogout = () => {
    setConfirmModal({
      title: 'Confirm Investor Log Out',
      message: 'Are you sure you want to log out of your FundBridge Investor portal?',
      warning: 'Your session token will be cleared safely.',
      confirmText: 'Yes, Log Out',
      confirmColor: 'bg-[#047857] hover:bg-[#065f46] text-white',
      onConfirm: () => {
        setConfirmModal(null);
        onLogout();
      }
    });
  };

  // Direct Messaging
  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser?.id || currentUser?._id || user.id,
          senderName: profileUser.name || user.name || 'Investor',
          receiverId: chatTarget?._id || chatTarget?.id || 'all',
          text: chatInputText
        })
      });
      if (res.ok) {
        setChatMessages(prev => [...prev, {
          sender_id: user.id,
          sender_name: profileUser.name,
          text: chatInputText,
          created_at: new Date().toISOString()
        }]);
        setChatInputText('');
      }
    } catch (err) {
      showToast('Error sending message.', 'error');
    }
  };

  // Save Profile
  const handleSaveProfile = (e) => {
    e.preventDefault();
    showToast('Investor profile updated successfully!', 'success');
  };

  // Initials Avatar Helper
  const InitialsAvatar = ({ name, className = 'w-10 h-10' }) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'INV';
    return (
      <div className={`${className} rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0`}>
        {initials}
      </div>
    );
  };

  // Filtered Campaigns for Directory
  const filteredCampaigns = campaigns.filter(c => {
    const searchLower = globalSearch.toLowerCase();
    const matchesSearch =
      globalSearch === '' ||
      c.title?.toLowerCase().includes(searchLower) ||
      c.category?.toLowerCase().includes(searchLower) ||
      c.university?.toLowerCase().includes(searchLower) ||
      c.founder?.name?.toLowerCase().includes(searchLower);

    const matchesCategory = categoryFilter === 'all' || c.category?.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesStage = stageFilter === 'all' || c.stage?.toLowerCase() === stageFilter.toLowerCase();

    let matchesScale = true;
    const goalNum = Number(c.goal || 0);
    if (scaleFilter === 'under5') matchesScale = goalNum <= 500000;
    else if (scaleFilter === '5to15') matchesScale = goalNum > 500000 && goalNum <= 1500000;
    else if (scaleFilter === 'above15') matchesScale = goalNum > 1500000;

    return matchesSearch && matchesCategory && matchesStage && matchesScale;
  });

  // S3: filtered relief for Explore Relief tab
  const filteredReliefCampaigns = reliefCampaigns.filter((d) => {
    const searchLower = globalSearch.toLowerCase();
    const matchesSearch =
      globalSearch === '' ||
      d.title?.toLowerCase().includes(searchLower) ||
      d.cause?.toLowerCase().includes(searchLower) ||
      d.university?.toLowerCase().includes(searchLower) ||
      d.beneficiary?.toLowerCase().includes(searchLower) ||
      d.description?.toLowerCase().includes(searchLower);
    let matchesScale = true;
    const goalNum = Number(d.goal || 0);
    if (scaleFilter === 'under5') matchesScale = goalNum <= 500000;
    else if (scaleFilter === '5to15') matchesScale = goalNum > 500000 && goalNum <= 1500000;
    else if (scaleFilter === 'above15') matchesScale = goalNum > 1500000;
    return matchesSearch && matchesScale;
  });

  // Watchlist Campaigns (Campaigns I Am Interested In)
  const watchlistCampaigns = campaigns.filter(c => watchlist.includes(c.id || c._id));

  // INTERESTED STUDENT FOUNDERS ONLY (Shown on Overview Section)
  const interestedFoundersList = foundersList.filter(f => bookmarkedFounders.includes(f.id || f._id));

  // ALL 100 Registered Founders for Modal Directory
  const filteredModalFounders = foundersList.filter(f => {
    const searchLower = modalFounderSearch.toLowerCase();
    return (
      searchLower === '' ||
      f.name?.toLowerCase().includes(searchLower) ||
      f.university?.toLowerCase().includes(searchLower) ||
      f.department?.toLowerCase().includes(searchLower) ||
      f.studentId?.toLowerCase().includes(searchLower)
    );
  });

  // Campaigns I Invested In & Submitted Proposals
  const mySubmittedProposals = proposals;
  const rejectedProposals = proposals.filter(p => p.status === 'declined' || p.status === 'rejected' || p.status === 'withdrawn');
  const fundedCampaigns = campaigns.filter(c =>
    proposals.some(p => (p.campaign_id === c.id || p.campaign_id === c._id || p.campaignId === c.id || p.campaignId === c._id) && p.status === 'accepted')
  );
  // S3: helpers for negotiate display (additive)
  const s3ProposalAmount = (p) => {
    if (String(p?.status || '').toLowerCase() === 'negotiating' && p.counter_amount != null && Number(p.counter_amount) > 0) {
      return Number(p.counter_amount);
    }
    return Number(p?.amount || 0);
  };
  const s3ProposalTerms = (p) => {
    if (String(p?.status || '').toLowerCase() === 'negotiating' && p.counter_terms) return p.counter_terms;
    return p?.terms || p?.return_structure || '8% Rev. Share';
  };
  const s3StatusClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'accepted') return 'bg-emerald-500 text-white';
    if (s === 'declined' || s === 'rejected') return 'bg-rose-500 text-white';
    if (s === 'withdrawn') return 'bg-slate-200 text-slate-700';
    if (s === 'negotiating') return 'bg-sky-100 text-sky-800';
    return 'bg-amber-100 text-amber-800';
  };

  // Filtered Co-Investors
  const filteredInvestors = coInvestors.filter(i => {
    const searchLower = (investorSearch || globalSearch).toLowerCase();
    return (
      searchLower === '' ||
      i.name?.toLowerCase().includes(searchLower) ||
      i.institution?.toLowerCase().includes(searchLower) ||
      i.university?.toLowerCase().includes(searchLower)
    );
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const searchLower = auditSearch.toLowerCase();
    return (
      searchLower === '' ||
      log.hash?.toLowerCase().includes(searchLower) ||
      log.category?.toLowerCase().includes(searchLower) ||
      log.title?.toLowerCase().includes(searchLower)
    );
  });

  // Financial Calculations
  const totalInvestedAmount = proposals
    .filter(p => p.status === 'accepted')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const pendingCommitmentAmount = proposals
    .filter(p => p.status === 'pending' || p.status === 'negotiating') // S3: include negotiating
    .reduce((sum, p) => sum + s3ProposalAmount(p), 0);

  // S3: investor Add Money (same manual proof flow as founder)
  const handleAddMoneySubmit = async (e) => {
    e.preventDefault();
    const userId = currentUser?.id || currentUser?._id || user.id || user._id;
    const amt = Number(addMoneyAmount);
    if (!amt || amt <= 0) {
      showToast('Enter a valid amount to add.', 'error');
      return;
    }
    if (!addMoneyProof) {
      showToast('Upload a payment proof receipt for admin verification.', 'error');
      return;
    }
    try {
      setSubmittingAddMoney(true);
      const fd = new FormData();
      fd.append('amount', String(amt));
      fd.append('method', addMoneyMethod);
      fd.append('reference', addMoneyReference);
      fd.append('note', addMoneyNote);
      fd.append('proofFile', addMoneyProof);
      const res = await fetch(`${API_BASE_URL}/api/investors/${encodeURIComponent(userId)}/wallet/deposits`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to submit Add Money request.', 'error');
        return;
      }
      showToast('Add Money submitted. Admin will verify your proof before crediting.', 'success');
      recordInvestorAudit({
        category: 'WALLET',
        title: `Manual Add Money ৳ ${amt.toLocaleString()} via ${addMoneyMethod}`,
        status: 'PENDING'
      });
      setShowAddMoneyModal(false);
      setAddMoneyAmount('');
      setAddMoneyReference('');
      setAddMoneyNote('');
      setAddMoneyProof(null);
      fetchData();
    } catch (err) {
      showToast('Server error submitting Add Money.', 'error');
    } finally {
      setSubmittingAddMoney(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2.5 animate-bounce ${
          toast.type === 'success' ? 'bg-[#047857] hover:bg-[#065f46] text-white' : toast.type === 'error' ? 'bg-[#047857] hover:bg-[#065f46] text-white' : 'bg-slate-900 text-white'
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Pending Vetting Status Banner */}
      {(profileUser.vettingStatus === 'pending' || profileUser.vetting_status === 'pending') && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 px-6 py-2.5 flex items-center justify-between text-xs font-medium sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Identity Vetting Pending:</strong> Your investor profile is awaiting Super Admin verification. Term sheet proposals are restricted until approved.</span>
          </div>
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase">PENDING VETTING</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR (HEADER) */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="FundBridge Logo" className="h-7 w-auto" />
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase tracking-wider font-mono">
            INVESTOR PORTAL
          </span>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Quickly search startups, categories, founders, or co-investors..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-xs text-slate-800 transition-all outline-none"
          />
          {globalSearch && (
            <button onClick={() => setGlobalSearch('')} className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3.5 relative">
          {/* Active Chat Inbox */}
          <button
            onClick={() => {
              setChatTarget({ name: 'All Founders & Co-Investors', id: 'all' });
              setShowChatDrawer(true);
            }}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Open Active Chat Inbox"
          >
            <MessageSquare className="w-4.5 h-4.5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Real-time Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute top-1 right-1 px-1 py-0.2 bg-[#047857] hover:bg-[#065f46] text-white text-[9px] font-bold rounded-full ring-2 ring-white">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-fadeIn text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Real-Time Notifications</span>
                  </h4>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
                    {notifications.filter(n => !n.is_read).length} Unread
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div
                        key={n.id || n._id}
                        onClick={async () => {
                          try {
                            await fetch(`${API_BASE_URL}/api/notifications/${n.id || n._id}/read`, { method: 'PUT' });
                            setNotifications(prev => prev.map(x => (x.id === n.id || x._id === n._id ? { ...x, is_read: true } : x)));
                          } catch(e){}
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          !n.is_read ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-100 opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-slate-900 text-[11px] block">{n.title}</span>
                          <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap">
                            {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-tight mt-1">{n.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="py-6 text-center text-xs text-slate-400">No notifications yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 my-auto"></div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <InitialsAvatar name={profileUser.name} className="w-8 h-8" />
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">{profileUser.name}</span>
                <span className="text-[10px] text-emerald-700 font-semibold block leading-tight">Verified Investor</span>
              </div>
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 top-12 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-3 space-y-2 animate-fadeIn text-left">
                <div className="p-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{profileUser.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{profileUser.email}</p>
                  <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>KYC Status: VERIFIED</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setIsProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Account Settings</span>
                </button>

                <button
                  onClick={handlePromptLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN BODY: SIDEBAR NAVIGATION */}
      <div className="flex-1 flex min-w-0">
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-white border-r border-slate-200 p-5 flex flex-col justify-between shrink-0 select-none">
          <nav className="space-y-1.5">
            {/* 1. Overview */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span>Overview</span>
            </button>

            {/* 2. Explore Campaigns */}
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'campaigns'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Rocket className="w-4.5 h-4.5" />
              <span>Explore Campaigns</span>
            </button>

            {/* 3. My Investments */}
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'portfolio'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4.5 h-4.5" />
              <span>My Investments</span>
            </button>

            {/* 4. Wallet */}
            <button
              onClick={() => setActiveTab('wallet')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'wallet'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-4.5 h-4.5" />
              <span>Wallet</span>
            </button>

            {/* 5. Co Investors */}
            <button
              onClick={() => setActiveTab('investors')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'investors'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="w-4.5 h-4.5" />
              <span>Co Investors</span>
            </button>

            {/* 6. Audit Logs */}
            <button
              onClick={() => setActiveTab('audit-logs')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'audit-logs'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <History className="w-4.5 h-4.5" />
              <span>Audit Logs</span>
            </button>
          </nav>

          <div className="pt-6 border-t border-slate-200 space-y-2">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                activeTab === 'settings' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Account Settings</span>
            </button>

            <button
              onClick={handlePromptLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN WORKSPACE CONTENT */}
        <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto min-w-0">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-9 h-9 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-medium font-mono">Fetching database records...</p>
            </div>
          ) : (
            <>
              {/* Account Frozen Warning Banner */}
              {(profileUser.vettingStatus === 'frozen' || profileUser.vetting_status === 'frozen') && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      <strong>Account ID Frozen:</strong> An active complaint has been reported regarding this account. Your profile and platform investment activities are restricted pending administrative decision.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-200 text-rose-900 font-mono text-[10px] font-bold uppercase">
                    FROZEN (PENDING DECISION)
                  </span>
                </div>
              )}

              {/* TAB 1: OVERVIEW PANEL */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-fadeIn">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Investor Overview</h1>
                    <p className="text-xs text-slate-500 mt-1">High-level live dashboard displaying your interested watchlist, submitted proposals, and bookmarked student founders.</p>
                  </div>

                  {/* 6 LIVE INTERACTIVE METRIC CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Card 1: My Investments */}
                    <div
                      onClick={() => setShowInvestmentsModal(true)}
                      className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">MY INVESTMENTS</span>
                        <Briefcase className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-emerald-800 font-mono">{fundedCampaigns.length}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold group-hover:underline flex items-center gap-0.5 font-sans">
                          View List ({fundedCampaigns.length}) <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight font-sans">Active & accepted startup investments</p>
                    </div>

                    {/* Card 2: Rejected Proposals */}
                    <div
                      onClick={() => setShowRejectedProposalsModal(true)}
                      className="bg-white border border-slate-200 hover:border-rose-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">REJECTED PROPOSALS</span>
                        <XCircle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-rose-600 font-mono">{rejectedProposals.length}</span>
                        <span className="text-[10px] text-rose-600 font-semibold group-hover:underline flex items-center gap-0.5 font-sans">
                          View List ({rejectedProposals.length}) <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight font-sans">Declined, rejected or withdrawn offers</p>
                    </div>

                    {/* Card 3: Submitted Proposals */}
                    <div
                      onClick={() => setShowProposalsModal(true)}
                      className="bg-white border border-slate-200 hover:border-sky-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">SUBMITTED PROPOSALS</span>
                        <FileText className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-sky-700 font-mono">{proposals.length}</span>
                        <span className="text-[10px] text-sky-600 font-semibold group-hover:underline flex items-center gap-0.5 font-sans">
                          View Table ({proposals.length}) <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight font-sans">All investment offers sent to startups</p>
                    </div>

                    {/* Card 4: Co-Investors Connected */}
                    <div
                      onClick={() => setShowConnectedInvestorsModal(true)}
                      className="bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">CO-INVESTORS CONNECTED</span>
                        <Users className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-indigo-700 font-mono">{coInvestors.length}</span>
                        <span className="text-[10px] text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5 font-sans">
                          View Network ({coInvestors.length}) <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight font-sans">Alumni & angel co-investors in network</p>
                    </div>

                    {/* Card 5: Saved Watchlist */}
                    <div
                      onClick={() => setShowWatchlistModal(true)}
                      className="bg-white border border-slate-200 hover:border-amber-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">SAVED WATCHLIST</span>
                        <Bookmark className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-amber-600 font-mono">{watchlistCampaigns.length}</span>
                        <span className="text-[10px] text-amber-600 font-semibold group-hover:underline flex items-center gap-0.5 font-sans">
                          View Watchlist ({watchlistCampaigns.length}) <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight font-sans">Startups pinned for ongoing evaluation</p>
                    </div>

                    {/* Card 6: Student Founders Connected */}
                    <div
                      onClick={() => setShowBookmarkedFoundersModal(true)}
                      className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">CONNECTED FOUNDERS</span>
                        <GraduationCap className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-emerald-800 font-mono">{interestedFoundersList.length}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold group-hover:underline flex items-center gap-0.5 font-sans">
                          View Founders ({interestedFoundersList.length}) <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight font-sans">Bookmarked student entrepreneurs</p>
                    </div>
                  </div>

                  {/* SECTION 1: CAMPAIGNS I AM INTERESTED IN (SAVED WATCHLIST) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Bookmark className="w-4 h-4 text-amber-600 fill-current" />
                          <span>Campaigns I Am Interested In (Saved Watchlist)</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Startups you have pinned to your watchlist for ongoing tracking.</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        {watchlistCampaigns.length} Pinned Startups
                      </span>
                    </div>

                    {watchlistCampaigns.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {watchlistCampaigns.map((c, idx) => (
                          <div key={c.id || c._id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase">
                                  {c.category || 'Startup'}
                                </span>
                                <button
                                  onClick={() => handleToggleWatchlist(c.id || c._id)}
                                  className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                                >
                                  Unpin
                                </button>
                              </div>
                              <h3 className="font-bold text-slate-900 text-base">{c.title}</h3>
                              <span className="text-xs font-semibold text-emerald-700 block">{c.university}</span>
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{c.tagline || c.description}</p>
                            </div>

                            <div className="pt-3 border-t border-slate-200 space-y-3">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-slate-500">Goal: <strong>৳ {Number(c.goal || 0).toLocaleString()}</strong></span>
                                <span className="text-emerald-700 font-bold">{c.equityOffer || c.equity_offer || 'Rev Share'}</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setSelectedCampaignDetail(c)}
                                  className="flex-1 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => setSelectedProposalCampaign(c)}
                                  className="flex-1 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
                                >
                                  Submit Offer
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center bg-slate-50 rounded-2xl space-y-2">
                        <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-500 font-medium">You haven't pinned any startups to your watchlist yet.</p>
                        <button
                          onClick={() => setActiveTab('campaigns')}
                          className="px-3.5 py-1.5 bg-[#047857] text-white text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          Explore Campaigns & Pin Startups
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: MY SUBMITTED PROPOSALS & FUNDING OFFERS */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-sky-600" />
                          <span>My Submitted Proposals & Funding Offers</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Track investment offers sent to student founders and their status.</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                        {mySubmittedProposals.length} Total Offers
                      </span>
                    </div>

                    {mySubmittedProposals.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                              <th className="pb-3 font-semibold">STARTUP CAMPAIGN</th>
                              <th className="pb-3 font-semibold">SUBMISSION DATE</th>
                              <th className="pb-3 font-semibold">PROPOSED AMOUNT</th>
                              <th className="pb-3 font-semibold">OFFERED TERMS</th>
                              <th className="pb-3 font-semibold">STATUS</th>
                              <th className="pb-3 font-semibold text-right">ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {mySubmittedProposals.map((p, idx) => {
                              const propId = p.id || p._id;
                              const cmp = campaigns.find(c => c.id === p.campaign_id || c._id === p.campaign_id || c.id === p.campaignId || c._id === p.campaignId);

                              return (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-4 font-semibold text-slate-900">
                                    {cmp ? cmp.title : (p.campaign_title || p.campaign_id || 'Unknown campaign')}
                                  </td>
                                  <td className="py-4 text-slate-500 font-mono">
                                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}
                                  </td>
                                  <td className="py-4 font-mono font-bold text-slate-900">
                                    ৳ {s3ProposalAmount(p).toLocaleString()}
                                    {String(p.status).toLowerCase() === 'negotiating' && p.counter_amount != null && (
                                      <span className="block text-[10px] font-normal text-sky-600">counter</span>
                                    )}
                                  </td>
                                  <td className="py-4 text-slate-700">
                                    {s3ProposalTerms(p)}
                                  </td>
                                  <td className="py-4">
                                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase ${s3StatusClass(p.status)}`}>
                                      {p.status || 'PENDING'}
                                    </span>
                                  </td>
                                  <td className="py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => setProposalDetailModal(p)}
                                        className="px-2.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                                      >
                                        Details
                                      </button>
                                      <button
                                        onClick={() => {
                                          setChatTarget({ name: cmp?.founder?.name || 'Founder', id: cmp?.founder_id || 'usr_founder_1' });
                                          setShowChatDrawer(true);
                                        }}
                                        className="px-2.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                                      >
                                        Message
                                      </button>
                                      {(p.status === 'pending' || p.status === 'negotiating') && (
                                        <button
                                          onClick={() => handleWithdrawProposal(propId)}
                                          className="px-2.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                                        >
                                          Withdraw
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-12 text-center bg-slate-50 rounded-2xl space-y-2">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-500 font-medium">No investment proposals submitted yet.</p>
                        <button
                          onClick={() => setActiveTab('campaigns')}
                          className="px-3.5 py-1.5 bg-[#047857] text-white text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          Explore Campaigns to Back Startups
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SECTION 3: STUDENT FOUNDERS I AM INTERESTED IN ONLY */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-indigo-700" />
                          <span>Student Founders I Am Interested In</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Showing only student entrepreneurs you have bookmarked / marked interest in.</p>
                      </div>

                      <button
                        onClick={() => setShowAllFoundersModal(true)}
                        className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        <span>View All Registered Founders ({foundersList.length})</span>
                      </button>
                    </div>

                    {interestedFoundersList.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {interestedFoundersList.map((founder, idx) => {
                          const founderId = founder.id || founder._id || idx;
                          const founderCampaign = campaigns.find(c => (c.founder_id === founderId || c.founderId === founderId || c.founder?._id === founderId));

                          return (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:shadow-sm transition-all">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <InitialsAvatar name={founder.name} className="w-11 h-11 text-xs bg-indigo-700" />
                                    <div>
                                      <h3 className="font-bold text-slate-900 text-sm">{founder.name}</h3>
                                      <span className="text-xs font-semibold text-emerald-700 block">{founder.university}</span>
                                      <span className="text-[10px] text-slate-500 block">{founder.department || 'CSE'}</span>
                                    </div>
                                  </div>
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-md uppercase font-mono shrink-0 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    <span>VERIFIED</span>
                                  </span>
                                </div>

                                <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1 text-xs">
                                  <div className="flex items-center justify-between text-slate-600">
                                    <span className="text-[9px] font-mono text-slate-400 uppercase">STUDENT ID:</span>
                                    <span className="font-mono font-bold text-slate-800">{founder.studentId || founder.student_id || '20101452'}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-slate-600">
                                    <span className="text-[9px] font-mono text-slate-400 uppercase">CONTACT MFS:</span>
                                    <span className="font-mono font-bold text-slate-800">{founder.mfsNumber || founder.mfs_number || '01711223344'}</span>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 font-sans">
                                  {founder.bio || 'Student founder building next-generation technology solutions in Bangladesh.'}
                                </p>

                                {founderCampaign && (
                                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                                    <span className="text-[9px] font-mono text-emerald-800 font-bold uppercase block">ACTIVE STARTUP CAMPAIGN</span>
                                    <span className="font-bold text-slate-900 block">{founderCampaign.title}</span>
                                    <span className="text-[10px] text-emerald-700 font-mono font-bold">Goal: ৳ {Number(founderCampaign.goal || 0).toLocaleString()} • {founderCampaign.equityOffer || 'Equity'}</span>
                                  </div>
                                )}
                              </div>

                              <div className="pt-3 border-t border-slate-200 flex gap-2">
                                <button
                                  onClick={() => handleToggleBookmarkFounder(founderId)}
                                  className="flex-1 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                                  <span>Remove Interest</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setChatTarget({ name: founder.name, id: founderId });
                                    setShowChatDrawer(true);
                                  }}
                                  className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Message</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center bg-slate-50 rounded-2xl space-y-3">
                        <GraduationCap className="w-9 h-9 text-slate-300 mx-auto" />
                        <div>
                          <p className="text-xs text-slate-600 font-bold">No student founders bookmarked yet.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Click "View All Registered Founders" to browse all {foundersList.length} verified student entrepreneurs and mark your interest.</p>
                        </div>
                        <button
                          onClick={() => setShowAllFoundersModal(true)}
                          className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          View All Registered Founders ({foundersList.length})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: EXPLORE CAMPAIGNS */}
              {activeTab === 'campaigns' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Explore Campaigns Marketplace</h1>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {exploreMarket === 'relief'
                          ? 'Browse admin-approved relief campaigns seeking donations.'
                          : 'Browse all admin-approved student startup campaigns across universities in Bangladesh.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {exploreMarket === 'startup' && comparisonIds.length > 0 && (
                        <button
                          onClick={() => setShowComparisonModal(true)}
                          className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                          <Scale className="w-4 h-4" />
                          <span>Compare Matrix ({comparisonIds.length}/3)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* S3: Startup | Relief marketplace tabs */}
                  <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                    <button
                      type="button"
                      onClick={() => setExploreMarket('startup')}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer ${
                        exploreMarket === 'startup' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      Startup campaigns
                    </button>
                    <button
                      type="button"
                      onClick={() => setExploreMarket('relief')}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer ${
                        exploreMarket === 'relief' ? 'bg-white text-rose-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" />
                      Relief campaigns
                    </button>
                  </div>

                  {/* GRANULAR FILTER & SEARCH ENGINE */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
                      <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                      <span>Filter & Search Engine</span>
                    </div>

                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${exploreMarket === 'startup' ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4 text-xs`}>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Search Keywords</label>
                        <input
                          type="text"
                          placeholder={exploreMarket === 'relief' ? 'Search title, cause, or beneficiary...' : 'Search title, founder, or university...'}
                          value={globalSearch}
                          onChange={(e) => setGlobalSearch(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                        />
                      </div>

                      {exploreMarket === 'startup' && (
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Category</label>
                          <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs cursor-pointer"
                          >
                            <option value="all">All Categories</option>
                            <option value="FoodTech">FoodTech / SaaS</option>
                            <option value="AgriTech">AgriTech / IoT</option>
                            <option value="EdTech">EdTech</option>
                            <option value="FinTech">FinTech</option>
                            <option value="CleanTech">CleanTech</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Target Funding Scale</label>
                        <select
                          value={scaleFilter}
                          onChange={(e) => setScaleFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs cursor-pointer"
                        >
                          <option value="all">All Scales</option>
                          <option value="under5">Under ৳ 5,00,000</option>
                          <option value="5to15">৳ 5,00,000 - ৳ 15,00,000</option>
                          <option value="above15">Above ৳ 15,00,000</option>
                        </select>
                      </div>

                      {exploreMarket === 'startup' && (
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Development Stage</label>
                          <select
                            value={stageFilter}
                            onChange={(e) => setStageFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs cursor-pointer"
                          >
                            <option value="all">All Stages</option>
                            <option value="Prototype">Prototype Stage</option>
                            <option value="MVP">MVP Stage</option>
                            <option value="Pilot">Pilot Stage</option>
                            <option value="Growth">Growth Stage</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* S3: RELIEF CAMPAIGN CARDS */}
                  {exploreMarket === 'relief' ? (
                    filteredReliefCampaigns.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredReliefCampaigns.map((d, idx) => {
                          const rid = d.id || d._id || idx;
                          return (
                            <div key={rid} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                              <div className="space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-[10px] font-extrabold rounded-md uppercase">
                                    {d.cause || 'Relief'}
                                  </span>
                                  <span className="text-[10px] font-semibold text-emerald-700 font-mono uppercase bg-emerald-50 px-2 py-1 rounded-lg">
                                    {d.status || 'open'}
                                  </span>
                                </div>
                                <div>
                                  <h3
                                    onClick={() => setSelectedReliefDetail(d)}
                                    className="font-bold text-slate-900 text-base hover:text-rose-700 transition-colors cursor-pointer"
                                  >
                                    {d.title}
                                  </h3>
                                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-medium">
                                    <GraduationCap className="w-3.5 h-3.5 text-rose-600" />
                                    <span>{d.university || '—'}</span>
                                  </div>
                                  {d.beneficiary && (
                                    <p className="text-[11px] text-slate-500 mt-1">Helps: {d.beneficiary}</p>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 font-sans">
                                  {d.description || 'Relief campaign seeking donations.'}
                                </p>
                              </div>
                              <div className="space-y-3 pt-3 border-t border-slate-100">
                                <div className="flex justify-between text-xs font-mono">
                                  <span className="text-slate-500">Raised: <strong className="text-rose-700">৳ {Number(d.raised || 0).toLocaleString()}</strong></span>
                                  <span className="text-slate-500">Goal: <strong>৳ {Number(d.goal || 0).toLocaleString()}</strong></span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-rose-500 h-full rounded-full transition-all"
                                    style={{ width: d.goal > 0 ? `${Math.min(100, Math.round(((d.raised || 0) / d.goal) * 100))}%` : '0%' }}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReliefDetail(d)}
                                    className="flex-1 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                                    Details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openReliefDonate(d)}
                                    className="flex-1 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
                                  >
                                    Donate
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-400">
                        No relief campaigns found matching filter criteria.
                      </div>
                    )
                  ) : filteredCampaigns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCampaigns.map((c, idx) => {
                        const campId = c.id || c._id || idx;
                        const isPinned = watchlist.includes(campId);

                        return (
                          <div key={campId} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase">
                                  {c.category || 'Startup'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleToggleWatchlist(campId)}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      isPinned ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400 hover:text-slate-700'
                                    }`}
                                    title={isPinned ? 'Remove from Watchlist' : 'Pin to Watchlist'}
                                  >
                                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                                  </button>
                                  <span className="text-[10px] font-semibold text-slate-400 font-mono uppercase bg-slate-100 px-2 py-1 rounded-lg">
                                    {c.stage || 'MVP'}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <h3
                                  onClick={() => setSelectedCampaignDetail(c)}
                                  className="font-bold text-slate-900 text-base hover:text-emerald-700 transition-colors cursor-pointer"
                                >
                                  {c.title}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-medium">
                                  <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>{c.university}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-500 font-semibold">{c.founder?.name || 'Student Founder'}</span>
                                </div>
                              </div>

                              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 font-sans">
                                {c.tagline || c.description}
                              </p>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-slate-100">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-slate-500">Raised: <strong className="text-emerald-700">৳ {Number(c.raised || 0).toLocaleString()}</strong></span>
                                <span className="text-slate-500">Goal: <strong>৳ {Number(c.goal || 0).toLocaleString()}</strong></span>
                              </div>

                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-full rounded-full transition-all"
                                  style={{ width: c.goal > 0 ? `${Math.min(100, Math.round(((c.raised || 0) / c.goal) * 100))}%` : '0%' }}
                                ></div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedCampaignDetail(c)}
                                  className="flex-1 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                                  <span>View Details</span>
                                </button>
                                <button
                                  onClick={() => setSelectedProposalCampaign(c)}
                                  className="flex-1 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
                                >
                                  Submit Offer
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-400">
                      No startup campaigns found matching filter criteria.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MY INVESTMENTS */}
              {activeTab === 'portfolio' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">My Investments & Funded Startups</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Track growth status, operational stages (Level 1, Level 2), and upcoming milestone funding tranches.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowProposalsModal(true)}
                        className="px-3.5 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-sky-600" />
                        <span>Submitted Proposals ({proposals.length})</span>
                      </button>

                      <button
                        onClick={() => {
                          if (campaigns.length > 0) {
                            setComparisonIds(campaigns.slice(0, Math.min(3, campaigns.length)).map(c => c.id || c._id));
                            setShowComparisonModal(true);
                          } else {
                            showToast('No startups available to compare.', 'info');
                          }
                        }}
                        className="px-3.5 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Scale className="w-4 h-4" />
                        <span>3-Startup Comparison Matrix</span>
                      </button>
                    </div>
                  </div>

                  {fundedCampaigns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {fundedCampaigns.map((c, idx) => {
                        const milestones = Array.isArray(c.milestones) ? c.milestones : [];

                        return (
                          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase">
                                  {c.category || 'Startup'}
                                </span>
                                <h3 className="text-base font-bold text-slate-900 mt-1">{c.title}</h3>
                                <span className="text-xs text-emerald-700 font-semibold block">{c.university}</span>
                              </div>

                              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl font-mono uppercase">
                                Level 2: {c.stage || 'Pilot'}
                              </span>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-mono">
                              <span className="text-slate-500">Business Growth Status:</span>
                              <span className="font-bold text-emerald-700 flex items-center gap-1 font-sans">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                <span>ON TARGET / PROGRESSING</span>
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-1">
                              <div>
                                <span className="text-slate-400 block text-[10px]">TOTAL CAPITAL COMMITTED</span>
                                <span className="text-sm font-bold text-slate-900">৳ {Number(c.goal || 500000).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">UPCOMING TRANCHE RELEASE</span>
                                <span className="text-sm font-bold text-emerald-700">৳ 1,50,000 (Tranche #2)</span>
                              </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <span className="text-xs font-bold text-slate-800 block">Execution Milestone Progress</span>
                              <div className="space-y-1.5 text-xs">
                                {milestones.length > 0 ? (
                                  milestones.map((m, mIdx) => (
                                    <div key={mIdx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-slate-700">
                                      <span className="font-medium text-xs">{m.title} ({m.target})</span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                        m.status === 'done' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        {m.status === 'done' ? 'Completed' : 'Pending Milestone'}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[11px] text-slate-400">Level 1 MVP Launch completed, Level 2 Pilot pending.</p>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setChatTarget({ name: c.founder?.name || 'Founder', id: c.founder_id || 'usr_founder_1' });
                                setShowChatDrawer(true);
                              }}
                              className="w-full py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                            >
                              <MessageSquare className="w-4 h-4 text-slate-600" />
                              <span>Message Founder Direct</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
                      <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">No Active Funded Investments Yet</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">Submitted offers remain under "Submitted Proposals" while pending. Once a student founder accepts your offer, the startup will automatically be added to your active investments portfolio here.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('campaigns')}
                        className="px-4 py-2 bg-[#047857] text-white text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        Explore Marketplace
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: WALLET — S3: same model as founder (Add Money + ledger) */}
              {activeTab === 'wallet' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Wallet</h1>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Add Money with payment proof. Admin verifies top-ups before credit. Accepted investments and relief donations debit this wallet.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddMoneyModal(true)}
                        className="px-4 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Money</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => exportToCSV('FundBridge_Investor_Wallet_Ledger.csv', [...walletInflows, ...walletOutflows])}
                        className="px-4 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export Ledger CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
                    <Info className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>
                      We are building a full online payment gateway. <strong>For now, Add Money is manual:</strong> pay via bKash, bank, or other, upload your receipt, and an admin verifies it before your wallet is credited.
                    </span>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      {walletNote || 'Admin-verified top-ups credit this wallet. Accepted investments and relief donations debit it (ledger display).'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Wallet balance</span>
                      <h3 className="text-3xl font-bold text-emerald-700 font-mono">৳ {Number(walletBalance || 0).toLocaleString()}</h3>
                      <p className="text-[11px] text-slate-500">Verified Add Money minus deployments</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Capital committed</span>
                      <h3 className="text-3xl font-bold text-slate-900 font-mono">৳ {Number(walletCommitted || 0).toLocaleString()}</h3>
                      <p className="text-[11px] text-slate-500">Accepted investments + relief donations</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Available to deploy</span>
                      <h3 className="text-3xl font-bold text-sky-600 font-mono">৳ {Number(walletAvailable || 0).toLocaleString()}</h3>
                      <p className="text-[11px] text-slate-500">
                        Pending offers hold ৳ {Number(walletPendingHeld || pendingCommitmentAmount || 0).toLocaleString()} (not reserved yet)
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-base">Credits (Add Money)</h3>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{walletInflows.length} credits</span>
                    </div>
                    {walletInflows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                              <th className="pb-3 font-semibold">Type</th>
                              <th className="pb-3 font-semibold">Detail</th>
                              <th className="pb-3 font-semibold">Amount</th>
                              <th className="pb-3 font-semibold">When</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {walletInflows.map((row) => (
                              <tr key={row.id || `${row.proposal_id}-${row.created_at}`} className="hover:bg-slate-50/80">
                                <td className="py-3.5 font-semibold text-slate-900">{row.type || 'CREDIT'}</td>
                                <td className="py-3.5 text-slate-600">{row.campaign_title || row.note || '—'}</td>
                                <td className="py-3.5 font-mono font-bold text-emerald-700">+ ৳ {Number(row.amount || 0).toLocaleString()}</td>
                                <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                                  {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                        No credits yet. Use Add Money and wait for admin verification.
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-base">Deployments (investments & relief)</h3>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{walletOutflows.length} outs</span>
                    </div>
                    {walletOutflows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                              <th className="pb-3 font-semibold">Type</th>
                              <th className="pb-3 font-semibold">Campaign</th>
                              <th className="pb-3 font-semibold">Amount</th>
                              <th className="pb-3 font-semibold">When</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {walletOutflows.map((row) => (
                              <tr key={row.id || `${row.proposal_id}-${row.created_at}`} className="hover:bg-slate-50/80">
                                <td className="py-3.5 font-semibold text-slate-900">
                                  {row.type === 'RELIEF_OUT' ? 'Relief' : row.type === 'INVESTMENT_OUT' ? 'Investment' : (row.type || 'OUT')}
                                </td>
                                <td className="py-3.5 text-slate-600">{row.campaign_title || row.campaign_id || '—'}</td>
                                <td className="py-3.5 font-mono font-bold text-rose-700">− ৳ {Number(row.amount || 0).toLocaleString()}</td>
                                <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                                  {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                        No deployments yet. Accepted offers and relief Add Money appear here.
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-base">Add Money requests</h3>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{walletDeposits.length} requests</span>
                    </div>
                    {walletDeposits.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                              <th className="pb-3 font-semibold">Amount</th>
                              <th className="pb-3 font-semibold">Method</th>
                              <th className="pb-3 font-semibold">Reference</th>
                              <th className="pb-3 font-semibold">Proof</th>
                              <th className="pb-3 font-semibold">Status</th>
                              <th className="pb-3 font-semibold">When</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {walletDeposits.map((d) => (
                              <tr key={d.id} className="hover:bg-slate-50/80">
                                <td className="py-3.5 font-mono font-bold text-slate-900">৳ {Number(d.amount || 0).toLocaleString()}</td>
                                <td className="py-3.5 uppercase">{d.method || '—'}</td>
                                <td className="py-3.5 font-mono text-slate-600">{d.reference || '—'}</td>
                                <td className="py-3.5">
                                  {d.proof_url ? (
                                    <a href={`${API_BASE_URL}${d.proof_url}`} target="_blank" rel="noreferrer" className="text-sky-700 font-semibold hover:underline">
                                      View proof
                                    </a>
                                  ) : '—'}
                                </td>
                                <td className="py-3.5">
                                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase ${
                                    d.status === 'approved' ? 'bg-emerald-500 text-white' :
                                    d.status === 'rejected' ? 'bg-rose-500 text-white' :
                                    'bg-amber-400 text-amber-950'
                                  }`}>
                                    {d.status || 'pending'}
                                  </span>
                                </td>
                                <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                                  {d.created_at ? new Date(d.created_at).toLocaleString() : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-4 text-center">No Add Money requests yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: CO INVESTORS */}
              {activeTab === 'investors' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Co-Investors Network Directory</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Discover and network with verified alumni angel backers and venture partners.</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search investor or firm..."
                          value={investorSearch}
                          onChange={(e) => setInvestorSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {filteredInvestors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {filteredInvestors.map((inv, idx) => {
                        const invId = inv.id || inv._id || idx;
                        const isConnected = investorConnections.some(c => c.receiver_id === invId || c.requester_id === invId);

                        return (
                          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3.5">
                              <InitialsAvatar name={inv.name || inv.institution} className="w-12 h-12 text-sm" />
                              <div className="space-y-0.5">
                                <h3 className="font-bold text-slate-900 text-sm">{inv.name}</h3>
                                <span className="text-xs font-semibold text-emerald-700 block">{inv.institution || 'Corporate Alumni Backer'}</span>
                                <span className="text-[10px] text-slate-400 font-mono uppercase block">{inv.university || 'BUET / BRACU Syndicate'}</span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 font-sans">
                              {inv.bio || 'Backing early-stage university tech ventures across Bangladesh.'}
                            </p>

                            <div className="pt-3 border-t border-slate-100 flex gap-2">
                              <button
                                onClick={() => handleSendConnectionRequest(invId)}
                                className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                  isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                }`}
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>{isConnected ? 'Connected' : 'Send Request'}</span>
                              </button>

                              <button
                                onClick={() => {
                                  setChatTarget({ name: inv.name || 'Co-Investor', id: invId });
                                  setShowChatDrawer(true);
                                }}
                                className="px-3 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                                title="Send Direct Message"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-400">
                      No co-investor accounts found matching search criteria.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: AUDIT LOGS */}
              {activeTab === 'audit-logs' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Your Audit Logs</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Actions from this investor account only — proposals, donations, and portfolio events. Founder activity stays on the founder portal.</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative w-56">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search receipt ID..."
                          value={auditSearch}
                          onChange={(e) => setAuditSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                        />
                      </div>

                      <button
                        onClick={() => exportToCSV('FundBridge_Audit_Logs.csv', filteredAuditLogs)}
                        className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  {filteredAuditLogs.length > 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                              <th className="pb-3 font-semibold">CATEGORY</th>
                              <th className="pb-3 font-semibold">ACTION TITLE</th>
                              <th className="pb-3 font-semibold">STATUS</th>
                              <th className="pb-3 font-semibold">RECEIPT HASH ID</th>
                              <th className="pb-3 font-semibold">LATENCY</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredAuditLogs.map((log, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80">
                                <td className="py-4 font-mono font-bold text-slate-800">{log.category || 'AUDIT'}</td>
                                <td className="py-4 font-semibold text-slate-900">{log.title || 'System Event'}</td>
                                <td className="py-4">
                                  <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-md uppercase">
                                    {log.status || 'VERIFIED'}
                                  </span>
                                </td>
                                <td className="py-4 font-mono text-sky-600 font-semibold">{log.hash || '0x8f2a99c4'}</td>
                                <td className="py-4 text-slate-400 font-mono">{log.latency || '14ms'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-400 font-mono">
                      No matching audit hash records found in database.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: ACCOUNT SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-2xl animate-fadeIn">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Investor Account Settings</h1>
                    <p className="text-xs text-slate-500 mt-1">Manage institutional credentials, contact info, and investment preferences.</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <InitialsAvatar name={profileUser.name} className="w-16 h-16 text-lg" />
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{profileUser.name}</h3>
                          <span className="text-xs text-emerald-700 font-semibold block">{profileUser.institution}</span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase">Vetting Status: VERIFIED</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Investor / Contact Name</label>
                        <input
                          type="text"
                          value={profileUser.name}
                          onChange={(e) => setProfileUser({ ...profileUser, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={profileUser.email}
                          onChange={(e) => setProfileUser({ ...profileUser, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Institution / Venture Syndicate</label>
                        <input
                          type="text"
                          value={profileUser.institution}
                          onChange={(e) => setProfileUser({ ...profileUser, institution: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Contact / MFS Number</label>
                        <input
                          type="text"
                          value={profileUser.mfsNumber}
                          onChange={(e) => setProfileUser({ ...profileUser, mfsNumber: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Investment Bio</label>
                        <textarea
                          rows={3}
                          value={profileUser.bio}
                          onChange={(e) => setProfileUser({ ...profileUser, bio: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        ></textarea>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handlePromptLogout}
                        className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>

                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
                      >
                        Save Profile Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* VIEW ALL REGISTERED STUDENT FOUNDERS DIRECTORY MODAL (100 Founders) */}
      {showAllFoundersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-700" />
                  <span>All Registered Student Founders & Entrepreneurs ({foundersList.length})</span>
                </h3>
                <p className="text-xs text-slate-500">Browse all 100 student entrepreneurs in the database and click "Mark Interest" to add them to your Overview.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, university, or ID..."
                    value={modalFounderSearch}
                    onChange={(e) => setModalFounderSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <button onClick={() => setShowAllFoundersModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {filteredModalFounders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredModalFounders.map((founder, idx) => {
                  const founderId = founder.id || founder._id || idx;
                  const isBookmarked = bookmarkedFounders.includes(founderId);

                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between hover:border-indigo-300 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <InitialsAvatar name={founder.name} className="w-10 h-10 text-xs bg-indigo-700" />
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs">{founder.name}</h4>
                              <span className="text-[11px] font-semibold text-emerald-700 block">{founder.university}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-extrabold rounded uppercase font-mono shrink-0">
                            VERIFIED
                          </span>
                        </div>

                        <div className="p-2 bg-white border border-slate-100 rounded-lg text-[11px] space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span className="text-[9px] text-slate-400 font-mono">DEPT:</span>
                            <span className="font-semibold text-slate-800 truncate">{founder.department || 'CSE'}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span className="text-[9px] text-slate-400 font-mono">STUDENT ID:</span>
                            <span className="font-mono font-bold text-slate-800">{founder.studentId || founder.student_id || '20101452'}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight font-sans">
                          {founder.bio || 'Student founder building next-generation technology solutions.'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex gap-2">
                        <button
                          onClick={() => handleToggleBookmarkFounder(founderId)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                            isBookmarked ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                          <span>{isBookmarked ? 'Bookmarked' : 'Mark Interest'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowAllFoundersModal(false);
                            setChatTarget({ name: founder.name, id: founderId });
                            setShowChatDrawer(true);
                          }}
                          className="px-2.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-slate-400">No student founders matching search criteria.</p>
            )}
          </div>
        </div>
      )}

      {/* DECISION CONFIRMATION MODAL ("ARE YOU SURE?") */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{confirmModal.title || 'Are you sure?'}</h3>
                <p className="text-xs text-slate-500 font-medium">Please confirm your decision to proceed.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 text-xs">
              <p className="text-slate-800 font-medium leading-relaxed">{confirmModal.message}</p>
              {confirmModal.warning && (
                <p className="text-[11px] text-amber-800 font-semibold">{confirmModal.warning}</p>
              )}
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent font-semibold rounded-xl text-xs cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-2.5 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer transition-colors ${
                  confirmModal.confirmColor || 'bg-[#047857] hover:bg-[#065f46] text-white'
                }`}
              >
                {confirmModal.confirmText || 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* S3: RELIEF DETAIL MODAL (Explore Relief tab) */}
      {selectedReliefDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 gap-3">
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-extrabold rounded-md uppercase">
                  {selectedReliefDetail.cause || 'Relief'}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">{selectedReliefDetail.title}</h2>
                <p className="text-xs text-slate-500">{selectedReliefDetail.university || '—'}</p>
              </div>
              <button type="button" onClick={() => setSelectedReliefDetail(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Beneficiary</p>
                <p className="font-semibold text-slate-800 mt-1">{selectedReliefDetail.beneficiary || '—'}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Funding</p>
                <p className="font-mono font-semibold text-slate-800 mt-1">
                  Raised ৳ {Number(selectedReliefDetail.raised || 0).toLocaleString()} / Goal ৳ {Number(selectedReliefDetail.goal || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-xs space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-400">Description</p>
              <p className="text-slate-700 whitespace-pre-wrap">{selectedReliefDetail.description || 'No description provided.'}</p>
            </div>
            {Array.isArray(selectedReliefDetail.useOfFunds) && selectedReliefDetail.useOfFunds.filter(Boolean).length > 0 && (
              <div className="text-xs space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Use of funds</p>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {selectedReliefDetail.useOfFunds.filter(Boolean).map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* S3: relief progress milestones (work tracking — no repayment) */}
            {Array.isArray(selectedReliefDetail.milestones) && selectedReliefDetail.milestones.length > 0 && (
              <div className="text-xs space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-400">Progress milestones</p>
                <p className="text-[11px] text-slate-500">Founders show work is being done with your donations.</p>
                <div className="space-y-2">
                  {selectedReliefDetail.milestones.map((m, idx) => {
                    const st = String(m.status || 'pending').toLowerCase();
                    const done = st === 'done' || st === 'completed';
                    const review = st === 'pending_review' || st === 'pending review';
                    return (
                      <div key={idx} className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                        <div>
                          <p className="font-semibold text-slate-800">{m.title || m.name || `Phase ${idx + 1}`}</p>
                          <p className="text-[10px] text-slate-500">Target: {m.target || m.targetDate || 'TBD'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          done ? 'bg-emerald-100 text-emerald-800' :
                          review ? 'bg-sky-100 text-sky-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {done ? 'Done' : review ? 'In review' : (m.status || 'pending')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {Array.isArray(selectedReliefDetail.proofLinks) && selectedReliefDetail.proofLinks.length > 0 && (
              <div className="text-xs space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Proof links</p>
                <ul className="space-y-1">
                  {selectedReliefDetail.proofLinks.map((p, i) => (
                    <li key={i} className="truncate">
                      <span className="font-semibold text-slate-600">{p.type || 'Link'}: </span>
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline break-all">{p.url}</a>
                      ) : '—'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              Relief campaigns are donation causes. Use Donate to contribute from your wallet.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedReliefDetail(null)}
                className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  openReliefDonate(selectedReliefDetail);
                  setSelectedReliefDetail(null);
                }}
                className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Donate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* S3: Add Money to investor wallet (admin verifies) */}
      {showAddMoneyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Money to Wallet</h3>
              <button type="button" onClick={() => setShowAddMoneyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-950 leading-relaxed">
              Send money via bKash, bank, or another channel, then upload your receipt. An admin verifies the proof before your wallet is credited.
            </div>
            <form onSubmit={handleAddMoneySubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount (৳)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={addMoneyAmount}
                  onChange={(e) => setAddMoneyAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="e.g. 25000"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Method</label>
                <select
                  value={addMoneyMethod}
                  onChange={(e) => setAddMoneyMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">Bank transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reference / Trx ID</label>
                <input
                  type="text"
                  value={addMoneyReference}
                  onChange={(e) => setAddMoneyReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="e.g. TXN123456"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Note (optional)</label>
                <textarea
                  rows={2}
                  value={addMoneyNote}
                  onChange={(e) => setAddMoneyNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Payment proof (JPG / PNG / PDF) <span className="text-rose-600">*</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Click the box below to choose your receipt file — this is required before Submit.
                </p>
                <label className="flex flex-col items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-sky-400 hover:bg-sky-50/40">
                  <Upload className="w-6 h-6 text-sky-600" />
                  <span className="text-[11px] text-slate-600 font-medium text-center px-3">
                    {addMoneyProof ? addMoneyProof.name : 'Click here to upload JPG, PNG, or PDF receipt'}
                  </span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf"
                    required
                    className="hidden"
                    onChange={(e) => setAddMoneyProof(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddMoneyModal(false)}
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAddMoney}
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-xl disabled:opacity-60"
                >
                  {submittingAddMoney ? 'Submitting…' : 'Submit for verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* S3: Donate to relief campaign */}
      {reliefDonateTarget && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Donate to Relief</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{reliefDonateTarget.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setReliefDonateTarget(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Record a donation to this relief campaign. This raises the cause total and debits your wallet.
            </p>
            <form onSubmit={handleReliefDonate} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount (৳)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={reliefDonateAmount}
                  onChange={(e) => setReliefDonateAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Method</label>
                <select
                  value={reliefDonateMethod}
                  onChange={(e) => setReliefDonateMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">Bank transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reference / Trx ID (optional)</label>
                <input
                  type="text"
                  value={reliefDonateReference}
                  onChange={(e) => setReliefDonateReference(e.target.value)}
                  placeholder="e.g. TXN123456"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setReliefDonateTarget(null)}
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReliefDonate}
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-xl cursor-pointer disabled:opacity-60"
                >
                  {submittingReliefDonate ? 'Donating…' : 'Donate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL BUSINESS & DETAILED FOUNDER PROFILE VIEW MODAL */}
      {selectedCampaignDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase">
                    {selectedCampaignDetail.category || 'Startup'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                    {selectedCampaignDetail.stage || 'MVP'} Stage
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">{selectedCampaignDetail.title}</h2>
                <p className="text-xs text-slate-500">{selectedCampaignDetail.tagline || selectedCampaignDetail.description}</p>
              </div>
              <button onClick={() => setSelectedCampaignDetail(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                  <span>Full Business Profile & Pitch Details</span>
                </h4>
                <p className="text-slate-700 leading-relaxed text-xs font-sans">{selectedCampaignDetail.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                <div>
                  <span className="text-slate-500 block text-[10px]">TARGET FUNDING BUDGET</span>
                  <span className="text-lg font-extrabold text-slate-900">৳ {Number(selectedCampaignDetail.goal || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CAPITAL RAISED</span>
                  <span className="text-lg font-extrabold text-sky-700">৳ {Number(selectedCampaignDetail.raised || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">OFFERED RETURN TERMS</span>
                  <span className="text-lg font-extrabold text-emerald-800">{selectedCampaignDetail.equityOffer || selectedCampaignDetail.equity_offer || '8% Rev Share'}</span>
                </div>
              </div>

              {/* Execution Milestone Roadmap */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Execution Milestone Roadmap</h4>
                <div className="space-y-2">
                  {Array.isArray(selectedCampaignDetail.milestones) && selectedCampaignDetail.milestones.length > 0 ? (
                    selectedCampaignDetail.milestones.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{m.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Target Timeline: {m.target}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md ${
                          m.status === 'done' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {m.status === 'done' ? 'Completed' : 'Pending Milestone'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 font-sans">Level 1 MVP Launch completed, Level 2 Pilot pending.</p>
                  )}
                </div>
              </div>

              {/* FOUNDER & TEAM PROFILE */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-700" />
                    <span>Student Founder & Entrepreneur Info</span>
                  </h4>
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-md uppercase font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>VERIFIED STUDENT</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">FOUNDER NAME</span>
                    <strong className="text-slate-900 text-sm">{selectedCampaignDetail.founder?.name || 'Anika Rahman'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">UNIVERSITY & DEPARTMENT</span>
                    <strong className="text-emerald-800 text-xs">{selectedCampaignDetail.university} • {selectedCampaignDetail.founder?.department || 'CSE'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">STUDENT ID NUMBER</span>
                    <strong className="text-slate-800 font-mono text-xs">{selectedCampaignDetail.founder?.studentId || selectedCampaignDetail.founder?.student_id || '20101452'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">CONTACT MFS / PHONE</span>
                    <strong className="text-slate-800 font-mono text-xs">{selectedCampaignDetail.founder?.mfsNumber || selectedCampaignDetail.founder?.mfs_number || '01711223344'}</strong>
                  </div>
                </div>

                {selectedCampaignDetail.founder?.bio && (
                  <p className="text-slate-600 text-xs leading-relaxed pt-1 border-t border-indigo-100 font-sans">
                    {selectedCampaignDetail.founder.bio}
                  </p>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    const c = selectedCampaignDetail;
                    setSelectedCampaignDetail(null);
                    setSelectedProposalCampaign(c);
                  }}
                  className="py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  Submit Offer
                </button>

                <button
                  onClick={() => {
                    handleToggleWatchlist(selectedCampaignDetail.id || selectedCampaignDetail._id);
                  }}
                  className="py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Pin Watchlist</span>
                </button>

                <button
                  onClick={() => {
                    const c = selectedCampaignDetail;
                    setSelectedCampaignDetail(null);
                    setChatTarget({ name: c.founder?.name || 'Founder', id: c.founder_id || 'usr_founder_1' });
                    setShowChatDrawer(true);
                  }}
                  className="py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message</span>
                </button>

                <button
                  onClick={() => {
                    const c = selectedCampaignDetail;
                    setSelectedCampaignDetail(null);
                    setFlagModalCampaign(c);
                  }}
                  className="py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report / Flag</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROPOSALS TABLE MODAL */}
      {showProposalsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-base">Submitted Funding Proposals Table</h3>
              </div>
              <button onClick={() => setShowProposalsModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {mySubmittedProposals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                      <th className="pb-3 font-semibold">STARTUP CAMPAIGN</th>
                      <th className="pb-3 font-semibold">SUBMISSION DATE</th>
                      <th className="pb-3 font-semibold">PROPOSED AMOUNT</th>
                      <th className="pb-3 font-semibold">OFFERED TERMS</th>
                      <th className="pb-3 font-semibold">STATUS</th>
                      <th className="pb-3 font-semibold text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mySubmittedProposals.map((p, idx) => {
                      const propId = p.id || p._id;
                      const cmp = campaigns.find(c => c.id === p.campaign_id || c._id === p.campaign_id || c.id === p.campaignId || c._id === p.campaignId);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-4 font-semibold text-slate-900">{cmp ? cmp.title : (p.campaign_title || p.campaign_id || 'Unknown campaign')}</td>
                          <td className="py-4 text-slate-500 font-mono">{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}</td>
                          <td className="py-4 font-mono font-bold text-slate-900">
                            ৳ {s3ProposalAmount(p).toLocaleString()}
                            {String(p.status).toLowerCase() === 'negotiating' && p.counter_amount != null && (
                              <span className="block text-[10px] font-normal text-sky-600">counter</span>
                            )}
                          </td>
                          <td className="py-4 text-slate-700">{s3ProposalTerms(p)}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase ${s3StatusClass(p.status)}`}>
                              {p.status || 'PENDING'}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setShowProposalsModal(false);
                                  setProposalDetailModal(p);
                                }}
                                className="px-2.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                              >
                                Details
                              </button>
                              {(p.status === 'pending' || p.status === 'negotiating') && (
                                <button
                                  onClick={() => handleWithdrawProposal(propId)}
                                  className="px-2.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                                >
                                  Withdraw
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-slate-400">No proposals submitted yet.</p>
            )}
          </div>
        </div>
      )}

      {/* MY INVESTMENTS FULL LIST MODAL */}
      {showInvestmentsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">My Active Funded Investments ({fundedCampaigns.length})</h3>
              </div>
              <button onClick={() => setShowInvestmentsModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {fundedCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fundedCampaigns.map((c, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded uppercase">
                          {c.category || 'Startup'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{c.title}</h4>
                        <span className="text-xs text-emerald-700 font-semibold block">{c.university}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-lg font-mono uppercase">
                        {c.stage || 'MVP'} Stage
                      </span>
                    </div>

                    <div className="flex justify-between text-xs font-mono pt-1 border-t border-slate-200">
                      <span className="text-slate-500">Target Budget: <strong>৳ {Number(c.goal || 0).toLocaleString()}</strong></span>
                      <span className="text-emerald-700 font-bold">Raised: ৳ {Number(c.raised || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          setShowInvestmentsModal(false);
                          setSelectedCampaignDetail(c);
                        }}
                        className="flex-1 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setShowInvestmentsModal(false);
                          setChatTarget({ name: c.founder?.name || 'Founder', id: c.founder_id || 'usr_founder_1' });
                          setShowChatDrawer(true);
                        }}
                        className="flex-1 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center justify-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-xl space-y-2">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No active accepted investments yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REJECTED & DECLINED PROPOSALS FULL LIST MODAL */}
      {showRejectedProposalsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">Rejected & Declined Proposals ({rejectedProposals.length})</h3>
              </div>
              <button onClick={() => setShowRejectedProposalsModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {rejectedProposals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                      <th className="pb-3 font-semibold">STARTUP CAMPAIGN</th>
                      <th className="pb-3 font-semibold">SUBMISSION DATE</th>
                      <th className="pb-3 font-semibold">PROPOSED AMOUNT</th>
                      <th className="pb-3 font-semibold">OFFERED TERMS</th>
                      <th className="pb-3 font-semibold">STATUS</th>
                      <th className="pb-3 font-semibold text-right">DETAILS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rejectedProposals.map((p, idx) => {
                      const cmp = campaigns.find(c => c.id === p.campaign_id || c._id === p.campaign_id);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-4 font-semibold text-slate-900">{cmp ? cmp.title : p.campaign_id || 'CampusBites'}</td>
                          <td className="py-4 text-slate-500 font-mono">{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}</td>
                          <td className="py-4 font-mono font-bold text-slate-900">৳ {Number(p.amount || 0).toLocaleString()}</td>
                          <td className="py-4 text-slate-700">{p.terms || '8% Rev Share'}</td>
                          <td className="py-4">
                            <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase bg-rose-500 text-white">
                              {p.status || 'DECLINED'}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => {
                                setShowRejectedProposalsModal(false);
                                setProposalDetailModal(p);
                              }}
                              className="px-2.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                            >
                              View Offer Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-xl space-y-2">
                <XCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No rejected or declined proposals found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONNECTED CO-INVESTORS FULL LIST MODAL */}
      {showConnectedInvestorsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Connected Co-Investors Network ({coInvestors.length})</h3>
              </div>
              <button onClick={() => setShowConnectedInvestorsModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {coInvestors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coInvestors.map((inv, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={inv.name} className="w-10 h-10 text-xs bg-indigo-700" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{inv.name}</h4>
                        <span className="text-[11px] text-slate-500 block">{inv.institution || inv.university || 'Syndicate Member'}</span>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-bold rounded uppercase mt-1 inline-block">Connected Co-Investor</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowConnectedInvestorsModal(false);
                        setChatTarget({ name: inv.name, id: inv.id || inv._id || `inv_${idx}` });
                        setShowChatDrawer(true);
                      }}
                      className="w-full py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message Co-Investor</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-xl space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No connected co-investors in network.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SAVED WATCHLIST STARTUPS FULL LIST MODAL */}
      {showWatchlistModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-600 fill-current" />
                <h3 className="font-bold text-slate-900 text-base">Saved Watchlist Startups ({watchlistCampaigns.length})</h3>
              </div>
              <button onClick={() => setShowWatchlistModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {watchlistCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watchlistCampaigns.map((c, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded uppercase">
                          {c.category || 'Startup'}
                        </span>
                        <button
                          onClick={() => handleToggleWatchlist(c.id || c._id)}
                          className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                        >
                          Unpin
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{c.title}</h4>
                      <span className="text-xs font-semibold text-emerald-700 block">{c.university}</span>
                      <p className="text-xs text-slate-600 line-clamp-2">{c.tagline || c.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-500">Goal: <strong>৳ {Number(c.goal || 0).toLocaleString()}</strong></span>
                        <span className="text-emerald-700 font-bold">{c.equityOffer || c.equity_offer || 'Rev Share'}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowWatchlistModal(false);
                            setSelectedCampaignDetail(c);
                          }}
                          className="flex-1 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            setShowWatchlistModal(false);
                            setSelectedProposalCampaign(c);
                          }}
                          className="flex-1 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Submit Offer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-xl space-y-2">
                <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No startups pinned to watchlist yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONNECTED STUDENT FOUNDERS FULL LIST MODAL */}
      {showBookmarkedFoundersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Connected Student Founders ({interestedFoundersList.length})</h3>
              </div>
              <button onClick={() => setShowBookmarkedFoundersModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {interestedFoundersList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {interestedFoundersList.map((founder, idx) => {
                  const founderId = founder.id || founder._id || idx;

                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <InitialsAvatar name={founder.name} className="w-10 h-10 text-xs bg-indigo-700" />
                          <button
                            onClick={() => handleToggleBookmarkFounder(founderId)}
                            className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                          >
                            Unbookmark
                          </button>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{founder.name}</h4>
                          <span className="text-xs font-semibold text-emerald-700 block">{founder.university} • {founder.department || 'CSE'}</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200 text-[11px] font-mono text-slate-600 space-y-0.5">
                          <div><span className="text-slate-400">ID:</span> <strong>{founder.studentId || founder.student_id || '20101452'}</strong></div>
                          <div><span className="text-slate-400">MFS / Phone:</span> <strong>{founder.mfsNumber || founder.mfs_number || '01711223344'}</strong></div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setShowBookmarkedFoundersModal(false);
                          setChatTarget({ name: founder.name, id: founderId });
                          setShowChatDrawer(true);
                        }}
                        className="w-full py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center justify-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message Founder</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-xl space-y-2">
                <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No bookmarked student founders yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROPOSAL FORM SUBMISSION MODAL */}
      {selectedProposalCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Submit Investment Proposal</h3>
              <button onClick={() => setSelectedProposalCampaign(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">TARGET STARTUP</span>
                <h4 className="font-bold text-slate-900 text-sm">{selectedProposalCampaign.title}</h4>
                <span className="text-[11px] text-emerald-700 font-semibold block">{selectedProposalCampaign.university}</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Proposed Amount (৳)</label>
                <input
                  type="number"
                  required
                  value={proposalAmount}
                  onChange={(e) => setProposalAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Offered Return Terms</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8% Revenue Share or 10% Equity"
                  value={proposalTerms}
                  onChange={(e) => setProposalTerms(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Custom Notes / Terms Sheet Message</label>
                <textarea
                  rows={3}
                  placeholder="Additional conditions to the founder..."
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs"
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProposalCampaign(null)}
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  Submit Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLAG / REPORT CAMPAIGN MODAL */}
      {flagModalCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-rose-600 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Report / Flag Campaign</span>
              </h3>
              <button onClick={() => setFlagModalCampaign(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportCampaign} className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed font-sans">
                Submit a formal security or fraud concern regarding <strong>{flagModalCampaign.title}</strong> directly to platform Administrators.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Issue Concern Type</label>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs cursor-pointer"
                >
                  <option value="">Select Reason...</option>
                  <option value="Misleading Milestone Claims">Misleading Milestone Claims</option>
                  <option value="Unverified Identity or Credentials">Unverified Identity or Credentials</option>
                  <option value="Escrow Payout Misuse">Escrow Payout Misuse</option>
                  <option value="Intellectual Property Infringement">Intellectual Property Infringement</option>
                  <option value="Other Policy Violation">Other Policy Violation</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Detailed Explanation & Evidence</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide context for admin investigation..."
                  value={flagDescription}
                  onChange={(e) => setFlagDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs"
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setFlagModalCampaign(null)}
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PROPOSAL DETAILS MODAL */}
      {proposalDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Proposal Terms & History</h3>
              <button onClick={() => setProposalDetailModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">PROPOSED FUNDING AMOUNT</span>
                <span className="text-xl font-extrabold text-slate-900">৳ {s3ProposalAmount(proposalDetailModal).toLocaleString()}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">TERMS / RETURN MODEL</span>
                <span className="font-bold text-emerald-700">{s3ProposalTerms(proposalDetailModal)}</span>
              </div>

              {/* S3: founder counter-offer block */}
              {(String(proposalDetailModal.status || '').toLowerCase() === 'negotiating' || proposalDetailModal.counter_amount != null) && (
                <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl space-y-1">
                  <span className="text-[10px] text-sky-600 uppercase font-bold block">FOUNDER COUNTER-OFFER</span>
                  <span className="font-bold text-sky-800">
                    ৳ {Number(proposalDetailModal.counter_amount || 0).toLocaleString()} · {proposalDetailModal.counter_terms || '—'}
                  </span>
                  {proposalDetailModal.negotiate_message && (
                    <p className="text-slate-600 font-sans text-xs pt-1">{proposalDetailModal.negotiate_message}</p>
                  )}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">INVESTOR NOTES</span>
                <p className="text-slate-700 font-sans text-xs">{proposalDetailModal.custom_notes || proposalDetailModal.customNotes || 'Standard backing proposal submitted.'}</p>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-100 font-sans">
                <span className="text-slate-500">Status: <strong className={`uppercase ${String(proposalDetailModal.status).toLowerCase() === 'negotiating' ? 'text-sky-700' : ''}`}>{proposalDetailModal.status}</strong></span>
                {(proposalDetailModal.status === 'pending' || proposalDetailModal.status === 'negotiating') && (
                  <button
                    onClick={() => handleWithdrawProposal(proposalDetailModal.id || proposalDetailModal._id)}
                    className="px-3 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Withdraw Offer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEAD-TO-HEAD 3-STARTUP COMPARISON MATRIX MODAL */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-bold text-slate-900">Head-to-Head 3-Startup Comparative Matrix</h2>
              </div>
              <button onClick={() => setShowComparisonModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">Compare up to 3 selected student campaigns side-by-side on funding goals, equity offers, operational stages, and milestone execution.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">METRIC / ATTRIBUTE</th>
                    {comparisonIds.map((id, idx) => {
                      const c = campaigns.find(x => (x.id === id || x._id === id)) || campaigns[idx];
                      return (
                        <th key={idx} className="p-3 border-l border-slate-200">
                          {c ? c.title : `Startup #${idx+1}`}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">University & Founder</td>
                    {comparisonIds.map((id, idx) => {
                      const c = campaigns.find(x => (x.id === id || x._id === id)) || campaigns[idx];
                      return <td key={idx} className="p-3 border-l border-slate-200">{c?.university} • {c?.founder?.name}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Category</td>
                    {comparisonIds.map((id, idx) => {
                      const c = campaigns.find(x => (x.id === id || x._id === id)) || campaigns[idx];
                      return <td key={idx} className="p-3 border-l border-slate-200 text-emerald-700 font-bold">{c?.category || 'SaaS'}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Development Stage</td>
                    {comparisonIds.map((id, idx) => {
                      const c = campaigns.find(x => (x.id === id || x._id === id)) || campaigns[idx];
                      return <td key={idx} className="p-3 border-l border-slate-200 font-mono">{c?.stage || 'MVP'}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Target Budget Goal</td>
                    {comparisonIds.map((id, idx) => {
                      const c = campaigns.find(x => (x.id === id || x._id === id)) || campaigns[idx];
                      return <td key={idx} className="p-3 border-l border-slate-200 font-mono font-bold text-slate-900">৳ {Number(c?.goal || 0).toLocaleString()}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Offered Return Terms</td>
                    {comparisonIds.map((id, idx) => {
                      const c = campaigns.find(x => (x.id === id || x._id === id)) || campaigns[idx];
                      return <td key={idx} className="p-3 border-l border-slate-200 font-mono text-emerald-700 font-bold">{c?.equityOffer || c?.equity_offer || '8% Rev Share'}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Capital Raised So Far</td>
                    {comparisonIds.map((id, idx) => {
                      const c = campaigns.find(x => (x.id === id || x._id === id)) || campaigns[idx];
                      return <td key={idx} className="p-3 border-l border-slate-200 font-mono text-sky-700 font-bold">৳ {Number(c?.raised || 0).toLocaleString()}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Action</td>
                    {comparisonIds.map((id, idx) => {
                      const c = campaigns.find(x => (x.id === id || x._id === id)) || campaigns[idx];
                      return (
                        <td key={idx} className="p-3 border-l border-slate-200">
                          <button
                            onClick={() => {
                              setShowComparisonModal(false);
                              if (c) setSelectedProposalCampaign(c);
                            }}
                            className="w-full py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg shadow-xs cursor-pointer"
                          >
                            Submit Offer
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REAL-TIME DIRECT MESSAGING CHAT DRAWER */}
      {showChatDrawer && (
        <div className="fixed right-6 bottom-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[480px] animate-in slide-in-from-bottom-5 duration-200">
          <div className="p-4 bg-[#047857] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="font-bold text-xs">{chatTarget?.name || 'Direct Messaging'}</span>
            </div>
            <button onClick={() => setShowChatDrawer(false)} className="text-emerald-100 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-slate-50">
            {chatMessages.length > 0 ? (
              chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl max-w-[80%] text-xs ${
                    m.sender_id === user.id ? 'bg-[#047857] text-white ml-auto rounded-br-xs' : 'bg-white border border-slate-200 text-slate-800 mr-auto rounded-bl-xs'
                  }`}
                >
                  <p>{m.text}</p>
                  <span className="text-[9px] opacity-75 font-mono block text-right mt-1">
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-slate-400 space-y-1">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p>Start a direct conversation with founders or co-investors.</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="p-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-xl cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
