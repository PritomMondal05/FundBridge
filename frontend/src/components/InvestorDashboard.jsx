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
  AlertCircle
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

  // Editable Profile State
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
  const [proposals, setProposals] = useState([]);
  const [coInvestors, setCoInvestors] = useState([]);
  const [foundersList, setFoundersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [walletLedger, setWalletLedger] = useState([]);
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

      // 5. Fetch Audit Logs
      const auditRes = await fetch(`${API_BASE_URL}/api/audit-logs`);
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData || []);
      }

      // 6. Fetch Wallet Ledger
      if (userId) {
        const payRes = await fetch(`${API_BASE_URL}/api/payouts/founder/${userId}`);
        if (payRes.ok) {
          const payData = await payRes.json();
          setWalletLedger(payData || []);
        }
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
      }
    });

    newSocket.on('new_notification_broadcast', (newNotif) => {
      if (!newNotif.user_id || newNotif.user_id === userId || newNotif.user_id === 'all') {
        setNotifications(prev => [newNotif, ...prev]);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Execute Submit Proposal
  const executeCreateProposal = async () => {
    if (!selectedProposalCampaign) return;
    try {
      const campId = selectedProposalCampaign.id || selectedProposalCampaign._id;
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

  // Submit Proposal Form Trigger (Prompts Confirmation First)
  const handleCreateProposal = (e) => {
    e.preventDefault();
    if (!selectedProposalCampaign) return;

    setConfirmModal({
      title: 'Confirm Investment Offer Submission',
      message: `Are you sure you want to submit an investment proposal of ৳ ${Number(proposalAmount).toLocaleString()} with terms "${proposalTerms}" for "${selectedProposalCampaign.title}"?`,
      warning: 'This will issue a formal term sheet to the student founder for review.',
      confirmText: 'Yes, Submit Offer',
      confirmColor: 'bg-[#047857] hover:bg-[#065f46]',
      onConfirm: () => {
        setConfirmModal(null);
        executeCreateProposal();
      }
    });
  };

  // Execute Withdraw Proposal
  const executeWithdrawProposal = async (proposalId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}/withdraw`, {
        method: 'POST'
      });
      if (res.ok) {
        showToast('Investment proposal withdrawn.', 'info');
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
      confirmColor: 'bg-rose-600 hover:bg-rose-700',
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
      confirmColor: 'bg-rose-600 hover:bg-rose-700',
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
      confirmColor: 'bg-rose-600 hover:bg-rose-700',
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
  const fundedCampaigns = campaigns.filter(c => 
    proposals.some(p => (p.campaign_id === c.id || p.campaign_id === c._id) && (p.status === 'accepted' || p.status === 'pending'))
  );

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
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const escrowBalanceAmount = walletLedger.reduce((sum, w) => sum + Number(w.amount || 0), 450000);

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2.5 animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <span>{toast.message}</span>
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
                <span className="absolute top-1 right-1 px-1 py-0.2 bg-emerald-600 text-white text-[9px] font-bold rounded-full ring-2 ring-white">
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
              {/* TAB 1: OVERVIEW PANEL */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-fadeIn">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Investor Overview</h1>
                    <p className="text-xs text-slate-500 mt-1">High-level live dashboard displaying your interested watchlist, submitted proposals, and bookmarked student founders.</p>
                  </div>

                  {/* 4 LIVE METRIC CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div
                      onClick={() => setShowProposalsModal(true)}
                      className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">SUBMITTED PROPOSALS</span>
                        <FileText className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-sky-700 font-mono">{proposals.length}</span>
                        <span className="text-[10px] text-sky-600 font-semibold group-hover:underline flex items-center gap-0.5 font-sans">
                          View Table <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight font-sans">Active & pending offers sent to startups</p>
                    </div>

                    <div
                      onClick={() => setActiveTab('investors')}
                      className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">CO-INVESTORS NETWORK</span>
                        <Users className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-emerald-700 font-mono">{coInvestors.length}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold group-hover:underline flex items-center gap-0.5 font-sans">
                          View Network <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight font-sans">Connected alumni & angel backers</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">SAVED WATCHLIST</span>
                        <Bookmark className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-amber-600 font-mono">{watchlist.length}</span>
                        <span className="text-[10px] text-amber-600 font-semibold font-mono">Pinned</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight font-sans">Startups pinned for evaluation</p>
                    </div>

                    <div
                      onClick={() => setShowAllFoundersModal(true)}
                      className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">REGISTERED FOUNDERS</span>
                        <GraduationCap className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-indigo-600 font-mono">{foundersList.length}</span>
                        <span className="text-[10px] text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5 font-sans">
                          View All ({foundersList.length}) <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight font-sans">Click to browse & mark interest</p>
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
                                  className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl cursor-pointer"
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
                              const cmp = campaigns.find(c => c.id === p.campaign_id || c._id === p.campaign_id);

                              return (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-4 font-semibold text-slate-900">
                                    {cmp ? cmp.title : p.campaign_id || 'CampusBites'}
                                  </td>
                                  <td className="py-4 text-slate-500 font-mono">
                                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}
                                  </td>
                                  <td className="py-4 font-mono font-bold text-slate-900">
                                    ৳ {Number(p.amount || 0).toLocaleString()}
                                  </td>
                                  <td className="py-4 text-slate-700">
                                    {p.terms || p.return_structure || '8% Rev. Share'}
                                  </td>
                                  <td className="py-4">
                                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase ${
                                      p.status === 'accepted' ? 'bg-emerald-500 text-white' :
                                      p.status === 'declined' || p.status === 'rejected' ? 'bg-rose-500 text-white' :
                                      p.status === 'withdrawn' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {p.status || 'PENDING'}
                                    </span>
                                  </td>
                                  <td className="py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => setProposalDetailModal(p)}
                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg cursor-pointer"
                                      >
                                        Details
                                      </button>
                                      <button
                                        onClick={() => {
                                          setChatTarget({ name: cmp?.founder?.name || 'Founder', id: cmp?.founder_id || 'usr_founder_1' });
                                          setShowChatDrawer(true);
                                        }}
                                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-lg cursor-pointer"
                                      >
                                        Message
                                      </button>
                                      {p.status === 'pending' && (
                                        <button
                                          onClick={() => handleWithdrawProposal(propId)}
                                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold rounded-lg cursor-pointer"
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
                                  className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                                  <span>Remove Interest</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setChatTarget({ name: founder.name, id: founderId });
                                    setShowChatDrawer(true);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
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
                      <p className="text-xs text-slate-500 mt-0.5">Browse all admin-approved student campaigns across universities in Bangladesh.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {comparisonIds.length > 0 && (
                        <button
                          onClick={() => setShowComparisonModal(true)}
                          className="px-3.5 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs hover:bg-emerald-800 cursor-pointer"
                        >
                          <Scale className="w-4 h-4" />
                          <span>Compare Matrix ({comparisonIds.length}/3)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* GRANULAR FILTER & SEARCH ENGINE */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
                      <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                      <span>Filter & Search Engine</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Search Keywords</label>
                        <input
                          type="text"
                          placeholder="Search title, founder, or university..."
                          value={globalSearch}
                          onChange={(e) => setGlobalSearch(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                        />
                      </div>

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
                    </div>
                  </div>

                  {/* CAMPAIGN CARDS DIRECTORY */}
                  {filteredCampaigns.length > 0 ? (
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
                                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl cursor-pointer flex items-center justify-center gap-1"
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
                        className="px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer"
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
                        className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
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
                              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Explore campaigns and submit your first investment offer to start building your university startup portfolio.</p>
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

              {/* TAB 4: WALLET */}
              {activeTab === 'wallet' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Wallet & Financial Reports</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Control panel for financial activities, escrow commitments, and downloadable transaction ledgers.</p>
                    </div>

                    <button
                      onClick={() => exportToCSV('FundBridge_Wallet_Ledger.csv', walletLedger.length ? walletLedger : [
                        { tranche: 'Escrow Release #1', amount: 150000, method: 'bKash MFS', status: 'Completed', date: new Date().toLocaleDateString() }
                      ])}
                      className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Ledger CSV</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">TOTAL CAPITAL INVESTED</span>
                      <span className="text-2xl font-extrabold text-slate-900 font-mono">৳ {totalInvestedAmount.toLocaleString()}</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">PENDING COMMITMENTS</span>
                      <span className="text-2xl font-extrabold text-amber-600 font-mono">৳ {pendingCommitmentAmount.toLocaleString()}</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">RETURNS & PROFITS</span>
                      <span className="text-2xl font-extrabold text-emerald-700 font-mono">৳ 38,500</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">ESCROW LOCKED BALANCE</span>
                      <span className="text-2xl font-extrabold text-sky-700 font-mono">৳ {escrowBalanceAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h2 className="text-sm font-bold text-slate-900">Transaction History Ledger</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                            <th className="pb-3 font-semibold">TRANCHE / RECORD</th>
                            <th className="pb-3 font-semibold">AMOUNT</th>
                            <th className="pb-3 font-semibold">METHOD</th>
                            <th className="pb-3 font-semibold">STATUS</th>
                            <th className="pb-3 font-semibold text-right">RECEIPT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {walletLedger.length > 0 ? (
                            walletLedger.map((w, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80">
                                <td className="py-4 font-semibold text-slate-900">{w.tranche || 'Milestone Escrow Payout'}</td>
                                <td className="py-4 font-mono font-bold text-slate-900">৳ {Number(w.amount || 0).toLocaleString()}</td>
                                <td className="py-4">{w.method || 'bKash'}</td>
                                <td className="py-4">
                                  <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-md uppercase">
                                    {w.status || 'COMPLETED'}
                                  </span>
                                </td>
                                <td className="py-4 text-right">
                                  <button
                                    onClick={() => exportToCSV(`Receipt_${w.hash || idx}.csv`, [w])}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-semibold rounded-md font-mono cursor-pointer"
                                  >
                                    Download CSV
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-10 text-center text-xs text-slate-400">
                                No payout ledger records found in database.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
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
                                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Real-Time Cryptographic Audit Logs</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Immutable timestamp record of every action performed on FundBridge platform.</p>
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
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
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
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
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
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
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
                className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-2.5 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer transition-colors ${
                  confirmModal.confirmColor || 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                {confirmModal.confirmText || 'Yes, Confirm'}
              </button>
            </div>
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
                  className="py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
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
                  className="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
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
                  className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
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
                      const cmp = campaigns.find(c => c.id === p.campaign_id || c._id === p.campaign_id);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-4 font-semibold text-slate-900">{cmp ? cmp.title : p.campaign_id}</td>
                          <td className="py-4 text-slate-500 font-mono">{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}</td>
                          <td className="py-4 font-mono font-bold text-slate-900">৳ {Number(p.amount || 0).toLocaleString()}</td>
                          <td className="py-4 text-slate-700">{p.terms || '8% Rev Share'}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase ${
                              p.status === 'accepted' ? 'bg-emerald-500 text-white' :
                              p.status === 'declined' || p.status === 'rejected' ? 'bg-rose-500 text-white' :
                              p.status === 'withdrawn' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'
                            }`}>
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
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg cursor-pointer"
                              >
                                Details
                              </button>
                              {p.status === 'pending' && (
                                <button
                                  onClick={() => handleWithdrawProposal(propId)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold rounded-lg cursor-pointer"
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
                  className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl cursor-pointer"
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
                  className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer"
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
                <span className="text-xl font-extrabold text-slate-900">৳ {Number(proposalDetailModal.amount || 0).toLocaleString()}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">TERMS / RETURN MODEL</span>
                <span className="font-bold text-emerald-700">{proposalDetailModal.terms || proposalDetailModal.return_structure || '8% Rev. Share'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">INVESTOR NOTES</span>
                <p className="text-slate-700 font-sans text-xs">{proposalDetailModal.custom_notes || proposalDetailModal.customNotes || 'Standard backing proposal submitted.'}</p>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-100 font-sans">
                <span className="text-slate-500">Status: <strong className="uppercase">{proposalDetailModal.status}</strong></span>
                {proposalDetailModal.status === 'pending' && (
                  <button
                    onClick={() => handleWithdrawProposal(proposalDetailModal.id || proposalDetailModal._id)}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
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
