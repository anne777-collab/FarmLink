import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useApp } from "../context/AppContext";
import { 
  Sprout, ArrowRight, ShieldCheck, PhoneCall, Check, Lock, Award, 
  MapPin, Plus, Minus, Flame
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useApp();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const stats = [
    { value: "0%", label: "Contractor Fees / दलाली" },
    { value: "Direct", label: "Phone & WhatsApp Chat" },
    { value: "100%", label: "Direct Wage Transfer" },
    { value: "GPS", label: "Village-level Nearby Matching" },
  ];

  const features = [
    {
      title: "Direct Calling & WhatsApp",
      desc: "Farmers and workers contact each other directly at the click of a button. No middleman controls your wages.",
      icon: <PhoneCall className="h-6 w-6 text-emerald-600" />,
    },
    {
      title: "Multi-Sample Accurate GPS",
      desc: "Workers and farmers are matched using advanced geolocation retries to avoid random location jumps.",
      icon: <MapPin className="h-6 w-6 text-emerald-600" />,
    },
    {
      title: "No Hidden Commission",
      desc: "Workers keep 100% of their daily wages. Farmers pay exactly what they agree. Transparency at its best.",
      icon: <Award className="h-6 w-6 text-emerald-600" />,
    },
  ];

  const faqs = [
    { q: "Is FarmLink free for agricultural workers?", a: "Yes! FarmLink is completely 100% free for all agricultural workers forever. Workers keep 100% of their wages with zero deductions." },
    { q: "How accurate is the location search?", a: "We use high-accuracy GPS with retry-based filtering. It gets your live coordinates and reverse-geocodes your actual village, preventing inaccurate city matches." },
    { q: "How do farmers and workers contact each other?", a: "Once matched, the farmer can click the Call Button to open their phone dialer directly, or click the WhatsApp Button to message them instantly." },
    { q: "What is the Premium Plan for Farmers?", a: "Free farmers can view the nearest 3 matched workers. Upgrading to Premium unlocks unlimited worker searches, skill filters, and direct hiring history." }
  ];

  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      
      {/* Premium Notification Announcement Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 text-center text-xs font-semibold text-white">
        <span className="inline-flex items-center space-x-1.5">
          <Flame className="h-4 w-4 animate-pulse" />
          <span>No commission. Directly connect and keep 100% of your earnings. English & हिंदी Fully Supported!</span>
        </span>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Background Gradients */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-emerald-200 to-emerald-400 opacity-20 dark:from-emerald-950 dark:to-emerald-800 sm:left-[calc(50%-30rem)] sm:w-[72rem]"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <span className="inline-flex items-center space-x-2 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                <ShieldCheck className="h-4 w-4" />
                <span>Removing Middlemen from Indian Farming</span>
              </span>
              
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
                {t("tagline")}{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
                  FarmLink
                </span>
              </h1>
              
              <p className="mx-auto max-w-2xl text-base text-slate-500 dark:text-slate-400 sm:text-lg lg:mx-0">
                {t("taglineSub")} Easily find nearby wheat cutting, rice planting, tractor driving, or harvesting helpers during peak crop seasons.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {user ? (
                  <Link
                    to={user.role === "farmer" ? "/farmer-dashboard" : "/worker-dashboard"}
                    className="flex w-full sm:w-auto items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-4 font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-400 transition-all cursor-pointer"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/role-selection"
                      className="flex w-full sm:w-auto items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-4 font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-400 transition-all cursor-pointer"
                    >
                      <span>Start Hiring / Find Work</span>
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link
                      to="/help"
                      className="flex w-full sm:w-auto items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-4 font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
                    >
                      <span>{t("help")}</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center lg:text-left">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Graphic/Image Column */}
            <div className="mt-16 sm:mt-24 lg:col-span-5 lg:mt-0 relative">
              <div className="aspect-square w-full rounded-3xl bg-gradient-to-tr from-emerald-600/10 to-green-500/20 p-4 border border-emerald-500/10 dark:border-emerald-500/5 shadow-inner">
                {/* Visual Representation of direct farmer-worker matching map */}
                <div className="relative h-full w-full rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-6 overflow-hidden flex flex-col justify-between border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Live GPS Radar</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">Rewari, Haryana</span>
                  </div>

                  {/* Matching Simulation Diagram */}
                  <div className="flex-1 flex flex-col justify-center items-center space-y-6 my-4 relative">
                    {/* Circle Pulse Radar */}
                    <div className="absolute h-36 w-36 rounded-full border-2 border-emerald-500/10 dark:border-emerald-500/5 animate-pulse flex items-center justify-center">
                      <div className="h-24 w-24 rounded-full border-2 border-emerald-500/20 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Sprout className="h-6 w-6 text-emerald-600 animate-spin-slow" />
                        </div>
                      </div>
                    </div>

                    {/* Left profile badge (Farmer) */}
                    <div className="absolute left-4 top-4 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700 shadow-md flex items-center space-x-2">
                      <span className="text-lg">🌾</span>
                      <div className="text-left">
                        <p className="text-[11px] font-black leading-tight text-slate-900 dark:text-white">Jagdev Singh (Farmer)</p>
                        <p className="text-[9px] text-slate-400">Needs 5 Wheat Cutters</p>
                      </div>
                    </div>

                    {/* Right profile badge (Worker) */}
                    <div className="absolute right-4 bottom-4 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700 shadow-md flex items-center space-x-2">
                      <span className="text-lg">🧑‍🌾</span>
                      <div className="text-left">
                        <p className="text-[11px] font-black leading-tight text-slate-900 dark:text-white">Satish Yadav (Worker)</p>
                        <p className="text-[9px] text-emerald-600 font-bold">1.2 km away • Available</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">⚡ Direct Call Connected • ₹0 commission</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-emerald-600 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs font-bold tracking-widest uppercase">Engineered for direct local agricultural labor needs</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            <div className="flex flex-col items-center space-y-2">
              <span className="text-3xl">🚫💸</span>
              <h3 className="font-bold text-lg">No Contractors, No Commissions</h3>
              <p className="text-xs text-emerald-100 max-w-xs">Wages go 100% directly from Farmer to Worker. No deductions.</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <span className="text-3xl">🗺️🔍</span>
              <h3 className="font-bold text-lg">Stable GPS Village Filter</h3>
              <p className="text-xs text-emerald-100 max-w-xs">Accurate location system avoids random jumps, displaying only nearest helpers.</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <span className="text-3xl">🗣️🇮🇳</span>
              <h3 className="font-bold text-lg">Bilingual Support (EN | हिंदी)</h3>
              <p className="text-xs text-emerald-100 max-w-xs">Simple terminology and Hindi layout makes the app easy for rural users.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Why farmers and workers choose FarmLink
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            A secure agrilabor product designed specifically for regional harvesting and planting seasons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {features.map((feat, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-6">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feat.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-100/60 dark:bg-slate-900/40 py-24 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              How FarmLink works in 3 easy steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 relative">
            {/* Step 1 */}
            <div className="text-center space-y-4 relative">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-emerald-500/20">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Choose Your Role & Sign Up</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Select whether you are a Farmer looking to hire, or a Worker looking for work. Sign up securely in under 30 seconds.
              </p>
            </div>
            {/* Step 2 */}
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-emerald-500/20">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Share Live Location</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Press the "Detect GPS" button. Our system acquires your exact village coordinates to pair you with nearest available matches.
              </p>
            </div>
            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-emerald-500/20">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Connect & Get to Work</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Farmers can directly call or message matched workers via phone or WhatsApp. Fix wages, finalize details, and start work!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Subscriptions Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Pricing Structure</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Simple Freemium Farmer Model
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Workers are 100% Free. Farmers can search basic listings for free, or unlock seasonal unlimited access with Premium.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Worker Plan */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Agricultural Worker</h3>
              <p className="text-xs text-slate-400 mt-1">For harvesting & crop cutting helpers</p>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹0</span>
                <span className="text-sm text-slate-400 ml-2">/ forever free</span>
              </div>
              <ul className="mt-8 space-y-4 text-xs text-slate-500 dark:text-slate-400">
                <li className="flex items-center space-x-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>List profile in nearby village directory</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>Get direct calls/WhatsApp from farmers</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>Keep 100% of your earnings</span>
                </li>
              </ul>
            </div>
            <Link
              to="/role-selection"
              className="mt-8 block w-full rounded-xl bg-slate-100 py-3 text-center text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Farmer Free Plan */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Farmer Free</h3>
              <p className="text-xs text-slate-400 mt-1">Basic regional worker matching</p>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹0</span>
                <span className="text-sm text-slate-400 ml-2">/ month</span>
              </div>
              <ul className="mt-8 space-y-4 text-xs text-slate-500 dark:text-slate-400">
                <li className="flex items-center space-x-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>View nearest 3 agricultural workers</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>Post unlimited hiring jobs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-slate-400">View unlimited workers (Locked)</span>
                </li>
              </ul>
            </div>
            <Link
              to="/role-selection"
              className="mt-8 block w-full rounded-xl bg-slate-100 py-3 text-center text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Start Free Matching
            </Link>
          </div>

          {/* Farmer Premium Plan */}
          <div className="bg-gradient-to-br from-emerald-600 to-green-700 border border-emerald-500/30 rounded-3xl p-8 flex flex-col justify-between text-white shadow-xl shadow-emerald-500/10">
            <div>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Farmer Premium</h3>
                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100">Recommended</span>
              </div>
              <p className="text-xs text-emerald-100 mt-1">Unlimited matches during harvest season</p>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold">₹99</span>
                <span className="text-sm text-emerald-100 ml-2">/ month (or ₹299 seasonal)</span>
              </div>
              <ul className="mt-8 space-y-4 text-xs text-emerald-500 dark:text-slate-400">
                <li className="flex items-center space-x-2 text-white">
                  <Check className="h-4.5 w-4.5 text-emerald-200 shrink-0" />
                  <span>View & contact unlimited workers</span>
                </li>
                <li className="flex items-center space-x-2 text-white">
                  <Check className="h-4.5 w-4.5 text-emerald-200 shrink-0" />
                  <span>Filter by special skills (e.g., tractor driver)</span>
                </li>
                <li className="flex items-center space-x-2 text-white">
                  <Check className="h-4.5 w-4.5 text-emerald-200 shrink-0" />
                  <span>Verified worker tag access</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setShowPremiumModal(true)}
              className="mt-8 block w-full rounded-xl bg-white py-3 text-center text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition-all cursor-pointer"
            >
              Upgrade to Premium
            </button>
          </div>

        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="bg-slate-100/60 dark:bg-slate-900/40 py-24 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {t("faqTitle")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Clear answers to help you navigate FarmLink successfully
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-6 text-left font-bold text-slate-900 dark:text-white"
                >
                  <span>{faq.q}</span>
                  {activeFaq === index ? <Minus className="h-5 w-5 text-emerald-600" /> : <Plus className="h-5 w-5 text-slate-400" />}
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-6 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-4 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Sprout className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t("premiumComingSoon")}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t("premiumComingSoonDesc")} We are preparing our seamless Razorpay payment gateway to enable smooth, secure transactions for Indian farmers.
              </p>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                  ⚡ Coming Soon Feature: Advanced match filters, Unlimited nearby worker profiles, SMS alerts.
                </p>
              </div>
              <button
                onClick={() => setShowPremiumModal(false)}
                className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-md cursor-pointer"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default LandingPage;
