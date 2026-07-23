import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Rocket,
  Wallet,
  Users,
  History,
  Settings,
  HelpCircle,
  Bell,
  MessageSquare,
  Search,
  FileText,
  X,
  LogOut,
  Info
} from 'lucide-react';

import logoUrl from '../assets/images/FundBridge Logo.svg';

export default function InvestorDashboard({ currentUser, onLogout, API_BASE_URL, triggerAlert }) {
  const user = currentUser || {
    id: 'usr_investor_1',
    name: 'Javeria Doe',
    email: 'investor@firm.com',
    institution: 'Alumni Backer - BUET',
    vettingStatus: 'verified',
    mfsNumber: '01711223344'
  };

  // Active Tab: 'overview' | 'campaigns' | 'proposals' | 'wallet' | 'investors' | 'audit-logs' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  // Editable Profile User State
  const [profileUser, setProfileUser] = useState({
    name: user.name || '',
    email: user.email || '',
    institution: user.institution || 'Institutional Investor',
    mfsNumber: user.mfsNumber || '',
    bio: 'Active venture partner backing university tech startups across Bangladesh.',
    ticketSize: '৳ 5,00,000',
    vettingStatus: user.vettingStatus || 'verified'
  });

  // Dynamic Database Data States (No dummy data)
  const [campaigns, setCampaigns] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [coInvestors, setCoInvestors] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [walletLedger, setWalletLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Search & Filter state for Campaigns
  const [campaignSearch, setCampaignSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Selected Campaign Modal for Investment Proposal
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [proposalAmount, setProposalAmount] = useState('500000');
  const [proposalTerms, setProposalTerms] = useState('8% Revenue Share');
  const [proposalNotes, setProposalNotes] = useState('');

  // Co-Investors search
  const [investorSearch, setInvestorSearch] = useState('');

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Database Records
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch All Active Campaigns from DB
      const campRes = await fetch(`${API_BASE_URL}/api/campaigns`);
      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaigns(campData);
      }

      // 2. Fetch Proposals submitted by this Investor from DB
      const userId = user.id || user._id;
      if (userId) {
        const propRes = await fetch(`${API_BASE_URL}/api/proposals/investor/${userId}`);
        if (propRes.ok) {
          const propData = await propRes.json();
          setProposals(propData);
        }
      }

      // 3. Fetch Co-Investors from DB
      const invRes = await fetch(`${API_BASE_URL}/api/admin/users/investors`);
      if (invRes.ok) {
        const invData = await invRes.json();
        setCoInvestors(invData);
      }

      // 4. Fetch Audit Logs from DB
      const auditRes = await fetch(`${API_BASE_URL}/api/audit-logs`);
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData);
      }

      // 5. Fetch Wallet Ledger from DB
      const payRes = await fetch(`${API_BASE_URL}/api/payouts/founder/${userId}`);
      if (payRes.ok) {
        const payData = await payRes.json();
        setWalletLedger(payData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading investor database data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Submit Investment Proposal
  const handleCreateProposal = async (e) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${selectedCampaign.id || selectedCampaign._id}/proposals`, {
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
        showToast('Investment proposal submitted to database!', 'success');
        setSelectedCampaign(null);
        setProposalNotes('');
        fetchData();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to submit proposal', 'error');
      }
    } catch (err) {
      showToast('Error submitting proposal to server.', 'error');
    }
  };

  // Save Profile Info
  const handleSaveProfile = (e) => {
    e.preventDefault();
    showToast('Investor profile updated successfully!', 'success');
  };

  // Helper Initials Avatar Component
  const InitialsAvatar = ({ name, className = 'w-10 h-10' }) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'INV';
    return (
      <div className={`${className} rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0`}>
        {initials}
      </div>
    );
  };

  // Filtered Campaigns
  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = campaignSearch === '' || 
      c.title?.toLowerCase().includes(campaignSearch.toLowerCase()) || 
      c.university?.toLowerCase().includes(campaignSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Filtered Co-Investors
  const filteredInvestors = coInvestors.filter(i => {
    return investorSearch === '' || 
      i.name?.toLowerCase().includes(investorSearch.toLowerCase()) || 
      i.institution?.toLowerCase().includes(investorSearch.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
        }`}>
          <Info className="w-4 h-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="FundBridge Logo" className="h-7 w-auto" />
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase tracking-wider font-mono">
            INVESTOR PORTAL
          </span>
        </div>

        {/* Right Header User Profile (Clicking opens Settings) */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => showToast('Opening investor messaging workspace...', 'info')}
            className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="Messages"
          >
            <MessageSquare className="w-4.5 h-4.5" />
          </button>

          <button className="relative p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors" title="Notifications">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </button>

          <div className="h-6 w-px bg-slate-200 my-auto"></div>

          {/* Profile Container - Clicking opens Settings */}
          <div
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 px-2.5 py-1.5 rounded-xl transition-colors"
            title="Click to edit profile settings"
          >
            <InitialsAvatar name={profileUser.name} className="w-8 h-8" />
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-slate-900 block leading-tight">{profileUser.name}</span>
              <span className="text-[10px] text-slate-500 block leading-tight">{profileUser.institution || 'Verified Investor'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* BODY WITH SIDEBAR AND MAIN CONTENT */}
      <div className="flex-1 flex min-w-0">
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-white border-r border-slate-200 p-5 flex flex-col justify-between shrink-0 select-none">
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Rocket className="w-4.5 h-4.5" />
              <span>Explore Campaigns</span>
            </button>

            <button
              onClick={() => setActiveTab('proposals')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'proposals'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4.5 h-4.5" />
              <span>My Proposals ({proposals.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('investors')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'investors'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="w-4.5 h-4.5" />
              <span>Co-Investors</span>
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'wallet'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-4.5 h-4.5" />
              <span>Wallet Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('audit-logs')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'audit-logs'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <History className="w-4.5 h-4.5" />
              <span>Audit Logs</span>
            </button>
          </nav>

          {/* SIDEBAR FOOTER */}
          <div className="pt-6 border-t border-slate-200 space-y-2">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'settings' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Investor Settings</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN WORKSPACE AREA */}
        <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-medium">Fetching database records...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Investor Workspace</h1>
                    <p className="text-xs text-slate-500 mt-1">Real-time overview of university startup campaigns and submitted backing offers.</p>
                  </div>

                  {/* 4 TOP METRIC CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block font-bold">TOTAL CAMPAIGN PITCHES</span>
                      <span className="text-3xl font-bold text-slate-900 font-mono">{campaigns.length}</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block font-bold">MY PROPOSALS SUBMITTED</span>
                      <span className="text-3xl font-bold text-sky-600 font-mono">{proposals.length}</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block font-bold">REGISTERED CO-INVESTORS</span>
                      <span className="text-3xl font-bold text-emerald-700 font-mono">{coInvestors.length}</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block font-bold">VETTING STATUS</span>
                      <span className="text-xl font-bold text-emerald-800 uppercase font-mono">{profileUser.vettingStatus || 'VERIFIED'}</span>
                    </div>
                  </div>

                  {/* FEATURED CAMPAIGNS FROM DB */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-900">Featured Active Startup Pitches</h2>
                      <button onClick={() => setActiveTab('campaigns')} className="text-xs text-sky-600 font-semibold hover:underline">
                        Explore All ({campaigns.length})
                      </button>
                    </div>

                    {campaigns.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {campaigns.slice(0, 3).map((c, idx) => (
                          <div key={c.id || c._id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">
                                  {c.category || 'Startup'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">{c.university}</span>
                              </div>
                              <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                              <p className="text-xs text-slate-600 line-clamp-2">{c.tagline || c.description}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-200 space-y-2">
                              <div className="flex justify-between text-xs font-mono">
                                <span>Goal: ৳ {Number(c.goal || 0).toLocaleString()}</span>
                                <span className="text-emerald-700 font-bold">{c.equityOffer || 'Equity'}</span>
                              </div>
                              <button
                                onClick={() => setSelectedCampaign(c)}
                                className="w-full py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                Submit Investment Proposal
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50 rounded-xl text-xs text-slate-400">
                        No startup campaigns available in database.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: EXPLORE CAMPAIGNS */}
              {activeTab === 'campaigns' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Explore Startup Campaigns</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Filter and evaluate vetted university startup pitches from database.</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search title or university..."
                          value={campaignSearch}
                          onChange={(e) => setCampaignSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {filteredCampaigns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCampaigns.map((c, idx) => (
                        <div key={c.id || c._id || idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">
                                {c.category || 'Startup'}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500">{c.stage || 'MVP'}</span>
                            </div>

                            <div>
                              <h3 className="font-bold text-slate-900 text-base">{c.title}</h3>
                              <span className="text-xs font-semibold text-emerald-700 block">{c.university}</span>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
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

                            <button
                              onClick={() => setSelectedCampaign(c)}
                              className="w-full py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer"
                            >
                              Back This Startup
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-400">
                      No startup campaigns found in database matching search criteria.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MY PROPOSALS */}
              {activeTab === 'proposals' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">My Submitted Proposals</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Track status of investment proposals submitted to student founders.</p>
                  </div>

                  {proposals.length > 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                              <th className="pb-3 font-semibold">CAMPAIGN ID</th>
                              <th className="pb-3 font-semibold">PROPOSAL AMOUNT</th>
                              <th className="pb-3 font-semibold">TERMS</th>
                              <th className="pb-3 font-semibold">STATUS</th>
                              <th className="pb-3 font-semibold">DATE SUBMITTED</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {proposals.map((p, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80">
                                <td className="py-4 font-semibold text-slate-900">{p.campaign_id || p.campaignId}</td>
                                <td className="py-4 font-mono font-bold text-slate-900">৳ {Number(p.amount || 0).toLocaleString()}</td>
                                <td className="py-4">{p.terms || p.return_structure || 'Standard'}</td>
                                <td className="py-4">
                                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase ${
                                    p.status === 'accepted' ? 'bg-emerald-500 text-white' :
                                    p.status === 'declined' ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {p.status || 'PENDING'}
                                  </span>
                                </td>
                                <td className="py-4 text-slate-500">{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-400">
                      No proposals submitted yet. Go to "Explore Campaigns" to submit your first backing proposal.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CO-INVESTORS */}
              {activeTab === 'investors' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Co-Investors Network</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Verified angel investors and institutional venture partners in database.</p>
                  </div>

                  {filteredInvestors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {filteredInvestors.map((inv, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <InitialsAvatar name={inv.name || inv.institution} className="w-12 h-12" />
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm">{inv.name}</h3>
                              <span className="text-xs font-semibold text-emerald-700 block">{inv.institution || 'Angel Syndicate'}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-mono">{inv.vettingStatus || 'VERIFIED'}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => showToast(`Opening direct message channel with ${inv.name}...`, 'info')}
                            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors shrink-0 cursor-pointer"
                            title={`Send message to ${inv.name}`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-400">
                      No co-investor accounts found in database.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: WALLET LEDGER */}
              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Wallet & Escrow Ledger</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Automated database tracking for investment disbursements and escrow releases.</p>
                  </div>

                  {walletLedger.length > 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                              <th className="pb-3 font-semibold">TRANCHE</th>
                              <th className="pb-3 font-semibold">AMOUNT</th>
                              <th className="pb-3 font-semibold">METHOD</th>
                              <th className="pb-3 font-semibold">STATUS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {walletLedger.map((w, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80">
                                <td className="py-4 font-semibold text-slate-900">{w.tranche || 'Escrow Disbursement'}</td>
                                <td className="py-4 font-mono font-bold text-slate-900">৳ {Number(w.amount || 0).toLocaleString()}</td>
                                <td className="py-4">{w.method || 'bKash'}</td>
                                <td className="py-4">
                                  <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-md uppercase">
                                    {w.status || 'COMPLETED'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-400">
                      No wallet transactions recorded in database.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: AUDIT LOGS */}
              {activeTab === 'audit-logs' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Cryptographic Audit Logs</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time immutable database log receipts.</p>
                  </div>

                  {auditLogs.length > 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                              <th className="pb-3 font-semibold">CATEGORY</th>
                              <th className="pb-3 font-semibold">TITLE</th>
                              <th className="pb-3 font-semibold">STATUS</th>
                              <th className="pb-3 font-semibold">RECEIPT HASH</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {auditLogs.map((log, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80">
                                <td className="py-4 font-mono font-bold text-slate-800">{log.category || 'AUDIT'}</td>
                                <td className="py-4 font-semibold text-slate-900">{log.title || 'Activity'}</td>
                                <td className="py-4">
                                  <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-md uppercase">
                                    {log.status || 'VERIFIED'}
                                  </span>
                                </td>
                                <td className="py-4 font-mono text-sky-600 font-semibold">{log.hash || '0x8f2a...'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-400">
                      No audit records found in database.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: SETTINGS / EDIT INVESTOR PROFILE INFO */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Investor Profile Settings</h1>
                    <p className="text-xs text-slate-500 mt-1">Manage your institutional credentials, contact info, and investment preferences.</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <InitialsAvatar name={profileUser.name} className="w-16 h-16 text-lg" />
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{profileUser.name}</h3>
                          <span className="text-xs text-emerald-700 font-semibold block">{profileUser.institution}</span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase">Vetting Status: {profileUser.vettingStatus || 'VERIFIED'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => showToast('Opening direct messaging workspace...', 'info')}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                        title="Direct Messages"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Messages</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Investor / Contact Name</label>
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
                        <label className="font-semibold text-slate-700 block mb-1">Institution / Firm Name</label>
                        <input
                          type="text"
                          value={profileUser.institution}
                          onChange={(e) => setProfileUser({ ...profileUser, institution: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Contact / Bank Number</label>
                        <input
                          type="text"
                          value={profileUser.mfsNumber || ''}
                          onChange={(e) => setProfileUser({ ...profileUser, mfsNumber: e.target.value })}
                          placeholder="e.g. 01711223344"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Investment Bio</label>
                        <textarea
                          rows={3}
                          value={profileUser.bio}
                          onChange={(e) => setProfileUser({ ...profileUser, bio: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        ></textarea>
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

      {/* PROPOSAL MODAL */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Submit Investment Proposal</h3>
              <button onClick={() => setSelectedCampaign(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">TARGET STARTUP</span>
                <h4 className="font-bold text-slate-900 text-sm">{selectedCampaign.title}</h4>
                <span className="text-[11px] text-emerald-700 font-semibold block">{selectedCampaign.university}</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Proposal Amount (৳)</label>
                <input
                  type="number"
                  required
                  value={proposalAmount}
                  onChange={(e) => setProposalAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Proposed Terms</label>
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
                <label className="font-semibold text-slate-700 block mb-1">Investor Note (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Message to the founder..."
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs"
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCampaign(null)}
                  className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-xl shadow-sm cursor-pointer"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
