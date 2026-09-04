import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  LayoutGrid,
  Rocket,
  Users,
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
  Heart,
  Wallet,
  AlertTriangle
} from 'lucide-react';

import MilestoneReleaseWorkflow from './MilestoneReleaseWorkflow.jsx';

// S3: shared Category / Sector list for create form + Campaigns filter (fixed — no custom add)
const CAMPAIGN_SECTOR_OPTIONS = [
  'FoodTech / F&B',
  'CleanTech',
  'WaterTech',
  'HealthTech',
  'AgTech',
  'EdTech',
  'FinTech',
  'Biotech',
  'AI / Robotics',
  'E-Commerce / Marketplace',
  'Logistics / Supply Chain',
  'Hardware / Robotics'
];

// S3: searchable designated successor (existing founders only)
const MAX_COFOUNDERS = 3;

function CoFounderMultiPicker({ selected = [], founders, onChange, accent = 'emerald' }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const list = Array.isArray(selected) ? selected : [];
  const atCap = list.length >= MAX_COFOUNDERS;
  const ring = accent === 'rose' ? 'focus:ring-rose-500/20' : 'focus:ring-emerald-500/20';
  const chip = accent === 'rose' ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900';
  const hover = accent === 'rose' ? 'hover:bg-rose-50' : 'hover:bg-emerald-50';

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selectedIds = new Set(list.map((c) => String(c.id || c._id || '')));
  const selectedEmails = new Set(list.map((c) => String(c.email || '').toLowerCase()).filter(Boolean));
  const tokens = String(query || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = (founders || []).filter((f) => {
    const fid = String(f.id || f._id || '');
    const fem = String(f.email || '').toLowerCase();
    if (selectedIds.has(fid) || (fem && selectedEmails.has(fem))) return false;
    if (tokens.length === 0) return true;
    const blob = `${f.name || ''} ${f.university || ''} ${f.email || ''}`.toLowerCase();
    return tokens.every((t) => blob.includes(t));
  }).slice(0, 60);

  const add = (f) => {
    if (!f || atCap) return;
    onChange([
      ...list,
      {
        id: String(f.id || f._id || ''),
        name: f.name || '',
        email: f.email || '',
        university: f.university || '',
        department: f.department || ''
      }
    ]);
    setQuery('');
    setOpen(false);
  };

  const remove = (idOrEmail) => {
    onChange(list.filter((c) => {
      const key = String(c.id || c._id || c.email || '');
      return key !== String(idOrEmail);
    }));
  };

  return (
    <div className="md:col-span-2 space-y-2">
      <p className="text-[11px] text-slate-600 leading-relaxed">
        Co-founders are other registered FundBridge founders who jointly run this campaign with you (at most {MAX_COFOUNDERS}).
        Search and add them here, or leave empty and let others apply later from the campaign page. Formal ownership transfer still uses a separate handover request.
      </p>
      <label className="text-xs font-semibold text-slate-700 block">
        Co-founders ({list.length}/{MAX_COFOUNDERS})
      </label>
      {list.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {list.map((c) => (
            <span
              key={c.id || c.email}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${chip}`}
            >
              {c.name || 'Founder'}
              <button
                type="button"
                onClick={() => remove(c.id || c.email)}
                className="text-[10px] opacity-70 hover:opacity-100 cursor-pointer"
                aria-label={`Remove ${c.name || 'co-founder'}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div ref={wrapRef} className="relative">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            disabled={atCap}
            placeholder={atCap ? `Maximum ${MAX_COFOUNDERS} co-founders reached` : 'Search founder by name, university, or email...'}
            onFocus={() => { if (!atCap) setOpen(true); }}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 ${ring} disabled:opacity-60`}
            autoComplete="off"
          />
        </div>
        {open && !atCap && (
          <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto overscroll-contain bg-white border border-slate-200 rounded-xl shadow-lg">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-[11px] text-slate-500">
                {query.trim() ? `No founders match “${query.trim()}”.` : 'Type to search registered founders.'}
              </p>
            ) : (
              filtered.map((f) => (
                <button
                  key={f.id || f._id || f.email}
                  type="button"
                  onClick={() => add(f)}
                  className={`w-full text-left px-3 py-2 text-xs cursor-pointer text-slate-800 ${hover}`}
                >
                  <span className="font-semibold">{f.name || 'Founder'}</span>
                  {f.university ? <span className="text-slate-500"> · {f.university}</span> : null}
                  <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{f.email}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function readCoFounders(obj) {
  const raw = obj?.coFounders || obj?.co_founders;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.slice(0, MAX_COFOUNDERS).map((c) => ({
      id: String(c.id || c._id || c.user_id || ''),
      name: c.name || '',
      email: c.email || '',
      university: c.university || '',
      department: c.department || ''
    }));
  }
  const email = obj?.successorEmail || obj?.successor_email || '';
  const name = obj?.successorName || obj?.successor_name || '';
  if (!email && !name) return [];
  return [{ id: '', name, email, university: '', department: '' }];
}

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
  const myFounderId = String(currentUser?.id || currentUser?._id || user.id || '');
  const myFounderEmail = String(currentUser?.email || user.email || '').toLowerCase();
  // Primary owner vs accepted co-founder (My lists show both; money/proposal actions stay owner-only)
  const isOwnerOfItem = (item) => {
    if (!item) return false;
    const role = String(item.viewerRole || item.viewer_role || '').toLowerCase();
    if (role === 'cofounder') return false;
    if (role === 'owner') return true;
    const fid = String(item.founder_id || item.founderId || item.founder?.id || item.founder?._id || '');
    if (fid && fid === myFounderId) return true;
    return !readCoFounders(item).some((cf) => {
      const cid = String(cf.id || '');
      const cem = String(cf.email || '').toLowerCase();
      return (cid && cid === myFounderId) || (cem && cem === myFounderEmail);
    });
  };
  const isCoFounderOfItem = (item) => {
    if (!item) return false;
    const role = String(item.viewerRole || item.viewer_role || '').toLowerCase();
    if (role === 'cofounder') return true;
    if (role === 'owner') return false;
    return readCoFounders(item).some((cf) => {
      const cid = String(cf.id || '');
      const cem = String(cf.email || '').toLowerCase();
      return (cid && cid === myFounderId) || (cem && cem === myFounderEmail);
    });
  };

  // Active Sidebar Tab: 'overview' | 'campaign' | 'explore' | 'investors' | 'wallet' | 'milestones' | 'audit' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  // Editable Profile User State
  const [profileUser, setProfileUser] = useState({
    name: user.name || '',
    email: user.email || '',
    university: user.university || '',
    department: user.department || '',
    studentId: user.studentId || user.student_id || '',
    studentIdCardImage: user.studentIdCardImage || '',
    nidCardImage: user.nidCardImage || '',
    mfsNumber: user.mfsNumber || '',
    vettingStatus: user.vettingStatus || 'verified',
    bio: user.bio || ''
  });

  const applyFounderProfile = (p) => {
    if (!p) return;
    setProfileUser((prev) => ({
      ...prev,
      name: p.name ?? prev.name,
      email: p.email ?? prev.email,
      university: p.university ?? prev.university,
      department: p.department ?? prev.department,
        studentId: p.studentId || p.student_id || prev.studentId,
        studentIdCardImage: p.studentIdCardImage || p.student_id_card_image || prev.studentIdCardImage,
        nidCardImage: p.nidCardImage || p.nid_card_image || prev.nidCardImage,
        mfsNumber: p.mfsNumber || p.mfs_number || prev.mfsNumber,
      vettingStatus: p.vettingStatus || p.vetting_status || prev.vettingStatus,
      bio: p.bio ?? prev.bio
    }));
  };

  const persistFounderSession = (p) => {
    try {
      const saved = JSON.parse(localStorage.getItem('fundbridge_user') || '{}');
      localStorage.setItem('fundbridge_user', JSON.stringify({
        ...saved,
        name: p.name ?? saved.name,
        email: p.email ?? saved.email,
        university: p.university ?? saved.university,
        department: p.department ?? saved.department,
        studentId: p.studentId || p.student_id || saved.studentId,
        mfsNumber: p.mfsNumber || p.mfs_number || saved.mfsNumber,
        bio: p.bio ?? saved.bio,
        vettingStatus: p.vettingStatus || p.vetting_status || saved.vettingStatus
      }));
    } catch (e) {}
  };

  const recordFounderAudit = async ({ category, title, status = 'RECORDED' }) => {
    const founderId = currentUser?.id || currentUser?._id || user.id;
    try {
      await fetch(`${API_BASE_URL}/api/founders/${encodeURIComponent(founderId)}/audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title, status })
      });
    } catch (e) {}
  };

  // S3: export wallet ledger CSV (same idea as investor Wallet)
  const exportWalletLedgerCSV = () => {
    const rows = (walletInflows || []).map((r) => ({
      type: r.type || 'CREDIT',
      direction: r.direction || 'in',
      party: r.investor_name || r.investor_id || '',
      campaign: r.campaign_title || r.campaign_id || '',
      amount: r.amount || 0,
      note: r.note || '',
      when: r.created_at || ''
    }));
    if (!rows.length) {
      showToast('No ledger rows to export yet.', 'error');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'FundBridge_Founder_Wallet_Ledger.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Wallet ledger CSV downloaded.', 'success');
  };

  // Notifications & Chat State
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [selectedInvestor, setSelectedInvestor] = useState(null); // S3: directory detail
  const [selectedInvestorDeals, setSelectedInvestorDeals] = useState([]); // S3

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser?.id || currentUser?._id || user.id,
          senderName: profileUser.name || user.name || 'Founder',
          receiverId: chatTarget?._id || chatTarget?.id || 'all',
          text: chatInputText
        })
      });
      if (res.ok) {
        const saved = await res.json();
        const msgObj = saved?.chatMessage || (saved?.id ? saved : {
          id: 'msg_' + Date.now(),
          sender_id: currentUser?.id || currentUser?._id || user.id,
          sender_name: profileUser.name || user.name || 'Founder',
          receiver_id: chatTarget?._id || chatTarget?.id || 'all',
          text: chatInputText,
          created_at: new Date().toISOString()
        });
        setChatMessages((prev) => [...prev, msgObj]);
        setChatInputText('');
      }
    } catch (err) {}
  };

  const chatTargetRef = useRef(null);
  useEffect(() => {
    chatTargetRef.current = chatTarget;
  }, [chatTarget]);

  const openChatWithInvestor = async (inv) => {
    if (!inv) return;
    setChatTarget(inv);
    setShowChatDrawer(true);
    const me = currentUser?.id || currentUser?._id || user.id;
    const other = inv.id || inv._id;
    if (!me || !other) {
      setChatMessages([]);
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/chat/thread?senderId=${encodeURIComponent(me)}&receiverId=${encodeURIComponent(other)}`
      );
      if (res.ok) {
        const rows = await res.json();
        setChatMessages(Array.isArray(rows) ? rows : []);
      } else {
        setChatMessages([]);
      }
    } catch {
      setChatMessages([]);
    }
  };

  const openInvestorDetail = async (inv) => {
    if (!inv) return;
    const id = inv.id || inv._id;
    setSelectedInvestor(inv);
    setSelectedInvestorDeals([]);
    if (!id) return;
    try {
      const [profRes, dealRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/investors/${encodeURIComponent(id)}/profile`),
        fetch(`${API_BASE_URL}/api/proposals/investor/${encodeURIComponent(id)}`)
      ]);
      if (profRes.ok) {
        const profile = await profRes.json();
        setSelectedInvestor({ ...inv, ...profile });
      }
      if (dealRes.ok) {
        const deals = await dealRes.json();
        setSelectedInvestorDeals(Array.isArray(deals) ? deals : []);
      }
    } catch {
      /* keep directory row */
    }
  };

  // Database State (Only real records loaded from backend)
  const [campaigns, setCampaigns] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [investorsList, setInvestorsList] = useState([]);
  const [payoutsList, setPayoutsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [reliefDrives, setReliefDrives] = useState([]);
  const [publicReliefCampaigns, setPublicReliefCampaigns] = useState([]);
  const [campaignsPageMode, setCampaignsPageMode] = useState('watch'); // watch | mine
  const [watchDetail, setWatchDetail] = useState(null); // S3: Campaigns to Watch detail
  const [watchDetailUpdates, setWatchDetailUpdates] = useState([]); // S3
  // S3: clickable Founder / Invested / Milestones cards → investor-style popups
  const [watchStatPanel, setWatchStatPanel] = useState(null); // null | 'founder' | 'invested' | 'milestones'
  const [watchDetailBackers, setWatchDetailBackers] = useState([]);
  const [reliefStatPanel, setReliefStatPanel] = useState(null); // null | 'founder' | 'invested' | 'milestones'
  const [reliefPageMode, setReliefPageMode] = useState('watch'); // watch | mine
  const [reliefDetail, setReliefDetail] = useState(null); // S3: browse relief detail
  const [showReliefCreateForm, setShowReliefCreateForm] = useState(false);
  // S3: list filters (Campaigns / Relief / Investors)
  const [campaignFilters, setCampaignFilters] = useState({
    status: 'all', category: 'all', stage: 'all', funding: 'all', university: 'all'
  });
  const [reliefFilters, setReliefFilters] = useState({
    status: 'all', cause: 'all', funding: 'all', activity: 'all', university: 'all'
  });
  // S3: Investors tab — separate filters per collapsible section
  const [whoInvestedFilters, setWhoInvestedFilters] = useState({
    roleType: 'all', amount: 'all', campaign: 'all'
  });
  const [proposalListFilters, setProposalListFilters] = useState({
    proposalStatus: 'all', amount: 'all', campaign: 'all'
  });
  const [directoryFilters, setDirectoryFilters] = useState({
    affiliation: 'all', university: 'all'
  });
  const [showWhoInvestedFilters, setShowWhoInvestedFilters] = useState(false);
  const [showProposalListFilters, setShowProposalListFilters] = useState(false);
  const [showDirectoryFilters, setShowDirectoryFilters] = useState(false);
  // S3: collapse filter bars on Campaigns / Relief (wallet-style; collapsed by default)
  const [showListFilters, setShowListFilters] = useState(false);
  // S3: audit log time window (full page — no scroll window)
  const [auditTimeRange, setAuditTimeRange] = useState('all');
  // S3: collapsible scroll windows for multi-entry lists
  const [showWalletInflowsHistory, setShowWalletInflowsHistory] = useState(false);
  const [showWalletDepositsHistory, setShowWalletDepositsHistory] = useState(false);
  const [showWalletPayoutsHistory, setShowWalletPayoutsHistory] = useState(false);
  const [showMilestonesList, setShowMilestonesList] = useState(true);
  const [showTimelineHistory, setShowTimelineHistory] = useState(true);
  const [showMyCampaignsHistory, setShowMyCampaignsHistory] = useState(true);
  const [showWatchPublicProgress, setShowWatchPublicProgress] = useState(true);
  // S3: founder directory (for bio lookup + co-founder picker)
  const [platformFounders, setPlatformFounders] = useState([]);
  const [coFounderApps, setCoFounderApps] = useState([]);
  const [showCoFounderApplyModal, setShowCoFounderApplyModal] = useState(false);
  const [coFounderApplyTarget, setCoFounderApplyTarget] = useState(null); // { type, item }
  const [coFounderApplyReason, setCoFounderApplyReason] = useState('');
  const [submittingCoFounderApply, setSubmittingCoFounderApply] = useState(false);
  const [showCoFounderListModal, setShowCoFounderListModal] = useState(false);
  const [coFounderListTarget, setCoFounderListTarget] = useState(null); // { title, coFounders, accent }
  const [showRemoveCoFounderModal, setShowRemoveCoFounderModal] = useState(false);
  const [removeCoFounderTarget, setRemoveCoFounderTarget] = useState(null); // { type, item, cofounder }
  const [removeCoFounderMessage, setRemoveCoFounderMessage] = useState('');
  const [idCardFile, setIdCardFile] = useState(null);
  const [nidFile, setNidFile] = useState(null);
  const emptyReliefForm = () => ({
    title: '',
    university: '',
    cause: 'Student Medical Aid',
    beneficiary: '',
    goal: 100000,
    durationDays: 60,
    description: '',
    use1: '',
    use2: '',
    use3: '',
    proofLinks: [{ type: 'Newspaper / Article', url: '' }],
    coFounders: []
  });
  const [reliefForm, setReliefForm] = useState(emptyReliefForm);
  const [editingReliefId, setEditingReliefId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Selected Investor Proposal
  const [selectedProposal, setSelectedProposal] = useState(null);
  // S3: founder negotiate / counter-offer form
  const [showNegotiateForm, setShowNegotiateForm] = useState(false);
  const [negotiateAmount, setNegotiateAmount] = useState('');
  const [negotiateTerms, setNegotiateTerms] = useState('');
  const [negotiateMessage, setNegotiateMessage] = useState('');
  const [negotiatingProposal, setNegotiatingProposal] = useState(false);
  const [investorPropFilter, setInvestorPropFilter] = useState('all'); // S3
  // S3: simple show/hide for Investors tab sections (not complex nested panels)
  const [showWhoInvestedSection, setShowWhoInvestedSection] = useState(true);
  const [showSubmittedProposalsSection, setShowSubmittedProposalsSection] = useState(true);
  const [showRegisteredInvestorsSection, setShowRegisteredInvestorsSection] = useState(false);

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
    description: '',
    coFounders: []
  });
  const [milestoneEditTitle, setMilestoneEditTitle] = useState('');
  const [milestoneEditTarget, setMilestoneEditTarget] = useState('');
  // S3: Overview metric card detail panels
  const [overviewDetail, setOverviewDetail] = useState(null); // null | 'escrow' | 'deposit' | 'proposals'
  const [depositAddAmount, setDepositAddAmount] = useState('');
  const [securityDepositHeld, setSecurityDepositHeld] = useState(0); // S3
  const [securityDepositLedger, setSecurityDepositLedger] = useState([]); // S3
  // S3: post-approval edit requests
  const [editRequests, setEditRequests] = useState([]);
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [editRequestTarget, setEditRequestTarget] = useState(null); // { type: 'investment'|'relief', item }
  const [editRequestReason, setEditRequestReason] = useState('');
  const [editRequestForm, setEditRequestForm] = useState({});
  const [submittingEditRequest, setSubmittingEditRequest] = useState(false);
  // S3: handover responsibility (replaces Stop/Auction stubs)
  const [handoverRequests, setHandoverRequests] = useState([]);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverTarget, setHandoverTarget] = useState(null); // { type: 'investment'|'relief', item }
  const [handoverReason, setHandoverReason] = useState('');
  const [handoverNewFounderId, setHandoverNewFounderId] = useState('');
  const [handoverProofFile, setHandoverProofFile] = useState(null);
  const [submittingHandover, setSubmittingHandover] = useState(false);

  const defaultMilestoneDrafts = () => ([
    { title: 'MVP Launch & Prototype', target: 'Month 1' },
    { title: 'Market Testing & First 100 Users', target: 'Month 2' },
    { title: 'Commercial Release & Revenue Target', target: 'Month 4' }
  ]);
  const [milestoneDrafts, setMilestoneDrafts] = useState(defaultMilestoneDrafts);
  // S3: relief create form — progress phases (no repayment / tranche %)
  const defaultReliefMilestoneDrafts = () => ([
    { title: 'Needs assessment & beneficiary list', target: 'Phase 1' },
    { title: 'Funds deployed to beneficiaries', target: 'Phase 2' },
    { title: 'Impact report & receipts', target: 'Phase 3' }
  ]);
  const [reliefMilestoneDrafts, setReliefMilestoneDrafts] = useState(defaultReliefMilestoneDrafts);

  const tranchePercentLabel = (idx, total) => {
    if (!total) return '';
    const base = Math.floor(100 / total);
    const rem = 100 - base * total;
    const pct = idx === total - 1 ? base + rem : base;
    return `Tranche ${idx + 1} (${pct}%)`;
  };

  // AI Suite State
  const [aiPrompt, setAiPrompt] = useState('');
  const [refinedPitch, setRefinedPitch] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Wallet / Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  // S3: manual Add Money (bKash / bank / other + proof → admin verify)
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [addMoneyMethod, setAddMoneyMethod] = useState('bkash');
  const [addMoneyReference, setAddMoneyReference] = useState('');
  const [addMoneyNote, setAddMoneyNote] = useState('');
  const [addMoneyProof, setAddMoneyProof] = useState(null);
  const [submittingAddMoney, setSubmittingAddMoney] = useState(false);
  const [walletDeposits, setWalletDeposits] = useState([]);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bkash');
  // S3: founder wallet ledger (accepted investments; no payment gateway)
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletInEscrow, setWalletInEscrow] = useState(0);
  const [walletAvailable, setWalletAvailable] = useState(0);
  const [walletPersonalAvailable, setWalletPersonalAvailable] = useState(0); // S3: Add Money only (security + relief donate)
  const [walletInflows, setWalletInflows] = useState([]);
  const [walletNote, setWalletNote] = useState('');
  // S3: collapsible scroll histories (deposit / relief donations)
  const [showDepositHistory, setShowDepositHistory] = useState(false);
  const [showReliefDonationHistory, setShowReliefDonationHistory] = useState(false);
  const [expandedMyReliefDonationIds, setExpandedMyReliefDonationIds] = useState(() => new Set());
  // S3: founder self-fund campaign/relief from wallet
  const [showSelfFundModal, setShowSelfFundModal] = useState(false);
  const [selfFundTarget, setSelfFundTarget] = useState(null); // { type: 'investment'|'relief', id, title }
  const [selfFundAmount, setSelfFundAmount] = useState('');
  const [submittingSelfFund, setSubmittingSelfFund] = useState(false);

  // Progress Announcement Modal State (FR-8)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementTag, setAnnouncementTag] = useState('General Update');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementCampaignId, setAnnouncementCampaignId] = useState('');
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [timelineCampaignId, setTimelineCampaignId] = useState('');
  const [publishingUpdate, setPublishingUpdate] = useState(false);
  // S3: custom Milestone/Progress tags per campaign (persisted)
  const [customProgressTags, setCustomProgressTags] = useState({});
  const [showAddTagInput, setShowAddTagInput] = useState(false);
  const [newProgressTag, setNewProgressTag] = useState('');

  // Milestones: select one milestone, then publish update / upload proof for it
  const [selectedMilestoneIdx, setSelectedMilestoneIdx] = useState(null);
  const [milestoneProofFile, setMilestoneProofFile] = useState(null);
  const [milestoneProofNote, setMilestoneProofNote] = useState('');
  const [certifyChecked, setCertifyChecked] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // FR-8: load progress announcements for founder campaigns (newest first; includes pending)
  const loadProgressUpdates = async (campaignList) => {
    const list = Array.isArray(campaignList) ? campaignList : [];
    const userId = currentUser?.id || currentUser?._id || user.id;
    if (list.length === 0) {
      setProgressUpdates([]);
      return;
    }
    try {
      const batches = await Promise.all(list.map(async (camp) => {
        const id = camp.id || camp._id;
        if (!id) return [];
        const qs = new URLSearchParams({ viewer: 'founder', founderId: userId || '' });
        const res = await fetch(`${API_BASE_URL}/api/campaigns/${encodeURIComponent(id)}/updates?${qs}`);
        if (!res.ok) return [];
        const data = await res.json().catch(() => []);
        return (Array.isArray(data) ? data : []).map((u) => ({
          ...u,
          campaignTitle: camp.title || 'Campaign'
        }));
      }));
      const merged = batches.flat().sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      setProgressUpdates(merged);
    } catch (err) {
      console.error('Progress updates fetch error:', err);
    }
  };

  // S3: tag options = campaign milestones + General Update + custom tags
  const getProgressTagOptions = (campaignId) => {
    const camp = campaigns.find((c) => (c.id || c._id) === campaignId);
    const fromMs = (Array.isArray(camp?.milestones) ? camp.milestones : [])
      .map((m, i) => (m.title || m.name || `Milestone ${i + 1}`).trim())
      .filter(Boolean);
    const custom = customProgressTags[campaignId] || [];
    return [...new Set([...fromMs, 'General Update', ...custom])];
  };

  const openAnnouncementModal = () => {
    const openCampaigns = campaigns.filter((c) => c.status !== 'cancelled');
    if (openCampaigns.length === 0) {
      showToast('Create a campaign before publishing a progress update.', 'error');
      return;
    }
    const openIds = new Set(openCampaigns.map((c) => c.id || c._id));
    const preferred =
      (announcementCampaignId && openIds.has(announcementCampaignId) && announcementCampaignId) ||
      (timelineCampaignId && openIds.has(timelineCampaignId) && timelineCampaignId) ||
      (openCampaigns[0].id || openCampaigns[0]._id);
    setAnnouncementCampaignId(preferred);
    const opts = getProgressTagOptions(preferred);
    setAnnouncementTag(opts[0] || 'General Update');
    setShowAddTagInput(false);
    setNewProgressTag('');
    setShowAnnouncementModal(true);
  };

  const openAnnouncementForMilestone = (idx) => {
    const project = activeMilestoneProject || activeCampaign;
    if (!project) {
      showToast('No active campaign found.', 'error');
      return;
    }
    // S3: progress announcements are campaign-only; relief uses proof upload for work evidence
    if (isReliefProject(project)) {
      showToast('Relief milestones use proof upload to show work progress.', 'error');
      return;
    }
    const m = project.milestones?.[idx];
    if (!m) {
      showToast('Select a valid milestone first.', 'error');
      return;
    }
    const campId = project.id || project._id;
    const label = (m.name || m.title || `Milestone #${idx + 1}`).trim();
    setSelectedMilestoneIdx(idx);
    setAnnouncementCampaignId(campId);
    setAnnouncementTag(label);
    setAnnouncementTitle('');
    setAnnouncementContent('');
    setShowAddTagInput(false);
    setNewProgressTag('');
    setShowAnnouncementModal(true);
  };

  const handleAddProgressTag = async () => {
    const tag = newProgressTag.trim();
    if (!tag) {
      showToast('Enter a tag name.', 'error');
      return;
    }
    const campId = announcementCampaignId;
    if (!campId) return;
    if (getProgressTagOptions(campId).includes(tag)) {
      setAnnouncementTag(tag);
      setNewProgressTag('');
      setShowAddTagInput(false);
      return;
    }
    const userId = currentUser?.id || currentUser?._id || user.id;
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${encodeURIComponent(campId)}/progress-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ founderId: userId, tag })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save tag');
      setCustomProgressTags((prev) => ({ ...prev, [campId]: data.tags || [...(prev[campId] || []), tag] }));
      setAnnouncementTag(tag);
      setNewProgressTag('');
      setShowAddTagInput(false);
      showToast('New progress tag added for this campaign.', 'success');
    } catch (err) {
      showToast(err.message || 'Error saving progress tag.', 'error');
    }
  };

  const handleUploadMilestoneProof = async () => {
    if (selectedMilestoneIdx === null || selectedMilestoneIdx === undefined) {
      showToast('Select a milestone first.', 'error');
      return;
    }
    const project = activeMilestoneProject || activeCampaign;
    if (!project) {
      showToast('No active campaign found.', 'error');
      return;
    }
    if (!milestoneProofFile) {
      showToast('Choose a proof file (PDF, JPG, or PNG).', 'error');
      return;
    }
    if (!certifyChecked) {
      showToast('Please certify that the documents are accurate.', 'error');
      return;
    }

    const campId = project.id || project._id;
    const userId = currentUser?.id || currentUser?._id || user.id;
    const m = project.milestones[selectedMilestoneIdx];
    const milestoneLabel = m?.name || m?.title || `Milestone #${selectedMilestoneIdx + 1}`;
    const proofUrl = isReliefProject(project)
      ? `${API_BASE_URL}/api/relief-drives/${encodeURIComponent(campId)}/milestones/${selectedMilestoneIdx}/proofs`
      : `${API_BASE_URL}/api/campaigns/${encodeURIComponent(campId)}/milestones/${selectedMilestoneIdx}/proofs`;

    try {
      setUploadingProof(true);
      const formData = new FormData();
      formData.append('founderId', userId);
      formData.append('proofFile', milestoneProofFile);
      formData.append('note', milestoneProofNote.trim() || `Evidence for ${milestoneLabel}`);

      const res = await fetch(proofUrl, { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to upload milestone proof.', 'error');
        return;
      }
      setMilestoneProofFile(null);
      setMilestoneProofNote('');
      setCertifyChecked(false);
      showToast(`Proof uploaded for "${milestoneLabel}". Pending verification.`, 'success');
      await fetchDatabaseData();
    } catch (err) {
      showToast('Error uploading milestone proof.', 'error');
    } finally {
      setUploadingProof(false);
    }
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

      const fetchJsonTimed = async (url, ms = 8000) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), ms);
        try {
          const res = await fetch(url, { signal: ctrl.signal });
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        } finally {
          clearTimeout(timer);
        }
      };
      const mergeById = (lists) => {
        const byId = new Map();
        lists.forEach((list) => {
          if (!Array.isArray(list)) return;
          list.forEach((row) => {
            const id = row && (row.id || row._id);
            if (id) byId.set(String(id), row);
          });
        });
        return [...byId.values()];
      };

      const email = String(currentUser?.email || user.email || '').toLowerCase();
      const founderIds = [String(userId)];
      if (email === 'ashraf.khan1@univ.edu.bd' || String(userId) === 'usr_founder_1') {
        if (!founderIds.includes('usr_founder_1')) founderIds.push('usr_founder_1');
      }

      const [watchData, dirData, publicRelief] = await Promise.all([
        fetchJsonTimed(`${API_BASE_URL}/api/campaigns/watchable`),
        fetchJsonTimed(`${API_BASE_URL}/api/investors/directory`),
        fetchJsonTimed(`${API_BASE_URL}/api/relief-drives`)
      ]);
      if (Array.isArray(watchData) && watchData.length > 0) setAllCampaigns(watchData);
      if (Array.isArray(dirData) && dirData.length > 0) setInvestorsList(dirData);
      if (Array.isArray(publicRelief) && publicRelief.length > 0) setPublicReliefCampaigns(publicRelief);

      // S3: fetch original founder route first, then /api/founders/.../campaigns last so local raised/status wins
      const campLists = await Promise.all(founderIds.flatMap((id) => [
        fetchJsonTimed(`${API_BASE_URL}/api/campaigns/founder/${encodeURIComponent(id)}`, 8000),
        fetchJsonTimed(`${API_BASE_URL}/api/founders/${encodeURIComponent(id)}/campaigns`, 5000)
      ]));
      let userCampaigns = mergeById(campLists);
      if (userCampaigns.length > 0) {
        setCampaigns(userCampaigns);
        const openCamps = userCampaigns.filter((c) => c.status !== 'cancelled');
        const preferred =
          openCamps.find((c) => c.verified || c.status === 'verified') ||
          openCamps[0] ||
          userCampaigns[0];
        const preferredId = preferred.id || preferred._id || '';
        setTimelineCampaignId((prev) => prev || preferredId);
        setAnnouncementCampaignId((prev) => prev || preferredId);
        setCampaignForm({
          title: preferred.title || '',
          university: preferred.university || profileUser.university || '',
          tagline: preferred.tagline || '',
          coverPhoto: preferred.cover_photo || preferred.coverPhoto || '',
          pitchVideoUrl: preferred.pitch_video_url || preferred.pitchVideoUrl || '',
          goal: preferred.goal || 500000,
          durationDays: preferred.durationDays || 60,
          equityOffer: preferred.equity_offer || preferred.equityOffer || '',
          description: preferred.description || ''
        });
        await loadProgressUpdates(userCampaigns);
      }

      const reliefLists = await Promise.all(founderIds.flatMap((id) => [
        fetchJsonTimed(`${API_BASE_URL}/api/founders/${encodeURIComponent(id)}/relief-drives`, 5000),
        fetchJsonTimed(`${API_BASE_URL}/api/relief-drives/founder/${encodeURIComponent(id)}`, 8000)
      ]));
      const reliefMerged = mergeById(reliefLists);
      if (reliefMerged.length > 0) setReliefDrives(reliefMerged);

      const profileData = await fetchJsonTimed(`${API_BASE_URL}/api/users/profile?userId=${encodeURIComponent(userId)}`, 5000);
      if (profileData) applyFounderProfile(profileData.user || profileData);

      try {
        const erRes = await fetchJsonTimed(`${API_BASE_URL}/api/edit-requests/founder/${encodeURIComponent(userId)}`, 5000);
        if (Array.isArray(erRes)) setEditRequests(erRes);
        const hoRes = await fetchJsonTimed(`${API_BASE_URL}/api/handover-requests/founder/${encodeURIComponent(userId)}`, 5000);
        if (Array.isArray(hoRes)) setHandoverRequests(hoRes);
      } catch {
        /* keep */
      }

      try {
        const tagMap = await fetchJsonTimed(`${API_BASE_URL}/api/progress-tags/founder/${encodeURIComponent(userId)}`, 5000);
        if (tagMap && typeof tagMap === 'object') setCustomProgressTags(tagMap);
      } catch {
        /* keep session tags */
      }

      const approvedForProps = userCampaigns.filter(
        (c) => c.verified === true || ['verified', 'open', 'live'].includes(String(c.status || '').toLowerCase())
      );
      const propBuckets = await Promise.all(
        approvedForProps.map(async (camp) => {
          const campId = camp.id || camp._id;
          if (!campId) return [];
          const rows = await fetchJsonTimed(`${API_BASE_URL}/api/proposals/campaign/${campId}`, 5000);
          return Array.isArray(rows) ? rows : [];
        })
      );
      const mergedProps = propBuckets.flat();
      if (mergedProps.length > 0) {
        setProposals(mergedProps);
        setSelectedProposal(mergedProps[0]);
      }
      const fpropLists = await Promise.all(
        founderIds.map((id) => fetchJsonTimed(`${API_BASE_URL}/api/proposals/founder/${encodeURIComponent(id)}`, 5000))
      );
      const fprop = mergeById(fpropLists);
      if (fprop.length > 0) {
        setProposals(fprop);
        setSelectedProposal(fprop[0]);
      }

      const payData = await fetchJsonTimed(`${API_BASE_URL}/api/payouts/founder/${encodeURIComponent(userId)}`, 5000);
      if (Array.isArray(payData) && payData.length > 0) setPayoutsList(payData);

      const auditData = await fetchJsonTimed(`${API_BASE_URL}/api/founders/${encodeURIComponent(userId)}/audit-logs`, 5000);
      if (Array.isArray(auditData) && auditData.length > 0) setAuditLogs(auditData);

      // S3: full founder directory (include self for bio; picker filters self out)
      const foundersDir = await fetchJsonTimed(`${API_BASE_URL}/api/users/founders`, 5000);
      if (Array.isArray(foundersDir)) setPlatformFounders(foundersDir);

      const cfaData = await fetchJsonTimed(`${API_BASE_URL}/api/cofounder-applications/owner/${encodeURIComponent(userId)}`, 5000);
      if (Array.isArray(cfaData)) setCoFounderApps(cfaData);

      const notifData = await fetchJsonTimed(`${API_BASE_URL}/api/notifications?userId=${encodeURIComponent(userId)}`, 5000);
      if (Array.isArray(notifData) && notifData.length > 0) setNotifications(notifData);

      const dep = await fetchJsonTimed(`${API_BASE_URL}/api/founders/${encodeURIComponent(userId)}/security-deposit`, 5000);
      if (dep) {
        setSecurityDepositHeld(Number(dep.amount) || 0);
        setSecurityDepositLedger(Array.isArray(dep.ledger) ? dep.ledger : []);
        if (dep.personal_available != null || dep.available_for_security != null) {
          setWalletPersonalAvailable(Number(dep.personal_available ?? dep.available_for_security) || 0);
        }
      }

      // S3: founder wallet (accepted investments → ledger credit)
      const walletIds = [String(userId)];
      if (String(currentUser?.email || user.email || '').toLowerCase() === 'ashraf.khan1@univ.edu.bd' || String(userId) === 'usr_founder_1') {
        if (!walletIds.includes('usr_founder_1')) walletIds.push('usr_founder_1');
      }
      for (const wid of walletIds) {
        const wal = await fetchJsonTimed(`${API_BASE_URL}/api/founders/${encodeURIComponent(wid)}/wallet`, 8000);
        if (wal && (Number(wal.balance) > 0 || (Array.isArray(wal.investment_inflows) && wal.investment_inflows.length > 0))) {
          setWalletBalance(Number(wal.balance) || 0);
          setWalletInEscrow(Number(wal.in_escrow) || 0);
          setWalletAvailable(Number(wal.available_to_withdraw) || 0);
          setWalletPersonalAvailable(Number(wal.personal_available ?? wal.available_for_security) || 0);
          setWalletInflows(Array.isArray(wal.investment_inflows) ? wal.investment_inflows : []);
          setWalletNote(wal.note || '');
          break;
        }
        if (wal) {
          setWalletBalance(Number(wal.balance) || 0);
          setWalletInEscrow(Number(wal.in_escrow) || 0);
          setWalletAvailable(Number(wal.available_to_withdraw) || 0);
          setWalletPersonalAvailable(Number(wal.personal_available ?? wal.available_for_security) || 0);
          setWalletInflows(Array.isArray(wal.investment_inflows) ? wal.investment_inflows : []);
          setWalletNote(wal.note || '');
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Database fetch error:', err);
      setLoading(false);
    }
  };

  // S3: reload proposals for Investors tab (does not touch InvestorDashboard)
  const reloadFounderProposals = async () => {
    const userId = currentUser?.id || currentUser?._id || user.id;
    if (!userId) return;
    const email = String(currentUser?.email || user.email || '').toLowerCase();
    const founderIds = [String(userId)];
    if (email === 'ashraf.khan1@univ.edu.bd' || String(userId) === 'usr_founder_1') {
      if (!founderIds.includes('usr_founder_1')) founderIds.push('usr_founder_1');
    }
    const fetchJsonTimed = async (url, ms = 8000) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), ms);
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      } finally {
        clearTimeout(timer);
      }
    };
    const lists = await Promise.all(
      founderIds.map((id) => fetchJsonTimed(`${API_BASE_URL}/api/proposals/founder/${encodeURIComponent(id)}`, 8000))
    );
    const byId = new Map();
    lists.forEach((list) => {
      if (!Array.isArray(list)) return;
      list.forEach((row) => {
        const id = row && (row.id || row._id);
        if (id) byId.set(String(id), row);
      });
    });
    const next = [...byId.values()];
    if (next.length > 0) {
      setProposals(next);
      setSelectedProposal((prev) => {
        if (prev && next.some((p) => (p.id || p._id) === (prev.id || prev._id))) return prev;
        return next[0];
      });
    }
  };

  useEffect(() => {
    fetchDatabaseData();

    // Socket.io real-time listener for instant notifications
    const newSocket = io(API_BASE_URL);
    const userId = currentUser?.id || currentUser?._id || user.id;

    if (userId) {
      newSocket.emit('join_room', userId);
    }

    const isAshrafSession =
      String(currentUser?.email || user.email || '').toLowerCase() === 'ashraf.khan1@univ.edu.bd' ||
      String(userId) === 'usr_founder_1';

    newSocket.on('receive_notification', (newNotif) => {
      const forMe =
        newNotif.user_id === userId ||
        newNotif.user_id === 'all' ||
        (isAshrafSession && newNotif.user_id === 'usr_founder_1');
      if (forMe) {
        setNotifications(prev => [newNotif, ...prev]);
        showToast(`🔔 ${newNotif.title}: ${newNotif.message}`, 'info');
        // S3: pull investor proposals when a new term sheet / counter lands
        const t = String(newNotif.title || '').toLowerCase();
        if (t.includes('proposal') || t.includes('counter') || t.includes('investment') || t.includes('term sheet')) {
          reloadFounderProposals();
        }
        // S3: refresh relief raised + wallet when investor donates
        if (t.includes('relief') || t.includes('donation')) {
          fetchDatabaseData();
        }
      }
    });

    newSocket.on('new_notification_broadcast', (newNotif) => {
      const forMe =
        newNotif.user_id === userId ||
        newNotif.user_id === 'all' ||
        (isAshrafSession && newNotif.user_id === 'usr_founder_1');
      if (forMe) {
        setNotifications(prev => [newNotif, ...prev]);
        const t = String(newNotif.title || '').toLowerCase();
        if (t.includes('proposal') || t.includes('counter') || t.includes('investment') || t.includes('term sheet')) {
          reloadFounderProposals();
        }
        if (t.includes('relief') || t.includes('donation')) {
          fetchDatabaseData();
        }
      }
    });

    // S3: investor donated to a relief campaign — refresh raised + wallet
    newSocket.on('relief_updated', (payload) => {
      if (!payload) return;
      fetchDatabaseData();
    });

    // S3: live chat into the open investor thread
    newSocket.on('new_direct_message', (msg) => {
      const me = String(userId);
      const other = String(chatTargetRef.current?.id || chatTargetRef.current?._id || '');
      if (!msg || !other) return;
      const s = String(msg.sender_id || '');
      const r = String(msg.receiver_id || '');
      const inThread = (s === me && r === other) || (s === other && r === me);
      if (!inThread) return;
      setChatMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // S3: refresh proposals whenever founder opens Investors
  useEffect(() => {
    if (activeTab === 'investors') reloadFounderProposals();
  }, [activeTab, currentUser]);

  // S3: refresh wallet ledger + deposit requests when Wallet tab opens
  useEffect(() => {
    if (activeTab !== 'wallet') return;
    reloadWalletDeposits();
    const userId = currentUser?.id || currentUser?._id || user.id;
    if (!userId) return;
    const ids = [String(userId)];
    if (String(currentUser?.email || user.email || '').toLowerCase() === 'ashraf.khan1@univ.edu.bd' || String(userId) === 'usr_founder_1') {
      if (!ids.includes('usr_founder_1')) ids.push('usr_founder_1');
    }
    (async () => {
      for (const wid of ids) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/founders/${encodeURIComponent(wid)}/wallet`);
          if (!res.ok) continue;
          const wal = await res.json();
          setWalletBalance(Number(wal.balance) || 0);
          setWalletInEscrow(Number(wal.in_escrow) || 0);
          setWalletAvailable(Number(wal.available_to_withdraw) || 0);
          setWalletInflows(Array.isArray(wal.investment_inflows) ? wal.investment_inflows : []);
          setWalletNote(wal.note || '');
          if (Number(wal.balance) > 0 || (Array.isArray(wal.investment_inflows) && wal.investment_inflows.length > 0)) break;
        } catch {
          /* keep prior wallet state */
        }
      }
    })();
  }, [activeTab, currentUser]);

  // S3: only admin-approved / live campaigns count for money totals, %, investments
  const isApprovedCampaign = (c) =>
    !!(c && (c.verified === true || ['verified', 'open', 'live'].includes(String(c.status || '').toLowerCase())));

  const manageableCampaigns = campaigns.filter((c) => c.status !== 'cancelled');
  const approvedCampaigns = manageableCampaigns.filter(isApprovedCampaign);
  // Money / proposal stats: primary-owner campaigns only (co-founded still appear in My lists + milestones)
  const ownedApprovedCampaigns = approvedCampaigns.filter(isOwnerOfItem);
  // S3: relief uses the same milestone UX (work/proofs); no repayment
  const manageableReliefForMilestones = reliefDrives.filter((d) => d && String(d.status || '') !== 'cancelled');
  const isReliefProject = (p) =>
    !!(p && (p._projectKind === 'relief' || String(p.id || p._id || '').startsWith('relief_')));

  // S3: active campaign = selected (timeline) → approved → first non-cancelled (startup only)
  const activeCampaign = (() => {
    if (manageableCampaigns.length === 0) return null;
    if (timelineCampaignId && !String(timelineCampaignId).startsWith('relief_')) {
      const picked = manageableCampaigns.find((c) => (c.id || c._id) === timelineCampaignId);
      if (picked) return picked;
    }
    if (approvedCampaigns.length > 0) return approvedCampaigns[0];
    return manageableCampaigns[0];
  })();

  // S3: milestone project = startup OR relief (shared Milestone Submissions tab)
  const manageableMilestoneProjects = [
    ...manageableCampaigns.map((c) => ({ ...c, _projectKind: 'campaign' })),
    ...manageableReliefForMilestones.map((d) => ({
      ...d,
      _projectKind: 'relief',
      milestones: Array.isArray(d.milestones) ? d.milestones : []
    }))
  ];
  const activeMilestoneProject = (() => {
    if (manageableMilestoneProjects.length === 0) return null;
    if (timelineCampaignId) {
      const picked = manageableMilestoneProjects.find((p) => (p.id || p._id) === timelineCampaignId);
      if (picked) return picked;
    }
    const liveRelief = manageableMilestoneProjects.find(
      (p) => p._projectKind === 'relief' && ['open', 'verified'].includes(String(p.status || '').toLowerCase())
    );
    if (liveRelief) return liveRelief;
    if (approvedCampaigns.length > 0) {
      return manageableMilestoneProjects.find((p) => (p.id || p._id) === (approvedCampaigns[0].id || approvedCampaigns[0]._id))
        || manageableMilestoneProjects[0];
    }
    return manageableMilestoneProjects[0];
  })();

  // S3: escrow / goal aggregates — owned approved campaigns only (exclude co-founded)
  const totalEscrowRaised = ownedApprovedCampaigns.reduce((sum, c) => sum + (Number(c.raised) || 0), 0);
  const totalExpectedGoal = ownedApprovedCampaigns.reduce((sum, c) => sum + (Number(c.goal) || 0), 0);
  const escrowGoalPercent = totalExpectedGoal > 0
    ? Math.min(100, Math.round((totalEscrowRaised / totalExpectedGoal) * 100))
    : 0;

  const ownedApprovedCampaignIds = new Set(ownedApprovedCampaigns.map((c) => c.id || c._id));
  // S3: proposal counts for owned approved campaigns only
  const approvedProposals = proposals.filter((p) => {
    const cid = p.campaign_id || p.campaignId;
    if (!cid) return ownedApprovedCampaignIds.size === 0;
    return ownedApprovedCampaignIds.has(cid);
  });

  // S3: approved relief campaigns (for escrow breakdown) — owned only
  const approvedReliefCampaigns = reliefDrives.filter(
    (d) => d && isOwnerOfItem(d) && ['open', 'verified'].includes(String(d.status || '').toLowerCase())
  );
  const totalReliefRaised = approvedReliefCampaigns.reduce((sum, d) => sum + (Number(d.raised) || 0), 0);
  const totalCombinedRaised = totalEscrowRaised + totalReliefRaised;

  const handleDepositAddFromWallet = async () => {
    // S3: security deposit funded only from personal Add Money (not investment/donation credits)
    const amt = Number(depositAddAmount);
    if (!amt || amt <= 0) {
      showToast('Enter a valid deposit amount first.', 'error');
      return;
    }
    const available = Number(walletPersonalAvailable || 0);
    if (available <= 0) {
      showToast('No personal Add Money balance. Top up via Wallet → Add Money (investment credits cannot fund security).', 'error');
      return;
    }
    if (amt > available) {
      showToast(`Not enough personal top-up balance. Available for security ৳ ${available.toLocaleString()}.`, 'error');
      return;
    }
    const userId = currentUser?.id || currentUser?._id || user.id;
    try {
      const res = await fetch(`${API_BASE_URL}/api/founders/${encodeURIComponent(userId)}/security-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, source: 'personal_topup' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to transfer security deposit from personal balance');
      setSecurityDepositHeld(Number(data.amount) || 0);
      setSecurityDepositLedger(Array.isArray(data.ledger) ? data.ledger : []);
      if (data.wallet_balance != null) {
        setWalletBalance(Number(data.wallet_balance) || 0);
        setWalletAvailable(Number(data.wallet_balance) || 0);
      } else {
        setWalletBalance((prev) => Math.max(0, Number(prev || 0) - amt));
        setWalletAvailable((prev) => Math.max(0, Number(prev || 0) - amt));
      }
      if (data.personal_available != null || data.available_for_security != null) {
        setWalletPersonalAvailable(Number(data.personal_available ?? data.available_for_security) || 0);
      } else {
        setWalletPersonalAvailable((prev) => Math.max(0, Number(prev || 0) - amt));
      }
      setDepositAddAmount('');
      showToast(`৳ ${amt.toLocaleString()} transferred from personal Add Money to security deposit.`, 'success');
      recordFounderAudit({
        category: 'DEPOSIT',
        title: `Security deposit ৳ ${amt.toLocaleString()} funded from personal Add Money`,
        status: 'RECORDED'
      });
    } catch (err) {
      showToast(err.message || 'Error transferring security deposit from personal balance.', 'error');
    }
  };

  const visibleProgressUpdates = timelineCampaignId
    ? progressUpdates.filter((u) => u.campaign_id === timelineCampaignId)
    : progressUpdates;

  // Handle Proposal Status Update (Accept/Reject)
  const handleProposalStatus = async (proposalId, status) => {
    const p = proposals.find((x) => (x.id || x._id) === proposalId) || selectedProposal;
    const campId = p?.campaign_id || p?.campaignId;
    const userId = currentUser?.id || currentUser?._id || user.id;
    if (!campId) {
      showToast('This proposal is missing a campaign id.', 'error');
      return;
    }
    const ownedCamp = campaigns.find((c) => String(c.id || c._id) === String(campId));
    if (ownedCamp && !isOwnerOfItem(ownedCamp)) {
      showToast('Only the primary founder can accept or decline proposals on this campaign.', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/founder/proposals/${encodeURIComponent(proposalId)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, campaignId: campId, founderId: userId })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const label = status === 'accepted' ? 'Accepted' : 'Rejected';
        showToast(`Investor proposal ${label.toUpperCase()} successfully!`, 'success');
        recordFounderAudit({
          category: 'PROPOSAL',
          title: `${label} an investment proposal`,
          status: status === 'accepted' ? 'ACCEPTED' : 'REJECTED'
        });
        setShowNegotiateForm(false);
        if (data.proposal) {
          setSelectedProposal(data.proposal);
          setProposals((prev) => {
            const id = data.proposal.id || data.proposal._id;
            const idx = prev.findIndex((x) => (x.id || x._id) === id);
            if (idx < 0) return prev;
            const next = [...prev];
            next[idx] = { ...next[idx], ...data.proposal };
            return next;
          });
        }
        fetchDatabaseData();
      } else {
        showToast(data.error || 'Failed to update proposal status.', 'error');
      }
    } catch (err) {
      showToast('Server error updating proposal.', 'error');
    }
  };

  // S3: open Investors detail focused on reject / renegotiate
  const focusProposalAction = (p, action) => {
    if (!p) return;
    setSelectedProposal(p);
    setOverviewDetail(null);
    setActiveTab('investors');
    setInvestorPropFilter('pending');
    if (action === 'negotiate') {
      setNegotiateAmount(String(p.counter_amount || p.amount || ''));
      setNegotiateTerms(String(p.counter_terms || p.return_structure || p.terms || ''));
      setNegotiateMessage(String(p.negotiate_message || ''));
      setShowNegotiateForm(true);
    } else {
      setShowNegotiateForm(false);
    }
  };

  // S3: founder counter-offer (founder-only; investor UI unchanged)
  const openNegotiateForm = (p) => {
    const prop = p || selectedProposal;
    if (!prop) return;
    setNegotiateAmount(String(prop.counter_amount || prop.amount || ''));
    setNegotiateTerms(String(prop.counter_terms || prop.return_structure || prop.terms || ''));
    setNegotiateMessage(String(prop.negotiate_message || ''));
    setShowNegotiateForm(true);
  };

  const reloadWalletDeposits = async () => {
    const userId = currentUser?.id || currentUser?._id || user.id;
    // Only alias Ashraf's login UUID → usr_founder_1; never pull Ashraf deposits for other founders
    const ids = [String(userId)];
    const em = String(currentUser?.email || user.email || '').toLowerCase();
    if ((em === 'ashraf.khan1@univ.edu.bd' || String(userId) === 'usr_founder_1') && !ids.includes('usr_founder_1')) {
      ids.push('usr_founder_1');
    }
    for (const wid of ids) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/founders/${encodeURIComponent(wid)}/wallet/deposits`);
        if (!res.ok) continue;
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          setWalletDeposits(rows);
          return;
        }
        if (Array.isArray(rows)) setWalletDeposits(rows);
      } catch {
        /* keep */
      }
    }
  };

  const handleAddMoneySubmit = async (e) => {
    e.preventDefault();
    const userId = currentUser?.id || currentUser?._id || user.id;
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
      const res = await fetch(`${API_BASE_URL}/api/founders/${encodeURIComponent(userId)}/wallet/deposits`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to submit Add Money request.', 'error');
        return;
      }
      showToast('Add Money submitted. Admin will verify your proof before crediting.', 'success');
      recordFounderAudit({
        category: 'WALLET',
        title: `Manual Add Money ৳ ${amt.toLocaleString()} via ${addMoneyMethod}`,
        status: 'PENDING'
      });
      setShowAddMoneyModal(false);
      setAddMoneyAmount('');
      setAddMoneyReference('');
      setAddMoneyNote('');
      setAddMoneyProof(null);
      setAddMoneyMethod('bkash');
      await reloadWalletDeposits();
    } catch (err) {
      showToast('Server error submitting Add Money.', 'error');
    } finally {
      setSubmittingAddMoney(false);
    }
  };

  const handleNegotiateProposal = async () => {
    const p = selectedProposal;
    if (!p) return;
    const campId = p.campaign_id || p.campaignId;
    const userId = currentUser?.id || currentUser?._id || user.id;
    const amt = Number(negotiateAmount);
    if (!campId) {
      showToast('This proposal is missing a campaign id.', 'error');
      return;
    }
    if (!amt || amt <= 0) {
      showToast('Enter a valid counter amount.', 'error');
      return;
    }
    if (!String(negotiateTerms || '').trim()) {
      showToast('Enter counter terms.', 'error');
      return;
    }
    setNegotiatingProposal(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/founder/proposals/${encodeURIComponent(p.id || p._id)}/negotiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founderId: userId,
          campaignId: campId,
          amount: amt,
          terms: String(negotiateTerms).trim(),
          message: String(negotiateMessage || '').trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send counter-offer');
      showToast('Counter-offer sent. Investor was notified.', 'success');
      recordFounderAudit({
        category: 'PROPOSAL',
        title: `Negotiated proposal — counter ৳ ${amt.toLocaleString()}`,
        status: 'NEGOTIATING'
      });
      if (data.proposal) {
        setSelectedProposal(data.proposal);
        setProposals((prev) => {
          const id = data.proposal.id || data.proposal._id;
          const next = prev.map((row) => ((row.id || row._id) === id ? { ...row, ...data.proposal } : row));
          if (!next.some((row) => (row.id || row._id) === id)) next.unshift(data.proposal);
          return next;
        });
      }
      setShowNegotiateForm(false);
      reloadFounderProposals();
    } catch (err) {
      showToast(err.message || 'Error negotiating proposal.', 'error');
    } finally {
      setNegotiatingProposal(false);
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
    setMilestoneDrafts(defaultMilestoneDrafts());
    setCampaignForm({
      title: '',
      university: profileUser.university || user.university || '',
      category: CAMPAIGN_SECTOR_OPTIONS[0],
      stage: 'MVP Stage',
      tagline: '',
      coverPhoto: '',
      pitchVideoUrl: '',
      goal: 500000,
      durationDays: 60,
      equityOffer: '8% Revenue Share',
      description: '',
      coFounders: []
    });
    setActiveTab('campaign');
  };

  const handleOpenEditCampaign = (c) => {
    if (!c) return;
    const st = c.status || '';
    const editable = st === 'pending' || st === 'rejected' || st === 'revisions' || (!c.verified && st !== 'cancelled' && st !== 'verified');
    if (!editable && (c.verified || st === 'verified')) {
      showToast('Live approved campaigns cannot be freely edited. Contact admin if a change is required.', 'error');
      return;
    }
    setEditingCampaignId(c.id || c._id);
    setWizardStep(1);
    const ms = Array.isArray(c.milestones) && c.milestones.length > 0
      ? c.milestones.map((m) => ({ title: m.title || m.name || '', target: m.target || m.targetDate || '' }))
      : defaultMilestoneDrafts();
    setMilestoneDrafts(ms);
    setCampaignForm({
      title: c.title || '',
      university: c.university || profileUser.university || '',
      category: CAMPAIGN_SECTOR_OPTIONS.includes(c.category) ? c.category : (c.category || CAMPAIGN_SECTOR_OPTIONS[0]),
      stage: c.stage || 'MVP Stage',
      tagline: c.tagline || '',
      coverPhoto: c.cover_photo || c.coverPhoto || '',
      pitchVideoUrl: c.pitch_video_url || c.pitchVideoUrl || '',
      goal: c.goal || 500000,
      durationDays: c.durationDays || 60,
      equityOffer: c.equity_offer || c.equityOffer || '',
      description: c.description || '',
      coFounders: readCoFounders(c)
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
    const cleanMilestones = milestoneDrafts
      .map((m) => ({ title: (m.title || '').trim(), target: (m.target || '').trim() }))
      .filter((m) => m.title);
    if (cleanMilestones.length === 0) {
      showToast('Add at least one milestone (title required).', 'error');
      setWizardStep(4);
      return;
    }

    if (editingCampaignId) {
      const ok = window.confirm(
        'Editing this campaign will restart admin approval from day zero. Approval takes at most 3 days. Continue?'
      );
      if (!ok) return;
    }

    const userId = currentUser?.id || currentUser?._id || user.id;
    try {
      const payload = {
        title: campaignForm.title,
        founderId: userId,
        university: campaignForm.university || profileUser.university || 'BRAC University',
        location: 'Dhaka, Bangladesh',
        category: campaignForm.category || CAMPAIGN_SECTOR_OPTIONS[0],
        stage: campaignForm.stage || 'MVP Stage',
        goal: Number(campaignForm.goal) || 500000,
        durationDays: Number(campaignForm.durationDays) || 60,
        equityOffer: campaignForm.equityOffer || '8% Revenue Share',
        tagline: campaignForm.tagline || '',
        coverPhoto: campaignForm.coverPhoto || '',
        pitchVideoUrl: campaignForm.pitchVideoUrl || '',
        description: campaignForm.description || campaignForm.title,
        // S3: co-founders (max 3)
        coFounders: Array.isArray(campaignForm.coFounders) ? campaignForm.coFounders.slice(0, MAX_COFOUNDERS) : [],
        milestones: cleanMilestones.map((m, idx) => ({
          title: m.title,
          target: m.target || `Month ${idx + 1}`,
          status: idx === 0 ? 'pending' : 'locked'
        })),
        verified: false,
        status: 'pending',
        resetApproval: true
      };

      const res = editingCampaignId
        ? await fetch(`${API_BASE_URL}/api/campaigns/${editingCampaignId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        : await fetch(`${API_BASE_URL}/api/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, id: `cmp_${Date.now()}` })
          });

      if (res.ok) {
        showToast(
          editingCampaignId
            ? 'Campaign updated. Admin approval restarted (at most 3 days from now).'
            : 'Campaign submitted for Admin Audit & Verification! Approval takes at most 3 days.',
          'success'
        );
        recordFounderAudit({
          category: 'CAMPAIGN',
          title: editingCampaignId
            ? `Updated campaign “${campaignForm.title}”`
            : `Submitted campaign “${campaignForm.title}” for admin review`,
          status: 'PENDING'
        });
        await fetchDatabaseData();
        setCampaignsPageMode('mine');
        setActiveTab('explore');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to save campaign.', 'error');
      }
    } catch (err) {
      showToast('Error submitting campaign to server.', 'error');
    }
  };

  const handleCancelCampaign = async (campaignId) => {
    if (!campaignId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Campaign cancelled / de-listed.', 'success');
        await fetchDatabaseData();
      } else {
        showToast('Failed to cancel campaign.', 'error');
      }
    } catch (err) {
      showToast('Error cancelling campaign.', 'error');
    }
  };

  // S3: hard-delete rejected investment campaign
  const handleDeleteRejectedCampaign = async (campaignId) => {
    if (!campaignId) return;
    const ok = window.confirm('Permanently delete this rejected campaign? This cannot be undone.');
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}?hard=true`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast('Rejected campaign deleted.', 'success');
        await fetchDatabaseData();
      } else {
        showToast(data.error || 'Failed to delete campaign.', 'error');
      }
    } catch (err) {
      showToast('Error deleting campaign.', 'error');
    }
  };

  // S3: placeholder until AdminDashboard rejection-reason UI exists
  const formatRejectionReason = (item) => {
    const reason = item?.rejectionReason || item?.rejection_reason || '';
    if (String(reason).trim()) return String(reason).trim();
    return 'No rejection reason was provided.';
  };

  const pendingHandoverFor = (type, id) =>
    handoverRequests.find(
      (r) => r.status === 'pending' && r.target_type === type && String(r.target_id) === String(id)
    );

  // S3: handover responsibility — elect a co-founder as New founder (admin approves transfer)
  const openHandoverModal = (type, item) => {
    if (!item) return;
    const id = item.id || item._id;
    if (pendingHandoverFor(type, id)) {
      showToast('A handover request is already pending admin review.', 'info');
      return;
    }
    const cfs = readCoFounders(item);
    if (cfs.length === 0) {
      showToast('Add a co-founder first, then elect them as the new founder to hand over.', 'error');
      return;
    }
    setHandoverTarget({ type, item });
    setHandoverReason('');
    setHandoverNewFounderId(cfs.length === 1 ? String(cfs[0].id || '') : '');
    setHandoverProofFile(null);
    setShowHandoverModal(true);
  };

  const handleSubmitHandover = async (e) => {
    if (e) e.preventDefault();
    if (!handoverTarget?.item) return;
    const userId = currentUser?.id || currentUser?._id || user.id;
    const targetId = handoverTarget.item.id || handoverTarget.item._id;
    const cfs = readCoFounders(handoverTarget.item);
    const elected = cfs.find((cf) => String(cf.id || '') === String(handoverNewFounderId));
    if (!handoverReason.trim()) {
      showToast('Reason is required.', 'error');
      return;
    }
    if (!elected?.id) {
      showToast('Select a new founder from your co-founders.', 'error');
      return;
    }
    if (!handoverProofFile) {
      showToast('Upload proof (JPG, PNG, or PDF).', 'error');
      return;
    }
    const endpoint = handoverTarget.type === 'relief'
      ? `${API_BASE_URL}/api/relief-drives/${encodeURIComponent(targetId)}/handover-requests`
      : `${API_BASE_URL}/api/campaigns/${encodeURIComponent(targetId)}/handover-requests`;
    try {
      setSubmittingHandover(true);
      const formData = new FormData();
      formData.append('founderId', userId);
      formData.append('reason', handoverReason.trim());
      formData.append('successorId', String(elected.id));
      formData.append('successorName', elected.name || '');
      formData.append('successorEmail', elected.email || '');
      formData.append('proofFile', handoverProofFile);
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to submit handover.', 'error');
        return;
      }
      showToast(data.message || 'Handover submitted for admin approval.', 'success');
      recordFounderAudit({
        category: handoverTarget.type === 'relief' ? 'RELIEF' : 'CAMPAIGN',
        title: `Requested handover of “${handoverTarget.item.title || targetId}” to ${elected.name || 'new founder'}`,
        status: 'PENDING'
      });
      setShowHandoverModal(false);
      setHandoverTarget(null);
      await fetchDatabaseData();
    } catch {
      showToast('Error submitting handover request.', 'error');
    } finally {
      setSubmittingHandover(false);
    }
  };

  // S3: open post-approval edit request form
  const openEditRequestModal = (type, item) => {
    if (!item) return;
    const pending = editRequests.find(
      (r) => r.status === 'pending' && r.target_type === type && r.target_id === (item.id || item._id)
    );
    if (pending) {
      showToast('An edit request is already pending (admin review: at most 2 working days).', 'info');
      return;
    }
    setEditRequestTarget({ type, item });
    setEditRequestReason('');
    if (type === 'investment') {
      setEditRequestForm({
        title: item.title || '',
        tagline: item.tagline || '',
        description: item.description || '',
        goal: item.goal || 0,
        equityOffer: item.equity_offer || item.equityOffer || '',
        category: item.category || '',
        stage: item.stage || '',
        university: item.university || ''
      });
    } else {
      setEditRequestForm({
        title: item.title || '',
        cause: item.cause || '',
        beneficiary: item.beneficiary || '',
        goal: item.goal || 0,
        description: item.description || '',
        university: item.university || ''
      });
    }
    setShowEditRequestModal(true);
  };

  const handleSubmitEditRequest = async (e) => {
    if (e) e.preventDefault();
    if (!editRequestTarget?.item) return;
    if (!editRequestReason.trim()) {
      showToast('Please explain why you need to edit.', 'error');
      return;
    }
    const userId = currentUser?.id || currentUser?._id || user.id;
    const targetId = editRequestTarget.item.id || editRequestTarget.item._id;
    const url =
      editRequestTarget.type === 'relief'
        ? `${API_BASE_URL}/api/relief-drives/${targetId}/edit-requests`
        : `${API_BASE_URL}/api/campaigns/${targetId}/edit-requests`;
    setSubmittingEditRequest(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founderId: userId,
          reason: editRequestReason.trim(),
          proposedChanges: editRequestForm
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to submit edit request.', 'error');
        return;
      }
      recordFounderAudit({
        category: editRequestTarget.type === 'relief' ? 'RELIEF' : 'CAMPAIGN',
        title: `Requested post-approval edit on “${editRequestTarget.item.title || targetId}”`,
        status: 'PENDING'
      });
      showToast(data.message || 'Edit request submitted (at most 2 working days).', 'success');
      setShowEditRequestModal(false);
      setEditRequestTarget(null);
      await fetchDatabaseData();
      // S3: refresh bell after edit-request notification is created
      try {
        const notifData = await fetchJsonTimed(`${API_BASE_URL}/api/notifications?userId=${encodeURIComponent(userId)}`, 5000);
        if (Array.isArray(notifData)) setNotifications(notifData);
      } catch (_) {}
    } catch {
      showToast('Error submitting edit request.', 'error');
    } finally {
      setSubmittingEditRequest(false);
    }
  };

  const pendingEditFor = (type, id) =>
    editRequests.find((r) => r.status === 'pending' && r.target_type === type && r.target_id === id);

  // S3: milestone status helpers — done only with proof; missed auto after target window
  const hasMilestoneProof = (m) => Array.isArray(m?.proofs) && m.proofs.length > 0;

  const isPastMilestoneDeadline = (m, campaign) => {
    const target = String(m?.target || m?.targetDate || '').trim();
    if (!target) return false;
    const isoTry = Date.parse(target);
    if (!Number.isNaN(isoTry) && /\d{4}/.test(target)) {
      return Date.now() > isoTry;
    }
    // S3: Month N (startup) or Phase N (relief) — N units from submission
    const unitMatch = target.match(/(?:month|phase)\s*(\d+)/i);
    if (!unitMatch) return false;
    const units = Number(unitMatch[1]);
    if (!Number.isFinite(units) || units <= 0) return false;
    const startRaw = campaign?.submitted_at || campaign?.created_at || campaign?.createdAt;
    const start = Date.parse(startRaw || '');
    if (!start) return false;
    const deadline = new Date(start);
    deadline.setMonth(deadline.getMonth() + units);
    return Date.now() > deadline.getTime();
  };

  const getMilestoneBucket = (m, campaign = activeCampaign) => {
    const st = String(m?.status || 'pending').toLowerCase();
    const proofs = hasMilestoneProof(m);
    // S3: never show Done without proof files
    if ((st === 'done' || st === 'completed') && proofs) return 'done';
    if (st === 'missed' || st === 'failed') return 'missed';
    if (!proofs && isPastMilestoneDeadline(m, campaign)) return 'missed';
    return 'pending';
  };

  // S3: if this live campaign belongs to the logged-in founder, show their real profile name
  const watchFounderName = (c) => {
    const uid = currentUser?.id || currentUser?._id || user.id;
    const fid = c?.founder_id || c?.founderId || c?.founder?.id || c?.founder?._id;
    if (uid && fid && String(fid) === String(uid)) {
      return profileUser.name || c?.founder?.name || 'You';
    }
    return c?.founder?.name || 'Student founder';
  };

  // S3: Campaigns to Watch → real detail page (live campaign records)
  const openWatchDetail = async (c) => {
    if (!c) return;
    // S3: if a hollow seed twin was clicked, prefer the same-title record that has milestones
    let detail = c;
    const titleKey = String(c.title || '').trim().toLowerCase();
    const fid = String(c.founder_id || c.founderId || c.founder?._id || c.founder?.id || '');
    const richer = allCampaigns.find((other) => {
      if (!other || (other.id || other._id) === (c.id || c._id)) return false;
      if (String(other.title || '').trim().toLowerCase() !== titleKey) return false;
      const ofid = String(other.founder_id || other.founderId || other.founder?._id || other.founder?.id || '');
      if (fid && ofid && fid !== ofid) return false;
      const ms = Array.isArray(other.milestones) ? other.milestones.length : 0;
      const cur = Array.isArray(c.milestones) ? c.milestones.length : 0;
      return ms > cur;
    });
    if (richer) detail = richer;
    setWatchDetail(detail);
    setWatchDetailUpdates([]);
    setWatchStatPanel(null);
    setWatchDetailBackers([]);
    const id = detail.id || detail._id;
    if (!id) return;
    try {
      const qs = new URLSearchParams({ viewer: 'public' });
      const [updRes, propRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/campaigns/${encodeURIComponent(id)}/updates?${qs}`),
        fetch(`${API_BASE_URL}/api/proposals/campaign/${encodeURIComponent(id)}`)
      ]);
      if (updRes.ok) {
        const data = await updRes.json().catch(() => []);
        setWatchDetailUpdates(Array.isArray(data) ? data : []);
      } else {
        setWatchDetailUpdates([]);
      }
      if (propRes.ok) {
        const props = await propRes.json().catch(() => []);
        const accepted = (Array.isArray(props) ? props : []).filter((p) =>
          ['accepted', 'invested', 'funded'].includes(String(p.status || '').toLowerCase())
        );
        setWatchDetailBackers(accepted);
      } else {
        setWatchDetailBackers([]);
      }
    } catch {
      setWatchDetailUpdates([]);
      setWatchDetailBackers([]);
    }
  };

  const persistActiveMilestones = async (nextMilestones, successMsg, { quiet = false } = {}) => {
    const camp = activeMilestoneProject || activeCampaign;
    const campId = camp?.id || camp?._id;
    if (!campId) {
      if (!quiet) showToast('No campaign selected.', 'error');
      return false;
    }
    const endpoint = isReliefProject(camp)
      ? `${API_BASE_URL}/api/relief-drives/${campId}`
      : `${API_BASE_URL}/api/campaigns/${campId}`;
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestonesOnly: true, // S3: do not restart approval for milestone adjust
          founderId: currentUser?.id || currentUser?._id || user.id,
          milestones: nextMilestones.map((m, idx) => ({
            title: m.title || m.name || `Milestone ${idx + 1}`,
            target: m.target || m.targetDate || 'TBD',
            status: m.status || (idx === 0 ? 'pending' : 'locked'),
            proofs: Array.isArray(m.proofs) ? m.proofs : []
          }))
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!quiet) showToast(data.error || 'Failed to update milestones.', 'error');
        return false;
      }
      if (!quiet) showToast(successMsg || 'Milestones updated.', 'success');
      await fetchDatabaseData();
      return true;
    } catch {
      if (!quiet) showToast('Error updating milestones.', 'error');
      return false;
    }
  };

  // S3: redo only for missed milestones
  const handleRedoMilestone = async (idx) => {
    const project = activeMilestoneProject || activeCampaign;
    if (!project?.milestones?.[idx]) return;
    const bucket = getMilestoneBucket(project.milestones[idx]);
    if (bucket !== 'missed') {
      showToast('Only missed milestones can be redone.', 'error');
      return;
    }
    const next = project.milestones.map((m, i) => (i === idx ? { ...m, status: 'pending' } : m));
    await persistActiveMilestones(
      next,
      'Redo requested. It may take some time to update because admin approval is required.'
    );
  };

  const handleSaveMilestoneEdits = async (idx) => {
    const project = activeMilestoneProject || activeCampaign;
    if (!project?.milestones?.[idx]) return;
    if (getMilestoneBucket(project.milestones[idx]) === 'done') {
      showToast('Completed milestones cannot be edited.', 'error');
      return;
    }
    if (!milestoneEditTitle.trim()) {
      showToast('Milestone title is required.', 'error');
      return;
    }
    const next = project.milestones.map((m, i) =>
      i === idx
        ? { ...m, title: milestoneEditTitle.trim(), name: milestoneEditTitle.trim(), target: milestoneEditTarget.trim() || m.target || m.targetDate || 'TBD' }
        : m
    );
    const ok = await persistActiveMilestones(
      next,
      'Edits saved. It may take some time to update because admin approval is required.'
    );
    if (ok) setSelectedMilestoneIdx(idx);
  };

  // S3: add a new pending milestone
  const handleAddMilestone = async () => {
    const project = activeMilestoneProject || activeCampaign;
    if (!project) {
      showToast('Select a campaign first.', 'error');
      return;
    }
    const existing = Array.isArray(project.milestones) ? project.milestones : [];
    const n = existing.length + 1;
    const next = [
      ...existing,
      {
        title: `New milestone ${n}`,
        name: `New milestone ${n}`,
        target: isReliefProject(project) ? `Phase ${n}` : `Month ${n}`,
        status: 'pending',
        proofs: []
      }
    ];
    const ok = await persistActiveMilestones(
      next,
      'Milestone added. It may take some time to update because admin approval is required.'
    );
    if (ok) {
      setSelectedMilestoneIdx(next.length - 1);
      setMilestoneEditTitle(`New milestone ${n}`);
      setMilestoneEditTarget(isReliefProject(project) ? `Phase ${n}` : `Month ${n}`);
    }
  };

  // S3: delete milestone — not done, not last remaining
  const handleDeleteMilestone = async (idx) => {
    const project = activeMilestoneProject || activeCampaign;
    if (!project?.milestones?.[idx]) return;
    const list = project.milestones;
    if (list.length <= 1) {
      showToast('You must keep at least one milestone.', 'error');
      return;
    }
    if (getMilestoneBucket(list[idx]) === 'done') {
      showToast('Completed milestones cannot be deleted.', 'error');
      return;
    }
    const label = list[idx].title || list[idx].name || `Milestone #${idx + 1}`;
    const okConfirm = window.confirm(`Delete “${label}”? This cannot be undone.`);
    if (!okConfirm) return;
    const next = list.filter((_, i) => i !== idx);
    const ok = await persistActiveMilestones(
      next,
      'Milestone deleted. It may take some time to update because admin approval is required.'
    );
    if (ok) {
      setSelectedMilestoneIdx(null);
      setMilestoneEditTitle('');
      setMilestoneEditTarget('');
    }
  };

  // S3: fix false "done" without proof; auto-set missed after target window
  useEffect(() => {
    const project = activeMilestoneProject;
    if (!project?.milestones?.length) return;
    const campId = project.id || project._id;
    if (!campId) return;
    let changed = false;
    const next = project.milestones.map((m) => {
      const st = String(m.status || '').toLowerCase();
      const proofs = hasMilestoneProof(m);
      if ((st === 'done' || st === 'completed') && !proofs) {
        changed = true;
        return { ...m, status: 'pending' };
      }
      if (proofs || st === 'missed' || st === 'failed' || st === 'done' || st === 'completed') return m;
      if (isPastMilestoneDeadline(m, project)) {
        changed = true;
        return { ...m, status: 'missed' };
      }
      return m;
    });
    if (!changed) return;
    persistActiveMilestones(next, '', { quiet: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMilestoneProject?.id || activeMilestoneProject?._id, activeMilestoneProject?.milestones?.length]);

  const handleUploadVettingDocs = async () => {
    const userId = currentUser?.id || currentUser?._id || user.id;
    if (!idCardFile && !nidFile) {
      showToast('Choose a Student ID or NID file first.', 'error');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      if (idCardFile) formData.append('studentIdCardImage', idCardFile);
      if (nidFile) formData.append('nidCardImage', nidFile);
      const res = await fetch(`${API_BASE_URL}/api/users/profile/documents`, { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Upload failed.', 'error');
        return;
      }
      applyFounderProfile(data.user || {});
      persistFounderSession(data.user || {});
      setIdCardFile(null);
      setNidFile(null);
      showToast('ID documents uploaded for admin vetting.', 'success');
      recordFounderAudit({ category: 'VETTING', title: 'Uploaded Student ID / NID for admin vetting', status: 'PENDING' });
    } catch (err) {
      showToast('Error uploading documents.', 'error');
    }
  };

  const openReliefCreateForm = () => {
    setEditingReliefId(null);
    setReliefForm({ ...emptyReliefForm(), university: profileUser.university || '' });
    setShowReliefCreateForm(true);
  };

  const handleOpenEditRelief = (d) => {
    if (!d) return;
    // S3: pending edit, or reapply from rejected/cancelled
    if (!['pending', 'rejected', 'cancelled'].includes(d.status)) {
      showToast('Only pending, rejected, or cancelled relief campaigns can be edited or reapplied.', 'error');
      return;
    }
    setEditingReliefId(d.id);
    const links = Array.isArray(d.proofLinks) && d.proofLinks.length > 0
      ? d.proofLinks.map((p) => ({ type: p.type || 'Other link', url: p.url || '' }))
      : [{ type: 'Newspaper / Article', url: '' }];
    const uses = Array.isArray(d.useOfFunds) ? d.useOfFunds : [];
    setReliefForm({
      title: d.title || '',
      university: d.university || profileUser.university || '',
      cause: d.cause || 'Student Medical Aid',
      beneficiary: d.beneficiary || '',
      goal: d.goal || 100000,
      durationDays: d.durationDays || d.duration_days || 60,
      description: d.description || '',
      use1: uses[0] || '',
      use2: uses[1] || '',
      use3: uses[2] || '',
      proofLinks: links,
      coFounders: readCoFounders(d)
    });
    // S3
    setReliefMilestoneDrafts(
      Array.isArray(d.milestones) && d.milestones.length > 0
        ? d.milestones.map((m) => ({ title: m.title || m.name || '', target: m.target || m.targetDate || 'Phase' }))
        : defaultReliefMilestoneDrafts()
    );
    setShowReliefCreateForm(true);
    setReliefPageMode('mine');
  };

  const handleSaveReliefDrive = async (e) => {
    if (e) e.preventDefault();
    const userId = currentUser?.id || currentUser?._id || user.id;
    if (!reliefForm.title.trim() || !reliefForm.beneficiary.trim()) {
      showToast('Cause name and who will be helped are required.', 'error');
      return;
    }
    const proofLinks = (reliefForm.proofLinks || [])
      .map((p) => ({ type: (p.type || 'Other link').trim(), url: (p.url || '').trim() }))
      .filter((p) => p.url);
    const badUrl = proofLinks.find((p) => !/^https?:\/\//i.test(p.url));
    if (badUrl) {
      showToast('Proof links must start with http:// or https:// (no file uploads).', 'error');
      return;
    }

    if (editingReliefId) {
      const ok = window.confirm(
        'Editing this relief campaign will restart admin approval from day zero. Approval takes at most 3 days. Continue?'
      );
      if (!ok) return;
    }

    const cleanReliefMilestones = reliefMilestoneDrafts
      .map((m) => ({ title: (m.title || '').trim(), target: (m.target || '').trim() || 'Phase' }))
      .filter((m) => m.title);
    if (cleanReliefMilestones.length === 0) {
      showToast('Add at least one progress milestone so donors can see work is being done.', 'error');
      return;
    }

    const body = {
      founderId: userId,
      title: reliefForm.title.trim(),
      university: reliefForm.university || profileUser.university,
      cause: reliefForm.cause,
      beneficiary: reliefForm.beneficiary.trim(),
      goal: Number(reliefForm.goal) || 0,
      durationDays: Number(reliefForm.durationDays) || 60,
      description: reliefForm.description.trim(),
      useOfFunds: [reliefForm.use1, reliefForm.use2, reliefForm.use3].map(s => s.trim()).filter(Boolean),
      proofLinks,
      // S3: progress milestones (same idea as startup — no repayment)
      milestones: cleanReliefMilestones.map((m, idx) => ({
        title: m.title,
        target: m.target,
        status: idx === 0 ? 'pending' : 'locked',
        proofs: []
      })),
      // S3: co-founders (max 3)
      coFounders: Array.isArray(reliefForm.coFounders) ? reliefForm.coFounders.slice(0, MAX_COFOUNDERS) : []
    };

    try {
      const res = editingReliefId
        ? await fetch(`${API_BASE_URL}/api/relief-drives/${editingReliefId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          })
        : await fetch(`${API_BASE_URL}/api/relief-drives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
      if (res.ok) {
        showToast(
          editingReliefId
            ? 'Relief campaign updated. Admin approval restarted (at most 3 days from now).'
            : 'Relief campaign submitted for admin approval (at most 3 days).',
          'success'
        );
        recordFounderAudit({
          category: 'RELIEF',
          title: editingReliefId
            ? `Updated relief campaign “${reliefForm.title}”`
            : `Submitted relief campaign “${reliefForm.title}” for admin review`,
          status: 'PENDING'
        });
        setReliefForm({ ...emptyReliefForm(), university: profileUser.university || '' });
        setReliefMilestoneDrafts(defaultReliefMilestoneDrafts());
        setEditingReliefId(null);
        setShowReliefCreateForm(false);
        setReliefPageMode('mine');
        await fetchDatabaseData();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Failed to save relief campaign.', 'error');
      }
    } catch (err) {
      showToast('Error saving relief campaign.', 'error');
    }
  };

  const handleCancelReliefDrive = async (driveId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/relief-drives/${driveId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Relief campaign cancelled.', 'success');
        await fetchDatabaseData();
      }
    } catch (err) {
      showToast('Error cancelling relief campaign.', 'error');
    }
  };

  // S3: hard-delete rejected relief campaign
  const handleDeleteRejectedRelief = async (driveId) => {
    if (!driveId) return;
    const ok = window.confirm('Permanently delete this rejected relief campaign? This cannot be undone.');
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/relief-drives/${driveId}?hard=true`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast('Rejected relief campaign deleted.', 'success');
        await fetchDatabaseData();
      } else {
        showToast(data.error || 'Failed to delete relief campaign.', 'error');
      }
    } catch (err) {
      showToast('Error deleting relief campaign.', 'error');
    }
  };

  // Save Profile Info (FR-3)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const userId = currentUser?.id || currentUser?._id || user.id;
    if (!userId) {
      showToast('Cannot save profile: missing user id.', 'error');
      return;
    }
    if (!profileUser.name?.trim() || !profileUser.email?.trim() || !profileUser.university?.trim() || !profileUser.studentId?.trim() || !profileUser.mfsNumber?.trim()) {
      showToast('Name, email, university, student ID, and mobile number are required.', 'error');
      return;
    }
    if (!profileUser.email.includes('@')) {
      showToast('Enter a valid email address.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: profileUser.name.trim(),
          email: profileUser.email.trim(),
          university: profileUser.university.trim(),
          department: profileUser.department.trim(),
          studentId: profileUser.studentId.trim(),
          mfsNumber: profileUser.mfsNumber.trim(),
          bio: (profileUser.bio || '').trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to save profile.', 'error');
        return;
      }
      const saved = data.user || profileUser;
      applyFounderProfile(saved);
      persistFounderSession(saved);
      showToast('Profile information updated successfully!', 'success');
      recordFounderAudit({ category: 'PROFILE', title: 'Updated profile biodata', status: 'RECORDED' });
    } catch (err) {
      showToast('Error saving profile.', 'error');
    }
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
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // S3: trust server available after this request (subtracts all pending)
        if (data.available_to_withdraw != null) setWalletAvailable(Number(data.available_to_withdraw) || 0);
        if (data.wallet_balance != null) setWalletBalance(Number(data.wallet_balance) || 0);
        setShowPayoutModal(false);
        showToast(`Payout request of ৳ ${Number(payoutAmount).toLocaleString()} submitted to database!`, 'success');
        recordFounderAudit({
          category: 'PAYOUT',
          title: `Requested payout ৳ ${Number(payoutAmount).toLocaleString()} via ${payoutMethod}`,
          status: 'PENDING'
        });
        setPayoutAmount('');
        fetchDatabaseData();
      } else {
        showToast(data.error || 'Failed to submit payout request.', 'error');
      }
    } catch (err) {
      showToast('Error submitting payout request.', 'error');
    }
  };

  // S3: open self-fund modal for live campaign / relief
  const openSelfFundModal = (type, item) => {
    setSelfFundTarget({
      type,
      id: item.id || item._id,
      title: item.title || 'Campaign'
    });
    setSelfFundAmount('');
    setShowSelfFundModal(true);
  };

  const handleSelfFundFromWallet = async (e) => {
    e.preventDefault();
    if (!selfFundTarget?.id) return;
    const amt = Number(selfFundAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      showToast('Enter a valid amount.', 'error');
      return;
    }
    // S3: relief donations use personal Add Money only (same ring-fence as security deposit)
    if (selfFundTarget.type === 'relief') {
      const personal = Number(walletPersonalAvailable || 0);
      if (personal <= 0) {
        showToast('No personal Add Money balance. Top up via Wallet → Add Money first (investment credits cannot fund relief donations).', 'error');
        return;
      }
      if (amt > personal) {
        showToast(`Not enough personal top-up balance. Available ৳ ${personal.toLocaleString()}.`, 'error');
        return;
      }
    } else if (amt > Number(walletBalance || 0)) {
      showToast(`Not enough money in wallet. Available ৳ ${Number(walletBalance || 0).toLocaleString()}.`, 'error');
      return;
    }
    const userId = currentUser?.id || currentUser?._id || user.id;
    const path =
      selfFundTarget.type === 'relief'
        ? `${API_BASE_URL}/api/founders/${encodeURIComponent(userId)}/relief-drives/${encodeURIComponent(selfFundTarget.id)}/fund-from-wallet`
        : `${API_BASE_URL}/api/founders/${encodeURIComponent(userId)}/campaigns/${encodeURIComponent(selfFundTarget.id)}/fund-from-wallet`;
    setSubmittingSelfFund(true);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Could not fund from wallet.', 'error');
        return;
      }
      if (data.wallet_balance != null) setWalletBalance(Number(data.wallet_balance) || 0);
      if (data.personal_available != null || data.available_for_security != null) {
        setWalletPersonalAvailable(Number(data.personal_available ?? data.available_for_security) || 0);
      } else if (selfFundTarget.type === 'relief') {
        setWalletPersonalAvailable((prev) => Math.max(0, Number(prev || 0) - amt));
      }
      setShowSelfFundModal(false);
      setSelfFundTarget(null);
      setSelfFundAmount('');
      showToast(
        selfFundTarget.type === 'relief'
          ? `Donated ৳ ${amt.toLocaleString()} from personal Add Money to “${selfFundTarget.title}”.`
          : `Moved ৳ ${amt.toLocaleString()} from wallet into “${selfFundTarget.title}” (founder self-funding).`,
        'success'
      );
      recordFounderAudit({
        category: selfFundTarget.type === 'relief' ? 'RELIEF' : 'CAMPAIGN',
        title: selfFundTarget.type === 'relief'
          ? `Donated ৳ ${amt.toLocaleString()} (personal Add Money) to ${selfFundTarget.title}`
          : `Self-funded ৳ ${amt.toLocaleString()} into ${selfFundTarget.title}`,
        status: 'RECORDED'
      });
      fetchDatabaseData();
    } catch (err) {
      showToast('Server error funding from wallet.', 'error');
    } finally {
      setSubmittingSelfFund(false);
    }
  };

  // S3: collapsible fixed-height scroll panel for long histories / multi-entry lists
  const ScrollHistoryPanel = ({
    title,
    count,
    open,
    onToggle,
    emptyText,
    children,
    accent = 'slate',
    maxHeightClass = 'max-h-44'
  }) => {
    const border = accent === 'rose' ? 'border-rose-100' : accent === 'emerald' ? 'border-emerald-100' : 'border-slate-200';
    const btn = accent === 'rose'
      ? 'bg-rose-50 text-rose-900 hover:bg-rose-100'
      : accent === 'emerald'
        ? 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
        : 'bg-slate-50 text-slate-800 hover:bg-slate-100';
    return (
      <div className={`rounded-xl border ${border} overflow-hidden`}>
        <button
          type="button"
          onClick={onToggle}
          className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold cursor-pointer ${btn}`}
        >
          <span>{title}{typeof count === 'number' ? ` (${count})` : ''}</span>
          <span className="text-[10px] font-mono uppercase tracking-wide opacity-70">{open ? 'Hide ▲' : 'Show ▼'}</span>
        </button>
        {open && (
          <div className={`${maxHeightClass} overflow-y-auto overscroll-contain px-3 py-2 space-y-1.5 bg-white border-t border-slate-100`}>
            {count === 0 ? (
              <p className="text-[11px] text-slate-500 py-1">{emptyText || 'No history yet.'}</p>
            ) : children}
          </div>
        )}
      </div>
    );
  };

  // S3: collapsible card — header toggles; when collapsed the header is the whole visible card
  const WalletCollapsibleSection = ({
    title,
    count,
    open,
    onToggle,
    emptyText,
    children,
    maxHeightClass = 'max-h-64',
    subtitle,
    scrollBody = true,
    accent = 'emerald'
  }) => {
    const onKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle();
      }
    };
    const isRose = accent === 'rose';
    const openBorder = isRose ? 'border-rose-200' : 'border-emerald-200';
    const hoverBorder = isRose ? 'hover:border-rose-300' : 'hover:border-emerald-300';
    const focusRing = isRose ? 'focus-visible:ring-rose-400/50' : 'focus-visible:ring-emerald-400/50';
    const badge = isRose
      ? 'text-rose-800 bg-rose-50'
      : 'text-emerald-800 bg-emerald-50';
    return (
      <div
        className={`bg-white border rounded-2xl shadow-sm transition-all overflow-hidden ${
          open ? openBorder : `border-slate-200 ${hoverBorder} hover:shadow-md`
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          aria-expanded={!!open}
          onClick={onToggle}
          onKeyDown={onKeyDown}
          className={`w-full text-left p-5 sm:p-6 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${focusRing}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base flex flex-wrap items-center gap-2">
                <span>{title}</span>
                {typeof count === 'number' && (
                  <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${badge}`}>
                    {count}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {subtitle || (open
                  ? 'Click the header to collapse'
                  : 'Click this card to expand')}
              </p>
            </div>
            <span className={`shrink-0 text-[10px] font-mono uppercase tracking-wide px-2.5 py-1 rounded-lg pointer-events-none ${badge}`}>
              {open ? 'Hide ▲' : 'Show ▼'}
            </span>
          </div>
        </div>
        {open && (
          <div
            role="region"
            aria-label={title}
            className={`px-5 sm:px-6 pb-5 sm:pb-6 border-t border-slate-100 ${
              scrollBody
                ? `${maxHeightClass} overflow-y-auto overscroll-contain pt-3`
                : 'pt-4 space-y-4'
            }`}
          >
            {count === 0 && emptyText ? (
              <p className="text-[11px] text-slate-500 py-2">{emptyText}</p>
            ) : children}
          </div>
        )}
      </div>
    );
  };

  // S3: smarter search — token match + ranking (short queries like "camp" surface CampusBites first)
  const normalizeSearchText = (s) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s%+]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const isSubsequence = (hay, needle) => {
    if (!needle) return true;
    let i = 0;
    for (const ch of hay) {
      if (ch === needle[i]) i += 1;
      if (i >= needle.length) return true;
    }
    return false;
  };
  const searchScoreFor = (query, fields) => {
    const q = normalizeSearchText(query);
    if (!q) return 1;
    const tokens = q.split(' ').filter(Boolean);
    const normalizedFields = (fields || []).map(normalizeSearchText).filter(Boolean);
    const title = normalizedFields[0] || '';
    const blob = normalizedFields.join(' ');
    const initials = title.split(' ').filter(Boolean).map((w) => w[0]).join('');
    const tokenOk = tokens.every((t) =>
      blob.includes(t) || title.startsWith(t) || initials.startsWith(t) || isSubsequence(title.replace(/\s/g, ''), t)
    );
    if (!tokenOk) return 0;
    let score = 10;
    if (title.startsWith(q)) score += 120;
    else if (title.includes(q)) score += 70;
    tokens.forEach((t) => {
      if (title.startsWith(t)) score += 25;
      else if (title.includes(t)) score += 12;
      else if (initials.startsWith(t)) score += 8;
    });
    return score;
  };
  const matchesSearchNeedle = (...vals) => searchScoreFor(searchQuery, vals) > 0;
  const fundingBand = (raised, goal) => {
    const g = Number(goal) || 0;
    const r = Number(raised) || 0;
    if (g <= 0) return 'unknown';
    const pct = (r / g) * 100;
    if (pct >= 100) return 'full';
    if (pct >= 75) return 'high';
    if (pct >= 25) return 'mid';
    return 'low';
  };
  const amountBand = (amount) => {
    const a = Number(amount) || 0;
    if (a >= 200000) return 'high';
    if (a >= 50000) return 'mid';
    return 'low';
  };
  const uniqueSorted = (arr) => [...new Set(arr.filter(Boolean).map((x) => String(x).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const campaignUniversityOptions = uniqueSorted([
    ...allCampaigns.map((c) => c.university),
    ...campaigns.map((c) => c.university)
  ]);
  const campaignStageOptions = uniqueSorted([
    ...allCampaigns.map((c) => c.stage),
    ...campaigns.map((c) => c.stage)
  ]);
  const coFounderPickerOptions = platformFounders
    .filter((f) => {
      const fid = String(f.id || f._id || '');
      const fem = String(f.email || '').toLowerCase();
      return fid && fid !== myFounderId && fem !== myFounderEmail;
    })
    .slice()
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

  const resolveFounderBio = (founderObj, founderIdHint) => {
    const fid = String(founderIdHint || founderObj?.id || founderObj?._id || '');
    const dir = platformFounders.find((f) => String(f.id || f._id) === fid) || {};
    if (fid && fid === myFounderId) {
      return founderObj?.bio || dir.bio || profileUser?.bio || user?.bio || founderObj?.about || '';
    }
    return founderObj?.bio || dir.bio || founderObj?.about || '';
  };

  const pendingCoFounderAppsFor = (type, targetId) =>
    coFounderApps.filter(
      (a) => a.status === 'pending' && a.target_type === type && String(a.target_id) === String(targetId)
    );

  const openCoFounderApply = (type, item) => {
    setCoFounderApplyTarget({ type, item });
    setCoFounderApplyReason('');
    setShowCoFounderApplyModal(true);
  };

  const submitCoFounderApply = async () => {
    if (!coFounderApplyTarget?.item) return;
    const reason = coFounderApplyReason.trim();
    if (!reason) {
      showToast('Please write a short reason for your application.', 'error');
      return;
    }
    const tid = coFounderApplyTarget.item.id || coFounderApplyTarget.item._id;
    const path = coFounderApplyTarget.type === 'relief'
      ? `${API_BASE_URL}/api/relief-drives/${tid}/cofounder-applications`
      : `${API_BASE_URL}/api/campaigns/${tid}/cofounder-applications`;
    setSubmittingCoFounderApply(true);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId: myFounderId, reason })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Could not submit co-founder application.', 'error');
        return;
      }
      showToast('Co-founder application sent to the primary founder.', 'success');
      setShowCoFounderApplyModal(false);
      setCoFounderApplyTarget(null);
      setCoFounderApplyReason('');
    } catch (err) {
      showToast(err.message || 'Could not submit co-founder application.', 'error');
    } finally {
      setSubmittingCoFounderApply(false);
    }
  };

  const reviewCoFounderApp = async (app, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cofounder-applications/${app.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ownerId: myFounderId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Could not update application.', 'error');
        return;
      }
      setCoFounderApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, status } : a)));
      if (status === 'accepted' && Array.isArray(data.coFounders)) {
        if (app.target_type === 'relief') {
          setReliefDrives((prev) => prev.map((d) =>
            String(d.id || d._id) === String(app.target_id)
              ? { ...d, coFounders: data.coFounders, co_founders: data.coFounders }
              : d
          ));
          setPublicReliefCampaigns((prev) => prev.map((d) =>
            String(d.id || d._id) === String(app.target_id)
              ? { ...d, coFounders: data.coFounders, co_founders: data.coFounders }
              : d
          ));
        } else {
          setCampaigns((prev) => prev.map((c) =>
            String(c.id || c._id) === String(app.target_id)
              ? { ...c, coFounders: data.coFounders, co_founders: data.coFounders }
              : c
          ));
          setAllCampaigns((prev) => prev.map((c) =>
            String(c.id || c._id) === String(app.target_id)
              ? { ...c, coFounders: data.coFounders, co_founders: data.coFounders }
              : c
          ));
        }
      }
      showToast(status === 'accepted' ? 'Co-founder accepted.' : 'Application declined.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not update application.', 'error');
    }
  };

  const submitRemoveCoFounder = async () => {
    if (!removeCoFounderTarget?.item || !removeCoFounderTarget?.cofounder) return;
    const message = removeCoFounderMessage.trim();
    if (!message) {
      showToast('Please include a message for the removed co-founder.', 'error');
      return;
    }
    const tid = removeCoFounderTarget.item.id || removeCoFounderTarget.item._id;
    const uid = removeCoFounderTarget.cofounder.id || removeCoFounderTarget.cofounder._id;
    const path = removeCoFounderTarget.type === 'relief'
      ? `${API_BASE_URL}/api/relief-drives/${tid}/cofounders/${uid}/remove`
      : `${API_BASE_URL}/api/campaigns/${tid}/cofounders/${uid}/remove`;
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: myFounderId, message })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Could not remove co-founder.', 'error');
        return;
      }
      const next = Array.isArray(data.coFounders) ? data.coFounders : [];
      if (removeCoFounderTarget.type === 'relief') {
        setReliefDrives((prev) => prev.map((d) =>
          String(d.id || d._id) === String(tid) ? { ...d, coFounders: next, co_founders: next } : d
        ));
      } else {
        setCampaigns((prev) => prev.map((c) =>
          String(c.id || c._id) === String(tid) ? { ...c, coFounders: next, co_founders: next } : c
        ));
      }
      showToast('Co-founder removed. They will see your message in notifications.', 'success');
      setShowRemoveCoFounderModal(false);
      setRemoveCoFounderTarget(null);
      setRemoveCoFounderMessage('');
    } catch (err) {
      showToast(err.message || 'Could not remove co-founder.', 'error');
    }
  };
  const reliefUniversityOptions = uniqueSorted([
    ...publicReliefCampaigns.map((d) => d.university),
    ...reliefDrives.map((d) => d.university)
  ]);
  const reliefCauseOptions = uniqueSorted([
    ...publicReliefCampaigns.map((d) => d.cause),
    ...reliefDrives.map((d) => d.cause)
  ]);
  const investorUniversityOptions = uniqueSorted(
    investorsList.map((i) => i.university || i.institution)
  );
  const investorCampaignOptions = uniqueSorted([
    ...campaigns.map((c) => c.title),
    ...reliefDrives.map((d) => d.title),
    ...proposals.map((p) => p.campaign_title)
  ]);
  const FilterSelect = ({ label, value, onChange, options }) => (
    <label className="flex flex-col gap-1 min-w-[8.5rem]">
      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wide">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
  const activeFilterCount = (filters) =>
    Object.values(filters || {}).filter((v) => v != null && String(v) !== 'all').length;
  // S3: Filters card — wallet-style: clickable header toggles; controls stay in the body
  const FilterBar = ({ activeCount, onReset, open, onToggle, children, footer }) => {
    const onKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle();
      }
    };
    return (
      <div
        className={`bg-white border rounded-2xl shadow-sm transition-all overflow-hidden ${
          open ? 'border-emerald-200' : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          aria-expanded={!!open}
          onClick={onToggle}
          onKeyDown={onKeyDown}
          className="w-full text-left p-4 sm:p-5 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400/50"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm flex flex-wrap items-center gap-2">
                <Filter className={`w-3.5 h-3.5 ${open ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Filters</span>
                {activeCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {activeCount} active
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {open
                  ? 'Click the header to collapse · adjust filters below'
                  : 'Click this card to expand filters'}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-mono uppercase tracking-wide text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg pointer-events-none">
              {open ? 'Hide ▲' : 'Show ▼'}
            </span>
          </div>
        </div>
        {open && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-end gap-3">
              {children}
              {typeof onReset === 'function' && (
                <button
                  type="button"
                  onClick={onReset}
                  className="px-3 py-2 text-[11px] font-semibold bg-[#047857] hover:bg-[#065f46] text-white border border-transparent rounded-xl cursor-pointer shrink-0"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
        {footer ? (
          <div className={`px-4 sm:px-5 pb-4 ${open ? 'pt-0' : 'border-t border-slate-50 pt-3'}`}>
            {footer}
          </div>
        ) : null}
      </div>
    );
  };
  const auditTimeRangeMs = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  };
  const auditTimeRangeOptions = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last week' },
    { value: '30d', label: 'Last month' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' }
  ];

  // Publish Progress Announcement (FR-8)
  const handlePublishAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      showToast('Please fill out the announcement title and narrative content.', 'error');
      return;
    }

    const campId = announcementCampaignId || (campaigns[0] && (campaigns[0].id || campaigns[0]._id));
    const userId = currentUser?.id || currentUser?._id || user.id;
    if (!campId) {
      showToast('Create a campaign before publishing a progress update.', 'error');
      return;
    }
    if (!userId) {
      showToast('Cannot publish: missing founder id.', 'error');
      return;
    }

    const owned = campaigns.some((c) => (c.id || c._id) === campId);
    if (!owned) {
      showToast('Select one of your own campaigns.', 'error');
      return;
    }

    try {
      setPublishingUpdate(true);
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${encodeURIComponent(campId)}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founderId: userId,
          title: announcementTitle.trim(),
          content: announcementContent.trim(),
          milestoneTag: announcementTag
        })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const camp = campaigns.find((c) => (c.id || c._id) === campId);
        recordFounderAudit({
          category: 'PROGRESS',
          title: `Posted progress update “${announcementTitle.trim()}”`,
          status: 'PENDING'
        });
        const saved = {
          ...data,
          campaign_id: data.campaign_id || campId,
          campaignTitle: camp?.title || 'Campaign'
        };
        setProgressUpdates((prev) => [saved, ...prev.filter((u) => u.id !== saved.id)]);
        setTimelineCampaignId(campId);
        setShowAnnouncementModal(false);
        setAnnouncementTitle('');
        setAnnouncementContent('');
        showToast('Progress update submitted for admin approval.', 'success');
        await loadProgressUpdates(campaigns);
        // S3: refresh bell — backend creates founder + admin notifications on publish
        try {
          const notifData = await fetchJsonTimed(`${API_BASE_URL}/api/notifications?userId=${encodeURIComponent(userId)}`, 5000);
          if (Array.isArray(notifData)) setNotifications(notifData);
        } catch (_) {}
      } else {
        showToast(data.error || 'Failed to publish announcement update.', 'error');
      }
    } catch (err) {
      showToast('Error publishing progress announcement.', 'error');
    } finally {
      setPublishingUpdate(false);
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

  // S3: Campaigns to Watch — ranked search + filters (status/category/stage/funding/university)
  const filteredAllCampaigns = allCampaigns
    .map((c) => {
      const score = searchScoreFor(searchQuery, [
        c.title, c.university, c.founder?.name, c.tagline, c.category, c.stage, c.description
      ]);
      return { c, score };
    })
    .filter(({ c, score }) => {
      if (score <= 0) return false;
      const st = String(c.status || (c.verified ? 'verified' : 'pending')).toLowerCase();
      const statusOk =
        campaignFilters.status === 'all' ||
        (campaignFilters.status === 'live' && (c.verified === true || st === 'verified' || st === 'open' || st === 'live')) ||
        (campaignFilters.status === 'pending' && (st === 'pending' || st === 'revisions')) ||
        (campaignFilters.status === 'rejected' && (st === 'rejected' || st === 'cancelled')) ||
        (campaignFilters.status === 'paused' && (st === 'funding_paused' || st === 'paused'));
      const cat = String(c.category || '').toLowerCase();
      const selCat = String(campaignFilters.category || 'all').toLowerCase();
      const categoryOk = selCat === 'all' || cat === selCat;
      const stageOk =
        campaignFilters.stage === 'all' ||
        String(c.stage || '').toLowerCase() === String(campaignFilters.stage).toLowerCase() ||
        String(c.stage || '').toLowerCase().includes(String(campaignFilters.stage).toLowerCase());
      const band = fundingBand(c.raised, c.goal);
      const fundingOk = campaignFilters.funding === 'all' || band === campaignFilters.funding;
      const uniOk =
        campaignFilters.university === 'all' ||
        String(c.university || '').toLowerCase() === String(campaignFilters.university).toLowerCase();
      return statusOk && categoryOk && stageOk && fundingOk && uniOk;
    })
    .sort((a, b) => b.score - a.score || String(a.c.title || '').localeCompare(String(b.c.title || '')))
    .map(({ c }) => c);

  // S3: My Campaigns list also respects header search + same filter set
  const filteredMyCampaigns = campaigns
    .map((c) => ({
      c,
      score: searchScoreFor(searchQuery, [c.title, c.university, c.category, c.status, c.tagline, c.stage, c.description])
    }))
    .filter(({ c, score }) => {
      if (score <= 0) return false;
      const st = String(c.status || (c.verified ? 'verified' : 'pending')).toLowerCase();
      const statusOk =
        campaignFilters.status === 'all' ||
        (campaignFilters.status === 'live' && (c.verified === true || st === 'verified' || st === 'open' || st === 'live')) ||
        (campaignFilters.status === 'pending' && (st === 'pending' || st === 'revisions')) ||
        (campaignFilters.status === 'rejected' && (st === 'rejected' || st === 'cancelled')) ||
        (campaignFilters.status === 'paused' && (st === 'funding_paused' || st === 'paused'));
      const cat = String(c.category || '').toLowerCase();
      const selCat = String(campaignFilters.category || 'all').toLowerCase();
      const categoryOk = selCat === 'all' || cat === selCat;
      const stageOk =
        campaignFilters.stage === 'all' ||
        String(c.stage || '').toLowerCase().includes(String(campaignFilters.stage).toLowerCase());
      const fundingOk = campaignFilters.funding === 'all' || fundingBand(c.raised, c.goal) === campaignFilters.funding;
      const uniOk =
        campaignFilters.university === 'all' ||
        String(c.university || '').toLowerCase() === String(campaignFilters.university).toLowerCase();
      return statusOk && categoryOk && stageOk && fundingOk && uniOk;
    })
    .sort((a, b) => b.score - a.score)
    .map(({ c }) => c);

  // S3: Campaigns to Watch marketplace pulse (live list currently shown — not Overview personal escrow)
  const watchMarketWanted = filteredAllCampaigns.reduce((s, c) => s + (Number(c.goal) || 0), 0);
  const watchMarketInvested = filteredAllCampaigns.reduce((s, c) => s + (Number(c.raised) || 0), 0);
  const watchMarketPct = watchMarketWanted > 0
    ? Math.min(100, Math.round((watchMarketInvested / watchMarketWanted) * 100))
    : 0;

  const reliefPassesFilters = (d) => {
    const st = String(d.status || '').toLowerCase();
    const statusOk =
      reliefFilters.status === 'all' ||
      (reliefFilters.status === 'open' && (st === 'open' || st === 'verified')) ||
      (reliefFilters.status === 'pending' && st === 'pending') ||
      (reliefFilters.status === 'rejected' && (st === 'rejected' || st === 'cancelled'));
    const causeOk =
      reliefFilters.cause === 'all' ||
      String(d.cause || '').toLowerCase() === String(reliefFilters.cause).toLowerCase();
    const fundingOk = reliefFilters.funding === 'all' || fundingBand(d.raised, d.goal) === reliefFilters.funding;
    const hasDonations = Array.isArray(d.donations) && d.donations.length > 0;
    const activityOk =
      reliefFilters.activity === 'all' ||
      (reliefFilters.activity === 'has' && hasDonations) ||
      (reliefFilters.activity === 'none' && !hasDonations);
    const uniOk =
      reliefFilters.university === 'all' ||
      String(d.university || '').toLowerCase() === String(reliefFilters.university).toLowerCase();
    return statusOk && causeOk && fundingOk && activityOk && uniOk;
  };
  const filteredPublicRelief = publicReliefCampaigns
    .map((d) => ({ d, score: searchScoreFor(searchQuery, [d.title, d.university, d.cause, d.beneficiary, d.description]) }))
    .filter(({ d, score }) => score > 0 && reliefPassesFilters(d))
    .sort((a, b) => b.score - a.score)
    .map(({ d }) => d);
  const filteredMyRelief = reliefDrives
    .map((d) => ({ d, score: searchScoreFor(searchQuery, [d.title, d.university, d.cause, d.beneficiary, d.description, d.status]) }))
    .filter(({ d, score }) => score > 0 && reliefPassesFilters(d))
    .sort((a, b) => b.score - a.score)
    .map(({ d }) => d);

  const filteredProposals = proposals.filter((p) =>
    matchesSearchNeedle(p.investor_name, p.return_structure, p.terms, p.status, p.amount, p.campaign_title)
  );
  const directoryInvestors = investorsList.filter((inv) => {
    if (!matchesSearchNeedle(inv.name, inv.institution, inv.university, inv.email, inv.bio, inv.affiliationStatus, inv.designation)) {
      return false;
    }
    const uni = String(inv.university || inv.institution || '');
    const uniOk =
      directoryFilters.university === 'all' ||
      uni.toLowerCase() === String(directoryFilters.university).toLowerCase();
    const affRaw = String(inv.affiliationStatus || inv.affiliation_status || inv.designation || '').toLowerCase();
    const affiliationOk =
      directoryFilters.affiliation === 'all' ||
      (directoryFilters.affiliation === 'alumni' && affRaw.includes('alumni')) ||
      (directoryFilters.affiliation === 'firm' && (affRaw.includes('firm') || affRaw.includes('partner') || affRaw.includes('vc'))) ||
      (directoryFilters.affiliation === 'angel' && affRaw.includes('angel'));
    return uniOk && affiliationOk;
  });
  const investorTabProposals = filteredProposals.filter((p) => {
    const st = String(p.status || 'pending').toLowerCase();
    const quick = investorPropFilter;
    if (quick === 'pending' && !(st === 'pending' || st === 'negotiating')) return false;
    if (quick === 'accepted' && st !== 'accepted') return false;
    if (quick === 'declined' && !(st === 'declined' || st === 'rejected')) return false;
    const statusSel = proposalListFilters.proposalStatus;
    if (statusSel !== 'all') {
      if (statusSel === 'pending' && !(st === 'pending')) return false;
      if (statusSel === 'negotiating' && st !== 'negotiating') return false;
      if (statusSel === 'accepted' && st !== 'accepted') return false;
      if (statusSel === 'declined' && !(st === 'declined' || st === 'rejected')) return false;
    }
    if (proposalListFilters.amount !== 'all' && amountBand(p.amount) !== proposalListFilters.amount) return false;
    if (
      proposalListFilters.campaign !== 'all' &&
      String(p.campaign_title || '').toLowerCase() !== String(proposalListFilters.campaign).toLowerCase()
    ) return false;
    return true;
  });
  const pendingProposalCount = proposals.filter((p) => String(p.status || 'pending').toLowerCase() === 'pending').length;
  const acceptedProposalsList = proposals.filter((p) => String(p.status || '').toLowerCase() === 'accepted');
  const acceptedProposalCount = acceptedProposalsList.length;
  const acceptedProposalRaised = acceptedProposalsList.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  // S3: Who invested/donated — accepted startup proposals + external relief donors (no founder self-fund)
  const whoInvestedOrDonatedAll = (() => {
    const founderKey = String(currentUser?.id || currentUser?._id || user.id || '');
    const items = [];
    acceptedProposalsList.forEach((p) => {
      const camp = campaigns.find((c) => (c.id || c._id) === (p.campaign_id || p.campaignId));
      items.push({
        kind: 'investment',
        id: `inv-${p.id || p._id}`,
        name: p.investor_name || p.investorName || 'Investor',
        amount: Number(p.amount || 0),
        campaignTitle: p.campaign_title || camp?.title || 'Startup campaign',
        subtitle: p.return_structure || p.terms || 'Terms',
        created_at: p.updated_at || p.created_at || p.accepted_at || '',
        proposal: p
      });
    });
    const donorAgg = new Map();
    reliefDrives.forEach((d) => {
      const driveTitle = d.title || 'Relief campaign';
      const driveId = d.id || d._id;
      (Array.isArray(d.donations) ? d.donations : []).forEach((don) => {
        const donorId = String(don.investor_id || don.donor_id || don.investor_name || don.donor_name || '');
        if (!donorId) return;
        // S3: external donors only — skip founder self-entries if ever tagged
        if (founderKey && donorId === founderKey) return;
        const key = `${donorId}::${driveId}`;
        const prev = donorAgg.get(key);
        const amt = Number(don.amount || 0);
        if (prev) {
          prev.amount += amt;
          if (don.created_at && (!prev.created_at || new Date(don.created_at) > new Date(prev.created_at))) {
            prev.created_at = don.created_at;
          }
        } else {
          donorAgg.set(key, {
            kind: 'donation',
            id: `don-${key}`,
            name: don.investor_name || don.donor_name || 'Donor',
            amount: amt,
            campaignTitle: driveTitle,
            subtitle: 'Donation',
            created_at: don.created_at || '',
            driveId,
            donorId
          });
        }
      });
    });
    items.push(...donorAgg.values());
    items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return items;
  })();
  const whoInvestedOrDonated = whoInvestedOrDonatedAll.filter((row) => {
    if (whoInvestedFilters.roleType === 'investment' && row.kind !== 'investment') return false;
    if (whoInvestedFilters.roleType === 'donation' && row.kind !== 'donation') return false;
    if (whoInvestedFilters.amount !== 'all' && amountBand(row.amount) !== whoInvestedFilters.amount) return false;
    if (
      whoInvestedFilters.campaign !== 'all' &&
      String(row.campaignTitle || '').toLowerCase() !== String(whoInvestedFilters.campaign).toLowerCase()
    ) return false;
    return matchesSearchNeedle(row.name, row.campaignTitle, row.subtitle, row.amount);
  });
  const reliefDonatedRaised = whoInvestedOrDonatedAll
    .filter((x) => x.kind === 'donation')
    .reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const investedOrDonatedTotal = acceptedProposalRaised + reliefDonatedRaised;
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!matchesSearchNeedle(log.category, log.title, log.status, log.hash, log.created_at)) return false;
    if (auditTimeRange === 'all') return true;
    const t = new Date(log.created_at).getTime();
    if (!Number.isFinite(t)) return false;
    const windowMs = auditTimeRangeMs[auditTimeRange];
    if (!windowMs) return true;
    return t >= Date.now() - windowMs;
  });
  // S3: Overview header search (ranked)
  const overviewCampaigns = campaigns
    .map((c) => ({ c, score: searchScoreFor(searchQuery, [c.title, c.university, c.category, c.status, c.tagline]) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ c }) => c);
  const overviewTimelineUpdates = visibleProgressUpdates
    .map((u) => ({ u, score: searchScoreFor(searchQuery, [u.title, u.content, u.milestone_tag, u.milestoneTag, u.campaignTitle]) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ u }) => u);
  // S3: Overview backers = accepted proposals on this founder’s campaigns (not the platform directory)
  const overviewBackers = (() => {
    const seen = new Set();
    const list = [];
    approvedProposals
      .filter((p) => String(p.status || '').toLowerCase() === 'accepted')
      .forEach((p) => {
        const id = String(p.investor_id || p.investorId || p.investor_name || p.investorName || '');
        if (!id || seen.has(id)) return;
        seen.add(id);
        const match = investorsList.find(
          (i) =>
            String(i.id || i._id) === String(p.investor_id || p.investorId) ||
            (i.name && p.investor_name && i.name === p.investor_name)
        );
        const camp = approvedCampaigns.find((c) => (c.id || c._id) === (p.campaign_id || p.campaignId));
        list.push({
          id,
          name: (match && (match.name || match.institution)) || p.investor_name || p.investorName || 'Investor',
          amount: Number(p.amount || 0),
          campaignTitle: camp?.title || p.campaign_id || '',
          proposal: p
        });
      });
    return list;
  })();
  const filteredOverviewBackers = overviewBackers.filter((i) =>
    matchesSearchNeedle(i.name, i.campaignTitle, i.amount)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex antialiased">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-[#047857] text-white' : 'bg-slate-800 text-white'
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
              onClick={() => {
                setCampaignsPageMode('watch');
                setWatchDetail(null); // S3
                setActiveTab('explore');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'explore'
                  ? 'bg-[#DCFCE7] text-[#15803D] font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
            >
              <Compass className="w-4.5 h-4.5" />
              <span>Campaigns</span>
            </button>

            <button
              onClick={() => {
                setReliefForm(prev => ({ ...prev, university: profileUser.university || prev.university }));
                setReliefPageMode('watch');
                setShowReliefCreateForm(false);
                setActiveTab('relief');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'relief'
                  ? 'bg-[#DCFCE7] text-[#15803D] font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
            >
              <Heart className="w-4.5 h-4.5" />
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
        <div className="space-y-1 pt-6 border-t border-slate-200">
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
                    activeTab === 'relief' ? 'Search relief campaigns...' :
                      activeTab === 'milestones' ? 'Search milestones...' :
                        activeTab === 'audit' ? 'Search hash or log...' :
                          'Search my campaigns & updates...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100/80 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Right User Bar */}
          <div className="flex items-center gap-3 relative">
            {/* Direct Messages & Chat Drawer Trigger */}
            <button
              type="button"
              onClick={() => {
                const targetInv = whoInvestedOrDonated[0] || approvedProposals[0] || { id: 'usr_investor_1', name: 'Javeria Doe (Investor)' };
                openChatWithInvestor({
                  id: targetInv.investor_id || targetInv.investorId || targetInv.id || 'usr_investor_1',
                  name: targetInv.investor_name || targetInv.investorName || targetInv.name || 'Javeria Doe (Investor)'
                });
              }}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Open Direct Messages with Investor"
            >
              <MessageSquare className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-fadeIn text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-bold text-slate-900">System Notifications</h4>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {notifications.filter(n => !n.is_read).length} Unread
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
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
                            !n.is_read ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-100 opacity-75'
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

        {/* Frozen Account ID Banner (Active Complaint Filed) */}
        {(profileUser.vettingStatus === 'frozen' || profileUser.vetting_status === 'frozen') && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-900 px-8 py-3 flex items-center justify-between text-xs font-medium sticky top-16 z-15 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Account ID Frozen:</strong> An active complaint has been reported regarding this account. Your account ID, tranche withdrawals, and campaign escrow operations are temporarily frozen pending administrative decision.
              </span>
            </div>
            <span className="bg-rose-200 text-rose-900 text-[10px] font-bold px-2.5 py-1 rounded font-mono uppercase tracking-wide">
              FROZEN (PENDING DECISION)
            </span>
          </div>
        )}

        {/* Pending Vetting Status Banner */}
        {(profileUser.vettingStatus === 'pending' || profileUser.vetting_status === 'pending') && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 px-8 py-2.5 flex items-center justify-between text-xs font-medium sticky top-16 z-15">
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
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">My Workspace</h1>
                  </div>

                  {/* S3: Overview detail panels from metric cards */}
                  {overviewDetail === 'escrow' && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">Funding raised breakdown</h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Approved startup campaigns + approved relief campaigns. Combined raised: ৳ {totalCombinedRaised.toLocaleString()}
                          </p>
                        </div>
                        <button type="button" onClick={() => setOverviewDetail(null)} className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer">
                          ← Back to Overview
                        </button>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-800">Investment campaigns</h3>
                        {approvedCampaigns.length > 0 ? approvedCampaigns.map((c) => (
                          <div key={c.id || c._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap justify-between gap-2 text-xs">
                            <div>
                              <p className="font-bold text-slate-900">{c.title}</p>
                              <p className="text-slate-500">{c.status || (c.verified ? 'verified' : 'live')}</p>
                            </div>
                            <div className="font-mono text-right">
                              <p className="text-emerald-700 font-bold">Raised ৳ {Number(c.raised || 0).toLocaleString()}</p>
                              <p className="text-slate-500">Goal ৳ {Number(c.goal || 0).toLocaleString()}</p>
                            </div>
                          </div>
                        )) : (
                          <p className="text-xs text-slate-500">No approved investment campaigns yet.</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-800">Relief campaigns</h3>
                        {approvedReliefCampaigns.length > 0 ? approvedReliefCampaigns.map((d) => (
                          <div key={d.id} className="p-4 bg-rose-50/40 border border-rose-100 rounded-xl flex flex-wrap justify-between gap-2 text-xs">
                            <div>
                              <p className="font-bold text-slate-900">{d.title}</p>
                              <p className="text-slate-500">{d.cause} · {d.status}</p>
                            </div>
                            <div className="font-mono text-right">
                              <p className="text-emerald-700 font-bold">Raised ৳ {Number(d.raised || 0).toLocaleString()}</p>
                              <p className="text-slate-500">Goal ৳ {Number(d.goal || 0).toLocaleString()}</p>
                            </div>
                          </div>
                        )) : (
                          <p className="text-xs text-slate-500">No approved relief campaigns yet.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {overviewDetail === 'deposit' && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">Security deposit</h2>
                          <p className="text-xs text-slate-500 mt-0.5">Good-faith bond held by the platform</p>
                        </div>
                        <button type="button" onClick={() => setOverviewDetail(null)} className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer">
                          ← Back to Overview
                        </button>
                      </div>
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-950 space-y-2">
                        <p className="font-semibold">What is this?</p>
                        <p>
                          A security deposit is money you put up as a <strong>good-faith bond</strong>. It shows commitment and can be held until milestones are verified.
                          It is usually refundable when milestones complete successfully. <strong>Only your personal Add Money top-ups</strong> can fund this bond — investment and donation credits in the wallet cannot be used as security.
                        </p>
                        <p className="font-mono text-sm font-bold">Currently held: ৳ {Number(securityDepositHeld || 0).toLocaleString()}</p>
                        <p className="font-mono text-sm font-bold text-sky-900">Personal (Add Money) available for security: ৳ {Number(walletPersonalAvailable || 0).toLocaleString()}</p>
                        <p className="font-mono text-[11px] text-slate-600">Total wallet (incl. investments): ৳ {Number(walletBalance || 0).toLocaleString()}</p>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-700 block">Amount to transfer from personal Add Money (BDT)</label>
                        <input
                          type="number"
                          value={depositAddAmount}
                          onChange={(e) => setDepositAddAmount(e.target.value)}
                          placeholder="e.g. 10000"
                          className="w-full max-w-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleDepositAddFromWallet}
                          className="px-4 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm"
                        >
                          Transfer from personal balance
                        </button>
                        {Number(walletPersonalAvailable || 0) <= 0 && (
                          <p className="text-[11px] text-rose-600 font-medium">
                            No personal top-up balance. Open Wallet → Add Money, wait for admin verification, then come back. Investment credits do not count.
                          </p>
                        )}
                        {/* S3: deposit history in collapsible scroll window — does not stretch the page */}
                        <ScrollHistoryPanel
                          title="Deposit history"
                          count={securityDepositLedger.length}
                          open={showDepositHistory}
                          onToggle={() => setShowDepositHistory((v) => !v)}
                          emptyText="No security deposit transfers yet."
                        >
                          {securityDepositLedger.map((row) => (
                            <div key={row.id} className="flex flex-wrap justify-between gap-2 text-[11px] font-mono text-slate-600 py-1.5 border-b border-slate-50 last:border-0">
                              <span className="font-bold text-slate-800">৳ {Number(row.amount || 0).toLocaleString()}</span>
                              <span className="text-slate-500">{row.method || 'Wallet transfer'}</span>
                              <span className="text-slate-400 w-full sm:w-auto">{row.created_at ? new Date(row.created_at).toLocaleString() : ''}</span>
                            </div>
                          ))}
                        </ScrollHistoryPanel>
                      </div>
                    </div>
                  )}

                  {overviewDetail === 'proposals' && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">Investors who proposed</h2>
                          <p className="text-xs text-slate-500 mt-0.5">Incoming term sheets on your approved campaigns</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setOverviewDetail(null); setActiveTab('investors'); }}
                            className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            Open Investors tab
                          </button>
                          <button type="button" onClick={() => setOverviewDetail(null)} className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer">
                            ← Back to Overview
                          </button>
                        </div>
                      </div>
                      {approvedProposals.length > 0 ? (
                        <div className="space-y-3">
                          {approvedProposals.map((p, idx) => {
                            const camp = approvedCampaigns.find((c) => (c.id || c._id) === (p.campaign_id || p.campaignId));
                            const st = String(p.status || 'pending').toLowerCase();
                            const canAct = st === 'pending' || st === 'negotiating';
                            const displayAmt = st === 'negotiating' && p.counter_amount != null
                              ? Number(p.counter_amount)
                              : Number(p.amount || 0);
                            return (
                              <div
                                key={p.id || p._id || idx}
                                className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 hover:border-sky-300"
                              >
                                <button
                                  type="button"
                                  className="w-full text-left space-y-1 cursor-pointer"
                                  onClick={() => focusProposalAction(p, 'view')}
                                >
                                  <div className="flex justify-between gap-2">
                                    <p className="font-bold text-slate-900">{p.investor_name || p.investorName || 'Investor'}</p>
                                    <span className="font-mono font-bold text-emerald-700">
                                      ৳ {displayAmt.toLocaleString()}
                                      {st === 'negotiating' && p.counter_amount != null ? (
                                        <span className="block text-[10px] font-normal text-sky-600 text-right">counter</span>
                                      ) : null}
                                    </span>
                                  </div>
                                  <p className="text-slate-500">
                                    {(st === 'negotiating' && p.counter_terms) ? p.counter_terms : (p.return_structure || p.terms || 'Term sheet')}
                                    {' · '}
                                    <span className="uppercase font-semibold">{p.status || 'pending'}</span>
                                  </p>
                                  <p className="text-slate-400">Campaign: {camp?.title || p.campaign_id || p.campaignId || '—'}</p>
                                </button>
                                {canAct && (
                                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => focusProposalAction(p, 'negotiate')}
                                      className="px-2.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                                    >
                                      {st === 'negotiating' ? 'Renegotiate' : 'Negotiate'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleProposalStatus(p.id || p._id, 'declined')}
                                      className="px-2.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleProposalStatus(p.id || p._id, 'accepted')}
                                      className="px-2.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                                    >
                                      Accept
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 py-8 text-center">No investor proposals on your approved campaigns yet.</p>
                      )}
                    </div>
                  )}

                  {!overviewDetail && (
                  <>
                  {/* 3 TOP METRIC CARDS — S3: clickable */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                      type="button"
                      onClick={() => setOverviewDetail('escrow')}
                      className="text-left bg-[#064E3B] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[160px] cursor-pointer hover:ring-2 hover:ring-emerald-400/50 transition-all"
                    >
                      <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none">
                        <svg width="180" height="120" viewBox="0 0 180 120" fill="none">
                          <path d="M40 120L110 20L180 120H40Z" stroke="white" strokeWidth="6" />
                          <path d="M0 120L70 20L140 120H0Z" stroke="white" strokeWidth="6" />
                        </svg>
                      </div>

                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-200/80 block">TOTAL FUNDING RAISED IN ESCROW</span>
                        <h3 className="text-3xl font-bold tracking-tight mt-2 font-mono">
                          ৳ {totalCombinedRaised.toLocaleString()}
                        </h3>
                      </div>

                      <div className="mt-4 pt-3 border-t border-emerald-700/50">
                        <span className="text-xs font-medium text-emerald-200 block mb-1.5">
                          {totalExpectedGoal > 0
                            ? `${escrowGoalPercent}% of BDT ${totalExpectedGoal.toLocaleString()} investment goals · click for breakdown`
                            : 'Click for startup + relief breakdown'}
                        </span>
                        <div className="w-full bg-emerald-950/60 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${escrowGoalPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOverviewDetail('deposit')}
                      className="text-left bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between cursor-pointer hover:border-emerald-400 hover:ring-2 hover:ring-emerald-100 transition-all min-h-[160px]"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block">SECURITY DEPOSIT HELD</span>
                        <Shield className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 font-mono">৳ {Number(securityDepositHeld || 0).toLocaleString()}</h3>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-2">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        <span>Click to learn more / add deposit</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOverviewDetail('proposals')}
                      className="text-left bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between cursor-pointer hover:border-sky-400 hover:ring-2 hover:ring-sky-100 transition-all min-h-[160px]"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block">INVESTOR PROPOSALS</span>
                        <FileText className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 font-mono">{approvedProposals.length}</h3>
                      </div>
                      <div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md inline-block">
                          {approvedProposals.length > 0 ? 'Click to see who proposed' : 'Awaiting proposals from investors'}
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* CAMPAIGN STATUS & MILESTONES TABLE — S3: startup + relief */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Campaign Status & Milestones</h2>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Startup and relief campaigns share milestones to show work progress. Relief does not require repayment.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {manageableMilestoneProjects.length > 0 && (
                          <select
                            value={(activeMilestoneProject && (activeMilestoneProject.id || activeMilestoneProject._id)) || ''}
                            onChange={(e) => setTimelineCampaignId(e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 font-medium"
                          >
                            {manageableCampaigns.length > 0 && (
                              <optgroup label="Startup campaigns">
                                {manageableCampaigns.map((c) => (
                                  <option key={c.id || c._id} value={c.id || c._id}>
                                    {c.title} ({(c.verified || c.status === 'verified') ? 'Live' : (c.status || 'pending')})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {manageableReliefForMilestones.length > 0 && (
                              <optgroup label="Relief campaigns">
                                {manageableReliefForMilestones.map((d) => (
                                  <option key={d.id || d._id} value={d.id || d._id}>
                                    {d.title} ({d.status || 'pending'})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        )}
                        <button
                          onClick={() => {
                            // S3: Manage Campaign → My Campaigns list (not the edit wizard)
                            if (isReliefProject(activeMilestoneProject)) {
                              setReliefPageMode('mine');
                              setActiveTab('relief');
                            } else {
                              setCampaignsPageMode('mine');
                              setActiveTab('explore');
                            }
                          }}
                          className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          {isReliefProject(activeMilestoneProject) ? 'Manage Relief' : 'Manage Campaign'}
                        </button>
                      </div>
                    </div>

                    {activeMilestoneProject && activeMilestoneProject.milestones && activeMilestoneProject.milestones.length > 0 ? (
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
                            {activeMilestoneProject.milestones.map((m, idx) => {
                              const bucket = getMilestoneBucket(m, activeMilestoneProject);
                              return (
                              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-4 font-semibold text-slate-900 flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${
                                    bucket === 'done' ? 'bg-emerald-500' :
                                    bucket === 'missed' ? 'bg-rose-500' : 'bg-amber-500'
                                  }`}></span>
                                  <span>{m.name || m.title || `Milestone #${idx + 1}`}</span>
                                </td>
                                <td className="py-4 text-slate-600">{m.targetDate || m.target || 'TBD'}</td>
                                <td className="py-4">
                                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase ${
                                    bucket === 'done' ? 'bg-emerald-500 text-white' :
                                    bucket === 'missed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {bucket === 'done' ? 'Done' : bucket === 'missed' ? 'Missed' : 'Pending'}
                                  </span>
                                </td>
                                <td className="py-4">
                                  <button
                                    onClick={() => {
                                      setSelectedMilestoneIdx(idx);
                                      setActiveTab('milestones');
                                    }}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                                      bucket === 'done'
                                        ? 'bg-[#047857] hover:bg-[#065f46] text-white'
                                        : 'bg-[#047857] hover:bg-[#065f46] text-white'
                                    }`}
                                  >
                                    {bucket === 'done' ? (
                                      <>View / Update <Eye className="w-3.5 h-3.5" /></>
                                    ) : (
                                      <><Upload className="w-3.5 h-3.5" /><span>Open Milestone</span></>
                                    )}
                                  </button>
                                </td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-500">No active milestones configured in database for this campaign.</p>
                      </div>
                    )}
                  </div>

                  {/* FR-8: PROGRESS TIMELINE */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Progress Timeline</h2>
                        <p className="text-xs text-slate-500">Story log of what you achieved (admin-approved posts). Different from the milestone plan table above.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {campaigns.length > 1 && (
                          <select
                            value={timelineCampaignId}
                            onChange={(e) => setTimelineCampaignId(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                          >
                            {campaigns.map((c) => {
                              const id = c.id || c._id;
                              return (
                                <option key={id} value={id}>{c.title || id}</option>
                              );
                            })}
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={openAnnouncementModal}
                          className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Publish Update</span>
                        </button>
                      </div>
                    </div>

                    <ScrollHistoryPanel
                      title="Timeline entries"
                      count={overviewTimelineUpdates.length}
                      open={showTimelineHistory}
                      onToggle={() => setShowTimelineHistory((v) => !v)}
                      emptyText="No progress announcements yet. Publish an update to start your campaign timeline."
                      accent="emerald"
                      maxHeightClass="max-h-72"
                    >
                      <ol className="relative border-l border-slate-200 ml-2 space-y-4 py-1">
                        {overviewTimelineUpdates.map((u) => (
                          <li key={u.id || `${u.campaign_id}-${u.created_at}-${u.title}`} className="ml-4">
                            <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-sm font-bold text-slate-900">{u.title}</h3>
                                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {u.created_at ? new Date(u.created_at).toLocaleString() : 'Just now'}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md uppercase">
                                  {u.milestone_tag || u.milestoneTag || 'Update'}
                                </span>
                                {u.campaignTitle && (
                                  <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-semibold rounded-md">
                                    {u.campaignTitle}
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                                  (u.status || 'approved') === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                  u.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {(u.status || 'approved') === 'approved' ? 'Live' : (u.status || 'pending')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 whitespace-pre-wrap">{u.content}</p>
                              {(u.status || 'approved') === 'pending' && (
                                <p className="text-[10px] text-amber-700">Waiting for admin approval before others can view this update.</p>
                              )}
                              {u.status === 'rejected' && (
                                <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5">
                                  Reason: {formatRejectionReason(u)}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </ScrollHistoryPanel>
                    {overviewTimelineUpdates.length === 0 && (
                      <button
                        type="button"
                        onClick={openAnnouncementModal}
                        className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        Publish first update
                      </button>
                    )}
                  </div>

                  {/* MY CAMPAIGN SECTION IN OVERVIEW SECTION BELOW */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">My Campaigns</h2>
                        <p className="text-xs text-slate-500">Campaigns you own or co-found</p>
                      </div>
                      <button
                        onClick={() => {
                          setCampaignsPageMode('mine');
                          setActiveTab('explore');
                        }}
                        className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>My Campaigns</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <ScrollHistoryPanel
                      title="Campaign list"
                      count={overviewCampaigns.length}
                      open={showMyCampaignsHistory}
                      onToggle={() => setShowMyCampaignsHistory((v) => !v)}
                      emptyText="No campaigns match your search."
                      maxHeightClass="max-h-80"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {overviewCampaigns.map((c, idx) => (
                          <div key={c.id || c._id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                                  {isCoFounderOfItem(c) && (
                                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-sky-100 text-sky-800">Co-founder</span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500">{c.university} • {c.category || 'Startup'}</span>
                              </div>
                              <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase ${
                                c.status === 'cancelled' ? 'bg-slate-200 text-slate-600' :
                                (c.verified || c.status === 'verified') ? 'bg-emerald-100 text-emerald-800' :
                                c.status === 'revisions' ? 'bg-purple-100 text-purple-800' :
                                c.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                                }`}>
                                {c.status === 'cancelled' ? 'Cancelled' :
                                 (c.verified || c.status === 'verified') ? 'Verified & Live ✓' :
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

                            {c.status === 'rejected' && (
                              <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5">
                                Reason: {formatRejectionReason(c)}
                              </p>
                            )}

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 flex-wrap">
                              {(c.status === 'pending' || c.status === 'revisions') && (
                                <button
                                  onClick={() => handleOpenEditCampaign(c)}
                                  className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                  Edit Details
                                </button>
                              )}
                              {c.status === 'rejected' && (
                                <button
                                  onClick={() => handleOpenEditCampaign(c)}
                                  className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                  Reapply
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  // S3: open this campaign’s milestones, not whichever was last selected
                                  setTimelineCampaignId(c.id || c._id);
                                  setActiveTab('milestones');
                                }}
                                className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                Milestones
                              </button>
                              {c.status === 'rejected' && (
                                <button
                                  onClick={() => handleDeleteRejectedCampaign(c.id || c._id)}
                                  className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                              {/* S3: Cancel removed from list views — exit actions live under Milestones */}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollHistoryPanel>
                    {overviewCampaigns.length === 0 && (
                      <div className="py-4 text-center text-xs text-slate-400 space-y-3">
                        <p>{campaigns.length > 0 ? 'No campaigns match your search.' : 'No campaigns registered in database under your account.'}</p>
                        <button
                          onClick={() => {
                            setCampaignsPageMode('mine');
                            setActiveTab('explore');
                          }}
                          className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Go to My Campaigns</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* S3: backers who invested (accepted proposals) — not the platform investor directory */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Investors in your campaigns</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          People whose term sheets you accepted. Pending proposals stay on the Investors tab.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('investors')}
                        className="text-xs text-sky-600 hover:text-sky-700 font-semibold shrink-0"
                      >
                        Investors tab
                      </button>
                    </div>

                    {filteredOverviewBackers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                        {filteredOverviewBackers.map((inv) => (
                          <button
                            key={inv.id}
                            type="button"
                            onClick={() => {
                              if (inv.proposal) setSelectedProposal(inv.proposal);
                              setOverviewDetail(null);
                              setActiveTab('investors');
                            }}
                            className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2 cursor-pointer hover:border-sky-300"
                          >
                            <div className="flex items-center gap-3">
                              <InitialsAvatar name={inv.name} className="w-10 h-10" />
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-slate-800 block truncate">{inv.name}</span>
                                <span className="text-[10px] text-slate-500 block truncate">{inv.campaignTitle || 'Campaign'}</span>
                              </div>
                            </div>
                            <p className="text-xs font-mono font-bold text-emerald-700">৳ {Number(inv.amount || 0).toLocaleString()}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                        <p>{searchQuery ? 'No backers match your search.' : 'No investors have funded your campaigns yet (accept a proposal first).'}</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('investors')}
                          className="text-sky-600 font-semibold cursor-pointer"
                        >
                          Review proposals on Investors
                        </button>
                      </div>
                    )}
                  </div>
                  </>
                  )}
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
                        wizardStep === 1 ? 'bg-[#047857] hover:bg-[#065f46] text-white border-emerald-600 shadow-sm' :
                        wizardStep > 1 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      1. Venture Identity
                    </button>
                    <button
                      onClick={() => setWizardStep(2)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        wizardStep === 2 ? 'bg-[#047857] hover:bg-[#065f46] text-white border-emerald-600 shadow-sm' :
                        wizardStep > 2 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      2. Pitch & Deck
                    </button>
                    <button
                      onClick={() => setWizardStep(3)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        wizardStep === 3 ? 'bg-[#047857] hover:bg-[#065f46] text-white border-emerald-600 shadow-sm' :
                        wizardStep > 3 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      3. Financials & Terms
                    </button>
                    <button
                      onClick={() => setWizardStep(4)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        wizardStep === 4 ? 'bg-[#047857] hover:bg-[#065f46] text-white border-emerald-600 shadow-sm' :
                        wizardStep > 4 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      4. Milestones
                    </button>
                    <button
                      onClick={() => setWizardStep(5)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        wizardStep === 5 ? 'bg-[#047857] hover:bg-[#065f46] text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200'
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
                              value={CAMPAIGN_SECTOR_OPTIONS.includes(campaignForm.category) ? campaignForm.category : CAMPAIGN_SECTOR_OPTIONS[0]}
                              onChange={(e) => setCampaignForm({ ...campaignForm, category: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                            >
                              {CAMPAIGN_SECTOR_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
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
                          {/* S3: co-founders — up to 3 existing founders */}
                          <CoFounderMultiPicker
                            selected={campaignForm.coFounders || []}
                            founders={coFounderPickerOptions}
                            onChange={(next) => setCampaignForm((prev) => ({ ...prev, coFounders: next }))}
                            accent="emerald"
                          />
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
                                className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
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
                                  className="px-3 py-1 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg"
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
                            className="px-5 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-xs font-semibold rounded-xl"
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
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Funding release schedule (from your milestones)</label>
                            <input
                              type="text"
                              disabled
                              value={
                                milestoneDrafts.filter((m) => (m.title || '').trim()).length > 0
                                  ? `${milestoneDrafts.filter((m) => (m.title || '').trim()).length} equal release steps based on your milestones`
                                  : 'Set milestones in the next step'
                              }
                              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between pt-4">
                          <button
                            type="button"
                            onClick={() => setWizardStep(2)}
                            className="px-5 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-xs font-semibold rounded-xl"
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

                    {/* STEP 4: CUSTOM MILESTONES */}
                    {wizardStep === 4 && (
                      <div className="space-y-5">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="font-bold text-slate-900 text-base">Step 4: Your Milestones</h3>
                          <p className="text-xs text-slate-500">
                            Add the goals you will complete over time. Funding is released in equal parts as each milestone is verified (not a fixed 3-step list).
                          </p>
                        </div>

                        <div className="space-y-3">
                          {milestoneDrafts.map((m, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">Milestone #{idx + 1}</span>
                                <span className="text-[10px] font-mono text-emerald-700">{tranchePercentLabel(idx, milestoneDrafts.length)}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Goal title *</label>
                                  <input
                                    type="text"
                                    value={m.title}
                                    onChange={(e) => {
                                      const next = [...milestoneDrafts];
                                      next[idx] = { ...next[idx], title: e.target.value };
                                      setMilestoneDrafts(next);
                                    }}
                                    placeholder="e.g. Launch beta app for 500 students"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Target timing</label>
                                  <input
                                    type="text"
                                    value={m.target}
                                    onChange={(e) => {
                                      const next = [...milestoneDrafts];
                                      next[idx] = { ...next[idx], target: e.target.value };
                                      setMilestoneDrafts(next);
                                    }}
                                    placeholder="e.g. Month 2 or Q1 2026"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                                  />
                                </div>
                              </div>
                              {milestoneDrafts.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setMilestoneDrafts(milestoneDrafts.filter((_, i) => i !== idx))}
                                  className="px-2.5 py-1 text-[11px] font-semibold bg-[#047857] hover:bg-[#065f46] text-white rounded-lg cursor-pointer"
                                >
                                  Remove milestone
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setMilestoneDrafts([...milestoneDrafts, { title: '', target: `Month ${milestoneDrafts.length + 1}` }])}
                          className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          + Add another milestone
                        </button>

                        <div className="flex justify-between pt-4">
                          <button
                            type="button"
                            onClick={() => setWizardStep(3)}
                            className="px-5 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-xs font-semibold rounded-xl"
                          >
                            ← Previous Step
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (milestoneDrafts.every((m) => !(m.title || '').trim())) {
                                showToast('Enter at least one milestone title.', 'error');
                                return;
                              }
                              setWizardStep(5);
                            }}
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
                            Approval takes <strong>at most 3 days</strong>. If you edit a pending campaign later, the timer restarts from day zero. After admins verify credentials and pitch details, the campaign is set to <strong>VERIFIED</strong> and published to the Investor Feed.
                          </p>
                        </div>

                        <div className="flex justify-between pt-4">
                          <button
                            type="button"
                            onClick={() => setWizardStep(4)}
                            className="px-5 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-xs font-semibold rounded-xl"
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

              {/* TAB: CAMPAIGNS TO WATCH / MY CAMPAIGNS */}
              {activeTab === 'explore' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                        {campaignsPageMode === 'mine' ? 'My Campaigns' : 'Campaigns to Watch'}
                      </h1>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {campaignsPageMode === 'mine'
                          ? 'Your startup campaigns. New campaigns require admin approval before going live.'
                          : 'Browse live startup campaigns across university incubation centers.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {campaignsPageMode === 'watch' ? (
                        <button
                          type="button"
                          onClick={() => { setWatchDetail(null); setCampaignsPageMode('mine'); }}
                          className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          My Campaigns
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => { setWatchDetail(null); setCampaignsPageMode('watch'); }}
                            className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-xs font-semibold rounded-xl cursor-pointer"
                          >
                            ← Campaigns to Watch
                          </button>
                          <button
                            type="button"
                            onClick={handleOpenCreateCampaign}
                            className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Create New Campaign
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* S3: Campaign filters */}
                  {!watchDetail && (
                    <FilterBar
                      open={showListFilters}
                      onToggle={() => setShowListFilters((v) => !v)}
                      activeCount={activeFilterCount(campaignFilters)}
                      onReset={() => setCampaignFilters({ status: 'all', category: 'all', stage: 'all', funding: 'all', university: 'all' })}
                      footer={(
                        <p className="text-[11px] text-slate-500">
                          Showing {campaignsPageMode === 'watch' ? filteredAllCampaigns.length : filteredMyCampaigns.length} campaign
                          {(campaignsPageMode === 'watch' ? filteredAllCampaigns.length : filteredMyCampaigns.length) === 1 ? '' : 's'}
                          {searchQuery.trim() ? ` matching “${searchQuery.trim()}”` : ''}
                        </p>
                      )}
                    >
                      <FilterSelect
                        label="Status"
                        value={campaignFilters.status}
                        onChange={(v) => setCampaignFilters((p) => ({ ...p, status: v }))}
                        options={[
                          { value: 'all', label: 'All statuses' },
                          { value: 'live', label: 'Live' },
                          { value: 'pending', label: 'Pending' },
                          { value: 'rejected', label: 'Rejected / cancelled' },
                          { value: 'paused', label: 'Paused' }
                        ]}
                      />
                      <FilterSelect
                        label="Category"
                        value={campaignFilters.category}
                        onChange={(v) => setCampaignFilters((p) => ({ ...p, category: v }))}
                        options={[
                          { value: 'all', label: 'All categories' },
                          ...CAMPAIGN_SECTOR_OPTIONS.map((c) => ({ value: c, label: c }))
                        ]}
                      />
                      <FilterSelect
                        label="Stage"
                        value={campaignFilters.stage}
                        onChange={(v) => setCampaignFilters((p) => ({ ...p, stage: v }))}
                        options={[
                          { value: 'all', label: 'All stages' },
                          ...campaignStageOptions.map((s) => ({ value: s, label: s }))
                        ]}
                      />
                      <FilterSelect
                        label="Funding"
                        value={campaignFilters.funding}
                        onChange={(v) => setCampaignFilters((p) => ({ ...p, funding: v }))}
                        options={[
                          { value: 'all', label: 'Any progress' },
                          { value: 'low', label: 'Under 25%' },
                          { value: 'mid', label: '25–75%' },
                          { value: 'high', label: '75%+' },
                          { value: 'full', label: 'Fully funded' }
                        ]}
                      />
                      <FilterSelect
                        label="University"
                        value={campaignFilters.university}
                        onChange={(v) => setCampaignFilters((p) => ({ ...p, university: v }))}
                        options={[
                          { value: 'all', label: 'All universities' },
                          ...campaignUniversityOptions.map((u) => ({ value: u, label: u }))
                        ]}
                      />
                    </FilterBar>
                  )}

                  {campaignsPageMode === 'watch' && !watchDetail && (
                    <div className="bg-[#064E3B] rounded-2xl p-5 text-white shadow-sm">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-200/80 block">Live marketplace (Campaigns to Watch)</span>
                      <p className="text-[11px] text-emerald-100/80 mt-1">All live campaigns in this list — not your personal Overview escrow.</p>
                      <div className="flex flex-wrap items-end justify-between gap-4 mt-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-emerald-200/70 block">Invested</span>
                          <h3 className="text-2xl font-bold font-mono tracking-tight">৳ {watchMarketInvested.toLocaleString()}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono uppercase text-emerald-200/70 block">Wanted (goals)</span>
                          <h3 className="text-2xl font-bold font-mono tracking-tight">৳ {watchMarketWanted.toLocaleString()}</h3>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-xs font-medium text-emerald-200 block mb-1.5">{watchMarketPct}% of listed goals funded</span>
                        <div className="w-full bg-emerald-950/60 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${watchMarketPct}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {campaignsPageMode === 'watch' && watchDetail ? (
                    (() => {
                      const c = watchDetail;
                      const founder = c.founder || {};
                      const founderName = watchFounderName(c);
                      const ms = Array.isArray(c.milestones) ? c.milestones : [];
                      const doneN = ms.filter((m) => getMilestoneBucket(m, c) === 'done').length;
                      const pct = c.goal > 0 ? Math.min(100, Math.round(((c.raised || 0) / c.goal) * 100)) : 0;
                      const liveUpdates = watchDetailUpdates.filter((u) => (u.status || 'approved') === 'approved');
                      const watchOwnerId = String(c.founder_id || c.founderId || c.founder?.id || c.founder?._id || '');
                      const watchCoFounders = readCoFounders(c);
                      const isWatchOwner = watchOwnerId === myFounderId;
                      const isWatchCoFounder = watchCoFounders.some(
                        (cf) => String(cf.id) === myFounderId || String(cf.email || '').toLowerCase() === myFounderEmail
                      );
                      const watchAtCoFounderLimit = watchCoFounders.length >= MAX_COFOUNDERS;
                      const canApplyWatchCoFounder = !isWatchOwner && !isWatchCoFounder && !watchAtCoFounderLimit;
                      return (
                        <div className="space-y-6">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => { setWatchDetail(null); setWatchDetailUpdates([]); setWatchStatPanel(null); setWatchDetailBackers([]); }}
                              className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                            >
                              ← Back to Campaigns to Watch
                            </button>
                            {watchAtCoFounderLimit ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setCoFounderListTarget({ title: c.title, coFounders: watchCoFounders, accent: 'emerald' });
                                  setShowCoFounderListModal(true);
                                }}
                                className="px-3.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                              >
                                Co-founders ({watchCoFounders.length}/{MAX_COFOUNDERS})
                              </button>
                            ) : canApplyWatchCoFounder ? (
                              <button
                                type="button"
                                onClick={() => openCoFounderApply('investment', c)}
                                className="px-3.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                              >
                                Apply as co-founder
                              </button>
                            ) : null}
                          </div>

                          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                            <div className="flex flex-wrap justify-between gap-3 items-start">
                              <div>
                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase">{c.category || 'Startup'}</span>
                                <h2 className="text-xl font-bold text-slate-900 mt-2">{c.title}</h2>
                                <p className="text-xs text-slate-500 mt-1">{c.university} · {c.stage || 'MVP'} · {c.location || 'Bangladesh'}</p>
                              </div>
                              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-emerald-50 text-emerald-800">Live</span>
                            </div>
                            {c.tagline && <p className="text-sm text-slate-700">{c.tagline}</p>}
                            {c.description && <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{c.description}</p>}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                              type="button"
                              onClick={() => setWatchStatPanel((p) => (p === 'founder' ? null : 'founder'))}
                              className={`text-left bg-white border rounded-2xl p-5 shadow-sm cursor-pointer transition-all hover:border-emerald-300 hover:ring-2 hover:ring-emerald-100 ${
                                watchStatPanel === 'founder' ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'
                              }`}
                            >
                              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Founder</span>
                              <div className="flex items-center gap-3 mt-3">
                                <InitialsAvatar name={founderName} className="w-11 h-11" />
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{founderName}</p>
                                  <p className="text-[11px] text-slate-500">{founder.university || c.university}</p>
                                  {founder.department && <p className="text-[11px] text-slate-400">{founder.department}</p>}
                                  <p className="text-[10px] font-semibold text-emerald-700 mt-1">View founder profile →</p>
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setWatchStatPanel((p) => (p === 'invested' ? null : 'invested'))}
                              className={`text-left bg-white border rounded-2xl p-5 shadow-sm cursor-pointer transition-all hover:border-emerald-300 hover:ring-2 hover:ring-emerald-100 ${
                                watchStatPanel === 'invested' ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'
                              }`}
                            >
                              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Invested</span>
                              <p className="text-2xl font-bold font-mono text-emerald-700 mt-2">৳ {Number(c.raised || 0).toLocaleString()}</p>
                              <p className="text-[11px] text-slate-500 mt-1">of ৳ {Number(c.goal || 0).toLocaleString()} goal · {pct}%</p>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              {(c.equity_offer || c.equityOffer) && (
                                <p className="text-[11px] text-slate-600 mt-2">Terms: {c.equity_offer || c.equityOffer}</p>
                              )}
                              <p className="text-[10px] font-semibold text-emerald-700 mt-2">Who invested →</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => setWatchStatPanel((p) => (p === 'milestones' ? null : 'milestones'))}
                              className={`text-left bg-white border rounded-2xl p-5 shadow-sm cursor-pointer transition-all hover:border-emerald-300 hover:ring-2 hover:ring-emerald-100 ${
                                watchStatPanel === 'milestones' ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'
                              }`}
                            >
                              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Milestones hit</span>
                              <p className="text-2xl font-bold font-mono text-slate-900 mt-2">{doneN} / {ms.length || 0}</p>
                              <p className="text-[11px] text-slate-500 mt-1">Done only with proof on file</p>
                              <p className="text-[10px] font-semibold text-emerald-700 mt-2">View milestones →</p>
                            </button>
                          </div>

                          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                            <h3 className="text-sm font-bold text-slate-900">Milestone plan</h3>
                            {ms.length > 0 ? (
                              <ul className="space-y-2">
                                {ms.map((m, idx) => {
                                  const bucket = getMilestoneBucket(m, c);
                                  return (
                                    <li key={idx} className="flex flex-wrap justify-between gap-2 text-xs p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                      <span className="font-semibold text-slate-800">{m.title || m.name || `Milestone ${idx + 1}`}</span>
                                      <span className="text-slate-500">{m.target || m.targetDate || 'TBD'}</span>
                                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                        bucket === 'done' ? 'bg-emerald-100 text-emerald-800' :
                                        bucket === 'missed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                      }`}>{bucket}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="text-xs text-slate-500">No milestones listed for this campaign.</p>
                            )}
                          </div>

                          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                            <h3 className="text-sm font-bold text-slate-900">Public progress</h3>
                            <p className="text-[11px] text-slate-500">Collapsed scroll window — open to browse updates without stretching the page.</p>
                            <ScrollHistoryPanel
                              title="Progress updates"
                              count={liveUpdates.length}
                              open={showWatchPublicProgress}
                              onToggle={() => setShowWatchPublicProgress((v) => !v)}
                              emptyText="No admin-approved public updates yet."
                              accent="emerald"
                              maxHeightClass="max-h-56"
                            >
                              {liveUpdates.map((u) => (
                                <div key={u.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                                  <div className="flex justify-between gap-2">
                                    <span className="font-bold text-slate-900">{u.title}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}</span>
                                  </div>
                                  <p className="text-slate-600 whitespace-pre-wrap">{u.content}</p>
                                  {(u.milestone_tag || u.milestoneTag) && (
                                    <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded">{u.milestone_tag || u.milestoneTag}</span>
                                  )}
                                </div>
                              ))}
                            </ScrollHistoryPanel>
                          </div>
                        </div>
                      );
                    })()
                  ) : campaignsPageMode === 'watch' ? (
                    filteredAllCampaigns.length > 0 ? (
                      <div className="max-h-[70vh] overflow-y-auto overscroll-contain pr-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAllCampaigns.map((c, idx) => (
                          <button
                            key={c.id || c._id || idx}
                            type="button"
                            onClick={() => openWatchDetail(c)}
                            className="text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-emerald-400 hover:ring-2 hover:ring-emerald-100 transition-all cursor-pointer"
                          >
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
                                {watchFounderName(c) && (
                                  <span className="text-[11px] text-slate-500 block mt-0.5">Founder: {watchFounderName(c)}</span>
                                )}
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
                              <p className="text-[11px] text-sky-700 font-semibold">View details →</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
                        <Compass className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700">No live campaigns found matching your query.</p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      {filteredMyCampaigns.length > 0 ? filteredMyCampaigns.map((c, idx) => {
                        const ownerView = isOwnerOfItem(c);
                        const coFounderView = isCoFounderOfItem(c);
                        return (
                        <div key={c.id || c._id || idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                          <div className="flex justify-between gap-3 items-start">
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h3 className="font-bold text-slate-900 text-base">{c.title}</h3>
                                {coFounderView && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-sky-100 text-sky-800">Co-founder</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">{c.university} • {c.category || 'Startup'}</p>
                            </div>
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase ${
                              c.status === 'cancelled' ? 'bg-slate-200 text-slate-600' :
                              (c.verified || c.status === 'verified') ? 'bg-emerald-100 text-emerald-800' :
                              c.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {(c.verified || c.status === 'verified') ? 'Live' : (c.status || 'pending')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{c.tagline || c.description}</p>
                          <p className="text-xs font-mono text-slate-500">Goal ৳ {Number(c.goal || 0).toLocaleString()} · Raised ৳ {Number(c.raised || 0).toLocaleString()}</p>
                          {coFounderView && (
                            <p className="text-[10px] text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-2.5 py-1.5">
                              You are a co-founder — you can open milestones and publish progress updates. Ownership actions stay with the primary founder.
                            </p>
                          )}
                          {ownerView && c.status === 'rejected' && (
                            <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5">
                              Reason: {formatRejectionReason(c)}
                            </p>
                          )}
                          {ownerView && !(c.verified || c.status === 'verified') && c.status !== 'cancelled' && c.status !== 'rejected' && (
                            <p className="text-[10px] text-amber-700">
                              Awaiting admin approval (at most 3 days). Editing restarts the timer from day zero.
                            </p>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            {ownerView && (c.status === 'pending' || c.status === 'revisions') && (
                              <button type="button" onClick={() => handleOpenEditCampaign(c)} className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer">
                                Edit
                              </button>
                            )}
                            {ownerView && c.status === 'rejected' && (
                              <>
                                <button type="button" onClick={() => handleOpenEditCampaign(c)} className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer">
                                  Reapply
                                </button>
                                <button type="button" onClick={() => handleDeleteRejectedCampaign(c.id || c._id)} className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer">
                                  Delete
                                </button>
                              </>
                            )}
                            {/* S3: exit lives on My Campaigns; milestones page is milestones-only */}
                            {(c.status === 'pending' || c.status === 'verified' || c.verified || c.status === 'revisions') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTimelineCampaignId(c.id || c._id);
                                    setSelectedMilestoneIdx(null);
                                    setActiveTab('milestones');
                                  }}
                                  className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                                >
                                  Milestones
                                </button>
                                {ownerView && (c.verified || c.status === 'verified') && (
                                  <button
                                    type="button"
                                    onClick={() => openEditRequestModal('investment', c)}
                                    className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                                  >
                                    {pendingEditFor('investment', c.id || c._id) ? 'Edit pending…' : 'Request edit'}
                                  </button>
                                )}
                                {/* S3: founder adds own wallet funds to campaign raised */}
                                {ownerView && (c.verified || c.status === 'verified') && (
                                  <button
                                    type="button"
                                    onClick={() => openSelfFundModal('investment', c)}
                                    className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                                  >
                                    Fund from wallet
                                  </button>
                                )}
                                {ownerView && (
                                  <button
                                    type="button"
                                    onClick={() => openHandoverModal('investment', c)}
                                    className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                                  >
                                    {pendingHandoverFor('investment', c.id || c._id) ? 'Handover pending…' : 'Handover responsibility'}
                                  </button>
                                )}
                              </>
                            )}
                            {ownerView && pendingEditFor('investment', c.id || c._id) && (
                              <p className="w-full text-[10px] text-violet-700">
                                Edit request pending — admin review at most 2 working days
                                {pendingEditFor('investment', c.id || c._id).due_at
                                  ? ` (due ${new Date(pendingEditFor('investment', c.id || c._id).due_at).toLocaleDateString()})`
                                  : ''}.
                              </p>
                            )}
                            {ownerView && pendingHandoverFor('investment', c.id || c._id) && (
                              <p className="w-full text-[10px] text-amber-800">
                                Handover pending admin approval — ownership moves to the elected new founder when approved.
                              </p>
                            )}
                            {readCoFounders(c).length > 0 && (
                              <div className="w-full space-y-1.5">
                                <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Co-founders</p>
                                {readCoFounders(c).map((cf) => (
                                  <div key={cf.id || cf.email} className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                                    <span>{cf.name || 'Founder'}{cf.email ? ` · ${cf.email}` : ''}</span>
                                    {ownerView && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRemoveCoFounderTarget({ type: 'investment', item: c, cofounder: cf });
                                          setRemoveCoFounderMessage('');
                                          setShowRemoveCoFounderModal(true);
                                        }}
                                        className="px-2 py-0.5 text-[10px] font-semibold bg-[#047857] hover:bg-[#065f46] text-white rounded-md cursor-pointer"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {ownerView && pendingCoFounderAppsFor('investment', c.id || c._id).map((app) => (
                              <div key={app.id} className="w-full p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg space-y-2">
                                <p className="text-[11px] text-emerald-900 font-semibold">
                                  Co-founder application: {app.applicant_name}
                                </p>
                                <p className="text-[11px] text-slate-600 whitespace-pre-wrap">{app.reason}</p>
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => reviewCoFounderApp(app, 'accepted')} className="px-2.5 py-1 bg-[#047857] hover:bg-[#065f46] text-white text-[10px] font-semibold rounded-md cursor-pointer">
                                    Accept
                                  </button>
                                  <button type="button" onClick={() => reviewCoFounderApp(app, 'rejected')} className="px-2.5 py-1 bg-[#047857] hover:bg-[#065f46] text-white text-[10px] font-semibold rounded-md cursor-pointer">
                                    Decline
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ); }) : (
                        <div className="py-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl space-y-3">
                          <p className="text-xs text-slate-500">
                            {campaigns.length === 0
                              ? 'You have no startup campaigns yet.'
                              : 'No campaigns match your search or filters.'}
                          </p>
                          {campaigns.length === 0 ? (
                            <button
                              type="button"
                              onClick={handleOpenCreateCampaign}
                              className="px-4 py-2 bg-[#047857] text-white text-xs font-semibold rounded-xl cursor-pointer"
                            >
                              Create New Campaign
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery('');
                                setCampaignFilters({ status: 'all', category: 'all', stage: 'all', funding: 'all', university: 'all' });
                              }}
                              className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
                            >
                              Clear search & filters
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: RELIEF CAMPAIGNS TO SUPPORT / MY RELIEF CAMPAIGNS */}
              {activeTab === 'relief' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                        {reliefPageMode === 'mine' ? 'My Relief Campaigns' : 'Relief Campaigns to Support'}
                      </h1>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {reliefPageMode === 'mine'
                          ? 'Your donation causes. New ones need admin approval before they go public.'
                          : 'Browse approved community relief campaigns seeking donations.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {reliefPageMode === 'watch' ? (
                        <button
                          type="button"
                          onClick={() => { setReliefPageMode('mine'); setReliefDetail(null); setShowReliefCreateForm(false); }}
                          className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          My Relief Campaigns
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => { setReliefPageMode('watch'); setReliefDetail(null); setShowReliefCreateForm(false); }}
                            className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-xs font-semibold rounded-xl cursor-pointer"
                          >
                            ← Relief Campaigns to Support
                          </button>
                          <button
                            type="button"
                            onClick={openReliefCreateForm}
                            className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Create New Relief Campaign
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* S3: Relief filters */}
                  {!reliefDetail && (
                    <FilterBar
                      open={showListFilters}
                      onToggle={() => setShowListFilters((v) => !v)}
                      activeCount={activeFilterCount(reliefFilters)}
                      onReset={() => setReliefFilters({ status: 'all', cause: 'all', funding: 'all', activity: 'all', university: 'all' })}
                      footer={(
                        <p className="text-[11px] text-slate-500">
                          Showing {reliefPageMode === 'watch' ? filteredPublicRelief.length : filteredMyRelief.length} relief campaign
                          {(reliefPageMode === 'watch' ? filteredPublicRelief.length : filteredMyRelief.length) === 1 ? '' : 's'}
                          {searchQuery.trim() ? ` matching “${searchQuery.trim()}”` : ''}
                        </p>
                      )}
                    >
                      <FilterSelect
                        label="Status"
                        value={reliefFilters.status}
                        onChange={(v) => setReliefFilters((p) => ({ ...p, status: v }))}
                        options={[
                          { value: 'all', label: 'All statuses' },
                          { value: 'open', label: 'Open' },
                          { value: 'pending', label: 'Pending' },
                          { value: 'rejected', label: 'Rejected / cancelled' }
                        ]}
                      />
                      <FilterSelect
                        label="Cause"
                        value={reliefFilters.cause}
                        onChange={(v) => setReliefFilters((p) => ({ ...p, cause: v }))}
                        options={[
                          { value: 'all', label: 'All causes' },
                          ...reliefCauseOptions.map((c) => ({ value: c, label: c }))
                        ]}
                      />
                      <FilterSelect
                        label="Donation progress"
                        value={reliefFilters.funding}
                        onChange={(v) => setReliefFilters((p) => ({ ...p, funding: v }))}
                        options={[
                          { value: 'all', label: 'Any progress' },
                          { value: 'low', label: 'Under 25%' },
                          { value: 'mid', label: '25–75%' },
                          { value: 'high', label: '75%+' },
                          { value: 'full', label: 'Goal met' }
                        ]}
                      />
                      <FilterSelect
                        label="Activity"
                        value={reliefFilters.activity}
                        onChange={(v) => setReliefFilters((p) => ({ ...p, activity: v }))}
                        options={[
                          { value: 'all', label: 'Any activity' },
                          { value: 'has', label: 'Has donations' },
                          { value: 'none', label: 'No donations yet' }
                        ]}
                      />
                      <FilterSelect
                        label="University"
                        value={reliefFilters.university}
                        onChange={(v) => setReliefFilters((p) => ({ ...p, university: v }))}
                        options={[
                          { value: 'all', label: 'All universities' },
                          ...reliefUniversityOptions.map((u) => ({ value: u, label: u }))
                        ]}
                      />
                    </FilterBar>
                  )}

                  {reliefPageMode === 'watch' && (
                    reliefDetail ? (
                      (() => {
                        const d = reliefDetail;
                        const founder = d.founder || {};
                        const founderName = founder.name || 'Founder';
                        const ms = Array.isArray(d.milestones) ? d.milestones : [];
                        const doneN = ms.filter((m) => getMilestoneBucket(m, d) === 'done').length;
                        const pct = d.goal > 0 ? Math.min(100, Math.round(((d.raised || 0) / d.goal) * 100)) : 0;
                        const donations = Array.isArray(d.donations) ? d.donations : [];
                        const isOwn = reliefDrives.some((x) => (x.id || x._id) === (d.id || d._id));
                        const reliefOwnerId = String(d.founder_id || d.founderId || d.founder?.id || d.founder?._id || '');
                        const reliefCoFounders = readCoFounders(d);
                        const isReliefOwner = reliefOwnerId === myFounderId || isOwn;
                        const isReliefCoFounder = reliefCoFounders.some(
                          (cf) => String(cf.id) === myFounderId || String(cf.email || '').toLowerCase() === myFounderEmail
                        );
                        const reliefAtCoFounderLimit = reliefCoFounders.length >= MAX_COFOUNDERS;
                        const canApplyReliefCoFounder = !isReliefOwner && !isReliefCoFounder && !reliefAtCoFounderLimit;
                        return (
                          <div className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => { setReliefDetail(null); setShowReliefDonationHistory(false); setReliefStatPanel(null); }}
                                className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                              >
                                ← Back to Relief Campaigns to Support
                              </button>
                              <div className="flex flex-wrap gap-2">
                                {reliefAtCoFounderLimit ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCoFounderListTarget({ title: d.title, coFounders: reliefCoFounders, accent: 'rose' });
                                      setShowCoFounderListModal(true);
                                    }}
                                    className="px-3.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                                  >
                                    Co-founders ({reliefCoFounders.length}/{MAX_COFOUNDERS})
                                  </button>
                                ) : canApplyReliefCoFounder ? (
                                  <button
                                    type="button"
                                    onClick={() => openCoFounderApply('relief', d)}
                                    className="px-3.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                                  >
                                    Apply as co-founder
                                  </button>
                                ) : null}
                                {isOwn && (
                                  <button
                                    type="button"
                                    onClick={() => openSelfFundModal('relief', d)}
                                    className="px-3.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-lg cursor-pointer"
                                  >
                                    Donate from wallet
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                              <div className="flex flex-wrap justify-between gap-3 items-start">
                                <div>
                                  <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md uppercase">{d.cause || 'Relief'}</span>
                                  <h2 className="text-xl font-bold text-slate-900 mt-2">{d.title}</h2>
                                  <p className="text-xs text-slate-500 mt-1">{d.university || '—'} · Donation cause</p>
                                </div>
                                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-emerald-50 text-emerald-800">
                                  {d.status || 'open'}
                                </span>
                              </div>
                              {d.beneficiary && (
                                <p className="text-sm text-slate-700">
                                  <span className="font-semibold text-slate-900">Helps: </span>{d.beneficiary}
                                </p>
                              )}
                              {d.description && (
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{d.description}</p>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <button
                                type="button"
                                onClick={() => setReliefStatPanel((p) => (p === 'founder' ? null : 'founder'))}
                                className={`text-left bg-white border rounded-2xl p-5 shadow-sm cursor-pointer transition-all hover:border-rose-300 hover:ring-2 hover:ring-rose-100 ${
                                  reliefStatPanel === 'founder' ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'
                                }`}
                              >
                                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Organizer</span>
                                <div className="flex items-center gap-3 mt-3">
                                  <InitialsAvatar name={founderName} className="w-11 h-11" />
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{founderName}</p>
                                    <p className="text-[11px] text-slate-500">{founder.university || d.university || '—'}</p>
                                    {founder.department && <p className="text-[11px] text-slate-400">{founder.department}</p>}
                                    <p className="text-[10px] font-semibold text-rose-700 mt-1">View organizer profile →</p>
                                  </div>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => setReliefStatPanel((p) => (p === 'invested' ? null : 'invested'))}
                                className={`text-left bg-white border rounded-2xl p-5 shadow-sm cursor-pointer transition-all hover:border-rose-300 hover:ring-2 hover:ring-rose-100 ${
                                  reliefStatPanel === 'invested' ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'
                                }`}
                              >
                                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Donated</span>
                                <p className="text-2xl font-bold font-mono text-rose-700 mt-2">৳ {Number(d.raised || 0).toLocaleString()}</p>
                                <p className="text-[11px] text-slate-500 mt-1">of ৳ {Number(d.goal || 0).toLocaleString()} goal · {pct}%</p>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <p className="text-[10px] font-semibold text-rose-700 mt-2">Who donated →</p>
                              </button>
                              <button
                                type="button"
                                onClick={() => setReliefStatPanel((p) => (p === 'milestones' ? null : 'milestones'))}
                                className={`text-left bg-white border rounded-2xl p-5 shadow-sm cursor-pointer transition-all hover:border-rose-300 hover:ring-2 hover:ring-rose-100 ${
                                  reliefStatPanel === 'milestones' ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'
                                }`}
                              >
                                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Milestones hit</span>
                                <p className="text-2xl font-bold font-mono text-slate-900 mt-2">{doneN} / {ms.length || 0}</p>
                                <p className="text-[11px] text-slate-500 mt-1">Progress with proof on file</p>
                                <p className="text-[10px] font-semibold text-rose-700 mt-2">View milestones →</p>
                              </button>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                              <h3 className="text-sm font-bold text-slate-900">Progress milestones</h3>
                              {ms.length > 0 ? (
                                <ul className="space-y-2">
                                  {ms.map((m, idx) => {
                                    const bucket = getMilestoneBucket(m, d);
                                    return (
                                      <li key={idx} className="flex flex-wrap justify-between gap-2 text-xs p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <span className="font-semibold text-slate-800">{m.title || m.name || `Phase ${idx + 1}`}</span>
                                        <span className="text-slate-500">{m.target || m.targetDate || 'TBD'}</span>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                          bucket === 'done' ? 'bg-emerald-100 text-emerald-800' :
                                          bucket === 'missed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                        }`}>{bucket}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : (
                                <p className="text-xs text-slate-500">No progress milestones listed yet.</p>
                              )}
                            </div>

                            <WalletCollapsibleSection
                              title="Recent donations"
                              count={donations.length}
                              open={showReliefDonationHistory}
                              onToggle={() => setShowReliefDonationHistory((v) => !v)}
                              emptyText="No donations recorded yet."
                              accent="rose"
                              maxHeightClass="max-h-64"
                              subtitle={
                                showReliefDonationHistory
                                  ? 'Click the header to collapse · scroll the list below'
                                  : 'Click this card to expand and scroll the full list'
                              }
                            >
                              {donations.map((don) => (
                                <div
                                  key={don.id || `${don.investor_name}-${don.created_at}`}
                                  className="flex flex-wrap justify-between gap-2 text-[11px] py-1.5 border-b border-rose-50 last:border-0"
                                >
                                  <span className="font-semibold text-slate-800">{don.investor_name || don.donor_name || 'Donor'}</span>
                                  <span className="font-mono font-bold text-rose-700">+৳ {Number(don.amount || 0).toLocaleString()}</span>
                                  <span className="text-slate-400 font-mono w-full sm:w-auto">
                                    {don.created_at ? new Date(don.created_at).toLocaleString() : ''}
                                  </span>
                                </div>
                              ))}
                            </WalletCollapsibleSection>

                            {Array.isArray(d.useOfFunds) && d.useOfFunds.filter(Boolean).length > 0 && (
                              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
                                <h3 className="text-sm font-bold text-slate-900">Use of funds</h3>
                                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                                  {d.useOfFunds.filter(Boolean).map((u, i) => (
                                    <li key={i}>{u}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {Array.isArray(d.proofLinks) && d.proofLinks.length > 0 && (
                              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
                                <h3 className="text-sm font-bold text-slate-900">Proof links</h3>
                                <ul className="space-y-1 text-xs text-slate-700">
                                  {d.proofLinks.map((p, i) => (
                                    <li key={i} className="truncate">
                                      <span className="font-semibold">{p.type || 'Link'}:</span>{' '}
                                      {p.url ? (
                                        <a href={p.url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline break-all">{p.url}</a>
                                      ) : '—'}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : publicReliefCampaigns.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPublicRelief.map((d) => (
                          <button
                            type="button"
                            key={d.id}
                            onClick={() => { setReliefDetail(d); setShowReliefDonationHistory(false); setReliefStatPanel(null); }}
                            className="text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 hover:border-emerald-300 hover:ring-2 hover:ring-emerald-100 cursor-pointer transition-all"
                          >
                            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-md uppercase">{d.cause || 'Relief'}</span>
                            <h3 className="font-bold text-slate-900 text-base">{d.title}</h3>
                            <p className="text-xs text-slate-500">{d.university}</p>
                            <p className="text-xs text-slate-600 line-clamp-2">{d.description || d.beneficiary}</p>
                            <p className="text-xs font-mono text-slate-600">Goal ৳ {Number(d.goal || 0).toLocaleString()} · Raised ৳ {Number(d.raised || 0).toLocaleString()}</p>
                            <p className="text-[10px] font-semibold text-emerald-700">View details →</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
                        <Heart className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700">No approved relief campaigns to support yet.</p>
                      </div>
                    )
                  )}

                  {reliefPageMode === 'mine' && (
                    <div className="space-y-4 max-w-3xl">
                      {showReliefCreateForm && (
                        <form onSubmit={handleSaveReliefDrive} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                          <div className="flex justify-between items-center">
                            <h2 className="font-bold text-slate-900 text-sm">{editingReliefId ? 'Edit Relief Campaign' : 'Create New Relief Campaign'}</h2>
                            <button type="button" onClick={() => { setShowReliefCreateForm(false); setEditingReliefId(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                          </div>
                          <p className="text-[11px] text-amber-700">
                            {editingReliefId
                              ? 'Saving edits restarts admin approval from day zero (at most 3 days).'
                              : 'Submitted for admin approval (at most 3 days). Not public until approved. Donations only — no repayment.'}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="font-semibold text-slate-700 block mb-1">Cause name <span className="text-rose-600">*</span></label>
                              <input required value={reliefForm.title} onChange={(e) => setReliefForm({ ...reliefForm, title: e.target.value })} placeholder="e.g. Flood relief for campus families" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                            <div>
                              <label className="font-semibold text-slate-700 block mb-1">Cause type</label>
                              <select value={reliefForm.cause} onChange={(e) => setReliefForm({ ...reliefForm, cause: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                <option>Student Medical Aid</option>
                                <option>Disaster Relief</option>
                                <option>Education Support</option>
                                <option>Food & Shelter</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="font-semibold text-slate-700 block mb-1">Who will this help? <span className="text-rose-600">*</span></label>
                              <input required value={reliefForm.beneficiary} onChange={(e) => setReliefForm({ ...reliefForm, beneficiary: e.target.value })} placeholder="e.g. 40 students affected by campus hostel fire" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                            <div>
                              <label className="font-semibold text-slate-700 block mb-1">Donation goal (৳)</label>
                              <input type="number" value={reliefForm.goal} onChange={(e) => setReliefForm({ ...reliefForm, goal: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                            </div>
                            <div>
                              <label className="font-semibold text-slate-700 block mb-1">Campaign duration (days)</label>
                              <input
                                type="number"
                                min={1}
                                value={reliefForm.durationDays || 60}
                                onChange={(e) => setReliefForm({ ...reliefForm, durationDays: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                              />
                            </div>
                            <div>
                              <label className="font-semibold text-slate-700 block mb-1">University</label>
                              <input value={reliefForm.university} onChange={(e) => setReliefForm({ ...reliefForm, university: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="font-semibold text-slate-700 block mb-1">Why donations are needed</label>
                              <textarea rows={3} value={reliefForm.description} onChange={(e) => setReliefForm({ ...reliefForm, description: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                            <div>
                              <label className="font-semibold text-slate-700 block mb-1">Use of funds 1</label>
                              <input value={reliefForm.use1} onChange={(e) => setReliefForm({ ...reliefForm, use1: e.target.value })} placeholder="e.g. Medicine" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                            <div>
                              <label className="font-semibold text-slate-700 block mb-1">Use of funds 2</label>
                              <input value={reliefForm.use2} onChange={(e) => setReliefForm({ ...reliefForm, use2: e.target.value })} placeholder="e.g. Temporary housing" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="font-semibold text-slate-700 block mb-1">Use of funds 3</label>
                              <input value={reliefForm.use3} onChange={(e) => setReliefForm({ ...reliefForm, use3: e.target.value })} placeholder="e.g. School supplies" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                          </div>

                          {/* S3: progress milestones — show work is being done (no repayment) */}
                          <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm">Progress milestones</h3>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Progress phases so donors can see work is happening. Donations are gifts — not repaid.
                              </p>
                            </div>
                            {reliefMilestoneDrafts.map((m, idx) => (
                              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                                <div className="md:col-span-3">
                                  <label className="font-semibold text-slate-700 block mb-1">Milestone {idx + 1}</label>
                                  <input
                                    value={m.title}
                                    onChange={(e) => {
                                      const next = [...reliefMilestoneDrafts];
                                      next[idx] = { ...next[idx], title: e.target.value };
                                      setReliefMilestoneDrafts(next);
                                    }}
                                    placeholder="e.g. Distribute emergency kits"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div className="md:col-span-1">
                                  <label className="font-semibold text-slate-700 block mb-1">Target</label>
                                  <input
                                    value={m.target}
                                    onChange={(e) => {
                                      const next = [...reliefMilestoneDrafts];
                                      next[idx] = { ...next[idx], target: e.target.value };
                                      setReliefMilestoneDrafts(next);
                                    }}
                                    placeholder="Phase 1"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div>
                                  {reliefMilestoneDrafts.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setReliefMilestoneDrafts(reliefMilestoneDrafts.filter((_, i) => i !== idx))}
                                      className="w-full px-3 py-2 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent rounded-xl text-[11px] font-semibold cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setReliefMilestoneDrafts([...reliefMilestoneDrafts, { title: '', target: `Phase ${reliefMilestoneDrafts.length + 1}` }])}
                              className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                            >
                              + Add milestone
                            </button>
                          </div>

                          {/* S3: designated successor for relief — must be an existing founder */}
                          <div className="grid grid-cols-1 gap-3">
                            <CoFounderMultiPicker
                              selected={reliefForm.coFounders || []}
                              founders={coFounderPickerOptions}
                              onChange={(next) => setReliefForm((prev) => ({ ...prev, coFounders: next }))}
                              accent="rose"
                            />
                          </div>

                          <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm">Proof links (URLs only)</h3>
                              <p className="text-[11px] text-slate-500 mt-0.5">Newspaper articles, Google Drive / cloud folders, or video links. File upload is not allowed here.</p>
                            </div>
                            {(reliefForm.proofLinks || []).map((p, idx) => (
                              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                                <div>
                                  <label className="font-semibold text-slate-700 block mb-1">Link type</label>
                                  <select
                                    value={p.type}
                                    onChange={(e) => {
                                      const next = [...reliefForm.proofLinks];
                                      next[idx] = { ...next[idx], type: e.target.value };
                                      setReliefForm({ ...reliefForm, proofLinks: next });
                                    }}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                  >
                                    <option>Newspaper / Article</option>
                                    <option>Google Drive / Cloud</option>
                                    <option>Video URL</option>
                                    <option>Other link</option>
                                  </select>
                                </div>
                                <div className="md:col-span-2">
                                  <label className="font-semibold text-slate-700 block mb-1">URL (https://…)</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="url"
                                      value={p.url}
                                      onChange={(e) => {
                                        const next = [...reliefForm.proofLinks];
                                        next[idx] = { ...next[idx], url: e.target.value };
                                        setReliefForm({ ...reliefForm, proofLinks: next });
                                      }}
                                      placeholder="https://…"
                                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                                    />
                                    {(reliefForm.proofLinks || []).length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => setReliefForm({ ...reliefForm, proofLinks: reliefForm.proofLinks.filter((_, i) => i !== idx) })}
                                        className="px-2 text-rose-600 text-[11px] font-semibold"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setReliefForm({ ...reliefForm, proofLinks: [...(reliefForm.proofLinks || []), { type: 'Other link', url: '' }] })}
                              className="px-3 py-1.5 border border-dashed border-emerald-400 text-emerald-800 font-semibold rounded-xl"
                            >
                              + Add proof URL
                            </button>
                          </div>

                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => { setShowReliefCreateForm(false); setEditingReliefId(null); }} className="px-4 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-xs font-semibold rounded-xl">Cancel</button>
                            <button type="submit" className="px-5 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer">
                              {editingReliefId ? 'Save & Restart Approval' : 'Submit for Admin Approval'}
                            </button>
                          </div>
                        </form>
                      )}

                      {reliefDrives.length > 0 ? filteredMyRelief.map((d) => {
                        const ownerView = isOwnerOfItem(d);
                        const coFounderView = isCoFounderOfItem(d);
                        return (
                        <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                          <div className="flex justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h3 className="font-bold text-slate-900 text-sm">{d.title}</h3>
                                {coFounderView && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-sky-100 text-sky-800">Co-founder</span>
                                )}
                              </div>
                              <p className="text-slate-500">{d.cause} • Help: {d.beneficiary}</p>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              d.status === 'open' || d.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                              d.status === 'rejected' || d.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>{d.status}</span>
                          </div>
                          <p className="font-mono text-slate-600">
                            Goal ৳ {Number(d.goal || 0).toLocaleString()} · Raised ৳ {Number(d.raised || 0).toLocaleString()}
                          </p>
                          {coFounderView && (
                            <p className="text-[10px] text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-2.5 py-1.5">
                              You are a co-founder — milestones and progress updates are available. Ownership actions stay with the primary founder.
                            </p>
                          )}
                          {Array.isArray(d.donations) && d.donations.length > 0 && (
                            <WalletCollapsibleSection
                              title="Recent donations"
                              count={d.donations.length}
                              open={expandedMyReliefDonationIds.has(d.id)}
                              onToggle={() => {
                                setExpandedMyReliefDonationIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(d.id)) next.delete(d.id);
                                  else next.add(d.id);
                                  return next;
                                });
                              }}
                              emptyText="No donations recorded yet."
                              accent="rose"
                              maxHeightClass="max-h-56"
                              subtitle={
                                expandedMyReliefDonationIds.has(d.id)
                                  ? 'Click the header to collapse'
                                  : 'Click this card to expand donation history'
                              }
                            >
                              {d.donations.map((don) => (
                                <div key={don.id} className="flex flex-wrap justify-between gap-2 text-[11px] py-1 border-b border-rose-50 last:border-0">
                                  <span className="font-semibold text-slate-800">{don.investor_name || 'Donor'}</span>
                                  <span className="font-mono font-bold text-rose-700">+৳ {Number(don.amount || 0).toLocaleString()}</span>
                                  <span className="text-slate-400 font-mono w-full sm:w-auto">
                                    {don.created_at ? new Date(don.created_at).toLocaleString() : ''}
                                  </span>
                                </div>
                              ))}
                            </WalletCollapsibleSection>
                          )}
                          {Array.isArray(d.proofLinks) && d.proofLinks.length > 0 && (
                            <ul className="space-y-1">
                              {d.proofLinks.map((p, i) => (
                                <li key={i} className="text-[11px] text-sky-700 truncate">
                                  <span className="font-semibold text-slate-600">{p.type}: </span>
                                  <a href={p.url} target="_blank" rel="noreferrer" className="underline">{p.url}</a>
                                </li>
                              ))}
                            </ul>
                          )}
                          {ownerView && d.status === 'rejected' && (
                            <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5">
                              Reason: {formatRejectionReason(d)}
                            </p>
                          )}
                          {ownerView && d.status === 'pending' && (
                            <p className="text-[10px] text-amber-700">Awaiting admin approval (at most 3 days). Editing restarts from day zero.</p>
                          )}
                          {readCoFounders(d).length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Co-founders</p>
                              {readCoFounders(d).map((cf) => (
                                <div key={cf.id || cf.email} className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                                  <span>{cf.name || 'Founder'}{cf.email ? ` · ${cf.email}` : ''}</span>
                                  {ownerView && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRemoveCoFounderTarget({ type: 'relief', item: d, cofounder: cf });
                                        setRemoveCoFounderMessage('');
                                        setShowRemoveCoFounderModal(true);
                                      }}
                                      className="px-2 py-0.5 text-[10px] font-semibold bg-[#047857] hover:bg-[#065f46] text-white rounded-md cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {ownerView && pendingCoFounderAppsFor('relief', d.id || d._id).map((app) => (
                            <div key={app.id} className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg space-y-2">
                              <p className="text-[11px] text-rose-900 font-semibold">
                                Co-founder application: {app.applicant_name}
                              </p>
                              <p className="text-[11px] text-slate-600 whitespace-pre-wrap">{app.reason}</p>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => reviewCoFounderApp(app, 'accepted')} className="px-2.5 py-1 bg-[#047857] hover:bg-[#065f46] text-white text-[10px] font-semibold rounded-md cursor-pointer">
                                  Accept
                                </button>
                                <button type="button" onClick={() => reviewCoFounderApp(app, 'rejected')} className="px-2.5 py-1 bg-[#047857] hover:bg-[#065f46] text-white text-[10px] font-semibold rounded-md cursor-pointer">
                                  Decline
                                </button>
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-2 flex-wrap">
                            {(d.status === 'open' || d.status === 'verified' || d.status === 'pending') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTimelineCampaignId(d.id || d._id);
                                  setSelectedMilestoneIdx(null);
                                  setActiveTab('milestones');
                                }}
                                className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-lg cursor-pointer"
                              >
                                Milestones
                              </button>
                            )}
                            {ownerView && d.status === 'pending' && (
                              <button type="button" onClick={() => handleOpenEditRelief(d)} className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-lg cursor-pointer">Edit</button>
                            )}
                            {ownerView && (d.status === 'rejected' || d.status === 'cancelled') && (
                              <button type="button" onClick={() => handleOpenEditRelief(d)} className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-lg cursor-pointer">Reapply</button>
                            )}
                            {ownerView && d.status === 'rejected' && (
                              <button type="button" onClick={() => handleDeleteRejectedRelief(d.id)} className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-lg cursor-pointer">Delete</button>
                            )}
                            {ownerView && (d.status === 'open' || d.status === 'verified') && (
                              <button
                                type="button"
                                onClick={() => openEditRequestModal('relief', d)}
                                className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-lg cursor-pointer"
                              >
                                {pendingEditFor('relief', d.id) ? 'Edit pending…' : 'Request edit'}
                              </button>
                            )}
                            {/* S3: founder donate to own relief from wallet */}
                            {ownerView && (d.status === 'open' || d.status === 'verified') && (
                              <button
                                type="button"
                                onClick={() => openSelfFundModal('relief', d)}
                                className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-lg cursor-pointer"
                              >
                                Donate
                              </button>
                            )}
                            {ownerView && (d.status === 'open' || d.status === 'verified' || d.status === 'pending') && (
                              <button
                                type="button"
                                onClick={() => openHandoverModal('relief', d)}
                                className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-lg cursor-pointer"
                              >
                                {pendingHandoverFor('relief', d.id) ? 'Handover pending…' : 'Handover responsibility'}
                              </button>
                            )}
                          </div>
                          {ownerView && pendingEditFor('relief', d.id) && (
                            <p className="text-[10px] text-violet-700">
                              Edit request pending — admin review at most 2 working days.
                            </p>
                          )}
                          {ownerView && pendingHandoverFor('relief', d.id) && (
                            <p className="text-[10px] text-amber-800">
                              Handover pending admin approval — ownership moves to the elected new founder when approved.
                            </p>
                          )}
                        </div>
                      ); }) : (
                        !showReliefCreateForm && (
                          <div className="py-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl space-y-3">
                            <p className="text-xs text-slate-500">You have no relief campaigns yet.</p>
                            <button
                              type="button"
                              onClick={openReliefCreateForm}
                              className="px-4 py-2 bg-[#047857] text-white text-xs font-semibold rounded-xl cursor-pointer"
                            >
                              Create New Relief Campaign
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: INVESTORS — collapsible sections (Who invested / Proposals / Directory) */}
              {activeTab === 'investors' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Investors</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Expand each section to filter and browse. Click a section header to hide it again.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubmittedProposalsSection(true);
                        setInvestorPropFilter('pending');
                      }}
                      className={`text-left bg-white border rounded-2xl p-5 shadow-sm cursor-pointer ${investorPropFilter === 'pending' && showSubmittedProposalsSection ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'}`}
                    >
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">Pending review</span>
                      <span className="text-2xl font-bold text-amber-700 font-mono">{pendingProposalCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubmittedProposalsSection(true);
                        setInvestorPropFilter('accepted');
                      }}
                      className={`text-left bg-white border rounded-2xl p-5 shadow-sm cursor-pointer ${investorPropFilter === 'accepted' && showSubmittedProposalsSection ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'}`}
                    >
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">Accepted (invested)</span>
                      <span className="text-2xl font-bold text-emerald-700 font-mono">{acceptedProposalCount}</span>
                    </button>
                    <div className="bg-[#064E3B] rounded-2xl p-5 text-white shadow-sm">
                      <span className="text-[10px] font-mono uppercase text-emerald-200/80 tracking-wider block">Raised (invested + donated)</span>
                      <span className="text-2xl font-bold font-mono">৳ {investedOrDonatedTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* S3: Who invested / donated — filters live inside this hidable card */}
                  <WalletCollapsibleSection
                    title="Who invested / donated"
                    count={whoInvestedOrDonated.length}
                    open={showWhoInvestedSection}
                    onToggle={() => setShowWhoInvestedSection((v) => !v)}
                    subtitle={
                      showWhoInvestedSection
                        ? `৳ ${investedOrDonatedTotal.toLocaleString()} total${reliefDonatedRaised > 0 ? ` · ৳ ${reliefDonatedRaised.toLocaleString()} donated` : ''} · click header to collapse`
                        : `Accepted startup offers + relief donors · ৳ ${investedOrDonatedTotal.toLocaleString()} total`
                    }
                    scrollBody
                    maxHeightClass="max-h-[28rem]"
                  >
                    <div className="space-y-3">
                      <FilterBar
                        open={showWhoInvestedFilters}
                        onToggle={() => setShowWhoInvestedFilters((v) => !v)}
                        activeCount={activeFilterCount(whoInvestedFilters)}
                        onReset={() => setWhoInvestedFilters({ roleType: 'all', amount: 'all', campaign: 'all' })}
                      >
                        <FilterSelect
                          label="Type"
                          value={whoInvestedFilters.roleType}
                          onChange={(v) => setWhoInvestedFilters((p) => ({ ...p, roleType: v }))}
                          options={[
                            { value: 'all', label: 'Startup + relief' },
                            { value: 'investment', label: 'Startup investor' },
                            { value: 'donation', label: 'Relief donor' }
                          ]}
                        />
                        <FilterSelect
                          label="Amount"
                          value={whoInvestedFilters.amount}
                          onChange={(v) => setWhoInvestedFilters((p) => ({ ...p, amount: v }))}
                          options={[
                            { value: 'all', label: 'Any amount' },
                            { value: 'low', label: 'Under ৳50k' },
                            { value: 'mid', label: '৳50k–200k' },
                            { value: 'high', label: '৳200k+' }
                          ]}
                        />
                        <FilterSelect
                          label="Campaign / relief"
                          value={whoInvestedFilters.campaign}
                          onChange={(v) => setWhoInvestedFilters((p) => ({ ...p, campaign: v }))}
                          options={[
                            { value: 'all', label: 'All campaigns' },
                            ...investorCampaignOptions.map((t) => ({ value: t, label: t }))
                          ]}
                        />
                      </FilterBar>
                      {whoInvestedOrDonated.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {whoInvestedOrDonated.map((row) => {
                            const isDonation = row.kind === 'donation';
                            return (
                              <button
                                type="button"
                                key={row.id}
                                onClick={() => {
                                  if (row.proposal) {
                                    setSelectedProposal(row.proposal);
                                    setInvestorPropFilter('accepted');
                                    setShowSubmittedProposalsSection(true);
                                  } else if (isDonation) {
                                    setActiveTab('relief');
                                    setReliefPageMode('mine');
                                  }
                                }}
                                className={`text-left rounded-xl p-3 cursor-pointer transition-all border ${
                                  isDonation
                                    ? 'bg-rose-50/70 border-rose-100 hover:border-rose-300'
                                    : 'bg-emerald-50/70 border-emerald-100 hover:border-emerald-300'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <InitialsAvatar name={row.name} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-bold text-slate-900 text-sm truncate">{row.name}</p>
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                        isDonation ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {isDonation ? 'Relief' : 'Startup'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate">{row.campaignTitle}</p>
                                    <p className={`text-sm font-mono font-bold mt-1 ${isDonation ? 'text-rose-700' : 'text-emerald-700'}`}>
                                      ৳ {Number(row.amount || 0).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 py-4 text-center">No investments or donations match your filters yet.</p>
                      )}
                    </div>
                  </WalletCollapsibleSection>

                  {/* S3: Submitted proposals — full-card hidable section */}
                  <WalletCollapsibleSection
                    title="Submitted investor proposals"
                    count={investorTabProposals.length}
                    open={showSubmittedProposalsSection}
                    onToggle={() => setShowSubmittedProposalsSection((v) => !v)}
                    subtitle={
                      showSubmittedProposalsSection
                        ? 'Review, renegotiate, accept, or reject term sheets · click header to collapse'
                        : 'Review, renegotiate, accept, or reject term sheets'
                    }
                    scrollBody={false}
                  >
                  <>
                  <FilterBar
                    open={showProposalListFilters}
                    onToggle={() => setShowProposalListFilters((v) => !v)}
                    activeCount={activeFilterCount(proposalListFilters)}
                    onReset={() => setProposalListFilters({ proposalStatus: 'all', amount: 'all', campaign: 'all' })}
                  >
                    <FilterSelect
                      label="Proposal status"
                      value={proposalListFilters.proposalStatus}
                      onChange={(v) => setProposalListFilters((p) => ({ ...p, proposalStatus: v }))}
                      options={[
                        { value: 'all', label: 'All statuses' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'negotiating', label: 'Negotiating' },
                        { value: 'accepted', label: 'Accepted' },
                        { value: 'declined', label: 'Declined' }
                      ]}
                    />
                    <FilterSelect
                      label="Amount"
                      value={proposalListFilters.amount}
                      onChange={(v) => setProposalListFilters((p) => ({ ...p, amount: v }))}
                      options={[
                        { value: 'all', label: 'Any amount' },
                        { value: 'low', label: 'Under ৳50k' },
                        { value: 'mid', label: '৳50k–200k' },
                        { value: 'high', label: '৳200k+' }
                      ]}
                    />
                    <FilterSelect
                      label="Campaign"
                      value={proposalListFilters.campaign}
                      onChange={(v) => setProposalListFilters((p) => ({ ...p, campaign: v }))}
                      options={[
                        { value: 'all', label: 'All campaigns' },
                        ...investorCampaignOptions.map((t) => ({ value: t, label: t }))
                      ]}
                    />
                  </FilterBar>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'pending', 'accepted', 'declined'].map((key) => (
                      <button key={key} type="button" onClick={() => setInvestorPropFilter(key)} className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg cursor-pointer ${investorPropFilter === key ? 'bg-[#047857] text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {key === 'all' ? 'All' : key.charAt(0).toUpperCase() + key.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* INVESTORS GRID & PROPOSALS */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">

                      {investorTabProposals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {investorTabProposals.map((p, idx) => {
                            const st = String(p.status || 'pending').toLowerCase();
                            const canAct = st === 'pending' || st === 'negotiating';
                            const displayAmt = st === 'negotiating' && p.counter_amount != null
                              ? Number(p.counter_amount)
                              : Number(p.amount || 0);
                            return (
                            <div
                              key={p.id || p._id || idx}
                              onClick={() => { setSelectedProposal(p); setShowNegotiateForm(false); }}
                              className={`bg-white border rounded-2xl p-5 shadow-sm cursor-pointer transition-all ${selectedProposal?.id === p.id ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <InitialsAvatar name={p.investor_name || 'Investor'} />
                                  <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{p.investor_name || p.investorName || 'Investor'}</h4>
                                    <span className="text-[11px] text-slate-500 block">{p.campaign_title || p.return_structure || p.terms || 'Term sheet'}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded ${
                                      st === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                                      st === 'declined' || st === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                      st === 'negotiating' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                    {(p.status || 'PENDING').toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                                <div className="flex justify-between text-slate-600">
                                  <span>{st === 'negotiating' && p.counter_amount != null ? 'Counter amount' : 'Offer Amount'}</span>
                                  <span className="font-bold text-slate-900 font-mono">৳ {displayAmt.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                  <span>Return Structure</span>
                                  <span className="font-semibold text-slate-900">
                                    {(st === 'negotiating' && p.counter_terms) ? p.counter_terms : (p.return_structure || p.terms || 'N/A')}
                                  </span>
                                </div>
                              </div>
                                <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                                  {canAct && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => { setSelectedProposal(p); openNegotiateForm(p); }}
                                        className="px-2.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                                      >
                                        {st === 'negotiating' ? 'Renegotiate' : 'Negotiate'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleProposalStatus(p.id || p._id, 'declined')}
                                        className="px-2.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                                      >
                                        Reject
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleProposalStatus(p.id || p._id, 'accepted')}
                                        className="px-2.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                                      >
                                        Accept
                                      </button>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => openChatWithInvestor({
                                      id: p.investor_id || p.investorId || 'usr_investor_1',
                                      name: p.investor_name || p.investorName || 'Investor'
                                    })}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                                    title="Send direct message to this investor"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Message Investor</span>
                                  </button>
                                </div>
                            </div>
                            );
                          })}
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
                              <span className="font-bold text-slate-900">{selectedProposal.return_structure || selectedProposal.terms || '—'}</span>
                            </div>
                            {selectedProposal.maturity_period ? (
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                              <span className="text-slate-500">Maturity Period</span>
                              <span className="font-bold text-slate-900">{selectedProposal.maturity_period}</span>
                            </div>
                            ) : null}
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

                          {/* S3: show founder counter-offer if negotiating */}
                          {(selectedProposal.counter_amount != null || String(selectedProposal.status || '').toLowerCase() === 'negotiating') && (
                            <div className="space-y-2 p-3.5 bg-sky-50 border border-sky-200/80 rounded-xl">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-800 font-bold block">Your counter-offer</span>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Counter amount</span>
                                <span className="font-bold text-sky-900 font-mono">৳ {Number(selectedProposal.counter_amount || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Counter terms</span>
                                <span className="font-bold text-slate-900">{selectedProposal.counter_terms || '—'}</span>
                              </div>
                              {selectedProposal.negotiate_message ? (
                                <p className="text-xs text-slate-700 italic pt-1">"{selectedProposal.negotiate_message}"</p>
                              ) : null}
                            </div>
                          )}

                          {/* S3: negotiate form */}
                          {showNegotiateForm && ['pending', 'negotiating'].includes(String(selectedProposal.status || 'pending').toLowerCase()) && (
                            <div className="space-y-3 p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">Negotiate / counter-offer</span>
                              <label className="block space-y-1">
                                <span className="text-[10px] text-slate-500 font-semibold">Counter amount (৳)</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={negotiateAmount}
                                  onChange={(e) => setNegotiateAmount(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                              </label>
                              <label className="block space-y-1">
                                <span className="text-[10px] text-slate-500 font-semibold">Counter terms</span>
                                <input
                                  type="text"
                                  value={negotiateTerms}
                                  onChange={(e) => setNegotiateTerms(e.target.value)}
                                  placeholder="e.g. 6% Revenue Share"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                              </label>
                              <label className="block space-y-1">
                                <span className="text-[10px] text-slate-500 font-semibold">Message to investor (optional)</span>
                                <textarea
                                  rows={2}
                                  value={negotiateMessage}
                                  onChange={(e) => setNegotiateMessage(e.target.value)}
                                  placeholder="Explain your counter…"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                              </label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={negotiatingProposal}
                                  onClick={handleNegotiateProposal}
                                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                                >
                                  {negotiatingProposal ? 'Sending…' : 'Send counter-offer'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowNegotiateForm(false)}
                                  className="px-3 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent font-semibold text-xs rounded-xl cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {['pending', 'negotiating'].includes(String(selectedProposal.status || 'pending').toLowerCase()) ? (
                        <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                          {!showNegotiateForm && (
                            <button
                              type="button"
                              onClick={() => openNegotiateForm(selectedProposal)}
                              className="w-full py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent font-semibold text-xs rounded-xl transition-all cursor-pointer"
                            >
                              {String(selectedProposal.status).toLowerCase() === 'negotiating'
                                ? 'Renegotiate / Update counter-offer'
                                : 'Negotiate / Counter-offer'}
                            </button>
                          )}
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleProposalStatus(selectedProposal.id || selectedProposal._id, 'declined')}
                              className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent font-semibold text-xs rounded-xl transition-all cursor-pointer"
                            >
                              Reject Offer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProposalStatus(selectedProposal.id || selectedProposal._id, 'accepted')}
                              className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                            >
                              {selectedProposal.counter_amount != null ? 'Accept counter terms' : 'Accept Offer'}
                            </button>
                          </div>
                        </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 pt-4 border-t border-slate-100">Already reviewed. Accepted offers count as invested on this campaign.</p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 my-auto">
                        Select a proposal from the left to view financial terms.
                      </div>
                    )}
                  </div>
                  </>
                  </WalletCollapsibleSection>

                  {/* S3: Registered investors directory — hidable + own filters */}
                  <WalletCollapsibleSection
                    title="Registered investors"
                    count={directoryInvestors.length}
                    open={showRegisteredInvestorsSection}
                    onToggle={() => setShowRegisteredInvestorsSection((v) => !v)}
                    subtitle={
                      showRegisteredInvestorsSection
                        ? 'Platform investor directory · click header to collapse'
                        : 'Browse registered investors on FundBridge'
                    }
                    scrollBody
                    maxHeightClass="max-h-[28rem]"
                  >
                    <div className="space-y-3">
                      <FilterBar
                        open={showDirectoryFilters}
                        onToggle={() => setShowDirectoryFilters((v) => !v)}
                        activeCount={activeFilterCount(directoryFilters)}
                        onReset={() => setDirectoryFilters({ affiliation: 'all', university: 'all' })}
                      >
                        <FilterSelect
                          label="Affiliation"
                          value={directoryFilters.affiliation}
                          onChange={(v) => setDirectoryFilters((p) => ({ ...p, affiliation: v }))}
                          options={[
                            { value: 'all', label: 'All affiliations' },
                            { value: 'alumni', label: 'Alumni' },
                            { value: 'firm', label: 'Firm / syndicate' },
                            { value: 'angel', label: 'Angel' }
                          ]}
                        />
                        <FilterSelect
                          label="University / institution"
                          value={directoryFilters.university}
                          onChange={(v) => setDirectoryFilters((p) => ({ ...p, university: v }))}
                          options={[
                            { value: 'all', label: 'All institutions' },
                            ...investorUniversityOptions.map((u) => ({ value: u, label: u }))
                          ]}
                        />
                      </FilterBar>
                      {directoryInvestors.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {directoryInvestors.map((inv) => (
                            <button
                              type="button"
                              key={inv.id || inv._id}
                              onClick={() => openInvestorDetail(inv)}
                              className={`bg-white border rounded-2xl p-4 shadow-sm text-left cursor-pointer transition-all ${
                                (selectedInvestor?.id || selectedInvestor?._id) === (inv.id || inv._id)
                                  ? 'border-sky-500 ring-2 ring-sky-500/20'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <InitialsAvatar name={inv.name || 'Investor'} />
                                <div className="min-w-0">
                                  <h4 className="font-bold text-slate-900 text-sm truncate">{inv.name || 'Investor'}</h4>
                                  <span className="text-[11px] text-slate-500 block truncate">{inv.institution || inv.university || inv.email || 'Investor'}</span>
                                </div>
                              </div>
                              {inv.bio ? (
                                <p className="mt-3 text-[11px] text-slate-600 leading-snug line-clamp-3">{inv.bio}</p>
                              ) : null}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-700 text-center py-6">No registered investors match your filters.</p>
                      )}
                    </div>
                  </WalletCollapsibleSection>
                </div>
              )}

              {/* TAB 4: WALLET — S3: ledger from accepted investor proposals (no payment gateway) */}
              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Wallet</h1>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Accept investments or Add Money with payment proof. Admin verifies top-ups before credit.
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
                        onClick={() => setShowPayoutModal(true)}
                        className="px-4 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Request Payout</span>
                      </button>
                      <button
                        type="button"
                        onClick={exportWalletLedgerCSV}
                        className="px-4 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export Ledger CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
                    <Info className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>
                      We are building a full online payment gateway. <strong>For now, Add Money is manual:</strong> pay via bKash, bank, or other, upload your receipt (click the dashed box below in the Add Money form), and an admin verifies it before your wallet is credited. This is the only place to add money.
                    </span>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
                    <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      {walletNote || 'Accepted investments and admin-verified top-ups credit this wallet (ledger display).'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Wallet balance</span>
                      <h3 className="text-3xl font-bold text-emerald-700 font-mono">৳ {Number(walletBalance || 0).toLocaleString()}</h3>
                      <p className="text-[11px] text-slate-500">Accepted investments + verified Add Money</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">In escrow / wallet</span>
                      <h3 className="text-3xl font-bold text-slate-900 font-mono">৳ {Number(walletInEscrow || 0).toLocaleString()}</h3>
                      <p className="text-[11px] text-slate-500">Held against your live campaigns</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Available to request</span>
                      <h3 className="text-3xl font-bold text-sky-600 font-mono">৳ {Number(walletAvailable || 0).toLocaleString()}</h3>
                      <p className="text-[11px] text-slate-500">After pending payout requests</p>
                    </div>
                  </div>

                  <WalletCollapsibleSection
                    title="Investment inflows"
                    count={walletInflows.length}
                    open={showWalletInflowsHistory}
                    onToggle={() => setShowWalletInflowsHistory((v) => !v)}
                    emptyText="No investor credits yet. Accept a proposal or receive a relief donation to credit this wallet."
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                            <th className="pb-2 font-semibold">Investor</th>
                            <th className="pb-2 font-semibold">Campaign</th>
                            <th className="pb-2 font-semibold">Amount</th>
                            <th className="pb-2 font-semibold">When</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {walletInflows.map((row) => (
                            <tr key={row.id || `${row.proposal_id}-${row.created_at}`} className="hover:bg-slate-50/80">
                              <td className="py-2.5 font-semibold text-slate-900">
                                {row.investor_name || row.investor_id || 'Investor'}
                                {row.type === 'RELIEF_DONATION_IN' && (
                                  <span className="ml-1.5 text-[10px] font-bold uppercase text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">Relief</span>
                                )}
                              </td>
                              <td className="py-2.5 text-slate-600">{row.campaign_title || row.campaign_id || '—'}</td>
                              <td className="py-2.5 font-mono font-bold text-emerald-700">+ ৳ {Number(row.amount || 0).toLocaleString()}</td>
                              <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                                {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </WalletCollapsibleSection>

                  <WalletCollapsibleSection
                    title="Add Money requests"
                    count={walletDeposits.length}
                    open={showWalletDepositsHistory}
                    onToggle={() => setShowWalletDepositsHistory((v) => !v)}
                    emptyText="No Add Money requests yet. Use Add Money to submit a manual top-up with proof."
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                            <th className="pb-2 font-semibold">Amount</th>
                            <th className="pb-2 font-semibold">Method</th>
                            <th className="pb-2 font-semibold">Reference</th>
                            <th className="pb-2 font-semibold">Proof</th>
                            <th className="pb-2 font-semibold">Status</th>
                            <th className="pb-2 font-semibold">When</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {walletDeposits.map((d) => (
                            <tr key={d.id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 font-mono font-bold text-slate-900">৳ {Number(d.amount || 0).toLocaleString()}</td>
                              <td className="py-2.5 uppercase font-semibold text-slate-700">{d.method || '—'}</td>
                              <td className="py-2.5 text-slate-600 font-mono text-[11px]">{d.reference || '—'}</td>
                              <td className="py-2.5">
                                {d.proof_url ? (
                                  <a
                                    href={`${API_BASE_URL}${d.proof_url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sky-700 font-semibold hover:underline"
                                  >
                                    View proof
                                  </a>
                                ) : '—'}
                              </td>
                              <td className="py-2.5">
                                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase ${
                                  d.status === 'approved' ? 'bg-emerald-500 text-white' :
                                  d.status === 'rejected' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                                }`}>
                                  {d.status || 'pending'}
                                </span>
                              </td>
                              <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                                {d.created_at ? new Date(d.created_at).toLocaleString() : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </WalletCollapsibleSection>

                  <WalletCollapsibleSection
                    title="Payout requests"
                    count={payoutsList.length}
                    open={showWalletPayoutsHistory}
                    onToggle={() => setShowWalletPayoutsHistory((v) => !v)}
                    emptyText="No payout requests yet. Use Request Payout to record one (ledger only)."
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                            <th className="pb-2 font-semibold">Tranche / reason</th>
                            <th className="pb-2 font-semibold">Amount</th>
                            <th className="pb-2 font-semibold">Method</th>
                            <th className="pb-2 font-semibold">Status</th>
                            <th className="pb-2 font-semibold">Hash / date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {payoutsList.map((p, idx) => (
                            <tr key={p.id || p.hash || idx} className="hover:bg-slate-50/80">
                              <td className="py-2.5 font-semibold text-slate-900">{p.tranche || 'Escrow Disbursement'}</td>
                              <td className="py-2.5 font-mono font-bold text-slate-900">৳ {Number(p.amount || 0).toLocaleString()}</td>
                              <td className="py-2.5">
                                <span className="px-2 py-0.5 bg-pink-50 text-pink-700 text-[10px] font-bold rounded">{p.method || 'bKash'}</span>
                              </td>
                              <td className="py-2.5">
                                <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-md uppercase">{p.status || 'PENDING'}</span>
                              </td>
                              <td className="py-2.5 text-slate-500 font-mono text-[11px]">{p.hash || p.created_at || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </WalletCollapsibleSection>
                </div>
              )}

              {/* TAB 5: MILESTONES — S3: startup + relief (relief = work proofs, no repayment) */}
              {activeTab === 'milestones' && (
                <div className="space-y-6">
                  {/* MILESTONE-BASED INVESTMENT RELEASE WORKFLOW (SERIES A TRANCHES) */}
                  <MilestoneReleaseWorkflow
                    userRole="founder"
                    currentUserId={myFounderId}
                    API_BASE_URL={API_BASE_URL}
                  />

                  <div className="pt-6 border-t border-slate-200">
                    <span className="text-[10px] font-mono uppercase text-[#0284C7] tracking-widest font-bold block">ACTIVE CAMPAIGN & RELIEF TRACKING</span>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 font-display mt-0.5">Campaign Deliverable Logs</h2>
                  </div>

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        Pick a startup or relief campaign to inspect individual delivery proof items.
                      </p>
                    </div>
                    {manageableMilestoneProjects.length > 0 && (
                      <select
                        value={(activeMilestoneProject && (activeMilestoneProject.id || activeMilestoneProject._id)) || ''}
                        onChange={(e) => {
                          setTimelineCampaignId(e.target.value);
                          setSelectedMilestoneIdx(null);
                        }}
                        className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 font-medium max-w-xs"
                      >
                        {manageableCampaigns.length > 0 && (
                          <optgroup label="Startup campaigns">
                            {manageableCampaigns.map((c) => (
                              <option key={c.id || c._id} value={c.id || c._id}>
                                {c.title} ({(c.verified || c.status === 'verified') ? 'Live' : (c.status || 'pending')})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {manageableReliefForMilestones.length > 0 && (
                          <optgroup label="Relief campaigns">
                            {manageableReliefForMilestones.map((d) => (
                              <option key={d.id || d._id} value={d.id || d._id}>
                                {d.title} ({d.status || 'pending'})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    )}
                  </div>

                  {activeMilestoneProject && Array.isArray(activeMilestoneProject.milestones) && activeMilestoneProject.milestones.length > 0 && (() => {
                    const doneN = activeMilestoneProject.milestones.filter((m) => getMilestoneBucket(m) === 'done').length;
                    const missedN = activeMilestoneProject.milestones.filter((m) => getMilestoneBucket(m) === 'missed').length;
                    const pendingN = activeMilestoneProject.milestones.length - doneN - missedN;
                    return (
                      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 space-y-2">
                        <p className="text-xs font-bold text-sky-900">
                          Milestones for: <span className="text-emerald-800">{activeMilestoneProject.title}</span>
                          {isReliefProject(activeMilestoneProject) && (
                            <span className="ml-2 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] uppercase">Relief · donation</span>
                          )}
                        </p>
                        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">{doneN} done</span>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">{pendingN} pending</span>
                          <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800">{missedN} missed</span>
                        </div>
                        <p className="text-[10px] text-slate-500">Pending milestones can be edited. Missed milestones can be redone.</p>
                      </div>
                    );
                  })()}

                  {activeMilestoneProject && activeMilestoneProject.milestones && activeMilestoneProject.milestones.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">Configured Milestones</h3>
                            <p className="text-[11px] text-slate-500">
                              {isReliefProject(activeMilestoneProject) ? 'Relief' : 'Campaign'}: <strong className="text-slate-800">{activeMilestoneProject.title}</strong> — click a milestone for actions.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddMilestone}
                            className="px-3 py-1.5 bg-[#047857] text-white text-[11px] font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add milestone
                          </button>
                        </div>
                        <ScrollHistoryPanel
                          title="Milestone list"
                          count={activeMilestoneProject.milestones.length}
                          open={showMilestonesList}
                          onToggle={() => setShowMilestonesList((v) => !v)}
                          emptyText="No milestones configured."
                          accent="emerald"
                          maxHeightClass="max-h-80"
                        >
                          <div className="space-y-3">
                            {activeMilestoneProject.milestones.map((m, idx) => {
                              const selected = selectedMilestoneIdx === idx;
                              const proofCount = Array.isArray(m.proofs) ? m.proofs.length : 0;
                              const bucket = getMilestoneBucket(m, activeMilestoneProject);
                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setSelectedMilestoneIdx(idx);
                                    setMilestoneProofFile(null);
                                    setMilestoneProofNote('');
                                    setCertifyChecked(false);
                                    setMilestoneEditTitle(m.name || m.title || '');
                                    setMilestoneEditTarget(m.targetDate || m.target || '');
                                  }}
                                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                    selected
                                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                                      : 'border-slate-200 hover:border-sky-500 bg-slate-50/50'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-900 text-sm">{m.name || m.title || `Milestone #${idx + 1}`}</h4>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                                      bucket === 'done'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : bucket === 'missed'
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {bucket}
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-500 block mt-1">Target: {m.targetDate || m.target || 'TBD'}</span>
                                  <span className="text-[10px] text-slate-400 block mt-1">
                                    {proofCount > 0 ? `${proofCount} proof file(s) on record` : 'No proofs uploaded yet'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollHistoryPanel>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        {selectedMilestoneIdx === null || !activeMilestoneProject.milestones[selectedMilestoneIdx] ? (
                          <div className="py-16 text-center space-y-2">
                            <Flag className="w-8 h-8 text-slate-300 mx-auto" />
                            <h3 className="font-bold text-slate-900 text-sm">Select a milestone</h3>
                            <p className="text-xs text-slate-500 max-w-xs mx-auto">
                              Choose a milestone on the left. Proof upload (and Publish Update for startups) appears here for that item only.
                            </p>
                          </div>
                        ) : (
                          (() => {
                            const m = activeMilestoneProject.milestones[selectedMilestoneIdx];
                            const milestoneLabel = m.name || m.title || `Milestone #${selectedMilestoneIdx + 1}`;
                            const proofs = Array.isArray(m.proofs) ? m.proofs : [];
                            const bucket = getMilestoneBucket(m, activeMilestoneProject);
                            const canAdjust = bucket !== 'done';
                            const reliefMode = isReliefProject(activeMilestoneProject);
                            return (
                              <>
                                <div className="border-b border-slate-100 pb-3 space-y-1">
                                  <h3 className="font-bold text-slate-900 text-base">Actions for this milestone</h3>
                                  <p className="text-xs text-slate-600">
                                    {reliefMode ? 'Relief' : 'Campaign'}: <span className="font-semibold text-slate-800">{activeMilestoneProject.title}</span>
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    Verifying: <span className="font-semibold text-emerald-800">{milestoneLabel}</span>
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    Target {m.targetDate || m.target || 'TBD'} · Status {bucket}
                                    {reliefMode ? ' · Donation progress' : ''}
                                  </p>
                                </div>

                                {canAdjust && (
                                  <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <p className="text-[11px] font-semibold text-slate-700">Adjust milestone</p>
                                    <p className="text-[10px] text-slate-500">
                                      Time: if target is “Month N” / “Phase N”, missed is automatic when that window has passed since submission
                                      ({activeMilestoneProject.submitted_at || activeMilestoneProject.created_at
                                        ? new Date(activeMilestoneProject.submitted_at || activeMilestoneProject.created_at).toLocaleDateString()
                                        : 'submission date unknown'}).
                                      Redo is only for missed milestones. Changes may take some time because admin approval is required.
                                    </p>
                                    <input
                                      type="text"
                                      value={milestoneEditTitle}
                                      onChange={(e) => setMilestoneEditTitle(e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                                      placeholder="Milestone title"
                                    />
                                    <input
                                      type="text"
                                      value={milestoneEditTarget}
                                      onChange={(e) => setMilestoneEditTarget(e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                                      placeholder="Target / duration (e.g. Month 2)"
                                    />
                                    {bucket === 'missed' && (
                                      <button
                                        type="button"
                                        onClick={() => handleRedoMilestone(selectedMilestoneIdx)}
                                        className="w-full px-3 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                                      >
                                        Redo missed milestone
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleSaveMilestoneEdits(selectedMilestoneIdx)}
                                      className="w-full px-3 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                                    >
                                      Save edits
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMilestone(selectedMilestoneIdx)}
                                      className="w-full px-3 py-2 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-[11px] font-semibold rounded-lg cursor-pointer"
                                    >
                                      Delete milestone
                                    </button>
                                  </div>
                                )}

                                {!reliefMode && (
                                  <button
                                    type="button"
                                    onClick={() => openAnnouncementForMilestone(selectedMilestoneIdx)}
                                    className="w-full py-3 px-4 bg-[#047857] hover:bg-[#065f46] text-white font-semibold text-xs rounded-xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span>Publish Update for this milestone</span>
                                  </button>
                                )}

                                <div className="space-y-3 pt-2">
                                  <h4 className="font-bold text-slate-900 text-sm">Proof upload for “{milestoneLabel}”</h4>
                                  <p className="text-[11px] text-slate-500">
                                    {reliefMode
                                      ? 'Upload receipts, distribution photos, or reports that prove relief work was done for this phase.'
                                      : 'Upload receipts, bank/MFS statements, screenshots, or other documents that prove this milestone is complete.'}
                                  </p>
                                  <label className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center bg-slate-50 space-y-2 block cursor-pointer hover:border-sky-400 transition-colors">
                                    <Upload className="w-7 h-7 text-sky-600 mx-auto" />
                                    <span className="text-xs font-bold text-slate-800 block">
                                      {milestoneProofFile ? milestoneProofFile.name : 'Choose proof file for this milestone'}
                                    </span>
                                    <span className="text-[11px] text-slate-400 block">PDF, JPG, or PNG (Max 5MB)</span>
                                    <input
                                      type="file"
                                      accept=".jpg,.jpeg,.png,.pdf"
                                      className="hidden"
                                      onChange={(e) => setMilestoneProofFile(e.target.files?.[0] || null)}
                                    />
                                  </label>
                                  <div>
                                    <label className="font-semibold text-slate-700 block mb-1 text-xs">What does this file prove?</label>
                                    <input
                                      type="text"
                                      value={milestoneProofNote}
                                      onChange={(e) => setMilestoneProofNote(e.target.value)}
                                      placeholder={`e.g. bKash receipt for ${milestoneLabel}`}
                                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                                    />
                                  </div>
                                  <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={certifyChecked}
                                      onChange={(e) => setCertifyChecked(e.target.checked)}
                                      className="mt-0.5 rounded text-emerald-600"
                                    />
                                    <span>I certify these documents are accurate evidence for <strong>{milestoneLabel}</strong>.</span>
                                  </label>
                                  <button
                                    type="button"
                                    disabled={uploadingProof}
                                    onClick={handleUploadMilestoneProof}
                                    className="w-full py-3 bg-[#047857] hover:bg-[#065f46] disabled:opacity-60 text-white font-bold text-xs rounded-xl cursor-pointer"
                                  >
                                    {uploadingProof ? 'Uploading…' : 'Submit Proof to Database'}
                                  </button>
                                </div>

                                {proofs.length > 0 && (
                                  <div className="pt-3 border-t border-slate-100 space-y-2">
                                    <h4 className="font-bold text-slate-900 text-xs">Uploaded proofs for this milestone</h4>
                                    <ul className="space-y-2">
                                      {proofs.map((p) => (
                                        <li key={p.id || p.path} className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                          <span className="font-semibold text-slate-800 block">{p.originalName || p.path}</span>
                                          {p.note && <span className="text-slate-500 block">{p.note}</span>}
                                          <span className="text-slate-400 font-mono">{p.created_at ? new Date(p.created_at).toLocaleString() : ''}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
                      <p className="text-xs text-slate-400">No milestones set for this campaign yet.</p>
                      {activeMilestoneProject && (
                        <button
                          type="button"
                          onClick={handleAddMilestone}
                          className="px-4 py-2 bg-[#047857] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add milestone
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: AUDIT LOGS */}
              {activeTab === 'audit' && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#0284C7] tracking-widest font-bold block">YOUR ACTIVITY</span>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display mt-0.5">Audit Logs</h1>
                    <p className="text-xs text-slate-500 mt-1">Actions on your account: campaigns, proposals, payouts, profile, and updates. Receipt hash is a checksum of that event, not a blockchain.</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {auditTimeRangeOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setAuditTimeRange(opt.value)}
                            className={`px-3 py-1.5 text-[11px] font-semibold rounded-full border cursor-pointer transition-colors ${
                              auditTimeRange === opt.value
                                ? 'bg-[#047857] hover:bg-[#065f46] text-white border-emerald-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-800'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Showing {filteredAuditLogs.length === 1 ? '1 log' : `${filteredAuditLogs.length} logs`}
                        {searchQuery.trim() ? ` matching “${searchQuery.trim()}”` : ''}
                      </p>
                    </div>

                    {filteredAuditLogs.length === 0 ? (
                      <p className="text-sm text-slate-500 py-8 text-center">
                        No audit records in this time range. Create a campaign, update your profile, or review a proposal and it will show here.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                              <th className="pb-2 font-semibold">When</th>
                              <th className="pb-2 font-semibold">CATEGORY</th>
                              <th className="pb-2 font-semibold">TITLE</th>
                              <th className="pb-2 font-semibold">STATUS</th>
                              <th className="pb-2 font-semibold">HASH RECEIPT</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredAuditLogs.map((log, idx) => (
                              <tr key={log.id || idx} className="hover:bg-slate-50/80">
                                <td className="py-2.5 font-mono text-slate-500 whitespace-nowrap">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                                <td className="py-2.5 font-mono font-bold text-slate-800">{log.category || 'SYSTEM'}</td>
                                <td className="py-2.5 font-semibold text-slate-900">{log.title || 'Log Activity'}</td>
                                <td className="py-2.5">
                                  <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-md uppercase">
                                    {log.status || 'RECORDED'}
                                  </span>
                                </td>
                                <td className="py-2.5 font-mono text-sky-600 font-semibold">{log.hash || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <InitialsAvatar name={profileUser.name} className="w-16 h-16 text-lg" />
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{profileUser.name}</h3>
                          <span className="text-xs text-emerald-700 font-semibold block">{profileUser.university}</span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase">Vetting Status: {profileUser.vettingStatus || 'VERIFIED'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setChatTarget({ name: 'All Backers & Mentors', id: 'all' });
                          setShowChatDrawer(true);
                        }}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Open Messages & Chat</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Full Name <span className="text-rose-600">*</span></label>
                        <input
                          type="text"
                          required
                          value={profileUser.name}
                          onChange={(e) => setProfileUser({ ...profileUser, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Email Address <span className="text-rose-600">*</span></label>
                        <input
                          type="email"
                          required
                          value={profileUser.email}
                          onChange={(e) => setProfileUser({ ...profileUser, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">University / Institution <span className="text-rose-600">*</span></label>
                        <input
                          type="text"
                          required
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
                        <label className="font-semibold text-slate-700 block mb-1">Student ID <span className="text-rose-600">*</span></label>
                        <input
                          type="text"
                          required
                          value={profileUser.studentId || ''}
                          onChange={(e) => setProfileUser({ ...profileUser, studentId: e.target.value })}
                          placeholder="e.g. 20101452"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">bKash / MFS Mobile Number <span className="text-rose-600">*</span></label>
                        <input
                          type="text"
                          required
                          value={profileUser.mfsNumber || ''}
                          onChange={(e) => setProfileUser({ ...profileUser, mfsNumber: e.target.value })}
                          placeholder="e.g. 01711223344"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Bio</label>
                      <textarea
                        rows={4}
                        value={profileUser.bio || ''}
                        onChange={(e) => setProfileUser({ ...profileUser, bio: e.target.value })}
                        placeholder="Short background about you and your startup..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                      <h3 className="font-bold text-slate-900">Identity documents for vetting</h3>
                      <p className="text-slate-500">Upload Student ID and NID (PDF or image). Admin already has a review queue — this only attaches your files.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Student ID card</label>
                          <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setIdCardFile(e.target.files?.[0] || null)} />
                          {profileUser.studentIdCardImage && <p className="text-[10px] text-emerald-700 mt-1">On file</p>}
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">NID card</label>
                          <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setNidFile(e.target.files?.[0] || null)} />
                          {profileUser.nidCardImage && <p className="text-[10px] text-emerald-700 mt-1">On file</p>}
                        </div>
                      </div>
                      <button type="button" onClick={handleUploadVettingDocs} className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer">Upload documents</button>
                    </div>

                    <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                      <button
                        type="button"
                        onClick={onLogout}
                        className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
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

      {/* S3: ADD MONEY MODAL — manual bKash/bank/other + proof for admin verify */}
      {showAddMoneyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Money to Wallet</h3>
              <button type="button" onClick={() => setShowAddMoneyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-950 leading-relaxed">
              A complete online payment method is in progress. <strong>For now this is our model:</strong> send money via bKash, bank transfer, or another channel, then upload your receipt. An admin verifies the proof before your wallet is credited. This Wallet screen is the only place to add money.
            </div>

            <form onSubmit={handleAddMoneySubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount (৳)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 25000"
                  value={addMoneyAmount}
                  onChange={(e) => setAddMoneyAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-2">Payment method</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bkash', label: 'bKash' },
                    { id: 'bank', label: 'Bank' },
                    { id: 'other', label: 'Other' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAddMoneyMethod(m.id)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        addMoneyMethod === m.id
                          ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-200'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {addMoneyMethod === 'bkash' ? 'bKash TrxID' : addMoneyMethod === 'bank' ? 'Bank reference / slip no.' : 'Payment reference'}
                </label>
                <input
                  type="text"
                  value={addMoneyReference}
                  onChange={(e) => setAddMoneyReference(e.target.value)}
                  placeholder={addMoneyMethod === 'bkash' ? 'e.g. 8N7XXXXXXX' : 'Optional but recommended'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Note (optional)</label>
                <textarea
                  rows={2}
                  value={addMoneyNote}
                  onChange={(e) => setAddMoneyNote(e.target.value)}
                  placeholder="Anything the admin should know…"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Proof receipt (required)</label>
                <label className="flex flex-col items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-sky-400 hover:bg-sky-50/40">
                  <Upload className="w-6 h-6 text-sky-600" />
                  <span className="text-[11px] text-slate-600 font-medium text-center px-3">
                    {addMoneyProof ? addMoneyProof.name : 'Upload JPG, PNG, or PDF of your payment receipt'}
                  </span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setAddMoneyProof(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div className="pt-1 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMoneyModal(false)}
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAddMoney}
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submittingAddMoney ? 'Submitting…' : 'Submit for verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  max={walletAvailable || undefined}
                  placeholder="Enter amount (e.g. 50000)"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Available to request: <strong className="font-mono text-sky-700">৳ {Number(walletAvailable || 0).toLocaleString()}</strong>
                  {' '}(wallet minus pending payout requests)
                </p>
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
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent font-semibold rounded-xl"
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

      {/* S3: Fund campaign / relief from founder wallet */}
      {showSelfFundModal && selfFundTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {selfFundTarget.type === 'relief' ? 'Donate from wallet' : 'Fund from wallet'}
              </h3>
              <button
                type="button"
                onClick={() => { setShowSelfFundModal(false); setSelfFundTarget(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              {selfFundTarget.type === 'relief' ? (
                <>
                  Donate to <strong>{selfFundTarget.title}</strong> using <strong>personal Add Money</strong> only
                  (bKash / bank top-ups). Investment and donation credits in the wallet cannot be used.
                </>
              ) : (
                <>Move money from your wallet into <strong>{selfFundTarget.title}</strong> raised. This is founder self-funding.</>
              )}
            </p>
            {selfFundTarget.type === 'relief' ? (
              <div className="text-[11px] text-slate-600 space-y-1">
                <p>
                  Personal (Add Money) available:{' '}
                  <strong className="font-mono text-sky-800">৳ {Number(walletPersonalAvailable || 0).toLocaleString()}</strong>
                </p>
                <p className="text-slate-400">
                  Total wallet (incl. investments):{' '}
                  <span className="font-mono">৳ {Number(walletBalance || 0).toLocaleString()}</span>
                </p>
                {Number(walletPersonalAvailable || 0) <= 0 && (
                  <p className="text-rose-600 font-medium">
                    No personal top-up balance. Open Wallet → Add Money first. Investment credits do not count.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Wallet balance: <strong className="font-mono text-emerald-700">৳ {Number(walletBalance || 0).toLocaleString()}</strong>
              </p>
            )}
            <form onSubmit={handleSelfFundFromWallet} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {selfFundTarget.type === 'relief' ? 'Amount from personal Add Money (৳)' : 'Amount (৳)'}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={
                    selfFundTarget.type === 'relief'
                      ? (walletPersonalAvailable || undefined)
                      : (walletBalance || undefined)
                  }
                  value={selfFundAmount}
                  onChange={(e) => setSelfFundAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. 5000"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowSelfFundModal(false); setSelfFundTarget(null); }}
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSelfFund || (selfFundTarget.type === 'relief' && Number(walletPersonalAvailable || 0) <= 0)}
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold rounded-xl disabled:opacity-60"
                >
                  {submittingSelfFund
                    ? 'Transferring…'
                    : selfFundTarget.type === 'relief'
                      ? 'Donate from personal balance'
                      : 'Transfer from wallet'}
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
                <label className="font-semibold text-slate-700 block mb-1">Campaign <span className="text-rose-600">*</span></label>
                <select
                  required
                  value={announcementCampaignId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setAnnouncementCampaignId(id);
                    const opts = getProgressTagOptions(id);
                    setAnnouncementTag(opts[0] || 'General Update');
                    setShowAddTagInput(false);
                    setNewProgressTag('');
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                >
                  {campaigns.filter((c) => c.status !== 'cancelled').map((c) => {
                    const id = c.id || c._id;
                    return (
                      <option key={id} value={id}>{c.title || id}</option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Update Title <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milestone 1 Completed - MVP Live for Beta Testing!"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* S3: Milestone/Progress tag from campaign milestones + custom */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block mb-1">Milestone / Progress tag</label>
                <select
                  value={
                    getProgressTagOptions(announcementCampaignId).includes(announcementTag)
                      ? announcementTag
                      : (getProgressTagOptions(announcementCampaignId)[0] || 'General Update')
                  }
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setShowAddTagInput(true);
                      return;
                    }
                    setAnnouncementTag(e.target.value);
                    setShowAddTagInput(false);
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                >
                  {getProgressTagOptions(announcementCampaignId).map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                  <option value="__add_new__">+ Add new tag…</option>
                </select>
                {showAddTagInput && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProgressTag}
                      onChange={(e) => setNewProgressTag(e.target.value)}
                      placeholder="New tag name"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddProgressTag}
                      className="px-3 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold rounded-xl cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddTagInput(false); setNewProgressTag(''); }}
                      className="px-3 py-2 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent text-[11px] font-semibold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-slate-500">Tags come from this campaign’s milestones. You can also add a custom progress tag.</p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Announcement Narrative / Log Details <span className="text-rose-600">*</span></label>
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
                  disabled={publishingUpdate}
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishingUpdate || campaigns.filter((c) => c.status !== 'cancelled').length === 0}
                  className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] disabled:opacity-60 text-white font-semibold rounded-xl shadow-sm cursor-pointer"
                >
                  {publishingUpdate ? 'Submitting...' : 'Submit for Admin Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* S3: handover responsibility modal */}
      {showHandoverModal && handoverTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Handover responsibility</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {handoverTarget.item.title} · Admin must approve before ownership transfers
                </p>
              </div>
              <button type="button" onClick={() => setShowHandoverModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitHandover} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">New founder <span className="text-rose-600">*</span></label>
                <select
                  required
                  value={handoverNewFounderId}
                  onChange={(e) => setHandoverNewFounderId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-800"
                >
                  <option value="">Select a co-founder…</option>
                  {readCoFounders(handoverTarget.item).map((cf) => (
                    <option key={cf.id || cf.email} value={cf.id}>
                      {cf.name || 'Co-founder'}{cf.email ? ` · ${cf.email}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Ownership moves to this co-founder after admin approval. They must already be listed as a co-founder.
                </p>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason <span className="text-rose-600">*</span></label>
                <textarea
                  required
                  rows={3}
                  value={handoverReason}
                  onChange={(e) => setHandoverReason(e.target.value)}
                  placeholder="Why are you handing over this campaign?"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Proof (JPG / PNG / PDF) <span className="text-rose-600">*</span></label>
                <label className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50 block cursor-pointer hover:border-amber-400">
                  <span className="text-xs font-semibold text-slate-800 block">
                    {handoverProofFile ? handoverProofFile.name : 'Click to upload proof'}
                  </span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(e) => setHandoverProofFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <p className="text-[10px] text-slate-500">
                You keep ownership until an admin approves. The elected co-founder becomes the primary founder of this campaign.
              </p>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowHandoverModal(false)} className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent font-semibold rounded-xl">Cancel</button>
                <button type="submit" disabled={submittingHandover || !handoverNewFounderId} className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] disabled:opacity-60 text-white font-semibold rounded-xl cursor-pointer">
                  {submittingHandover ? 'Submitting…' : 'Submit handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* S3: post-approval edit request modal */}
      {showEditRequestModal && editRequestTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Request edit (approved campaign)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {editRequestTarget.item.title} · Admin review at most 2 working days
                </p>
              </div>
              <button type="button" onClick={() => setShowEditRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitEditRequest} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Why do you need to edit? <span className="text-rose-600">*</span></label>
                <textarea
                  required
                  rows={3}
                  value={editRequestReason}
                  onChange={(e) => setEditRequestReason(e.target.value)}
                  placeholder="e.g. Correct funding goal after advisor feedback"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              {editRequestTarget.type === 'investment' ? (
                <>
                  <input className="w-full px-3 py-2 border border-slate-300 rounded-xl" value={editRequestForm.title || ''} onChange={(e) => setEditRequestForm({ ...editRequestForm, title: e.target.value })} placeholder="Title" />
                  <input className="w-full px-3 py-2 border border-slate-300 rounded-xl" value={editRequestForm.tagline || ''} onChange={(e) => setEditRequestForm({ ...editRequestForm, tagline: e.target.value })} placeholder="Tagline" />
                  <input className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono" type="number" value={editRequestForm.goal || ''} onChange={(e) => setEditRequestForm({ ...editRequestForm, goal: e.target.value })} placeholder="Goal (BDT)" />
                  <input className="w-full px-3 py-2 border border-slate-300 rounded-xl" value={editRequestForm.equityOffer || ''} onChange={(e) => setEditRequestForm({ ...editRequestForm, equityOffer: e.target.value })} placeholder="Equity / terms" />
                  <textarea className="w-full px-3 py-2 border border-slate-300 rounded-xl" rows={3} value={editRequestForm.description || ''} onChange={(e) => setEditRequestForm({ ...editRequestForm, description: e.target.value })} placeholder="Description" />
                </>
              ) : (
                <>
                  <input className="w-full px-3 py-2 border border-slate-300 rounded-xl" value={editRequestForm.title || ''} onChange={(e) => setEditRequestForm({ ...editRequestForm, title: e.target.value })} placeholder="Title" />
                  <input className="w-full px-3 py-2 border border-slate-300 rounded-xl" value={editRequestForm.cause || ''} onChange={(e) => setEditRequestForm({ ...editRequestForm, cause: e.target.value })} placeholder="Cause" />
                  <input className="w-full px-3 py-2 border border-slate-300 rounded-xl" value={editRequestForm.beneficiary || ''} onChange={(e) => setEditRequestForm({ ...editRequestForm, beneficiary: e.target.value })} placeholder="Beneficiary" />
                  <input className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono" type="number" value={editRequestForm.goal || ''} onChange={(e) => setEditRequestForm({ ...editRequestForm, goal: e.target.value })} placeholder="Goal (BDT)" />
                  <textarea className="w-full px-3 py-2 border border-slate-300 rounded-xl" rows={3} value={editRequestForm.description || ''} onChange={(e) => setEditRequestForm({ ...editRequestForm, description: e.target.value })} placeholder="Description" />
                </>
              )}
              <p className="text-[10px] text-slate-500">Changes apply only after admin approval (at most 2 working days).</p>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowEditRequestModal(false)} className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white border border-transparent font-semibold rounded-xl">Cancel</button>
                <button type="submit" disabled={submittingEditRequest} className="flex-1 py-2.5 bg-[#047857] hover:bg-[#065f46] disabled:opacity-60 text-white font-semibold rounded-xl cursor-pointer">
                  {submittingEditRequest ? 'Submitting…' : 'Submit edit request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* S3: watch-detail Founder / Invested / Milestones popups (same shell as investor detail) */}
      {watchDetail && watchStatPanel && (() => {
        const c = watchDetail;
        const founder = c.founder || {};
        const founderName = watchFounderName(c);
        const fid = c.founder_id || c.founderId || founder.id || founder._id;
        const dir = platformFounders.find((f) => String(f.id || f._id) === String(fid)) || {};
        const bio = resolveFounderBio(founder, fid);
        const email = founder.email || dir.email || (String(fid) === myFounderId ? (profileUser.email || user.email || '') : '');
        const ms = Array.isArray(c.milestones) ? c.milestones : [];
        const title =
          watchStatPanel === 'founder' ? 'Founder profile'
            : watchStatPanel === 'invested' ? 'Who invested'
              : 'Milestones';
        return (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setWatchStatPanel(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 shrink-0">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-base">{title}</h3>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.title}</p>
                </div>
                <button type="button" onClick={() => setWatchStatPanel(null)} className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto overscroll-contain space-y-4 min-h-0">
                {watchStatPanel === 'founder' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={founderName} className="w-12 h-12" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{founderName}</p>
                          <p className="text-[11px] text-slate-500">{founder.university || dir.university || c.university || '—'}</p>
                          {(founder.department || dir.department) && (
                            <p className="text-[11px] text-slate-400">{founder.department || dir.department}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWatchStatPanel(null);
                          setChatTarget({ name: founderName, id: fid || 'usr_founder_1' });
                          setShowChatDrawer(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Send message to this founder"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </button>
                    </div>
                    <div className="space-y-2 text-xs">
                      {email && (
                        <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Email</span>
                          <span className="font-semibold text-slate-900 text-right break-all">{email}</span>
                        </div>
                      )}
                    </div>
                    {bio ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Bio</span>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{bio}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">No public bio on file for this founder.</p>
                    )}
                  </div>
                )}

                {watchStatPanel === 'invested' && (
                  <div className="space-y-1.5">
                    {watchDetailBackers.length === 0 ? (
                      <p className="text-[11px] text-slate-500">No accepted investors listed yet for this campaign.</p>
                    ) : watchDetailBackers.map((p) => (
                      <div key={p.id || p._id || `${p.investor_id}-${p.amount}`} className="flex flex-wrap justify-between gap-2 text-xs p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="font-semibold text-slate-800">{p.investor_name || p.investorName || 'Investor'}</span>
                        <span className="font-mono font-bold text-emerald-700">৳ {Number(p.amount || p.counter_amount || 0).toLocaleString()}</span>
                        <span className="text-slate-500 w-full">{p.terms || p.counter_terms || p.return_structure || 'Terms on file'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {watchStatPanel === 'milestones' && (
                  <div className="space-y-1.5">
                    {ms.length === 0 ? (
                      <p className="text-[11px] text-slate-500">No milestones listed for this campaign.</p>
                    ) : ms.map((m, idx) => {
                      const bucket = getMilestoneBucket(m, c);
                      const proofCount = Array.isArray(m.proofs) ? m.proofs.length : 0;
                      return (
                        <div key={idx} className="flex flex-wrap justify-between gap-2 text-xs p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="font-semibold text-slate-800">{m.title || m.name || `Milestone ${idx + 1}`}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            bucket === 'done' ? 'bg-emerald-100 text-emerald-800' :
                            bucket === 'missed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>{bucket}</span>
                          <span className="text-slate-500 w-full">Target: {m.target || m.targetDate || 'TBD'} · {proofCount} proof file(s)</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* S3: relief-detail Organizer / Donated / Milestones popups */}
      {reliefDetail && reliefStatPanel && (() => {
        const d = reliefDetail;
        const founder = d.founder || {};
        const founderName = founder.name || 'Founder';
        const fid = d.founder_id || d.founderId || founder.id || founder._id;
        const dir = platformFounders.find((f) => String(f.id || f._id) === String(fid)) || {};
        const bio = resolveFounderBio(founder, fid);
        const email = founder.email || dir.email || (String(fid) === myFounderId ? (profileUser.email || user.email || '') : '');
        const ms = Array.isArray(d.milestones) ? d.milestones : [];
        const donations = Array.isArray(d.donations) ? d.donations : [];
        const title =
          reliefStatPanel === 'founder' ? 'Organizer profile'
            : reliefStatPanel === 'invested' ? 'Who donated'
              : 'Milestones';
        return (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setReliefStatPanel(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 shrink-0">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-base">{title}</h3>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{d.title}</p>
                </div>
                <button type="button" onClick={() => setReliefStatPanel(null)} className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto overscroll-contain space-y-4 min-h-0">
                {reliefStatPanel === 'founder' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={founderName} className="w-12 h-12" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{founderName}</p>
                          <p className="text-[11px] text-slate-500">{founder.university || dir.university || d.university || '—'}</p>
                          {(founder.department || dir.department) && (
                            <p className="text-[11px] text-slate-400">{founder.department || dir.department}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReliefStatPanel(null);
                          setChatTarget({ name: founderName, id: fid || 'usr_founder_1' });
                          setShowChatDrawer(true);
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Send message to organizer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </button>
                    </div>
                    <div className="space-y-2 text-xs">
                      {email && (
                        <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Email</span>
                          <span className="font-semibold text-slate-900 text-right break-all">{email}</span>
                        </div>
                      )}
                    </div>
                    {bio ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Bio</span>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{bio}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">No public bio on file for this organizer.</p>
                    )}
                  </div>
                )}

                {reliefStatPanel === 'invested' && (
                  <div className="space-y-1.5">
                    {donations.length === 0 ? (
                      <p className="text-[11px] text-slate-500">No donations recorded yet for this relief campaign.</p>
                    ) : donations.map((don, idx) => (
                      <div key={don.id || idx} className="flex flex-wrap justify-between gap-2 text-xs p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="font-semibold text-slate-800">{don.donor_name || don.investor_name || don.name || 'Donor'}</span>
                        <span className="font-mono font-bold text-rose-700">৳ {Number(don.amount || 0).toLocaleString()}</span>
                        <span className="text-slate-500 w-full">
                          {don.created_at ? new Date(don.created_at).toLocaleString() : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {reliefStatPanel === 'milestones' && (
                  <div className="space-y-1.5">
                    {ms.length === 0 ? (
                      <p className="text-[11px] text-slate-500">No progress milestones listed yet.</p>
                    ) : ms.map((m, idx) => {
                      const bucket = getMilestoneBucket(m, d);
                      const proofCount = Array.isArray(m.proofs) ? m.proofs.length : 0;
                      return (
                        <div key={idx} className="flex flex-wrap justify-between gap-2 text-xs p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="font-semibold text-slate-800">{m.title || m.name || `Phase ${idx + 1}`}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            bucket === 'done' ? 'bg-emerald-100 text-emerald-800' :
                            bucket === 'missed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>{bucket}</span>
                          <span className="text-slate-500 w-full">Target: {m.target || m.targetDate || 'TBD'} · {proofCount} proof file(s)</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* S3: co-founder list popup (shown when slots are full — simple list, no scroll) */}
      {showCoFounderListModal && coFounderListTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => { setShowCoFounderListModal(false); setCoFounderListTarget(null); }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-base">Co-founders</h3>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{coFounderListTarget.title}</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowCoFounderListModal(false); setCoFounderListTarget(null); }}
                className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              This campaign has filled all {MAX_COFOUNDERS} co-founder slots.
            </p>
            <ul className="space-y-2">
              {(coFounderListTarget.coFounders || []).slice(0, MAX_COFOUNDERS).map((cf, idx) => (
                <li
                  key={cf.id || cf.email || idx}
                  className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-xl"
                >
                  <InitialsAvatar name={cf.name || 'Founder'} className="w-9 h-9 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{cf.name || 'Founder'}</p>
                    {cf.university ? (
                      <p className="text-[11px] text-slate-500 truncate">{cf.university}</p>
                    ) : null}
                    {cf.email ? (
                      <p className="text-[10px] text-slate-400 font-mono truncate">{cf.email}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* S3: apply as co-founder (reason only) */}
      {showCoFounderApplyModal && coFounderApplyTarget?.item && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => { if (!submittingCoFounderApply) { setShowCoFounderApplyModal(false); setCoFounderApplyTarget(null); } }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-base">Apply as co-founder</h3>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{coFounderApplyTarget.item.title}</p>
              </div>
              <button
                type="button"
                disabled={submittingCoFounderApply}
                onClick={() => { setShowCoFounderApplyModal(false); setCoFounderApplyTarget(null); }}
                className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Tell the primary founder why you want to join this campaign as a co-founder (at most {MAX_COFOUNDERS} per campaign). Only your reason is submitted.
            </p>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">Reason for application</span>
              <textarea
                value={coFounderApplyReason}
                onChange={(e) => setCoFounderApplyReason(e.target.value)}
                rows={5}
                placeholder="e.g. I can help with campus outreach and milestone delivery…"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 resize-y"
              />
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={submittingCoFounderApply}
                onClick={() => { setShowCoFounderApplyModal(false); setCoFounderApplyTarget(null); }}
                className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingCoFounderApply}
                onClick={submitCoFounderApply}
                className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-60"
              >
                {submittingCoFounderApply ? 'Submitting…' : 'Submit application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* S3: remove co-founder (message → notification) */}
      {showRemoveCoFounderModal && removeCoFounderTarget?.item && removeCoFounderTarget?.cofounder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => { setShowRemoveCoFounderModal(false); setRemoveCoFounderTarget(null); }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-base">Remove co-founder</h3>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {removeCoFounderTarget.cofounder.name || 'Founder'} · {removeCoFounderTarget.item.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowRemoveCoFounderModal(false); setRemoveCoFounderTarget(null); }}
                className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Your message will be sent to them in notifications.
            </p>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">Message</span>
              <textarea
                value={removeCoFounderMessage}
                onChange={(e) => setRemoveCoFounderMessage(e.target.value)}
                rows={4}
                placeholder="Explain why you are removing them…"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 resize-y"
              />
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowRemoveCoFounderModal(false); setRemoveCoFounderTarget(null); }}
                className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRemoveCoFounder}
                className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Remove co-founder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* S3: investor directory detail */}
      {selectedInvestor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-start gap-3 min-w-0">
                <InitialsAvatar name={selectedInvestor.name || 'Investor'} className="w-12 h-12" />
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-base truncate">{selectedInvestor.name || 'Investor'}</h3>
                  <p className="text-[11px] text-slate-500 truncate">{selectedInvestor.institution || 'Investor'}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedInvestor(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Email</span>
                <span className="font-semibold text-slate-900 text-right break-all">{selectedInvestor.email || '—'}</span>
              </div>
              <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Contact (MFS)</span>
                <span className="font-semibold text-slate-900 font-mono">{selectedInvestor.phone || selectedInvestor.mfsNumber || selectedInvestor.mfs_number || '—'}</span>
              </div>
              <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Bank / MFS account</span>
                <span className="font-semibold text-slate-900 text-right">{selectedInvestor.bank_or_mfs || '—'}</span>
              </div>
              <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Vetting</span>
                <span className="font-semibold text-emerald-700 uppercase">{selectedInvestor.vettingStatus || selectedInvestor.vetting_status || '—'}</span>
              </div>
              {selectedInvestor.affiliationStatus ? (
                <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Affiliation</span>
                  <span className="font-semibold text-slate-900">{selectedInvestor.affiliationStatus}</span>
                </div>
              ) : null}
            </div>

            {selectedInvestor.bio ? (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Bio</span>
                <p className="text-xs text-slate-700 leading-relaxed">{selectedInvestor.bio}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Invested in</span>
              {selectedInvestorDeals.filter((p) => String(p.status || '').toLowerCase() === 'accepted').length > 0 ? (
                <ul className="space-y-2">
                  {selectedInvestorDeals
                    .filter((p) => String(p.status || '').toLowerCase() === 'accepted')
                    .map((p) => (
                      <li key={p.id || p._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <span className="font-semibold text-slate-900 block">{p.campaign_title || p.campaign_id || 'Campaign'}</span>
                        <span className="font-mono text-emerald-700">৳ {Number(p.amount || 0).toLocaleString()}</span>
                        {p.return_structure || p.terms ? (
                          <span className="text-slate-500 block mt-0.5">{p.return_structure || p.terms}</span>
                        ) : null}
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-500">No accepted investments on record yet.</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => openChatWithInvestor(selectedInvestor)}
              className="w-full py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
          </div>
        </div>
      )}

      {/* S3: FR-7 chat with selected investor (history in this drawer) */}
      {showChatDrawer && chatTarget && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex justify-end">
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
            <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Direct chat</p>
                <h3 className="font-bold text-slate-900 text-sm truncate">{chatTarget.name || 'Investor'}</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowChatDrawer(false); setChatTarget(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">No messages yet. Start the thread.</p>
              ) : (
                chatMessages.map((m) => {
                  const me = String(currentUser?.id || currentUser?._id || user.id);
                  const sId = String(m.sender_id || m.senderId || '');
                  const mine = sId === me || (isAshrafSession && sId === 'usr_founder_1');
                  return (
                    <div key={m.id || m._id || m.created_at} className={`max-w-[85%] ${mine ? 'ml-auto' : ''}`}>
                      <div className={`rounded-2xl px-3.5 py-2.5 text-xs ${mine ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800'}`}>
                        {m.text || m.message}
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono mt-1 block">{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</span>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 flex gap-2 shrink-0">
              <input
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button type="submit" className="px-4 py-2.5 bg-[#047857] text-white text-xs font-semibold rounded-xl cursor-pointer">
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

