import React from "react";
import { BadgeCheck, Flame, ShieldCheck, Star, TrendingUp } from "lucide-react";
import { TrustProfile } from "../services/marketplaceIntelligence";

const iconForBadge = (badge: string) => {
  if (badge.includes("Top")) return Star;
  if (badge.includes("Fast")) return Flame;
  if (badge.includes("Reliable")) return TrendingUp;
  if (badge.includes("Verified")) return BadgeCheck;
  return ShieldCheck;
};

export const TrustBadges: React.FC<{ trust: TrustProfile; compact?: boolean }> = ({ trust, compact = false }) => {
  return (
    <div className={compact ? "space-y-2" : "rounded-3xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/10"}>
      {!compact && (
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Trust Score</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Ratings, completion, response and verification</p>
          </div>
          <span className="rounded-2xl bg-emerald-600 px-3 py-1.5 text-sm font-black text-white">{trust.trustScore}/100</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {trust.badges.map((badge) => {
          const Icon = iconForBadge(badge);
          return (
            <span key={badge} className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white px-2.5 py-1 text-[10px] font-black text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <Icon className="h-3.5 w-3.5 text-emerald-600" />
              {badge}
            </span>
          );
        })}
      </div>

      {!compact && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white p-2 dark:bg-slate-950">
            <p className="text-sm font-black text-slate-900 dark:text-white">{trust.averageRating ? trust.averageRating.toFixed(1) : "New"}</p>
            <p className="text-[9px] font-bold uppercase text-slate-400">Rating</p>
          </div>
          <div className="rounded-2xl bg-white p-2 dark:bg-slate-950">
            <p className="text-sm font-black text-slate-900 dark:text-white">{trust.completionRate}%</p>
            <p className="text-[9px] font-bold uppercase text-slate-400">Completion</p>
          </div>
          <div className="rounded-2xl bg-white p-2 dark:bg-slate-950">
            <p className="text-sm font-black text-slate-900 dark:text-white">{trust.responseRate}%</p>
            <p className="text-[9px] font-bold uppercase text-slate-400">Response</p>
          </div>
        </div>
      )}
    </div>
  );
};
