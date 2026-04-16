// src/pages/farmer/FarmerJobs.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Phone, CheckCircle, Star, ChevronDown, ChevronUp } from "lucide-react";
import {
  getFarmerRequestsRealtime,
  updateRequestStatus,
  rateWorker,
  getExistingRating,
} from "../../firebase/firestore";
import { Card, Button, Modal, Spinner, EmptyState } from "../../components/UI";
import { formatDate, WORK_TYPE_MAP } from "../../utils/helpers";
import toast from "react-hot-toast";

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

const STATUS_CONFIG = {
  pending:   { strip: "bg-yellow-400", pill: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  accepted:  { strip: "bg-green-400",  pill: "bg-green-50  border-green-200  text-green-700"  },
  rejected:  { strip: "bg-red-400",    pill: "bg-red-50    border-red-200    text-red-600"    },
  completed: { strip: "bg-blue-400",   pill: "bg-blue-50   border-blue-200   text-blue-700"  },
};

// ── Accepted workers collapsible panel ────────────────────────────────────────
function AcceptedWorkersPanel({ jobs }) {
  const [open, setOpen] = useState(true);
  const accepted = jobs.filter((j) => j.status === "accepted");
  if (accepted.length === 0) return null;

  return (
    <div className="mb-4">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-green-600 text-white
                   rounded-2xl px-4 py-3 font-bold text-sm">
        <span>&#10003; {accepted.length} Accepted Worker{accepted.length !== 1 ? "s" : ""}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {accepted.map((job) => {
            const w     = job.worker;
            const name  = w?.user?.name  || "Worker";
            const phone = w?.user?.phone || "";
            return (
              <div key={job.id}
                className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600
                                flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{name[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{name}</p>
                  <p className="text-xs text-gray-500">
                    {WORK_TYPE_MAP[w?.workType] || w?.workType || ""}
                    {w?.wage ? ` · Rs.${w.wage}/day` : ""}
                  </p>
                  <p className="text-xs text-green-700 font-medium mt-0.5">
                    Work date: {job.date || "TBD"}
                  </p>
                </div>
                {phone && (
                  <a href={`tel:${phone}`}
                    className="w-9 h-9 bg-white rounded-xl border border-green-200
                               flex items-center justify-center hover:bg-green-100 transition-colors">
                    <Phone className="w-4 h-4 text-green-600" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT — receives farmerId as a prop (no useAuth here)
// ─────────────────────────────────────────────────────────────────────────────
export default function FarmerJobs({ farmerId }) {
  const [jobs,          setJobs]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [acting,        setActing]        = useState(null);

  // Rating modal
  const [rateJob,        setRateJob]        = useState(null);
  const [starValue,      setStarValue]      = useState(5);
  const [rateLoading,    setRateLoading]    = useState(false);
  const [existingRating, setExistingRating] = useState(null);

  const firstSnap = useRef(false);

  // ── Real-time listener ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!farmerId) { setLoading(false); return; }

    firstSnap.current = false;
    setLoading(true);
    setError(null);

    const unsub = getFarmerRequestsRealtime(
      farmerId,
      (data) => {
        const order = { pending: 0, accepted: 1, completed: 2, rejected: 3 };
        data.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
        setJobs(data);
        setError(null);
        if (!firstSnap.current) {
          firstSnap.current = true;
          setLoading(false);
        }
      },
      (err) => {
        const msg = err?.message?.includes("index")
          ? "Index missing — run: firebase deploy --only firestore:indexes"
          : err?.message?.includes("permission")
          ? "Permission denied. Check Firestore rules."
          : "Could not load requests.";
        setError(msg);
        setLoading(false);
        console.error("[FarmerJobs] listener:", err);
      }
    );

    return () => unsub();
  }, [farmerId]);

  // ── Mark complete ──────────────────────────────────────────────────────────
  const markComplete = useCallback(async (jobId) => {
    setActing(jobId);
    try {
      await updateRequestStatus(jobId, "completed");
      toast.success("Job marked as completed!");
    } catch (err) {
      toast.error("Could not update. Try again.");
      console.error("[FarmerJobs] markComplete:", err);
    } finally {
      setActing(null);
    }
  }, []);

  // ── Open rating modal ──────────────────────────────────────────────────────
  const openRateModal = useCallback(async (job) => {
    setRateJob(job);
    setStarValue(5);
    setExistingRating(null);
    try {
      const existing = await getExistingRating(farmerId, job.workerId);
      setExistingRating(existing ?? false);
      if (existing) setStarValue(existing.rating);
    } catch (err) {
      console.error("[FarmerJobs] getExistingRating:", err);
      setExistingRating(false);
    }
  }, [farmerId]);

  // ── Submit rating ──────────────────────────────────────────────────────────
  const submitRating = async () => {
    if (!rateJob) return;
    setRateLoading(true);
    try {
      await rateWorker(farmerId, rateJob.workerId, starValue);
      toast.success(existingRating ? "Rating updated!" : "Rating submitted!");
      setRateJob(null);
    } catch (err) {
      toast.error(err.message || "Could not submit rating.");
      console.error("[FarmerJobs] submitRating:", err);
    } finally {
      setRateLoading(false);
    }
  };

  const counts = {
    pending:   jobs.filter((j) => j.status === "pending").length,
    accepted:  jobs.filter((j) => j.status === "accepted").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    rejected:  jobs.filter((j) => j.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-gray-500">Loading requests…</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-black text-gray-800">Job Requests</h1>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
            Live updates
          </p>
        </div>
      </div>

      {/* Summary pills */}
      {jobs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {counts.pending   > 0 && <Pill count={counts.pending}   label="Pending"   color="yellow" />}
          {counts.accepted  > 0 && <Pill count={counts.accepted}  label="Accepted"  color="green"  />}
          {counts.completed > 0 && <Pill count={counts.completed} label="Completed" color="blue"   />}
          {counts.rejected  > 0 && <Pill count={counts.rejected}  label="Rejected"  color="red"    />}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <AcceptedWorkersPanel jobs={jobs} />

      {!error && jobs.length === 0 && (
        <EmptyState
          icon="&#128203;"
          title="No job requests yet"
          subtitle="Go to Search to find workers and send requests"
        />
      )}

      {jobs.map((job) => (
        <FarmerJobCard
          key={job.id}
          job={job}
          acting={acting}
          onMarkComplete={markComplete}
          onRate={openRateModal}
        />
      ))}

      {/* Rating modal */}
      <Modal
        open={!!rateJob}
        onClose={() => !rateLoading && setRateJob(null)}
        title={existingRating ? "Update Rating" : "Rate Worker"}>
        <p className="text-gray-500 text-sm mb-5">
          {existingRating
            ? <>Updating your <strong>{existingRating.rating}&#11088;</strong> rating for <strong>{rateJob?.worker?.user?.name || "this worker"}</strong></>
            : <>How was <strong>{rateJob?.worker?.user?.name || "this worker"}</strong>?</>
          }
        </p>

        {existingRating === null ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : (
          <>
            <div className="flex justify-center gap-3 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setStarValue(star)}
                  className={`text-4xl transition-all select-none active:scale-125
                    ${starValue >= star ? "opacity-100 scale-110" : "opacity-25"}`}>
                  &#11088;
                </button>
              ))}
            </div>
            <p className="text-center text-gray-600 font-semibold mb-6 h-5">
              {RATING_LABELS[starValue]}
            </p>
            <Button variant="primary" size="lg" loading={rateLoading} onClick={submitRating}>
              {existingRating ? "Update Rating" : "Submit Rating"}
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB CARD
// ─────────────────────────────────────────────────────────────────────────────
function FarmerJobCard({ job, acting, onMarkComplete, onRate }) {
  const workerName  = job.worker?.user?.name  || "Worker";
  const workerPhone = job.worker?.user?.phone || "";
  const workType    = WORK_TYPE_MAP[job.workType] || job.workType || "";
  const cfg         = STATUS_CONFIG[job.status]   || STATUS_CONFIG.pending;

  return (
    <Card className="mb-3 overflow-hidden">
      <div className={`h-1.5 -mx-4 -mt-4 mb-4 ${cfg.strip}`} />

      {job.emergency && (
        <div className="bg-orange-50 rounded-xl px-3 py-1.5 mb-3 flex items-center gap-1.5">
          <span className="text-orange-500">&#128680;</span>
          <span className="text-orange-600 font-bold text-sm">Emergency Request</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600
                          flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">{workerName[0]?.toUpperCase() || "W"}</span>
          </div>
          <div>
            <p className="font-bold text-gray-800">{workerName}</p>
            {workType && <p className="text-xs text-gray-400 mt-0.5">{workType}</p>}
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.pill}`}>
          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Tile label="Work Date">{job.date || formatDate(job.createdAt)}</Tile>
        <Tile label="Wage" highlight>Rs.{job.offeredWage}/day</Tile>
        <Tile label="Workers">{job.workersNeeded || 1}</Tile>
        <Tile label="Sent On">{formatDate(job.createdAt)}</Tile>
      </div>

      {job.workDescription && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5 mb-3 leading-relaxed">
          {job.workDescription}
        </p>
      )}

      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        <p className="text-xs text-green-700 font-medium">
          No commission — Rs.{job.offeredWage}/day paid directly
        </p>
      </div>

      {workerPhone && (
        <a href={`tel:${workerPhone}`}
          className="flex items-center justify-center gap-2 w-full bg-gray-100
                     text-gray-700 rounded-xl py-2.5 text-sm font-semibold mb-2
                     hover:bg-gray-200 transition-colors active:scale-95">
          <Phone className="w-4 h-4" /> Call Worker: {workerPhone}
        </a>
      )}

      {job.status === "accepted" && (
        <Button variant="primary" size="sm"
          loading={acting === job.id} disabled={!!acting}
          onClick={() => onMarkComplete(job.id)} className="w-full mb-2">
          <CheckCircle className="w-4 h-4" /> Mark as Completed
        </Button>
      )}

      {job.status === "completed" && (
        <Button variant="secondary" size="sm" onClick={() => onRate(job)} className="w-full">
          <Star className="w-4 h-4" /> Rate Worker
        </Button>
      )}
    </Card>
  );
}

// ─── Shared small components ─────────────────────────────────────────────────
function Tile({ label, children, highlight = false, className = "" }) {
  return (
    <div className={`rounded-xl p-2.5 ${highlight ? "bg-green-50" : "bg-gray-50"} ${className}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-semibold text-sm mt-0.5 ${highlight ? "text-green-700 font-bold text-base" : "text-gray-800"}`}>
        {children}
      </p>
    </div>
  );
}

function Pill({ count, label, color }) {
  const colors = {
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    green:  "bg-green-50  border-green-200  text-green-700",
    blue:   "bg-blue-50   border-blue-200   text-blue-700",
    red:    "bg-red-50    border-red-200    text-red-600",
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colors[color] || colors.yellow}`}>
      {count} {label}
    </span>
  );
}