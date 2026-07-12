import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Search, 
  Filter, 
  Coins, 
  MapPin, 
  Building, 
  TrendingUp, 
  Clock, 
  Shield, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle, 
  Lock,
  LogOut,
  X,
  Send,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

export default function InvestorDashboard({ currentUser, onLogout, API_BASE_URL, triggerAlert }) {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'portfolio' | 'chat'
  const [campaigns, setCampaigns] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [universityFilter, setUniversityFilter] = useState('all');

  // Selected Campaign Details Modal
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Proposal Submission Form
  const [proposalAmount, setProposalAmount] = useState(100000);
  const [proposalTerms, setProposalTerms] = useState('8% Gross Revenue Share');

  // Socket chat state
  const [socket, setSocket] = useState(null);
  const [activeChatRoom, setActiveChatRoom] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef(null);

  // Load Marketplace and Portfolio
  const loadMarketplace = async () => {
    try {
      setLoading(true);
      const campRes = await fetch(`${API_BASE_URL}/api/campaigns`);
      if (!campRes.ok) throw new Error('Failed to load campaigns');
      const campData = await campRes.json();
      setCampaigns(campData);

      const portRes = await fetch(`${API_BASE_URL}/api/proposals/investor/${currentUser.id}`);
      if (portRes.ok) {
        const portData = await portRes.json();
        setPortfolio(portData);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      triggerAlert('Failed to synchronize marketplace catalog.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, [currentUser]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Socket configuration
  useEffect(() => {
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    newSocket.on('receive_message', (data) => {
      setChatMessages((prev) => [...prev, data]);
    });

    return () => newSocket.close();
  }, [API_BASE_URL]);

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${selectedCampaign.id}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorId: currentUser.id,
          amount: Number(proposalAmount),
          terms: proposalTerms
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit proposal');

      triggerAlert('Backing proposal submitted successfully to the founder!');
      setSelectedCampaign(null);
      loadMarketplace();
      setActiveTab('portfolio');
    } catch (err) {
      triggerAlert(err.message || 'Error submitting backing proposal.');
    }
  };

  const startNegotiation = (proposal) => {
    const roomId = `room-${proposal._id}`;
    setActiveChatRoom(roomId);
    setChatPartner(proposal.campaign.founder);
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
      sender: `Investor ${currentUser.name}`,
      text: chatInput
    };

    socket.emit('send_message', msgData);
    setChatInput('');
  };

  // Filters logic
  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchesUniversity = universityFilter === 'all' || c.university === universityFilter;

    return matchesSearch && matchesCategory && matchesUniversity;
  });

  // Unique list of universities for filtering
  const universities = Array.from(new Set(campaigns.map(c => c.university)));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] text-white flex justify-center items-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-sky-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-text-muted">Synchronizing investor portal session...</p>
        </div>
      </div>
    );
  }

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
            <span className="text-[10px] text-neon-mint tracking-wider block uppercase font-medium">Angel Portal</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-medium text-white block">{currentUser.name}</span>
            <span className="text-[9px] text-text-muted block uppercase">{currentUser.institution} · {currentUser.designation}</span>
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
          <span className="text-[9px] font-medium tracking-widest text-text-muted uppercase block mb-4">Investments Vault</span>
          
          <button 
            onClick={() => setActiveTab('browse')}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'browse' ? 'bg-sky-primary text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Browse Catalog</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('portfolio')}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'portfolio' ? 'bg-sky-primary text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>My Active Portfolio ({portfolio.length})</span>
          </button>

          {activeChatRoom && (
            <button 
              onClick={() => setActiveTab('chat')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-3 ${
                activeTab === 'chat' ? 'bg-sky-primary text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Negotiation channel</span>
            </button>
          )}
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-6 sm:p-8 bg-[#080C14] text-left overflow-y-auto">
          
          {/* TAB 1: BROWSE CATALOG */}
          {activeTab === 'browse' && (
            <div className="space-y-6">
              
              {/* Header Title */}
              <div>
                <h2 className="text-xl font-semibold tracking-tight font-display">Explore Vetted Campus Ventures</h2>
                <p className="text-xs text-text-muted mt-1">Backed by mobile tranches, protected by milestones escrow releases.</p>
              </div>

              {/* Filters Box */}
              <div className="p-4 bg-[#0B101E] border border-border-strong rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                  <input 
                    type="text"
                    placeholder="Search by title, university, pitch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-border-strong rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                  />
                </div>

                <div className="flex w-full md:w-auto gap-4">
                  <div className="w-full md:w-36">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-white/5 border border-border-strong rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                    >
                      <option value="all" className="text-black">All Categories</option>
                      <option value="Fintech" className="text-black">Fintech</option>
                      <option value="Logistics" className="text-black">Logistics</option>
                      <option value="F&B" className="text-black">Food & Beverage</option>
                      <option value="EdTech" className="text-black">EdTech</option>
                      <option value="SaaS" className="text-black">SaaS / Tech</option>
                    </select>
                  </div>

                  <div className="w-full md:w-44">
                    <select
                      value={universityFilter}
                      onChange={(e) => setUniversityFilter(e.target.value)}
                      className="w-full bg-white/5 border border-border-strong rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                    >
                      <option value="all" className="text-black">All Universities</option>
                      {universities.map(u => (
                        <option key={u} value={u} className="text-black">{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Startup Grid */}
              {filteredCampaigns.length === 0 ? (
                <div className="border border-dashed border-border-strong rounded-xl p-12 text-center text-text-muted">
                  <HelpCircle className="w-8 h-8 text-sky-primary mx-auto opacity-70 mb-2" />
                  <p className="text-xs font-semibold text-white">No active campaign profiles match your filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCampaigns.map(c => {
                    const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
                    return (
                      <div 
                        key={c._id}
                        onClick={() => setSelectedCampaign(c)}
                        className="bg-[#0B101E] border border-border-strong rounded-xl p-5 hover:border-sky-primary transition-all duration-300 flex flex-col justify-between cursor-pointer space-y-4 shadow-soft group"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] bg-sky-primary/10 text-sky-light px-2 py-0.5 rounded-full font-semibold uppercase">{c.category} · {c.stage}</span>
                            <span className="text-[10px] text-text-muted font-semibold flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-sky-primary" />
                              <span>{c.university}</span>
                            </span>
                          </div>
                          <h3 className="font-semibold text-white text-md mt-1 group-hover:text-sky-primary transition-colors">{c.title}</h3>
                          <p className="text-xs text-text-muted line-clamp-2 mt-1 leading-relaxed">{c.description}</p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <div className="flex justify-between text-[10px] text-text-muted font-medium">
                            <span>Committed: ৳ {c.raised.toLocaleString()}</span>
                            <span>Target: ৳ {c.goal.toLocaleString()}</span>
                          </div>
                          
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-primary" style={{ width: `${pct}%` }}></div>
                          </div>
                          
                          <div className="flex justify-between items-center text-[10px] pt-1">
                            <span className="text-neon-mint font-semibold">{pct}% Backed</span>
                            <span className="text-sky-light font-semibold">{c.equityOffer}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PORTFOLIO LEDGER */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight font-display">Active backing Portfolio</h2>
                <p className="text-xs text-text-muted mt-1">Track payouts, milestones, and release tranches audit records.</p>
              </div>

              {portfolio.length === 0 ? (
                <div className="border border-dashed border-border-strong rounded-xl p-12 text-center text-text-muted space-y-2">
                  <Coins className="w-8 h-8 text-sky-primary mx-auto opacity-70" />
                  <p className="text-xs font-semibold text-white">No active investment holdings in ledger.</p>
                  <p className="text-[10px] text-text-muted">Browse the catalog to commit support for university startups.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {portfolio.map(p => {
                    const c = p.campaign;
                    if (!c) return null;
                    return (
                      <div key={p._id} className="bg-[#0B101E] border border-border-strong rounded-xl p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-white text-md">{c.title}</h3>
                              <span className="text-[9px] text-text-muted block">{c.university} · Founder: {c.founder?.name}</span>
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
                              <span className="text-[9px] text-text-muted block">Committed terms</span>
                              <strong className="text-sky-light">{p.terms}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                          <button 
                            onClick={() => startNegotiation(p)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-border-strong rounded text-[11px] font-semibold text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-sky-primary" />
                            <span>Negotiate Workspace</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NEGOTIATION CHAT */}
          {activeTab === 'chat' && activeChatRoom && (
            <div className="bg-[#0B101E] border border-border-strong rounded-xl p-5 flex flex-col h-[480px] justify-between max-w-2xl">
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Negotiation: {chatPartner?.name || 'Founder'}</h3>
                  <p className="text-[10px] text-neon-mint font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-mint animate-pulse"></span>
                    <span>Real-time WebSocket Sync</span>
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setActiveChatRoom(null);
                    setChatPartner(null);
                    setActiveTab('portfolio');
                  }}
                  className="p-1 hover:bg-white/5 rounded border border-border-strong text-text-muted hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Log */}
              <div className="flex-1 bg-black/20 p-4 rounded-lg my-4 overflow-y-auto space-y-3">
                {chatMessages.map((msg, i) => {
                  const isYou = msg.sender.includes('Investor');
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

      {/* Selected Campaign Detailed Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0B101E] rounded-xl shadow-2xl border border-border-strong max-w-2xl w-full overflow-hidden text-left relative max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div>
                <span className="text-[9px] bg-sky-primary/10 text-sky-light px-2 py-0.5 rounded-full font-semibold uppercase">{selectedCampaign.category}</span>
                <h3 className="text-xl font-semibold text-white mt-1">{selectedCampaign.title}</h3>
                <p className="text-[10px] text-text-muted mt-0.5">Physical Location: {selectedCampaign.location} · {selectedCampaign.university}</p>
              </div>
              <button 
                onClick={() => setSelectedCampaign(null)}
                className="p-1 hover:bg-white/5 rounded text-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
              
              {/* Pitch */}
              <div>
                <h4 className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Executive Pitch</h4>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">{selectedCampaign.description}</p>
              </div>

              {/* Founder Profile */}
              <div className="p-4 bg-white/5 border border-white/5 rounded-lg grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-text-muted block uppercase">Project Founder</span>
                  <strong className="text-white text-sm mt-0.5 block">{selectedCampaign.founder?.name}</strong>
                  <span className="text-[10px] text-text-muted">{selectedCampaign.founder?.email}</span>
                </div>
                <div>
                  <span className="text-[9px] text-text-muted block uppercase">MFS Account Payout</span>
                  <strong className="text-white text-sm mt-0.5 block">{selectedCampaign.founder?.mfsNumber || 'Not Configured'}</strong>
                  <span className="text-[10px] text-text-muted">bKash/Nagad Compliant</span>
                </div>
              </div>

              {/* Milestones plan */}
              <div>
                <h4 className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-2">Target Escrow milestones</h4>
                <div className="space-y-2">
                  {selectedCampaign.milestones.map((m, idx) => (
                    <div key={m._id || idx} className="flex items-center justify-between p-2.5 rounded border border-white/5 bg-white/5">
                      <span className="font-semibold text-white">{idx + 1}. {m.title}</span>
                      <span className="text-text-muted font-medium">{m.target}</span>
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

              {/* BACKING COMMITMENT FORM */}
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-[10px] text-sky-primary uppercase tracking-wider font-semibold mb-3">Commit Capital Tranche</h4>
                
                <form onSubmit={handleSubmitProposal} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] text-text-muted block mb-1">Committed BDT (Taka)</label>
                      <input 
                        type="number"
                        required
                        min="10000"
                        step="5000"
                        value={proposalAmount}
                        onChange={(e) => setProposalAmount(Number(e.target.value))}
                        className="w-full bg-white/5 border border-border-strong rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-text-muted block mb-1">Proposed Return terms</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. 8% Gross Revenue Share"
                        value={proposalTerms}
                        onChange={(e) => setProposalTerms(e.target.value)}
                        className="w-full bg-white/5 border border-border-strong rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-sky-primary hover:bg-sky-primary/95 text-white text-xs font-semibold rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Shield className="w-4 h-4 text-neon-mint" />
                    <span>Submit Binding backing proposal</span>
                  </button>
                </form>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
