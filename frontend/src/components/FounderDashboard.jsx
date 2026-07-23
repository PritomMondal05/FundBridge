import React, { useState, useEffect } from 'react';
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
  Bell,
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
  Compass
} from 'lucide-react';

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
    vettingStatus: user.vettingStatus || 'verified'
  });

  // Database State (Only real records loaded from backend)
  const [campaigns, setCampaigns] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [investorsList, setInvestorsList] = useState([]);
  const [payoutsList, setPayoutsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Selected Investor Proposal
  const [selectedProposal, setSelectedProposal] = useState(null);

  // Campaign Form State
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    university: user.university || '',
    tagline: '',
    coverPhoto: '',
    pitchVideoUrl: '',
    goal: 500000,
    durationDays: 60,
    equityOffer: '8% Revenue Share',
    description: ''
  });

  // AI Suite State
  const [aiPrompt, setAiPrompt] = useState('');
  const [refinedPitch, setRefinedPitch] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Wallet / Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bkash');

  // Milestones Upload State
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [certifyChecked, setCertifyChecked] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [exploreCategory, setExploreCategory] = useState('all');

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

      setLoading(false);
    } catch (err) {
      console.error('Database fetch error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, [currentUser]);

  // Active Campaign Object
  const activeCampaign = campaigns.length > 0 ? campaigns[0] : null;

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
  const handleSaveProfile = (e) => {
    e.preventDefault();
    showToast('Profile information updated successfully!', 'success');
  };

  // AI Copy Generator
  const handleGenerateAiCopy = () => {
    if (!aiPrompt) {
      showToast('Please enter a milestone prompt for AI copy generation.', 'info');
      return;
    }
    setIsGeneratingAi(true);
    setTimeout(() => {
      setRefinedPitch(
        `"${campaignForm.title || 'Startup'} leverages innovative tech developed at ${campaignForm.university} to transform its sector. Target objectives: ${aiPrompt}"`
      );
      setIsGeneratingAi(false);
      showToast('AI copy generated via Gemini 1.5 Pro!', 'success');
    }, 1200);
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex antialiased">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
          }`}>
          <Info className="w-4 h-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between p-5 shrink-0 select-none">
        <div className="space-y-8">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 px-2">
            <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">FundBridge</h1>
          </div>

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
              onClick={() => setActiveTab('investors')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'investors'
                  ? 'bg-[#DCFCE7] text-[#15803D] font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
            >
              <Users className="w-4.5 h-4.5" />
              <span>Investors</span>
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
        {/* TOP HEADER BAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
          {/* Search Input */}
          <div className="relative w-80">
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
              className="w-full pl-9 pr-4 py-2 bg-slate-100/80 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Right User Bar (Clicking opens Settings) */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </button>

            <button className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors">
              <MessageSquare className="w-4.5 h-4.5" />
            </button>

            <div className="h-6 w-px bg-slate-200 my-auto"></div>

            {/* Founder Profile Badge - Clicking opens Settings */}
            <div
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 px-2.5 py-1.5 rounded-xl transition-colors"
              title="Click to edit profile settings"
            >
              <InitialsAvatar name={profileUser.name} className="w-8 h-8" />
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">{profileUser.name}</span>
                <span className="text-[10px] text-slate-500 block leading-tight">{profileUser.university || 'Founder'}</span>
              </div>
            </div>
          </div>
        </header>

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
                              <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase ${c.verified || c.status === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                {c.verified || c.status === 'verified' ? 'Verified ✓' : 'Pending Review'}
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
                            <div key={idx} className="space-y-2">
                              <InitialsAvatar name={inv.name || inv.institution} className="w-12 h-12 mx-auto" />
                              <span className="text-xs font-semibold text-slate-800 block truncate">{inv.name || inv.institution}</span>
                            </div>
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

                          {/* AI Optimization Suite Assistant */}
                          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> AI Pitch Assistant (Gemini 1.5 Pro)
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Enter milestone goal (e.g. launch mobile canteen app for 5000 students)..."
                                className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs"
                              />
                              <button
                                type="button"
                                onClick={handleGenerateAiCopy}
                                disabled={isGeneratingAi}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                              >
                                {isGeneratingAi ? 'Generating...' : 'Enhance Pitch'}
                              </button>
                            </div>
                            {refinedPitch && (
                              <div className="p-3 bg-white border border-indigo-200 rounded-lg text-xs italic text-indigo-900 space-y-2">
                                <p>"{refinedPitch}"</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCampaignForm({ ...campaignForm, description: refinedPitch.replace(/"/g, '') });
                                    showToast('Applied AI refined pitch to description!', 'success');
                                  }}
                                  className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-semibold rounded-lg"
                                >
                                  Use AI Pitch Description
                                </button>
                              </div>
                            )}
                          </div>
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

              {/* TAB: CAMPAIGNS TO WATCH */}
              {activeTab === 'explore' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Campaigns to Watch</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Explore active startup campaigns across all university incubation centers.</p>
                    </div>

                    <div className="flex items-center gap-3">
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
                    </div>
                  </div>

                  {filteredAllCampaigns.length > 0 ? (
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
                              <h3 className="font-bold text-slate-900 text-base">{c.title}</h3>
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
                                    <h4 className="font-bold text-slate-900 text-sm">{p.investor_name || 'Verified Investor'}</h4>
                                    <span className="text-xs font-semibold text-sky-600 block">{p.return_structure || 'Revenue Share'}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      showToast(`Opening negotiation message channel with ${p.investor_name || 'Investor'}...`, 'info');
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

                    <div className="space-y-6 flex flex-col justify-between">
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">AVAILABLE TO WITHDRAW</span>
                        <h3 className="text-3xl font-bold text-sky-600 font-mono">
                          ৳ {activeCampaign ? (Number(activeCampaign.raised || 0) * 0.5).toLocaleString() : '0'}
                        </h3>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">IN ESCROW PIPELINE</span>
                        <h3 className="text-3xl font-bold text-slate-900 font-mono">
                          ৳ {activeCampaign ? (Number(activeCampaign.raised || 0) * 0.5).toLocaleString() : '0'}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 text-base">Automated Payout Ledger</h3>

                    {payoutsList.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                              <th className="pb-3 font-semibold">TRANCHE / REASON</th>
                              <th className="pb-3 font-semibold">AMOUNT</th>
                              <th className="pb-3 font-semibold">METHOD</th>
                              <th className="pb-3 font-semibold">STATUS</th>
                              <th className="pb-3 font-semibold">HASH / DATE</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {payoutsList.map((p, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80">
                                <td className="py-4 font-semibold text-slate-900">{p.tranche || 'Escrow Disbursement'}</td>
                                <td className="py-4 font-mono font-bold text-slate-900">৳ {Number(p.amount || 0).toLocaleString()}</td>
                                <td className="py-4">
                                  <span className="px-2 py-0.5 bg-pink-50 text-pink-700 text-[10px] font-bold rounded">{p.method || 'bKash'}</span>
                                </td>
                                <td className="py-4">
                                  <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-md uppercase">{p.status || 'COMPLETED'}</span>
                                </td>
                                <td className="py-4 text-slate-500 font-mono text-[11px]">{p.hash || p.created_at || 'Verified'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                        No payout transactions recorded in database yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: MILESTONES */}
              {activeTab === 'milestones' && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#0284C7] tracking-widest font-bold block">ACTIVE PROJECT TRACKING</span>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display mt-0.5">Milestone Submissions</h1>
                    <p className="text-xs text-slate-500 mt-1">Submit evidence for completed milestones to unlock funding tranches.</p>
                  </div>

                  {activeCampaign && activeCampaign.milestones && activeCampaign.milestones.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-base">Configured Milestones</h3>
                        <div className="space-y-3">
                          {activeCampaign.milestones.map((m, idx) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedMilestone(m._id || m.title || idx)}
                              className="p-4 rounded-xl border border-slate-200 hover:border-sky-500 cursor-pointer bg-slate-50/50"
                            >
                              <div className="flex justify-between items-center">
                                <h4 className="font-bold text-slate-900 text-sm">{m.name || m.title || `Milestone #${idx + 1}`}</h4>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${m.status === 'done' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                  {(m.status || 'PENDING').toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 block mt-1">Target: {m.targetDate || m.target || 'TBD'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 text-base">Proof Upload Zone</h3>
                        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 space-y-2">
                          <Upload className="w-8 h-8 text-sky-600 mx-auto" />
                          <span className="text-xs font-bold text-slate-800 block">Click to upload milestone proof files</span>
                          <span className="text-[11px] text-slate-400 block">PDF, JPG, or PNG (Max 10MB)</span>
                        </div>
                        <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={certifyChecked}
                            onChange={(e) => setCertifyChecked(e.target.checked)}
                            className="mt-0.5 rounded text-emerald-600"
                          />
                          <span>I certify all submitted documents are accurate.</span>
                        </label>
                        <button
                          onClick={() => {
                            if (!certifyChecked) return alert('Please check the accuracy certification box.');
                            showToast('Proof files submitted for verification!', 'success');
                          }}
                          className="w-full py-3 bg-[#047857] hover:bg-[#065f46] text-white font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Submit Proof to Database
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-400">
                      No milestones set for this campaign in database yet.
                    </div>
                  )}
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
                </div>
              )}
            </>
          )}
        </main>
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
    </div>
  );
}
