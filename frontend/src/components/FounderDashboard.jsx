import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  ArrowRight, 
  Plus, 
  Check, 
  X, 
  Clock, 
  Lock, 
  Shield, 
  MessageSquare, 
  Upload, 
  FileText, 
  LogOut, 
  Users, 
  TrendingUp, 
  Coins, 
  Building, 
  MapPin, 
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Send
} from 'lucide-react';

export default function FounderDashboard({ currentUser, onLogout, API_BASE_URL, triggerAlert }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'campaign' | 'milestones' | 'proposals' | 'chat'
  const [campaigns, setCampaigns] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Campaign Form State
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    id: '',
    category: 'Fintech',
    stage: 'MVP',
    goal: 500000,
    equityOffer: '8% Rev. Share',
    location: 'Dhaka, Bangladesh',
    description: '',
    milestone1_title: 'MVP Launch',
    milestone1_target: 'Month 1',
    milestone2_title: 'First 100 Users',
    milestone2_target: 'Month 2',
    milestone3_title: 'Revenue ৳50K',
    milestone3_target: 'Month 4'
  });

  // Milestone receipt state
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [receiptProof, setReceiptProof] = useState('');

  // Socket chat state
  const [socket, setSocket] = useState(null);
  const [activeChatRoom, setActiveChatRoom] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef(null);

  // Fetch campaigns and proposals
  const loadData = async () => {
    try {
      setLoading(true);
      // Get founder campaigns
      const campRes = await fetch(`${API_BASE_URL}/api/campaigns/founder/${currentUser.id}`);
      if (!campRes.ok) throw new Error('Error loading campaigns');
      const campData = await campRes.json();
      setCampaigns(campData);

      // If founder has a campaign, load proposals for the first campaign
      if (campData.length > 0) {
        const propRes = await fetch(`${API_BASE_URL}/api/proposals/campaign/${campData[0]._id}`);
        if (propRes.ok) {
          const propData = await propRes.json();
          setProposals(propData);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      triggerAlert('Failed to load dashboard data from server.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Socket connection
  useEffect(() => {
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    newSocket.on('receive_message', (data) => {
      setChatMessages((prev) => [...prev, data]);
    });

    return () => newSocket.close();
  }, [API_BASE_URL]);

  const handleLaunchCampaign = async (e) => {
    e.preventDefault();
    if (currentUser.vettingStatus !== 'verified') {
      triggerAlert('Only verified founders can launch campaigns. Please wait for admin approval.');
      return;
    }

    try {
      const milestones = [
        { title: newCampaign.milestone1_title, target: newCampaign.milestone1_target, status: 'active' },
        { title: newCampaign.milestone2_title, target: newCampaign.milestone2_target, status: 'locked' },
        { title: newCampaign.milestone3_title, target: newCampaign.milestone3_target, status: 'locked' }
      ];

      const payload = {
        id: newCampaign.id.toLowerCase().replace(/\s+/g, '-'),
        title: newCampaign.title,
        founderId: currentUser.id,
        university: currentUser.university || 'BRAC University',
        location: newCampaign.location,
        category: newCampaign.category,
        stage: newCampaign.stage,
        goal: Number(newCampaign.goal),
        equityOffer: newCampaign.equityOffer,
        description: newCampaign.description,
        milestones
      };

      const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to launch');

      triggerAlert('Campaign created successfully! Awaiting Admin verification.');
      loadData();
      setActiveTab('campaign');
    } catch (err) {
      triggerAlert(err.message || 'Campaign creation failed.');
    }
  };

  const handleSubmitMilestoneReceipt = async (e) => {
    e.preventDefault();
    if (!selectedMilestone || !receiptProof) {
      triggerAlert('Please select a milestone and fill in receipt descriptions.');
      return;
    }

    try {
      const campaign = campaigns[0];
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${campaign.id}/milestones/${selectedMilestone}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptProof })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit receipt');

      triggerAlert('Milestone receipt proof uploaded successfully for Admin review!');
      setSelectedMilestone('');
      setReceiptProof('');
      loadData();
    } catch (err) {
      triggerAlert(err.message || 'Failed to submit milestone.');
    }
  };

  const handleProposalAction = async (proposalId, status) => {
    try {
      const campaign = campaigns[0];
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${campaign.id}/proposals/${proposalId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update proposal');

      triggerAlert(`Proposal ${status === 'accepted' ? 'Accepted' : 'Declined'} successfully!`);
      loadData();
    } catch (err) {
      triggerAlert(err.message || 'Error processing proposal.');
    }
  };

  const startNegotiation = (proposal) => {
    const roomId = `room-${proposal._id}`;
    setActiveChatRoom(roomId);
    setChatPartner(proposal.investor);
    setChatMessages([
      { sender: 'System', text: `Negotiation Room synced for BDT ${proposal.amount.toLocaleString()} BDT proposal.`, time: '' }
    ]);
    if (socket) {
      socket.emit('join_room', roomId);
    }
    setActiveTab('chat');
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !activeChatRoom) return;

    const msgData = {
      roomId: activeChatRoom,
      sender: `Founder ${currentUser.name}`,
      text: chatInput
    };

    socket.emit('send_message', msgData);
    setChatInput('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] text-white flex justify-center items-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-sky-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-text-muted">Synchronizing founder workspace session...</p>
        </div>
      </div>
    );
  }

  const activeCampaign = campaigns[0];

  return (
    <div className="min-h-screen bg-[#080C14] text-white flex flex-col font-sans">
      
      {/* Header */}
      <header className="border-b border-border-strong bg-[#0B101E] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-sky-primary flex items-center justify-center font-display font-medium text-white text-md">
            FB
          </div>
          <div>
            <h1 className="text-md font-medium tracking-tight">FundBridge</h1>
            <span className="text-[10px] text-sky-primary tracking-wider block uppercase font-medium">Founder Workspace</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-medium text-white block">{currentUser.name}</span>
            <span className="text-[9px] text-text-muted block uppercase">{currentUser.university}</span>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-white transition-colors border border-border-strong rounded px-3 py-1.5 cursor-pointer bg-white/5"
          >
            <LogOut className="w-3.5 h-3.5 text-sky-primary" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 border-r border-border-strong bg-[#090D18] p-6 space-y-2 flex-shrink-0 text-left">
          <span className="text-[9px] font-medium tracking-widest text-text-muted uppercase block mb-4">Launchpad Vault</span>
          
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'overview' ? 'bg-sky-primary text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Overview Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('campaign')}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'campaign' ? 'bg-sky-primary text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Campaign Profile</span>
          </button>

          {activeCampaign && (
            <>
              <button 
                onClick={() => setActiveTab('milestones')}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-3 ${
                  activeTab === 'milestones' ? 'bg-sky-primary text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Escrow Milestones</span>
              </button>

              <button 
                onClick={() => setActiveTab('proposals')}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-3 ${
                  activeTab === 'proposals' ? 'bg-sky-primary text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Backing Offers ({proposals.length})</span>
              </button>
            </>
          )}

          {activeChatRoom && (
            <button 
              onClick={() => setActiveTab('chat')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-3 ${
                activeTab === 'chat' ? 'bg-sky-primary text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Negotiation room</span>
            </button>
          )}
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-6 sm:p-8 bg-[#080C14] text-left overflow-y-auto">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Vetting Status Banner */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                currentUser.vettingStatus === 'verified' 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : currentUser.vettingStatus === 'rejected'
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  <Shield className={`w-5 h-5 mt-0.5 ${
                    currentUser.vettingStatus === 'verified' ? 'text-emerald-400' : currentUser.vettingStatus === 'rejected' ? 'text-rose-400' : 'text-amber-400'
                  }`} />
                  <div>
                    <h3 className="text-sm font-medium">Founder Vetting Status: <span className="capitalize">{currentUser.vettingStatus}</span></h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {currentUser.vettingStatus === 'verified' 
                        ? 'Your enrollment and NID identity are verified. You are clear to receive funds.' 
                        : currentUser.vettingStatus === 'rejected'
                        ? 'Verification declined. Please contact admin support.'
                        : 'Your trust documentation is in the verification queue. Admin validation pending.'}
                    </p>
                  </div>
                </div>
                {currentUser.vettingStatus === 'pending' && (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-[10px] uppercase tracking-wider font-semibold rounded-full border border-amber-500/30 self-start sm:self-auto">
                    Awaiting Audit
                  </span>
                )}
                {currentUser.vettingStatus === 'verified' && (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] uppercase tracking-wider font-semibold rounded-full border border-emerald-500/30 self-start sm:self-auto">
                    Clear for Escrow
                  </span>
                )}
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
                      <span>{activeCampaign.milestones.filter(m => m.status === 'done').length} / {activeCampaign.milestones.length} Cleared</span>
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
                        {activeCampaign.milestones.map((m, idx) => (
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
                      {activeCampaign.milestones
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
