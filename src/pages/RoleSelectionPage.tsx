import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { Sprout, ArrowRight, ShieldCheck } from "lucide-react";

export const RoleSelectionPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSelectRole = (role: "farmer" | "worker") => {
    // Navigate to Login/Signup with pre-selected state or simple query param
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 transition-colors duration-300">
      <div className="w-full max-w-2xl space-y-8 text-center">
        
        {/* Header */}
        <div className="space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 shadow-md">
            <Sprout className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {t("roleSelectTitle")}
          </h1>
          <p className="mx-auto max-w-md text-sm text-slate-500 dark:text-slate-400">
            {t("roleSelectSub")}
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          
          {/* Farmer Selection Card */}
          <button
            onClick={() => handleSelectRole("farmer")}
            className="group flex flex-col items-center justify-between rounded-3xl border border-slate-200 bg-white p-8 text-center transition-all duration-300 hover:border-emerald-500 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
          >
            <div className="space-y-4">
              <span className="text-5xl block transform transition-transform group-hover:scale-110 duration-300">🌾</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                {t("imFarmer")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t("imFarmerDesc")} Search nearest workers, post work requests, and connect directly with 0% middle contractor fees.
              </p>
            </div>
            <div className="mt-8 flex items-center space-x-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <span>Hire Workers Now</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Worker Selection Card */}
          <button
            onClick={() => handleSelectRole("worker")}
            className="group flex flex-col items-center justify-between rounded-3xl border border-slate-200 bg-white p-8 text-center transition-all duration-300 hover:border-emerald-500 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
          >
            <div className="space-y-4">
              <span className="text-5xl block transform transition-transform group-hover:scale-110 duration-300">🧑‍🌾</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                {t("imWorker")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t("imWorkerDesc")} Display your skills, get call requests directly from local farmers, and keep 100% of your earned money.
              </p>
            </div>
            <div className="mt-8 flex items-center space-x-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <span>Find Farm Jobs</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

        </div>

        {/* Security / Trust text */}
        <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-400">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
          <span>No contractors • 100% direct communication & earnings</span>
        </div>

      </div>
    </div>
  );
};
export default RoleSelectionPage;
