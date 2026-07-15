import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {

    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const [currentView, setCurrentView] = useState('home');
  const [openFaq, setOpenFaq] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const featuresRef = useRef(null);
  const skillsRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState({ target: null });

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const scrollToSection = (section) => {
    setIsMobileMenuOpen(false);
    if (currentView !== 'home') {
      setCurrentView('home');
      setShouldScroll({ target: section });
    } else {
      const ref = section === 'features' ? featuresRef : skillsRef;
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (currentView === 'home' && shouldScroll.target) {
      const ref = shouldScroll.target === 'features' ? featuresRef : skillsRef;
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      setShouldScroll({ target: null });
    }
  }, [currentView, shouldScroll]);

  const faqData = [
    {
      q: "Is SkillBarter completely free?",
      a: "Yes, SkillBarter is 100% free. No hidden costs, no subscriptions. Just connect, learn, and teach."
    },
    {
      q: "How do I connect with someone?",
      a: "Browse users by skills, send a barter proposal, and once accepted, you can start chatting and exchanging skills directly."
    },
    {
      q: "Can I both teach and learn?",
      a: "Absolutely! You can offer skills you are confident in and learn skills you are interested in at the same time."
    },
    {
      q: "Do I need to be an expert to teach?",
      a: "Nope. As long as you have a decent understanding of a skill, you are welcome to teach others who are just starting out."
    },
    {
      q: "Is there any limit to how many skills I can add?",
      a: "No, you can add as many skills to your profile as you want — both for learning and offering."
    }
  ];


  const popularSkills = [
    { name: "Tutoring & Academics", icon: "📚", colorClass: "bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100/70" },
    { name: "Music & Instruments", icon: "🎵", colorClass: "bg-blue-50/60 border-blue-200/80 hover:bg-blue-100/70" },
    { name: "Fitness & Yoga", icon: "💪", colorClass: "bg-rose-50/60 border-rose-200/80 hover:bg-rose-100/70" },
    { name: "Art & Crafts", icon: "🎨", colorClass: "bg-purple-50/60 border-purple-200/80 hover:bg-purple-100/70" },
    { name: "Tech & Programming", icon: "💻", colorClass: "bg-indigo-50/60 border-indigo-200/80 hover:bg-indigo-100/70" },
    { name: "Cooking & Baking", icon: "🍳", colorClass: "bg-amber-50/60 border-amber-200/80 hover:bg-amber-100/70" },
    { name: "Language Learning", icon: "🗣️", colorClass: "bg-teal-50/60 border-teal-200/80 hover:bg-teal-100/70" },
    { name: "Photography & Video", icon: "📸", colorClass: "bg-cyan-50/60 border-cyan-200/80 hover:bg-cyan-100/70" },
    { name: "Beauty & Grooming", icon: "💇", colorClass: "bg-fuchsia-50/60 border-fuchsia-200/80 hover:bg-fuchsia-100/70" },
    { name: "Other Skills", icon: "✨", colorClass: "bg-slate-100/80 border-slate-300 hover:bg-slate-200/60" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased relative flex flex-col overflow-x-hidden selection:bg-blue-200 selection:text-blue-900">


      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>

      {/* BACKGROUND  GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-blue-200/50 via-blue-50/20 to-transparent blur-3xl pointer-events-none" />

      {/* 1.  NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-blue-100 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4 flex justify-between items-center w-full">

          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); setIsMobileMenuOpen(false); }}
          >
            <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-md shadow-blue-600/10">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-600">
              Skill<span className="text-slate-900">Barter</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <button onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`transition ${currentView === 'home' ? 'text-blue-600' : 'hover:text-blue-600'}`}>Home</button>
            <button onClick={() => scrollToSection('features')} className="hover:text-blue-600 transition focus:outline-none">Features</button>
            <button onClick={() => setCurrentView('about')} className={`transition ${currentView === 'about' ? 'text-blue-600' : 'hover:text-blue-600'}`}>About</button>
            <button onClick={() => setCurrentView('faq')} className={`transition ${currentView === 'faq' ? 'text-blue-600' : 'hover:text-blue-600'}`}>FAQ</button>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button onClick={() => navigate('/login')} className="border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-bold px-5 py-2.5 rounded-xl transition active:scale-98">
              Log In
            </button>
            <button onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-blue-600/10 active:scale-98">
              Sign Up
            </button>
          </div>

          {/*  Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="text-slate-700 hover:text-blue-600 focus:outline-none p-2"
            >
              <svg className="h-6 w-6 fill-none stroke-current" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/*  Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-blue-50 bg-white px-6 py-4 space-y-3 shadow-inner flex flex-col">
            <button onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); setIsMobileMenuOpen(false); }} className={`text-left font-semibold text-sm py-2 ${currentView === 'home' ? 'text-blue-600' : 'text-slate-600'}`}>Home</button>
            <button onClick={() => scrollToSection('features')} className="text-left font-semibold text-sm py-2 text-slate-600">Features</button>
            <button onClick={() => { setCurrentView('about'); setIsMobileMenuOpen(false); }} className={`text-left font-semibold text-sm py-2 ${currentView === 'about' ? 'text-blue-600' : 'text-slate-600'}`}>About</button>
            <button onClick={() => { setCurrentView('faq'); setIsMobileMenuOpen(false); }} className={`text-left font-semibold text-sm py-2 ${currentView === 'faq' ? 'text-blue-600' : 'text-slate-600'}`}>FAQ</button>
            <hr className="border-slate-100 my-2" />
            <div className="flex space-x-3 pt-2">
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }} className="flex-1 text-center border border-blue-600 text-blue-600 font-bold py-2 rounded-xl text-sm">Log In</button>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/register'); }} className="flex-1 text-center bg-blue-600 text-white font-bold py-2 rounded-xl text-sm">Sign Up</button>
            </div>
          </div>
        )}
      </header>

      {/* ==================== VIEW 1: HOME PAGE ==================== */}
      {currentView === 'home' && (
        <div className="flex-1 w-full flex flex-col">

          {/* Main section*/}
          <section className="relative max-w-5xl mx-auto px-6 pt-20 pb-6 text-center space-y-6 w-full animate-fade-in-up">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] max-w-4xl mx-auto">
              <span className="text-blue-600">Learn Any Skill.</span><br />
              <span className="text-slate-900">Teach What You Know.</span>
            </h1>
            <p className="text-slate-600 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed font-medium text-center">
              A peer-to-peer network enabling professionals and enthusiasts to trade live expertise directly. Create a profile, find perfect matches, and grow together — completely free.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <button onClick={() => navigate('/register')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white font-bold px-10 py-4 rounded-xl shadow-lg shadow-blue-600/20 transition transform duration-200">
                Create Your Profile
              </button>
              <button
  onClick={() => scrollToSection('skills')}
  className="w-full sm:w-auto bg-white border-2 border-blue-600 hover:bg-blue-50 hover:border-blue-700 hover:scale-105 text-blue-600 font-bold px-10 py-4 rounded-xl shadow-sm transition transform duration-200"
>
  Browse Skills
</button>
            </div>
          </section>

        {/* THREE STEPS SECTION  */}
<section className="py-16">
  <div className="text-center mb-12">
    <h2 className="text-3xl font-bold text-blue-600">How it works?</h2>

  </div>

  <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
    {[
      { title: "1. Create Profile", desc: "List the skills you want to teach and learn.", icon: "👤" },
      { title: "2. Find Matches", desc: "Find partners with matching interests.", icon: "🔍" },
      { title: "3. Start Exchanging", desc: "Chat and begin your learning session.", icon: "🤝" }
    ].map((step, i) => (
      <div key={i} className="flex flex-col items-center">
        <div className="text-4xl mb-4 bg-blue-50 w-20 h-20 flex items-center justify-center rounded-full text-blue-600">
          {step.icon}
        </div>

        <h3 className="font-bold text-lg text-blue-600 mb-2 h-14 flex items-center justify-center">
          {step.title}
        </h3>

        <p className="text-slate-500 text-sm leading-relaxed h-16">
          {step.desc}
        </p>
      </div>
    ))}
  </div>
</section>


          {/* KEY FEATURES SECTION */}
          <section ref={featuresRef} id="key-features-section" className="relative py-14 border-t border-blue-100 bg-white/60 backdrop-blur-sm w-full scroll-mt-20">
            <div className="max-w-7xl mx-auto px-6 sm:px-8">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-tight uppercase">KEY FEATURES</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition duration-200 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start space-x-3 mb-2">
                      <div className="h-10 w-10 shrink-0 bg-blue-50 rounded-xl flex items-center justify-center text-lg border border-blue-100 mt-0.5">🛡️</div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight min-h-[44px] flex items-center leading-snug">
                        Profile Management
                      </h3>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed pl-1 text-justify">
                      Create a secure profile to easily showcase the skills you can teach and the specific skills you want to learn.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition duration-200 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start space-x-3 mb-2">
                      <div className="h-10 w-10 shrink-0 bg-blue-50 rounded-xl flex items-center justify-center text-lg border border-blue-100 mt-0.5">🔍</div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight min-h-[44px] flex items-center leading-snug">
                        Smart Discovery
                      </h3>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed pl-1 text-justify">
                      Advanced filtering options help you quickly pinpoint the exact users who offer what you wish to master.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition duration-200 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start space-x-3 mb-2">
                      <div className="h-10 w-10 shrink-0 bg-blue-50 rounded-xl flex items-center justify-center text-lg border border-blue-100 mt-0.5">🤝</div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight min-h-[44px] flex items-center leading-snug">
                        Easy Proposals
                      </h3>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed pl-1 text-justify">
                      Send exchange proposals, negotiate lesson details safely, and agree on personalized swaps with ease.
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition duration-200 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start space-x-3 mb-2">
                      <div className="h-10 w-10 shrink-0 bg-blue-50 rounded-xl flex items-center justify-center text-lg border border-blue-100 mt-0.5">💬</div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight min-h-[44px] flex items-center leading-snug">
                        Instant Live Chat
                      </h3>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed pl-1 text-justify">
                      Chat instantly with your partner as soon as a swap proposal is accepted to coordinate your upcoming classes.
                    </p>
                  </div>
                </div>

                {/* Feature 5 */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition duration-200 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start space-x-3 mb-2">
                      <div className="h-10 w-10 shrink-0 bg-blue-50 rounded-xl flex items-center justify-center text-lg border border-blue-100 mt-0.5">📅</div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight min-h-[44px] flex items-center leading-snug">
                        Smart Scheduling
                      </h3>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed pl-1 text-justify">
                      Schedule live teaching sessions on shared calendars that automatically translate perfectly to both local timezones.
                    </p>
                  </div>
                </div>

                {/* Feature 6 */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition duration-200 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start space-x-3 mb-2">
                      <div className="h-10 w-10 shrink-0 bg-blue-50 rounded-xl flex items-center justify-center text-lg border border-blue-100 mt-0.5">⭐</div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight min-h-[44px] flex items-center leading-snug">
                        Trusted Reviews
                      </h3>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed pl-1 text-justify">
                      Leave ratings and reviews after completing exchanges to build solid reputation stats within the community.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Trust Section*/}

<section className="py-16 bg-white w-full border-y border-blue-50">
  <div className="max-w-6xl mx-auto px-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {[
        { title: "Free Forever", sub: "No hidden costs", icon: "💎" },
        { title: "No Tokens", sub: "Direct trading only", icon: "🔄" },
        { title: "Peer-to-Peer", sub: "Direct communication", icon: "💬" },
        { title: "Secure Accounts", sub: "Privacy protected", icon: "🔒" }
      ].map((item, idx) => (
        <div
          key={idx}
          className="group relative p-6 bg-blue-50/50 border border-blue-100 rounded-2xl transition-all duration-300 hover:bg-blue-100/50 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 text-center overflow-hidden"
        >
          {/* Icon Section */}
          <div className="text-3xl mb-3 transform transition-transform group-hover:scale-110">{item.icon}</div>

          {/* Text Section */}
          <h4 className="text-blue-900 font-bold text-sm sm:text-base mb-1">{item.title}</h4>
          <p className="text-blue-600/70 text-[11px] sm:text-xs uppercase tracking-wider font-semibold">{item.sub}</p>

          {/* Bottom Highlight Line */}
          <div className="absolute bottom-0 left-1/2 w-0 h-1 bg-blue-400 transition-all duration-300 group-hover:w-full group-hover:left-0"></div>
        </div>
      ))}
    </div>
  </div>
</section>


          {/* POPULAR SKILLS SECTION */}
          <section ref={skillsRef} className="relative py-12 border-t border-blue-100 bg-white/40 w-full scroll-mt-20">
            <div className="max-w-7xl mx-auto px-6 sm:px-8">
              <div className="text-center max-w-3xl mx-auto mb-10">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-tight">Skills You Can Exchange</h2>

              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {popularSkills.map((skill, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate('/register')}
                    className={`border p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 shadow-sm hover:scale-105 hover:shadow-md transition transform duration-200 cursor-pointer select-none min-h-[110px] ${skill.colorClass}`}
                  >
                    <span className="text-2xl transform group-hover:scale-110 transition">{skill.icon}</span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm leading-tight">{skill.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ==================== VIEW 2: ABOUT US VIEW ==================== */}
      {currentView === 'about' && (
        <section className="max-w-4xl mx-auto w-full px-6 py-14 space-y-8 flex-1 animate-fade-in-up">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-blue-600">About Our Platform</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white border border-blue-100 p-6 rounded-2xl shadow-sm">
              <div className="text-2xl mb-1">🎯</div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Our Mission</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Accessible, collaborative and practical skill swapping for everyone.</p>
            </div>
            <div className="bg-white border border-blue-100 p-6 rounded-2xl shadow-sm">
              <div className="text-2xl mb-1">🤝</div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Community</h4>
              <p className="text-slate-500 text-xs leading-relaxed">A growing knowledge base built entirely on mutual sharing loops.</p>
            </div>
            <div className="bg-white border border-blue-100 p-6 rounded-2xl shadow-sm">
              <div className="text-2xl mb-1">🌍</div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Our Vision</h4>
              <p className="text-slate-500 text-xs leading-relaxed">A decentralized, dynamic, tokenless global network of learning partners.</p>
            </div>
          </div>

          <div className="space-y-6 bg-white border border-blue-100 p-8 rounded-2xl shadow-sm">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Who We Are</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                <span className="font-semibold text-blue-600">SkillBarter</span> is a platform built to connect learners and teachers through the power of skill exchange. We believe that everyone has something valuable to offer and something new to learn.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Contact Us</h3>
              <p className="text-slate-600 text-sm">
                Have questions or academic feedback? Reach out at <span className="text-blue-600 font-medium underline">skillbarter@gmail.com</span>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ==================== VIEW 3: FAQs VIEW ==================== */}
      {currentView === 'faq' && (
        <section className="max-w-4xl mx-auto w-full px-6 py-14 space-y-8 flex-1 animate-fade-in-up">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-blue-600">FAQs</h2>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-sm transition">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left px-6 py-4 flex justify-between items-center font-semibold text-slate-800 hover:bg-blue-50/40 transition select-none"
                >
                  <span>{faq.q}</span>
                  <span className={`text-blue-500 font-bold transition-transform duration-200 transform ${openFaq === index ? 'rotate-180' : 'rotate-0'}`}>
                    ▼
                  </span>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${openFaq === index ? 'max-h-40 border-t border-slate-100' : 'max-h-0'}`}
                >
                  <p className="p-6 text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FOOTER AREA */}
      <footer className="w-full border-t border-blue-100 bg-white/40 mt-auto">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4 w-full">
          <div className="space-y-1 text-center sm:text-left">
            <div>&copy; 2026 SkillBarter</div>

          </div>
          <div className="flex space-x-6">

            <Link to="/privacy-policy" className="text-slate-400 hover:text-blue-600 transition decoration-transparent">Privacy</Link>
            <Link to="/terms-and-conditions" className="text-slate-400 hover:text-blue-600 transition decoration-transparent">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}