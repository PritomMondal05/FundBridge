import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Building,
  Users,
  Wallet,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Upload,
  ArrowUpRight,
  Lock,
  Clock,
  Plus,
  Search,
  Download,
  Sparkles,
  DollarSign,
  Check,
  X,
  ChevronRight,
  PieChart,
  HelpCircle,
  LogOut,
  Award,
  Activity,
  FileCode,
  AlertCircle,
  Eye,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

import logoBlackUrl from '../assets/images/FundBridge Logo Black.svg';

export default function FounderDashboard({ currentUser, onLogout, API_BASE_URL, triggerAlert }) {
  const user = currentUser || {
    id: 'demo-founder',
    name: 'Anika Rahman',
    email: 'anika@brac.edu.bd',
    university: 'BRAC University',
    vettingStatus: 'verified',
    mfsNumber: '01711223344'
  };

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'campaign' | 'investors' | 'wallet' | 'milestones' | 'audit'

  // Data state
  const [campaigns, setCampaigns] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // My Campaign Form State
  const [campaignForm, setCampaignForm] = useState({
    title: 'EcoThread Bangladesh',
    university: user.university || 'BRAC University',
    tagline: 'Upcycled Sustainable Jute & Textile Wear for Global Export',
    coverPhoto: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=60',
    pitchVideoUrl: 'https://youtube.com/watch?v=demo-ecothread',
    goal: 500000,
    durationDays: 60,
    equityOffer: '7.5% Equity Share',
    description: 'EcoThread transforms discarded textile cuttings and organic Bangladesh jute into high-end fashion wear for urban youth. Supported by BRAC FabLab.'
  });

  // AI Assistant State
  const [aiNoteInput, setAiNoteInput] = useState('');
  const [aiGeneratedText, setAiGeneratedText] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Selected Offer Drawer / Modal State
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [negotiationModal, setNegotiationModal] = useState(null);
  const [negotiateCounterAmount, setNegotiateCounterAmount] = useState('');
  const [negotiateNote, setNegotiateNote] = useState('');

  // Wallet Payout Form State
  const [payoutMethod, setPayoutMethod] = useState('bkash'); // 'bkash' | 'bank'
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutAccount, setPayoutAccount] = useState(user.mfsNumber || '');
  const [payoutHistory, setPayoutHistory] = useState([
    { id: 'TRX-901', date: '2026-07-20', tranche: 'Tranche #1 (MVP Sign-off)', amount: 150000, method: 'bKash Merchant', status: 'Completed', hash: '0x8f2a...90e1' },
    { id: 'TRX-902', date: '2026-07-22', tranche: 'Tranche #2 (Beta Rollout)', amount: 170000, method: 'BRAC Bank Wire', status: 'Pending Audit', hash: '0x4c1d...33a2' }
  ]);

  // Evidence Upload State (Milestones)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('m2');
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');

  // Demo Milestones List
  const [milestonesList, setMilestonesList] = useState([
    { id: 'm1', title: 'Phase 1: Lab Prototype & Material Testing', targetDate: '2026-06-30', trancheAmount: 150000, status: 'Completed', proofFile: 'jute_lab_test_report.pdf' },
    { id: 'm2', title: 'Phase 2: Pilot Production & First 100 Customers', targetDate: '2026-08-15', trancheAmount: 170000, status: 'In Review', proofFile: 'bom_receipts_batch1.pdf' },
    { id: 'm3', title: 'Phase 3: E-Commerce Store Launch & Export Clearance', targetDate: '2026-10-31', trancheAmount: 180000, status: 'Locked', proofFile: '' }
  ]);

  // Audit Logs Filter State
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditFilterStatus, setAuditFilterStatus] = useState('all');

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load backend data
  const loadData = async () => {
    try {
      setLoading(true);
      const campRes = await fetch(`${API_BASE_URL}/api/campaigns/founder/${currentUser.id}`);
      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaigns(campData);
        if (campData.length > 0) {
          const propRes = await fetch(`${API_BASE_URL}/api/proposals/campaign/${campData[0]._id || campData[0].id}`);
          if (propRes.ok) {
            const propData = await propRes.json();
            setProposals(propData);
          }
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Demo Investment Offers List
  const initialOffers = [
    {
      id: 'OFFER-101',
      investorName: 'Vantage Ventures Dhaka',
      investorRole: 'VC Fund',
      investorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      offeredAmount: 250000,
      returnStructure: '6.0% Direct Equity Stake',
      maturityPeriod: '36 Months',
      gracePeriod: '6 Months',
      status: 'Pending',
      customNotes: 'Impressed by your jute upcycling FabLab trial. We offer ৳2,50,000 for 6% equity with quarterly advisory board check-ins.'
    },
    {
      id: 'OFFER-102',
      investorName: 'Tariqul Islam',
      investorRole: 'Alumni Angel (BUET 12)',
      investorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      offeredAmount: 150000,
      returnStructure: '5% Revenue Share until 1.5x Payback',
      maturityPeriod: '24 Months',
      gracePeriod: '3 Months',
      status: 'Accepted',
      customNotes: 'Happy to support fellow university founders! Flexible revenue share model with zero voting rights required.'
    },
    {
      id: 'OFFER-103',
      investorName: 'Dhaka Angel Syndicate',
      investorRole: 'Angel Network',
      investorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      offeredAmount: 100000,
      returnStructure: '2.5% Equity + Mentorship',
      maturityPeriod: '30 Months',
      gracePeriod: '4 Months',
      status: 'Pending',
      customNotes: 'Syndicate co-investment package including free office space at Bhatiary incubation hub.'
    }
  ];

  const [offersList, setOffersList] = useState(initialOffers);

  // Demo Audit Hash Ledger Data
  const initialAuditLogs = [
    { hash: '0x8f2a99c4b1d09e1a', timestamp: '2026-07-23 16:40:12', category: 'DISBURSEMENT', title: 'Escrow Tranche #1 Release', status: 'VERIFIED', lat: '14ms' },
    { hash: '0x4c1d77a8e2f33a2b', timestamp: '2026-07-23 14:15:05', category: 'DOCUMENT_AUDIT', title: 'Lab Materials Test Proof Upload', status: 'VERIFIED', lat: '18ms' },
    { hash: '0x99a2bb3c4d5e6f7a', timestamp: '2026-07-22 11:02:44', category: 'EQUITY_TRANSFER', title: 'Alumni Angel Term Sheet Lock', status: 'VERIFIED', lat: '12ms' },
    { hash: '0x1234567890abcdef', timestamp: '2026-07-21 09:30:19', category: 'SECURITY_CHECK', title: 'KYC & Student ID Hash Verification', status: 'PASS', lat: '9ms' }
  ];

  const [auditLogsList, setAuditLogsList] = useState(initialAuditLogs);

  // AI Generator Simulator
  const handleGenerateAiPitch = () => {
    if (!aiNoteInput.trim()) {
      showToast('Please type brief notes in the AI helper box.', 'error');
      return;
    }
    setIsGeneratingAi(true);
    setTimeout(() => {
      setAiGeneratedText(
        `🚀 Optimized Slogan: "Revolutionizing Sustainable Fashion with Bangladesh Jute Power."\n\n📌 Enhanced Pitch: ${aiNoteInput}. EcoThread is an eco-friendly student startup utilizing circular economy principles to upcycle industrial textile waste into export-ready apparel, backed by university incubation.`
      );
      setIsGeneratingAi(false);
      showToast('AI Pitch enhancement completed!', 'success');
    }, 1200);
  };

  // Offer Actions
  const handleAcceptOffer = (offerId) => {
    setOffersList(prev => prev.map(o => o.id === offerId ? { ...o, status: 'Accepted' } : o));
    setSelectedOffer(null);
    showToast(`Investment offer ${offerId} ACCEPTED! Term sheet lock registered to audit ledger.`, 'success');
  };

  const handleRejectOffer = (offerId) => {
    setOffersList(prev => prev.map(o => o.id === offerId ? { ...o, status: 'Declined' } : o));
    setSelectedOffer(null);
    showToast(`Investment offer ${offerId} DECLINED.`, 'info');
  };

  const handleSendNegotiation = (e) => {
    e.preventDefault();
    if (!negotiateCounterAmount) {
      showToast('Please enter a counter offer amount.', 'error');
      return;
    }
    setOffersList(prev => prev.map(o => o.id === negotiationModal.id ? { ...o, status: 'Negotiating' } : o));
    setNegotiationModal(null);
    setNegotiateCounterAmount('');
    setNegotiateNote('');
    showToast('Counter-proposal sent to investor! They will be notified.', 'success');
  };

  // Payout Handler
  const handleRequestPayout = (e) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) <= 0) {
      showToast('Please enter a valid payout amount.', 'error');
      return;
    }
    if (Number(payoutAmount) > 320000) {
      showToast('Requested payout exceeds available withdrawal balance (৳3,20,000 BDT).', 'error');
      return;
    }
    const newTx = {
      id: 'TRX-' + Math.floor(100 + Math.random() * 900),
      date: new Date().toISOString().substring(0, 10),
      tranche: 'Milestone Escrow Payout',
      amount: Number(payoutAmount),
      method: payoutMethod === 'bkash' ? `bKash (${payoutAccount})` : `Bank (${payoutAccount})`,
      status: 'Pending Audit',
      hash: '0x' + Math.random().toString(36).substring(2, 10)
    };
    setPayoutHistory(prev => [newTx, ...prev]);
    setPayoutAmount('');
    showToast(`Payout request of ৳${Number(payoutAmount).toLocaleString()} BDT submitted for admin processing!`, 'success');
  };

  // Milestone Evidence Submission
  const handleSubmitEvidence = (e) => {
    e.preventDefault();
    if (!evidenceFileName) {
      showToast('Please attach a proof document or photo.', 'error');
      return;
    }
    setMilestonesList(prev => prev.map(m => m.id === selectedMilestoneId ? { ...m, status: 'In Review', proofFile: evidenceFileName } : m));
    setEvidenceFileName('');
    setEvidenceDescription('');
    showToast('Milestone evidence submitted! 48-hour review window initiated for backer verification.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#0B0F0C] text-[#E2E8F0] flex flex-col font-sans relative selection:bg-[#00E676]/30">
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[99999] px-4 py-3 rounded-lg border font-mono text-xs shadow-2xl animate-fadeIn flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-200' :
          toast.type === 'success' ? 'bg-emerald-950/90 border-[#00E676]/50 text-emerald-200' :
          'bg-[#111613] border-[#1F2922] text-[#E2E8F0]'
        }`}>
          <AlertCircle className="w-4 h-4 text-[#00E676]" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-[#1F2922] bg-[#080B09]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <img src={logoBlackUrl} alt="FundBridge Logo" className="h-8 w-auto invert" />
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] uppercase tracking-wider">
              Student Founder Portal
            </span>
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-5">
          <div className="text-right hidden sm:block font-mono">
            <span className="text-xs text-[#E2E8F0] font-bold block">{currentUser.name}</span>
            <span className="text-[10px] text-[#8E9B93] block">{currentUser.university || 'BRAC University'}</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-mono text-[#8E9B93] hover:text-[#E2E8F0] transition-colors border border-[#1F2922] rounded px-3 py-1.5 cursor-pointer bg-[#111613] hover:bg-[#1A231D]"
          >
            <LogOut className="w-3.5 h-3.5 text-[#00E676]" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 border-r border-[#1F2922] bg-[#080B09] p-5 space-y-1.5 flex-shrink-0 text-left font-mono">
          <span className="text-[9px] font-bold tracking-widest text-[#8E9B93] uppercase block mb-3 px-3">
            FOUNDER DASHBOARD
          </span>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-3.5 py-2.5 rounded text-xs transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'overview'
                ? 'bg-[#00E676] text-black font-bold shadow-[0_0_15px_rgba(0,230,118,0.2)]'
                : 'text-[#8E9B93] hover:bg-[#111613] hover:text-[#E2E8F0]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>1. Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('campaign')}
            className={`w-full text-left px-3.5 py-2.5 rounded text-xs transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'campaign'
                ? 'bg-[#00E676] text-black font-bold shadow-[0_0_15px_rgba(0,230,118,0.2)]'
                : 'text-[#8E9B93] hover:bg-[#111613] hover:text-[#E2E8F0]'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>2. My Campaign</span>
          </button>

          <button
            onClick={() => setActiveTab('investors')}
            className={`w-full text-left px-3.5 py-2.5 rounded text-xs transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'investors'
                ? 'bg-[#00E676] text-black font-bold shadow-[0_0_15px_rgba(0,230,118,0.2)]'
                : 'text-[#8E9B93] hover:bg-[#111613] hover:text-[#E2E8F0]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. Investors</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`w-full text-left px-3.5 py-2.5 rounded text-xs transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'wallet'
                ? 'bg-[#00E676] text-black font-bold shadow-[0_0_15px_rgba(0,230,118,0.2)]'
                : 'text-[#8E9B93] hover:bg-[#111613] hover:text-[#E2E8F0]'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>4. Wallet</span>
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`w-full text-left px-3.5 py-2.5 rounded text-xs transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'milestones'
                ? 'bg-[#00E676] text-black font-bold shadow-[0_0_15px_rgba(0,230,118,0.2)]'
                : 'text-[#8E9B93] hover:bg-[#111613] hover:text-[#E2E8F0]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>5. Milestones</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full text-left px-3.5 py-2.5 rounded text-xs transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'audit'
                ? 'bg-[#00E676] text-black font-bold shadow-[0_0_15px_rgba(0,230,118,0.2)]'
                : 'text-[#8E9B93] hover:bg-[#111613] hover:text-[#E2E8F0]'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>6. Audit Logs</span>
          </button>

          {/* Vetting Status Box */}
          <div className="pt-6">
            <div className="p-3 bg-[#111613] border border-[#1F2922] rounded space-y-1.5 text-[10px]">
              <span className="text-[#8E9B93] uppercase block">FOUNDER VETTING</span>
              <span className={`px-2 py-0.5 rounded uppercase font-bold inline-block border ${
                currentUser.vettingStatus === 'verified'
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
              }`}>
                {currentUser.vettingStatus ? currentUser.vettingStatus.toUpperCase() : 'VERIFIED'}
              </span>
              <p className="text-[#8E9B93] leading-normal pt-1">
                {currentUser.vettingStatus === 'verified' ? 'Identity & Incubation verified by FundBridge Admin.' : 'Under review by Admin.'}
              </p>
            </div>
          </div>
        </aside>

        {/* Content Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-8 custom-scrollbar">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn text-left">
              {/* Welcome Header */}
              <div className="border border-[#1F2922] bg-[#111613] rounded p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 font-mono">
                  <span className="text-xs text-[#00E676] uppercase tracking-widest block">STARTUP LAUNCHPAD OVERVIEW</span>
                  <h2 className="text-2xl font-semibold text-[#E2E8F0] tracking-tight">{campaignForm.title}</h2>
                  <p className="text-xs text-[#8E9B93]">{campaignForm.tagline}</p>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <button 
                    onClick={() => setActiveTab('campaign')}
                    className="px-4 py-2 bg-[#00E676] hover:bg-[#00E575]/90 text-black font-semibold rounded transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    Edit Campaign <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Campaign Quick Summary */}
              {activeCampaign ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-border-strong rounded-xl p-5 bg-[#0A0F1E] space-y-2">
                    <span className="text-[10px] text-text-muted uppercase block font-medium">Campaign Verification</span>
                    <div className="text-lg font-medium flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${activeCampaign.verified ? 'bg-neon-mint animate-pulse' : 'bg-amber-400 animate-pulse'}`}></span>
                      <span>{activeCampaign.verified ? 'LIVE ON MARKETPLACE' : 'AWAITING ADMIN APPROVAL'}</span>
                    </div>
                  </div>

                  <div className="border border-border-strong rounded-xl p-5 bg-[#0A0F1E] space-y-2">
                    <span className="text-[10px] text-text-muted uppercase block font-medium">Committed backing</span>
                    <div className="text-xl font-semibold text-neon-mint">
                      ৳ {activeCampaign.raised.toLocaleString()} BDT
                      <span className="text-xs text-text-muted font-normal block mt-1">Goal: ৳ {activeCampaign.goal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border border-border-strong rounded-xl p-5 bg-[#0A0F1E] space-y-2">
                    <span className="text-[10px] text-text-muted uppercase block font-medium">Milestone tranches</span>
                    <div className="text-lg font-medium text-white flex items-center gap-2">
                      <span>{(activeCampaign?.milestones || []).filter(m => m.status === 'done' || m.status === 'completed').length} / {(activeCampaign?.milestones || []).length} Cleared</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-border-strong rounded-xl p-12 text-center text-text-muted space-y-4">
                  <HelpCircle className="w-10 h-10 text-sky-primary mx-auto opacity-70" />
                  <div>
                    <h3 className="text-sm font-medium text-white">No active campaign profile found</h3>
                    <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">Create a campaign to request backing from alumni networks and corporate angel pools.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('campaign')}
                    className="px-5 py-2.5 bg-sky-primary text-white text-xs font-semibold rounded hover:bg-sky-primary/95 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Launch Campaign Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAMPAIGN PROFILE */}
          {activeTab === 'campaign' && (
            <div className="space-y-6">
              {activeCampaign ? (
                <div className="bg-[#0B101E] border border-border-strong rounded-xl p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[10px] text-sky-light tracking-wider font-semibold uppercase">{activeCampaign.category} · {activeCampaign.stage}</span>
                      <h2 className="text-2xl font-semibold mt-1">{activeCampaign.title}</h2>
                      <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-sky-primary" />
                        <span>{activeCampaign.location} · {activeCampaign.university}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 text-[10px] font-semibold border rounded-full uppercase ${
                        activeCampaign.verified ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        {activeCampaign.verified ? 'Live' : 'Pending Verification'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Executive Description</h4>
                        <p className="text-text-muted text-sm mt-1 leading-relaxed">{activeCampaign.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-lg border border-white/5">
                        <div>
                          <span className="text-[9px] text-text-muted uppercase font-medium">Funding Target</span>
                          <p className="text-sm font-semibold text-white mt-0.5">৳ {activeCampaign.goal.toLocaleString()} BDT</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-text-muted uppercase font-medium">Equity/Terms Offered</span>
                          <p className="text-sm font-semibold text-sky-light mt-0.5">{activeCampaign.equityOffer}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-3">Escrow Milestone Plan</h4>
                      <div className="space-y-3">
                        {(activeCampaign?.milestones || []).map((m, idx) => (
                          <div key={m._id || idx} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-semibold text-[10px]">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="font-medium text-white">{m.title}</p>
                                <span className="text-[10px] text-text-muted">{m.target}</span>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-semibold border ${
                              m.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                              m.status === 'active' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                              m.status === 'pending' ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' :
                              'bg-white/5 border-white/10 text-text-muted'
                            }`}>
                              {m.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0B101E] border border-border-strong rounded-xl p-8 max-w-2xl">
                  <div className="border-b border-white/10 pb-4 mb-6">
                    <h2 className="text-xl font-semibold">Launch a Startup Campaign</h2>
                    <p className="text-xs text-text-muted mt-1">Configure your fundraising targets, milestones, and backing options.</p>
                  </div>

                  <form onSubmit={handleLaunchCampaign} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-semibold uppercase text-text-muted block mb-1">Campaign Title</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. CampusBites"
                          value={newCampaign.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewCampaign(prev => ({
                              ...prev,
                              title: val,
                              id: val.toLowerCase().replace(/\s+/g, '-')
                            }));
                          }}
                          className="w-full bg-white/5 border border-border-strong rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase text-text-muted block mb-1">Campaign URL Slug</label>
                        <input 
                          type="text" 
                          required
                          disabled
                          placeholder="e.g. campusbites"
                          value={newCampaign.id}
                          className="w-full bg-white/5 border border-border-strong rounded px-3 py-2 text-xs text-white opacity-60 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-semibold uppercase text-text-muted block mb-1">Category</label>
                        <select 
                          value={newCampaign.category}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-white/5 border border-border-strong rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                        >
                          <option value="Fintech">Fintech</option>
                          <option value="Logistics">Logistics</option>
                          <option value="F&B">Food & Beverage</option>
                          <option value="EdTech">EdTech</option>
                          <option value="SaaS">SaaS / Tech</option>
                          <option value="Other">Other Category</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase text-text-muted block mb-1">Development Stage</label>
                        <select 
                          value={newCampaign.stage}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, stage: e.target.value }))}
                          className="w-full bg-white/5 border border-border-strong rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                        >
                          <option value="Idea">Idea Phase</option>
                          <option value="MVP">MVP / Prototype</option>
                          <option value="Early Traction">Early Traction</option>
                          <option value="Growth">Scaling Venture</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase text-text-muted block mb-1">Target BDT (Taka)</label>
                        <input 
                          type="number" 
                          required
                          value={newCampaign.goal}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, goal: Number(e.target.value) }))}
                          className="w-full bg-white/5 border border-border-strong rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-semibold uppercase text-text-muted block mb-1">Funding Terms (Equity offer)</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. 8% Gross Revenue Share or 10% Equity"
                          value={newCampaign.equityOffer}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, equityOffer: e.target.value }))}
                          className="w-full bg-white/5 border border-border-strong rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase text-text-muted block mb-1">Physical Location</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Dhanmondi, Dhaka"
                          value={newCampaign.location}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full bg-white/5 border border-border-strong rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold uppercase text-text-muted block mb-1">Executive Summary Description</label>
                      <textarea 
                        required
                        rows="3"
                        placeholder="Detail your business operations model, problems solved, and growth channels inside campus..."
                        value={newCampaign.description}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-white/5 border border-border-strong rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                      ></textarea>
                    </div>

                    <div className="border-t border-white/10 pt-4 space-y-3">
                      <h4 className="text-[10px] font-semibold uppercase text-text-muted tracking-wider">Configure Escrow Milestone Tranches</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-3 rounded border border-white/5">
                        <div>
                          <label className="text-[9px] font-medium text-text-muted block mb-1">Milestone 1 Objective</label>
                          <input type="text" value={newCampaign.milestone1_title} onChange={(e) => setNewCampaign(prev => ({ ...prev, milestone1_title: e.target.value }))} className="w-full bg-white/5 border border-border-strong rounded p-1.5 text-xs text-white" />
                        </div>
                        <div>
                          <label className="text-[9px] font-medium text-text-muted block mb-1">M1 Timeframe</label>
                          <input type="text" value={newCampaign.milestone1_target} onChange={(e) => setNewCampaign(prev => ({ ...prev, milestone1_target: e.target.value }))} className="w-full bg-white/5 border border-border-strong rounded p-1.5 text-xs text-white" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-3 rounded border border-white/5">
                        <div>
                          <label className="text-[9px] font-medium text-text-muted block mb-1">Milestone 2 Objective</label>
                          <input type="text" value={newCampaign.milestone2_title} onChange={(e) => setNewCampaign(prev => ({ ...prev, milestone2_title: e.target.value }))} className="w-full bg-white/5 border border-border-strong rounded p-1.5 text-xs text-white" />
                        </div>
                        <div>
                          <label className="text-[9px] font-medium text-text-muted block mb-1">M2 Timeframe</label>
                          <input type="text" value={newCampaign.milestone2_target} onChange={(e) => setNewCampaign(prev => ({ ...prev, milestone2_target: e.target.value }))} className="w-full bg-white/5 border border-border-strong rounded p-1.5 text-xs text-white" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-3 rounded border border-white/5">
                        <div>
                          <label className="text-[9px] font-medium text-text-muted block mb-1">Milestone 3 Objective</label>
                          <input type="text" value={newCampaign.milestone3_title} onChange={(e) => setNewCampaign(prev => ({ ...prev, milestone3_title: e.target.value }))} className="w-full bg-white/5 border border-border-strong rounded p-1.5 text-xs text-white" />
                        </div>
                        <div>
                          <label className="text-[9px] font-medium text-text-muted block mb-1">M3 Timeframe</label>
                          <input type="text" value={newCampaign.milestone3_target} onChange={(e) => setNewCampaign(prev => ({ ...prev, milestone3_target: e.target.value }))} className="w-full bg-white/5 border border-border-strong rounded p-1.5 text-xs text-white" />
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={currentUser.vettingStatus !== 'verified'}
                      className={`w-full py-3 bg-sky-primary text-white text-xs font-semibold rounded hover:bg-sky-primary/95 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        currentUser.vettingStatus !== 'verified' && 'opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-4 h-4 text-neon-mint" />
                      <span>Submit Campaign Profile for Admin Verification</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ESCROW MILESTONES */}
          {activeTab === 'milestones' && activeCampaign && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-xl font-semibold tracking-tight font-display">Milestone Escrow Releases</h2>
                <p className="text-xs text-text-muted mt-1">Submit invoice proofs or operational statements to release locked capital tranches.</p>
              </div>

              <div className="bg-[#0B101E] border border-border-strong rounded-xl p-6 space-y-4">
                <form onSubmit={handleSubmitMilestoneReceipt} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-text-muted block mb-1.5">Select Target Milestone</label>
                    <select 
                      required
                      value={selectedMilestone}
                      onChange={(e) => setSelectedMilestone(e.target.value)}
                      className="w-full bg-white/5 border border-border-strong rounded px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                    >
                      <option value="">-- Choose Milestone --</option>
                      {(activeCampaign?.milestones || [])
                        .filter(m => m.status === 'active')
                        .map(m => (
                          <option key={m._id} value={m._id} className="text-black">
                            {m.title} ({m.target})
                          </option>
                        ))}
                    </select>
                    <span className="text-[10px] text-text-muted mt-1 block">Only active tranches can be submitted for verification review.</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase text-text-muted block mb-1.5">Receipt Description / Invoice proofs</label>
                    <textarea 
                      required
                      rows="3"
                      value={receiptProof}
                      onChange={(e) => setReceiptProof(e.target.value)}
                      placeholder="e.g. Scanned invoices of domain purchases, site rental receipts, rider payouts, food stock receipts..."
                      className="w-full bg-white/5 border border-border-strong rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                    ></textarea>
                  </div>

                  <div className="border border-dashed border-border-strong rounded-lg p-4 text-center bg-white/5">
                    <Upload className="w-6 h-6 text-text-muted mx-auto mb-2" />
                    <span className="text-xs text-sky-primary hover:underline cursor-pointer block font-semibold">Simulated receipt scan.pdf selected</span>
                    <span className="text-[10px] text-text-muted block mt-0.5">Clicking uploads mock bytes.</span>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-sky-primary text-white text-xs font-semibold rounded hover:bg-sky-primary/95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Submit Proofs to Admin Queue</span>
                  </button>
                </form>
              </div>

              {/* Milestones status table */}
              <div className="border border-border-strong rounded-xl overflow-hidden bg-[#0A0F1E] text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 border-b border-border-strong text-text-muted font-medium">
                      <th className="p-4">Objective</th>
                      <th className="p-4">Timeline</th>
                      <th className="p-4">Escrow Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-strong">
                    {activeCampaign.milestones.map((m, idx) => (
                      <tr key={m._id || idx} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-semibold text-white">{m.title}</td>
                        <td className="p-4 text-text-muted">{m.target}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-semibold border ${
                            m.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                            m.status === 'active' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                            m.status === 'pending' ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' :
                            'bg-white/5 border-white/10 text-text-muted'
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
          )}

          {/* TAB 4: BACKING PROPOSALS */}
          {activeTab === 'proposals' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight font-display">Backing Offers & proposals</h2>
                <p className="text-xs text-text-muted mt-1">Review investment proposals committed by corporate alumni angels.</p>
              </div>

              {proposals.length === 0 ? (
                <div className="border border-dashed border-border-strong rounded-xl p-12 text-center text-text-muted space-y-2">
                  <Coins className="w-8 h-8 text-sky-primary mx-auto opacity-70" />
                  <p className="text-xs font-semibold text-white">No active proposals received yet.</p>
                  <p className="text-[10px] text-text-muted">Once alumni discover your verified listing, proposals will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {proposals.map(p => (
                    <div key={p._id} className="border border-border-strong rounded-xl p-5 bg-[#0B101E] flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-white">{p.investor.name}</h3>
                            <span className="text-[10px] text-text-muted block">{p.investor.institution} · {p.investor.designation}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-semibold border ${
                            p.status === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                            p.status === 'rejected' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                            'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-white/5 p-3 rounded text-xs border border-white/5">
                          <div>
                            <span className="text-[9px] text-text-muted block">Committed funding</span>
                            <strong className="text-white">৳ {p.amount.toLocaleString()} BDT</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-text-muted block">Requested Terms</span>
                            <strong className="text-sky-light">{p.terms}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                        {p.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleProposalAction(p._id, 'rejected')}
                              className="px-3 py-1.5 bg-white/5 border border-border-strong rounded text-[11px] font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              Decline
                            </button>
                            <button 
                              onClick={() => handleProposalAction(p._id, 'accepted')}
                              className="px-3 py-1.5 bg-sky-primary hover:bg-sky-primary/90 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Accept Proposal
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => startNegotiation(p)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-border-strong rounded text-[11px] font-semibold text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-sky-primary" />
                          <span>Negotiate</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: NEGOTIATION CHAT */}
          {activeTab === 'chat' && activeChatRoom && (
            <div className="bg-[#0B101E] border border-border-strong rounded-xl p-5 flex flex-col h-[480px] justify-between max-w-2xl">
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Negotiation: {chatPartner?.name || 'Investor'}</h3>
                  <p className="text-[10px] text-neon-mint font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-mint animate-pulse"></span>
                    <span>Real-time WebSocket Sync</span>
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setActiveChatRoom(null);
                    setChatPartner(null);
                    setActiveTab('proposals');
                  }}
                  className="p-1 hover:bg-white/5 rounded border border-border-strong text-text-muted hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Log */}
              <div className="flex-1 bg-black/20 p-4 rounded-lg my-4 overflow-y-auto space-y-3">
                {chatMessages.map((msg, i) => {
                  const isYou = msg.sender.includes('Founder');
                  const isSystem = msg.sender === 'System';
                  
                  if (isSystem) {
                    return (
                      <div key={i} className="text-center">
                        <span className="bg-white/5 border border-white/10 text-text-muted text-[10px] px-3 py-1 rounded-full font-medium inline-block">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={i} className={`flex flex-col ${isYou ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] text-text-muted mb-0.5 px-1">{msg.sender} {msg.time && `· ${msg.time}`}</span>
                      <div className={`p-3 rounded-lg max-w-[80%] text-xs ${
                        isYou 
                          ? 'bg-sky-primary text-white rounded-tr-none' 
                          : 'bg-[#161C2C] border border-border-strong text-white rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef}></div>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSendChatMessage} className="flex gap-2">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Offer custom revenue percentages or adjust milestone intervals..."
                  className="flex-1 bg-white/5 border border-border-strong rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                />
                <button 
                  type="submit"
                  className="bg-sky-primary hover:bg-sky-primary/95 text-white px-4 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
