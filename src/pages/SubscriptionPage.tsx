import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { Sprout, Check, ArrowLeft, Sparkles, HelpCircle } from "lucide-react";

export const SubscriptionPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const plans = [
    {
      title: "Worker Basic",
      price: "₹0",
      period: "forever free",
      desc: "For agricultural labor, crop cutters, and sprayers looking for local farm matching.",
      features: [
        "Include profile in village directory listings",
        "Direct call & WhatsApp alerts from nearby farmers",
        "Keep 100% of your daily wage",
        "Direct reverse geocoded GPS matching"
      ],
      cta: "Join Directory Free",
      action: () => navigate("/role-selection")
    },
    {
      title: "Farmer Free",
      price: "₹0",
      period: "basic tier",
      desc: "Basic matching index for small, regional household farms.",
      features: [
        "View closest 3 agricultural workers",
        "Filter by nearest proximity ranking",
        "Post unlimited agricultural work requests",
        "Direct WhatsApp web & calling launcher"
      ],
      cta: "Continue Free Mode",
      action: () => navigate("/farmer-dashboard")
    },
    {
      title: "Farmer Premium",
      price: "₹99",
      period: "month (or ₹299/season)",
      desc: "Unlimited nearby match discovery during peak harvest crop seasons.",
      features: [
        "View & contact unlimited workers directory",
        "Filter by specific skill types (e.g. wheat cutting)",
        "Verified farm rating & reliability badge",
        "Direct notifications broadcast to 100+ local helpers"
      ],
      cta: "Unlock Seasonal Access",
      action: () => setShowPremiumModal(true),
      recommended: true
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 dark:bg-slate-950 transition-colors duration-300">
      <div className="mx-auto max-w-6xl px-4 space-y-8">
        
        {/* Back navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Title */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 shadow-md">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {t("subscriptions")} & Match Tiers
          </h1>
          <p className="mx-auto max-w-lg text-xs text-slate-500 dark:text-slate-400">
            Removing commissions and promoting direct economic rewards for farmers and rural helpers.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-8 flex flex-col justify-between relative ${
                plan.recommended
                  ? "bg-gradient-to-b from-emerald-600 to-green-700 text-white shadow-xl shadow-emerald-500/10 border border-emerald-500/20"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              }`}
            >
              {plan.recommended && (
                <span className="absolute -top-3.5 right-6 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-black uppercase text-white tracking-widest shadow-md">
                  Recommended Season Pass
                </span>
              )}

              <div>
                <span className={`text-xs font-black uppercase tracking-wider block ${plan.recommended ? "text-emerald-100" : "text-slate-400"}`}>
                  {plan.title}
                </span>
                
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className={`text-sm ml-2 font-medium ${plan.recommended ? "text-emerald-100" : "text-slate-400"}`}>/ {plan.period}</span>
                </div>

                <p className={`mt-4 text-xs leading-relaxed ${plan.recommended ? "text-emerald-100" : "text-slate-500 dark:text-slate-400"}`}>
                  {plan.desc}
                </p>

                {/* Features List */}
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start space-x-2.5 text-xs">
                      <Check className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${plan.recommended ? "text-emerald-200" : "text-emerald-600"}`} />
                      <span className={plan.recommended ? "text-emerald-50" : "text-slate-600 dark:text-slate-400"}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={plan.action}
                className={`mt-8 w-full rounded-2xl py-3.5 text-xs font-bold text-center cursor-pointer transition ${
                  plan.recommended
                    ? "bg-white text-emerald-800 hover:bg-emerald-50"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Razorpay ready message */}
        <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400 pt-6">
          <HelpCircle className="h-4.5 w-4.5 text-emerald-500" />
          <span>Platform architecture integrated with Razorpay payment pipelines (Inactive initially).</span>
        </div>

      </div>

      {/* Premium Notification Drawer/Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-emerald-600 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t("premiumComingSoon")}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t("premiumComingSoonDesc")}
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
export default SubscriptionPage;
