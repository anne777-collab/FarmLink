import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { Sprout, Phone, Shield, Globe, Award } from "lucide-react";

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          
          {/* Brand & Mission Statement */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 shadow-md">
                <Sprout className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {t("appName")}
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {t("taglineSub")} Removing commissions, bringing stability, and empowering local agricultural workers directly.
            </p>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Shield className="h-4 w-4" />
              <span>100% Secure & Direct Connection</span>
            </div>
          </div>

          {/* Grid columns */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Platform
                </h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <a href="/help" className="text-sm text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                      How It Works
                    </a>
                  </li>
                  <li>
                    <a href="/help" className="text-sm text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                      Safety & Trust
                    </a>
                  </li>
                  <li>
                    <a href="/help" className="text-sm text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                      Bilingual Help
                    </a>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Trust & Security
                </h3>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center space-x-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <Award className="h-4 w-4 text-emerald-500" />
                    <span>No Contractor Fees</span>
                  </li>
                  <li className="flex items-center space-x-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <Globe className="h-4 w-4 text-emerald-500" />
                    <span>Multi-Language Active</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Helpline support card */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-900/30 dark:bg-emerald-950/10">
              <h3 className="flex items-center space-x-2 text-sm font-bold text-emerald-800 dark:text-emerald-400">
                <Phone className="h-4 w-4" />
                <span>Rural Support / सहायता</span>
              </h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Need help registering, or finding jobs? Call our rural support center directly!
              </p>
              <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                {t("helpline")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} FarmLink Agriculture Direct. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="/help" className="hover:underline">Privacy Policy</a>
            <a href="/help" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
