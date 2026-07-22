import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Rocket,
  Wallet,
  CheckCircle2,
  Users,
  History,
  Settings,
  HelpCircle,
  Bell,
  MessageSquare,
  Search,
  Filter,
  Download,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Lock,
  Clock,
  Printer,
  Maximize2,
  FileText,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Camera,
  ArrowUpRight,
  TrendingUp,
  Building2,
  Landmark,
  CheckSquare,
  Square,
  LogOut,
  Mail,
  Link as LinkIcon
} from 'lucide-react';

import logoUrl from '../assets/images/FundBridge Logo.svg';

export default function InvestorDashboard({ currentUser, onLogout, API_BASE_URL, triggerAlert }) {
  // Navigation active tab: 'overview' | 'campaigns' | 'wallet' | 'milestones' | 'investors' | 'audit-logs' | 'profile-setup'
  const [activeTab, setActiveTab] = useState('overview');

  // Backend state
  const [campaigns, setCampaigns] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state for Campaigns
  const [campaignSearch, setCampaignSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Selected Campaign Modal
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [proposalAmount, setProposalAmount] = useState('500000');
  const [proposalTerms, setProposalTerms] = useState('10% Equity Share');

  // Milestones State (Alpha-V Bio-Refinery evidence pack & release control)
  const [milestoneChecks, setMilestoneChecks] = useState({
    vendorInvoice: true,
    geotaggedPhoto: true,
    inspectorAttestation: false
  });
  const [trancheReleased, setTrancheReleased] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);

  // Co-Investors search & filters
  const [investorSearch, setInvestorSearch] = useState('');
  const [almaMaterFilter, setAlmaMaterFilter] = useState('all');
  const [dialogueModalUser, setDialogueModalUser] = useState(null);
  const [dialogueMessage, setDialogueMessage] = useState('');

  // Audit Logs search & filters
  const [auditSearch, setAuditSearch] = useState('');

  // Receipt Modal in Wallet
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Profile Setup State
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || 'Javeria Doe',
    affiliation: currentUser?.institution || 'Alumni Backer - BUET',
    bio: 'Focused on deep-tech and sustainable infrastructure startups in Southeast Asia. 10+ years experience in institutional equity.',
    ticketSize: 1250000,
    sectors: ['Fintech', 'Edtech'],
    twoFactor: true
  });

  // Notification Toast
  const [notificationCount, setNotificationCount] = useState(2);

  // Load Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const campRes = await fetch(`${API_BASE_URL}/api/campaigns`);
      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaigns(campData);
      }

      if (currentUser?.id) {
        const propRes = await fetch(`${API_BASE_URL}/api/proposals/investor/${currentUser.id}`);
        if (propRes.ok) {
          const propData = await propRes.json();
          setProposals(propData);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
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
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${selectedCampaign.id}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorId: currentUser.id || 'usr_investor_1',
          amount: Number(proposalAmount),
          terms: proposalTerms
        })
      });

      if (res.ok) {
        triggerAlert ? triggerAlert('Investment proposal submitted successfully!') : alert('Proposal submitted!');
        setSelectedCampaign(null);
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to submit proposal');
      }
    } catch (err) {
      alert('Error submitting proposal');
    }
  };

  // Co-Investors Dataset
  const initialInvestors = [
    { id: 1, name: 'Adrian Thorne', title: 'Thorne Capital Partners', almaMater: 'Stanford University', sectors: ['Fintech', 'Proptech'], tier: 'Tier 1' },
    { id: 2, name: 'Elena Rodriguez', title: 'Rodriguez Institutional Angels', almaMater: 'Harvard Business School', sectors: ['Edtech', 'Healthtech'], tier: 'Tier 1' },
    { id: 3, name: 'Marcus Chen', title: 'Global Alumni Syndicate', almaMater: 'MIT', sectors: ['Deep Tech', 'Green Tech'], tier: 'Tier 2' },
    { id: 4, name: 'Sarah Jenkins', title: 'Emerald Growth Fund', almaMater: 'Oxford University', sectors: ['SaaS', 'Insurtech'], tier: 'Tier 1' },
    { id: 5, name: 'Dr. Tariqul Islam', title: 'Dhaka Angel Network', almaMater: 'BUET', sectors: ['CleanTech', 'IoT'], tier: 'Tier 1' }
  ];

  // Audit Logs Dataset
  const initialAuditLogs = [
    { timestamp: '2024-05-24 14:22:09', type: 'Equity Transfer Finalized', desc: 'Series B Round: GreenScale', partyType: 'ADMIN', partyName: 'System', partyNote: 'TO: Sequoia Alpha Fund', hash: '0x7d2e...f8a1...92b4...c031', color: 'blue' },
    { timestamp: '2024-05-24 13:05:41', type: 'Milestone Verified', desc: 'Smart Contract Execution #449', partyType: 'ORACLE', partyName: 'IoT-Verda', partyNote: 'OBJ: VerdaStack Milestone 3', hash: '0xac91...33e2...98f4...e112', color: 'green' },
    { timestamp: '2024-05-24 11:58:33', type: 'Access Policy Updated', desc: 'Compliance Level: High-Security', partyType: 'USER', partyName: 'J. Chen (CTO)', partyNote: 'SCOPE: Global IAM', hash: '0xb821...66d9...4a10...9ef9', color: 'green' },
    { timestamp: '2024-05-24 09:12:15', type: 'Capital Call Initiated', desc: '$5M Tranche Dispatch', partyType: 'TREASURY', partyName: 'Wallet_01', partyNote: 'DEST: NeuraLinker OpEx', hash: '0x44d1...ee88...1210...ff3a', color: 'blue' },
    { timestamp: '2024-05-24 08:45:00', type: 'Suspicious Login Blocked', desc: 'Anomaly detected in IP routing', partyType: 'FIREWALL', partyName: 'Node-B', partyNote: 'SRC: 192.168.1.104', hash: '0xf2c4...aa31...bb90...d442', color: 'red' }
  ];

  // Wallet Ledger Dataset
  const distributionLedger = [
    { entity: 'CampusBites', merchantId: 'CB-901', amount: '৳ 12,000', purpose: 'Monthly Revenue-Share Distribution', status: 'Success', gateway: 'via bKash' },
    { entity: 'Dacca Tech', merchantId: 'DT-442', amount: '৳ 18,500', purpose: 'Milestone Release Refund', status: 'Success', gateway: 'via Nagad' },
    { entity: 'SolarGrid AI', merchantId: 'SG-110', amount: '৳ 45,000', purpose: 'Escrow Tranche Release', status: 'Success', gateway: 'via bKash' }
  ];

  // Export Ledger CSV helper
  const handleExportLedger = () => {
    const csvContent = "data:text/csv;charset=utf-8,Timestamp,Activity,Parties,Hash\n" +
      initialAuditLogs.map(e => `"${e.timestamp}","${e.type} - ${e.desc}","${e.partyName}","${e.hash}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FundBridge_Audit_Ledger.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Header Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="FundBridge Logo" className="h-7 w-auto" />
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setNotificationCount(0)}
            className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          <button 
            onClick={() => alert('Messaging module initialized for active deal rooms.')}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Chat & Communications"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <div 
            onClick={() => setActiveTab('profile-setup')}
            className="flex items-center gap-3 pl-2 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-medium flex items-center justify-center text-sm shadow-xs ring-2 ring-emerald-600/20 group-hover:ring-emerald-600 transition-all overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" 
                alt="Investor Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Workspace */}
      <div className="flex-1 flex min-h-[calc(100vh-4rem)]">
        
        {/* Sidebar Nav */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between flex-shrink-0 z-20">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Rocket className="w-4 h-4" />
              <span>Campaigns</span>
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'wallet'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Wallet</span>
            </button>

            <button
              onClick={() => setActiveTab('milestones')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'milestones'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Milestones</span>
            </button>

            <button
              onClick={() => setActiveTab('investors')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'investors'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Investors</span>
            </button>

            <button
              onClick={() => setActiveTab('audit-logs')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'audit-logs'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Logs</span>
            </button>
          </div>

          {/* Bottom Sidebar Controls */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <button
              onClick={() => setActiveTab('campaigns')}
              className="w-full bg-[#2D6A4F] hover:bg-[#23533E] text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Invest Now</span>
            </button>

            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('profile-setup')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'profile-setup' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => alert('Support Desk: Contact support@fundbridge.com for institutional concierge.')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Support</span>
              </button>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50 transition-all cursor-pointer mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-8">
          
          {/* ========================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>

              {/* 3 Top Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Dark Card */}
                <div className="bg-[#0F172A] text-white p-6 rounded-2xl shadow-md flex flex-col justify-between space-y-4">
                  <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
                    TOTAL CAPITAL ACTIVE IN ESCROW
                  </span>
                  <div className="space-y-1">
                    <span className="text-3xl font-bold font-mono tracking-tight text-white">
                      ৳ 1,25,00,000
                    </span>
                    <p className="text-xs text-emerald-400 font-mono pt-2">
                      Overall portfolio milestone release rate: 98.4%
                    </p>
                  </div>
                </div>

                {/* White Card 2 */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
                  <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase font-semibold">
                    TOTAL RETURNS RECEIVED
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold font-mono tracking-tight text-slate-900">
                        ৳ 24,50,000
                      </span>
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        +12%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 pt-2">
                      Growth from previous quarter
                    </p>
                  </div>
                </div>

                {/* White Card 3 */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
                  <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase font-semibold">
                    ACTIVE OFFERS PENDING STARTUP APPROVAL
                  </span>
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-bold font-mono text-slate-900">3</span>
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center border-2 border-white">CB</div>
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center border-2 border-white">ST</div>
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center border-2 border-white">+1</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* My Funded Ventures Table Card */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">My Funded Ventures</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/80 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Startup Name</th>
                        <th className="px-6 py-4">University</th>
                        <th className="px-6 py-4">Active Milestones Completed</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">
                            CB
                          </div>
                          <span>CampusBites</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">BRAC University</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-36 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div className="bg-emerald-700 h-2 rounded-full" style={{ width: '66%' }}></div>
                            </div>
                            <span className="text-xs font-medium text-slate-700">2 of 3 Completed</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setActiveTab('milestones')}
                            className="border border-slate-300 text-slate-700 hover:bg-slate-100 px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                          >
                            View Logs
                          </button>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center border border-blue-200">
                            DT
                          </div>
                          <span>Dacca Tech</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">BUET</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-36 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                            </div>
                            <span className="text-xs font-medium text-slate-700">1 of 4 Completed</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setActiveTab('milestones')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer"
                          >
                            View Logs
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom 2 Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Portfolio Geography */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Portfolio Geography</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Investment distribution by university hubs.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">Dhaka Region</span>
                        <span className="text-slate-900 font-mono">62%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '62%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">Chittagong Hub</span>
                        <span className="text-slate-900 font-mono">24%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-emerald-700 h-2.5 rounded-full" style={{ width: '24%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Milestone Trends */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Milestone Trends</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Aggregate success rate across portfolio</p>
                  </div>

                  <div className="h-32 flex items-end justify-between gap-3 pt-4 border-b border-slate-100">
                    <div className="w-full bg-blue-100 rounded-t-lg h-[40%]" title="Month 1" />
                    <div className="w-full bg-blue-100 rounded-t-lg h-[55%]" title="Month 2" />
                    <div className="w-full bg-blue-100 rounded-t-lg h-[50%]" title="Month 3" />
                    <div className="w-full bg-blue-200 rounded-t-lg h-[75%]" title="Month 4" />
                    <div className="w-full bg-blue-200 rounded-t-lg h-[65%]" title="Month 5" />
                    <div className="w-full bg-emerald-800 rounded-t-lg h-[95%]" title="Month 6" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: CAMPAIGNS (Discover Innovations) */}
          {/* ========================================== */}
          {activeTab === 'campaigns' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Discover Innovations</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Connect with the next generation of campus-born startups from Bangladesh's premier institutions.
                </p>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Campaign Card 1 */}
                <div 
                  onClick={() => setSelectedCampaign({
                    id: 'solartrace',
                    title: 'SolarTrace AI',
                    university: 'BUET',
                    category: 'RENEWABLE ENERGY',
                    raised: '45.2L',
                    goal: '1Cr',
                    pct: 45,
                    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600'
                  })}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 bg-slate-800 overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600" 
                        alt="SolarTrace AI" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      />
                      <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase">
                        RENEWABLE ENERGY
                      </span>
                    </div>
                    <div className="p-6 space-y-2">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        SolarTrace AI
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">BUET</p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 space-y-3">
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline text-xs font-mono">
                      <span className="text-slate-500 uppercase font-semibold">RAISED</span>
                      <span className="text-slate-900 font-bold">
                        ৳ <strong className="text-blue-600 font-bold text-sm">45.2L</strong> / ৳ 1Cr
                      </span>
                      <span className="text-slate-600 font-bold">{45}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-900 h-2 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                </div>

                {/* Campaign Card 2 */}
                <div 
                  onClick={() => setSelectedCampaign({
                    id: 'mediship',
                    title: 'MediShip Logistics',
                    university: 'Dhaka University',
                    category: 'LOGISTICS',
                    raised: '82.0L',
                    goal: '90L',
                    pct: 91,
                    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600'
                  })}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 bg-slate-800 overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600" 
                        alt="MediShip Logistics" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      />
                      <span className="absolute top-3 left-3 bg-sky-700 text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase">
                        LOGISTICS
                      </span>
                    </div>
                    <div className="p-6 space-y-2">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        MediShip Logistics
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">Dhaka University</p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 space-y-3">
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline text-xs font-mono">
                      <span className="text-slate-500 uppercase font-semibold">RAISED</span>
                      <span className="text-slate-900 font-bold">
                        ৳ <strong className="text-blue-600 font-bold text-sm">82.0L</strong> / ৳ 90L
                      </span>
                      <span className="text-slate-600 font-bold">91%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-slate-950 h-2 rounded-full" style={{ width: '91%' }} />
                    </div>
                  </div>
                </div>

                {/* Campaign Card 3 */}
                <div 
                  onClick={() => setSelectedCampaign({
                    id: 'microgrow',
                    title: 'MicroGrow Agri',
                    university: 'BRAC University',
                    category: 'AGRI-TECH',
                    raised: '12.5L',
                    goal: '50L',
                    pct: 25,
                    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600'
                  })}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 bg-slate-800 overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600" 
                        alt="MicroGrow Agri" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      />
                      <span className="absolute top-3 left-3 bg-blue-800 text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase">
                        AGRI-TECH
                      </span>
                    </div>
                    <div className="p-6 space-y-2">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        MicroGrow Agri
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">BRAC University</p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 space-y-3">
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline text-xs font-mono">
                      <span className="text-slate-500 uppercase font-semibold">RAISED</span>
                      <span className="text-slate-900 font-bold">
                        ৳ <strong className="text-blue-600 font-bold text-sm">12.5L</strong> / ৳ 50L
                      </span>
                      <span className="text-slate-600 font-bold">25%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-900 h-2 rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: WALLET */}
          {/* ========================================== */}
          {activeTab === 'wallet' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Wallet</h1>

              {/* 3 Top Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* bKash Log Card */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase font-semibold">
                      BKASH LOG
                    </span>
                    <span className="w-6 h-6 rounded-full bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center">
                      bK
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Inward</span>
                      <span className="text-emerald-700 font-bold">৳ 25,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Settled Today</span>
                      <span className="text-slate-900 font-bold">৳ 4,10,000</span>
                    </div>
                  </div>
                </div>

                {/* Direct Cash Holdings (Vibrant Blue Card) */}
                <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white p-6 rounded-2xl shadow-md flex flex-col items-center justify-center text-center space-y-4">
                  <span className="text-[11px] font-mono tracking-wider text-blue-200 uppercase font-semibold">
                    DIRECT CASH HOLDINGS
                  </span>
                  <span className="text-4xl font-bold font-mono tracking-tight">
                    ৳ 4,82,500
                  </span>
                  <span className="bg-blue-950/60 border border-blue-400/30 text-blue-100 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                    <span>Institutional Vault Secured</span>
                  </span>
                </div>

                {/* Nagad Log Card */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase font-semibold">
                      NAGAD LOG
                    </span>
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-[10px] flex items-center justify-center">
                      N
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Inward</span>
                      <span className="text-emerald-700 font-bold">৳ 1,50,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pending Settlements</span>
                      <span className="text-rose-600 font-bold">৳ 12,450</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automated Distribution Ledger */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Automated Distribution Ledger</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time tracking of institutional disbursements.</p>
                  </div>
                  <button 
                    onClick={handleExportLedger}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Report</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">ENTITY</th>
                        <th className="px-4 py-3">AMOUNT</th>
                        <th className="px-4 py-3">PURPOSE</th>
                        <th className="px-4 py-3">STATUS & GATEWAY</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {distributionLedger.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-4 font-semibold text-slate-900">
                            <div>{row.entity}</div>
                            <span className="text-[10px] text-slate-400 font-mono">Merchant ID: {row.merchantId}</span>
                          </td>
                          <td className="px-4 py-4 font-mono font-bold text-slate-900">{row.amount}</td>
                          <td className="px-4 py-4 text-xs text-slate-600">{row.purpose}</td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              {row.status} <span className="text-[10px] text-emerald-700 font-normal">({row.gateway})</span>
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => setSelectedReceipt(row)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer underline"
                            >
                              Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs text-slate-500 font-medium border-t border-slate-100">
                  <span>Showing latest distributions</span>
                  <button className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                    <span>View Historical Records</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* Bottom 2 Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Compliance & Audits */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-bold text-slate-900">Compliance & Audits</h3>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 bg-slate-50 rounded-xl flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-800">Q4 Tax Compliance</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                        PENDING REVIEW
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-800">Annual Audit Report 2023</span>
                      <span className="bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                        VERIFIED
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Mint Green Banner */}
                <div className="bg-emerald-100/70 border border-emerald-200 p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-emerald-900">Immutable Security</h3>
                    <p className="text-xs text-emerald-800 mt-1">
                      All distributions are cryptographically signed and stored in a multi-sig vault.
                    </p>
                  </div>

                  <a 
                    href="#security-protocol" 
                    onClick={(e) => { e.preventDefault(); alert('Security Protocol: 256-bit AES Multi-sig Vault active.'); }}
                    className="text-xs font-bold text-emerald-900 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Security Protocol</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 4: MILESTONES (Alpha-V Bio-Refinery) */}
          {/* ========================================== */}
          {activeTab === 'milestones' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Alpha-V Bio-Refinery</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Series A Roadmap • $2.4M Aggregate</p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => alert('Contract: Series A Preferred Share Subscription Agreement v4.2')}
                    className="border border-slate-300 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    View Contract
                  </button>
                  <button 
                    onClick={() => alert('Audit Scheduled: Field inspector queued for site verification.')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    Schedule Audit
                  </button>
                </div>
              </div>

              {/* Phase Progress Timeline */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
                  <div className="absolute top-1/2 left-0 w-1/3 h-1 bg-emerald-700 -translate-y-1/2 z-0" />

                  {/* Phase 1 */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wider">PHASE 1</span>
                  </div>

                  {/* Phase 2 */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-blue-100">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase font-mono tracking-wider">PHASE 2</span>
                  </div>

                  {/* Phase 3 */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">PHASE 3</span>
                  </div>

                  {/* Exit */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">EXIT</span>
                  </div>
                </div>
              </div>

              {/* Main 2-Column Split Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Panel (7 cols): ACTIVE EVIDENCE PACK */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                      ACTIVE EVIDENCE PACK
                    </span>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Maximize2 className="w-4 h-4 hover:text-slate-700 cursor-pointer" />
                      <Printer className="w-4 h-4 hover:text-slate-700 cursor-pointer" />
                    </div>
                  </div>

                  {/* Evidence Document Preview */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>BioCorp_Equipment_INV_8902.pdf</span>
                    </div>

                    <div className="p-6 bg-white space-y-6 font-sans">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                        <div>
                          <h4 className="text-base font-bold text-slate-900">BioCorp Global</h4>
                          <p className="text-xs text-slate-500">Supply Chain & Lab Solutions</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-400 block">INVOICE</span>
                          <span className="text-sm font-bold font-mono text-slate-900">#8902-X</span>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs font-sans">
                        <div className="flex justify-between py-2 border-b border-slate-50">
                          <span className="text-slate-700 font-medium">Lab Centrifuge Series-7</span>
                          <span className="font-mono font-bold text-slate-900">$125,000.00</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-50">
                          <span className="text-slate-700 font-medium">Bio-Reactor Unit (Module B)</span>
                          <span className="font-mono font-bold text-slate-900">$210,000.00</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-900 uppercase">TOTAL PAYABLE</span>
                        <span className="text-lg font-bold font-mono text-blue-600">$335,000.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel (5 cols): AUDIT INTELLIGENCE / Release Control */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">
                        AUDIT INTELLIGENCE
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-1">Release Control</h3>
                    </div>

                    {/* Request Amount Box */}
                    <div className="bg-blue-50/60 border border-blue-100 p-5 rounded-xl space-y-1">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                        REQUEST AMOUNT
                      </span>
                      <div className="text-3xl font-bold font-mono text-blue-900">$450,000.00</div>
                      <p className="text-[11px] text-slate-500 pt-1">
                        Tranche release for Phase 2: R&D Installation
                      </p>
                    </div>

                    {/* Mandatory Checks Checkboxes */}
                    <div className="space-y-3">
                      <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                        MANDATORY CHECKS
                      </span>

                      <div className="space-y-2">
                        <label 
                          onClick={() => setMilestoneChecks(prev => ({ ...prev, vendorInvoice: !prev.vendorInvoice }))}
                          className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors"
                        >
                          {milestoneChecks.vendorInvoice ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                          <span className="text-xs font-semibold text-slate-800">Vendor Invoice Reconciliation</span>
                        </label>

                        <label 
                          onClick={() => setMilestoneChecks(prev => ({ ...prev, geotaggedPhoto: !prev.geotaggedPhoto }))}
                          className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors"
                        >
                          {milestoneChecks.geotaggedPhoto ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                          <span className="text-xs font-semibold text-slate-800">Geotagged Photo Verification</span>
                        </label>

                        <label 
                          onClick={() => setMilestoneChecks(prev => ({ ...prev, inspectorAttestation: !prev.inspectorAttestation }))}
                          className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors"
                        >
                          {milestoneChecks.inspectorAttestation ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                          <span className="text-xs font-semibold text-slate-800">3rd Party Inspector Attestation</span>
                        </label>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-2">
                      <button
                        onClick={() => {
                          setTrancheReleased(true);
                          alert('✅ Tranche released! MFS escrow transfer dispatched to founder vault.');
                        }}
                        disabled={trancheReleased}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                          trancheReleased 
                            ? 'bg-emerald-900 text-white cursor-not-allowed'
                            : 'bg-[#2D6A4F] hover:bg-[#23533E] text-white'
                        }`}
                      >
                        {trancheReleased ? 'Tranche Released (MFS Dispatched)' : 'Approve & Release Tranche (MFS Transfer)'}
                      </button>

                      <button
                        onClick={() => setDisputeModalOpen(true)}
                        className="w-full border border-rose-300 hover:bg-rose-50 text-rose-600 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Flag for Dispute</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Authorized release of funds is legally binding. All transfers are processed through secured institutional MFS channels.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 5: INVESTORS (Co-Investor Discovery Canvas) */}
          {/* ========================================== */}
          {activeTab === 'investors' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Co-Investor Discovery Canvas</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Browse and connect with a curated network of university alumni backers, institutional angels, and high-net-worth strategic partners.
                </p>
              </div>

              {/* Filter Bar Box */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by name, university, or sector..."
                    value={investorSearch}
                    onChange={(e) => setInvestorSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex w-full md:w-auto gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={almaMaterFilter}
                      onChange={(e) => setAlmaMaterFilter(e.target.value)}
                      className="bg-transparent focus:outline-none font-medium cursor-pointer"
                    >
                      <option value="all">Alma Mater (All)</option>
                      <option value="Stanford">Stanford</option>
                      <option value="Harvard">Harvard</option>
                      <option value="MIT">MIT</option>
                      <option value="Oxford">Oxford</option>
                      <option value="BUET">BUET</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">INVESTOR NAME</th>
                        <th className="px-6 py-4">ALMA MATER</th>
                        <th className="px-6 py-4">VENTURE CATEGORIES BACKED</th>
                        <th className="px-6 py-4">TRUST RATING</th>
                        <th className="px-6 py-4 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {initialInvestors
                        .filter(inv => 
                          (inv.name.toLowerCase().includes(investorSearch.toLowerCase()) || inv.almaMater.toLowerCase().includes(investorSearch.toLowerCase())) &&
                          (almaMaterFilter === 'all' || inv.almaMater.includes(almaMaterFilter))
                        )
                        .map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center overflow-hidden border border-slate-300">
                                  {inv.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{inv.name}</div>
                                  <span className="text-[11px] text-slate-500 font-normal">{inv.title}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-700 font-medium">{inv.almaMater}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {inv.sectors.map(sec => (
                                  <span key={sec} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                    {sec}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                inv.tier === 'Tier 1' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {inv.tier}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setDialogueModalUser(inv)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-semibold font-mono cursor-pointer hover:underline"
                              >
                                Initiate Co-Investment Dialogue
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center text-xs font-mono text-slate-500">
                  <span>Showing 1-5 of 124 verified investors</span>
                  <div className="flex gap-1">
                    <button className="px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100">&lt;</button>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-md font-bold">1</button>
                    <button className="px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100">2</button>
                    <button className="px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100">3</button>
                    <button className="px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100">&gt;</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 6: AUDIT LOGS */}
          {/* ========================================== */}
          {activeTab === 'audit-logs' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transactional Hash Ledger</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Immutable record of all system-wide financial and administrative activities.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => alert('Ledger Filter: Displaying all signed events.')}
                    className="border border-slate-300 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter</span>
                  </button>
                  <button 
                    onClick={handleExportLedger}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Ledger</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">TIMESTAMP (UTC)</th>
                        <th className="px-6 py-4">ACTIVITY DESCRIPTION</th>
                        <th className="px-6 py-4">INVOLVED PARTIES</th>
                        <th className="px-6 py-4">CRYPTOGRAPHIC RECEIPT HASH</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs">
                      {initialAuditLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 text-slate-500">{log.timestamp}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-4 rounded-full ${
                                log.color === 'blue' ? 'bg-blue-600' : log.color === 'red' ? 'bg-rose-600' : 'bg-emerald-600'
                              }`} />
                              <div>
                                <div className="font-bold text-slate-900 font-sans text-xs">{log.type}</div>
                                <span className="text-[10px] text-slate-400 font-mono">{log.desc}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-blue-50 text-blue-900 font-bold px-2 py-0.5 rounded text-[10px]">
                              {log.partyType}: {log.partyName}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">{log.partyNote}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span 
                              onClick={() => { navigator.clipboard.writeText(log.hash); alert(`Copied hash: ${log.hash}`); }}
                              className="bg-slate-100 text-blue-700 hover:text-blue-900 font-mono text-[11px] px-2.5 py-1 rounded cursor-pointer border border-slate-200"
                              title="Click to copy hash"
                            >
                              {log.hash}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span>Showing 5 of 12,402 entries</span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-xs font-semibold">Previous</button>
                    <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-xs font-semibold">Next</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 7: PROFILE SETUP (Investor Configuration) */}
          {/* ========================================== */}
          {activeTab === 'profile-setup' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profile Setup</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Complete your institutional profile to unlock customized deals and priority access to high-performance seed rounds.
                </p>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Top Left: Identity & Credentials */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-900">Identity & Credentials</h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      ✓ PRO VERIFIED
                    </span>
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="relative">
                      <img 
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" 
                        alt="Profile" 
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                      />
                      <button className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-md hover:bg-blue-700">
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                          Full Legal Name
                        </label>
                        <input 
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                          Institutional Affiliation
                        </label>
                        <select 
                          value={profileData.affiliation}
                          onChange={(e) => setProfileData(prev => ({ ...prev, affiliation: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option>Alumni Backer - BUET</option>
                          <option>Alumni Backer - BRAC</option>
                          <option>Venture Capitalist</option>
                          <option>Angel Investor</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                      Investment Thesis (Short Bio)
                    </label>
                    <textarea 
                      rows={3}
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Top Right: Compliance */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-lg font-bold text-slate-900">Compliance</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3.5 bg-slate-50 rounded-xl flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-800">NID Verified</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                          COMPLETED
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-800">KYC / AML</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                          VALID 2025
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-2">
                        LINKED CHANNELS
                      </span>
                      <div className="flex gap-3">
                        <span className="bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-pink-600" /> bKash
                        </span>
                        <span className="bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-orange-600" /> Nagad
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => alert('Re-verification request queued with admin compliance team.')}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                  >
                    Re-verify Credentials
                  </button>
                </div>

                {/* Bottom Left: Investment Preferences */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                    Investment Preferences
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-2">
                        TARGET SECTORS
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Fintech', 'Edtech', 'Agritech', 'Healthtech', 'CleanTech'].map(sec => (
                          <button
                            key={sec}
                            onClick={() => {
                              setProfileData(prev => ({
                                ...prev,
                                sectors: prev.sectors.includes(sec)
                                  ? prev.sectors.filter(s => s !== sec)
                                  : [...prev.sectors, sec]
                              }));
                            }}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              profileData.sectors.includes(sec)
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {sec}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                        TICKET SIZE (PREFERRED)
                      </label>
                      <input 
                        type="range"
                        min="100000"
                        max="5000000"
                        step="50000"
                        value={profileData.ticketSize}
                        onChange={(e) => setProfileData(prev => ({ ...prev, ticketSize: Number(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-xs font-mono text-slate-600 font-bold">
                        <span>৳ 100,000</span>
                        <span className="text-blue-600 font-bold">Selected: ৳ {profileData.ticketSize.toLocaleString()}</span>
                        <span>৳ 5,000,000+</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Right: Security & Access */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                    Security & Access
                  </h3>

                  <div className="space-y-3">
                    <div 
                      onClick={() => alert('Passkey Management: Biometric WebAuthn active.')}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl flex justify-between items-center cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">Passkey Management</div>
                        <span className="text-[10px] text-slate-500">Biometric login for faster sessions</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Two-Factor Authentication</div>
                        <span className="text-[10px] text-slate-500">SMS and Authenticator App active</span>
                      </div>
                      <button
                        onClick={() => setProfileData(prev => ({ ...prev, twoFactor: !prev.twoFactor }))}
                        className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                          profileData.twoFactor ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                          profileData.twoFactor ? 'left-5' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    <div 
                      onClick={() => alert('Session History: IP 103.205.132.18 (Dhaka, BD) active.')}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl flex justify-between items-center cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">Session History</div>
                        <span className="text-[10px] text-slate-500">Last active: 2 mins ago (Dhaka, BD)</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bottom Bar */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setActiveTab('overview')}
                  className="px-6 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  onClick={() => {
                    triggerAlert ? triggerAlert('Profile configuration deployed successfully!') : alert('Profile saved!');
                    setActiveTab('overview');
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Save & Deploy Profile
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Campaign Details & Proposal Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative border border-slate-200">
            <button 
              onClick={() => setSelectedCampaign(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold font-mono text-blue-600 uppercase tracking-wider">
                {selectedCampaign.category}
              </span>
              <h2 className="text-xl font-bold text-slate-900">{selectedCampaign.title}</h2>
              <p className="text-xs text-slate-500 font-medium">{selectedCampaign.university}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Goal</span>
                <span className="text-slate-900 font-bold">৳ {selectedCampaign.goal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Currently Raised</span>
                <span className="text-emerald-700 font-bold">৳ {selectedCampaign.raised}</span>
              </div>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Commit Funding Amount (BDT ৳)
                </label>
                <input
                  type="number"
                  value={proposalAmount}
                  onChange={(e) => setProposalAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Equity / Revenue Share Offer Terms
                </label>
                <input
                  type="text"
                  value={proposalTerms}
                  onChange={(e) => setProposalTerms(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#2D6A4F] hover:bg-[#23533E] text-white py-3 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Submit Investment Proposal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Co-Investment Dialogue Modal */}
      {dialogueModalUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 relative border border-slate-200">
            <button 
              onClick={() => setDialogueModalUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold font-mono text-blue-600 uppercase tracking-wider">
                CO-INVESTMENT DIALOGUE
              </span>
              <h2 className="text-lg font-bold text-slate-900">Initiate Dialogue with {dialogueModalUser.name}</h2>
              <p className="text-xs text-slate-500">{dialogueModalUser.title} • {dialogueModalUser.almaMater}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Message / Deal Room Note
              </label>
              <textarea
                rows={4}
                placeholder="Enter syndicate proposal terms or co-investment inquiry..."
                value={dialogueMessage}
                onChange={(e) => setDialogueMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              onClick={() => {
                alert(`Dialogue request dispatched to ${dialogueModalUser.name}!`);
                setDialogueModalUser(null);
                setDialogueMessage('');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              Send Dialogue Request
            </button>
          </div>
        </div>
      )}

      {/* Flag Dispute Modal */}
      {disputeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 relative border border-slate-200">
            <button 
              onClick={() => setDisputeModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold font-mono text-rose-600 uppercase tracking-wider">
                FLAG DISPUTE
              </span>
              <h2 className="text-lg font-bold text-slate-900">Flag Milestone Tranche for Audit Review</h2>
              <p className="text-xs text-slate-500">Hold funds in institutional escrow pending admin review.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Reason for Audit Freeze
              </label>
              <textarea
                rows={3}
                placeholder="Specify compliance discrepancy or missing evidence item..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <button
              onClick={() => {
                alert('⚠️ Milestone flagged for dispute. Admin audit committee notified.');
                setDisputeModalOpen(false);
              }}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              Confirm Dispute Flag
            </button>
          </div>
        </div>
      )}

      {/* View Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 relative border border-slate-200">
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold font-mono text-emerald-600 uppercase tracking-wider">
                RECEIPT VERIFICATION
              </span>
              <h2 className="text-lg font-bold text-slate-900">{selectedReceipt.entity}</h2>
              <p className="text-xs text-slate-500">Merchant ID: {selectedReceipt.merchantId}</p>
            </div>

            <div className="space-y-2 text-xs font-mono bg-slate-50 p-4 rounded-xl">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="text-slate-900 font-bold">{selectedReceipt.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purpose</span>
                <span className="text-slate-900">{selectedReceipt.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway</span>
                <span className="text-emerald-700 font-bold">{selectedReceipt.gateway}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Status</span>
                <span className="text-emerald-700 font-bold">VERIFIED</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* Institutional Footer */}
      <footer className="bg-slate-950 text-white border-t border-slate-800 py-12 px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold tracking-tight">FundBridge</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering the next generation of Bangladesh's academic entrepreneurs through institutional grade venture capital solutions.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">PLATFORM</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><button onClick={() => setActiveTab('overview')} className="hover:text-white transition-colors cursor-pointer">Dashboard</button></li>
              <li><button onClick={() => setActiveTab('campaigns')} className="hover:text-white transition-colors cursor-pointer">Investment Portfolio</button></li>
              <li><button onClick={() => setActiveTab('investors')} className="hover:text-white transition-colors cursor-pointer">Founder Network</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">LEGAL</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><a href="#privacy" onClick={(e) => { e.preventDefault(); alert('Privacy Policy: Strict institutional data isolation active.'); }} className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" onClick={(e) => { e.preventDefault(); alert('Terms of Service: Standard VC Shareholder Terms.'); }} className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#security" onClick={(e) => { e.preventDefault(); alert('Security Handbook: Multi-sig Escrow Protocol active.'); }} className="hover:text-white transition-colors">Security Handbook</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">CONNECT</h4>
            <div className="flex gap-3">
              <a href="mailto:investor@fundbridge.com" className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
              </a>
              <a href="https://fundbridge.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                <LinkIcon className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[10px] text-slate-500 pt-2">
              © 2024 FundBridge Pvt. Ltd. Dhaka, Bangladesh
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
