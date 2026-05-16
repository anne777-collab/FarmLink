import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, MessageSquare, Star, Briefcase, Award } from "lucide-react";
import { useApp } from "../context/AppContext";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { TrustBadges } from "../components/TrustBadges";
import { buildTrustProfile } from "../services/marketplaceIntelligence";

export const FarmerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { farmers, user, jobs, ratings } = useApp();

  const farmer = farmers.find((item) => item.uid === id);

  if (!farmer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <p className="text-sm font-bold text-slate-500">Farmer profile not found.</p>
          <button onClick={() => navigate(-1)} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const farmerJobs = jobs.filter((job) => job.farmerId === farmer.uid);
  const completedJobs = farmerJobs.filter((job) => ["completed", "rated"].includes(job.status)).length;
  const trust = buildTrustProfile(farmer.uid, ratings, completedJobs);

  return (
    <div className="min-h-screen bg-slate-50 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-emerald-600">
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-8">
          <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
            <ProfileAvatar
              name={farmer.fullName}
              role="farmer"
              src={farmer.profilePhoto || farmer.photoURL}
              size="xl"
              className="shrink-0"
            />
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{farmer.fullName}</h1>
              <p className="flex items-center justify-center gap-1 text-xs text-slate-500 md:justify-start">
                <MapPin className="h-4 w-4 text-rose-500" />
                <span>{farmer.village}, {farmer.district}{farmer.state ? ` • ${farmer.state}` : ""}</span>
              </p>
              <p className="text-xs text-slate-400">Verified farmer profile preview</p>
            </div>
          </div>

          <TrustBadges trust={trust} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20">
              <Star className="mx-auto h-5 w-5 fill-amber-400 text-amber-400" />
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{trust.averageRating ? trust.averageRating.toFixed(1) : "New"}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Rating</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 text-center dark:border-sky-900/30 dark:bg-sky-950/20">
              <Briefcase className="mx-auto h-5 w-5 text-sky-600" />
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{farmerJobs.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jobs Posted</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-center dark:border-amber-900/30 dark:bg-amber-950/20">
              <Award className="mx-auto h-5 w-5 text-amber-600" />
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{completedJobs}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed Jobs</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <a href={`tel:${farmer.mobileNum}`} className="rounded-2xl border border-slate-200 bg-white py-3.5 text-center text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 flex items-center justify-center space-x-2">
              <Phone className="h-5 w-5 text-emerald-500" />
              <span>Call Farmer</span>
            </a>
            <a href={`https://wa.me/91${farmer.mobileNum}`} target="_blank" rel="noreferrer" className="rounded-2xl border border-emerald-500 bg-emerald-50 py-3.5 text-center text-sm font-bold text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 flex items-center justify-center space-x-2">
              <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp</span>
            </a>
          </div>

          {user?.role === "worker" && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
              You can review this farmer before responding to direct hiring requests.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerProfilePage;
