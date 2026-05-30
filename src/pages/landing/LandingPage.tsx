import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Star,
  PlayCircle,
  CloudOff,
  Network,
  Layers,
  LineChart,
  ShoppingBasket,
  Activity,
  Heart,
  TimerOff,
  Calculator,
  Laptop,
  Users,
  Smartphone,
  ShieldAlert,
  ArrowUpRight,
  ChevronRight,
  WifiOff,
  Save,
  RefreshCw,
  Sparkles,
  UserCheck,
  Building,
  Check,
  X,
  Send,
  Linkedin,
  Twitter,
  Globe,
  Facebook,
  Instagram,
  Youtube,
  Database,
  LockKeyhole,
  CheckCircle,
  FileSpreadsheet,
  TrendingUp,
  Percent,
  Sliders,
  DollarSign,
  Briefcase,
  HelpCircle,
  Plus,
  Minus,
  ArrowRight,
  Store,
  Menu
} from 'lucide-react';
import { FaHubspot } from 'react-icons/fa';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamic Routing mapping based on URL pathname
  const pathname = location.pathname;
  const currentPage = pathname === '/features' ? 'features' 
                    : pathname === '/pricing' ? 'pricing' 
                    : pathname === '/contact' ? 'contact' 
                    : 'home';

  // State for pricing calculator & demo sandbox
  const [deviceCount, setDeviceCount] = useState(3);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [demoCart, setDemoCart] = useState<Array<{ id: string; name: string; price: number; qty: number }>>([]);
  const [demoSuccess, setDemoSuccess] = useState(false);

  // State for ROI Calculator
  const [monthlyRevenue, setMonthlyRevenue] = useState(500000); // 5 Lakhs default
  const [leakageRate, setLeakageRate] = useState(3); // 3% average leakage

  // State for FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // State for Contact Form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle dynamic routing
  const navigateTo = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
      setContactSubmitted(false);
    }, 3000);
  };

  // Demo Interactive POS handlers
  const addDemoItem = (item: { id: string; name: string; price: number }) => {
    setDemoSuccess(false);
    setDemoCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const getDemoTotal = () => {
    const grossTotal = demoCart.reduce((acc, item) => acc + item.price * item.qty, 0);
    const subtotal = grossTotal / 1.18; // Extracted base price (ex-GST)
    const tax = grossTotal - subtotal; // Extracted 18% GST amount
    return { subtotal, tax, total: grossTotal };
  };

  // Price calculations
  const calculatePrice = () => {
    const basePrice = 3000; 
    const pricePerDevice = 1000;
    const rawTotal = basePrice + (deviceCount - 1) * pricePerDevice;
    return billingPeriod === 'yearly' ? Math.round(rawTotal * 0.8) : rawTotal;
  };

  // ROI calculation
  const calculateSavedMoney = () => {
    const leakageAmt = monthlyRevenue * (leakageRate / 100);
    // Zoriva POS reduces leakage by 90%
    return Math.round(leakageAmt * 0.9);
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] font-sans antialiased selection:bg-[#dbe1ff] selection:text-[#0051d5]">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-[#faf8ff]/75 backdrop-blur-md border-b border-[#c8c5d0]/20 shadow-sm">
        <div className="flex justify-between  items-center w-full px-8 md:px-12 py-4 max-w-7xl mx-auto">
          <div 
            onClick={() => navigateTo('/')} 
            className="flex items-center cursor-pointer relative h-12 w-52"
          >
            <img 
              src="/zoriva-pos-logo.png" 
              alt="Zoriva POS" 
              className="h-20 w-auto object-contain absolute left-0 top-1/2 -translate-y-1/2"
            />
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            <button 
              onClick={() => navigateTo('/')}
              className={`font-bold text-sm tracking-tight transition-colors duration-200 ${currentPage === 'home' ? 'text-[#0051d5]' : 'text-[#47464f] hover:text-[#0051d5]'}`}
            >
              Home
            </button>
            <button 
              onClick={() => navigateTo('/features')}
              className={`font-bold text-sm tracking-tight transition-colors duration-200 ${currentPage === 'features' ? 'text-[#0051d5]' : 'text-[#47464f] hover:text-[#0051d5]'}`}
            >
              System Features
            </button>
            <button 
              onClick={() => navigateTo('/pricing')}
              className={`font-bold text-sm tracking-tight transition-colors duration-200 ${currentPage === 'pricing' ? 'text-[#0051d5]' : 'text-[#47464f] hover:text-[#0051d5]'}`}
            >
              Pricing
            </button>
            <button 
              onClick={() => navigateTo('/contact')}
              className={`font-bold text-sm tracking-tight transition-colors duration-200 ${currentPage === 'contact' ? 'text-[#0051d5]' : 'text-[#47464f] hover:text-[#0051d5]'}`}
            >
              Book Demo
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigateTo('/login')}
              className="hidden sm:inline-block px-5 py-2.5 font-bold text-sm bg-[#0051d5] text-white hover:bg-[#070235] transition-all rounded-xl active:scale-95 duration-150 shadow-md shadow-blue-500/20"
            >
              Login
            </button>
            
            {/* Hamburger Trigger for Mobile */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#070235] hover:text-[#0051d5] transition-colors focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Sub-bar Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#faf8ff] border-t border-[#c8c5d0]/20 py-4 px-8 space-y-3 shadow-inner animate-fade-in">
            <button 
              onClick={() => navigateTo('/')}
              className={`block w-full text-left font-bold text-sm py-2 transition-colors ${currentPage === 'home' ? 'text-[#0051d5]' : 'text-[#47464f]'}`}
            >
              Home
            </button>
            <button 
              onClick={() => navigateTo('/features')}
              className={`block w-full text-left font-bold text-sm py-2 transition-colors ${currentPage === 'features' ? 'text-[#0051d5]' : 'text-[#47464f]'}`}
            >
              Features
            </button>
            <button 
              onClick={() => navigateTo('/pricing')}
              className={`block w-full text-left font-bold text-sm py-2 transition-colors ${currentPage === 'pricing' ? 'text-[#0051d5]' : 'text-[#47464f]'}`}
            >
              Pricing
            </button>
            <button 
              onClick={() => navigateTo('/contact')}
              className={`block w-full text-left font-bold text-sm py-2 transition-colors ${currentPage === 'contact' ? 'text-[#0051d5]' : 'text-[#47464f]'}`}
            >
              Book Demo
            </button>
            <button 
              onClick={() => navigateTo('/login')}
              className="block w-full text-center font-bold text-sm py-2.5 bg-[#0051d5] text-white rounded-xl shadow-md"
            >
              Login
            </button>
          </div>
        )}
      </nav>

      {/* RENDER DYNAMIC PATHWAYS */}

      {/* ==================== HOME PAGE ==================== */}
      {currentPage === 'home' && (
        <>
          {/* Stunning Large Hero Section with Colored Background Glow */}
          <header className="relative pt-[160px] pb-24 px-8 md:px-12 max-w-7xl mx-auto overflow-hidden">
            {/* Glowing Accent Orbs */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-200/40 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-10 left-1/4 w-[450px] h-[450px] rounded-full bg-indigo-200/30 blur-[120px] pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              {/* Left Content */}
              <div className="lg:col-span-7 space-y-8 text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#dbe1ff] text-[#003ea8] text-xs font-bold uppercase tracking-wider shadow-sm">
                  <Star size={14} className="fill-[#003ea8] animate-pulse" />
                  #1 Enterprise Retail Platform in South Asia
                </div>
                
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#070235] font-jakarta tracking-tight leading-tight">
                  Automate Retail Finance & <span className="text-[#0051d5]">Point of Sale</span>
                </h1>
                
                <p className="text-lg md:text-xl text-[#47464f] leading-relaxed">
                  Eliminate manual leakages, reconcile stock in strict FIFO batches, and run millisecond cashier lanes. Unified digital intelligence designed to scale.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button 
                    onClick={() => navigateTo('/contact')}
                    className="px-8 py-4 bg-[#0051d5] text-white font-extrabold text-sm rounded-xl hover:bg-[#070235] transition-all shadow-lg shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-2"
                  >
                    Start 14-Day Free Trial
                    <ArrowRight size={18} />
                  </button>
                  <button 
                    onClick={() => navigateTo('/features')}
                    className="px-8 py-4 bg-white text-[#070235] border border-[#c8c5d0] font-extrabold text-sm rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Explore System Specs
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-[#c8c5d0]/30">
                  <div className="flex items-center gap-2.5">
                    <CloudOff className="text-[#0051d5] flex-shrink-0" size={22} />
                    <span className="text-sm font-bold text-[#070235]">Offline Active</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Network className="text-[#0051d5] flex-shrink-0" size={22} />
                    <span className="text-sm font-bold text-[#070235]">Multi-Store Sync</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Layers className="text-[#0051d5] flex-shrink-0" size={22} />
                    <span className="text-sm font-bold text-[#070235]">FIFO Costing</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Activity className="text-[#0051d5] flex-shrink-0" size={22} />
                    <span className="text-sm font-bold text-[#070235]">Live Reports</span>
                  </div>
                </div>
              </div>

              {/* Right Interactive Mockup Dashboard */}
              <div className="lg:col-span-5 relative">
                <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-4 rounded-3xl shadow-2xl relative aspect-square flex flex-col justify-between">
                  {/* Top System Bar */}
                  <div className="flex justify-between items-center pb-3 border-b border-[#c8c5d0]/20 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-extrabold tracking-widest text-[#47464f] uppercase">Register Simulator</span>
                    </div>
                    <span className="text-[10px] font-black text-[#0051d5] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">Zoriva Active</span>
                  </div>

                  <p className="text-xs text-[#47464f] font-semibold mb-2">Simulate barcode item entry:</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button 
                      onClick={() => addDemoItem({ id: '1', name: 'Fresh Milk 1L', price: 110 })}
                      className={`p-3 rounded-xl text-left text-xs font-bold transition-all relative overflow-hidden active:scale-95 duration-150 ${
                        demoCart.length === 0 
                          ? 'bg-[#0051d5] text-white border-2 border-[#0051d5] animate-pulse shadow-lg shadow-blue-500/40' 
                          : 'bg-[#faf8ff] border border-[#c8c5d0]/30 hover:border-[#0051d5] text-[#070235] hover:shadow-sm'
                      }`}
                    >
                      {demoCart.length === 0 ? '👉 Click to Add Milk (Rs. 110)' : '+ Add Milk (Rs. 110)'}
                    </button>
                    <button 
                      onClick={() => addDemoItem({ id: '2', name: 'Premium Tea Leaves', price: 245 })}
                      className={`p-3 rounded-xl text-left text-xs font-bold transition-all relative overflow-hidden active:scale-95 duration-150 ${
                        demoCart.length === 0 
                          ? 'bg-[#0051d5] text-white border-2 border-[#0051d5] animate-pulse shadow-lg shadow-blue-500/40' 
                          : 'bg-[#faf8ff] border border-[#c8c5d0]/30 hover:border-[#0051d5] text-[#070235] hover:shadow-sm'
                      }`}
                    >
                      {demoCart.length === 0 ? '👉 Click to Add Tea (Rs. 245)' : '+ Add Tea (Rs. 245)'}
                    </button>
                  </div>

                  {/* Virtual Receipt screen */}
                  <div className="bg-slate-900 rounded-2xl p-4 text-white font-mono text-xs space-y-3 min-h-[140px] flex flex-col justify-between shadow-inner">
                    <div>
                      <div className="flex justify-between text-slate-500 border-b border-slate-800 pb-2 mb-2">
                        <span>ITEM</span>
                        <span>QTY × PRICE</span>
                      </div>
                      <div className="space-y-1.5 max-h-[80px] overflow-y-auto custom-scrollbar pr-1">
                        {demoCart.length === 0 ? (
                          <div className="text-center py-4 font-sans flex flex-col items-center justify-center space-y-2">
                            <span className="animate-bounce text-[#0051d5] text-lg">👆</span>
                            <span className="font-extrabold text-[#c4c1fb]">Calculations Hidden</span>
                            <span className="text-[10px] text-slate-400 font-medium px-2 leading-relaxed">
                              Click either button above to simulate a barcode scan and instantly reveal the real-time 18% GST formula math!
                            </span>
                          </div>
                        ) : (
                          demoCart.map(item => (
                            <div key={item.id} className="flex justify-between">
                              <span className="text-slate-300 truncate max-w-[125px]">{item.name}</span>
                              <span className="text-slate-100">{item.qty} × Rs. {item.price}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {demoCart.length > 0 && (
                      <div className="border-t border-slate-800 pt-2 space-y-1">
                        <div className="flex justify-between text-slate-500">
                          <span>Tax (18% GST Included)</span>
                          <span>Rs. {getDemoTotal().tax.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-400 text-sm">
                          <span>GRAND TOTAL</span>
                          <span>Rs. {getDemoTotal().total.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Formula Visualizer Box */}
                  {demoCart.length > 0 ? (
                    <div className="p-3 bg-[#f2f3ff] rounded-xl border border-[#c8c5d0]/30 text-xs space-y-1.5 mt-3">
                      <div className="font-extrabold text-[#070235] flex items-center gap-1.5">
                        <Calculator size={13} className="text-[#0051d5]" />
                        POS Formula Math (18% GST Included)
                      </div>
                      <div className="font-mono text-[10px] text-[#47464f] bg-white p-2 rounded-lg border border-[#c8c5d0]/10 animate-fade-in">
                        <div>Gross Paid = Rs. {getDemoTotal().total.toFixed(1)}</div>
                        <div>Subtotal (Excl. Tax) = Gross / 1.18 = Rs. {getDemoTotal().subtotal.toFixed(1)}</div>
                        <div className="font-bold text-[#0051d5] border-t border-slate-100 pt-1 mt-1">
                          Extracted GST (18%) = Rs. {getDemoTotal().tax.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#f2f3ff]/40 rounded-xl border border-dashed border-[#c8c5d0]/60 text-xs text-center text-slate-400 py-3 mt-3">
                      🔒 Add items above to activate formula math visualizer
                    </div>
                  )}

                  {/* Clear cart trigger */}
                  {demoCart.length > 0 && (
                    <button 
                      onClick={() => setDemoCart([])}
                      className="text-center text-[10px] font-bold text-red-500 hover:underline mt-2 uppercase tracking-wider block mx-auto"
                    >
                      Clear simulated cart
                    </button>
                  )}
                  
                  
                </div>
              </div>
            </div>
          </header>

          {/* Trusted Industries segment */}
          <section className="bg-[#f2f3ff] py-16 border-y border-[#c8c5d0]/20">
            <div className="px-8 md:px-12 max-w-7xl mx-auto text-center">
              <p className="text-xs font-black text-[#47464f] mb-8 uppercase tracking-widest">Powering Operations Across South Asia</p>
              <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
                <div className="flex items-center gap-2 text-lg font-extrabold text-[#070235] grayscale hover:grayscale-0 transition-all cursor-default">
                  <ShoppingBasket size={22} className="text-[#0051d5]" /> Supermarkets
                </div>
                <div className="flex items-center gap-2 text-lg font-extrabold text-[#070235] grayscale hover:grayscale-0 transition-all cursor-default">
                  <Heart size={22} className="text-[#0051d5]" /> Pharmacies
                </div>
                <div className="flex items-center gap-2 text-lg font-extrabold text-[#070235] grayscale hover:grayscale-0 transition-all cursor-default">
                  <Layers size={22} className="text-[#0051d5]" /> Fashion Hubs
                </div>
                <div className="flex items-center gap-2 text-lg font-extrabold text-[#070235] grayscale hover:grayscale-0 transition-all cursor-default">
                  <Activity size={22} className="text-[#0051d5]" /> QSR Cafes
                </div>
                <div className="flex items-center gap-2 text-lg font-extrabold text-[#070235] grayscale hover:grayscale-0 transition-all cursor-default">
                  <Store size={22} className="text-[#0051d5]" /> Fine Dining
                </div>
              </div>
            </div>
          </section>

          {/* NEW SECTION: Rich Colored ROI Calculator - Solves "website looks simple" */}
          <section className="py-20 bg-gradient-to-br from-[#070235] via-[#171069] to-[#0051d5] text-white">
            <div className="max-w-7xl mx-auto px-8 md:px-12">
              <div className="grid lg:grid-cols-12 gap-12 items-center">
                {/* Left Text */}
                <div className="lg:col-span-6 space-y-6">
                  <span className="text-xs font-extrabold text-[#c4c1fb] uppercase tracking-widest bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full">Financial ROI Calculator</span>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-jakarta tracking-tight leading-tight">
                    Calculate How Much Revenue You Are Losing
                  </h2>
                  <p className="text-[#c4c1fb]/80 leading-relaxed text-sm md:text-base">
                    Unreconciled registers, cash drawers mismatches, expired inventory, and cashier typing errors cost average retail outlets between <strong>2% to 5%</strong> of gross revenues monthly. 
                    Zoriva POS eliminates 90% of these structural losses.
                  </p>
                  
                  <ul className="space-y-3.5 text-xs font-bold text-[#c4c1fb]/90">
                    <li className="flex items-center gap-2.5"><Check className="text-[#0051d5]" size={16} /> Block manual pricing overwrite hacks</li>
                    <li className="flex items-center gap-2.5"><Check className="text-[#0051d5]" size={16} /> Strict workstation heartbeats prevent empty drawer shifts</li>
                    <li className="flex items-center gap-2.5"><Check className="text-[#0051d5]" size={16} /> FIFO batch control stops perishable spoilage</li>
                  </ul>
                </div>

                {/* Right Interactive Calculator Widget */}
                <div className="lg:col-span-6 bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
                  <h3 className="text-xl font-bold tracking-tight text-white font-jakarta">Simulate Monthly Recovery</h3>
                  
                  {/* Revenue input */}
                  <div>
                    <label className="block text-xs font-bold text-[#c4c1fb] uppercase tracking-wider mb-2">Estimated Monthly Store Revenue (Rs.): <span className="text-lg font-black text-white ml-2">Rs. {monthlyRevenue.toLocaleString()}</span></label>
                    <input 
                      type="range" 
                      min="100000" 
                      max="2000000" 
                      step="50000"
                      value={monthlyRevenue}
                      onChange={(e) => setMonthlyRevenue(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <div className="flex justify-between text-[10px] text-[#c4c1fb]/70 mt-1 font-bold">
                      <span>Rs. 1 Lakh</span>
                      <span>Rs. 20 Lakhs</span>
                    </div>
                  </div>

                  {/* Leakage input */}
                  <div>
                    <label className="block text-xs font-bold text-[#c4c1fb] uppercase tracking-wider mb-2">Estimated Loss/Leakage Rate: <span className="text-lg font-black text-white ml-2">{leakageRate}%</span></label>
                    <input 
                      type="range" 
                      min="1" 
                      max="8" 
                      step="0.5"
                      value={leakageRate}
                      onChange={(e) => setLeakageRate(parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <div className="flex justify-between text-[10px] text-[#c4c1fb]/70 mt-1 font-bold">
                      <span>1% (Minor)</span>
                      <span>8% (High Loss)</span>
                    </div>
                  </div>

                  {/* Output Display Card */}
                  <div className="bg-white p-5 rounded-2xl text-center text-[#131b2e] shadow-xl">
                    <span className="text-[10px] font-bold text-[#47464f] uppercase tracking-widest block">Estimated Recovered Profits with Zoriva</span>
                    <span className="text-4xl font-extrabold text-[#0051d5] font-jakarta my-2 block">Rs. {calculateSavedMoney().toLocaleString()}</span>
                    <p className="text-[10px] text-[#47464f] font-semibold">Every month saved directly into your bottom-line margin.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* NEW SECTION 1: Advanced Core Capabilities Showcase */}
          <section className="py-24 bg-[#f2f3ff]/50 border-b border-[#c8c5d0]/20">
            <div className="max-w-7xl mx-auto px-8 md:px-12">
              <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
                <span className="text-xs font-bold text-[#0051d5] bg-[#dbe1ff] px-4 py-1.5 rounded-full uppercase tracking-widest">Why Zoriva Leads</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#070235] tracking-tight font-jakarta">Built For High-Velocity Retail</h2>
                <p className="text-[#47464f] text-sm md:text-base">
                  Traditional POS systems crash under load and leak cash. Zoriva is built on a resilient, high-speed modern database engine to power multi-location supermarkets and high-volume cafes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Capability 1 */}
                <div className="bg-white border border-[#c8c5d0]/20 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4 text-[#0051d5]">
                    <Sparkles size={20} />
                  </div>
                  <h4 className="font-bold text-[#070235] text-base mb-2 font-jakarta">Millisecond Scanning</h4>
                  <p className="text-xs text-[#47464f] leading-relaxed font-medium">
                    Auto-focus barcode processing registers item scans in under 45 milliseconds. Keep queue wait times at absolute zero.
                  </p>
                </div>

                {/* Capability 2 */}
                <div className="bg-white border border-[#c8c5d0]/20 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 text-[#0051d5]">
                    <WifiOff size={20} />
                  </div>
                  <h4 className="font-bold text-[#070235] text-base mb-2 font-jakarta">100% Offline Active</h4>
                  <p className="text-xs text-[#47464f] leading-relaxed font-medium">
                    Internet outages won't stop checkouts. Client terminals utilize local IndexedDB sync loops to save billing records offline safely.
                  </p>
                </div>

                {/* Capability 3 */}
                <div className="bg-white border border-[#c8c5d0]/20 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4 text-[#0051d5]">
                    <Layers size={20} />
                  </div>
                  <h4 className="font-bold text-[#070235] text-base mb-2 font-jakarta">FIFO Profit Sentinel</h4>
                  <p className="text-xs text-[#47464f] leading-relaxed font-medium">
                    Strict batch-level profit auditing ensures actual shelf items are deducted from their original incoming purchase prices first.
                  </p>
                </div>

                {/* Capability 4 */}
                <div className="bg-white border border-[#c8c5d0]/20 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 text-[#0051d5]">
                    <LockKeyhole size={20} />
                  </div>
                  <h4 className="font-bold text-[#070235] text-base mb-2 font-jakarta">Register Heartbeats</h4>
                  <p className="text-xs text-[#47464f] leading-relaxed font-medium">
                    Every active cashier terminal session is cryptographically bound to physical hardware to prevent fraudulent manual overrides.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* NEW SECTION 2: Legacy vs Zoriva Matchup Table with Premium Dark Gradient */}
          <section className="py-24 bg-gradient-to-br from-[#070235] via-[#0d094a] to-[#160d69] text-white border-b border-[#1e1b4b]">
            <div className="max-w-6xl mx-auto px-8 md:px-12">
              <div className="text-center mb-16 space-y-3">
                <span className="text-xs font-bold text-[#38bdf8] bg-sky-500/10 border border-sky-500/20 px-4 py-1.5 rounded-full uppercase tracking-widest">Platform Matchup</span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight font-jakarta">Why Traditional POS Systems Fail</h2>
                <p className="text-slate-300 text-sm">
                  A side-by-side technical comparison showing how Zoriva POS protects your daily margins.
                </p>
              </div>

              {/* Responsive Glassmorphic Table Container */}
              <div className="overflow-x-auto rounded-3xl border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-6 text-xs font-black uppercase text-slate-200 tracking-wider w-[35%]">Technical Feature Scope</th>
                      <th className="p-6 text-xs font-black uppercase text-red-400 tracking-wider bg-red-500/5 w-[32.5%]">Traditional Legacy Systems</th>
                      <th className="p-6 text-xs font-black uppercase text-emerald-400 tracking-wider bg-emerald-500/5 w-[32.5%]">Zoriva POS Solution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs md:text-sm font-semibold text-slate-300">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-bold text-white leading-relaxed">
                        FIFO Margin Precision
                      </td>
                      <td className="p-6 text-red-200/80 bg-red-500/5 font-medium border-l border-white/5">
                        Uses general "average cost" causing inaccurate profit logs during local price fluctuations.
                      </td>
                      <td className="p-6 text-emerald-300 bg-emerald-500/5 font-bold border-l border-white/5">
                        ✓ Exact FIFO batch tracks, preserving exact shelf margins.
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-bold text-white leading-relaxed">
                        Internet Connection Drops
                      </td>
                      <td className="p-6 text-red-200/80 bg-red-500/5 font-medium border-l border-white/5">
                        Terminal freezes completely or blocks invoice logging when connectivity drops.
                      </td>
                      <td className="p-6 text-emerald-300 bg-emerald-500/5 font-bold border-l border-white/5">
                        ✓ Continuous local checkout with automatic background cloud sync.
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-bold text-white leading-relaxed">
                        Hardware Security & Mismatches
                      </td>
                      <td className="p-6 text-red-200/80 bg-red-500/5 font-medium border-l border-white/5">
                        Cashiers can activate untracked registers from any web interface, leading to manual loss.
                      </td>
                      <td className="p-6 text-emerald-300 bg-emerald-500/5 font-bold border-l border-white/5">
                        ✓ Hardware secure finger hashes prevent unmapped lanes.
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-bold text-white leading-relaxed">
                        GST Calculation & Audits
                      </td>
                      <td className="p-6 text-red-200/80 bg-red-500/5 font-medium border-l border-white/5">
                        Manual calculators or delayed ledger postings create tax reconciliation gaps.
                      </td>
                      <td className="p-6 text-emerald-300 bg-emerald-500/5 font-bold border-l border-white/5">
                        ✓ 18% inclusive GST formula math calculated instantly per shift.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Interactive FAQ Section - Resolves "simple looking" / adds details */}
          <section className="py-20 bg-white border-b border-[#c8c5d0]/30" id="faq">
            <div className="max-w-4xl mx-auto px-8">
              <div className="text-center mb-16 space-y-2">
                <span className="text-xs font-bold text-[#0051d5] bg-[#dbe1ff] px-3.5 py-1 rounded-full uppercase tracking-wider">Help Desk</span>
                <h2 className="text-3xl font-extrabold text-[#070235] font-jakarta mt-3">Frequently Asked Questions</h2>
                <p className="text-[#47464f] text-sm">Everything you need to know about setting up your retail terminals.</p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    q: "How does the FIFO Batch Costing engine track inventory?",
                    a: "Unlike typical systems that use a single static average cost, Zoriva POS groups inventory inflows into specific batches with unique purchase costs. When cashier sales are rung up, the POS engine automatically deducts stock layers from the oldest active batch first. This ensures absolute precision in ledger margins."
                  },
                  {
                    q: "What hardware workstation profiles does Zoriva bind to?",
                    a: "To prevent unauthorized register activations and cash mismatches, our system maps every cashier lane session directly to physical workstations via secure browser fingerprint hashes. Active heartbeat signals confirm mapped devices remain verified."
                  },
                  {
                    q: "Can we sync offline transactions when the internet drops?",
                    a: "Absolutely. If network signals drop, Zoriva's front-end operates locally on IndexedDB cache profiles, enabling scanning and checkout transactions. When connectivity returns, client registers batch-upload pending sales idempotently to prevent duplicate billing."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="border border-[#c8c5d0]/30 rounded-2xl overflow-hidden bg-[#faf8ff] transition-all">
                    <button 
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full px-6 py-4 text-left font-bold text-[#070235] flex justify-between items-center hover:bg-slate-100/50 transition-all text-sm md:text-base"
                    >
                      <span>{item.q}</span>
                      {openFaq === idx ? <Minus size={18} className="text-[#0051d5]" /> : <Plus size={18} className="text-[#0051d5]" />}
                    </button>
                    {openFaq === idx && (
                      <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-[#47464f] leading-relaxed border-t border-[#c8c5d0]/10 bg-white">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ==================== FEATURES PAGE ==================== */}
      {currentPage === 'features' && (
        <section className="py-32 px-8 md:px-12 max-w-7xl mx-auto animate-fade-in">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-3">
            <span className="text-xs font-bold text-[#0051d5] bg-[#dbe1ff] px-4 py-1.5 rounded-full uppercase tracking-widest">System Workspace Specs</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#070235] tracking-tight font-jakarta">Unified Retail Portals & Roles</h2>
            <p className="text-[#47464f] text-sm md:text-base">
              A comprehensive view of the 4 dedicated operational portals integrated natively into Zoriva POS.
            </p>
          </div>

          {/* Grids with Portal Details and hover-based slide/glowing animations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* 1. Super Admin SaaS Portal */}
            <div className="bg-gradient-to-br from-[#0a0752] via-[#120a66] to-[#1d108f] p-8 rounded-3xl border border-white/10 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(99,102,241,0.25)] hover:border-[#6366f1]/60 transition-all duration-500 group flex flex-col justify-between text-white">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    <Building size={28} className="text-[#a5b4fc]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#a5b4fc] bg-[#6366f1]/20 px-3 py-1 rounded-full border border-[#6366f1]/30 shadow-sm">Super Admin Scope</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3 font-jakarta group-hover:text-[#a5b4fc] transition-colors">SaaS Tenant & Global Settings</h3>
                  <p className="text-xs md:text-sm text-indigo-100/80 leading-relaxed">
                    Designed for SaaS controllers and central operators to establish store boundaries and oversee high-level compliance.
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#a5b4fc] block">Core Workspace Modules:</span>
                  <ul className="space-y-2 text-xs font-semibold text-indigo-100/90">
                    <li className="flex items-center gap-2"><Check className="text-emerald-400" size={14} /> Create, suspend, and edit tenant retail stores</li>
                    <li className="flex items-center gap-2"><Check className="text-emerald-400" size={14} /> Map system databases and audit logs centrally</li>
                    <li className="flex items-center gap-2"><Check className="text-emerald-400" size={14} /> Global SaaS dashboards and active licensing tiers</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 text-xs font-black text-[#a5b4fc] flex items-center gap-1 group-hover:gap-2 group-hover:text-white transition-all cursor-pointer">
                Access Panel Config <ChevronRight size={14} />
              </div>
            </div>

            {/* 2. Store Admin Operations Panel */}
            <div className="bg-gradient-to-br from-[#082f49] via-[#0369a1] to-[#0284c7] p-8 rounded-3xl border border-white/10 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(56,189,248,0.25)] hover:border-[#38bdf8]/60 transition-all duration-500 group flex flex-col justify-between text-white">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    <Store size={28} className="text-[#38bdf8]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#38bdf8] bg-sky-500/20 px-3 py-1 rounded-full border border-sky-500/30 shadow-sm">Store Admin Scope</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3 font-jakarta group-hover:text-[#38bdf8] transition-colors">Catalog, Batches & Staff Management</h3>
                  <p className="text-xs md:text-sm text-sky-100/80 leading-relaxed">
                    The operations cockpit for local store owners to manage product lifecycles, configure batches, and allocate staff resources.
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#38bdf8] block">Core Workspace Modules:</span>
                  <ul className="space-y-2 text-xs font-semibold text-sky-100/90">
                    <li className="flex items-center gap-2"><Check className="text-emerald-400" size={14} /> Create products, initial stocks, and low stock thresholds</li>
                    <li className="flex items-center gap-2"><Check className="text-emerald-400" size={14} /> FIFO Purchase Batches (purchase price, selling price, GST, expiry)</li>
                    <li className="flex items-center gap-2"><Check className="text-emerald-400" size={14} /> Bind hardware workstations and monitor real-time shifts</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 text-xs font-black text-[#38bdf8] flex items-center gap-1 group-hover:gap-2 group-hover:text-white transition-all cursor-pointer">
                Access Panel Config <ChevronRight size={14} />
              </div>
            </div>

            {/* 3. Cashier Checkout Desk (POS Terminal) */}
            <div className="bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#059669] p-8 rounded-3xl border border-white/10 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(52,211,153,0.25)] hover:border-[#34d399]/60 transition-all duration-500 group flex flex-col justify-between text-white">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    <Laptop size={28} className="text-[#34d399]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#34d399] bg-[#34d399]/20 px-3 py-1 rounded-full border border-[#34d399]/30 shadow-sm">Terminal Scope</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3 font-jakarta group-hover:text-[#34d399] transition-colors">Fast Lanes & Invoicing</h3>
                  <p className="text-xs md:text-sm text-emerald-100/80 leading-relaxed">
                    Designed specifically for high-speed cash-desk operations, ensuring swift checkout lanes and offline transaction durability.
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#34d399] block">Core Workspace Modules:</span>
                  <ul className="space-y-2 text-xs font-semibold text-emerald-100/90">
                    <li className="flex items-center gap-2"><Check className="text-emerald-300" size={14} /> Rapid barcode autofocus, weighing scales, and quick search</li>
                    <li className="flex items-center gap-2"><Check className="text-emerald-300" size={14} /> Multi-tender options (cash, credit, UPI, digital wallet)</li>
                    <li className="flex items-center gap-2"><Check className="text-emerald-300" size={14} /> Automated printer receipt templates with GST breakdowns</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 text-xs font-black text-[#34d399] flex items-center gap-1 group-hover:gap-2 group-hover:text-white transition-all cursor-pointer">
                Access Panel Config <ChevronRight size={14} />
              </div>
            </div>

            {/* 4. Accountant Compliance Ledger */}
            <div className="bg-gradient-to-br from-[#4c1d95] via-[#6d28d9] to-[#7c3aed] p-8 rounded-3xl border border-white/10 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(167,139,250,0.25)] hover:border-[#a78bfa]/60 transition-all duration-500 group flex flex-col justify-between text-white">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    <FileSpreadsheet size={28} className="text-[#a78bfa]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#a78bfa] bg-[#a78bfa]/20 px-3 py-1 rounded-full border border-[#a78bfa]/30 shadow-sm">Ledger Scope</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3 font-jakarta group-hover:text-[#a78bfa] transition-colors">Audits, Margin Reports & Taxes</h3>
                  <p className="text-xs md:text-sm text-purple-100/80 leading-relaxed">
                    Designed for compliance experts to review daily ledger entries, reconcile cashier discrepancies, and track tax accounts.
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#a78bfa] block">Core Workspace Modules:</span>
                  <ul className="space-y-2 text-xs font-semibold text-purple-100/90">
                    <li className="flex items-center gap-2"><Check className="text-emerald-400" size={14} /> Real-time sales logging and daily end-of-shift audits</li>
                    <li className="flex items-center gap-2"><Check className="text-emerald-400" size={14} /> Exact gross margin evaluations via FIFO batch costing logs</li>
                    <li className="flex items-center gap-2"><Check className="text-emerald-400" size={14} /> Tax liability reports (18% GST backing math) and Excel export</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 text-xs font-black text-[#a78bfa] flex items-center gap-1 group-hover:gap-2 group-hover:text-white transition-all cursor-pointer">
                Access Panel Config <ChevronRight size={14} />
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ==================== PRICING PAGE ==================== */}
      {currentPage === 'pricing' && (
        <section className="py-32 px-8 md:px-12 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-2 animate-fade-in">
            <span className="text-xs font-bold text-[#0051d5] bg-[#dbe1ff] px-3.5 py-1 rounded-full uppercase tracking-widest">SaaS Licenses</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#070235] tracking-tight font-jakarta">Scalable Plans</h2>
            <p className="text-[#47464f]">Transparent pricing for every stage of your retail journey.</p>
          </div>

          <div className="bg-[#f2f3ff] border border-[#c8c5d0]/30 rounded-3xl p-8 max-w-4xl mx-auto shadow-inner mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#070235] mb-2">
                    Active Registers: <span className="text-[#0051d5] font-black">{deviceCount}</span>
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={deviceCount}
                    onChange={(e) => setDeviceCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0051d5]"
                  />
                  <div className="flex justify-between text-xs text-[#47464f] mt-1 font-bold">
                    <span>1 Register</span>
                    <span>10 Registers</span>
                  </div>
                </div>

                <div>
                  <span className="block text-sm font-bold text-[#070235] mb-2 font-jakarta">Billing Frequency</span>
                  <div className="flex gap-2 bg-white p-1 rounded-xl border border-[#c8c5d0]/20">
                    <button 
                      onClick={() => setBillingPeriod('monthly')}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${billingPeriod === 'monthly' ? 'bg-[#070235] text-white' : 'text-[#47464f]'}`}
                    >
                      Monthly
                    </button>
                    <button 
                      onClick={() => setBillingPeriod('yearly')}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${billingPeriod === 'yearly' ? 'bg-[#070235] text-white' : 'text-[#47464f]'}`}
                    >
                      Yearly (-20%)
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#c8c5d0]/20 text-center shadow-md animate-scale-up">
                <span className="text-xs font-bold text-[#47464f] uppercase tracking-widest">CALCULATED SAAS FEE</span>
                <div className="my-3">
                  <span className="text-4xl font-extrabold text-[#070235]">Rs. {calculatePrice()}</span>
                  <span className="text-xs text-slate-500 font-bold"> / month</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-6 font-medium">Auto-scales as registers bind. Scale workstation licenses down anytime.</p>
                <button 
                  onClick={() => navigateTo('/contact')}
                  className="w-full bg-[#0051d5] hover:bg-[#070235] text-white font-bold py-3 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider"
                >
                  Activate Workplace Licenses
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* Starter */}
            <div className="bg-white/70 backdrop-blur-md p-8 rounded-3xl border border-[#c8c5d0]/30 hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#070235] uppercase mb-1">Starter</h4>
                <div className="my-4">
                  <span className="text-4xl font-extrabold text-[#070235]">Rs. 3,999</span>
                  <span className="text-xs text-[#47464f] font-semibold"> / mo</span>
                </div>
                <ul className="space-y-3.5 mb-8 text-xs font-bold text-slate-700">
                  <li className="flex gap-2 items-center"><Check className="text-emerald-600" size={16} /> 1 Store Location</li>
                  <li className="flex gap-2 items-center"><Check className="text-emerald-600" size={16} /> Up to 3 Workstations</li>
                  <li className="flex gap-2 items-center"><Check className="text-emerald-600" size={16} /> Basic FIFO Inventory</li>
                </ul>
              </div>
              <button 
                onClick={() => navigateTo('/contact')}
                className="w-full py-3 border border-[#070235] text-[#070235] font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#070235]/5 transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Business */}
            <div className="bg-[#1e1b4b] text-white p-8 rounded-3xl border-2 border-[#0051d5] flex flex-col justify-between relative shadow-2xl scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0051d5] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">MOST POPULAR</div>
              <div>
                <h4 className="text-sm font-bold text-[#c4c1fb] uppercase mb-1">Business</h4>
                <div className="my-4">
                  <span className="text-4xl font-extrabold text-white">Rs. 9,999</span>
                  <span className="text-xs text-[#c4c1fb] font-semibold"> / mo</span>
                </div>
                <ul className="space-y-3.5 mb-8 text-xs font-bold text-[#c4c1fb]">
                  <li className="flex gap-2 items-center"><Check className="text-[#0051d5]" size={16} /> 5 Store Locations</li>
                  <li className="flex gap-2 items-center"><Check className="text-[#0051d5]" size={16} /> Unlimited Bound Registers</li>
                  <li className="flex gap-2 items-center"><Check className="text-[#0051d5]" size={16} /> Strict FIFO Costing Control</li>
                  <li className="flex gap-2 items-center"><Check className="text-[#0051d5]" size={16} /> Accountant Ledger Export</li>
                </ul>
              </div>
              <button 
                onClick={() => navigateTo('/contact')}
                className="w-full py-3 bg-[#0051d5] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-md shadow-blue-500/20"
              >
                Start Free Trial
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-white/70 backdrop-blur-md p-8 rounded-3xl border border-[#c8c5d0]/30 hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#070235] uppercase mb-1">Enterprise</h4>
                <div className="my-4">
                  <span className="text-4xl font-extrabold text-[#070235]">Custom</span>
                </div>
                <p className="text-xs text-[#47464f] leading-relaxed mb-8">
                  Dedicated cloud database setups, proprietary API access mappings, and a 24/7 technical shift manager.
                </p>
              </div>
              <button 
                onClick={() => navigateTo('/contact')}
                className="w-full py-3 border border-[#070235] text-[#070235] font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#070235]/5 transition-all"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ==================== BOOK A DEMO VIEW ==================== */}
      {currentPage === 'contact' && (
        <section className="py-32 px-8 md:px-12 max-w-4xl mx-auto">
          <div className="bg-white border border-[#c8c5d0]/30 p-8 md:p-12 rounded-3xl shadow-xl animate-fade-in">
            <div className="text-center mb-10">
              <span className="text-xs font-bold text-[#0051d5] bg-[#dbe1ff] px-3.5 py-1 rounded-full uppercase tracking-wider">Inquiry</span>
              <h2 className="text-3xl font-extrabold text-[#070235] font-jakarta mt-3">Book Your Live System Demo</h2>
              <p className="text-[#47464f] text-sm mt-2 font-medium">Connect with our retail system integrators today.</p>
            </div>

            {contactSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center text-emerald-700 animate-in fade-in zoom-in duration-300">
                <Check className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                <h4 className="font-bold text-lg">Demo Request Received!</h4>
                <p className="text-sm mt-1">Our retail consultant will connect with you via email within 24 business hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#47464f] uppercase tracking-wider mb-2 ml-1">Full Name</label>
                    <input 
                      type="text" 
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-[#faf8ff] border border-[#c8c5d0]/30 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#0051d5]/10 focus:border-[#0051d5] outline-none transition-all font-medium text-sm"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#47464f] uppercase tracking-wider mb-2 ml-1">Contact Email</label>
                    <input 
                      type="email" 
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-[#faf8ff] border border-[#c8c5d0]/30 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#0051d5]/10 focus:border-[#0051d5] outline-none transition-all font-medium text-sm"
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#47464f] uppercase tracking-wider mb-2 ml-1">Tell Us About Your Store</label>
                  <textarea 
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full bg-[#faf8ff] border border-[#c8c5d0]/30 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#0051d5]/10 focus:border-[#0051d5] outline-none transition-all font-medium text-sm resize-none"
                    placeholder="Supermarket branches, QSR count, expected register lanes..."
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#0051d5] hover:bg-[#070235] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest text-xs"
                >
                  Claim Demo Session
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* Shared Footer */}
      <footer className="bg-[#070235] py-8 border-t border-[#1e1b4b] text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 px-8 md:px-12 max-w-7xl mx-auto">
          {/* Brand & Socials Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <img 
                src="/zoriva-pos-logo.png" 
                alt="Zoriva POS" 
                className="h-10 w-auto object-contain brightness-0 invert"
              />
              <span className="text-xl font-bold font-jakarta text-white tracking-tight">ZORIVA POS</span>
            </div>
            <p className="text-xs text-[#c4c1fb]/70 leading-relaxed font-medium">
              Zoriva POS — Pakistan's #1 online point of sale and enterprise retail management software, empowering businesses nationwide to operate digitally with absolute compliance and excellence.
            </p>
            {/* Social Triggers */}
            <div className="flex items-center gap-3 pt-2">
              <a 
                href="https://wa.me/923128289654" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Facebook" 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#0051d5] hover:text-white transition-all shadow-sm group"
              >
                <Facebook size={16} className="group-hover:scale-110 transition-transform" />
              </a>
              <a 
                href="https://www.instagram.com/erp_schoolfms/" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Instagram" 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#0051d5] hover:text-white transition-all shadow-sm group"
              >
                <Instagram size={16} className="group-hover:scale-110 transition-transform" />
              </a>
              <a 
                href="https://wa.me/923128289654" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Youtube" 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#0051d5] hover:text-white transition-all shadow-sm group"
              >
                <Youtube size={16} className="group-hover:scale-110 transition-transform" />
              </a>
              <a 
                href="https://wa.me/923128289654" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Twitter" 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#0051d5] hover:text-white transition-all shadow-sm group"
              >
                <Twitter size={16} className="group-hover:scale-110 transition-transform" />
              </a>
              <a 
                href="https://wa.me/923128289654" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Linkedin" 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#0051d5] hover:text-white transition-all shadow-sm group"
              >
                <Linkedin size={16} className="group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="font-bold text-sm text-white mb-6 uppercase tracking-wider">Information</h4>
            <ul className="space-y-3.5 text-xs font-semibold text-[#c4c1fb]/80">
              <li><button onClick={() => navigateTo('/features')} className="hover:text-white transition-colors">Workspace Features</button></li>
              <li><button onClick={() => navigateTo('/pricing')} className="hover:text-white transition-colors">Plans & Pricing</button></li>
              <li><button onClick={() => navigateTo('/features')} className="hover:text-white transition-colors">Catalog & Batches</button></li>
              <li><button onClick={() => navigateTo('/features')} className="hover:text-white transition-colors">Terminal Lanes</button></li>
              <li><button onClick={() => navigateTo('/contact')} className="hover:text-white transition-colors">Inquiry Touchpoint</button></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="font-bold text-sm text-white mb-6 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3.5 text-xs font-semibold text-[#c4c1fb]/80">
              <li><button onClick={() => navigateTo('/contact')} className="hover:text-white transition-colors">Terms of Service</button></li>
              <li><button onClick={() => navigateTo('/contact')} className="hover:text-white transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => navigateTo('/contact')} className="hover:text-white transition-colors">SaaS Services</button></li>
            </ul>
            <div className="mt-8 space-y-3">
              <div className="inline-flex items-center gap-2 bg-emerald-950/80 px-3.5 py-1.5 rounded-full border border-emerald-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-400">Systems Operational</span>
              </div>
            </div>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-6">
            <h4 className="font-bold text-sm text-white mb-6 uppercase tracking-wider">Contacts</h4>
            
            {/* Global Office (UAE) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <img 
                  className="h-3 w-auto rounded-sm border border-white/10" 
                  alt="UAE" 
                  src="https://flagcdn.com/w80/ae.png"
                />
                <span className="text-[10px] font-black tracking-widest text-[#c4c1fb]/60 uppercase">GLOBAL OFFICE</span>
              </div>
              <p className="text-xs text-[#c4c1fb]/80 leading-relaxed font-medium">
                Building No#08, Al Qusaidat,<br />Ras Al Khaimah, UAE
              </p>
              <div className="pt-0.5">
                <a href="tel:+971509068578" className="text-xs font-bold text-[#0051d5] hover:underline hover:text-white transition-colors">+971 509 068578</a>
              </div>
            </div>

            {/* Regional Office (Pakistan) */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <img 
                  className="h-3 w-auto rounded-sm border border-white/10" 
                  alt="Pakistan" 
                  src="https://flagcdn.com/w80/pk.png"
                />
                <span className="text-[10px] font-black tracking-widest text-[#c4c1fb]/60 uppercase">REGIONAL OFFICE</span>
              </div>
              <p className="text-xs text-[#c4c1fb]/80 leading-relaxed font-medium">
                Office#22, 2nd Floor, Big City Tower,<br />Lahore, Pakistan
              </p>
              <div className="pt-0.5">
                <a href="tel:+923128289654" className="text-xs font-bold text-[#0051d5] hover:underline hover:text-white transition-colors">+92 312 8289654</a>
              </div>
            </div>

            {/* Support Email */}
            <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-xs font-semibold">
              <span className="text-[#c4c1fb]/60">Email:</span>
              <a href="mailto:support@zorivapos.com" className="text-[#0051d5] hover:underline hover:text-white transition-colors">support@zorivapos.com</a>
            </div>
          </div>
        </div>
        
        {/* Bottom copyright block */}
        <div className="border-t border-white/5 pt-4 -mb-2 text-center">
          <p className="text-[11px] text-[#c4c1fb]/50 font-bold uppercase tracking-widest">
            Copyright © 2026 ZORIVA POS INC. - ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
