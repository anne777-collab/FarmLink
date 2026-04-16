// src/pages/worker/WorkerRequests.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Phone, CheckCircle, XCircle } from "lucide-react";
import {
  getWorkerRequestsRealtime,
  updateRequestStatus,
} from "../../firebase/firestore";
import { Card, StatusBadge, Button, Spinner, EmptyState } from "../../components/UI";
import { formatDate, WORK_TYPE_MAP } from "../../utils/helpers";
import toast from "react-hot-toast";

// WorkerRequests receives workerId as a prop from WorkerDashboard.
// This avoids calling useAuth() here and lets WorkerDashboard own the guard.
export default function WorkerRequests({ workerId, onStatsChange }) {
  const [jobs,     setJobs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [acting,   setActing]   = useState(null); // "jobId+action"

  const firstSnap = useRef(false);
  // Stable ref to onStatsChange to avoid re-subscribing when parent re-renders
  const statsRef  = useRef(onStatsChange);
  useEffect(() => { statsRef.current = onStatsChange; }, [onStatsChange]);

  // ── Real-time listener ─────────────────────────────────────────────────────
  useEffect(() => {
    // Do not subscribe until we have a real workerId
    if (!workerId) {
      setLoading(false);
      return;
    }

    firstSnap.current = false;
    setLoading(true);
    setError(null);

    const unsub = getWorkerRequestsRealtime(
      workerId,
      (data) => {
        setJobs(data);
        setError(null);

        statsRef.current?.({
          totalRequests: data.length,
          pending:       data.filter((j) => j.status === "pending").length,
          accepted:      data.filter((j) => j.status === "accepted").length,
          completed:     data.filter((j) => j.status === "completed").length,
        });

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
          : "Could not load requests. Check your connection.";
        setError(msg);
        setLoading(false);
        console.error("[WorkerRequests] listener:", err);
      }
    );

    return () => unsub();
  }, [workerId]); // only re-subscribe when workerId changes

  // ── Accept / Reject ────────────────────────────────────────────────────────
  const handleAction = useCallback(async (jobId, action) => {
    setActing(jobId + action);
    try {
      await updateRequestStatus(jobId, action);
      // onSnapshot delivers the updated doc automatically — no manual setJobs needed
      toast.success(action === "accepted" ? "Job accepted!" : "Request rejected.");
    } catch (err) {
      toast.error("Failed to update. Please try again.");
      console.error("[WorkerRequests] handleAction:", err);
    } finally {
      setActing(null);
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
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
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-gray-800">Job Requests</h1>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
            Live updates
          </p>
        </div>
        {jobs.filter((j) => j.status === "pending").length > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {jobs.filter((j) => j.status === "pending").length} pending
          </span>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && jobs.length === 0 && (
        <EmptyState
          icon="&#128229;"
          title="No job requests yet"
          subtitle="Keep your availability ON so farmers can find you"
        />
      )}

      {/* Job cards */}
      {jobs.map((job) => (
        <WorkerJobCard
          key={job.id}
          job={job}
          acting={acting}
          onAction={handleAction}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB CARD
// ─────────────────────────────────────────────────────────────────────────────
function WorkerJobCard({ job, acting, onAction }) {
  const farmerName    = job.farmer?.name             || "Farmer";
  const farmerAddress = job.farmer?.location?.address || "";
  const farmerPhone   = job.farmer?.phone             || "";
  const workTypeLabel = WORK_TYPE_MAP[job.workType]  || job.workType || "";
  const isActing      = !!acting;

  return (
    <Card className="mb-3 overflow-hidden">
      {/* Status strip */}
      <div className={`h-1 -mx-4 -mt-4 mb-4 ${
        job.status === "accepted"  ? "bg-green-400" :
        job.status === "rejected"  ? "bg-red-400"   :
        job.status === "completed" ? "bg-blue-400"  : "bg-yellow-400"
      }`} />

      {job.emergency && (
        <div className="bg-orange-50 rounded-xl px-3 py-1.5 mb-3 flex items-center gap-1.5">
          <span className="text-orange-500">&#128680;</span>
          <span className="text-orange-600 font-bold text-sm">Emergency Request</span>
        </div>
      )}

      {/* Farmer info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600
                          flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {farmerName[0]?.toUpperCase() || "F"}
            </span>
          </div>
          <div>
            <p className="font-bold text-gray-800">{farmerName}</p>
            {farmerAddress && (
              <p className="text-xs text-gray-400 mt-0.5">&#128205; {farmerAddress}</p>
            )}
          </div>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Tile label="Offered Wage" highlight>Rs.{job.offeredWage}/day</Tile>
        <Tile label="Work Date">{job.date || "TBD"}</Tile>
        {workTypeLabel && <Tile label="Work Type" className="col-span-2">{workTypeLabel}</Tile>}
        <Tile label="Workers Needed">{job.workersNeeded || 1}</Tile>
        <Tile label="Received">{formatDate(job.createdAt)}</Tile>
      </div>

      {job.workDescription && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5 mb-3 leading-relaxed">
          {job.workDescription}
        </p>
      )}

      {/* Call farmer */}
      {farmerPhone && (
        <a href={`tel:${farmerPhone}`}
          className="flex items-center justify-center gap-2 w-full bg-blue-50
                     text-blue-600 rounded-xl py-2.5 text-sm font-semibold mb-3
                     hover:bg-blue-100 transition-colors active:scale-95">
          <Phone className="w-4 h-4" />
          Call Farmer: {farmerPhone}
        </a>
      )}

      {/* Accept / Reject */}
      {job.status === "pending" && (
        <div className="flex gap-2">
          <Button variant="danger" size="md" className="flex-1"
            disabled={isActing} loading={acting === job.id + "rejected"}
            onClick={() => onAction(job.id, "rejected")}>
            <XCircle className="w-4 h-4" /> Reject
          </Button>
          <Button variant="primary" size="md" className="flex-1"
            disabled={isActing} loading={acting === job.id + "accepted"}
            onClick={() => onAction(job.id, "accepted")}>
            <CheckCircle className="w-4 h-4" /> Accept
          </Button>
        </div>
      )}

      {job.status === "accepted" && (
        <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2.5">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-green-700 text-sm font-semibold">
            Accepted — Rs.{job.offeredWage}/day
          </p>
        </div>
      )}

      {job.status === "rejected" && (
        <div className="flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2.5">
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-600 text-sm">You rejected this request</p>
        </div>
      )}
    </Card>
  );
}

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