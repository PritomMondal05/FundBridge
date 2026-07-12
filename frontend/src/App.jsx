import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { 
  ArrowRight, 
  Play, 
  Check, 
  Clock, 
  Lock, 
  MessageSquare, 
  Shield, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Send, 
  FileText,
  Upload
} from 'lucide-react';
import logoUrl from './assets/images/FundBridge Logo Black.svg';
import logoWhiteUrl from './assets/images/FundBridge Logo White.svg';
import landingImage from './assets/images/landing_image.webp';
import footerImage from './assets/images/footer_image.webp';

const TESTIMONIALS = [
  {
    text: "The startup milestone model completely shifts how early backers engage with you. Instead of passive observers, our alumni networks act as an active growth engine—constantly introducing us to strategic partners, new investors, and key tech talent.",
    highlight: "alumni networks act as an active growth engine",
    author: "Nabil Khan",
    role: "Co-Founder of Mirai",
    avatar: "NK"
  },
  {
    text: "In sports analytics, trust and domain expertise are everything. Having incentive-aligned supporters from earlier milestones has opened doors to sports clubs, data partners, and analytics leads we couldn't have reached on our own.",
    highlight: "Having incentive-aligned supporters from earlier milestones",
    author: "Md. Tariquzzaman",
    role: "Founder of Tacos Football Analytics",
    avatar: "MT"
  },
  {
    text: "When your community has skin in the game, distribution becomes organic. Our backers actively recommend us to student networks and institutions, driving consistent user acquisition and credibility for our platform.",
    highlight: "When your community has skin in the game",
    author: "Md. Affan Hossain Rakib",
    role: "Founder of StudySync",
    avatar: "MR"
  },
  {
    text: "Aligning incentives around real business milestones builds incredible brand loyalty. Our early backers operate like true brand ambassadors, constantly bringing in direct customer leads and valuable retail connections.",
    highlight: "backers operate like true brand ambassadors",
    author: "Sabbir Akon",
    role: "Co-Founder of Jersey Lover BD",
    avatar: "SA"
  },
  {
    text: "Scaling an organic store relies heavily on word-of-mouth and trust. The milestone structure turned our early supporters into dedicated advocates who regularly connect us with premium suppliers and high-value buyers.",
    highlight: "turned our early supporters into dedicated advocates",
    author: "Taheer Hossain Zidan",
    role: "Founder of Karupolli Organic Store",
    avatar: "TZ"
  },
  {
    text: "This model creates a powerful ripple effect for B2B expansion. Our alumni backers aren't just invested in our success on paper—they actively plug us into their business networks and generate enterprise leads.",
    highlight: "actively plug us into their business networks",
    author: "Abid Ahmed Anonto",
    role: "CEO of TradeBussines",
    avatar: "AA"
  },
  {
    text: "Community is the heart of gaming, and the milestone setup keeps everyone aligned around the same vision. Our early network continuously brings in new players, creators, and collab opportunities that push the game forward.",
    highlight: "keeps everyone aligned around the same vision",
    author: "Shaikh Sammo Al Aziz",
    role: "Co-Founder of Swildle Street Game",
    avatar: "SA"
  }
];

const STATS = [
  { label: 'TOTAL RAISED', target: 12500000, suffix: ' +', format: (val) => Number(val.toFixed(0)).toLocaleString('en-IN'), desc: 'BDT (TAKA)' },
  { label: 'VERIFIED PROJECTS', target: 140, suffix: '+', format: (val) => val.toFixed(0), desc: 'UNIVERSITY DRIVEN' },
  { label: 'ACTIVE BACKERS', target: 85, suffix: '+', format: (val) => val.toFixed(0), desc: 'ALUMNI & FIRMS' },
  { label: 'COMPLETION RATE', target: 98.4, suffix: '%', format: (val) => val.toFixed(1), desc: 'MILESTONE SUCCESS' }
];

export default function App() {
  // Navigation & Modals State
  const [activeModal, setActiveModal] = useState(null); // 'login' | 'register' | null
  const [registerRole, setRegisterRole] = useState('founder'); // 'founder' | 'investor'
  
  // Sandbox state inside Hero dashboard frame overlay
  const [sandboxTab, setSandboxTab] = useState('Campaign'); // 'Overview' | 'Campaign' | 'Investors' | 'Negotiate' | 'Milestones'
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Zaman (Investor)', text: 'Interested in 8% revenue share. Can we discuss your Q2 targets?', time: '11:42 AM' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [milestonesState, setMilestonesState] = useState([
    { name: 'MVP Launch', target: 'Month 1', status: 'Done', badge: 'bg-green-100 text-green-800' },
    { name: 'First 100 Users', target: 'Month 2', status: 'Active', badge: 'bg-amber-100 text-amber-800' },
    { name: 'Revenue ৳50K', target: 'Month 4', status: 'Locked', badge: 'bg-gray-100 text-gray-800' }
  ]);
  const [uploadedReceipt, setUploadedReceipt] = useState(null);
  const [uploadingState, setUploadingState] = useState(false);

  // Carousel Indexes
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // UI Toast message
  const [alertMessage, setAlertMessage] = useState(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, sandboxTab]);

  const statsRefs = useRef([]);
  useEffect(() => {
    STATS.forEach((stat, idx) => {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: stat.target,
        duration: 2.0,
        ease: 'power2.out',
        onUpdate: () => {
          if (statsRefs.current[idx]) {
            statsRefs.current[idx].innerText = stat.format(obj.val) + stat.suffix;
          }
        }
      });
    });
  }, []);

  const triggerAlert = (message) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = { sender: 'You (Founder)', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');

    setTimeout(() => {
      const investorReplies = [
        "That makes sense. If you hit Milestone 2 in 30 days, we can release the next BDT 1,50,000.",
        "Can you upload the initial recipe lists and site rent agreement as verification files?",
        "I'm ready to proceed with BDT 5,00,000 at 8% gross revenue share. Let's lock the escrow deal.",
        "How is the student rider network scheduled? Do they work part-time between classes?"
      ];
      const randomReply = investorReplies[Math.floor(Math.random() * investorReplies.length)];
      setChatMessages(prev => [...prev, {
        sender: 'Zaman (Investor)',
        text: randomReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1200);
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedReceipt(file.name);
    }
  };

  const submitReceiptForVerification = () => {
    if (!uploadedReceipt) return;
    setUploadingState(true);
    setTimeout(() => {
      setMilestonesState(prev => {
        const nextState = [...prev];
        nextState[1] = { ...nextState[1], status: 'Pending Review' };
        return nextState;
      });
      setUploadingState(false);
      setUploadedReceipt(null);
      triggerAlert("Receipt proof uploaded successfully! Milestone set to 'Pending Admin Review'.");
    }, 1500);
  };

  const handleMockProposalAction = (action) => {
    triggerAlert(`Proposal ${action === 'accept' ? 'Accepted' : 'Rejected'}! Dynamic Safety Deposit is required via bKash/Nagad gateway to unlock the escrow tranche.`);
  };

  return (
    <div className="relative min-h-screen bg-surface-clean text-text-charcoal selection:bg-sky-primary selection:text-white overflow-x-hidden font-sans">
      
      {/* Toast Notification Alert */}
      {alertMessage && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-obsidian-dark text-white px-5 py-4 rounded-sm border-l-4 border-neon-mint shadow-xl animate-bounce">
          <Info className="w-5 h-5 text-neon-mint flex-shrink-0" />
          <p className="text-sm font-medium">{alertMessage}</p>
        </div>
      )}

      {/* HEADER SECTION A */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-transparent h-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center">
            {/* SVG Logo from Assets */}
            <a href="/" className="inline-block">
              <img src={logoUrl} alt="FundBridge Logo" className="h-10 w-auto" />
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-medium">
            <a href="#founders" className="text-text-charcoal hover:text-sky-primary transition-colors text-md">For Entrepreneurs</a>
            <a href="#investors" className="text-text-charcoal hover:text-sky-primary transition-colors text-md">For Investors</a>
            <a href="#trust" className="text-text-charcoal hover:text-sky-primary transition-colors text-md">Trust Center</a>
            <a href="#capabilities" className="text-text-charcoal hover:text-sky-primary transition-colors text-md">Success Stories</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveModal('login')}
              className="px-5 py-2 border border-obsidian-base rounded-sm hover:bg-surface-cool text-obsidian-base font-medium text-sm cursor-pointer transition-all duration-150"
            >
              Login
            </button>
            <button 
              onClick={() => setActiveModal('register')}
              className="px-5 py-2 bg-obsidian-base text-white font-medium rounded-sm hover:bg-obsidian-dark text-sm cursor-pointer transition-all duration-150 shadow-soft"
            >
              Register
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION B */}
      <section className="relative overflow-hidden pt-28 pb-32 bg-surface-clean">
        
        {/* Generative AI Sky/Forest Background Canvas */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-100 select-none overflow-hidden">
          <img 
            src={landingImage} 
            alt="Sky and Evergreen Forest Horizon" 
            className="w-full h-full object-cover object-center" 
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-20">
          
          {/* Active Badge */}
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/50 text-text-charcoal font-medium text-xs shadow-soft mb-8">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-mint animate-pulse"></span>
            <span>Now Active Across Dhaka & Campus Hubs 🇧🇩</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium text-obsidian-base font-display max-w-5xl mx-auto leading-tight tracking-tight mb-6">
            Bridging the Gap Between <span className="text-white">Brilliant Student Innovators</span> & Visionary Alumni Backers.
          </h1>

          {/* Subtext */}
          <p className="text-md sm:text-lg md:text-xl text-text-charcoal max-w-3xl mx-auto font-normal leading-relaxed mb-10">
            A high-trust, milestone-driven investment platform tailored for Bangladeshi university startups. No trade license required for early-stage validation.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a 
              href="#founders"
              className="w-full sm:w-auto px-8 py-4 bg-obsidian-base hover:bg-obsidian-dark text-white font-medium rounded-full text-md transition-all inline-flex items-center justify-center gap-3 shadow-lg"
            >
              <span>Launch Your Campaign</span>
              <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="#investors"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-surface-cool text-text-charcoal font-medium rounded-full text-md border border-border-default transition-all inline-flex items-center justify-center gap-3 shadow-soft"
            >
              <Play className="w-5 h-5 text-sky-primary fill-sky-primary" />
              <span>Explore Verified Startups</span>
            </a>
          </div>

          {/* INTERACTIVE WORKSPACE PREVIEW FRAME */}
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl border border-border-default overflow-hidden relative group">
            
            {/* Chrome Bar Style */}
            <div className="bg-surface-cool px-5 py-3 border-b border-border-default flex items-center justify-between">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
              </div>
              <div className="bg-white px-8 py-1 rounded text-xs text-text-muted font-mono tracking-wide border border-border-default/60">
                fundbridge.io/dashboard
              </div>
              <div className="w-10"></div>
            </div>

            {/* Sidebar + Main Viewport Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 min-h-[440px]">
              
              {/* Sidebar Component */}
              <div className="col-span-1 bg-surface-cool border-r border-border-default p-5 flex flex-col gap-2 text-left">
                <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-3 px-2">
                  WORKSPACE
                </div>
                {[
                  { name: 'Overview', icon: Shield },
                  { name: 'Campaign', icon: Shield },
                  { name: 'Investors', icon: Shield },
                  { name: 'Negotiate', icon: Shield },
                  { name: 'Milestones', icon: Shield }
                ].map(tab => {
                  const isActive = sandboxTab === tab.name;
                  return (
                    <button
                      key={tab.name}
                      onClick={() => setSandboxTab(tab.name)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                        isActive 
                          ? 'bg-obsidian-base text-white shadow-md' 
                          : 'text-text-charcoal hover:bg-gray-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-sky-primary' : 'bg-text-charcoal/40'}`}></span>
                      <span>{tab.name}</span>
                      {tab.name === 'Negotiate' && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-sky-primary animate-ping"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Viewport content based on active state */}
              <div className="col-span-3 p-6 sm:p-8 text-left bg-white flex flex-col justify-between">
                
                {/* 1. OVERVIEW TAB */}
                {sandboxTab === 'Overview' && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-border-default pb-4">
                      <div>
                        <h3 className="text-2xl font-medium text-obsidian-base font-display">CampusBites Profile</h3>
                        <p className="text-xs text-text-muted">BRAC University Campus Incubator Project</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-neon-mint text-xs text-pine-deep font-medium">
                        <Check className="w-3 h-3 text-neon-mint" />
                        <span>NID & Enrollment Verified</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-text-charcoal leading-relaxed">
                      Providing premium, healthy meal delivery boxes inside campus parameters on a subscription basis for students and faculty. Highly automated booking app.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-surface-cool rounded-lg border border-border-default">
                        <div className="text-xs text-text-muted font-medium uppercase">Funding Target</div>
                        <div className="text-lg font-medium text-obsidian-base">৳ 5,0,000 BDT</div>
                      </div>
                      <div className="p-4 bg-surface-cool rounded-lg border border-border-default">
                        <div className="text-xs text-text-muted font-medium uppercase">Terms Configuration</div>
                        <div className="text-lg font-medium text-obsidian-base">8% Rev. Share</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. CAMPAIGN TAB (DEFAULT FIGMA BLUEPRINT STATE) */}
                {sandboxTab === 'Campaign' && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-medium uppercase text-text-muted tracking-wide">Active Campaign</span>
                        <h3 className="text-2xl font-medium text-obsidian-base font-display flex items-center gap-2">
                          CampusBites 🍱
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-neon-mint rounded-full border border-neon-mint/30 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-mint animate-pulse"></span>
                        <span>Live</span>
                      </div>
                    </div>

                    {/* Progress Bar & Meta */}
                    <div className="bg-surface-cool p-4 rounded-lg border border-border-default/80">
                      <div className="flex items-center justify-between font-medium text-sm mb-2">
                        <span className="text-text-charcoal text-xs font-medium">Funding Progress</span>
                        <span className="text-obsidian-base font-medium text-xs">৳ 3,00,000 / ৳ 5,00,000</span>
                      </div>
                      
                      {/* Metric Line */}
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-sky-primary" style={{ width: '60%' }}></div>
                      </div>

                      <div className="text-[10px] font-medium text-text-muted uppercase">
                        60% funded — 14 days left
                      </div>
                    </div>

                    {/* Milestones Status Table */}
                    <div className="overflow-x-auto border border-border-default rounded-lg">
                      <table className="min-w-full divide-y divide-border-default text-xs">
                        <thead className="bg-surface-cool text-text-muted font-medium">
                          <tr>
                            <th className="px-4 py-2 text-left">Milestone</th>
                            <th className="px-4 py-2 text-left">Target</th>
                            <th className="px-4 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default font-medium">
                          {milestonesState.map((milestone, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2.5 font-medium">{milestone.name}</td>
                              <td className="px-4 py-2.5 text-text-muted">{milestone.target}</td>
                              <td className="px-4 py-2.5">
                                <span className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${
                                  milestone.status === 'Done' ? 'bg-green-100 text-green-800' :
                                  milestone.status === 'Active' ? 'bg-amber-100 text-amber-800' :
                                  milestone.status === 'Pending Review' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {milestone.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Chat Notification Preview Tray */}
                    <div className="bg-sky-primary/10 border border-sky-light/40 rounded-lg p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-sky-primary/20 transition-all" onClick={() => setSandboxTab('Negotiate')}>
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="w-4 h-4 text-sky-primary" />
                        <div>
                          <span className="font-medium text-obsidian-base">Negotiation — Zaman (Investor):</span>
                          <span className="text-text-charcoal ml-1">"Interested in 8% revenue share. Can we discuss your Q2 targets?"</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-sky-primary" />
                    </div>
                  </div>
                )}

                {/* 3. INVESTORS TAB */}
                {sandboxTab === 'Investors' && (
                  <div className="space-y-4 animate-fadeIn w-full">
                    <div className="border-b border-border-default pb-3">
                      <h3 className="text-lg font-medium text-obsidian-base">Investment Proposals</h3>
                      <p className="text-xs text-text-muted">Review proposals submitted by corporate alumni sponsors.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 border border-border-default rounded-lg bg-surface-cool/40">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium text-obsidian-base">Zaman Chowdhury</span>
                            <span className="text-[10px] text-text-muted block">BRAC Alumnus</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs my-2 bg-white p-2.5 rounded border border-border-default">
                          <div><span className="text-text-muted">Committed:</span> <strong className="text-obsidian-base">৳ 5,0,000</strong></div>
                          <div><span className="text-text-muted">Offer Terms:</span> <strong className="text-obsidian-base">8% Rev. Share</strong></div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => handleMockProposalAction('reject')} className="px-3 py-1 border border-red-500 text-red-500 rounded text-xs font-medium hover:bg-red-55 cursor-pointer">Decline</button>
                          <button onClick={() => handleMockProposalAction('accept')} className="px-3 py-1 bg-obsidian-base text-white rounded text-xs font-medium hover:bg-obsidian-dark cursor-pointer">Accept Proposal</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. NEGOTIATE TAB */}
                {sandboxTab === 'Negotiate' && (
                  <div className="space-y-4 animate-fadeIn flex flex-col justify-between h-[360px] w-full">
                    <div className="border-b border-border-default pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-obsidian-base">Negotiation Channel</h3>
                        <p className="text-xs text-neon-mint font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-neon-mint animate-pulse"></span>
                          <span>Active Socket.io Sync Connection</span>
                        </p>
                      </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 bg-surface-cool p-3 rounded-lg overflow-y-auto space-y-3 max-h-[220px]">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.sender.includes('You') ? 'items-end' : 'items-start'}`}>
                          <div className={`text-[10px] text-text-muted mb-0.5 px-1`}>{msg.sender} · {msg.time}</div>
                          <div className={`p-3 rounded-lg max-w-[85%] text-xs ${
                            msg.sender.includes('You') 
                              ? 'bg-obsidian-base text-white rounded-tr-none' 
                              : 'bg-white border border-border-default text-text-charcoal rounded-tl-none'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      <div ref={chatBottomRef}></div>
                    </div>

                    {/* Chat Input form */}
                    <form onSubmit={handleSendChatMessage} className="flex gap-2">
                      <input 
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Discuss revenue payback or milestone targets..."
                        className="flex-1 border border-border-default rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-primary"
                      />
                      <button 
                        type="submit"
                        className="bg-sky-primary hover:bg-sky-primary/90 text-white p-2 rounded-md transition-colors cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}

                {/* 5. MILESTONES TAB */}
                {sandboxTab === 'Milestones' && (
                  <div className="space-y-4 animate-fadeIn w-full">
                    <div className="border-b border-border-default pb-3">
                      <h3 className="text-xl font-medium text-obsidian-base">Milestone Escrow</h3>
                      <p className="text-xs text-text-muted">Upload scanned invoices to request funds for the active milestone.</p>
                    </div>

                    <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2.5">
                        <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-amber-800">Current Task: First 100 Users</h4>
                          <p className="text-xs text-amber-700 mt-1">
                            Disbursement tranche value: <strong className="font-medium text-obsidian-base">৳ 1,50,000 BDT</strong>.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Receipt Upload Demonstration */}
                    <div className="border-2 border-dashed border-border-default rounded-lg p-5 text-center flex flex-col items-center justify-center bg-surface-cool/30 hover:bg-surface-cool/50 transition-colors">
                      <Upload className="w-8 h-8 text-text-muted mb-2" />
                      <label className="text-xs font-medium text-sky-primary hover:underline cursor-pointer">
                        Click to select receipt PDF / Image
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={handleReceiptUpload}
                        />
                      </label>
                      {uploadedReceipt && (
                        <div className="mt-3 flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-border-default text-xs font-medium">
                          <FileText className="w-4 h-4 text-sky-primary" />
                          <span>{uploadedReceipt}</span>
                          <button onClick={() => setUploadedReceipt(null)} className="text-red-500 hover:text-red-700"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={submitReceiptForVerification}
                      disabled={!uploadedReceipt || uploadingState}
                      className={`w-full py-2.5 bg-obsidian-base text-white text-xs font-medium rounded-lg hover:bg-obsidian-dark transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        (!uploadedReceipt || uploadingState) && 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {uploadingState ? 'Uploading File Buffers...' : 'Submit Proof to Admins'}
                    </button>
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* SECTION C: PLATFORM AT A GLANCE (LIVE IMPACT TICKER) */}
      <section id="trust" className="bg-obsidian-dark py-16 text-white relative z-10 border-t border-border-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sky-primary text-xs font-medium tracking-widest uppercase">LIVE IMPACT</span>
            <h2 className="text-3xl sm:text-4xl font-medium text-white font-display mt-2">Platform at a Glance</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat, idx) => (
              <div 
                key={idx} 
                className="glass-panel-dark p-6 rounded-lg border border-border-strong text-center flex flex-col justify-between hover:border-sky-primary/40 transition-all duration-300 group"
              >
                <div className="text-[11px] font-medium text-sky-light tracking-widest uppercase mb-4">{stat.label}</div>
                <div 
                  ref={el => statsRefs.current[idx] = el}
                  className="text-3xl font-medium text-white font-display my-2 tracking-tight group-hover:scale-105 transition-transform"
                >
                  {stat.format(0) + stat.suffix}
                </div>
                <div className="text-[10px] text-text-muted font-medium tracking-wider mt-4">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION D: TWO LANES, ONE PLATFORM */}
      <section id="founders" className="py-20 bg-surface-cool/30 relative z-10 border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-sky-primary text-xs font-medium tracking-widest uppercase">HOW IT WORKS</span>
            <h2 className="text-3xl sm:text-4xl font-medium text-obsidian-base font-display mt-2">Two Lanes, One Platform</h2>
            <p className="text-text-charcoal/80 max-w-2xl mx-auto text-md mt-3">Whether you're building the next big campus startup or backing the next generation of Bangladeshi innovators.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left">
            
            {/* LEFT LANE: STUDENT FOUNDERS */}
            <div className="bg-white rounded-xl p-8 border border-border-default shadow-soft flex flex-col justify-between hover:shadow-lg transition-shadow">
              <div>
                <div className="inline-flex items-center gap-2 bg-sky-primary/10 text-sky-primary px-3 py-1 rounded-full text-xs font-medium mb-6">
                  🚀 For Student Founders
                </div>
                
                <h3 className="text-2xl font-medium text-obsidian-base font-display mb-6">Accelerate Without Legal Friction</h3>
                
                <div className="space-y-6 mb-8">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-obsidian-base text-white font-medium flex items-center justify-center flex-shrink-0 text-sm font-display">01</div>
                    <div>
                      <h4 className="text-md font-medium text-obsidian-base">Secure Verification</h4>
                      <p className="text-sm text-text-charcoal/80 mt-1">Auto-validation via NID & university enrollment databases.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-obsidian-base text-white font-medium flex items-center justify-center flex-shrink-0 text-sm font-display">02</div>
                    <div>
                      <h4 className="text-md font-medium text-obsidian-base">Deploy Milestones</h4>
                      <p className="text-sm text-text-charcoal/80 mt-1">Map your execution targets transparently for investors.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-obsidian-base text-white font-medium flex items-center justify-center flex-shrink-0 text-sm font-display">03</div>
                    <div>
                      <h4 className="text-md font-medium text-obsidian-base">Post-Fund Deposit</h4>
                      <p className="text-sm text-text-charcoal/80 mt-1">Lock your completion bond only after funding is secured.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setRegisterRole('founder');
                  setActiveModal('register');
                }}
                className="w-full py-4 bg-obsidian-base hover:bg-obsidian-dark text-white font-medium rounded-lg transition-all text-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Launch Your Campaign</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* RIGHT LANE: ANGEL INVESTORS */}
            <div className="bg-obsidian-dark rounded-xl p-8 border border-border-strong shadow-2xl flex flex-col justify-between hover:border-neon-mint/30 transition-all text-white">
              <div>
                <div className="inline-flex items-center gap-2 bg-neon-mint/10 text-neon-mint px-3 py-1 rounded-full text-xs font-medium mb-6">
                  💼 For Angel Investors
                </div>
                
                <h3 className="text-2xl font-medium text-white font-display mb-6">Vetted Ventures, Protected Assets</h3>
                
                <div className="space-y-6 mb-8 text-left">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-neon-mint text-obsidian-base font-medium flex items-center justify-center flex-shrink-0 text-sm font-display">01</div>
                    <div>
                      <h4 className="text-md font-medium text-white">Explore & Filter</h4>
                      <p className="text-sm text-text-muted mt-1">Sort by university, BDT goal, or startup stage.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-neon-mint text-obsidian-base font-medium flex items-center justify-center flex-shrink-0 text-sm font-display">02</div>
                    <div>
                      <h4 className="text-md font-medium text-white">Submit Proposals</h4>
                      <p className="text-sm text-text-muted mt-1">Send interactive deal sheets — equity or revenue share.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-neon-mint text-obsidian-base font-medium flex items-center justify-center flex-shrink-0 text-sm font-display">03</div>
                    <div>
                      <h4 className="text-md font-medium text-white">Reclaim & Yield</h4>
                      <p className="text-sm text-text-muted mt-1">Audit receipts and receive auto-payouts to your digital ledger.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setRegisterRole('investor');
                  setActiveModal('register');
                }}
                className="w-full py-4 bg-neon-mint hover:bg-neon-mint/90 text-obsidian-base font-medium rounded-lg transition-all text-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Explore Verified Startups</span>
                <ArrowRight className="w-5 h-5 text-obsidian-base" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION E: CAPABILITIES CAROUSEL */}
      <section id="capabilities" className="py-24 bg-obsidian-dark text-white relative z-10 border-t border-border-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div className="text-left">
              <span className="text-sky-primary text-xs font-medium tracking-widest uppercase">CAPABILITIES</span>
              <h2 className="text-3xl sm:text-4xl font-medium text-white font-display mt-2">For founders, investors, and campus networks</h2>
              <p className="text-text-muted text-sm mt-2 max-w-xl">A unified technological trust ecosystem designed to take your venture from pitch-deck to payout.</p>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2 mt-4 md:mt-0">
              <button 
                onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                disabled={carouselIndex === 0}
                className={`p-2.5 border border-border-strong rounded-full cursor-pointer transition-colors ${
                  carouselIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-border-strong text-white'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCarouselIndex(prev => Math.min(3, prev + 1))}
                disabled={carouselIndex === 3}
                className={`p-2.5 border border-border-strong rounded-full cursor-pointer transition-colors ${
                  carouselIndex === 3 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-border-strong text-white'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cards Carousel viewport */}
          <div className="overflow-hidden">
            <div 
              className="flex gap-6 transition-transform duration-500 ease-in-out" 
              style={{ transform: `translateX(-${carouselIndex * 280}px)` }}
            >
              {[
                {
                  tag: 'AI INTEGRATION',
                  title: 'AI Optimization Engine',
                  details: 'Pass raw milestones to our integrated Google Gemini AI assistant to receive structured business decks and investor matching summaries.',
                },
                {
                  tag: 'CHATTING FACILITIES',
                  title: 'Socket.io Direct Negotiation',
                  details: 'Negotiate term sheets, equity options, and milestone release schedules in real-time within a secure API-driven messenger.',
                },
                {
                  tag: 'TRUST INFRASTRUCTURE',
                  title: 'Milestone-Locked Tranches',
                  details: 'Release capital incrementally based on project progress. Escrow unlocks automatically as receipts are submitted.',
                },
                {
                  tag: 'ACCOUNTABILITY',
                  title: 'Post-Funding Completion Bond',
                  details: 'Flexible safety deposit bonds keep operations reliable. Fully refunded progressively as milestones are successfully met.',
                }
              ].map((cap, idx) => (
                <div 
                  key={idx} 
                  className="min-w-[280px] w-[280px] sm:min-w-[340px] sm:w-[340px] bg-obsidian-base border border-border-strong rounded-xl p-6 flex flex-col justify-between min-h-[320px] hover:border-sky-primary transition-colors text-left"
                >
                  <div>
                    <span className="text-[10px] text-sky-primary font-medium uppercase tracking-wider">{cap.tag}</span>
                    <h3 className="text-lg font-medium text-white font-display mt-3">{cap.title}</h3>
                    <p className="text-xs text-text-muted mt-3 font-normal leading-relaxed">{cap.details}</p>
                  </div>

                  <a 
                    onClick={() => triggerAlert(`${cap.title} configuration details loaded.`)}
                    className="text-xs text-sky-primary hover:underline font-medium mt-6 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll progress line */}
          <div className="w-full bg-border-strong h-0.5 rounded-full mt-10 overflow-hidden relative">
            <div 
              className="bg-sky-primary h-full transition-all duration-300 absolute"
              style={{ 
                left: `${(carouselIndex / 4) * 100}%`,
                width: `25%` 
              }}
            ></div>
          </div>

        </div>
      </section>

      {/* SECTION F: TESTIMONIALS */}
      <section className="py-24 bg-obsidian-base text-white relative z-10 border-t border-border-strong">
        <div className="max-w-5xl mx-auto px-4 text-center">
          
          {/* Large Quotes Icon */}
          <div className="text-sky-primary text-5xl font-serif mb-6 opacity-30 select-none">“</div>

          {/* Testimonial Quote slider */}
          <div className="min-h-[160px] flex items-center justify-center">
            <p className="text-xl sm:text-2xl font-medium leading-relaxed font-display text-white max-w-4xl italic transition-all duration-300">
              "{TESTIMONIALS[testimonialIndex].text.includes(TESTIMONIALS[testimonialIndex].highlight) ? (
                <>
                  {TESTIMONIALS[testimonialIndex].text.split(TESTIMONIALS[testimonialIndex].highlight)[0]}
                  <span className="text-sky-primary font-medium not-italic">
                    {TESTIMONIALS[testimonialIndex].highlight}
                  </span>
                  {TESTIMONIALS[testimonialIndex].text.split(TESTIMONIALS[testimonialIndex].highlight)[1]}
                </>
              ) : (
                TESTIMONIALS[testimonialIndex].text
              )}"
            </p>
          </div>

          {/* Profile centerpiece */}
          <div className="mt-8 flex items-center justify-center gap-6">
            <button 
              onClick={() => setTestimonialIndex(prev => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1))}
              className="p-2 border border-border-strong hover:bg-border-strong text-white rounded-full transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-sky-primary text-white font-medium flex items-center justify-center text-lg border-2 border-border-strong font-display">
                {TESTIMONIALS[testimonialIndex].avatar}
              </div>
              <strong className="text-md font-medium text-white mt-3 block">{TESTIMONIALS[testimonialIndex].author}</strong>
              <span className="text-xs text-text-muted">{TESTIMONIALS[testimonialIndex].role}</span>
            </div>

            <button 
              onClick={() => setTestimonialIndex(prev => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1))}
              className="p-2 border border-border-strong hover:bg-border-strong text-white rounded-full transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-12">
            <a 
              onClick={() => triggerAlert(`Loading detailed case study metrics for ${TESTIMONIALS[testimonialIndex].author}...`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border-strong text-xs font-medium text-white hover:bg-border-strong cursor-pointer transition-colors"
            >
              <span>Case study · {TESTIMONIALS[testimonialIndex].author}: Scaling with milestone-driven growth</span>
              <ArrowRight className="w-4.5 h-4.5 text-sky-primary" />
            </a>
          </div>

        </div>
      </section>

      {/* SECTION G: MISSION BLOCK */}
      <section className="relative overflow-hidden py-24 bg-[#0A0F18] text-white border-t border-border-strong">
        
        {/* Background Image showing river/forest landscape of Bangladesh */}
        <div className="absolute inset-0 opacity-30 pointer-events-none select-none z-0">
          <img 
            src={footerImage} 
            alt="Bangladesh Landscape River and Forest" 
            className="w-full h-full object-cover object-center" 
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-6">
          <span className="text-[10px] sm:text-xs font-medium tracking-widest text-white/80 uppercase block">
            WE'RE FUNDING THE FUTURE BANGLADESHI STARTUP ECOSYSTEM
          </span>
          <h2 className="text-3xl sm:text-4xl font-medium text-white font-display leading-tight">
            Let's Keep the Bangladeshi Innovation Dream Alive
          </h2>
          <p className="text-sm sm:text-md text-white/80 max-w-2xl mx-auto leading-relaxed">
            We're fighting to keep the local startup landscape defined by optimism, youth-led innovation, and transparency — giving campus founders the platform they need to turn ideas into scalable realities.
          </p>

          <div className="pt-4">
            <button 
              onClick={() => triggerAlert("Loading FundBridge Charter...")}
              className="px-8 py-3.5 bg-white hover:bg-surface-cool text-obsidian-base font-medium rounded-full text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer inline-flex items-center gap-2"
            >
              <span>Learn more about our mission</span>
              <ArrowRight className="w-4.5 h-4.5 text-sky-primary" />
            </button>
          </div>
        </div>
      </section>

      {/* INSTITUTIONAL FOOTER */}
      <footer className="bg-obsidian-base text-white pt-16 pb-8 border-t border-border-strong relative z-10 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 border-b border-border-strong pb-12">
          
          {/* Column 1 */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img src={logoWhiteUrl} alt="FundBridge White Logo" className="h-10 w-auto" />
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              © 2026 FundBridge Pvt. Ltd.<br />Dhaka, Bangladesh.<br />Connecting student entrepreneurs directly with alumni backing tranches.
            </p>
            
            {/* Payment Badges */}
            <div className="pt-4 space-y-2">
              <span className="text-[9px] font-medium text-text-muted tracking-wider uppercase block">Transaction Gateway Partners</span>
              <div className="flex gap-2 items-center flex-wrap">
                <span className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[9px] font-medium text-neon-mint">bKash</span>
                <span className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[9px] font-medium text-sky-light">Nagad</span>
                <span className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[9px] font-medium text-white">Mastercard</span>
              </div>
            </div>
          </div>

          {/* Column 2 (Founders) */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-white tracking-widest uppercase">Founders</h4>
            <ul className="space-y-1.5 text-xs text-text-muted font-medium">
              <li><a onClick={() => triggerAlert("Direct Founder Round configuration details coming soon.")} className="hover:text-sky-primary transition-colors cursor-pointer">Community Round</a></li>
              <li><a onClick={() => triggerAlert("Private deals portal accessible via dashboard.")} className="hover:text-sky-primary transition-colors cursor-pointer">Private Deals</a></li>
              <li><a onClick={() => setSandboxTab('Overview')} className="hover:text-sky-primary transition-colors cursor-pointer">Founder Dashboard</a></li>
              <li><a onClick={() => triggerAlert("NID verification standards handbook.")} className="hover:text-sky-primary transition-colors cursor-pointer">Vetting Requirements</a></li>
              <li><a onClick={() => triggerAlert("Pricing matrix loaded.")} className="hover:text-sky-primary transition-colors cursor-pointer">Platform Pricing</a></li>
            </ul>
          </div>

          {/* Column 3 (Syndicates) */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-white tracking-widest uppercase">Syndicates & Funds</h4>
            <ul className="space-y-1.5 text-xs text-text-muted font-medium">
              <li><a onClick={() => triggerAlert("Syndicate Lead certification required.")} className="hover:text-sky-primary transition-colors cursor-pointer">Syndicate Leads</a></li>
              <li><a onClick={() => triggerAlert("Active Angel pool contracts.")} className="hover:text-sky-primary transition-colors cursor-pointer">Angel Pool</a></li>
              <li><a onClick={() => triggerAlert("Investment portfolios log.")} className="hover:text-sky-primary transition-colors cursor-pointer">Investment Portfolios</a></li>
              <li><a onClick={() => triggerAlert("Standard contract terms.")} className="hover:text-sky-primary transition-colors cursor-pointer">Direct Backing Contracts</a></li>
            </ul>
          </div>

          {/* Column 4 (Learn) */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-white tracking-widest uppercase">Learn</h4>
            <ul className="space-y-1.5 text-xs text-text-muted font-medium">
              <li><a onClick={() => triggerAlert("Milestone guides loading...")} className="hover:text-sky-primary transition-colors cursor-pointer">Milestone Guide</a></li>
              <li><a onClick={() => triggerAlert("Compliance framework compliance.")} className="hover:text-sky-primary transition-colors cursor-pointer">Compliance Policy</a></li>
              <li><a onClick={() => triggerAlert("Loading platform blog posts...")} className="hover:text-sky-primary transition-colors cursor-pointer">Blog</a></li>
              <li><a onClick={() => triggerAlert("Reviewing student success cases...")} className="hover:text-sky-primary transition-colors cursor-pointer">Success Case Studies</a></li>
              <li><a onClick={() => triggerAlert("Security standard guide.")} className="hover:text-sky-primary transition-colors cursor-pointer">Security Handbook</a></li>
            </ul>
          </div>

          {/* Column 5 (Platform) */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-white tracking-widest uppercase">Platform</h4>
            <ul className="space-y-1.5 text-xs text-text-muted font-medium">
              <li><a onClick={() => triggerAlert("Web API keys generated on dashboard settings.")} className="hover:text-sky-primary transition-colors cursor-pointer">API & Dashboards</a></li>
              <li><a onClick={() => triggerAlert("Invest Catalog loading...")} className="hover:text-sky-primary transition-colors cursor-pointer">Invest Catalog</a></li>
              <li><a onClick={() => triggerAlert("University campaign directory.")} className="hover:text-sky-primary transition-colors cursor-pointer">Explore Directories</a></li>
              <li><a onClick={() => triggerAlert("Risk assessment calculator.")} className="hover:text-sky-primary transition-colors cursor-pointer">Risk Assessment Vault</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-left">
          <p className="text-[10px] text-text-muted max-w-2xl leading-relaxed">
            This platform is engineered to foster transparent financing channels for university student projects and micro-scale startup entities within Bangladesh. All funds are secured in compliance escrow models.
          </p>
          <span className="text-[10px] text-text-muted flex-shrink-0 font-medium">
            v1.1.0 · Secured Escrow Compliant
          </span>
        </div>
      </footer>

      {/* REGISTER/LOGIN MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-border-default max-w-lg w-full overflow-hidden text-left relative">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 text-text-charcoal hover:text-sky-primary transition-colors cursor-pointer p-1.5"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Login Modal Content */}
            {activeModal === 'login' && (
              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-medium text-obsidian-base font-display">Welcome back to FundBridge</h3>
                  <p className="text-xs text-text-muted mt-1">Select your workspace designation to authenticate.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-text-charcoal block mb-2">Registered Email Address</label>
                    <input 
                      type="email" 
                      placeholder="student@univ.edu.bd or investor@firm.com"
                      className="w-full bg-surface-cool/60 border border-border-default rounded-md px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-text-charcoal block mb-2">Account Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••••••"
                      className="w-full bg-surface-cool/60 border border-border-default rounded-md px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-primary"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setActiveModal(null);
                    triggerAlert("Login Successful! Redirecting to customized role dashboard...");
                  }}
                  className="w-full py-3 bg-obsidian-base hover:bg-obsidian-dark text-white text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Authenticate Session</span>
                </button>
              </div>
            )}

            {/* Register Modal Content */}
            {activeModal === 'register' && (
              <div className="p-8 space-y-5">
                <div>
                  <h3 className="text-2xl font-medium text-obsidian-base font-display">Create your Trust Profile</h3>
                  <p className="text-xs text-text-muted mt-1">Complete enrollment validation before starting negotiation lines.</p>
                </div>

                {/* Role Switcher */}
                <div className="grid grid-cols-2 gap-2 bg-surface-cool p-1 rounded-lg border border-border-default/80">
                  <button 
                    onClick={() => setRegisterRole('founder')}
                    className={`py-2 rounded text-xs font-medium transition-all cursor-pointer text-center ${
                      registerRole === 'founder' ? 'bg-white text-obsidian-base shadow-sm' : 'text-text-charcoal hover:bg-white/40'
                    }`}
                  >
                    🚀 Student Founder
                  </button>
                  <button 
                    onClick={() => setRegisterRole('investor')}
                    className={`py-2 rounded text-xs font-medium transition-all cursor-pointer text-center ${
                      registerRole === 'investor' ? 'bg-white text-obsidian-base shadow-sm' : 'text-text-charcoal hover:bg-white/40'
                    }`}
                  >
                    💼 Angel Backer
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-text-charcoal block mb-2">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Pritom Mondal"
                        className="w-full bg-surface-cool/60 border border-border-default rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-charcoal block mb-2">MFS Account Num (৳)</label>
                      <input 
                        type="text" 
                        placeholder="017XXXXXXXX"
                        className="w-full bg-surface-cool/60 border border-border-default rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-primary"
                      />
                    </div>
                  </div>

                  {registerRole === 'founder' ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-text-charcoal block mb-2">University / Campus</label>
                          <input 
                            type="text" 
                            placeholder="e.g. BRAC University"
                            className="w-full bg-surface-cool/60 border border-border-default rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-primary"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-text-charcoal block mb-2">National ID (NID)</label>
                          <input 
                            type="text" 
                            placeholder="13-digit NID number"
                            className="w-full bg-surface-cool/60 border border-border-default rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-primary"
                          />
                        </div>
                      </div>

                      {/* File uploads */}
                      <div className="border border-dashed border-border-default rounded-lg p-3 text-center bg-surface-cool/40">
                        <span className="text-[11px] font-medium text-text-charcoal block mb-1">Scanned University Student ID & NID</span>
                        <div className="flex gap-2 items-center justify-center">
                          <Upload className="w-4 h-4 text-text-muted" />
                          <span className="text-[10px] text-sky-primary font-medium hover:underline cursor-pointer">Browse validation PDF</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-medium text-text-charcoal block mb-2">Institution / Corporate Firm</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Vantage Ventures Dhaka"
                          className="w-full bg-surface-cool/60 border border-border-default rounded-md px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-text-charcoal block mb-2">Investor Designation</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Syndicate Lead / Alumni Angel Backer"
                          className="w-full bg-surface-cool/60 border border-border-default rounded-md px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-primary"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-xs font-medium text-text-charcoal block mb-2">Account Email Address</label>
                    <input 
                      type="email" 
                      placeholder="name@domain.com"
                      className="w-full bg-surface-cool/60 border border-border-default rounded-md px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-primary"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setActiveModal(null);
                    triggerAlert("Registration Data Buffered! Admin review pipeline initiated.");
                  }}
                  className="w-full py-3 bg-obsidian-base hover:bg-obsidian-dark text-white text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Submit Application</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
