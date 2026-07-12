import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Database, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Check, 
  X, 
  ArrowRight,
  TrendingUp,
  Coins
} from 'lucide-react';

export default function AdminDashboard({ onLogout, API_BASE_URL, triggerAlert }) {
  // Session Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    const saved = localStorage.getItem('fundbridge_user');
    if (saved) {
      const u = JSON.parse(saved);
      return u.role === 'admin';
    }
    return false;
  });
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [adminTab, setAdminTab] = useState('vetting'); // 'vetting' | 'campaigns' | 'escrow' | 'system'
  
  // Pending queues state
  const [vettingQueue, setVettingQueue] = useState([]);
  const [campaignQueue, setCampaignQueue] = useState([]);
  const [escrowQueue, setEscrowQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  // System diagnostics state
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [healthStatus, setHealthStatus] = useState('Checking...');

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      triggerAlert('Please enter both email and password.');
      return;
    }

    fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    })
    .then(res => {
      if (!res.ok) throw new Error('Invalid credentials');
      return res.json();
    })
    .then(data => {
      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Administrator credentials required.');
      }
      localStorage.setItem('fundbridge_user', JSON.stringify(data.user));
      localStorage.setItem('fundbridge_token', data.token);
      setIsAdminAuthenticated(true);
      triggerAlert('Admin session authorized successfully.');
    })
    .catch(err => {
      triggerAlert(err.message || 'Authentication failed. Check your administrator credentials.');
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch vetting applicants
      const vetRes = await fetch(`${API_BASE_URL}/api/vetting/applicants`);
      if (vetRes.ok) {
        const vetData = await vetRes.json();
        setVettingQueue(vetData);
      }

      // Fetch pending campaigns
      const campRes = await fetch(`${API_BASE_URL}/api/admin/campaigns/pending`);
      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaignQueue(campData);
      }

      // Fetch pending milestone releases
      const escRes = await fetch(`${API_BASE_URL}/api/admin/escrow/pending`);
      if (escRes.ok) {
        const escData = await escRes.json();
        setEscrowQueue(escData);
      }

      // Fetch diagnostics health
      const healthRes = await fetch(`${API_BASE_URL}/api/health`);
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealthStatus(healthData.status);
        setDbStatus(healthData.database);
      } else {
        setHealthStatus('OFFLINE');
        setDbStatus('DISCONNECTED');
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      triggerAlert('Failed to sync administration queues.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadData();
    }
  }, [isAdminAuthenticated]);

  const handleApproveVetting = async (id, name) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vetting/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, status: 'verified' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update vetting');

      triggerAlert(`Approved validation credentials for ${name}! Trust profile set to Verified.`);
      loadData();
    } catch (err) {
      triggerAlert('Failed to update vetting status on server.');
    }
  };

  const handleRejectVetting = async (id, name) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vetting/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, status: 'rejected' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update vetting');

      triggerAlert(`Rejected validation request for ${name}.`);
      loadData();
    } catch (err) {
      triggerAlert('Failed to reject vetting on server.');
    }
  };

  const handleVerifyCampaign = async (campaignId, title) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/campaigns/${campaignId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify campaign');

      triggerAlert(`Approved campaign profile "${title}"! It is now live in the marketplace.`);
      loadData();
    } catch (err) {
      triggerAlert('Failed to verify campaign on server.');
    }
  };

  const handleApproveEscrow = async (campaignObjId, milestoneId, campaignTitle, milestoneTitle) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/escrow/${campaignObjId}/milestones/${milestoneId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to release escrow');

      triggerAlert(`Released tranche payment for ${campaignTitle} - "${milestoneTitle}"!`);
      loadData();
    } catch (err) {
      triggerAlert('Failed to release escrow tranche on server.');
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080C14] text-white flex flex-col justify-center items-center font-sans px-4 relative overflow-hidden">
        {/* Glowing backdrop circle */}
        <div className="absolute w-[500px] h-[500px] bg-sky-primary/10 rounded-full blur-[120px] pointer-events-none select-none"></div>

        <div className="max-w-md w-full bg-[#0B101E] border border-border-strong rounded-xl p-8 space-y-6 relative z-10 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded bg-sky-primary flex items-center justify-center font-display font-medium text-white text-lg mx-auto shadow-md">
              FB
            </div>
            <h2 className="text-xl font-medium tracking-tight font-display">FundBridge Admin Console</h2>
            <p className="text-xs text-text-muted">Enter administrative credentials to authenticate active session.</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider block mb-1.5">Administrator Email</label>
              <input 
                type="email" 
                required
                placeholder="admin@fundbridge.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-white/5 border border-border-strong rounded px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary focus:border-sky-primary placeholder-white/30"
              />
            </div>

            <div>
              <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider block mb-1.5">Secret Key Password</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-white/5 border border-border-strong rounded px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-primary focus:border-sky-primary placeholder-white/30"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-sky-primary hover:bg-sky-primary/90 text-white text-xs font-medium rounded transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md mt-2 text-center"
            >
              <Shield className="w-4 h-4 text-neon-mint" />
              <span>Authenticate Admin Session</span>
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center">
            <button 
              onClick={onLogout}
              className="text-xs text-text-muted hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180 text-sky-primary" />
              <span>Return to Marketplace</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] text-white flex justify-center items-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-sky-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-text-muted">Synchronizing administrative queues...</p>
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
            <span className="text-[10px] text-neon-mint tracking-wider block uppercase font-medium">Platform Administration</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded text-white/70 font-medium">
            Active: Mainnet 🇧🇩
          </span>
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-white transition-colors border border-border-strong rounded px-3 py-1.5 cursor-pointer bg-white/5"
          >
            <LogOut className="w-3.5 h-3.5 text-sky-primary" />
            <span>Exit Dashboard</span>
          </button>
        </div>
      </header>

      {/* Admin Panel Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 border-r border-border-strong bg-[#090D18] p-6 space-y-2 flex-shrink-0 text-left">
          <span className="text-[9px] font-medium tracking-widest text-text-muted uppercase block mb-4">Operations Vault</span>
          
          <button 
            onClick={() => setAdminTab('vetting')}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-3 ${
              adminTab === 'vetting' ? 'bg-sky-primary text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Verification Queue ({vettingQueue.length})</span>
          </button>

          <button 
            onClick={() => setAdminTab('campaigns')}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-3 ${
              adminTab === 'campaigns' ? 'bg-sky-primary text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Campaign Verification ({campaignQueue.length})</span>
          </button>
          
          <button 
            onClick={() => setAdminTab('escrow')}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-3 ${
              adminTab === 'escrow' ? 'bg-sky-primary text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Escrow Releases ({escrowQueue.length})</span>
          </button>

          <button 
            onClick={() => setAdminTab('system')}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-3 ${
              adminTab === 'system' ? 'bg-sky-primary text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>System Data Diagnostics</span>
          </button>
        </aside>

        {/* Workspace panel content */}
        <main className="flex-1 p-6 sm:p-8 bg-[#080C14] text-left overflow-y-auto">
          
          {/* TAB 1: USER VETTING */}
          {adminTab === 'vetting' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-medium tracking-tight font-display">User Verification & Vetting</h2>
                <p className="text-xs text-text-muted mt-1">Review student founder IDs and corporate credentials to unlock escrow transaction access.</p>
              </div>

              {vettingQueue.length === 0 ? (
                <div className="border border-dashed border-border-strong rounded-xl p-12 text-center text-text-muted space-y-3">
                  <CheckCircle className="w-8 h-8 text-neon-mint mx-auto opacity-70" />
                  <p className="text-xs font-medium">All vetting applications have been audited.</p>
                </div>
              ) : (
                <div className="border border-border-strong rounded-xl overflow-x-auto bg-[#0A0F1E] text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-border-strong text-text-muted font-medium">
                        <th className="p-4">Applicant Profile</th>
                        <th className="p-4">Designation</th>
                        <th className="p-4">Identity Details</th>
                        <th className="p-4">MFS Account</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-strong">
                      {vettingQueue.map(item => (
                        <tr key={item._id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-semibold text-white">{item.name}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${
                              item.role === 'founder' ? 'bg-sky-primary/10 text-sky-light border border-sky-primary/20' : 'bg-neon-mint/10 text-neon-mint border border-neon-mint/20'
                            }`}>
                              {item.role}
                            </span>
                          </td>
                          <td className="p-4 text-text-muted">
                            {item.role === 'founder' 
                              ? `${item.university} · NID: ${item.nid || 'N/A'}` 
                              : `${item.institution} · ${item.designation || 'N/A'}`}
                          </td>
                          <td className="p-4 text-text-muted">{item.mfsNumber || 'N/A'}</td>
                          <td className="p-4">
                            <div className="flex gap-2 justify-center">
                              <button 
                                onClick={() => handleApproveVetting(item._id, item.name)}
                                className="px-3 py-1.5 bg-neon-mint hover:bg-neon-mint/80 text-[#080C14] font-semibold rounded text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button 
                                onClick={() => handleRejectVetting(item._id, item.name)}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded border border-border-strong text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <X className="w-3 h-3 text-red-400" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAMPAIGN VERIFICATION */}
          {adminTab === 'campaigns' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-medium tracking-tight font-display">Campaign Launch verification</h2>
                <p className="text-xs text-text-muted mt-1">Audit newly submitted campaigns before they go live on the public directory catalog.</p>
              </div>

              {campaignQueue.length === 0 ? (
                <div className="border border-dashed border-border-strong rounded-xl p-12 text-center text-text-muted space-y-3">
                  <CheckCircle className="w-8 h-8 text-neon-mint mx-auto opacity-70" />
                  <p className="text-xs font-medium">All startup campaign applications have been verified.</p>
                </div>
              ) : (
                <div className="border border-border-strong rounded-xl overflow-x-auto bg-[#0A0F1E] text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-border-strong text-text-muted font-medium">
                        <th className="p-4">Project Title</th>
                        <th className="p-4">Founder / University</th>
                        <th className="p-4">Funding Target</th>
                        <th className="p-4">Terms Offered</th>
                        <th className="p-4 text-center">Verify Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-strong">
                      {campaignQueue.map(c => (
                        <tr key={c._id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-semibold text-white">{c.title}</td>
                          <td className="p-4 text-text-muted">
                            {c.founder?.name} · {c.university}
                          </td>
                          <td className="p-4 text-neon-mint font-semibold">৳ {c.goal.toLocaleString()} BDT</td>
                          <td className="p-4 text-sky-light font-medium">{c.equityOffer}</td>
                          <td className="p-4">
                            <div className="flex justify-center">
                              <button 
                                onClick={() => handleVerifyCampaign(c._id, c.title)}
                                className="px-3.5 py-1.5 bg-sky-primary hover:bg-sky-primary/80 text-white font-semibold rounded text-[10px] transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Verify Campaign</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ESCROW RELEASES */}
          {adminTab === 'escrow' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-medium tracking-tight font-display">Escrow Tranche Release Queue</h2>
                <p className="text-xs text-text-muted mt-1">Audit milestone completion receipts to trigger mobile tranche payouts to student MFS accounts.</p>
              </div>

              {escrowQueue.length === 0 ? (
                <div className="border border-dashed border-border-strong rounded-xl p-12 text-center text-text-muted space-y-3">
                  <CheckCircle className="w-8 h-8 text-neon-mint mx-auto opacity-70" />
                  <p className="text-xs font-medium">All milestone tranches release requests are cleared.</p>
                </div>
              ) : (
                <div className="border border-border-strong rounded-xl overflow-x-auto bg-[#0A0F1E] text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-border-strong text-text-muted font-medium">
                        <th className="p-4">Campaign</th>
                        <th className="p-4">Milestone Objective</th>
                        <th className="p-4">Tranche payout</th>
                        <th className="p-4">MFS Receiver</th>
                        <th className="p-4 text-center">Settlement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-strong">
                      {escrowQueue.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-semibold text-white">{item.campaignTitle}</td>
                          <td className="p-4 text-white/90">
                            {item.milestoneTitle} ({item.target})
                          </td>
                          <td className="p-4 text-neon-mint font-semibold">৳ {item.amount.toLocaleString()} BDT</td>
                          <td className="p-4 text-text-muted">
                            {item.founder?.name} · {item.founder?.mfsNumber}
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center">
                              <button 
                                onClick={() => handleApproveEscrow(item.campaignObjId, item.milestoneId, item.campaignTitle, item.milestoneTitle)}
                                className="px-3.5 py-1.5 bg-sky-primary hover:bg-sky-primary/80 text-white font-semibold rounded text-[10px] transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <Shield className="w-3.5 h-3.5 text-neon-mint" />
                                <span>Release Escrow Tranche</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SYSTEM HEALTH */}
          {adminTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-medium tracking-tight font-display">System Diagnostics</h2>
                <p className="text-xs text-text-muted mt-1">Platform server statuses and live database metrics logs.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-border-strong rounded-xl p-5 bg-[#0A0F1E] space-y-2">
                  <span className="text-[10px] text-text-muted uppercase block font-medium">Server API Status</span>
                  <div className="text-lg font-semibold text-neon-mint flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-neon-mint animate-pulse"></span>
                    <span>{healthStatus === 'healthy' ? 'ONLINE (200 OK)' : 'OFFLINE'}</span>
                  </div>
                </div>

                <div className="border border-border-strong rounded-xl p-5 bg-[#0A0F1E] space-y-2">
                  <span className="text-[10px] text-text-muted uppercase block font-medium">MongoDB Cluster Connection</span>
                  <div className="text-lg font-semibold text-sky-light flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-primary animate-pulse"></span>
                    <span>{dbStatus === 'connected' ? 'CONNECTED (Atlas)' : 'DISCONNECTED'}</span>
                  </div>
                </div>

                <div className="border border-border-strong rounded-xl p-5 bg-[#0A0F1E] space-y-2">
                  <span className="text-[10px] text-text-muted uppercase block font-medium">Active Channels</span>
                  <div className="text-lg font-semibold text-white">
                    Mainnet Escrow Enabled
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
