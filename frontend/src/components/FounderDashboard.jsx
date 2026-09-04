import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  LayoutGrid,
  Rocket,
  Users,
  Wallet,
  Flag,
  FileText,
  Settings,
  HelpCircle,
  Plus,
  Search,
  MessageSquare,
  ArrowRight,
  Upload,
  Clock,
  Shield,
  Activity,
  Download,
  Filter,
  ChevronRight,
  X,
  Info,
  ExternalLink,
  Lock,
  Sparkles,
  Eye,
  Zap,
  Building,
  LogOut,
  Compass,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Send,
  Heart
} from 'lucide-react';
import PublicProfileModal from './PublicProfileModal';
import FounderMatchView from './ai/FounderMatchView';
import AIMatchCarousel from './AIMatchCarousel';
import AiContentAssistant from './ai/AiContentAssistant';
import TransactionMilestoneTracker from './TransactionMilestoneTracker';
import { NotificationProvider } from '../contexts/NotificationContext.jsx';
import NotificationBell from './notifications/NotificationBell.jsx';
import logoUrl from '../assets/images/FundBridge Logo.svg';

export default function FounderDashboard({ currentUser, onLogout, API_BASE_URL, triggerAlert }) {
  const user = currentUser || {
    id: 'usr_founder_1',
    name: 'Anika Rahman',
    email: 'anika@brac.edu.bd',
    university: 'BRAC University',
    vettingStatus: 'verified',
    mfsNumber: '01711223344',
    department: 'Computer Science & Engineering',
    studentId: '20101452'
  };

  // Active Sidebar Tab: 'overview' | 'campaign' | 'explore' | 'investors' | 'wallet' | 'milestones' | 'audit' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  // Editable Profile User State
  const [profileUser, setProfileUser] = useState({
    name: user.name || '',
    email: user.email || '',
    university: user.university || '',
    department: user.department || '',
    studentId: user.studentId || '',
    mfsNumber: user.mfsNumber || '',
    bio: user.bio || '',
    vettingStatus: user.vettingStatus || 'verified'
  });

  // Chat State
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    const text = chatInputText.trim();
    const founderId = currentUser?.id || currentUser?._id || user.id;
    const receiverId = chatTarget?._id || chatTarget?.id;
    if (!text || !receiverId || receiverId === 'all') return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: founderId,
          senderName: profileUser.name || user.name || 'Founder',
          receiverId,
          text
        })
      });
      if (res.ok) {
        const data = await res.json();
        const created = data.chatMessage;
        if (created) setChatMessages((prev) => prev.some((message) => message.id === created.id) ? prev : [...prev, created]);
        setChatInputText('');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Unable to send message.');
      }
    } catch (err) { setChatError(err.message || 'Unable to send message.'); }
  };

  useEffect(() => {
    const founderId = currentUser?.id || currentUser?._id || user.id;
    const investorId = chatTarget?._id || chatTarget?.id;
    if (!showChatDrawer || !founderId || !investorId || investorId === 'all') { setChatMessages([]); return undefined; }
    const controller = new AbortController();
    setChatLoading(true); setChatError('');
    fetch(`${API_BASE_URL}/api/chat/thread?senderId=${encodeURIComponent(founderId)}&receiverId=${encodeURIComponent(investorId)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load this conversation.')))
      .then((messages) => setChatMessages(Array.isArray(messages) ? messages : []))
      .catch((err) => { if (err.name !== 'AbortError') setChatError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setChatLoading(false); });
    const socket = io(API_BASE_URL);
    socket.emit('join_room', founderId);
    socket.on('new_direct_message', (message) => {
      const participants = [String(message.sender_id), String(message.receiver_id)];
      if (participants.includes(String(founderId)) && participants.includes(String(investorId))) setChatMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]);
    });
    return () => { controller.abort(); socket.disconnect(); };
  }, [showChatDrawer, chatTarget?.id, chatTarget?._id, currentUser?.id, currentUser?._id, API_BASE_URL]);

  // Database State (Only real records loaded from backend)
  const [campaigns, setCampaigns] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [investorsList, setInvestorsList] = useState([]);
  const [payoutsList, setPayoutsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  // SPRINT 5 (Samiul): merged transaction tracking data — { campaigns: [...], unattributedPayouts: [...] }
  const [transactionData, setTransactionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Selected Investor Proposal
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedPublicProfile, setSelectedPublicProfile] = useState(null);

  // Campaign Form State
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    university: user.university || '',
    category: 'FoodTech / SaaS',
    stage: 'Prototype / MVP',
    tagline: '',
    coverPhoto: '',
    pitchVideoUrl: '',
    goal: 500000,
    durationDays: 60,
    equityOffer: '8% Revenue Share',
    description: ''
  });

  // Wallet / Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bkash');

  // Progress Announcement Modal State (FR-8)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementTag, setAnnouncementTag] = useState('Milestone 1 Achieved');
  const [announcementContent, setAnnouncementContent] = useState('');


  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [exploreCategory, setExploreCategory] = useState('all');

  // S3: Relief Campaigns State
  const [myReliefCampaigns, setMyReliefCampaigns] = useState([]);
  const [allReliefCampaigns, setAllReliefCampaigns] = useState([]);
  const [exploreMarket, setExploreMarket] = useState('startup'); // 'startup' | 'relief'
  const [showCreateReliefModal, setShowCreateReliefModal] = useState(false);
  const [submittingRelief, setSubmittingRelief] = useState(false);
  const [reliefFiltersOpen, setReliefFiltersOpen] = useState(false);
  const [reliefStatusFilter, setReliefStatusFilter] = useState('all'); // 'all' | 'open' | 'pending' | 'rejected'
  const [createReliefForm, setCreateReliefForm] = useState({
    title: '',
    university: user.university || '',
    cause: 'Disaster Relief',
    beneficiary: '',
    goal: 100000,
    durationDays: 30,
    description: '',
    useOfFundsText: 'Food and pure drinking water\nMedical supplies and first aid kits\nShelter and basic living essentials',
    proofUrl: ''
  });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Database Data from API endpoints
  const fetchDatabaseData = async () => {
    const userId = currentUser?.id || currentUser?._id || user.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const profileRes = await fetch(`${API_BASE_URL}/api/users/profile?userId=${encodeURIComponent(userId)}`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const nextUser = profileData.user || {};
        setProfileUser((current) => ({
          ...current,
          name: nextUser.name || current.name,
          email: nextUser.email || current.email,
          university: nextUser.university || current.university,
          department: nextUser.department || current.department,
          studentId: nextUser.studentId || current.studentId,
          mfsNumber: nextUser.mfsNumber || current.mfsNumber,
          bio: nextUser.bio || current.bio,
          vettingStatus: nextUser.vettingStatus || current.vettingStatus
        }));
      }

      // 1. Fetch Founder's Campaigns from DB
      const campRes = await fetch(`${API_BASE_URL}/api/campaigns/founder/${userId}`);
      let userCampaigns = [];
      if (campRes.ok) {
        userCampaigns = await campRes.json();
        setCampaigns(userCampaigns);
        if (userCampaigns.length > 0) {
          const c = userCampaigns[0];
          setCampaignForm({
            title: c.title || '',
            university: c.university || profileUser.university || '',
            category: c.category || 'FoodTech / SaaS',
            stage: c.stage || 'Prototype / MVP',
            tagline: c.tagline || '',
            coverPhoto: c.cover_photo || c.coverPhoto || '',
            pitchVideoUrl: c.pitch_video_url || c.pitchVideoUrl || '',
            goal: c.goal || 500000,
            durationDays: c.durationDays || 60,
            equityOffer: c.equity_offer || c.equityOffer || '',
            description: c.description || ''
          });
        }
      }

      // 2. Fetch All Campaigns
      const allCampRes = await fetch(`${API_BASE_URL}/api/campaigns`);
      if (allCampRes.ok) {
        const allCampData = await allCampRes.json();
        setAllCampaigns(allCampData);
      }

      // If founder has active campaign, fetch proposals for that campaign
      const activeCamp = userCampaigns.length > 0 ? userCampaigns[0] : null;
      if (activeCamp) {
        const campId = activeCamp.id || activeCamp._id;
        const propRes = await fetch(`${API_BASE_URL}/api/proposals/campaign/${campId}`);
        if (propRes.ok) {
          const propData = await propRes.json();
          setProposals(propData);
          if (propData.length > 0) {
            setSelectedProposal(propData[0]);
          }
        }
      }

      // 3. Fetch Investors from DB
      const invRes = await fetch(`${API_BASE_URL}/api/admin/users/investors`);
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvestorsList(invData);
      }

      // 4. Fetch Payouts for Founder from DB
      const payRes = await fetch(`${API_BASE_URL}/api/payouts/founder/${userId}`);
      if (payRes.ok) {
        const payData = await payRes.json();
        setPayoutsList(payData);
      }

      // 5. Fetch Audit Logs from DB
      const auditRes = await fetch(`${API_BASE_URL}/api/audit-logs`);
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData);
      }

      // 7. SPRINT 5 (Samiul): Fetch merged Transaction Tracking data (FR-9)
      const txRes = await fetch(`${API_BASE_URL}/api/transactions/founder/${userId}`);
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactionData(txData);
      }

      // 8. Fetch Founder's Relief Campaigns
      const myReliefRes = await fetch(`${API_BASE_URL}/api/founders/${userId}/relief-drives`);
      if (myReliefRes.ok) {
        const myReliefData = await myReliefRes.json();
        setMyReliefCampaigns(Array.isArray(myReliefData) ? myReliefData : []);
      }

      // 9. Fetch All Approved Relief Campaigns
      const allReliefRes = await fetch(`${API_BASE_URL}/api/relief-drives`);
      if (allReliefRes.ok) {
        const allReliefData = await allReliefRes.json();
        setAllReliefCampaigns(Array.isArray(allReliefData) ? allReliefData : []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Database fetch error:', err);
      setLoading(false);
    }
  };

  const handleCreateReliefDrive = async (e) => {
    e.preventDefault();
    const userId = currentUser?.id || currentUser?._id || user.id;
    if (!userId) return;
    if (!createReliefForm.title.trim() || !createReliefForm.cause.trim() || !createReliefForm.beneficiary.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    const goalNum = Number(createReliefForm.goal);
    if (!goalNum || goalNum <= 0) {
      showToast('Please enter a valid target goal in BDT.', 'error');
      return;
    }

    const uses = createReliefForm.useOfFundsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const proofLinks = createReliefForm.proofUrl.trim()
      ? [{ type: 'Document / Media', url: createReliefForm.proofUrl.trim() }]
      : [];

    try {
      setSubmittingRelief(true);
      const res = await fetch(`${API_BASE_URL}/api/relief-drives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founderId: userId,
          title: createReliefForm.title.trim(),
          university: createReliefForm.university.trim() || profileUser.university || 'University',
          cause: createReliefForm.cause.trim(),
          beneficiary: createReliefForm.beneficiary.trim(),
          goal: goalNum,
          durationDays: Number(createReliefForm.durationDays) || 30,
          description: createReliefForm.description.trim(),
          useOfFunds: uses.length > 0 ? uses : ['Essential Aid & Supplies', 'Logistics & Distribution'],
          proofLinks
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create relief campaign');

      showToast('Relief campaign submitted! It will appear publicly once verified by Admin.', 'success');
      setShowCreateReliefModal(false);
      setCreateReliefForm({
        title: '',
        university: profileUser.university || '',
        cause: 'Disaster Relief',
        beneficiary: '',
        goal: 100000,
        durationDays: 30,
        description: '',
        useOfFundsText: 'Food and pure drinking water\nMedical supplies and first aid kits\nShelter and basic living essentials',
        proofUrl: ''
      });
      fetchDatabaseData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingRelief(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, [currentUser]);

  // Active Campaign Object
  const activeCampaign = campaigns.length > 0 ? campaigns[0] : null;

  // SPRINT 5 (Samiul): the transaction-tracking record matching the active campaign
  const activeCampaignTx = transactionData?.campaigns?.find(
    (c) => c.campaignId === (activeCampaign?.id || activeCampaign?._id)
  ) || null;

  // Handle Proposal Status Update (Accept/Decline)
  const handleProposalStatus = async (proposalId, status) => {
    if (!activeCampaign) return;
    const campId = activeCampaign.id || activeCampaign._id;
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${campId}/proposals/${proposalId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Investor proposal ${status.toUpperCase()} successfully!`, 'success');
        fetchDatabaseData();
      } else {
        showToast('Failed to update proposal status.', 'error');
      }
    } catch (err) {
      showToast('Server error updating proposal.', 'error');
    }
  };

  // Campaign Creation Wizard Step State (1-5)
  const [wizardStep, setWizardStep] = useState(1);

  // Selected Campaign to edit (null = creating new campaign)
  const [editingCampaignId, setEditingCampaignId] = useState(null);

  // Open Create Campaign Form Wizard
  const handleOpenCreateCampaign = () => {
    setEditingCampaignId(null);
    setWizardStep(1);
    setCampaignForm({
      title: '',
      university: profileUser.university || user.university || '',
      category: 'FoodTech / SaaS',
      stage: 'MVP Stage',
      tagline: '',
      coverPhoto: '',
      pitchVideoUrl: '',
      goal: 500000,
      durationDays: 60,
      equityOffer: '8% Revenue Share',
      description: ''
    });
    setActiveTab('campaign');
  };

  // Save/Create Campaign Form Submit
  const handleSaveCampaign = async (e) => {
    if (e) e.preventDefault();
    if (profileUser.vettingStatus === 'pending' || profileUser.vetting_status === 'pending') {
      showToast('Your founder profile is pending Admin approval. You cannot launch a campaign until your profile is verified by Super Admin.', 'error');
      return;
    }
    if (!campaignForm.title || campaignForm.title.trim() === '') {
      showToast('Please enter a Startup Name for your campaign.', 'error');
      setWizardStep(1);
      return;
    }

    const userId = currentUser?.id || currentUser?._id || user.id;
    try {
      const payload = {
        id: editingCampaignId || `cmp_${Date.now()}`,
        title: campaignForm.title,
        founderId: userId,
        university: campaignForm.university || profileUser.university || 'BRAC University',
        location: 'Dhaka, Bangladesh',
        category: campaignForm.category || 'Startup Venture',
        stage: campaignForm.stage || 'MVP Stage',
        goal: Number(campaignForm.goal) || 500000,
        equityOffer: campaignForm.equityOffer || '8% Revenue Share',
        tagline: campaignForm.tagline || '',
        coverPhoto: campaignForm.coverPhoto || '',
        pitchVideoUrl: campaignForm.pitchVideoUrl || '',
        description: campaignForm.description || campaignForm.title,
        milestones: [
          { title: 'MVP Launch & Prototype', target: 'Month 1', status: 'done' },
          { title: 'Market Testing & First 100 Users', target: 'Month 2', status: 'pending' },
          { title: 'Commercial Release & ৳50K Revenue', target: 'Month 4', status: 'locked' }
        ],
        verified: false,
        status: 'pending'
      };

      const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Campaign submitted for Admin Audit & Verification! Once approved by Admin, it will be published to the Investor Feed.', 'success');
        await fetchDatabaseData();
        setActiveTab('overview');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to submit campaign for audit.', 'error');
      }
    } catch (err) {
      showToast('Error submitting campaign to server.', 'error');
    }
  };

  // Save Profile Info
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const founderId = currentUser?.id || currentUser?._id || user.id;
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: founderId, ...profileUser })
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Unable to save profile.');
      showToast('Profile information updated successfully!', 'success');
    } catch (err) { showToast(err.message || 'Unable to save profile.', 'error'); }
  };

  // Submit Payout Request
  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) <= 0) return;
    const userId = currentUser?.id || currentUser?._id || user.id;

    try {
      const res = await fetch(`${API_BASE_URL}/api/payouts/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founderId: userId,
          campaignId: activeCampaign?.id || activeCampaign?._id || null, // SPRINT 5 (Samiul): tag which campaign this belongs to
          amount: Number(payoutAmount),
          method: payoutMethod,
          accountNumber: profileUser.mfsNumber || '01711223344',
          tranche: 'Milestone Escrow Disbursement'
        })
      });

      if (res.ok) {
        setShowPayoutModal(false);
        showToast(`Payout request of ৳ ${Number(payoutAmount).toLocaleString()} submitted to database!`, 'success');
        setPayoutAmount('');
        fetchDatabaseData();
      }
    } catch (err) {
      showToast('Error submitting payout request.', 'error');
    }
  };

  // Publish Progress Announcement (FR-8)
  const handlePublishAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      showToast('Please fill out the announcement title and narrative content.', 'error');
      return;
    }

    const activeCamp = campaigns.length > 0 ? campaigns[0] : null;
    const campId = activeCamp?.id || activeCamp?._id || 'campusbites';
    const userId = currentUser?.id || currentUser?._id || user.id;

    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${campId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founderId: userId,
          title: announcementTitle,
          content: announcementContent,
          milestoneTag: announcementTag
        })
      });

      if (res.ok) {
        setShowAnnouncementModal(false);
        setAnnouncementTitle('');
        setAnnouncementContent('');
        showToast('Campaign progress announcement published to database!', 'success');
        fetchDatabaseData();
      } else {
        showToast('Failed to publish announcement update.', 'error');
      }
    } catch (err) {
      showToast('Error publishing progress announcement.', 'error');
    }
  };

  // Initials Avatar Component
  const InitialsAvatar = ({ name, className = 'w-10 h-10' }) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'FB';
    return (
      <div className={`${className} rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0`}>
        {initials}
      </div>
    );
  };

  // Filtered list of all campaigns for Explore tab
  const filteredAllCampaigns = allCampaigns.filter(c => {
    const matchesSearch = searchQuery === '' ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.university?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = exploreCategory === 'all' || c.category?.toLowerCase() === exploreCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Filtered list of founder's relief campaigns
  const filteredMyRelief = myReliefCampaigns.filter((d) => {
    const matchesSearch = !searchQuery ||
      d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.cause?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.university?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = reliefStatusFilter === 'all' ||
      (reliefStatusFilter === 'open' && (d.status === 'open' || d.status === 'verified')) ||
      (reliefStatusFilter === 'pending' && d.status === 'pending') ||
      (reliefStatusFilter === 'rejected' && d.status === 'rejected');
    return matchesSearch && matchesStatus;
  });

  // Filtered list of all approved public relief campaigns
  const filteredAllRelief = allReliefCampaigns.filter((d) => {
    return !searchQuery ||
      d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.cause?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.university?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <NotificationProvider
      userId={user.id || user._id}
      apiBase={API_BASE_URL}
      onToast={showToast}
      onNavigate={(link) => {
        if (String(link || '').startsWith('tab:')) setActiveTab(String(link).slice(4));
      }}
    >
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
          }`}>
          <Info className="w-4 h-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR (HEADER) */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="FundBridge Logo" className="h-7 w-auto" />
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase tracking-wider font-mono">
            FOUNDER PORTAL
          </span>
        </div>

        {/* Search Input */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'explore' ? 'Search all campaigns...' :
                activeTab === 'investors' ? 'Search investors...' :
                  activeTab === 'wallet' ? 'Search payouts...' :
                    activeTab === 'milestones' ? 'Search milestones...' :
                      activeTab === 'audit' ? 'Search hash or log...' :
                        'Search funding logs...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-xs text-slate-800 transition-all outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right User Bar */}
        <div className="flex items-center gap-3.5 relative">
          <button
            type="button"
            onClick={() => {
              if (chatTarget?.id && chatTarget.id !== 'all') {
                setShowChatDrawer(true);
                return;
              }
              const fromProposal = proposals.find((p) => p.investor_id || p.investorId);
              const fromList = investorsList[0];
              const next = fromProposal
                ? { name: fromProposal.investor_name || 'Investor', id: fromProposal.investor_id || fromProposal.investorId }
                : fromList
                  ? { name: fromList.name || fromList.institution || 'Investor', id: fromList.id || fromList._id }
                  : null;
              if (!next?.id) {
                showToast('Choose an investor from Investors or AI Matches to start a conversation.', 'info');
                return;
              }
              setChatTarget(next);
              setShowChatDrawer(true);
            }}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Open Active Chat Inbox"
          >
            <MessageSquare className="w-4.5 h-4.5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </button>

          <div className="relative">
            <NotificationBell />
          </div>

          <div className="h-6 w-px bg-slate-200 my-auto"></div>

          {/* Founder Profile Badge - opens the public profile */}
          <div
            onClick={() => setSelectedPublicProfile({ type: 'founder', id: user.id || user._id })}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            title="View public profile"
          >
            <InitialsAvatar name={profileUser.name} className="w-8 h-8" />
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-slate-900 block leading-tight">{profileUser.name}</span>
              <span className="text-[10px] text-emerald-700 font-semibold block leading-tight">{profileUser.university || 'Founder'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN BODY: SIDEBAR & WORKSPACE */}
      <div className="flex-1 flex min-w-0">
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-5 shrink-0 select-none">
          <div className="space-y-6">
            {/* Navigation Links */}
            <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'overview'
                  ? 'bg-[#DCFCE7] text-[#15803D] font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
            >
              <LayoutGrid className="w-4.5 h-4.5" />
              <span>Overview</span>
            </button>



            <button
              onClick={() => setActiveTab('explore')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'explore'
                  ? 'bg-[#DCFCE7] text-[#15803D] font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
            >
              <Compass className="w-4.5 h-4.5" />
              <span>Campaigns</span>
            </button>

            <button
              onClick={() => setActiveTab('relief')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'relief'
                  ? 'bg-[#DCFCE7] text-[#15803D] font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
            >
              <Heart className="w-4.5 h-4.5 text-emerald-700" />
              <span>Relief Campaigns</span>
            </button>

            <button
              onClick={() => setActiveTab('investors')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'investors'
                  ? 'bg-[#DCFCE7] text-[#15803D] font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
            >
              <Users className="w-4.5 h-4.5" />
              <span>Investors</span>
            </button>

            <button onClick={() => setActiveTab('matches')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'matches' ? 'bg-[#DCFCE7] text-[#15803D] font-semibold' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'}`}>
              <Sparkles className="w-4.5 h-4.5" />
              <span>AI Matches</span>
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'wallet'
                  ? 'bg-[#DCFCE7] text-[#15803D] font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
            >
              <Wallet className="w-4.5 h-4.5" />
              <span>Wallet</span>
            </button>

            <button
              onClick={() => setActiveTab('milestones')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'milestones'
                  ? 'bg-[#DCFCE7] text-[#15803D] font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
            >
              <Flag className="w-4.5 h-4.5" />
              <span>Milestones</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'audit'
                  ? 'bg-[#DCFCE7] text-[#15803D] font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
            >
              <FileText className="w-4.5 h-4.5" />
              <span>Audit Logs</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <button
            onClick={() => {
              triggerAlert ? triggerAlert('Campaign update broadcasted to all database investors!') : showToast('Update broadcasted to investors!', 'success');
            }}
            className="w-full py-3 px-4 bg-[#059669] hover:bg-[#047857] text-white font-medium text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Update</span>
          </button>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg">
              <HelpCircle className="w-4 h-4" />
              <span>Support</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Pending Vetting Status Banner */}
        {(profileUser.vettingStatus === 'pending' || profileUser.vetting_status === 'pending') && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 px-8 py-2.5 flex items-center justify-between text-xs font-medium sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Identity Vetting Pending:</strong> Your student founder profile is awaiting Super Admin verification. Campaign launching is restricted until approved.</span>
            </div>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase">PENDING VETTING</span>
          </div>
        )}

        {/* TAB PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-medium">Loading workspace records from database...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW SCREEN */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <AIMatchCarousel
                    role="founder"
                    userId={user.id || user._id}
                    campaignId={activeCampaign?.id || activeCampaign?._id}
                    API_BASE_URL={API_BASE_URL}
                    onOpenMatch={(match) => setSelectedPublicProfile({ type: 'investor', id: match.investorId })}
                  />
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">My Workspace</h1>
                  </div>

                  {/* 3 TOP METRIC CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Dark Green Escrow Card */}
                    <div className="bg-[#064E3B] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[160px]">
                      <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none">
                        <svg width="180" height="120" viewBox="0 0 180 120" fill="none">
                          <path d="M40 120L110 20L180 120H40Z" stroke="white" strokeWidth="6" />
                          <path d="M0 120L70 20L140 120H0Z" stroke="white" strokeWidth="6" />
                        </svg>
                      </div>

                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-200/80 block">TOTAL FUNDING RAISED IN ESCROW</span>
                        <h3 className="text-3xl font-bold tracking-tight mt-2 font-mono">
                          ৳ {activeCampaign ? (Number(activeCampaign.raised) || 0).toLocaleString() : '0'}
                        </h3>
                      </div>

                      <div className="mt-4 pt-3 border-t border-emerald-700/50">
                        <span className="text-xs font-medium text-emerald-200 block mb-1.5">
                          {activeCampaign && activeCampaign.goal > 0
                            ? `${Math.round(((activeCampaign.raised || 0) / activeCampaign.goal) * 100)}% of BDT ${Number(activeCampaign.goal).toLocaleString()} Goal Reached`
                            : 'No Active Goal Set'}
                        </span>
                        <div className="w-full bg-emerald-950/60 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                            style={{
                              width: activeCampaign && activeCampaign.goal > 0
                                ? `${Math.min(100, Math.round(((activeCampaign.raised || 0) / activeCampaign.goal) * 100))}%`
                                : '0%'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Security Deposit Held Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block">SECURITY DEPOSIT HELD</span>
                        <Shield className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
                          ৳ {activeCampaign ? (Number(activeCampaign.raised || 0) * 2).toLocaleString() : '0'}
                        </h3>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-2">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        <span>Refundable upon milestone completion</span>
                      </div>
                    </div>

                    {/* Active Proposals Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block">INVESTOR PROPOSALS</span>
                        <FileText className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 font-mono">{proposals.length}</h3>
                      </div>
                      <div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md inline-block">
                          {proposals.length > 0 ? 'Pending Founder Action' : 'Awaiting Proposals'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CAMPAIGN STATUS & MILESTONES TABLE */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-900">Campaign Status & Milestones</h2>
                      <button
                        onClick={() => {
                          if (activeCampaign) {
                            setEditingCampaignId(activeCampaign.id || activeCampaign._id);
                            setCampaignForm({
                              title: activeCampaign.title || '',
                              university: activeCampaign.university || profileUser.university || '',
                              category: activeCampaign.category || 'FoodTech / SaaS',
                              stage: activeCampaign.stage || 'Prototype / MVP',
                              tagline: activeCampaign.tagline || '',
                              coverPhoto: activeCampaign.cover_photo || activeCampaign.coverPhoto || '',
                              pitchVideoUrl: activeCampaign.pitch_video_url || activeCampaign.pitchVideoUrl || '',
                              goal: activeCampaign.goal || 500000,
                              durationDays: activeCampaign.durationDays || 60,
                              equityOffer: activeCampaign.equity_offer || activeCampaign.equityOffer || '',
                              description: activeCampaign.description || ''
                            });
                            setActiveTab('campaign');
                          } else {
                            handleOpenCreateCampaign();
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        Manage Campaign
                      </button>
                    </div>

                    {activeCampaign && activeCampaign.milestones && activeCampaign.milestones.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                              <th className="pb-3 font-semibold">MILESTONE NAME</th>
                              <th className="pb-3 font-semibold">TARGET DATE</th>
                              <th className="pb-3 font-semibold">STATUS</th>
                              <th className="pb-3 font-semibold">ACTION</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeCampaign.milestones.map((m, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-4 font-semibold text-slate-900 flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${m.status === 'done' ? 'bg-emerald-500' :
                                      m.status === 'active' || m.status === 'pending' ? 'bg-amber-500' : 'bg-slate-300'
                                    }`}></span>
                                  <span>{m.name || m.title || `Milestone #${idx + 1}`}</span>
                                </td>
                                <td className="py-4 text-slate-600">{m.targetDate || m.target || 'TBD'}</td>
                                <td className="py-4">
                                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase ${m.status === 'done' ? 'bg-emerald-500 text-white' :
                                      m.status === 'active' || m.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {m.status === 'done' ? 'Done ✓' : m.status === 'active' || m.status === 'pending' ? 'Active ⏳' : 'Upcoming'}
                                  </span>
                                </td>
                                <td className="py-4">
                                  {m.status === 'done' ? (
                                    <button onClick={() => setActiveTab('milestones')} className="text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1">
                                      View Proofs <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button onClick={() => setActiveTab('milestones')} className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer">
                                      <Upload className="w-3.5 h-3.5" />
                                      <span>Upload Logs</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-500">No active milestones configured in database for this campaign.</p>
                      </div>
                    )}
                  </div>

                  {/* MY CAMPAIGN SECTION IN OVERVIEW SECTION BELOW */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">My Campaigns</h2>
                        <p className="text-xs text-slate-500">Startup campaigns registered under your founder profile in database</p>
                      </div>
                      <button
                        onClick={handleOpenCreateCampaign}
                        className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Campaign</span>
                      </button>
                    </div>

                    {campaigns.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {campaigns.map((c, idx) => (
                          <div key={c.id || c._id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                                <span className="text-xs text-slate-500">{c.university} • {c.category || 'Startup'}</span>
                              </div>
                              <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase ${
                                (c.verified || c.status === 'verified') ? 'bg-emerald-100 text-emerald-800' :
                                c.status === 'revisions' ? 'bg-purple-100 text-purple-800' :
                                c.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                                }`}>
                                {(c.verified || c.status === 'verified') ? 'Verified & Live ✓' :
                                 c.status === 'revisions' ? 'Revisions Requested 📝' :
                                 c.status === 'rejected' ? 'Rejected by Admin ❌' :
                                 'Pending Admin Verification ⏳'}
                              </span>
                            </div>

                            <div className="flex justify-between text-xs font-mono pt-1">
                              <span className="text-slate-500">Raised: <strong className="text-emerald-700">৳ {Number(c.raised || 0).toLocaleString()}</strong></span>
                              <span className="text-slate-500">Goal: <strong>৳ {Number(c.goal || 0).toLocaleString()}</strong></span>
                            </div>

                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full rounded-full"
                                style={{ width: c.goal > 0 ? `${Math.min(100, Math.round(((c.raised || 0) / c.goal) * 100))}%` : '0%' }}
                              ></div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                              <button
                                onClick={() => {
                                  setEditingCampaignId(c.id || c._id);
                                  setCampaignForm({
                                    title: c.title || '',
                                    university: c.university || profileUser.university || '',
                                    category: c.category || 'FoodTech / SaaS',
                                    stage: c.stage || 'Prototype / MVP',
                                    tagline: c.tagline || '',
                                    coverPhoto: c.cover_photo || c.coverPhoto || '',
                                    pitchVideoUrl: c.pitch_video_url || c.pitchVideoUrl || '',
                                    goal: c.goal || 500000,
                                    durationDays: c.durationDays || 60,
                                    equityOffer: c.equity_offer || c.equityOffer || '',
                                    description: c.description || ''
                                  });
                                  setActiveTab('campaign');
                                }}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                Edit Details
                              </button>
                              <button
                                onClick={() => setActiveTab('milestones')}
                                className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                Milestones
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400 space-y-3">
                        <p>No campaigns registered in database under your account.</p>
                        <button
                          onClick={handleOpenCreateCampaign}
                          className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Your First Campaign</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ROW: IMPACT INSIGHTS & REAL INVESTORS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Impact Insights */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        <span>Impact Insights</span>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100">
                          <div>
                            <span className="text-xs font-semibold text-slate-800 block">Database Sync Status</span>
                            <span className="text-xs text-slate-500">Real-time API connection</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-700 block font-mono">CONNECTED</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100">
                          <div>
                            <span className="text-xs font-semibold text-slate-800 block">Vetting Verification</span>
                            <span className="text-xs text-slate-500">Institutional identity status</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-700 block font-mono uppercase">
                              {profileUser.vettingStatus || 'VERIFIED'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Verified Investors List from Database */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-base">Registered Investors</h3>
                        <button onClick={() => setActiveTab('investors')} className="text-xs text-sky-600 hover:text-sky-700 font-semibold">
                          View All ({investorsList.length})
                        </button>
                      </div>

                      {investorsList.length > 0 ? (
                        <div className="grid grid-cols-3 gap-4 pt-4 text-center">
                          {investorsList.slice(0, 3).map((inv, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedPublicProfile({ type: 'investor', id: inv.id || inv._id })}
                              className="space-y-2 text-center cursor-pointer"
                            >
                              <InitialsAvatar name={inv.name || inv.institution} className="w-12 h-12 mx-auto" />
                              <span className="text-xs font-semibold text-slate-800 block truncate">{inv.name || inv.institution}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-400">
                          No registered investors found in database.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MY CAMPAIGN WIZARD FORM */}
              {activeTab === 'campaign' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-xs text-slate-500 font-medium">Workspace / Campaign Submission Wizard</span>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                        {editingCampaignId ? 'Edit Startup Campaign Details' : 'Create New Startup Campaign'}
                      </h1>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-3 py-1 bg-amber-100 text-amber-800 rounded-lg">
                        Step {wizardStep} of 5
                      </span>
                    </div>
                  </div>

                  {/* 5-STEP WIZARD PROGRESS BAR */}
                  <div className="grid grid-cols-5 gap-2 text-center text-xs font-semibold">
                    <button
                      onClick={() => setWizardStep(1)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        wizardStep === 1 ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' :
                        wizardStep > 1 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      1. Venture Identity
                    </button>
                    <button
                      onClick={() => setWizardStep(2)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        wizardStep === 2 ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' :
                        wizardStep > 2 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      2. Pitch & Deck
                    </button>
                    <button
                      onClick={() => setWizardStep(3)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        wizardStep === 3 ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' :
                        wizardStep > 3 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      3. Financials & Terms
                    </button>
                    <button
                      onClick={() => setWizardStep(4)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        wizardStep === 4 ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' :
                        wizardStep > 4 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      4. Milestones
                    </button>
                    <button
                      onClick={() => setWizardStep(5)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        wizardStep === 5 ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      5. Audit Submission
                    </button>
                  </div>

                  {/* STEP CONTENT PANELS */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm space-y-6">
                    {/* STEP 1: CORE VENTURE IDENTITY */}
                    {wizardStep === 1 && (
                      <div className="space-y-5">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="font-bold text-slate-900 text-base">Step 1: Core Venture Identity</h3>
                          <p className="text-xs text-slate-500">Provide basic startup title, category, and university affiliation.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Startup Venture Name *</label>
                            <input
                              type="text"
                              required
                              value={campaignForm.title}
                              onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                              placeholder="e.g. CampusBites or EcoThread"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">University / Institution *</label>
                            <input
                              type="text"
                              value={campaignForm.university}
                              onChange={(e) => setCampaignForm({ ...campaignForm, university: e.target.value })}
                              placeholder="e.g. BRAC University"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Category / Sector</label>
                            <select
                              value={campaignForm.category || 'FoodTech / SaaS'}
                              onChange={(e) => setCampaignForm({ ...campaignForm, category: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                            >
                              <option value="FoodTech / SaaS">FoodTech / SaaS</option>
                              <option value="EdTech / AI">EdTech / AI</option>
                              <option value="HealthTech / Biotech">HealthTech / Biotech</option>
                              <option value="CleanTech / IoT">CleanTech / IoT</option>
                              <option value="FinTech / E-Commerce">FinTech / E-Commerce</option>
                              <option value="Hardware / Robotics">Hardware / Robotics</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Venture Development Stage</label>
                            <select
                              value={campaignForm.stage || 'MVP Stage'}
                              onChange={(e) => setCampaignForm({ ...campaignForm, stage: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                            >
                              <option value="Idea Phase">Idea Phase</option>
                              <option value="Prototype / MVP">Prototype / MVP</option>
                              <option value="Early Revenue">Early Revenue</option>
                              <option value="Growth & Scale">Growth & Scale</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Short Mission Tagline</label>
                            <input
                              type="text"
                              value={campaignForm.tagline}
                              onChange={(e) => setCampaignForm({ ...campaignForm, tagline: e.target.value })}
                              placeholder="e.g. Smart canteen pre-meal reservation app for university campuses..."
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              if (!campaignForm.title) {
                                showToast('Please enter Startup Name before continuing.', 'error');
                                return;
                              }
                              setWizardStep(2);
                            }}
                            className="px-6 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
                          >
                            Next Step: Pitch & Deck →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: PITCH DECK & MEDIA UPLOADS */}
                    {wizardStep === 2 && (
                      <div className="space-y-5">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="font-bold text-slate-900 text-base">Step 2: Pitch Deck & Document Uploads</h3>
                          <p className="text-xs text-slate-500">Upload pitch deck documents, cover photo URL, and pitch video details.</p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Cover Photo URL or Banner</label>
                            <input
                              type="text"
                              value={campaignForm.coverPhoto}
                              onChange={(e) => setCampaignForm({ ...campaignForm, coverPhoto: e.target.value })}
                              placeholder="https://images.unsplash.com/photo-..."
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Pitch Video URL (YouTube / Vimeo / Google Drive)</label>
                            <input
                              type="text"
                              value={campaignForm.pitchVideoUrl}
                              onChange={(e) => setCampaignForm({ ...campaignForm, pitchVideoUrl: e.target.value })}
                              placeholder="https://youtube.com/watch?v=..."
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Full Venture Pitch Description *</label>
                            <textarea
                              rows={5}
                              value={campaignForm.description}
                              onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                              placeholder="Describe the problem, market solution, customer traction, and revenue model..."
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                            ></textarea>
                          </div>

                          <AiContentAssistant
                            kind="campaign"
                            userId={user.id || user._id}
                            campaignId={editingCampaignId || activeCampaign?.id || activeCampaign?._id}
                            value={campaignForm.description}
                            context={{
                              title: campaignForm.title,
                              university: campaignForm.university,
                              category: campaignForm.category,
                              stage: campaignForm.stage,
                              tagline: campaignForm.tagline,
                              goal: campaignForm.goal,
                              equityOffer: campaignForm.equityOffer,
                              description: campaignForm.description
                            }}
                            API_BASE_URL={API_BASE_URL}
                            showToast={showToast}
                            onApply={(content) => setCampaignForm({ ...campaignForm, description: content })}
                          />
                        </div>

                        <div className="flex justify-between pt-4">
                          <button
                            type="button"
                            onClick={() => setWizardStep(1)}
                            className="px-5 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                          >
                            ← Previous Step
                          </button>
                          <button
                            type="button"
                            onClick={() => setWizardStep(3)}
                            className="px-6 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
                          >
                            Next Step: Financials & Terms →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: FINANCIAL TARGET & EQUITY TERMS */}
                    {wizardStep === 3 && (
                      <div className="space-y-5">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="font-bold text-slate-900 text-base">Step 3: Financial Goal & Return Terms</h3>
                          <p className="text-xs text-slate-500">Define funding goal amount in BDT and terms offered to investors.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Target Funding Goal (৳ BDT) *</label>
                            <input
                              type="number"
                              required
                              value={campaignForm.goal}
                              onChange={(e) => setCampaignForm({ ...campaignForm, goal: e.target.value })}
                              placeholder="500000"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Investor Equity / Return Terms *</label>
                            <input
                              type="text"
                              required
                              value={campaignForm.equityOffer}
                              onChange={(e) => setCampaignForm({ ...campaignForm, equityOffer: e.target.value })}
                              placeholder="e.g. 8% Revenue Share or 10% Equity"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Campaign Duration (Days)</label>
                            <input
                              type="number"
                              value={campaignForm.durationDays || 60}
                              onChange={(e) => setCampaignForm({ ...campaignForm, durationDays: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Escrow Tranche Disbursement Schedule</label>
                            <input
                              type="text"
                              disabled
                              value="3 Equal Milestone Tranches (33% / 33% / 34%)"
                              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between pt-4">
                          <button
                            type="button"
                            onClick={() => setWizardStep(2)}
                            className="px-5 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                          >
                            ← Previous Step
                          </button>
                          <button
                            type="button"
                            onClick={() => setWizardStep(4)}
                            className="px-6 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
                          >
                            Next Step: Milestones →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: MILESTONES ROADMAP */}
                    {wizardStep === 4 && (
                      <div className="space-y-5">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="font-bold text-slate-900 text-base">Step 4: Escrow Release Milestones</h3>
                          <p className="text-xs text-slate-500">Configure key milestone objectives required to release escrow tranches.</p>
                        </div>

                        <div className="space-y-3">
                          <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
                            <div className="flex justify-between text-xs font-bold text-slate-900">
                              <span>Milestone #1: MVP Launch & Prototype</span>
                              <span className="text-emerald-700 font-mono">Tranche 1 (33%)</span>
                            </div>
                            <p className="text-xs text-slate-500">Completion target: Month 1</p>
                          </div>

                          <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
                            <div className="flex justify-between text-xs font-bold text-slate-900">
                              <span>Milestone #2: Market Testing & User Acquisition</span>
                              <span className="text-amber-700 font-mono">Tranche 2 (33%)</span>
                            </div>
                            <p className="text-xs text-slate-500">Completion target: Month 2</p>
                          </div>

                          <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
                            <div className="flex justify-between text-xs font-bold text-slate-900">
                              <span>Milestone #3: Commercial Release & Revenue Target</span>
                              <span className="text-sky-700 font-mono">Tranche 3 (34%)</span>
                            </div>
                            <p className="text-xs text-slate-500">Completion target: Month 4</p>
                          </div>
                        </div>

                        <div className="flex justify-between pt-4">
                          <button
                            type="button"
                            onClick={() => setWizardStep(3)}
                            className="px-5 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                          >
                            ← Previous Step
                          </button>
                          <button
                            type="button"
                            onClick={() => setWizardStep(5)}
                            className="px-6 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
                          >
                            Next Step: Review & Audit Submission →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 5: AUDIT SUBMISSION REVIEW */}
                    {wizardStep === 5 && (
                      <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="font-bold text-slate-900 text-base">Step 5: Review & Submit for Admin Audit</h3>
                          <p className="text-xs text-slate-500">Double-check your pitch details before submitting for FundBridge Admin verification.</p>
                        </div>

                        {/* SUMMARY CHECKLIST CARD */}
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs">
                          <div className="flex justify-between items-start border-b pb-3">
                            <div>
                              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">STARTUP VENTURE</span>
                              <h4 className="font-bold text-slate-900 text-base">{campaignForm.title || 'Untitled Venture'}</h4>
                              <span className="text-xs font-semibold text-emerald-700">{campaignForm.university}</span>
                            </div>
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded uppercase">
                              READY FOR AUDIT ⏳
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono">
                            <div>
                              <span className="text-slate-400 text-[10px] block">FUNDING GOAL</span>
                              <strong className="text-slate-900">৳ {Number(campaignForm.goal || 0).toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] block">TERMS OFFERED</span>
                              <strong className="text-emerald-700">{campaignForm.equityOffer}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] block">STAGE</span>
                              <strong className="text-slate-900">{campaignForm.stage || 'MVP'}</strong>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200 text-slate-600 leading-relaxed">
                            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">PITCH SUMMARY</span>
                            <p className="line-clamp-3">{campaignForm.description || campaignForm.tagline || 'No description provided.'}</p>
                          </div>
                        </div>

                        {/* AUDIT PIPELINE INFORMATION BANNER */}
                        <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl space-y-1.5 text-xs text-amber-900">
                          <span className="font-bold block text-amber-900 flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-amber-700" /> Admin Audit & Verification Workflow:
                          </span>
                          <p className="text-[11px] text-amber-800 leading-relaxed">
                            Upon submitting, your campaign will be sent to the FundBridge Admin Audit Vault. Once FundBridge Admins review your student identity credentials and pitch deck, the campaign will be set to <strong>VERIFIED</strong> and published live to the <strong>Investor Feed</strong>.
                          </p>
                        </div>

                        <div className="flex justify-between pt-4">
                          <button
                            type="button"
                            onClick={() => setWizardStep(4)}
                            className="px-5 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                          >
                            ← Previous Step
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveCampaign}
                            className="px-6 py-3 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                          >
                            <span>Submit for Admin Audit & Verification</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: CAMPAIGNS DIRECTORY (EXPLORE) */}
              {activeTab === 'explore' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Campaigns Directory</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Explore startup ventures and community relief drives across Bangladesh universities.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Market Toggle: Startup vs Relief */}
                      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setExploreMarket('startup')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            exploreMarket === 'startup'
                              ? 'bg-white text-emerald-800 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Startup Ventures ({filteredAllCampaigns.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setExploreMarket('relief')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            exploreMarket === 'relief'
                              ? 'bg-white text-rose-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Heart className="w-3.5 h-3.5 text-rose-600" />
                          <span>Relief Causes ({filteredAllRelief.length})</span>
                        </button>
                      </div>

                      {exploreMarket === 'startup' && (
                        <select
                          value={exploreCategory}
                          onChange={(e) => setExploreCategory(e.target.value)}
                          className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none"
                        >
                          <option value="all">All Categories</option>
                          <option value="f&b">FoodTech / F&B</option>
                          <option value="cleantech">CleanTech</option>
                          <option value="watertech">WaterTech</option>
                          <option value="healthtech">HealthTech</option>
                          <option value="agtech">AgTech</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {exploreMarket === 'relief' ? (
                    filteredAllRelief.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAllRelief.map((drive, idx) => (
                          <div key={drive.id || idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-rose-300 transition-all">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md uppercase">
                                  {drive.cause || 'Relief Cause'}
                                </span>
                                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase">
                                  VERIFIED CHARITY
                                </span>
                              </div>

                              <div>
                                <h3 className="font-bold text-slate-900 text-base">{drive.title}</h3>
                                <span className="text-xs font-semibold text-emerald-700 block">{drive.university || 'University Campus'}</span>
                                <p className="text-xs text-slate-500 mt-0.5">Beneficiary: <strong className="text-slate-700">{drive.beneficiary || 'Community members'}</strong></p>
                              </div>

                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {drive.description}
                              </p>

                              {drive.founder && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPublicProfile({ type: 'founder', id: drive.founder.id || drive.founder_id || drive.founderId })}
                                  className="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                                >
                                  <span>Organized by {drive.founder.name || 'Student Founder'}</span>
                                </button>
                              )}
                            </div>

                            <div className="space-y-3 pt-3 border-t border-slate-100">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-slate-500">Raised: <strong className="text-emerald-700">৳ {Number(drive.raised || 0).toLocaleString()}</strong></span>
                                <span className="text-slate-500">Goal: <strong>৳ {Number(drive.goal || 0).toLocaleString()}</strong></span>
                              </div>

                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-full rounded-full"
                                  style={{ width: drive.goal > 0 ? `${Math.min(100, Math.round(((drive.raised || 0) / drive.goal) * 100))}%` : '0%' }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
                        <Heart className="w-10 h-10 text-rose-300 mx-auto" />
                        <h3 className="font-bold text-slate-800 text-sm">No live relief causes found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">There are currently no approved humanitarian relief campaigns matching your query.</p>
                      </div>
                    )
                  ) : filteredAllCampaigns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredAllCampaigns.map((c, idx) => (
                        <div key={c.id || c._id || idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-emerald-500/50 transition-all">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase">
                                {c.category || 'Startup'}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500">{c.stage || 'MVP Stage'}</span>
                            </div>

                            <div>
                              <button
                                type="button"
                                onClick={() => setSelectedPublicProfile({ type: 'founder', id: c.founder_id || c.founderId || c.founder?.id || c.founder?._id })}
                                className="font-bold text-left text-slate-900 text-base hover:text-emerald-700"
                              >
                                {c.title}
                              </button>
                              <span className="text-xs font-semibold text-emerald-700 block">{c.university}</span>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
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
                                className="bg-emerald-600 h-full rounded-full"
                                style={{ width: c.goal > 0 ? `${Math.min(100, Math.round(((c.raised || 0) / c.goal) * 100))}%` : '0%' }}
                              ></div>
                            </div>

                            <div className="flex justify-between items-center text-xs pt-1">
                              <span className="text-slate-500 font-semibold">{c.equityOffer || 'Equity Share'}</span>
                              <span className="text-sky-600 font-bold inline-flex items-center gap-1">
                                View Pitch <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
                      <Compass className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">No campaigns found matching your query in database.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: RELIEF CAMPAIGNS (MATCHING media_1788556426069.png) */}
              {activeTab === 'relief' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">My Relief Campaigns</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Your donation causes. New ones need admin approval before they go public.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('explore');
                          setExploreMarket('relief');
                        }}
                        className="px-4 py-2.5 bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-600" />
                        <span>+ Relief Campaigns to Support</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateReliefModal(true)}
                        className="px-4 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Create New Relief Campaign</span>
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Filter Card matching media_1788556426069.png */}
                  <div className="border border-emerald-300 bg-white rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-emerald-700" />
                        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Filters</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold rounded-full border border-emerald-200">
                          Showing {filteredMyRelief.length} of {myReliefCampaigns.length} Causes
                        </span>
                        <button
                          type="button"
                          onClick={() => setReliefFiltersOpen(!reliefFiltersOpen)}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{reliefFiltersOpen ? 'HIDE ▲' : 'SHOW ▼'}</span>
                        </button>
                      </div>
                    </div>

                    {reliefFiltersOpen && (
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium text-[11px]">Status:</span>
                          {['all', 'open', 'pending', 'rejected'].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setReliefStatusFilter(st)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                                reliefStatusFilter === st
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {st === 'open' ? 'Active / Open' : st}
                            </button>
                          ))}
                        </div>

                        <div className="w-64">
                          <input
                            type="text"
                            placeholder="Search title, cause, or university..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Relief Campaigns List or Empty State */}
                  {filteredMyRelief.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                        <Heart className="w-6 h-6" />
                      </div>
                      <div className="max-w-md mx-auto space-y-1">
                        <h3 className="font-bold text-slate-900 text-base">No relief campaigns found</h3>
                        <p className="text-xs text-slate-500">
                          Launch a student relief or charity drive to mobilize humanitarian support from alumni and investors across Bangladesh.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCreateReliefModal(true)}
                        className="px-5 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Relief Campaign</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredMyRelief.map((drive, idx) => (
                        <div key={drive.id || idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-emerald-400 transition-all">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md uppercase">
                                {drive.cause || 'Relief'}
                              </span>
                              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                                drive.status === 'open' || drive.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : drive.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                              }`}>
                                {drive.status === 'open' ? 'Active / Open' : drive.status || 'Pending'}
                              </span>
                            </div>

                            <div>
                              <h3 className="font-bold text-slate-900 text-base">{drive.title}</h3>
                              <span className="text-xs font-semibold text-emerald-700 block">{drive.university}</span>
                              <p className="text-xs text-slate-500 mt-1">Beneficiary: <strong className="text-slate-700">{drive.beneficiary || 'Community'}</strong></p>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {drive.description}
                            </p>

                            {drive.rejectionReason && (
                              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700">
                                <strong>Rejection note:</strong> {drive.rejectionReason}
                              </div>
                            )}
                          </div>

                          <div className="space-y-3 pt-3 border-t border-slate-100">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-slate-500">Raised: <strong className="text-emerald-700">৳ {Number(drive.raised || 0).toLocaleString()}</strong></span>
                              <span className="text-slate-500">Goal: <strong>৳ {Number(drive.goal || 0).toLocaleString()}</strong></span>
                            </div>

                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full rounded-full"
                                style={{ width: drive.goal > 0 ? `${Math.min(100, Math.round(((drive.raised || 0) / drive.goal) * 100))}%` : '0%' }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: INVESTORS */}
              {activeTab === 'investors' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Investors & Proposals</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Manage verified investors and backing proposals from database.</p>
                    </div>
                  </div>

                  {/* 4 METRIC CARDS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">TOTAL INVESTORS</span>
                      <span className="text-2xl font-bold text-slate-900 font-mono">{investorsList.length}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">PROPOSALS RECEIVED</span>
                      <span className="text-2xl font-bold text-sky-600 font-mono">{proposals.length}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">RAISED IN ESCROW</span>
                      <span className="text-2xl font-bold text-emerald-700 font-mono">
                        ৳ {activeCampaign ? (Number(activeCampaign.raised) || 0).toLocaleString() : '0'}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">FUNDING GOAL</span>
                      <span className="text-2xl font-bold text-slate-900 font-mono">
                        ৳ {activeCampaign ? (Number(activeCampaign.goal) || 0).toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>

                  {/* INVESTORS GRID & PROPOSALS */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="font-bold text-slate-900 text-base">Submitted Investor Proposals</h3>

                      {proposals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {proposals.map((p, idx) => (
                            <div
                              key={p.id || p._id || idx}
                              onClick={() => setSelectedProposal(p)}
                              className={`bg-white border rounded-2xl p-5 shadow-sm cursor-pointer transition-all ${selectedProposal?.id === p.id ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <InitialsAvatar name={p.investor_name || 'Investor'} />
                                  <div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPublicProfile({ type: 'investor', id: p.investor_id || p.investorId });
                                      }}
                                      className="font-bold text-slate-900 text-sm hover:text-emerald-700"
                                    >
                                      {p.investor_name || 'Verified Investor'}
                                    </button>
                                    <span className="text-xs font-semibold text-sky-600 block">{p.return_structure || 'Revenue Share'}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setChatTarget({ name: p.investor_name || 'Investor', id: p.investor_id || p.investorId });
                                        setShowChatDrawer(true);
                                      }}
                                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Send direct message to investor"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                  <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded ${p.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                                      p.status === 'declined' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                    {(p.status || 'PENDING').toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                                <div className="flex justify-between text-slate-600">
                                  <span>Offer Amount</span>
                                  <span className="font-bold text-slate-900 font-mono">৳ {Number(p.amount || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                  <span>Return Structure</span>
                                  <span className="font-semibold text-slate-900">{p.return_structure || p.terms || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
                          <Users className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-xs font-semibold text-slate-700">No investor proposals submitted yet in database.</p>
                          <p className="text-[11px] text-slate-400">When an investor submits a funding proposal for your campaign, it will appear here.</p>
                        </div>
                      )}
                    </div>

                    {selectedProposal ? (
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
                        <div className="space-y-5">
                          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold block">FINANCIAL OFFER</span>
                              <span className="text-2xl font-bold text-emerald-900 font-mono">৳ {Number(selectedProposal.amount || 0).toLocaleString()}</span>
                            </div>
                            <Wallet className="w-8 h-8 text-emerald-600 opacity-80" />
                          </div>

                          <div className="space-y-3 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedPublicProfile({ type: 'investor', id: selectedProposal.investor_id || selectedProposal.investorId })}
                                className="text-[10px] font-semibold text-emerald-700 hover:underline"
                              >
                                Open investor profile
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedPublicProfile({ type: 'investor', id: selectedProposal.investor_id || selectedProposal.investorId })}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 hover:underline"
                              >
                                <Flag className="w-3 h-3" />
                                Report investor
                              </button>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                              <span className="text-slate-500">Return Terms</span>
                              <span className="font-bold text-slate-900">{selectedProposal.return_structure || selectedProposal.terms || 'Standard'}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                              <span className="text-slate-500">Maturity Period</span>
                              <span className="font-bold text-slate-900">{selectedProposal.maturity_period || '24 Months'}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                              <span className="text-slate-500">Status</span>
                              <span className="font-bold text-emerald-700 uppercase">{selectedProposal.status || 'pending'}</span>
                            </div>
                          </div>

                          {selectedProposal.custom_notes && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">INVESTOR NOTE</span>
                              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 italic">
                                "{selectedProposal.custom_notes}"
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => handleProposalStatus(selectedProposal.id || selectedProposal._id, 'declined')}
                            className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                          >
                            Decline Offer
                          </button>
                          <button
                            onClick={() => handleProposalStatus(selectedProposal.id || selectedProposal._id, 'accepted')}
                            className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            Accept Offer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 my-auto">
                        Select a proposal from the left to view financial terms.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: WALLET */}
              {activeTab === 'matches' && (
                <FounderMatchView campaignId={activeCampaign?.id || activeCampaign?._id} founderId={currentUser?.id || currentUser?._id || user.id} apiBase={API_BASE_URL} onOpenInvestor={(match) => setSelectedPublicProfile({ type: 'investor', id: match.investorId })} />
              )}

              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Wallet</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Manage payouts, security deposits, and tranche disbursements from database.</p>
                    </div>
                    <button
                      onClick={() => setShowPayoutModal(true)}
                      className="px-4 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Request Payout</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-900 text-base">Security Deposit Bond Calculation</h3>
                        <Info className="w-4 h-4 text-slate-400" />
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-widest block mb-2 font-bold">DYNAMIC BOND FORMULA</span>
                        <div className="text-xl font-bold text-slate-900 font-mono py-2 px-4 bg-white border border-slate-200 rounded-lg inline-block shadow-2xs">
                          D = F * (P<sub>base</sub> + α * T)
                        </div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-900">
                        <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Security deposits are locked safely in smart escrow contracts and released upon milestone completion verification.</span>
                      </div>
                    </div>

                    {/* SPRINT 5 (Samiul): real Transaction Tracking stat cards — replaces the old
                        raised * 0.5 guessed formula with the actual computed escrow balance (FR-9) */}
                    <div className="space-y-6 flex flex-col justify-between">
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">TOTAL RAISED (VERIFIED)</span>
                        <h3 className="text-3xl font-bold text-emerald-600 font-mono">
                          ৳ {activeCampaignTx ? Number(activeCampaignTx.raisedComputed || 0).toLocaleString() : '0'}
                        </h3>
                        <span className="text-[10px] text-slate-400">Computed from accepted investor proposals, not a cached total</span>
                      </div>

                      <div className={`bg-white border rounded-2xl p-6 shadow-sm space-y-2 ${activeCampaignTx && activeCampaignTx.escrowBalance < 0 ? 'border-rose-300' : 'border-slate-200'
                        }`}>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">ESCROW BALANCE</span>
                        <h3 className={`text-3xl font-bold font-mono ${activeCampaignTx && activeCampaignTx.escrowBalance < 0 ? 'text-rose-600' : 'text-slate-900'
                          }`}>
                          ৳ {activeCampaignTx ? Number(activeCampaignTx.escrowBalance || 0).toLocaleString() : '0'}
                        </h3>
                        {activeCampaignTx && activeCampaignTx.escrowBalance < 0 && (
                          <span className="text-[10px] text-rose-600 font-semibold block flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Paid out exceeds verified funds raised
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SPRINT 5 (Samiul): real merged Transaction Timeline (FR-9) — replaces the old
                      flat "Automated Payout Ledger" table, which only showed money going out and
                      never connected it to what was actually raised. */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-slate-900 text-base">Transaction Timeline</h3>
                      <span className="text-[10px] font-mono uppercase text-slate-400">Money in & out, merged</span>
                    </div>

                    {activeCampaignTx && activeCampaignTx.timeline.length > 0 ? (
                      <div className="space-y-3">
                        {activeCampaignTx.timeline.map((t, idx) => (
                          <div key={t.id || idx} className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${t.type === 'investment_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                              }`}>
                              {t.type === 'investment_in' ? <TrendingUp className="w-4.5 h-4.5" /> : <TrendingDown className="w-4.5 h-4.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-900 text-xs">
                                  {t.type === 'investment_in' ? 'Investment Received' : (t.tranche || 'Tranche Payout')}
                                </span>
                                <span className={`font-mono font-bold text-sm ${t.type === 'investment_in' ? 'text-emerald-700' : 'text-sky-700'
                                  }`}>
                                  {t.type === 'investment_in' ? '+' : '−'}৳ {Number(t.amount || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <span className="text-[11px] text-slate-500">
                                  {t.type === 'investment_in' ? `Terms: ${t.terms || 'Standard'}` : `Via ${t.method || 'bKash'} • ${t.status || 'Pending Audit'}`}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {t.date ? new Date(t.date).toLocaleDateString() : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                        No transactions recorded yet for this campaign.
                      </div>
                    )}

                    {transactionData && transactionData.unattributedPayouts && transactionData.unattributedPayouts.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 space-y-2">
                        <span className="text-[10px] font-mono uppercase text-amber-600 font-bold block">Legacy Payouts (recorded before campaign linking existed)</span>
                        {transactionData.unattributedPayouts.map((p, idx) => (
                          <div key={p.id || idx} className="flex items-center justify-between text-xs px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                            <span className="text-slate-700">{p.tranche || 'Escrow Disbursement'}</span>
                            <span className="font-mono font-semibold text-slate-900">৳ {Number(p.amount || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: MILESTONES */}
              {activeTab === 'milestones' && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#0284C7] tracking-widest font-bold block">TRANSACTION LIFECYCLE</span>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display mt-0.5">Milestone Tracker</h1>
                    <p className="text-xs text-slate-500 mt-1">Follow each accepted investment from escrow through funding requests, proof, and investor verification.</p>
                  </div>
                  <TransactionMilestoneTracker
                    role="founder"
                    userId={user.id || user._id}
                    API_BASE_URL={API_BASE_URL}
                    showToast={showToast}
                    onMessage={(target) => {
                      setChatTarget(target);
                      setShowChatDrawer(true);
                    }}
                  />
                </div>
              )}

              {/* TAB 6: AUDIT LOGS */}
              {activeTab === 'audit' && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#0284C7] tracking-widest font-bold block">IMMUTABLE LEDGER ACTIVE</span>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display mt-0.5">Audit Logs</h1>
                    <p className="text-xs text-slate-500 mt-1">Real-time database log entries and cryptographic hash receipts.</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    {auditLogs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                              <th className="pb-3 font-semibold">CATEGORY</th>
                              <th className="pb-3 font-semibold">TITLE</th>
                              <th className="pb-3 font-semibold">STATUS</th>
                              <th className="pb-3 font-semibold">HASH RECEIPT</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {auditLogs.map((log, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80">
                                <td className="py-4 font-mono font-bold text-slate-800">{log.category || 'SYSTEM'}</td>
                                <td className="py-4 font-semibold text-slate-900">{log.title || 'Log Activity'}</td>
                                <td className="py-4">
                                  <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-md uppercase">
                                    {log.status || 'VERIFIED'}
                                  </span>
                                </td>
                                <td className="py-4 font-mono text-sky-600 font-semibold">{log.hash || '0x8f2a...99c4'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50 rounded-xl text-xs text-slate-400">
                        No audit records found in database.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: SETTINGS / EDIT PROFILE INFO */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Profile Settings</h1>
                    <p className="text-xs text-slate-500 mt-1">Manage your founder identity, contact details, and institutional credentials.</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                      <InitialsAvatar name={profileUser.name} className="w-16 h-16 text-lg" />
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{profileUser.name}</h3>
                        <span className="text-xs text-emerald-700 font-semibold block">{profileUser.university}</span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Vetting Status: {profileUser.vettingStatus || 'VERIFIED'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                        <input
                          type="text"
                          value={profileUser.name}
                          onChange={(e) => setProfileUser({ ...profileUser, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={profileUser.email}
                          onChange={(e) => setProfileUser({ ...profileUser, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">University / Institution</label>
                        <input
                          type="text"
                          value={profileUser.university}
                          onChange={(e) => setProfileUser({ ...profileUser, university: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Department</label>
                        <input
                          type="text"
                          value={profileUser.department || ''}
                          onChange={(e) => setProfileUser({ ...profileUser, department: e.target.value })}
                          placeholder="e.g. Computer Science & Engineering"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Student ID</label>
                        <input
                          type="text"
                          value={profileUser.studentId || ''}
                          onChange={(e) => setProfileUser({ ...profileUser, studentId: e.target.value })}
                          placeholder="e.g. 20101452"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">bKash / MFS Mobile Number</label>
                        <input
                          type="text"
                          value={profileUser.mfsNumber || ''}
                          onChange={(e) => setProfileUser({ ...profileUser, mfsNumber: e.target.value })}
                          placeholder="e.g. 01711223344"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="font-semibold text-slate-700 block">Public founder bio</label>
                      <textarea
                        rows={5}
                        value={profileUser.bio || ''}
                        onChange={(e) => setProfileUser({ ...profileUser, bio: e.target.value })}
                        placeholder="A concise, investor-facing biography. Avoid unverified claims."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                      />
                      <AiContentAssistant
                        kind="bio"
                        userId={user.id || user._id}
                        value={profileUser.bio}
                        context={{
                          name: profileUser.name,
                          university: profileUser.university,
                          department: profileUser.department,
                          startup: campaignForm.title || activeCampaign?.title,
                          industry: campaignForm.category || activeCampaign?.category
                        }}
                        API_BASE_URL={API_BASE_URL}
                        showToast={showToast}
                        onApply={(content) => setProfileUser({ ...profileUser, bio: content })}
                      />
                    </div>

                    <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                      <button
                        type="button"
                        onClick={onLogout}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out of Account</span>
                      </button>

                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer"
                      >
                        Save Profile Changes
                      </button>
                    </div>
                  </form>

                  {/* Relief & Charity Campaigns on Founder Profile Settings */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                          <Heart className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">Relief & Charity Campaigns</h3>
                          <p className="text-xs text-slate-500">Charity and humanitarian funding drives connected to your founder profile.</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowCreateReliefModal(true)}
                        className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>New Relief Cause</span>
                      </button>
                    </div>

                    {myReliefCampaigns.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
                        <Heart className="w-8 h-8 text-rose-300 mx-auto" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-slate-700">No Relief Campaigns Yet</p>
                          <p className="text-[11px] text-slate-500">You haven't launched any charity funding causes yet.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCreateReliefModal(true)}
                          className="px-3.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                        >
                          + Launch Relief Campaign
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myReliefCampaigns.map((drive, idx) => (
                          <div key={drive.id || idx} className="p-4 border border-slate-200 rounded-xl space-y-2.5 hover:border-emerald-300 transition-colors">
                            <div className="flex flex-wrap justify-between items-start gap-2">
                              <div>
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded uppercase">
                                  {drive.cause || 'Relief'}
                                </span>
                                <h4 className="font-bold text-slate-900 text-sm mt-1">{drive.title}</h4>
                                <p className="text-xs text-slate-500">Beneficiary: <strong className="text-slate-700">{drive.beneficiary || 'Community'}</strong></p>
                              </div>
                              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                                drive.status === 'open' || drive.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : drive.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                              }`}>
                                {drive.status === 'open' ? 'Active / Open' : drive.status || 'Pending Review'}
                              </span>
                            </div>

                            {drive.description && (
                              <p className="text-xs text-slate-600 line-clamp-2">{drive.description}</p>
                            )}

                            <div className="space-y-1.5 pt-1 border-t border-slate-100">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-slate-500">Raised: <strong className="text-emerald-700">৳ {Number(drive.raised || 0).toLocaleString()}</strong></span>
                                <span className="text-slate-500">Goal: <strong>৳ {Number(drive.goal || 0).toLocaleString()}</strong></span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-full rounded-full transition-all"
                                  style={{ width: `${Math.min(100, Math.round(((drive.raised || 0) / (drive.goal || 1)) * 100))}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>

      {/* REQUEST PAYOUT MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Request Wallet Payout</h3>
              <button onClick={() => setShowPayoutModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Withdrawal Amount (৳)</label>
                <input
                  type="number"
                  required
                  placeholder="Enter amount (e.g. 50000)"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="bkash">bKash Merchant ({profileUser.mfsNumber || '01711223344'})</option>
                  <option value="bank">BRAC Bank Wire Transfer</option>
                  <option value="nagad">Nagad Enterprise</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-xl shadow-sm cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FR-8: PUBLISH ANNOUNCEMENT MODAL */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Publish Campaign Progress Update</span>
              </h3>
              <button onClick={() => setShowAnnouncementModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Update Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milestone 1 Completed - MVP Live for Beta Testing!"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Milestone Tag</label>
                <select
                  value={announcementTag}
                  onChange={(e) => setAnnouncementTag(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                >
                  <option value="Milestone 1 Achieved">Milestone 1 Achieved</option>
                  <option value="Milestone 2 In Progress">Milestone 2 In Progress</option>
                  <option value="Product Launch">Product Launch Announcement</option>
                  <option value="Financial Milestone">Financial / Revenue Report</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Announcement Narrative / Log Details</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share latest development logs, metric achievements, and user feedback with your backers..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-xl shadow-sm cursor-pointer"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChatDrawer && (
        <div className="fixed right-6 bottom-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[480px]">
          <div className="p-4 bg-[#047857] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="font-bold text-xs">{chatTarget?.name || 'Direct Messaging'}</span>
            </div>
            <button type="button" onClick={() => setShowChatDrawer(false)} className="text-emerald-100 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-slate-50">
            {chatLoading ? (
              <div className="py-16 text-center text-slate-400">Loading conversation…</div>
            ) : chatError ? (
              <div className="py-16 text-center text-rose-600">{chatError}</div>
            ) : chatMessages.length > 0 ? (
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
                <p>Start a direct conversation with your investor.</p>
              </div>
            )}
          </div>
          <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
              maxLength={2000}
              disabled={!chatTarget?.id || chatTarget?.id === 'all'}
              className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
            <button type="submit" disabled={!chatInputText.trim() || !chatTarget?.id || chatTarget?.id === 'all'} className="p-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-xl cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* CREATE RELIEF CAMPAIGN MODAL */}
      {showCreateReliefModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Create Relief / Charity Campaign</h3>
                  <p className="text-xs text-slate-500">Launch a verified donation drive for emergency aid or humanitarian relief.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateReliefModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReliefDrive} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Campaign Cause Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Flood Relief & Clean Water Initiative"
                  value={createReliefForm.title}
                  onChange={(e) => setCreateReliefForm({ ...createReliefForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cause Category</label>
                  <select
                    value={createReliefForm.cause}
                    onChange={(e) => setCreateReliefForm({ ...createReliefForm, cause: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="Disaster Relief">Disaster Relief</option>
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Community Welfare">Community Welfare</option>
                    <option value="Education Grant">Education Grant</option>
                    <option value="Student Hardship Fund">Student Hardship Fund</option>
                    <option value="Flood & Storm Aid">Flood & Storm Aid</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Beneficiary *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 Displaced families in Sylhet"
                    value={createReliefForm.beneficiary}
                    onChange={(e) => setCreateReliefForm({ ...createReliefForm, beneficiary: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Fundraising Target (৳ BDT) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="e.g. 200000"
                    value={createReliefForm.goal}
                    onChange={(e) => setCreateReliefForm({ ...createReliefForm, goal: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Campaign Duration (Days)</label>
                  <input
                    type="number"
                    min="7"
                    max="180"
                    value={createReliefForm.durationDays}
                    onChange={(e) => setCreateReliefForm({ ...createReliefForm, durationDays: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description & Urgency Narrative *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this relief effort is urgently needed, who is organizing it, and how people will be helped."
                  value={createReliefForm.description}
                  onChange={(e) => setCreateReliefForm({ ...createReliefForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Planned Use of Funds (One per line)</label>
                <textarea
                  rows={3}
                  placeholder="Food and pure drinking water&#10;Emergency medicine and kits&#10;Distribution and logistics"
                  value={createReliefForm.useOfFundsText}
                  onChange={(e) => setCreateReliefForm({ ...createReliefForm, useOfFundsText: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">News / Verification Proof Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://newspaper-article-or-hospital-doc-link.com"
                  value={createReliefForm.proofUrl}
                  onChange={(e) => setCreateReliefForm({ ...createReliefForm, proofUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Providing a verifiable news report or university endorsement expedites admin approval.</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateReliefModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRelief}
                  className="px-5 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submittingRelief ? 'Submitting...' : 'Submit Relief Campaign for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPublicProfile && (
        <PublicProfileModal
          profileType={selectedPublicProfile.type}
          profileId={selectedPublicProfile.id}
          API_BASE_URL={API_BASE_URL}
          reporter={{
            id: currentUser?.id || currentUser?._id || user.id,
            name: profileUser.name || user.name,
            role: 'founder'
          }}
          onReported={() => showToast('Report submitted to platform administrators.', 'success')}
          onClose={() => setSelectedPublicProfile(null)}
        />
      )}
    </div>
    </NotificationProvider>
  );
}
